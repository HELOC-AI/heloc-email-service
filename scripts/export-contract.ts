/**
 * Writes contract/send-api.json: the Send API as JSON Schema, generated from
 * src/interface/http/contract.ts. Consumers (heloc-demo's chase) pin a copy and check it
 * against this file. Run after changing the contract; tests fail while it is stale.
 *
 *   pnpm contract:export
 */
import { writeFileSync } from 'node:fs';
import { renderContract } from '../src/interface/http/published-contract.ts';

const path = new URL('../contract/send-api.json', import.meta.url);
writeFileSync(path, renderContract());
console.log('contract/send-api.json written');
