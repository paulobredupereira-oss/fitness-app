import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/layout/Layout'
import ProgressRing from '../../components/ui/ProgressRing'
import {
  CheckSquare, UtensilsCrossed, Dumbbell,
  TrendingUp, Flame, Trophy, ArrowRight
} from 'lucide-react'

function StatCard({ icon: Icon, label, done, total, color, to, ringColor }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <Link to={to} className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{done}<span className="text-slate-400 text-sm font-normal">/{total}</span></p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: ringColor }}
        />
      </div>
      <p className="text-xs text-slate-400">{percent}% concluído</p>
    </Link>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ tasks: { done: 0, total: 0 }, meals: { done: 0, total: 0 }, workouts: { done: 0, total: 0 } })
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Atleta'

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      const [tasksRes, mealsRes, workoutsRes] = await Promise.all([
        supabase.from('tasks').select('done').eq('user_id', user.id).eq('date', today),
        supabase.from('meals').select('done').eq('user_id', user.id).eq('date', today),
        supabase.from('workouts').select('done').eq('user_id', user.id).eq('date', today),
      ])
      setStats({
        tasks: {
          done: (tasksRes.data || []).filter(t => t.done).length,
          total: (tasksRes.data || []).length
        },
        meals: {
          done: (mealsRes.data || []).filter(m => m.done).length,
          total: (mealsRes.data || []).length
        },
        workouts: {
          done: (workoutsRes.data || []).filter(w => w.done).length,
          total: (workoutsRes.data || []).length
        }
      })
      setLoading(false)
    }
    fetchStats()
  }, [user, today])

  const overallPercent = () => {
    const t = stats.tasks.total + stats.meals.total + stats.workouts.total
    if (t === 0) return 0
    const d = stats.tasks.done + stats.meals.done + stats.workouts.done
    return Math.round((d / t) * 100)
  }

  const pct = overallPercent()

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          {getGreeting()}, {userName}! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white mb-6 flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <ProgressRing percent={pct} size={96} stroke={7} color="white" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{pct}%</span>
          </div>
        </div>
        <div>
          <p className="text-blue-100 text-sm font-medium">Progresso de hoje</p>
          <h2 className="text-2xl font-bold mt-0.5">
            {pct === 0 ? 'Vamos começar! 💪' : pct < 50 ? 'Continue assim!' : pct < 100 ? 'Quase lá! 🔥' : 'Dia completo! 🏆'}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            {stats.tasks.done + stats.meals.done + stats.workouts.done} de {stats.tasks.total + stats.meals.total + stats.workouts.total} itens concluídos
          </p>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
            <Flame size={20} className="text-orange-300" />
            <div>
              <p className="text-xs text-blue-100">Sequência</p>
              <p className="text-lg font-bold">{streak} dias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={CheckSquare} label="Tarefas do dia" done={stats.tasks.done} total={stats.tasks.total} color="bg-indigo-500" ringColor="#6366f1" to="/tarefas" />
        <StatCard icon={UtensilsCrossed} label="Refeições" done={stats.meals.done} total={stats.meals.total} color="bg-emerald-500" ringColor="#10b981" to="/dieta" />
        <StatCard icon={Dumbbell} label="Exercícios" done={stats.workouts.done} total={stats.workouts.total} color="bg-orange-500" ringColor="#f97316" to="/treinos" />
      </div>

      {/* Motivacional */}
      {!loading && stats.tasks.total === 0 && stats.meals.total === 0 && stats.workouts.total === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Pronto para começar?</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Adicione tarefas, suas refeições e treinos de hoje para acompanhar seu progresso.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/tarefas" className="bg-indigo-50 text-indigo-700 font-medium text-sm px-4 py-2 rounded-xl hover:bg-indigo-100 transition">+ Adicionar tarefas</Link>
            <Link to="/dieta" className="bg-emerald-50 text-emerald-700 font-medium text-sm px-4 py-2 rounded-xl hover:bg-emerald-100 transition">+ Planejar refeições</Link>
            <Link to="/treinos" className="bg-orange-50 text-orange-700 font-medium text-sm px-4 py-2 rounded-xl hover:bg-orange-100 transition">+ Registrar treino</Link>
          </div>
        </div>
      )}
    </Layout>
  )
}
