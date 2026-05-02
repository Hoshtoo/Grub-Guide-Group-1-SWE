import { useState, useEffect, useMemo } from "react"
import { supabase } from "./supabaseClient"
import AddItemForm from "./components/AddItemForm"
import SearchBar from "./components/SearchBar"
import FilterBar from "./components/FilterBar"
import InventoryList from "./components/InventoryList"
import BakingTracker from "./components/BakingTracker"
import BarcodeScanner from "./components/BarcodeScanner"
import AuthForm from "./components/AuthForm"
import UserMenu from "./components/UserMenu"
import HouseholdManager from "./components/HouseholdManager"
import InventoryToggle from "./components/InventoryToggle"

const KROGER_CALCULATOR_URL =
    (import.meta.env.VITE_KROGER_CALCULATOR_URL && String(import.meta.env.VITE_KROGER_CALCULATOR_URL).trim()) ||
    "https://kroger-calculator.onrender.com"

/** PostgREST / schema cache: column not on this project's inventory_items table */
const SCHEMA_UNKNOWN_COL_RE = /Could not find the '([^']+)' column/i

/** Cached: does inventory_items have shared_with_household (required for private rows in Supabase + RLS). */
let inventorySharedColumnProbe

async function inventoryHasSharedWithHouseholdColumn() {
    if (inventorySharedColumnProbe !== undefined) return inventorySharedColumnProbe
    const { error } = await supabase
        .from("inventory_items")
        .select("shared_with_household")
        .limit(1)
        .maybeSingle()
    if (!error) {
        inventorySharedColumnProbe = true
        return true
    }
    const msg = error.message || ""
    if (/shared_with_household|Could not find the 'shared_with_household' column|schema cache/i.test(msg)) {
        inventorySharedColumnProbe = false
        return false
    }
    inventorySharedColumnProbe = true
    return true
}

function resetInventorySharedColumnProbe() {
    inventorySharedColumnProbe = undefined
}

/** When `shared_with_household` is missing on rows, split My Items vs Household using this set (per device). */
function loadPrivacyItemIdSet(userId) {
    if (!userId) return new Set()
    try {
        const raw = localStorage.getItem(`grub_guide_personal_item_ids_v1_${userId}`)
        const arr = raw ? JSON.parse(raw) : []
        return new Set((Array.isArray(arr) ? arr : []).map(String))
    } catch {
        return new Set()
    }
}

function savePrivacyItemIdSet(userId, set) {
    if (!userId) return
    localStorage.setItem(`grub_guide_personal_item_ids_v1_${userId}`, JSON.stringify([...set]))
}

function markPrivacyItemPersonal(userId, itemId) {
    const s = loadPrivacyItemIdSet(userId)
    s.add(String(itemId))
    savePrivacyItemIdSet(userId, s)
}

function markPrivacyItemShared(userId, itemId) {
    const s = loadPrivacyItemIdSet(userId)
    s.delete(String(itemId))
    savePrivacyItemIdSet(userId, s)
}

async function insertInventoryRow(payloadIn) {
    let p = { ...payloadIn }
    let lastErr = null
    for (let i = 0; i < 32; i++) {
        const { error } = await supabase.from("inventory_items").insert([p])
        if (!error) return { error: null, inserted: { ...p } }
        lastErr = error
        const msg = error.message || ""
        const colMatch = msg.match(SCHEMA_UNKNOWN_COL_RE)
        if (colMatch) {
            delete p[colMatch[1]]
            continue
        }
        if (/uuid|invalid input syntax/i.test(msg)) {
            if (typeof crypto !== "undefined" && crypto.randomUUID) p.id = crypto.randomUUID()
            continue
        }
        return { error, inserted: null }
    }
    return { error: lastErr, inserted: null }
}

async function updateInventoryRow(id, fieldsIn) {
    let f = { ...fieldsIn }
    let lastErr = null
    for (let i = 0; i < 32; i++) {
        const { error } = await supabase.from("inventory_items").update(f).eq("id", id)
        if (!error) return { error: null }
        lastErr = error
        const msg = error.message || ""
        const colMatch = msg.match(SCHEMA_UNKNOWN_COL_RE)
        if (colMatch) {
            delete f[colMatch[1]]
            continue
        }
        return { error }
    }
    return { error: lastErr }
}

