import { z } from 'zod';
import {
  errorResponseSchema,
  HEADERS,
  sendEmailRequestSchema,
  sendEmailResponseSchema,
} from './contract.ts';

/** The Send API in a language-neutral form: what callers pin and compare against. */
export function publishedContract() {
  return {
    service: 'heloc-email-service',
    endpoints: {
      'POST /v1/send': {
        headers: {
          authorization: 'Bearer <INTERNAL_API_KEY>',
          [HEADERS.idempotencyKey]: 'optional; same key → sent at most once',
          [HEADERS.requestId]: 'optional; echoed back',
        },
        request: z.toJSONSchema(sendEmailRequestSchema),
        responses: {
          '202': z.toJSONSchema(sendEmailResponseSchema),
          '4xx/5xx': z.toJSONSchema(errorResponseSchema),
        },
      },
    },
  };
}

export const renderContract = () => `${JSON.stringify(publishedContract(), null, 2)}\n`;
