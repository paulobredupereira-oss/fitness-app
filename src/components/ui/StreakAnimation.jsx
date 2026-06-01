import { useEffect, useState } from 'react'

export default function StreakAnimation({ streak, onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'out'

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('out'), 2200)
    const doneTimer = setTimeout(onDone, 2800)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [])

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.55s ease' : 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{
        textAlign: 'center',
        animation: 'streakPop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards',
        userSelect: 'none',
      }}>
        {/* Fire emoji with glow */}
        <div style={{
          fontSize: 88,
          lineHeight: 1,
          filter: 'drop-shadow(0 0 28px rgba(251,146,60,0.8))',
          animation: 'streakFlicker 0.9s ease-in-out infinite alternate',
        }}>
          🔥
        </div>

        {/* Streak number */}
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: '-0.05em',
          lineHeight: 1,
          marginTop: 12,
          color: '#fff',
          textShadow: '0 0 40px rgba(251,146,60,0.6)',
        }}>
          {streak}
        </div>

        {/* Label */}
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.75)',
          marginTop: 8,
          letterSpacing: '-0.01em',
        }}>
          {streak === 1 ? 'dia consecutivo!' : 'dias consecutivos!'}
        </div>

        <div style={{
          fontSize: 13,
          color: 'rgba(251,146,60,0.7)',
          marginTop: 6,
          fontWeight: 500,
        }}>
          🏆 Continue assim!
        </div>

        {/* Tap to dismiss hint */}
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          marginTop: 28,
        }}>
          toque para fechar
        </div>
      </div>

      <style>{`
        @keyframes streakPop {
          0%   { transform: scale(0.2) rotate(-20deg); opacity: 0 }
          60%  { transform: scale(1.12) rotate(4deg);  opacity: 1 }
          80%  { transform: scale(0.96) rotate(-2deg) }
          100% { transform: scale(1) rotate(0deg) }
        }
        @keyframes streakFlicker {
          from { transform: scale(1) rotate(-3deg) }
          to   { transform: scale(1.08) rotate(3deg) }
        }
      `}</style>
    </div>
  )
}
