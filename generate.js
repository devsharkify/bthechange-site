// Run: node generate.js
// Outputs: index.html, programs/<slug>.html, programs/<slug>/support.html

const fs = require('fs');
const path = require('path');
const { PROGRAMS, ORG, TIERS, TEAM, ICONS, TIER_ICONS, iconSvg, waLink } = require('./data.js');

const OUT = __dirname;

// Shared HTML fragments ------------------------------------------------------

const head = ({ title, desc, css, ogImage }) => {
  const prefix = css.replace('assets/style.css', '');
  const SITE_URL = 'https://bthechange.in';
  const ogImg = ogImage || (prefix + 'assets/bthechange-logo.png');
  const fullOgImg = ogImg.startsWith('http') ? ogImg : (SITE_URL + '/' + ogImg.replace(/^\//, ''));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#1E3A6F" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#142951" media="(prefers-color-scheme: dark)" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="B The Change" />
<meta name="mobile-web-app-capable" content="yes" />
<link rel="manifest" href="${prefix}manifest.json" />
<title>${title}</title>
<meta name="description" content="${desc}" />

<!-- OpenGraph (Facebook, LinkedIn, WhatsApp link previews) -->
<meta property="og:site_name" content="B The Change Welfare Society" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${fullOgImg}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="en_IN" />

<!-- Twitter card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${fullOgImg}" />

<!-- Schema.org NGO markup -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "B The Change Welfare Society",
  "alternateName": "B The Change",
  "url": "${SITE_URL}",
  "logo": "${SITE_URL}/assets/bthechange-logo.png",
  "foundingDate": "${ORG.founded}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rd Number 2, Visaka Nagar, Almasguda",
    "addressLocality": "Hyderabad",
    "addressRegion": "Telangana",
    "postalCode": "500112",
    "addressCountry": "IN"
  },
  "email": "${ORG.email}",
  "telephone": "+${ORG.whatsapp}",
  "sameAs": []
}
</script>

<link rel="icon" type="image/png" sizes="192x192" href="${prefix}assets/icon-192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="${prefix}assets/icon-512.png" />
<link rel="apple-touch-icon" sizes="180x180" href="${prefix}assets/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${css}" />
<script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer src="${prefix}assets/supabase-config.js"></script>
<script defer src="${prefix}assets/admin-bell.js"></script>

<!-- Plausible analytics (privacy-friendly, GDPR-compliant). Replace data-domain after deploy. -->
<script defer data-domain="bthechange.in" src="https://plausible.io/js/script.js"></script>

<!-- Sentry browser SDK (uncomment + replace DSN after creating project) -->
<!-- <script src="https://browser.sentry-cdn.com/7.105.0/bundle.tracing.min.js" crossorigin="anonymous"></script>
<script>if (window.Sentry) Sentry.init({ dsn: 'YOUR_SENTRY_DSN', tracesSampleRate: 0.2 });</script> -->
</head>
<body>
<a href="${css.includes('../') ? '../../' : ''}#main" class="skip">Skip to content</a>
<div id="btc-toast-stack" class="btc-toast-stack" aria-live="polite" aria-atomic="true"></div>`;
};

const announcement = (rel = '') => `
<div class="ann">
  <div class="ann-inner">
    <span><span class="ann-dot">●</span>&nbsp; SINCE ${ORG.founded}</span>
    <span>·</span>
    <span>REG NO ${ORG.regNo}</span>
    <span>·</span>
    <span>80G · 12A · CSR-1</span>
    <span>·</span>
    <span>NITI AAYOG ${ORG.darpanId}</span>
  </div>
</div>`;

const header = ({ rel = '', activeNav = '' }) => `
<header class="hdr" id="hdr">
  <div class="hdr-inner">
    <a class="brand" href="${rel}index.html" aria-label="B The Change Welfare Society">
      <img src="${rel}assets/bthechange-logo.png" alt="B The Change Welfare Society" class="brand-logo" />
    </a>
    <nav class="nav" id="nav">
      <a href="${rel}about.html"${activeNav==='about' ? ' class="is-active"':''}>About</a>
      <a href="${rel}team.html"${activeNav==='team' ? ' class="is-active"':''}>Team</a>
      <a href="${rel}index.html#programs"${activeNav==='programs' ? ' class="is-active"':''}>Programs</a>
      <a href="${rel}awards.html"${activeNav==='awards' ? ' class="is-active accent"':''} style="color: var(--accent);">Awards</a>
      <a href="${rel}blog.html"${activeNav==='blog' ? ' class="is-active"':''}>Blog</a>
      <a href="${rel}login.html" class="nav-signin-mobile">Sign in</a>
      <a href="${rel}submit.html" class="nav-mobile-only hdr-user-mobile-link" style="display:none;">Share story</a>
      <a href="${rel}my.html" class="nav-mobile-only hdr-user-mobile-link" style="display:none;">My submissions</a>
      <a href="${rel}admin.html" class="nav-mobile-only hdr-admin-mobile-link" style="display:none;">Admin <span id="hdr-admin-mobile-count" style="color:var(--accent);"></span></a>
      <a href="#" class="nav-mobile-only hdr-user-mobile-link" id="hdr-signout-mobile" style="display:none;">Sign out</a>
    </nav>
    <div class="hdr-cta">
      <div class="hdr-user-menu" id="hdr-user-menu" style="display:none;">
        <button class="hdr-user-btn" id="hdr-user-btn" aria-label="User menu" aria-expanded="false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
          </svg>
          <span class="hdr-user-pip" id="hdr-user-pip" style="display:none;"></span>
        </button>
        <div class="hdr-user-dropdown" id="hdr-user-dropdown" role="menu">
          <a href="${rel}submit.html" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>
            Share story
          </a>
          <a href="${rel}my.html" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            My submissions
          </a>
          <a href="${rel}admin.html" role="menuitem" id="hdr-dropdown-admin" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Admin <span class="hdr-dropdown-count" id="hdr-dropdown-count" style="display:none;">0</span>
          </a>
          <div class="hdr-user-divider"></div>
          <button type="button" class="hdr-user-signout" id="hdr-signout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>
            Sign out
          </button>
        </div>
      </div>
      <a href="${rel}login.html" class="hdr-signin" id="hdr-signin-link">Sign in</a>
      <a href="${waLink('Hi, I want to partner with B The Change Welfare Society.')}" target="_blank" rel="noopener" class="btn btn--ink">Partner with us</a>
      <button class="menu-btn btn" aria-label="Toggle menu" id="menu-btn"><span></span></button>
    </div>
  </div>
</header>`;

const footer = (rel = '') => `
<footer class="ftr">
  <div class="wrap">
    <div class="ftr-top">
      <div class="ftr-brand">
        <a class="brand" href="${rel}index.html" aria-label="B The Change Welfare Society">
          <img src="${rel}assets/bthechange-logo.png" alt="B The Change Welfare Society" class="brand-logo brand-logo--lg" />
        </a>
        <p class="ftr-tag">"Real change is the slowest thing in the world. You sit with a family for ten years before you see it."</p>
      </div>

      <div class="ftr-col">
        <h5>Reach us</h5>
        <address class="ftr-addr">
          <a href="${ORG.mapUrl}" target="_blank" rel="noopener" title="Open in Google Maps">${ORG.address} <span style="opacity:.6;">↗</span></a>
          <a href="mailto:${ORG.email}">${ORG.email}</a>
          <a href="${waLink('Hi, I want to reach B The Change Welfare Society.', ORG.whatsapp)}" target="_blank" rel="noopener" class="ftr-wa">WhatsApp · ${ORG.whatsappDisplay}</a>
        </address>
      </div>

      <div class="ftr-col">
        <h5>Get involved</h5>
        <ul>
          <li><a href="${rel}awards.html" style="color: var(--accent);">ChangeMaker Awards 2026</a></li>
          <li><a href="${waLink('Hi, I want to partner with B The Change Welfare Society.')}" target="_blank" rel="noopener">Partner with us</a></li>
          <li><a href="${rel}index.html#involve">Volunteer</a></li>
          <li><a href="${rel}about.html">About</a></li>
          <li><a href="${rel}team.html">Team</a></li>
          <li><a href="${rel}index.html#programs">All 11 programs</a></li>
          <li><a href="${rel}about.html#board">Board of trustees</a></li>
          <li><a href="${rel}about.html#transparency">Annual reports</a></li>
          <li><a href="${rel}press.html">Press kit</a></li>
        </ul>
      </div>
    </div>

    <div class="ftr-bottom">
      <div class="ftr-creds">
        <span>REG <span>${ORG.regNo}</span></span>
        <span class="ftr-dot" aria-hidden="true">·</span>
        <span>NITI AAYOG <span>${ORG.darpanId}</span></span>
        <span class="ftr-dot" aria-hidden="true">·</span>
        <span>80G &middot; 12A &middot; CSR-1</span>
        <span class="ftr-dot" aria-hidden="true">·</span>
        <span>© ${ORG.founded}-2026 B THE CHANGE</span>
      </div>
      <div class="ftr-social" aria-label="Social media">
        <button id="btc-install-btn" hidden type="button" class="ftr-install" aria-label="Install B The Change app on your phone">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          <span>Install app</span>
        </button>
        <a href="#" aria-label="Instagram"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg></a>
        <a href="#" aria-label="LinkedIn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v6M8 8v.01M12 17v-4a2 2 0 0 1 4 0v4M12 11v6"/></svg></a>
        <a href="#" aria-label="YouTube"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg></a>
      </div>
    </div>
  </div>
</footer>

<nav class="site-bnav" aria-label="Main navigation">
  <a class="site-bnav-item" href="${rel}index.html" data-bnav="home">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    <span class="site-bnav-label">Home</span>
  </a>
  <a class="site-bnav-item" href="${rel}index.html#programs" data-bnav="programs">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    <span class="site-bnav-label">Programs</span>
  </a>
  <a class="site-bnav-item" href="${rel}blog.html" data-bnav="blog">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    <span class="site-bnav-label">Blog</span>
  </a>
  <a class="site-bnav-item" href="${rel}index.html#involve" data-bnav="involve">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    <span class="site-bnav-label">Volunteer</span>
  </a>
  <a class="site-bnav-item" href="${rel}login.html" data-bnav="account" id="site-bnav-account">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    <span class="site-bnav-label">Account</span>
  </a>
</nav>
<script>
(function(){
  var p = window.location.pathname;
  var map = { home: ['/index.html','/'], programs: ['/programs/'], blog: ['/blog.html','/blog-post.html','/blog-write.html'], account: ['/login.html','/my.html','/submit.html'] };
  Object.keys(map).forEach(function(key){
    var hits = map[key];
    var match = hits.some(function(h){ return p === h || p.endsWith(h) || p.includes(h); });
    if (match) { var el = document.querySelector('.site-bnav-item[data-bnav="' + key + '"]'); if (el) el.classList.add('is-active'); }
  });
})();
</script>`;

const authModal = `
<div class="auth-modal" id="auth-modal" aria-hidden="true" role="dialog">
  <div class="auth-card">
    <button class="auth-close" id="auth-close" aria-label="Close sign in">×</button>
    <div class="auth-steps">
      <section class="auth-step is-active" data-step="1">
        <div class="auth-brandbar">
          <img src="assets/bthechange-logo.png" alt="B The Change Welfare Society" class="brand-logo brand-logo--lg" />
          <span class="auth-reg-tag">REG NO ${ORG.regNo}</span>
        </div>
        <div class="auth-kicker"><span>SIGN IN · STEP 01 OF 02</span></div>
        <h2 class="auth-h1">Don't <span class="strike">WAIT</span> for change.<br /><span class="be">Be</span> the change.</h2>
        <p class="auth-lede">Sign in to share stories, volunteer, or manage submissions. We'll send a 6-digit code to verify it's you.</p>
        <div class="auth-decor"><span></span></div>
        <div class="auth-tabs">
          <button class="auth-tab is-active" data-tab="email" type="button">Email</button>
          <button class="auth-tab" data-tab="phone" type="button">Phone</button>
        </div>
        <label class="auth-label" for="auth-phone-input">EMAIL ADDRESS</label>
        <div class="auth-phone-row is-email" id="auth-phone-row">
          <div class="auth-cc">
            <button class="auth-cc-btn" id="auth-cc-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
              <span class="auth-cc-flag">🇮🇳</span>
              <span class="auth-cc-code" id="auth-cc-code">+91</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div class="auth-cc-list" id="auth-cc-list" role="listbox">
              <button type="button" data-cc="+91" data-flag="🇮🇳" data-name="India">🇮🇳 India <span>+91</span></button>
              <button type="button" data-cc="+1"  data-flag="🇺🇸" data-name="USA">🇺🇸 United States <span>+1</span></button>
              <button type="button" data-cc="+44" data-flag="🇬🇧" data-name="UK">🇬🇧 United Kingdom <span>+44</span></button>
              <button type="button" data-cc="+971" data-flag="🇦🇪" data-name="UAE">🇦🇪 UAE <span>+971</span></button>
              <button type="button" data-cc="+61" data-flag="🇦🇺" data-name="Australia">🇦🇺 Australia <span>+61</span></button>
              <button type="button" data-cc="+1" data-flag="🇨🇦" data-name="Canada">🇨🇦 Canada <span>+1</span></button>
              <button type="button" data-cc="+65" data-flag="🇸🇬" data-name="Singapore">🇸🇬 Singapore <span>+65</span></button>
              <button type="button" data-cc="+60" data-flag="🇲🇾" data-name="Malaysia">🇲🇾 Malaysia <span>+60</span></button>
              <button type="button" data-cc="+966" data-flag="🇸🇦" data-name="Saudi Arabia">🇸🇦 Saudi Arabia <span>+966</span></button>
              <button type="button" data-cc="+974" data-flag="🇶🇦" data-name="Qatar">🇶🇦 Qatar <span>+974</span></button>
              <button type="button" data-cc="+49" data-flag="🇩🇪" data-name="Germany">🇩🇪 Germany <span>+49</span></button>
              <button type="button" data-cc="+33" data-flag="🇫🇷" data-name="France">🇫🇷 France <span>+33</span></button>
              <button type="button" data-cc="+81" data-flag="🇯🇵" data-name="Japan">🇯🇵 Japan <span>+81</span></button>
              <button type="button" data-cc="+86" data-flag="🇨🇳" data-name="China">🇨🇳 China <span>+86</span></button>
            </div>
          </div>
          <input type="email" id="auth-phone-input" class="auth-input" placeholder="you@example.com" autocomplete="email" />
        </div>
        <div id="auth-phone-warn" class="auth-warn" style="display:none;">Phone sign-in launching soon. Please use Email for now.</div>
        <div id="auth-error" class="auth-error" style="display:none;"></div>
        <p class="auth-helper">We'll never share your contact. Used only to verify it's you.</p>
        <button class="btn btn--accent btn--block btn--lg" id="auth-phone-submit" type="button">Continue <span class="arrow">→</span></button>
      </section>
      <section class="auth-step" data-step="2">
        <div class="auth-topbar">
          <button class="auth-back" data-back-to="1" aria-label="Back">←</button>
          <div class="auth-step-mono">STEP 02 OF 02</div>
          <div style="flex:1"></div>
        </div>
        <div class="auth-kicker"><span>ENTER 6-DIGIT CODE</span></div>
        <h2 class="auth-h1">Check your <em>inbox.</em></h2>
        <p class="auth-lede">We sent a code to <span id="auth-otp-phone">...</span>.<br /><a data-back-to="1" class="auth-wrong">Wrong address?</a></p>
        <div class="auth-otp" id="auth-otp-boxes">
          ${[1,2,3,4,5,6].map((_,i)=>`<input type="text" maxlength="1" inputmode="numeric" aria-label="Digit ${i+1}" />`).join('')}
        </div>
        <div id="auth-otp-error" class="auth-error" style="display:none;"></div>
        <button class="btn btn--accent btn--block btn--lg" id="auth-otp-verify" type="button">Verify &amp; continue <span class="arrow">→</span></button>
        <p class="auth-resend">Didn't receive? <span id="auth-resend">Resend in 0:42</span></p>
      </section>
      <section class="auth-step" data-step="3">
        <div class="auth-welcome-check">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="auth-kicker is-success centered"><span>YOU'RE IN</span></div>
        <h2 class="auth-h1 centered">Welcome to <em>the change.</em></h2>
        <p class="auth-lede centered">Your account is ready. Pick up where you left off, or start exploring.</p>
        <button class="btn btn--accent btn--block btn--lg" id="auth-welcome-done" type="button" style="margin-top:18px;">Get started <span class="arrow">→</span></button>
      </section>
    </div>
  </div>
</div>`;

const scripts = `
<script>
/* PWA: register service worker + install prompt */
(function() {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').catch(function(err) {
        console.warn('[BTC] SW registration failed:', err);
      });
    });
  }

  // Capture beforeinstallprompt for "Install app" CTA
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    // Show our install button (if footer has one)
    const btn = document.getElementById('btc-install-btn');
    if (btn) {
      btn.hidden = false;
      btn.addEventListener('click', async function() {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted' && window.btcToast) {
          window.btcToast('B The Change installed on your phone.', 'success');
        }
        deferredPrompt = null;
        btn.hidden = true;
      });
    }
  });

  // Hide install button after install
  window.addEventListener('appinstalled', function() {
    const btn = document.getElementById('btc-install-btn');
    if (btn) btn.hidden = true;
  });
})();
</script>
<script>
/* GLOBAL TOAST — window.btcToast(msg, type='info'|'success'|'error', duration=4000) */
window.btcToast = function(msg, type, duration) {
  type = type || 'info';
  duration = duration || 4000;
  const stack = document.getElementById('btc-toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'btc-toast btc-toast--' + type;
  const ic = type === 'success' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : type === 'error' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  el.innerHTML = '<span class="btc-toast-icon">' + ic + '</span><span class="btc-toast-msg">' + msg + '</span><button class="btc-toast-close" aria-label="Dismiss">×</button>';
  stack.appendChild(el);
  const dismiss = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 250); };
  el.querySelector('.btc-toast-close').addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
};
const hdr = document.getElementById('hdr');
window.addEventListener('scroll', () => hdr.classList.toggle('scrolled', window.scrollY > 8), { passive: true });
const menuBtn = document.getElementById('menu-btn');
const nav = document.getElementById('nav');
menuBtn?.addEventListener('click', () => { nav.classList.toggle('is-open'); menuBtn.classList.toggle('is-active'); });
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('is-open'); menuBtn?.classList.remove('is-active'); }));
const io = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimal || '0', 10);
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const v = target * easeOut(t);
    el.textContent = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-IN');
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const countObserver = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); countObserver.unobserve(e.target); } }); }, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));
(function() {
  const modal = document.getElementById('auth-modal'); if (!modal) return;
  const closeBtn = document.getElementById('auth-close');
  const steps = modal.querySelectorAll('.auth-step');
  const stepsContainer = modal.querySelector('.auth-steps');
  let resendInterval = null;
  function open() { modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; goTo(1); }
  function close() { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (resendInterval) clearInterval(resendInterval); modal.querySelectorAll('#auth-otp-boxes input').forEach(i => { i.value = ''; i.classList.remove('is-filled'); }); }
  function goTo(n) { steps.forEach(s => s.classList.toggle('is-active', parseInt(s.dataset.step, 10) === n)); stepsContainer.scrollTop = 0; if (n === 2) startResendTimer(); if (n === 1) setTimeout(() => modal.querySelector('#auth-phone-input')?.focus(), 50); if (n === 2) setTimeout(() => modal.querySelector('#auth-otp-boxes input')?.focus(), 50); }
  /* Auto-open modal if URL has ?signin=1 (e.g. redirected from a gated page) */
  if (new URLSearchParams(window.location.search).has('signin')) { open(); }
  document.querySelectorAll('[data-auth-open]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(); }));
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
  modal.querySelectorAll('[data-back-to]').forEach(b => b.addEventListener('click', () => goTo(parseInt(b.dataset.backTo, 10))));
  /* Auth method tabs (Email default, Phone shows "coming soon" notice) */
  const phoneWarn = document.getElementById('auth-phone-warn');
  modal.querySelectorAll('.auth-tab').forEach(t => t.addEventListener('click', () => {
    modal.querySelectorAll('.auth-tab').forEach(x => x.classList.remove('is-active'));
    t.classList.add('is-active');
    const input = modal.querySelector('#auth-phone-input');
    const phoneRow = modal.querySelector('#auth-phone-row');
    if (t.dataset.tab === 'email') {
      input.type = 'email'; input.placeholder = 'you@example.com'; input.value = '';
      input.classList.remove('auth-phone-input');
      modal.querySelector('.auth-label').textContent = 'EMAIL ADDRESS';
      if (phoneRow) phoneRow.classList.add('is-email');
      if (phoneWarn) phoneWarn.style.display = 'none';
    } else {
      input.type = 'tel'; input.placeholder = '90009 35898'; input.value = '';
      input.classList.add('auth-phone-input');
      modal.querySelector('.auth-label').textContent = 'MOBILE NUMBER';
      if (phoneRow) phoneRow.classList.remove('is-email');
      if (phoneWarn) phoneWarn.style.display = 'block';
    }
    input.focus();
  }));
  /* Country code dropdown */
  const ccBtn = document.getElementById('auth-cc-btn');
  const ccList = document.getElementById('auth-cc-list');
  const ccCode = document.getElementById('auth-cc-code');
  const ccFlag = ccBtn ? ccBtn.querySelector('.auth-cc-flag') : null;
  if (ccBtn && ccList) {
    ccBtn.addEventListener('click', e => { e.stopPropagation(); const isOpen = ccList.classList.toggle('is-open'); ccBtn.setAttribute('aria-expanded', isOpen); });
    document.addEventListener('click', e => { if (ccList.classList.contains('is-open') && !e.target.closest('.auth-cc')) { ccList.classList.remove('is-open'); ccBtn.setAttribute('aria-expanded', 'false'); }});
    ccList.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { ccCode.textContent = b.dataset.cc; ccFlag.textContent = b.dataset.flag; ccList.classList.remove('is-open'); ccBtn.setAttribute('aria-expanded', 'false'); modal.querySelector('#auth-phone-input').focus(); }));
  }
  /* SUPABASE OTP — real wiring */
  let _SB = null;
  function getSB() {
    if (_SB) return _SB;
    if (!window.SUPABASE_CONFIG || !window.supabase) return null;
    _SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    return _SB;
  }
  let _pendingEmail = null;
  const errEl = document.getElementById('auth-error');
  const otpErrEl = document.getElementById('auth-otp-error');
  function showErr(el, msg) { if (!el) return; el.textContent = msg; el.style.display = 'block'; }
  function hideErr(el) { if (el) el.style.display = 'none'; }
  document.getElementById('auth-phone-submit').addEventListener('click', async () => {
    hideErr(errEl);
    const input = document.getElementById('auth-phone-input');
    const submitBtn = document.getElementById('auth-phone-submit');
    const activeTab = modal.querySelector('.auth-tab.is-active').dataset.tab;
    if (activeTab === 'phone') {
      showErr(errEl, 'Phone sign-in is coming soon. Please switch to Email for now.');
      return;
    }
    const email = input.value.trim().toLowerCase();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) { input.style.borderColor = '#C42828'; input.focus(); showErr(errEl, 'Please enter a valid email address.'); return; }
    input.style.borderColor = '';
    const SB = getSB();
    if (!SB) { showErr(errEl, 'Sign-in is not configured yet. Please contact support@bthechange.in.'); return; }
    submitBtn.disabled = true; submitBtn.textContent = 'Sending code...';
    try {
      const { error } = await SB.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
      _pendingEmail = email;
      document.getElementById('auth-otp-phone').textContent = email;
      goTo(2);
    } catch (e) {
      showErr(errEl, (e && e.message) || 'Could not send code. Please try again.');
    } finally {
      submitBtn.disabled = false; submitBtn.innerHTML = 'Continue <span class="arrow">→</span>';
    }
  });
  const otpInputs = modal.querySelectorAll('#auth-otp-boxes input');
  otpInputs.forEach((inp, i) => {
    inp.addEventListener('input', e => { const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 1); e.target.value = v; e.target.classList.toggle('is-filled', !!v); if (v && i < otpInputs.length - 1) otpInputs[i + 1].focus(); });
    inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !e.target.value && i > 0) otpInputs[i - 1].focus(); });
    inp.addEventListener('paste', e => { const text = (e.clipboardData || window.clipboardData).getData('text'); const digits = text.replace(/[^0-9]/g, '').slice(0, 6); if (digits.length === 6) { e.preventDefault(); digits.split('').forEach((d, idx) => { if (otpInputs[idx]) { otpInputs[idx].value = d; otpInputs[idx].classList.add('is-filled'); } }); otpInputs[5].focus(); } });
  });
  document.getElementById('auth-otp-verify').addEventListener('click', async () => {
    hideErr(otpErrEl);
    const code = Array.from(otpInputs).map(x => x.value).join('');
    if (code.length !== 6) { otpInputs.forEach(i => { if (!i.value) i.style.borderColor = '#C42828'; }); showErr(otpErrEl, 'Please enter all 6 digits.'); return; }
    otpInputs.forEach(i => { i.style.borderColor = ''; });
    const SB = getSB();
    if (!SB || !_pendingEmail) { showErr(otpErrEl, 'Session expired. Go back and try again.'); return; }
    const verifyBtn = document.getElementById('auth-otp-verify');
    verifyBtn.disabled = true; verifyBtn.textContent = 'Verifying...';
    try {
      const { data, error } = await SB.auth.verifyOtp({ email: _pendingEmail, token: code, type: 'email' });
      if (error) throw error;
      if (!data || !data.session) throw new Error('Verification did not return a session.');
      goTo(3);
    } catch (e) {
      showErr(otpErrEl, (e && e.message) || 'Code is incorrect or expired. Please try again.');
    } finally {
      verifyBtn.disabled = false; verifyBtn.innerHTML = 'Verify &amp; continue <span class="arrow">→</span>';
    }
  });
  document.getElementById('auth-welcome-done').addEventListener('click', () => {
    close();
    /* If we landed on submit.html (or any auth-required page) via redirect, go there */
    try {
      const next = sessionStorage.getItem('btc-auth-next');
      if (next) { sessionStorage.removeItem('btc-auth-next'); window.location.href = next; return; }
    } catch (_) {}
    /* Otherwise reload so admin-bell.js picks up the new session and reveals the user dropdown */
    window.location.reload();
  });
  function startResendTimer() { if (resendInterval) clearInterval(resendInterval); let secs = 42; const link = document.getElementById('auth-resend'); link.classList.remove('is-active'); const tick = () => { if (secs <= 0) { clearInterval(resendInterval); link.textContent = 'Resend code'; link.classList.add('is-active'); return; } const m = String(Math.floor(secs / 60)); const s = String(secs % 60).padStart(2, '0'); link.textContent = 'Resend in ' + m + ':' + s; secs--; }; tick(); resendInterval = setInterval(tick, 1000); }
  document.getElementById('auth-resend').addEventListener('click', async e => {
    if (!e.target.classList.contains('is-active')) return;
    if (!_pendingEmail) return;
    const SB = getSB(); if (!SB) return;
    try { await SB.auth.signInWithOtp({ email: _pendingEmail, options: { shouldCreateUser: true } }); startResendTimer(); }
    catch (err) { showErr(otpErrEl, (err && err.message) || 'Could not resend.'); }
  });

  /* LEADERSHIP CAROUSEL */
  const lTrack = document.getElementById('leader-track');
  if (lTrack) {
    const slides = lTrack.querySelectorAll('.leader-slide');
    const total = slides.length;
    const prevBtn = document.getElementById('leader-prev');
    const nextBtn = document.getElementById('leader-next');
    const counter = document.getElementById('leader-current');
    const dots = document.querySelectorAll('.leader-dot');
    let idx = 0;
    const update = () => {
      lTrack.style.transform = 'translateX(-' + (idx * 100) + '%)';
      counter.textContent = (idx + 1);
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === total - 1;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };
    prevBtn.addEventListener('click', () => { if (idx > 0) { idx--; update(); } });
    nextBtn.addEventListener('click', () => { if (idx < total - 1) { idx++; update(); } });
    dots.forEach(d => d.addEventListener('click', () => { idx = parseInt(d.dataset.go, 10); update(); }));
    /* Keyboard arrows when focused near the carousel */
    document.addEventListener('keydown', e => {
      if (!document.activeElement.closest('.leader-controls, .leader-dots, .leader-carousel')) return;
      if (e.key === 'ArrowLeft' && idx > 0) { idx--; update(); }
      if (e.key === 'ArrowRight' && idx < total - 1) { idx++; update(); }
    });
    /* Swipe support for touch */
    let startX = 0;
    lTrack.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    lTrack.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 50) return;
      if (dx < 0 && idx < total - 1) { idx++; update(); }
      if (dx > 0 && idx > 0) { idx--; update(); }
    });
  }
})();
</script>
</body>
</html>`;

// HOMEPAGE -------------------------------------------------------------------

const homepage = () => `${head({ title: "B The Change, Don't WAIT for change. Be the change.", desc: "A Hyderabad-based welfare society. Since 2006, 11 programs across India: education, health, women's empowerment, environment, animal welfare, legal aid. Reg 1538/2015 · 80G certified.", css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: '' })}

