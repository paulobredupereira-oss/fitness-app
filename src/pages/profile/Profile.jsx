import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import { User, CheckSquare, Flame, BarChart2, Loader2, Dumbbell, Utensils, CalendarDays, TrendingUp, Camera } from 'lucide-react'
import { calcWorkoutStreak } from '../../lib/workoutStreak'

/* ── Same streak logic as Sidebar ──────────────────────────────── */
function calcStreak(dates) {
  if (!dates || dates.length === 0) return { current: 0, record: 0 }
  const sorted = [...new Set(dates)].sort().reverse()
  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0]

  let current = 0
  if (sorted[0] === today || sorted[0] === yesterday) {
    current = 1
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.round((new Date(sorted[i - 1]) - new Date(sorted[i])) / 864e5)
      if (diff === 1) current++
      else break
    }
  }

  let record = current, run = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i - 1]) - new Date(sorted[i])) / 864e5)
    if (diff === 1) run++
    else { record = Math.max(record, run); run = 1 }
  }
  return { current, record: Math.max(record, run) }
}

/* ── Stat Row component ─────────────────────────────────────────── */
function StatRow({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 13.5, color: 'var(--text-dim)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

export default function Profile() {
  const { user }              = useAuth()
  const { primary, language } = useSettings()
  const isEn = language === 'en'

  const [stats,          setStats]          = useState(null)
  const [streak,         setStreak]         = useState({ current: 0, record: 0 })
  const [workoutStreak,  setWorkoutStreak]  = useState(0)
  const [loading,        setLoading]        = useState(true)
  const [avatarUrl,      setAvatarUrl]      = useState(user?.user_metadata?.avatar_url || null)
  const [uploading,      setUploading]      = useState(false)
  const fileRef = useRef(null)

  const name     = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'
  const initials = name.slice(0, 2).toUpperCase()
  const email    = user?.email || ''
  const today    = new Date().toISOString().split('T')[0]

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(isEn ? 'en-US' : 'pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null

  /* ── Fetch all stats in parallel ─────────────────────────────── */
  useEffect(() => {
    if (!user) return
    const uid = user.id

    Promise.all([
      supabase.from('tasks').select('id, done, date').eq('user_id', uid),
      supabase.from('workouts').select('id, date, done, repeat_days, completed_dates').eq('user_id', uid),
      supabase.from('meals').select('id, date').eq('user_id', uid),
    ]).then(([tasksR, workoutsR, mealsR]) => {
      const allTasks    = tasksR.data    || []
      const allWorkouts = workoutsR.data || []
      const allMeals    = mealsR.data    || []

      const todayTasks  = allTasks.filter(t => t.date === today)
      const doneTasks   = allTasks.filter(t => t.done)

      // Unique active days across all tables
      const allDates = [
        ...allTasks.map(t => t.date),
        ...allWorkouts.map(t => t.date),
        ...allMeals.map(t => t.date),
      ].filter(Boolean)
      const activeDays = new Set(allDates).size

      setStats({
        totalTasks:      allTasks.length,
        doneTasks:       doneTasks.length,
        todayTotal:      todayTasks.length,
        todayDone:       todayTasks.filter(t => t.done).length,
        completionRate:  allTasks.length > 0
          ? Math.round((doneTasks.length / allTasks.length) * 100)
          : 0,
        totalWorkouts:   allWorkouts.length,
        totalMeals:      allMeals.length,
        activeDays,
      })

      setStreak(calcStreak(allDates))
      setWorkoutStreak(calcWorkoutStreak(allWorkouts))
      setLoading(false)
    })
  }, [user])

  /* ── Avatar upload ───────────────────────────────────────────── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Imagem muito grande. Limite: 3MB.')
      return
    }
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    // Remove old avatar first (ignore error if doesn't exist)
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`])

    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) { alert('Erro no upload: ' + upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const urlWithBust = `${publicUrl}?t=${Date.now()}`

    await supabase.auth.updateUser({ data: { avatar_url: urlWithBust } })
    setAvatarUrl(urlWithBust)
    setUploading(false)
    e.target.value = ''
  }

  /* ── Loading ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={28} style={{ color: primary, animation: 'spin 0.75s linear infinite' }} />
        </div>
      </Layout>
    )
  }

  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: 22,
  }

  return (
    <Layout>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <User style={{ color: primary }} size={26} />
          {isEn ? 'My Profile' : 'Meu Perfil'}
        </h1>
      </div>

      {/* ── Profile hero card ─────────────────────────────────────── */}
      <div style={{
        ...cardStyle,
        marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 20,
        flexWrap: 'wrap',
      }}>
        {/* Avatar — clickable to change photo */}
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            position: 'relative', cursor: 'pointer',
            boxShadow: `0 0 0 4px ${primary}22, 0 4px 20px ${primary}35`,
          }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: primary, color: '#0a0a0a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em',
              }}>{initials}</div>
          }

          {/* Camera overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: uploading ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => !uploading && (e.currentTarget.style.opacity = '0')}
          >
            {uploading
              ? <Loader2 size={20} style={{ color: '#fff', animation: 'spin 0.75s linear infinite' }} />
              : <Camera size={20} style={{ color: '#fff' }} />
            }
          </div>
        </div>

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} style={{ display: 'none' }} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </p>
          {memberSince && (
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 5 }}>
              {isEn ? `Member since ${memberSince}` : `Membro desde ${memberSince}`}
            </p>
          )}
        </div>

        {/* Active days badge */}
        {stats && (
          <div style={{
            background: `${primary}15`, border: `1px solid ${primary}35`,
            borderRadius: 14, padding: '10px 16px', textAlign: 'center', flexShrink: 0,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: primary, lineHeight: 1 }}>
              {stats.activeDays}
            </div>
            <div style={{ fontSize: 11, color: primary, fontWeight: 600, marginTop: 3, opacity: 0.8 }}>
              {isEn ? 'active days' : 'dias ativos'}
            </div>
          </div>
        )}
      </div>

      {/* ── 2-column grid: Tasks card + Streak card ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="md:grid">

        {/* ── Completed Tasks card ────────────────────────────────── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={17} style={{ color: primary }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)' }}>
              {isEn ? 'Completed Tasks' : 'Tarefas Concluídas'}
            </span>
          </div>

          {/* Big number */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 44, fontWeight: 800, color: primary, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {stats?.doneTasks ?? 0}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 6 }}>
              {isEn ? 'total' : 'total'}
            </span>
          </div>

          {/* Sub-stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {isEn ? 'Today' : 'Hoje'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)' }}>
                {stats?.todayDone ?? 0} / {stats?.todayTotal ?? 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {isEn ? 'Completion rate' : 'Taxa de conclusão'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: primary }}>
                {stats?.completionRate ?? 0}%
              </span>
            </div>
            {/* Rate bar */}
            <div style={{ background: 'var(--border-md)', borderRadius: 999, height: 5, marginTop: 2 }}>
              <div style={{
                height: 5, borderRadius: 999,
                background: primary,
                width: `${stats?.completionRate ?? 0}%`,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        </div>

        {/* ── Workout Streak card ──────────────────────────────────── */}
        <div style={{
          ...cardStyle,
          background: workoutStreak > 0
            ? 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(234,88,12,0.06))'
            : cardStyle.background,
          borderColor: workoutStreak > 0 ? 'rgba(251,146,60,0.3)' : cardStyle.borderColor,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(251,146,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={17} style={{ color: '#fb923c' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)' }}>
              {isEn ? 'Workout Streak' : 'Sequência de Treinos'}
            </span>
          </div>

          {/* Big fire + number */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{
              fontSize: 44, lineHeight: 1,
              filter: workoutStreak > 0 ? 'drop-shadow(0 0 12px rgba(251,146,60,0.6))' : 'none',
            }}>
              🔥
            </span>
            <div>
              <span style={{
                fontSize: 44, fontWeight: 900,
                color: workoutStreak > 0 ? '#fb923c' : 'var(--text-faint)',
                letterSpacing: '-0.05em', lineHeight: 1,
              }}>
                {workoutStreak}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 6 }}>
                {isEn ? 'days' : 'dias'}
              </span>
            </div>
          </div>

          {/* Status + general streak comparison */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Status</span>
              <span style={{
                fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                background: workoutStreak > 0 ? 'rgba(251,146,60,0.15)' : 'var(--border)',
                color: workoutStreak > 0 ? '#fb923c' : 'var(--text-faint)',
                border: `1px solid ${workoutStreak > 0 ? 'rgba(251,146,60,0.3)' : 'transparent'}`,
              }}>
                {workoutStreak > 0 ? (isEn ? '🔥 Active' : '🔥 Ativa') : (isEn ? 'Start training!' : 'Comece a treinar!')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {isEn ? 'Activity streak' : 'Sequência geral'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)' }}>
                {streak.current} {isEn ? 'days' : 'dias'}
              </span>
            </div>

            {/* Visual bars for workout streak */}
            <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: i < Math.min(workoutStreak, 7)
                    ? `rgba(251,146,60,${0.4 + (i / 7) * 0.6})`
                    : 'var(--border-md)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
              {isEn ? 'Consecutive training days' : 'Dias de treino consecutivos'}
            </span>
          </div>
        </div>
      </div>

      {/* ── General Statistics card ───────────────────────────────── */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={17} style={{ color: '#8b5cf6' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)' }}>
            {isEn ? 'General Statistics' : 'Estatísticas Gerais'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <StatRow
            icon={<CheckSquare size={14} style={{ color: primary }} />}
            label={isEn ? 'Tasks created' : 'Tarefas criadas'}
            value={stats?.totalTasks ?? 0}
            color={primary}
          />
          <StatRow
            icon={<Dumbbell size={14} style={{ color: '#f59e0b' }} />}
            label={isEn ? 'Workouts logged' : 'Treinos registrados'}
            value={stats?.totalWorkouts ?? 0}
            color="#f59e0b"
          />
          <StatRow
            icon={<Utensils size={14} style={{ color: '#10b981' }} />}
            label={isEn ? 'Meals logged' : 'Refeições registradas'}
            value={stats?.totalMeals ?? 0}
            color="#10b981"
          />
          <StatRow
            icon={<CalendarDays size={14} style={{ color: '#3b82f6' }} />}
            label={isEn ? 'Active days' : 'Dias com atividade'}
            value={stats?.activeDays ?? 0}
            color="#3b82f6"
          />
          <div style={{ padding: '10px 0' }}>
            <StatRow
              icon={<TrendingUp size={14} style={{ color: '#8b5cf6' }} />}
              label={isEn ? 'Overall completion rate' : 'Taxa de conclusão geral'}
              value={`${stats?.completionRate ?? 0}%`}
              color="#8b5cf6"
            />
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Layout>
  )
}
