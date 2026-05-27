import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Cadastro() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await signUp(email, password, name)
    if (error) {
      setError(error.message === 'User already registered'
        ? 'Este email já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.')
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, fontSize: 13.5,
    color: '#fafafa',
    outline: 'none',
    fontFamily: 'inherit',
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{
          background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 380, width: '100%',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 28,
          }}>🎉</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', margin: '0 0 8px' }}>Conta criada!</h2>
          <p style={{ fontSize: 13, color: 'rgba(250,250,250,0.45)', lineHeight: 1.5 }}>
            Verifique seu email para confirmar a conta.<br />Redirecionando para o login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 16,
            background: '#ff4d2e', marginBottom: 14,
            boxShadow: '0 0 32px rgba(255,77,46,0.3)',
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#0a0a0a' }}>F</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em', margin: 0 }}>FitLife</h1>
          <p style={{ fontSize: 13, color: 'rgba(250,250,250,0.4)', marginTop: 4 }}>Sua jornada fitness começa aqui</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 32,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: '0 0 4px' }}>Crie sua conta</h2>
          <p style={{ fontSize: 13, color: 'rgba(250,250,250,0.4)', marginBottom: 24 }}>Comece sua jornada fitness hoje</p>

          {error && (
            <div style={{
              background: 'rgba(255,77,46,0.1)', border: '1px solid rgba(255,77,46,0.25)',
              color: '#ff6b4a', fontSize: 13, borderRadius: 12, padding: '10px 14px', marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Nome */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'rgba(250,250,250,0.55)', marginBottom: 6 }}>
                Nome
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(250,250,250,0.3)' }} />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,77,46,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'rgba(250,250,250,0.55)', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(250,250,250,0.3)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,77,46,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'rgba(250,250,250,0.55)', marginBottom: 6 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(250,250,250,0.3)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  required
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,77,46,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(250,250,250,0.35)', padding: 0, display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px',
                background: loading ? 'rgba(255,77,46,0.6)' : '#ff4d2e',
                border: 'none', borderRadius: 12,
                color: '#0a0a0a', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit', transition: 'background 0.15s',
                marginTop: 4,
              }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(250,250,250,0.4)', marginTop: 20 }}>
            Já tem conta?{' '}
            <Link to="/login" style={{ color: '#ff4d2e', fontWeight: 500, textDecoration: 'none' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
