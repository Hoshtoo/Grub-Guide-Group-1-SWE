const LOCATION_ICONS = {
    Fridge: "&#x1F9CA;",
    Freezer: "&#x2744;&#xFE0F;",
    Pantry: "&#x1F3E0;",
    Counter: "&#x1F372;"
}

function InventoryItem({ item, onDelete, onEdit }) {
    const locationLabel = item.location || "Pantry"

    return (
        <div style={styles.card}>
            <div style={styles.topRow}>
                <div style={styles.nameRow}>
                    <span style={styles.name}>{item.item_name}</span>
                    <span style={styles.qty}>
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                    </span>
                </div>
                <div style={styles.actions}>
                    <button
                        style={styles.editBtn}
                        onClick={() => onEdit(item)}
                        title="Edit item"
                    >
                        &#9998;
                    </button>
                    <button
                        style={styles.deleteBtn}
                        onClick={() => onDelete(item.id)}
                        title="Delete item"
                    >
                        &#128465;
                    </button>
                </div>
            </div>

            <div style={styles.metaRow}>
                <span
                    style={styles.locationBadge}
                    dangerouslySetInnerHTML={{
                        __html: `${LOCATION_ICONS[locationLabel] || ""} ${locationLabel}`
                    }}
                />
                {item.household_tag && (
                    <span style={styles.householdBadge}>
                        {item.household_tag}
                    </span>
                )}
                {item.expiration_date && (
                    <span style={styles.expiry}>
                        Exp: {item.expiration_date}
                    </span>
                )}
            </div>
        </div>
    )
}

const styles = {
    card: {
        backgroundColor: "#f4f9f6",
        borderRadius: "10px",
        padding: "12px 16px",
        marginBottom: "8px"
    },
    topRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start"
    },
    nameRow: {
        display: "flex",
        alignItems: "baseline",
        gap: "10px",
        flexWrap: "wrap"
    },
    name: {
        fontWeight: "bold",
        fontSize: "15px",
        color: "#1b4332"
    },
    qty: {
        fontSize: "13px",
        color: "#555",
        backgroundColor: "#e8f0eb",
        padding: "2px 8px",
        borderRadius: "6px"
    },
    actions: {
        display: "flex",
        gap: "4px",
        flexShrink: 0
    },
    editBtn: {
        background: "none",
        border: "none",
        fontSize: "16px",
        cursor: "pointer",
        padding: "2px 6px",
        borderRadius: "4px",
        color: "#2d6a4f"
    },
    deleteBtn: {
        background: "none",
        border: "none",
        fontSize: "16px",
        cursor: "pointer",
        padding: "2px 6px",
        borderRadius: "4px",
        color: "#c0392b"
    },
    metaRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "6px",
        flexWrap: "wrap"
    },
    locationBadge: {
        fontSize: "12px",
        color: "#2d6a4f",
        backgroundColor: "#d8f3dc",
        padding: "2px 8px",
        borderRadius: "6px",
        fontWeight: "500"
    },
    householdBadge: {
        fontSize: "12px",
        color: "#5a4a8a",
        backgroundColor: "#ede9f6",
        padding: "2px 8px",
        borderRadius: "6px"
    },
    expiry: {
        fontSize: "12px",
        color: "#e07b39",
        fontWeight: "500"
    }
}

export default InventoryItem
