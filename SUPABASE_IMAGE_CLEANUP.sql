-- =============================================================================
-- IMAGE CLEANUP — nightly cron deletes images for rejected/deleted submissions
-- older than 7 days. Approved submissions keep their images forever.
-- =============================================================================
--
-- HOW TO INSTALL (one-time, in Supabase SQL Editor):
--   1. Run this entire file
--   2. Verify the cron job appears in: select * from cron.job;
--   3. Test once manually: select public.cleanup_orphan_submission_images();
--
-- WHY: prevents storage cost growth from rejected submissions.
--
-- REQUIRES: pg_cron extension (Settings → Database → Extensions → enable pg_cron)

-- 1. Enable extensions if not already enabled
create extension if not exists pg_cron;

-- 2. The cleanup function
create or replace function public.cleanup_orphan_submission_images()
returns int
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  rec record;
  deleted_count int := 0;
begin
  -- For every rejected submission older than 7 days that has an image_url,
  -- delete the corresponding storage object and clear the image_url.
  for rec in
    select id, image_url
    from public.submissions
    where status = 'rejected'
      and image_url is not null
      and image_url != ''
      and created_at < now() - interval '7 days'
  loop
    -- Extract object name from public URL.
    -- Public URLs look like: https://<project>.supabase.co/storage/v1/object/public/submission-images/<filename>
    declare
      obj_name text;
    begin
      obj_name := substring(rec.image_url from '/submission-images/(.+)$');
      if obj_name is not null then
        delete from storage.objects
        where bucket_id = 'submission-images' and name = obj_name;
      end if;
      update public.submissions set image_url = null where id = rec.id;
      deleted_count := deleted_count + 1;
    exception when others then
      -- log but continue
      raise notice 'Failed to clean up image for submission %: %', rec.id, sqlerrm;
    end;
  end loop;

  return deleted_count;
end;
$$;

-- 3. Schedule it: every day at 03:30 IST (= 22:00 UTC previous day)
select cron.schedule(
  'cleanup-orphan-submission-images',
  '0 22 * * *',                                  -- 22:00 UTC daily = 03:30 IST
  $$ select public.cleanup_orphan_submission_images(); $$
);

-- 4. (optional) Verify cron is set up
-- select * from cron.job where jobname = 'cleanup-orphan-submission-images';

-- =============================================================================
-- TO UNINSTALL:
--   select cron.unschedule('cleanup-orphan-submission-images');
--   drop function if exists public.cleanup_orphan_submission_images();
-- =============================================================================
