-- Run this in the Supabase SQL editor to create the sent_briefings table.
-- This prevents duplicate briefing emails from being sent.

create table if not exists public.sent_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  meeting_id text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, meeting_id)
);

-- Index for faster lookups
create index if not exists idx_sent_briefings_user_meeting 
  on public.sent_briefings(user_id, meeting_id);

-- Optional: enable RLS and allow service role full access (default).
-- alter table public.sent_briefings enable row level security;
