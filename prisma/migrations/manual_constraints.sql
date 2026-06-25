-- Check: stock cannot go negative on product variants
ALTER TABLE product_variants
  ADD CONSTRAINT chk_variant_stock_non_negative CHECK (stock >= 0);

-- Check: review rating must be between 1 and 5
ALTER TABLE reviews
  ADD CONSTRAINT chk_review_rating_range CHECK (rating >= 1 AND rating <= 5);

-- Partial indexes: soft-delete performance
CREATE INDEX idx_products_soft_delete      ON products       (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_soft_delete        ON orders         (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_soft_delete         ON users          (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_addresses_soft_delete     ON addresses      (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_variants_active   ON product_variants (id) WHERE deleted_at IS NULL;

-- Performance indexes for high-traffic query paths
CREATE INDEX idx_orders_status             ON orders (status);
CREATE INDEX idx_orders_payment_status     ON orders (payment_status);
CREATE INDEX idx_orders_created_at         ON orders (created_at DESC);
CREATE INDEX idx_orders_status_created     ON orders (status, created_at DESC);
CREATE INDEX idx_reviews_product_id        ON reviews (product_id);
CREATE INDEX idx_inventory_logs_variant    ON inventory_stock_logs (variant_id);
