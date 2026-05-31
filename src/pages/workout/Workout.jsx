import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { getT } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { Dumbbell, Plus, Trash2, CheckCircle2, Circle, Loader2, Zap, Clock, Repeat, MapPin, CalendarDays, Pencil, Check } from 'lucide-react'

// ── Days of week ─────────────────────────────────────────────────────────────
const DAYS = [
  { value: 'seg', label_pt: 'Seg', label_en: 'Mon' },
  { value: 'ter', label_pt: 'Ter', label_en: 'Tue' },
  { value: 'qua', label_pt: 'Qua', label_en: 'Wed' },
  { value: 'qui', label_pt: 'Qui', label_en: 'Thu' },
  { value: 'sex', label_pt: 'Sex', label_en: 'Fri' },
  { value: 'sab', label_pt: 'Sáb', label_en: 'Sat' },
  { value: 'dom', label_pt: 'Dom', label_en: 'Sun' },
]

// ── Sports ────────────────────────────────────────────────────────────────────
const SPORTS = [
  { value: 'academia',  emoji: '🏋️', label_pt: 'Academia',  label_en: 'Gym'      },
  { value: 'jiujitsu',  emoji: '🥋', label_pt: 'Jiu Jitsu', label_en: 'Jiu Jitsu'},
  { value: 'corrida',   emoji: '🏃', label_pt: 'Corrida',   label_en: 'Running'  },
  { value: 'futebol',   emoji: '⚽', label_pt: 'Futebol',   label_en: 'Soccer'   },
  { value: 'bicicleta', emoji: '🚴', label_pt: 'Bicicleta', label_en: 'Cycling'  },
]

// ── Gym exercise categories ───────────────────────────────────────────────────
const categories = {
  pt: [
    { value: 'peito',   label: 'Peito',   emoji: '💪' },
    { value: 'costas',  label: 'Costas',  emoji: '🔙' },
    { value: 'pernas',  label: 'Pernas',  emoji: '🦵' },
    { value: 'ombros',  label: 'Ombros',  emoji: '🏋️' },
    { value: 'biceps',  label: 'Bíceps',  emoji: '💪' },
    { value: 'triceps', label: 'Tríceps', emoji: '💪' },
    { value: 'abdomen', label: 'Abdômen', emoji: '🔥' },
    { value: 'cardio',  label: 'Cardio',  emoji: '🏃' },
    { value: 'outro',   label: 'Outro',   emoji: '⚡' },
  ],
  en: [
    { value: 'peito',   label: 'Chest',     emoji: '💪' },
    { value: 'costas',  label: 'Back',       emoji: '🔙' },
    { value: 'pernas',  label: 'Legs',       emoji: '🦵' },
    { value: 'ombros',  label: 'Shoulders',  emoji: '🏋️' },
    { value: 'biceps',  label: 'Biceps',     emoji: '💪' },
    { value: 'triceps', label: 'Triceps',    emoji: '💪' },
    { value: 'abdomen', label: 'Core / Abs', emoji: '🔥' },
    { value: 'cardio',  label: 'Cardio',     emoji: '🏃' },
    { value: 'outro',   label: 'Other',      emoji: '⚡' },
  ],
}

// ── Sport-specific form config ────────────────────────────────────────────────
const sportFormConfig = {
  academia:  { showCategory: true,  showSets: true,  showReps: true,  showDuration: true, distLabel: null },
  jiujitsu:  { showCategory: false, showSets: true,  showReps: false, showDuration: true, distLabel: null,   setsLabel: { pt: 'Rounds', en: 'Rounds' } },
  corrida:   { showCategory: false, showSets: false, showReps: true,  showDuration: true, distLabel: { pt: 'Distância (km)', en: 'Distance (km)' } },
  futebol:   { showCategory: false, showSets: false, showReps: false, showDuration: true, distLabel: null },
  bicicleta: { showCategory: false, showSets: false, showReps: true,  showDuration: true, distLabel: { pt: 'Distância (km)', en: 'Distance (km)' } },
}

const sportPlaceholders = {
  pt: {
    academia:  'Ex: Supino reto',
    jiujitsu:  'Ex: Treino de guarda',
    corrida:   'Ex: Corrida matinal',
    futebol:   'Ex: Pelada com amigos',
    bicicleta: 'Ex: Pedal na orla',
  },
  en: {
    academia:  'E.g. Bench press',
    jiujitsu:  'E.g. Guard training',
    corrida:   'E.g. Morning run',
    futebol:   'E.g. Match with friends',
    bicicleta: 'E.g. Morning ride',
  },
}

