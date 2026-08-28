(function () {
  const U = window.SheeoUtils;

  window.SheeoPages.points = async ({ root }) => {
    const transactions = await window.SheeoApi.getPointTransactions();
    const balance = transactions.reduce((sum, item) => sum + item.points, 0);

    root.innerHTML = `
      <section class="portal-grid portal-grid-3">
        <article class="portal-card rose">
          <span class="metric-label">Available balance</span>
          <div class="metric-value">${balance}</div>
          <p class="metric-note">Current membership period</p>
        </article>
        <article class="portal-card">
          <span class="metric-label">Total earned</span>
          <div class="metric-value">${transactions.filter((item) => item.points > 0).reduce((sum, item) => sum + item.points, 0)}</div>
          <p class="metric-note">Approved awards and refunds</p>
        </article>
        <article class="portal-card">
          <span class="metric-label">Reward progress</span>
          <div class="metric-value">${Math.min(balance, 100)}<span style="font-size:16px;color:var(--portal-muted)"> / 100</span></div>
          <p class="metric-note">${Math.max(0, 100 - balance)} points remaining</p>
        </article>
      </section>

      <section class="portal-card" style="margin-top:20px">
        <div class="card-head"><div><h2>Point activity</h2><p>The ledger is the source of truth; approved entries are never overwritten.</p></div></div>
        <div class="toolbar">
          <div class="filter-row" role="group" aria-label="Filter point transactions">
            <button class="filter-chip active" data-filter="all">All</button>
            <button class="filter-chip" data-filter="earned">Earned</button>
            <button class="filter-chip" data-filter="redeemed">Redeemed</button>
            <button class="filter-chip" data-filter="adjusted">Adjusted</button>
            <button class="filter-chip" data-filter="refunded">Refunded</button>
          </div>
        </div>
        <div class="portal-table-wrap">
          <table class="portal-table">
            <thead><tr><th>Date</th><th>Activity</th><th>Type</th><th>Source</th><th>Points</th></tr></thead>
            <tbody id="points-rows"></tbody>
          </table>
        </div>
        <div id="points-empty" class="empty-state" hidden><i data-lucide="search-x"></i><h3>No matching entries</h3><p>Try another point type.</p></div>
      </section>`;

    const render = (filter = 'all') => {
      const filtered = transactions.filter((item) => {
        if (filter === 'all') return true;
        if (filter === 'earned') return item.points > 0 && !['refund', 'admin_adjustment'].includes(item.transaction_type);
        if (filter === 'redeemed') return item.transaction_type === 'redemption';
        if (filter === 'adjusted') return item.transaction_type === 'admin_adjustment';
        if (filter === 'refunded') return item.transaction_type === 'refund';
        return true;
      });
      root.querySelector('#points-rows').innerHTML = filtered.map((item) => `
        <tr>
          <td>${U.formatDate(item.created_at)}</td>
          <td><strong>${U.escapeHtml(item.description)}</strong></td>
          <td>${U.statusLabel(item.transaction_type)}</td>
          <td>${U.escapeHtml(item.source || 'System')}</td>
          <td class="${item.points >= 0 ? 'points-positive' : 'points-negative'}">${item.points > 0 ? '+' : ''}${item.points}</td>
        </tr>`).join('');
      root.querySelector('#points-empty').hidden = filtered.length > 0;
    };

    root.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      root.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      render(button.dataset.filter);
    }));
    render();
    U.renderIcons();
  };
})();
