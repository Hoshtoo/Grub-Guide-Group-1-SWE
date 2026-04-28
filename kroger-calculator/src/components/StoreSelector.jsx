import { useState } from 'react'
import './StoreSelector.css'

export default function StoreSelector({ onBack, onNext }) {
  const [zip, setZip]               = useState('')
  const [stores, setStores]         = useState([])
  const [selected, setSelected]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [searched, setSearched]     = useState(false)

  async function searchStores() {
    if (!/^\d{5}$/.test(zip)) {
      setError('Please enter a valid 5-digit zip code.')
      return
    }
    setError('')
    setLoading(true)
    setStores([])
    setSelected(null)
    setSearched(false)

    try {
      const res  = await fetch(`/api/locations?zip=${zip}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Could not find stores. Please try again.')
        return
      }
      if (!data.locations?.length) {
        setError('No Kroger stores found near that zip code. Try a nearby zip.')
        return
      }
      setStores(data.locations)
      setSearched(true)
    } catch {
      setError('Network error — make sure the Flask server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Find Your Store</div>
        <div className="card-subtitle">
          Enter your zip code to see nearby Kroger-family stores and get accurate local prices.
        </div>
      </div>

      <div className="card-body">
        <div className="zip-row">
          <div className="field-group">
            <label className="field-label" htmlFor="zipInput">Zip Code</label>
            <input
              id="zipInput"
              className="field-input"
              type="text"
              maxLength={5}
              value={zip}
              onChange={e => setZip(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && searchStores()}
              placeholder="e.g. 30533"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={searchStores}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner spinner-white" /> Searching…</>
              : <>🔍 Find Stores</>
            }
          </button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {searched && stores.length > 0 && (
          <div className="store-list">
            <p className="stores-found-label">
              {stores.length} store{stores.length !== 1 ? 's' : ''} found near {zip}
            </p>
            {stores.map(store => (
              <div
                key={store.locationId}
                className={`store-option ${selected?.locationId === store.locationId ? 'selected' : ''}`}
                onClick={() => setSelected(store)}
                role="radio"
                aria-checked={selected?.locationId === store.locationId}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelected(store)}
              >
                <div className="store-radio">
                  {selected?.locationId === store.locationId && <div className="store-radio-dot" />}
                </div>
                <div className="store-info">
                  <div className="store-name">{store.name}</div>
                  <div className="store-addr">{store.address}</div>
                </div>
                <span className="badge badge-blue">{store.chain}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-footer">
        <button className="btn btn-outline" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={() => selected && onNext(selected)}
          disabled={!selected}
        >
          Search Products →
        </button>
      </div>
    </div>
  )
}