<main id="main">

  <section class="hero hero--with-photo" style="background-image: url('assets/hero-kids-coding.jpg');">
    <div class="wrap">
      <div class="hero-grid">
        <div class="hero-text" data-reveal>
          <div class="hero-eyebrow">A LEGACY SINCE ${ORG.founded} · REG ${ORG.regNo}</div>
          <h1 class="hero-h1">Don't <span class="strike">WAIT</span><br />for change.<br /><span class="be">Be</span> the change.</h1>
          <p class="hero-lede">Two decades. Eleven programs. Two hundred thousand lives quietly, stubbornly turned. We don't run on slogans. We run on showing up.</p>
          <div class="hero-cta">
            <a href="awards.html" class="btn btn--accent btn--lg">B The Change Awards <span class="arrow">→</span></a>
            <a href="#programs" class="btn btn--secondary btn--lg">See our programs</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="hero-stats-strip">
    <div class="wrap">
      <div class="hero-stats" data-reveal>
        <div><div class="hero-stat-num"><span data-count="20">20</span><span>YR</span></div><div class="hero-stat-lbl">UNBROKEN WORK</div></div>
        <div><div class="hero-stat-num"><span data-count="200000">200,000</span>+</div><div class="hero-stat-lbl">LIVES TOUCHED</div></div>
        <div><div class="hero-stat-num"><span data-count="11">11</span></div><div class="hero-stat-lbl">PROGRAMS</div></div>
        <div><div class="hero-stat-num">2<span class="serif-it" style="color:var(--accent);">/2</span></div><div class="hero-stat-lbl">COUNTRIES</div></div>
      </div>
    </div>
  </section>

  <section class="section muted" id="programs">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">WHAT WE DO · 11 PROGRAMS</span></div>
        <h2>Eleven fronts. <em>One mission.</em></h2>
        <p style="font-family:var(--font-serif); font-style:italic; font-size:18px; color:var(--ink-3); max-width:42ch; margin:0;">
          Each program is run end-to-end by a local team.<br />Tap any program to see its story, its work, and how to support it directly.
        </p>
      </div>

      <div class="programs-grid programs-grid--asym">
        ${PROGRAMS.map((p, i) => `
        <a href="programs/${p.slug}.html" class="program-card" data-reveal style="--d: ${i * 50}ms; --card-color: ${p.color}; --card-bg: ${p.logoBg}; --card-tint: ${p.color}1A;">
          <div class="pc-num">
            <span><strong>${String(i+1).padStart(2,'0')}</strong> · ${p.name.split(' ')[0].toUpperCase()}</span>
            <span class="pc-num-arr">→</span>
          </div>
          <div class="pc-icon${p.logoImg ? ' pc-icon--image' : ''}">${p.logoImg ? `<img src="${p.logoImg}" alt="${p.name} logo" />` : iconSvg(p.icon, 24)}</div>
          <h3>${p.name}</h3>
          <p>${p.tagline}</p>
        </a>`).join('')}
      </div>
    </div>
  </section>


  <!-- FOUNDER RESOLVE CAROUSEL -->
  <section class="section" id="foundation">
    <div class="wrap">
      <div class="leader-head" data-reveal>
        <div class="kicker"><span class="mono accent">EST ${ORG.founded} · A FOUNDER'S RESOLVE</span></div>
        <div class="leader-head-row">
          <h2 style="margin: 0;">Two decades of <em>quiet</em> change.</h2>
          <div class="leader-controls" aria-label="Carousel navigation">
            <button class="leader-btn" id="leader-prev" aria-label="Previous leader" disabled>←</button>
            <span class="leader-count"><span id="leader-current">1</span> / ${TEAM.length}</span>
            <button class="leader-btn" id="leader-next" aria-label="Next leader"${TEAM.length > 1 ? '' : ' disabled'}>→</button>
          </div>
        </div>
      </div>

      <div class="leader-carousel">
        <div class="leader-track" id="leader-track">
          ${TEAM.map((t, i) => `
          <article class="leader-slide" data-slide="${i}" aria-label="${t.name}, ${t.role}">
            <div class="foundation-grid">
              <div class="foundation-text">
                <div class="foundation-text-body">
                  <div class="kicker"><span class="mono accent">${t.kicker}</span></div>
                  <h2>${t.headline}</h2>
                  ${t.bioShort.map(p => `<p>${p}</p>`).join('\n                  ')}
                </div>

                <div class="leader-foot">
                  <div class="leader-dots" role="tablist" aria-label="Leader slides">
                    ${TEAM.map((tm, j) => `<button class="leader-dot${j === 0 ? ' is-active' : ''}" data-go="${j}" aria-label="Show ${tm.shortName}"></button>`).join('')}
                  </div>
                </div>
              </div>
              <figure class="photo-slot photo-slot--image" style="background-image: url('${t.image}');">
                <span class="photo-mark">B THE CHANGE WELFARE SOCIETY</span>
                <p class="photo-cap-name">${t.role}</p>
              </figure>
            </div>
          </article>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <section class="section dark" id="impact">
    <div class="wrap">
      <div class="impact-head" data-reveal>
        <div class="kicker"><span class="mono accent">IMPACT · LIFETIME</span></div>
        <h2>Numbers that <em>mean</em> something.</h2>
      </div>
      <div class="impact-grid">
        <div class="impact-cell" data-reveal>
          <div class="impact-num"><span data-count="200000">200,000</span><span class="unit">+</span></div>
          <div class="impact-lbl">LIVES TOUCHED</div>
          <div class="impact-cap">Children, mothers, elders, families served since ${ORG.founded}.</div>
        </div>
        <div class="impact-cell" data-reveal style="--d: 100ms">
          <div class="impact-num"><span data-count="1000">1,000</span><span class="unit">+</span></div>
          <div class="impact-lbl">SCHOOLS PARTNERED</div>
          <div class="impact-cap">Government schools and community programs across rural India.</div>
        </div>
        <div class="impact-cell" data-reveal style="--d: 200ms">
          <div class="impact-num"><span data-count="11">11</span></div>
          <div class="impact-lbl">ACTIVE PROGRAMS</div>
          <div class="impact-cap">From digital education to legal aid. End-to-end, locally run.</div>
        </div>
        <div class="impact-cell" data-reveal style="--d: 300ms">
          <div class="impact-num"><span data-count="9">9</span><span class="unit">YR</span></div>
          <div class="impact-lbl">EKO WARRIORS</div>
          <div class="impact-cap">Sustained environmental advocacy. PILs filed. Forests still standing.</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="voices">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">VOICES · ON THE GROUND</span></div>
        <h2>Stories <em>they</em> wrote.</h2>
      </div>
      <div class="programs-grid programs-grid--3">
        ${PROGRAMS.slice(0, 3).map(p => `
        <article class="program-card program-card--withfoot" data-reveal style="--card-color: ${p.color}; --card-bg: ${p.logoBg}; --card-tint: ${p.color}1A;">
          <div class="pc-num"><strong>${p.name.split(' ')[0].toUpperCase()}</strong></div>
          <p style="font-family:var(--font-serif); font-style: italic; font-size: 17px; color: var(--ink); margin: 18px 0; line-height: 1.5;">"${p.quote}"</p>
          <div class="program-card-foot" style="border-top: 1px solid var(--line);">
            <div style="font-family: var(--font-mono); font-weight: 700; font-size: 9.5px; letter-spacing: 1.6px; color: var(--mute);">${p.quoteBy}</div>
            <a href="programs/${p.slug}.html" class="program-card-go">Read more →</a>
          </div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section muted" id="involve">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">GET INVOLVED</span></div>
        <h2>Three ways to <em>show up.</em></h2>
      </div>
      <div class="programs-grid programs-grid--3 programs-grid--involve">
        <a href="${waLink('Hi, I want to partner with B The Change Welfare Society, interested in CSR / sponsorship.')}" target="_blank" rel="noopener" class="program-card program-card--withfoot" style="--card-color: var(--accent); --card-bg: var(--accent-soft); --card-tint: var(--accent-soft); background: var(--accent-soft); color: var(--ink); border-color: rgba(30, 58, 111, 0.18);">
          <div class="pc-num" style="color: var(--ink-3);"><strong style="color: var(--accent);">01</strong> · PARTNER</div>
          <h3 style="color: var(--ink);">Power a <em style="font-family: var(--font-serif); font-style: italic; color: var(--accent);">whole</em> program for a year.</h3>
          <p style="color: var(--ink-3);">Four partnership tiers from ₹1,00,000 to ₹5,00,000+. CSR-1 eligible. 80G receipts. Quarterly impact reports. Site visits.</p>
          <div class="program-card-foot" style="border-top-color: rgba(30, 58, 111, 0.18);">
            <div class="program-card-tag" style="background: rgba(30, 58, 111, 0.10); color: var(--accent);">CSR · 80G · 12A</div>
            <div class="program-card-go" style="color: var(--accent);">Talk on WhatsApp →</div>
          </div>
        </a>
        <a href="${waLink('Hi, I want to volunteer with B The Change. My skill / availability is: ')}" target="_blank" rel="noopener" class="program-card program-card--withfoot">
          <div class="pc-num"><strong style="color: var(--accent);">02</strong> · VOLUNTEER</div>
          <h3>Bring a skill we <em style="font-family: var(--font-serif); font-style: italic; color: var(--accent);">actually</em> need.</h3>
          <p>We don't run "feel-good" volunteering. We need teachers, accountants, doctors, advocates willing to commit 4 weekends a year.</p>
          <div class="program-card-foot">
            <div class="program-card-tag">HYDERABAD · REMOTE</div>
            <div class="program-card-go">Apply →</div>
          </div>
        </a>
        <a href="${waLink('Hi, I would like to walk a B The Change program end-to-end. Background: ')}" target="_blank" rel="noopener" class="program-card program-card--withfoot">
          <div class="pc-num"><strong style="color: var(--accent);">03</strong> · BUILD WITH US</div>
          <h3>Walk a program <em style="font-family: var(--font-serif); font-style: italic; color: var(--accent);">end-to-end</em> with us.</h3>
          <p>For impact-led founders, lawyers, journalists, and grassroots leaders. Reach out on WhatsApp, we'll set up a call within 48 hours.</p>
          <div class="program-card-foot">
            <div class="program-card-tag">${ORG.whatsappDisplay}</div>
            <div class="program-card-go">Reach out →</div>
          </div>
        </a>
      </div>
    </div>
  </section>

  <section class="final-cta" id="partner">
    <div class="wrap">
      <div class="final-grid">
        <div data-reveal>
          <div class="mono">PARTNER WITH US · CSR · 80G · 12A · CSR-1</div>
          <h2>Power <em>what</em> truly matters.</h2>
        </div>
        <div data-reveal style="--d: 200ms">
          <div class="final-amounts">
            <a href="${waLink('Hi, I want to partner with B The Change as a Community Partner (₹1,00,000).')}" target="_blank" rel="noopener" class="amt-btn"><span class="a">₹1,00,000</span><span class="b">COMMUNITY PARTNER</span></a>
            <a href="${waLink('Hi, I want to partner with B The Change as an Impact Partner (₹2,00,000).')}" target="_blank" rel="noopener" class="amt-btn"><span class="a">₹2,00,000</span><span class="b">IMPACT PARTNER</span></a>
            <a href="${waLink('Hi, I want to partner with B The Change as a Premier Partner (₹3,50,000).')}" target="_blank" rel="noopener" class="amt-btn"><span class="a">₹3,50,000</span><span class="b">PREMIER PARTNER</span></a>
            <a href="${waLink('Hi, I want to partner with B The Change as a Legacy Patron (₹5,00,000).')}" target="_blank" rel="noopener" class="amt-btn"><span class="a">₹5,00,000</span><span class="b">LEGACY PATRON</span></a>
            <a href="${waLink('Hi, I want to partner with B The Change Welfare Society.')}" target="_blank" rel="noopener" class="amt-btn amt-btn--primary">Become a partner <span class="arrow">→</span></a>
          </div>
          <div class="final-foot">${ORG.bank.name.toUpperCase()} · DIRECT TRANSFER · QUARTERLY IMPACT REPORT</div>
        </div>
      </div>
    </div>
  </section>

</main>

${footer('')}
${authModal}
${scripts}`;

// PROGRAM DETAIL PAGE --------------------------------------------------------

const programPage = (p, idx) => {
  const others = PROGRAMS.filter((_, i) => i !== idx).slice(0, 3);
  return `${head({ title: `${p.name}, B The Change`, desc: p.tagline.replace(/<[^>]+>/g, ''), css: '../assets/style.css' })}
${announcement('../')}
${header({ rel: '../', activeNav: 'programs' })}

<main id="main" style="--prog-color: ${p.color}; --prog-tint: ${p.color}14; --prog-logo-bg: ${p.logoBg};">

  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="../index.html">Home</a></li>
        <li><a href="../index.html#programs">Programs</a></li>
        <li>${p.name}</li>
      </ol>
    </nav>
  </div>

  <section class="prog-hero">
    <div class="wrap">
      <div class="prog-hero-inner">
        <div data-reveal>
          <div class="prog-hero-meta">PROGRAM · ${String(idx+1).padStart(2,'0')} OF ${PROGRAMS.length}</div>
          <h1>${p.name}</h1>
          <p class="tag">${p.tagline}</p>
          <div class="prog-hero-cta">
            <a href="${p.slug}/support.html" class="btn btn--accent btn--lg">Support this program <span class="arrow">→</span></a>
            <a href="${waLink(`Hi, I want to enroll a child in ${p.name}. Child age: __ . City: __ . Parent name: __ .`)}" target="_blank" rel="noopener" class="btn btn--ink btn--lg">Enroll a child <span class="arrow">→</span></a>
            <a href="${waLink(`Hi, I want to volunteer specifically for ${p.name}. My skill: __ . Availability: __ .`)}" target="_blank" rel="noopener" class="btn btn--secondary btn--lg">Volunteer for this</a>
            <a href="../index.html#programs" class="btn btn--ghost btn--lg">All programs</a>
          </div>
        </div>
        <div class="prog-logo${p.logoImg ? ' prog-logo--image' : ''}" data-reveal style="--d: 200ms" aria-hidden="true">
          ${p.logoImg
            ? `<img src="../${p.logoImg}" alt="${p.name} logo" />`
            : `<div class="prog-logo-mark">${iconSvg(p.icon, 96)}</div>
          <div class="prog-logo-name">${p.name.toUpperCase()}</div>`}
        </div>
      </div>
    </div>
  </section>

  <div class="wrap">
    <div class="prog-stats" data-reveal>
      ${p.stats.map((s, i) => `<div><div class="prog-stat-num${i===0?' color':''}">${s.num}</div><div class="prog-stat-lbl">${s.label}</div></div>`).join('')}
    </div>
  </div>

  <section class="prog-body">
    <div class="wrap">

      <div class="prog-body-section prog-body-grid" data-reveal>
        <div class="label-col">OBJECTIVE</div>
        <div>
          <h2>What we set <em>out</em> to do.</h2>
          <p style="font-size: 18px;">${p.objective}</p>
        </div>
      </div>

      <div class="prog-body-section prog-body-grid" data-reveal>
        <div class="label-col">CONTEXT</div>
        <div>
          <h2>Why <em>now</em>.</h2>
          <p>${p.context}</p>
        </div>
      </div>

      <div class="prog-body-section prog-body-grid" data-reveal>
        <div class="label-col">KEY ACTIVITIES</div>
        <div>
          <h2>What we <em>actually</em> do.</h2>
          <ol class="activities-list">
            ${p.activities.map(a => `<li>${a}</li>`).join('')}
          </ol>
        </div>
      </div>

      <div class="prog-body-section prog-body-grid" data-reveal>
        <div class="label-col">IMPACT</div>
        <div>
          <h2>The <em>result</em>.</h2>
          <p style="font-size: 18px;">${p.impact}</p>
          <blockquote class="prog-quote">
            <p>"${p.quote}"</p>
            <cite>${p.quoteBy}</cite>
          </blockquote>
        </div>
      </div>

      <div class="prog-body-section prog-body-grid" data-reveal>
        <div class="label-col">FROM THE FIELD</div>
        <div>
          <h2>What it <em>looks</em> like.</h2>
          ${p.gallery && p.gallery.length ? `
          <div class="prog-gallery prog-gallery--photos">
            ${p.gallery.map((g, gi) => `
            <figure class="gal-item${gi === 0 ? ' gal-item--full' : ''}">
              <div class="gal-img"><img src="../${g.src}" alt="${g.caption.replace(/"/g, '&quot;')}" loading="lazy" /></div>
              <figcaption>
                <span class="gal-meta">${g.meta}</span>
                <span class="gal-caption">${g.caption}</span>
              </figcaption>
            </figure>`).join('')}
          </div>
          ` : `
          <div class="prog-gallery">
            <div><span class="gal-cap">PHOTO · ${p.name.toUpperCase()} · 01</span></div>
            <div><span class="gal-cap">PHOTO · 02</span></div>
            <div><span class="gal-cap">PHOTO · 03</span></div>
            <div><span class="gal-cap">PHOTO · 04</span></div>
            <div><span class="gal-cap">PHOTO · 05</span></div>
          </div>
          `}
        </div>
      </div>

    </div>
  </section>

  <section class="prog-support-cta">
    <div class="wrap">
      <div class="prog-support-cta-inner">
        <div data-reveal>
          <div class="mono">CSR PARTNERSHIPS · 80G · 12A · CSR-1</div>
          <h2>Power this <em>specific</em> program.</h2>
        </div>
        <div class="prog-support-cta-side" data-reveal style="--d: 200ms">
          <a href="${p.slug}/support.html" class="btn btn--accent btn--lg btn--block">View partnership tiers <span class="arrow">→</span></a>
          <a href="${waLink(`Hi, I want to know more about the ${p.name} program at B The Change.`)}" target="_blank" rel="noopener" class="btn btn--secondary btn--lg btn--block" style="background: transparent; color: var(--paper); border-color: rgba(255,255,255,.3);">Reach out on WhatsApp</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">EXPLORE MORE</span></div>
        <h2>Other <em>fronts</em> of the work.</h2>
      </div>
      <div class="related-programs">
        ${others.map((o, i) => `
        <a href="${o.slug}.html" class="program-card" data-reveal style="--d: ${i * 100}ms; --card-color: ${o.color}; --card-bg: ${o.logoBg}; --card-tint: ${o.color}1A;">
          <div class="pc-num">
            <span><strong>${o.name.split(' ')[0].toUpperCase()}</strong></span>
            <span class="pc-num-arr">→</span>
          </div>
          <div class="pc-icon${o.logoImg ? ' pc-icon--image' : ''}">${o.logoImg ? `<img src="../${o.logoImg}" alt="${o.name} logo" />` : iconSvg(o.icon, 22)}</div>
          <h3>${o.name}</h3>
          <p>${o.tagline}</p>
        </a>`).join('')}
      </div>
    </div>
  </section>

  <!-- RECENT WORK, fetched from Supabase, populated client-side -->
  <section class="section recent-work" id="recent-work">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">RECENT WORK · ON THE GROUND</span></div>
        <h2>What's <em>actually</em> happening.</h2>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: 16px; color: var(--ink-3); max-width: 50ch;">
          Photos and stories from volunteers, teachers, and the kids themselves. <a href="../submit.html" style="color: var(--accent); border-bottom: 1px solid var(--accent);">Share yours →</a>
        </p>
      </div>

      <div id="recent-work-grid" class="recent-work-grid">
        <p style="color: var(--ink-3); padding: 40px 0; text-align: center; grid-column: 1/-1;">Loading recent updates...</p>
      </div>
    </div>
  </section>

  <!-- SHARE BAR -->
  <section class="share-bar" aria-label="Share this program">
    <div class="wrap">
      <div class="share-inner">
        <span class="share-label"><span class="mono accent">SHARE THIS PROGRAM</span></span>
        <div class="share-actions">
          <a href="https://wa.me/?text=${encodeURIComponent(p.name + ' from B The Change Welfare Society. ' + p.tagline.replace(/<[^>]+>/g, '') + ' — read more: ')}https%3A%2F%2Fbthechange.in%2Fprograms%2F${p.slug}.html" target="_blank" rel="noopener" class="share-btn share-btn--wa" aria-label="Share on WhatsApp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
            <span>WhatsApp</span>
          </a>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(p.name + ': ' + p.tagline.replace(/<[^>]+>/g, ''))}&url=${encodeURIComponent('https://bthechange.in/programs/' + p.slug + '.html')}" target="_blank" rel="noopener" class="share-btn share-btn--x" aria-label="Share on X">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>X</span>
          </a>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://bthechange.in/programs/' + p.slug + '.html')}" target="_blank" rel="noopener" class="share-btn share-btn--li" aria-label="Share on LinkedIn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            <span>LinkedIn</span>
          </a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://bthechange.in/programs/' + p.slug + '.html')}" target="_blank" rel="noopener" class="share-btn share-btn--fb" aria-label="Share on Facebook">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span>Facebook</span>
          </a>
          <button class="share-btn share-btn--copy" data-copy-url="https://bthechange.in/programs/${p.slug}.html" aria-label="Copy link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span class="share-copy-text">Copy link</span>
          </button>
          <a class="share-btn share-btn--ig" href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Open Instagram (then paste link)" title="Instagram doesn't support direct share — copy the link, then paste into your IG story or post.">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg>
            <span>Instagram</span>
          </a>
        </div>
      </div>
    </div>
  </section>

