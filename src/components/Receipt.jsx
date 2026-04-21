import { extractPrice, formatPrice } from '../utils'
import './Receipt.css'

export default function Receipt({ selections, selectedStore, onBack, onRestart }) {
  const cart    = Object.values(selections).filter(Boolean)
  const skipped = Object.values(selections).filter(v => v === null).length

  const subtotal = cart.reduce((sum, p) => {
    const price = extractPrice(p)
    return sum + (price ?? 0)
  }, 0)

  const priced   = cart.filter(p => extractPrice(p) !== null)
  const unpriced = cart.filter(p => extractPrice(p) === null)

  return (
    <div className="receipt-wrap">

      {/* Summary banner */}
      <div className="summary-bar">
        <span>
          🛍 <strong>{cart.length}</strong> item{cart.length !== 1 ? 's' : ''} selected
          {skipped > 0 && (
            <span className="skipped-note"> · {skipped} skipped</span>
          )}
        </span>
        <span>
          Estimated Total: <strong>${subtotal.toFixed(2)}</strong>
        </span>
      </div>

      {/* Receipt card */}
      <div className="card">

        {/* Receipt header */}
        <div className="receipt-header">
          <div>
            <div className="receipt-title">🧾 Receipt</div>
            <div className="receipt-store">
              {selectedStore.chain} {selectedStore.name}
            </div>
            <div className="receipt-addr">{selectedStore.address}</div>
          </div>
          <div className="receipt-total-hero">
            ${subtotal.toFixed(2)}
          </div>
        </div>

        {/* Line items */}
        <div className="receipt-body">
          {cart.length === 0 ? (
            <div className="receipt-empty">No items were selected.</div>
          ) : (
            <>
              {priced.map((product, i) => (
                <div
                  key={product.productId ?? i}
                  className="receipt-row animate-fade"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="receipt-item-info">
                    <div className="receipt-item-name">
                      {product.brand} {product.description}
                    </div>
                    <div className="receipt-item-size">{product.size}</div>
                  </div>
                  <div className="receipt-item-price">
                    {formatPrice(extractPrice(product))}
                  </div>
                </div>
              ))}

              {unpriced.length > 0 && (
                <>
                  <div className="receipt-section-label">Price Unavailable</div>
                  {unpriced.map((product, i) => (
                    <div
                      key={product.productId ?? i}
                      className="receipt-row muted animate-fade"
                    >
                      <div className="receipt-item-info">
                        <div className="receipt-item-name">
                          {product.brand} {product.description}
                        </div>
                        <div className="receipt-item-size">{product.size}</div>
                      </div>
                      <div className="receipt-item-price na">N/A</div>
                    </div>
                  ))}
                </>
              )}

              {/* Total row */}
              <div className="receipt-total-row">
                <span>ESTIMATED TOTAL</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {unpriced.length > 0 && (
                <div className="alert alert-warning" style={{ margin: '12px 24px 16px' }}>
                  ⚠️ {unpriced.length} item{unpriced.length !== 1 ? 's' : ''} could not
                  be priced and {unpriced.length !== 1 ? 'are' : 'is'} excluded from the total.
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="card-footer">
          <button className="btn btn-outline" onClick={onBack}>
            ← Adjust Selections
          </button>
          <button className="btn btn-primary" onClick={onRestart}>
            🔄 Start Over
          </button>
        </div>
      </div>
    </div>
  )
}