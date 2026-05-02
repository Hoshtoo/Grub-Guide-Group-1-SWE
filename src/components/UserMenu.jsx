import { useState } from "react"
import { supabase } from "../supabaseClient"

function UserMenu({ user, profile, onOpenHousehold }) {
    const [isOpen, setIsOpen] = useState(false)

    async function handleLogout() {
        await supabase.auth.signOut()
    }

    const displayName = profile?.username || user?.email || "User"

    return (
        <div style={styles.container}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={styles.trigger}
            >
                <span style={styles.avatar}>
                    {displayName.charAt(0).toUpperCase()}
                </span>
                <span style={styles.name}>{displayName}</span>
                <span style={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.userInfo}>
                        <div style={styles.userEmail}>{user?.email}</div>
                    </div>
                    <div style={styles.divider} />
                    <button
                        onClick={() => {
                            onOpenHousehold()
                            setIsOpen(false)
                        }}
                        style={styles.menuItem}
                    >
                        Manage Household
                    </button>
                    <button onClick={handleLogout} style={styles.menuItem}>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    )
}

const styles = {
    container: {
        position: "relative"
    },
    trigger: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(255,255,255,0.06)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: "20px",
        padding: "6px 12px 6px 6px",
        cursor: "pointer",
        color: "#e8f0ea"
    },
    avatar: {
        width: "26px",
        height: "26px",
        borderRadius: "50%",
        backgroundColor: "#4caf78",
        color: "#0f1a14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "700"
    },
    name: {
        fontSize: "13px",
        fontWeight: "500",
        maxWidth: "100px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    chevron: {
        fontSize: "8px",
        color: "rgba(232,240,234,0.5)"
    },
    dropdown: {
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        backgroundColor: "#1a2820",
        border: "0.5px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        minWidth: "180px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        zIndex: 100,
        overflow: "hidden"
    },
    userInfo: {
        padding: "12px 14px"
    },
    userEmail: {
        fontSize: "12px",
        color: "rgba(232,240,234,0.5)"
    },
    divider: {
        height: "1px",
        backgroundColor: "rgba(255,255,255,0.08)"
    },
    menuItem: {
        width: "100%",
        padding: "12px 14px",
        background: "none",
        border: "none",
        textAlign: "left",
        color: "#e8f0ea",
        fontSize: "13px",
        cursor: "pointer",
        transition: "background 0.15s"
    }
}

export default UserMenu
