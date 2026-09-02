(function () {
  const U = window.SheeoUtils;

  const metricCard = (label, value, icon, note, href) => `<article class="portal-card metric-card"><div style="display:flex;justify-content:space-between"><span class="metric-label">${label}</span><div class="metric-icon"><i data-lucide="${icon}"></i></div></div><div><div class="metric-value">${value}</div><p class="metric-note">${note}</p>${href ? `<a href="${href}" style="font-size:10px;color:var(--portal-burgundy);font-weight:700">Open queue →</a>` : ''}</div></article>`;

  function claimRows(claims) {
    return claims.map((claim) => `<tr data-claim-row="${claim.id}"><td><strong>${U.escapeHtml(claim.member_name || claim.user_id)}</strong></td><td>${U.statusLabel(claim.claim_type)}<br><small style="color:var(--portal-muted)">${U.formatDate(claim.activity_date)}</small></td><td>${U.escapeHtml(claim.related_member || '—')}</td><td><span class="status-pill ${claim.status}">${U.statusLabel(claim.status)}</span></td><td>${claim.status === 'pending' ? `<div style="display:flex;gap:6px"><button class="portal-button small" data-review-claim="${claim.id}" data-decision="approved">Approve</button><button class="portal-button secondary small" data-review-claim="${claim.id}" data-decision="rejected">Reject</button></div>` : U.escapeHtml(claim.rejection_reason || 'Reviewed')}</td></tr>`).join('');
  }

  async function renderOverview(root) {
    const data = await window.SheeoApi.getAdminOverview();
    root.innerHTML = `
      <div class="admin-alert">All point awards, membership changes and reward deductions must run through protected server-side functions. This preview never treats hidden controls as authorization.</div>
      <section class="portal-grid portal-grid-4" style="margin-top:20px">
        ${metricCard('Active members', data.activeMembers, 'users', 'Current active membership periods', '/portal/admin/members.html')}
        ${metricCard('Applications', data.pendingApplications, 'inbox', 'Pending curated review', '/portal/admin/members.html')}
        ${metricCard('Point claims', data.pendingClaims, 'badge-check', 'Need evidence review', '/portal/admin/claims.html')}
        ${metricCard('Referrals', data.pendingReferrals, 'send', 'Captured or qualifying', '/portal/admin/referrals.html')}
        ${metricCard('Redemptions', data.pendingRedemptions, 'gift', 'Requested or scheduled', '/portal/admin/rewards.html')}
        ${metricCard('Upcoming events', data.upcomingEvents, 'calendar-days', 'Published or draft', '/portal/admin/events.html')}
      </section>
      <section class="portal-grid portal-grid-2" style="margin-top:20px">
        <article class="portal-card"><div class="card-head"><div><h2>Pending applications</h2><p>Curated application review queue.</p></div><span class="queue-count">${data.pendingApplications}</span></div><div class="activity-list">${data.applications.filter((item) => item.status === 'pending').map((item) => `<div class="activity-row"><div class="activity-icon"><i data-lucide="user-round"></i></div><div class="activity-copy"><strong>${U.escapeHtml(item.full_name)}</strong><small>${U.escapeHtml(item.business_name)} · ${U.escapeHtml(item.category)}</small></div><span class="status-pill pending">Pending</span></div>`).join('')}</div></article>
        <article class="portal-card"><div class="card-head"><div><h2>Recent protected actions</h2><p>Audit trail summary.</p></div><a href="/portal/admin/audit.html" style="font-size:10px;color:var(--portal-burgundy);font-weight:700">View all</a></div><div class="activity-list">${data.auditLog.slice(0, 4).map((item) => `<div class="activity-row"><div class="activity-icon"><i data-lucide="shield-check"></i></div><div class="activity-copy"><strong>${U.statusLabel(item.action)}</strong><small>${U.escapeHtml(item.actor)} · ${U.escapeHtml(item.target)}</small></div><small style="color:var(--portal-muted)">${U.formatDate(item.created_at)}</small></div>`).join('')}</div></article>
      </section>`;
  }

  function applicationRow(item) {
    const actionCell = item.status === 'pending'
      ? `<div style="display:flex;gap:6px"><button class="portal-button small" data-review-application="${item.id}" data-decision="approved">Approve</button><button class="portal-button secondary small" data-review-application="${item.id}" data-decision="rejected">Reject</button></div>`
      : U.escapeHtml(item.review_notes || 'Reviewed');
    return `<tr data-application-row="${item.id}"><td><strong>${U.escapeHtml(item.full_name)}</strong><br><small>${U.escapeHtml(item.email)}</small></td><td>${U.escapeHtml(item.business_name)}</td><td>${U.escapeHtml(item.category)}</td><td>${U.formatDate(item.created_at)}</td><td><span class="status-pill ${item.status}">${U.statusLabel(item.status)}</span></td><td>${actionCell}</td></tr>`;
  }

  async function renderMembers(root) {
    const [members, applications] = await Promise.all([window.SheeoApi.getAdminMembers(), window.SheeoApi.getApplications()]);
    root.innerHTML = `
      <section class="portal-card"><div class="toolbar"><div class="search-field"><i data-lucide="search"></i><input class="portal-input" id="admin-member-search" type="search" placeholder="Search members"></div><button class="portal-button secondary small" disabled>Invite member</button></div>
      <div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Member</th><th>Business</th><th>Category</th><th>Status</th><th>Action</th></tr></thead><tbody id="admin-member-rows">${members.map((member) => `<tr data-member-search="${U.escapeHtml(`${member.full_name} ${member.business_name} ${member.category}`.toLowerCase())}"><td><strong>${U.escapeHtml(member.full_name)}</strong></td><td>${U.escapeHtml(member.business_name)}</td><td>${U.escapeHtml(member.category)}</td><td><span class="status-pill ${member.status}">${U.statusLabel(member.status)}</span></td><td><button class="portal-button secondary small" disabled>View detail</button></td></tr>`).join('')}</tbody></table></div></section>
      <section class="portal-card" style="margin-top:20px"><div class="card-head"><div><h2>Membership applications</h2><p>Approving activates membership, awards welcome points and pays out any referral automatically.</p></div><span class="queue-count">${applications.filter((item) => item.status === 'pending').length}</span></div><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Applicant</th><th>Business</th><th>Category</th><th>Submitted</th><th>Status</th><th>Decision</th></tr></thead><tbody id="application-review-body">${applications.map(applicationRow).join('')}</tbody></table></div></section>`;
    root.querySelector('#admin-member-search').addEventListener('input', (event) => {
      const query = event.target.value.trim().toLowerCase();
      root.querySelectorAll('[data-member-search]').forEach((row) => { row.hidden = query && !row.dataset.memberSearch.includes(query); });
    });
    root.querySelector('#application-review-body').addEventListener('click', async (event) => {
      const button = event.target.closest('[data-review-application]');
      if (!button) return;
      const decision = button.dataset.decision;
      let reason = '';
      if (decision === 'rejected') {
        reason = window.prompt('Rejection reason (shown to the applicant if they have a portal account):', 'Thank you for applying — we are not able to approve this application right now.') || '';
        if (!reason.trim()) return U.toast('A rejection reason is required.', 'error');
      }
      const row = button.closest('tr');
      row.querySelectorAll('button').forEach((item) => { item.disabled = true; });
      try {
        const result = decision === 'approved'
          ? await window.SheeoApi.approveApplication(button.dataset.reviewApplication)
          : await window.SheeoApi.rejectApplication(button.dataset.reviewApplication, reason.trim());
        row.querySelector('td:nth-child(5)').innerHTML = `<span class="status-pill ${result.status}">${U.statusLabel(result.status)}</span>`;
        row.querySelector('td:nth-child(6)').textContent = result.review_notes || 'Reviewed';
        U.toast(decision === 'approved' ? 'Application approved. Membership activated and welcome points awarded.' : 'Application rejected.');
      } catch (error) {
        row.querySelectorAll('button').forEach((item) => { item.disabled = false; });
        U.toast(error.message || 'Application review failed.', 'error');
      }
    });
  }

  async function renderClaims(root) {
    const claims = await window.SheeoApi.getClaims({ all: true });
    root.innerHTML = `<section class="portal-card"><div class="card-head"><div><h2>Evidence review queue</h2><p>Approval invokes atomic server logic; evidence must remain private.</p></div><span class="queue-count">${claims.filter((item) => item.status === 'pending').length}</span></div><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Member</th><th>Claim</th><th>Related member</th><th>Status</th><th>Decision</th></tr></thead><tbody id="claim-review-body">${claimRows(claims)}</tbody></table></div></section>`;
    root.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-review-claim]');
      if (!button) return;
      const decision = button.dataset.decision;
      let reason = '';
      if (decision === 'rejected') {
        reason = window.prompt('Rejection reason (required):', 'Please provide clearer evidence of the completed activity.') || '';
        if (!reason.trim()) return U.toast('A rejection reason is required.', 'error');
      }
      const row = button.closest('tr');
      row.querySelectorAll('button').forEach((item) => { item.disabled = true; });
      try {
        const claim = await window.SheeoApi.reviewClaim(button.dataset.reviewClaim, decision, reason.trim());
        row.querySelector('td:nth-child(4)').innerHTML = `<span class="status-pill ${claim.status}">${U.statusLabel(claim.status)}</span>`;
        row.querySelector('td:nth-child(5)').textContent = claim.rejection_reason || 'Reviewed';
        U.toast(`Claim ${decision}. ${decision === 'approved' ? 'The protected award function is the only path that may add points.' : 'No points were awarded.'}`);
      } catch (error) {
        row.querySelectorAll('button').forEach((item) => { item.disabled = false; });
        U.toast(error.message || 'Claim review failed.', 'error');
      }
    });
  }

  async function renderReferrals(root) {
    const referrals = await window.SheeoApi.getReferrals({ all: true });
    root.innerHTML = `<section class="portal-card"><div class="card-head"><div><h2>Referral qualification</h2><p>Reward only after approved and activated/paid membership.</p></div></div><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Founder</th><th>Email</th><th>Captured</th><th>Status</th><th>Points</th><th>Story entitlement</th></tr></thead><tbody>${referrals.map((item) => `<tr><td><strong>${U.escapeHtml(item.founder_name)}</strong></td><td>${U.escapeHtml(item.referred_email)}</td><td>${U.formatDate(item.created_at)}</td><td><span class="status-pill ${item.status}">${U.statusLabel(item.status)}</span></td><td>${item.points ? `+${item.points}` : '—'}</td><td>${item.status === 'rewarded' ? '<span class="status-pill pending">Pending scheduling</span>' : '—'}</td></tr>`).join('')}</tbody></table></div></section>`;
  }

  async function renderRewards(root) {
    const { redemptions } = await window.SheeoApi.getRewards();
    root.innerHTML = `<section class="portal-card"><div class="card-head"><div><h2>Reward fulfillment</h2><p>Cancellation must create a +100 refund; never delete the original deduction.</p></div><span class="queue-count">${redemptions.filter((item) => ['requested', 'approved', 'scheduled'].includes(item.status)).length}</span></div><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Member</th><th>Reward</th><th>Requested</th><th>Cost</th><th>Status</th><th>Action</th></tr></thead><tbody>${redemptions.map((item) => `<tr><td>${U.escapeHtml(item.member_name || 'Unknown member')}</td><td><strong>${U.escapeHtml(item.reward_name || item.rewards?.name || 'Reward')}</strong></td><td>${U.formatDate(item.requested_at)}</td><td>-${item.points_cost}</td><td><span class="status-pill ${item.status}">${U.statusLabel(item.status)}</span></td><td><button class="portal-button secondary small" disabled>Open</button></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty-state"><h3>No redemption requests</h3><p>New protected redemption requests will appear here.</p></div></td></tr>'}</tbody></table></div></section>`;
  }

  async function renderEvents(root) {
    const events = await window.SheeoApi.getEvents();
    root.innerHTML = `<section class="portal-card"><div class="card-head"><div><h2>Events & attendance</h2><p>One attendance award per member per event, enforced server-side.</p></div><button class="portal-button small" disabled>Create event</button></div><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Status</th><th>Points</th><th>Attendance</th></tr></thead><tbody>${events.map((item) => `<tr><td><strong>${U.escapeHtml(item.title)}</strong></td><td>${U.formatDate(item.event_date)}</td><td>${U.escapeHtml(item.venue)}</td><td><span class="status-pill ${item.status}">${U.statusLabel(item.status)}</span></td><td>${item.points_enabled ? `+${item.attendance_points}` : 'Off'}</td><td><button class="portal-button secondary small" disabled>Manage</button></td></tr>`).join('')}</tbody></table></div></section><div class="admin-alert" style="margin-top:20px">QR check-in remains optional for MVP. The primary launch path supports admin-approved attendance lists.</div>`;
  }

  async function renderAudit(root) {
    const audit = await window.SheeoApi.getAuditLog();
    root.innerHTML = `<section class="portal-card"><div class="card-head"><div><h2>Recent admin actions</h2><p>Immutable operational trace for sensitive changes.</p></div></div><div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead><tbody>${audit.map((item) => `<tr><td>${U.formatDate(item.created_at, { hour: '2-digit', minute: '2-digit' })}</td><td><strong>${U.escapeHtml(item.actor)}</strong></td><td>${U.statusLabel(item.action)}</td><td>${U.escapeHtml(item.target)}</td></tr>`).join('')}</tbody></table></div></section>`;
  }

  // Every renderer writes `data-lucide` placeholders into the page, so icons have
  // to be drawn once the markup is in the DOM.
  const withIcons = (render) => async ({ root }) => {
    await render(root);
    U.renderIcons();
  };

  Object.assign(window.SheeoPages, {
    'admin-dashboard': withIcons(renderOverview),
    'admin-members': withIcons(renderMembers),
    'admin-claims': withIcons(renderClaims),
    'admin-referrals': withIcons(renderReferrals),
    'admin-rewards': withIcons(renderRewards),
    'admin-events': withIcons(renderEvents),
    'admin-audit': withIcons(renderAudit)
  });
})();
