import { useEffect, useState } from 'react'

export default function StreakAnimation({ streak, onDone }) {
  const [displayNum, setDisplayNum] = useState(0)
  const [phase, setPhase]           = useState('in')  // 'in' | 'out'

  // Count up from 0 → streak over ~900ms
  useEffect(() => {
    if (streak <= 0) { setDisplayNum(0); return }
    const duration = Math.min(900, streak * 120)   // faster for small numbers
    const steps    = streak
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current++
      setDisplayNum(current)
      if (current >= streak) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [streak])

  // Auto-close after 3.2s
  useEffect(() => {
    const fade = setTimeout(() => setPhase('out'), 2600)
    const done = setTimeout(onDone,                3200)
    return () => { clearTimeout(fade); clearTimeout(done) }
  }, [])

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000',
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.6s ease' : 'opacity 0.25s ease',
        cursor: 'pointer',
      }}
    >
      {/* Radial glow behind content */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(251,146,60,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        textAlign: 'center',
        animation: 'streakPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        userSelect: 'none',
        position: 'relative',
      }}>

        {/* Fire emoji */}
        <div style={{
          fontSize: 100,
          lineHeight: 1,
          animation: 'fireFlicker 0.8s ease-in-out infinite alternate',
          filter: 'drop-shadow(0 0 32px rgba(251,146,60,0.9)) drop-shadow(0 0 64px rgba(234,88,12,0.5))',
        }}>
          🔥
        </div>

        {/* Counting number */}
        <div style={{
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: '-0.06em',
          lineHeight: 1,
          marginTop: 8,
          color: '#fff',
          textShadow: '0 0 60px rgba(251,146,60,0.8), 0 0 20px rgba(251,146,60,0.5)',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 120,
          display: 'inline-block',
        }}>
          {displayNum}
        </div>

        {/* "dia(s)" label */}
        <div style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.85)',
          marginTop: 6,
          letterSpacing: '-0.02em',
        }}>
          {displayNum === 1 ? 'dia consecutivo' : 'dias consecutivos'}
        </div>

        {/* Motivational sub-line */}
        <div style={{
          fontSize: 15,
          color: '#fb923c',
          marginTop: 10,
          fontWeight: 600,
          opacity: displayNum >= streak ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}>
          {streak === 1 ? '🏁 Começo de uma sequência!' : streak >= 7 ? '🏆 Semana completa!' : '🔥 Continue assim!'}
        </div>

        {/* Tap hint */}
        <div style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.25)',
          marginTop: 36,
        }}>
          toque para fechar
        </div>
      </div>

      <style>{`
        @keyframes streakPop {
          0%   { transform: scale(0.15) translateY(40px); opacity: 0 }
          65%  { transform: scale(1.08) translateY(-6px); opacity: 1 }
          82%  { transform: scale(0.97) translateY(2px) }
          100% { transform: scale(1)    translateY(0) }
        }
        @keyframes fireFlicker {
          from { transform: scale(1)    rotate(-4deg); filter: drop-shadow(0 0 28px rgba(251,146,60,0.9)) }
          to   { transform: scale(1.10) rotate(4deg);  filter: drop-shadow(0 0 48px rgba(234,88,12,1)) }
        }
      `}</style>
    </div>
  )
}
