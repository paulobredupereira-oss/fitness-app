import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { Dumbbell, Plus, Trash2, CheckCircle2, Circle, Loader2, Zap, Clock, Repeat } from 'lucide-react'

const categories = [
  { value: 'peito', label: 'Peito', emoji: '💪' },
  { value: 'costas', label: 'Costas', emoji: '🔙' },
  { value: 'pernas', label: 'Pernas', emoji: '🦵' },
  { value: 'ombros', label: 'Ombros', emoji: '🏋️' },
  { value: 'biceps', label: 'Bíceps', emoji: '💪' },
  { value: 'triceps', label: 'Tríceps', emoji: '💪' },
  { value: 'abdomen', label: 'Abdômen', emoji: '🔥' },
  { value: 'cardio', label: 'Cardio', emoji: '🏃' },
  { value: 'outro', label: 'Outro', emoji: '⚡' },
]

function ExerciseCard({ exercise, onToggle, onDelete }) {
  const cat = categories.find(c => c.value === exercise.category) || categories[8]

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${exercise.done ? 'opacity-60 border-slate-100 bg-white' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
      <button onClick={() => onToggle(exercise)} className="mt-0.5 flex-shrink-0">
        {exercise.done
          ? <CheckCircle2 size={20} className="text-orange-500 fill-orange-100" />
          : <Circle size={20} className="text-slate-300 hover:text-orange-400 transition" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base">{cat.emoji}</span>
          <p className={`text-sm font-medium ${exercise.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
            {exercise.name}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
          {exercise.sets && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Repeat size={11} /> {exercise.sets} séries
            </span>
          )}
          {exercise.reps && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Zap size={11} /> {exercise.reps} reps
            </span>
          )}
          {exercise.duration && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={11} /> {exercise.duration} min
            </span>
          )}
          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
            {cat.label}
          </span>
        </div>
      </div>
      <button onClick={() => onDelete(exercise.id)} className="text-slate-300 hover:text-red-400 transition flex-shrink-0">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function Workout() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('peito')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [duration, setDuration] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true })
    setExercises(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) fetchExercises() }, [user])

  const addExercise = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    const { data } = await supabase.from('workouts').insert({
      user_id: user.id,
      name: name.trim(),
      category,
      sets: sets ? parseInt(sets) : null,
      reps: reps ? parseInt(reps) : null,
      duration: duration ? parseInt(duration) : null,
      done: false,
      date: today
    }).select().single()
    if (data) setExercises(prev => [...prev, data])
    setName('')
    setSets('')
    setReps('')
    setDuration('')
    setShowForm(false)
    setAdding(false)
  }

  const toggleExercise = async (ex) => {
    const { data } = await supabase.from('workouts').update({ done: !ex.done }).eq('id', ex.id).select().single()
    if (data) setExercises(prev => prev.map(e => e.id === ex.id ? data : e))
  }

  const deleteExercise = async (id) => {
    await supabase.from('workouts').delete().eq('id', id)
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  const done = exercises.filter(e => e.done).length
  const pct = exercises.length > 0 ? Math.round((done / exercises.length) * 100) : 0
  const pending = exercises.filter(e => !e.done)
  const completed = exercises.filter(e => e.done)

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Dumbbell className="text-orange-500" size={26} />
            Treino de Hoje
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Adicionar exercício
        </button>
      </div>

      {/* Stats */}
      {exercises.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{done}</p>
            <p className="text-xs text-slate-500 mt-0.5">Feitos</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{pct}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Concluído</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{exercises.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total</p>
          </div>
        </div>
      )}

      {/* Progress */}
      {exercises.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-700">{done} de {exercises.length} exercícios concluídos</span>
            <span className="text-orange-500 font-semibold">{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="h-2 bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {pct === 100 && (
            <p className="text-center text-sm text-orange-500 font-semibold mt-3">🔥 Treino completo! Incrível!</p>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={addExercise} className="bg-white border border-orange-100 rounded-2xl p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-slate-700 text-sm">Novo exercício</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome do exercício. Ex: Supino reto"
            autoFocus
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition bg-white"
          >
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Séries</label>
              <input
                type="number" min="1"
                value={sets} onChange={e => setSets(e.target.value)}
                placeholder="Ex: 4"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Repetições</label>
              <input
                type="number" min="1"
                value={reps} onChange={e => setReps(e.target.value)}
                placeholder="Ex: 12"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Duração (min)</label>
              <input
                type="number" min="1"
                value={duration} onChange={e => setDuration(e.target.value)}
                placeholder="Ex: 30"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-50 transition">Cancelar</button>
            <button type="submit" disabled={adding} className="text-sm bg-orange-500 text-white font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 transition flex items-center gap-2">
              {adding && <Loader2 size={14} className="animate-spin" />}
              Adicionar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-orange-400" />
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum exercício hoje</p>
          <p className="text-sm mt-1">Monte seu treino clicando em "Adicionar exercício"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Pendentes ({pending.length})</h3>
              <div className="space-y-2">
                {pending.map(e => <ExerciseCard key={e.id} exercise={e} onToggle={toggleExercise} onDelete={deleteExercise} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-4">Concluídos ({completed.length})</h3>
              <div className="space-y-2">
                {completed.map(e => <ExerciseCard key={e.id} exercise={e} onToggle={toggleExercise} onDelete={deleteExercise} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
