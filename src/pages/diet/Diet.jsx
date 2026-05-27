import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { UtensilsCrossed, Plus, Trash2, CheckCircle2, Circle, Loader2, Flame, Camera, X, ImageOff } from 'lucide-react'

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

// ─── Álbum de Fotos ──────────────────────────────────────────────────────────

function PhotoAlbum({ userId, today }) {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const fileInputRef = useRef(null)

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('meal_photos')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: true })
    setPhotos(data || [])
    setLoadingPhotos(false)
  }

  useEffect(() => { fetchPhotos() }, [userId, today])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Formato não suportado. Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Foto muito grande. Limite: 5MB.')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${today}/photo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('meal-photos')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      alert('Erro ao fazer upload. Verifique se o bucket foi criado no Supabase.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('meal-photos')
      .getPublicUrl(path)

    const { data } = await supabase.from('meal_photos').insert({
      user_id: userId,
      date: today,
      url: publicUrl,
      path
    }).select().single()

    if (data) setPhotos(prev => [...prev, data])
    e.target.value = ''
    setUploading(false)
  }

  const deletePhoto = async (photo) => {
    await supabase.storage.from('meal-photos').remove([photo.path])
    await supabase.from('meal_photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    if (previewUrl === photo.url) setPreviewUrl(null)
  }

  return (
    <div className="mt-8">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <Camera size={18} className="text-emerald-500" />
            Fotos do Dia
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Registre o que você comeu hoje</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-medium px-3 py-2 rounded-xl transition disabled:opacity-50"
        >
          {uploading
            ? <Loader2 size={14} className="animate-spin" />
            : <Plus size={14} />
          }
          {uploading ? 'Enviando...' : 'Adicionar foto'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Grid de fotos */}
      {loadingPhotos ? (
        <div className="flex justify-center py-8">
          <Loader2 size={22} className="animate-spin text-emerald-400" />
        </div>
      ) : photos.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center">
          <ImageOff size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400 font-medium">Nenhuma foto ainda</p>
          <p className="text-xs text-slate-300 mt-1">Clique em "Adicionar foto" para registrar sua refeição</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
              <img
                src={photo.url}
                alt="Refeição"
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => setPreviewUrl(photo.url)}
              />
              <button
                onClick={() => deletePhoto(photo)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {/* Botão de upload inline no grid */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:border-emerald-300 hover:text-emerald-400 transition disabled:opacity-50"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            <span className="text-xs mt-1">{uploading ? 'Enviando' : 'Foto'}</span>
          </button>
        </div>
      )}

      {/* Modal de preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={previewUrl} alt="Preview" className="w-full rounded-2xl shadow-2xl" />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

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
        <div className="text-center py-10 text-slate-400">
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

      {/* Álbum de fotos — sempre visível no final */}
      {user && <PhotoAlbum userId={user.id} today={today} />}
    </Layout>
  )
}
