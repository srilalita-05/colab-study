/* ============================================
   COMMENTS MODULE — Comments on Notes
   ============================================ */

const Comments = {
  render(noteId) {
    const comments = DB.getAll('comments').filter(c => c.noteId === noteId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const user = Auth.getUser();

    let html = `<div class="section-header"><h2 class="section-title">Comments (${comments.length})</h2></div>`;

    // Add comment form
    if (user) {
      html += `
        <div class="card" style="margin-bottom:var(--space-6);padding:var(--space-4)">
          <div style="display:flex;gap:var(--space-3);align-items:flex-start">
            ${UI.renderAvatar(user.name, 'sm')}
            <div style="flex:1">
              <textarea class="form-input" id="comment-input" placeholder="Write a comment..." rows="2" style="min-height:60px"></textarea>
              <div style="display:flex;justify-content:flex-end;margin-top:var(--space-2)">
                <button class="btn btn--primary btn--sm" onclick="Comments.add('${noteId}')">Post Comment</button>
              </div>
            </div>
          </div>
        </div>`;
    } else {
      html += `<p class="text-sm text-secondary mb-4"><a href="#/login" style="color:var(--primary-500)">Log in</a> to leave a comment.</p>`;
    }

    if (comments.length === 0) {
      html += `<p class="text-sm text-tertiary" style="text-align:center;padding:var(--space-8)">No comments yet. Be the first to share your thoughts!</p>`;
    } else {
      html += comments.map(c => {
        const author = DB.getUserName(c.userId);
        const canDelete = user && (user.id === c.userId || Auth.isAdmin());
        return `
          <div class="comment">
            ${UI.renderAvatar(author, 'sm')}
            <div class="comment__body">
              <div class="comment__header">
                <span class="comment__author">${Notes.escHtml(author)}</span>
                <span class="comment__date">${UI.formatDate(c.createdAt)}</span>
              </div>
              <div class="comment__text">${Notes.escHtml(c.text)}</div>
              ${canDelete ? `<div class="comment__actions"><span class="comment__action" onclick="Comments.remove('${c.id}', '${noteId}')">🗑 Delete</span></div>` : ''}
            </div>
          </div>`;
      }).join('');
    }
    return html;
  },

  add(noteId) {
    const user = Auth.getUser();
    if (!user) { UI.toast('Please log in first', 'warning'); return; }
    const input = document.getElementById('comment-input');
    const text = input?.value.trim();
    if (!text) { UI.toast('Comment cannot be empty', 'warning'); return; }
    if (text.length > 500) { UI.toast('Comment too long (max 500 chars)', 'warning'); return; }
    DB.create('comments', { noteId, userId: user.id, text });
    UI.toast('Comment posted! 💬', 'success');
    Notes.renderDetail(noteId);
  },

  async remove(commentId, noteId) {
    const ok = await UI.confirm('Delete Comment', 'Are you sure you want to delete this comment?');
    if (!ok) return;
    DB.remove('comments', commentId);
    UI.toast('Comment deleted', 'info');
    Notes.renderDetail(noteId);
  }
};

window.Comments = Comments;
