import { createContext, useContext, useEffect, useState } from 'react'

export const ACCENTS = {
  orange: { label_pt: 'Laranja',  label_en: 'Orange',  value: '#ff4d2e', dark: '#e03d1e', alpha: 'rgba(255,77,46,0.15)',  shadow: 'rgba(255,77,46,0.35)' },
  blue:   { label_pt: 'Azul',    label_en: 'Blue',    value: '#3b82f6', dark: '#2563eb', alpha: 'rgba(59,130,246,0.15)',  shadow: 'rgba(59,130,246,0.35)' },
  purple: { label_pt: 'Roxo',    label_en: 'Purple',  value: '#8b5cf6', dark: '#7c3aed', alpha: 'rgba(139,92,246,0.15)', shadow: 'rgba(139,92,246,0.35)' },
  green:  { label_pt: 'Verde',   label_en: 'Green',   value: '#10b981', dark: '#059669', alpha: 'rgba(16,185,129,0.15)', shadow: 'rgba(16,185,129,0.35)' },
  pink:   { label_pt: 'Rosa',    label_en: 'Pink',    value: '#ec4899', dark: '#db2777', alpha: 'rgba(236,72,153,0.15)', shadow: 'rgba(236,72,153,0.35)' },
}

const SettingsContext = createContext({
  theme: 'dark', setTheme: () => {},
  accent: 'orange', setAccent: () => {},
  language: 'pt', setLanguage: () => {},
  primary: '#ff4d2e',
})

export function SettingsProvider({ children }) {
  const [theme,    setTheme]    = useState(() => localStorage.getItem('fl-theme')  || 'dark')
  const [accent,   setAccent]   = useState(() => localStorage.getItem('fl-accent') || 'orange')
  const [language, setLanguage] = useState(() => localStorage.getItem('fl-lang')   || 'pt')

  const accentData = ACCENTS[accent] || ACCENTS.orange

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.style.setProperty('--primary',       accentData.value)
    root.style.setProperty('--primary-dark',  accentData.dark)
    root.style.setProperty('--primary-alpha', accentData.alpha)
    root.style.setProperty('--primary-shadow',accentData.shadow)
    localStorage.setItem('fl-theme',  theme)
    localStorage.setItem('fl-accent', accent)
    localStorage.setItem('fl-lang',   language)
  }, [theme, accent, language])

  return (
    <SettingsContext.Provider value={{ theme, setTheme, accent, setAccent, language, setLanguage, primary: accentData.value, ACCENTS }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
