import { z } from 'zod';

/**
 * The Send API — this service's published contract (Open Host Service). Callers such as
 * heloc-demo's chase service keep their own copy of these shapes; change them only in a
 * backwards-compatible way.
 */

export const HEADERS = {
  requestId: 'x-request-id',
  /** Same key → the email is sent at most once, e.g. `chase:<chase_id>`. */
  idempotencyKey: 'idempotency-key',
} as const;

/** POST /v1/send */
export const sendEmailRequestSchema = z.object({
  to: z.email(),
  subject: z.string().min(1).max(998),
  html: z.string().min(1),
  text: z.string().min(1),
  /** Where replies should go, e.g. a Chase reply address. */
  reply_to: z.email().optional(),
});
export type SendEmailRequest = z.infer<typeof sendEmailRequestSchema>;

export const sendEmailResponseSchema = z.object({
  message_id: z.string(),
  status: z.literal('accepted'),
});
export type SendEmailResponse = z.infer<typeof sendEmailResponseSchema>;

/** GET /health */
export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  service: z.string(),
  version: z.string(),
  timestamp: z.iso.datetime(),
  checks: z.record(z.string(), z.enum(['ok', 'fail'])).optional(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** Every error response. */
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  request_id: z.string(),
  details: z.unknown().optional(),
});
