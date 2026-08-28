(function () {
  const U = window.SheeoUtils;
  window.SheeoPages.membership = async ({ root }) => {
    const membership = await window.SheeoApi.getMembership();
    const benefits = [
      ['users', 'Curated founder community', 'Discover active members and build trusted business relationships.'],
      ['sparkles', 'SheEO Points & rewards', 'Earn through participation and redeem meaningful visibility or event benefits.'],
      ['megaphone', 'Founder visibility', 'Access community visibility opportunities and referral-led promotion.'],
      ['calendar-heart', 'Member experiences', 'Participate in SheEO events, meetups and collaborative activities.']
    ];
    root.innerHTML = `
      <section class="portal-grid portal-grid-3">
        <article class="portal-card burgundy portal-span-2">
          <div class="card-head"><div><p class="portal-kicker" style="color:#f1cad5">Current plan</p><h2>${U.escapeHtml(membership.plan_name)}</h2></div><span class="status-pill active">${U.statusLabel(membership.status)}</span></div>
          <div class="portal-grid portal-grid-3" style="margin-top:26px">
            <div><span class="metric-label" style="color:rgba(255,255,255,.6)">Starts</span><p style="font-family:'Playfair Display',serif;font-size:21px;margin:5px 0">${U.formatDate(membership.start_date)}</p></div>
            <div><span class="metric-label" style="color:rgba(255,255,255,.6)">Renews / ends</span><p style="font-family:'Playfair Display',serif;font-size:21px;margin:5px 0">${U.formatDate(membership.end_date)}</p></div>
            <div><span class="metric-label" style="color:rgba(255,255,255,.6)">Payment</span><p style="font-family:'Playfair Display',serif;font-size:21px;margin:5px 0">${U.statusLabel(membership.payment_status)}</p></div>
          </div>
        </article>
        <article class="portal-card rose">
          <span class="metric-label">Membership access</span>
          <div class="metric-value">Active</div>
          <p class="metric-note">Points are scoped to this membership period; earlier terms remain auditable.</p>
        </article>
      </section>
      <section class="portal-card" style="margin-top:20px">
        <div class="card-head"><div><h2>Included in your membership</h2><p>Built to support connection, participation and founder visibility.</p></div></div>
        <div class="quick-actions">${benefits.map(([icon, title, copy]) => `<div class="quick-action" style="cursor:default"><i data-lucide="${icon}"></i><div><strong>${title}</strong><span>${copy}</span></div></div>`).join('')}</div>
      </section>
      <section class="portal-card" style="margin-top:20px">
        <div class="card-head"><div><h2>Renewal</h2><p>Payment automation is intentionally outside the MVP launch dependency.</p></div><span class="status-pill pending">Manual for MVP</span></div>
        <p style="font-size:12px;color:var(--portal-muted);margin:0">The SheEO team will confirm renewal instructions before your current term ends. A renewal creates a new membership period and a fresh points balance without deleting this term's history.</p>
        <div class="button-row"><a class="portal-button secondary" href="/connect-with-us/">Ask about membership</a></div>
      </section>`;
    U.renderIcons();
  };
})();
