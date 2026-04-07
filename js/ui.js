/* ============================================
   UI UTILITIES — Theme, Toasts, Modal, Helpers
   ============================================ */

const UI = {
  // ---- Theme Toggle ----
  initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeIcon(saved);
  },
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.updateThemeIcon(next);
  },
  updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  },

  // ---- Toast Notifications ----
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[type]}</span>
      <span class="toast__message">${message}</span>
      <span class="toast__close" onclick="this.parentElement.remove()">✕</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // ---- Modal ----
  showModal(title, bodyHtml, footerHtml = '') {
    const overlay = document.getElementById('modal-overlay');
    overlay.querySelector('.modal__title').textContent = title;
    overlay.querySelector('.modal__body').innerHTML = bodyHtml;
    overlay.querySelector('.modal__footer').innerHTML = footerHtml;
    overlay.classList.add('active');
  },
  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },
  confirm(title, message) {
    return new Promise(resolve => {
      this.showModal(title, `<p style="color:var(--text-secondary)">${message}</p>`,
        `<button class="btn btn--secondary" onclick="UI.closeModal(); window._confirmResolve(false)">Cancel</button>
         <button class="btn btn--danger" onclick="UI.closeModal(); window._confirmResolve(true)">Confirm</button>`
      );
      window._confirmResolve = resolve;
    });
  },

  // ---- Form Validation ----
  validateField(input, rules) {
    const value = input.value.trim();
    const group = input.closest('.form-group');
    const errorEl = group?.querySelector('.form-error');
    let error = '';
    if (rules.required && !value) error = rules.required === true ? 'This field is required' : rules.required;
    else if (rules.minLength && value.length < rules.minLength) error = `Minimum ${rules.minLength} characters`;
    else if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email address';
    else if (rules.match) {
      const matchInput = document.getElementById(rules.match);
      if (matchInput && value !== matchInput.value) error = 'Passwords do not match';
    }
    if (error) {
      group?.classList.add('has-error');
      if (errorEl) errorEl.textContent = error;
      return false;
    }
    group?.classList.remove('has-error');
    return true;
  },
  clearErrors(form) {
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
  },

  // ---- Avatar Color ----
  avatarColor(name) {
    const colors = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#22c55e','#06b6d4','#3b82f6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  },
  avatarInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },
  renderAvatar(name, size = '') {
    const cls = size ? `avatar avatar--${size}` : 'avatar';
    return `<div class="${cls}" style="background:${this.avatarColor(name)}">${this.avatarInitials(name)}</div>`;
  },

  // ---- Star Rating HTML ----
  renderStars(rating, interactive = false, noteId = '') {
    const cls = interactive ? 'star-rating' : 'star-rating star-rating--display';
    let html = `<div class="${cls}" ${interactive ? `data-note-id="${noteId}"` : ''}>`;
    for (let i = 1; i <= 5; i++) {
      html += `<span class="star ${i <= Math.round(rating) ? 'active' : ''}" data-value="${i}">${i <= Math.round(rating) ? '★' : '☆'}</span>`;
    }
    html += '</div>';
    return html;
  },

  // ---- Format helpers ----
  formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff/86400000)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  },
  fileIcon(fileType) {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word') || fileType?.includes('doc')) return '📝';
    if (fileType?.includes('text')) return '📃';
    return '📎';
  },

  // ---- Dropdown toggle ----
  toggleDropdown(el) {
    // Close all other dropdowns first
    document.querySelectorAll('.dropdown.active').forEach(d => {
      if (d !== el.closest('.dropdown')) d.classList.remove('active');
    });
    el.closest('.dropdown')?.classList.toggle('active');
  }
};

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
  }
});

window.UI = UI;
