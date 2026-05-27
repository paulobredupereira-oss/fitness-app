import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { getT } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { CheckSquare, Plus, Trash2, Flag, Circle, CheckCircle2, Loader2 } from 'lucide-react'

function getPriorities(t) {
  return [
    { value: 'alta',  label: t('tasks.priorities.alta'),  color: 'text-red-400 bg-red-950 border-red-900'      },
    { value: 'media', label: t('tasks.priorities.media'), color: 'text-yellow-400 bg-yellow-950 border-yellow-900' },
    { value: 'baixa', label: t('tasks.priorities.baixa'), color: 'text-slate-400 bg-slate-800 border-slate-700'  },
  ]
}

function TaskItem({ task, onToggle, onDelete, priorities }) {
  const [deleting, setDeleting] = useState(false)
  const p = priorities.find(p => p.value === task.priority) || priorities[2]

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
        task.done
          ? 'opacity-50 border-white/5 bg-white/[0.02]'
          : 'bg-[#141414] border-white/10 hover:border-white/20'
      }`}
    >
      <button onClick={() => onToggle(task)} className="flex-shrink-0 transition">
        {task.done
          ? <CheckCircle2 size={22} className="text-[#ff4d2e]" style={{ fill: 'rgba(255,77,46,0.2)' }} />
          : <Circle size={22} className="text-white/20 hover:text-[#ff4d2e] transition" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.done ? 'line-through text-white/30' : 'text-white/90'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-white/30 mt-0.5 truncate">{task.description}</p>
        )}
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${p.color} flex-shrink-0`}>
        {p.label}
      </span>
      <button
        onClick={async () => { setDeleting(true); await onDelete(task.id) }}
        disabled={deleting}
        className="flex-shrink-0 text-white/20 hover:text-red-400 transition"
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

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('media')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks').select('*')
      .eq('user_id', user.id).eq('date', today)
      .order('created_at', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) fetchTasks() }, [user])

  const addTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    const { data } = await supabase.from('tasks').insert({
      user_id: user.id, title: title.trim(),
      description: description.trim(), priority, done: false, date: today,
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setTitle(''); setDescription(''); setPriority('media')
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
          <Loader2 size={28} className="animate-spin text-[#ff4d2e]" />
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
              <div className="space-y-2">
                {pending.map(task => (
                  <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} priorities={priorities} />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {t('tasks.completed')} ({completed.length})
              </h3>
              <div className="space-y-2">
                {completed.map(task => (
                  <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} priorities={priorities} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
