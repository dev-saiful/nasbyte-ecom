-- DropTables
ALTER TABLE "users" DROP COLUMN "two_factor_secret",
DROP COLUMN "two_factor_recovery_codes",
DROP COLUMN "two_factor_confirmed_at";