</main>

${footer('../')}
${authModal}
${scripts}

<script>
(async function() {
  const SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
  const grid = document.getElementById('recent-work-grid');
  const { data, error } = await SB.from('submissions')
    .select('id, submitter_name, submitter_role, event_name, event_date, story_text, image_url, created_at')
    .eq('status', 'approved')
    .eq('program_slug', '${p.slug}')
    .order('created_at', { ascending: false })
    .limit(9);

  if (error) {
    grid.innerHTML = '<p style="color: var(--ink-3); padding: 24px 0; text-align: center; grid-column: 1/-1;">Could not load updates.</p>';
    return;
  }
  if (!data.length) {
    grid.innerHTML = '<div style="grid-column: 1/-1; padding: 40px 24px; text-align: center; background: var(--paper-2); border-radius: 16px;"><p style="font-family: var(--font-serif); font-style: italic; font-size: 18px; color: var(--ink-3); margin: 0 0 14px;">No updates posted yet for this program.</p><a href="../submit.html" class="btn btn--accent">Be the first to share →</a></div>';
    return;
  }
  grid.innerHTML = data.map(s => {
    const d = s.event_date ? new Date(s.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const eventLine = s.event_name ? esc(s.event_name) + ' · ' + d : d;
    const img = s.image_url ? '<div class="rw-img"><img src="' + s.image_url + '" alt="Photo by ' + esc(s.submitter_name || 'a contributor') + ' from ' + esc(s.event_name || s.program_slug) + '" loading="lazy" /></div>' : '';
    const isPhotoOnly = (s.story_text || '').startsWith('[PROGRAM PHOTO]');
    const displayText = isPhotoOnly ? (s.story_text || '').replace('[PROGRAM PHOTO] ', '') : s.story_text;
    return '<article class="rw-card">' + img +
      '<div class="rw-body"><div class="rw-meta"><span class="mono accent">' + (isPhotoOnly ? 'PHOTO · ' : '') + (s.submitter_role || 'CONTRIBUTOR').toUpperCase() + ' · ' + esc(s.submitter_name) + '</span></div>' +
      '<div class="rw-event">' + eventLine + '</div>' +
      (displayText ? '<p>' + esc(displayText).replace(/\\n/g, '<br>') + '</p>' : '') + '</div></article>';
  }).join('');
  function esc(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();

// Copy-link button
document.querySelectorAll('[data-copy-url]').forEach(btn => {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copyUrl);
      const txt = btn.querySelector('.share-copy-text');
      const original = txt.textContent;
      txt.textContent = 'Copied!';
      setTimeout(() => { txt.textContent = original; }, 1800);
    } catch (e) { alert('Copy failed: ' + btn.dataset.copyUrl); }
  });
});
</script>`;
};

// SUPPORT PAGE (the "page on that page") -------------------------------------

const supportPage = (p, idx) => {
  return `${head({ title: `Support ${p.name}, Partnership Tiers`, desc: `Partner with B The Change to power ${p.name}. Four tiers from ₹1,00,000 to ₹5,00,000. 80G · 12A · CSR-1 compliant.`, css: '../../assets/style.css' })}
${announcement('../../')}
${header({ rel: '../../', activeNav: 'programs' })}

<main id="main" style="--prog-color: ${p.color}; --prog-tint: ${p.color}14;">

  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="../../index.html">Home</a></li>
        <li><a href="../../index.html#programs">Programs</a></li>
        <li><a href="../${p.slug}.html">${p.name}</a></li>
        <li>Support</li>
      </ol>
    </nav>
  </div>

  <section class="support-hero">
    <div class="wrap">
      <div class="kicker"><span class="mono accent">PARTNER WITH ${p.name.toUpperCase()}</span></div>
      <h1 data-reveal>Real impact <em>needs</em> ownership.</h1>
      <p class="lede" data-reveal style="--d: 100ms">
        At B The Change, we don't position you as a donor. We position you as a partner who powers and owns real, measurable impact in <strong style="color: var(--prog-color); font-style: normal; font-family: var(--font-sans); font-weight: 600;">${p.name}</strong>.
      </p>
    </div>
  </section>

  <div class="wrap">
    <div class="tiers">
      ${TIERS.map((t, i) => `
      <article class="tier ${i === 0 ? 'is-featured' : ''}" data-reveal style="--d: ${i * 100}ms">
        <div class="tier-tag-strip">
          <span>TIER ${String(i+1).padStart(2,'0')}</span>
          <span>${i === 0 ? 'MOST IMPACT' : i === 3 ? 'ENTRY' : ''}</span>
        </div>
        <div class="tier-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${TIER_ICONS[t.icon]}</svg></div>
        <div class="tier-tag">Tier ${String(i+1).padStart(2,'0')}</div>
        <h3>${t.name}</h3>
        <div class="tier-amt"><span class="currency">₹</span>${t.amt}</div>
        <p class="tier-tagline">${t.tagline}</p>
        <ul class="tier-perks">
          <li>1-year brand visibility across campaigns &amp; outreach</li>
          <li>Brand presence on materials and operational vehicles</li>
          <li>Direct association with real, on-ground impact in ${p.name}</li>
          <li>Recognition on the official website as a partner</li>
          <li>Strong CSR positioning and credibility</li>
          ${i < 2 ? '<li>Quarterly impact reports + on-ground site visits</li>' : ''}
          ${i === 0 ? '<li>Naming rights on a flagship initiative</li><li>Direct access to the founding team</li>' : ''}
        </ul>
        <div class="tier-foot">
          <a href="${waLink(`Hi, I would like to become a ${t.name} (${t.amt}) for the ${p.name} program at B The Change.`)}" target="_blank" rel="noopener" class="btn ${i === 0 ? 'btn--accent' : 'btn--ink'} btn--block">Become ${t.name} <span class="arrow">→</span></a>
        </div>
      </article>`).join('')}
    </div>
  </div>

  <section class="trust-strip">
    <div class="wrap">
      <div class="trust-strip-grid">
        <div data-reveal>
          <div class="kicker"><span class="mono accent">FULLY COMPLIANT</span></div>
          <h3>Every rupee, <em>traceable</em>.</h3>
          <p>Registered NGO with NITI Aayog (Darpan ID ${ORG.darpanId}). All donations 80G eligible. CSR-1 registered. Audited financials published annually. Technology partner: ${ORG.techPartner}.</p>
        </div>
        <div class="trust-pills" data-reveal style="--d: 100ms">
          <span class="trust-pill"><span class="dot"></span>80G</span>
          <span class="trust-pill"><span class="dot"></span>12A</span>
          <span class="trust-pill"><span class="dot"></span>CSR-1</span>
          <span class="trust-pill"><span class="dot"></span>NITI AAYOG</span>
          <span class="trust-pill"><span class="dot"></span>${ORG.techPartner.toUpperCase()}</span>
        </div>
        <div class="bank-card" data-reveal style="--d: 200ms">
          <div class="mono dim">DIRECT BANK TRANSFER</div>
          <div><strong>${ORG.bank.name}</strong> · ${ORG.bank.branch}</div>
          <div>A/C ${ORG.bank.acc}</div>
          <div>IFSC ${ORG.bank.ifsc}</div>
          <div style="margin-top: 6px; font-size: 11px;">B The Change Welfare Society</div>
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line);">
            <div class="mono dim" style="margin-bottom: 4px;">REGISTERED OFFICE</div>
            <a href="${ORG.mapUrl}" target="_blank" rel="noopener" style="font-size: 12px; line-height: 1.5; color: var(--ink-2); display: block;">${ORG.address} <span style="color: var(--accent);">↗</span></a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" style="text-align: center;">
    <div class="wrap" style="max-width: 640px;">
      <div data-reveal>
        <div class="kicker" style="justify-content: center;"><span class="mono accent">QUESTIONS?</span></div>
        <h2 style="text-align: center; margin: 0 auto 18px;">Talk to <em>us</em>.</h2>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: 18px; color: var(--ink-3); max-width: 44ch; margin: 0 auto 28px;">
          We respond within 24 hours. CSR teams welcome. Founders, decision-makers, anyone serious about impact.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <a href="${waLink(`Hi, I have a question about partnering with B The Change for ${p.name}.`, ORG.whatsapp)}" target="_blank" rel="noopener" class="btn btn--accent btn--lg">WhatsApp · ${ORG.whatsappDisplay} <span class="arrow">→</span></a>
          <a href="mailto:${ORG.email}" class="btn btn--secondary btn--lg">${ORG.email}</a>
        </div>
      </div>
    </div>
  </section>

</main>

