(function () {
  const U = window.SheeoUtils;
  const activities = [
    { type: 'welcome', points: 50, title: 'Membership activation', description: 'Awarded automatically once per active membership period.', icon: 'gem', action: null, note: 'Automatic' },
    { type: 'referral', points: 20, title: 'Successful founder referral', description: 'Awarded after the referred founder is approved and activated.', icon: 'user-plus', href: '/portal/refer.html', note: 'Share link' },
    { type: 'collaboration', points: 10, title: 'Member collaboration', description: 'Submit evidence of a completed collaboration for admin review.', icon: 'handshake', action: 'collaboration', note: 'Submit claim' },
    { type: 'event', points: 5, title: 'SheEO event attendance', description: 'Awarded from an approved attendance list or secure event check-in.', icon: 'calendar-check', action: null, note: 'Automatic' },
    { type: 'meetup', points: 5, title: '1-on-1 member meetup', description: 'Submit the meetup date, member and private evidence for review.', icon: 'coffee', action: 'meetup', note: 'Submit claim' }
  ];

  function claimModal(type, members) {
    const title = type === 'collaboration' ? 'Submit collaboration' : 'Claim a member meetup';
    return `
      <div class="portal-modal-backdrop" data-modal>
        <section class="portal-modal" role="dialog" aria-modal="true" aria-labelledby="claim-title">
          <div class="portal-modal-head"><div><p class="portal-kicker">Admin-reviewed claim</p><h2 id="claim-title">${title}</h2></div><button class="portal-modal-close" type="button" data-close-modal aria-label="Close"><i data-lucide="x"></i></button></div>
          <form id="claim-form" class="portal-form-grid">
            <input type="hidden" name="claim_type" value="${type}">
            <div class="portal-field"><label for="activity-date">Activity date</label><input class="portal-input" id="activity-date" name="activity_date" type="date" max="${new Date().toISOString().slice(0, 10)}" required></div>
            <div class="portal-field"><label for="related-member">Related member</label><select class="portal-select" id="related-member" name="related_member_id" required><option value="">Select a member</option>${members.map((member) => `<option value="${member.id}">${U.escapeHtml(member.full_name)} · ${U.escapeHtml(member.business_name)}</option>`).join('')}</select></div>
            <div class="portal-field portal-span-full"><label for="claim-description">What happened?</label><textarea class="portal-textarea" id="claim-description" name="description" maxlength="750" placeholder="Briefly describe the completed activity and outcome." required></textarea></div>
            <div class="portal-field portal-span-full"><label for="claim-evidence">Private evidence</label><input class="portal-input" id="claim-evidence" name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required><small>JPG, PNG, WebP or PDF · maximum 10 MB. Evidence remains private to you and authorized admins.</small></div>
            <div class="portal-span-full admin-alert">Submitting creates a pending claim only. Points are awarded through protected approval logic after evidence review.</div>
            <div class="portal-span-full button-row" style="justify-content:flex-end"><button class="portal-button secondary" type="button" data-close-modal>Cancel</button><button class="portal-button" type="submit">Submit for review</button></div>
          </form>
        </section>
      </div>`;
  }

  window.SheeoPages['earn-points'] = async ({ root }) => {
    const [claims, members] = await Promise.all([window.SheeoApi.getClaims(), window.SheeoApi.getMembers()]);

    root.innerHTML = `
      <section class="portal-card rose">
        <div class="card-head"><div><p class="portal-kicker">How it works</p><h2>Participate. Submit when needed. Earn after approval.</h2><p>Automated activities have no self-award button. Proof-based claims are reviewed by the SheEO team.</p></div></div>
      </section>
      <section class="earn-grid" style="margin-top:20px">
        ${activities.map((activity) => `
          <article class="earn-card">
            <div style="display:flex;justify-content:space-between;align-items:center"><div class="metric-icon"><i data-lucide="${activity.icon}"></i></div><span class="earn-value">+${activity.points} points</span></div>
            <h3>${activity.title}</h3><p>${activity.description}</p>
            <div class="button-row">${activity.action ? `<button class="portal-button small" data-open-claim="${activity.action}">${activity.note}</button>` : activity.href ? `<a class="portal-button secondary small" href="${activity.href}">${activity.note}</a>` : `<span class="status-pill">${activity.note}</span>`}</div>
          </article>`).join('')}
      </section>
      <section class="portal-card" style="margin-top:20px">
        <div class="card-head"><div><h2>My claims</h2><p>Track pending, approved and rejected proof-based activities.</p></div></div>
        <div class="portal-table-wrap">
          <table class="portal-table"><thead><tr><th>Submitted</th><th>Activity</th><th>Date</th><th>Status</th><th>Decision note</th></tr></thead>
          <tbody id="claims-body">${claims.map((claim) => `<tr><td>${U.formatDate(claim.created_at)}</td><td><strong>${U.statusLabel(claim.claim_type)}</strong></td><td>${U.formatDate(claim.activity_date)}</td><td><span class="status-pill ${claim.status}">${U.statusLabel(claim.status)}</span></td><td>${U.escapeHtml(claim.rejection_reason || '—')}</td></tr>`).join('')}</tbody></table>
        </div>
      </section>`;

    const closeModal = () => {
      root.querySelector('[data-modal]')?.remove();
      document.body.classList.remove('portal-locked');
    };
    const openModal = (type) => {
      root.insertAdjacentHTML('beforeend', claimModal(type, members.filter((member) => member.id !== 'user-sadhna')));
      document.body.classList.add('portal-locked');
      U.renderIcons();
      const modal = root.querySelector('[data-modal]');
      modal.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', closeModal));
      modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
      modal.querySelector('#claim-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = form.querySelector('button[type="submit"]');
        const file = form.evidence.files[0];
        if (file && file.size > 10 * 1024 * 1024) return U.toast('Evidence must be 10 MB or smaller.', 'error');
        U.setBusy(button, true, 'Submitting…');
        try {
          const formData = new FormData(form);
          const related = members.find((member) => member.id === formData.get('related_member_id'));
          const evidencePath = await window.SheeoApi.uploadClaimEvidence(file);
          const claim = await window.SheeoApi.submitClaim({
            claim_type: formData.get('claim_type'),
            activity_date: formData.get('activity_date'),
            related_member_id: formData.get('related_member_id'),
            related_member: related?.full_name || '',
            description: formData.get('description'),
            evidence_path: evidencePath
          });
          root.querySelector('#claims-body').insertAdjacentHTML('afterbegin', `<tr><td>${U.formatDate(claim.created_at)}</td><td><strong>${U.statusLabel(claim.claim_type)}</strong></td><td>${U.formatDate(claim.activity_date)}</td><td><span class="status-pill pending">Pending</span></td><td>—</td></tr>`);
          closeModal();
          U.toast('Claim submitted for private admin review.');
        } catch (error) {
          U.toast(error.message || 'Claim submission failed.', 'error');
          U.setBusy(button, false);
        }
      });
    };

    root.querySelectorAll('[data-open-claim]').forEach((button) => button.addEventListener('click', () => openModal(button.dataset.openClaim)));
    const requested = new URLSearchParams(window.location.search).get('claim');
    if (['meetup', 'collaboration'].includes(requested)) openModal(requested);
    U.renderIcons();
  };
})();
