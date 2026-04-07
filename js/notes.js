/* ============================================
   NOTES MODULE — CRUD, Search, Filter, Upload
   ============================================ */

const Notes = {
  currentPage: 1,
  perPage: 9,
  currentFilter: { search: '', subject: '' },

  // ---- Render Notes Grid ----
  renderGrid(containerId, notesArr, showPagination = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!notesArr || notesArr.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📚</div><div class="empty-state__title">No notes found</div><div class="empty-state__desc">Try adjusting your search or filters, or be the first to upload notes!</div></div>`;
      const pagEl = document.getElementById('notes-pagination');
      if (pagEl) pagEl.innerHTML = '';
      return;
    }
    // Pagination
    const totalPages = Math.ceil(notesArr.length / this.perPage);
    const start = (this.currentPage - 1) * this.perPage;
    const paged = notesArr.slice(start, start + this.perPage);
    const user = Auth.getUser();

    container.innerHTML = paged.map((note, i) => {
      const stats = DB.getNoteStats(note.id);
      const authorName = DB.getUserName(note.userId);
      const liked = user ? DB.isLiked(note.id, user.id) : false;
      const bookmarked = user ? DB.isBookmarked(note.id, user.id) : false;
      return `
        <div class="card card--note" style="animation-delay:${i * 0.05}s; animation: fadeInUp 0.4s var(--ease-out) ${i * 0.05}s both" data-note-id="${note.id}">
          <div class="card__header">
            <div>
              <div class="card__title">${this.escHtml(note.title)}</div>
              <span class="badge badge--subject">${this.escHtml(note.subject)}</span>
            </div>
            <span style="font-size:1.5rem">${UI.fileIcon(note.fileType)}</span>
          </div>
          <div class="card__desc line-clamp-2">${this.escHtml(note.description)}</div>
          <div class="card__tags">${(note.tags||[]).map(t => `<span class="tag">#${this.escHtml(t)}</span>`).join('')}</div>
          <div class="card__footer">
            <div class="card__meta">
              <span>By ${this.escHtml(authorName)}</span>
              <span>${UI.formatDate(note.createdAt)}</span>
            </div>
            <div style="display:flex;gap:var(--space-3);align-items:center">
              <span class="action-btn ${liked ? 'liked' : ''}" onclick="event.stopPropagation(); Notes.toggleLike('${note.id}')">
                ${liked ? '❤️' : '🤍'} <small>${stats.likes}</small>
              </span>
              <span class="action-btn ${bookmarked ? 'bookmarked' : ''}" onclick="event.stopPropagation(); Notes.toggleBookmark('${note.id}')">
                ${bookmarked ? '🔖' : '📑'} 
              </span>
              ${stats.avgRating > 0 ? `<span class="text-xs" style="color:var(--warning-500)">★ ${stats.avgRating}</span>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');

    // Pagination controls
    if (showPagination && totalPages > 1) {
      const pagEl = document.getElementById('notes-pagination');
      if (pagEl) {
        let pagHtml = `<button class="pagination__btn" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="Notes.goPage(${this.currentPage - 1})">‹</button>`;
        for (let p = 1; p <= totalPages; p++) {
          pagHtml += `<button class="pagination__btn ${p === this.currentPage ? 'active' : ''}" onclick="Notes.goPage(${p})">${p}</button>`;
        }
        pagHtml += `<button class="pagination__btn" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="Notes.goPage(${this.currentPage + 1})">›</button>`;
        pagEl.innerHTML = pagHtml;
      }
    }

    // Click handler for card
    container.querySelectorAll('.card--note').forEach(card => {
      card.addEventListener('click', () => App.navigate('note-detail', card.dataset.noteId));
    });
  },

  // ---- Get filtered notes ----
  getFiltered() {
    let notes = DB.getAll('notes');
    const { search, subject } = this.currentFilter;
    if (search) {
      const q = search.toLowerCase();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (subject) notes = notes.filter(n => n.subject === subject);
    return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ---- Search & Filter handlers ----
  onSearch(value) {
    this.currentFilter.search = value;
    this.currentPage = 1;
    this.renderGrid('notes-grid', this.getFiltered());
  },
  onFilterSubject(value) {
    this.currentFilter.subject = value;
    this.currentPage = 1;
    this.renderGrid('notes-grid', this.getFiltered());
  },
  goPage(page) {
    this.currentPage = page;
    this.renderGrid('notes-grid', this.getFiltered());
    window.scrollTo({ top: document.getElementById('notes-grid')?.offsetTop - 100, behavior: 'smooth' });
  },

  // ---- Toggle like ----
  toggleLike(noteId) {
    const user = Auth.getUser();
    if (!user) { UI.toast('Please log in to like notes', 'warning'); return; }
    const liked = DB.toggleLike(noteId, user.id);
    UI.toast(liked ? 'Added to liked! ❤️' : 'Removed from liked', 'info');
    this.refreshCurrentView();
  },

  // ---- Toggle bookmark ----
  toggleBookmark(noteId) {
    const user = Auth.getUser();
    if (!user) { UI.toast('Please log in to bookmark notes', 'warning'); return; }
    const bookmarked = DB.toggleBookmark(noteId, user.id);
    UI.toast(bookmarked ? 'Bookmarked! 🔖' : 'Bookmark removed', 'info');
    this.refreshCurrentView();
  },

  // ---- Refresh whatever view is showing ----
  refreshCurrentView() {
    const hash = location.hash;
    if (hash.startsWith('#/notes')) this.renderGrid('notes-grid', this.getFiltered());
    if (hash.startsWith('#/dashboard')) App.renderDashboard();
    if (hash.startsWith('#/note-detail')) {
      const noteId = hash.split('/')[2];
      if (noteId) this.renderDetail(noteId);
    }
  },

  // ---- Note Detail ----
  renderDetail(noteId) {
    const note = DB.getById('notes', noteId);
    const container = document.getElementById('page-note-detail');
    if (!note || !container) { App.navigate('notes'); return; }
    const stats = DB.getNoteStats(noteId);
    const authorName = DB.getUserName(note.userId);
    const user = Auth.getUser();
    const liked = user ? DB.isLiked(noteId, user.id) : false;
    const bookmarked = user ? DB.isBookmarked(noteId, user.id) : false;
    const userRating = user ? DB.getUserRating(noteId, user.id) : 0;
    const isOwner = user && user.id === note.userId;
    const isAdmin = Auth.isAdmin();

    container.innerHTML = `
      <div class="container note-detail">
        <div class="note-detail__header">
          <div class="note-detail__back" onclick="App.navigate('notes')">← Back to Notes</div>
          <h1 class="note-detail__title">${this.escHtml(note.title)}</h1>
          <div class="note-detail__meta">
            ${UI.renderAvatar(authorName, 'sm')}
            <span>${this.escHtml(authorName)}</span>
            <span>•</span>
            <span>${UI.formatDate(note.createdAt)}</span>
            <span>•</span>
            <span class="badge badge--subject">${this.escHtml(note.subject)}</span>
          </div>
          <div class="card__tags" style="margin-top:var(--space-3)">
            ${(note.tags||[]).map(t => `<span class="tag">#${this.escHtml(t)}</span>`).join('')}
          </div>
        </div>
        <div class="note-detail__desc">${this.escHtml(note.description)}</div>
        <div class="note-detail__file-info">
          <span class="note-detail__file-icon">${UI.fileIcon(note.fileType)}</span>
          <div>
            <div class="note-detail__file-name">${this.escHtml(note.fileName)}</div>
            <div class="note-detail__file-size">${UI.formatFileSize(note.fileSize)}</div>
          </div>
          <button class="btn btn--primary btn--sm" style="margin-left:auto" onclick="Notes.downloadNote('${noteId}')">⬇ Download</button>
        </div>
        <div class="note-detail__actions">
          <button class="action-btn ${liked ? 'liked' : ''}" onclick="Notes.toggleLike('${noteId}')">
            ${liked ? '❤️' : '🤍'} ${stats.likes} likes
          </button>
          <button class="action-btn ${bookmarked ? 'bookmarked' : ''}" onclick="Notes.toggleBookmark('${noteId}')">
            ${bookmarked ? '🔖' : '📑'} Bookmark
          </button>
          <div style="margin-left:auto;display:flex;align-items:center;gap:var(--space-2)">
            <span class="text-sm text-secondary">Rate:</span>
            ${UI.renderStars(userRating, !!user, noteId)}
            ${stats.ratingCount > 0 ? `<span class="text-xs text-tertiary">(${stats.avgRating} avg · ${stats.ratingCount} ratings)</span>` : ''}
          </div>
          ${isOwner || isAdmin ? `<button class="btn btn--danger btn--sm" style="margin-left:var(--space-4)" onclick="Notes.deleteNote('${noteId}')">🗑 Delete</button>` : ''}
        </div>
        <div id="comments-section">
          ${Comments.render(noteId)}
        </div>
      </div>`;

    // Star rating click handlers
    container.querySelectorAll('.star-rating:not(.star-rating--display) .star').forEach(star => {
      star.addEventListener('click', () => {
        if (!user) { UI.toast('Please log in to rate', 'warning'); return; }
        DB.setRating(noteId, user.id, parseInt(star.dataset.value));
        UI.toast(`Rated ${star.dataset.value} stars! ⭐`, 'success');
        this.renderDetail(noteId);
      });
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.value);
        star.closest('.star-rating').querySelectorAll('.star').forEach((s, i) => {
          s.classList.toggle('hovered', i < val);
          s.textContent = i < val ? '★' : '☆';
        });
      });
    });
    const ratingEl = container.querySelector('.star-rating:not(.star-rating--display)');
    if (ratingEl) {
      ratingEl.addEventListener('mouseleave', () => {
        const current = user ? DB.getUserRating(noteId, user.id) : 0;
        ratingEl.querySelectorAll('.star').forEach((s, i) => {
          s.classList.remove('hovered');
          s.classList.toggle('active', i < current);
          s.textContent = i < current ? '★' : '☆';
        });
      });
    }
  },

  // ---- Upload Note ----
  handleUpload(e) {
    e.preventDefault();
    const user = Auth.getUser();
    if (!user) { UI.toast('Please log in first', 'error'); return; }
    const form = e.target;
    const title = form.querySelector('#upload-title').value.trim();
    const subject = form.querySelector('#upload-subject').value;
    const description = form.querySelector('#upload-desc').value.trim();
    const tagsStr = form.querySelector('#upload-tags').value.trim();
    const fileInput = form.querySelector('#upload-file');

    // Validate
    let valid = true;
    valid = UI.validateField(form.querySelector('#upload-title'), { required: true, minLength: 3 }) && valid;
    valid = UI.validateField(form.querySelector('#upload-subject'), { required: true }) && valid;
    valid = UI.validateField(form.querySelector('#upload-desc'), { required: true, minLength: 10 }) && valid;

    if (!Notes._uploadedFile) {
      UI.toast('Please select a file to upload', 'error');
      return;
    }
    if (!valid) return;

    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    const note = DB.create('notes', {
      title, subject, description, tags,
      userId: user.id,
      fileName: Notes._uploadedFile.name,
      fileType: Notes._uploadedFile.type,
      fileSize: Notes._uploadedFile.size,
      fileData: Notes._uploadedFileData
    });

    Notes._uploadedFile = null;
    Notes._uploadedFileData = null;
    form.reset();
    document.getElementById('file-preview').innerHTML = '';
    UI.toast('Note uploaded successfully! 🎉', 'success');
    App.navigate('notes');
  },

  // ---- File handling ----
  _uploadedFile: null,
  _uploadedFileData: null,
  handleFileSelect(file) {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowed.includes(file.type)) {
      UI.toast('Only PDF, DOC, and TXT files are allowed', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      UI.toast('File size must be under 10 MB', 'error');
      return;
    }
    this._uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this._uploadedFileData = e.target.result; };
    reader.readAsDataURL(file);
    document.getElementById('file-preview').innerHTML = `
      <div class="file-upload__preview">
        <span>${UI.fileIcon(file.type)}</span>
        <span class="file-upload__preview-name">${this.escHtml(file.name)}</span>
        <span class="file-upload__preview-size">${UI.formatFileSize(file.size)}</span>
        <span class="file-upload__preview-remove" onclick="Notes.removeFile()">✕</span>
      </div>`;
  },
  removeFile() {
    this._uploadedFile = null;
    this._uploadedFileData = null;
    document.getElementById('file-preview').innerHTML = '';
    const fileInput = document.getElementById('upload-file');
    if (fileInput) fileInput.value = '';
  },

  // ---- Download Note ----
  downloadNote(noteId) {
    const note = DB.getById('notes', noteId);
    if (!note) return;
    if (note.fileData) {
      const a = document.createElement('a');
      a.href = note.fileData;
      a.download = note.fileName;
      a.click();
      UI.toast('Download started!', 'success');
    } else {
      UI.toast('File data not available (demo note)', 'info');
    }
  },

  // ---- Delete Note ----
  async deleteNote(noteId) {
    const ok = await UI.confirm('Delete Note', 'Are you sure you want to delete this note? This action cannot be undone.');
    if (!ok) return;
    DB.remove('notes', noteId);
    DB.removeWhere('comments', c => c.noteId === noteId);
    DB.removeWhere('ratings', r => r.noteId === noteId);
    DB.removeWhere('likes', l => l.noteId === noteId);
    DB.removeWhere('bookmarks', b => b.noteId === noteId);
    UI.toast('Note deleted', 'success');
    App.navigate('notes');
  },

  // ---- Trending & Recent ----
  getTrending(limit = 4) {
    const notes = DB.getAll('notes');
    return notes.map(n => ({ ...n, _likes: DB.getNoteStats(n.id).likes }))
                .sort((a, b) => b._likes - a._likes)
                .slice(0, limit);
  },
  getRecent(limit = 4) {
    return DB.getAll('notes').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  },

  // ---- Utility ----
  escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  },

  getSubjects() {
    return ['Mathematics', 'Physics', 'Computer Science', 'Biology', 'Chemistry', 'Literature', 'History', 'Economics'];
  }
};

window.Notes = Notes;
