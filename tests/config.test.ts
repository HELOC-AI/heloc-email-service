import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emailEnv } from '../src/config.ts';
import { ConfigError, loadConfig } from '../src/platform/config.ts';

const KEY = 'k'.repeat(64);

describe('emailEnv', () => {
  it('needs a Resend key unless the console provider is chosen', () => {
    expect(() =>
      loadConfig(emailEnv, { INTERNAL_API_KEY: KEY, EMAIL_FROM: 'x@example.com' }),
    ).toThrow('RESEND_API_KEY: required when EMAIL_PROVIDER=resend');
    expect(
      loadConfig(emailEnv, {
        INTERNAL_API_KEY: KEY,
        EMAIL_FROM: 'x@example.com',
        EMAIL_PROVIDER: 'console',
      }).EMAIL_PROVIDER,
    ).toBe('console');
  });

  it('names a bad variable without echoing its value', () => {
    try {
      loadConfig(emailEnv, { INTERNAL_API_KEY: 'short-secret', EMAIL_FROM: 'x@example.com' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as Error).message).toContain('INTERNAL_API_KEY');
      expect((err as Error).message).not.toContain('short-secret');
    }
  });

  it('matches .env.example exactly', () => {
    const documented = readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
      .split('\n')
      .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
      .filter(Boolean)
      .sort();
    const injected = ['RAILWAY_GIT_COMMIT_SHA', 'RAILWAY_ENVIRONMENT_NAME'];
    const schema = Object.keys(emailEnv.shape)
      .filter((key) => !injected.includes(key))
      .sort();
    expect(documented).toEqual(schema);
  });
});
