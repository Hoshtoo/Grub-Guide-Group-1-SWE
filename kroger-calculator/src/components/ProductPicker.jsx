import { useState, useEffect } from 'react'
import { extractPrice, sortByPrice, formatPrice } from '../utils'
import './ProductPicker.css'

export default function ProductPicker({
  shoppingList,
  selectedStore,
  selections,
  setSelections,
  onBack,
  onNext,
}) {
  // productData: { [term]: { status: 'loading'|'done'|'error', products: [] } }
  const [productData, setProductData] = useState({})

  useEffect(() => {
    // Initialise all terms as loading
    const initial = {}
    shoppingList.forEach(term => { initial[term] = { status: 'loading', products: [] } })
    setProductData(initial)

    // Fire all product fetches in parallel
    shoppingList.forEach(async term => {
      try {
        const res  = await fetch(
          `/api/products?term=${encodeURIComponent(term)}&locationId=${selectedStore.locationId}`
        )
        const data = await res.json()
        const sorted = sortByPrice(data.products ?? [])

        setProductData(prev => ({
          ...prev,
          [term]: { status: 'done', products: sorted },
        }))

        // Auto-select the cheapest (first) product if nothing chosen yet
        setSelections(prev => {
          if (prev[term] !== undefined) return prev
          return { ...prev, [term]: sorted[0] ?? null }
        })
      } catch {
        setProductData(prev => ({
          ...prev,
          [term]: { status: 'error', products: [] },
        }))
      }
    })
  }, []) // runs once on mount

  const allLoaded   = shoppingList.every(t => productData[t]?.status !== 'loading')
  const anySelected = Object.values(selections).some(v => v !== null && v !== undefined)

  function selectProduct(term, product) {
    setSelections(prev => ({ ...prev, [term]: product }))
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Select Your Products</div>
        <div className="card-subtitle">
          📍 {selectedStore.chain} {selectedStore.name} — {selectedStore.address}
          <br />
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
            Products listed cheapest → most expensive
          </span>
        </div>
      </div>

      <div className="card-body">
        {shoppingList.map(term => {
          const state = productData[term]
          return (
            <div key={term} className="product-section">
              <div className="product-term-label">{term}</div>

              {/* Loading */}
              {(!state || state.status === 'loading') && (
                <div className="alert alert-info">
                  <span className="spinner" /> Loading…
                </div>
              )}

              {/* Error */}
              {state?.status === 'error' && (
                <div className="alert alert-warning">
                  ⚠️ Could not load results for "{term}".
                </div>
              )}

              {/* Products */}
              {state?.status === 'done' && (
                <div className="product-options">

                  {/* Skip option */}
                  <div
                    className={`product-option skip-opt ${selections[term] === null ? 'selected' : ''}`}
                    onClick={() => selectProduct(term, null)}
                    role="radio"
                    aria-checked={selections[term] === null}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && selectProduct(term, null)}
                  >
                    <div className="product-radio">
                      {selections[term] === null && <div className="product-radio-dot" />}
                    </div>
                    <div className="product-info">
                      <div className="product-name muted">Skip this item</div>
                    </div>
                  </div>

                  {state.products.length === 0 && (
                    <div className="alert alert-warning" style={{ marginTop: 6 }}>
                      No results found at this store.
                    </div>
                  )}

                  {state.products.map((product, i) => {
                    const price    = extractPrice(product)
                    const priceStr = formatPrice(price)
                    const isFirst  = i === 0 && price !== null
                    const isSel    = selections[term]?.productId === product.productId

                    return (
                      <div
                        key={product.productId ?? i}
                        className={`product-option ${isSel ? 'selected' : ''}`}
                        onClick={() => selectProduct(term, product)}
                        role="radio"
                        aria-checked={isSel}
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && selectProduct(term, product)}
                        style={{ animationDelay: `${i * 0.04}s` }}
                      >
                        <div className="product-radio">
                          {isSel && <div className="product-radio-dot" />}
                        </div>
                        <div className="product-info">
                          <div className="product-name">
                            {product.brand} {product.description}
                            {isFirst && (
                              <span className="badge badge-green" style={{ marginLeft: 8 }}>
                                Best Price
                              </span>
                            )}
                          </div>
                          <div className="product-meta">{product.size}</div>
                        </div>
                        <div className={`product-price ${!priceStr ? 'na' : ''}`}>
                          {priceStr ?? 'N/A'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="section-divider" />
            </div>
          )
        })}
      </div>

      <div className="card-footer">
        <button className="btn btn-outline" onClick={onBack}>← Back</button>
        <button
          className="btn btn-success"
          onClick={onNext}
          disabled={!allLoaded || !anySelected}
        >
          🧾 Calculate Total
        </button>
      </div>
    </div>
  )
}