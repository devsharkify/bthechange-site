-- =============================================================================
-- B THE CHANGE — Course Resources (Google Drive-backed videos + PDFs)
-- Run in Supabase SQL Editor after SUPABASE_SCHEMA.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.course_resources (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program       text NOT NULL DEFAULT 'all',
  resource_type text NOT NULL DEFAULT 'pdf'
                CHECK (resource_type IN ('video','pdf','doc')),
  title         text NOT NULL,
  description   text DEFAULT '',
  drive_file_id text NOT NULL,
  module_number int  DEFAULT 0,
  audience      text NOT NULL DEFAULT 'both'
                CHECK (audience IN ('kids','volunteer','both')),
  sort_order    int  DEFAULT 0,
  is_published  boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

-- Authenticated users (logged-in kids + volunteers) can read published resources
CREATE POLICY "authenticated reads published resources"
  ON public.course_resources FOR SELECT TO authenticated
  USING (is_published = true);

-- Only admins can create / update / delete
CREATE POLICY "admins manage resources"
  ON public.course_resources FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Sample seed rows (replace drive_file_id with real IDs from Google Drive share links)
-- INSERT INTO public.course_resources (program, resource_type, title, description, drive_file_id, module_number, audience, sort_order)
-- VALUES
--   ('coding-on-wheels', 'pdf',   'Python Cheat Sheet',        'Variables, loops, functions — one page',  'DRIVE_FILE_ID_HERE', 1, 'kids',      1),
--   ('coding-on-wheels', 'video', 'Module 1 Intro Video',       'Welcome to Coding on Wheels',             'DRIVE_FILE_ID_HERE', 1, 'kids',      2),
--   ('coding-on-wheels', 'pdf',   'Module 1 Worksheet',         'Exercises: First Programs',               'DRIVE_FILE_ID_HERE', 1, 'kids',      3),
--   ('coding-on-wheels', 'pdf',   'Volunteer Program Guide',    'Full program overview for volunteers',    'DRIVE_FILE_ID_HERE', 0, 'volunteer', 1),
--   ('all',              'pdf',   'B The Change Annual Report', 'Impact report 2024',                      'DRIVE_FILE_ID_HERE', 0, 'volunteer', 2);
