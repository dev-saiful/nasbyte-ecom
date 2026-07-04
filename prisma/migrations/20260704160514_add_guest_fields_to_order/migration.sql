/*
  Warnings:

  - The primary key for the `accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `product_id` on the `cart_items` table. All the data in the column will be lost.
  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `storefront_announcements` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `variant_id` on table `cart_items` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `storefront_announcements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropIndex
DROP INDEX "cart_items_user_id_product_id_variant_id_key";

-- DropIndex
DROP INDEX "inventory_stock_logs_variant_id_idx";

-- DropIndex
DROP INDEX "products_min_price_idx";

-- AlterTable
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "product_id",
ALTER COLUMN "variant_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "guest_email" VARCHAR(255),
ADD COLUMN     "guest_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "storefront_announcements" DROP CONSTRAINT "storefront_announcements_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "storefront_announcements_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
