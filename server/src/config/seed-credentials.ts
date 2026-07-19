/**
 * Seed login credentials for development/demo accounts.
 * Maps emails to their seed passwords so the login page can show them.
 * Only used in development mode — never expose in production.
 */
export const SEED_CREDENTIALS: Record<string, string> = {
  'admin@connectworld.com': 'Admin123!',
  'manager@connectworld.com': 'Manager123!',
  'mod@connectworld.com': 'Moderator123!',
  'alice@connectworld.com': 'Alice123!',
  'bob@connectworld.com': 'Bob123!',
  'charlie@connectworld.com': 'Charlie123!',
  'guest@connectworld.com': 'Guest123!',
};
