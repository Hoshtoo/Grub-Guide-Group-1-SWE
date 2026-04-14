import { useState, useEffect, useMemo } from "react"
import { supabase } from "./supabaseClient"
import AddItemForm from "./components/AddItemForm"
import SearchBar from "./components/SearchBar"
import FilterBar from "./components/FilterBar"
import InventoryList from "./components/InventoryList"

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

    async function fetchItems() {
        const { data, error } = await supabase
            .from("inventory_items")
            .select("*")
            .order("updated_at", { ascending: false, nullsFirst: false })

        if (error) {
            console.error("Error fetching items:", error)
        } else {
            setItems(data)
        }
    }

    async function handleAddItem(newItem) {
        const { error } = await supabase
            .from("inventory_items")
            .insert([newItem])

        if (error) {
            console.error("Error adding item:", error)
        }
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
        const { error } = await supabase
            .from("inventory_items")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting item:", error)
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
    }
}

export default App
