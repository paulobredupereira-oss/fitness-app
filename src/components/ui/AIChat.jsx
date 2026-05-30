import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, Zap, Dumbbell, CheckSquare } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { supabase } from '../../lib/supabase'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const SYSTEM_PROMPT = `Você é o FitAI, assistente pessoal de fitness integrado ao app FitLife.
Você pode responder perguntas E CRIAR conteúdo diretamente no app quando o usuário pedir.

CAPACIDADES DE CRIAÇÃO:
Quando o usuário pedir para montar/criar um treino, responda com texto curto descrevendo o treino E inclua exatamente este bloco ao final:
[ACTION]{"type":"create_workout","exercises":[{"name":"Nome","category":"peito","sets":4,"reps":10,"duration":null}]}[/ACTION]

Categorias válidas (use EXATAMENTE uma dessas): peito, costas, pernas, ombros, biceps, triceps, abdomen, cardio, outro
- series/repetições: preencha sets e reps, duration = null
- cardio/plank: duration em minutos, sets = null, reps = null
- Inclua de 5 a 8 exercícios por treino
- Varie as categorias para criar um treino completo e equilibrado

Quando o usuário pedir para criar uma tarefa, inclua:
[ACTION]{"type":"create_task","tasks":[{"title":"Título da tarefa","priority":"media"}]}[/ACTION]
Prioridades válidas: alta, media, baixa

REGRAS:
- Português brasileiro, direto e motivador
- Sem markdown (sem **, ##, *, etc.)
- Máximo 3 parágrafos curtos
- Se pedido não for de fitness/saúde, redirecione gentilmente`

/* ── Parse [ACTION] block from AI response ───────────────────── */
function parseAction(text) {
  const match = text.match(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/)
  if (!match) return { display: text, action: null }
  const display = text.replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/, '').trim()
  try {
    return { display, action: JSON.parse(match[1]) }
  } catch {
    return { display: text, action: null }
  }
}

/* ── Execute AI action in Supabase ───────────────────────────── */
async function executeAction(action, userId) {
  const today = new Date().toISOString().split('T')[0]

  if (action.type === 'create_workout') {
    const validCats = ['peito','costas','pernas','ombros','biceps','triceps','abdomen','cardio','outro']
    const rows = (action.exercises || []).map(ex => ({
      user_id:  userId,
      name:     ex.name,
      category: validCats.includes(ex.category) ? ex.category : 'outro',
      sets:     ex.sets     ?? null,
      reps:     ex.reps     ?? null,
      duration: ex.duration ?? null,
      done:     false,
      date:     today,
    }))
    const { error } = await supabase.from('workouts').insert(rows)
    if (error) throw error
    return { type: 'create_workout', count: rows.length }
  }

  if (action.type === 'create_task') {
    const rows = (action.tasks || []).map(t => ({
      user_id:     userId,
      title:       t.title,
      description: t.description || '',
      priority:    ['alta','media','baixa'].includes(t.priority) ? t.priority : 'media',
      done:        false,
      date:        today,
      due_date:    t.due_date || null,
    }))
    const { error } = await supabase.from('tasks').insert(rows)
    if (error) throw error
    return { type: 'create_task', count: rows.length }
  }

  return null
}

/* ── Action confirmation banner ──────────────────────────────── */
function ActionBanner({ result, primary }) {
  if (!result) return null
  const isWorkout = result.type === 'create_workout'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 10, marginTop: 6,
      background: isWorkout ? `${primary}18` : 'rgba(16,185,129,0.12)',
      border: `1px solid ${isWorkout ? `${primary}40` : 'rgba(16,185,129,0.3)'}`,
    }}>
      {isWorkout
        ? <Dumbbell size={14} style={{ color: primary, flexShrink: 0 }} />
        : <CheckSquare size={14} style={{ color: '#10b981', flexShrink: 0 }} />
      }
      <span style={{ fontSize: 12, color: isWorkout ? primary : '#10b981', fontWeight: 600 }}>
        {isWorkout
          ? `✅ ${result.count} exercícios criados! Abra Treinos para ver.`
          : `✅ ${result.count} tarefa(s) criada(s)! Abra Tarefas para ver.`
        }
      </span>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────── */
