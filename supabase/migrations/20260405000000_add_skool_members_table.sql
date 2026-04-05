-- Create skool_members table to persist uploaded Skool CSV data
create table if not exists public.skool_members (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  joined_date text,
  price text,
  tier text,
  ltv text,
  status text,
  last_active text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.skool_members enable row level security;

-- Allow public access (matches existing tables in this project)
create policy "Allow public read" on public.skool_members for select using (true);
create policy "Allow public insert" on public.skool_members for insert with check (true);
create policy "Allow public delete" on public.skool_members for delete using (true);
