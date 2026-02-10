-- Run this in the Supabase SQL editor to create the feedback table.
-- Stores user feedback (thumbs up/down) with optional message.

create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  rating text not null, -- 'thumbs_up' or 'thumbs_down'
  message text,
  created_at timestamptz default now()
);

-- Index for faster lookups by user
create index if not exists idx_feedback_user_id on public.feedback(user_id);

-- Optional: enable RLS and allow service role full access (default).
-- alter table public.feedback enable row level security;
