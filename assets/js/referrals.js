(function () {
  const U = window.SheeoUtils;
  window.SheeoPages.refer = async ({ root, session }) => {
    const referrals = await window.SheeoApi.getReferrals();
    const code = session.profile.referral_code;
    const link = `${window.location.origin}/apply-directory/?type=membership&ref=${encodeURIComponent(code)}`;
    const rewarded = referrals.filter((item) => item.status === 'rewarded').length;
    const pending = referrals.filter((item) => ['captured', 'pending', 'qualified'].includes(item.status)).length;

    root.innerHTML = `
      <section class="portal-grid portal-grid-3">
        <article class="portal-card rose portal-span-2">
          <div class="card-head"><div><p class="portal-kicker">Your referral link</p><h2>Invite a founder you believe in</h2><p>Points are awarded only after the founder is approved and activated.</p></div></div>
          <div class="referral-box"><code id="referral-link">${U.escapeHtml(link)}</code><button class="portal-button small" data-copy-link><i data-lucide="copy"></i> Copy link</button></div>
          <p style="font-size:10px;color:var(--portal-muted);margin:10px 0 0">Referral code: <strong>${U.escapeHtml(code)}</strong></p>
        </article>
        <article class="portal-card burgundy">
          <span class="metric-label" style="color:rgba(255,255,255,.64)">Successful referral</span>
          <div class="metric-value">+20</div>
          <p style="font-size:11px;color:rgba(255,255,255,.7)">points plus a one-week Instagram Story feature entitlement.</p>
        </article>
      </section>
      <section class="portal-grid portal-grid-3" style="margin-top:20px">
        <article class="portal-card metric-card"><div style="display:flex;justify-content:space-between"><span class="metric-label">Rewarded</span><div class="metric-icon"><i data-lucide="badge-check"></i></div></div><div><div class="metric-value">${rewarded}</div><p class="metric-note">Qualified and awarded once</p></div></article>
        <article class="portal-card metric-card"><div style="display:flex;justify-content:space-between"><span class="metric-label">In progress</span><div class="metric-icon"><i data-lucide="clock-3"></i></div></div><div><div class="metric-value">${pending}</div><p class="metric-note">Captured, pending or qualifying</p></div></article>
        <article class="portal-card metric-card"><div style="display:flex;justify-content:space-between"><span class="metric-label">Points earned</span><div class="metric-icon"><i data-lucide="sparkles"></i></div></div><div><div class="metric-value">${referrals.reduce((sum, item) => sum + (item.points || 0), 0)}</div><p class="metric-note">From successful referrals</p></div></article>
      </section>
      <section class="portal-card" style="margin-top:20px">
        <div class="card-head"><div><h2>Referral status</h2><p>Applicant information is intentionally limited for privacy.</p></div></div>
        <div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Founder</th><th>Captured</th><th>Status</th><th>Qualified</th><th>Points</th></tr></thead><tbody>
          ${referrals.map((item) => `<tr><td><strong>${U.escapeHtml(item.founder_name || item.referred_email)}</strong><br><small style="color:var(--portal-muted)">${U.escapeHtml(item.referred_email || '')}</small></td><td>${U.formatDate(item.created_at)}</td><td><span class="status-pill ${item.status}">${U.statusLabel(item.status)}</span></td><td>${U.formatDate(item.qualified_at)}</td><td class="${item.points ? 'points-positive' : ''}">${item.points ? `+${item.points}` : '—'}</td></tr>`).join('')}
        </tbody></table></div>
      </section>`;

    root.querySelector('[data-copy-link]').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(link);
        U.toast('Referral link copied.');
      } catch {
        const range = document.createRange();
        range.selectNode(root.querySelector('#referral-link'));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        U.toast('Link selected — copy it from your browser.');
      }
    });
    U.renderIcons();
  };
})();
