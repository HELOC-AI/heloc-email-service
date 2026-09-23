import { z } from 'zod';

const apiKey = z.string().min(32, 'must be at least 32 characters (openssl rand -hex 32)');

/**
 * Everything the service may read from its environment. Keep .env.example in sync
 * (tests/config.test.ts checks it).
 */
export const emailEnv = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
    // `::` binds IPv4 + IPv6, which Railway private networking needs.
    HOST: z.string().default('::'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    LOG_PRETTY: z.stringbool().default(false),
    // Injected by Railway; used as the /health version and error-report environment.
    RAILWAY_GIT_COMMIT_SHA: z.string().optional(),
    RAILWAY_ENVIRONMENT_NAME: z.string().optional(),
    // Better Stack. All optional so local dev works without them.
    BETTERSTACK_SOURCE_TOKEN: z.string().optional(),
    BETTERSTACK_INGESTING_HOST: z.string().optional(),
    BETTERSTACK_ERRORS_DSN: z.url().optional(),

    /** Callers authenticate with `Authorization: Bearer <INTERNAL_API_KEY>`. */
    INTERNAL_API_KEY: apiKey,
    // `console` logs instead of sending; for local dev without a Resend key.
    EMAIL_PROVIDER: z.enum(['resend', 'console']).default('resend'),
    RESEND_API_KEY: z.string().startsWith('re_').optional(),
    EMAIL_FROM: z.string().min(3),
  })
  .refine((env) => env.EMAIL_PROVIDER !== 'resend' || env.RESEND_API_KEY, {
    path: ['RESEND_API_KEY'],
    message: 'required when EMAIL_PROVIDER=resend',
  });
export type EmailConfig = z.output<typeof emailEnv>;
