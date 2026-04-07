/* ============================================
   DATA LAYER — LocalStorage CRUD & Schema
   ============================================ */

const DB = {
  // ---- Low-level helpers ----
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  },

  // ---- Generic CRUD ----
  getAll(collection) { return this.get(collection); },
  getById(collection, id) { return this.get(collection).find(item => item.id === id) || null; },
  create(collection, item) {
    const items = this.get(collection);
    const newItem = { ...item, id: this.genId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    this.set(collection, items);
    return newItem;
  },
  update(collection, id, updates) {
    const items = this.get(collection);
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    this.set(collection, items);
    return items[idx];
  },
  remove(collection, id) {
    const items = this.get(collection);
    this.set(collection, items.filter(item => item.id !== id));
  },
  removeWhere(collection, predicate) {
    const items = this.get(collection);
    this.set(collection, items.filter(item => !predicate(item)));
  },
  count(collection) { return this.get(collection).length; },

  // ---- Seed demo data on first load ----
  seed() {
    if (localStorage.getItem('_seeded')) return;

    // Demo users
    const users = [
      { id: 'u1', name: 'Alex Johnson', email: 'alex@demo.com', password: 'demo123', role: 'student', createdAt: '2026-01-15T10:00:00Z' },
      { id: 'u2', name: 'Sarah Chen', email: 'sarah@demo.com', password: 'demo123', role: 'student', createdAt: '2026-02-01T10:00:00Z' },
      { id: 'u3', name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'admin', createdAt: '2026-01-01T10:00:00Z' }
    ];
    this.set('users', users);

    // Demo notes
    const subjects = ['Mathematics', 'Physics', 'Computer Science', 'Biology', 'Chemistry', 'Literature', 'History', 'Economics'];
    const notes = [
      { id: 'n1', title: 'Linear Algebra Fundamentals', subject: 'Mathematics', description: 'Complete notes covering vector spaces, linear transformations, eigenvalues, and matrix operations. Includes solved examples and practice problems.', tags: ['algebra', 'vectors', 'matrices'], userId: 'u1', fileName: 'linear_algebra.pdf', fileType: 'application/pdf', fileSize: 2457600, createdAt: '2026-03-20T08:00:00Z' },
      { id: 'n2', title: 'Quantum Mechanics Introduction', subject: 'Physics', description: 'An introductory guide to quantum mechanics covering wave-particle duality, Schrödinger equation, and quantum states.', tags: ['quantum', 'physics', 'waves'], userId: 'u2', fileName: 'quantum_mechanics.pdf', fileType: 'application/pdf', fileSize: 3145728, createdAt: '2026-03-22T14:00:00Z' },
      { id: 'n3', title: 'Data Structures & Algorithms', subject: 'Computer Science', description: 'Comprehensive notes on arrays, linked lists, trees, graphs, sorting, searching, and dynamic programming with code examples.', tags: ['dsa', 'programming', 'algorithms'], userId: 'u1', fileName: 'dsa_notes.pdf', fileType: 'application/pdf', fileSize: 4194304, createdAt: '2026-03-25T09:00:00Z' },
      { id: 'n4', title: 'Cell Biology Complete Notes', subject: 'Biology', description: 'Detailed notes on cell structure, organelles, cell division, DNA replication, and protein synthesis.', tags: ['cells', 'biology', 'genetics'], userId: 'u2', fileName: 'cell_biology.doc', fileType: 'application/msword', fileSize: 1572864, createdAt: '2026-03-18T11:00:00Z' },
      { id: 'n5', title: 'Organic Chemistry Reactions', subject: 'Chemistry', description: 'Summary of organic chemistry reaction mechanisms including substitution, elimination, and addition reactions.', tags: ['organic', 'reactions', 'chemistry'], userId: 'u1', fileName: 'organic_chem.pdf', fileType: 'application/pdf', fileSize: 2097152, createdAt: '2026-03-15T16:00:00Z' },
      { id: 'n6', title: 'Shakespeare Literary Analysis', subject: 'Literature', description: 'Critical analysis of Shakespeare\'s major works including Hamlet, Macbeth, and Othello with thematic discussions.', tags: ['shakespeare', 'analysis', 'drama'], userId: 'u2', fileName: 'shakespeare_analysis.txt', fileType: 'text/plain', fileSize: 524288, createdAt: '2026-03-24T10:00:00Z' },
      { id: 'n7', title: 'Machine Learning Basics', subject: 'Computer Science', description: 'Introduction to machine learning covering supervised, unsupervised, and reinforcement learning with Python examples.', tags: ['ml', 'ai', 'python'], userId: 'u1', fileName: 'ml_basics.pdf', fileType: 'application/pdf', fileSize: 5242880, createdAt: '2026-03-27T08:00:00Z' },
      { id: 'n8', title: 'World War II Summary', subject: 'History', description: 'Comprehensive timeline and analysis of World War II including causes, major events, and aftermath.', tags: ['wwii', 'history', 'war'], userId: 'u2', fileName: 'wwii_summary.pdf', fileType: 'application/pdf', fileSize: 3670016, createdAt: '2026-03-26T13:00:00Z' }
    ];
    this.set('notes', notes);

    // Demo comments
    const comments = [
      { id: 'c1', noteId: 'n1', userId: 'u2', text: 'These notes are incredibly well-organized! The eigenvalue examples really helped me understand the concept.', createdAt: '2026-03-21T10:00:00Z' },
      { id: 'c2', noteId: 'n3', userId: 'u2', text: 'Best DSA notes I\'ve found! The dynamic programming section is especially clear.', createdAt: '2026-03-26T11:00:00Z' },
      { id: 'c3', noteId: 'n7', userId: 'u2', text: 'Great introduction to ML! Would love to see more on neural networks.', createdAt: '2026-03-28T09:00:00Z' },
      { id: 'c4', noteId: 'n2', userId: 'u1', text: 'The wave function explanations are very intuitive. Thanks for sharing!', createdAt: '2026-03-23T15:00:00Z' },
    ];
    this.set('comments', comments);

    // Demo ratings
    const ratings = [
      { id: 'r1', noteId: 'n1', userId: 'u2', value: 5, createdAt: '2026-03-21T10:00:00Z' },
      { id: 'r2', noteId: 'n3', userId: 'u2', value: 5, createdAt: '2026-03-26T11:00:00Z' },
      { id: 'r3', noteId: 'n7', userId: 'u2', value: 4, createdAt: '2026-03-28T09:00:00Z' },
      { id: 'r4', noteId: 'n2', userId: 'u1', value: 4, createdAt: '2026-03-23T15:00:00Z' },
      { id: 'r5', noteId: 'n5', userId: 'u2', value: 3, createdAt: '2026-03-16T10:00:00Z' },
    ];
    this.set('ratings', ratings);

    // Demo likes
    const likes = [
      { id: 'l1', noteId: 'n1', userId: 'u2', createdAt: '2026-03-21T10:00:00Z' },
      { id: 'l2', noteId: 'n3', userId: 'u2', createdAt: '2026-03-26T11:00:00Z' },
      { id: 'l3', noteId: 'n7', userId: 'u2', createdAt: '2026-03-28T09:00:00Z' },
      { id: 'l4', noteId: 'n7', userId: 'u1', createdAt: '2026-03-28T09:30:00Z' },
      { id: 'l5', noteId: 'n3', userId: 'u1', createdAt: '2026-03-26T12:00:00Z' },
      { id: 'l6', noteId: 'n2', userId: 'u1', createdAt: '2026-03-23T15:00:00Z' },
    ];
    this.set('likes', likes);

    this.set('bookmarks', []);
    localStorage.setItem('_seeded', '1');
  },

  // ---- Query helpers ----
  getNoteStats(noteId) {
    const likes = this.get('likes').filter(l => l.noteId === noteId).length;
    const ratings = this.get('ratings').filter(r => r.noteId === noteId);
    const comments = this.get('comments').filter(c => c.noteId === noteId).length;
    const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.value, 0) / ratings.length) : 0;
    return { likes, ratingCount: ratings.length, avgRating: Math.round(avgRating * 10) / 10, comments };
  },
  getUserName(userId) {
    const user = this.getById('users', userId);
    return user ? user.name : 'Unknown';
  },
  isLiked(noteId, userId) {
    return this.get('likes').some(l => l.noteId === noteId && l.userId === userId);
  },
  isBookmarked(noteId, userId) {
    return this.get('bookmarks').some(b => b.noteId === noteId && b.userId === userId);
  },
  getUserRating(noteId, userId) {
    const rating = this.get('ratings').find(r => r.noteId === noteId && r.userId === userId);
    return rating ? rating.value : 0;
  },
  toggleLike(noteId, userId) {
    const likes = this.get('likes');
    const idx = likes.findIndex(l => l.noteId === noteId && l.userId === userId);
    if (idx >= 0) { likes.splice(idx, 1); this.set('likes', likes); return false; }
    else { likes.push({ id: this.genId(), noteId, userId, createdAt: new Date().toISOString() }); this.set('likes', likes); return true; }
  },
  toggleBookmark(noteId, userId) {
    const bookmarks = this.get('bookmarks');
    const idx = bookmarks.findIndex(b => b.noteId === noteId && b.userId === userId);
    if (idx >= 0) { bookmarks.splice(idx, 1); this.set('bookmarks', bookmarks); return false; }
    else { bookmarks.push({ id: this.genId(), noteId, userId, createdAt: new Date().toISOString() }); this.set('bookmarks', bookmarks); return true; }
  },
  setRating(noteId, userId, value) {
    const ratings = this.get('ratings');
    const idx = ratings.findIndex(r => r.noteId === noteId && r.userId === userId);
    if (idx >= 0) { ratings[idx].value = value; }
    else { ratings.push({ id: this.genId(), noteId, userId, value, createdAt: new Date().toISOString() }); }
    this.set('ratings', ratings);
  }
};

// Export for module usage
window.DB = DB;
