# B The Change Welfare Society — Production Build

## What's in this package

```
bthechange-site/
├── index.html, about.html, team.html ............... Public pages
├── awards.html, awards-nominate.html ............... ChangeMaker Awards 2026
├── press.html, blog.html, blog-write.html .......... Content
├── submit.html, my.html, admin.html ................ Auth-gated tools
├── 404.html ........................................ Error page
├── programs/
│   ├── coding-on-wheels.html ........................ 11 program detail pages
│   ├── changemakers.html
│   ├── ... (9 more)
│   └── lawgic.html
│   └── <slug>/support.html .......................... 11 donation pages
├── assets/
│   ├── style.css .................................... Single CSS file
│   ├── admin-bell.js ................................ User dropdown + admin notifications
│   ├── supabase-config.js ........................... ⚠️ EDIT BEFORE DEPLOY
│   ├── *.jpg / *.png ................................ Images, logos
│   └── reports/
│       ├── btc-annual-report-2024.pdf
│       └── btc-changemaker-awards-2026.pdf
├── SUPABASE_SETUP.sql ............................... Run #1 — base schema
├── SUPABASE_ROLES_AND_AUDIT.sql ..................... Run #2 — profiles, roles, audit
├── SUPABASE_AWARD_NOMINATIONS.sql ................... Run #3 — nominations table
├── SUPABASE_IMAGE_CLEANUP.sql ....................... Run #4 — pg_cron cleanup
├── SETUP_GUIDE.md ................................... Detailed deploy steps
├── generate.js, data.js ............................. Source — regenerate HTMLs if needed
└── README.md ........................................ This file
```

---

## TL;DR — Get to production in 30 minutes

### 1. Supabase project
- Create a Supabase project (region: Asia Pacific Mumbai)
- Run the 4 SQL files in order: `SUPABASE_SETUP.sql` → `SUPABASE_ROLES_AND_AUDIT.sql` → `SUPABASE_AWARD_NOMINATIONS.sql` → `SUPABASE_IMAGE_CLEANUP.sql`
- Create storage bucket `submission-images` (PUBLIC, 5MB limit, image/* mime types)
- Enable Realtime on `submissions` table

### 2. Wire keys
Open `assets/supabase-config.js` and paste:
```js
window.SUPABASE_CONFIG = {
  url: 'https://YOURPROJECT.supabase.co',
  anonKey: 'eyJhbGc...',
};
window.HCAPTCHA_SITE_KEY = 'your-hcaptcha-site-key';   // from hcaptcha.com (free)
```

### 3. Deploy (pick one)
- **Cloudflare Pages** (recommended for India performance): drag-drop folder → assign `bthechange.in`
- **Vercel**: `npx vercel` from this folder
- **Netlify**: drag folder to https://app.netlify.com/drop
- **Any S3 / static host**: upload as-is

### 4. Make yourself admin
1. Go to live site → Sign in with your email → enter the 6-digit code
2. In Supabase → Authentication → Users → copy your UUID
3. Run in SQL Editor:
   ```sql
   insert into public.admins (user_id) values ('YOUR-UUID-HERE');
   update public.profiles set role = 'admin' where user_id = 'YOUR-UUID-HERE';
   ```
4. Refresh — admin panel + bell now active

---

## Critical pre-launch checklist

- [ ] Rotate the leaked Authkey API key `bedfc307ae476372` (carryover from earlier sessions)
- [ ] Replace `assets/hero-kids-coding.jpg` with a real B The Change session photo
- [ ] Get at least 3 approved submissions live before public launch (so program pages aren't empty)
- [ ] Verify the annual report PDF (`assets/reports/btc-annual-report-2024.pdf`) — numbers in it are illustrative pending CA audit. **Do not publicly link without verifying figures.**
- [ ] Update `data-domain="bthechange.in"` in `generate.js` head() if you deploy to a different domain, then re-run `node generate.js`

---

## Things deferred (not in this build, flagged in audit)

- Self-hosted Supabase JS + Quill (currently CDN — single point of failure)
- Service worker / offline support (defer to v2 / kids portal phase)
- Phone OTP via MSG91 + DLT (email OTP is wired; phone tab shows "coming soon")
- Razorpay 80G receipt automation (donations currently route to WhatsApp for retail, `/csr` enquiry recommended for v1)
- Telugu language version
- Sentry DSN paste (block is commented in `generate.js` head())
- Replace placeholder logos for Launchpad and L.A.W.G.I.C. (currently use main BTC logo)
- Replace fabricated stats/quotes for Launchpad and L.A.W.G.I.C. with real numbers/quotes once collected

---

## Regenerating HTML files after edits

If you edit `data.js` or `generate.js`:
```bash
node generate.js
```
That rewrites all 35 HTML files from source.

---

## Support

If something breaks during deploy, the audit document `bthechange-audit-2026-05-02.md` (separate file from this build) has detailed troubleshooting per-lens. SETUP_GUIDE.md has the long-form deployment steps.

For domain config, redirects, custom 404 routing — those vary by host. Most static hosts auto-pick `404.html`.

— Built for Rohan Rajkulkarni, Working President, B The Change Welfare Society
