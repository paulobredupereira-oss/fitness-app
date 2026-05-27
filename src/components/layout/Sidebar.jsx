import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const PRIMARY = '#ff4d2e'
const ON_PRIMARY = '#0a0a0a'

const navItems = [
  { to: '/dashboard', icon: IconGrid, label: 'Dashboard' },
  { to: '/treinos', icon: IconFlame, label: 'Treinos' },
  { to: '/dieta', icon: IconApple, label: 'Nutrição' },
  { to: '/tarefas', icon: IconChart, label: 'Tarefas' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <aside style={{
      width: 232, flexShrink: 0,
      padding: '24px 16px',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', gap: 4,
      background: '#080808',
      position: 'fixed', left: 0, top: 0, bottom: 0,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 24px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: PRIMARY,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: ON_PRIMARY, fontWeight: 700, fontSize: 14,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.14)',
        }}>F</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: '#fafafa' }}>
          FitLife<span style={{ color: 'rgba(250,250,250,0.3)' }}>.</span>
        </div>
      </div>

      {/* Menu label */}
      <div style={{
        fontSize: 10.5, fontWeight: 500, color: 'rgba(250,250,250,0.32)',
        padding: '8px 10px 6px', letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>Menu</div>

      {/* Nav items */}
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 10,
              background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: isActive ? '#fafafa' : 'rgba(250,250,250,0.55)',
              fontSize: 13.5, fontWeight: isActive ? 500 : 450,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              <Icon size={16} active={isActive} />
              <span style={{ flex: 1 }}>{label}</span>
            </div>
          )}
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />

      {/* Streak card */}
      <div style={{
        padding: 14, borderRadius: 14,
        background: '#101010',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: PRIMARY, boxShadow: `0 0 10px ${PRIMARY}` }} />
          <div style={{ fontSize: 11, color: 'rgba(250,250,250,0.55)', fontWeight: 500 }}>Sequência</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: '#fafafa' }}>
          12<span style={{ fontSize: 14, color: 'rgba(250,250,250,0.4)', marginLeft: 4, fontWeight: 450 }}>dias</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(250,250,250,0.32)', marginTop: 6 }}>
          Recorde pessoal: 18 dias
        </div>
      </div>

      {/* User + logout */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: PRIMARY, color: ON_PRIMARY,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: 10.5, color: 'rgba(250,250,250,0.32)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
      </div>
      <button
        onClick={async () => { await signOut(); navigate('/login') }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 10, border: 0,
          background: 'transparent', color: 'rgba(250,250,250,0.4)',
          fontSize: 13, fontWeight: 450, cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit', width: '100%',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(250,250,250,0.4)'}
      >
        <IconLogout size={16} />
        Sair
      </button>
    </aside>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────
function IconGrid({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function IconFlame({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1 1 2 2 2 0-3-3-4 0-6Z"/>
      <path d="M9 14a3 3 0 1 0 6 0c0-1.5-1-3-3-4-2 1-3 2.5-3 4Z"/>
    </svg>
  )
}
function IconApple({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7c0-2 1.5-4 4-4 0 2-1.5 4-4 4Z"/>
      <path d="M12 7c-3 0-6 2-6 6 0 5 4 9 6 9s6-4 6-9c0-4-3-6-6-6Z"/>
    </svg>
  )
}
function IconChart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18"/><path d="M6 16v-4"/><path d="M11 16V8"/><path d="M16 16v-6"/>
    </svg>
  )
}
function IconLogout({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>
    </svg>
  )
}
