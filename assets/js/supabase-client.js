(function () {
  const config = window.SHEEO_CONFIG || {};
  const configured = Boolean(
    config.SUPABASE_URL &&
    config.SUPABASE_PUBLISHABLE_KEY &&
    !String(config.SUPABASE_URL).startsWith('__') &&
    !String(config.SUPABASE_PUBLISHABLE_KEY).startsWith('__')
  );

  window.SheeoSupabase = {
    configured,
    client: null,
    init() {
      if (!configured || !window.supabase?.createClient) return null;
      if (!this.client) {
        this.client = window.supabase.createClient(
          config.SUPABASE_URL,
          config.SUPABASE_PUBLISHABLE_KEY,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          }
        );
      }
      return this.client;
    }
  };
})();
