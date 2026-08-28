(function () {
  const U = window.SheeoUtils;

  function storyMarkup() {
    return `
      <section class="auth-story">
        <a class="portal-brand" href="/">
          <img src="/sh-logo.jpeg" alt="SheEO">
          <span><strong>SheEO</strong><small>Business Network Dubai</small></span>
        </a>
        <div class="auth-quote">
          <p>Connections that move your business <em>forward.</em></p>
          <span>Visibility · Community · Collaboration</span>
        </div>
      </section>`;
  }

  const templates = {
    login: () => `
      <div class="auth-page">
        ${storyMarkup()}
        <section class="auth-panel">
          <div class="auth-card">
            <p class="portal-kicker">Member access</p>
            <h1>Welcome back</h1>
            <p>Sign in to see your SheEO Points, community and rewards.</p>
            <form class="auth-form" id="login-form">
              <div class="portal-field"><label for="email">Email address</label><input class="portal-input" id="email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
              <div class="portal-field"><label for="password">Password</label><input class="portal-input" id="password" name="password" type="password" autocomplete="current-password" placeholder="Your password" required></div>
              <p id="auth-error" role="alert" style="display:none;color:var(--portal-red);font-size:11px;margin:0"></p>
              <button class="portal-button" type="submit">Sign in</button>
            </form>
            <div class="auth-links"><a href="/portal/reset-password.html">Forgot password?</a><a href="/apply-directory/?type=membership">Apply for membership</a></div>
            ${window.SheeoApi.isMock() ? '<div class="auth-note"><strong>Preview mode:</strong> enter any email and password to open the member dashboard. No credentials are stored.</div>' : ''}
          </div>
        </section>
      </div>`,

    'reset-password': () => `
      <div class="auth-page">
        ${storyMarkup()}
        <section class="auth-panel">
          <div class="auth-card">
            <p class="portal-kicker">Account recovery</p>
            <h1>Reset password</h1>
            <p id="reset-intro">Enter your member email and we'll send secure reset instructions.</p>
            <form class="auth-form" id="reset-form">
              <div class="portal-field" data-reset-email><label for="reset-email">Email address</label><input class="portal-input" id="reset-email" type="email" autocomplete="email" required></div>
              <div data-new-password hidden>
                <div class="portal-field"><label for="new-password">New password</label><input class="portal-input" id="new-password" type="password" autocomplete="new-password" minlength="8"></div>
              </div>
              <p id="auth-error" role="alert" style="display:none;color:var(--portal-red);font-size:11px;margin:0"></p>
              <button class="portal-button" type="submit">Send reset instructions</button>
            </form>
            <div class="auth-links"><a href="/portal/login.html">Back to sign in</a></div>
          </div>
        </section>
      </div>`,

    'membership-status': () => `
      <div class="auth-page">
        ${storyMarkup()}
        <section class="auth-panel">
          <div class="auth-card">
            <p class="portal-kicker">Membership status</p>
            <h1>Your application is in progress</h1>
            <p>Member-only access opens once your application and membership activation are complete.</p>
            <div class="portal-card rose" style="box-shadow:none">
              <span class="status-pill pending">Pending review</span>
              <h2 style="font-family:'Playfair Display',serif;margin:16px 0 6px">What happens next?</h2>
              <p style="font-size:12px;color:var(--portal-muted);margin:0">The SheEO team will review your application and contact you with activation instructions. Your account history will remain available.</p>
            </div>
            <div class="button-row"><a class="portal-button" href="/">Return to website</a><a class="portal-button secondary" href="/connect-with-us/">Contact the team</a></div>
          </div>
        </section>
      </div>`
  };

  window.SheeoAuthPage = {
    mount(page) {
      document.getElementById('portal-root').innerHTML = templates[page]?.() || templates.login();
      U.renderIcons();
      if (page === 'login') this.bindLogin();
      if (page === 'reset-password') this.bindReset();
    },

    bindLogin() {
      const form = document.getElementById('login-form');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const error = document.getElementById('auth-error');
        error.style.display = 'none';
        U.setBusy(button, true, 'Signing in…');
        try {
          await window.SheeoAuth.login(form.email.value.trim(), form.password.value);
          const next = new URLSearchParams(window.location.search).get('next');
          if (next && next.startsWith('/portal/')) {
            window.location.href = next;
            return;
          }

          const session = await window.SheeoApi.getSession();
          if (['admin', 'super_admin'].includes(session?.admin_role)) {
            window.location.href = '/portal/admin/index.html';
          } else if (session?.membership?.status === 'active') {
            window.location.href = '/portal/dashboard.html';
          } else {
            window.location.href = '/portal/membership-status.html';
          }
        } catch (cause) {
          error.textContent = cause.message || 'Sign in failed. Check your details and try again.';
          error.style.display = 'block';
          U.setBusy(button, false);
        }
      });
    },

    bindReset() {
      const form = document.getElementById('reset-form');
      const updateMode = window.location.hash.includes('access_token') || new URLSearchParams(window.location.search).get('mode') === 'update';
      if (updateMode) {
        form.querySelector('[data-reset-email]').hidden = true;
        form.querySelector('[data-new-password]').hidden = false;
        form.querySelector('#new-password').required = true;
        form.querySelector('button').textContent = 'Update password';
        document.getElementById('reset-intro').textContent = 'Choose a new password with at least eight characters.';
      }
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const error = document.getElementById('auth-error');
        error.style.display = 'none';
        U.setBusy(button, true);
        try {
          if (updateMode) {
            await window.SheeoAuth.updatePassword(form.querySelector('#new-password').value);
            U.toast('Password updated. You can now sign in.');
            window.setTimeout(() => { window.location.href = '/portal/login.html'; }, 700);
          } else {
            await window.SheeoAuth.sendReset(form.querySelector('#reset-email').value.trim());
            form.innerHTML = '<div class="portal-card rose" style="box-shadow:none"><span class="status-pill approved">Email requested</span><h2 style="font-family:Playfair Display,serif">Check your inbox</h2><p style="font-size:12px;color:var(--portal-muted)">If that address belongs to an account, reset instructions are on the way.</p></div>';
          }
        } catch (cause) {
          error.textContent = cause.message || 'We could not process your request.';
          error.style.display = 'block';
          U.setBusy(button, false);
        }
      });
    }
  };
})();
