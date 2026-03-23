-- FashionFusion Database Schema
-- Target: SQLite (development) — replace INTEGER PRIMARY KEY AUTOINCREMENT
-- with SERIAL PRIMARY KEY and BOOLEAN/JSON types for PostgreSQL in production.
-- Column names match the SQLAlchemy ORM models exactly.

PRAGMA foreign_keys = ON;

-- ── users ──────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,
    email             VARCHAR  UNIQUE NOT NULL,
    username          VARCHAR  UNIQUE NOT NULL,
    full_name         VARCHAR,
    password_hash     VARCHAR  NOT NULL,        -- was hashed_password in old schema
    is_active         INTEGER  DEFAULT 1,
    is_designer       INTEGER  DEFAULT 0,
    is_tailor         INTEGER  DEFAULT 0,
    bio               TEXT,
    phone             VARCHAR,
    location          TEXT,                     -- was address
    city              VARCHAR,
    country           VARCHAR,
    business_name     VARCHAR,
    specialization    VARCHAR,
    years_experience  INTEGER,
    rating            REAL     DEFAULT 0.0,
    profile_image_url VARCHAR,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── tailors ────────────────────────────────────────────────────────────────
CREATE TABLE tailors (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER UNIQUE NOT NULL REFERENCES users(id),
    business_name    VARCHAR NOT NULL,
    specialization   VARCHAR NOT NULL,
    description      TEXT,
    rating           REAL    DEFAULT 0.0,
    location         VARCHAR,
    phone            VARCHAR,
    email            VARCHAR UNIQUE NOT NULL,
    is_verified      INTEGER DEFAULT 0,
    is_active        INTEGER DEFAULT 1,
    experience_years INTEGER DEFAULT 0,
    price_range_min  REAL,
    price_range_max  REAL,
    portfolio_images TEXT,                      -- JSON array of URLs
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── boards ─────────────────────────────────────────────────────────────────
CREATE TABLE boards (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER  NOT NULL REFERENCES users(id),
    title       VARCHAR  NOT NULL,
    description TEXT,
    is_public   INTEGER  DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── designs ────────────────────────────────────────────────────────────────
CREATE TABLE designs (
    id                     INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id                INTEGER  NOT NULL REFERENCES users(id),
    board_id               INTEGER  REFERENCES boards(id),
    title                  VARCHAR,
    description            TEXT,
    prompt                 TEXT     NOT NULL,
    generation_type        VARCHAR  NOT NULL,   -- "prompt" | "image" | "sketch"
    reference_image_url    VARCHAR,
    image_urls             TEXT     NOT NULL,   -- JSON array of generated URLs
    color_palette          TEXT,               -- JSON
    style_recommendations  TEXT,               -- JSON
    fabric_recommendations TEXT,               -- JSON
    is_public              INTEGER  DEFAULT 0,
    likes_count            INTEGER  DEFAULT 0,
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── saved_designs ──────────────────────────────────────────────────────────
CREATE TABLE saved_designs (
    id        INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER  NOT NULL REFERENCES users(id),
    design_id INTEGER  NOT NULL REFERENCES designs(id),
    board_id  INTEGER  REFERENCES boards(id),
    saved_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── orders ─────────────────────────────────────────────────────────────────
-- tailor_id references users(id) — tailors are users with is_tailor = 1.
CREATE TABLE orders (
    id                   INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id              INTEGER  NOT NULL REFERENCES users(id),
    tailor_id            INTEGER  NOT NULL REFERENCES users(id),
    order_number         VARCHAR  UNIQUE NOT NULL,
    status               VARCHAR  DEFAULT 'pending',
    total_amount         REAL     NOT NULL,
    shipping_address     TEXT     NOT NULL,
    shipping_city        VARCHAR  NOT NULL,
    shipping_country     VARCHAR  NOT NULL,
    shipping_postal_code VARCHAR  NOT NULL,
    phone_number         VARCHAR  NOT NULL,
    special_instructions TEXT,
    tailor_notes         TEXT,
    estimated_delivery   DATETIME,
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── order_items ────────────────────────────────────────────────────────────
CREATE TABLE order_items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id       INTEGER NOT NULL REFERENCES orders(id),
    design_id      INTEGER NOT NULL REFERENCES designs(id),
    quantity       INTEGER DEFAULT 1,
    size           VARCHAR NOT NULL,
    color          VARCHAR,
    fabric_type    VARCHAR,
    price          REAL    NOT NULL,
    customizations TEXT            -- JSON
);

-- ── measurements ───────────────────────────────────────────────────────────
-- Single canonical table merging models/measurement.py and the removed
-- duplicate that was in order.py.
CREATE TABLE measurements (
    id                 INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id            INTEGER  NOT NULL REFERENCES users(id),
    order_id           INTEGER  REFERENCES orders(id),
    chest              REAL,
    waist              REAL,
    hips               REAL,
    height             REAL,
    weight             REAL,
    shoulder_width     REAL,
    sleeve_length      REAL,
    inseam             REAL,
    neck_circumference REAL,
    fit_preference     VARCHAR,    -- "slim" | "regular" | "loose"
    preferred_length   VARCHAR,    -- "short" | "regular" | "long"
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── marketplace ────────────────────────────────────────────────────────────
CREATE TABLE marketplace (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR  NOT NULL,
    description TEXT,
    image_url   VARCHAR,
    is_active   INTEGER  DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── tailor_applications ────────────────────────────────────────────────────
CREATE TABLE tailor_applications (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER  NOT NULL REFERENCES users(id),
    tailor_id  INTEGER  NOT NULL REFERENCES tailors(id),
    status     VARCHAR  DEFAULT 'pending',
    message    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── order_status (lookup table) ────────────────────────────────────────────
CREATE TABLE order_status (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_users_username         ON users(username);
CREATE INDEX idx_designs_user_id        ON designs(user_id);
CREATE INDEX idx_designs_is_public      ON designs(is_public);
CREATE INDEX idx_designs_created_at     ON designs(created_at);
CREATE INDEX idx_boards_user_id         ON boards(user_id);
CREATE INDEX idx_boards_is_public       ON boards(is_public);
CREATE INDEX idx_saved_designs_user_id  ON saved_designs(user_id);
CREATE INDEX idx_saved_designs_design   ON saved_designs(design_id);
CREATE INDEX idx_orders_user_id         ON orders(user_id);
CREATE INDEX idx_orders_tailor_id       ON orders(tailor_id);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_orders_created_at      ON orders(created_at);
CREATE INDEX idx_tailors_user_id        ON tailors(user_id);
CREATE INDEX idx_tailors_specialization ON tailors(specialization);
CREATE INDEX idx_tailors_rating         ON tailors(rating);
CREATE INDEX idx_measurements_user_id   ON measurements(user_id);
CREATE INDEX idx_marketplace_is_active  ON marketplace(is_active);

-- ── Triggers (updated_at) ──────────────────────────────────────────────────
CREATE TRIGGER trg_users_updated_at
AFTER UPDATE ON users
BEGIN UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER trg_designs_updated_at
AFTER UPDATE ON designs
BEGIN UPDATE designs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER trg_boards_updated_at
AFTER UPDATE ON boards
BEGIN UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER trg_orders_updated_at
AFTER UPDATE ON orders
BEGIN UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER trg_measurements_updated_at
AFTER UPDATE ON measurements
BEGIN UPDATE measurements SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;