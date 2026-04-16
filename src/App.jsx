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

    return (
        <div style={styles.page}>
            <header style={styles.headerSection}>
                <h1 style={styles.header}>Grub Guide</h1>
                <p style={styles.subtitle}>Shared Household Inventory</p>
            </header>

            <AddItemForm
                onAddItem={handleAddItem}
                editingItem={editingItem}
                onUpdateItem={handleUpdateItem}
                onCancelEdit={() => setEditingItem(null)}
                existingItems={items}
            />

            <div style={styles.dashboardSection}>
                <h3 style={styles.dashboardTitle}>Inventory Dashboard</h3>

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

                <InventoryList
                    items={filteredItems}
                    onDelete={handleDelete}
                    onEdit={setEditingItem}
                />
            </div>
           
            <div style={styles.bakingSection}>
                <BakingTracker supabaseItems={items} />
            </div>
        </div>
    )
}

const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#f0f7f4",
        padding: "20px 16px 40px"
    },
    headerSection: {
        textAlign: "center",
        marginBottom: "24px"
    },
    header: {
        color: "#1b4332",
        fontSize: "32px",
        marginBottom: "4px",
        fontWeight: "700",
        margin: "0 0 4px"
    },
    subtitle: {
        textAlign: "center",
        color: "#555",
        margin: "0 0 8px",
        fontSize: "15px"
    },
    dashboardSection: {
        maxWidth: "600px",
        margin: "28px auto 0"
    },
    dashboardTitle: {
        color: "#2d6a4f",
        marginBottom: "8px",
        fontSize: "20px",
        fontWeight: "600",
        margin: "0 0 8px"
    },

    bakingSection: { maxWidth: "600px",
         margin: "40px auto 0", 
         borderTop: "2px solid #b7e4c7", 
         paddingTop: "20px" }
}

export default App
