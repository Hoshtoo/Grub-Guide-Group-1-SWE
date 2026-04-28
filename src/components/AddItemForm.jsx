import { useState, useEffect } from "react"

const CATEGORIES = [
    "Dairy", "Produce", "Meat & Seafood", "Grains & Bread",
    "Canned Goods", "Snacks", "Beverages", "Condiments & Sauces",
    "Frozen", "Other"
]

const LOCATIONS = ["Fridge", "Freezer", "Pantry", "Counter"]

// SMART DEFAULTS ENGINE
const CATEGORY_DEFAULTS = {
    "Dairy": { shelfLife: 7, weeklyUsage: 1, loc: "Fridge" },
    "Produce": { shelfLife: 5, weeklyUsage: 3, loc: "Fridge" },
    "Meat & Seafood": { shelfLife: 3, weeklyUsage: 2, loc: "Fridge" },
    "Grains & Bread": { shelfLife: 10, weeklyUsage: 2, loc: "Pantry" },
    "Canned Goods": { shelfLife: 365, weeklyUsage: 0.5, loc: "Pantry" },
    "Snacks": { shelfLife: 30, weeklyUsage: 1, loc: "Pantry" },
    "Beverages": { shelfLife: 14, weeklyUsage: 4, loc: "Fridge" },
    "Condiments & Sauces": { shelfLife: 180, weeklyUsage: 0.2, loc: "Fridge" },
    "Frozen": { shelfLife: 90, weeklyUsage: 1, loc: "Freezer" },
    "Other": { shelfLife: 14, weeklyUsage: 1, loc: "Pantry" }
};

function AddItemForm({ onAddItem, editingItem, onUpdateItem, onCancelEdit }) {
    const [itemName, setItemName] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [unit, setUnit] = useState("")
    const [category, setCategory] = useState("")
    const [location, setLocation] = useState("")
    const [householdTag, setHouseholdTag] = useState("")
    const [expirationDate, setExpirationDate] = useState("")
    const [weeklyUsage, setWeeklyUsage] = useState(0)
    const [shelfLife, setShelfLife] = useState("")
    const [brandName, setBrandName] = useState("")

    useEffect(() => {
        if (editingItem) {
            setItemName(editingItem.item_name || "")
            setQuantity(editingItem.quantity || 1)
            setUnit(editingItem.unit || "")
            setCategory(editingItem.category || "")
            setLocation(editingItem.location || "")
            setHouseholdTag(editingItem.household_tag || "")
            setExpirationDate(editingItem.expiration_date || "")
            setBrandName(editingItem.brand_name || "")
            setShelfLife(editingItem.shelf_life || "")
            setWeeklyUsage(editingItem.weekly_usage || 0) 
        }
    }, [editingItem])

    const handleCategoryChange = (selectedCategory) => {
        setCategory(selectedCategory);
        if (!editingItem && CATEGORY_DEFAULTS[selectedCategory]) {
            setShelfLife(CATEGORY_DEFAULTS[selectedCategory].shelfLife);
            setWeeklyUsage(CATEGORY_DEFAULTS[selectedCategory].weeklyUsage);
            setLocation(CATEGORY_DEFAULTS[selectedCategory].loc);
        }
    };

    function resetForm() {
        setItemName("")
        setQuantity(1)
        setUnit("")
        setCategory("")
        setLocation("")
        setHouseholdTag("")
        setExpirationDate("")
        setBrandName("")
        setShelfLife("")
        setWeeklyUsage(0)
    }

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (!itemName.trim() || !quantity) return;

        const newItem = {
            item_name: itemName.trim(),
            quantity: Number(quantity),
            unit: unit.trim(),
            category: category || "Other",
            location: location || "Pantry",
            household_tag: householdTag.trim() || null,
            expiration_date: expirationDate || null,
            brand_name: brandName.trim() || "Generic",
            shelf_life: Number(shelfLife) || 14,
            weekly_usage: Number(weeklyUsage) || 0 
        };

        if (editingItem) {
            onUpdateItem(editingItem.id, newItem);
        } else {
            onAddItem(newItem);
        }
        resetForm();
    };

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
                    onChange={(e) => setItemName(e.target.value)}
                />
            </div>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Qty</label>
                <input
                    style={styles.input}
                    type="number"
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

        <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Category</label>
                <select
                    style={styles.input}
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
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
                <label style={styles.label}>Household Tag</label>
                <input
                    style={styles.input}
                    type="text"
                    placeholder="e.g. Apt 4B"
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
        
        <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Brand Name</label>
                <input
                    style={styles.input}
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                />
            </div>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Est. Shelf Life (Days)</label>
                <input
                    style={styles.input}
                    type="number"
                    value={shelfLife}
                    onChange={(e) => setShelfLife(e.target.value)}
                />
            </div>
        </div>

        <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Weekly Consumption (Units)</label>
                <input
                    style={styles.input}
                    type="number"
                    step="0.1"
                    value={weeklyUsage}
                    onChange={(e) => setWeeklyUsage(e.target.value)}
                />
            </div>
        </div>

        <div style={styles.buttonRow}>
            <button style={styles.button} onClick={handleSubmit}>
                {editingItem ? "Save Changes" : "+ Add Item"}
            </button>
            {editingItem && (
                <button style={styles.cancelButton} onClick={onCancelEdit}>
                    Cancel
                </button>
            )}
        </div>
    </div>
)
}

const styles = {
    container: {
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "14px",
        padding: "24px",
        maxWidth: "600px",
        margin: "0 auto",
        border: "0.5px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
    },
    title: {
        fontSize: "18px",
        marginBottom: "20px",
        color: "#e8f0ea", 
        fontWeight: "500",
        letterSpacing: "0.5px"
    },
    row: {
        display: "flex",
        gap: "12px",
        marginBottom: "16px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column"
    },
    label: {
        fontSize: "10px",
        color: "rgba(232, 240, 234, 0.4)", 
        letterSpacing: "1px",
        textTransform: "uppercase",
        marginBottom: "6px",
        fontWeight: "600"
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "0.5px solid rgba(255, 255, 255, 0.1)",
        fontSize: "14px",
        boxSizing: "border-box",
        backgroundColor: "rgba(255, 255, 255, 0.06)", 
        color: "#e8f0ea" 
    },
    buttonRow: {
        display: "flex",
        gap: "10px",
        marginTop: "10px"
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
        fontWeight: "600"
    },
    cancelButton: {
        flex: 1,
        padding: "12px",
        backgroundColor: "transparent",
        color: "rgba(232, 240, 234, 0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        fontSize: "15px",
        cursor: "pointer"
    }
}

export default AddItemForm