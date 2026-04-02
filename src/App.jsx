import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"
import AddItemForm from "./components/AddItemForm"
import InventoryList from "./components/InventoryList"

function App() {
  const [items, setItems] = useState([])

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
            (payload) => {
              console.log("Realtime event received:", payload)
              fetchItems()
            }
        )
        .subscribe((status) => {
          console.log("Realtime subscription status:", status)
        })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchItems() {
    const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching items:", error)
    } else {
      console.log("Fetched items:", data)
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

  async function handleDelete(id) {
    const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id)

    if (error) {
      console.error("Error deleting item:", error)
    }
  }

  return (
      <div style={styles.page}>
        <h1 style={styles.header}>🥦 Grub Guide</h1>
        <p style={styles.subtitle}>Shared Household Inventory</p>
        <AddItemForm onAddItem={handleAddItem} />
        <div style={styles.listContainer}>
          <h3 style={styles.listTitle}>Current Pantry</h3>
          <InventoryList items={items} onDelete={handleDelete} />
        </div>
      </div>
  )
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f0f7f4", padding: "20px" },
  header: { textAlign: "center", color: "#1b4332", fontSize: "28px", marginBottom: "4px" },
  subtitle: { textAlign: "center", color: "#555", marginBottom: "24px" },
  listContainer: { maxWidth: "400px", margin: "24px auto 0" },
  listTitle: { color: "#2d6a4f", marginBottom: "12px" }
}

export default App