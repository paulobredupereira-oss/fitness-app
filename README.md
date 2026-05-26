# 🏋️ FitLife — Seu App de Vida Fitness

Acompanhe suas tarefas, dieta e treinos diários em um só lugar.

## 🚀 Como rodar

### 1. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. Vá em **SQL Editor → New Query**, cole o conteúdo de `supabase_schema.sql` e clique **Run**
3. Vá em **Project Settings → API** e copie:
   - `Project URL` → valor de `VITE_SUPABASE_URL`
   - chave `anon / public` → valor de `VITE_SUPABASE_ANON_KEY`

### 2. Configure as variáveis de ambiente

Edite o arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Instale e rode

```bash
npm install
npm run dev
```

Acesse: **http://localhost:5173**

---

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 🔐 Auth | Login e cadastro com email/senha |
| 📊 Dashboard | Visão geral do progresso do dia com anel de progresso |
| ✅ Tarefas | Tarefas com prioridade Alta/Média/Baixa, marcar como feito |
| 🥗 Dieta | Refeições por tipo (café, almoço, jantar...) com calorias |
| 💪 Treinos | Exercícios com séries, repetições e duração por grupo muscular |

## Stack

- React 18 + Vite + Tailwind CSS v4
- Supabase (PostgreSQL + Auth)
- React Router v7
- Lucide React (ícones)
