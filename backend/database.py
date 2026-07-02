import sqlite3
import os
from datetime import datetime, date

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "courses.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if we need to migrate/reset the database (i.e. if table exists but has no user_id column)
    db_needs_reset = False
    try:
        # Check if courses table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='courses'")
        if cursor.fetchone():
            # Test query for user_id column
            cursor.execute("SELECT user_id FROM courses LIMIT 1")
    except sqlite3.OperationalError as e:
        if "no such column" in str(e):
            db_needs_reset = True
            print("[DB SYSTEM] Old database schema detected. Resetting database to support multi-user profiles...")

    if db_needs_reset:
        cursor.execute("DROP TABLE IF EXISTS notes")
        cursor.execute("DROP TABLE IF EXISTS videos")
        cursor.execute("DROP TABLE IF EXISTS courses")
        cursor.execute("DROP TABLE IF EXISTS stats")
        cursor.execute("DROP TABLE IF EXISTS users")
        conn.commit()
        
    # Create Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            pin TEXT NOT NULL,
            security_question TEXT NOT NULL,
            security_answer TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create Courses Table (scoped to user_id)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create Videos Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            youtube_id TEXT NOT NULL,
            duration INTEGER NOT NULL,
            thumbnail_url TEXT,
            order_index INTEGER NOT NULL,
            completed INTEGER DEFAULT 0,
            offline_path TEXT,
            download_status TEXT DEFAULT 'none',
            download_progress INTEGER DEFAULT 0,
            FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
    """)
    
    # Create Notes Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id INTEGER UNIQUE NOT NULL,
            content TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE
        )
    """)
    
    # Create Stats Table (scoped to user_id)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stats (
            user_id INTEGER PRIMARY KEY,
            streak_days INTEGER DEFAULT 0,
            last_study_date TEXT DEFAULT '',
            total_seconds_watched INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()

# User Operations
def create_user(name: str, pin: str, security_question: str, security_answer: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (name, pin, security_question, security_answer)
        VALUES (?, ?, ?, ?)
    """, (name, pin, security_question, security_answer.strip().lower()))
    user_id = cursor.lastrowid
    
    # Initialize user stats
    cursor.execute("""
        INSERT INTO stats (user_id, streak_days, last_study_date, total_seconds_watched)
        VALUES (?, 0, '', 0)
    """, (user_id,))
    
    conn.commit()
    conn.close()
    return user_id

def get_all_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, created_at FROM users ORDER BY name ASC")
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return users

def get_user_by_id(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, security_question FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def verify_user_pin(user_id: int, pin: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT pin FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row and row["pin"] == pin:
        return True
    return False

def recover_user_pin(user_id: int, security_answer: str) -> str:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT pin, security_answer FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row and row["security_answer"] == security_answer.strip().lower():
        return row["pin"]
    return None

def update_user_profile(user_id: int, name: str, pin: str, security_question: str, security_answer: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users 
        SET name = ?, pin = ?, security_question = ?, security_answer = ?
        WHERE id = ?
    """, (name, pin, security_question, security_answer.strip().lower(), user_id))
    conn.commit()
    conn.close()
    return True

