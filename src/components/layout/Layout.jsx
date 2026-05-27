import Sidebar from './Sidebar'
import AIChat from '../ui/AIChat'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-60 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <AIChat />
    </div>
  )
}
