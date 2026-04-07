# 📚 Collaborative Study Notes Platform

A **full-stack web application** built with Python Flask that lets students share, discover, rate, and collaborate on study notes.

---

## 🏗 Tech Stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Backend    | **Python 3** + **Flask**         |
| Database   | **SQLite** (built-in, no setup)  |
| Frontend   | **HTML** + **JavaScript**        |
| Styling    | **Internal CSS** (inside HTML)   |
| Auth       | Session-based + password hashing |

---

## 📂 Project Structure

```
wp project/
├── app.py                  # Main Flask application (all routes)
├── requirements.txt        # Python dependencies
├── study_notes.db          # SQLite database (auto-created)
├── uploads/                # Uploaded note files (auto-created)
├── templates/              # HTML templates (Jinja2)
│   ├── base.html           # Base layout (navbar, CSS, footer)
│   ├── index.html          # Landing page
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── notes.html          # Browse all notes
│   ├── note_detail.html    # Single note view (comments/ratings)
│   ├── upload.html         # Upload new note
│   ├── profile.html        # User profile
│   └── admin.html          # Admin dashboard
└── README.md               # This file
```

---

## 🚀 How to Run (Step-by-Step)

### Prerequisites
- Python 3.8 or higher installed ([Download Python](https://www.python.org/downloads/))

### 1. Open Terminal / Command Prompt

Navigate to the project directory:
```bash
cd "path/to/wp project"
```

### 2. (Optional) Create a Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Server
```bash
python app.py
```

### 5. Open in Your Browser
Navigate to: **http://127.0.0.1:5000**

---

## 🔑 Sample Test Accounts

The database is **auto-seeded** with sample data on first run:

| Role    | Username        | Password      |
|---------|-----------------|---------------|
| Admin   | `admin`         | `admin123`    |
| User 1  | `rahul_sharma`  | `password123` |
| User 2  | `priya_patel`   | `password123` |
| User 3  | `amit_kumar`    | `password123` |

---

## ✨ Features

### User System
- **Registration** with form validation and password strength indicator
- **Login/Logout** with session-based authentication
- **Profile page** showing uploaded notes and statistics

### Notes Management
- **Upload notes** (PDF, DOCX, PPTX, TXT, images, ZIP – up to 16 MB)
- **Title, subject, description, tags** for each note
- **Search** by title, description, or tags
- **Filter** by subject
- **Download** and **delete** notes
- **Modern card layout** with hover effects

### Collaboration
- **Comment system** on each note
- **Like/Unlike** toggle (AJAX-powered, no page reload)
- **Star rating** system (1–5 stars, AJAX-powered)

### Admin Dashboard
- **Platform statistics** (users, notes, comments, ratings)
- **Manage users** — block/unblock, delete
- **Manage notes** — view details, delete any note
- **Tabbed interface** for Users vs Notes

---

## 🔗 Backend Routes

| Method     | Route                          | Description                    |
|------------|--------------------------------|--------------------------------|
| GET        | `/`                            | Landing page                   |
| GET/POST   | `/register`                    | User registration              |
| GET/POST   | `/login`                       | User login                     |
| GET        | `/logout`                      | Logout (clears session)        |
| GET        | `/notes`                       | Browse all notes (search/filter) |
| GET        | `/note/<id>`                   | View note detail               |
| GET/POST   | `/upload`                      | Upload a new note              |
| GET        | `/download/<id>`               | Download a note file           |
| POST       | `/note/<id>/delete`            | Delete a note (owner/admin)    |
| POST       | `/note/<id>/comment`           | Add comment                    |
| POST       | `/note/<id>/like`              | Toggle like (AJAX supported)   |
| POST       | `/note/<id>/rate`              | Rate 1–5 (AJAX supported)     |
| GET        | `/profile`                     | View user profile              |
| GET        | `/admin`                       | Admin dashboard                |
| POST       | `/admin/toggle_block/<id>`     | Block/unblock user             |
| POST       | `/admin/delete_user/<id>`      | Delete user                    |
| POST       | `/admin/delete_note/<id>`      | Admin delete note              |

---

## 🗄 Database Schema (SQLite)

### Users Table
```sql
CREATE TABLE users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT NOT NULL UNIQUE,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,         -- bcrypt hashed
    is_admin    INTEGER DEFAULT 0,
    is_blocked  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);
```

### Notes Table
```sql
CREATE TABLE notes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    subject         TEXT NOT NULL,
    description     TEXT,
    tags            TEXT,
    filename        TEXT NOT NULL,     -- UUID-based stored name
    original_name   TEXT NOT NULL,     -- user's original filename
    user_id         INTEGER NOT NULL,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Comments Table
```sql
CREATE TABLE comments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    content     TEXT NOT NULL,
    user_id     INTEGER NOT NULL,
    note_id     INTEGER NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

### Ratings Table
```sql
CREATE TABLE ratings (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    score   INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
    user_id INTEGER NOT NULL,
    note_id INTEGER NOT NULL,
    UNIQUE(user_id, note_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

### Likes Table
```sql
CREATE TABLE likes (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    note_id INTEGER NOT NULL,
    UNIQUE(user_id, note_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

---

## 🔄 How Frontend Connects to Backend

1. **HTML forms** submit data via POST to Flask routes (e.g., `/register`, `/login`, `/upload`)
2. **Flask** processes form data via `request.form` and `request.files`
3. **Jinja2 templates** render dynamic HTML using data passed from Flask routes
4. **Session cookies** (`flask.session`) track logged-in users across requests
5. **AJAX** (Fetch API) is used for like/unlike and rating — sends data with `X-Requested-With: XMLHttpRequest` header, and Flask returns JSON
6. **Flash messages** (`flask.flash`) display success/error notifications after form submissions
7. **File uploads** are handled by `werkzeug` — files are saved to `/uploads/` with UUID filenames for security

---

## 🔒 Security Features

- **Password hashing** via `werkzeug.security` (PBKDF2 + SHA-256)
- **Secure filenames** — uploaded files get UUID names to prevent path traversal
- **Session-based auth** with server-side session management
- **Authorization checks** — decorators ensure only logged-in users can upload/comment/rate
- **Admin-only routes** — protected by `@admin_required` decorator
- **File type validation** — only allowed extensions can be uploaded
- **File size limit** — max 16 MB upload size
- **SQL injection prevention** — parameterized queries throughout
- **Foreign key constraints** — with CASCADE delete for data integrity
- **Input validation** — both client-side (JS) and server-side (Python)
- **Blocked user enforcement** — blocked users cannot log in

---

## 📄 License

This project was built for educational purposes as a college project demonstration.
