-- ============================================================================
--  Food Delivery — PostgreSQL schema
--  Run with:  psql -U fooduser -d fooddb -f schema.sql
--  (or use `npm run migrate` which executes this file)
-- ============================================================================

-- Clean slate (safe to re-run in development)
DROP TABLE IF EXISTS coupons        CASCADE;
DROP TABLE IF EXISTS reviews        CASCADE;
DROP TABLE IF EXISTS favorites      CASCADE;
DROP TABLE IF EXISTS payments       CASCADE;
DROP TABLE IF EXISTS order_items    CASCADE;
DROP TABLE IF EXISTS orders         CASCADE;
DROP TABLE IF EXISTS cart_items     CASCADE;
DROP TABLE IF EXISTS cart           CASCADE;
DROP TABLE IF EXISTS food_items     CASCADE;
DROP TABLE IF EXISTS categories     CASCADE;
DROP TABLE IF EXISTS addresses      CASCADE;
DROP TABLE IF EXISTS restaurant_owners CASCADE;
DROP TABLE IF EXISTS restaurants    CASCADE;
DROP TABLE IF EXISTS users          CASCADE;

-- ----------------------------------------------------------------------------
-- users : customers + owners (role column distinguishes them)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          VARCHAR(20) NOT NULL DEFAULT 'customer', -- 'customer' | 'owner'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- restaurants
-- ----------------------------------------------------------------------------
CREATE TABLE restaurants (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(160) NOT NULL,
  description   TEXT,
  cuisine       VARCHAR(120),
  image_url     TEXT,
  rating        NUMERIC(2,1) DEFAULT 4.2,
  delivery_time VARCHAR(40) DEFAULT '30-40 min',
  price_for_two INTEGER DEFAULT 300,
  address       TEXT,
  is_open       BOOLEAN NOT NULL DEFAULT true,
  offer_text    VARCHAR(160),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- restaurant_owners : links owner users to restaurants
-- ----------------------------------------------------------------------------
CREATE TABLE restaurant_owners (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  UNIQUE (user_id, restaurant_id)
);

-- ----------------------------------------------------------------------------
-- categories : menu sections per restaurant (e.g. Starters, Main Course)
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
  id            SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          VARCHAR(120) NOT NULL
);

-- ----------------------------------------------------------------------------
-- food_items : the menu
-- ----------------------------------------------------------------------------
CREATE TABLE food_items (
  id            SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name          VARCHAR(160) NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  image_url     TEXT,
  is_veg        BOOLEAN NOT NULL DEFAULT true,
  is_available  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- addresses
-- ----------------------------------------------------------------------------
CREATE TABLE addresses (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label        VARCHAR(40) DEFAULT 'Home',
  line1        VARCHAR(200) NOT NULL,
  line2        VARCHAR(200),
  city         VARCHAR(80) NOT NULL,
  state        VARCHAR(80),
  pincode      VARCHAR(12) NOT NULL,
  phone        VARCHAR(20),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- cart + cart_items  (server-side cart, one active cart per user)
-- ----------------------------------------------------------------------------
CREATE TABLE cart (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id           SERIAL PRIMARY KEY,
  cart_id      INTEGER NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  food_item_id INTEGER NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  quantity     INTEGER NOT NULL DEFAULT 1
);

-- ----------------------------------------------------------------------------
-- orders + order_items
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
  address_id    INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
  status        VARCHAR(30) NOT NULL DEFAULT 'pending',
                -- pending | confirmed | preparing | out_for_delivery | delivered | cancelled
  subtotal      NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee  NUMERIC(10,2) NOT NULL DEFAULT 0,
  taxes         NUMERIC(10,2) NOT NULL DEFAULT 0,
  total         NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  food_item_id INTEGER REFERENCES food_items(id) ON DELETE SET NULL,
  name         VARCHAR(160) NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1
);

-- ----------------------------------------------------------------------------
-- payments
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method       VARCHAR(30) NOT NULL DEFAULT 'card', -- card | upi | cod
  amount       NUMERIC(10,2) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'success', -- success | failed | pending
  txn_ref      VARCHAR(80),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- favorites
-- ----------------------------------------------------------------------------
CREATE TABLE favorites (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  UNIQUE (user_id, restaurant_id)
);

-- ----------------------------------------------------------------------------
-- coupons : promo codes applied at checkout
-- ----------------------------------------------------------------------------
CREATE TABLE coupons (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(30) UNIQUE NOT NULL,
  description   VARCHAR(160),
  discount_type VARCHAR(10) NOT NULL DEFAULT 'percent', -- 'percent' | 'flat'
  discount_value NUMERIC(10,2) NOT NULL,
  min_order     NUMERIC(10,2) DEFAULT 0,
  max_discount  NUMERIC(10,2),                          -- cap for percent coupons
  is_active     BOOLEAN NOT NULL DEFAULT true,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- orders.coupon_code / orders.discount : track what was applied to an order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- payments.qr_ref : reference tag when a payment came through the QR flow
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_ref VARCHAR(80);

-- Helpful indexes
CREATE INDEX idx_food_items_restaurant ON food_items(restaurant_id);
CREATE INDEX idx_orders_user           ON orders(user_id);
CREATE INDEX idx_orders_restaurant     ON orders(restaurant_id);
CREATE INDEX idx_order_items_order     ON order_items(order_id);
