import React from 'react';

const LOCATION_ICONS = {
    Fridge: "&#x1F9CA;",
    Freezer: "&#x2744;&#xFE0F;",
    Pantry: "&#x1F3E0;",
    Counter: "&#x1F372;"
}

function InventoryItem({ item, onDelete, onEdit, onAddToList, duplicateItemIds = new Set(), timeTick }) {

    const isNew = () => {
        const created = new Date(item.created_at).getTime();
        const twelveHoursInMs = 12 * 60 * 60 * 1000;
        return (Date.now() - created) < twelveHoursInMs;
    };

    const isDuplicate = duplicateItemIds.has(item.id);
    const itemIsNew = isNew();


    const locationLabel = item.location || "Pantry";
    const lastUpdate = new Date(item.last_used_at || item.created_at || new Date());
    const today = new Date();
    const diffDays = Math.ceil(Math.abs(today - lastUpdate) / (1000 * 60 * 60 * 24));
    
    const needsVerification = diffDays > 7;

    return (
        <div style={styles.card}>
            {/* --- PARTNER'S BADGE ROW --- */}
            {(itemIsNew || isDuplicate) && (
                <div style={styles.badgeRow}>
                    {itemIsNew && <span style={styles.newBadge}>Just Added</span>}
                    {isDuplicate && <span style={styles.duplicateBadge}>Duplicate</span>}
                </div>
            )}

            <div style={styles.topRow}>
                <div style={styles.nameRow}>
                    <span style={styles.name}>{item.item_name}</span>
                    <span style={styles.qty}>
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                    </span>
                </div>
                <div style={styles.actions}>
                    <button style={styles.listBtn} onClick={() => onAddToList(item)} title="Add to Shopping List">&#128722;</button>
                    <button style={styles.editBtn} onClick={() => onEdit(item)} title="Edit item">&#9998;</button>
                    <button style={styles.deleteBtn} onClick={() => onDelete(item.id)} title="Delete item">&#128465;</button>
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

                {needsVerification && (
                    <button 
                        onClick={() => alert(`Please verify amount of ${item.item_name}. It has been ${diffDays} days since update.`)}
                        style={styles.verifyBtn}
                    >
                        &#9888; Verify
                    </button>
                )}
            </div>
        </div>
    )
}

const styles = {
    card: {
        
        background: "rgba(255, 255, 255, 0.05)", 
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "12px",
        border: "0.5px solid rgba(255, 255, 255, 0.1)", 
        position: "relative"
    },
    badgeRow: {
        display: "flex",
        gap: "6px",
        marginBottom: "10px"
    },
    newBadge: {
        fontSize: "9px",
        backgroundColor: "#2d6a4f",
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "20px",
        textTransform: "uppercase",
        fontWeight: "bold",
        letterSpacing: "0.5px"
    },
    duplicateBadge: {
        fontSize: "9px",
        backgroundColor: "rgba(244, 162, 97, 0.2)",
        color: "#f4a261",
        padding: "2px 8px",
        borderRadius: "20px",
        textTransform: "uppercase",
        fontWeight: "bold",
        letterSpacing: "0.5px",
        border: "0.5px solid rgba(244, 162, 97, 0.3)"
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
        fontWeight: "600",
        fontSize: "16px",
        color: "#e8f0ea" 
    },
    qty: {
        fontSize: "12px",
        color: "rgba(232, 240, 234, 0.7)", // Light grey-green
        backgroundColor: "rgba(255, 255, 255, 0.1)", // Darker background for the pill
        padding: "2px 8px",
        borderRadius: "6px"
    },
    actions: {
        display: "flex",
        gap: "8px"
    },
    listBtn: { background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#2d6a4f" },
    editBtn: { background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "rgba(255,255,255,0.4)" },
    deleteBtn: { background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#bc4749" },
    metaRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "12px",
        flexWrap: "wrap"
    },
    locationBadge: {
        fontSize: "10px",
        color: "#b7e4c7",
        backgroundColor: "rgba(45, 106, 79, 0.2)",
        padding: "3px 10px",
        borderRadius: "6px",
        fontWeight: "600",
        textTransform: "uppercase"
    },
    householdBadge: {
        fontSize: "10px",
        color: "#a29bfe",
        backgroundColor: "rgba(162, 155, 254, 0.1)",
        padding: "3px 10px",
        borderRadius: "6px",
        fontWeight: "600"
    },
    expiry: {
        fontSize: "11px",
        color: "#f4a261",
        fontWeight: "500"
    },
    verifyBtn: {
        backgroundColor: "transparent",
        color: "#f4a261",
        border: "1px solid rgba(244, 162, 97, 0.4)",
        borderRadius: "6px",
        padding: "2px 8px",
        fontSize: "10px",
        fontWeight: "bold",
        cursor: "pointer"
    }
}

export default InventoryItem;