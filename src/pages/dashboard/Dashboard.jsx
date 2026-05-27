import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'

// ── Design tokens ────────────────────────────────────────────────────────────
const P = '#ff4d2e'          // primary (red/orange)
const ON_P = '#0a0a0a'
const BG = '#0a0a0a'
const SURFACE = '#141414'
const SURFACE2 = '#1c1c1c'
const BORDER = 'rgba(255,255,255,0.08)'
const BORDER2 = 'rgba(255,255,255,0.14)'
const TEXT = '#fafafa'
const MUTED = 'rgba(250,250,250,0.55)'
const MUTED2 = 'rgba(250,250,250,0.32)'
const RADIUS = 18

// ── SVG icons ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = 'currentColor' }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'play':   return <svg {...p} fill={color} stroke="none"><path d="M7 5v14l12-7L7 5Z"/></svg>
    case 'check':  return <svg {...p} strokeWidth={2.5}><path d="m5 12 5 5 9-10"/></svg>
    case 'flame':  return <svg {...p}><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1 1 2 2 2 0-3-3-4 0-6Z"/><path d="M9 14a3 3 0 1 0 6 0c0-1.5-1-3-3-4-2 1-3 2.5-3 4Z"/></svg>
    case 'clock':  return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    case 'heart':  return <svg {...p}><path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c-2 4.5-9 9-9 9Z"/></svg>
    case 'drop':   return <svg {...p}><path d="M12 3c2 4 6 7 6 11a6 6 0 0 1-12 0c0-4 4-7 6-11Z"/></svg>
    case 'arrow':  return <svg {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
    case 'dumbbell': return <svg {...p}><path d="M3 9v6"/><path d="M21 9v6"/><path d="M6 6v12"/><path d="M18 6v12"/><path d="M6 12h12"/></svg>
    case 'tasks':  return <svg {...p}><path d="M9 12l2 2 4-4"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
    case 'food':   return <svg {...p}><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
    default: return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>
  }
}

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, suffix, delta, deltaUp, icon }) => (
  <div style={{ background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 500 }}>{label}</div>
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED,
      }}>
        <Icon name={icon} size={13} />
      </div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: TEXT }}>
      {value}
      {suffix && <span style={{ fontSize: 13, color: MUTED, marginLeft: 3, fontWeight: 450 }}>{suffix}</span>}
    </div>
    <div style={{ marginTop: 8, fontSize: 11.5, color: deltaUp ? '#3ec47a' : MUTED2, display: 'flex', alignItems: 'center', gap: 4 }}>
      {deltaUp && <span>↗</span>}{delta}
    </div>
  </div>
)

