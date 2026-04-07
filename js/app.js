/* ============================================
   APP.JS — Router, Page Renders, Init
   ============================================ */

const App = {
  // ---- SPA Router ----
  routes: {
    'home': 'page-home',
    'login': 'page-login',
    'register': 'page-register',
    'dashboard': 'page-dashboard',
    'notes': 'page-notes',
    'note-detail': 'page-note-detail',
    'upload': 'page-upload',
    'profile': 'page-profile',
    'admin': 'page-admin'
  },

  init() {
    DB.seed();
    UI.initTheme();
    this.bindEvents();
    this.handleRoute();
    this.updateNav();
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  navigate(route, param) {
    if (param) location.hash = `#/${route}/${param}`;
    else location.hash = `#/${route}`;
  },

  handleRoute() {
    const hash = location.hash.slice(2) || 'home';
    const parts = hash.split('/');
    const route = parts[0];
    const param = parts[1];

    // Auth guard
    const authRoutes = ['dashboard', 'upload', 'profile', 'admin'];
    if (authRoutes.includes(route) && !Auth.isLoggedIn()) {
      UI.toast('Please log in to access this page', 'warning');
      this.navigate('login');
      return;
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const pageId = this.routes[route] || 'page-home';
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');

    // Render page content
    switch (route) {
      case 'home': this.renderHome(); break;
      case 'login': this.renderLogin(); break;
      case 'register': this.renderRegister(); break;
      case 'dashboard': this.renderDashboard(); break;
      case 'notes': this.renderNotes(); break;
      case 'note-detail': if (param) Notes.renderDetail(param); break;
      case 'upload': this.renderUpload(); break;
      case 'profile': this.renderProfile(); break;
      case 'admin': Admin.render(); break;
      default: this.renderHome();
    }

    // Update active nav link
    document.querySelectorAll('.navbar__link').forEach(link => {
      link.classList.toggle('active', link.dataset.route === route);
    });

    // Close mobile menu
    document.getElementById('mobile-menu')?.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ---- Update Navbar ----
  updateNav() {
    const user = Auth.getUser();
    const userArea = document.getElementById('nav-user-area');
    const authLinks = document.getElementById('nav-auth-links');
    const adminLink = document.querySelectorAll('[data-route="admin"]');

    if (user) {
      userArea.style.display = 'flex';
      authLinks.style.display = 'none';
      document.getElementById('nav-user-name').textContent = user.name;
      document.getElementById('nav-user-role').textContent = user.role;
      document.getElementById('nav-user-avatar').innerHTML = UI.renderAvatar(user.name, 'sm');
      adminLink.forEach(el => el.style.display = user.role === 'admin' ? '' : 'none');
    } else {
      userArea.style.display = 'none';
      authLinks.style.display = 'flex';
      adminLink.forEach(el => el.style.display = 'none');
    }
  },

  // ---- Bind global events ----
  bindEvents() {
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => UI.toggleTheme());
    // Hamburger menu
    document.getElementById('hamburger')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.toggle('active');
    });
    // Modal close
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') UI.closeModal();
    });
    document.getElementById('modal-close')?.addEventListener('click', () => UI.closeModal());
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') UI.closeModal();
    });
  },

  // ---- PAGE RENDERERS ----

  renderHome() {
    const container = document.getElementById('page-home');
    const totalNotes = DB.count('notes');
    const totalUsers = DB.count('users');
    const totalLikes = DB.count('likes');
    const trending = Notes.getTrending(4);
    const recent = Notes.getRecent(4);

    container.innerHTML = `
      <div class="hero">
        <span class="hero__badge">🚀 The #1 Study Platform</span>
        <h1 class="hero__title">Share Knowledge,<br><span>Learn Together</span></h1>
        <p class="hero__desc">Upload, discover, and collaborate on study notes with students worldwide. Your study companion for academic excellence.</p>
        <div class="hero__actions">
          <button class="btn btn--primary btn--lg" onclick="App.navigate('${Auth.isLoggedIn() ? 'dashboard' : 'register'}')">Get Started Free</button>
          <button class="btn btn--secondary btn--lg" onclick="App.navigate('notes')">Browse Notes</button>
        </div>
        <div class="hero__stats">
          <div><div class="hero__stat-value">${totalNotes}+</div><div class="hero__stat-label">Study Notes</div></div>
          <div><div class="hero__stat-value">${totalUsers}+</div><div class="hero__stat-label">Active Users</div></div>
          <div><div class="hero__stat-value">${totalLikes}+</div><div class="hero__stat-label">Interactions</div></div>
        </div>
      </div>
      <div class="container">
        <div class="section-header" style="margin-top:var(--space-8)">
          <div><h2 class="section-title">Why StudyNotes?</h2><p class="section-subtitle">Everything you need for collaborative learning</p></div>
        </div>
        <div class="features-grid">
          <div class="card feature-card"><div class="feature-card__icon">📤</div><div class="feature-card__title">Easy Upload</div><div class="feature-card__desc">Upload your notes in PDF, DOC, or TXT format with just a few clicks</div></div>
          <div class="card feature-card"><div class="feature-card__icon">🔍</div><div class="feature-card__title">Smart Search</div><div class="feature-card__desc">Find exactly what you need with search by title, subject, or tags</div></div>
          <div class="card feature-card"><div class="feature-card__icon">⭐</div><div class="feature-card__title">Rate & Review</div><div class="feature-card__desc">Help others find the best notes through ratings and comments</div></div>
          <div class="card feature-card"><div class="feature-card__icon">🔖</div><div class="feature-card__title">Bookmarks</div><div class="feature-card__desc">Save your favorite notes for quick access anytime</div></div>
          <div class="card feature-card"><div class="feature-card__icon">🌙</div><div class="feature-card__title">Dark Mode</div><div class="feature-card__desc">Study comfortably at any time with our dark mode support</div></div>
          <div class="card feature-card"><div class="feature-card__icon">📱</div><div class="feature-card__title">Responsive</div><div class="feature-card__desc">Access your notes on any device — desktop, tablet, or mobile</div></div>
        </div>

        ${trending.length ? `
        <div class="section-header" style="margin-top:var(--space-16)">
          <div><h2 class="section-title">🔥 Trending Notes</h2><p class="section-subtitle">Most popular notes this week</p></div>
          <button class="btn btn--ghost" onclick="App.navigate('notes')">View All →</button>
        </div>
        <div class="notes-grid" id="home-trending"></div>` : ''}

        ${recent.length ? `
        <div class="section-header" style="margin-top:var(--space-12)">
          <div><h2 class="section-title">🆕 Recently Added</h2><p class="section-subtitle">Fresh notes from the community</p></div>
          <button class="btn btn--ghost" onclick="App.navigate('notes')">View All →</button>
        </div>
        <div class="notes-grid" id="home-recent"></div>` : ''}
      </div>
      <footer class="footer"><div class="footer__inner"><span class="footer__text">© 2026 StudyNotes. Built with ❤️ for students.</span><div class="footer__links"><a class="footer__link" href="#/notes">Browse</a><a class="footer__link" href="#/register">Join</a></div></div></footer>`;

    if (trending.length) Notes.renderGrid('home-trending', trending, false);
    if (recent.length) Notes.renderGrid('home-recent', recent, false);
  },

  renderLogin() {
    document.getElementById('page-login').innerHTML = `
      <div class="auth-page"><div class="card auth-card">
        <div class="auth-card__header">
          <h1 class="auth-card__title">Welcome Back</h1>
          <p class="auth-card__subtitle">Log in to access your study notes</p>
        </div>
        <form id="login-form" onsubmit="App.handleLogin(event)">
          <div class="form-group"><label for="login-email">Email</label><input type="email" class="form-input" id="login-email" placeholder="you@example.com"><span class="form-error"></span></div>
          <div class="form-group"><label for="login-password">Password</label><input type="password" class="form-input" id="login-password" placeholder="Your password"><span class="form-error"></span></div>
          <button type="submit" class="btn btn--primary" style="width:100%;margin-top:var(--space-2)">Log In</button>
        </form>
        <div class="auth-card__footer">Don't have an account? <a onclick="App.navigate('register')">Sign up</a></div>
        <div style="margin-top:var(--space-4);padding:var(--space-3);background:var(--bg-secondary);border-radius:var(--radius-md);font-size:var(--text-xs);color:var(--text-tertiary)">
          <strong>Demo accounts:</strong><br>
          Student: alex@demo.com / demo123<br>
          Admin: admin@demo.com / admin123
        </div>
      </div></div>`;
  },

  renderRegister() {
    document.getElementById('page-register').innerHTML = `
      <div class="auth-page"><div class="card auth-card">
        <div class="auth-card__header">
          <h1 class="auth-card__title">Create Account</h1>
          <p class="auth-card__subtitle">Join the community and start sharing notes</p>
        </div>
        <form id="register-form" onsubmit="App.handleRegister(event)">
          <div class="form-group"><label for="reg-name">Full Name</label><input type="text" class="form-input" id="reg-name" placeholder="Your full name"><span class="form-error"></span></div>
          <div class="form-group"><label for="reg-email">Email</label><input type="email" class="form-input" id="reg-email" placeholder="you@example.com"><span class="form-error"></span></div>
          <div class="form-group"><label for="reg-password">Password</label><input type="password" class="form-input" id="reg-password" placeholder="Min 6 characters"><span class="form-error"></span></div>
          <div class="form-group"><label for="reg-role">Role</label><select class="form-input" id="reg-role"><option value="student">Student</option><option value="admin">Admin</option></select></div>
          <button type="submit" class="btn btn--primary" style="width:100%;margin-top:var(--space-2)">Create Account</button>
        </form>
        <div class="auth-card__footer">Already have an account? <a onclick="App.navigate('login')">Log in</a></div>
      </div></div>`;
  },

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    let v = true;
    v = UI.validateField(email, { required: true, email: true }) && v;
    v = UI.validateField(password, { required: true }) && v;
    if (!v) return;
    if (Auth.login(email.value.trim(), password.value)) {
      this.navigate('dashboard');
      this.updateNav();
    }
  },

  handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name');
    const email = document.getElementById('reg-email');
    const password = document.getElementById('reg-password');
    const role = document.getElementById('reg-role').value;
    let v = true;
    v = UI.validateField(name, { required: true, minLength: 2 }) && v;
    v = UI.validateField(email, { required: true, email: true }) && v;
    v = UI.validateField(password, { required: true, minLength: 6 }) && v;
    if (!v) return;
    if (Auth.register(name.value.trim(), email.value.trim(), password.value, role)) {
      this.navigate('dashboard');
      this.updateNav();
    }
  },

  renderDashboard() {
    const user = Auth.getUser();
    if (!user) return;
    const container = document.getElementById('page-dashboard');
    const myNotes = DB.getAll('notes').filter(n => n.userId === user.id);
    const myBookmarks = DB.getAll('bookmarks').filter(b => b.userId === user.id);
    const bookmarkedNotes = myBookmarks.map(b => DB.getById('notes', b.noteId)).filter(Boolean);
    const totalLikes = myNotes.reduce((sum, n) => sum + DB.getNoteStats(n.id).likes, 0);

    container.innerHTML = `
      <div class="container">
        <div class="dashboard-header">
          <h1 class="dashboard-header__greeting">Hello, ${Notes.escHtml(user.name)} 👋</h1>
          <p class="dashboard-header__subtitle">Here's an overview of your activity</p>
        </div>
        <div class="dashboard-stats">
          <div class="stat-card"><div class="stat-card__icon stat-card__icon--primary">📝</div><div><div class="stat-card__value">${myNotes.length}</div><div class="stat-card__label">My Notes</div></div></div>
          <div class="stat-card"><div class="stat-card__icon stat-card__icon--success">❤️</div><div><div class="stat-card__value">${totalLikes}</div><div class="stat-card__label">Total Likes</div></div></div>
          <div class="stat-card"><div class="stat-card__icon stat-card__icon--warning">🔖</div><div><div class="stat-card__value">${myBookmarks.length}</div><div class="stat-card__label">Bookmarks</div></div></div>
          <div class="stat-card"><div class="stat-card__icon stat-card__icon--accent">⭐</div><div><div class="stat-card__value">${DB.getAll('ratings').filter(r => myNotes.some(n => n.id === r.noteId)).length}</div><div class="stat-card__label">Ratings Received</div></div></div>
        </div>
        <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-6);flex-wrap:wrap">
          <button class="btn btn--primary" onclick="App.navigate('upload')">📤 Upload New Note</button>
          <button class="btn btn--secondary" onclick="App.navigate('notes')">📚 Browse Notes</button>
          ${Auth.isAdmin() ? '<button class="btn btn--secondary" onclick="App.navigate(\'admin\')">⚙️ Admin Panel</button>' : ''}
        </div>
        ${myNotes.length ? `
          <div class="section-header"><div><h2 class="section-title">My Notes</h2></div></div>
          <div class="notes-grid" id="dashboard-my-notes"></div>` : ''}
        ${bookmarkedNotes.length ? `
          <div class="section-header" style="margin-top:var(--space-12)"><div><h2 class="section-title">🔖 Bookmarked</h2></div></div>
          <div class="notes-grid" id="dashboard-bookmarks"></div>` : ''}
      </div>`;
    if (myNotes.length) Notes.renderGrid('dashboard-my-notes', myNotes, false);
    if (bookmarkedNotes.length) Notes.renderGrid('dashboard-bookmarks', bookmarkedNotes, false);
  },

  renderNotes() {
    const container = document.getElementById('page-notes');
    const subjects = Notes.getSubjects();
    container.innerHTML = `
      <div class="container">
        <div class="section-header">
          <div><h1 class="section-title">📚 Study Notes</h1><p class="section-subtitle">Browse and discover study materials</p></div>
          ${Auth.isLoggedIn() ? '<button class="btn btn--primary" onclick="App.navigate(\'upload\')">📤 Upload Note</button>' : ''}
        </div>
        <div class="notes-toolbar">
          <div class="search-bar">
            <span class="search-bar__icon">🔍</span>
            <input type="text" class="search-bar__input" id="notes-search" placeholder="Search notes by title, description, or tags..." oninput="Notes.onSearch(this.value)">
          </div>
          <div class="notes-toolbar__filters">
            <select class="form-input" style="width:auto;min-width:160px" onchange="Notes.onFilterSubject(this.value)">
              <option value="">All Subjects</option>
              ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="notes-grid" id="notes-grid"></div>
        <div id="notes-pagination" class="pagination"></div>
      </div>`;
    Notes.currentPage = 1;
    Notes.currentFilter = { search: '', subject: '' };
    Notes.renderGrid('notes-grid', Notes.getFiltered());
  },

  renderUpload() {
    const container = document.getElementById('page-upload');
    const subjects = Notes.getSubjects();
    container.innerHTML = `
      <div class="container upload-page">
        <div class="upload-page__header">
          <h1 class="section-title">📤 Upload Study Note</h1>
          <p class="section-subtitle">Share your study materials with the community</p>
        </div>
        <div class="card" style="padding:var(--space-8)">
          <form id="upload-form" onsubmit="Notes.handleUpload(event)">
            <div class="form-group"><label for="upload-title">Title</label><input type="text" class="form-input" id="upload-title" placeholder="e.g., Linear Algebra Chapter 3 Notes"><span class="form-error"></span></div>
            <div class="form-group"><label for="upload-subject">Subject</label><select class="form-input" id="upload-subject"><option value="">Select a subject</option>${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}</select><span class="form-error"></span></div>
            <div class="form-group"><label for="upload-desc">Description</label><textarea class="form-input" id="upload-desc" placeholder="Describe the content of your notes..."></textarea><span class="form-error"></span></div>
            <div class="form-group"><label for="upload-tags">Tags (comma separated)</label><input type="text" class="form-input" id="upload-tags" placeholder="e.g., algebra, vectors, matrices"></div>
            <div class="form-group">
              <label>File</label>
              <div class="file-upload" id="file-drop-zone" onclick="document.getElementById('upload-file').click()">
                <div class="file-upload__icon">📁</div>
                <div class="file-upload__text">Click to upload or <strong>drag and drop</strong></div>
                <div class="file-upload__hint">PDF, DOC, or TXT — Max 10 MB</div>
              </div>
              <input type="file" id="upload-file" accept=".pdf,.doc,.docx,.txt" style="display:none" onchange="if(this.files[0]) Notes.handleFileSelect(this.files[0])">
              <div id="file-preview"></div>
            </div>
            <button type="submit" class="btn btn--primary btn--lg" style="width:100%">Upload Note</button>
          </form>
        </div>
      </div>`;
    // Drag & drop
    const zone = document.getElementById('file-drop-zone');
    if (zone) {
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) Notes.handleFileSelect(e.dataTransfer.files[0]); });
    }
  },

  renderProfile() {
    const user = Auth.getUser();
    if (!user) return;
    const container = document.getElementById('page-profile');
    const myNotes = DB.getAll('notes').filter(n => n.userId === user.id);

    container.innerHTML = `
      <div class="container profile-page">
        <div class="card profile-header">
          ${UI.renderAvatar(user.name, 'xl')}
          <div class="profile-header__info">
            <h1 class="profile-header__name">${Notes.escHtml(user.name)}</h1>
            <p class="profile-header__email">${Notes.escHtml(user.email)}</p>
            <span class="badge ${user.role === 'admin' ? 'badge--warning' : 'badge--primary'} profile-header__role">${user.role}</span>
            <p class="text-xs text-tertiary" style="margin-top:var(--space-2)">Joined ${UI.formatDate(user.createdAt)}</p>
          </div>
        </div>
        <div class="card" style="padding:var(--space-8);margin-bottom:var(--space-8)">
          <h2 class="section-title mb-6">Edit Profile</h2>
          <form id="profile-form" onsubmit="App.handleProfileUpdate(event)">
            <div class="form-group"><label for="profile-name">Full Name</label><input type="text" class="form-input" id="profile-name" value="${Notes.escHtml(user.name)}"><span class="form-error"></span></div>
            <div class="form-group"><label for="profile-email">Email</label><input type="email" class="form-input" id="profile-email" value="${Notes.escHtml(user.email)}"><span class="form-error"></span></div>
            <button type="submit" class="btn btn--primary">Save Changes</button>
          </form>
        </div>
        ${myNotes.length ? `<div class="section-header"><div><h2 class="section-title">My Notes (${myNotes.length})</h2></div></div><div class="notes-grid" id="profile-notes"></div>` : ''}
      </div>`;
    if (myNotes.length) Notes.renderGrid('profile-notes', myNotes, false);
  },

  handleProfileUpdate(e) {
    e.preventDefault();
    const name = document.getElementById('profile-name');
    const email = document.getElementById('profile-email');
    let v = true;
    v = UI.validateField(name, { required: true, minLength: 2 }) && v;
    v = UI.validateField(email, { required: true, email: true }) && v;
    if (!v) return;
    Auth.updateProfile({ name: name.value.trim(), email: email.value.trim() });
    this.renderProfile();
  }
};

// Boot the app
document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
