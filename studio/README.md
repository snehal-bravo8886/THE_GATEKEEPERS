# CanTheySeeIt? — Sprout & Stone Integrated Security Dashboard

**The Gatekeepers · Kodikon 6.0 · local synthetic testing only**

This project now combines all three working pieces in **one folder**:

- **Frontend:** `dashboard/` — visual security workspace, registered promises, run confirmation, findings/evidence, history and connection status.
- **Verifier:** `src/` and `adapters/sprout-stone.adapter.ts` — real HTTP tests, evidence-gated PASS/FAIL/INCONCLUSIVE, trusted synthetic sessions, before/after snapshots and cleanup.
- **Grocery lab:** `lab/grocery-security-lab/` — deliberately vulnerable local shop with owner, Customer A and Customer B.

## NEW: ZIP upload → choose permissions → run → same-page results

**Start here** is now the default page, while the original suite/verification/results/history workflow remains available. Upload the included `demo-upload/SproutStone_Approved_Website.zip`, tick one or more predefined read/edit permissions, explicitly approve synthetic write tests when selected, click **Run my security checks**, and inspect PASS/FAIL/INCONCLUSIVE on the same page. The selected rules are converted into reviewed test cases and executed by the original backend.

**Important:** Only the approved local Sprout & Stone ZIP is supported. The upload is verified, not executed. Start the matching local grocery lab as described below. See [FINAL_APP_QUICKSTART.md](FINAL_APP_QUICKSTART.md) for exact setup, security scope and API details.

## Run on Windows (two terminals)

**Terminal 1 — grocery lab:**

```powershell
npm.cmd run lab:start
```

**Terminal 2 — verifier API + web dashboard:**

```powershell
npm.cmd install
npm.cmd run dev
```

Now visit **http://127.0.0.1:4100/** for the CanTheySeeIt dashboard. The grocery storefront is at **http://127.0.0.1:4200/**.

Alternatively, double-click `START_GROCERY_LAB_WINDOWS.cmd` and `START_SECURITY_DASHBOARD_WINDOWS.cmd` in two windows. The latter checks/install dependencies on first launch.

Inside the dashboard, click **Security promises → Load demo suites**, then **Live verification**, select a suite, and explicitly approve synthetic write tests before running.

### What the provided vulnerable lab should show

| Security suite | Expected observed verdict |
|---|---|
| `sprout-grocery-g01-g10-v1` (11 checks including G01B) | **PASS** — protected address and inventory permissions |
| `sprout-lab-known-vulnerabilities-v1` (5 checks) | **FAIL** — cross-customer order leak (S03), unauthorized shop-settings change (S05) |

A failing security suite in this **intentionally vulnerable** lab means the verifier successfully found the planted issue. Actual state and HTTP evidence drive the verdict—not a UI selector or revision label.

### Test commands

```powershell
npm.cmd run dashboard:check
npm.cmd run test:frontend
npm.cmd run typecheck
npm.cmd test
```

With grocery lab running, run the existing independent live engine test (no npm install needed on the verifier side with compatible Node 22+):

```powershell
node --experimental-strip-types tests/sprout-live.mjs
```

Read [FRONTEND_RUNBOOK.md](FRONTEND_RUNBOOK.md) for details, security scope, workflow and actual safe patch demonstration. Read [README_SPROUT_WINDOWS.md](README_SPROUT_WINDOWS.md) for the original integration's detailed verification procedures. The outdated foundation README is preserved in `docs/LEGACY_VERIFIER_README.md` for context only.

### Safety and current scope

The server and target bind to **127.0.0.1 only**. Do **not** deploy the intentionally vulnerable grocery app. Use disposable synthetic data. The current dashboard supports a *reviewed, preinstalled Sprout & Stone integration*, not arbitrary website scanning or universal endpoint discovery. The older G11/G12 fault-injection cases remain unimplemented in the provided source.
