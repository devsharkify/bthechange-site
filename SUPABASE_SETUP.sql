-- ============================================================================
-- B THE CHANGE — Supabase setup
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- ============================================================================

-- ===== 1. SUBMISSIONS TABLE =====
-- Public can INSERT (with rate limit), admins can UPDATE status, public can SELECT approved
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Submitter info (required, public form)
  submitter_name text not null,
  submitter_role text check (submitter_role in ('volunteer', 'admin', 'kid', 'beneficiary', 'partner')),
  submitter_contact text, -- email or phone
  submitter_user_id uuid references auth.users(id), -- null for anonymous, set if signed in

  -- Submission content
  program_slug text not null,
  event_name text,
  event_date date,
  story_text text not null,
  image_url text,

  -- Workflow
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,

  -- Public display
  is_featured boolean default false,
  display_order int default 0
);

create index if not exists submissions_status_program_idx on public.submissions(status, program_slug);
create index if not exists submissions_created_idx on public.submissions(created_at desc);

-- ===== 2. BLOG POSTS TABLE =====
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Content
  slug text unique not null,
  title text not null,
  excerpt text,
  body_md text not null, -- markdown
  cover_image_url text,

  -- Author
  author_name text not null,
  author_role text check (author_role in ('admin', 'volunteer', 'kid')),
  author_id uuid references auth.users(id),

  -- Publish
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'published', 'rejected')),
  published_at timestamptz,
  approved_by uuid references auth.users(id),

  -- Tags
  program_slug text,
  tags text[]
);

create index if not exists blog_status_idx on public.blog_posts(status, published_at desc);

-- ===== 3. ADMIN ROLE TABLE =====
-- Simple role check via this table, anyone NOT here = regular user
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz default now(),
  added_by uuid references auth.users(id)
);

-- Helper function: is the current authenticated user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- ===== 4. STORAGE BUCKET =====
-- Run separately in Supabase Storage UI or via dashboard:
-- 1. Create bucket: 'submission-images' (PUBLIC)
-- 2. Add policies (see below RLS section)

-- ===== 5. ROW-LEVEL SECURITY POLICIES =====

alter table public.submissions enable row level security;
alter table public.blog_posts enable row level security;
alter table public.admins enable row level security;

-- SUBMISSIONS: only authenticated users can INSERT (must claim their own user_id), only approved are SELECTable by public
drop policy if exists "anyone can submit" on public.submissions;
drop policy if exists "authed can submit" on public.submissions;
create policy "authed can submit" on public.submissions
  for insert to authenticated
  with check (submitter_user_id = auth.uid());

drop policy if exists "public reads approved" on public.submissions;
create policy "public reads approved" on public.submissions
  for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "admins read all" on public.submissions;
create policy "admins read all" on public.submissions
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admins update" on public.submissions;
create policy "admins update" on public.submissions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete" on public.submissions;
create policy "admins delete" on public.submissions
  for delete to authenticated
  using (public.is_admin());

-- Submitters: can SELECT their own submissions, can UPDATE while still pending
drop policy if exists "submitter reads own" on public.submissions;
create policy "submitter reads own" on public.submissions
  for select to authenticated
  using (submitter_user_id = auth.uid());

drop policy if exists "submitter edits own pending" on public.submissions;
create policy "submitter edits own pending" on public.submissions
  for update to authenticated
  using (submitter_user_id = auth.uid() and status = 'pending')
  with check (submitter_user_id = auth.uid() and status = 'pending');

-- BLOG POSTS: same pattern
drop policy if exists "authed can submit blog" on public.blog_posts;
create policy "authed can submit blog" on public.blog_posts
  for insert to authenticated
  with check (true);

drop policy if exists "public reads published" on public.blog_posts;
create policy "public reads published" on public.blog_posts
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "admins read all blog" on public.blog_posts;
create policy "admins read all blog" on public.blog_posts
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admins update blog" on public.blog_posts;
create policy "admins update blog" on public.blog_posts
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "authors update own draft" on public.blog_posts;
create policy "authors update own draft" on public.blog_posts
  for update to authenticated
  using (author_id = auth.uid() and status in ('draft', 'pending'));

-- ADMINS table: only admins can read it, only superadmin (manually) can write
drop policy if exists "admins read admins" on public.admins;
create policy "admins read admins" on public.admins
  for select to authenticated
  using (public.is_admin() or user_id = auth.uid());

-- ===== 6. STORAGE POLICIES (for submission-images bucket) =====
-- After creating the bucket in Supabase Storage UI, run:

-- Anyone can upload (we trust the form for now; server-side moderation queue catches bad content)
drop policy if exists "anyone upload to submissions" on storage.objects;
create policy "anyone upload to submissions" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'submission-images');

-- Anyone can read (public bucket, images are referenced in approved submissions)
drop policy if exists "public read submission images" on storage.objects;
create policy "public read submission images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'submission-images');

-- Admins can delete (cleanup of rejected submissions)
drop policy if exists "admins delete submission images" on storage.objects;
create policy "admins delete submission images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'submission-images' and public.is_admin());

-- ===== 7. BOOTSTRAP YOUR ADMIN ACCOUNT =====
-- After you sign up via the admin login page (magic link to your email),
-- run this ONCE in SQL editor with YOUR auth user ID:
--
-- 1. Go to https://app.supabase.com/project/_/auth/users
-- 2. Find your row, copy the UID
-- 3. Run:
--    insert into public.admins (user_id) values ('PASTE-UUID-HERE');

-- ============================================================================
-- DONE. Verify: select * from public.submissions; -- should be empty, no errors
-- ============================================================================
