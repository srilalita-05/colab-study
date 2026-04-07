"""
Collaborative Study Notes Platform
===================================
A full-stack Flask web application for sharing, rating, and
collaborating on study notes.

Tech Stack:
  - Backend : Python / Flask
  - Database: SQLite  (via built-in sqlite3 module)
  - Frontend: Jinja2 HTML templates with internal CSS & vanilla JS
"""

import os
import sqlite3
import uuid
from datetime import datetime
from functools import wraps

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    session,
    send_from_directory,
    jsonify,
    g,
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# ---------------------------------------------------------------------------
# App Configuration
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.secret_key = "study-notes-secret-key-change-in-production"
app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max upload
app.config["DATABASE"] = os.path.join(os.path.dirname(__file__), "study_notes.db")

ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "txt", "pptx", "ppt", "xlsx", "xls", "png", "jpg", "jpeg", "zip"}

# Ensure upload directory exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


# ---------------------------------------------------------------------------
# Database Helpers
# ---------------------------------------------------------------------------
def get_db():
    """Open a new database connection if there isn't one for the current request."""
    if "db" not in g:
        g.db = sqlite3.connect(app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception):
    """Close the database connection at the end of the request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create all tables if they don't exist."""
    db = get_db()
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT    NOT NULL UNIQUE,
            email       TEXT    NOT NULL UNIQUE,
            password    TEXT    NOT NULL,
            is_admin    INTEGER DEFAULT 0,
            is_blocked  INTEGER DEFAULT 0,
            created_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS notes (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            title           TEXT NOT NULL,
            subject         TEXT NOT NULL,
            description     TEXT,
            tags            TEXT,
            filename        TEXT NOT NULL,
            original_name   TEXT NOT NULL,
            user_id         INTEGER NOT NULL,
            created_at      TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS comments (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            content     TEXT    NOT NULL,
            user_id     INTEGER NOT NULL,
            note_id     INTEGER NOT NULL,
            created_at  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ratings (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            score   INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
            user_id INTEGER NOT NULL,
            note_id INTEGER NOT NULL,
            UNIQUE(user_id, note_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS likes (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            note_id INTEGER NOT NULL,
            UNIQUE(user_id, note_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
        );
        """
    )
    db.commit()


def seed_sample_data():
    """Insert sample data for demonstration purposes (only if database is empty)."""
    db = get_db()
    user_count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if user_count > 0:
        return  # Already seeded

    # Create admin user  (password: admin123)
    admin_pw = generate_password_hash("admin123")
    db.execute(
        "INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, 1)",
        ("admin", "admin@studynotes.com", admin_pw),
    )

    # Create sample users (password: password123)
    sample_pw = generate_password_hash("password123")
    db.execute(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        ("rahul_sharma", "rahul@example.com", sample_pw),
    )
    db.execute(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        ("priya_patel", "priya@example.com", sample_pw),
    )
    db.execute(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        ("amit_kumar", "amit@example.com", sample_pw),
    )

    # Create sample note files (small text files for demo)
    sample_notes = [
        {
            "title": "Introduction to Python Programming",
            "subject": "Computer Science",
            "description": "Comprehensive notes covering Python basics, data types, control flow, functions, and OOP concepts. Perfect for beginners starting their programming journey.",
            "tags": "python,programming,basics,oop",
            "content": "Python Programming Notes\n========================\n\n1. Variables and Data Types\n2. Control Flow (if/else, loops)\n3. Functions and Modules\n4. Object-Oriented Programming\n5. File Handling\n6. Error Handling\n",
            "user_id": 2,
        },
        {
            "title": "Data Structures & Algorithms",
            "subject": "Computer Science",
            "description": "Detailed notes on arrays, linked lists, trees, graphs, sorting algorithms, and time complexity analysis with examples.",
            "tags": "dsa,algorithms,data-structures,sorting",
            "content": "DSA Notes\n=========\n\n1. Arrays and Strings\n2. Linked Lists\n3. Stacks and Queues\n4. Trees and BST\n5. Graphs (BFS, DFS)\n6. Sorting Algorithms\n7. Dynamic Programming\n",
            "user_id": 2,
        },
        {
            "title": "Database Management Systems",
            "subject": "Computer Science",
            "description": "Complete DBMS notes including ER diagrams, normalization, SQL queries, transactions, and concurrency control.",
            "tags": "dbms,sql,database,normalization",
            "content": "DBMS Notes\n==========\n\n1. ER Model and Diagrams\n2. Relational Model\n3. SQL - DDL, DML, DCL\n4. Normalization (1NF to BCNF)\n5. Transactions and ACID\n6. Concurrency Control\n",
            "user_id": 3,
        },
        {
            "title": "Operating Systems Concepts",
            "subject": "Computer Science",
            "description": "Notes covering process management, memory management, file systems, and CPU scheduling algorithms.",
            "tags": "os,operating-systems,scheduling,memory",
            "content": "Operating Systems Notes\n======================\n\n1. Process Management\n2. CPU Scheduling\n3. Deadlocks\n4. Memory Management\n5. Virtual Memory\n6. File Systems\n",
            "user_id": 3,
        },
        {
            "title": "Calculus - Differential & Integral",
            "subject": "Mathematics",
            "description": "Complete calculus notes with limits, derivatives, integrals, and their applications. Includes solved examples.",
            "tags": "math,calculus,derivatives,integrals",
            "content": "Calculus Notes\n==============\n\n1. Limits and Continuity\n2. Differentiation Rules\n3. Applications of Derivatives\n4. Integration Techniques\n5. Definite Integrals\n6. Applications of Integration\n",
            "user_id": 4,
        },
        {
            "title": "Web Development Fundamentals",
            "subject": "Computer Science",
            "description": "HTML, CSS, JavaScript basics and modern web development practices including responsive design and APIs.",
            "tags": "web,html,css,javascript,frontend",
            "content": "Web Development Notes\n====================\n\n1. HTML5 Semantic Elements\n2. CSS Flexbox and Grid\n3. JavaScript ES6+\n4. DOM Manipulation\n5. Fetch API and AJAX\n6. Responsive Design\n",
            "user_id": 4,
        },
    ]

    for note in sample_notes:
        fname = secure_filename(note["title"].replace(" ", "_").lower() + ".txt")
        fpath = os.path.join(app.config["UPLOAD_FOLDER"], fname)
        with open(fpath, "w") as f:
            f.write(note["content"])
        db.execute(
            "INSERT INTO notes (title, subject, description, tags, filename, original_name, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (note["title"], note["subject"], note["description"], note["tags"], fname, fname, note["user_id"]),
        )

    # Sample comments
    db.execute("INSERT INTO comments (content, user_id, note_id) VALUES (?, ?, ?)", ("Great notes! Very helpful for exam prep.", 3, 1))
    db.execute("INSERT INTO comments (content, user_id, note_id) VALUES (?, ?, ?)", ("Could you add more examples on OOP?", 4, 1))
    db.execute("INSERT INTO comments (content, user_id, note_id) VALUES (?, ?, ?)", ("The sorting algorithms section is excellent!", 2, 2))
    db.execute("INSERT INTO comments (content, user_id, note_id) VALUES (?, ?, ?)", ("Really well-organized notes. Thanks for sharing!", 4, 3))
    db.execute("INSERT INTO comments (content, user_id, note_id) VALUES (?, ?, ?)", ("Helped me understand normalization clearly.", 2, 3))

    # Sample ratings
    db.execute("INSERT INTO ratings (score, user_id, note_id) VALUES (?, ?, ?)", (5, 3, 1))
    db.execute("INSERT INTO ratings (score, user_id, note_id) VALUES (?, ?, ?)", (4, 4, 1))
    db.execute("INSERT INTO ratings (score, user_id, note_id) VALUES (?, ?, ?)", (5, 2, 2))
    db.execute("INSERT INTO ratings (score, user_id, note_id) VALUES (?, ?, ?)", (4, 4, 3))
    db.execute("INSERT INTO ratings (score, user_id, note_id) VALUES (?, ?, ?)", (5, 2, 3))
    db.execute("INSERT INTO ratings (score, user_id, note_id) VALUES (?, ?, ?)", (3, 3, 5))

    # Sample likes
    db.execute("INSERT INTO likes (user_id, note_id) VALUES (?, ?)", (3, 1))
    db.execute("INSERT INTO likes (user_id, note_id) VALUES (?, ?)", (4, 1))
    db.execute("INSERT INTO likes (user_id, note_id) VALUES (?, ?)", (2, 2))
    db.execute("INSERT INTO likes (user_id, note_id) VALUES (?, ?)", (4, 3))
    db.execute("INSERT INTO likes (user_id, note_id) VALUES (?, ?)", (2, 3))
    db.execute("INSERT INTO likes (user_id, note_id) VALUES (?, ?)", (3, 3))
    db.execute("INSERT INTO likes (user_id, note_id) VALUES (?, ?)", (2, 5))

    db.commit()


# ---------------------------------------------------------------------------
# Authentication Decorators
# ---------------------------------------------------------------------------
def login_required(f):
    """Decorator – redirect to login if user is not authenticated."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator – redirect if user is not an admin."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for("login"))
        if not session.get("is_admin"):
            flash("Admin access required.", "danger")
            return redirect(url_for("notes_list"))
        return f(*args, **kwargs)
    return decorated


def allowed_file(filename):
    """Check if filename has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------------------------------------------------------------------------
# Context Processor – inject user info into all templates
# ---------------------------------------------------------------------------
@app.context_processor
def inject_user():
    """Make current user data available in every template."""
    user = None
    if "user_id" in session:
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).fetchone()
    return dict(current_user=user)


# ---------------------------------------------------------------------------
# Routes – Pages
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    """Landing / home page."""
    db = get_db()
    # Get stats for the landing page
    total_notes = db.execute("SELECT COUNT(*) FROM notes").fetchone()[0]
    total_users = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_comments = db.execute("SELECT COUNT(*) FROM comments").fetchone()[0]

    # Get recent 3 notes for preview
    recent_notes = db.execute(
        """
        SELECT n.*, u.username,
               (SELECT COUNT(*) FROM likes WHERE note_id = n.id) as like_count,
               (SELECT ROUND(AVG(score), 1) FROM ratings WHERE note_id = n.id) as avg_rating,
               (SELECT COUNT(*) FROM comments WHERE note_id = n.id) as comment_count
        FROM notes n
        JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
        LIMIT 3
        """
    ).fetchall()
    return render_template(
        "index.html",
        total_notes=total_notes,
        total_users=total_users,
        total_comments=total_comments,
        recent_notes=recent_notes,
    )


# ---------------------------------------------------------------------------
# Routes – Authentication
# ---------------------------------------------------------------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    """User registration page and handler."""
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        confirm = request.form.get("confirm_password", "")

        # Validation
        errors = []
        if not username or len(username) < 3:
            errors.append("Username must be at least 3 characters.")
        if not email or "@" not in email:
            errors.append("Please enter a valid email address.")
        if not password or len(password) < 6:
            errors.append("Password must be at least 6 characters.")
        if password != confirm:
            errors.append("Passwords do not match.")

        db = get_db()
        if not errors:
            existing = db.execute(
                "SELECT id FROM users WHERE username = ? OR email = ?", (username, email)
            ).fetchone()
            if existing:
                errors.append("Username or email already exists.")

        if errors:
            for e in errors:
                flash(e, "danger")
            return render_template("register.html")

        hashed = generate_password_hash(password)
        db.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (username, email, hashed),
        )
        db.commit()
        flash("Registration successful! Please log in.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    """User login page and handler."""
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

        if user and check_password_hash(user["password"], password):
            if user["is_blocked"]:
                flash("Your account has been blocked. Contact admin.", "danger")
                return render_template("login.html")
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            session["is_admin"] = bool(user["is_admin"])
            flash(f"Welcome back, {user['username']}!", "success")
            return redirect(url_for("notes_list"))
        else:
            flash("Invalid username or password.", "danger")

    return render_template("login.html")


@app.route("/logout")
def logout():
    """Log the user out and clear session."""
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("index"))


# ---------------------------------------------------------------------------
# Routes – Notes
# ---------------------------------------------------------------------------
@app.route("/notes")
def notes_list():
    """Display all notes with optional search/filter."""
    db = get_db()
    search = request.args.get("search", "").strip()
    subject = request.args.get("subject", "").strip()

    query = """
        SELECT n.*, u.username,
               (SELECT COUNT(*) FROM likes WHERE note_id = n.id) as like_count,
               (SELECT ROUND(AVG(score), 1) FROM ratings WHERE note_id = n.id) as avg_rating,
               (SELECT COUNT(*) FROM ratings WHERE note_id = n.id) as rating_count,
               (SELECT COUNT(*) FROM comments WHERE note_id = n.id) as comment_count
        FROM notes n
        JOIN users u ON n.user_id = u.id
    """
    params = []

    conditions = []
    if search:
        conditions.append("(n.title LIKE ? OR n.description LIKE ? OR n.tags LIKE ?)")
        params.extend([f"%{search}%"] * 3)
    if subject:
        conditions.append("n.subject = ?")
        params.append(subject)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY n.created_at DESC"
    notes = db.execute(query, params).fetchall()

    # Get distinct subjects for filter dropdown
    subjects = db.execute("SELECT DISTINCT subject FROM notes ORDER BY subject").fetchall()

    return render_template("notes.html", notes=notes, subjects=subjects, search=search, selected_subject=subject)


@app.route("/note/<int:note_id>")
def note_detail(note_id):
    """View a single note with comments, ratings, and likes."""
    db = get_db()
    note = db.execute(
        """
        SELECT n.*, u.username,
               (SELECT COUNT(*) FROM likes WHERE note_id = n.id) as like_count,
               (SELECT ROUND(AVG(score), 1) FROM ratings WHERE note_id = n.id) as avg_rating,
               (SELECT COUNT(*) FROM ratings WHERE note_id = n.id) as rating_count
        FROM notes n
        JOIN users u ON n.user_id = u.id
        WHERE n.id = ?
        """,
        (note_id,),
    ).fetchone()

    if not note:
        flash("Note not found.", "danger")
        return redirect(url_for("notes_list"))

    # Comments
    comments = db.execute(
        """
        SELECT c.*, u.username
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.note_id = ?
        ORDER BY c.created_at DESC
        """,
        (note_id,),
    ).fetchall()

    # Check if current user has liked / rated
    user_liked = False
    user_rating = 0
    if "user_id" in session:
        like_row = db.execute(
            "SELECT id FROM likes WHERE user_id = ? AND note_id = ?",
            (session["user_id"], note_id),
        ).fetchone()
        user_liked = like_row is not None

        rating_row = db.execute(
            "SELECT score FROM ratings WHERE user_id = ? AND note_id = ?",
            (session["user_id"], note_id),
        ).fetchone()
        if rating_row:
            user_rating = rating_row["score"]

    return render_template(
        "note_detail.html",
        note=note,
        comments=comments,
        user_liked=user_liked,
        user_rating=user_rating,
    )


@app.route("/upload", methods=["GET", "POST"])
@login_required
def upload():
    """Upload a new note."""
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        subject = request.form.get("subject", "").strip()
        description = request.form.get("description", "").strip()
        tags = request.form.get("tags", "").strip()
        file = request.files.get("file")

        errors = []
        if not title:
            errors.append("Title is required.")
        if not subject:
            errors.append("Subject is required.")
        if not file or file.filename == "":
            errors.append("Please select a file to upload.")
        elif not allowed_file(file.filename):
            errors.append(f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

        if errors:
            for e in errors:
                flash(e, "danger")
            return render_template("upload.html")

        # Save file with unique name
        original = secure_filename(file.filename)
        ext = original.rsplit(".", 1)[1].lower()
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], unique_name))

        db = get_db()
        db.execute(
            "INSERT INTO notes (title, subject, description, tags, filename, original_name, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (title, subject, description, tags, unique_name, original, session["user_id"]),
        )
        db.commit()
        flash("Note uploaded successfully!", "success")
        return redirect(url_for("notes_list"))

    return render_template("upload.html")


@app.route("/download/<int:note_id>")
def download(note_id):
    """Download the file attached to a note."""
    db = get_db()
    note = db.execute("SELECT filename, original_name FROM notes WHERE id = ?", (note_id,)).fetchone()
    if not note:
        flash("Note not found.", "danger")
        return redirect(url_for("notes_list"))
    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        note["filename"],
        as_attachment=True,
        download_name=note["original_name"],
    )


@app.route("/note/<int:note_id>/delete", methods=["POST"])
@login_required
def delete_note(note_id):
    """Delete a note (owner or admin only)."""
    db = get_db()
    note = db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    if not note:
        flash("Note not found.", "danger")
        return redirect(url_for("notes_list"))

    if note["user_id"] != session["user_id"] and not session.get("is_admin"):
        flash("You are not authorized to delete this note.", "danger")
        return redirect(url_for("note_detail", note_id=note_id))

    # Remove the file from disk
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], note["filename"])
    if os.path.exists(filepath):
        os.remove(filepath)

    db.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    db.commit()
    flash("Note deleted successfully.", "success")
    return redirect(url_for("notes_list"))


# ---------------------------------------------------------------------------
# Routes – Interactions (Comment, Like, Rate)
# ---------------------------------------------------------------------------
@app.route("/note/<int:note_id>/comment", methods=["POST"])
@login_required
def add_comment(note_id):
    """Add a comment to a note."""
    content = request.form.get("content", "").strip()
    if not content:
        flash("Comment cannot be empty.", "warning")
        return redirect(url_for("note_detail", note_id=note_id))

    db = get_db()
    db.execute(
        "INSERT INTO comments (content, user_id, note_id) VALUES (?, ?, ?)",
        (content, session["user_id"], note_id),
    )
    db.commit()
    flash("Comment added!", "success")
    return redirect(url_for("note_detail", note_id=note_id))


@app.route("/note/<int:note_id>/like", methods=["POST"])
@login_required
def toggle_like(note_id):
    """Toggle like/unlike on a note (AJAX-friendly)."""
    db = get_db()
    existing = db.execute(
        "SELECT id FROM likes WHERE user_id = ? AND note_id = ?",
        (session["user_id"], note_id),
    ).fetchone()

    if existing:
        db.execute("DELETE FROM likes WHERE id = ?", (existing["id"],))
        liked = False
    else:
        db.execute("INSERT INTO likes (user_id, note_id) VALUES (?, ?)", (session["user_id"], note_id))
        liked = True

    db.commit()
    count = db.execute("SELECT COUNT(*) FROM likes WHERE note_id = ?", (note_id,)).fetchone()[0]

    # Return JSON for AJAX calls
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"liked": liked, "count": count})

    return redirect(url_for("note_detail", note_id=note_id))


@app.route("/note/<int:note_id>/rate", methods=["POST"])
@login_required
def rate_note(note_id):
    """Rate a note 1–5 stars (AJAX-friendly)."""
    score = request.form.get("score", type=int)
    if not score or score < 1 or score > 5:
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return jsonify({"error": "Invalid rating"}), 400
        flash("Invalid rating.", "warning")
        return redirect(url_for("note_detail", note_id=note_id))

    db = get_db()
    existing = db.execute(
        "SELECT id FROM ratings WHERE user_id = ? AND note_id = ?",
        (session["user_id"], note_id),
    ).fetchone()

    if existing:
        db.execute("UPDATE ratings SET score = ? WHERE id = ?", (score, existing["id"]))
    else:
        db.execute("INSERT INTO ratings (score, user_id, note_id) VALUES (?, ?, ?)", (score, session["user_id"], note_id))

    db.commit()
    row = db.execute(
        "SELECT ROUND(AVG(score), 1) as avg, COUNT(*) as cnt FROM ratings WHERE note_id = ?", (note_id,)
    ).fetchone()

    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"avg_rating": row["avg"], "rating_count": row["cnt"], "user_score": score})

    flash("Rating submitted!", "success")
    return redirect(url_for("note_detail", note_id=note_id))


# ---------------------------------------------------------------------------
# Routes – Profile
# ---------------------------------------------------------------------------
@app.route("/profile")
@login_required
def profile():
    """Show the current user's profile and their uploaded notes."""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).fetchone()
    user_notes = db.execute(
        """
        SELECT n.*,
               (SELECT COUNT(*) FROM likes WHERE note_id = n.id) as like_count,
               (SELECT ROUND(AVG(score), 1) FROM ratings WHERE note_id = n.id) as avg_rating,
               (SELECT COUNT(*) FROM comments WHERE note_id = n.id) as comment_count
        FROM notes n
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        """,
        (session["user_id"],),
    ).fetchall()
    return render_template("profile.html", user=user, user_notes=user_notes)


# ---------------------------------------------------------------------------
# Routes – Admin Dashboard
# ---------------------------------------------------------------------------
@app.route("/admin")
@admin_required
def admin_dashboard():
    """Admin dashboard – manage users and notes."""
    db = get_db()
    users = db.execute(
        """
        SELECT u.*,
               (SELECT COUNT(*) FROM notes WHERE user_id = u.id) as note_count
        FROM users u
        ORDER BY u.created_at DESC
        """
    ).fetchall()
    notes = db.execute(
        """
        SELECT n.*, u.username,
               (SELECT COUNT(*) FROM likes WHERE note_id = n.id) as like_count,
               (SELECT ROUND(AVG(score), 1) FROM ratings WHERE note_id = n.id) as avg_rating,
               (SELECT COUNT(*) FROM comments WHERE note_id = n.id) as comment_count
        FROM notes n
        JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
        """
    ).fetchall()
    stats = {
        "total_users": db.execute("SELECT COUNT(*) FROM users").fetchone()[0],
        "total_notes": db.execute("SELECT COUNT(*) FROM notes").fetchone()[0],
        "total_comments": db.execute("SELECT COUNT(*) FROM comments").fetchone()[0],
        "total_ratings": db.execute("SELECT COUNT(*) FROM ratings").fetchone()[0],
    }
    return render_template("admin.html", users=users, notes=notes, stats=stats)


@app.route("/admin/toggle_block/<int:user_id>", methods=["POST"])
@admin_required
def toggle_block(user_id):
    """Block or unblock a user."""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        flash("User not found.", "danger")
        return redirect(url_for("admin_dashboard"))
    if user["is_admin"]:
        flash("Cannot block an admin.", "warning")
        return redirect(url_for("admin_dashboard"))

    new_status = 0 if user["is_blocked"] else 1
    db.execute("UPDATE users SET is_blocked = ? WHERE id = ?", (new_status, user_id))
    db.commit()
    action = "blocked" if new_status else "unblocked"
    flash(f"User '{user['username']}' has been {action}.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/delete_user/<int:user_id>", methods=["POST"])
@admin_required
def admin_delete_user(user_id):
    """Delete a user and all their data."""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        flash("User not found.", "danger")
        return redirect(url_for("admin_dashboard"))
    if user["is_admin"]:
        flash("Cannot delete an admin.", "warning")
        return redirect(url_for("admin_dashboard"))

    # Remove user's uploaded files
    user_notes = db.execute("SELECT filename FROM notes WHERE user_id = ?", (user_id,)).fetchall()
    for n in user_notes:
        fpath = os.path.join(app.config["UPLOAD_FOLDER"], n["filename"])
        if os.path.exists(fpath):
            os.remove(fpath)

    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
    flash(f"User '{user['username']}' has been deleted.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/delete_note/<int:note_id>", methods=["POST"])
@admin_required
def admin_delete_note(note_id):
    """Admin: delete any note."""
    db = get_db()
    note = db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    if not note:
        flash("Note not found.", "danger")
        return redirect(url_for("admin_dashboard"))

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], note["filename"])
    if os.path.exists(filepath):
        os.remove(filepath)

    db.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    db.commit()
    flash("Note deleted by admin.", "success")
    return redirect(url_for("admin_dashboard"))


# ---------------------------------------------------------------------------
# Initialise DB on first request
# ---------------------------------------------------------------------------
@app.before_request
def before_first_request():
    """Initialise database tables + seed data on the very first request."""
    if not getattr(app, "_db_initialised", False):
        init_db()
        seed_sample_data()
        app._db_initialised = True


# ---------------------------------------------------------------------------
# Run the Application
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  Collaborative Study Notes Platform")
    print("  Running at: http://127.0.0.1:5000")
    print("=" * 60)
    print("\n  Sample Accounts:")
    print("    Admin  → username: admin  | password: admin123")
    print("    User 1 → username: rahul_sharma | password: password123")
    print("    User 2 → username: priya_patel  | password: password123")
    print("    User 3 → username: amit_kumar   | password: password123")
    print("=" * 60 + "\n")
    app.run(debug=True, port=5000)
