window.SheeoRouteGuard = {
  async requireMember({ admin = false } = {}) {
    const session = await window.SheeoApi.getSession();
    if (!session?.user) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`${window.SheeoRoutes.portal('login.html')}?next=${encodeURIComponent(next)}`);
      return null;
    }
    if (admin && !['admin', 'super_admin'].includes(session.admin_role)) {
      window.location.replace(`${window.SheeoRoutes.portal('dashboard.html')}?access=denied`);
      return null;
    }
    if (!admin && session.membership?.status !== 'active') {
      window.location.replace(window.SheeoRoutes.portal('membership-status.html'));
      return null;
    }
    return session;
  }
};
