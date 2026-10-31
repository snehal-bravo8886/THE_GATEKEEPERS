# CanTheySeeIt? — Arjun's QA module

**Owner:** Arjun Sharma  
**Scope:** Checkpoint 0 compatibility contract, T1–T5 acceptance cases, false-PASS prevention, regression checks, and integration.  
**Status:** QA scaffold ready; runner/portal behaviour is NOT verified until real integration runs pass.

This folder is intentionally self-contained: the QA team's early tests do not dictate Suprita's backend internals or Snehal's portal implementation. The frozen *public interface* is our test boundary.

## Files

| File | Purpose |
|---|---|
| \`fixtures/contract-v1.mjs\` | Public fixture IDs, private synthetic markers, expected five test identities and example result data. No credentials. |
| \`lib/qa-contract.mjs\` | Independent QA checker for generated test definitions, status/nullability rules, aggregate precedence, evidence sanitization and run comparability. This does NOT replace the backend verification engine. |
| \`unit/contract.test.mjs\` | Offline Node tests of the QA oracle and schema expectations. Does not assert the running application works. |
| \`integration/runner-api.test.mjs\` | Opt-in Vitest acceptance tests against Suprita's actual Node API on port 4100. |
| \`integration/demo-http.test.mjs\` | Opt-in Vitest T1–T5 tests against Snehal's protected Express app on port 4000; requires disposable synthetic test sessions. |
| \`integration/README.md\` | Environment, commands and conditions for live integration. |
| \`QA_RUNBOOK.md\` | Clean-start integration, false-PASS scenarios, manual run evidence and demo QA. |

## Requirements

Node.js 22 or compatible current LTS. This QA module uses built-in Node tests for offline checks and Vitest for opt-in integration. It does not depend on root npm scripts.

## Quick start — Windows PowerShell

From the repository root:

\`\`\`powershell
git switch test/qa
git pull origin test/qa
cd tests/qa
npm.cmd test
\`\`\`

This offline command requires no npm installation. Expected: Node tests run and pass, **without claiming any live API security was verified**.

For integration later:

\`\`\`powershell
npm.cmd install
$env:QA_INTEGRATION="1"
npm.cmd run test:integration
\`\`\`

Only enable integration when the agreed API and demo server are running on their frozen loopback ports.

## Merge gates

- The frozen IDs must be returned in order: T1-owner-alice, T2-owner-bob, T3-bob-to-alice, T4-alice-to-bob, T5-anonymous-to-alice.
- All five positive/negative outcomes must be derived from real response evidence.
- Invalid/expired sessions, missing fixture, error, timeout, ambiguous 200, and stale-auth 401 must NEVER produce security PASS.
- Any confirmed exposure means aggregate FAIL; unresolved or NOT_RUN required checks without an exposure mean aggregate INCONCLUSIVE.
- Audit run metadata, sanitization, immutable hashes and version labels.
- Real three-revision demo must show PASS → FAIL → PASS for *unchanged test contract*.

## What remains dependent on teammates

* Suprita: implement \`POST /api/promises\`, \`POST /api/promises/:id/run\`, history, schema and actual verifier.
* Snehal: implement the synthetic portal endpoints, fixture IDs, temporary tokens and real authorization regression revisions.
* Maulik: implement the wizard, ledger, result status and history UI.
* Arjun: extend with fault-injection integration cases once backend test hooks and fixture controls have been agreed. Do not add hidden production backdoors just to make tests easier.

## Developer notes

The unit tests validate our **test-harness rules** and examples; they do not show that the product is secure. Integration tests are skipped by default and only become meaningful after real services exist.

Never commit bearer credentials, JWTs, session secrets, private production records or raw unredacted target HTTP responses.
