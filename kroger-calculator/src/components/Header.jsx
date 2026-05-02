import './Header.css'

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-logo">
        🛒 Kroger <span className="logo-accent">Price</span> Calculator
      </div>
      <div className="site-badge">Powered by Kroger API</div>
    </header>
  )
}