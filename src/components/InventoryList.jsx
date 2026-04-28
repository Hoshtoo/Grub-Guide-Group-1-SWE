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


function InventoryList({ items, onDelete, onEdit, onAddToList, duplicateItemIds, timeTick }) {
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
                    {items.length} item{items.length !== 1 ? "s" : ""} in stock
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
                            onAddToList={onAddToList}
                            duplicateItemIds={duplicateItemIds}
                            timeTick={timeTick}
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
        marginBottom: "8px"
    },
    countText: {
        fontSize: "12px",
        color: "rgba(232, 240, 234, 0.4)",
        textTransform: "uppercase",
        letterSpacing: "1px"
    },
    categoryGroup: {
        marginBottom: "20px"
    },
    categoryHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)", 
        marginBottom: "12px"
    },
    categoryName: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#52b788", 
        textTransform: "uppercase",
        letterSpacing: "1.5px"
    },
    categoryCount: {
        fontSize: "10px",
        color: "#e8f0ea",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        padding: "2px 8px",
        borderRadius: "4px",
        fontWeight: "600"
    },
    empty: {
        textAlign: "center",
        padding: "60px 20px"
    },
    emptyText: {
        fontSize: "16px",
        color: "rgba(232, 240, 234, 0.6)",
        margin: "0 0 8px"
    },
    emptySubtext: {
        fontSize: "13px",
        color: "rgba(232, 240, 234, 0.3)",
        margin: 0
    }
}

export default InventoryList