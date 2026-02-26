-- Mokhtar Dashboard schema (V1)

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  notes text,
  preferred_currency text check (preferred_currency in ('USD','LBP')) default 'USD',
  created_at timestamptz not null default now()
);

-- Debts
create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type text check (type in ('MOBILE','REPAIR','TRANSFER','SUBSCRIPTION','OTHER')) default 'OTHER',
  currency text check (currency in ('USD','LBP')) not null,
  amount numeric not null,
  due_date date not null,
  status text check (status in ('PENDING','PAID','OVERDUE')) default 'PENDING',
  notes text,
  created_at timestamptz not null default now(),
  reminder_last_sent_at timestamptz,
  reminder_count int not null default 0
);

-- Sales
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  currency text check (currency in ('USD','LBP')) not null,
  total_amount numeric not null,
  paid_amount numeric not null default 0,
  payment_type text check (payment_type in ('CASH','DEBT')) not null,
  customer_id uuid references customers(id) on delete set null,
  debt_id uuid references debts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_debts_due on debts(due_date, status);
create index if not exists idx_sales_created on sales(created_at);

-- V1 -> V2 safe upgrades (run anytime)
alter table debts add column if not exists reminder_last_sent_at timestamptz;
alter table debts add column if not exists reminder_count int not null default 0;
