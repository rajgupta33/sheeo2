(function () {
  const U = window.SheeoUtils;
  window.SheeoPages.rewards = async ({ root }) => {
    const [{ rewards, redemptions }, transactions] = await Promise.all([
      window.SheeoApi.getRewards(),
      window.SheeoApi.getPointTransactions()
    ]);
    const realBalance = transactions.reduce((sum, item) => sum + item.points, 0);
    let displayBalance = realBalance;

    root.innerHTML = `
      <section class="portal-card rose">
        <div class="points-hero">
          <div class="progress-ring" id="reward-progress" style="--value:${Math.min(displayBalance, 100)}"><div class="progress-ring-value"><strong id="reward-balance">${displayBalance}</strong><span>available points</span></div></div>
          <div class="points-copy"><p class="portal-kicker">100-point threshold</p><h2 id="reward-heading">${displayBalance >= 100 ? 'Your reward is ready' : `${100 - displayBalance} points to go`}</h2><p>A redemption reserves and deducts 100 points atomically. If an approved cancellation occurs, a separate +100 refund preserves the full ledger history.</p>${window.SheeoApi.isMock() ? `<div class="portal-field" style="max-width:240px;margin-top:16px"><label for="reward-state">Preview balance state</label><select class="portal-select" id="reward-state">${[0, 50, 85, 100, 120].map((value) => `<option value="${value}" ${value === realBalance ? 'selected' : ''}>${value} points</option>`).join('')}</select><small>Visual QA only; does not change the mock ledger.</small></div>` : ''}</div>
        </div>
      </section>
      <section class="reward-grid" style="margin-top:20px">
        ${rewards.map((reward) => `<article class="reward-card"><div class="reward-icon"><i data-lucide="${reward.icon || 'gift'}"></i></div><h3>${U.escapeHtml(reward.name)}</h3><p>${U.escapeHtml(reward.description || reward.fulfillment_instructions || '')}</p><div class="reward-cost">${reward.points_cost} SheEO Points</div><button class="portal-button" data-redeem="${reward.id}" ${displayBalance < reward.points_cost ? 'disabled' : ''}>${displayBalance >= reward.points_cost ? 'Request reward' : 'Not enough points'}</button></article>`).join('')}
      </section>
      <section class="portal-card" style="margin-top:20px">
        <div class="card-head"><div><h2>Redemption history</h2><p>Requests, scheduling and fulfillment remain visible.</p></div></div>
        <div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Requested</th><th>Reward</th><th>Cost</th><th>Status</th><th>Fulfilled</th></tr></thead><tbody id="redemption-body">
          ${redemptions.length ? redemptions.map((item) => `<tr><td>${U.formatDate(item.requested_at)}</td><td><strong>${U.escapeHtml(item.reward_name || item.rewards?.name || 'SheEO Reward')}</strong></td><td class="points-negative">-${item.points_cost}</td><td><span class="status-pill ${item.status}">${U.statusLabel(item.status)}</span></td><td>${U.formatDate(item.fulfilled_at)}</td></tr>`).join('') : '<tr><td colspan="5"><div class="empty-state"><h3>No redemptions yet</h3><p>Your reward requests will appear here.</p></div></td></tr>'}
        </tbody></table></div>
      </section>`;

    const updateState = () => {
      root.querySelector('#reward-balance').textContent = displayBalance;
      root.querySelector('#reward-progress').style.setProperty('--value', Math.min(displayBalance, 100));
      root.querySelector('#reward-heading').textContent = displayBalance >= 100 ? 'Your reward is ready' : `${100 - displayBalance} points to go`;
      root.querySelectorAll('[data-redeem]').forEach((button) => {
        button.disabled = displayBalance < 100;
        button.textContent = displayBalance >= 100 ? 'Request reward' : 'Not enough points';
      });
    };
    root.querySelector('#reward-state')?.addEventListener('change', (event) => { displayBalance = Number(event.target.value); updateState(); });
    root.querySelectorAll('[data-redeem]').forEach((button) => button.addEventListener('click', async () => {
      if (displayBalance !== realBalance) return U.toast('Preview state only. Return to the real mock balance to submit.', 'error');
      U.setBusy(button, true, 'Requesting…');
      try {
        const redemption = await window.SheeoApi.redeemReward(button.dataset.redeem);
        root.querySelector('#redemption-body').insertAdjacentHTML('afterbegin', `<tr><td>${U.formatDate(redemption.requested_at)}</td><td><strong>${U.escapeHtml(redemption.reward_name)}</strong></td><td class="points-negative">-${redemption.points_cost}</td><td><span class="status-pill requested">Requested</span></td><td>—</td></tr>`);
        displayBalance -= 100;
        updateState();
        U.toast('Reward request received.');
      } catch (error) { U.toast(error.message || 'Redemption failed.', 'error'); U.setBusy(button, false); }
    }));
    U.renderIcons();
  };
})();
