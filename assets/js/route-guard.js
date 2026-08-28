window.SheeoRouteGuard = {
  async requireMember({ admin = false } = {}) {
    const session = await window.SheeoApi.getSession();
    if (!session?.user) {
      window.location.replace(`/portal/login.html?next=${encodeURIComponent(window.location.pathname)}`);
      return null;
    }
    if (admin && !['admin', 'super_admin'].includes(session.admin_role)) {
      window.location.replace('/portal/dashboard.html?access=denied');
      return null;
    }
    if (!admin && session.membership?.status !== 'active') {
      window.location.replace('/portal/membership-status.html');
      return null;
    }
    return session;
  }
};
