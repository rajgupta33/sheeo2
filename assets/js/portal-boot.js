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

    const appleTitle = document.createElement('meta');
    appleTitle.name = 'apple-mobile-web-app-title';
    appleTitle.content = 'SheEO';
    document.head.append(appleTitle);

    const appleStatusBar = document.createElement('meta');
    appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
    appleStatusBar.content = 'default';
    document.head.append(appleStatusBar);

    let installPrompt = null;

    const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: minimal-ui)').matches
      || window.navigator.standalone === true;

    // Safari on iOS never fires beforeinstallprompt, so a prompt-only button is
    // invisible forever on iPhone/iPad. Detect the platform and fall back to the
    // manual Add-to-Home-Screen steps for anything that cannot prompt.
    const platform = () => {
      const agent = navigator.userAgent;
      const isApple = /iPad|iPhone|iPod/.test(agent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isApple) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(agent) ? 'ios-browser' : 'ios-safari';
      if (/Android/.test(agent)) return 'android';
      return 'desktop';
    };

    const INSTALL_STEPS = {
      'ios-safari': {
        title: 'Add SheEO to your Home Screen',
        steps: [
          'Tap the Share button in Safari — the square with an arrow pointing up.',
          'Scroll down the share list and tap "Add to Home Screen".',
          'Tap "Add". SheEO now opens full screen, just like a normal app.'
        ]
      },
      'ios-browser': {
        title: 'Open this page in Safari first',
        steps: [
          'On iPhone and iPad, only Safari can add an app to the Home Screen.',
          'Tap your browser’s menu and choose "Open in Safari".',
          'In Safari, tap Share, then "Add to Home Screen".'
        ]
      },
      android: {
        title: 'Install the SheEO member app',
        steps: [
          'Tap your browser’s menu button — the three dots at the top right.',
          'Tap "Install app", or "Add to Home screen" if you do not see it.',
          'Confirm, and SheEO installs like any other Android app.'
        ]
      },
      desktop: {
        title: 'Install the SheEO member app',
        steps: [
          'Look for the install icon at the right-hand end of the address bar.',
          'Or open the browser menu and choose "Install SheEO Member Portal".',
          'The portal then opens in its own window, without browser tabs.'
        ]
      }
    };

    function showInstallHelp() {
      const guide = INSTALL_STEPS[platform()] || INSTALL_STEPS.desktop;
      const dialog = document.createElement('dialog');
      dialog.className = 'portal-modal';
      dialog.style.border = '0';
      dialog.innerHTML = `<div class="portal-modal-head"><div><p class="portal-kicker">Member app</p><h2>${guide.title}</h2></div><button class="portal-modal-close" type="button" aria-label="Close">Close</button></div><ol class="pwa-steps">${guide.steps.map((step) => `<li>${step}</li>`).join('')}</ol>`;
      document.body.append(dialog);
      dialog.querySelector('.portal-modal-close').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => dialog.remove(), { once: true });
      dialog.showModal();
    }

    // beforeinstallprompt can fire before a page renders its button, so buttons
    // sync themselves on mount rather than waiting only for the event.
    const syncInstallButtons = () => {
      const installed = isInstalled();
      document.querySelectorAll('[data-pwa-install]').forEach((button) => { button.hidden = installed; });
    };

    window.SheeoPwa = {
      get canInstall() { return Boolean(installPrompt); },
      isInstalled,
      platform,
      syncInstallButtons,
      async install() {
        if (!installPrompt) {
          showInstallHelp();
          return false;
        }
        installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') installPrompt = null;
        syncInstallButtons();
        return choice.outcome === 'accepted';
      }
    };
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-pwa-install]')) window.SheeoPwa.install();
    });

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      installPrompt = event;
      syncInstallButtons();
    });
    window.addEventListener('appinstalled', () => {
      installPrompt = null;
      syncInstallButtons();
    });
    window.matchMedia('(display-mode: standalone)').addEventListener('change', syncInstallButtons);

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
