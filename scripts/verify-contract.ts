/**
 * NightSignals contract verification tests.
 *
 * Run: npx tsx scripts/verify-contract.ts
 *
 * Verifies:
 *   1. Managed directory exists with compiled circuits
 *   2. All 3 circuits have prover + verifier keys
 *   3. ZKIR intermediates are present
 *   4. Contract JS bindings are generated
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const MANAGED_DIR = path.resolve(import.meta.dirname, '..', 'contracts', 'managed', 'nightsignals');
const CIRCUITS = ['createSignal', 'purchaseSignal', 'deactivateSignal'];

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean | void) {
  try {
    const result = fn();
    if (result === false) throw new Error('Assertion failed');
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

console.log('\nNightSignals — Contract Verification Tests\n');
console.log(`Managed directory: ${MANAGED_DIR}\n`);

// Test 1: Managed directory exists
test('Managed directory exists', () => {
  assert(fs.existsSync(MANAGED_DIR), `Missing: ${MANAGED_DIR}`);
});

// Test 2: Contract JS bindings generated
test('Contract JS bindings generated', () => {
  const contractIndex = path.join(MANAGED_DIR, 'contract', 'index.js');
  assert(fs.existsSync(contractIndex), `Missing: ${contractIndex}`);
  const contents = fs.readFileSync(contractIndex, 'utf-8');
  assert(contents.includes('createSignal'), 'Missing createSignal in contract bindings');
  assert(contents.includes('purchaseSignal'), 'Missing purchaseSignal in contract bindings');
  assert(contents.includes('deactivateSignal'), 'Missing deactivateSignal in contract bindings');
});

// Test 3: All circuits have prover and verifier keys
for (const circuit of CIRCUITS) {
  test(`${circuit}: prover key`, () => {
    const keyPath = path.join(MANAGED_DIR, 'keys', `${circuit}.prover`);
    assert(fs.existsSync(keyPath), `Missing prover key: ${keyPath}`);
    const stat = fs.statSync(keyPath);
    assert(stat.size > 0, `Prover key is empty: ${keyPath}`);
  });

  test(`${circuit}: verifier key`, () => {
    const keyPath = path.join(MANAGED_DIR, 'keys', `${circuit}.verifier`);
    assert(fs.existsSync(keyPath), `Missing verifier key: ${keyPath}`);
    const stat = fs.statSync(keyPath);
    assert(stat.size > 0, `Verifier key is empty: ${keyPath}`);
  });

  test(`${circuit}: ZKIR file`, () => {
    const zkirPath = path.join(MANAGED_DIR, 'zkir', `${circuit}.zkir`);
    assert(fs.existsSync(zkirPath), `Missing ZKIR: ${zkirPath}`);
    const stat = fs.statSync(zkirPath);
    assert(stat.size > 0, `ZKIR file is empty: ${zkirPath}`);
  });
}

// Test 4: Contract info metadata
test('Compiler contract-info.json present', () => {
  const infoPath = path.join(MANAGED_DIR, 'compiler', 'contract-info.json');
  assert(fs.existsSync(infoPath), `Missing: ${infoPath}`);
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
  assert(typeof info === 'object', 'contract-info.json is not valid JSON');
});

// Test 5: TypeScript declarations
test('TypeScript declarations generated', () => {
  const declPath = path.join(MANAGED_DIR, 'contract', 'index.d.ts');
  assert(fs.existsSync(declPath), `Missing: ${declPath}`);
  const contents = fs.readFileSync(declPath, 'utf-8');
  assert(contents.includes('createSignal'), 'Missing createSignal type');
  assert(contents.includes('purchaseSignal'), 'Missing purchaseSignal type');
});

// ─── Results ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'─'.repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
