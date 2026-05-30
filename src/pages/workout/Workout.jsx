import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { getT } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { Dumbbell, Plus, Trash2, CheckCircle2, Circle, Loader2, Zap, Clock, Repeat, MapPin, CalendarDays } from 'lucide-react'

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
function ExerciseCard({ exercise, onToggle, onDelete, cats, primary, sport }) {
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
        </div>
      </div>
      <button
        onClick={async () => { setDeleting(true); await onDelete(exercise.id) }}
        disabled={deleting}
        style={{ color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        className="hover:text-red-400 transition"
      >
        {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      </button>
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

  const today = new Date().toISOString().split('T')[0]
  const cfg   = sportFormConfig[selectedSport]
  const ph    = sportPlaceholders[language]?.[selectedSport] || sportPlaceholders.pt[selectedSport]

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('workouts').select('*')
      .eq('user_id', user.id).eq('date', today)
      .order('created_at', { ascending: true })
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
    const { data } = await supabase.from('workouts').insert({
      user_id: user.id,
      name: name.trim(),
      category: selectedSport === 'academia' ? category : selectedSport,
      sport: selectedSport,
      sets:     sets     ? parseInt(sets)     : null,
      reps:     reps     ? parseInt(reps)     : null,
      duration: duration ? parseInt(duration) : null,
      due_date: dueDate || null,
      done: false, date: today,
    }).select().single()
    if (data) setExercises(prev => [...prev, data])
    setName(''); setSets(''); setReps(''); setDuration(''); setDueDate('')
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

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <Dumbbell style={{ color: primary }} size={26} />
            {t('workout.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: primary, color: '#0a0a0a', fontSize: 13.5, fontWeight: 600, padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Plus size={16} />
          {t('workout.addExercise')}
        </button>
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

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 size={28} style={{ color: primary }} className="animate-spin" />
        </div>
      ) : sportExercises.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-muted)' }}>
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
                {pending.map(e => <ExerciseCard key={e.id} exercise={e} onToggle={toggleExercise} onDelete={deleteExercise} cats={cats} primary={primary} sport={selectedSport} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {t('workout.completed')} ({completed.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completed.map(e => <ExerciseCard key={e.id} exercise={e} onToggle={toggleExercise} onDelete={deleteExercise} cats={cats} primary={primary} sport={selectedSport} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
