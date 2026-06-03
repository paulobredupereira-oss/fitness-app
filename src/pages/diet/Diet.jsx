import { useEffect, useState, useRef } from 'react'
import { localToday } from '../../lib/dateUtils'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { getT } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { UtensilsCrossed, Plus, Trash2, CheckCircle2, Circle, Loader2, Flame, Camera, X, ImageOff } from 'lucide-react'

const P = 'var(--primary)'

function getMealTypes(t) {
  return [
    { value: 'cafe',    label: t('diet.meals.cafe'),    color: 'bg-yellow-900/40 border-yellow-700/50 text-yellow-400' },
    { value: 'lanche1', label: t('diet.meals.lanche1'), color: 'bg-orange-900/40 border-orange-700/50 text-orange-400' },
    { value: 'almoco',  label: t('diet.meals.almoco'),  color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-400' },
    { value: 'lanche2', label: t('diet.meals.lanche2'), color: 'bg-teal-900/40 border-teal-700/50 text-teal-400' },
    { value: 'jantar',  label: t('diet.meals.jantar'),  color: 'bg-blue-900/40 border-blue-700/50 text-blue-400' },
    { value: 'ceia',    label: t('diet.meals.ceia'),    color: 'bg-purple-900/40 border-purple-700/50 text-purple-400' },
  ]
}

function MealCard({ meal, onToggle, onDelete, mealTypes, primary }) {
  const type = mealTypes.find(m => m.value === meal.meal_type) || mealTypes[0]
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${meal.done ? 'opacity-50 border-white/5 bg-white/[0.02]' : 'bg-[#141414] border-white/10 hover:border-white/20'}`}>
      <button onClick={() => onToggle(meal)} className="mt-0.5 flex-shrink-0">
        {meal.done
          ? <CheckCircle2 size={20} style={{ color: primary, fill: `${primary}33` }} />
          : <Circle size={20} style={{ color: 'var(--text-faint)', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = primary}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'} />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${meal.done ? 'line-through text-white/30' : 'text-white/90'}`}>
          {meal.food}
        </p>
        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-lg border ${type.color}`}>
          {type.label}
        </span>
        {meal.calories && (
          <span className="ml-2 text-xs text-white/30 inline-flex items-center gap-1">
            <Flame size={11} /> {meal.calories} kcal
          </span>
        )}
      </div>
      <button onClick={() => onDelete(meal.id)} className="text-white/20 hover:text-red-400 transition flex-shrink-0">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ── Photo Album ───────────────────────────────────────────────────────────────
function PhotoAlbum({ userId, today, t, primary }) {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const fileInputRef = useRef(null)

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('meal_photos').select('*')
      .eq('user_id', userId).eq('date', today)
      .order('created_at', { ascending: true })
    setPhotos(data || [])
    setLoadingPhotos(false)
  }

  useEffect(() => { fetchPhotos() }, [userId, today])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
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
    const { error: uploadError } = await supabase.storage.from('meal-photos').upload(path, file, { contentType: file.type })
    if (uploadError) {
      alert('Erro ao fazer upload. Verifique se o bucket foi criado no Supabase.')
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('meal-photos').getPublicUrl(path)
    const { data } = await supabase.from('meal_photos').insert({ user_id: userId, date: today, url: publicUrl, path }).select().single()
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white/80 flex items-center gap-2">
            <Camera size={18} style={{ color: P }} />
            {t('diet.photos')}
          </h2>
          <p className="text-xs text-white/30 mt-0.5">{t('diet.photosSubtitle')}</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 text-sm font-medium px-3 py-2 rounded-xl transition disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {uploading ? t('diet.uploading') : t('diet.addPhoto')}
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
      </div>

      {loadingPhotos ? (
        <div className="flex justify-center py-8">
          <Loader2 size={22} style={{ color: P }} className="animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="border-2 border-dashed border-white/10 rounded-2xl py-10 text-center">
          <ImageOff size={32} className="mx-auto text-white/20 mb-2" />
          <p className="text-sm text-white/40 font-medium">{t('diet.noPhotos')}</p>
          <p className="text-xs text-white/20 mt-1">{t('diet.noPhotosHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-white/5">
              <img src={photo.url} alt="Refeição"
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => setPreviewUrl(photo.url)}
              />
              <button onClick={() => deletePhoto(photo)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <X size={12} />
              </button>
            </div>
          ))}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/20 hover:border-[#ff4d2e]/50 hover:text-[#ff4d2e] transition disabled:opacity-50">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            <span className="text-xs mt-1">{uploading ? t('diet.uploading') : t('diet.photo')}</span>
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={previewUrl} alt="Preview" className="w-full rounded-2xl shadow-2xl" />
            <button onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Diet() {
  const { user } = useAuth()
  const { primary, language } = useSettings()
  const t = getT(language)
  const mealTypes = getMealTypes(t)

  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [food, setFood] = useState('')
  const [mealType, setMealType] = useState('cafe')
  const [calories, setCalories] = useState('')

  const today = localToday()

  const fetchMeals = async () => {
    const { data } = await supabase.from('meals').select('*')
      .eq('user_id', user.id).eq('date', today)
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
      user_id: user.id, food: food.trim(), meal_type: mealType,
      calories: calories ? parseInt(calories) : null, done: false, date: today
    }).select().single()
    if (data) setMeals(prev => [...prev, data])
    setFood(''); setCalories(''); setShowForm(false); setAdding(false)
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
  const grouped = mealTypes.map(type => ({ ...type, items: meals.filter(m => m.meal_type === type.value) })).filter(g => g.items.length > 0)

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90 flex items-center gap-2">
            <UtensilsCrossed style={{ color: P }} size={26} />
            {t('diet.title')}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-black text-sm font-semibold px-4 py-2.5 rounded-xl transition"
          style={{ background: P }}>
          <Plus size={16} />
          {t('diet.addMeal')}
        </button>
      </div>

      {/* Stats */}
      {meals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white/90">{done}</p>
            <p className="text-xs text-white/40 mt-0.5">{t('diet.mealsDone')}</p>
          </div>
          <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: P }}>{pct}%</p>
            <p className="text-xs text-white/40 mt-0.5">{t('diet.dietFollowed')}</p>
          </div>
          <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{totalCals > 0 ? totalCals : '—'}</p>
            <p className="text-xs text-white/40 mt-0.5">{t('diet.kcalConsumed')}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {meals.length > 0 && (
        <div className="bg-[#141414] border border-white/8 rounded-2xl p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-white/70">
              {done} {t('diet.of')} {meals.length} {t('diet.mealsOf')}
            </span>
            <span className="font-semibold" style={{ color: P }}>{pct}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: P }} />
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={addMeal} className="bg-[#141414] border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-white/70 text-sm">{t('diet.formTitle')}</h3>
          <input value={food} onChange={e => setFood(e.target.value)}
            placeholder={t('diet.foodPlaceholder')}
            autoFocus required
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2e]/50 transition" />
          <div className="flex gap-3">
            <select value={mealType} onChange={e => setMealType(e.target.value)}
              className="flex-1 bg-[#1c1c1c] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2e]/50 transition">
              {mealTypes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input type="number" value={calories} onChange={e => setCalories(e.target.value)}
              placeholder={t('diet.kcalPlaceholder')}
              className="w-36 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2e]/50 transition" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm text-white/40 px-4 py-2 rounded-xl hover:bg-white/5 transition">
              {t('diet.cancel')}
            </button>
            <button type="submit" disabled={adding}
              className="text-sm text-black font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2"
              style={{ background: P }}>
              {adding && <Loader2 size={14} className="animate-spin" />}
              {t('diet.add')}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: P }} />
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-white/50">{t('diet.empty')}</p>
          <p className="text-sm mt-1">{t('diet.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => (
            <div key={group.value}>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-2">{group.label}</h3>
              <div className="space-y-2">
                {group.items.map(m => <MealCard key={m.id} meal={m} onToggle={toggleMeal} onDelete={deleteMeal} mealTypes={mealTypes} primary={primary} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {user && <PhotoAlbum userId={user.id} today={today} t={t} primary={primary} />}
    </Layout>
  )
}
