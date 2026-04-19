import InventoryItem from "./InventoryItem"

const CATEGORY_ORDER = [
    "Produce",
    "Dairy",
    "Meat & Seafood",
    "Grains & Bread",
    "Canned Goods",
    "Snacks",
    "Beverages",
    "Condiments & Sauces",
    "Frozen",
    "Other"
]

function groupByCategory(items) {
    const groups = {}

    items.forEach((item) => {
        const cat = item.category || "Other"
        if (!groups[cat]) {
            groups[cat] = []
        }
        groups[cat].push(item)
    })

    const sortedEntries = CATEGORY_ORDER
        .filter((cat) => groups[cat])
        .map((cat) => [cat, groups[cat]])

    Object.keys(groups).forEach((cat) => {
        if (!CATEGORY_ORDER.includes(cat)) {
            sortedEntries.push([cat, groups[cat]])
        }
    })

    return sortedEntries
}

function InventoryList({ items, onDelete, onEdit }) {
    if (items.length === 0) {
        return (
            <div style={styles.empty}>
                <p style={styles.emptyText}>No items found</p>
                <p style={styles.emptySubtext}>
                    Add items above or adjust your search and filters
                </p>
            </div>
        )
    }

    const grouped = groupByCategory(items)

    return (
        <div style={styles.container}>
            <div style={styles.countBar}>
                <span style={styles.countText}>
                    {items.length} item{items.length !== 1 ? "s" : ""} in inventory
                </span>
            </div>

            {grouped.map(([category, categoryItems]) => (
                <div key={category} style={styles.categoryGroup}>
                    <div style={styles.categoryHeader}>
                        <span style={styles.categoryName}>{category}</span>
                        <span style={styles.categoryCount}>
                            {categoryItems.length}
                        </span>
                    </div>

                    {categoryItems.map((item) => (
                        <InventoryItem
                            key={item.id}
                            item={item}
                            onDelete={onDelete}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    },
    countBar: {
        textAlign: "right",
        marginBottom: "4px"
    },
    countText: {
        fontSize: "13px",
        color: "#888"
    },
    categoryGroup: {
        marginBottom: "16px"
    },
    categoryHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 4px",
        borderBottom: "2px solid #b7e4c7",
        marginBottom: "8px"
    },
    categoryName: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#2d6a4f",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    categoryCount: {
        fontSize: "12px",
        color: "#52796f",
        backgroundColor: "#d8f3dc",
        padding: "1px 8px",
        borderRadius: "10px",
        fontWeight: "500"
    },
    empty: {
        textAlign: "center",
        padding: "40px 20px"
    },
    emptyText: {
        fontSize: "16px",
        color: "#888",
        margin: "0 0 4px"
    },
    emptySubtext: {
        fontSize: "13px",
        color: "#aaa",
        margin: 0
    }
}

export default InventoryList
