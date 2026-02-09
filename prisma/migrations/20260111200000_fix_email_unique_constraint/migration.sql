-- Create a partial unique index that only applies to non-null emails
-- This allows multiple NULL email values for imported profiles
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_unique_where_not_null" ON "User"("email") WHERE "email" IS NOT NULL;

