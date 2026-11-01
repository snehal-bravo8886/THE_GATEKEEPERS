# CanTheySeeIt v2 — Generic Verification Backend (foundation)

This is the **new reusable runner foundation**, not the final integrated grocery suite.
It does NOT contain synthetic grocery accounts, real endpoint paths, credentials,
G01–G12 specifications, or a functioning grocery adapter. Those must be supplied
by the demo-app owner and reviewed before tests can run.

## Start on Windows / PowerShell

From this folder (the one containing `package.json`):

```powershell
npm install
npm run typecheck
npm test
npm run dev
```

`http://127.0.0.1:4000/api/health` should return `ok:true`.
`http://127.0.0.1:4000/api/readiness` should initially return `NEEDS_SETUP`.
That is expected and honest: there is no installed adapter or test suite.

## API interface (new v2; do not silently replace v1 routes)

- `GET /api/health`: confirms backend started
- `GET /api/readiness`: shows registered adapter IDs or NEEDS_SETUP
- `POST /api/suites`: validate and save a confirmed typed suite; adapter must exist
- `GET /api/suites`: list saved suites
- `POST /api/suites/:id/run`: run real approved requests; require `revisionLabel` and explicit `approveSyntheticWrites:true` before any PATCH
- `GET /api/suites/:id/runs`: read sanitized versioned run history

## Security boundaries

- Server listens only on `127.0.0.1:4000`. No deployment or external scanning.
- Registered targets must be `http://127.0.0.1:<port>/`, not public Vercel URLs.
- HTTP requests are GET or explicitly approved PATCH only, on exact allowlisted paths.
- No redirects, max 32 KiB JSON response, 2.5 s timeout per request.
- PATCH tests require explicit run approval, trusted pre/post snapshots and cleanup.
- Forbidden PATCH that changes trusted state is FAIL even with HTTP 403.
- Cleanups attempt restore and verify original state; a failure halts later PATCH tests.
- Authenticated sessions are validated before and after tests by the adapter.
- No raw credentials or protected response bodies are returned or persisted.
- This service does not authenticate API callers: local machine only, synthetic data only.

## What Suprita needs from Snehal

1. Real local app source and startup commands, exact port, server routes, request/response shapes.
2. Synthetic A/B/staff/anonymous identities, roles, authentication mechanism, temporary sessions.
3. Disposable address and stock records, exact identity/ownership fields and safe test markers.
4. Trusted authenticated identity-readiness check (e.g. `/api/me`).
5. A trusted fixture adapter with `ready`, `validateActor`, `authHeaders`, `resolve`, `matchesProtectedFixture`, `snapshot`, `compareState`, `restore`.
6. A seeded reset procedure so allowed/forbidden PATCH tests cannot contaminate later tests.
7. A real protected/broken/fixed app code revision pair, with fixture meaning unchanged.

## What Suprita supplies to Snehal

- `src/adapter.ts`: adapter interface and local target restrictions.
- `src/contracts.ts`: generic test suite and policy schema.
- Stable case ID/actor/resource/operation naming convention (freeze together).
- Expected `PASS`, `FAIL`, `INCONCLUSIVE`, including `UNAUTHORIZED_STATE_CHANGED` and `CLEANUP_FAILED` reason codes.
- Confirmation that G10 requires a safe rejected ownership change; G11 is a state-diff failure mode, not merely an HTTP status; G12 requires a deliberately expiring fake session.

## Current verification state

Automated core verdict unit checks are provided under `tests/` but have not been run
against the actual grocery app. No G01–G12 tests have been authored. Until Snehal's
fixture arrives, the only live outcome expected is `NEEDS_SETUP`.

This package is intended for integration onto a dedicated feature branch after the
team approves the contract; do not overwrite the old student-only v1 files or main.
