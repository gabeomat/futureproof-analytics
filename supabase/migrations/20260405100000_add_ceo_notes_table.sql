-- CEO Daily Notes: strategic context for AI analysis
create table if not exists public.ceo_notes (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  biggest_win text not null default '',
  biggest_bottleneck text not null default '',
  todays_focus text not null default '',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.ceo_notes enable row level security;

-- Public access (single-user app, matches existing tables)
create policy "Allow public read" on public.ceo_notes for select using (true);
create policy "Allow public insert" on public.ceo_notes for insert with check (true);
create policy "Allow public update" on public.ceo_notes for update using (true);
create policy "Allow public delete" on public.ceo_notes for delete using (true);

-- Auto-update updated_at on row changes
create trigger update_ceo_notes_updated_at
  before update on public.ceo_notes
  for each row execute function public.update_updated_at_column();
