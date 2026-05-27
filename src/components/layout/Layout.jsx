import Sidebar from './Sidebar'
import AIChat from '../ui/AIChat'

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar — oculta no mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        style={{ flex: 1, padding: '32px', minHeight: '100vh', marginLeft: 0 }}
        className="md:ml-[232px]"
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      <AIChat />
    </div>
  )
}
