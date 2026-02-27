create extension if not exists "uuid-ossp";

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  tx_date date not null,
  type text not null,
  category text not null,
  amount numeric not null,
  person text,
  note text
);

create index if not exists transactions_tx_date_idx on public.transactions (tx_date desc);

create table if not exists public.debts (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  direction text not null,
  person text not null,
  amount numeric not null,
  note text,
  status text not null default 'open'
);

create index if not exists debts_status_idx on public.debts (status);

-- Quick start only (optional):
-- alter table public.transactions disable row level security;
-- alter table public.debts disable row level security;
