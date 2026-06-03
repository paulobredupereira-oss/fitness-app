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
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 3}, 1fr)`, gap: isMobile ? 10 : 12 }}>
          {photos.map(photo => (
            <div key={photo.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', background: 'rgba(255,255,255,0.05)' }} className="group">
              <img src={photo.url} alt="Refeição"
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s' }}
                className="hover:scale-105"
                onClick={() => setPreviewUrl(photo.url)}
              />
              <button onClick={() => deletePhoto(photo)}
                style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', opacity: 0, transition: 'all 0.2s' }}
                className="group-hover:opacity-100 hover:bg-red-500">
                <X size={12} />
              </button>
            </div>
          ))}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            style={{ aspectRatio: '1', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
            className="hover:border-[#ff4d2e]/50 hover:text-[#ff4d2e] disabled:opacity-50">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            <span style={{ fontSize: 11, marginTop: 4 }}>{uploading ? t('diet.uploading') : t('diet.photo')}</span>
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [adding, setAdding] = useState(false)
  const [food, setFood] = useState('')
  const [mealType, setMealType] = useState('cafe')
  const [calories, setCalories] = useState('')

  const today = localToday()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ width: isMobile ? '100%' : 'auto' }}>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'rgba(250,250,250,0.9)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UtensilsCrossed style={{ color: P }} size={isMobile ? 24 : 26} />
            {t('diet.title')}
          </h1>
          <p style={{ color: 'rgba(250,250,250,0.4)', fontSize: 13, marginTop: 4 }}>
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: P, color: '#0a0a0a', fontSize: 13.5, fontWeight: 600, padding: isMobile ? '10px' : '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
          <Plus size={16} />
          {t('diet.addMeal')}
        </button>
      </div>

      {/* Stats */}
      {meals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 16, marginBottom: 24 }}>
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: isMobile ? 16 : 20, padding: isMobile ? '16px 12px' : 16, textAlign: 'center' }}>
            <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'rgba(250,250,250,0.9)', margin: 0 }}>{done}</p>
            <p style={{ fontSize: 11, color: 'rgba(250,250,250,0.4)', marginTop: 4 }}>{t('diet.mealsDone')}</p>
          </div>
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: isMobile ? 16 : 20, padding: isMobile ? '16px 12px' : 16, textAlign: 'center' }}>
            <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: P, margin: 0 }}>{pct}%</p>
            <p style={{ fontSize: 11, color: 'rgba(250,250,250,0.4)', marginTop: 4 }}>{t('diet.dietFollowed')}</p>
          </div>
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: isMobile ? 16 : 20, padding: isMobile ? '16px 12px' : 16, textAlign: 'center', gridColumn: isMobile ? 'span 2' : 'auto' }}>
            <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#fb923c', margin: 0 }}>{totalCals > 0 ? totalCals : '—'}</p>
            <p style={{ fontSize: 11, color: 'rgba(250,250,250,0.4)', marginTop: 4 }}>{t('diet.kcalConsumed')}</p>
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
        <form onSubmit={addMeal} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: isMobile ? 16 : 20, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(250,250,250,0.7)', margin: 0 }}>{t('diet.formTitle')}</h3>
          <input value={food} onChange={e => setFood(e.target.value)}
            placeholder={t('diet.foodPlaceholder')}
            autoFocus required
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 12, padding: '10px 12px', fontSize: 13.5, outline: 'none' }} />
          <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
            <select value={mealType} onChange={e => setMealType(e.target.value)}
              style={{ flex: 1, background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 12, padding: '10px 12px', fontSize: 13.5, outline: 'none' }}>
              {mealTypes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input type="number" value={calories} onChange={e => setCalories(e.target.value)}
              placeholder={t('diet.kcalPlaceholder')}
              style={{ width: isMobile ? '100%' : 144, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 12, padding: '10px 12px', fontSize: 13.5, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ fontSize: 13.5, color: 'rgba(250,250,250,0.4)', padding: isMobile ? '10px' : '8px 16px', borderRadius: 12, border: 'none', background: 'none', cursor: 'pointer', flex: isMobile ? 1 : 'none' }}>
              {t('diet.cancel')}
            </button>
            <button type="submit" disabled={adding}
              style={{ fontSize: 13.5, background: P, color: '#0a0a0a', fontWeight: 600, padding: isMobile ? '10px' : '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: isMobile ? 1 : 'none' }}>
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
