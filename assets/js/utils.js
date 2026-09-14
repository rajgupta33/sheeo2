window.SheeoUtils = {
  // Nullish coalescing rather than a default parameter: defaults only fire on
  // undefined, so a null column from Supabase used to render as the text "null".
  escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  },

  formatDate(value, options = {}) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-AE', {
      day: 'numeric', month: 'short', year: 'numeric', ...options
    }).format(new Date(value));
  },

  statusLabel(value) {
    return String(value ?? '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  },

  initials(name) {
    return String(name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  },

  qs(selector, root = document) { return root.querySelector(selector); },
  qsa(selector, root = document) { return [...root.querySelectorAll(selector)]; },

  toast(message, type = 'success') {
    let region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.append(region);
    }
    const toast = document.createElement('div');
    toast.className = `portal-toast ${type === 'error' ? 'error' : ''}`;
    toast.textContent = message;
    region.append(toast);
    window.setTimeout(() => toast.remove(), 3400);
  },

  setBusy(button, isBusy, busyLabel = 'Please wait…') {
    if (!button) return;
    if (isBusy) {
      button.dataset.originalLabel = button.textContent;
      button.textContent = busyLabel;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalLabel || button.textContent;
      button.disabled = false;
    }
  },

  renderIcons() {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }
};

document.addEventListener('click', (event) => {
  const toggle = event.target.closest('.password-toggle');
  if (!toggle) return;
  const input = toggle.closest('.password-field')?.querySelector('input');
  if (!input) return;
  const reveal = input.type === 'password';
  input.type = reveal ? 'text' : 'password';
  toggle.setAttribute('aria-pressed', String(reveal));
  toggle.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
});
