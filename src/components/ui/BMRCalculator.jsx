import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { supabase } from '../../lib/supabase'
import { Flame, ChevronDown, ChevronUp, Calculator, Loader2 } from 'lucide-react'

const ACTIVITIES = [
  { value: 'sedentary',   mult: 1.2,   pt: 'Sedentário — sem exercícios',          en: 'Sedentary — no exercise'          },
  { value: 'light',       mult: 1.375, pt: 'Leve — 1 a 3 dias por semana',         en: 'Light — 1 to 3 days per week'     },
  { value: 'moderate',    mult: 1.55,  pt: 'Moderado — 3 a 5 dias por semana',     en: 'Moderate — 3 to 5 days per week'  },
  { value: 'active',      mult: 1.725, pt: 'Muito ativo — 6 a 7 dias por semana',  en: 'Very active — 6 to 7 days a week' },
  { value: 'very_active', mult: 1.9,   pt: 'Extremo — 2 vezes ao dia',             en: 'Extra active — twice a day'       },
]

/** Mifflin-St Jeor formula */
function computeBMR({ gender, age, height, weight }) {
  const h = parseFloat(height), w = parseFloat(weight), a = parseFloat(age)
  if (!h || !w || !a || h <= 0 || w <= 0 || a <= 0) return null
  const base = (10 * w) + (6.25 * h) - (5 * a)
  return gender === 'male' ? base + 5 : base - 161
}