function App() {
    const [items, setItems] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("")
    const [locationFilter, setLocationFilter] = useState("")
    const [editingItem, setEditingItem] = useState(null)
    const [isScanning, setIsScanning] = useState(false)
    const [timeTick, setTimeTick] = useState(() => Date.now())

    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

    const [household, setHousehold] = useState(null)
    const [householdMembers, setHouseholdMembers] = useState([])
    const [showHouseholdManager, setShowHouseholdManager] = useState(false)
    const [inventoryMessage, setInventoryMessage] = useState(null)
    // Default to shared pantry when user belongs to a household (personal is opt-in per toggle).
    const [viewMode, setViewMode] = useState("household")

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setAuthLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                if (!session) {
                    resetInventorySharedColumnProbe()
                    setProfile(null)
                    setHousehold(null)
                    setHouseholdMembers([])
                    setItems([])
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (user) {
            fetchProfile()
            fetchHousehold()
        }
    }, [user])

    useEffect(() => {
        if (user) {
            fetchItems()
        }

        const channel = supabase
            .channel("realtime-inventory")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "inventory_items"
                },
                () => {
                    if (user) fetchItems()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, viewMode, household, householdMembers])

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeTick(Date.now())
        }, 30000)
        return () => clearInterval(timer)
    }, [])

    async function fetchProfile() {
        if (!user) return

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

        if (!error && data) {
            setProfile(data)
        }
    }

    async function fetchHousehold() {
        if (!user) return

        const { data: memberData, error: memberError } = await supabase
            .from("household_members")
            .select("household_id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !memberData) {
            setHousehold(null)
            setHouseholdMembers([])
            return
        }

        const { data: householdData, error: householdError } = await supabase
            .from("households")
            .select("*")
            .eq("id", memberData.household_id)
            .single()

        if (!householdError && householdData) {
            setHousehold(householdData)

            const { data: members } = await supabase
                .from("household_members")
                .select("*, profiles(username)")
                .eq("household_id", householdData.id)

            setHouseholdMembers(members || [])
        }
    }

    /** @param {"personal"|"household"|undefined} [overrideView] Use after add/update so fetch matches intent before React applies setViewMode. */
    async function fetchItems(overrideView) {
        if (!user) return

        const mode = overrideView ?? viewMode

        // State can lag right after login: second household member would otherwise hit the
        // non-household branch for both tabs and see the same "my rows only" list.
        let resolvedHousehold = household
        let memberIds = householdMembers.map((m) => m.user_id)

        if (!resolvedHousehold || memberIds.length === 0) {
            const { data: m0 } = await supabase
                .from("household_members")
                .select("household_id")
                .eq("user_id", user.id)
                .maybeSingle()

            if (m0?.household_id) {
                const { data: hhRow, error: hhErr } = await supabase
                    .from("households")
                    .select("*")
                    .eq("id", m0.household_id)
                    .single()
                const { data: memRows } = await supabase
                    .from("household_members")
                    .select("user_id")
                    .eq("household_id", m0.household_id)

                if (!hhErr && hhRow) resolvedHousehold = hhRow
                memberIds = (memRows || []).map((r) => r.user_id)
            }
        }

        if (resolvedHousehold && (!household || householdMembers.length === 0)) {
            void fetchHousehold()
        }

        const applyFilters = (q, useSharedColumn) => {
            if (mode === "personal") {
                q = q.eq("user_id", user.id)
                if (useSharedColumn) q = q.eq("shared_with_household", false)
            } else if (mode === "household" && resolvedHousehold) {
                if (memberIds.length > 0) {
                    q = q.in("user_id", memberIds)
                    if (useSharedColumn) q = q.eq("shared_with_household", true)
                } else {
                    q = q.eq("user_id", user.id)
                    if (useSharedColumn) q = q.eq("shared_with_household", true)
                }
            } else {
                q = q.eq("user_id", user.id)
            }
            return q
        }

        const runQuery = async (useSharedColumn, orderColumn) => {
            let q = supabase.from("inventory_items").select("*")
            q = applyFilters(q, useSharedColumn)
            if (orderColumn === "created_at") {
                q = q.order("created_at", { ascending: false })
            } else if (orderColumn === "updated_at") {
                q = q.order("updated_at", { ascending: false })
            }
            return q
        }

        let { data, error } = await runQuery(true, "created_at")

        if (error) {
            console.warn("fetchItems (created_at + shared filter):", error.message)
            ;({ data, error } = await runQuery(true, null))
        }
        if (error) {
            console.warn("fetchItems (no order + shared filter):", error.message)
            ;({ data, error } = await runQuery(true, "updated_at"))
        }
        if (error) {
            console.warn("fetchItems (updated_at + shared filter):", error.message)
            ;({ data, error } = await runQuery(false, null))
        }

        if (error) {
            console.warn("fetchItems:", error.message)
            setInventoryMessage(`Could not load inventory: ${error.message}`)
            if (mode === "personal") {
                const localKey = `grub_guide_backup_${user.id}`
                setItems(JSON.parse(localStorage.getItem(localKey) || "[]"))
            } else {
                setItems([])
            }
            return
        }

        setInventoryMessage(null)
        let rows = data || []

        // Household tab: only explicitly shared rows when the column is present on any row.
        if (
            mode === "household" &&
            resolvedHousehold &&
            rows.length > 0 &&
            rows.some((r) => typeof r.shared_with_household === "boolean")
        ) {
            rows = rows.filter((r) => r.shared_with_household === true)
        }

        if (resolvedHousehold && rows.length > 0) {
            const hasBoolShared = rows.some(
                (r) => r.shared_with_household === true || r.shared_with_household === false
            )
            if (hasBoolShared) {
                let priv = loadPrivacyItemIdSet(user.id)
                let privDirty = false
                for (const r of rows) {
                    if (r.shared_with_household === true && priv.has(String(r.id))) {
                        priv.delete(String(r.id))
                        privDirty = true
                    }
                }
                if (privDirty) savePrivacyItemIdSet(user.id, priv)

                if (mode === "personal") {
                    rows = rows.filter((r) => r.shared_with_household === false)
                } else if (mode === "household") {
                    rows = rows.filter((r) => r.shared_with_household === true)
                }
            } else {
                const priv = loadPrivacyItemIdSet(user.id)
                if (mode === "personal") {
                    rows = rows.filter(
                        (r) => String(r.user_id) === String(user.id) && priv.has(String(r.id))
                    )
                } else if (mode === "household") {
                    rows = rows.filter(
                        (r) => !(String(r.user_id) === String(user.id) && priv.has(String(r.id)))
                    )
                }
            }
        }

        setItems(rows)
        if (mode === "personal") {
            const localKey = `grub_guide_backup_${user.id}`
            localStorage.setItem(localKey, JSON.stringify(rows))
        }
    }

    async function handleAddItem(newItem) {
        if (!user?.id) return

        const shared =
            newItem.shared_with_household === undefined
                ? Boolean(household)
                : Boolean(newItem.shared_with_household)

        const now = new Date().toISOString()
        let id = Math.random().toString(36).substring(2, 11)

        let insertPayload = {
            id,
            item_name: newItem.item_name,
            quantity: Number(newItem.quantity) || 1,
            unit: (newItem.unit ?? "").trim(),
            category: newItem.category || "Other",
            location: newItem.location || "Pantry",
            household_tag: newItem.household_tag ?? null,
            expiration_date: newItem.expiration_date ?? null,
            user_id: user.id,
            shared_with_household: shared,
            created_at: now,
            last_used_at: now,
            times_used: 0
        }
        if (newItem.brand_name != null && newItem.brand_name !== "") {
            insertPayload.brand_name = newItem.brand_name
        }
        if (newItem.shelf_life != null && newItem.shelf_life !== "") {
            insertPayload.shelf_life = Number(newItem.shelf_life) || 14
        }

        if (household && !shared) {
            const colOk = await inventoryHasSharedWithHouseholdColumn()
            if (!colOk) {
                setInventoryMessage(
                    "My list only cannot be saved to the database until Supabase has a shared_with_household column and household RLS (otherwise every household member can see the row). Update your Supabase schema and policies, then refresh this page."
                )
                return
            }
        }

        const { error: insertError, inserted } = await insertInventoryRow(insertPayload)

        if (insertError) {
            console.error("Insert inventory failed:", insertError)
            setInventoryMessage(`Could not save item: ${insertError.message}`)
            await fetchItems()
            return
        }

        setInventoryMessage(null)

        if (household && inserted?.id) {
            if (shared) markPrivacyItemShared(user.id, String(inserted.id))
            else markPrivacyItemPersonal(user.id, String(inserted.id))
        }

        if (household) {
            if (shared) {
                setViewMode("household")
                await fetchItems("household")
            } else {
                setViewMode("personal")
                await fetchItems("personal")
            }
        } else {
            await fetchItems()
        }
    }

    async function handleUpdateItem(id, updatedFields) {
        if (household && updatedFields.shared_with_household === false) {
            const colOk = await inventoryHasSharedWithHouseholdColumn()
            if (!colOk) {
                setInventoryMessage(
                    "Saving as My list only needs the shared_with_household column in Supabase. Add it in the dashboard or SQL editor, then refresh."
                )
                return
            }
        }

        const { error } = await updateInventoryRow(id, updatedFields)

        if (error) {
            console.error("Error updating item:", error)
            return
        }

        if (household && updatedFields.shared_with_household != null) {
            if (updatedFields.shared_with_household) markPrivacyItemShared(user.id, String(id))
            else markPrivacyItemPersonal(user.id, String(id))
        }

        if (household && updatedFields.shared_with_household === true) {
            setViewMode("household")
            setEditingItem(null)
            await fetchItems("household")
            return
        }
        if (household && updatedFields.shared_with_household === false) {
            setViewMode("personal")
            setEditingItem(null)
            await fetchItems("personal")
            return
        }

        setEditingItem(null)
        await fetchItems()
    }

    async function handleDelete(id) {
        if (user) markPrivacyItemShared(user.id, String(id))

        const updatedItems = items.filter((item) => item.id !== id)
        setItems(updatedItems)
        
        const localKey = user ? `grub_guide_backup_${user.id}` : "grub_guide_backup"
        localStorage.setItem(localKey, JSON.stringify(updatedItems))

        const { error } = await supabase
            .from("inventory_items")
            .delete()
            .eq("id", id)

        if (error) {
            console.warn("Database sync failed, but item removed locally.")
        }
    }

    function handleEdit(item) {
        setEditingItem(item)
    }

    function handleAddToShoppingList(item) {
        const list = JSON.parse(localStorage.getItem("grub_guide_shopping_list") || "[]")
        localStorage.setItem("grub_guide_shopping_list", JSON.stringify([item, ...list]))
        alert(`${item.item_name} added to shopping list`)
    }

    async function handleBarcodeScan(decodedText) {
        if (!isScanning) return
        setIsScanning(false)

        const cleanCode = decodedText.trim()

        try {
            const { data: sbData } = await supabase
                .from("inventory_master")
                .select("*")
                .like("gtin_upc", `%${cleanCode}`)
                .maybeSingle()

            if (sbData) {
                handleAddItem({
                    item_name: sbData.brand_name || "Unknown Product",
                    brand_name: sbData.brand_name || "Generic",
                    category: sbData.branded_food_category || "Pantry",
                    shelf_life: sbData.Shelf_Life || 14,
                    location: "Pantry"
                })
                return
            }

            const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`)
            const offData = await offResponse.json()

            if (offData.status === 1) {
                const p = offData.product
                const fullName = p.brands ? `${p.brands} ${p.product_name}` : p.product_name
                handleAddItem({
                    item_name: fullName || "New Product",
                    brand_name: p.brands || "Generic",
                    category: p.categories?.split(",")[0] || "Pantry",
                    shelf_life: 14,
                    location: "Pantry"
                })
            } else {
                alert(`Product ${cleanCode} not found. Add manually.`)
            }
        } catch (err) {
            console.error("Barcode scanner error:", err)
        }
    }

    const rarelyUsedItems = useMemo(() => {
        return items.filter((item) => {
            if (!item.last_used_at) return false
            const lastUsed = new Date(item.last_used_at)
            const daysSinceUse = (new Date() - lastUsed) / (1000 * 60 * 60 * 24)
            return daysSinceUse > 14
        })
    }, [items])

    const filteredItems = useMemo(() => {
        let result = items

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter((item) => item.item_name?.toLowerCase().includes(q))
        }
        if (categoryFilter) {
            result = result.filter((item) => item.category === categoryFilter)
        }
        if (locationFilter) {
            result = result.filter((item) => item.location === locationFilter)
        }

        return result
    }, [items, searchQuery, categoryFilter, locationFilter])

    const duplicateItemIds = useMemo(() => {
        const TEN_MINUTES_MS = 10 * 60 * 1000
        const groupedByName = new Map()
        const now = timeTick

        items.forEach((item) => {
            const key = (item.item_name || "").trim().toLowerCase()
            if (!key) return
            if (!groupedByName.has(key)) groupedByName.set(key, [])
            groupedByName.get(key).push(item)
        })

        const ids = new Set()
        groupedByName.forEach((group) => {
            if (group.length < 2) return
            group.forEach((item) => {
                const createdAtMs = new Date(item.created_at).getTime()
                if (Number.isNaN(createdAtMs)) return
                if (now - createdAtMs <= TEN_MINUTES_MS) ids.add(item.id)
            })
        })

        return ids
    }, [items, timeTick])

    if (authLoading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingText}>Loading...</div>
            </div>
        )
    }

    if (!session) {
        return <AuthForm onAuthSuccess={() => {}} />
    }

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <a href="/" style={styles.headerTitleLink}>
                    Grub<span style={styles.headerTitleAccent}>Guide</span>
                </a>
                <a
                    href={KROGER_CALCULATOR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.krogerTab}
                >
                    Kroger Calculator
                </a>
                <div style={styles.headerMeta}>
                    <UserMenu
                        user={user}
                        profile={profile}
                        onOpenHousehold={() => setShowHouseholdManager(true)}
                    />
                </div>
            </div>

            {showHouseholdManager && (
                <HouseholdManager
                    user={user}
                    household={household}
                    members={householdMembers}
                    onClose={() => setShowHouseholdManager(false)}
                    onHouseholdChange={() => {
                        fetchHousehold()
                        setShowHouseholdManager(false)
                    }}
                />
            )}

            <div style={styles.body}>
                <div style={styles.toolsRow}>
                    <button
                        type="button"
                        onClick={() => setIsScanning(!isScanning)}
                        style={{ ...styles.toolBtn, ...(isScanning ? styles.toolBtnDanger : {}) }}
                    >
                        {isScanning ? "Close Scanner" : "Scan Barcode"}
                    </button>
                </div>

                {isScanning && (
                    <div style={styles.scannerWrap}>
                        <BarcodeScanner onScanSuccess={handleBarcodeScan} />
                    </div>
                )}

                {inventoryMessage && (
                    <div style={styles.inventoryMessage} role="alert">
                        {inventoryMessage}
                    </div>
                )}

                <AddItemForm
                    onAddItem={handleAddItem}
                    editingItem={editingItem}
                    onUpdateItem={handleUpdateItem}
                    onCancelEdit={() => setEditingItem(null)}
                    existingItems={items}
                    hasHousehold={!!household}
                />

                {rarelyUsedItems.length > 0 && (
                    <div style={styles.warningBox}>
                        Review needed: {rarelyUsedItems.length} item(s) have not been used in over 2 weeks.
                    </div>
                )}

                <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
                <FilterBar
                    categoryFilter={categoryFilter}
                    locationFilter={locationFilter}
                    onCategoryChange={setCategoryFilter}
                    onLocationChange={setLocationFilter}
                />

                <InventoryToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    hasHousehold={!!household}
                />

                <div style={styles.listContainer}>
                    <div style={styles.listHeader}>
                        <div style={styles.listTitle}>Pantry</div>
                        <div style={styles.itemCount}>{filteredItems.length} items</div>
                    </div>
                    <InventoryList
                        items={filteredItems}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onAddToList={handleAddToShoppingList}
                        duplicateItemIds={duplicateItemIds}
                    />
                </div>

                <div style={styles.bakingSection}>
                    <BakingTracker supabaseItems={items} />
                </div>
            </div>
        </div>
    )
}

const styles = {
    loadingContainer: {
        minHeight: "100vh",
        backgroundColor: "#0f1a14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    loadingText: {
        color: "rgba(232,240,234,0.5)",
        fontSize: "14px"
    },
    page: {
        minHeight: "100vh",
        backgroundColor: "#0f1a14",
        padding: "0 0 40px 0",
        maxWidth: "480px",
        margin: "0 auto"
    },
    header: {
        padding: "24px 20px 18px",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        columnGap: "10px"
    },
    headerTitle: {
        fontFamily: "'DM Serif Display', serif",
        fontSize: "22px",
        color: "#a8d5b5",
        letterSpacing: "-0.3px"
    },
    headerTitleLink: {
        fontFamily: "'DM Serif Display', serif",
        fontSize: "22px",
        color: "#a8d5b5",
        letterSpacing: "-0.3px",
        textDecoration: "none",
        justifySelf: "start"
    },
    headerTitleAccent: {
        color: "#4caf78"
    },
    headerMeta: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "8px",
        justifySelf: "end"
    },
    krogerTab: {
        display: "block",
        justifySelf: "center",
        textAlign: "center",
        color: "rgba(168,213,181,0.72)",
        textDecoration: "none",
        fontWeight: "600",
        fontSize: "11px",
        letterSpacing: "1.25px",
        textTransform: "uppercase",
        lineHeight: 1.4,
        whiteSpace: "nowrap"
    },
    body: {
        padding: "24px"
    },
    toolsRow: {
        display: "flex",
        gap: "10px",
        marginBottom: "14px"
    },
    inventoryMessage: {
        marginBottom: "12px",
        padding: "10px 12px",
        borderRadius: "8px",
        fontSize: "13px",
        lineHeight: 1.45,
        color: "#f1a16d",
        backgroundColor: "rgba(232,132,90,0.12)",
        border: "0.5px solid rgba(232,132,90,0.35)"
    },
    toolBtn: {
        padding: "12px 20px",
        border: "0.5px solid rgba(76,175,120,0.35)",
        backgroundColor: "rgba(76,175,120,0.14)",
        color: "#9be1b7",
        borderRadius: "8px",
        fontWeight: "600",
        cursor: "pointer"
    },
    toolBtnDanger: {
        border: "0.5px solid rgba(232,132,90,0.35)",
        backgroundColor: "rgba(232,132,90,0.16)",
        color: "#e8845a"
    },
    scannerWrap: {
        borderRadius: "12px",
        overflow: "hidden",
        border: "0.5px solid rgba(76,175,120,0.35)",
        marginBottom: "14px"
    },
    warningBox: {
        marginBottom: "12px",
        padding: "10px",
        backgroundColor: "rgba(244,162,97,0.1)",
        color: "#f4a261",
        borderRadius: "8px",
        border: "0.5px solid rgba(244,162,97,0.3)",
        fontSize: "13px"
    },
    listContainer: {
        marginTop: "0"
    },
    listHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "14px"
    },
    listTitle: {
        fontSize: "10px",
        letterSpacing: "2.5px",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.3)"
    },
    itemCount: {
        fontSize: "11px",
        background: "rgba(76,175,120,0.15)",
        color: "#4caf78",
        padding: "3px 10px",
        borderRadius: "20px",
        border: "0.5px solid rgba(76,175,120,0.3)"
    },
    bakingSection: {
        marginTop: "24px",
        borderTop: "0.5px solid rgba(255,255,255,0.1)",
        paddingTop: "20px"
    }
}

export default App
