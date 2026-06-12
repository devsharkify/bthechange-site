-- =============================================================================
-- B THE CHANGE — Profile fields + auto-approve
-- Run this in Supabase SQL Editor AFTER running SUPABASE_SCHEMA.sql
-- =============================================================================

-- ============================================================
-- 1. New profile columns (safe to run multiple times)
-- ============================================================

-- Kids-specific fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS father_name      text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob              date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_class    text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_state     text;

-- Volunteer-specific fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation_type       text
  CHECK (occupation_type IN ('employed','student','business','other'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_background  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contribution_area     text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_project     text;

-- Shared completion flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false;

-- ============================================================
-- 2. Auto-approve: update RLS on blog_posts
--    Pending posts older than 7 days become publicly readable
-- ============================================================
DROP POLICY IF EXISTS "public reads published posts" ON public.blog_posts;
CREATE POLICY "public reads published or auto-approved posts"
  ON public.blog_posts FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR (status = 'pending' AND created_at < now() - interval '7 days')
  );

-- ============================================================
-- 3. Auto-approve: update RLS on submissions
--    PROGRAM PHOTO submissions pending >7 days become readable
--    by any authenticated user (they appear on program pages)
-- ============================================================
DROP POLICY IF EXISTS "user reads own submissions" ON public.submissions;
CREATE POLICY "user reads own submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (
    submitter_user_id = auth.uid()
    OR user_id = auth.uid()
    OR (
      status = 'pending'
      AND created_at < now() - interval '7 days'
      AND story_text ILIKE '[PROGRAM PHOTO]%'
    )
  );

-- ============================================================
-- 4. Helper function: auto_approve_stale()
--    Call this from a Supabase Edge Function on a daily cron,
--    or run manually from SQL Editor to flush the queue.
--    It sets status=approved/published so the rows are clean.
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_approve_stale()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  photos_count  int;
  blogs_count   int;
BEGIN
  -- Auto-approve photo submissions
  UPDATE public.submissions
  SET status = 'approved', admin_notes = COALESCE(admin_notes, '') || ' [Auto-approved after 7 days]'
  WHERE status = 'pending'
    AND created_at < now() - interval '7 days'
    AND story_text ILIKE '[PROGRAM PHOTO]%';
  GET DIAGNOSTICS photos_count = ROW_COUNT;

  -- Auto-publish blog posts
  UPDATE public.blog_posts
  SET status = 'published', published_at = COALESCE(published_at, now())
  WHERE status = 'pending'
    AND created_at < now() - interval '7 days';
  GET DIAGNOSTICS blogs_count = ROW_COUNT;

  RETURN jsonb_build_object('photos_approved', photos_count, 'blogs_published', blogs_count);
END;
$$;

-- To call manually: SELECT public.auto_approve_stale();
-- To schedule daily via pg_cron (if enabled on your Supabase plan):
-- SELECT cron.schedule('auto-approve-stale', '0 3 * * *', 'SELECT public.auto_approve_stale();');