# Course Operations
def create_course(user_id: int, name: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO courses (user_id, name) VALUES (?, ?)", (user_id, name))
    course_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return course_id

def add_video(course_id: int, title: str, youtube_id: str, duration: int, thumbnail_url: str, order_index: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO videos (course_id, title, youtube_id, duration, thumbnail_url, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (course_id, title, youtube_id, duration, thumbnail_url, order_index))
    video_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return video_id

def get_all_courses(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM courses WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    courses = [dict(row) for row in cursor.fetchall()]
    
    for course in courses:
        cursor.execute("SELECT COUNT(*) as total, SUM(completed) as completed FROM videos WHERE course_id = ?", (course["id"],))
        stats = cursor.fetchone()
        course["total_videos"] = stats["total"] or 0
        course["completed_videos"] = stats["completed"] or 0
        
        # Check if all downloads completed
        cursor.execute("SELECT COUNT(*) FROM videos WHERE course_id = ? AND download_status = 'completed'", (course["id"],))
        downloaded = cursor.fetchone()[0]
        course["is_offline_ready"] = (downloaded == course["total_videos"]) if course["total_videos"] > 0 else False
        
    conn.close()
    return courses

def get_course_details(user_id: int, course_id: int):
    conn = get_db()
    cursor = conn.cursor()
    # Verify course ownership
    cursor.execute("SELECT * FROM courses WHERE id = ? AND user_id = ?", (course_id, user_id))
    course_row = cursor.fetchone()
    if not course_row:
        conn.close()
        return None
    
    course = dict(course_row)
    
    cursor.execute("SELECT * FROM videos WHERE course_id = ? ORDER BY order_index ASC", (course_id,))
    videos = [dict(row) for row in cursor.fetchall()]
    
    course["videos"] = videos
    conn.close()
    return course

def delete_course(user_id: int, course_id: int):
    conn = get_db()
    cursor = conn.cursor()
    # Verify course ownership first
    cursor.execute("SELECT id FROM courses WHERE id = ? AND user_id = ?", (course_id, user_id))
    if not cursor.fetchone():
        conn.close()
        return False
        
    # Get videos to delete local downloaded files
    cursor.execute("SELECT offline_path FROM videos WHERE course_id = ?", (course_id,))
    video_rows = cursor.fetchall()
    for row in video_rows:
        offline_path = row["offline_path"]
        if offline_path and os.path.exists(offline_path):
            try:
                os.remove(offline_path)
            except Exception as e:
                print(f"Error deleting local video: {e}")
                
    cursor.execute("DELETE FROM courses WHERE id = ?", (course_id,))
    conn.commit()
    conn.close()
    return True

# Video Operations
def set_video_completed_status(user_id: int, video_id: int, completed: bool):
    conn = get_db()
    cursor = conn.cursor()
    # Verify that this video belongs to a course owned by the user
    cursor.execute("""
        SELECT v.duration FROM videos v 
        JOIN courses c ON v.course_id = c.id
        WHERE v.id = ? AND c.user_id = ?
    """, (video_id, user_id))
    video = cursor.fetchone()
    if not video:
        conn.close()
        return False

    cursor.execute("UPDATE videos SET completed = ? WHERE id = ?", (1 if completed else 0, video_id))
    conn.commit()
    
    if completed:
        update_study_stats(user_id, video["duration"])
            
    conn.close()
    return True

def update_video_download_status(video_id: int, status: str, offline_path: str = None, progress: int = 0):
    conn = get_db()
    cursor = conn.cursor()
    if offline_path:
        cursor.execute("""
            UPDATE videos 
            SET download_status = ?, offline_path = ?, download_progress = ? 
            WHERE id = ?
        """, (status, offline_path, progress, video_id))
    else:
        cursor.execute("""
            UPDATE videos 
            SET download_status = ?, download_progress = ? 
            WHERE id = ?
        """, (status, progress, video_id))
    conn.commit()
    conn.close()
    return True

def get_video_by_id(video_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM videos WHERE id = ?", (video_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# Notes Operations
def save_video_note(video_id: int, content: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO notes (video_id, content, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(video_id) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP
    """, (video_id, content))
    conn.commit()
    conn.close()
    return True

def get_video_note(video_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM notes WHERE video_id = ?", (video_id,))
    row = cursor.fetchone()
    conn.close()
    return row["content"] if row else ""

# Stats Operations
def get_user_statistics(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM stats WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {"streak_days": 0, "last_study_date": "", "total_seconds_watched": 0}

def update_study_stats(user_id: int, duration_seconds: int):
    conn = get_db()
    cursor = conn.cursor()
    
    # Fetch current stats
    cursor.execute("SELECT streak_days, last_study_date, total_seconds_watched FROM stats WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return
        
    curr_total = int(row["total_seconds_watched"] or 0)
    new_total = curr_total + duration_seconds
    
    last_date_str = row["last_study_date"] or ""
    curr_streak = int(row["streak_days"] or 0)
    
    today = date.today()
    today_str = today.isoformat()
    new_streak = curr_streak
    
    if last_date_str == "":
        new_streak = 1
        last_date_str = today_str
    elif last_date_str != today_str:
        try:
            last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
            delta = today - last_date
            if delta.days == 1:
                new_streak = curr_streak + 1
            elif delta.days > 1:
                new_streak = 1
            last_date_str = today_str
        except Exception as e:
            print(f"Error calculating streak: {e}")
            
    cursor.execute("""
        UPDATE stats 
        SET streak_days = ?, last_study_date = ?, total_seconds_watched = ?
        WHERE user_id = ?
    """, (new_streak, last_date_str, new_total, user_id))
    
    conn.commit()
    conn.close()

def delete_user_profile(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    
    # Get all courses to delete downloaded files
    cursor.execute("SELECT id FROM courses WHERE user_id = ?", (user_id,))
    courses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    for course in courses:
        delete_course(user_id, course["id"])
        
    # Re-open connection to delete user
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return True
