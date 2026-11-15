import os
import sqlite3
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    RealDictCursor = None

from backend.config import settings

class DBService:
    def __init__(self):
        self.is_sqlite = settings.is_db_mocked or not PSYCOPG2_AVAILABLE
        self.sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "database", "duodo_local.db")
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
        
        # Test connection if postgres is configured; if unreachable, gracefully fallback to SQLite
        if not self.is_sqlite:
            try:
                conn = psycopg2.connect(settings.DATABASE_URL, connect_timeout=5)
                conn.close()
                print("Connected to PostgreSQL successfully.")
            except Exception as e:
                print(f"[WARNING] PostgreSQL connection failed: {e}. Falling back to SQLite mode!")
                self.is_sqlite = True

        self.init_db()

    def get_conn(self):
        if self.is_sqlite:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            return conn
        else:
            try:
                conn = psycopg2.connect(settings.DATABASE_URL, connect_timeout=5)
                return conn
            except Exception as e:
                print(f"[WARNING] PostgreSQL connection error: {e}. Falling back to SQLite.")
                self.is_sqlite = True
                conn = sqlite3.connect(self.sqlite_path)
                conn.row_factory = sqlite3.Row
                return conn

    def execute_query(self, query, params=None, commit=False, fetch_one=False, fetch_all=False):
        conn = self.get_conn()
        try:
            if self.is_sqlite:
                cursor = conn.cursor()
                cursor.execute(query, params or ())
                if commit:
                    conn.commit()
                
                if fetch_one:
                    row = cursor.fetchone()
                    return dict(row) if row else None
                elif fetch_all:
                    rows = cursor.fetchall()
                    return [dict(row) for row in rows]
                return cursor.lastrowid
            else:
                # PostgreSQL
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute(query, params or ())
                if commit:
                    conn.commit()
                
                if fetch_one:
                    row = cursor.fetchone()
                    return dict(row) if row else None
                elif fetch_all:
                    rows = cursor.fetchall()
                    return [dict(row) for row in rows]
                return cursor.statusmessage
        except Exception as e:
            print(f"Database error executing query: {query}. Error: {e}")
            if not self.is_sqlite:
                conn.rollback()
            raise e
        finally:
            conn.close()

    def init_db(self):
        """Initializes database schema. Translates basic Postgres queries to SQLite if in SQLite mode."""
        if self.is_sqlite:
            # SQLite Initializer
            # UUID is mapped to TEXT, SERIAL to INTEGER PRIMARY KEY AUTOINCREMENT, JSONB to TEXT
            queries = [
                """CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    firebase_uid TEXT UNIQUE NOT NULL,
                    name TEXT,
                    email TEXT UNIQUE NOT NULL,
                    photo TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""",
                """CREATE TABLE IF NOT EXISTS watchlists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    stock_symbol TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, stock_symbol)
                )""",
                """CREATE TABLE IF NOT EXISTS sentiment_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    stock_symbol TEXT NOT NULL,
                    sentiment TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    source TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""",
                """CREATE TABLE IF NOT EXISTS news (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    summary TEXT,
                    url TEXT UNIQUE NOT NULL,
                    publisher TEXT,
                    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ai_summary TEXT,
                    sentiment TEXT,
                    confidence REAL
                )""",
                """CREATE TABLE IF NOT EXISTS portfolio (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    stock_symbol TEXT NOT NULL,
                    quantity REAL NOT NULL,
                    avg_price REAL NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, stock_symbol)
                )""",
                """CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    stock_symbol TEXT NOT NULL,
                    alert_type TEXT NOT NULL,
                    threshold REAL NOT NULL,
                    is_active INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""",
                """CREATE TABLE IF NOT EXISTS chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    sentiment_data TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )""",
                """CREATE TABLE IF NOT EXISTS feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    message TEXT NOT NULL,
                    rating INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )"""
            ]
            for q in queries:
                self.execute_query(q, commit=True)
            print("SQLite Database Initialized.")
        else:
            # PostgreSQL Initializer
            # Read from schema.sql
            schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "database", "schema.sql")
            if os.path.exists(schema_path):
                with open(schema_path, "r") as f:
                    schema_sql = f.read()
                try:
                    conn = self.get_conn()
                    cursor = conn.cursor()
                    cursor.execute(schema_sql)
                    conn.commit()
                    conn.close()
                    print("PostgreSQL Database Schema Synced.")
                except Exception as e:
                    print(f"[WARNING] Error executing schema.sql on PostgreSQL: {e}. Falling back to SQLite.")
                    self.is_sqlite = True
                    self.init_db()

    # --- Users Operations ---
    def sync_firebase_user(self, firebase_uid, email, name, photo):
        # We generate a UUID for sqlite if it's new
        # Check if user already exists
        exists_query = "SELECT * FROM users WHERE firebase_uid = %s" if not self.is_sqlite else "SELECT * FROM users WHERE firebase_uid = ?"
        user = self.execute_query(exists_query, (firebase_uid,), fetch_one=True)
        
        if user:
            # Update user info in case it changed (e.g. photo, name)
            update_query = """
                UPDATE users SET name = %s, photo = %s WHERE firebase_uid = %s
            """ if not self.is_sqlite else """
                UPDATE users SET name = ?, photo = ? WHERE firebase_uid = ?
            """
            self.execute_query(update_query, (name, photo, firebase_uid), commit=True)
            return self.execute_query(exists_query, (firebase_uid,), fetch_one=True)
        else:
            # Insert user
            import uuid
            new_id = str(uuid.uuid4())
            insert_query = """
                INSERT INTO users (id, firebase_uid, name, email, photo)
                VALUES (%s, %s, %s, %s, %s)
            """ if not self.is_sqlite else """
                INSERT INTO users (id, firebase_uid, name, email, photo)
                VALUES (?, ?, ?, ?, ?)
            """
            if not self.is_sqlite:
                # In PostgreSQL, we can use gen_random_uuid() or pass a UUID. Let's pass the generated UUID for consistency.
                self.execute_query(insert_query, (new_id, firebase_uid, name, email, photo), commit=True)
            else:
                self.execute_query(insert_query, (new_id, firebase_uid, name, email, photo), commit=True)
            return self.execute_query(exists_query, (firebase_uid,), fetch_one=True)

    def get_user_by_firebase_uid(self, firebase_uid):
        query = "SELECT * FROM users WHERE firebase_uid = %s" if not self.is_sqlite else "SELECT * FROM users WHERE firebase_uid = ?"
        return self.execute_query(query, (firebase_uid,), fetch_one=True)

    # --- Watchlist Operations ---
    def get_watchlist(self, user_id):
        query = "SELECT stock_symbol FROM watchlists WHERE user_id = %s" if not self.is_sqlite else "SELECT stock_symbol FROM watchlists WHERE user_id = ?"
        rows = self.execute_query(query, (user_id,), fetch_all=True)
        return [r["stock_symbol"] for r in rows]

    def add_to_watchlist(self, user_id, stock_symbol):
        stock_symbol = stock_symbol.upper().strip()
        query = """
            INSERT INTO watchlists (user_id, stock_symbol) VALUES (%s, %s)
            ON CONFLICT (user_id, stock_symbol) DO NOTHING
        """ if not self.is_sqlite else """
            INSERT OR IGNORE INTO watchlists (user_id, stock_symbol) VALUES (?, ?)
        """
        self.execute_query(query, (user_id, stock_symbol), commit=True)

    def remove_from_watchlist(self, user_id, stock_symbol):
        stock_symbol = stock_symbol.upper().strip()
        query = "DELETE FROM watchlists WHERE user_id = %s AND stock_symbol = %s" if not self.is_sqlite else "DELETE FROM watchlists WHERE user_id = ? AND stock_symbol = ?"
        self.execute_query(query, (user_id, stock_symbol), commit=True)

    # --- Portfolio Operations ---
    def get_portfolio(self, user_id):
        query = "SELECT * FROM portfolio WHERE user_id = %s" if not self.is_sqlite else "SELECT * FROM portfolio WHERE user_id = ?"
        return self.execute_query(query, (user_id,), fetch_all=True)

    def add_to_portfolio(self, user_id, stock_symbol, quantity, avg_price):
        stock_symbol = stock_symbol.upper().strip()
        query = """
            INSERT INTO portfolio (user_id, stock_symbol, quantity, avg_price)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, stock_symbol) 
            DO UPDATE SET quantity = portfolio.quantity + EXCLUDED.quantity,
                          avg_price = (portfolio.avg_price * portfolio.quantity + EXCLUDED.avg_price * EXCLUDED.quantity) / (portfolio.quantity + EXCLUDED.quantity)
        """ if not self.is_sqlite else """
            INSERT INTO portfolio (user_id, stock_symbol, quantity, avg_price)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (user_id, stock_symbol)
            DO UPDATE SET 
                avg_price = (portfolio.avg_price * portfolio.quantity + excluded.avg_price * excluded.quantity) / (portfolio.quantity + excluded.quantity),
                quantity = portfolio.quantity + excluded.quantity
        """
        self.execute_query(query, (user_id, stock_symbol, float(quantity), float(avg_price)), commit=True)

    def remove_from_portfolio(self, user_id, stock_symbol):
        stock_symbol = stock_symbol.upper().strip()
        query = "DELETE FROM portfolio WHERE user_id = %s AND stock_symbol = %s" if not self.is_sqlite else "DELETE FROM portfolio WHERE user_id = ? AND stock_symbol = ?"
        self.execute_query(query, (user_id, stock_symbol), commit=True)

    # --- Alerts Operations ---
    def get_alerts(self, user_id):
        query = "SELECT * FROM alerts WHERE user_id = %s ORDER BY created_at DESC" if not self.is_sqlite else "SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC"
        return self.execute_query(query, (user_id,), fetch_all=True)

    def create_alert(self, user_id, stock_symbol, alert_type, threshold):
        query = """
            INSERT INTO alerts (user_id, stock_symbol, alert_type, threshold)
            VALUES (%s, %s, %s, %s)
        """ if not self.is_sqlite else """
            INSERT INTO alerts (user_id, stock_symbol, alert_type, threshold)
            VALUES (?, ?, ?, ?)
        """
        self.execute_query(query, (user_id, stock_symbol.upper(), alert_type, float(threshold)), commit=True)

    def delete_alert(self, user_id, alert_id):
        query = "DELETE FROM alerts WHERE user_id = %s AND id = %s" if not self.is_sqlite else "DELETE FROM alerts WHERE user_id = ? AND id = ?"
        self.execute_query(query, (user_id, int(alert_id)), commit=True)

    # --- Chat History Operations ---
    def get_chat_history(self, user_id):
        query = "SELECT * FROM chat_history WHERE user_id = %s ORDER BY timestamp DESC LIMIT 50" if not self.is_sqlite else "SELECT * FROM chat_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50"
        import json
        rows = self.execute_query(query, (user_id,), fetch_all=True)
        if self.is_sqlite:
            # Parse json strings in sqlite
            for r in rows:
                if r.get("sentiment_data"):
                    try:
                        r["sentiment_data"] = json.loads(r["sentiment_data"])
                    except:
                        pass
        return rows

    def save_chat_message(self, user_id, question, answer, sentiment_data=None):
        import json
        sentiment_json = json.dumps(sentiment_data) if sentiment_data else None
        query = """
            INSERT INTO chat_history (user_id, question, answer, sentiment_data)
            VALUES (%s, %s, %s, %s)
        """ if not self.is_sqlite else """
            INSERT INTO chat_history (user_id, question, answer, sentiment_data)
            VALUES (?, ?, ?, ?)
        """
        self.execute_query(query, (user_id, question, answer, sentiment_json), commit=True)

    # --- Feedback Operations ---
    def save_feedback(self, user_id, message, rating):
        query = """
            INSERT INTO feedback (user_id, message, rating) VALUES (%s, %s, %s)
        """ if not self.is_sqlite else """
            INSERT INTO feedback (user_id, message, rating) VALUES (?, ?, ?)
        """
        self.execute_query(query, (user_id, message, int(rating)), commit=True)

    def get_feedbacks(self):
        query = """
            SELECT f.*, u.name as user_name, u.email as user_email, u.photo as user_photo 
            FROM feedback f 
            JOIN users u ON f.user_id = u.id 
            ORDER BY f.created_at DESC
        """
        return self.execute_query(query, fetch_all=True)

    # --- Sentiment History ---
    def save_sentiment_record(self, stock_symbol, sentiment, confidence, source):
        query = """
            INSERT INTO sentiment_history (stock_symbol, sentiment, confidence, source)
            VALUES (%s, %s, %s, %s)
        """ if not self.is_sqlite else """
            INSERT INTO sentiment_history (stock_symbol, sentiment, confidence, source)
            VALUES (?, ?, ?, ?)
        """
        self.execute_query(query, (stock_symbol.upper(), sentiment, float(confidence), source), commit=True)

    def get_sentiment_records(self, stock_symbol, limit=20):
        query = """
            SELECT * FROM sentiment_history 
            WHERE stock_symbol = %s 
            ORDER BY created_at DESC LIMIT %s
        """ if not self.is_sqlite else """
            SELECT * FROM sentiment_history 
            WHERE stock_symbol = ? 
            ORDER BY created_at DESC LIMIT ?
        """
        return self.execute_query(query, (stock_symbol.upper(), limit), fetch_all=True)

    # --- Admin Analytics ---
    def get_admin_analytics(self):
        user_count = self.execute_query("SELECT COUNT(*) as count FROM users", fetch_one=True)["count"]
        feedback_count = self.execute_query("SELECT COUNT(*) as count FROM feedback", fetch_one=True)["count"]
        watchlist_count = self.execute_query("SELECT COUNT(*) as count FROM watchlists", fetch_one=True)["count"]
        chat_count = self.execute_query("SELECT COUNT(*) as count FROM chat_history", fetch_one=True)["count"]
        
        return {
            "user_count": user_count,
            "feedback_count": feedback_count,
            "watchlist_count": watchlist_count,
            "chat_count": chat_count
        }

db_service = DBService()
