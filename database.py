import sqlite3
import os

# On Railway, set DB_PATH=/data/scores.db and mount a Volume at /data
# Locally falls back to scores.db next to this file
DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "scores.db"))


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS high_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            level_reached INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def save_score(player_name: str, score: int, level_reached: int):
    conn = get_db()
    conn.execute(
        "INSERT INTO high_scores (player_name, score, level_reached) VALUES (?, ?, ?)",
        (player_name, score, level_reached),
    )
    conn.commit()
    conn.close()


def get_top_scores(limit: int = 10):
    conn = get_db()
    rows = conn.execute(
        "SELECT player_name, score, level_reached, created_at FROM high_scores ORDER BY score DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_score_threshold(limit: int = 100):
    """Return the minimum score in the top `limit` entries, and total count."""
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM high_scores").fetchone()[0]
    if total < limit:
        return {"top_min": 0, "total_count": total}
    row = conn.execute(
        "SELECT score FROM high_scores ORDER BY score DESC LIMIT 1 OFFSET ?",
        (limit - 1,),
    ).fetchone()
    conn.close()
    return {"top_min": row["score"] if row else 0, "total_count": total}


def clear_all_scores():
    conn = get_db()
    conn.execute("DELETE FROM high_scores")
    conn.execute("DELETE FROM sqlite_sequence WHERE name='high_scores'")
    conn.commit()
    conn.close()


def get_level_top_scores(level: int, limit: int = 5):
    conn = get_db()
    rows = conn.execute(
        "SELECT player_name, score, level_reached FROM high_scores WHERE level_reached >= ? ORDER BY score DESC LIMIT ?",
        (level, limit),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
