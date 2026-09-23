import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderContract } from '../src/interface/http/published-contract.ts';

describe('published contract', () => {
  it('contract/send-api.json matches the code (run `pnpm contract:export`)', () => {
    const committed = readFileSync(new URL('../contract/send-api.json', import.meta.url), 'utf8');
    expect(committed).toBe(renderContract());
  });
});
