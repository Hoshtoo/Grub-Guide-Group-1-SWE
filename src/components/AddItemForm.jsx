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
            <h2 style={styles.title}>
                {editingItem ? "Edit Item" : "Add Grocery Item"}
            </h2>

            <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 2 }}>
                    <label style={styles.label}>Item Name *</label>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="e.g. Milk"
                        value={itemName}
                        onChange={(e) => handleItemNameChange(e.target.value)}
                    />
                </div>

                <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Qty</label>
                    <input
                        style={styles.input}
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                </div>

                <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Unit</label>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="oz, lbs"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                    />
                </div>
            </div>

            {duplicates.length > 0 && !duplicateDismissed && !editingItem && (
                <div style={styles.duplicateWarning}>
                    <div style={styles.duplicateHeader}>
                        <span style={styles.duplicateTitle}>
                            &#x26A0; Already in stock
                        </span>
                        <button
                            style={styles.dismissBtn}
                            onClick={() => setDuplicateDismissed(true)}
                            title="Dismiss"
                        >
                            &#x2715;
                        </button>
                    </div>
                    <ul style={styles.duplicateList}>
                        {duplicates.map((d) => (
                            <li key={d.id} style={styles.duplicateItem}>
                                <strong>{d.item_name}</strong>
                                {" \u2014 "}
                                {d.quantity}{d.unit ? ` ${d.unit}` : ""}
                                {" in "}
                                {d.location || "Pantry"}
                                {d.household_tag ? ` (${d.household_tag})` : ""}
                            </li>
                        ))}
                    </ul>
                    <p style={styles.duplicateHint}>
                        Consider updating the existing item instead of adding a duplicate.
                    </p>
                </div>
            )}

            <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Category</label>
                    <select
                        style={styles.input}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Location</label>
                    <select
                        style={styles.input}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    >
                        <option value="">Select location</option>
                        {LOCATIONS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Household Tag (optional)</label>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="e.g. Apt 4B, The Smiths"
                        value={householdTag}
                        onChange={(e) => setHouseholdTag(e.target.value)}
                    />
                </div>

                <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Expiration Date</label>
                    <input
                        style={styles.input}
                        type="date"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.buttonRow}>
                <button style={styles.button} onClick={handleSubmit}>
                    {editingItem ? "Save Changes" : "+ Add Item"}
                </button>
                {editingItem && (
                    <button style={styles.cancelButton} onClick={handleCancel}>
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}

const styles = {
    container: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "600px",
        margin: "0 auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    },
    title: {
        fontSize: "20px",
        marginBottom: "16px",
        color: "#2d6a4f",
        margin: "0 0 16px"
    },
    row: {
        display: "flex",
        gap: "12px",
        marginBottom: "14px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column"
    },
    label: {
        display: "block",
        fontSize: "13px",
        marginBottom: "4px",
        color: "#555",
        fontWeight: "500"
    },
    input: {
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "14px",
        boxSizing: "border-box",
        backgroundColor: "#fff"
    },
    buttonRow: {
        display: "flex",
        gap: "10px",
        marginTop: "8px"
    },
    button: {
        flex: 1,
        padding: "12px",
        backgroundColor: "#2d6a4f",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "15px",
        cursor: "pointer",
        fontWeight: "500"
    },
    cancelButton: {
        flex: 1,
        padding: "12px",
        backgroundColor: "#fff",
        color: "#666",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontSize: "15px",
        cursor: "pointer",
        fontWeight: "500"
    },
    duplicateWarning: {
        backgroundColor: "#fff8e1",
        border: "1px solid #ffe082",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "14px"
    },
    duplicateHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "6px"
    },
    duplicateTitle: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#e65100"
    },
    dismissBtn: {
        background: "none",
        border: "none",
        fontSize: "14px",
        cursor: "pointer",
        color: "#999",
        padding: "0 4px"
    },
    duplicateList: {
        margin: "0 0 6px",
        paddingLeft: "20px"
    },
    duplicateItem: {
        fontSize: "13px",
        color: "#5d4037",
        marginBottom: "2px"
    },
    duplicateHint: {
        fontSize: "12px",
        color: "#8d6e63",
        margin: 0,
        fontStyle: "italic"
    }
}

export default AddItemForm