export default function AIChat() {
  const { user }              = useAuth()
  const { primary }           = useSettings()

  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Olá! 💪 Sou o FitAI. Posso responder dúvidas de treino e dieta, e também montar treinos direto no app. É só pedir!',
    actionResult: null,
  }])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [noKey,   setNoKey]   = useState(false)

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'SUA_CHAVE_AQUI') setNoKey(true)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open, messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading || noKey) return

    const userMsg = { role: 'user', content: text, actionResult: null }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map(m => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data  = await res.json()
      const raw   = data.choices?.[0]?.message?.content || 'Desculpe, não consegui responder agora.'

      const { display, action } = parseAction(raw)

      let actionResult = null
      if (action && user) {
        try {
          actionResult = await executeAction(action, user.id)
        } catch {
          actionResult = { type: action.type, error: true }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: display, actionResult }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Não consegui responder. Verifique a chave VITE_GROQ_API_KEY no Vercel.',
        actionResult: null,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const SUGGESTIONS = [
    'Monte um treino de peito para mim',
    'Treino completo para iniciantes',
    'Crie uma tarefa: beber 2L de água',
  ]

  /* ── Styles (dark theme with CSS vars) ────────────────────── */
  const S = {
    panel: {
      width: 370, height: 520,
      background: 'var(--sidebar-bg)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--surface)', flexShrink: 0,
    },
    messages: {
      flex: 1, overflowY: 'auto', padding: '14px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    },
    bubble: (isUser) => ({
      maxWidth: '80%',
      padding: '9px 13px',
      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      background: isUser ? primary : 'var(--surface)',
      color: isUser ? '#0a0a0a' : 'var(--text)',
      fontSize: 13, lineHeight: 1.55,
      border: isUser ? 'none' : '1px solid var(--border)',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      wordBreak: 'break-word',
    }),
    input: {
      flex: 1,
      background: 'var(--input-bg)',
      border: '1px solid var(--border-md)',
      color: 'var(--text)',          /* ← fix: explicit text color */
      borderRadius: 12,
      padding: '9px 13px',
      fontSize: 13.5,
      outline: 'none',
      fontFamily: 'inherit',
    },
    sendBtn: (canSend) => ({
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: canSend ? primary : 'var(--border-md)',
      border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.15s',
      color: canSend ? '#0a0a0a' : 'var(--text-faint)',
    }),
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>

      {/* ── Chat Panel ──────────────────────────────────────────── */}
      {open && (
        <div style={S.panel}>

          {/* Header */}
          <div style={S.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${primary}20`, border: `1px solid ${primary}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} style={{ color: primary }} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', margin: 0 }}>FitAI</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Assistente fitness</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* No-key warning */}
          {noKey && (
            <div style={{ margin: '10px 12px 0', padding: '10px 12px', borderRadius: 10, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', fontSize: 12, color: '#fbbf24', flexShrink: 0 }}>
              ⚠️ Configure <strong>VITE_GROQ_API_KEY</strong> nas variáveis de ambiente do Vercel para ativar a IA.
            </div>
          )}

          {/* Messages */}
          <div style={S.messages}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={S.bubble(msg.role === 'user')}>
                  {msg.content}
                </div>
                {msg.actionResult && !msg.actionResult.error && (
                  <ActionBanner result={msg.actionResult} primary={primary} />
                )}
                {msg.actionResult?.error && (
                  <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>
                    ⚠️ Erro ao criar no app. Tente novamente.
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', alignSelf: 'flex-start' }}>
                {[0, 150, 300].map(delay => (
                  <span key={delay} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${delay}ms`, display: 'inline-block' }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions — only on first message */}
          {messages.length === 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  style={{
                    fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
                    padding: '5px 11px', borderRadius: 20,
                    background: `${primary}14`, border: `1px solid ${primary}35`,
                    color: primary, cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pergunte ou peça para montar um treino..."
              disabled={loading || noKey}
              style={{ ...S.input, opacity: (loading || noKey) ? 0.5 : 1 }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading || noKey}
              style={S.sendBtn(input.trim() && !loading && !noKey)}
            >
              {loading
                ? <Loader2 size={15} style={{ animation: 'spin 0.75s linear infinite' }} />
                : <Send size={15} />
              }
            </button>
          </div>
        </div>
      )}

      {/* ── FAB button ──────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 52, height: 52, borderRadius: 16,
          background: open ? 'var(--surface)' : primary,
          border: open ? '1px solid var(--border)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', outline: 'none',
          boxShadow: open ? 'none' : `0 4px 20px ${primary}50`,
          transition: 'all 0.2s ease',
        }}
      >
        {open
          ? <X size={20} style={{ color: 'var(--text)' }} />
          : <MessageCircle size={20} style={{ color: '#0a0a0a' }} />
        }
      </button>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5 }
          40% { transform: scale(1); opacity: 1 }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