// ── Exercise card ─────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, onToggle, onDelete, onEdit, cats, primary, sport }) {
  const [deleting, setDeleting] = useState(false)
  const isGym = sport === 'academia'
  const cat = isGym ? (cats.find(c => c.value === exercise.category) || cats[8]) : null
  const sportData = SPORTS.find(s => s.value === sport)

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16,
      borderRadius: 14, border: `1px solid ${exercise.done ? 'var(--border)' : 'var(--border-md)'}`,
      background: exercise.done ? 'transparent' : 'var(--surface)',
      opacity: exercise.done ? 0.55 : 1,
      transition: 'all 0.2s',
    }}>
      <button onClick={() => onToggle(exercise)} style={{ marginTop: 2, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {exercise.done
          ? <CheckCircle2 size={20} style={{ color: primary, fill: `${primary}33` }} />
          : <Circle size={20} style={{ color: 'var(--text-faint)', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = primary}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'} />
        }
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15 }}>{isGym ? cat?.emoji : sportData?.emoji}</span>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: exercise.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: exercise.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {exercise.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {exercise.sets && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Repeat size={11} /> {exercise.sets}x
            </span>
          )}
          {exercise.reps && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {sport === 'corrida' || sport === 'bicicleta'
                ? <><MapPin size={11} /> {exercise.reps} km</>
                : <><Zap size={11} /> {exercise.reps} reps</>
              }
            </span>
          )}
          {exercise.duration && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {exercise.duration} min
            </span>
          )}
          {isGym && cat && (
            <span style={{ fontSize: 11.5, fontWeight: 500, color: primary, background: `${primary}18`, padding: '2px 8px', borderRadius: 8, border: `1px solid ${primary}33` }}>
              {cat.label}
            </span>
          )}
          {exercise.due_date && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'rgba(100,180,255,0.9)',
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
              padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <CalendarDays size={10} />
              {new Date(exercise.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
          {exercise.repeat_days && (() => {
            try {
              const days = JSON.parse(exercise.repeat_days)
              if (!days.length) return null
              return (
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'rgba(160,130,255,0.9)',
                  background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                  padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  🔁 {days.join(' · ')}
                </span>
              )
            } catch { return null }
          })()}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(exercise)}
          style={{ color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = primary}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={async () => { setDeleting(true); await onDelete(exercise.id) }}
          disabled={deleting}
          style={{ color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          className="hover:text-red-400 transition"
        >
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Workout() {
  const { user } = useAuth()
  const { language, primary } = useSettings()
  const t = getT(language)
  const cats = categories[language] || categories.pt

  const [exercises, setExercises]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [selectedSport, setSelectedSport] = useState('academia')
  const [showForm, setShowForm]         = useState(false)
  const [adding, setAdding]             = useState(false)
  const [name, setName]                 = useState('')
  const [category, setCategory]         = useState('peito')
  const [sets, setSets]                 = useState('')
  const [reps, setReps]                 = useState('')
  const [duration, setDuration]         = useState('')
  const [dueDate, setDueDate]           = useState('')
  const [repeatEnabled, setRepeatEnabled] = useState(false)
  const [repeatDays, setRepeatDays]     = useState([])
  const [formError, setFormError]       = useState('')

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editingId,        setEditingId]        = useState(null)
  const [editName,         setEditName]         = useState('')
  const [editCategory,     setEditCategory]     = useState('peito')
  const [editSets,         setEditSets]         = useState('')
  const [editReps,         setEditReps]         = useState('')
  const [editDuration,     setEditDuration]     = useState('')
  const [editDueDate,      setEditDueDate]      = useState('')
  const [editRepeatEnabled,setEditRepeatEnabled] = useState(false)
  const [editRepeatDays,   setEditRepeatDays]   = useState([])
  const [saving,           setSaving]           = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const cfg   = sportFormConfig[selectedSport]
  const ph    = sportPlaceholders[language]?.[selectedSport] || sportPlaceholders.pt[selectedSport]

  const fetchExercises = async () => {
    // Fetch today's workouts + recurring ones (repeat_days set)
    let { data, error } = await supabase
      .from('workouts').select('*')
      .eq('user_id', user.id)
      .or(`date.eq.${today},repeat_days.not.is.null`)
      .order('created_at', { ascending: true })
    if (error) {
      // repeat_days column may not exist yet — fall back to today only
      ;({ data } = await supabase.from('workouts').select('*')
        .eq('user_id', user.id).eq('date', today)
        .order('created_at', { ascending: true }))
    }
    setExercises(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) fetchExercises() }, [user])

  // Filter by selected sport (null/undefined defaults to 'academia')
  const sportExercises = exercises.filter(e => (e.sport || 'academia') === selectedSport)

  const addExercise = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    setFormError('')

    const payload = {
      user_id: user.id,
      name: name.trim(),
      category: selectedSport === 'academia' ? category : selectedSport,
      done: false,
      date: today,
      sets:     sets     ? parseInt(sets)     : null,
      reps:     reps     ? parseInt(reps)     : null,
      duration: duration ? parseInt(duration) : null,
    }

    // Try inserting with new columns first; fall back without them if they don't exist
    let data = null
    let error = null

    const fullPayload = {
      ...payload,
      sport: selectedSport,
      due_date: dueDate || null,
      repeat_days: repeatEnabled && repeatDays.length > 0 ? JSON.stringify(repeatDays) : null,
    }
    ;({ data, error } = await supabase.from('workouts').insert(fullPayload).select().single())

    if (error) {
      // Columns likely missing — try without new columns
      ;({ data, error } = await supabase.from('workouts').insert(payload).select().single())
      if (error) {
        setFormError(`Erro: ${error.message}`)
        setAdding(false)
        return
      }
      setFormError('⚠️ Execute o SQL de migração no Supabase para salvar esporte, data e repetição.')
    }

    if (data) setExercises(prev => [...prev, data])
    setName(''); setSets(''); setReps(''); setDuration(''); setDueDate('')
    setRepeatEnabled(false); setRepeatDays([])
    setShowForm(false); setAdding(false)
  }

  const toggleExercise = async (ex) => {
    const { data } = await supabase.from('workouts').update({ done: !ex.done }).eq('id', ex.id).select().single()
    if (data) setExercises(prev => prev.map(e => e.id === ex.id ? data : e))
  }

  const deleteExercise = async (id) => {
    await supabase.from('workouts').delete().eq('id', id)
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  const startEdit = (ex) => {
    setEditingId(ex.id)
    setEditName(ex.name || '')
    setEditCategory(ex.category || 'peito')
    setEditSets(ex.sets ? String(ex.sets) : '')
    setEditReps(ex.reps ? String(ex.reps) : '')
    setEditDuration(ex.duration ? String(ex.duration) : '')
    setEditDueDate(ex.due_date || '')
    const parsedDays = ex.repeat_days ? (() => { try { return JSON.parse(ex.repeat_days) } catch { return [] } })() : []
    setEditRepeatEnabled(parsedDays.length > 0)
    setEditRepeatDays(parsedDays)
    setShowForm(false)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return
    setSaving(true)
    const updates = {
      name:     editName.trim(),
      category: selectedSport === 'academia' ? editCategory : selectedSport,
      sets:     editSets     ? parseInt(editSets)     : null,
      reps:     editReps     ? parseInt(editReps)     : null,
      duration: editDuration ? parseInt(editDuration) : null,
      due_date: editDueDate || null,
      repeat_days: editRepeatEnabled && editRepeatDays.length > 0 ? JSON.stringify(editRepeatDays) : null,
    }
    const { data } = await supabase.from('workouts').update(updates).eq('id', editingId).select().single()
    if (data) setExercises(prev => prev.map(ex => ex.id === editingId ? data : ex))
    setSaving(false)
    setEditingId(null)
  }

  const done      = sportExercises.filter(e => e.done).length
  const pct       = sportExercises.length > 0 ? Math.round((done / sportExercises.length) * 100) : 0
  const pending   = sportExercises.filter(e => !e.done)
  const completed = sportExercises.filter(e => e.done)

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--input-bg)', border: '1px solid var(--border-md)',
    color: 'var(--text)', borderRadius: 12, padding: '10px 12px',
    fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
  }

  // ── Inline edit form (renders in place of an exercise card) ──────────────
  function InlineEditForm() {
    const editCfg = sportFormConfig[selectedSport]
    return (
      <div style={{ background: 'var(--surface)', border: `2px solid ${primary}55`, borderRadius: 16, padding: 16, animation: 'fadeSlideUp 0.18s ease' }}>
        <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Pencil size={13} style={{ color: primary }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: primary }}>
              {language === 'en' ? 'Edit exercise' : 'Editar exercício'}
            </span>
          </div>

          <input value={editName} onChange={e => setEditName(e.target.value)} required autoFocus
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = primary}
            onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
          />

          {editCfg.showCategory && (
            <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = primary}
              onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
            >
              {cats.map(c => <option key={c.value} value={c.value} style={{ background: 'var(--surface)' }}>{c.emoji} {c.label}</option>)}
            </select>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[editCfg.showSets, editCfg.showReps, editCfg.showDuration].filter(Boolean).length}, 1fr)`, gap: 10 }}>
            {editCfg.showSets && (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  {editCfg.setsLabel ? editCfg.setsLabel[language] || editCfg.setsLabel.pt : t('workout.sets')}
                </label>
                <input type="number" min="1" value={editSets} onChange={e => setEditSets(e.target.value)} placeholder="4"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = primary}
                  onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
                />
              </div>
            )}
            {editCfg.showReps && (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  {editCfg.distLabel ? editCfg.distLabel[language] || editCfg.distLabel.pt : t('workout.reps')}
                </label>
                <input type="number" min="1" value={editReps} onChange={e => setEditReps(e.target.value)} placeholder={editCfg.distLabel ? '10' : '12'}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = primary}
                  onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
                />
              </div>
            )}
            {editCfg.showDuration && (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{t('workout.duration')}</label>
                <input type="number" min="1" value={editDuration} onChange={e => setEditDuration(e.target.value)} placeholder="30"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = primary}
                  onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
                />
              </div>
            )}
          </div>

          {/* Calendar date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
              style={{ ...inputStyle, width: 'auto', flex: 1, colorScheme: 'dark' }}
              onFocus={e => e.target.style.borderColor = primary}
              onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {language === 'en' ? 'Calendar date' : 'Data no calendário'}
            </span>
          </div>

          {/* Repeat toggle */}
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-md)', borderRadius: 10, padding: 10 }}>
            <button type="button"
              onClick={() => { setEditRepeatEnabled(!editRepeatEnabled); if (editRepeatEnabled) setEditRepeatDays([]) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: editRepeatEnabled ? primary : 'var(--text-dim)', fontFamily: 'inherit' }}
            >
              <span style={{ width: 34, height: 18, borderRadius: 9, flexShrink: 0, background: editRepeatEnabled ? primary : 'var(--border-md)', position: 'relative', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 1, left: editRepeatEnabled ? 17 : 1, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </span>
              <span style={{ fontSize: 12, fontWeight: editRepeatEnabled ? 600 : 400 }}>
                🔁 {language === 'en' ? 'Repeat weekly' : 'Repetir semanalmente'}
              </span>
            </button>
            {editRepeatEnabled && (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
                {DAYS.map(day => {
                  const active = editRepeatDays.includes(day.value)
                  return (
                    <button key={day.value} type="button"
                      onClick={() => setEditRepeatDays(prev => active ? prev.filter(d => d !== day.value) : [...prev, day.value])}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 2px', borderRadius: 8, border: 'none', background: active ? `color-mix(in srgb, var(--primary) 15%, transparent)` : 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit', outline: active ? `2px solid color-mix(in srgb, var(--primary) 50%, transparent)` : 'none', outlineOffset: -1, transition: 'all 0.15s' }}
                    >
                      <span style={{ fontSize: 8, fontWeight: 600, color: active ? primary : 'var(--text-muted)', textTransform: 'uppercase' }}>{language === 'en' ? day.label_en : day.label_pt}</span>
                      <span style={{ fontSize: 12 }}>{active ? '💪' : '😴'}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={cancelEdit}
              style={{ fontSize: 13, color: 'var(--text-muted)', padding: '7px 14px', borderRadius: 9, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('workout.cancel')}
            </button>
            <button type="submit" disabled={saving}
              style={{ fontSize: 13, background: primary, color: '#0a0a0a', fontWeight: 600, padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {language === 'en' ? 'Save' : 'Salvar'}
            </button>
          </div>
        </form>
        <style>{`@keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }`}</style>
      </div>
    )
  }

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <Dumbbell style={{ color: primary }} size={26} />
          {t('workout.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Sport selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {SPORTS.map(sport => {
          const active = selectedSport === sport.value
          const label  = language === 'en' ? sport.label_en : sport.label_pt
          const count  = exercises.filter(e => (e.sport || 'academia') === sport.value).length
          return (
            <button
              key={sport.value}
              onClick={() => { setSelectedSport(sport.value); setShowForm(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 12, border: 'none',
                background: active ? primary : 'var(--surface)',
                color: active ? '#fff' : 'var(--text-dim)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                boxShadow: active ? `0 4px 14px color-mix(in srgb, var(--primary) 30%, transparent)` : `0 0 0 1px var(--border)`,
                transition: 'all 0.18s',
              }}
            >
              <span style={{ fontSize: 16 }}>{sport.emoji}</span>
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18,
                  borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? 'rgba(255,255,255,0.25)' : `color-mix(in srgb, var(--primary) 15%, transparent)`,
                  color: active ? '#fff' : primary,
                  padding: '0 5px',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Stats for selected sport */}
      {sportExercises.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { val: done,                  label: t('workout.done')     },
            { val: `${pct}%`,             label: t('workout.percent'), color: primary },
            { val: sportExercises.length, label: t('workout.total')    },
          ].map(({ val, label, color }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--text)', margin: 0 }}>{val}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {sportExercises.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-dim)' }}>
                {done} {t('tasks.of')} {sportExercises.length} {t('workout.exercises')}
              </span>
              <span style={{ color: primary, fontWeight: 600 }}>{pct}%</span>
            </div>
            <div style={{ background: 'var(--border-md)', borderRadius: 999, height: 7 }}>
              <div style={{ height: 7, background: primary, borderRadius: 999, width: `${pct}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>
          {pct === 100 && <div style={{ fontSize: 22 }} className="animate-bounce">🔥</div>}
        </div>
      )}

      {/* ── Exercise section (like PhotoAlbum at bottom of Diet) ──────────── */}
      <div style={{ marginTop: 32 }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Dumbbell size={17} style={{ color: primary }} />
              {SPORTS.find(s => s.value === selectedSport)?.emoji}{' '}
              {language === 'en' ? 'Exercises' : 'Exercícios'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {sportExercises.length > 0
                ? `${sportExercises.length} ${language === 'en' ? 'exercise(s) today' : 'exercício(s) hoje'} · ${done} ${language === 'en' ? 'done' : 'feito(s)'}`
                : language === 'en' ? 'No exercises yet' : 'Nenhum exercício ainda'}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface-alt)', border: '1px solid var(--border-md)',
              color: 'var(--text-dim)', fontSize: 13, fontWeight: 500,
              padding: '8px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = primary; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = primary }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-alt)'; e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border-md)' }}
          >
            <Plus size={14} />
            {t('workout.addExercise')}
          </button>
        </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: `1px solid ${primary}33`, borderRadius: 20, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>{SPORTS.find(s => s.value === selectedSport)?.emoji}</span>
            <h3 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-dim)', margin: 0 }}>
              {t('workout.newLabel')}
            </h3>
          </div>
          <form onSubmit={addExercise} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder={ph} autoFocus required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = primary}
              onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
            />

            {/* Academia: category dropdown */}
            {cfg.showCategory && (
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                style={{ ...inputStyle }}
                onFocus={e => e.target.style.borderColor = primary}
                onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
              >
                {cats.map(c => (
                  <option key={c.value} value={c.value} style={{ background: 'var(--surface)' }}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            )}

            {/* Numeric fields */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[cfg.showSets, cfg.showReps, cfg.showDuration].filter(Boolean).length}, 1fr)`, gap: 10 }}>
              {cfg.showSets && (
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    {cfg.setsLabel ? cfg.setsLabel[language] || cfg.setsLabel.pt : t('workout.sets')}
                  </label>
                  <input type="number" min="1" value={sets} onChange={e => setSets(e.target.value)} placeholder="4"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = primary}
                    onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
                  />
                </div>
              )}
              {cfg.showReps && (
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    {cfg.distLabel ? cfg.distLabel[language] || cfg.distLabel.pt : t('workout.reps')}
                  </label>
                  <input type="number" min="1" value={reps} onChange={e => setReps(e.target.value)}
                    placeholder={cfg.distLabel ? '10' : '12'}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = primary}
                    onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
                  />
                </div>
              )}
              {cfg.showDuration && (
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    {t('workout.duration')}
                  </label>
                  <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = primary}
                    onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
                  />
                </div>
              )}
            </div>

            {/* Calendar date */}
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

            {/* Repeat weekly */}
            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-md)', borderRadius: 12, padding: 12 }}>
              <button
                type="button"
                onClick={() => { setRepeatEnabled(!repeatEnabled); if (repeatEnabled) setRepeatDays([]) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: repeatEnabled ? primary : 'var(--text-dim)', fontFamily: 'inherit',
                }}
              >
                <span style={{
                  width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                  background: repeatEnabled ? primary : 'var(--border-md)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: repeatEnabled ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </span>
                <span style={{ fontSize: 13, fontWeight: repeatEnabled ? 600 : 400 }}>
                  🔁 {language === 'en' ? 'Repeat weekly' : 'Repetir semanalmente'}
                </span>
              </button>

              {repeatEnabled && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {language === 'en' ? 'Training days · Rest days = unselected' : 'Dias de treino · Dias de folga = não selecionados'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                    {DAYS.map(day => {
                      const active = repeatDays.includes(day.value)
                      const label  = language === 'en' ? day.label_en : day.label_pt
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => setRepeatDays(prev =>
                            active ? prev.filter(d => d !== day.value) : [...prev, day.value]
                          )}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            padding: '8px 4px', borderRadius: 10, border: 'none',
                            background: active ? `color-mix(in srgb, var(--primary) 15%, transparent)` : 'var(--surface-2)',
                            cursor: 'pointer', fontFamily: 'inherit',
                            outline: active ? `2px solid color-mix(in srgb, var(--primary) 50%, transparent)` : 'none',
                            outlineOffset: -1,
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: 9, fontWeight: 600, color: active ? primary : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {label}
                          </span>
                          <span style={{ fontSize: 14 }}>{active ? '💪' : '😴'}</span>
                        </button>
                      )
                    })}
                  </div>
                  {repeatDays.length > 0 && (() => {
                    const restDays = DAYS.filter(d => !repeatDays.includes(d.value))
                    const restLabels = restDays.map(d => language === 'en' ? d.label_en : d.label_pt)
                    return (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                        💪 {repeatDays.join(' · ')}
                        {restLabels.length > 0 && <> &nbsp;·&nbsp; 😴 {restLabels.join(' · ')}</>}
                      </p>
                    )
                  })()}
                </div>
              )}
            </div>

            {formError && (
              <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '8px 12px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ fontSize: 13.5, color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('workout.cancel')}
              </button>
              <button type="submit" disabled={adding}
                style={{ fontSize: 13.5, background: primary, color: '#0a0a0a', fontWeight: 600, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                {adding && <Loader2 size={14} className="animate-spin" />}
                {t('workout.add')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exercise list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 size={28} style={{ color: primary }} className="animate-spin" />
        </div>
      ) : sportExercises.length === 0 && !showForm ? (
        <div style={{
          border: '2px dashed var(--border-md)', borderRadius: 20,
          padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)',
        }}>
          <span style={{ fontSize: 44, display: 'block', marginBottom: 12 }}>
            {SPORTS.find(s => s.value === selectedSport)?.emoji}
          </span>
          <p style={{ fontWeight: 500, color: 'var(--text-dim)', marginBottom: 4 }}>{t('workout.empty')}</p>
          <p style={{ fontSize: 13 }}>{t('workout.emptyHint')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pending.length > 0 && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {t('workout.pending')} ({pending.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pending.map(e => editingId === e.id
                  ? <InlineEditForm key={e.id} />
                  : <ExerciseCard key={e.id} exercise={e} onToggle={toggleExercise} onDelete={deleteExercise} onEdit={startEdit} cats={cats} primary={primary} sport={selectedSport} />
                )}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {t('workout.completed')} ({completed.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completed.map(e => editingId === e.id
                  ? <InlineEditForm key={e.id} />
                  : <ExerciseCard key={e.id} exercise={e} onToggle={toggleExercise} onDelete={deleteExercise} onEdit={startEdit} cats={cats} primary={primary} sport={selectedSport} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      </div>{/* end exercise section */}

      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </Layout>
  )
}
