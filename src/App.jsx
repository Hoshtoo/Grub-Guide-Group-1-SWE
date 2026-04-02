import { useState } from "react"
import AddItemForm from "./components/AddItemForm"
import InventoryList from "./components/InventoryList"

function App() {
  const [items, setItems] = useState([])

  function handleAddItem(newItem) {
    const itemWithId = { ...newItem, id: Date.now() }
    setItems([...items, itemWithId])
  }

  function handleDelete(id) {
    setItems(items.filter((item) => item.id !== id))
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
  page: {
    minHeight: "100vh",
    backgroundColor: "#f0f7f4",
    padding: "20px"
  },
  header: {
    textAlign: "center",
    color: "#1b4332",
    fontSize: "28px",
    marginBottom: "4px"
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: "24px"
  },
  listContainer: {
    maxWidth: "400px",
    margin: "24px auto 0"
  },
  listTitle: {
    color: "#2d6a4f",
    marginBottom: "12px"
  }
}

export default App