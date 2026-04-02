import { useState } from "react"

function AddItemForm({ onAddItem }) {
    const [itemName, setItemName] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [unit, setUnit] = useState("")
    const [expirationDate, setExpirationDate] = useState("")

    function handleSubmit(e) {
        e.preventDefault()
        if (!itemName) return

        onAddItem({
            item_name: itemName,
            quantity: quantity,
            unit: unit,
            expiration_date: expirationDate
        })

        // Clear the form after submitting
        setItemName("")
        setQuantity(1)
        setUnit("")
        setExpirationDate("")
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Add Grocery Item</h2>

            <div style={styles.inputGroup}>
                <label style={styles.label}>Item Name *</label>
                <input
                    style={styles.input}
                    type="text"
                    placeholder="e.g. Milk"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                />
            </div>

            <div style={styles.inputGroup}>
                <label style={styles.label}>Quantity</label>
                <input
                    style={styles.input}
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />
            </div>

            <div style={styles.inputGroup}>
                <label style={styles.label}>Unit (optional)</label>
                <input
                    style={styles.input}
                    type="text"
                    placeholder="e.g. gallons, oz, bags"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                />
            </div>

            <div style={styles.inputGroup}>
                <label style={styles.label}>Expiration Date (optional)</label>
                <input
                    style={styles.input}
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                />
            </div>

            <button style={styles.button} onClick={handleSubmit}>
                + Add Item
            </button>
        </div>
    )
}

const styles = {
    container: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "20px",
        maxWidth: "400px",
        margin: "0 auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    },
    title: {
        fontSize: "20px",
        marginBottom: "16px",
        color: "#2d6a4f"
    },
    inputGroup: {
        marginBottom: "14px"
    },
    label: {
        display: "block",
        fontSize: "14px",
        marginBottom: "4px",
        color: "#555"
    },
    input: {
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "16px",
        boxSizing: "border-box"
    },
    button: {
        width: "100%",
        padding: "12px",
        backgroundColor: "#2d6a4f",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
        marginTop: "8px"
    }
}

export default AddItemForm