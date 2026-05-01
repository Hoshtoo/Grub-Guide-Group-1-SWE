function InventoryToggle({ viewMode, onViewModeChange, hasHousehold }) {
    if (!hasHousehold) return null

    return (
        <div style={styles.container}>
            <button
                onClick={() => onViewModeChange("personal")}
                style={{
                    ...styles.button,
                    ...(viewMode === "personal" ? styles.buttonActive : {})
                }}
            >
                My Items
            </button>
            <button
                onClick={() => onViewModeChange("household")}
                style={{
                    ...styles.button,
                    ...(viewMode === "household" ? styles.buttonActive : {})
                }}
            >
                Household
            </button>
        </div>
    )
}

const styles = {
    container: {
        display: "flex",
        gap: "4px",
        padding: "4px",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: "10px",
        marginBottom: "14px"
    },
    button: {
        flex: 1,
        padding: "10px 16px",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        backgroundColor: "transparent",
        color: "rgba(232,240,234,0.5)",
        transition: "all 0.15s"
    },
    buttonActive: {
        backgroundColor: "rgba(76,175,120,0.2)",
        color: "#9be1b7"
    }
}

export default InventoryToggle
