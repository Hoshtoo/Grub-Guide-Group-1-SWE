function InventoryItem({ item, onDelete }) {
    return (
        <div style={styles.card}>
            <div style={styles.info}>
                <span style={styles.name}>{item.item_name}</span>
                <span style={styles.detail}>
          Qty: {item.quantity} {item.unit}
        </span>
                {item.expiration_date && (
                    <span style={styles.expiry}>
            Expires: {item.expiration_date}
          </span>
                )}
            </div>
            <button style={styles.deleteBtn} onClick={() => onDelete(item.id)}>
                🗑
            </button>
        </div>
    )
}

const styles = {
    card: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f4f9f6",
        borderRadius: "10px",
        padding: "12px 16px",
        marginBottom: "10px"
    },
    info: {
        display: "flex",
        flexDirection: "column"
    },
    name: {
        fontWeight: "bold",
        fontSize: "16px",
        color: "#1b4332"
    },
    detail: {
        fontSize: "13px",
        color: "#555",
        marginTop: "2px"
    },
    expiry: {
        fontSize: "12px",
        color: "#e07b39",
        marginTop: "2px"
    },
    deleteBtn: {
        background: "none",
        border: "none",
        fontSize: "18px",
        cursor: "pointer"
    }
}

export default InventoryItem