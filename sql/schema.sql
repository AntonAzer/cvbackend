-- Run this once against your Supabase Postgres database
-- (Supabase Dashboard -> SQL Editor -> paste and run), or via psql/migrate script.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  template text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  cv_id uuid references cvs(id) on delete set null,
  amount numeric(10,2) not null default 1.00,
  currency text not null default 'USD',
  provider text not null default 'paypal',
  provider_order_id text,
  status text not null default 'pending', -- pending | completed | failed
  created_at timestamptz not null default now()
);

create index if not exists idx_cvs_user on cvs(user_id);
create index if not exists idx_payments_user on payments(user_id);
create index if not exists idx_payments_cv on payments(cv_id);
