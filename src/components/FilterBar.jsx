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
        padding: "10px 36px 10px 12px",
        borderRadius: "8px",
        border: "0.5px solid rgba(255,255,255,0.12)",
        fontSize: "14px",
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "#e8f0ea",
        cursor: "pointer",
        boxSizing: "border-box",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23c9d8cf' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.7' d='M3.5 6 8 10.5 12.5 6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "14px 14px"
    },
    clearBtn: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "0.5px solid rgba(232,132,90,0.35)",
        backgroundColor: "rgba(232,132,90,0.16)",
        color: "#e8845a",
        fontSize: "13px",
        cursor: "pointer",
        fontWeight: "500",
        whiteSpace: "nowrap"
    }
}

export default FilterBar
