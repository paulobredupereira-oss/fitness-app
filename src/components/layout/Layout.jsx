import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import AIChat from '../ui/AIChat'
import { useSettings } from '../../contexts/SettingsContext'

/* ── Short labels for mobile radial menu ─────────────────────────── */
const SHORT = {
  pt: { dashboard: 'Início', workouts: 'Treino', nutrition: 'Dieta', tasks: 'Tarefas', calendar: 'Agenda', bmr: 'TMB', settings: 'Config' },
  en: { dashboard: 'Home',   workouts: 'Workout', nutrition: 'Diet', tasks: 'Tasks',   calendar: 'Calendar', bmr: 'BMR', settings: 'Settings' },
}

/* ── Radial menu geometry ────────────────────────────────────────── */
const R = 125   // radius in px (increased for 7 items)

/** Returns (x, y) pixel offset from center for a given angle in degrees */
function polar(deg) {
  const rad = (deg * Math.PI) / 180
  return {
    x: Math.round(Math.cos(rad) * R),
    y: Math.round(-Math.sin(rad) * R),   // negative: screen Y grows downward
  }
}

// 7 slots spread from 0° (right/3-o'clock) to 180° (left/9-o'clock) — 30° each
// Animation stagger goes 0° → 180°, which is clockwise on screen
const ANGLES = [0, 30, 60, 90, 120, 150, 180]

/* ── Mobile Radial Nav ───────────────────────────────────────────── */
function MobileNav() {
  const [open, setOpen] = useState(false)
  const { primary, language } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const labels = SHORT[language] || SHORT.pt

  const items = [
    { to: '/dashboard',     label: labels.dashboard, Icon: IcHome     },
    { to: '/treinos',       label: labels.workouts,  Icon: IcFlame    },
    { to: '/dieta',         label: labels.nutrition, Icon: IcApple    },
    { to: '/tarefas',       label: labels.tasks,     Icon: IcCheck    },
    { to: '/calendario',    label: labels.calendar,  Icon: IcCalendar },
    { to: '/calculadora',   label: labels.bmr,       Icon: IcCalc     },
    { to: '/configuracoes', label: labels.settings,  Icon: IcGear     },
  ]

  const handleNav = (to) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <>
      {/* ── Blur backdrop ────────────────────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        className="md:hidden"
        style={{
          position: 'fixed', inset: 0, zIndex: 190,
          background: 'rgba(0,0,0,0.58)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
      />

      {/* ── FAB + radial items ───────────────────────────────────── */}
      {/* Zero-size anchor at bottom-center; items absolutely overflow from here */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          bottom: 30,
          left: '50%',
          width: 0, height: 0,
          zIndex: 200,
          /* DO NOT set display here — md:hidden controls it via Tailwind */
        }}
      >
        {/* Radial items */}
        {items.map((item, i) => {
          const { x, y } = polar(ANGLES[i])
          const isActive = location.pathname === item.to

          // Clockwise stagger: index 0 (right, 0°) appears first, index 5 (left, 180°) last
          const openDelay  = i * 48           // 0 → 240 ms
          const closeDelay = (5 - i) * 28     // reversed for closing

          return (
            <div
              key={item.to}
              style={{
                position: 'absolute',
                left: 0, top: 0,
                /* Center the item on its anchor point, then offset by polar coords */
                transform: open
                  ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`
                  : `translate(-50%, -50%) scale(0.2)`,
                opacity: open ? 1 : 0,
                transition: open
                  ? `transform 0.44s ${openDelay}ms cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ${openDelay}ms ease`
                  : `transform 0.18s ${closeDelay}ms ease-in, opacity 0.14s ${closeDelay}ms ease`,
                pointerEvents: open ? 'auto' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                willChange: 'transform, opacity',
              }}
            >
              {/* Circle button */}
              <button
                onClick={() => handleNav(item.to)}
                style={{
                  width: 50, height: 50,
                  borderRadius: '50%',
                  background: isActive ? primary : 'rgba(18,18,18,0.95)',
                  border: `2px solid ${isActive ? primary : 'rgba(255,255,255,0.13)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: isActive
                    ? `0 0 0 4px ${primary}22, 0 4px 18px ${primary}50`
                    : '0 4px 16px rgba(0,0,0,0.55)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <item.Icon
                  size={20}
                  style={{ color: isActive ? '#0a0a0a' : 'rgba(255,255,255,0.78)' }}
                />
              </button>

              {/* Label */}
              <span style={{
                fontSize: 9.5, fontWeight: 700,
                color: isActive ? primary : 'rgba(255,255,255,0.88)',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 5px rgba(0,0,0,0.95)',
                lineHeight: 1,
                userSelect: 'none',
              }}>
                {item.label}
              </span>
            </div>
          )
        })}

        {/* ── Central play FAB ─────────────────────────────────── */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          style={{
            position: 'absolute',
            left: 0, top: 0,
            transform: 'translate(-50%, -50%)',
            width: 60, height: 60,
            borderRadius: '50%',
            background: open ? 'rgba(30,30,30,0.95)' : primary,
            border: open ? `2px solid rgba(255,255,255,0.18)` : '2px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', outline: 'none',
            boxShadow: open
              ? '0 4px 16px rgba(0,0,0,0.5)'
              : `0 4px 22px ${primary}55, 0 0 0 7px ${primary}1a`,
            transition: 'background 0.25s, border 0.25s, box-shadow 0.28s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Icon rotates clockwise to indicate open state */}
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <IcPlay
              size={24}
              style={{ color: open ? 'rgba(255,255,255,0.9)' : '#0a0a0a' }}
            />
          </span>
        </button>
      </div>
    </>
  )
}

/* ── Main Layout ─────────────────────────────────────────────────── */
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

      {/* Mobile radial nav — hidden on desktop */}
      <MobileNav />

      {/* Floating AI chat */}
      <AIChat />
    </div>
  )
}

/* ── Icons ───────────────────────────────────────────────────────── */
function IcPlay({ size = 24, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      {/* Slightly inset play triangle for optical balance */}
      <polygon points="7,4 20,12 7,20" />
    </svg>
  )
}
function IcCalendar({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function IcHome({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function IcFlame({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1 1 2 2 2 0-3-3-4 0-6Z"/>
      <path d="M9 14a3 3 0 1 0 6 0c0-1.5-1-3-3-4-2 1-3 2.5-3 4Z"/>
    </svg>
  )
}
function IcApple({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 7c0-2 1.5-4 4-4 0 2-1.5 4-4 4Z"/>
      <path d="M12 7c-3 0-6 2-6 6 0 5 4 9 6 9s6-4 6-9c0-4-3-6-6-6Z"/>
    </svg>
  )
}
function IcCheck({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )
}
function IcCalc({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <circle cx="8"  cy="10" r="0.6" fill="currentColor"/>
      <circle cx="12" cy="10" r="0.6" fill="currentColor"/>
      <circle cx="16" cy="10" r="0.6" fill="currentColor"/>
      <circle cx="8"  cy="14" r="0.6" fill="currentColor"/>
      <circle cx="12" cy="14" r="0.6" fill="currentColor"/>
      <circle cx="16" cy="14" r="0.6" fill="currentColor"/>
      <line x1="8" y1="18" x2="12" y2="18"/>
      <circle cx="16" cy="18" r="0.6" fill="currentColor"/>
    </svg>
  )
}
function IcGear({ size = 22, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
