import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { getT } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { CheckSquare, Plus, Trash2, Flag, Circle, CheckCircle2, Loader2, CalendarDays, GripVertical } from 'lucide-react'

function getPriorities(t) {
  return [
    { value: 'alta',  label: t('tasks.priorities.alta'),  color: 'text-red-400 bg-red-950 border-red-900'      },
    { value: 'media', label: t('tasks.priorities.media'), color: 'text-yellow-400 bg-yellow-950 border-yellow-900' },
    { value: 'baixa', label: t('tasks.priorities.baixa'), color: 'text-slate-400 bg-slate-800 border-slate-700'  },
  ]
}

function TaskItem({ task, onToggle, onDelete, priorities, primary, dragHandleProps, isDragging, isDragOver }) {
  const [deleting, setDeleting] = useState(false)
  const p = priorities.find(p => p.value === task.priority) || priorities[2]

  return (
    <div
      onDragOver={dragHandleProps.onDragOver}
      onDrop={dragHandleProps.onDrop}
      onDragEnd={dragHandleProps.onDragEnd}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', borderRadius: 12,
        border: `1px solid ${isDragOver ? primary : task.done ? 'rgba(255,255,255,0.05)' : 'var(--border-md)'}`,
        background: isDragOver
          ? `color-mix(in srgb, var(--primary) 6%, var(--surface))`
          : task.done ? 'rgba(255,255,255,0.02)' : 'var(--surface)',
        opacity: isDragging ? 0.4 : task.done ? 0.55 : 1,
        transition: 'border-color 0.15s, background 0.15s, opacity 0.15s',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      {/* Grip handle — ONLY this element is draggable */}
      {!task.done && (
        <span
          draggable
          onDragStart={dragHandleProps.onDragStart}
          style={{ cursor: 'grab', color: 'var(--text-faint)', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '2px 0' }}
        >
          <GripVertical size={14} />
        </span>
      )}

      <button onClick={() => onToggle(task)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {task.done
          ? <CheckCircle2 size={22} style={{ color: primary, fill: `${primary}33` }} />
          : <Circle size={22} style={{ color: 'var(--text-faint)', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = primary}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'} />
        }
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: task.done ? 'var(--text-muted)' : 'var(--text)',
          textDecoration: task.done ? 'line-through' : 'none' }}>
          {task.title}
        </p>
        {task.description && (
          <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.description}
          </p>
        )}
      </div>

      {task.due_date && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: 'rgba(100,180,255,0.9)',
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
          padding: '2px 6px', borderRadius: 6, flexShrink: 0, whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <CalendarDays size={10} />
          {new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </span>
      )}

      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${p.color} flex-shrink-0`}>
        {p.label}
      </span>

      <button
        onClick={async (e) => { e.stopPropagation(); setDeleting(true); await onDelete(task.id) }}
        disabled={deleting}
        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-faint)' }}
        className="hover:text-red-400 transition"
      >
        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  )
}

export default function Tasks() {
  const { user } = useAuth()
  const { language, primary } = useSettings()
  const t = getT(language)
  const priorities = getPriorities(t)

  const [tasks,     setTasks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [title,     setTitle]     = useState('')
  const [description, setDescription] = useState('')
  const [priority,  setPriority]  = useState('media')
  const [dueDate,   setDueDate]   = useState('')
  const [adding,    setAdding]    = useState(false)
  const [showForm,  setShowForm]  = useState(false)
  const [dragId,    setDragId]    = useState(null)   // id being dragged
  const [dragOverId,setDragOverId]= useState(null)  // id currently hovered

  const today   = new Date().toISOString().split('T')[0]
  const orderKey = `fl-tasks-order-${today}`

  // Apply localStorage sort order to fetched tasks
  const applyOrder = (list) => {
    try {
      const ids = JSON.parse(localStorage.getItem(orderKey) || '[]')
      if (!ids.length) return list
      const map = Object.fromEntries(list.map(t => [t.id, t]))
      const ordered = ids.map(id => map[id]).filter(Boolean)
      list.forEach(t => { if (!ordered.find(o => o.id === t.id)) ordered.push(t) })
      return ordered
    } catch { return list }
  }

  const saveOrder = (list) =>
    localStorage.setItem(orderKey, JSON.stringify(list.map(t => t.id)))

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks').select('*')
      .eq('user_id', user.id).eq('date', today)
      .order('created_at', { ascending: true })
    setTasks(applyOrder(data || []))
    setLoading(false)
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDragStart = (id) => setDragId(id)
  const onDragOver  = (e, id) => { e.preventDefault(); setDragOverId(id) }
  const onDragEnd   = () => { setDragId(null); setDragOverId(null) }

  const onDrop = (targetId) => {
    if (!dragId || dragId === targetId) { onDragEnd(); return }
    const reordered = [...tasks]
    const fromIdx = reordered.findIndex(t => t.id === dragId)
    const toIdx   = reordered.findIndex(t => t.id === targetId)
    if (fromIdx === -1 || toIdx === -1) { onDragEnd(); return }
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setTasks(reordered)
    saveOrder(reordered)
    onDragEnd()
  }

  useEffect(() => { if (user) fetchTasks() }, [user])

  const addTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    const { data } = await supabase.from('tasks').insert({
      user_id: user.id, title: title.trim(),
      description: description.trim(), priority, done: false, date: today,
      due_date: dueDate || null,
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setTitle(''); setDescription(''); setPriority('media'); setDueDate('')
    setShowForm(false); setAdding(false)
  }

  const toggleTask = async (task) => {
    const { data } = await supabase
      .from('tasks').update({ done: !task.done }).eq('id', task.id).select().single()
    if (data) setTasks(prev => prev.map(t => t.id === task.id ? data : t))
  }

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const done      = tasks.filter(t => t.done).length
  const pct       = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
  const pending   = tasks.filter(t => !t.done)
  const completed = tasks.filter(t => t.done)

  const inputStyle = {
    width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border-md)',
    color: 'var(--text)', borderRadius: 12, padding: '10px 12px', fontSize: 13.5,
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckSquare style={{ color: primary }} size={26} />
            {t('tasks.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: primary, color: '#0a0a0a',
            fontSize: 13.5, fontWeight: 600, padding: '9px 16px',
            borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={16} />
          {t('tasks.newTask')}
        </button>
      </div>

      {/* Progress */}
      {tasks.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-dim)' }}>
                {done} {t('tasks.of')} {tasks.length} {t('tasks.concluded')}
              </span>
              <span style={{ color: primary, fontWeight: 600, fontSize: 14 }}>{pct}%</span>
            </div>
            <div style={{ background: 'var(--border-md)', borderRadius: 999, height: 7 }}>
              <div style={{ height: 7, background: primary, borderRadius: 999, width: `${pct}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>
          {pct === 100 && <div style={{ fontSize: 24 }} className="animate-bounce">🏆</div>}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: `1px solid ${primary}33`, borderRadius: 20, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 12 }}>{t('tasks.newLabel')}</h3>
          <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder={t('tasks.placeholder')} autoFocus required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = primary}
              onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
            />
            <input
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder={t('tasks.descPlaceholder')}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = primary}
              onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {priorities.map(p => (
                <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                    priority === p.value ? p.color : 'border-white/10 text-white/40 hover:bg-white/5'
                  }`}>
                  <Flag size={12} />{p.label}
                </button>
              ))}
            </div>
            {/* Optional calendar date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ ...inputStyle, width: 'auto', flex: 1, colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = primary}
                onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {language === 'en' ? 'Add to calendar (optional)' : 'Agendar no calendário (opcional)'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ fontSize: 13.5, color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('tasks.cancel')}
              </button>
              <button type="submit" disabled={adding}
                style={{ fontSize: 13.5, background: primary, color: '#0a0a0a', fontWeight: 600, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                {adding && <Loader2 size={14} className="animate-spin" />}
                {t('tasks.add')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: primary }} />
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <CheckSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 500, color: 'var(--text-dim)', marginBottom: 4 }}>{t('tasks.empty')}</p>
          <p style={{ fontSize: 13 }}>{t('tasks.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {t('tasks.pending')} ({pending.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pending.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    priorities={priorities}
                    primary={primary}
                    isDragging={dragId === task.id}
                    isDragOver={dragOverId === task.id && dragId !== task.id}
                    dragHandleProps={{
                      draggable: true,
                      onDragStart: () => onDragStart(task.id),
                      onDragOver:  (e) => onDragOver(e, task.id),
                      onDrop:      () => onDrop(task.id),
                      onDragEnd:   onDragEnd,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {t('tasks.completed')} ({completed.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completed.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    priorities={priorities}
                    primary={primary}
                    isDragging={false}
                    isDragOver={false}
                    dragHandleProps={{}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
