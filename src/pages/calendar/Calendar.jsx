import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { CalendarDays, ChevronLeft, ChevronRight, Circle, CheckCircle2, Flag } from 'lucide-react'

const MONTH_NAMES = {
  pt: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
}
const DAY_SHORT = {
  pt: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
}
const PRIORITY_COLOR = {
  alta:  '#ef4444',
  media: '#f59e0b',
  baixa: '#64748b',
}

export default function Calendar() {
  const { user }              = useAuth()
  const { primary, language } = useSettings()
  const isEn = language === 'en'

  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())   // 0-indexed
  const [selected,  setSelected]  = useState(null)              // day number
  const [tasks,     setTasks]     = useState([])
  const [loading,   setLoading]   = useState(true)

  const todayStr = now.toISOString().split('T')[0]

  /* ── Fetch tasks with due_date in the visible month ─────────── */
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const mm   = String(viewMonth + 1).padStart(2, '0')
    const last = new Date(viewYear, viewMonth + 1, 0).getDate()
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .not('due_date', 'is', null)
      .gte('due_date', `${viewYear}-${mm}-01`)
      .lte('due_date', `${viewYear}-${mm}-${String(last).padStart(2, '0')}`)
      .order('due_date', { ascending: true })
      .then(({ data }) => { setTasks(data || []); setLoading(false) })
  }, [user, viewYear, viewMonth])

  /* ── Group tasks by day number ───────────────────────────────── */
  const byDay = {}
  tasks.forEach(t => {
    if (!t.due_date) return
    const d = parseInt(t.due_date.split('-')[2], 10)
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(t)
  })

  /* ── Month navigation ────────────────────────────────────────── */
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

  /* ── Calendar grid metadata ──────────────────────────────────── */
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()   // 0 = Sun
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()

  const dayStr = (d) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const monthNames = MONTH_NAMES[language] || MONTH_NAMES.pt
  const dayNames   = DAY_SHORT[language]   || DAY_SHORT.pt

  const selectedTasks = selected ? (byDay[selected] || []) : []

  /* ── Helpers ─────────────────────────────────────────────────── */
  const navBtn = (onClick, icon) => (
    <button onClick={onClick} style={{
      width: 34, height: 34, borderRadius: 10,
      background: 'var(--input-bg)', border: '1px solid var(--border-md)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: 'var(--text-dim)',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--input-bg)'}
    >
      {icon}
    </button>
  )

  return (
    <Layout>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <CalendarDays style={{ color: primary }} size={26} />
          {isEn ? 'Calendar' : 'Calendário'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          {isEn ? 'Scheduled tasks and appointments' : 'Tarefas agendadas e compromissos'}
        </p>
      </div>

      {/* ── Calendar card ────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 16px', marginBottom: 20 }}>

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          {navBtn(prevMonth, <ChevronLeft size={17} />)}
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {monthNames[viewMonth]} {viewYear}
          </span>
          {navBtn(nextMonth, <ChevronRight size={17} />)}
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {dayNames.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 10.5, fontWeight: 600,
              color: 'var(--text-faint)', textTransform: 'uppercase',
              letterSpacing: '0.05em', padding: '4px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>

          {/* Offset empty cells */}
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dayTasks  = byDay[day] || []
            const isToday   = dayStr(day) === todayStr
            const isSel     = selected === day
            const hasTasks  = dayTasks.length > 0

            return (
              <div
                key={day}
                onClick={() => hasTasks && setSelected(isSel ? null : day)}
                style={{
                  minHeight: 52,
                  borderRadius: 10,
                  padding: '7px 4px 5px',
                  cursor: hasTasks ? 'pointer' : 'default',
                  background: isSel
                    ? `${primary}22`
                    : isToday
                    ? 'rgba(255,255,255,0.04)'
                    : 'transparent',
                  border: isSel
                    ? `1.5px solid ${primary}88`
                    : isToday
                    ? '1.5px solid rgba(255,255,255,0.1)'
                    : '1.5px solid transparent',
                  transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
              >
                {/* Day number */}
                <span style={{
                  fontSize: 12.5,
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? primary : isSel ? primary : 'var(--text-dim)',
                  lineHeight: 1,
                  width: 24, height: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: isToday && !isSel ? `${primary}20` : 'transparent',
                }}>
                  {day}
                </span>

                {/* Priority dots */}
                {hasTasks && (
                  <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 28 }}>
                    {dayTasks.slice(0, 3).map((t, ti) => (
                      <div key={ti} style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: PRIORITY_COLOR[t.priority] || primary,
                        flexShrink: 0,
                      }} />
                    ))}
                    {dayTasks.length > 3 && (
                      <span style={{ fontSize: 8, color: 'var(--text-faint)', lineHeight: 1 }}>
                        +{dayTasks.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Selected day panel ───────────────────────────────────── */}
      {selected && (
        <div style={{
          background: 'var(--surface)', border: `1px solid ${primary}33`,
          borderRadius: 20, padding: 20,
          animation: 'fadeSlideUp 0.22s ease',
        }}>
          <h3 style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text-dim)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            margin: '0 0 14px',
          }}>
            {selected} {monthNames[viewMonth]} {viewYear}
            <span style={{ color: primary, marginLeft: 8 }}>·</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              {' '}{selectedTasks.length} {isEn ? 'task(s)' : selectedTasks.length === 1 ? 'tarefa' : 'tarefas'}
            </span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedTasks.map(task => {
              const pColor = PRIORITY_COLOR[task.priority] || primary
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: task.done ? 'rgba(255,255,255,0.02)' : 'var(--input-bg)',
                  border: `1px solid ${task.done ? 'rgba(255,255,255,0.05)' : 'var(--border-md)'}`,
                  opacity: task.done ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}>
                  {task.done
                    ? <CheckCircle2 size={18} style={{ color: primary, flexShrink: 0, fill: `${primary}22` }} />
                    : <Circle size={18} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13.5, fontWeight: 500, margin: 0,
                      color: task.done ? 'var(--text-muted)' : 'var(--text)',
                      textDecoration: task.done ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p style={{ fontSize: 11.5, color: 'var(--text-faint)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700,
                    color: pColor,
                    background: `${pColor}18`,
                    border: `1px solid ${pColor}44`,
                    padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                    letterSpacing: '0.02em',
                  }}>
                    {isEn
                      ? task.priority === 'alta' ? 'High' : task.priority === 'media' ? 'Medium' : 'Low'
                      : task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Média' : 'Baixa'
                    }
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Empty state (no tasks this month) ────────────────────── */}
      {!loading && tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <CalendarDays size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontWeight: 500, color: 'var(--text-dim)', marginBottom: 4 }}>
            {isEn ? 'No scheduled tasks' : 'Nenhuma tarefa agendada'}
          </p>
          <p style={{ fontSize: 13 }}>
            {isEn
              ? 'Add a date when creating a task in the Tasks page'
              : 'Adicione uma data ao criar uma tarefa na página de Tarefas'}
          </p>
        </div>
      )}

      {/* ── Upcoming tasks list (when no day selected) ───────────── */}
      {!selected && tasks.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <h3 style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
          }}>
            {isEn ? `All tasks — ${monthNames[viewMonth]}` : `Todas as tarefas — ${monthNames[viewMonth]}`}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map(task => {
              const [, mm, dd] = task.due_date.split('-')
              const pColor = PRIORITY_COLOR[task.priority] || primary
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 12,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  opacity: task.done ? 0.5 : 1,
                }}>
                  {/* Date badge */}
                  <div style={{
                    flexShrink: 0, width: 38, height: 38, borderRadius: 10,
                    background: `${primary}15`, border: `1px solid ${primary}30`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: primary, lineHeight: 1 }}>{dd}</span>
                    <span style={{ fontSize: 8, color: primary, fontWeight: 600, textTransform: 'uppercase' }}>
                      {monthNames[parseInt(mm, 10) - 1].slice(0, 3)}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13.5, fontWeight: 500, margin: 0,
                      color: task.done ? 'var(--text-muted)' : 'var(--text)',
                      textDecoration: task.done ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p style={{ fontSize: 11.5, color: 'var(--text-faint)', margin: '1px 0 0' }}>
                        {task.description}
                      </p>
                    )}
                  </div>

                  <span style={{
                    fontSize: 10.5, fontWeight: 700, color: pColor,
                    background: `${pColor}18`, border: `1px solid ${pColor}44`,
                    padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                  }}>
                    {isEn
                      ? task.priority === 'alta' ? 'High' : task.priority === 'media' ? 'Medium' : 'Low'
                      : task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Média' : 'Baixa'
                    }
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Slide-up animation keyframe */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  )
}
