import InventoryItem from "./InventoryItem"

function InventoryList({ items, onDelete }) {
    if (items.length === 0) {
        return <p style={{ textAlign: "center", color: "#aaa" }}>No items yet. Add something above!</p>
    }

    return (
        <div>
            {items.map((item) => (
                <InventoryItem key={item.id} item={item} onDelete={onDelete} />
            ))}
        </div>
    )
}

export default InventoryList