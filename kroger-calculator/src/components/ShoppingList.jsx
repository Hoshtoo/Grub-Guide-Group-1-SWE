import { useState, useRef } from 'react'
import './ShoppingList.css'

export default function ShoppingList({ shoppingList, setShoppingList, onNext }) {
  const [newItem, setNewItem] = useState('')
  const [error, setError]     = useState('')
  const addInputRef           = useRef(null)

  function updateItem(idx, value) {
    const updated = [...shoppingList]
    updated[idx]  = value
    setShoppingList(updated)
  }

  function removeItem(idx) {
    setShoppingList(shoppingList.filter((_, i) => i !== idx))
  }

  function addItem() {
    const val = newItem.trim()
    if (!val) return
    setShoppingList([...shoppingList, val])
    setNewItem('')
    addInputRef.current?.focus()
  }

  function handleNext() {
    const clean = shoppingList.map(s => s.trim()).filter(Boolean)
    if (!clean.length) {
      setError('Please add at least one item to your list.')
      return
    }
    setShoppingList(clean)
    setError('')
    onNext()
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Your Shopping List</div>
        <div className="card-subtitle">
          Add, edit, or remove items — then find your store to get real prices.
        </div>
      </div>

      <div className="card-body">
        <ul className="item-list">
          {shoppingList.map((item, idx) => (
            <li key={idx} className="item-row animate-fade" style={{ animationDelay: `${idx * 0.03}s` }}>
              <span className="item-num">{idx + 1}</span>
              <input
                className="item-input"
                type="text"
                value={item}
                onChange={e => updateItem(idx, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addInputRef.current?.focus()}
                placeholder="Item name"
              />
              <button
                className="btn-remove"
                onClick={() => removeItem(idx)}
                aria-label={`Remove ${item}`}
                title="Remove item"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="add-row">
          <input
            ref={addInputRef}
            className="add-input"
            type="text"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Type an item and press Enter or Add…"
          />
          <button className="btn-add" onClick={addItem}>+ Add</button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
      </div>

      <div className="card-footer">
        <button className="btn btn-primary" onClick={handleNext}>
          Find Stores →
        </button>
      </div>
    </div>
  )
}