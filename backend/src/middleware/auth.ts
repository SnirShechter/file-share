import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Context, Next } from 'hono';
import type { AppEnv } from '../types.js';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(process.env.OIDC_JWKS_URI!));
  }
  return jwks;
}

export async function verifyJwt(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: process.env.OIDC_ISSUER,
  });
  return payload;
}

// --- Userinfo fallback for opaque access tokens ---

const userinfoCache = new Map<string, { sub: string; expiresAt: number }>();
const USERINFO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function verifyTokenViaUserinfo(token: string): Promise<string> {
  const cached = userinfoCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.sub;
  }

  const userinfoUrl =
    process.env.OIDC_USERINFO_URI || `${process.env.OIDC_ISSUER}userinfo/`;

  const response = await fetch(userinfoUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Userinfo request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (!data.sub || typeof data.sub !== 'string') {
    throw new Error('No sub claim in userinfo response');
  }

  userinfoCache.set(token, {
    sub: data.sub,
    expiresAt: Date.now() + USERINFO_CACHE_TTL,
  });
  return data.sub;
}

/**
 * Resolve user ID from a Bearer token.
 * Tries JWT verification first; if the token is opaque, falls back to the userinfo endpoint.
 */
async function resolveUserId(token: string): Promise<string> {
  try {
    const payload = await verifyJwt(token);
    return payload.sub as string;
  } catch {
    // JWT verification failed — token may be opaque, try userinfo endpoint
  }

  return await verifyTokenViaUserinfo(token);
}

/**
 * Optional auth middleware - sets userId if valid token present, but doesn't reject requests.
 */
export async function optionalAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const userId = await resolveUserId(token);
      c.set('userId', userId);
    } catch (err) {
      console.error('optionalAuth: token verification failed:', err);
    }
  }
  await next();
}

/**
 * Required auth middleware - returns 401 if no valid token.
 */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const userId = await resolveUserId(token);
    c.set('userId', userId);
  } catch (err) {
    console.error('requireAuth: token verification failed:', err);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  await next();
}
