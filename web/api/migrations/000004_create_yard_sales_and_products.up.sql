CREATE TABLE IF NOT EXISTS yard_sales (
    id TEXT PRIMARY KEY,                       -- ULID/UUID format
    user_id TEXT NOT NULL,                     -- Foreign key referencing users(id)
    title TEXT NOT NULL,                       -- Event title
    description TEXT,                          -- Detailed description of the sale
    location TEXT NOT NULL,                    -- Address/Location string
    start_date TEXT NOT NULL,                  -- ISO8601 string (UTC)
    end_date TEXT NOT NULL,                    -- ISO8601 string (UTC)
    created_at DATETIME NOT NULL,              -- Datetime
    updated_at DATETIME NOT NULL,              -- Datetime
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_yard_sales_user_id ON yard_sales(user_id);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,                       -- ULID/UUID format
    yard_sale_id TEXT NOT NULL,                -- Foreign key referencing yard_sales(id)
    name TEXT NOT NULL,                        -- Product name
    description TEXT,                          -- Product description
    price INTEGER NOT NULL DEFAULT 0,          -- Stored in cents (e.g. $10.00 is stored as 1000)
    condition TEXT NOT NULL,                   -- 'new', 'like_new', 'good', 'fair', 'poor'
    status TEXT NOT NULL DEFAULT 'available',  -- 'available', 'pending', 'sold'
    images TEXT NOT NULL DEFAULT '[]',         -- JSON array of string URLs: ["/uploads/img.jpg"]
    created_at DATETIME NOT NULL,              -- Datetime
    updated_at DATETIME NOT NULL,              -- Datetime
    FOREIGN KEY (yard_sale_id) REFERENCES yard_sales(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_yard_sale_id ON products(yard_sale_id);
