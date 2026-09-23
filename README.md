# heloc-email-service

A small, generic transactional email service: one **Send API** in front of a pluggable email
provider (Resend today). It knows recipients, subjects and bodies, and nothing about HELOC.
Its caller is the chase service in [heloc-demo](https://github.com/HELOC-AI/heloc-demo).

```text
chase service ──POST /v1/send──► heloc-email-service ──EmailProvider──► Resend ──► inbox
```

|            | URL                                                 |
| ---------- | --------------------------------------------------- |
| Production | https://email-production-48c5.up.railway.app/health |

## API

All `/v1` routes need `Authorization: Bearer <INTERNAL_API_KEY>`. The contract (Zod schemas) is
in [`src/interface/http/contract.ts`](src/interface/http/contract.ts); its published, language-neutral
form is [`contract/send-api.json`](contract/send-api.json) (JSON Schema, generated with
`pnpm contract:export`, kept current by a test). Callers pin a copy of that file and check it
against `main` — heloc-demo does so in CI and on a schedule — so change the contract only in a
backwards-compatible way and tell the callers.

### `POST /v1/send`

```http
POST /v1/send
Authorization: Bearer <INTERNAL_API_KEY>
Idempotency-Key: chase:6f1c…          (optional; same key → sent at most once)
X-Request-Id: 1b7e…                    (optional; echoed back and logged)
Content-Type: application/json

{
  "to": "john@example.com",
  "subject": "Additional documents required",
  "html": "<p>…</p>",
  "text": "…",
  "reply_to": "reply+6f1c…@linkerclaw.ai"   (optional)
}
```

`202 Accepted`

```json
{ "message_id": "0f3e…", "status": "accepted" }
```

| Status | `error`           | When                                                                |
| ------ | ----------------- | ------------------------------------------------------------------- |
| 400    | `invalid_request` | Body fails validation (`details` lists the fields)                  |
| 400    | `invalid_email`   | The email breaks a domain rule                                      |
| 401    | `unauthorized`    | Missing or wrong API key                                            |
| 502    | `provider_error`  | The provider refused or failed (`details.provider_error`); retry OK |

Retries are safe with the same `Idempotency-Key`: the provider sends at most once.

### `GET /health`

`200 {"status":"ok","service":"email","version":"<commit>","timestamp":"…"}` — no auth.

## Design

Domain-driven, dependencies point inward (enforced by ESLint):

| Layer          | Path                 | Contents                                                            |
| -------------- | -------------------- | ------------------------------------------------------------------- |
| domain         | `src/domain`         | `OutboundEmail` and its rules — no frameworks                       |
| application    | `src/application`    | `sendEmail` use case and the `EmailProvider` port                   |
| infrastructure | `src/infrastructure` | `ResendProvider`, `ConsoleProvider` (local dev: logs, doesn't send) |
| interface      | `src/interface/http` | Fastify routes and the published contract                           |
| platform       | `src/platform`       | Server, auth, config loading, logging, error reporting              |

Adding a provider (SES, SendGrid, Postmark) = one class implementing `EmailProvider` in
`src/infrastructure` plus a value for `EMAIL_PROVIDER`. Vocabulary: [CONTEXT.md](CONTEXT.md).

Logs never contain recipients or keys (redacted); Better Stack receives logs and exceptions
when its variables are set.

## Configuration

| Variable                                                  | Secret | Purpose                                                                         |
| --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| `INTERNAL_API_KEY`                                        | yes    | Callers' bearer key (`openssl rand -hex 32`); = chase's `EMAIL_SERVICE_API_KEY` |
| `EMAIL_PROVIDER`                                          |        | `resend` (default) or `console`                                                 |
| `RESEND_API_KEY`                                          | yes    | Resend key with **Sending access** only                                         |
| `EMAIL_FROM`                                              |        | Sender on a verified domain, e.g. `HELOC Demo <noreply@linkerclaw.ai>`          |
| `PORT` / `HOST` / `LOG_LEVEL` / `LOG_PRETTY`              |        | Listening and logging (`PORT` is injected by Railway)                           |
| `BETTERSTACK_SOURCE_TOKEN` / `BETTERSTACK_INGESTING_HOST` | yes/no | Ship logs to Better Stack (optional)                                            |
| `BETTERSTACK_ERRORS_DSN`                                  | yes    | Report exceptions to Better Stack Errors (optional)                             |

The service validates its environment at startup and exits naming (never printing) any bad
variable. `.env.example` is checked against the schema by the tests.

## Develop

Node 24+ (runs the TypeScript directly, no build step) and pnpm 10.

```bash
pnpm install
cp .env.example .env      # EMAIL_PROVIDER=console: logs instead of sending
pnpm dev                  # http://localhost:4003
pnpm test && pnpm lint && pnpm typecheck && pnpm format:check
```

## Deploy

Railway service `email` (project heloc-demo) builds this repo's `Dockerfile` on every push to
`main` and health-checks `/health`. Its variables are managed from heloc-demo
(`.railway/railway.ts` + `scripts/env-sync.ts --railway`); secrets never live in this repo.
Roll back with Railway → Deployments → Redeploy the previous one.

Verify after a deploy: `curl https://email-production-48c5.up.railway.app/health`, then the
post-deploy smoke test in heloc-demo (`pnpm smoke`), which exercises chase → email.
