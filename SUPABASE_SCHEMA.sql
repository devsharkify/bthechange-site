-- =============================================================================
-- B THE CHANGE WELFARE SOCIETY — Complete Supabase Schema
-- Run this entire file in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Tables must be created in order: admins → is_admin() → profiles → rest
-- =============================================================================

-- ============================================================
-- 0. Helper: is_admin() — referenced in every RLS policy block
-- ============================================================
-- NOTE: This must be created BEFORE any table that calls it in a policy,
-- but it references public.admins which must exist first.
-- We create admins first, then the function, then everything else.

-- ============================================================
-- 1. admins
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  added_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes      text
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- Users can check if they themselves are an admin
CREATE POLICY "admins read own row"
  ON public.admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- Only existing admins can add new admins
CREATE POLICY "admins insert new admins"
  ON public.admins FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Bootstrap: Insert first admin via Supabase dashboard SQL Editor using service role:
-- INSERT INTO public.admins (user_id) VALUES ('<paste-auth-user-uuid-here>');

-- ============================================================
-- is_admin() helper function
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;

-- ============================================================
-- 2. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  role         text NOT NULL DEFAULT 'volunteer'
               CHECK (role IN ('admin','volunteer','kid','beneficiary','partner')),
  phone        text,
  school_name  text,    -- for kids
  mentor_name  text,    -- for kids: assigned mentor display name
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx    ON public.profiles(role);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own profile"
  ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "user inserts own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user updates own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins manage profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Auto-upsert profile on first login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  submitter_name    text,
  submitter_role    text CHECK (submitter_role IN ('volunteer','admin','kid','beneficiary','partner')),
  submitter_contact text,
  submitter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- alias used by kids portal
  program_slug      text,
  event_name        text,
  event_date        date,
  story_text        text,
  image_url         text,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
  approved_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at       timestamptz,
  admin_notes       text
);
CREATE INDEX IF NOT EXISTS submissions_status_idx            ON public.submissions(status);
CREATE INDEX IF NOT EXISTS submissions_submitter_user_id_idx ON public.submissions(submitter_user_id);
CREATE INDEX IF NOT EXISTS submissions_user_id_idx           ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS submissions_program_slug_idx      ON public.submissions(program_slug);
CREATE INDEX IF NOT EXISTS submissions_story_prefix_idx      ON public.submissions(story_text text_pattern_ops);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
-- Anyone (anon or auth) can insert — login handled by portal JS
CREATE POLICY "public can insert submissions"
  ON public.submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Users read their own rows
CREATE POLICY "user reads own submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (submitter_user_id = auth.uid() OR user_id = auth.uid());
-- Users can update own pending submissions
CREATE POLICY "user updates own pending submissions"
  ON public.submissions FOR UPDATE TO authenticated
  USING ((submitter_user_id = auth.uid() OR user_id = auth.uid()) AND status = 'pending')
  WITH CHECK ((submitter_user_id = auth.uid() OR user_id = auth.uid()) AND status = 'pending');
-- Admins have full access
CREATE POLICY "admins manage submissions"
  ON public.submissions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 4. events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  title           text NOT NULL,
  description     text,
  program_slug    text,
  event_date      date,
  event_time      text,
  location        text,
  cover_image_url text,
  max_volunteers  integer DEFAULT 50,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','completed','cancelled'))
);
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events(status);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published or completed events"
  ON public.events FOR SELECT TO anon, authenticated
  USING (status IN ('published','completed'));
CREATE POLICY "admins manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 5. event_attendees
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);
CREATE INDEX IF NOT EXISTS event_attendees_event_id_idx ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS event_attendees_user_id_idx  ON public.event_attendees(user_id);
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own registrations"
  ON public.event_attendees FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "volunteers join events"
  ON public.event_attendees FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('volunteer','admin')
    )
  );
CREATE POLICY "user leaves events"
  ON public.event_attendees FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage attendees"
  ON public.event_attendees FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- events_with_counts view — exposes confirmed_count used by volunteer portal
CREATE OR REPLACE VIEW public.events_with_counts AS
  SELECT e.*,
         COALESCE(a.confirmed_count, 0) AS confirmed_count
  FROM public.events e
  LEFT JOIN (
    SELECT event_id, COUNT(*) AS confirmed_count
    FROM public.event_attendees
    GROUP BY event_id
  ) a ON a.event_id = e.id;
GRANT SELECT ON public.events_with_counts TO anon, authenticated;

-- ============================================================
-- 6. video_calls
-- ============================================================
CREATE TABLE IF NOT EXISTS public.video_calls (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title        text NOT NULL,
  teacher      text,
  call_date    date NOT NULL,
  call_time    text,
  meet_link    text NOT NULL,
  program_slug text,
  target_roles text[] DEFAULT array['kid'],
  status       text NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled','live','completed','cancelled'))
);
CREATE INDEX IF NOT EXISTS video_calls_date_status_idx ON public.video_calls(call_date, status);
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth reads upcoming calls"
  ON public.video_calls FOR SELECT TO authenticated
  USING (status IN ('scheduled','live'));
CREATE POLICY "admins manage video calls"
  ON public.video_calls FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 7. award_nominations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.award_nominations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         timestamptz DEFAULT now(),
  nomination_type    text NOT NULL CHECK (nomination_type IN ('self','third_party')),
  nominator_name     text NOT NULL,
  nominator_email    text NOT NULL,
  nominator_phone    text,
  nominator_relation text,
  nominee_name       text NOT NULL,
  nominee_type       text NOT NULL CHECK (nominee_type IN ('individual','ngo','corporate','media','other')),
  nominee_location   text NOT NULL,
  nominee_contact    text,
  nominee_brief      text,
  category           text NOT NULL,
  work_years         text NOT NULL,
  work_description   text NOT NULL,
  impact_count       text,
  impact_reach       text,
  supporting_links   text,
  reference_contact  text,
  image_url          text,
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','shortlisted','awarded','rejected'))
);
CREATE INDEX IF NOT EXISTS award_nominations_status_idx   ON public.award_nominations(status);
CREATE INDEX IF NOT EXISTS award_nominations_category_idx ON public.award_nominations(category);
ALTER TABLE public.award_nominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can nominate"
  ON public.award_nominations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read nominations"
  ON public.award_nominations FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admins manage nominations"
  ON public.award_nominations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 8. blog_posts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  published_at    timestamptz,
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  excerpt         text,
  body_md         text NOT NULL,
  cover_image_url text,
  author_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name     text NOT NULL,
  author_role     text CHECK (author_role IN ('admin','volunteer','kid')),
  program_slug    text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','published','rejected','archived'))
);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx             ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_status_published_idx ON public.blog_posts(status, published_at);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published posts"
  ON public.blog_posts FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "auth inserts own posts"
  ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "author reads own posts"
  ON public.blog_posts FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "admins manage posts"
  ON public.blog_posts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
