-- Step 0: Add columns that are missing from init but required by this migration
ALTER TABLE "product_variants" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "min_price" DECIMAL(10,2);
ALTER TABLE "inventory_stock_logs" ADD COLUMN "variant_id" UUID;

-- Step 1: Make order_items.product_id nullable
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;

-- Step 2: Populate order_items.variant_id where null
UPDATE "order_items" oi
SET "variant_id" = (
  SELECT pv."id"
  FROM "product_variants" pv
  WHERE pv."product_id" = oi."product_id"
    AND pv."is_default" = true
  LIMIT 1
)
WHERE oi."variant_id" IS NULL;

UPDATE "order_items" oi
SET "variant_id" = (
  SELECT pv."id"
  FROM "product_variants" pv
  WHERE pv."product_id" = oi."product_id"
  ORDER BY pv."created_at" ASC
  LIMIT 1
)
WHERE oi."variant_id" IS NULL;

-- Step 3: Make order_items.variant_id non-nullable
ALTER TABLE "order_items" ALTER COLUMN "variant_id" SET NOT NULL;

-- Step 4: Remove price-related columns from products
ALTER TABLE "products" DROP COLUMN "price";
ALTER TABLE "products" DROP COLUMN "compare_at_price";
ALTER TABLE "products" DROP COLUMN "sku";
ALTER TABLE "products" DROP COLUMN "stock";

-- Step 5: Create indexes
CREATE INDEX "products_min_price_idx" ON "products"("min_price");
CREATE INDEX "product_variants_is_default_idx" ON "product_variants"("is_default");
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");
CREATE INDEX "inventory_stock_logs_variant_id_idx" ON "inventory_stock_logs"("variant_id");

-- Step 6: Add foreign key for inventory_stock_logs.variant_id
ALTER TABLE "inventory_stock_logs" ADD CONSTRAINT "inventory_stock_logs_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: Drop cart_items.price and add unique constraint
ALTER TABLE "cart_items" DROP COLUMN "price";
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_variant_id_key" UNIQUE ("user_id", "variant_id");
