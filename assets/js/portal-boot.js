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

  function enablePwa() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && !viewport.content.includes('viewport-fit')) viewport.content += ',viewport-fit=cover';

    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/portal/manifest.webmanifest';
    document.head.append(manifest);

    const touchIcon = document.createElement('link');
    touchIcon.rel = 'apple-touch-icon';
    touchIcon.href = '/sh-logo.jpeg';
    document.head.append(touchIcon);

    const theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#7b203b';
    document.head.append(theme);

    const mobileCapable = document.createElement('meta');
    mobileCapable.name = 'apple-mobile-web-app-capable';
    mobileCapable.content = 'yes';
    document.head.append(mobileCapable);

    let installPrompt = null;
    window.SheeoPwa = {
      get canInstall() { return Boolean(installPrompt); },
      async install() {
        if (!installPrompt) return false;
        installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') installPrompt = null;
        document.querySelectorAll('[data-pwa-install]').forEach((button) => { button.hidden = !installPrompt; });
        return choice.outcome === 'accepted';
      }
    };
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-pwa-install]')) window.SheeoPwa.install();
    });

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      installPrompt = event;
      document.querySelectorAll('[data-pwa-install]').forEach((button) => { button.hidden = false; });
    });
    window.addEventListener('appinstalled', () => {
      installPrompt = null;
      document.querySelectorAll('[data-pwa-install]').forEach((button) => { button.hidden = true; });
    });

    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
      navigator.serviceWorker.register('/portal/sw.js', { scope: '/portal/' }).catch((error) => {
        console.warn('SheEO portal offline support could not start.', error);
      });
    }
  }

  async function boot() {
    try {
      enablePwa();
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
