/**
 * Single source of truth for auth-cookie names.
 *
 * In production we emit cookies with the `__Host-` prefix so the browser
 * enforces: Secure=true, Path=/, no Domain attribute. This is hardening
 * against cookie tossing from sibling subdomains.
 *
 * The prefix requires HTTPS, so in development (HTTP) we use the plain
 * name. Both names are accepted on read for the transition.
 */
const isProd = process.env.NODE_ENV === 'production';

export const AUTH_TOKEN_COOKIE = isProd ? '__Host-auth_token' : 'auth_token';
export const AUTH_TOKEN_COOKIE_FALLBACK = 'auth_token';
export const GK_AUTH_SIGNAL_COOKIE = 'gk-auth';
