import { useState, useEffect, useMemo } from "react"

const CATEGORIES = [
    "Dairy",
    "Produce",
    "Meat & Seafood",
    "Grains & Bread",
    "Canned Goods",
    "Snacks",
    "Beverages",
    "Condiments & Sauces",
    "Frozen",
    "Other"
]

const LOCATIONS = ["Fridge", "Freezer", "Pantry", "Counter"]

function findDuplicates(name, existingItems, editingItemId) {
    const trimmed = name.trim().toLowerCase()
    if (trimmed.length < 2) return []

    return existingItems.filter((item) => {
        if (editingItemId && item.id === editingItemId) return false
        const existing = item.item_name.toLowerCase()
        return existing === trimmed || existing.includes(trimmed) || trimmed.includes(existing)
    })
}

function AddItemForm({ onAddItem, editingItem, onUpdateItem, onCancelEdit, existingItems = [] }) {
    const [itemName, setItemName] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [unit, setUnit] = useState("")
    const [category, setCategory] = useState("")
    const [location, setLocation] = useState("")
    const [householdTag, setHouseholdTag] = useState("")
    const [expirationDate, setExpirationDate] = useState("")
    const [duplicateDismissed, setDuplicateDismissed] = useState(false)

    const duplicates = useMemo(
        () => findDuplicates(itemName, existingItems, editingItem?.id),
        [itemName, existingItems, editingItem]
    )

    useEffect(() => {
        if (editingItem) {
            setItemName(editingItem.item_name || "")
            setQuantity(editingItem.quantity || 1)
            setUnit(editingItem.unit || "")
            setCategory(editingItem.category || "")
            setLocation(editingItem.location || "")
            setHouseholdTag(editingItem.household_tag || "")
            setExpirationDate(editingItem.expiration_date || "")
        }
    }, [editingItem])

    function resetForm() {
        setItemName("")
        setQuantity(1)
        setUnit("")
        setCategory("")
        setLocation("")
        setHouseholdTag("")
        setExpirationDate("")
        setDuplicateDismissed(false)
    }

    function handleItemNameChange(value) {
        setItemName(value)
        setDuplicateDismissed(false)
    }

    function handleSubmit(e) {
        e.preventDefault()
        if (!itemName.trim()) return

        const payload = {
            item_name: itemName.trim(),
            quantity: Number(quantity),
            unit: unit.trim(),
            category: category || "Other",
            location: location || "Pantry",
            household_tag: householdTag.trim() || null,
            expiration_date: expirationDate || null
        }

        if (editingItem) {
            onUpdateItem(editingItem.id, payload)
        } else {
            onAddItem(payload)
        }

        resetForm()
    }

    function handleCancel() {
        resetForm()
        onCancelEdit()
    }

    return (
        <div style={styles.container}>
            <div style={styles.sectionLabel}>Add item</div>
            <div style={styles.grid}>
                <div style={styles.inputGroupFull}>
                    <label style={styles.label}>Item Name *</label>
                    <input style={styles.input} type="text" placeholder="e.g. Oat milk"
                           value={itemName} onChange={(e) => setItemName(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Quantity</label>
                    <input style={styles.input} type="number" min="1"
                           value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Unit</label>
                    <input style={styles.input} type="text" placeholder="cartons, oz..."
                           value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Expiration (optional)</label>
                    <input style={styles.input} type="date"
                           value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
                </div>
            </div>
            <button style={styles.button} onClick={handleSubmit}>+ Add to Pantry</button>
        </div>
    )
}

const styles = {
    container: {
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "24px"
    },
    sectionLabel: {
        fontSize: "10px",
        letterSpacing: "2.5px",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.3)",
        marginBottom: "14px"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        marginBottom: "12px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column"
    },
    inputGroupFull: {
        display: "flex",
        flexDirection: "column",
        gridColumn: "1 / -1"
    },
    label: {
        fontSize: "10px",
        color: "rgba(255,255,255,0.35)",
        letterSpacing: "1px",
        textTransform: "uppercase",
        marginBottom: "6px"
    },
    input: {
        width: "100%",
        background: "rgba(255,255,255,0.06)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "10px 12px",
        color: "#e8f0ea",
        fontSize: "14px",
        boxSizing: "border-box",
        outline: "none"
    },
    button: {
        width: "100%",
        padding: "12px",
        backgroundColor: "#4caf78",
        color: "#0f1a14",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "4px",
        letterSpacing: "0.3px"
    }
}

export default AddItemForm
