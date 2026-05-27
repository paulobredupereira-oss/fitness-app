import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User, Dumbbell } from 'lucide-react'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const SYSTEM_PROMPT = `Você é o FitAI, um assistente pessoal especializado em fitness, musculação, nutrição e saúde.
Você é como um personal trainer e nutricionista brasileiro amigável e motivador.
Responda sempre em português brasileiro de forma clara, objetiva e prática.
Foque em responder dúvidas sobre:
- Treinos e exercícios (técnica, séries, repetições, grupos musculares)
- Dieta e nutrição (alimentos, calorias, macros, timing de refeições)
- Suplementação (whey, creatina, etc.)
- Recuperação muscular e descanso
- Motivação e hábitos saudáveis
Seja direto e dê dicas práticas. Limite respostas a no máximo 3-4 parágrafos curtos.
Se a pergunta não for sobre fitness/saúde, redirecione gentilmente para o tema.`

async function askGroq(messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.7,
      max_tokens: 512,
    })
  })

  if (!res.ok) throw new Error('Erro na API Groq')
  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'Desculpe, não consegui responder agora.'
}

export default function AIChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! 💪 Sou o FitAI, seu consultor de treino e dieta. Como posso te ajudar hoje?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [noKey, setNoKey] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'SUA_CHAVE_AQUI') {
      setNoKey(true)
    }
  }, [])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (noKey) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const reply = await askGroq(newMessages)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Não consegui responder agora. Verifique sua chave da API Groq no Vercel.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Chat Panel */}
      {open && (
        <div className="w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          style={{ height: '500px' }}>

          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Dumbbell size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">FitAI</p>
                <p className="text-blue-200 text-xs">Consultor fitness</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition">
              <X size={18} />
            </button>
          </div>

          {/* Aviso sem chave */}
          {noKey && (
            <div className="mx-3 mt-3 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5 text-xs text-yellow-700 flex-shrink-0">
              ⚠️ <strong>Chave da API não configurada.</strong> Adicione{' '}
              <code className="bg-yellow-100 px-1 rounded">VITE_GROQ_API_KEY</code>{' '}
              nas variáveis de ambiente do Vercel para ativar a IA.
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === 'assistant' ? 'bg-blue-100' : 'bg-slate-100'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot size={14} className="text-blue-600" />
                    : <User size={14} className="text-slate-500" />
                  }
                </div>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-slate-100 text-slate-700 rounded-tl-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-blue-600" />
                </div>
                <div className="bg-slate-100 px-3 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Sugestões rápidas */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
              {['Como ganhar massa?', 'Dieta para emagrecer', 'Treino para iniciantes'].map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-blue-100 transition flex-shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-100 p-3 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pergunte sobre treino ou dieta..."
              disabled={loading || noKey}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading || noKey}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition flex-shrink-0"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 ${
          open ? 'bg-slate-600 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
        }`}
      >
        {open
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} className="text-white" />
        }
      </button>
    </div>
  )
}
