import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { UtensilsCrossed, Plus, Trash2, CheckCircle2, Circle, Loader2, Flame } from 'lucide-react'

const mealTypes = [
  { value: 'cafe', label: '☀️ Café da manhã', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { value: 'lanche1', label: '🍎 Lanche da manhã', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 'almoco', label: '🍽️ Almoço', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { value: 'lanche2', label: '🥤 Lanche da tarde', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { value: 'jantar', label: '🌙 Jantar', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'ceia', label: '🌛 Ceia', color: 'bg-purple-50 border-purple-200 text-purple-700' },
]

function MealCard({ meal, onToggle, onDelete }) {
  const type = mealTypes.find(m => m.value === meal.meal_type) || mealTypes[0]

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${meal.done ? 'opacity-60 border-slate-100 bg-white' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
      <button onClick={() => onToggle(meal)} className="mt-0.5 flex-shrink-0">
        {meal.done
          ? <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-100" />
          : <Circle size={20} className="text-slate-300 hover:text-emerald-400 transition" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${meal.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {meal.food}
        </p>
        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-lg border ${type.color}`}>
          {type.label}
        </span>
        {meal.calories && (
          <span className="ml-2 text-xs text-slate-400 inline-flex items-center gap-1">
            <Flame size={11} /> {meal.calories} kcal
          </span>
        )}
      </div>
      <button onClick={() => onDelete(meal.id)} className="text-slate-300 hover:text-red-400 transition flex-shrink-0">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function Diet() {
  const { user } = useAuth()
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [food, setFood] = useState('')
  const [mealType, setMealType] = useState('cafe')
  const [calories, setCalories] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const fetchMeals = async () => {
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true })
    setMeals(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) fetchMeals() }, [user])

  const addMeal = async (e) => {
    e.preventDefault()
    if (!food.trim()) return
    setAdding(true)
    const { data } = await supabase.from('meals').insert({
      user_id: user.id,
      food: food.trim(),
      meal_type: mealType,
      calories: calories ? parseInt(calories) : null,
      done: false,
      date: today
    }).select().single()
    if (data) setMeals(prev => [...prev, data])
    setFood('')
    setCalories('')
    setShowForm(false)
    setAdding(false)
  }

  const toggleMeal = async (meal) => {
    const { data } = await supabase.from('meals').update({ done: !meal.done }).eq('id', meal.id).select().single()
    if (data) setMeals(prev => prev.map(m => m.id === meal.id ? data : m))
  }

  const deleteMeal = async (id) => {
    await supabase.from('meals').delete().eq('id', id)
    setMeals(prev => prev.filter(m => m.id !== id))
  }

  const done = meals.filter(m => m.done).length
  const totalCals = meals.filter(m => m.done && m.calories).reduce((s, m) => s + m.calories, 0)
  const pct = meals.length > 0 ? Math.round((done / meals.length) * 100) : 0

  // Group by meal type
  const grouped = mealTypes.map(type => ({
    ...type,
    items: meals.filter(m => m.meal_type === type.value)
  })).filter(g => g.items.length > 0)

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UtensilsCrossed className="text-emerald-500" size={26} />
            Dieta de Hoje
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Adicionar refeição
        </button>
      </div>

      {/* Stats */}
      {meals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{done}</p>
            <p className="text-xs text-slate-500 mt-0.5">Refeições feitas</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{pct}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Dieta seguida</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{totalCals > 0 ? totalCals : '—'}</p>
            <p className="text-xs text-slate-500 mt-0.5">kcal consumidas</p>
          </div>
        </div>
      )}

      {/* Progress */}
      {meals.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-700">{done} de {meals.length} refeições realizadas</span>
            <span className="text-emerald-600 font-semibold">{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="h-2 bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={addMeal} className="bg-white border border-emerald-100 rounded-2xl p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-slate-700 text-sm">Adicionar refeição</h3>
          <input
            value={food}
            onChange={e => setFood(e.target.value)}
            placeholder="O que você vai comer? Ex: Peito de frango grelhado"
            autoFocus
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
          />
          <div className="flex gap-3">
            <select
              value={mealType}
              onChange={e => setMealType(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition bg-white"
            >
              {mealTypes.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="kcal (opcional)"
              className="w-36 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-50 transition">Cancelar</button>
            <button type="submit" disabled={adding} className="text-sm bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition flex items-center gap-2">
              {adding && <Loader2 size={14} className="animate-spin" />}
              Adicionar
            </button>
          </div>
        </form>
      )}

      {/* Meals */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-emerald-400" />
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma refeição hoje</p>
          <p className="text-sm mt-1">Planeje sua dieta clicando em "Adicionar refeição"</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => (
            <div key={group.value}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{group.label}</h3>
              <div className="space-y-2">
                {group.items.map(m => (
                  <MealCard key={m.id} meal={m} onToggle={toggleMeal} onDelete={deleteMeal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
