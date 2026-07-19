/**
 * Password validation constants.
 * Used by client-side Zod schemas to ensure consistent password requirements.
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
export const PASSWORD_REGEX_ERROR = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
