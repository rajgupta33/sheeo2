window.SHEEO_CONFIG = Object.freeze({
  SUPABASE_URL: 'https://enhqizscchxjttkyorcj.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_lqNTeZ3HNP175mCdWqKM3g_Q3FsItA3',
  MOCK_MODE: false,
  PUBLIC_SITE_ORIGIN: 'https://sheeo-summit.com',
  PORTAL_ORIGIN: 'https://members.sheeo-summit.com'
});

(function configureRoutes() {
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  const isLocal = window.location.protocol === 'file:' || localHosts.has(window.location.hostname);
  const localOrigin = window.location.protocol === 'file:' ? '' : window.location.origin;
  const publicOrigin = isLocal ? localOrigin : window.SHEEO_CONFIG.PUBLIC_SITE_ORIGIN;
  const portalOrigin = isLocal ? localOrigin : window.SHEEO_CONFIG.PORTAL_ORIGIN;

  const normalize = (path) => `/${String(path || '').replace(/^\/+/, '')}`;
  window.SheeoRoutes = Object.freeze({
    public(path = '/') { return `${publicOrigin}${normalize(path)}`; },
    portal(path = 'login.html') {
      const cleanPath = normalize(path).replace(/^\/portal\/?/, '').replace(/^\/+/, '');
      return `${portalOrigin}/portal/${cleanPath}`;
    },
    isPortalHost: window.location.hostname === 'members.sheeo-summit.com'
  });

  const publicHosts = new Set(['sheeo-summit.com', 'www.sheeo-summit.com']);
  if (publicHosts.has(window.location.hostname) && window.location.pathname.startsWith('/portal/')) {
    window.location.replace(`${portalOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`);
  }
})();

// Only the browser-safe publishable/anon key belongs here.
// Never add the Supabase service-role or secret key to frontend files.
