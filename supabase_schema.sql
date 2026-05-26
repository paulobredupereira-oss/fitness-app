-- =============================================
-- FitLife - Schema do Supabase
-- Execute este SQL no painel do Supabase
-- SQL Editor > New query > Cole e execute
-- =============================================

-- Tabela de Tarefas
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  priority text default 'media' check (priority in ('alta', 'media', 'baixa')),
  done boolean default false,
  date date not null,
  created_at timestamptz default now()
);

-- Tabela de Refeições
create table if not exists public.meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  food text not null,
  meal_type text default 'cafe' check (meal_type in ('cafe', 'lanche1', 'almoco', 'lanche2', 'jantar', 'ceia')),
  calories integer,
  done boolean default false,
  date date not null,
  created_at timestamptz default now()
);

-- Tabela de Treinos/Exercícios
create table if not exists public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text default 'outro',
  sets integer,
  reps integer,
  duration integer,
  done boolean default false,
  date date not null,
  created_at timestamptz default now()
);

-- =============================================
-- Row Level Security (RLS) - SEGURANÇA
-- Cada usuário só vê seus próprios dados
-- =============================================

alter table public.tasks enable row level security;
alter table public.meals enable row level security;
alter table public.workouts enable row level security;

-- Políticas para tasks
create policy "users can manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas para meals
create policy "users can manage own meals"
  on public.meals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas para workouts
create policy "users can manage own workouts"
  on public.workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- Índices para performance
-- =============================================
create index if not exists tasks_user_date on public.tasks(user_id, date);
create index if not exists meals_user_date on public.meals(user_id, date);
create index if not exists workouts_user_date on public.workouts(user_id, date);
