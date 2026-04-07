/* ============================================
   AUTH MODULE — Login, Register, Session
   ============================================ */

const Auth = {
  // ---- Session ----
  getUser() {
    try { return JSON.parse(sessionStorage.getItem('currentUser')); }
    catch { return null; }
  },
  setUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  },
  logout() {
    sessionStorage.removeItem('currentUser');
    App.navigate('home');
    App.updateNav();
    UI.toast('Logged out successfully', 'info');
  },
  isLoggedIn() { return !!this.getUser(); },
  isAdmin() { return this.getUser()?.role === 'admin'; },

  // ---- Register ----
  register(name, email, password, role = 'student') {
    const users = DB.getAll('users');
    if (users.find(u => u.email === email)) {
      UI.toast('An account with this email already exists', 'error');
      return false;
    }
    const user = DB.create('users', { name, email, password, role });
    this.setUser(user);
    UI.toast('Account created successfully! Welcome! 🎉', 'success');
    return true;
  },

  // ---- Login ----
  login(email, password) {
    const users = DB.getAll('users');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      UI.toast('Invalid email or password', 'error');
      return false;
    }
    this.setUser(user);
    UI.toast(`Welcome back, ${user.name}! 👋`, 'success');
    return true;
  },

  // ---- Update Profile ----
  updateProfile(updates) {
    const user = this.getUser();
    if (!user) return false;
    const updated = DB.update('users', user.id, updates);
    if (updated) {
      this.setUser(updated);
      App.updateNav();
      UI.toast('Profile updated successfully', 'success');
      return true;
    }
    return false;
  }
};

window.Auth = Auth;
