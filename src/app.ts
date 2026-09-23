import { createSendEmail, type EmailProvider } from './application/send-email.ts';
import { ConsoleProvider } from './infrastructure/console-provider.ts';
import { ResendProvider } from './infrastructure/resend-provider.ts';
import { sendRoutes } from './interface/http/send-routes.ts';
import type { EmailConfig } from './config.ts';
import type { ErrorReporter } from './platform/error-reporting.ts';
import type { Logger } from './platform/logger.ts';
import { bearerAuth, createServer } from './platform/server.ts';

export const SERVICE = 'email';

export interface AppDeps {
  config: EmailConfig;
  logger: Logger;
  version: string;
  errorReporter?: ErrorReporter;
  provider?: EmailProvider;
}

/** Composition root. */
export function buildApp({ config, logger, version, errorReporter, provider }: AppDeps) {
  const emailProvider =
    provider ??
    (config.EMAIL_PROVIDER === 'resend'
      ? new ResendProvider(config.RESEND_API_KEY!)
      : new ConsoleProvider(logger));
  const sendEmail = createSendEmail({ provider: emailProvider, sender: config.EMAIL_FROM });

  const app = createServer({ service: SERVICE, version, logger, errorReporter });
  app.register(
    async (v1) => {
      v1.addHook('onRequest', bearerAuth(config.INTERNAL_API_KEY));
      sendRoutes(v1, { sendEmail });
    },
    { prefix: '/v1' },
  );
  return app;
}
