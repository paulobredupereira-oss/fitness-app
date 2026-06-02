import { useSettings, ACCENTS } from '../../contexts/SettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { getT } from '../../lib/i18n'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import { Settings as SettingsIcon, Check, Moon, Sun, Palette, Globe, HeadphonesIcon, MessageCircle, LogOut } from 'lucide-react'

/* ── Theme preview mini-card ─────────────────────────────────────────── */
function ThemePreview({ isDark }) {
  const bg      = isDark ? '#0a0a0a' : '#f0eeea'
  const surface = isDark ? '#141414' : '#ffffff'
  const text     = isDark ? 'rgba(250,250,250,0.85)' : 'rgba(0,0,0,0.8)'
  const textDim  = isDark ? 'rgba(250,250,250,0.35)' : 'rgba(0,0,0,0.35)'
  const border   = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'

  return (
    <div style={{
      width: '100%', height: 90, borderRadius: 10, background: bg,
      padding: 10, boxSizing: 'border-box', overflow: 'hidden',
      border: `1px solid ${border}`,
    }}>
      {/* mini sidebar strip */}
      <div style={{ display: 'flex', gap: 6, height: '100%' }}>
        <div style={{ width: 22, background: isDark ? '#080808' : '#fafaf8', borderRadius: 6, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ background: surface, borderRadius: 6, padding: '5px 7px', border: `1px solid ${border}` }}>
            <div style={{ width: '60%', height: 5, borderRadius: 3, background: text, opacity: 0.7, marginBottom: 4 }} />
            <div style={{ width: '40%', height: 3, borderRadius: 3, background: textDim }} />
          </div>
          <div style={{ background: surface, borderRadius: 6, padding: '5px 7px', border: `1px solid ${border}`, flex: 1 }}>
            <div style={{ width: '30%', height: 3, borderRadius: 3, background: textDim, marginBottom: 4 }} />
            <div style={{ width: '70%', height: 4, borderRadius: 3, background: text, opacity: 0.5 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Language flag card ──────────────────────────────────────────────── */
function LangCard({ flag, label, sublabel, active, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '16px 14px',
        background: active ? `${primary}14` : 'var(--surface-2, rgba(255,255,255,0.04))',
        border: `1.5px solid ${active ? primary : 'var(--border, rgba(255,255,255,0.08))'}`,
        borderRadius: 14, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        transition: 'all 0.2s',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 28 }}>{flag}</span>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: active ? primary : 'var(--text, #fafafa)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted, rgba(250,250,250,0.4))', marginTop: 2 }}>{sublabel}</div>
      </div>
      {active && (
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={10} color="#0a0a0a" strokeWidth={3} />
        </div>
      )}
    </button>
  )
}

