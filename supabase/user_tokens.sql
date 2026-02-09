-- Run this in the Supabase SQL editor to create the user_tokens table.

create table if not exists public.user_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider text not null,
  refresh_token text not null,
  access_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- Optional: enable RLS and allow service role full access (default).
-- alter table public.user_tokens enable row level security;
