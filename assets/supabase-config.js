// =============================================================================
// SUPABASE + hCAPTCHA CONFIG
// Replace placeholder values with your actual keys before deploying.
// =============================================================================

window.SUPABASE_CONFIG = {
  url: 'https://mnqyqpateleshpnvhnvo.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucXlxcGF0ZWxlc2hwbnZobnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzQ0MTAsImV4cCI6MjA5NjgxMDQxMH0._h8aFy9_3KBXX0HKpUvbsc_F_WZwaW2y1JUMV5M54Uc',
};

// Authkey.io — SMS OTP via DLT-approved template
// IMPORTANT: rotate bedfc307ae476372 on https://authkey.io dashboard before going live
// Template: "Use {#otp#} as your OTP to access your {#company#}, OTP is confidential and valid for 5 mins"
window.AUTHKEY_CONFIG = {
  key:     'bedfc307ae476372',
  sid:     '35306',          // DLT template SID from Authkey dashboard
  company: 'B The Change',   // replaces {#company#} in the template
};

// Optional: hCaptcha for spam protection on submit form
// Get free site key: https://www.hcaptcha.com/ → Add Site → copy "Site key"
// Leave empty string to disable captcha (it will not render)
window.HCAPTCHA_SITE_KEY = '';

// Optional: NSFW image moderation (Sightengine, $0/month for 500 imgs)
// Get keys: https://sightengine.com/ → API → copy User + Secret
// Leave empty to disable auto-moderation (admin still reviews manually)
window.SIGHTENGINE_USER = '';
window.SIGHTENGINE_SECRET = '';