/* ── Section wrapper ─────────────────────────────────────────────────── */
function Section({ icon: Icon, title, desc, children }) {
  return (
    <div style={{
      background: 'var(--surface, #141414)',
      border: '1px solid var(--border, rgba(255,255,255,0.08))',
      borderRadius: 20, padding: 24, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Icon size={18} style={{ color: 'var(--primary, #ff4d2e)' }} />
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text, #fafafa)', margin: 0 }}>{title}</h2>
      </div>
      {desc && <p style={{ fontSize: 12.5, color: 'var(--text-muted, rgba(250,250,250,0.4))', marginBottom: 20, marginLeft: 28 }}>{desc}</p>}
      {!desc && <div style={{ height: 16 }} />}
      {children}
    </div>
  )
}

export default function Settings() {
  const { theme, setTheme, accent, setAccent, language, setLanguage, primary, ACCENTS } = useSettings()
  const { signOut } = useAuth()
  const navigate    = useNavigate()
  const t = getT(language)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const themeOptions = [
    {
      key: 'dark',
      icon: Moon,
      label: t('settings.dark'),
      desc: t('settings.darkDesc'),
    },
    {
      key: 'light',
      icon: Sun,
      label: t('settings.light'),
      desc: t('settings.lightDesc'),
    },
  ]

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text, #fafafa)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <SettingsIcon style={{ color: primary }} size={26} />
          {t('settings.title')}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted, rgba(250,250,250,0.4))', marginTop: 4 }}>
          {t('settings.saved')}
        </p>
      </div>

      {/* ── Aparência ──────────────────────────────────────────── */}
      <Section icon={Palette} title={t('settings.appearance')}>

        {/* Tema */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted, rgba(250,250,250,0.4))', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            {t('settings.themeLabel')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {themeOptions.map(({ key, icon: Icon, label, desc }) => {
              const active = theme === key
              return (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  style={{
                    padding: 16, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? `${primary}12` : 'var(--surface-2, rgba(255,255,255,0.03))',
                    border: `1.5px solid ${active ? primary : 'var(--border, rgba(255,255,255,0.08))'}`,
                    textAlign: 'left', transition: 'all 0.2s',
                  }}
                >
                  <ThemePreview isDark={key === 'dark'} />
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <Icon size={14} style={{ color: active ? primary : 'var(--text-dim, rgba(250,250,250,0.55))' }} />
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: active ? primary : 'var(--text, #fafafa)' }}>
                          {label}
                        </span>
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted, rgba(250,250,250,0.4))', margin: 0, lineHeight: 1.4 }}>
                        {desc}
                      </p>
                    </div>
                    {active && (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cor de destaque */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted, rgba(250,250,250,0.4))', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
            {t('settings.accent')}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted, rgba(250,250,250,0.35))', marginBottom: 14 }}>
            {t('settings.accentDesc')}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(ACCENTS).map(([key, data]) => {
              const active = accent === key
              const label = language === 'en' ? data.label_en : data.label_pt
              return (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  title={label}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: data.value,
                    boxShadow: active ? `0 0 0 3px var(--surface, #141414), 0 0 0 5px ${data.value}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                  }}>
                    {active && <Check size={16} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 11, color: active ? data.value : 'var(--text-muted, rgba(250,250,250,0.4))', fontWeight: active ? 600 : 400 }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ── Idioma / Language ──────────────────────────────────── */}
      <Section icon={Globe} title={t('settings.language')} desc={t('settings.languageDesc')}>
        <div style={{ display: 'flex', gap: 12 }}>
          <LangCard
            flag="🇧🇷"
            label="Português"
            sublabel="Brasil"
            active={language === 'pt'}
            onClick={() => setLanguage('pt')}
            primary={primary}
          />
          <LangCard
            flag="🇺🇸"
            label="English"
            sublabel="United States"
            active={language === 'en'}
            onClick={() => setLanguage('en')}
            primary={primary}
          />
        </div>
      </Section>

      {/* ── Suporte / Support ──────────────────────────────────── */}
      <Section icon={HeadphonesIcon} title={language === 'en' ? 'Support' : 'Suporte'}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, marginTop: -8 }}>
          {language === 'en'
            ? 'Having trouble? Contact us via WhatsApp.'
            : 'Teve algum problema? Entre em contato pelo WhatsApp.'}
        </p>
        <a
          href="https://wa.me/5513996630625"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: `color-mix(in srgb, var(--primary) 12%, transparent)`,
            border: `1.5px solid color-mix(in srgb, var(--primary) 40%, transparent)`,
            borderRadius: 14, padding: '12px 20px',
            color: primary, fontWeight: 600, fontSize: 14,
            textDecoration: 'none', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `color-mix(in srgb, var(--primary) 20%, transparent)` }}
          onMouseLeave={e => { e.currentTarget.style.background = `color-mix(in srgb, var(--primary) 12%, transparent)` }}
        >
          <MessageCircle size={18} />
          (13) 99663-0625
        </a>
      </Section>

      {/* ── Logout ─────────────────────────────────────────────── */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '14px', borderRadius: 16, marginTop: 8,
          background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)',
          color: '#ef4444', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.45)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)' }}
      >
        <LogOut size={18} />
        {language === 'en' ? 'Sign out' : 'Sair da conta'}
      </button>
    </Layout>
  )
}
