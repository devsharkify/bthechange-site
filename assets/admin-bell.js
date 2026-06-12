/* User dropdown menu + admin notification bell.
   Runs on every page. Shows user menu when signed in (Share story, My submissions, Sign out).
   For admins, additionally shows Admin link with live pending count via Supabase Realtime + browser notifications. */
(async function() {
  if (!window.SUPABASE_CONFIG || !window.supabase) return;
  const SB = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

  const userMenu = document.getElementById('hdr-user-menu');
  const userBtn = document.getElementById('hdr-user-btn');
  const userDropdown = document.getElementById('hdr-user-dropdown');
  const userPip = document.getElementById('hdr-user-pip');
  const signinLink = document.getElementById('hdr-signin-link');
  const adminItem = document.getElementById('hdr-dropdown-admin');
  const adminCount = document.getElementById('hdr-dropdown-count');
  const signoutBtn = document.getElementById('hdr-signout');

  const mobileUserLinks = document.querySelectorAll('.hdr-user-mobile-link');
  const mobileAdminLink = document.querySelector('.hdr-admin-mobile-link');
  const mobileAdminCount = document.getElementById('hdr-admin-mobile-count');
  const mobileSigninLink = document.querySelector('.nav-signin-mobile');
  const mobileSignoutLink = document.getElementById('hdr-signout-mobile');

  // 1. Auth check
  const { data: { session } } = await SB.auth.getSession();
  if (!session) return;

  // 2. Signed in: swap Sign in for user menu
  if (signinLink) signinLink.style.display = 'none';
  if (userMenu) userMenu.style.display = 'inline-flex';
  if (mobileSigninLink) mobileSigninLink.style.display = 'none';
  mobileUserLinks.forEach(l => l.style.display = '');

  // Dropdown toggle
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = userDropdown.classList.toggle('is-open');
      userBtn.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target)) {
        userDropdown.classList.remove('is-open');
        userBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  async function doSignOut(e) {
    if (e) e.preventDefault();
    await SB.auth.signOut();
    window.location.reload();
  }
  if (signoutBtn) signoutBtn.addEventListener('click', doSignOut);
  if (mobileSignoutLink) mobileSignoutLink.addEventListener('click', doSignOut);

  // 3. Admin check
  const { data: adm } = await SB.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();

  // 3b. Role check (separate from admin) — drives any role-gated UI in future
  let userRole = 'volunteer';
  let displayName = '';
  try {
    const { data: prof } = await SB.from('profiles').select('role, display_name').eq('user_id', session.user.id).maybeSingle();
    if (prof?.role) userRole = prof.role;
    if (prof?.display_name) displayName = prof.display_name;
    if (adm) userRole = 'admin';
  } catch (_) {}
  document.documentElement.setAttribute('data-user-role', userRole);
  // Hide any element with [data-role-only="x"] when current role doesn't match
  document.querySelectorAll('[data-role-only]').forEach(el => {
    const allowed = el.dataset.roleOnly.split(',').map(s => s.trim());
    if (!allowed.includes(userRole)) el.style.display = 'none';
  });

  // Inject "My Console" link into the desktop dropdown (non-admin users)
  if (userRole !== 'admin') {
    const dropdown = document.getElementById('hdr-user-dropdown');
    if (dropdown) {
      // Compute path prefix back to site root (handles pages in subdirectories)
      const pathParts = window.location.pathname.split('/');
      pathParts.pop(); // remove filename
      const depth = pathParts.filter(p => p && p !== '').length;
      const rootPrefix = depth > 0 ? '../'.repeat(depth) : '';
      const consoleUrl = rootPrefix + 'console/index.html';
      const consoleLabels = { kid: 'My Student Portal', volunteer: 'My Volunteer Console', partner: 'My Console', beneficiary: 'My Console' };
      const consoleLabel = consoleLabels[userRole] || 'My Console';
      const link = document.createElement('a');
      link.href = consoleUrl;
      link.setAttribute('role', 'menuitem');
      link.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> ' + consoleLabel;
      // Insert after the first link (Share story) as second item
      const firstLink = dropdown.querySelector('a');
      if (firstLink && firstLink.nextSibling) {
        dropdown.insertBefore(link, firstLink.nextSibling);
      } else if (firstLink) {
        firstLink.after(link);
      }
    }
  }

  if (!adm) return;

  // 4. Reveal admin items, load count
  if (adminItem) adminItem.style.display = '';
  if (mobileAdminLink) mobileAdminLink.style.display = '';
  await refreshCount();

  // 5. Live subscription
  SB.channel('admin-bell-' + Math.random())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, async (payload) => {
      await refreshCount();
      if (payload.eventType === 'INSERT' && payload.new && payload.new.status === 'pending') {
        showBrowserNotification(payload.new);
      }
    })
    .subscribe();

  if ('Notification' in window && Notification.permission === 'default') {
    document.addEventListener('click', requestNotificationPermissionOnce, { once: true });
  }

  async function refreshCount() {
    const { count } = await SB.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const c = count || 0;
    const display = c > 99 ? '99+' : String(c);
    if (adminCount) {
      adminCount.textContent = display;
      adminCount.style.display = c > 0 ? '' : 'none';
    }
    if (mobileAdminCount) mobileAdminCount.textContent = c > 0 ? '(' + display + ')' : '';
    if (userPip) userPip.style.display = c > 0 ? '' : 'none';
  }

  function requestNotificationPermissionOnce() {
    if (Notification.permission === 'default') Notification.requestPermission();
  }

  function showBrowserNotification(sub) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification('New submission to review', {
      body: (sub.submitter_name || 'Someone') + ' shared a story for ' + (sub.program_slug || 'a program'),
      icon: '/assets/bthechange-logo.png',
      tag: 'btc-submission-' + sub.id,
    });
    n.onclick = () => {
      window.focus();
      window.location.href = '/admin.html';
      n.close();
    };
  }
})();
