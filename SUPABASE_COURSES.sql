-- =============================================================================
-- B THE CHANGE — Course system
-- Run in Supabase SQL Editor after SUPABASE_COURSE_RESOURCES.sql
-- =============================================================================

-- ============================================================
-- 1. Courses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title           text NOT NULL,
  description     text DEFAULT '',
  program         text NOT NULL DEFAULT 'all',
  cert_threshold  int  NOT NULL DEFAULT 70
                  CHECK (cert_threshold BETWEEN 1 AND 100),
  is_published    boolean DEFAULT true,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated reads published courses"
  ON public.courses FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "admins manage courses"
  ON public.courses FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 2. Course modules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_modules (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id       uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text DEFAULT '',
  module_number   int  NOT NULL DEFAULT 1,
  is_published    boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated reads published modules"
  ON public.course_modules FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "admins manage modules"
  ON public.course_modules FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 3. Link course_resources to a module (backward-compatible)
-- ============================================================
ALTER TABLE public.course_resources
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL;

-- ============================================================
-- 4. Quiz questions per module
-- ============================================================
CREATE TABLE IF NOT EXISTS public.module_questions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id       uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  question_text   text NOT NULL,
  options         jsonb NOT NULL DEFAULT '[]',   -- array of 4 strings
  correct_answer  int  NOT NULL DEFAULT 0
                  CHECK (correct_answer BETWEEN 0 AND 3),
  explanation     text DEFAULT '',
  sort_order      int  DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.module_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated reads questions"
  ON public.module_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage questions"
  ON public.module_questions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 5. User quiz progress per module
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_module_progress (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id       uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  quiz_score      int  DEFAULT 0,
  quiz_total      int  DEFAULT 0,
  completed       boolean DEFAULT false,
  completed_at    timestamptz,
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own progress"
  ON public.user_module_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "users write own progress"
  ON public.user_module_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own progress"
  ON public.user_module_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "admins read all progress"
  ON public.user_module_progress FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 6. Allow volunteers (not just admins) to schedule live calls
-- ============================================================
DROP POLICY IF EXISTS "volunteers schedule calls" ON public.video_calls;
CREATE POLICY "volunteers schedule calls"
  ON public.video_calls FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('volunteer','admin')
    )
  );

DROP POLICY IF EXISTS "volunteers read own calls" ON public.video_calls;
CREATE POLICY "volunteers read own calls"
  ON public.video_calls FOR SELECT TO authenticated
  USING (status IN ('scheduled','live') OR created_by = auth.uid());