// ── Bar Chart ────────────────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const max = Math.max(...data, 1)
  const H = 160
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: 14, height: H, padding: '8px 0' }}>
      {days.map((d, i) => {
        const v = data[i] || 0
        const h = (v / max) * (H - 30)
        const isToday = i === todayIdx
        const has = v > 0
        return (
          <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'end', justifyContent: 'center', position: 'relative' }}>
              {isToday && v > 0 && (
                <div style={{ position: 'absolute', top: -2, fontSize: 11, fontWeight: 600, color: TEXT, fontVariantNumeric: 'tabular-nums' }}>
                  {v}<span style={{ color: MUTED, fontWeight: 400, fontSize: 9.5, marginLeft: 1 }}>m</span>
                </div>
              )}
              <div style={{
                width: '70%', maxWidth: 36, height: Math.max(has ? h : 4, 4), borderRadius: 6,
                background: has ? (isToday ? P : 'rgba(255,255,255,0.14)') : 'transparent',
                border: !has ? `1.5px dashed ${MUTED2}` : 'none',
                marginTop: isToday && v > 0 ? 18 : 0,
              }} />
            </div>
            <div style={{ fontSize: 11, color: isToday ? TEXT : MUTED, fontWeight: isToday ? 600 : 400 }}>{d}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Nutrition Rings ──────────────────────────────────────────────────────────
const Rings = ({ pct = 71 }) => {
  const rings = [
    { r: 38, pct: pct / 100, color: P },
    { r: 28, pct: pct / 100 * 0.77, color: `${P}aa` },
    { r: 18, pct: pct / 100 * 0.56, color: `${P}55` },
  ]
  return (
    <div style={{ width: 96, height: 96, position: 'relative', flexShrink: 0 }}>
      <svg viewBox="0 0 96 96" width="96" height="96">
        {rings.map((r, i) => {
          const c = 2 * Math.PI * r.r
          return (
            <g key={i}>
              <circle cx="48" cy="48" r={r.r} fill="none" stroke={BORDER2} strokeWidth="6" />
              <circle cx="48" cy="48" r={r.r} fill="none" stroke={r.color} strokeWidth="6"
                strokeDasharray={`${c * r.pct} ${c}`} strokeDashoffset={c * 0.25}
                strokeLinecap="round" transform="rotate(-90 48 48)" />
            </g>
          )
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: TEXT, fontSize: 16, fontWeight: 600, letterSpacing: '-0.03em',
      }}>{pct}%</div>
    </div>
  )
}

// ── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ title, subtitle, action, children, compact, inverted }) => {
  const bg = inverted ? TEXT : SURFACE
  const tx = inverted ? BG : TEXT
  const mt = inverted ? MUTED2.replace('250,250,250', '10,10,10') : MUTED
  const mt2 = inverted ? 'rgba(10,10,10,0.32)' : MUTED2
  const bd = inverted ? 'transparent' : BORDER
  return (
    <div style={{
      background: bg, borderRadius: RADIUS,
      border: `1px solid ${bd}`,
      padding: compact ? 18 : 24,
      color: tx,
    }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: compact ? 12 : 18 }}>
          <div>
            {title && <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 11.5, color: mt2, marginTop: 3 }}>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Mobile bottom tab bar ────────────────────────────────────────────────────
const MobileTabBar = () => (
  <div style={{
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
    padding: '8px 16px 28px',
    background: 'linear-gradient(to top, rgba(10,10,10,0.97) 60%, rgba(10,10,10,0))',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  }}>
    <div style={{
      background: SURFACE, borderRadius: 22, border: `1px solid ${BORDER}`,
      padding: '8px 10px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
    }}>
      {[
        { to: '/dashboard', icon: 'tasks', label: 'Hoje' },
        { to: '/treinos', icon: 'flame', label: 'Treinos' },
        { fab: true },
        { to: '/dieta', icon: 'food', label: 'Dieta' },
        { to: '/tarefas', icon: 'dumbbell', label: 'Metas' },
      ].map((tab, i) => {
        if (tab.fab) return (
          <Link key={i} to="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: P, color: ON_P,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px ${P}55`,
            }}>
              <Icon name="play" size={18} color={ON_P} />
            </div>
          </Link>
        )
        return (
          <Link key={i} to={tab.to} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 12px', borderRadius: 10, color: MUTED2,
            }}>
              <Icon name={tab.icon} size={18} color={MUTED2} />
              <span style={{ fontSize: 9.5, fontWeight: 500, fontFamily: 'inherit', color: MUTED2 }}>{tab.label}</span>
            </div>
          </Link>
        )
      })}
    </div>
  </div>
)

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ tasks: { done: 0, total: 0 }, meals: { done: 0, total: 0 }, workouts: { done: 0, total: 0 } })
  const [weeklyMins, setWeeklyMins] = useState([0, 0, 0, 0, 0, 0, 0])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const today = new Date().toISOString().split('T')[0]
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Atleta'

  const getGreeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  }

  const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^\w/, c => c.toUpperCase())

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      // Get current week's dates
      const now = new Date()
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - dayOfWeek)
      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        return d.toISOString().split('T')[0]
      })

      const [tasksRes, mealsRes, workoutsRes] = await Promise.all([
        supabase.from('tasks').select('done').eq('user_id', user.id).eq('date', today),
        supabase.from('meals').select('done').eq('user_id', user.id).eq('date', today),
        supabase.from('workouts').select('done, duration, date').eq('user_id', user.id).gte('date', weekDates[0]),
      ])

      const todayWorkouts = (workoutsRes.data || []).filter(w => w.date === today)
      setStats({
        tasks: { done: (tasksRes.data || []).filter(t => t.done).length, total: (tasksRes.data || []).length },
        meals: { done: (mealsRes.data || []).filter(m => m.done).length, total: (mealsRes.data || []).length },
        workouts: { done: todayWorkouts.filter(w => w.done).length, total: todayWorkouts.length },
      })

      // Weekly minutes
      const mins = weekDates.map(date => {
        const dayW = (workoutsRes.data || []).filter(w => w.date === date && w.done && w.duration)
        return dayW.reduce((s, w) => s + (w.duration || 0), 0)
      })
      setWeeklyMins(mins)
      setLoading(false)
    }
    fetchData()
  }, [user, today])

  const totalDone = stats.tasks.done + stats.meals.done + stats.workouts.done
  const totalItems = stats.tasks.total + stats.meals.total + stats.workouts.total
  const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0
  const mealsPct = stats.meals.total > 0 ? Math.round((stats.meals.done / stats.meals.total) * 100) : 0

  // ── Mobile Layout ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ background: BG, minHeight: '100vh', color: TEXT, fontFamily: '"Geist", system-ui, sans-serif', paddingBottom: 110 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: P, color: ON_P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
              {name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED2, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{dateLabel.split(',')[0]}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Olá, {name.split(' ')[0]}</div>
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ padding: '0 20px 20px' }}>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.05 }}>
            {getGreeting()},<br />vamos lá! 💪
          </h1>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>
            {totalItems > 0
              ? `${totalDone} de ${totalItems} itens concluídos hoje.`
              : 'Adicione tarefas, refeições e treinos para começar.'}
          </div>
        </div>

        {/* Hero workout card */}
        <div style={{ padding: '0 20px' }}>
          <div style={{ borderRadius: 22, background: TEXT, color: BG, padding: 20, position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 350 200" style={{ position: 'absolute', inset: 0, opacity: 0.07 }} preserveAspectRatio="none">
              <circle cx="320" cy="40" r="90" fill="none" stroke={BG} strokeWidth="1" />
              <circle cx="320" cy="40" r="60" fill="none" stroke={BG} strokeWidth="1" />
              <circle cx="320" cy="40" r="32" fill={BG} />
            </svg>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle at center, ${P}40, transparent 65%)` }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: P }} />
                <span style={{ fontSize: 10.5, color: 'rgba(10,10,10,0.55)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Treino de Hoje</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 6 }}>
                {stats.workouts.total > 0 ? `${stats.workouts.done} exercícios feitos` : 'Nenhum treino hoje'}
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(10,10,10,0.55)', marginBottom: 16 }}>
                {stats.workouts.total > 0 ? `${stats.workouts.total - stats.workouts.done} restantes` : 'Adicione exercícios para começar'}
              </div>
              {stats.workouts.total > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(10,10,10,0.12)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stats.workouts.total > 0 ? Math.round(stats.workouts.done / stats.workouts.total * 100) : 0}%`, background: P, borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'rgba(10,10,10,0.5)' }}>
                    <span>{stats.workouts.done} de {stats.workouts.total}</span>
                    <span>{Math.round(stats.workouts.done / (stats.workouts.total || 1) * 100)}%</span>
                  </div>
                </div>
              )}
              <Link to="/treinos" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: P, color: ON_P, borderRadius: 12, padding: '13px 18px',
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
              }}>
                <Icon name="play" size={13} color={ON_P} />
                {stats.workouts.total > 0 ? 'Ver treinos' : 'Adicionar treino'}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats 2x2 */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: 14 }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 500, marginBottom: 8 }}>Tarefas</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.035em' }}>{stats.tasks.done}<span style={{ fontSize: 13, color: MUTED, marginLeft: 2 }}>/{stats.tasks.total}</span></div>
              <div style={{ fontSize: 10.5, color: stats.tasks.done > 0 ? '#3ec47a' : MUTED2, marginTop: 5 }}>
                {stats.tasks.done > 0 ? '↗ ' : ''}{stats.tasks.total > 0 ? `${Math.round(stats.tasks.done / stats.tasks.total * 100)}%` : 'Nenhuma'}
              </div>
            </div>
            <div style={{ background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: 14 }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 500, marginBottom: 8 }}>Refeições</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.035em' }}>{stats.meals.done}<span style={{ fontSize: 13, color: MUTED, marginLeft: 2 }}>/{stats.meals.total}</span></div>
              <div style={{ fontSize: 10.5, color: stats.meals.done > 0 ? '#3ec47a' : MUTED2, marginTop: 5 }}>
                {stats.meals.done > 0 ? '↗ ' : ''}{stats.meals.total > 0 ? `${mealsPct}% dieta` : 'Nenhuma'}
              </div>
            </div>
            <div style={{ background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: 14 }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 500, marginBottom: 8 }}>Exercícios</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.035em' }}>{stats.workouts.done}<span style={{ fontSize: 13, color: MUTED, marginLeft: 2 }}>/{stats.workouts.total}</span></div>
              <div style={{ fontSize: 10.5, color: stats.workouts.done > 0 ? '#3ec47a' : MUTED2, marginTop: 5 }}>
                {stats.workouts.done > 0 ? '↗ ' : ''}{stats.workouts.total > 0 ? `${Math.round(stats.workouts.done / stats.workouts.total * 100)}%` : 'Nenhum'}
              </div>
            </div>
            <div style={{ background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: 14 }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 500, marginBottom: 8 }}>Total hoje</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.035em' }}>{overallPct}<span style={{ fontSize: 13, color: MUTED, marginLeft: 1 }}>%</span></div>
              <div style={{ fontSize: 10.5, color: overallPct > 50 ? '#3ec47a' : MUTED2, marginTop: 5 }}>
                {overallPct > 0 ? '↗ ' : ''}{totalDone}/{totalItems} itens
              </div>
            </div>
          </div>
        </div>

        {/* Weekly chart */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>Atividade semanal</div>
            <div style={{ fontSize: 11, color: MUTED2, marginBottom: 14 }}>Minutos de treino por dia</div>
            <BarChart data={weeklyMins} />
          </div>
        </div>

        <MobileTabBar />
      </div>
    )
  }

  // ── Desktop Layout ───────────────────────────────────────────────────────
  return (
    <Layout>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 28, gap: 24 }}>
        <div>
          <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {dateLabel}
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 600, margin: '6px 0 6px', letterSpacing: '-0.035em', lineHeight: 1.05, color: TEXT }}>
            {getGreeting()}, {name.split(' ')[0]}.
          </h1>
          <div style={{ fontSize: 14, color: MUTED, maxWidth: 480 }}>
            {totalItems > 0
              ? `${totalDone} de ${totalItems} itens concluídos. Continue assim! 🔥`
              : 'Adicione tarefas, refeições e treinos para acompanhar seu progresso.'}
          </div>
        </div>
        <Link to="/treinos" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: P, color: ON_P, borderRadius: 12, padding: '12px 20px',
          fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
          boxShadow: `0 1px 0 rgba(255,255,255,0.3) inset, 0 6px 20px ${P}40`,
          flexShrink: 0,
        }}>
          <Icon name="play" size={14} color={ON_P} />
          Iniciar treino
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard label="Tarefas" value={`${stats.tasks.done}/${stats.tasks.total}`} delta={stats.tasks.total > 0 ? `${Math.round(stats.tasks.done / stats.tasks.total * 100)}% concluído` : 'Nenhuma hoje'} deltaUp={stats.tasks.done > 0} icon="tasks" />
        <StatCard label="Refeições" value={`${stats.meals.done}/${stats.meals.total}`} delta={stats.meals.total > 0 ? `${mealsPct}% dieta` : 'Nenhuma hoje'} deltaUp={stats.meals.done > 0} icon="food" />
        <StatCard label="Exercícios" value={`${stats.workouts.done}/${stats.workouts.total}`} delta={stats.workouts.total > 0 ? `${Math.round(stats.workouts.done / (stats.workouts.total || 1) * 100)}% treino` : 'Nenhum hoje'} deltaUp={stats.workouts.done > 0} icon="dumbbell" />
        <StatCard label="Progresso geral" value={`${overallPct}`} suffix="%" delta={`${totalDone} de ${totalItems} itens`} deltaUp={overallPct > 50} icon="chart" />
      </div>

      {/* Main 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Today's workout */}
          <Card title="Treino de Hoje" subtitle={stats.workouts.total > 0 ? `${stats.workouts.done} de ${stats.workouts.total} exercícios · ${Math.round(stats.workouts.done / (stats.workouts.total || 1) * 100)}%` : 'Nenhum exercício adicionado'}>
            {stats.workouts.total === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💪</div>
                <p style={{ color: MUTED, fontSize: 13 }}>Adicione exercícios para hoje</p>
                <Link to="/treinos" style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', background: P, color: ON_P, borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  + Adicionar treino
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                <div style={{
                  width: 168, flexShrink: 0, borderRadius: 14,
                  background: `linear-gradient(135deg, ${P}, ${P}aa)`,
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'end', padding: 14, color: ON_P,
                }}>
                  <svg viewBox="0 0 168 168" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
                    <circle cx="130" cy="40" r="60" fill="none" stroke={ON_P} strokeWidth="1" />
                    <circle cx="130" cy="40" r="38" fill="none" stroke={ON_P} strokeWidth="1" />
                    <circle cx="130" cy="40" r="18" fill={ON_P} />
                  </svg>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>Hoje</div>
                    <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 4 }}>
                      {stats.workouts.done > 0 ? 'Em progresso' : 'Pronto?'}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>{stats.workouts.done}/{stats.workouts.total} feitos</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 6, borderRadius: 3, background: BORDER2, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ height: '100%', width: `${Math.round(stats.workouts.done / (stats.workouts.total || 1) * 100)}%`, background: P, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                  <p style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>
                    {stats.workouts.done === stats.workouts.total && stats.workouts.total > 0
                      ? '🏆 Treino completo! Incrível!'
                      : `${stats.workouts.total - stats.workouts.done} exercício(s) restante(s)`}
                  </p>
                  <Link to="/treinos" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: P, color: ON_P, borderRadius: 10,
                    padding: '10px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}>
                    <Icon name="play" size={13} color={ON_P} />
                    {stats.workouts.done > 0 ? 'Continuar treino' : 'Começar treino'}
                  </Link>
                </div>
              </div>
            )}
          </Card>

          {/* Weekly chart */}
          <Card title="Atividade semanal" subtitle="Minutos de treino por dia">
            <BarChart data={weeklyMins} />
          </Card>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nutrition */}
          <Card title="Nutrição hoje" subtitle={stats.meals.total > 0 ? `${stats.meals.done} de ${stats.meals.total} refeições` : 'Nenhuma refeição planejada'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Rings pct={mealsPct} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Dieta seguida', pct: mealsPct },
                  { label: 'Refeições feitas', pct: stats.meals.total > 0 ? Math.round(stats.meals.done / stats.meals.total * 100) : 0 },
                  { label: 'Progresso geral', pct: overallPct },
                ].map((m, i) => (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: MUTED, fontWeight: 500 }}>{m.label}</span>
                      <span style={{ color: TEXT, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{m.pct}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: SURFACE2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${m.pct}%`, background: i === 0 ? P : i === 1 ? `${P}90` : `${P}55`, borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
                <Link to="/dieta" style={{ fontSize: 12, color: P, textDecoration: 'none', marginTop: 4, fontWeight: 500 }}>
                  Ver dieta →
                </Link>
              </div>
            </div>
          </Card>

          {/* Overall progress — inverted card */}
          <Card title="Progresso de Hoje" subtitle={`${totalDone} de ${totalItems} itens concluídos`} inverted>
            <div style={{ display: 'flex', gap: 5, marginTop: 4, marginBottom: 16 }}>
              {['Tarefas', 'Dieta', 'Treinos'].map((label, i) => {
                const vals = [
                  stats.tasks.total > 0 ? Math.round(stats.tasks.done / stats.tasks.total * 100) : 0,
                  mealsPct,
                  stats.workouts.total > 0 ? Math.round(stats.workouts.done / stats.workouts.total * 100) : 0,
                ]
                const pct = vals[i]
                return (
                  <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 48, borderRadius: 8, background: pct > 0 ? P : 'rgba(10,10,10,0.1)', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pct > 0 ? ON_P : 'rgba(10,10,10,0.3)' }}>{pct}%</span>
                    </div>
                    <span style={{ fontSize: 10.5, color: 'rgba(10,10,10,0.55)', fontWeight: 500 }}>{label}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 12, color: 'rgba(10,10,10,0.55)' }}>
                {overallPct === 100 ? '🏆 Dia perfeito!' : overallPct > 50 ? '🔥 Mais da metade!' : 'Continue assim!'}
              </p>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: BG }}>{overallPct}%</span>
            </div>
          </Card>

          {/* Quick links */}
          <Card title="Próximas sessões" subtitle="Sua agenda de hoje" compact>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/tarefas" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: SURFACE2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="tasks" size={17} color={TEXT} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>Tarefas pendentes</div>
                  <div style={{ fontSize: 11.5, color: MUTED2 }}>{stats.tasks.total - stats.tasks.done} restantes</div>
                </div>
                <Icon name="arrow" size={14} color={MUTED2} />
              </Link>
              <div style={{ height: 1, background: BORDER }} />
              <Link to="/dieta" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: SURFACE2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="food" size={17} color={TEXT} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>Próxima refeição</div>
                  <div style={{ fontSize: 11.5, color: MUTED2 }}>{stats.meals.total - stats.meals.done} refeições restantes</div>
                </div>
                <Icon name="arrow" size={14} color={MUTED2} />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
