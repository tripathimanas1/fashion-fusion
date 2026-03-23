#!/usr/bin/env python3
"""
Create fresh FashionFusion database — schema matches ORM models exactly.
Run: python create_fresh_database.py
"""
import os
from sqlalchemy import create_engine, text
from config import settings


def create_fresh_database():
    db_path = settings.DATABASE_URL.replace("sqlite:///", "").replace("sqlite://", "")

    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"🗑️  Deleted: {db_path}")

    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

    try:
        print("🔧 Creating fresh FashionFusion database...")

        with engine.connect() as conn:
            conn.execute(text("PRAGMA foreign_keys = ON"))
            print("📋 Creating tables...")

            # ── users ────────────────────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE users (
                    id                INTEGER PRIMARY KEY AUTOINCREMENT,
                    email             VARCHAR UNIQUE NOT NULL,
                    username          VARCHAR UNIQUE NOT NULL,
                    full_name         VARCHAR,
                    password_hash     VARCHAR NOT NULL,
                    is_active         INTEGER DEFAULT 1,
                    is_designer       INTEGER DEFAULT 0,
                    is_tailor         INTEGER DEFAULT 0,
                    bio               TEXT,
                    phone             VARCHAR,
                    location          TEXT,
                    city              VARCHAR,
                    country           VARCHAR,
                    business_name     VARCHAR,
                    specialization    VARCHAR,
                    years_experience  INTEGER,
                    rating            REAL DEFAULT 0.0,
                    profile_image_url VARCHAR,
                    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── tailors ──────────────────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE tailors (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id          INTEGER UNIQUE NOT NULL REFERENCES users(id),
                    business_name    VARCHAR NOT NULL,
                    specialization   VARCHAR NOT NULL,
                    description      TEXT,
                    rating           REAL DEFAULT 0.0,
                    location         VARCHAR,
                    phone            VARCHAR,
                    email            VARCHAR UNIQUE NOT NULL,
                    is_verified      INTEGER DEFAULT 0,
                    is_active        INTEGER DEFAULT 1,
                    experience_years INTEGER DEFAULT 0,
                    price_range_min  REAL,
                    price_range_max  REAL,
                    portfolio_images TEXT,
                    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── boards ───────────────────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE boards (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id     INTEGER NOT NULL REFERENCES users(id),
                    title       VARCHAR NOT NULL,
                    description TEXT,
                    is_public   INTEGER DEFAULT 0,
                    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── designs — CORRECT schema matching ORM model ──────────────────
            conn.execute(text("""
                CREATE TABLE designs (
                    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id                INTEGER NOT NULL REFERENCES users(id),
                    board_id               INTEGER REFERENCES boards(id),
                    title                  VARCHAR,
                    description            TEXT,
                    prompt                 TEXT NOT NULL,
                    generation_type        VARCHAR NOT NULL,
                    reference_image_url    VARCHAR,
                    image_urls             TEXT NOT NULL,
                    color_palette          TEXT,
                    style_recommendations  TEXT,
                    fabric_recommendations TEXT,
                    is_public              INTEGER DEFAULT 0,
                    likes_count            INTEGER DEFAULT 0,
                    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── saved_designs ────────────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE saved_designs (
                    id        INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id   INTEGER NOT NULL REFERENCES users(id),
                    design_id INTEGER NOT NULL REFERENCES designs(id),
                    board_id  INTEGER REFERENCES boards(id),
                    saved_at  DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── orders ───────────────────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE orders (
                    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id              INTEGER NOT NULL REFERENCES users(id),
                    tailor_id            INTEGER NOT NULL REFERENCES users(id),
                    order_number         VARCHAR UNIQUE NOT NULL,
                    status               VARCHAR DEFAULT 'pending',
                    total_amount         REAL NOT NULL,
                    shipping_address     TEXT NOT NULL,
                    shipping_city        VARCHAR NOT NULL,
                    shipping_country     VARCHAR NOT NULL,
                    shipping_postal_code VARCHAR NOT NULL,
                    phone_number         VARCHAR NOT NULL,
                    special_instructions TEXT,
                    tailor_notes         TEXT,
                    estimated_delivery   DATETIME,
                    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── order_items ──────────────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE order_items (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id    INTEGER NOT NULL REFERENCES orders(id),
                    design_id   INTEGER NOT NULL REFERENCES designs(id),
                    quantity    INTEGER DEFAULT 1,
                    size        VARCHAR NOT NULL,
                    color       VARCHAR,
                    fabric_type VARCHAR,
                    price       REAL NOT NULL,
                    customizations TEXT
                )
            """))

            # ── measurements ─────────────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE measurements (
                    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id            INTEGER NOT NULL REFERENCES users(id),
                    order_id           INTEGER REFERENCES orders(id),
                    chest              REAL,
                    waist              REAL,
                    hips               REAL,
                    height             REAL,
                    weight             REAL,
                    shoulder_width     REAL,
                    sleeve_length      REAL,
                    inseam             REAL,
                    neck_circumference REAL,
                    fit_preference     VARCHAR,
                    preferred_length   VARCHAR,
                    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── marketplace ──────────────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE marketplace (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    name        VARCHAR NOT NULL,
                    description TEXT,
                    image_url   VARCHAR,
                    is_active   INTEGER DEFAULT 1,
                    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── tailor_applications ──────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE tailor_applications (
                    id         INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id    INTEGER NOT NULL REFERENCES users(id),
                    tailor_id  INTEGER NOT NULL REFERENCES tailors(id),
                    status     VARCHAR DEFAULT 'pending',
                    message    TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── order_status lookup ──────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE order_status (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    name        VARCHAR(50) UNIQUE NOT NULL,
                    description VARCHAR(200),
                    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ── quotation_requests ───────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE quotation_requests (
                    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id              INTEGER NOT NULL REFERENCES users(id),
                    design_id            INTEGER NOT NULL REFERENCES designs(id),
                    selected_image_url   VARCHAR NOT NULL,
                    status               VARCHAR DEFAULT 'pending',
                    standard_size        VARCHAR,
                    chest                REAL,
                    waist                REAL,
                    hips                 REAL,
                    height               REAL,
                    shoulder_width       REAL,
                    sleeve_length        REAL,
                    inseam               REAL,
                    suggested_material   VARCHAR,
                    preferred_material   VARCHAR,
                    additional_notes     TEXT,
                    shipping_address     TEXT,
                    shipping_city        VARCHAR,
                    shipping_country     VARCHAR DEFAULT 'India',
                    shipping_postal_code VARCHAR,
                    phone_number         VARCHAR,
                    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at           DATETIME
                )
            """))

            # ── tailor_quotes ────────────────────────────────────────────────
            conn.execute(text("""
                CREATE TABLE tailor_quotes (
                    id             INTEGER PRIMARY KEY AUTOINCREMENT,
                    request_id     INTEGER NOT NULL REFERENCES quotation_requests(id),
                    tailor_user_id INTEGER NOT NULL REFERENCES users(id),
                    price          REAL NOT NULL,
                    estimated_days INTEGER,
                    notes          TEXT,
                    status         VARCHAR DEFAULT 'quoted',
                    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            print("✅ All 13 tables created")

            # ── Indexes ──────────────────────────────────────────────────────
            print("📊 Creating indexes...")
            indexes = [
                "CREATE INDEX idx_users_email              ON users(email)",
                "CREATE INDEX idx_users_username           ON users(username)",
                "CREATE INDEX idx_designs_user_id          ON designs(user_id)",
                "CREATE INDEX idx_designs_is_public        ON designs(is_public)",
                "CREATE INDEX idx_designs_created_at       ON designs(created_at)",
                "CREATE INDEX idx_boards_user_id           ON boards(user_id)",
                "CREATE INDEX idx_saved_designs_user_id    ON saved_designs(user_id)",
                "CREATE INDEX idx_saved_designs_design_id  ON saved_designs(design_id)",
                "CREATE INDEX idx_orders_user_id           ON orders(user_id)",
                "CREATE INDEX idx_orders_tailor_id         ON orders(tailor_id)",
                "CREATE INDEX idx_orders_status            ON orders(status)",
                "CREATE INDEX idx_tailors_user_id          ON tailors(user_id)",
                "CREATE INDEX idx_tailors_specialization   ON tailors(specialization)",
                "CREATE INDEX idx_tailors_rating           ON tailors(rating)",
                "CREATE INDEX idx_measurements_user_id     ON measurements(user_id)",
                "CREATE INDEX idx_marketplace_is_active    ON marketplace(is_active)",
                "CREATE INDEX idx_quotation_req_user       ON quotation_requests(user_id)",
                "CREATE INDEX idx_quotation_req_status     ON quotation_requests(status)",
                "CREATE INDEX idx_tailor_quotes_request    ON tailor_quotes(request_id)",
                "CREATE INDEX idx_tailor_quotes_tailor     ON tailor_quotes(tailor_user_id)",
            ]
            for sql in indexes:
                conn.execute(text(sql))
            print(f"✅ {len(indexes)} indexes created")

            # ── Triggers ─────────────────────────────────────────────────────
            print("⚡ Creating triggers...")
            for tbl in ("users", "designs", "boards", "orders", "measurements"):
                conn.execute(text(f"""
                    CREATE TRIGGER trg_{tbl}_updated_at
                    AFTER UPDATE ON {tbl}
                    BEGIN
                        UPDATE {tbl} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                    END
                """))
            print("✅ 5 updated_at triggers created")

            conn.commit()

        print("\n✅ Fresh database ready!")
        print(f"   📁 {db_path}")
        print(f"   📋 13 tables · {len(indexes)} indexes · 5 triggers")

    except Exception as e:
        print(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    create_fresh_database()