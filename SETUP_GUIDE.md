# B The Change Welfare Society — Setup Guide

Production deployment checklist. Nothing on the site works until these are done.

---

## 1. Supabase project setup

### 1.1 Create project
1. Go to https://supabase.com → New project
2. Name: `bthechange-prod` (or whatever)
3. Region: **Asia Pacific (Mumbai)** for India users
4. Strong DB password — save it

### 1.2 Run base SQL
1. Open Supabase SQL Editor
2. Run these files in order (Run each separately, top to bottom):
   - `SUPABASE_SETUP.sql` (core: submissions, blog, admins)
   - `SUPABASE_ROLES_AND_AUDIT.sql` (profiles, role gating, audit logs)
   - `SUPABASE_AWARD_NOMINATIONS.sql` (ChangeMaker Awards 2026 nominations)
   - `SUPABASE_IMAGE_CLEANUP.sql` (nightly orphan cleanup, requires pg_cron)
3. Confirm tables created: `submissions`, `blog_posts`, `admins`, `profiles`, `submission_audit`, `blog_audit`, `award_nominations`, `nomination_audit`

### 1.3 Storage bucket
1. Storage → New bucket
2. Name: `submission-images`
3. **Public bucket: ON**
4. File size limit: 5 MB
5. Allowed MIME types: `image/*`

### 1.4 Realtime
1. Database → Replication → enable for `submissions` table
2. (Powers the live admin notification bell)

### 1.5 Image cleanup cron (recommended)
1. Database → Extensions → enable `pg_cron`
2. SQL Editor → paste `SUPABASE_IMAGE_CLEANUP.sql` → Run
3. Verify: `select * from cron.job;`
4. Rejected submission images now auto-delete after 7 days

---

## 2. Wire keys into the site

Open `assets/supabase-config.js` and replace placeholders:

```js
window.SUPABASE_CONFIG = {
  url: 'https://YOURPROJECT.supabase.co',     // from Supabase → Settings → API → Project URL
  anonKey: 'eyJhbGc...',                       // from Supabase → Settings → API → Project API keys → anon public
};
```

The `anon` key is safe in the browser. **Do NOT** use the `service_role` key here — it bypasses RLS.

---

## 3. hCaptcha (REQUIRED before public launch — spam protection)

Without this, a bot can fill your submissions table in minutes.

1. Go to https://www.hcaptcha.com/ → Sign up (free)
2. Add Site → enter `bthechange.in` → copy **Site key**
3. In `assets/supabase-config.js`:
   ```js
   window.HCAPTCHA_SITE_KEY = 'YOUR_SITE_KEY_HERE';
   ```
4. Save secret key in Supabase → Edge Functions secrets if you later add server-side verification

The captcha widget will auto-appear on the submit form once the key is set. Empty key = widget not shown.

---

## 4. NSFW image moderation (optional, free tier)

Auto-rejects images containing nudity / gore / offensive content before they reach the admin queue.

1. Go to https://sightengine.com/ → Sign up (500 imgs/month free)
2. API → copy **API user** and **API secret**
3. In `assets/supabase-config.js`:
   ```js
   window.SIGHTENGINE_USER = 'xxx';
   window.SIGHTENGINE_SECRET = 'xxx';
   ```

Empty values = check skipped (admin still reviews manually).

---

## 5. Analytics — Plausible (recommended)

The `head()` template already includes a Plausible script tag for `bthechange.in`.

1. Go to https://plausible.io → Sign up (₹500/month for hosted, free if self-hosted)
2. Add site `bthechange.in`
3. The script tag in every page is already configured. No code change needed.
4. To switch domain or self-host: edit `data-domain` in `generate.js` head() helper.

To **disable**: remove the `<script defer data-domain="..." src="https://plausible.io/js/script.js">` line in `generate.js`.

---

## 6. Error tracking — Sentry (optional but recommended)

1. Go to https://sentry.io → Free tier covers 5K events/month
2. New project → JavaScript → copy **DSN**
3. In `generate.js` head() helper, find the commented Sentry block and uncomment it
4. Replace `YOUR_SENTRY_DSN` with your real DSN
5. Re-run `node generate.js`

---

## 7. Deploy the static site

Pick one:

### Option A — Vercel (easiest)
```bash
cd bthechange-site
npx vercel
```
Set production domain to `bthechange.in` in Vercel dashboard.

### Option B — Netlify
Drag-drop the entire `bthechange-site` folder to https://app.netlify.com/drop. Then assign custom domain.

### Option C — Cloudflare Pages (recommended for India performance)
1. Create new Pages project
2. Connect Git or upload `bthechange-site` folder
3. Build command: `node generate.js`
4. Output directory: `.`
5. Custom domain: `bthechange.in`

### Configure 404 redirects
- **Vercel/Netlify**: place `404.html` in root (already there). Done.
- **Cloudflare Pages**: works automatically.

---

## 8. Create the first admin

After deploy:

1. Go to your live site → click "Sign in" → enter your email → check inbox → enter 6-digit code
2. After signing in, find your `auth.users.id` UUID:
   - Supabase → Authentication → Users → click yourself → copy ID
3. SQL Editor:
   ```sql
   insert into public.admins (user_id) values ('PASTE-UUID-HERE');
   ```
4. Refresh the site. The user dropdown now shows "Admin" with live pending count.

---

## 9. Pre-launch checklist

- [ ] Supabase keys pasted and verified (test sign-in works)
- [ ] hCaptcha key set (test submit form shows captcha)
- [ ] Image cleanup cron installed
- [ ] First admin record inserted (test admin panel loads)
- [ ] At least 3 approved submissions exist (so program pages aren't empty)
- [ ] Replace `assets/hero-kids-coding.jpg` with a real B The Change session photo
- [ ] Plausible domain configured
- [ ] Test submit → admin approve → appears on program page (full E2E)
- [ ] Test on real phone (iPhone + Android)
- [ ] Tweet/WhatsApp share preview test (check OG image renders)

---

## 10. Known deferred items (NOT done in this build)

These are flagged in `bthechange-audit-2026-05-02.md` and are not blocking launch:

- **Self-hosted Quill + Supabase JS** — currently CDN-loaded from `cdn.jsdelivr.net`. Single point of failure. Bundle locally in v1.
- **Service worker / offline support** — defer to v2 (kids portal phase).
- **Razorpay 80G receipt automation** — defer until first big donor lands.
- **Phone OTP via MSG91 + DLT** — defer. Email-only for v0. Phone tab shows "coming soon" notice.
- **Telugu language version** — defer to v1.
- **Press kit page** — defer.
- **Sentry DSN paste** — Rohan to configure.

---

## 11. Rotate the leaked Authkey API key

**Carry-over from earlier sessions:** the key `bedfc307ae476372` was found in an `.env.example`. If not yet rotated, do so today on Authkey dashboard.

---

End of setup guide. Email `support@bthechange.in` with any deploy issues.
