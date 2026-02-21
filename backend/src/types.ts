import type { Env } from 'hono';

export interface AppEnv extends Env {
  Variables: {
    userId: string;
  };
}
