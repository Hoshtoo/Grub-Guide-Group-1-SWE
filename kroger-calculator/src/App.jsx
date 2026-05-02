import { useState } from 'react'
import { DEFAULT_ITEMS } from './utils'
import Header     from './components/Header'
import Progress   from './components/Progress'
import ShoppingList  from './components/ShoppingList'
import StoreSelector from './components/StoreSelector'
import ProductPicker from './components/ProductPicker'
import Receipt       from './components/Receipt'
import './App.css'

export default function App() {
  const [step, setStep]                   = useState(1)
  const [shoppingList, setShoppingList]   = useState([...DEFAULT_ITEMS])
  const [selectedStore, setSelectedStore] = useState(null)   // { locationId, name, chain, address }
  const [selections, setSelections]       = useState({})     // { term: product | null }

  function goTo(n) { setStep(n) }

  return (
    <div className="app-shell">
      <Header />
      <Progress step={step} />

      <main className="app-main">

        {step === 1 && (
          <ShoppingList
            shoppingList={shoppingList}
            setShoppingList={setShoppingList}
            onNext={() => goTo(2)}
          />
        )}

        {step === 2 && (
          <StoreSelector
            onBack={() => goTo(1)}
            onNext={(store) => {
              setSelectedStore(store)
              setSelections({})
              goTo(3)
            }}
          />
        )}

        {step === 3 && (
          <ProductPicker
            shoppingList={shoppingList}
            selectedStore={selectedStore}
            selections={selections}
            setSelections={setSelections}
            onBack={() => goTo(2)}
            onNext={() => goTo(4)}
          />
        )}

        {step === 4 && (
          <Receipt
            selections={selections}
            selectedStore={selectedStore}
            onBack={() => goTo(3)}
            onRestart={() => {
              setStep(1)
              setShoppingList([...DEFAULT_ITEMS])
              setSelectedStore(null)
              setSelections({})
            }}
          />
        )}

      </main>
    </div>
  )
}