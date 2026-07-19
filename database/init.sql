-- ConnectWorld Database Initialization
-- This script runs automatically when the MySQL container starts for the first time.

-- Create database if it doesn't exist (should be created by MYSQL_DATABASE env var)
CREATE DATABASE IF NOT EXISTS connectworld
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- The Prisma schema is applied via `prisma db push` or `prisma migrate`
-- This file exists as a hook for any pre-Prisma SQL setup needed.

-- Example: create a limited-privilege user for the application
-- (The MYSQL_USER env var creates one automatically, but you can add custom grants)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON connectworld.* TO 'app_user'@'%';

FLUSH PRIVILEGES;
