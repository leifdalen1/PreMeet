-- Run this in the Supabase SQL editor to create the contacts table.
-- Stores unique contacts extracted from calendar events.

create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  email text not null,
  name text,
  company text,
  title text,
  linkedin_url text,
  enriched boolean default false,
  last_meeting_date timestamptz,
  meeting_count integer default 1,
  created_at timestamptz default now(),
  unique(user_id, email)
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);

-- Index for email search
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);

-- Index for name search
CREATE INDEX IF NOT EXISTS idx_contacts_name ON public.contacts(name);

-- Index for company filter
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company);

-- Index for last meeting date sorting
CREATE INDEX IF NOT EXISTS idx_contacts_last_meeting ON public.contacts(last_meeting_date DESC);

-- Optional: enable RLS and allow service role full access (default).
-- alter table public.contacts enable row level security;

-- ============================================================
-- Migration: run these if the table already exists
-- ============================================================
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS enriched boolean DEFAULT false;
