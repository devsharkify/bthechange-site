-- =============================================================================
-- EVENTS + PHOTO SUBMISSIONS EXTENSION
-- Run AFTER SUPABASE_SETUP.sql and SUPABASE_ROLES_AND_AUDIT.sql
-- Program photos re-use the existing submissions table (story_text prefix trick)
-- =============================================================================

-- ===== 1. EVENTS TABLE =====
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null,

  title text not null,
  description text,
  program_slug text,
  event_date date not null,
  event_time text,                      -- e.g. "10:00 AM"
  location text,
  capacity int,                         -- null = unlimited

  status text not null default 'published'
    check (status in ('draft', 'published', 'cancelled', 'completed')),
  target_roles text[] default array['volunteer', 'kid']
);

create index if not exists events_date_status_idx on public.events(event_date, status);

-- ===== 2. EVENT ATTENDEES TABLE =====
create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  joined_at timestamptz default now(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'waitlisted', 'cancelled')),
  unique (event_id, user_id)
);

create index if not exists attendees_event_idx on public.event_attendees(event_id);
create index if not exists attendees_user_idx on public.event_attendees(user_id);

-- ===== 3. ROW-LEVEL SECURITY =====
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;

-- Events: everyone can read published; only admins write
drop policy if exists "public read published events" on public.events;
create policy "public read published events" on public.events
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "admins full events" on public.events;
create policy "admins full events" on public.events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Attendees: authenticated users join themselves; admins read/manage all
drop policy if exists "auth can join event" on public.event_attendees;
create policy "auth can join event" on public.event_attendees
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user reads own registrations" on public.event_attendees;
create policy "user reads own registrations" on public.event_attendees
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "user cancels own" on public.event_attendees;
create policy "user cancels own" on public.event_attendees
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "admins read all attendees" on public.event_attendees;
create policy "admins read all attendees" on public.event_attendees
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admins manage attendees" on public.event_attendees;
create policy "admins manage attendees" on public.event_attendees
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===== 4. PROGRAM PHOTOS =====
-- Program photos use the existing submissions table.
-- story_text always starts with '[PROGRAM PHOTO] ' to distinguish from story submissions.
-- No schema change needed — just a convention.
-- To query all pending photos:
--   select * from public.submissions
--     where story_text ilike '[PROGRAM PHOTO]%' and status = 'pending'
--     order by created_at desc;
--
-- To query approved photos for a program page:
--   select image_url, story_text, created_at from public.submissions
--     where story_text ilike '[PROGRAM PHOTO]%'
--       and status = 'approved'
--       and program_slug = 'coding-on-wheels'
--     order by approved_at desc
--     limit 6;

-- Make sure submission-images bucket exists in Supabase Storage.
-- Policy for program-photos subfolder: same as existing (see SUPABASE_SETUP.sql).

-- ===== 5. ADD ATTENDEE COUNT HELPER =====
-- Convenience view: events with their attendee counts
create or replace view public.events_with_counts as
  select
    e.*,
    coalesce(a.confirmed_count, 0) as confirmed_count
  from public.events e
  left join (
    select event_id, count(*) as confirmed_count
    from public.event_attendees
    where status = 'confirmed'
    group by event_id
  ) a on a.event_id = e.id;

-- =============================================================================
-- DONE. To seed a test event:
-- insert into public.events (created_by, title, program_slug, event_date, location, description)
-- values (
--   (select id from auth.users limit 1),
--   'Volunteer Training Day',
--   'coding-on-wheels',
--   (current_date + interval '7 days')::date,
--   'BTC Office, Hyderabad',
--   'Quarterly training for all Coding on Wheels volunteers. Topics: new curriculum, session planning.'
-- );
-- =============================================================================