${footer('../../')}
${authModal}
${scripts}`;
};

// ABOUT PAGE, the team, methodology, recognition --------------------------

const aboutPage = () => `${head({ title: 'About, B The Change Welfare Society', desc: 'Meet the team and the methodology behind two decades of grassroots social change. Founder, programs, recognition, partnerships.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: 'about' })}

<main id="main">

  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="index.html">Home</a></li>
        <li>About &amp; Team</li>
      </ol>
    </nav>
  </div>

  <!-- HERO -->
  <section class="hero" style="padding: clamp(14px, 2vw, 26px) 0 clamp(16px, 2vw, 28px); border-bottom: 1px solid var(--line);">
    <div class="wrap">
      <div data-reveal style="max-width: 64ch;">
        <div class="hero-eyebrow">THE TEAM · ${ORG.founded}-2026 · ${new Date().getFullYear() - ORG.founded} YEARS</div>
        <h1 class="hero-h1" style="white-space: normal; font-size: clamp(40px, 6.5vw, 88px); letter-spacing: -2.5px; line-height: 1.0;">
          The people who <span class="be">don't</span> wait.
        </h1>
        <p class="hero-lede" style="margin-top: 18px;">
          ${PROGRAMS.length} programs. ${ORG.founded === 2006 ? '20' : new Date().getFullYear() - ORG.founded} years. One unbroken thread, show up, stay, deliver. This is the team and the methodology behind it.
        </p>
      </div>
    </div>
  </section>

  <!-- LEADERSHIP CAROUSEL -->
  <section class="section" id="leadership">
    <div class="wrap">
      <div class="leader-head" data-reveal>
        <div class="kicker"><span class="mono accent">LEADERSHIP</span></div>
        <div class="leader-head-row">
          <h2 style="margin: 0;">The people who don't <em>wait.</em></h2>
          <div class="leader-controls" aria-label="Carousel navigation">
            <button class="leader-btn" id="leader-prev" aria-label="Previous leader" disabled>←</button>
            <span class="leader-count"><span id="leader-current">1</span> / ${TEAM.length}</span>
            <button class="leader-btn" id="leader-next" aria-label="Next leader"${TEAM.length > 1 ? '' : ' disabled'}>→</button>
          </div>
        </div>
      </div>

      <div class="leader-carousel">
        <div class="leader-track" id="leader-track">
          ${TEAM.map((t, i) => `
          <article class="leader-slide" data-slide="${i}" aria-label="${t.name}, ${t.role}">
            <div class="foundation-grid">
              <figure class="photo-slot photo-slot--image" style="background-image: url('${t.image}');">
                <span class="photo-mark">B THE CHANGE WELFARE SOCIETY</span>
                <p class="photo-cap-name">${t.role}</p>
              </figure>
              <div class="foundation-text">
                <div class="kicker"><span class="mono accent">${t.kicker}</span></div>
                <h2>${t.headline}</h2>
                ${t.bio.map(p => `<p>${p}</p>`).join('\n                ')}
                <blockquote class="quote">
                  <p>${t.quote}</p>
                  <cite>${t.quoteBy}</cite>
                </blockquote>
                <div style="margin-top: 24px; display: flex; gap: 8px; flex-wrap: wrap;">
                  ${t.pills.map(p => `<span class="trust-pill"><span class="dot"></span>${p}</span>`).join('\n                  ')}
                </div>
              </div>
            </div>
          </article>`).join('')}
        </div>
      </div>

      <div class="leader-dots" role="tablist" aria-label="Leader slides">
        ${TEAM.map((t, i) => `<button class="leader-dot${i === 0 ? ' is-active' : ''}" data-go="${i}" aria-label="Show ${t.shortName}"></button>`).join('')}
      </div>

      <p style="margin-top: 24px; text-align: center; font-size: 13px; color: var(--mute); font-family: var(--font-mono); letter-spacing: 1.4px; text-transform: uppercase;">
        See the full team → <a href="team.html" style="color: var(--accent); border-bottom: 1px solid var(--accent);">Meet everyone</a>
      </p>
    </div>
  </section>

  <!-- MOMENTS GALLERY -->
  <section class="section muted">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">MOMENTS · FROM THE FIELD</span></div>
        <h2>Twenty years, <em>captured</em>.</h2>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: 18px; color: var(--ink-3); max-width: 50ch; margin: 0;">
          Inaugurations. Awards. Classrooms. Campaigns. A small selection of the work and the recognition it has earned along the way.
        </p>
      </div>

      <div class="moments-grid">
        <figure class="gal-item gal-item--full" data-reveal>
          <div class="gal-img"><img src="assets/world-record-cert.jpg" alt="Sri Ram Kalyan Challa receives the Certificate of World Record for the World's First Organ Donation on Wheels." loading="lazy" /></div>
          <figcaption>
            <span class="gal-meta">VISWAGURU WORLD RECORD · WORLD'S FIRST</span>
            <span class="gal-caption">Sri Ram Kalyan Challa receives the Certificate of World Record from Viswaguru, recognising B The Change Welfare Society for the world's first <em>"Organ Donation on Wheels"</em> initiative, active since May 2016 with 1,27,000+ signed-up donors.</span>
          </figcaption>
        </figure>

        <figure class="gal-item gal-item--wide" data-reveal style="--d: 100ms">
          <div class="gal-img"><img src="assets/award-ceremony.jpg" alt="B The Change at the Viswaguru World Records award ceremony." loading="lazy" /></div>
          <figcaption>
            <span class="gal-meta">AWARD CEREMONY · HYDERABAD</span>
            <span class="gal-caption">National recognition at the Viswaguru World Records ceremony, alongside other awardees from across India.</span>
          </figcaption>
        </figure>

        <figure class="gal-item" data-reveal style="--d: 200ms">
          <div class="gal-img"><img src="assets/ktr-inauguration.jpg" alt="KT Rama Rao inaugurating Organ Donation vehicle" loading="lazy" /></div>
          <figcaption>
            <span class="gal-meta">INAUGURATION · KTR</span>
            <span class="gal-caption">Ex-IT Minister of Telangana, Shri K. T. Rama Rao, inaugurating the Organ Donation vehicle.</span>
          </figcaption>
        </figure>

        <figure class="gal-item" data-reveal>
          <div class="gal-img"><img src="assets/od-vehicle-side.jpg" alt="MP Konda Vishweshwar Reddy launching the Organ Donation poster" loading="lazy" /></div>
          <figcaption>
            <span class="gal-meta">POSTER LAUNCH · MP KVR</span>
            <span class="gal-caption">MP Konda Vishweshwar Reddy launching the poster, "Be a Hero. Become an Organ Donor."</span>
          </figcaption>
        </figure>

        <figure class="gal-item" data-reveal style="--d: 100ms">
          <div class="gal-img"><img src="assets/od-vehicle-rear.jpg" alt="B The Change campaign vehicle" loading="lazy" /></div>
          <figcaption>
            <span class="gal-meta">"LIFE IS A GIFT, PASS IT ON"</span>
            <span class="gal-caption">The campaign vehicle in everyday Hyderabad streets, to register as a donor, citizens call directly.</span>
          </figcaption>
        </figure>

        <figure class="gal-item gal-item--wide" data-reveal style="--d: 200ms">
          <div class="gal-img"><img src="assets/medical-students.jpg" alt="Medical students at the Department of Anatomy" loading="lazy" /></div>
          <figcaption>
            <span class="gal-meta">DEPARTMENT OF ANATOMY · OUTREACH</span>
            <span class="gal-caption">Awareness session with medical students at a Department of Anatomy, the next generation of doctors learning what their signatures on a donor card can mean.</span>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>

  <!-- HOW WE WORK -->
  <section class="section muted" id="methodology">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">METHODOLOGY</span></div>
        <h2>How we <em>actually</em> work.</h2>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: 18px; color: var(--ink-3); max-width: 50ch; margin: 0;">
          Five principles, refined across ${new Date().getFullYear() - ORG.founded} years and ${PROGRAMS.length} programs. Not a pitch deck. The actual operating manual.
        </p>
      </div>
      <ol class="activities-list" style="--prog-color: var(--accent);">
        <li><strong>Local before national.</strong> Every program is run by people who live in the community it serves. We don't fly teams in. We hire from the village, the slum, the school.</li>
        <li><strong>Show up for ten years.</strong> Real change is intergenerational. We commit to communities for a minimum decade, even when funding cycles say otherwise.</li>
        <li><strong>Measure what matters.</strong> Not vanity metrics. Did the child finish school? Did the mother pay rent six months in a row? Did the case get filed? That's our scorecard.</li>
        <li><strong>One donor, one impact line.</strong> If you fund a Coding on Wheels classroom, you get the names of the children, the school, the laptop count, and the term-end results. Direct. Unfiltered.</li>
        <li><strong>Refuse what doesn't fit.</strong> We say no to grants that come with strings that compromise the work. That's why our growth has been slower than peers, and our retention has been higher.</li>
      </ol>
    </div>
  </section>

  <!-- RECOGNITION -->
  <section class="section dark" id="recognition">
    <div class="wrap">
      <div class="impact-head" data-reveal>
        <div class="kicker"><span class="mono accent">RECOGNITION &amp; COMPLIANCE</span></div>
        <h2>Every rupee, <em>traceable</em>.</h2>
      </div>
      <div class="impact-grid">
        <div class="impact-cell" data-reveal>
          <div class="impact-num">80G</div>
          <div class="impact-lbl">CERTIFIED</div>
          <div class="impact-cap">100% tax exemption for donors under Section 80G of the Income Tax Act.</div>
        </div>
        <div class="impact-cell" data-reveal style="--d: 100ms">
          <div class="impact-num">12A</div>
          <div class="impact-lbl">REGISTERED</div>
          <div class="impact-cap">Income Tax registration confirming non-profit status.</div>
        </div>
        <div class="impact-cell" data-reveal style="--d: 200ms">
          <div class="impact-num">CSR-1</div>
          <div class="impact-lbl">COMPLIANT</div>
          <div class="impact-cap">Eligible for Corporate Social Responsibility funding under Sec 135.</div>
        </div>
        <div class="impact-cell" data-reveal style="--d: 300ms">
          <div class="impact-num" style="font-size: clamp(22px, 2.5vw, 36px); line-height: 1.1;">NITI AAYOG</div>
          <div class="impact-lbl">DARPAN ID</div>
          <div class="impact-cap" style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 1px;">${ORG.darpanId}</div>
        </div>
      </div>

      <div style="margin-top: 40px; padding-top: 28px; border-top: 1px solid rgba(30, 58, 111, 0.18);">
        <div data-reveal style="max-width: 56ch;">
          <div class="mono dim" style="margin-bottom: 12px;">TECHNOLOGY PARTNER</div>
          <h3 style="font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: clamp(28px, 4vw, 48px); margin: 0; color: var(--ink); letter-spacing: -1px;">${ORG.techPartner}</h3>
          <p style="color: var(--ink-3); font-size: 14px; margin: 14px 0 0;">
            Microsoft powers our data infrastructure, donor management, and the Coding on Wheels curriculum platform.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- BANK / DIRECT TRANSFER -->
  <section class="trust-strip">
    <div class="wrap">
      <div class="trust-strip-grid" style="--prog-color: var(--accent); --prog-tint: var(--accent-soft);">
        <div data-reveal>
          <div class="kicker"><span class="mono accent">DIRECT BANK TRANSFER</span></div>
          <h3>For institutional donors and CSR teams.</h3>
          <p>Wire transfers, RTGS, and NEFT all welcome. 80G receipt issued within 24 hours. For invoices and acknowledgement letters, email <a href="mailto:${ORG.email}" style="color: var(--accent); border-bottom: 1px solid var(--accent);">${ORG.email}</a>.</p>
        </div>
        <div class="trust-pills" data-reveal style="--d: 100ms">
          <span class="trust-pill"><span class="dot"></span>RTGS</span>
          <span class="trust-pill"><span class="dot"></span>NEFT</span>
          <span class="trust-pill"><span class="dot"></span>CHEQUE</span>
        </div>
        <div class="bank-card" data-reveal style="--d: 200ms">
          <div class="mono dim">ACCOUNT DETAILS</div>
          <div><strong>${ORG.bank.name}</strong> · ${ORG.bank.branch}</div>
          <div>A/C ${ORG.bank.acc}</div>
          <div>IFSC ${ORG.bank.ifsc}</div>
          <div style="margin-top: 6px; font-size: 11px;">B The Change Welfare Society</div>
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line);">
            <div class="mono dim" style="margin-bottom: 4px;">REGISTERED OFFICE</div>
            <a href="${ORG.mapUrl}" target="_blank" rel="noopener" style="font-size: 12px; line-height: 1.5; color: var(--ink-2); display: block;">${ORG.address} <span style="color: var(--accent);">↗</span></a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="final-cta">
    <div class="wrap">
      <div class="final-grid">
        <div data-reveal>
          <div class="mono">JOIN THE TEAM</div>
          <h2>Show up. <em>Stay.</em> Deliver.</h2>
        </div>
        <div data-reveal style="--d: 200ms">
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="${waLink('Hi, I want to partner with B The Change Welfare Society.')}" target="_blank" rel="noopener" class="amt-btn amt-btn--primary">Become a partner <span class="arrow">→</span></a>
            <a href="${waLink('Hi, I want to volunteer with B The Change. Skill / availability:')}" target="_blank" rel="noopener" class="amt-btn"><span class="a">Volunteer</span><span class="b">SKILLS · NOT JUST TIME</span></a>
            <a href="${waLink('Hi, I would like to talk to B The Change.')}" target="_blank" rel="noopener" class="amt-btn"><span class="a">Talk to us</span><span class="b">WhatsApp ${ORG.whatsappDisplay}</span></a>
          </div>
          <div class="final-foot">RESPONSE WITHIN 24 HOURS · WHATSAPP ${ORG.whatsappDisplay}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- BOARD OF TRUSTEES -->
  <section class="section" id="board">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">GOVERNANCE · BOARD OF TRUSTEES</span></div>
        <h2>The people who <em>sign</em> for the work.</h2>
        <p style="font-family:var(--font-serif); font-style:italic; font-size:18px; color:var(--ink-3); max-width:52ch; margin:0;">
          Statutory trustees on record with the Registrar of Societies, Telangana. Accountable for every rupee, every program, every report.
        </p>
      </div>
      <div class="board-grid" data-reveal>
        <article class="board-card">
          <div class="board-role">FOUNDER · CHAIRPERSON</div>
          <h3>Sri Ram Kalyan Challa</h3>
          <p>Founded B The Change in ${ORG.founded}. Lawyer (Osmania), 20 years of grassroots program design across eleven fronts.</p>
        </article>
        <article class="board-card">
          <div class="board-role">WORKING PRESIDENT</div>
          <h3>Rohan Rajkulkarni</h3>
          <p>UK Solicitor (SRA registered). MBA, IIM Kozhikode. Operations, governance, and CSR partnership lead.</p>
        </article>
        <article class="board-card">
          <div class="board-role">TRUSTEE · TREASURER</div>
          <h3>To be appointed</h3>
          <p>Position open. Qualified CA / CS preferred. Required to co-sign all disbursements above ₹50,000.</p>
        </article>
        <article class="board-card">
          <div class="board-role">TRUSTEE · SECRETARY</div>
          <h3>To be appointed</h3>
          <p>Position open. Statutory minute-taking, annual filings, AGM coordination.</p>
        </article>
      </div>
      <p style="font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.6px; color: var(--mute); margin-top: 18px;">
        REG NO ${ORG.regNo} · 80G · 12A · CSR-1 · NITI AAYOG ${ORG.darpanId}
      </p>
    </div>
  </section>

  <!-- PARTNERS / DONOR LOGOS -->
  <section class="section muted" id="partners">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">SUPPORTERS · PAST &amp; PRESENT</span></div>
        <h2>Trusted by <em>those</em> who looked closely.</h2>
      </div>
      <div class="partners-grid" data-reveal>
        <div class="partner-tile"><span class="partner-name">Government of Telangana</span><span class="partner-meta">Permission, Hyderabad operations</span></div>
        <div class="partner-tile"><span class="partner-name">IIM Kozhikode Alumni Network</span><span class="partner-meta">Distribution &amp; mentoring</span></div>
        <div class="partner-tile"><span class="partner-name">Local Healthcare Partners</span><span class="partner-meta">Organ donation drives</span></div>
        <div class="partner-tile"><span class="partner-name">Volunteer Doctors &amp; Lawyers</span><span class="partner-meta">Free legal &amp; medical aid</span></div>
        <div class="partner-tile partner-tile--cta">
          <span class="partner-name">Your logo here</span>
          <a href="${waLink('Hi, I represent a company interested in partnering with B The Change for CSR.')}" target="_blank" rel="noopener" class="partner-link">Become a CSR partner →</a>
        </div>
      </div>
      <p style="font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.6px; color: var(--mute); margin-top: 20px;">
        Logos and partner names are added with written permission. Some partners contribute privately and prefer not to be listed.
      </p>
    </div>
  </section>

  <!-- FINANCIAL TRANSPARENCY -->
  <section class="section" id="transparency">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">TRANSPARENCY · ANNUAL REPORTS</span></div>
        <h2>Open books. <em>Always.</em></h2>
        <p style="font-family:var(--font-serif); font-style:italic; font-size:18px; color:var(--ink-3); max-width:52ch; margin:0;">
          Annual reports, audited financials, and impact data published every year. Download below or write to us for the original signed copies.
        </p>
      </div>
      <div class="reports-grid" data-reveal>
        <a href="assets/reports/btc-annual-report-2024.pdf" target="_blank" rel="noopener" class="report-card">
          <div class="report-year">2024</div>
          <div class="report-meta">ANNUAL REPORT</div>
          <div class="report-title">Twenty years on the ground.</div>
          <div class="report-cta">Download PDF →</div>
        </a>
        <a href="${waLink('Hi, please share the audited financial statements for FY2023-24.')}" target="_blank" rel="noopener" class="report-card report-card--request">
          <div class="report-year">FY24</div>
          <div class="report-meta">AUDITED FINANCIALS</div>
          <div class="report-title">Available on request.</div>
          <div class="report-cta">Request via WhatsApp →</div>
        </a>
        <a href="${waLink('Hi, please share the FCRA compliance status of B The Change Welfare Society.')}" target="_blank" rel="noopener" class="report-card report-card--request">
          <div class="report-year">FCRA</div>
          <div class="report-meta">FOREIGN CONTRIBUTION</div>
          <div class="report-title">Status &amp; compliance.</div>
          <div class="report-cta">Request status →</div>
        </a>
      </div>
    </div>
  </section>

</main>

${footer('')}
${authModal}
${scripts}`;

// TEAM PAGE -----------------------------------------------------------------

const teamPage = () => `${head({ title: 'Team, B The Change Welfare Society', desc: 'Meet the people behind eleven programs across India and the UK. Founder, leadership, and the volunteer network that keeps it all moving.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: 'team' })}

<main id="main">

  <section class="hero" style="padding: clamp(14px, 2vw, 26px) 0 clamp(16px, 2vw, 28px); border-bottom: 1px solid var(--line);">
    <div class="wrap">
      <div data-reveal>
        <div class="kicker"><span class="mono">THE TEAM · 2006-2026 · 20 YEARS</span></div>
        <h1 class="hero-h1" style="font-size: clamp(40px, 7vw, 92px); line-height: 1; margin: 12px 0 18px;">
          The people who don't <em style="color: var(--accent);">wait.</em>
        </h1>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: clamp(16px, 1.4vw, 20px); line-height: 1.55; color: var(--ink-3); max-width: 56ch;">
          A small senior leadership team.<br />A wide volunteer network of advocates, teachers, doctors, accountants, and field coordinators.<br />Every program owned end-to-end by a named lead.
        </p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="team-grid">
        ${TEAM.map((t, i) => `
        <article class="team-member" data-reveal style="--d: ${i * 80}ms" id="${t.slug}">
          <div class="foundation-grid">
            <figure class="photo-slot photo-slot--image" style="background-image: url('${t.image}');">
              <span class="photo-mark">B THE CHANGE WELFARE SOCIETY</span>
              <p class="photo-cap-name">${t.role}</p>
            </figure>
            <div class="foundation-text">
              <div class="kicker"><span class="mono accent">${t.kicker}</span></div>
              <h2>${t.headline}</h2>
              ${t.bio.map(p => `<p>${p}</p>`).join('\n              ')}
              <blockquote class="quote">
                <p>${t.quote}</p>
                <cite>${t.quoteBy}</cite>
              </blockquote>
              <div style="margin-top: 24px; display: flex; gap: 8px; flex-wrap: wrap;">
                ${t.pills.map(p => `<span class="trust-pill"><span class="dot"></span>${p}</span>`).join('\n                ')}
              </div>
            </div>
          </div>
        </article>`).join('')}
      </div>

      <p style="margin-top: 48px; text-align: center; font-size: 13px; color: var(--mute); font-family: var(--font-mono); letter-spacing: 1.4px; text-transform: uppercase;">
        Plus a network of 100+ volunteers across India and the UK
      </p>
    </div>
  </section>

  <!-- CTA -->
  <section class="final-cta">
    <div class="wrap">
      <div class="final-grid">
        <div data-reveal>
          <div class="mono">WANT TO JOIN?</div>
          <h2>Bring a skill. <em>Stay</em> ten years.</h2>
        </div>
        <div data-reveal style="--d: 200ms">
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="${waLink('Hi, I want to volunteer with B The Change. My skill / availability is: ')}" target="_blank" rel="noopener" class="amt-btn amt-btn--primary">Volunteer with us <span class="arrow">→</span></a>
            <a href="${waLink('Hi, I want to partner with B The Change Welfare Society.')}" target="_blank" rel="noopener" class="amt-btn"><span class="a">Become a partner</span><span class="b">CSR · 80G · QUARTERLY REPORTS</span></a>
            <a href="${waLink('Hi, I would like to walk a B The Change program end-to-end. Background: ')}" target="_blank" rel="noopener" class="amt-btn"><span class="a">Build with us</span><span class="b">FOUNDERS · LAWYERS · JOURNALISTS</span></a>
          </div>
          <div class="final-foot">RESPONSE WITHIN 24 HOURS · WHATSAPP ${ORG.whatsappDisplay}</div>
        </div>
      </div>
    </div>
  </section>

</main>

${footer('')}
${authModal}
${scripts}`;

// ============================================================================
// SUBMIT PAGE — public form to submit a "recent work" story
// ============================================================================

const submitPage = () => `${head({ title: 'Share your story · B The Change Welfare Society', desc: 'Volunteers, partners, and beneficiaries — share your work, photos, and stories from B The Change programs across India and the UK.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: 'submit' })}

<main id="main">
  <section class="hero" style="padding: clamp(20px, 4vw, 40px) 0 clamp(24px, 4vw, 44px); border-bottom: 1px solid var(--line);">
    <div class="wrap">
      <div data-reveal>
        <div class="kicker"><span class="mono accent">SHARE YOUR STORY · MEMBERS ONLY</span></div>
        <h1 class="hero-h1" style="font-size: clamp(34px, 5.5vw, 72px); line-height: 1; margin: 12px 0 16px;">
          Did you do the work? <em style="color: var(--accent);">Share it.</em>
        </h1>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: clamp(15px, 1.3vw, 19px); line-height: 1.55; color: var(--ink-3); max-width: 60ch;">
          Volunteers, teachers, parents, kids, partners, anyone who lived a moment from one of our programs. Submit a photo and the story behind it. We review every submission within 48 hours. Approved stories appear on the program's page as recent work.
        </p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap" style="max-width: 720px;">
      <div id="auth-hint" class="auth-hint" style="display:none;">
        <div>
          <strong>Want to edit later?</strong> <span style="color: var(--ink-3);">Sign in first and you'll be able to edit your submission while it's pending review.</span>
        </div>
        <a href="my.html" class="btn btn--secondary" style="padding: 8px 14px; font-size: 12px;">Sign in →</a>
      </div>
      <div id="signed-in-as" class="auth-hint auth-hint--ok" style="display:none;">
        <div>
          <strong>Signed in.</strong> <span style="color: var(--ink-3);">Your submissions will show up on your <a href="my.html" style="color: var(--accent);">My submissions</a> page.</span>
        </div>
      </div>
      <form id="submit-form" class="submit-form" data-reveal>
        <div class="form-row">
          <label class="form-label">Your name <span class="req">*</span></label>
          <input type="text" name="submitter_name" required maxlength="80" placeholder="Priya Sharma" />
        </div>
        <div class="form-row form-row--2">
          <div>
            <label class="form-label">Your role <span class="req">*</span></label>
            <select name="submitter_role" required>
              <option value="">Select one</option>
              <option value="volunteer">Volunteer</option>
              <option value="admin">Admin / Staff</option>
              <option value="kid">Student / Beneficiary</option>
              <option value="beneficiary">Family / Community</option>
              <option value="partner">Partner / Donor</option>
            </select>
          </div>
          <div>
            <label class="form-label">Email or WhatsApp</label>
            <input type="text" name="submitter_contact" maxlength="120" placeholder="for follow-up only" />
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Which program? <span class="req">*</span></label>
          <select name="program_slug" required>
            <option value="">Select a program</option>
            ${PROGRAMS.map(p => `<option value="${p.slug}">${p.name.replace(', ', ': ')}</option>`).join('\n            ')}
          </select>
        </div>

        <div class="form-row form-row--2">
          <div>
            <label class="form-label">Event name (optional)</label>
            <input type="text" name="event_name" maxlength="120" placeholder="e.g. Tech Mahindra School visit" />
          </div>
          <div>
            <label class="form-label">Date (optional)</label>
            <input type="date" name="event_date" />
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Your story <span class="req">*</span></label>
          <textarea name="story_text" required maxlength="2000" rows="6" placeholder="What happened? Who was there? What did you see, hear, feel? 1-3 paragraphs is perfect."></textarea>
          <div class="form-help"><span id="char-count">0</span> / 2000 characters</div>
        </div>

        <div class="form-row">
          <label class="form-label">Upload a photo</label>
          <div class="file-drop" id="file-drop">
            <input type="file" id="image-input" name="image" accept="image/jpeg,image/png,image/webp" />
            <div class="file-drop-prompt">
              <div class="file-drop-icon">+</div>
              <div class="file-drop-text">Tap to add photo<br><span>JPG / PNG / WebP, max 5MB</span></div>
              <div class="file-drop-preview" id="file-preview"></div>
            </div>
          </div>
        </div>

        <div class="form-foot">
          <p class="form-disclaimer">
            By submitting you confirm you took or have rights to this image, and you give B The Change Welfare Society permission to publish it credited to you. Submissions are reviewed before going live.
          </p>

          <!-- hCaptcha (renders only if window.HCAPTCHA_SITE_KEY is set in supabase-config.js) -->
          <div class="h-captcha-wrap" id="hcaptcha-wrap" style="display:none;">
            <div class="h-captcha" id="hcaptcha-widget"></div>
          </div>

          <button type="submit" class="btn btn--accent btn--lg" id="submit-btn">
            <span class="btn-text">Submit for review</span>
            <span class="btn-loading" style="display:none;">Submitting...</span>
            <span class="arrow">→</span>
          </button>
        </div>

        <div id="submit-result" class="submit-result" style="display:none;"></div>
      </form>
    </div>
  </section>
</main>

${footer('')}
${authModal}
${scripts}

<script>
(function() {
  const SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
  const form = document.getElementById('submit-form');
  const fileInput = document.getElementById('image-input');
  const filePreview = document.getElementById('file-preview');
  const charCount = document.getElementById('char-count');
  const storyField = form.story_text;
  const submitBtn = document.getElementById('submit-btn');
  const result = document.getElementById('submit-result');

  // hCaptcha lazy-loader. Only activates if user has set HCAPTCHA_SITE_KEY in supabase-config.js
  let captchaWidgetId = null;
  if (window.HCAPTCHA_SITE_KEY) {
    document.getElementById('hcaptcha-wrap').style.display = 'block';
    const s = document.createElement('script');
    s.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=__hcLoaded';
    s.async = true; s.defer = true;
    window.__hcLoaded = function() {
      captchaWidgetId = window.hcaptcha.render('hcaptcha-widget', {
        sitekey: window.HCAPTCHA_SITE_KEY,
        size: 'normal',
      });
    };
    document.head.appendChild(s);
  }

  storyField.addEventListener('input', () => { charCount.textContent = storyField.value.length; });

  // AUTH GATE: only signed-in users can access submit. Redirect to home + open modal if not.
  (async () => {
    const { data: { session } } = await SB.auth.getSession();
    if (!session) {
      try { sessionStorage.setItem('btc-auth-next', 'submit.html'); } catch (_) {}
      window.location.href = 'login.html?next=submit.html';
      return;
    }
    document.getElementById('signed-in-as').style.display = 'flex';
    // Pre-fill contact with user's email if empty
    const contactEl = document.querySelector('input[name="submitter_contact"]');
    if (contactEl && !contactEl.value && session.user?.email) contactEl.value = session.user.email;
  })();

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Maximum 5MB.');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreview.innerHTML = '<img src="' + e.target.result + '" alt="Preview of selected photo" />';
      filePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // hCaptcha gate (only if configured)
    if (window.HCAPTCHA_SITE_KEY && captchaWidgetId !== null) {
      const tok = window.hcaptcha.getResponse(captchaWidgetId);
      if (!tok) {
        alert('Please complete the captcha first.');
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'inline';
    result.style.display = 'none';

    try {
      let imageUrl = null;
      const file = fileInput.files[0];
      if (file) {
        // Optional NSFW pre-check via Sightengine (only if configured)
        if (window.SIGHTENGINE_USER && window.SIGHTENGINE_SECRET) {
          const fd = new FormData();
          fd.append('media', file);
          fd.append('models', 'nudity-2.0,offensive,gore');
          fd.append('api_user', window.SIGHTENGINE_USER);
          fd.append('api_secret', window.SIGHTENGINE_SECRET);
          const resp = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: fd });
          const j = await resp.json();
          // Reject if any: nudity raw>0.6, offensive prob>0.6, gore prob>0.6
          const nudity = (j.nudity?.raw || 0) > 0.6 || (j.nudity?.sexual_activity || 0) > 0.6;
          const offensive = (j.offensive?.prob || 0) > 0.6;
          const gore = (j.gore?.prob || 0) > 0.6;
          if (nudity || offensive || gore) {
            throw new Error('This image was flagged by our automated content check. Please choose a different image.');
          }
        }

        const fileName = Date.now() + '-' + Math.random().toString(36).substring(2, 9) + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const { data: upload, error: upErr } = await SB.storage
          .from('submission-images')
          .upload(fileName, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = SB.storage.from('submission-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const fd = new FormData(form);
      const sess = (await SB.auth.getSession()).data.session;
      const payload = {
        submitter_name: fd.get('submitter_name').trim(),
        submitter_role: fd.get('submitter_role'),
        submitter_contact: fd.get('submitter_contact')?.trim() || null,
        submitter_user_id: sess?.user?.id || null,
        program_slug: fd.get('program_slug'),
        event_name: fd.get('event_name')?.trim() || null,
        event_date: fd.get('event_date') || null,
        story_text: fd.get('story_text').trim(),
        image_url: imageUrl,
      };

      const { error } = await SB.from('submissions').insert(payload);
      if (error) throw error;

      // Show celebratory success state, hide form, fire toast
      form.style.display = 'none';
      result.className = 'submit-success';
      result.innerHTML = '<div class="submit-success-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'
        + '<div class="kicker"><span class="mono accent">SUBMISSION RECEIVED</span></div>'
        + '<h2 style="font-size: clamp(28px, 4vw, 44px); line-height: 1.05; margin: 8px 0 16px;">Thank you, <em style="color: var(--accent);">' + payload.submitter_name.split(' ')[0] + '.</em></h2>'
        + '<p style="font-family: var(--font-serif); font-style: italic; font-size: 17px; line-height: 1.55; color: var(--ink-3); max-width: 52ch; margin: 0 0 24px;">Your story is in our review queue. We typically approve within 48 hours. Once published, it will appear on the <strong>' + payload.program_slug + '</strong> program page as recent work. We may reach out at <strong>' + (payload.submitter_contact || 'your contact') + '</strong> if we need clarification.</p>'
        + '<div style="display: flex; gap: 12px; flex-wrap: wrap;"><a href="my.html" class="btn btn--ink">View my submissions →</a><a href="index.html#programs" class="btn btn--secondary">Back to programs</a></div>';
      result.style.display = 'block';
      window.btcToast && window.btcToast('Story submitted. We will email you when it goes live.', 'success');
      window.scrollTo({ top: result.offsetTop - 100, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      result.className = 'submit-result is-error';
      result.innerHTML = '<strong>Submission failed.</strong><br>' + (err.message || 'Please try again, or message us on WhatsApp at ${ORG.whatsappDisplay}.');
      result.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').style.display = 'inline';
      submitBtn.querySelector('.btn-loading').style.display = 'none';
    }
  });
})();
</script>`;

// ============================================================================
// ADMIN PAGE — review submissions, approve/reject
// ============================================================================

const adminPage = () => `${head({ title: 'Admin · B The Change Welfare Society', desc: 'Review and approve volunteer submissions.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: '' })}

<main id="main">
  <section class="section">
    <div class="wrap">
      <div class="kicker"><span class="mono accent">ADMIN · INTERNAL ONLY</span></div>

      <!-- Login state -->
      <div id="admin-login" style="max-width: 460px;">
        <h1 style="font-size: clamp(28px, 4vw, 44px); margin: 12px 0 16px;">Admin <em style="font-family: var(--font-serif); font-style: italic; color: var(--accent);">login.</em></h1>
        <p style="color: var(--ink-3); margin-bottom: 22px;">Enter your admin email. We'll send you a one-time login link.</p>
        <form id="login-form">
          <input type="email" id="login-email" required placeholder="admin@bthechange.in" style="width: 100%; padding: 14px 16px; border: 1px solid var(--line); border-radius: 10px; font-size: 15px; margin-bottom: 12px;" />
          <button type="submit" class="btn btn--ink btn--lg" id="login-btn" style="width: 100%;">Send magic link <span class="arrow">→</span></button>
          <p id="login-msg" style="margin-top: 14px; font-size: 13px; color: var(--ink-3);"></p>
        </form>
      </div>

      <!-- Authenticated state, hidden until logged in -->
      <div id="admin-panel" style="display:none;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 22px;">
          <h1 style="font-size: clamp(28px, 4vw, 44px); margin: 0;">Pending <em style="font-family: var(--font-serif); font-style: italic; color: var(--accent);">submissions</em></h1>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span id="admin-email-tag" class="trust-pill"></span>
            <button id="logout-btn" class="btn btn--secondary" style="padding: 8px 14px; font-size: 12px;">Sign out</button>
          </div>
        </div>

        <div class="admin-tabs">
          <button class="admin-tab is-active" data-tab="pending">Pending <span id="count-pending">0</span></button>
          <button class="admin-tab" data-tab="approved">Approved <span id="count-approved">0</span></button>
          <button class="admin-tab" data-tab="rejected">Rejected <span id="count-rejected">0</span></button>
        </div>

        <div class="admin-toolbar" id="admin-toolbar" style="display: none;">
          <label class="admin-select-all">
            <input type="checkbox" id="admin-select-all" />
            <span>Select all</span>
          </label>
        </div>

        <div id="submissions-list" class="submissions-list">
          <p style="color: var(--ink-3); padding: 40px 0; text-align: center;">Loading...</p>
        </div>

        <!-- Sticky bulk action bar -->
        <div class="admin-batch-bar" id="admin-batch-bar" aria-hidden="true">
          <div class="admin-batch-bar-inner">
            <div class="admin-batch-count">
              <span id="admin-batch-count-num">0</span> <span class="admin-batch-count-label">selected</span>
            </div>
            <div class="admin-batch-actions" id="admin-batch-actions">
              <!-- buttons injected per-tab -->
            </div>
            <button class="admin-batch-clear" id="admin-batch-clear" aria-label="Clear selection">Clear</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>

${footer('')}
${scripts}

<script>
(function() {
  const SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
  const loginEl = document.getElementById('admin-login');
  const panelEl = document.getElementById('admin-panel');
  const listEl = document.getElementById('submissions-list');
  const emailTag = document.getElementById('admin-email-tag');
  let currentUser = null;
  let currentTab = 'pending';

  // ===== AUTH =====
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const btn = document.getElementById('login-btn');
    const msg = document.getElementById('login-msg');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    const { error } = await SB.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + window.location.pathname }});
    btn.disabled = false;
    btn.innerHTML = 'Send magic link <span class="arrow">→</span>';
    if (error) { msg.style.color = 'crimson'; msg.textContent = error.message; }
    else { msg.style.color = 'var(--accent)'; msg.textContent = 'Check your inbox. Click the link to sign in.'; }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await SB.auth.signOut();
    window.location.reload();
  });

  // ===== TAB SWITCH =====
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      currentTab = btn.dataset.tab;
      selectedIds.clear();
      updateBatchBar();
      loadSubmissions();
    });
  });

  // ===== BATCH SELECTION =====
  const selectedIds = new Set();
  const batchBar = document.getElementById('admin-batch-bar');
  const batchCountNum = document.getElementById('admin-batch-count-num');
  const batchActionsEl = document.getElementById('admin-batch-actions');
  const selectAllEl = document.getElementById('admin-select-all');
  const toolbarEl = document.getElementById('admin-toolbar');

  function updateBatchBar() {
    const n = selectedIds.size;
    batchCountNum.textContent = n;
    batchBar.classList.toggle('is-active', n > 0);
    batchBar.setAttribute('aria-hidden', n === 0);
    // Render tab-appropriate batch actions
    let html = '';
    if (currentTab === 'pending') {
      html = '<button class="btn btn--accent" data-batch="approve">Approve selected</button>'
           + '<button class="btn btn--secondary" data-batch="reject">Reject selected</button>';
    } else if (currentTab === 'approved') {
      html = '<button class="btn btn--secondary" data-batch="unapprove">Move to pending</button>'
           + '<button class="btn btn--secondary" data-batch="reject">Reject selected</button>';
    } else {
      html = '<button class="btn btn--secondary" data-batch="unapprove">Restore to pending</button>'
           + '<button class="btn btn--secondary" data-batch="delete">Delete selected</button>';
    }
    batchActionsEl.innerHTML = html;
    batchActionsEl.querySelectorAll('[data-batch]').forEach(b => b.addEventListener('click', handleBatch));
    // Sync select-all checkbox state
    if (selectAllEl) {
      const total = listEl.querySelectorAll('.sub-checkbox').length;
      selectAllEl.checked = total > 0 && n === total;
      selectAllEl.indeterminate = n > 0 && n < total;
    }
  }

  if (selectAllEl) {
    selectAllEl.addEventListener('change', () => {
      const checked = selectAllEl.checked;
      listEl.querySelectorAll('.sub-checkbox').forEach(cb => {
        cb.checked = checked;
        const id = cb.dataset.id;
        if (checked) selectedIds.add(id); else selectedIds.delete(id);
        cb.closest('.sub-card')?.classList.toggle('is-selected', checked);
      });
      updateBatchBar();
    });
  }

  document.getElementById('admin-batch-clear').addEventListener('click', () => {
    selectedIds.clear();
    listEl.querySelectorAll('.sub-checkbox').forEach(cb => { cb.checked = false; cb.closest('.sub-card')?.classList.remove('is-selected'); });
    updateBatchBar();
  });

  async function handleBatch(e) {
    const action = e.target.dataset.batch;
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const verb = { approve: 'approve', reject: 'reject', unapprove: 'restore', delete: 'permanently delete' }[action];
    if (action === 'delete' && !confirm('Permanently delete ' + ids.length + ' submission(s)? This cannot be undone.')) return;
    e.target.disabled = true;
    const original = e.target.textContent;
    e.target.textContent = 'Working...';
    try {
      let res;
      if (action === 'delete') {
        res = await SB.from('submissions').delete().in('id', ids);
      } else {
        let update;
        if (action === 'approve') update = { status: 'approved', approved_by: currentUser.id, approved_at: new Date().toISOString() };
        if (action === 'reject') update = { status: 'rejected' };
        if (action === 'unapprove') update = { status: 'pending', approved_by: null, approved_at: null };
        res = await SB.from('submissions').update(update).in('id', ids);
      }
      if (res.error) throw res.error;
      window.btcToast && window.btcToast(ids.length + ' submission(s) ' + verb + 'd.', 'success');
      selectedIds.clear();
      await loadSubmissions();
    } catch (err) {
      window.btcToast && window.btcToast('Batch ' + action + ' failed: ' + (err.message || err), 'error');
    } finally {
      e.target.disabled = false;
      e.target.textContent = original;
    }
  }

  // ===== LOAD =====
  async function checkAdmin(userId) {
    const { data, error } = await SB.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
    return !error && !!data;
  }

  async function loadSubmissions() {
    listEl.innerHTML = '<p style="color: var(--ink-3); padding: 40px 0; text-align: center;">Loading...</p>';
    const { data, error } = await SB.from('submissions')
      .select('*')
      .eq('status', currentTab)
      .order('created_at', { ascending: false });

    // Update counts (separate queries, lightweight)
    ['pending', 'approved', 'rejected'].forEach(async (st) => {
      const { count } = await SB.from('submissions').select('*', { count: 'exact', head: true }).eq('status', st);
      document.getElementById('count-' + st).textContent = count || 0;
    });

    if (error) { listEl.innerHTML = '<p style="color: crimson;">' + error.message + '</p>'; toolbarEl.style.display = 'none'; return; }
    if (!data.length) {
      listEl.innerHTML = '<p style="color: var(--ink-3); padding: 40px 0; text-align: center;">No ' + currentTab + ' submissions.</p>';
      toolbarEl.style.display = 'none';
      updateBatchBar();
      return;
    }

    toolbarEl.style.display = 'flex';
    listEl.innerHTML = data.map(renderCard).join('');
    listEl.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', handleAction));
    listEl.querySelectorAll('.sub-checkbox').forEach(cb => cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      if (cb.checked) selectedIds.add(id); else selectedIds.delete(id);
      cb.closest('.sub-card')?.classList.toggle('is-selected', cb.checked);
      updateBatchBar();
    }));
    updateBatchBar();
  }

  function renderCard(s) {
    const date = new Date(s.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const img = s.image_url ? '<img src="' + s.image_url + '" alt="Submission photo from ' + esc(s.submitter_name) + ' for ' + esc(s.program_slug) + '" class="sub-img" />' : '';
    const event = s.event_name ? '<span class="sub-meta">@ ' + esc(s.event_name) + (s.event_date ? ' · ' + s.event_date : '') + '</span>' : '';
    const actions = currentTab === 'pending'
      ? '<button class="btn btn--accent" data-action="approve" data-id="' + s.id + '">Approve</button> <button class="btn btn--secondary" data-action="reject" data-id="' + s.id + '">Reject</button>'
      : currentTab === 'approved'
        ? '<button class="btn btn--secondary" data-action="unapprove" data-id="' + s.id + '">Move to pending</button> <button class="btn btn--secondary" data-action="reject" data-id="' + s.id + '">Reject</button>'
        : '<button class="btn btn--secondary" data-action="unapprove" data-id="' + s.id + '">Restore to pending</button> <button class="btn btn--secondary" data-action="delete" data-id="' + s.id + '">Delete</button>';
    return '<article class="sub-card" data-id="' + s.id + '">' +
      '<div class="sub-card-head">' +
        '<label class="sub-card-select"><input type="checkbox" class="sub-checkbox" data-id="' + s.id + '" aria-label="Select submission from ' + esc(s.submitter_name) + '" /></label>' +
        '<div><strong>' + esc(s.submitter_name) + '</strong> · <span class="mono">' + (s.submitter_role || 'unknown') + '</span></div>' +
        '<div class="sub-meta">' + date + '</div>' +
      '</div>' +
      img +
      '<div class="sub-card-body">' +
        '<div class="sub-program"><span class="mono accent">' + esc(s.program_slug) + '</span> ' + event + '</div>' +
        '<p>' + esc(s.story_text).replace(/\\n/g, '<br>') + '</p>' +
        (s.submitter_contact ? '<div class="sub-meta">Contact: ' + esc(s.submitter_contact) + '</div>' : '') +
      '</div>' +
      '<div class="sub-card-actions">' + actions + '</div>' +
    '</article>';
  }

  async function handleAction(e) {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    e.target.disabled = true;
    e.target.textContent = '...';

    let update;
    if (action === 'approve') update = { status: 'approved', approved_by: currentUser.id, approved_at: new Date().toISOString() };
    if (action === 'reject') update = { status: 'rejected' };
    if (action === 'unapprove') update = { status: 'pending', approved_by: null, approved_at: null };
    if (action === 'delete') {
      if (!confirm('Delete permanently?')) { e.target.disabled = false; loadSubmissions(); return; }
      const { error } = await SB.from('submissions').delete().eq('id', id);
      if (error) { window.btcToast && window.btcToast(error.message, 'error'); return; }
      window.btcToast && window.btcToast('Submission deleted.', 'success');
      loadSubmissions();
      return;
    }

    const { error } = await SB.from('submissions').update(update).eq('id', id);
    if (error) { window.btcToast && window.btcToast(error.message, 'error'); }
    else { window.btcToast && window.btcToast('Submission ' + action + 'd.', 'success'); }
    loadSubmissions();
  }

  function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // ===== INIT =====
  (async () => {
    const { data: { session } } = await SB.auth.getSession();
    if (!session) {
      loginEl.style.display = 'block';
      panelEl.style.display = 'none';
      return;
    }
    currentUser = session.user;
    const isAdmin = await checkAdmin(currentUser.id);
    if (!isAdmin) {
      loginEl.style.display = 'block';
      document.getElementById('login-msg').style.color = 'crimson';
      document.getElementById('login-msg').textContent = 'Signed in as ' + currentUser.email + ' but not an admin. Ask the founder to add you, then refresh.';
      panelEl.style.display = 'none';
      return;
    }
    loginEl.style.display = 'none';
    panelEl.style.display = 'block';
    emailTag.innerHTML = '<span class="dot"></span>' + currentUser.email.toUpperCase();
    loadSubmissions();
  })();

  SB.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') window.location.reload();
  });
})();
</script>`;

// ============================================================================
// BLOG INDEX — public list of approved posts
// ============================================================================

const blogPage = () => `${head({ title: 'Blog · B The Change Welfare Society', desc: 'Stories, field notes, and reflections from B The Change programs across India and the UK.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: 'blog' })}

<main id="main">
  <section class="hero" style="padding: clamp(20px, 4vw, 40px) 0 clamp(24px, 4vw, 44px); border-bottom: 1px solid var(--line);">
    <div class="wrap">
      <div data-reveal>
        <div class="kicker"><span class="mono accent">BLOG · FIELD NOTES &amp; REFLECTIONS</span></div>
        <h1 class="hero-h1" style="font-size: clamp(34px, 5.5vw, 72px); line-height: 1; margin: 12px 0 16px;">
          Stories from <em style="color: var(--accent);">the ground.</em>
        </h1>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: clamp(15px, 1.3vw, 19px); line-height: 1.55; color: var(--ink-3); max-width: 56ch;">
          Written by team members, volunteers, and the kids and families we work with. Approved by editors. Honest about what works and what doesn't.
        </p>
        <div style="margin-top: 18px;">
          <a href="blog-write.html" class="btn btn--accent">Write a post <span class="arrow">→</span></a>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div id="blog-list" class="programs-grid programs-grid--3">
        <p style="color: var(--ink-3);">Loading posts...</p>
      </div>
    </div>
  </section>
</main>

${footer('')}
${authModal}
${scripts}

<script>
(async function() {
  const SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
  const list = document.getElementById('blog-list');
  const { data, error } = await SB.from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, author_name, author_role, published_at, program_slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) { list.innerHTML = '<p style="color: crimson;">' + error.message + '</p>'; return; }
  if (!data.length) {
    list.innerHTML = '<div style="grid-column: 1 / -1; padding: 60px 0; text-align: center;"><p style="font-family: var(--font-serif); font-style: italic; font-size: 20px; color: var(--ink-3);">No published posts yet.</p><p style="margin-top: 14px;"><a href="blog-write.html" class="btn btn--accent">Be the first to write one</a></p></div>';
    return;
  }

  list.innerHTML = data.map(p => {
    const date = new Date(p.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return '<a href="blog-post.html?slug=' + encodeURIComponent(p.slug) + '" class="program-card program-card--withfoot">' +
      (p.cover_image_url ? '<div class="pc-cover"><img src="' + p.cover_image_url + '" alt="Cover image for: ' + esc(p.title) + '" /></div>' : '') +
      '<div class="pc-num"><strong>' + (p.author_role || 'AUTHOR').toUpperCase() + '</strong> · ' + esc(p.author_name) + '</div>' +
      '<h3>' + esc(p.title) + '</h3>' +
      '<p>' + esc(p.excerpt || '') + '</p>' +
      '<div class="program-card-foot"><div class="program-card-tag">' + date + '</div><div class="program-card-go">Read →</div></div>' +
    '</a>';
  }).join('');

  function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();
</script>`;

// ============================================================================
// BLOG WRITE — authenticated users can submit a post
// ============================================================================

const blogWritePage = () => `${head({ title: 'Write a post · B The Change', desc: 'Submit a blog post for review.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: 'blog' })}

<main id="main">
  <section class="section">
    <div class="wrap" style="max-width: 720px;">
      <div class="kicker"><span class="mono accent">BLOG · NEW POST</span></div>
      <h1 style="font-size: clamp(28px, 4vw, 48px); margin: 12px 0 8px;">Write a <em style="font-family: var(--font-serif); font-style: italic; color: var(--accent);">post.</em></h1>
      <p style="color: var(--ink-3); margin-bottom: 22px;">Anyone can write. Posts are reviewed by an editor before going live.</p>

      <div id="auth-needed" style="display:none;">
        <p style="color: var(--ink-3); margin-bottom: 14px;">You need to sign in first. Enter your email, we'll send you a one-time link.</p>
        <form id="auth-form" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;">
          <input type="email" id="auth-email" required placeholder="your@email.com" style="flex: 1; min-width: 240px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; font-size: 14px;" />
          <button type="submit" class="btn btn--ink">Send link →</button>
        </form>
        <p id="auth-msg" style="font-size: 13px; color: var(--ink-3);"></p>
      </div>

      <form id="blog-form" class="submit-form" style="display:none;">
        <div class="form-row">
          <label class="form-label">Author name <span class="req">*</span></label>
          <input type="text" name="author_name" required maxlength="80" placeholder="How should we credit you?" />
        </div>
        <div class="form-row">
          <label class="form-label">Your role <span class="req">*</span></label>
          <select name="author_role" required>
            <option value="">Select one</option>
            <option value="admin">Admin / Staff</option>
            <option value="volunteer">Volunteer</option>
            <option value="kid">Student</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">Title <span class="req">*</span></label>
          <input type="text" name="title" required maxlength="160" placeholder="What's this post about?" />
        </div>
        <div class="form-row">
          <label class="form-label">Excerpt (1-2 sentences)</label>
          <textarea name="excerpt" rows="2" maxlength="280" placeholder="Shows on the blog list page"></textarea>
        </div>
        <div class="form-row">
          <label class="form-label">Tag a program (optional)</label>
          <select name="program_slug">
            <option value="">None / general</option>
            ${PROGRAMS.map(p => `<option value="${p.slug}">${p.name}</option>`).join('\n            ')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">Body <span class="req">*</span></label>
          <textarea id="blog-body-editor" name="body_md" required maxlength="40000" placeholder="Write your post. Use the toolbar to format."></textarea>
          <div class="form-help">Tip: paste images directly into the editor. Use headings to break up long posts.</div>
        </div>
        <div class="form-row">
          <label class="form-label">Cover image (optional)</label>
          <div class="file-drop">
            <input type="file" id="blog-image" name="cover" accept="image/jpeg,image/png,image/webp" />
            <div class="file-drop-prompt">
              <div class="file-drop-icon">+</div>
              <div class="file-drop-text">Tap to add cover image</div>
              <div class="file-drop-preview" id="blog-preview"></div>
            </div>
          </div>
        </div>
        <div class="form-foot">
          <button type="submit" class="btn btn--accent btn--lg" id="blog-submit-btn">
            <span class="btn-text">Submit for review</span>
            <span class="btn-loading" style="display:none;">Submitting...</span>
            <span class="arrow">→</span>
          </button>
        </div>
        <div id="blog-result" class="submit-result" style="display:none;"></div>
      </form>
    </div>
  </section>
</main>

${footer('')}
${authModal}
${scripts}

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" />
<script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
<script>
(async function() {
  const SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
  const authPanel = document.getElementById('auth-needed');
  const blogForm = document.getElementById('blog-form');
  const fileInput = document.getElementById('blog-image');
  const filePreview = document.getElementById('blog-preview');

  // ---- Rich-text editor setup (Quill 2) ----
  // Quill replaces the textarea visually but we sync HTML back to it on submit
  const editorTextarea = document.getElementById('blog-body-editor');
  let quill = null;
  if (window.Quill) {
    const div = document.createElement('div');
    div.id = 'blog-body-quill';
    div.style.minHeight = '320px';
    div.style.background = 'var(--paper)';
    div.style.border = '1px solid var(--line)';
    div.style.borderRadius = '10px';
    editorTextarea.style.display = 'none';
    editorTextarea.parentNode.insertBefore(div, editorTextarea);
    quill = new window.Quill('#blog-body-quill', {
      theme: 'snow',
      placeholder: 'Tell your story. Use the toolbar above to format.',
      modules: {
        toolbar: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
      },
    });
  }

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const msg = document.getElementById('auth-msg');
    msg.textContent = 'Sending...';
    const { error } = await SB.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + window.location.pathname }});
    msg.style.color = error ? 'crimson' : 'var(--accent)';
    msg.textContent = error ? error.message : 'Check your inbox.';
  });

  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert('Max 5MB'); fileInput.value = ''; return; }
    const r = new FileReader();
    r.onload = (ev) => { filePreview.innerHTML = '<img src="' + ev.target.result + '" />'; filePreview.style.display = 'block'; };
    r.readAsDataURL(f);
  });

  blogForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Sync Quill HTML into hidden textarea
    if (quill) {
      const html = quill.root.innerHTML;
      const plain = quill.getText().trim();
      if (!plain) { alert('Body cannot be empty.'); return; }
      editorTextarea.value = html;
    }
    const btn = document.getElementById('blog-submit-btn');
    const result = document.getElementById('blog-result');
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline';
    try {
      let coverUrl = null;
      const f = fileInput.files[0];
      if (f) {
        // NSFW pre-check (if configured)
        if (window.SIGHTENGINE_USER && window.SIGHTENGINE_SECRET) {
          const cf = new FormData();
          cf.append('media', f);
          cf.append('models', 'nudity-2.0,offensive,gore');
          cf.append('api_user', window.SIGHTENGINE_USER);
          cf.append('api_secret', window.SIGHTENGINE_SECRET);
          const cr = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: cf });
          const cj = await cr.json();
          const flagged = (cj.nudity?.raw || 0) > 0.6 || (cj.nudity?.sexual_activity || 0) > 0.6 || (cj.offensive?.prob || 0) > 0.6 || (cj.gore?.prob || 0) > 0.6;
          if (flagged) throw new Error('Cover image flagged by content check. Choose a different image.');
        }
        const name = Date.now() + '-' + Math.random().toString(36).substring(2,9) + '-' + f.name.replace(/[^a-zA-Z0-9._-]/g,'_');
        const { error: upErr } = await SB.storage.from('submission-images').upload(name, f, { contentType: f.type });
        if (upErr) throw upErr;
        coverUrl = SB.storage.from('submission-images').getPublicUrl(name).data.publicUrl;
      }
      const fd = new FormData(blogForm);
      const session = (await SB.auth.getSession()).data.session;
      const title = fd.get('title').trim();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80) + '-' + Date.now().toString(36);
      const payload = {
        slug,
        title,
        excerpt: fd.get('excerpt')?.trim() || null,
        body_md: fd.get('body_md').trim(),
        cover_image_url: coverUrl,
        author_name: fd.get('author_name').trim(),
        author_role: fd.get('author_role'),
        author_id: session.user.id,
        program_slug: fd.get('program_slug') || null,
        status: 'pending',
      };
      const { error } = await SB.from('blog_posts').insert(payload);
      if (error) throw error;
      result.className = 'submit-result is-success';
      result.innerHTML = '<strong>Submitted.</strong><br>An editor will review your post. We will let you know via the email you signed in with.';
      result.style.display = 'block';
      blogForm.reset();
      filePreview.innerHTML = '';
      window.scrollTo({ top: result.offsetTop - 100, behavior: 'smooth' });
    } catch (err) {
      result.className = 'submit-result is-error';
      result.innerHTML = '<strong>Failed.</strong> ' + (err.message || 'Try again.');
      result.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.querySelector('.btn-text').style.display = 'inline';
      btn.querySelector('.btn-loading').style.display = 'none';
    }
  });

  // INIT
  const { data: { session } } = await SB.auth.getSession();
  if (session) {
    authPanel.style.display = 'none';
    blogForm.style.display = 'block';
  } else {
    authPanel.style.display = 'block';
    blogForm.style.display = 'none';
  }
  SB.auth.onAuthStateChange((evt) => { if (evt === 'SIGNED_IN' || evt === 'SIGNED_OUT') window.location.reload(); });
})();
</script>`;

// ============================================================================
// BLOG POST — renders a single post by slug query param
// ============================================================================

const blogPostPage = () => `${head({ title: 'Loading post · B The Change', desc: 'A field note from B The Change.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: 'blog' })}

<main id="main">
  <section class="section">
    <div class="wrap" style="max-width: 760px;">
      <div id="post-content"><p style="color: var(--ink-3);">Loading...</p></div>
    </div>
  </section>
</main>

${footer('')}
${scripts}

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
<script>
(async function() {
  const SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
  const slug = new URLSearchParams(window.location.search).get('slug');
  const el = document.getElementById('post-content');
  if (!slug) { el.innerHTML = '<p>No post specified.</p>'; return; }
  const { data, error } = await SB.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error || !data) { el.innerHTML = '<p>Post not found.</p>'; return; }
  document.title = data.title + ' · B The Change';
  const date = new Date(data.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const coverAlt = 'Cover image for ' + data.title;
  const cover = data.cover_image_url ? '<img src="' + data.cover_image_url + '" alt="' + esc(coverAlt) + '" style="width:100%; border-radius: 16px; margin: 18px 0 28px;" />' : '';
  // Render body — sanitize via DOMPurify before injecting
  const rawHtml = data.body_md.trim().startsWith('<') ? data.body_md : window.marked.parse(data.body_md);
  const safeHtml = window.DOMPurify ? window.DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } }) : rawHtml;
  el.innerHTML =
    '<div class="kicker"><span class="mono accent">' + (data.author_role || '').toUpperCase() + ' · ' + esc(data.author_name) + '</span></div>' +
    '<h1 style="font-size: clamp(32px, 5vw, 56px); line-height: 1.05; letter-spacing: -1.5px; margin: 12px 0 8px;">' + esc(data.title) + '</h1>' +
    '<p style="color: var(--ink-3); font-size: 13px; font-family: var(--font-mono); letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 14px;">' + date + '</p>' +
    cover +
    '<div class="prose">' + safeHtml + '</div>' +
    '<div style="margin-top: 32px;"><a href="blog.html" class="btn btn--secondary">← Back to blog</a></div>';
  function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();
</script>`;

// ============================================================================
// MY SUBMISSIONS — volunteers sign in to view + edit their pending submissions
// ============================================================================

const myPage = () => `${head({ title: 'My submissions · B The Change', desc: 'View and edit your submitted stories.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: '' })}

<main id="main">
  <section class="section">
    <div class="wrap" style="max-width: 760px;">
      <div class="kicker"><span class="mono accent">YOUR SUBMISSIONS</span></div>
      <h1 style="font-size: clamp(32px, 4.6vw, 52px); margin: 12px 0 8px;">My <em style="font-family: var(--font-serif); font-style: italic; color: var(--accent);">stories.</em></h1>

      <!-- Login state -->
      <div id="my-login" style="display:none; margin-top: 22px;">
        <p style="color: var(--ink-3); margin-bottom: 14px;">Sign in to see your submissions. Use the same email you submitted with.</p>
        <form id="my-login-form" style="display: flex; gap: 8px; flex-wrap: wrap; max-width: 460px;">
          <input type="email" id="my-login-email" required placeholder="you@email.com" style="flex: 1; min-width: 240px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; font-size: 14px;" />
          <button type="submit" class="btn btn--ink">Send link →</button>
        </form>
        <p id="my-login-msg" style="margin-top: 12px; font-size: 13px; color: var(--ink-3);"></p>
      </div>

      <!-- Authed state -->
      <div id="my-panel" style="display:none;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin: 18px 0 22px;">
          <span class="trust-pill" id="my-email-tag"></span>
          <div style="display:flex; gap: 8px;">
            <a href="submit.html" class="btn btn--accent" style="padding: 8px 14px; font-size: 12px;">+ New submission</a>
            <button id="my-logout" class="btn btn--secondary" style="padding: 8px 14px; font-size: 12px;">Sign out</button>
          </div>
        </div>
        <div id="my-list"><p style="color: var(--ink-3);">Loading...</p></div>
      </div>
    </div>
  </section>

  <!-- Edit modal -->
  <div id="edit-modal" class="edit-modal" style="display:none;">
    <div class="edit-modal-card">
      <div class="edit-modal-head">
        <strong>Edit submission</strong>
        <button id="edit-close" aria-label="Close" style="background: none; border: none; font-size: 22px; cursor: pointer; color: var(--ink-3);">×</button>
      </div>
      <form id="edit-form" class="submit-form">
        <input type="hidden" name="id" />
        <div class="form-row">
          <label class="form-label">Story</label>
          <textarea name="story_text" rows="6" maxlength="2000" required></textarea>
        </div>
        <div class="form-row form-row--2">
          <div>
            <label class="form-label">Event name</label>
            <input type="text" name="event_name" maxlength="120" />
          </div>
          <div>
            <label class="form-label">Date</label>
            <input type="date" name="event_date" />
          </div>
        </div>
        <div class="form-foot">
          <button type="submit" class="btn btn--accent">Save changes <span class="arrow">→</span></button>
        </div>
        <div id="edit-result" class="submit-result" style="display:none;"></div>
      </form>
    </div>
  </div>
</main>

${footer('')}
${authModal}
${scripts}

<script>
(async function() {
  const SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
  const loginEl = document.getElementById('my-login');
  const panelEl = document.getElementById('my-panel');
  const listEl  = document.getElementById('my-list');
  const emailTag = document.getElementById('my-email-tag');
  const modal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-form');
  let me = null;

  // --- AUTH ---
  document.getElementById('my-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('my-login-email').value.trim();
    const msg = document.getElementById('my-login-msg');
    msg.textContent = 'Sending...';
    const { error } = await SB.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href }});
    msg.style.color = error ? 'crimson' : 'var(--accent)';
    msg.textContent = error ? error.message : 'Check your inbox.';
  });
  document.getElementById('my-logout').addEventListener('click', async () => {
    await SB.auth.signOut(); window.location.reload();
  });

  // --- LOAD ---
  async function loadMine() {
    listEl.innerHTML = '<p style="color: var(--ink-3);">Loading...</p>';
    const { data, error } = await SB.from('submissions')
      .select('id, status, program_slug, event_name, event_date, story_text, image_url, created_at, admin_notes')
      .eq('submitter_user_id', me.id)
      .order('created_at', { ascending: false });
    if (error) { listEl.innerHTML = '<p style="color: crimson;">' + error.message + '</p>'; return; }
    if (!data.length) {
      listEl.innerHTML = '<div style="padding: 40px 0; text-align: center;"><p style="font-family: var(--font-serif); font-style: italic; font-size: 18px; color: var(--ink-3);">No submissions yet.</p><p style="margin-top: 12px;"><a href="submit.html" class="btn btn--accent">Share your first story →</a></p></div>';
      return;
    }
    listEl.innerHTML = data.map(card).join('');
    listEl.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openEdit(b.dataset.edit, data)));
  }

  function statusPill(s) {
    const map = {
      pending: { label: 'Pending review', color: '#a86b00', bg: 'rgba(212,144,32,.14)' },
      approved:{ label: 'Live on the program page', color: 'var(--accent)', bg: 'rgba(30, 58, 111,.10)' },
      rejected:{ label: 'Not approved', color: '#9b2222', bg: 'rgba(155,34,34,.10)' },
    };
    const m = map[s] || map.pending;
    return '<span style="display:inline-block; padding: 3px 10px; border-radius: 999px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: ' + m.color + '; background: ' + m.bg + ';">' + m.label + '</span>';
  }

  function card(s) {
    const date = new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const img = s.image_url ? '<img src="' + s.image_url + '" alt="Your submission photo for ' + esc(s.program_slug) + '" class="sub-img" />' : '';
    const editBtn = s.status === 'pending'
      ? '<button class="btn btn--secondary" data-edit="' + s.id + '" style="padding: 6px 12px; font-size: 12px;">Edit</button>'
      : '';
    return '<article class="sub-card">' +
      '<div class="sub-card-head">' +
        '<div>' + statusPill(s.status) + ' &nbsp; <span class="mono accent">' + s.program_slug + '</span></div>' +
        '<div class="sub-meta">' + date + '</div>' +
      '</div>' +
      img +
      '<div class="sub-card-body">' +
        (s.event_name ? '<div class="sub-meta">' + esc(s.event_name) + (s.event_date ? ' · ' + s.event_date : '') + '</div>' : '') +
        '<p>' + esc(s.story_text).replace(/\\n/g, '<br>') + '</p>' +
        (s.admin_notes ? '<div style="margin-top: 10px; padding: 10px 12px; background: var(--paper-2); border-radius: 8px; font-size: 12px; color: var(--ink-3);"><strong>Admin note:</strong> ' + esc(s.admin_notes) + '</div>' : '') +
      '</div>' +
      (editBtn ? '<div class="sub-card-actions">' + editBtn + '</div>' : '') +
    '</article>';
  }

  function openEdit(id, allData) {
    const sub = allData.find(s => s.id === id);
    if (!sub) return;
    editForm.id.value = sub.id;
    editForm.story_text.value = sub.story_text || '';
    editForm.event_name.value = sub.event_name || '';
    editForm.event_date.value = sub.event_date || '';
    document.getElementById('edit-result').style.display = 'none';
    modal.style.display = 'flex';
  }
  document.getElementById('edit-close').addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(editForm);
    const id = fd.get('id');
    const update = {
      story_text: fd.get('story_text').trim(),
      event_name: fd.get('event_name')?.trim() || null,
      event_date: fd.get('event_date') || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await SB.from('submissions').update(update).eq('id', id);
    const result = document.getElementById('edit-result');
    if (error) {
      result.className = 'submit-result is-error';
      result.innerHTML = '<strong>Failed.</strong> ' + error.message;
    } else {
      result.className = 'submit-result is-success';
      result.innerHTML = '<strong>Saved.</strong> Your changes are in. The story stays in the pending queue.';
      setTimeout(() => { modal.style.display = 'none'; loadMine(); }, 1200);
    }
    result.style.display = 'block';
  });

  function esc(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // --- INIT ---
  const { data: { session } } = await SB.auth.getSession();
  if (!session) {
    loginEl.style.display = 'block';
    panelEl.style.display = 'none';
    return;
  }
  me = session.user;
  loginEl.style.display = 'none';
  panelEl.style.display = 'block';
  emailTag.innerHTML = '<span class="dot"></span>' + me.email.toUpperCase();
  loadMine();

  SB.auth.onAuthStateChange((evt) => { if (evt === 'SIGNED_IN' || evt === 'SIGNED_OUT') window.location.reload(); });
})();
</script>`;

// ============================================================================
// 404 PAGE
// ============================================================================
const notFoundPage = () => `${head({ title: 'Page not found · B The Change Welfare Society', desc: 'The page you were looking for does not exist or has moved.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: '' })}

<main id="main">
  <section class="section" style="min-height: 60vh; display: flex; align-items: center;">
    <div class="wrap" style="max-width: 720px; text-align: center;">
      <div class="kicker"><span class="mono accent">404 · PAGE NOT FOUND</span></div>
      <h1 style="font-size: clamp(48px, 9vw, 120px); line-height: 0.95; letter-spacing: -3px; margin: 16px 0 18px;">
        Lost in <em style="font-family: var(--font-serif); font-style: italic; color: var(--accent);">the change.</em>
      </h1>
      <p style="font-family: var(--font-serif); font-style: italic; font-size: clamp(17px, 1.5vw, 22px); line-height: 1.55; color: var(--ink-3); max-width: 52ch; margin: 0 auto 32px;">
        The page you were looking for doesn't exist, has moved, or never quite made it to the work we publish.
      </p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <a href="index.html" class="btn btn--ink">← Back to home</a>
        <a href="index.html#programs" class="btn btn--secondary">Explore our 11 programs</a>
        <a href="blog.html" class="btn btn--secondary">Read field notes</a>
      </div>
    </div>
  </section>
</main>

${footer('')}
${scripts}`;

// ============================================================================
// PRESS KIT — for journalists, media partners, anyone covering BTC
// ============================================================================
const pressPage = () => `${head({ title: 'Press kit · B The Change Welfare Society', desc: 'Logo files, founder photos, boilerplate copy, and recent press mentions for journalists and media partners covering B The Change.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: '' })}

<main id="main">
  <section class="hero" style="padding: clamp(20px, 4vw, 40px) 0 clamp(24px, 4vw, 44px); border-bottom: 1px solid var(--line);">
    <div class="wrap">
      <div data-reveal>
        <div class="kicker"><span class="mono accent">PRESS KIT · FOR JOURNALISTS AND MEDIA</span></div>
        <h1 class="hero-h1" style="font-size: clamp(34px, 5.5vw, 72px); line-height: 1; margin: 12px 0 16px;">
          Tell the story <em style="color: var(--accent);">accurately.</em>
        </h1>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: clamp(15px, 1.3vw, 19px); line-height: 1.55; color: var(--ink-3); max-width: 60ch;">
          Everything you need to write about B The Change Welfare Society. Logos, photos, boilerplate copy, founder bios, and statutory information. For interview requests, write to support@bthechange.in or WhatsApp ${ORG.whatsappDisplay}.
        </p>
      </div>
    </div>
  </section>

  <!-- BOILERPLATE -->
  <section class="section">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">01 · BOILERPLATE COPY</span></div>
        <h2>About B The Change.</h2>
      </div>
      <div class="press-block" data-reveal>
        <h3 style="font-size: 14px; color: var(--mute); font-family: var(--font-mono); letter-spacing: 1.2px; text-transform: uppercase;">Short version (50 words)</h3>
        <p>B The Change Welfare Society is an Indian NGO founded in ${ORG.founded} and based in Hyderabad, Telangana. Across eleven programs in two countries, it has touched approximately 200,000 lives in twenty years. Its work spans education, public health, environmental action, animal welfare, women's empowerment, and pro-bono legal aid.</p>
        <button class="btn btn--secondary press-copy-btn" data-copy="short">Copy short version</button>
      </div>
      <div class="press-block" data-reveal>
        <h3 style="font-size: 14px; color: var(--mute); font-family: var(--font-mono); letter-spacing: 1.2px; text-transform: uppercase;">Long version (150 words)</h3>
        <p>B The Change Welfare Society is an Indian non-profit organisation registered under the Telangana Societies Registration Act 2001 (Reg No ${ORG.regNo}). Founded in ${ORG.founded} by Sri Ram Kalyan Challa, the organisation has spent two decades running grassroots programs across eleven fronts: Coding on Wheels, Changemakers, Organ Donation Campaign on Wheels, EKO Warriors, PAWtection Force, WE: Women Empowerment, Global Human Rights Front, Cross Connect Legal Aid, DreamCatchers, Launchpad, and L.A.W.G.I.C.. The Society holds valid 80G and 12A certifications under the Indian Income Tax Act, CSR-1 registration with the Ministry of Corporate Affairs, and is listed on NITI Aayog Darpan (${ORG.darpanId}). Working President Rohan Rajkulkarni, a UK-registered Solicitor and IIM Kozhikode MBA, leads operations and CSR partnerships. The organisation operates in India and the United Kingdom, with primary delivery centred in Hyderabad, Telangana.</p>
        <button class="btn btn--secondary press-copy-btn" data-copy="long">Copy long version</button>
      </div>
    </div>
  </section>

  <!-- DOWNLOADS -->
  <section class="section muted">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">02 · DOWNLOADS</span></div>
        <h2>Logos &amp; assets.</h2>
        <p style="font-family:var(--font-serif); font-style:italic; font-size:18px; color:var(--ink-3); max-width:52ch; margin:0;">
          High-resolution logo files. Use the orange version on light backgrounds, the white version on dark. Do not alter the logo, change colours, or place it on a non-brand colour.
        </p>
      </div>
      <div class="reports-grid" data-reveal>
        <a href="assets/bthechange-logo.png" download class="report-card">
          <div class="report-year">PNG</div>
          <div class="report-meta">PRIMARY LOGO · TRANSPARENT</div>
          <div class="report-title">Brand mark, full colour.</div>
          <div class="report-cta">Download →</div>
        </a>
        <a href="assets/reports/btc-annual-report-2024.pdf" target="_blank" rel="noopener" class="report-card">
          <div class="report-year">PDF</div>
          <div class="report-meta">ANNUAL REPORT 2024</div>
          <div class="report-title">Programs, impact, financials.</div>
          <div class="report-cta">Download PDF →</div>
        </a>
        <a href="${waLink('Hi, I am a journalist requesting high-resolution photos of the founder and program activities for press coverage.')}" target="_blank" rel="noopener" class="report-card report-card--request">
          <div class="report-year">JPG</div>
          <div class="report-meta">FOUNDER &amp; PROGRAM PHOTOS</div>
          <div class="report-title">High-resolution, on request.</div>
          <div class="report-cta">Request via WhatsApp →</div>
        </a>
      </div>
    </div>
  </section>

  <!-- FOUNDER BIOS -->
  <section class="section">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">03 · FOUNDER &amp; LEADERSHIP BIOS</span></div>
        <h2>Who to <em>quote.</em></h2>
      </div>
      <div class="board-grid" data-reveal>
        <article class="board-card">
          <div class="board-role">FOUNDER &amp; CHAIRPERSON</div>
          <h3>Sri Ram Kalyan Challa</h3>
          <p>Founded B The Change Welfare Society in ${ORG.founded}. Lawyer trained at Osmania University. Twenty years designing grassroots programs for education, public health, and rights. Available for interviews on social-impact methodology, NGO governance, and twenty-year program scaling.</p>
        </article>
        <article class="board-card">
          <div class="board-role">WORKING PRESIDENT</div>
          <h3>Rohan Rajkulkarni</h3>
          <p>UK-registered Solicitor (SRA). MBA from Indian Institute of Management Kozhikode. VP, IIMK Alumni Association (Hyderabad chapter). Available for interviews on CSR partnerships, NGO operations, and the diaspora-India social impact bridge.</p>
        </article>
      </div>
    </div>
  </section>

  <!-- STATUTORY -->
  <section class="section muted">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">04 · STATUTORY DETAILS</span></div>
        <h2>For the fact-check desk.</h2>
      </div>
      <div class="board-grid" data-reveal>
        <article class="board-card">
          <div class="board-role">REGISTRATION</div>
          <h3>Reg No ${ORG.regNo}</h3>
          <p>Telangana Societies Registration Act 2001. Registrar of Societies, Telangana.</p>
        </article>
        <article class="board-card">
          <div class="board-role">TAX</div>
          <h3>80G · 12A</h3>
          <p>Valid certifications under the Indian Income Tax Act. Donations are eligible for tax deduction under Section 80G.</p>
        </article>
        <article class="board-card">
          <div class="board-role">CSR</div>
          <h3>CSR-1 Registered</h3>
          <p>Registered with Ministry of Corporate Affairs. Eligible to receive CSR contributions from Indian corporates.</p>
        </article>
        <article class="board-card">
          <div class="board-role">NITI AAYOG</div>
          <h3>${ORG.darpanId}</h3>
          <p>Listed on NITI Aayog Darpan portal. All annual filings up to date.</p>
        </article>
      </div>
    </div>
  </section>

  <!-- INTERVIEW CTA -->
  <section class="final-cta">
    <div class="wrap">
      <div data-reveal style="text-align:center;">
        <div class="kicker"><span class="mono accent">FOR INTERVIEW REQUESTS</span></div>
        <h2 style="font-size: clamp(40px, 6vw, 84px); line-height: 1; letter-spacing: -2.5px; margin: 12px 0 18px;">
          Talk to a <em style="color: var(--accent);">human.</em>
        </h2>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: 18px; color: var(--ink-3); margin-bottom: 28px;">
          We respond to media requests within 24 hours.
        </p>
        <div style="display:flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
          <a href="mailto:${ORG.email}?subject=Press%20enquiry%20-%20B%20The%20Change" class="btn btn--ink btn--lg">Email ${ORG.email}</a>
          <a href="${waLink('Hi, I am a journalist with a press enquiry for B The Change Welfare Society.')}" target="_blank" rel="noopener" class="btn btn--accent btn--lg">WhatsApp ${ORG.whatsappDisplay}</a>
        </div>
      </div>
    </div>
  </section>

</main>

${footer('')}
${authModal}
${scripts}
<script>
document.querySelectorAll('.press-copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const block = btn.parentElement;
    const text = block.querySelector('p').innerText;
    try {
      await navigator.clipboard.writeText(text);
      window.btcToast && window.btcToast('Copied to clipboard.', 'success', 2500);
    } catch (_) {
      window.btcToast && window.btcToast('Copy failed. Select manually.', 'error');
    }
  });
});
</script>`;

// ============================================================================
// CHANGEMAKER AWARDS 2026 — event page + nomination form
// ============================================================================
const AWARDS = {
  title: 'ChangeMaker Awards 2026',
  subtitle: 'Celebrating 10 Years of Transforming Lives',
  date: '24 May 2026 (Sunday)',
  venue: 'Tech Mahindra Auditorium, Madhapur, Hyderabad',
  tagline: 'Honouring ordinary people creating extraordinary change.',
  partners: [
    { role: 'ORGANIZER', name: 'B The Change Welfare Society' },
    { role: 'MEDIA PARTNER', name: 'Kaizer News' },
    { role: 'TECHNOLOGY PARTNER', name: 'Microsoft' },
    { role: 'VENUE PARTNER', name: 'Tech Mahindra' },
  ],
  timeline: [
    { time: '4:00 PM', label: 'Registration & Networking' },
    { time: '5:00 PM', label: 'Welcome & Lamp Lighting Ceremony' },
    { time: '5:20 PM', label: 'Keynote Address' },
    { time: '5:40 PM', label: "Screening — B The Change's two-decade journey" },
    { time: '6:00 PM', label: 'Award Ceremony' },
    { time: '6:45 PM', label: 'Cultural Performance' },
  ],
  categories: [
    { id: 'digital-empowerment', name: 'Digital Empowerment Award', desc: 'For work expanding digital literacy and access for underserved communities.' },
    { id: 'education-excellence', name: 'Education Excellence Award', desc: 'For teachers, educators, and schools transforming classroom learning for first-generation learners.' },
    { id: 'women-empowerment', name: 'Women Empowerment Award', desc: 'For grassroots impact on women hygiene, livelihood, safety, and leadership.' },
    { id: 'environmental-guardian', name: 'Environmental Guardian Award', desc: 'For outstanding work on lakes, biodiversity, and climate action.' },
    { id: 'animal-welfare', name: 'Animal Welfare & Wildlife Award', desc: 'For rescue, rehabilitation, and conservation work for stray animals and wildlife.' },
    { id: 'social-justice-legal', name: 'Social Justice & Legal Aid Award', desc: 'For pro-bono advocacy and access to justice for the marginalised.' },
    { id: 'youth-leadership', name: 'Youth Leadership Award', desc: 'For young people leading change in their schools and communities.' },
    { id: 'community-service', name: 'Community Service Excellence Award', desc: 'For sustained, on-the-ground community work over multiple years.' },
    { id: 'healthcare-organ', name: 'Healthcare & Organ Donation Award', desc: 'For impact on public health, organ donation awareness, or medical access.' },
    { id: 'sports-social-change', name: 'Sports for Social Change Award', desc: 'For coaches, athletes, and programs using sport to drive inclusion and youth development.' },
    { id: 'csr-impact', name: 'CSR Impact Award', desc: 'For corporates whose CSR programs have measurable, audited social impact.' },
    { id: 'media-social-change', name: 'Media for Social Change Award', desc: 'For journalism and media that amplifies social impact stories with rigour.' },
    { id: 'lifetime-achievement', name: 'Lifetime Achievement Award', desc: 'Highest honour. For a lifetime of dedicated service to civil society.' },
  ],
};

const awardsPage = () => `${head({ title: 'ChangeMaker Awards 2026 · B The Change', desc: 'Honouring ordinary people creating extraordinary change. ChangeMaker Awards 2026 on 24 May at Tech Mahindra Auditorium, Hyderabad. 52 awards across 13 categories. Self and third-party nominations open.', css: 'assets/style.css', ogImage: 'assets/bthechange-logo.png' })}
${announcement('')}
${header({ rel: '', activeNav: 'awards' })}

<main id="main">

  <!-- HERO -->
  <section class="awards-hero">
    <div class="wrap">
      <div class="awards-hero-inner" data-reveal>
        <div class="kicker"><span class="mono accent">B THE CHANGE WELFARE SOCIETY · ${AWARDS.subtitle.toUpperCase()}</span></div>
        <h1 class="awards-hero-h1">
          ChangeMaker<br /><em style="font-family: var(--font-serif); font-style: italic; color: var(--accent);">Awards 2026.</em>
        </h1>
        <p class="awards-hero-lede">${AWARDS.tagline}</p>
        <div class="awards-meta">
          <div><div class="awards-meta-lbl">DATE</div><div class="awards-meta-val">${AWARDS.date}</div></div>
          <div><div class="awards-meta-lbl">VENUE</div><div class="awards-meta-val">${AWARDS.venue}</div></div>
          <div><div class="awards-meta-lbl">AWARDS</div><div class="awards-meta-val">52 across 13 categories</div></div>
        </div>
        <div class="hero-cta" style="margin-top: 28px;">
          <a href="awards-nominate.html" class="btn btn--accent btn--lg">Submit a nomination <span class="arrow">→</span></a>
          <a href="assets/reports/btc-changemaker-awards-2026.pdf" target="_blank" rel="noopener" class="btn btn--ink btn--lg">Download brochure (PDF)</a>
        </div>
      </div>
    </div>
  </section>

  <!-- PARTNERS STRIP -->
  <section class="section">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">PRESENTED BY</span></div>
        <h2>Built with <em>partners</em> who care.</h2>
      </div>
      <div class="awards-partners" data-reveal>
        ${AWARDS.partners.map(p => `<div class="awards-partner-tile"><div class="awards-partner-role">${p.role}</div><div class="awards-partner-name">${p.name}</div></div>`).join('')}
      </div>
    </div>
  </section>

  <!-- CATEGORIES -->
  <section class="section muted">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">13 CATEGORIES · 52 AWARDS</span></div>
        <h2>What we're <em>looking for.</em></h2>
        <p style="font-family:var(--font-serif); font-style:italic; font-size:18px; color:var(--ink-3); max-width:54ch; margin:0;">
          Open to individuals, NGOs, corporates, and media organisations from across India. Both self-nominations and third-party nominations are accepted. Across 13 categories, we will honour <strong style="color: var(--ink); font-style: normal;">52 ChangeMakers</strong> in total: one Winner and three Finalists per category.
        </p>
      </div>
      <div class="awards-categories" data-reveal>
        ${AWARDS.categories.map((c, i) => `
        <article class="award-card${c.id === 'lifetime-achievement' ? ' award-card--lifetime' : ''}">
          <div class="award-card-num">${String(i+1).padStart(2,'0')}</div>
          <h3>${c.name}</h3>
          <p>${c.desc}</p>
          ${c.id === 'lifetime-achievement' ? '<div class="award-card-tag">HIGHEST HONOUR</div>' : ''}
        </article>`).join('')}
      </div>
      <div style="text-align:center; margin-top: 32px;">
        <a href="awards-nominate.html" class="btn btn--accent btn--lg">Nominate now <span class="arrow">→</span></a>
      </div>
    </div>
  </section>

  <!-- EVENT TIMELINE -->
  <section class="section">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <div class="kicker"><span class="mono accent">EVENT TIMELINE · ${AWARDS.date.toUpperCase()}</span></div>
        <h2>The <em>evening</em> in detail.</h2>
      </div>
      <div class="awards-timeline" data-reveal>
        ${AWARDS.timeline.map(t => `
        <div class="awards-tl-row">
          <div class="awards-tl-time">${t.time}</div>
          <div class="awards-tl-dot"></div>
          <div class="awards-tl-label">${t.label}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- FINAL CTA -->
  <section class="final-cta">
    <div class="wrap">
      <div data-reveal style="text-align:center;">
        <div class="kicker"><span class="mono" style="color: var(--ink);">NOMINATIONS OPEN · CLOSING SOON</span></div>
        <h2 class="awards-final-h2">
          Know a <em>ChangeMaker?</em>
        </h2>
        <p class="awards-final-lede">
          Self-nominations and third-party nominations both welcome. Tell us about the work, the impact, and the person behind it.
        </p>
        <div style="display:flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
          <a href="awards-nominate.html" class="btn btn--ink btn--lg">Submit a nomination <span class="arrow">→</span></a>
          <a href="${waLink('Hi, I have a question about the ChangeMaker Awards 2026.')}" target="_blank" rel="noopener" class="btn btn--secondary btn--lg" style="background: var(--paper); color: var(--ink); border-color: var(--paper);">Ask a question</a>
        </div>
      </div>
    </div>
  </section>

</main>

${footer('')}
${authModal}
${scripts}`;

// =================================== NOMINATE PAGE ==========================
const awardsNominatePage = () => `${head({ title: 'Submit a nomination · ChangeMaker Awards 2026', desc: 'Self and third-party nominations open. Tell us about a ChangeMaker doing extraordinary work in your community.', css: 'assets/style.css' })}
${announcement('')}
${header({ rel: '', activeNav: 'awards' })}

<main id="main">

  <section class="hero" style="padding: clamp(20px, 4vw, 40px) 0 clamp(24px, 4vw, 44px); border-bottom: 1px solid var(--line);">
    <div class="wrap">
      <div data-reveal>
        <div class="kicker"><span class="mono accent">CHANGEMAKER AWARDS 2026 · NOMINATIONS</span></div>
        <h1 class="hero-h1" style="font-size: clamp(34px, 5.5vw, 72px); line-height: 1; margin: 12px 0 16px;">
          Tell us about a <em style="color: var(--accent);">ChangeMaker.</em>
        </h1>
        <p style="font-family: var(--font-serif); font-style: italic; font-size: clamp(15px, 1.3vw, 19px); line-height: 1.55; color: var(--ink-3); max-width: 60ch;">
          Open to individuals, NGOs, corporates, and media organisations from across India. Both self-nominations and third-party nominations are accepted. Our jury reviews every entry. Strong nominations include specific impact, dates, and verifiable references.
        </p>
        <div style="margin-top:18px;">
          <a href="awards.html" style="font-family: var(--font-mono); font-size: 12px; color: var(--ink-3); text-decoration: underline;">← Back to award details</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap" style="max-width: 760px;">
      <form id="nomination-form" class="submit-form" data-reveal>

        <div class="nom-step-label"><span class="mono accent">STEP 01 OF 04 · WHO IS NOMINATING</span></div>
        <div class="form-row">
          <label class="form-label">Nomination type <span class="req">*</span></label>
          <div class="radio-row" role="radiogroup">
            <label class="radio-pill"><input type="radio" name="nomination_type" value="self" required /> <span>Self-nomination</span></label>
            <label class="radio-pill"><input type="radio" name="nomination_type" value="third_party" /> <span>Third-party nomination</span></label>
          </div>
        </div>
        <div class="form-row form-row--2">
          <div>
            <label class="form-label">Your name <span class="req">*</span></label>
            <input type="text" name="nominator_name" required maxlength="80" placeholder="Priya Sharma" />
          </div>
          <div>
            <label class="form-label">Your email <span class="req">*</span></label>
            <input type="email" name="nominator_email" required maxlength="120" placeholder="you@example.com" />
          </div>
        </div>
        <div class="form-row form-row--2">
          <div>
            <label class="form-label">Phone / WhatsApp</label>
            <input type="tel" name="nominator_phone" maxlength="20" placeholder="+91 90009 35898" />
          </div>
          <div id="nominator-relation-wrap" style="display:none;">
            <label class="form-label">Your relationship to the nominee</label>
            <input type="text" name="nominator_relation" maxlength="80" placeholder="Colleague, friend, journalist..." />
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--line); margin: 28px 0;" />

        <div class="nom-step-label"><span class="mono accent">STEP 02 OF 04 · ABOUT THE NOMINEE</span></div>
        <div class="form-row form-row--2">
          <div>
            <label class="form-label">Nominee name <span class="req">*</span></label>
            <input type="text" name="nominee_name" required maxlength="120" placeholder="Person, organisation, or company" />
          </div>
          <div>
            <label class="form-label">Nominee type <span class="req">*</span></label>
            <select name="nominee_type" required>
              <option value="">Select one</option>
              <option value="individual">Individual</option>
              <option value="ngo">NGO</option>
              <option value="corporate">Corporate / CSR</option>
              <option value="media">Media organisation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-row form-row--2">
          <div>
            <label class="form-label">Nominee city / state <span class="req">*</span></label>
            <input type="text" name="nominee_location" required maxlength="80" placeholder="Hyderabad, Telangana" />
          </div>
          <div>
            <label class="form-label">Nominee email or phone</label>
            <input type="text" name="nominee_contact" maxlength="120" placeholder="for verification (optional)" />
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Brief about the nominee <span class="req">*</span></label>
          <textarea name="nominee_brief" required maxlength="600" rows="3" placeholder="Who they are, what they do, where they operate. 600 characters max."></textarea>
        </div>

        <hr style="border: none; border-top: 1px solid var(--line); margin: 28px 0;" />

        <div class="nom-step-label"><span class="mono accent">STEP 03 OF 04 · THE WORK &amp; THE IMPACT</span></div>
        <div class="form-row form-row--2">
          <div>
            <label class="form-label">Award category <span class="req">*</span></label>
            <select name="category" required>
              <option value="">Select category</option>
              ${AWARDS.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Year(s) of the work <span class="req">*</span></label>
            <input type="text" name="work_years" required maxlength="40" placeholder="e.g., 2022-2025" />
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Describe the work and the change it created <span class="req">*</span></label>
          <textarea name="work_description" required maxlength="2500" rows="6" placeholder="What did they do? What changed because of it? Be specific. Numbers help: people reached, hours given, places served, money raised. 2,500 characters max."></textarea>
          <div class="char-count"><span id="work-count">0</span> / 2500</div>
        </div>
        <div class="form-row form-row--2">
          <div>
            <label class="form-label">People / lives impacted</label>
            <input type="text" name="impact_count" maxlength="60" placeholder="e.g., 500 children, 50 villages" />
          </div>
          <div>
            <label class="form-label">Geographic reach</label>
            <input type="text" name="impact_reach" maxlength="60" placeholder="e.g., Telangana, Pan-India, UK chapter" />
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid var(--line); margin: 28px 0;" />

        <div class="nom-step-label"><span class="mono accent">STEP 04 OF 04 · EVIDENCE &amp; REFERENCES</span></div>
        <div class="form-row">
          <label class="form-label">Supporting links</label>
          <textarea name="supporting_links" maxlength="800" rows="3" placeholder="Press articles, social media, organisation website, video coverage. One link per line."></textarea>
        </div>
        <div class="form-row">
          <label class="form-label">Reference (optional)</label>
          <input type="text" name="reference_contact" maxlength="200" placeholder="Name and email of someone the jury can verify with" />
        </div>
        <div class="form-row">
          <label class="form-label">Photo (optional, max 5MB)</label>
          <div class="file-drop">
            <input type="file" id="nom-file" accept="image/*" />
            <label for="nom-file" class="file-drop-label"><span class="mono">CLICK TO UPLOAD</span> · jpg / png · 5MB max</label>
            <div class="file-drop-preview" id="nom-file-preview"></div>
          </div>
        </div>

        <div class="form-row">
          <label class="form-checkbox">
            <input type="checkbox" name="consent" required />
            <span>I confirm the information is accurate and I consent to the jury contacting me or the nominee for verification. <span class="req">*</span></span>
          </label>
        </div>

        ${'<div class="form-row"><div class="h-captcha-wrap"><div id="hcap"></div></div></div>'}

        <div class="form-foot">
          <button type="submit" class="btn btn--accent btn--lg" id="nom-submit">
            <span class="btn-text">Submit nomination <span class="arrow">→</span></span>
            <span class="btn-loading" style="display:none;">Submitting...</span>
          </button>
          <p class="form-disclaimer">Our jury reviews every entry. We respond within 7 days. Shortlisted nominees may be contacted for additional context.</p>
        </div>

        <div id="nom-result" style="display:none;"></div>
      </form>
    </div>
  </section>

</main>

${footer('')}
${authModal}
${scripts}

<script>
(async function() {
  if (!window.SUPABASE_CONFIG || !window.supabase) return;
  const SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

  const form = document.getElementById('nomination-form');
  const submitBtn = document.getElementById('nom-submit');
  const result = document.getElementById('nom-result');
  const fileInput = document.getElementById('nom-file');
  const filePreview = document.getElementById('nom-file-preview');
  const workField = form.querySelector('textarea[name="work_description"]');
  const workCount = document.getElementById('work-count');

  // Show "relationship" only when third-party
  form.querySelectorAll('input[name="nomination_type"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('nominator-relation-wrap').style.display = (r.value === 'third_party' && r.checked) ? '' : 'none';
    });
  });

  workField.addEventListener('input', () => { workCount.textContent = workField.value.length; });

  // hCaptcha (only if configured)
  let captchaWidgetId = null;
  if (window.HCAPTCHA_SITE_KEY) {
    const s = document.createElement('script');
    s.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
    s.async = true; s.defer = true;
    s.onload = () => {
      captchaWidgetId = window.hcaptcha.render('hcap', { sitekey: window.HCAPTCHA_SITE_KEY });
    };
    document.head.appendChild(s);
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      window.btcToast && window.btcToast('Image too large. Maximum 5MB.', 'error');
      fileInput.value = '';
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => { filePreview.innerHTML = '<img src="' + ev.target.result + '" alt="Preview of nomination photo" />'; filePreview.style.display = 'block'; };
    r.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (window.HCAPTCHA_SITE_KEY && captchaWidgetId !== null) {
      const tok = window.hcaptcha.getResponse(captchaWidgetId);
      if (!tok) { window.btcToast && window.btcToast('Please complete the captcha.', 'error'); return; }
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'inline';

    try {
      let imageUrl = null;
      const file = fileInput.files[0];
      if (file) {
        const fileName = Date.now() + '-' + Math.random().toString(36).substring(2, 9) + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const { data: upload, error: upErr } = await SB.storage.from('submission-images').upload(fileName, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = SB.storage.from('submission-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const fd = new FormData(form);
      const payload = {
        nomination_type: fd.get('nomination_type'),
        nominator_name: fd.get('nominator_name').trim(),
        nominator_email: fd.get('nominator_email').trim(),
        nominator_phone: fd.get('nominator_phone')?.trim() || null,
        nominator_relation: fd.get('nominator_relation')?.trim() || null,
        nominee_name: fd.get('nominee_name').trim(),
        nominee_type: fd.get('nominee_type'),
        nominee_location: fd.get('nominee_location').trim(),
        nominee_contact: fd.get('nominee_contact')?.trim() || null,
        nominee_brief: fd.get('nominee_brief').trim(),
        category: fd.get('category'),
        work_years: fd.get('work_years').trim(),
        work_description: fd.get('work_description').trim(),
        impact_count: fd.get('impact_count')?.trim() || null,
        impact_reach: fd.get('impact_reach')?.trim() || null,
        supporting_links: fd.get('supporting_links')?.trim() || null,
        reference_contact: fd.get('reference_contact')?.trim() || null,
        image_url: imageUrl,
      };

      const { error } = await SB.from('award_nominations').insert(payload);
      if (error) throw error;

      form.style.display = 'none';
      result.className = 'submit-success';
      result.innerHTML = '<div class="submit-success-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'
        + '<div class="kicker"><span class="mono accent">NOMINATION RECEIVED</span></div>'
        + '<h2 style="font-size: clamp(28px, 4vw, 44px); line-height: 1.05; margin: 8px 0 16px;">Thank you, <em style="color: var(--accent);">' + payload.nominator_name.split(' ')[0] + '.</em></h2>'
        + '<p style="font-family: var(--font-serif); font-style: italic; font-size: 17px; line-height: 1.55; color: var(--ink-3); max-width: 52ch; margin: 0 0 24px;">Your nomination of <strong>' + payload.nominee_name + '</strong> for the <strong>' + (document.querySelector('select[name=category] option[value="' + payload.category + '"]').textContent) + '</strong> is in our jury queue. We will respond within 7 days. Shortlisted entries may be contacted for additional context at <strong>' + payload.nominator_email + '</strong>.</p>'
        + '<div style="display: flex; gap: 12px; flex-wrap: wrap;"><a href="awards.html" class="btn btn--ink">Back to awards</a><a href="awards-nominate.html" class="btn btn--secondary">Nominate someone else</a></div>';
      result.style.display = 'block';
      window.btcToast && window.btcToast('Nomination submitted. Jury responds within 7 days.', 'success');
      window.scrollTo({ top: result.offsetTop - 100, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      window.btcToast && window.btcToast('Could not submit: ' + (err.message || err), 'error');
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').style.display = 'inline';
      submitBtn.querySelector('.btn-loading').style.display = 'none';
    }
  });
})();
</script>`;

console.log('Writing index.html...');
fs.writeFileSync(path.join(OUT, 'index.html'), homepage());

console.log('Writing 404.html...');
fs.writeFileSync(path.join(OUT, '404.html'), notFoundPage());

console.log('Writing press.html...');
fs.writeFileSync(path.join(OUT, 'press.html'), pressPage());

console.log('Writing awards.html...');
fs.writeFileSync(path.join(OUT, 'awards.html'), awardsPage());

console.log('Writing awards-nominate.html...');
fs.writeFileSync(path.join(OUT, 'awards-nominate.html'), awardsNominatePage());

console.log('Writing about.html...');
fs.writeFileSync(path.join(OUT, 'about.html'), aboutPage());

console.log('Writing team.html...');
fs.writeFileSync(path.join(OUT, 'team.html'), teamPage());

console.log('Writing submit.html...');
fs.writeFileSync(path.join(OUT, 'submit.html'), submitPage());

console.log('Writing admin.html...');
fs.writeFileSync(path.join(OUT, 'admin.html'), adminPage());

console.log('Writing blog.html...');
fs.writeFileSync(path.join(OUT, 'blog.html'), blogPage());

console.log('Writing blog-write.html...');
fs.writeFileSync(path.join(OUT, 'blog-write.html'), blogWritePage());

console.log('Writing blog-post.html...');
fs.writeFileSync(path.join(OUT, 'blog-post.html'), blogPostPage());

console.log('Writing my.html...');
fs.writeFileSync(path.join(OUT, 'my.html'), myPage());

console.log('Writing program detail pages...');
PROGRAMS.forEach((p, i) => {
  fs.writeFileSync(path.join(OUT, 'programs', `${p.slug}.html`), programPage(p, i));
  console.log(`  ✓ programs/${p.slug}.html`);
});

console.log('Writing program support pages...');
PROGRAMS.forEach((p, i) => {
  fs.writeFileSync(path.join(OUT, 'programs', p.slug, 'support.html'), supportPage(p, i));
  console.log(`  ✓ programs/${p.slug}/support.html`);
});

console.log('\nDone. Total files:', 13 + PROGRAMS.length * 2);  // 13 root + 22 program-related = 35
