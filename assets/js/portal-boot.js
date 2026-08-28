(function () {
  const page = document.body.dataset.page;
  const publicPages = ['login', 'reset-password', 'membership-status'];
  const pageScriptMap = {
    dashboard: 'dashboard.js',
    points: 'points.js',
    'earn-points': 'claims.js',
    directory: 'directory.js',
    profile: 'profile.js',
    refer: 'referrals.js',
    rewards: 'rewards.js',
    membership: 'membership.js',
    'admin-dashboard': 'admin.js',
    'admin-members': 'admin.js',
    'admin-claims': 'admin.js',
    'admin-referrals': 'admin.js',
    'admin-rewards': 'admin.js',
    'admin-events': 'admin.js',
    'admin-audit': 'admin.js'
  };

  const load = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.append(script);
  });

  async function boot() {
    try {
      await load('/assets/js/mock-data.js');
      if (window.SHEEO_CONFIG?.MOCK_MODE !== true && !String(window.SHEEO_CONFIG?.SUPABASE_URL || '').startsWith('__')) {
        await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      }
      await load('/assets/js/supabase-client.js');
      await load('/assets/js/utils.js');
      await load('/assets/js/api.js');
      await load('/assets/js/auth.js');

      if (publicPages.includes(page)) {
        await load('/assets/js/auth-page.js');
        return window.SheeoAuthPage.mount(page);
      }

      window.SheeoPages = {};
      await load('/assets/js/route-guard.js');
      await load('/assets/js/portal-shell.js');
      await load(`/assets/js/${pageScriptMap[page] || 'dashboard.js'}`);
      await window.SheeoPortal.mount();
    } catch (error) {
      const root = document.getElementById('portal-root');
      if (root) root.innerHTML = `<main style="padding:40px;font-family:system-ui"><h1>Portal unavailable</h1><p>${String(error.message || error)}</p></main>`;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
