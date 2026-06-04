import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { CalendarDays, ChevronLeft, ChevronRight, Circle, CheckCircle2, Dumbbell } from 'lucide-react'
import { toLocalDateStr } from '../../lib/dateUtils'

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = {
  pt: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
}
const DAY_SHORT = {
  pt: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
}
const PRIORITY_COLOR = { alta: '#ef4444', media: '#f59e0b', baixa: '#64748b' }

// weekday abbreviation → JS getDay() (0=Sun)
const WEEKDAY_JS = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 }

const SPORTS = {
  academia:  { emoji: '🏋️', color: '#f97316' },
  jiujitsu:  { emoji: '🥋', color: '#8b5cf6' },
  corrida:   { emoji: '🏃', color: '#10b981' },
  futebol:   { emoji: '⚽', color: '#3b82f6' },
  bicicleta: { emoji: '🚴', color: '#f59e0b' },
}

function sportOf(w) {
  return SPORTS[w.sport || 'academia'] || SPORTS.academia
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Calendar() {
  const { user }              = useAuth()
  const { primary, language } = useSettings()
  const isEn = language === 'en'

  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selected,  setSelected]  = useState(null)
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768)

  const [tasks,            setTasks]            = useState([])
  const [workoutsDue,      setWorkoutsDue]      = useState([])   // workouts with due_date
  const [workoutsRecurring, setWorkoutsRecurring] = useState([]) // workouts with repeat_days
  const [loading, setLoading] = useState(true)

  const todayStr = toLocalDateStr(now)
  const monthNames = MONTH_NAMES[language] || MONTH_NAMES.pt
  const dayNames   = DAY_SHORT[language]   || DAY_SHORT.pt

  const mm   = String(viewMonth + 1).padStart(2, '0')
  const last = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth  = last

  const dayStr = d =>
    `${viewYear}-${mm}-${String(d).padStart(2, '0')}`

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /* ── Fetch all data for this month ──────────────────────────── */
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const rangeStart = `${viewYear}-${mm}-01`
    const rangeEnd   = `${viewYear}-${mm}-${String(last).padStart(2, '0')}`

    Promise.all([
      // Tasks with due_date in this month
      supabase.from('tasks').select('*')
        .eq('user_id', user.id)
        .not('due_date', 'is', null)
        .gte('due_date', rangeStart)
        .lte('due_date', rangeEnd)
        .order('due_date'),

      // Workouts with due_date in this month
      supabase.from('workouts').select('*')
        .eq('user_id', user.id)
        .not('due_date', 'is', null)
        .gte('due_date', rangeStart)
        .lte('due_date', rangeEnd)
        .order('due_date'),

      // Recurring workouts (any date) with repeat_days set
      supabase.from('workouts').select('*')
        .eq('user_id', user.id)
        .not('repeat_days', 'is', null),
    ]).then(([tasksRes, wDueRes, wRepeatRes]) => {
      setTasks(tasksRes.data || [])
      setWorkoutsDue(wDueRes.data || [])
      setWorkoutsRecurring(wRepeatRes.data || [])
      setLoading(false)
    })
  }, [user, viewYear, viewMonth])

  /* ── Build byDay map: day → [items] ─────────────────────────── */
  const byDay = {}
  const addItem = (day, item) => {
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(item)
  }

  tasks.forEach(t => {
    if (!t.due_date) return
    const d = parseInt(t.due_date.split('-')[2], 10)
    addItem(d, { ...t, _type: 'task' })
  })

  workoutsDue.forEach(w => {
    if (!w.due_date) return
    const d = parseInt(w.due_date.split('-')[2], 10)
    addItem(d, { ...w, _type: 'workout' })
  })

  // Recurring workouts: appear on every matching weekday of the month
  workoutsRecurring.forEach(w => {
    let days
    try { days = JSON.parse(w.repeat_days) } catch { return }
    if (!days || !days.length) return
    const jsWeekdays = days.map(d => WEEKDAY_JS[d]).filter(n => n !== undefined)
    for (let d = 1; d <= daysInMonth; d++) {
      const wday = new Date(viewYear, viewMonth, d).getDay()
      if (jsWeekdays.includes(wday)) {
        // avoid duplicating if also has a due_date on this day
        const exists = byDay[d]?.some(i => i.id === w.id && i._type === 'workout')
        if (!exists) addItem(d, { ...w, _type: 'workout', _recurring: true })
      }
    }
  })

  /* ── Navigation ──────────────────────────────────────────────── */
  const prevMonth = () => {
    setSelected(null)
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    setSelected(null)
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const navBtn = (onClick, icon) => (
    <button onClick={onClick} style={{
      width: 34, height: 34, borderRadius: 10,
      background: 'var(--input-bg)', border: '1px solid var(--border-md)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: 'var(--text-dim)',
    }}>
      {icon}
    </button>
  )

  /* ── Selected day items ──────────────────────────────────────── */
  const selectedItems   = selected ? (byDay[selected] || []) : []
  const selectedTasks   = selectedItems.filter(i => i._type === 'task')
  const selectedWorkouts = selectedItems.filter(i => i._type === 'workout')

  /* ── Upcoming list (no selection) — sorted by due_date ──────── */
  const allDatedItems = [
    ...tasks.map(t => ({ ...t, _type: 'task' })),
    ...workoutsDue.map(w => ({ ...w, _type: 'workout' })),
  ].sort((a, b) => a.due_date > b.due_date ? 1 : -1)

  const hasAny = tasks.length > 0 || workoutsDue.length > 0 || workoutsRecurring.length > 0

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <CalendarDays style={{ color: primary }} size={isMobile ? 24 : 26} />
          {isEn ? 'Calendar' : 'Calendário'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          {isEn ? 'Tasks, workouts and appointments' : 'Tarefas, treinos e compromissos'}
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: isMobile ? 10 : 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { dot: '#ef4444', label: isEn ? 'High priority task' : 'Tarefa alta' },
          { dot: '#f59e0b', label: isEn ? 'Medium task' : 'Tarefa média' },
          { dot: '#64748b', label: isEn ? 'Low task' : 'Tarefa baixa' },
          { dot: primary,   label: isEn ? 'Workout' : 'Treino', square: true },
        ].map(({ dot, label, square }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 7, height: 7, background: dot, flexShrink: 0,
              borderRadius: square ? 2 : '50%',
            }} />
            <span style={{ fontSize: isMobile ? 10.5 : 11.5, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? 16 : 20, padding: isMobile ? '16px 12px' : '20px 16px', marginBottom: 20 }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 18 }}>
          {navBtn(prevMonth, <ChevronLeft size={17} />)}
          <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {monthNames[viewMonth]} {viewYear}
          </span>
          {navBtn(nextMonth, <ChevronRight size={17} />)}
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 1 : 2, marginBottom: 4 }}>
          {dayNames.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: isMobile ? 9.5 : 10.5, fontWeight: 600,
              color: 'var(--text-faint)', textTransform: 'uppercase',
              letterSpacing: '0.05em', padding: isMobile ? '2px 0' : '4px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 1 : 2 }}>
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const items   = byDay[day] || []
            const isToday = dayStr(day) === todayStr
            const isSel   = selected === day
            const hasItems = items.length > 0

            // Collect dots: tasks by priority color, workouts as square/primary
            const dots = items.slice(0, isMobile ? 2 : 4).map(item =>
              item._type === 'task'
                ? { color: PRIORITY_COLOR[item.priority] || primary, square: false }
                : { color: sportOf(item).color, square: true }
            )

            return (
              <div
                key={day}
                onClick={() => hasItems && setSelected(isSel ? null : day)}
                style={{
                  minHeight: isMobile ? 44 : 54,
                  borderRadius: isMobile ? 8 : 10,
                  padding: isMobile ? '6px 2px 4px' : '7px 4px 5px',
                  cursor: hasItems ? 'pointer' : 'default',
                  background: isSel
                    ? `color-mix(in srgb, var(--primary) 14%, transparent)`
                    : isToday ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: isSel
                    ? `1.5px solid color-mix(in srgb, var(--primary) 55%, transparent)`
                    : isToday ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid transparent',
                  transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{
                  fontSize: isMobile ? 11 : 12.5, fontWeight: isToday ? 700 : 400,
                  color: isToday ? primary : isSel ? primary : 'var(--text-dim)',
                  lineHeight: 1, width: isMobile ? 20 : 24, height: isMobile ? 20 : 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: isToday && !isSel ? `color-mix(in srgb, var(--primary) 18%, transparent)` : 'transparent',
                }}>
                  {day}
                </span>

                {dots.length > 0 && (
                  <div style={{ display: 'flex', gap: isMobile ? 1 : 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: isMobile ? 28 : 32 }}>
                    {dots.map((dot, di) => (
                      <div key={di} style={{
                        width: isMobile ? 4 : 5, height: isMobile ? 4 : 5, flexShrink: 0,
                        background: dot.color,
                        borderRadius: dot.square ? 1.5 : '50%',
                      }} />
                    ))}
                    {items.length > (isMobile ? 2 : 4) && (
                      <span style={{ fontSize: isMobile ? 6.5 : 7.5, color: 'var(--text-faint)', lineHeight: 1 }}>
                        +{items.length - (isMobile ? 2 : 4)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selected && (
        <div style={{
          background: 'var(--surface)',
          border: `1px solid color-mix(in srgb, var(--primary) 30%, transparent)`,
          borderRadius: 20, padding: 20, marginBottom: 16,
          animation: 'fadeSlideUp 0.22s ease',
        }}>
          <h3 style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text-dim)',
            textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px',
          }}>
            {selected} {monthNames[viewMonth]} {viewYear}
            <span style={{ color: primary, marginLeft: 8 }}>·</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              {' '}{selectedItems.length} {isEn ? 'item(s)' : selectedItems.length === 1 ? 'item' : 'itens'}
            </span>
          </h3>

          {/* Tasks section */}
          {selectedTasks.length > 0 && (
            <div style={{ marginBottom: selectedWorkouts.length > 0 ? 16 : 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {isEn ? 'Tasks' : 'Tarefas'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedTasks.map(task => {
                  const pColor = PRIORITY_COLOR[task.priority] || primary
                  return (
                    <div key={task.id + '_t'} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 12,
                      background: task.done ? 'rgba(255,255,255,0.02)' : 'var(--input-bg)',
                      border: `1px solid ${task.done ? 'rgba(255,255,255,0.05)' : 'var(--border-md)'}`,
                      opacity: task.done ? 0.6 : 1,
                    }}>
                      {task.done
                        ? <CheckCircle2 size={17} style={{ color: primary, fill: `${primary}22`, flexShrink: 0 }} />
                        : <Circle size={17} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0, color: task.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p style={{ fontSize: 11.5, color: 'var(--text-faint)', margin: '2px 0 0' }}>{task.description}</p>
                        )}
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: pColor, background: `${pColor}18`, border: `1px solid ${pColor}44`, padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>
                        {task.priority === 'alta' ? (isEn ? 'High' : 'Alta') : task.priority === 'media' ? (isEn ? 'Medium' : 'Média') : (isEn ? 'Low' : 'Baixa')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Workouts section */}
          {selectedWorkouts.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {isEn ? 'Workouts' : 'Treinos'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedWorkouts.map((w, wi) => {
                  const sp = sportOf(w)
                  return (
                    <div key={w.id + '_w' + wi} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 12,
                      background: w.done ? 'rgba(255,255,255,0.02)' : 'var(--input-bg)',
                      border: `1px solid ${w.done ? 'rgba(255,255,255,0.05)' : 'var(--border-md)'}`,
                      opacity: w.done ? 0.6 : 1,
                    }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{sp.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0, color: w.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: w.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {w.name}
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                          {w.duration && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⏱ {w.duration} min</span>}
                          {w.sets     && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔁 {w.sets}x</span>}
                          {w.reps     && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⚡ {w.reps}</span>}
                          {w._recurring && <span style={{ fontSize: 10, color: 'rgba(160,130,255,0.9)', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', padding: '1px 6px', borderRadius: 5 }}>🔁 recorrente</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: sp.color, background: `${sp.color}18`, border: `1px solid ${sp.color}44`, padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>
                        {w.sport || 'academia'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasAny && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <CalendarDays size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontWeight: 500, color: 'var(--text-dim)', marginBottom: 4 }}>
            {isEn ? 'Nothing scheduled' : 'Nada agendado'}
          </p>
          <p style={{ fontSize: 13 }}>
            {isEn
              ? 'Add a date to tasks or workouts to see them here'
              : 'Adicione uma data em tarefas ou treinos para aparecerem aqui'}
          </p>
        </div>
      )}

      {/* Upcoming list (when no day selected) */}
      {!selected && allDatedItems.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            {isEn ? `Scheduled — ${monthNames[viewMonth]}` : `Agendados — ${monthNames[viewMonth]}`}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allDatedItems.map((item, idx) => {
              const [, mmm, dd] = item.due_date.split('-')
              const isTask = item._type === 'task'
              const accent = isTask ? (PRIORITY_COLOR[item.priority] || primary) : sportOf(item).color
              return (
                <div key={item.id + '_' + idx} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 12,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  opacity: item.done ? 0.5 : 1,
                }}>
                  {/* Date badge */}
                  <div style={{
                    flexShrink: 0, width: 38, height: 38, borderRadius: 10,
                    background: `${accent}15`, border: `1px solid ${accent}30`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: accent, lineHeight: 1 }}>{dd}</span>
                    <span style={{ fontSize: 8, color: accent, fontWeight: 600, textTransform: 'uppercase' }}>
                      {monthNames[parseInt(mmm, 10) - 1].slice(0, 3)}
                    </span>
                  </div>

                  {/* Icon */}
                  {isTask ? (
                    item.done
                      ? <CheckCircle2 size={18} style={{ color: accent, fill: `${accent}22`, flexShrink: 0 }} />
                      : <Circle size={18} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                  ) : (
                    <span style={{ fontSize: 18, flexShrink: 0 }}>
                      {sportOf(item).emoji}
                    </span>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13.5, fontWeight: 500, margin: 0,
                      color: item.done ? 'var(--text-muted)' : 'var(--text)',
                      textDecoration: item.done ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {isTask ? item.title : item.name}
                    </p>
                    {isTask && item.description && (
                      <p style={{ fontSize: 11.5, color: 'var(--text-faint)', margin: '1px 0 0' }}>{item.description}</p>
                    )}
                    {!isTask && item.duration && (
                      <p style={{ fontSize: 11.5, color: 'var(--text-faint)', margin: '1px 0 0' }}>⏱ {item.duration} min</p>
                    )}
                  </div>

                  <span style={{
                    fontSize: 10.5, fontWeight: 700, color: accent,
                    background: `${accent}18`, border: `1px solid ${accent}44`,
                    padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                  }}>
                    {isTask
                      ? (item.priority === 'alta' ? (isEn ? 'High' : 'Alta') : item.priority === 'media' ? (isEn ? 'Med' : 'Média') : (isEn ? 'Low' : 'Baixa'))
                      : (item.sport || 'academia')
                    }
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recurring workouts info */}
      {!selected && workoutsRecurring.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            {isEn ? 'Weekly recurring' : 'Treinos recorrentes semanais'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workoutsRecurring.map(w => {
              const sp = sportOf(w)
              let days = []
              try { days = JSON.parse(w.repeat_days) } catch {}
              return (
                <div key={w.id + '_r'} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 12,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{sp.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.name}
                    </p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      💪 {days.join(' · ')} &nbsp;·&nbsp; 😴 {
                        ['seg','ter','qua','qui','sex','sab','dom'].filter(d => !days.includes(d)).join(' · ')
                      }
                    </p>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(160,130,255,0.9)', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', padding: '2px 7px', borderRadius: 6 }}>
                    🔁 semanal
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  )
}
