window.SheeoAuth = {
  async login(email, password) { return window.SheeoApi.signIn(email, password); },
  async logout() {
    await window.SheeoApi.signOut();
    window.location.href = '/portal/login.html';
  },
  async sendReset(email) { return window.SheeoApi.requestPasswordReset(email); },
  async updatePassword(password) { return window.SheeoApi.updatePassword(password); }
};
