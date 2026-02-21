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
    audience: process.env.OIDC_CLIENT_ID,
  });
  return payload;
}

/**
 * Optional auth middleware - sets userId if valid JWT present, but doesn't reject requests.
 */
export async function optionalAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = await verifyJwt(token);
      c.set('userId', payload.sub as string);
    } catch {
      // Invalid token — treat as anonymous
    }
  }
  await next();
}

/**
 * Required auth middleware - returns 401 if no valid JWT.
 */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyJwt(token);
    c.set('userId', payload.sub as string);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  await next();
}
