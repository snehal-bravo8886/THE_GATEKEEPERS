# CanTheySeeIt? — Sector Wizard Edition

## New beginner workflow (no paragraphs or API vocabulary required)

1. Choose **Enter website link** (the default) or the original **Upload website ZIP** tab.
2. Pick one of four familiar website types:
   - **Restaurant & dine-in ordering:** table orders, QR codes, menu staff, bills.
   - **Grocery & stationery shops:** orders, inventory, addresses, pickups/returns.
   - **Clinics & patient management:** private records, clinicians, appointments, medical files.
   - **Student & institution events:** registrations, QR tickets, organizer permissions, check-in, attendee exports.
3. Tick the features your website actually has.
4. Tick from four general protections (own private data, own edits, admin-only changes, logged-out privacy).
5. Paste the site link and click **Show my recommended checks**.
6. Review the plain-English plan. The planner deterministically expands each selected rule into prerequisite, allowed-access and forbidden-access scenarios.
7. **For supported local labs only:** approve synthetic edit checks where necessary; run the verifier and see real results on the same page.

## Windows quick start

Open this directory in VS Code. In Terminal 1:

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:4100/ in the browser.

For the **supported fictional clinic**, use Terminal 2:

```powershell
npm.cmd run hospital:start
```

Then click **Try the clinic example** in CanTheySeeIt?. It fills the fictional clinic link, selects relevant checkbox rules, and prepares the real supported local-test setup. This is the only URL-based lab with a confirmed live adapter in this release.

For the **existing grocery lab**, use Terminal 2:

```powershell
npm.cmd run lab:start
```

In CanTheySeeIt?, choose **Upload website ZIP → Use the sample grocery shop**. The original reviewed tests and saved results flow are preserved. The grocery lab runs on port 4200.

## What it does and does not do

- **Does:** Four sector cards, dynamic checkboxes, four general privacy promises, deterministic test-plan expansion, readable explanations, and retained ZIP/live-verifier flows.
- **Does:** Reject unrecognized rule IDs and invalid combinations at the server. A real `PASS` or `FAIL` requires the trusted verifier to execute requests and verify identity/fixture prerequisites.
- **Does not:** Scan or execute arbitrary website links or ZIPs. Restaurant, student-event, and unfamiliar retail or clinic sites receive a **PLAN ONLY / SETUP NEEDED** result until their safe, approved staging adapter exists.
- **Does not:** Claim that a suggested test plan proves a site is safe. Clinical and student test data must be fictional; no real patient records, payments or credentials.
- **Does not:** Use an LLM; no natural-language interpretation is required for choosing tests.

## Quality checks

```powershell
npm.cmd run test:frontend
npm.cmd run test:multisite
npm.cmd run dashboard:check
```

The testing engine and adapter source are unchanged except for the expanded `/api/workspace/sectors` and `/api/workspace/plan-link` input and sector-planning modules. Browser rendered checks can be verified on your laptop once dependencies install.

## Files changed

- `src/sectorCatalog.ts` — reviewed sectors, choices, common rules, and repeatable case expansions.
- `src/sitePlanner.ts` — preserves previous link planning and adds explicit sector/feature-based planning.
- `src/server.ts` — exposes sector choices and accepts the new explicit input schema.
- `dashboard/index.html`, `dashboard/app.js`, `dashboard/experience.css` — accessible cards, checkboxes, supported-local run handling, and plan-only disclosures.
- `tests/frontend/sector-wizard.test.mjs` — static regression tests for this workflow.

**Security boundary:** The only site actions in URL planning are validation and deterministic plan generation. Unknown URLs are not contacted. Live scans require a separately reviewed local synthetic adapter and consent for permitted test mutations.