export default function BMRCalculator() {
  const { user } = useAuth()
  const { primary, language } = useSettings()
  const isEn = language === 'en'

  const [open,     setOpen]     = useState(false)
  const [gender,   setGender]   = useState('male')
  const [age,      setAge]      = useState('')
  const [height,   setHeight]   = useState('')
  const [weight,   setWeight]   = useState('')
  const [activity, setActivity] = useState('moderate')
  const [result,   setResult]   = useState(null)   // { bmr, tdee, savedAt }
  const [saving,   setSaving]   = useState(false)
  const [loadErr,  setLoadErr]  = useState(false)

  /* ── Load saved profile ─────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') { setLoadErr(true); return }
        if (!data) return
        if (data.gender)         setGender(data.gender)
        if (data.age)            setAge(String(data.age))
        if (data.height_cm)      setHeight(String(data.height_cm))
        if (data.weight_kg)      setWeight(String(data.weight_kg))
        if (data.activity_level) setActivity(data.activity_level)
        if (data.bmr && data.tdee) {
          setResult({ bmr: data.bmr, tdee: data.tdee, savedAt: data.updated_at })
          setOpen(true)
        }
      })
  }, [user])

  /* ── Calculate & save ───────────────────────────────────────── */
  const handleCalculate = async () => {
    const bmrRaw = computeBMR({ gender, age, height, weight })
    if (!bmrRaw) return
    const act  = ACTIVITIES.find(a => a.value === activity)
    const bmr  = Math.round(bmrRaw)
    const tdee = Math.round(bmrRaw * act.mult)
    const now  = new Date().toISOString()

    setSaving(true)
    await supabase.from('profiles').upsert({
      id: user.id, gender,
      age: parseInt(age), height_cm: parseFloat(height),
      weight_kg: parseFloat(weight), activity_level: activity,
      bmr, tdee, updated_at: now,
    })
    setResult({ bmr, tdee, savedAt: now })
    setSaving(false)
    setOpen(true)
  }

  const canCalc = age && height && weight && parseFloat(age) > 0 && parseFloat(height) > 0 && parseFloat(weight) > 0
  const act = ACTIVITIES.find(a => a.value === activity)

  /* ── Styles ─────────────────────────────────────────────────── */
  const inputSt = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--input-bg)', border: '1px solid var(--border-md)',
    color: 'var(--text)', borderRadius: 12, padding: '10px 12px',
    fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
  }

  const focusOn  = e => { e.target.style.borderColor = primary }
  const focusOff = e => { e.target.style.borderColor = 'var(--border-md)' }

  return (
    <div style={{
      marginTop: 32,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      overflow: 'hidden',
    }}>
      {/* ── Header ────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 20px', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Flame size={17} style={{ color: primary }} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            {isEn ? 'Basal Metabolic Rate' : 'Taxa Metabólica Basal'}
          </p>
          {result ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {isEn ? `BMR ${result.bmr} kcal · TDEE ${result.tdee} kcal/day` : `TMB ${result.bmr} kcal · TDEE ${result.tdee} kcal/dia`}
            </p>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {isEn ? 'Calculate and save your daily calorie needs' : 'Calcule e salve suas necessidades calóricas diárias'}
            </p>
          )}
        </div>
        {open
          ? <ChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        }
      </button>

      {/* ── Body ──────────────────────────────────────────────── */}
      {open && (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 1, background: 'var(--border)' }} />

          {loadErr && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '10px 14px', fontSize: 12.5, color: '#f87171' }}>
              {isEn
                ? '⚠️ The "profiles" table does not exist in Supabase yet. Run the SQL provided in the instructions.'
                : '⚠️ A tabela "profiles" ainda não existe no Supabase. Execute o SQL indicado nas instruções.'}
            </div>
          )}

          {/* Gender */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isEn ? 'Gender' : 'Gênero'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: 'male',   pt: '♂ Masculino', en: '♂ Male'   },
                { v: 'female', pt: '♀ Feminino',  en: '♀ Female' },
              ].map(opt => {
                const active = gender === opt.v
                return (
                  <button key={opt.v} type="button" onClick={() => setGender(opt.v)} style={{
                    flex: 1, padding: '10px 12px', borderRadius: 12,
                    border: `1.5px solid ${active ? primary : 'var(--border-md)'}`,
                    background: active ? `${primary}18` : 'var(--input-bg)',
                    color: active ? primary : 'var(--text-dim)',
                    fontWeight: active ? 600 : 400,
                    fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                    {isEn ? opt.en : opt.pt}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Age / Height / Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: isEn ? 'Age' : 'Idade',  unit: isEn ? 'yrs' : 'anos', val: age,    set: setAge,    ph: '25' },
              { label: isEn ? 'Height' : 'Altura', unit: 'cm',              val: height,  set: setHeight, ph: '170' },
              { label: isEn ? 'Weight' : 'Peso',   unit: 'kg',              val: weight,  set: setWeight, ph: '70'  },
            ].map(({ label, unit, val, set, ph }) => (
              <div key={label}>
                <label style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                  {label} <span style={{ color: 'var(--text-faint)' }}>({unit})</span>
                </label>
                <input
                  type="number" min="1" value={val} placeholder={ph}
                  onChange={e => set(e.target.value)}
                  style={inputSt} onFocus={focusOn} onBlur={focusOff}
                />
              </div>
            ))}
          </div>

          {/* Activity level */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isEn ? 'Activity Level' : 'Nível de Atividade'}
            </p>
            <select value={activity} onChange={e => setActivity(e.target.value)}
              style={inputSt} onFocus={focusOn} onBlur={focusOff}>
              {ACTIVITIES.map(a => (
                <option key={a.value} value={a.value} style={{ background: 'var(--surface)' }}>
                  {isEn ? a.en : a.pt}
                </option>
              ))}
            </select>
          </div>

          {/* Button */}
          <button
            onClick={handleCalculate}
            disabled={saving || !canCalc}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: canCalc ? primary : 'var(--border-md)',
              color: canCalc ? '#0a0a0a' : 'var(--text-faint)',
              border: 'none', borderRadius: 12, padding: '12px',
              fontSize: 14, fontWeight: 600,
              cursor: canCalc && !saving ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> {isEn ? 'Saving...' : 'Salvando...'}</>
              : <><Calculator size={15} /> {isEn ? 'Calculate & Save' : 'Calcular e Salvar'}</>
            }
          </button>

          {/* ── Result ──────────────────────────────────────── */}
          {result && (
            <div style={{ background: `${primary}0d`, border: `1px solid ${primary}28`, borderRadius: 16, padding: 18 }}>

              {/* BMR + TDEE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px' }}>
                    {isEn ? '🔥 BMR — at rest' : '🔥 TMB — em repouso'}
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: primary, margin: 0, letterSpacing: '-0.03em' }}>
                    {result.bmr.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>kcal / {isEn ? 'day' : 'dia'}</p>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px' }}>
                    ⚡ TDEE — {isEn ? act?.en.split('—')[0].trim() : act?.pt.split('—')[0].trim()}
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em' }}>
                    {result.tdee.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>kcal / {isEn ? 'day' : 'dia'}</p>
                </div>
              </div>

              {/* Goal suggestions */}
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {isEn ? 'Calorie targets by goal' : 'Metas calóricas por objetivo'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '🥗', label: isEn ? 'Lose weight'  : 'Emagrecer',   kcal: result.tdee - 500, color: '#3b82f6' },
                  { icon: '⚖️', label: isEn ? 'Maintain'     : 'Manter peso',  kcal: result.tdee,       color: primary   },
                  { icon: '💪', label: isEn ? 'Gain muscle'  : 'Ganhar massa', kcal: result.tdee + 300, color: '#10b981' },
                ].map(({ icon, label, kcal, color }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 14px', background: 'var(--surface)', borderRadius: 12,
                  }}>
                    <span style={{ fontSize: 13.5, color: 'var(--text-dim)' }}>{icon} {label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>
                      ~{kcal.toLocaleString()} kcal
                    </span>
                  </div>
                ))}
              </div>

              {/* Saved timestamp */}
              {result.savedAt && (
                <p style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'right', marginTop: 12 }}>
                  {isEn ? '💾 Saved on ' : '💾 Salvo em '}
                  {new Date(result.savedAt).toLocaleString(isEn ? 'en-US' : 'pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
