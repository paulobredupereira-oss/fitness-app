import { useState, useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import Layout from '../../components/layout/Layout'
import { Activity, Calculator } from 'lucide-react'

const ACTIVITIES = [
  { value: 'sedentary',   mult: 1.2,   pt: 'Sedentário — sem exercícios',         en: 'Sedentary — no exercise'          },
  { value: 'light',       mult: 1.375, pt: 'Leve — 1 a 3 dias por semana',        en: 'Light — 1 to 3 days per week'     },
  { value: 'moderate',    mult: 1.55,  pt: 'Moderado — 3 a 5 dias por semana',    en: 'Moderate — 3 to 5 days per week'  },
  { value: 'active',      mult: 1.725, pt: 'Muito ativo — 6 a 7 dias por semana', en: 'Very active — 6 to 7 days a week' },
  { value: 'very_active', mult: 1.9,   pt: 'Extremo — 2 vezes ao dia',            en: 'Extra active — twice a day'       },
]

const STORAGE_KEY = 'fl-bmr-profile'

/** Mifflin-St Jeor — more accurate formula */
function computeBMR({ gender, age, height, weight }) {
  const h = parseFloat(height), w = parseFloat(weight), a = parseFloat(age)
  if (!h || !w || !a || h <= 0 || w <= 0 || a <= 0) return null
  const base = (10 * w) + (6.25 * h) - (5 * a)
  return gender === 'male' ? base + 5 : base - 161
}

export default function BMR() {
  const { primary, language } = useSettings()
  const isEn = language === 'en'

  const [gender,   setGender]   = useState('male')
  const [age,      setAge]      = useState('')
  const [height,   setHeight]   = useState('')
  const [weight,   setWeight]   = useState('')
  const [activity, setActivity] = useState('moderate')
  const [result,   setResult]   = useState(null)

  /* ── Load saved profile from localStorage ───────────────────── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const data = JSON.parse(saved)
      if (data.gender)        setGender(data.gender)
      if (data.age)           setAge(String(data.age))
      if (data.height_cm)     setHeight(String(data.height_cm))
      if (data.weight_kg)     setWeight(String(data.weight_kg))
      if (data.activity)      setActivity(data.activity)
      if (data.bmr && data.tdee) {
        setResult({ bmr: data.bmr, tdee: data.tdee, savedAt: data.savedAt })
      }
    } catch (_) {}
  }, [])

  /* ── Calculate & save to localStorage ──────────────────────── */
  const handleCalc = () => {
    const raw = computeBMR({ gender, age, height, weight })
    if (!raw) return
    const act  = ACTIVITIES.find(a => a.value === activity)
    const bmr  = Math.round(raw)
    const tdee = Math.round(raw * act.mult)
    const now  = new Date().toISOString()

    const profile = {
      gender, age: parseFloat(age),
      height_cm: parseFloat(height), weight_kg: parseFloat(weight),
      activity, bmr, tdee, savedAt: now,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    setResult({ bmr, tdee, savedAt: now })
  }

  const canCalc = age && height && weight && +age > 0 && +height > 0 && +weight > 0
  const act = ACTIVITIES.find(a => a.value === activity)

  const inputSt = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--input-bg)', border: '1px solid var(--border-md)',
    color: 'var(--text)', borderRadius: 12, padding: '10px 14px',
    fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
  }
  const focusOn  = e => { e.target.style.borderColor = primary }
  const focusOff = e => { e.target.style.borderColor = 'var(--border-md)' }

  return (
    <Layout>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <Activity style={{ color: primary }} size={26} />
          {isEn ? 'Basal Metabolic Rate' : 'Taxa Metabólica Basal'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 5 }}>
          {isEn
            ? 'Calculate how many calories your body needs per day'
            : 'Calcule quantas calorias seu corpo precisa por dia'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }} className="md:grid">

        {/* ── Form card ──────────────────────────────────────────── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dim)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {isEn ? 'Your data' : 'Seus dados'}
          </h2>

          {/* Gender */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              {isEn ? 'Gender' : 'Gênero'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: 'male',   pt: '♂ Masculino', en: '♂ Male'   },
                { v: 'female', pt: '♀ Feminino',  en: '♀ Female' },
              ].map(opt => {
                const on = gender === opt.v
                return (
                  <button key={opt.v} type="button" onClick={() => setGender(opt.v)} style={{
                    flex: 1, padding: '11px 14px', borderRadius: 12, fontFamily: 'inherit',
                    border: `1.5px solid ${on ? primary : 'var(--border-md)'}`,
                    background: on ? `${primary}18` : 'var(--input-bg)',
                    color: on ? primary : 'var(--text-dim)',
                    fontWeight: on ? 600 : 400, fontSize: 13.5,
                    cursor: 'pointer', transition: 'all 0.15s',
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
              { label: isEn ? 'Age'    : 'Idade',  unit: isEn ? 'yrs' : 'anos', val: age,    set: setAge,    ph: '25'  },
              { label: isEn ? 'Height' : 'Altura', unit: 'cm',                  val: height, set: setHeight, ph: '170' },
              { label: isEn ? 'Weight' : 'Peso',   unit: 'kg',                  val: weight, set: setWeight, ph: '70'  },
            ].map(({ label, unit, val, set, ph }) => (
              <div key={label}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
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
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              {isEn ? 'Activity Level' : 'Nível de Atividade'}
            </label>
            <select value={activity} onChange={e => setActivity(e.target.value)}
              style={inputSt} onFocus={focusOn} onBlur={focusOff}>
              {ACTIVITIES.map(a => (
                <option key={a.value} value={a.value} style={{ background: 'var(--surface)' }}>
                  {isEn ? a.en : a.pt}
                </option>
              ))}
            </select>
          </div>

          {/* CTA button */}
          <button
            onClick={handleCalc}
            disabled={!canCalc}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: canCalc ? primary : 'var(--border-md)',
              color: canCalc ? '#0a0a0a' : 'var(--text-faint)',
              border: 'none', borderRadius: 12, padding: '13px',
              fontSize: 14, fontWeight: 600,
              cursor: canCalc ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'all 0.15s', marginTop: 4,
            }}
          >
            <Calculator size={15} />
            {isEn ? 'Calculate' : 'Calcular'}
          </button>

          {/* Formula note */}
          <p style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', margin: 0 }}>
            {isEn ? 'Formula: Mifflin-St Jeor (most accurate)' : 'Fórmula: Mifflin-St Jeor (mais precisa)'}
          </p>
        </div>

        {/* ── Result card ────────────────────────────────────────── */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* BMR + TDEE tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--surface)', border: `1px solid ${primary}30`, borderRadius: 18, padding: '20px 18px' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  🔥 {isEn ? 'BMR — at rest' : 'TMB — em repouso'}
                </p>
                <p style={{ fontSize: 32, fontWeight: 700, color: primary, margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {result.bmr.toLocaleString()}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  kcal / {isEn ? 'day' : 'dia'}
                </p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 18px' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  ⚡ TDEE — {isEn ? act?.en.split('—')[0].trim() : act?.pt.split('—')[0].trim()}
                </p>
                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {result.tdee.toLocaleString()}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  kcal / {isEn ? 'day' : 'dia'}
                </p>
              </div>
            </div>

            {/* Goal targets */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
                {isEn ? 'Calorie targets by goal' : 'Metas calóricas por objetivo'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🥗', label: isEn ? 'Lose weight'  : 'Emagrecer',   kcal: result.tdee - 500, color: '#3b82f6', hint: isEn ? '−500 kcal deficit' : '−500 kcal de déficit' },
                  { icon: '⚖️', label: isEn ? 'Maintain'     : 'Manter peso',  kcal: result.tdee,       color: primary,   hint: isEn ? 'Maintenance calories' : 'Calorias de manutenção' },
                  { icon: '💪', label: isEn ? 'Gain muscle'  : 'Ganhar massa', kcal: result.tdee + 300, color: '#10b981', hint: isEn ? '+300 kcal surplus' : '+300 kcal de superávit' },
                ].map(({ icon, label, kcal, color, hint }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--input-bg)', borderRadius: 12,
                    border: '1px solid var(--border)',
                  }}>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{icon} {label}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>{hint}</p>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color, flexShrink: 0 }}>
                      ~{kcal.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved timestamp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <span style={{ fontSize: 13 }}>💾</span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {isEn ? 'Saved on ' : 'Salvo em '}
                <strong style={{ color: 'var(--text-dim)' }}>
                  {new Date(result.savedAt).toLocaleString(isEn ? 'en-US' : 'pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </strong>
              </p>
            </div>
          </div>
        )}

        {/* placeholder before first calc */}
        {!result && (
          <div style={{ background: 'var(--surface)', border: '1px dashed var(--border-md)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, color: 'var(--text-muted)' }} className="hidden md:flex">
            <Activity size={40} style={{ opacity: 0.25 }} />
            <p style={{ textAlign: 'center', fontSize: 13, margin: 0 }}>
              {isEn ? 'Fill in your data and click "Calculate" to see your results here.'
                    : 'Preencha seus dados e clique em "Calcular" para ver seus resultados aqui.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
