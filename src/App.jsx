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

function App() {
    const [items, setItems] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("")
    const [locationFilter, setLocationFilter] = useState("")
    const [editingItem, setEditingItem] = useState(null)
    const [isScanning, setIsScanning] = useState(false)
    const [timeTick, setTimeTick] = useState(Date.now())

    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

    const [household, setHousehold] = useState(null)
    const [householdMembers, setHouseholdMembers] = useState([])
    const [showHouseholdManager, setShowHouseholdManager] = useState(false)
    const [viewMode, setViewMode] = useState("personal")

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
    }, [user, viewMode, household])

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

    async function fetchItems() {
        if (!user) return

        let query = supabase
            .from("inventory_items")
            .select("*, profiles(username)")
            .order("updated_at", { ascending: false })

        if (viewMode === "personal") {
            query = query.eq("user_id", user.id)
        } else if (viewMode === "household" && household) {
            const memberIds = householdMembers.map(m => m.user_id)
            if (memberIds.length > 0) {
                query = query.in("user_id", memberIds)
            } else {
                query = query.eq("user_id", user.id)
            }
        } else {
            query = query.eq("user_id", user.id)
        }

        const { data, error } = await query

        if (error || !data || data.length === 0) {
            const localKey = `grub_guide_backup_${user.id}`
            const localData = JSON.parse(localStorage.getItem(localKey) || "[]")
            setItems(localData)
        } else {
            setItems(data)
        }
    }

    async function handleAddItem(newItem) {
        const itemWithMeta = {
            ...newItem,
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
            times_used: 0,
            user_id: user?.id
        }

        const newItemsList = [itemWithMeta, ...items]
        setItems(newItemsList)
        
        const localKey = user ? `grub_guide_backup_${user.id}` : "grub_guide_backup"
        localStorage.setItem(localKey, JSON.stringify(newItemsList))

        await supabase.from("inventory_items").insert([itemWithMeta])
    }

    async function handleUpdateItem(id, updatedFields) {
        const { error } = await supabase
            .from("inventory_items")
            .update(updatedFields)
            .eq("id", id)

        if (error) {
            console.error("Error updating item:", error)
        }
        setEditingItem(null)
    }

    async function handleDelete(id) {
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

    function handleReceiptUpload() {
        alert("Simulating receipt scan...")
        setTimeout(() => {
            handleAddItem({
                item_name: "Kroger Large Eggs (12ct)",
                category: "Dairy",
                location: "Fridge",
                shelf_life: 21,
                brand_name: "Kroger"
            })
            alert("Receipt processed: Kroger Large Eggs")
        }, 1200)
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
                <div style={styles.headerMeta}>
                    <a
                        href="https://kroger-calculator.onrender.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.krogerTab}
                    >
                        Kroger Calculator
                    </a>
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
                        onClick={() => setIsScanning(!isScanning)}
                        style={{ ...styles.toolBtn, ...(isScanning ? styles.toolBtnDanger : {}) }}
                    >
                        {isScanning ? "Close Scanner" : "Scan Barcode"}
                    </button>
                    <button onClick={handleReceiptUpload} style={styles.toolBtnSecondary}>
                        Upload Receipt
                    </button>
                </div>

                {isScanning && (
                    <div style={styles.scannerWrap}>
                        <BarcodeScanner onScanSuccess={handleBarcodeScan} />
                    </div>
                )}

                <AddItemForm
                    onAddItem={handleAddItem}
                    editingItem={editingItem}
                    onUpdateItem={handleUpdateItem}
                    onCancelEdit={() => setEditingItem(null)}
                    existingItems={items}
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
        padding: "28px 24px 20px",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: "10px"
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
        textDecoration: "none"
    },
    headerTitleAccent: {
        color: "#4caf78"
    },
    headerMeta: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    krogerTab: {
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        color: "rgba(168,213,181,0.5)",
        padding: "0",
        borderRadius: "0",
        textDecoration: "none",
        fontWeight: "600",
        fontSize: "11px",
        letterSpacing: "2px",
        textTransform: "uppercase"
    },
    body: {
        padding: "24px"
    },
    toolsRow: {
        display: "flex",
        gap: "10px",
        marginBottom: "14px"
    },
    toolBtn: {
        flex: 1,
        padding: "12px",
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
    toolBtnSecondary: {
        flex: 1,
        padding: "12px",
        border: "0.5px solid rgba(127,177,220,0.35)",
        backgroundColor: "rgba(127,177,220,0.14)",
        color: "#b9d6ee",
        borderRadius: "8px",
        fontWeight: "600",
        cursor: "pointer"
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
