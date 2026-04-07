/* ============================================
   ADMIN MODULE — Dashboard, User & Content Mgmt
   ============================================ */

const Admin = {
  render() {
    const container = document.getElementById('page-admin');
    if (!container) return;
    if (!Auth.isAdmin()) {
      container.innerHTML = `<div class="container"><div class="empty-state"><div class="empty-state__icon">🔒</div><div class="empty-state__title">Access Denied</div><div class="empty-state__desc">You need admin privileges to view this page.</div></div></div>`;
      return;
    }
    const users = DB.getAll('users');
    const notes = DB.getAll('notes');
    const comments = DB.getAll('comments');
    const likes = DB.getAll('likes');

    container.innerHTML = `
      <div class="container">
        <div class="dashboard-header">
          <h1 class="dashboard-header__greeting">Admin Dashboard</h1>
          <p class="dashboard-header__subtitle">Manage users, content, and monitor platform activity</p>
        </div>
        <div class="dashboard-stats">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--primary">👥</div>
            <div><div class="stat-card__value">${users.length}</div><div class="stat-card__label">Total Users</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--success">📝</div>
            <div><div class="stat-card__value">${notes.length}</div><div class="stat-card__label">Total Notes</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--warning">💬</div>
            <div><div class="stat-card__value">${comments.length}</div><div class="stat-card__label">Total Comments</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--accent">❤️</div>
            <div><div class="stat-card__value">${likes.length}</div><div class="stat-card__label">Total Likes</div></div>
          </div>
        </div>

        <div class="tabs">
          <div class="tab active" onclick="Admin.switchTab('users', this)">Users</div>
          <div class="tab" onclick="Admin.switchTab('notes', this)">Notes</div>
          <div class="tab" onclick="Admin.switchTab('comments', this)">Comments</div>
        </div>

        <div id="admin-tab-content">${this.renderUsersTable(users)}</div>
      </div>`;
  },

  switchTab(tab, el) {
    el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const content = document.getElementById('admin-tab-content');
    if (tab === 'users') content.innerHTML = this.renderUsersTable(DB.getAll('users'));
    else if (tab === 'notes') content.innerHTML = this.renderNotesTable(DB.getAll('notes'));
    else if (tab === 'comments') content.innerHTML = this.renderCommentsTable(DB.getAll('comments'));
  },

  renderUsersTable(users) {
    return `<div class="table-wrapper"><table class="table">
      <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody>${users.map(u => `<tr>
        <td><div style="display:flex;align-items:center;gap:var(--space-2)">${UI.renderAvatar(u.name, 'sm')}<span>${Notes.escHtml(u.name)}</span></div></td>
        <td>${Notes.escHtml(u.email)}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge--warning' : 'badge--primary'}">${u.role}</span></td>
        <td>${UI.formatDate(u.createdAt)}</td>
        <td>${u.role !== 'admin' ? `<button class="btn btn--danger btn--sm" onclick="Admin.deleteUser('${u.id}')">Delete</button>` : '<span class="text-xs text-tertiary">—</span>'}</td>
      </tr>`).join('')}</tbody></table></div>`;
  },

  renderNotesTable(notes) {
    return `<div class="table-wrapper"><table class="table">
      <thead><tr><th>Title</th><th>Subject</th><th>Author</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>${notes.map(n => `<tr>
        <td><a href="#/note-detail/${n.id}" style="color:var(--primary-500);font-weight:500">${Notes.escHtml(n.title)}</a></td>
        <td><span class="badge badge--subject">${Notes.escHtml(n.subject)}</span></td>
        <td>${Notes.escHtml(DB.getUserName(n.userId))}</td>
        <td>${UI.formatDate(n.createdAt)}</td>
        <td><button class="btn btn--danger btn--sm" onclick="Admin.deleteNote('${n.id}')">Delete</button></td>
      </tr>`).join('')}</tbody></table></div>`;
  },

  renderCommentsTable(comments) {
    return `<div class="table-wrapper"><table class="table">
      <thead><tr><th>Author</th><th>Comment</th><th>Note</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>${comments.map(c => {
        const note = DB.getById('notes', c.noteId);
        return `<tr>
          <td>${Notes.escHtml(DB.getUserName(c.userId))}</td>
          <td><span class="line-clamp-2" style="max-width:300px">${Notes.escHtml(c.text)}</span></td>
          <td>${note ? `<a href="#/note-detail/${note.id}" style="color:var(--primary-500)">${Notes.escHtml(note.title)}</a>` : 'Deleted'}</td>
          <td>${UI.formatDate(c.createdAt)}</td>
          <td><button class="btn btn--danger btn--sm" onclick="Admin.deleteComment('${c.id}')">Delete</button></td>
        </tr>`;
      }).join('')}</tbody></table></div>`;
  },

  async deleteUser(userId) {
    const ok = await UI.confirm('Delete User', 'This will permanently delete this user and all their content.');
    if (!ok) return;
    DB.remove('users', userId);
    DB.removeWhere('notes', n => n.userId === userId);
    DB.removeWhere('comments', c => c.userId === userId);
    DB.removeWhere('likes', l => l.userId === userId);
    DB.removeWhere('ratings', r => r.userId === userId);
    DB.removeWhere('bookmarks', b => b.userId === userId);
    UI.toast('User deleted', 'success');
    this.render();
  },
  async deleteNote(noteId) {
    const ok = await UI.confirm('Delete Note', 'Delete this note and all associated data?');
    if (!ok) return;
    DB.remove('notes', noteId);
    DB.removeWhere('comments', c => c.noteId === noteId);
    DB.removeWhere('ratings', r => r.noteId === noteId);
    DB.removeWhere('likes', l => l.noteId === noteId);
    UI.toast('Note deleted', 'success');
    this.render();
  },
  async deleteComment(commentId) {
    const ok = await UI.confirm('Delete Comment', 'Delete this comment?');
    if (!ok) return;
    DB.remove('comments', commentId);
    UI.toast('Comment deleted', 'success');
    this.render();
  }
};

window.Admin = Admin;
