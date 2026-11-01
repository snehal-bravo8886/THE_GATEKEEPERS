# CanTheySeeIt? — Integrated Frontend (Maulik's replacement)

This frontend was built **on the provided Sprout & Stone integrated Windows archive**, not against invented APIs. It serves through the existing Express verifier at `http://127.0.0.1:4100/` using a single origin (no separate Vite port/CORS).

## Quick start: Windows PowerShell (2 terminals)

Extract the **frontend-integrated ZIP**, open its root in VS Code. You should see `package.json`, `src`, `dashboard`, `suites`, and `lab`.

**Terminal 1 — grocery shop:**

```powershell
npm.cmd run lab:start
```

The shop runs on http://127.0.0.1:4200/. If Express isn't installed, the lab's included mini-express preview will be used. That fallback is suitable for a local demonstration but not an Express-specific compatibility claim.

**Terminal 2 — verifier API and dashboard:**

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run dev
```

Open **http://127.0.0.1:4100/**. The dashboard and API are served together. If `npm.cmd run dev` prints a missing dependency error, run `npm.cmd install` from the integrated root (not inside `dashboard`).

The backend can also be started with `npm.cmd start` instead of `npm.cmd run dev`.

### First use

1. Confirm **Connections** shows verifier available, adapter registered, and grocery lab reachable. Adapter registration alone is **not** evidence that the lab is ready.
2. Go to **Security promises** and click **Load demo suites**. This uses the **existing** `POST /api/suites` endpoint with the two reviewed, bundled JSON manifests. Repeating this operation does not create duplicates. Alternatively run `node scripts/register-sprout.mjs`.
3. Open **Live verification**, choose one of the two suites, and click **Review & run tests**.
4. Choose a revision label, explicitly tick synthetic-write approval, and run. The API handles fixture setup, authentication, snapshots, state verification, and reset; the browser **does not receive credentials**.
5. View **Findings** for all case-level verdicts, reason codes, observed HTTP statuses, protected-fixture matches and state changes. View **Run history** for persisted comparisons. None of these statuses are hardcoded.

### Expected result on the uploaded vulnerable shop

- `sprout-grocery-g01-g10-v1` — expected **PASS** for the protected address and inventory cases; contains 11 cases (including G01B).
- `sprout-lab-known-vulnerabilities-v1` — expected **FAIL**; S03 catches cross-customer order disclosure; S05 catches unauthorized shop settings modification.
- A failed target readiness check or dirty synthetic fixture must return `NEEDS_SETUP` / `VERIFICATION_UNAVAILABLE`, not an invented PASS.
- G11 and G12 remain **BLOCKED** in the provided backend fixtures. The UI does not claim to have tested them.

### Real protected → vulnerable → fixed regression

The actual lab source of truth is `lab/grocery-security-lab/src/access.mjs`, and `patches/` contains real code revisions.

**From the LAB folder (in a third terminal or after stopping lab):**

```powershell
cd .\lab\grocery-security-lab
Copy-Item .\patches\access.secure.mjs .\src\access.mjs -Force
```

Restart the grocery app from terminal 1; rerun **the same saved known-vulnerabilities suite** with label `v1-protected` -> expect PASS. Stop and copy `access.vulnerable.mjs`, restart; rerun with label `v2-regression` -> expect FAIL. Restore `access.secure.mjs`, restart; rerun with label `v3-fixed` -> expect PASS. Revision text does not determine verdict; only observed data does.

Note: the grocery shop's own unit tests were written to validate its intentionally vulnerable starting state; they may fail when intentionally switching to the secure policy. The verifier suite remains the comparable security benchmark.

## Architecture

```text
Browser 127.0.0.1:4100
  dashboard/index.html + styles.css + app.js (no extra package dependencies)
       ├─ GET /api/health
       ├─ GET /api/readiness
       ├─ GET /api/ui/lab-health  (fixed, safe 127.0.0.1:4200 health probe)
       ├─ GET /api/suites
       ├─ POST /api/suites     (load reviewed contract JSON)
       ├─ POST /api/suites/:id/run  (explicit synthetic write approval)
       └─ GET /api/suites/:id/runs
                   ↓
           backend adapter (session tokens remain in Node process)
                   ↓
        Sprout & Stone local lab 127.0.0.1:4200
```

The dashboard is a **real UI around the integrated verifier**, not a mockup. It uses the actual contract fields from `src/contracts.ts`. No new arbitrary-target API, raw token fields, automatic patching, or public deployment was introduced.

## Testing

```powershell
npm.cmd run dashboard:check
npm.cmd run typecheck
npm.cmd test
```

For the direct integration smoke test, leave the grocery lab running and execute:

```powershell
node --experimental-strip-types tests/sprout-live.mjs
```

You can also verify the browser-facing routes:

```powershell
Invoke-RestMethod http://127.0.0.1:4100/api/health
Invoke-RestMethod http://127.0.0.1:4100/api/ui/lab-health
```

## Important limits

- The interface currently operates **only on one pre-approved, synthetic, local grocery project** via the registered adapter. It doesn't auto-discover arbitrary source routes or accept user-defined HTTP targets.
- No production accounts, payment systems, external security scans or network deployments.
- The verifier saves results in `data/ledger.json` (not inside the public dashboard directory). Browser panels show sanitized evidence only.
- Write tests need user confirmation, verified test fixtures and clean rollback. If cleanup fails, the verifier halts later mutations and cannot claim PASS.
