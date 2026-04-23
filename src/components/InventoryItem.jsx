function InventoryItem({ item, onDelete, onEdit, isDuplicate = false }) {
    const locationLabel = item.location || "Pantry"

    const isNew = () => {
        const createdAt = new Date(item.created_at)
        const now = new Date()
        const diffHours = (now - createdAt) / 1000 / 60 / 60
        return diffHours < 12
    }

    return (
        <div style={{ ...styles.card, ...(isNew() ? styles.newCard : {}) }}>
            <div style={styles.badgesRow}>
                {isNew() && <span style={styles.newBadge}>Just Added</span>}
                {isDuplicate && <span style={styles.duplicateBadge}>Duplicate</span>}
            </div>

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
                <span style={styles.locationBadge}>{locationLabel}</span>
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
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: "10px",
        padding: "12px 16px",
        marginBottom: "8px",
        border: "0.5px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        rowGap: "6px"
    },
    newCard: {
        backgroundColor: "rgba(76,175,120,0.14)",
        border: "0.5px solid rgba(76,175,120,0.5)"
    },
    newBadge: {
        display: "inline-block",
        backgroundColor: "rgba(76,175,120,0.2)",
        color: "#9be1b7",
        fontSize: "11px",
        padding: "2px 8px",
        borderRadius: "10px",
        lineHeight: 1.2
    },
    badgesRow: {
        display: "flex",
        gap: "6px",
        flexWrap: "wrap"
    },
    duplicateBadge: {
        display: "inline-block",
        backgroundColor: "rgba(232,132,90,0.18)",
        color: "#f4b08c",
        fontSize: "11px",
        padding: "2px 8px",
        borderRadius: "10px",
        lineHeight: 1.2
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
        color: "#e8f0ea"
    },
    qty: {
        fontSize: "13px",
        color: "rgba(232,240,234,0.78)",
        backgroundColor: "rgba(255,255,255,0.08)",
        padding: "2px 8px",
        borderRadius: "6px"
    },
    actions: {
        display: "flex",
        gap: "4px",
        flexShrink: 0
    },
    editBtn: {
        background: "rgba(76,175,120,0.14)",
        border: "0.5px solid rgba(76,175,120,0.35)",
        fontSize: "16px",
        cursor: "pointer",
        padding: "2px 6px",
        borderRadius: "4px",
        color: "#7fd59f"
    },
    deleteBtn: {
        background: "rgba(232,132,90,0.14)",
        border: "0.5px solid rgba(232,132,90,0.35)",
        fontSize: "16px",
        cursor: "pointer",
        padding: "2px 6px",
        borderRadius: "4px",
        color: "#e8845a"
    },
    metaRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap"
    },
    locationBadge: {
        fontSize: "12px",
        color: "#8dd9aa",
        backgroundColor: "rgba(76,175,120,0.14)",
        padding: "2px 8px",
        borderRadius: "6px",
        fontWeight: "500",
        border: "0.5px solid rgba(76,175,120,0.3)"
    },
    householdBadge: {
        fontSize: "12px",
        color: "#c9b6f3",
        backgroundColor: "rgba(138,108,198,0.18)",
        padding: "2px 8px",
        borderRadius: "6px",
        border: "0.5px solid rgba(138,108,198,0.3)"
    },
    expiry: {
        fontSize: "12px",
        color: "#f1a16d",
        fontWeight: "500"
    }
}

export default InventoryItem