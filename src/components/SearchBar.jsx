function SearchBar({ searchQuery, onSearchChange }) {
    return (
        <div style={styles.container}>
            <div style={styles.inputWrapper}>
                <span style={styles.icon}>&#128269;</span>
                <input
                    style={styles.input}
                    type="text"
                    placeholder="Search items by name..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                    <button
                        style={styles.clearBtn}
                        onClick={() => onSearchChange("")}
                        aria-label="Clear search"
                    >
                        &times;
                    </button>
                )}
            </div>
        </div>
    )
}

const styles = {
    container: {
        maxWidth: "600px",
        margin: "16px auto"
    },
    inputWrapper: {
        position: "relative",
        display: "flex",
        alignItems: "center"
    },
    icon: {
        position: "absolute",
        left: "14px",
        fontSize: "16px",
        color: "rgba(232,240,234,0.5)",
        pointerEvents: "none"
    },
    input: {
        width: "100%",
        padding: "12px 40px 12px 42px",
        borderRadius: "10px",
        border: "0.5px solid rgba(255,255,255,0.12)",
        fontSize: "15px",
        boxSizing: "border-box",
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "#e8f0ea",
        outline: "none",
        boxShadow: "0 0 0 1px rgba(15,26,20,0.2) inset"
    },
    clearBtn: {
        position: "absolute",
        right: "10px",
        background: "none",
        border: "none",
        fontSize: "20px",
        color: "rgba(232,240,234,0.55)",
        cursor: "pointer",
        padding: "4px 8px",
        lineHeight: 1
    }
}

export default SearchBar
