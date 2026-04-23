import { useState, useEffect, useMemo } from "react"
import { supabase } from "./supabaseClient"
import AddItemForm from "./components/AddItemForm"
import SearchBar from "./components/SearchBar"
import FilterBar from "./components/FilterBar"
import InventoryList from "./components/InventoryList"

import BakingTracker from "./components/BakingTracker"

function App() {
    const [items, setItems] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("")
    const [locationFilter, setLocationFilter] = useState("")
    const [editingItem, setEditingItem] = useState(null)
    const [timeTick, setTimeTick] = useState(Date.now())

    useEffect(() => {
        fetchItems()

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
                    fetchItems()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeTick(Date.now())
        }, 30000)

        return () => clearInterval(timer)
    }, [])

    // 1. Update fetchItems to check local storage if database is empty
async function fetchItems() {
    const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("updated_at", { ascending: false });

    if (error || !data || data.length === 0) {
        console.warn("Database unavailable, loading from local storage...");
        const localData = JSON.parse(localStorage.getItem("grub_guide_backup") || "[]");
        setItems(localData);
    } else {
        setItems(data);
    }
}


async function handleAddItem(newItem) {
    const itemWithMeta = { 
        ...newItem, 
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString() 
    };

    
    const newItemsList = [itemWithMeta, ...items];
    setItems(newItemsList);

    
    localStorage.setItem("grub_guide_backup", JSON.stringify(newItemsList));


    await supabase.from("inventory_items").insert([newItem]);
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
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    localStorage.setItem("grub_guide_backup", JSON.stringify(updatedItems));
    const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);

    if (error) {
        console.warn("Database sync failed, but item removed locally for demo.");
    }
}

    function handleEdit(item) {
        setEditingItem(item)
    }

    const filteredItems = useMemo(() => {
        let result = items

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter((item) =>
                item.item_name.toLowerCase().includes(q)
            )
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
        const now = timeTick
        const groupedByName = new Map()

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
                if (now - createdAtMs <= TEN_MINUTES_MS) {
                    ids.add(item.id)
                }
            })
        })

        return ids
    }, [items, timeTick])

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div style={styles.headerTitle}>
                    Grub<span style={styles.headerTitleAccent}>Guide</span>
                </div>
                <div style={styles.subtitle}>Shared Pantry</div>
            </div>
            <div style={styles.body}>
                <AddItemForm
                    onAddItem={handleAddItem}
                    editingItem={editingItem}
                    onUpdateItem={handleUpdateItem}
                    onCancelEdit={() => setEditingItem(null)}
                    existingItems={items}
                />
                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />
                <FilterBar
                    categoryFilter={categoryFilter}
                    locationFilter={locationFilter}
                    onCategoryChange={setCategoryFilter}
                    onLocationChange={setLocationFilter}
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
                        duplicateItemIds={duplicateItemIds}
                    />
                </div>
            </div>
        </div>
    )
}

const styles = {
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
    headerTitleAccent: {
        color: "#4caf78"
    },
    subtitle: {
        fontSize: "11px",
        letterSpacing: "2px",
        textTransform: "uppercase",
        color: "rgba(168,213,181,0.5)",
        marginLeft: "auto"
    },
    body: {
        padding: "24px"
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
    undoBtn: {
        width: "100%",
        padding: "10px",
        marginBottom: "12px",
        backgroundColor: "rgba(232,132,90,0.15)",
        color: "#e8845a",
        border: "0.5px solid rgba(232,132,90,0.3)",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer"
    }
}

export default App
