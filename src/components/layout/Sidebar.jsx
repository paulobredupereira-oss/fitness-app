import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { getT } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { localToday, toLocalDateStr } from '../../lib/dateUtils'

/* ── Streak calculation ─────────────────────────────────────────────── */
/**
 * Given an array of date strings (YYYY-MM-DD), calculates:
 *  - current: consecutive days up to today (or yesterday)
 *  - record:  longest consecutive streak ever
 */
function calcStreak(dates) {
  if (!dates || dates.length === 0) return { current: 0, record: 0 }

  // Deduplicate and sort newest → oldest
  const sorted = [...new Set(dates)].sort().reverse()

  const today     = localToday()
  const yesterday = toLocalDateStr(new Date(Date.now() - 864e5))

  // ── Current streak (must start from today or yesterday) ──────────
  let current = 0
  if (sorted[0] === today || sorted[0] === yesterday) {
    current = 1
    for (let i = 1; i < sorted.length; i++) {
      const diffDays = Math.round(
        (new Date(sorted[i - 1]) - new Date(sorted[i])) / 864e5
      )
      if (diffDays === 1) current++
      else break
    }
  }

  // ── Personal record (max streak in full history) ─────────────────
  let record = current
  let run    = 1
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round(
      (new Date(sorted[i - 1]) - new Date(sorted[i])) / 864e5
    )
    if (diffDays === 1) {
      run++
    } else {
      record = Math.max(record, run)
      run = 1
    }
  }
  record = Math.max(record, run)

  return { current, record }
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function Sidebar() {
  const { user, signOut } = useAuth()
  const { primary, language } = useSettings()
  const navigate = useNavigate()
  const t = getT(language)

  const [streak, setStreak] = useState({ current: 0, record: 0 })

  const name     = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'
  const initials = name.slice(0, 2).toUpperCase()

  // Fetch activity dates from all 3 tables and compute streak
  useEffect(() => {
    if (!user) return
    async function fetchStreak() {
      const uid = user.id
      const [r1, r2, r3] = await Promise.all([
        supabase.from('tasks').select('date').eq('user_id', uid),
        supabase.from('workouts').select('date').eq('user_id', uid),
        supabase.from('meals').select('date').eq('user_id', uid),
      ])
      const dates = [
        ...(r1.data ?? []),
        ...(r2.data ?? []),
        ...(r3.data ?? []),
      ].map(r => r.date)

      setStreak(calcStreak(dates))
    }
    fetchStreak()
  }, [user])

  const navItems = [
    { to: '/dashboard',   icon: IconGrid,     label: t('nav.dashboard') },
    { to: '/treinos',     icon: IconFlame,    label: t('nav.workouts')  },
    { to: '/dieta',       icon: IconApple,    label: t('nav.nutrition') },
    { to: '/tarefas',     icon: IconChart,    label: t('nav.tasks')     },
    { to: '/calendario',  icon: IconCalendar, label: t('nav.calendar')  },
    { to: '/calculadora', icon: IconCalc,     label: t('nav.bmr')       },
    { to: '/perfil',      icon: IconUser,     label: t('nav.profile')   },
  ]

  return (
    <aside style={{
      width: 232, flexShrink: 0,
      padding: '24px 16px',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: 4,
      background: 'var(--sidebar-bg)',
      position: 'fixed', left: 0, top: 0, bottom: 0,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 24px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0a0a0a', fontWeight: 700, fontSize: 14,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.14)',
        }}>F</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          FitLife<span style={{ color: 'var(--text-faint)' }}>.</span>
        </div>
      </div>

      {/* Menu label */}
      <div style={{
        fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)',
        padding: '8px 10px 6px', letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>{t('nav.menu')}</div>

      {/* Nav items */}
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 10,
              background: isActive ? 'var(--nav-active-bg)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-dim)',
              fontSize: 13.5, fontWeight: isActive ? 500 : 450,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <Icon size={16} color={isActive ? primary : undefined} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: primary }} />}
            </div>
          )}
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />

      {/* Streak card */}
      <div style={{
        padding: 14, borderRadius: 14,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        marginBottom: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: 4, background: primary,
            boxShadow: streak.current > 0 ? `0 0 10px var(--primary-shadow, ${primary})` : 'none',
          }} />
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>{t('nav.streak')}</div>
        </div>

        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text)' }}>
          {streak.current}
          <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 4, fontWeight: 450 }}>
            {t('nav.streakDays')}
          </span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          {streak.current === 0
            ? (language === 'en' ? 'Log an activity to start!' : 'Registre algo para começar!')
            : `${t('nav.record')} ${streak.record} ${t('nav.streakDays')}`
          }
        </div>
      </div>

      {/* Settings link */}
      <NavLink to="/configuracoes" style={{ textDecoration: 'none' }}>
        {({ isActive }) => (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10,
            background: isActive ? 'var(--nav-active-bg)' : 'transparent',
            color: isActive ? 'var(--text)' : 'var(--text-dim)',
            fontSize: 13.5, fontWeight: isActive ? 500 : 450,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <IconSettings size={16} color={isActive ? primary : undefined} />
            <span style={{ flex: 1 }}>{t('nav.settings')}</span>
            {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: primary }} />}
          </div>
        )}
      </NavLink>

      {/* User + logout */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 10, marginTop: 4,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}>
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{
                width: '100%', height: '100%',
                background: primary, color: '#0a0a0a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>{initials}</div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
      </div>

      <button
        onClick={async () => { await signOut(); navigate('/login') }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 10, border: 0,
          background: 'transparent', color: 'var(--text-muted)',
          fontSize: 13, fontWeight: 450, cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit', width: '100%', transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <IconLogout size={16} />
        {t('nav.logout')}
      </button>
    </aside>
  )
}

/* ── Icons ─────────────────────────────────────────────────────────── */
function IconGrid({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function IconFlame({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1 1 2 2 2 0-3-3-4 0-6Z"/>
      <path d="M9 14a3 3 0 1 0 6 0c0-1.5-1-3-3-4-2 1-3 2.5-3 4Z"/>
    </svg>
  )
}
function IconApple({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7c0-2 1.5-4 4-4 0 2-1.5 4-4 4Z"/>
      <path d="M12 7c-3 0-6 2-6 6 0 5 4 9 6 9s6-4 6-9c0-4-3-6-6-6Z"/>
    </svg>
  )
}
function IconChart({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18"/><path d="M6 16v-4"/><path d="M11 16V8"/><path d="M16 16v-6"/>
    </svg>
  )
}
function IconUser({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
}
function IconCalendar({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function IconCalc({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="8" y2="10" strokeWidth="2.5"/>
      <line x1="12" y1="10" x2="12" y2="10" strokeWidth="2.5"/>
      <line x1="16" y1="10" x2="16" y2="10" strokeWidth="2.5"/>
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5"/>
      <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5"/>
      <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5"/>
      <line x1="8" y1="18" x2="12" y2="18" strokeWidth="2.5"/>
      <line x1="16" y1="18" x2="16" y2="18" strokeWidth="2.5"/>
    </svg>
  )
}
function IconSettings({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
function IconLogout({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <path d="m16 17 5-5-5-5"/>
      <path d="M21 12H9"/>
    </svg>
  )
}
