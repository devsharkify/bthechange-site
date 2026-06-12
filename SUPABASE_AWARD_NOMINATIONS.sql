-- =============================================================================
-- AWARD NOMINATIONS — for ChangeMaker Awards 2026 self/third-party nominations
-- Apply AFTER SUPABASE_SETUP.sql.
-- =============================================================================

create table if not exists public.award_nominations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Who is nominating
  nomination_type text not null check (nomination_type in ('self', 'third_party')),
  nominator_name text not null,
  nominator_email text not null,
  nominator_phone text,
  nominator_relation text,

  -- Who is being nominated
  nominee_name text not null,
  nominee_type text not null check (nominee_type in ('individual', 'ngo', 'corporate', 'media', 'other')),
  nominee_location text not null,
  nominee_contact text,
  nominee_brief text not null,

  -- The work
  category text not null check (category in (
    'digital-empowerment',
    'education-excellence',
    'women-empowerment',
    'environmental-guardian',
    'animal-welfare',
    'social-justice-legal',
    'youth-leadership',
    'community-service',
    'healthcare-organ',
    'sports-social-change',
    'csr-impact',
    'media-social-change',
    'lifetime-achievement'
  )),
  work_years text not null,
  work_description text not null,
  impact_count text,
  impact_reach text,
  supporting_links text,
  reference_contact text,
  image_url text,

  -- Jury workflow
  status text not null default 'pending' check (status in ('pending', 'shortlisted', 'winner', 'rejected')),
  jury_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);

create index if not exists nominations_status_idx on public.award_nominations(status, created_at desc);
create index if not exists nominations_category_idx on public.award_nominations(category, status);

-- RLS: anyone can submit, only admins read/update
alter table public.award_nominations enable row level security;

drop policy if exists "anyone can nominate" on public.award_nominations;
create policy "anyone can nominate" on public.award_nominations
  for insert to anon, authenticated
  with check (true);

drop policy if exists "admins read nominations" on public.award_nominations;
create policy "admins read nominations" on public.award_nominations
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admins update nominations" on public.award_nominations;
create policy "admins update nominations" on public.award_nominations
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete nominations" on public.award_nominations;
create policy "admins delete nominations" on public.award_nominations
  for delete to authenticated
  using (public.is_admin());

-- Audit hook (depends on submission_audit pattern, simplified for nominations)
create table if not exists public.nomination_audit (
  id bigserial primary key,
  nomination_id uuid references public.award_nominations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.log_nomination_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into public.nomination_audit (nomination_id, actor_user_id, action, before_data, after_data)
    values (new.id, auth.uid(), 'status_' || new.status, to_jsonb(old), to_jsonb(new));
  end if;
  return new;
end;
$$;

drop trigger if exists nominations_audit_trigger on public.award_nominations;
create trigger nominations_audit_trigger
  after update on public.award_nominations
  for each row
  execute function public.log_nomination_change();

alter table public.nomination_audit enable row level security;
drop policy if exists "admins read nom audit" on public.nomination_audit;
create policy "admins read nom audit" on public.nomination_audit
  for select to authenticated
  using (public.is_admin());

-- =============================================================================
-- USAGE NOTES
-- =============================================================================
--
-- VIEW ALL PENDING NOMINATIONS:
--   select * from public.award_nominations where status = 'pending' order by created_at desc;
--
-- SHORTLIST A NOMINATION:
--   update public.award_nominations set status = 'shortlisted', jury_notes = 'reason here' where id = 'uuid';
--
-- ANNOUNCE WINNER:
--   update public.award_nominations set status = 'winner' where id = 'uuid';
--
-- COUNT NOMINATIONS PER CATEGORY:
--   select category, status, count(*) from public.award_nominations group by category, status;
-- =============================================================================
