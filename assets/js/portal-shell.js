(function () {
  const U = window.SheeoUtils;

  const memberNavigation = [
    ['dashboard', 'Dashboard', 'layout-dashboard', '/portal/dashboard.html'],
    ['points', 'My Points', 'sparkles', '/portal/points.html'],
    ['earn-points', 'Earn Points', 'badge-plus', '/portal/earn-points.html'],
    ['directory', 'Member Directory', 'users', '/portal/directory.html'],
    ['profile', 'My Profile', 'circle-user-round', '/portal/profile.html'],
    ['refer', 'Refer a Founder', 'send', '/portal/refer.html'],
    ['rewards', 'Rewards', 'gift', '/portal/rewards.html'],
    ['membership', 'Membership', 'gem', '/portal/membership.html']
  ];

  const adminNavigation = [
    ['admin-dashboard', 'Overview', 'layout-dashboard', '/portal/admin/index.html'],
    ['admin-members', 'Members', 'users', '/portal/admin/members.html'],
    ['admin-claims', 'Point Claims', 'badge-check', '/portal/admin/claims.html'],
    ['admin-referrals', 'Referrals', 'send', '/portal/admin/referrals.html'],
    ['admin-rewards', 'Rewards', 'gift', '/portal/admin/rewards.html'],
    ['admin-events', 'Events', 'calendar-days', '/portal/admin/events.html'],
    ['admin-audit', 'Audit Log', 'scroll-text', '/portal/admin/audit.html']
  ];

  const pageMeta = {
    dashboard: ['Member home', 'Welcome back, <em>{firstName}</em>', 'Your membership, points and next best actions at a glance.'],
    points: ['Points ledger', 'My SheEO <em>Points</em>', 'Every award, deduction and refund in your current membership period.'],
    'earn-points': ['Participation', 'Earn <em>Points</em>', 'See eligible activities and submit proof-based claims for review.'],
    directory: ['Community', 'Member <em>Directory</em>', 'Find active SheEO founders by name, business, service or category.'],
    profile: ['Your presence', 'My <em>Profile</em>', 'Keep your business information current and choose what appears in the directory.'],
    refer: ['Grow together', 'Refer a <em>Founder</em>', 'Share your unique link and follow each referral without exposing private applicant details.'],
    rewards: ['Celebrate progress', 'SheEO <em>Rewards</em>', 'Redeem 100 points for an eligible experience or founder feature.'],
    membership: ['Plan & access', 'My <em>Membership</em>', 'Review your current status, term dates and included benefits.'],
    'admin-dashboard': ['Admin portal', 'Operations <em>Overview</em>', 'Review member activity, approval queues and recent protected actions.'],
    'admin-members': ['Admin portal', 'Member <em>Management</em>', 'Search active members and review membership status.'],
    'admin-claims': ['Admin portal', 'Point <em>Claims</em>', 'Review submitted evidence before any points are awarded.'],
    'admin-referrals': ['Admin portal', 'Referral <em>Queue</em>', 'Track qualification, rewards and promotional obligations.'],
    'admin-rewards': ['Admin portal', 'Reward <em>Fulfillment</em>', 'Approve, schedule and fulfill member redemption requests.'],
    'admin-events': ['Admin portal', 'Events & <em>Attendance</em>', 'Manage attendance-based points without browser-side awards.'],
    'admin-audit': ['Admin portal', 'System <em>Audit</em>', 'Inspect protected membership, points and approval actions.']
  };

  function renderNav(items, currentPage) {
    return items.map(([id, label, icon, href]) => `
      <a href="${href}" ${id === currentPage ? 'aria-current="page"' : ''}>
        <i data-lucide="${icon}" aria-hidden="true"></i><span>${label}</span>
      </a>`).join('');
  }

  window.SheeoPortal = {
    session: null,
    page: null,
    isAdmin: false,

    async mount() {
      this.page = document.body.dataset.page;
      this.isAdmin = document.body.dataset.admin === 'true';
      this.session = await window.SheeoRouteGuard.requireMember({ admin: this.isAdmin });
      if (!this.session) return;

      const profile = this.session.profile || {};
      const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'Member';
      const [kicker, titleTemplate, subtitle] = pageMeta[this.page] || pageMeta.dashboard;
      const title = titleTemplate.replace('{firstName}', U.escapeHtml(firstName));
      const navigation = this.isAdmin ? adminNavigation : memberNavigation;

      document.getElementById('portal-root').innerHTML = `
        <div class="portal-shell">
          <aside class="portal-sidebar" aria-label="${this.isAdmin ? 'Admin' : 'Member'} navigation">
            <a class="portal-brand" href="${this.isAdmin ? '/portal/admin/index.html' : '/portal/dashboard.html'}">
              <img src="/sh-logo.jpeg" alt="SheEO">
              <span><strong>SheEO</strong><small>${this.isAdmin ? 'Admin Portal' : 'Member Portal'}</small></span>
            </a>
            <nav class="portal-nav">
              <p class="portal-nav-label">${this.isAdmin ? 'Operations' : 'Membership'}</p>
              ${renderNav(navigation, this.page)}
              ${this.isAdmin ? `<p class="portal-nav-label">Account</p><a href="/portal/dashboard.html"><i data-lucide="arrow-left"></i><span>Member view</span></a>` : (this.session.admin_role ? `<p class="portal-nav-label">Team</p><a href="/portal/admin/index.html"><i data-lucide="shield-check"></i><span>Admin portal</span></a>` : '')}
            </nav>
            <div class="portal-sidebar-foot">
              <div class="portal-user">
                <div class="portal-avatar">${profile.profile_photo_path ? `<img src="${U.escapeHtml(profile.profile_photo_path)}" alt="">` : U.initials(profile.full_name)}</div>
                <div><strong>${U.escapeHtml(profile.full_name || 'SheEO Member')}</strong><small>${U.escapeHtml(profile.business_name || this.session.user.email)}</small></div>
              </div>
              <button class="portal-button secondary small" data-action="logout" style="width:100%; margin-top:14px; color:#fff; border-color:rgba(255,255,255,.25)"><i data-lucide="log-out"></i> Sign out</button>
            </div>
          </aside>
          <button class="mobile-overlay" aria-label="Close navigation" data-action="close-nav"></button>
          <main class="portal-main">
            <header class="portal-topbar">
              <div>
                <p class="portal-kicker">${kicker}</p>
                <h1 class="portal-page-title">${title}</h1>
                <p class="portal-subtitle">${subtitle}</p>
              </div>
              <div class="portal-top-actions">
                <button class="portal-icon-button" aria-label="Notifications"><i data-lucide="bell"></i></button>
                <button class="portal-menu-button" data-action="open-nav" aria-label="Open navigation"><i data-lucide="menu"></i></button>
              </div>
            </header>
            ${window.SheeoApi.isMock() ? `<div class="mock-banner"><span><strong>Preview mode:</strong> using mock member data until Supabase is connected.</span><span class="status-pill pending">Mock</span></div>` : ''}
            <div id="portal-content" aria-live="polite"><div class="portal-card"><div class="empty-state"><i data-lucide="loader-circle"></i><h3>Loading</h3><p>Preparing your portal view…</p></div></div></div>
          </main>
        </div>`;

      document.addEventListener('click', (event) => {
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (action === 'open-nav') document.body.classList.add('portal-nav-open');
        if (action === 'close-nav') document.body.classList.remove('portal-nav-open');
        if (action === 'logout') window.SheeoAuth.logout();
      });

      U.renderIcons();
      const renderer = window.SheeoPages?.[this.page];
      if (!renderer) return this.showError(new Error(`No renderer registered for ${this.page}.`));
      try { await renderer({ session: this.session, root: document.getElementById('portal-content') }); }
      catch (error) { this.showError(error); }
    },

    showError(error) {
      const root = document.getElementById('portal-content');
      if (!root) return;
      root.innerHTML = `<div class="portal-card"><div class="empty-state"><i data-lucide="triangle-alert"></i><h3>We couldn't load this page</h3><p>${U.escapeHtml(error?.message || 'Please try again.')}</p><div class="button-row"><button class="portal-button" onclick="window.location.reload()">Try again</button></div></div></div>`;
      U.renderIcons();
    }
  };
})();
