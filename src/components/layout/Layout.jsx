import { NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import AIChat from '../ui/AIChat'
import { useSettings } from '../../contexts/SettingsContext'
import { getT } from '../../lib/i18n'

/* ── Mobile bottom nav labels ─────────────────────────────────────── */
const SHORT = {
  pt: { dashboard: 'Início', workouts: 'Treino', nutrition: 'Dieta', tasks: 'Tarefas', settings: 'Config' },
  en: { dashboard: 'Home',   workouts: 'Workout', nutrition: 'Diet', tasks: 'Tasks',  settings: 'Settings' },
}

/* ── Mobile Tab Bar ────────────────────────────────────────────────── */
function MobileNav() {
  const { primary, language } = useSettings()
  const labels = SHORT[language] || SHORT.pt

  const items = [
    { to: '/dashboard',     label: labels.dashboard, Icon: IcHome    },
    { to: '/treinos',       label: labels.workouts,  Icon: IcFlame   },
    { to: '/dieta',         label: labels.nutrition, Icon: IcApple   },
    { to: '/tarefas',       label: labels.tasks,     Icon: IcCheck   },
    { to: '/configuracoes', label: labels.settings,  Icon: IcGear    },
  ]

  return (
    <nav
      className="md:hidden"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {items.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} style={{ flex: 1, textDecoration: 'none' }}>
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 2px 8px', gap: 3, position: 'relative',
            }}>
              {/* active indicator bar on top */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 28, height: 2.5, borderRadius: 2, background: primary,
                }} />
              )}
              <Icon
                size={22}
                style={{ color: isActive ? primary : 'var(--text-muted)', transition: 'color 0.15s' }}
              />
              <span style={{
                fontSize: 10.5, fontWeight: isActive ? 600 : 400,
                color: isActive ? primary : 'var(--text-muted)',
                letterSpacing: '-0.01em', transition: 'color 0.15s',
                maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/* ── Main Layout ───────────────────────────────────────────────────── */
export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        style={{ flex: 1, minHeight: '100vh' }}
        className="md:ml-[232px] px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-8"
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <MobileNav />

      {/* Floating AI chat */}
      <AIChat />
    </div>
  )
}

/* ── Icons ─────────────────────────────────────────────────────────── */
function IcHome({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function IcFlame({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1 1 2 2 2 0-3-3-4 0-6Z"/>
      <path d="M9 14a3 3 0 1 0 6 0c0-1.5-1-3-3-4-2 1-3 2.5-3 4Z"/>
    </svg>
  )
}
function IcApple({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 7c0-2 1.5-4 4-4 0 2-1.5 4-4 4Z"/>
      <path d="M12 7c-3 0-6 2-6 6 0 5 4 9 6 9s6-4 6-9c0-4-3-6-6-6Z"/>
    </svg>
  )
}
function IcCheck({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )
}
function IcGear({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
