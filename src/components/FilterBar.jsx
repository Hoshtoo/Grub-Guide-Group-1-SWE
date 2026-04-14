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

function FilterBar({ categoryFilter, locationFilter, onCategoryChange, onLocationChange }) {
    const hasActiveFilters = categoryFilter || locationFilter

    function clearFilters() {
        onCategoryChange("")
        onLocationChange("")
    }

    return (
        <div style={styles.container}>
            <div style={styles.filterRow}>
                <select
                    style={styles.select}
                    value={categoryFilter}
                    onChange={(e) => onCategoryChange(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select
                    style={styles.select}
                    value={locationFilter}
                    onChange={(e) => onLocationChange(e.target.value)}
                >
                    <option value="">All Locations</option>
                    {LOCATIONS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>

                {hasActiveFilters && (
                    <button style={styles.clearBtn} onClick={clearFilters}>
                        Clear Filters
                    </button>
                )}
            </div>
        </div>
    )
}

const styles = {
    container: {
        maxWidth: "600px",
        margin: "0 auto 8px"
    },
    filterRow: {
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap"
    },
    select: {
        flex: 1,
        minWidth: "150px",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "14px",
        backgroundColor: "#fff",
        color: "#333",
        cursor: "pointer",
        boxSizing: "border-box"
    },
    clearBtn: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "1px solid #d4a373",
        backgroundColor: "#fefae0",
        color: "#a37a2e",
        fontSize: "13px",
        cursor: "pointer",
        fontWeight: "500",
        whiteSpace: "nowrap"
    }
}

export default FilterBar
