-- =============================================================================
-- ROLE-BASED FEATURE GATING + VOLUNTEER EDIT AUDIT LOG
-- =============================================================================
-- Apply AFTER SUPABASE_SETUP.sql is already in place.
-- Run once in Supabase SQL Editor.

-- 1. PROFILES table — one row per signed-in user, with their role
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'volunteer' check (role in ('kid', 'volunteer', 'admin', 'partner', 'beneficiary')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row for every new auth user, default role='volunteer'.
-- Admin must manually upgrade to 'admin' via insert into public.admins (...) AND update profile role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'volunteer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 2. PROFILES RLS — users can read/update their own; admins can read/update all
alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users update own profile (limited)" on public.profiles;
create policy "users update own profile (limited)" on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and role = (select role from public.profiles where user_id = auth.uid()));
-- ^ note: this policy lets users edit display_name etc but NOT change their own role. Only admins change roles.

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admins update all profiles" on public.profiles;
create policy "admins update all profiles" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Helper: get current user's role (used by other policies + UI)
create or replace function public.current_role()
returns text
language sql
stable
security definer
as $$
  select coalesce(
    (select role from public.profiles where user_id = auth.uid()),
    'anon'
  );
$$;

-- 4. Backfill profiles for any existing auth users
insert into public.profiles (user_id, role)
select id, case when exists (select 1 from public.admins a where a.user_id = au.id) then 'admin' else 'volunteer' end
from auth.users au
on conflict (user_id) do nothing;

-- =============================================================================
-- 5. AUDIT LOG — track every change to a submission
-- =============================================================================
create table if not exists public.submission_audit (
  id bigserial primary key,
  submission_id uuid references public.submissions(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('create', 'update', 'approve', 'reject', 'unapprove', 'delete')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists submission_audit_sub_idx on public.submission_audit(submission_id, created_at desc);
create index if not exists submission_audit_actor_idx on public.submission_audit(actor_user_id, created_at desc);

-- 6. Trigger function: log every INSERT/UPDATE/DELETE on submissions
create or replace function public.log_submission_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  act text;
begin
  if (tg_op = 'INSERT') then
    insert into public.submission_audit (submission_id, actor_user_id, action, after_data)
    values (new.id, auth.uid(), 'create', to_jsonb(new));
    return new;
  elsif (tg_op = 'UPDATE') then
    -- Determine specific action based on status transition
    if (old.status is distinct from new.status) then
      if new.status = 'approved' then act := 'approve';
      elsif new.status = 'rejected' then act := 'reject';
      elsif new.status = 'pending' then act := 'unapprove';
      else act := 'update';
      end if;
    else
      act := 'update';
    end if;
    insert into public.submission_audit (submission_id, actor_user_id, action, before_data, after_data)
    values (new.id, auth.uid(), act, to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.submission_audit (submission_id, actor_user_id, action, before_data)
    values (old.id, auth.uid(), 'delete', to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists submissions_audit_trigger on public.submissions;
create trigger submissions_audit_trigger
  after insert or update or delete on public.submissions
  for each row
  execute function public.log_submission_change();

-- 7. RLS for audit log: only admins read; nobody writes directly (only via trigger)
alter table public.submission_audit enable row level security;

drop policy if exists "admins read audit" on public.submission_audit;
create policy "admins read audit" on public.submission_audit
  for select to authenticated
  using (public.is_admin());

-- =============================================================================
-- 8. Same audit pattern for blog_posts (volunteer edits to blog content)
-- =============================================================================
create table if not exists public.blog_audit (
  id bigserial primary key,
  post_id uuid references public.blog_posts(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('create', 'update', 'publish', 'unpublish', 'delete')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.log_blog_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare act text;
begin
  if (tg_op = 'INSERT') then
    insert into public.blog_audit (post_id, actor_user_id, action, after_data)
    values (new.id, auth.uid(), 'create', to_jsonb(new));
    return new;
  elsif (tg_op = 'UPDATE') then
    if (old.status is distinct from new.status) then
      if new.status = 'published' then act := 'publish';
      elsif old.status = 'published' then act := 'unpublish';
      else act := 'update';
      end if;
    else
      act := 'update';
    end if;
    insert into public.blog_audit (post_id, actor_user_id, action, before_data, after_data)
    values (new.id, auth.uid(), act, to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.blog_audit (post_id, actor_user_id, action, before_data)
    values (old.id, auth.uid(), 'delete', to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists blog_audit_trigger on public.blog_posts;
create trigger blog_audit_trigger
  after insert or update or delete on public.blog_posts
  for each row
  execute function public.log_blog_change();

alter table public.blog_audit enable row level security;
drop policy if exists "admins read blog audit" on public.blog_audit;
create policy "admins read blog audit" on public.blog_audit
  for select to authenticated
  using (public.is_admin());

-- =============================================================================
-- USAGE NOTES
-- =============================================================================
--
-- HOW TO PROMOTE A USER TO ADMIN:
--   1. insert into public.admins (user_id) values ('uuid-here');
--   2. update public.profiles set role = 'admin' where user_id = 'uuid-here';
--
-- HOW TO PROMOTE A USER TO 'kid' or 'partner':
--   update public.profiles set role = 'kid' where user_id = 'uuid-here';
--
-- VIEW AUDIT LOG FOR A SUBMISSION:
--   select * from public.submission_audit
--     where submission_id = 'uuid' order by created_at desc;
--
-- VIEW WHAT A VOLUNTEER HAS EDITED:
--   select * from public.submission_audit
--     where actor_user_id = 'uuid' order by created_at desc;
--
-- =============================================================================
