import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { CheckSquare, Plus, Trash2, Flag, Circle, CheckCircle2, Loader2 } from 'lucide-react'

const priorities = [
  { value: 'alta', label: 'Alta', color: 'text-red-500 bg-red-50 border-red-100' },
  { value: 'media', label: 'Média', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
  { value: 'baixa', label: 'Baixa', color: 'text-slate-500 bg-slate-50 border-slate-200' },
]

function TaskItem({ task, onToggle, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const p = priorities.find(p => p.value === task.priority) || priorities[2]

  return (
    <div className={`flex items-center gap-3 p-4 bg-white rounded-xl border transition-all ${task.done ? 'opacity-60 border-slate-100' : 'border-slate-200 hover:border-slate-300'}`}>
      <button onClick={() => onToggle(task)} className="flex-shrink-0 text-blue-500 hover:text-blue-600 transition">
        {task.done
          ? <CheckCircle2 size={22} className="text-blue-500 fill-blue-100" />
          : <Circle size={22} className="text-slate-300 hover:text-blue-400 transition" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>
        )}
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${p.color} flex-shrink-0`}>
        {p.label}
      </span>
      <button
        onClick={async () => { setDeleting(true); await onDelete(task.id) }}
        disabled={deleting}
        className="flex-shrink-0 text-slate-300 hover:text-red-400 transition"
      >
        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  )
}

export default function Tasks() {
  const { user } = useAuth()
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
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
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
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      priority,
      done: false,
      date: today
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setTitle('')
    setDescription('')
    setPriority('media')
    setShowForm(false)
    setAdding(false)
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

  const done = tasks.filter(t => t.done).length
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
  const pending = tasks.filter(t => !t.done)
  const completed = tasks.filter(t => t.done)

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="text-indigo-500" size={26} />
            Tarefas do Dia
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Nova tarefa
        </button>
      </div>

      {/* Progress */}
      {tasks.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 flex items-center gap-5">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">{done} de {tasks.length} concluídas</span>
              <span className="text-indigo-600 font-semibold">{pct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="h-2 bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {pct === 100 && (
            <div className="text-2xl animate-bounce">🏆</div>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={addTask} className="bg-white border border-indigo-100 rounded-2xl p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-slate-700 text-sm">Nova tarefa</h3>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="O que você precisa fazer?"
            autoFocus
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          <div className="flex gap-2">
            {priorities.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                  priority === p.value ? p.color + ' ring-2 ring-offset-1 ring-indigo-300' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Flag size={12} />
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-50 transition">Cancelar</button>
            <button type="submit" disabled={adding} className="text-sm bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
              {adding && <Loader2 size={14} className="animate-spin" />}
              Adicionar
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma tarefa hoje</p>
          <p className="text-sm mt-1">Clique em "Nova tarefa" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Pendentes ({pending.length})</h3>
              <div className="space-y-2">
                {pending.map(t => <TaskItem key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-4">Concluídas ({completed.length})</h3>
              <div className="space-y-2">
                {completed.map(t => <TaskItem key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
