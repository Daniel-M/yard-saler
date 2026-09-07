-- Migration to fill missing event_code and product_code with generated values
-- Up migration
-- Update yard_sales
UPDATE yard_sales
SET event_code = 'ev-' || substr(hex(randomblob(4)), 1, 8)
WHERE event_code IS NULL OR event_code = '';
-- Update products
UPDATE products
SET product_code = 'prod-' || substr(hex(randomblob(4)), 1, 8)
WHERE product_code IS NULL OR product_code = '';
-- Down migration (no-op, cannot revert generated codes)
