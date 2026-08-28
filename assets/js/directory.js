(function () {
  const U = window.SheeoUtils;

  function memberCard(member) {
    return `
      <article class="member-card" data-member-card data-search="${U.escapeHtml([member.full_name, member.business_name, member.title, member.city, member.category, ...(member.services || [])].join(' ').toLowerCase())}" data-category="${U.escapeHtml(member.category || '')}">
        <div class="member-photo">${member.profile_photo_path ? `<img src="${U.escapeHtml(member.profile_photo_path)}" alt="${U.escapeHtml(member.full_name)}">` : U.initials(member.full_name)}</div>
        <h3>${U.escapeHtml(member.full_name)}</h3>
        <p><strong style="color:var(--portal-ink)">${U.escapeHtml(member.business_name)}</strong><br>${U.escapeHtml(member.title || '')} · ${U.escapeHtml(member.city || '')}</p>
        <div class="member-meta">${(member.services || []).slice(0, 3).map((service) => `<span>${U.escapeHtml(service)}</span>`).join('')}</div>
        <div class="button-row"><button class="portal-button secondary small" data-view-member="${member.id}">View profile</button></div>
      </article>`;
  }

  function profileModal(member) {
    return `<div class="portal-modal-backdrop" data-modal><article class="portal-modal" role="dialog" aria-modal="true">
      <div class="portal-modal-head"><div><p class="portal-kicker">Active SheEO member</p><h2>${U.escapeHtml(member.full_name)}</h2></div><button class="portal-modal-close" data-close-modal aria-label="Close"><i data-lucide="x"></i></button></div>
      <div style="display:grid;grid-template-columns:94px 1fr;gap:20px;align-items:center">
        <div class="member-photo" style="width:94px;height:94px">${member.profile_photo_path ? `<img src="${U.escapeHtml(member.profile_photo_path)}" alt="">` : U.initials(member.full_name)}</div>
        <div><h3 style="font-family:'Playfair Display',serif;margin:0 0 5px;font-size:23px">${U.escapeHtml(member.business_name)}</h3><p style="margin:0;color:var(--portal-muted);font-size:12px">${U.escapeHtml(member.title || '')} · ${U.escapeHtml(member.city || '')}</p><div class="member-meta">${(member.services || []).map((service) => `<span>${U.escapeHtml(service)}</span>`).join('')}</div></div>
      </div>
      <p style="margin:24px 0 0;color:var(--portal-muted);font-size:12px">Connect through the member's approved business links. Private contact information is never exposed by this directory view.</p>
      <div class="button-row">${member.website && member.website !== '#' ? `<a class="portal-button" href="${U.escapeHtml(member.website)}" target="_blank" rel="noopener">Visit website <i data-lucide="external-link"></i></a>` : ''}<button class="portal-button secondary" data-close-modal>Close</button></div>
    </article></div>`;
  }

  window.SheeoPages.directory = async ({ root }) => {
    const members = await window.SheeoApi.getMembers();
    const categories = [...new Set(members.map((member) => member.category).filter(Boolean))].sort();
    root.innerHTML = `
      <section class="portal-card">
        <div class="toolbar">
          <div class="search-field"><i data-lucide="search"></i><label class="sr-only" for="member-search">Search members</label><input class="portal-input" id="member-search" type="search" placeholder="Name, business, service or category"></div>
          <select class="portal-select" id="category-filter" aria-label="Filter by category" style="width:auto;min-width:180px"><option value="">All categories</option>${categories.map((category) => `<option value="${U.escapeHtml(category)}">${U.escapeHtml(category)}</option>`).join('')}</select>
        </div>
        <p style="margin:0;color:var(--portal-muted);font-size:11px"><span id="member-count">${members.length}</span> active members shown · directory-approved fields only</p>
      </section>
      <section class="member-grid" id="member-grid" style="margin-top:20px">${members.map(memberCard).join('')}</section>
      <div class="portal-card" id="directory-empty" style="margin-top:20px" hidden><div class="empty-state"><i data-lucide="search-x"></i><h3>No members found</h3><p>Try a different name, service or category.</p></div></div>`;

    const filter = () => {
      const query = root.querySelector('#member-search').value.trim().toLowerCase();
      const category = root.querySelector('#category-filter').value;
      let visible = 0;
      root.querySelectorAll('[data-member-card]').forEach((card) => {
        const matchesQuery = !query || card.dataset.search.includes(query);
        const matchesCategory = !category || card.dataset.category === category;
        card.hidden = !(matchesQuery && matchesCategory);
        if (!card.hidden) visible += 1;
      });
      root.querySelector('#member-count').textContent = visible;
      root.querySelector('#directory-empty').hidden = visible > 0;
    };
    root.querySelector('#member-search').addEventListener('input', filter);
    root.querySelector('#category-filter').addEventListener('change', filter);
    root.addEventListener('click', (event) => {
      const viewButton = event.target.closest('[data-view-member]');
      if (viewButton) {
        const member = members.find((item) => item.id === viewButton.dataset.viewMember);
        root.insertAdjacentHTML('beforeend', profileModal(member));
        document.body.classList.add('portal-locked');
        U.renderIcons();
      }
      if (event.target.closest('[data-close-modal]') || event.target.matches('[data-modal]')) {
        root.querySelector('[data-modal]')?.remove();
        document.body.classList.remove('portal-locked');
      }
    });
    U.renderIcons();
  };
})();
