-- Migration: Add event_code to yard_sales and product_code to products, and create cart, wishlist, and messaging tables

-- 1. Alter Existing Tables to support unique codes/slugs
ALTER TABLE yard_sales ADD COLUMN event_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_yard_sales_event_code ON yard_sales(event_code);

ALTER TABLE products ADD COLUMN product_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);

-- 2. Cart Table (Persists items selected by users)
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,                       -- ULID/UUID
    user_id TEXT NOT NULL,                     -- References users(id)
    product_id TEXT NOT NULL,                  -- References products(id)
    quantity INTEGER NOT NULL DEFAULT 1,       -- Quantity >= 1
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_cart_user_product UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- 3. Wishlist Table (Persists saved items)
CREATE TABLE IF NOT EXISTS wishlist_items (
    id TEXT PRIMARY KEY,                       -- ULID/UUID
    user_id TEXT NOT NULL,                     -- References users(id)
    product_id TEXT NOT NULL,                  -- References products(id)
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);

-- 4. Messaging Thread Table
CREATE TABLE IF NOT EXISTS message_threads (
    id TEXT PRIMARY KEY,                       -- ULID/UUID
    buyer_id TEXT NOT NULL,                    -- References users(id)
    seller_id TEXT NOT NULL,                   -- References users(id)
    product_id TEXT NOT NULL,                  -- References products(id)
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_thread_buyer_seller_product UNIQUE (buyer_id, seller_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_message_threads_buyer ON message_threads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_seller ON message_threads(seller_id);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,                       -- ULID/UUID
    thread_id TEXT NOT NULL,                   -- References message_threads(id)
    sender_id TEXT NOT NULL,                   -- References users(id)
    content TEXT NOT NULL,                     -- Text message body
    created_at DATETIME NOT NULL,
    FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
