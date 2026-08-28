(function () {
  const U = window.SheeoUtils;
  window.SheeoPages.dashboard = async ({ root }) => {
    const data = await window.SheeoApi.getDashboard();
    const balance = data.balance;
    const progress = Math.min(100, Math.max(0, balance));
    const remaining = Math.max(0, 100 - balance);
    const activityRows = data.recentActivity.map((item) => `
      <div class="activity-row">
        <div class="activity-icon"><i data-lucide="${item.points < 0 ? 'gift' : item.transaction_type === 'referral' ? 'user-plus' : item.transaction_type === 'event' ? 'calendar-check' : 'sparkles'}"></i></div>
        <div class="activity-copy"><strong>${U.escapeHtml(item.description)}</strong><small>${U.formatDate(item.created_at)} · ${U.statusLabel(item.transaction_type)}</small></div>
        <span class="activity-points ${item.points < 0 ? 'negative' : ''}">${item.points > 0 ? '+' : ''}${item.points}</span>
      </div>`).join('');

    root.innerHTML = `
      <section class="portal-grid portal-grid-3">
        <article class="portal-card rose portal-span-2">
          <div class="points-hero">
            <div class="progress-ring" style="--value:${progress}" aria-label="${progress}% progress to next reward">
              <div class="progress-ring-value"><strong>${balance}</strong><span>of 100 points</span></div>
            </div>
            <div class="points-copy">
              <p class="portal-kicker">Your SheEO Points</p>
              <h2>${remaining > 0 ? `<span class="points-balance">${remaining} points</span> until your next reward` : 'Your next reward is ready'}</h2>
              <p>${remaining > 0 ? 'Keep connecting, collaborating and showing up for the community.' : 'Choose your reward and submit a secure redemption request.'}</p>
              <div class="button-row">
                <a class="portal-button" href="${remaining > 0 ? '/portal/earn-points.html' : '/portal/rewards.html'}">${remaining > 0 ? 'Earn more points' : 'View rewards'} <i data-lucide="arrow-right"></i></a>
                <a class="portal-button secondary" href="/portal/points.html">View full ledger</a>
              </div>
            </div>
          </div>
        </article>

        <article class="portal-card burgundy">
          <div class="card-head"><div><p class="portal-kicker" style="color:#f1cad5">Next reward</p><h2>Choose your moment</h2></div><i data-lucide="gift"></i></div>
          <p style="font-size:12px;color:rgba(255,255,255,.72)">At 100 points, choose 50% off an eligible SheEO event or a dedicated Instagram Reel feature.</p>
          <div class="button-row"><a class="portal-button light" href="/portal/rewards.html">Explore rewards</a></div>
        </article>
      </section>

      <section class="portal-grid portal-grid-3" style="margin-top:20px">
        <article class="portal-card portal-span-2">
          <div class="card-head"><div><h2>Ways to participate</h2><p>High-impact actions available to you now.</p></div></div>
          <div class="quick-actions">
            <a class="quick-action" href="/portal/earn-points.html?claim=meetup"><i data-lucide="coffee"></i><div><strong>Claim a meetup</strong><span>Submit for +5 points</span></div></a>
            <a class="quick-action" href="/portal/earn-points.html?claim=collaboration"><i data-lucide="handshake"></i><div><strong>Submit collaboration</strong><span>Submit for +10 points</span></div></a>
            <a class="quick-action" href="/portal/refer.html"><i data-lucide="send"></i><div><strong>Refer a founder</strong><span>Earn +20 when qualified</span></div></a>
            <a class="quick-action" href="/portal/directory.html"><i data-lucide="users"></i><div><strong>View directory</strong><span>Find your next connection</span></div></a>
          </div>
        </article>

        <article class="portal-card">
          <div class="card-head"><div><h3>Membership</h3><p>Current access period</p></div><span class="status-pill active">Active</span></div>
          <p class="metric-label">Annual membership</p>
          <p style="font-family:'Playfair Display',serif;font-size:24px;margin:7px 0">Through ${U.formatDate(data.session.membership.end_date)}</p>
          <p style="color:var(--portal-muted);font-size:11px;margin:0">Your member access and current-period points remain active until this date.</p>
          <div class="button-row"><a class="portal-button secondary small" href="/portal/membership.html">View membership</a></div>
        </article>
      </section>

      <section class="portal-grid portal-grid-3" style="margin-top:20px">
        <article class="portal-card portal-span-2">
          <div class="card-head"><div><h2>Recent activity</h2><p>Approved current-period ledger entries.</p></div><a href="/portal/points.html" style="font-size:11px;color:var(--portal-burgundy);font-weight:700">View all</a></div>
          <div class="activity-list">${activityRows || '<div class="empty-state"><h3>No activity yet</h3><p>Your point history will appear here.</p></div>'}</div>
        </article>
        <article class="portal-card">
          <div class="card-head"><div><h3>At a glance</h3><p>Current participation</p></div></div>
          <div class="activity-list">
            <div class="activity-row"><div class="activity-icon"><i data-lucide="clock-3"></i></div><div class="activity-copy"><strong>${data.pendingClaims} pending claim${data.pendingClaims === 1 ? '' : 's'}</strong><small>Awaiting admin review</small></div></div>
            <div class="activity-row"><div class="activity-icon"><i data-lucide="user-check"></i></div><div class="activity-copy"><strong>${data.referralsRewarded} qualified referral${data.referralsRewarded === 1 ? '' : 's'}</strong><small>Successfully rewarded</small></div></div>
          </div>
        </article>
      </section>`;
    U.renderIcons();
  };
})();
