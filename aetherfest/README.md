# AETHER 2026 — College Fest authorization-testing demo

A beautiful fictional college fest website built as a **local-only, intentionally vulnerable** training target for CanTheySeeIt?. The page looks like an ordinary college festival app. The bugs live in its **backend authorization checks**, not in a visible admin toggle.

## Run the site (no npm install required)

Install **Node.js 20+**. Extract the folder and open a terminal inside `AetherFest_College_Demo`.

```bash
npm start
```

Visit **http://127.0.0.1:4400**. This binds to 127.0.0.1 only. The project is fictional and uses in-memory test data: every server restart resets its state.

## Three synthetic demo logins

The login modal has **Fest Head**, **Student A**, and **Student B** preset buttons that fill their credentials. No real student data or payments are used.

| Role | Email | Password |
| --- | --- | --- |
| Fest Head / owner | `head@aetherfest.test` | `HeadDemo!26` |
| Student A | `aarav@aetherfest.test` | `StudentA!26` |
| Student B | `diya@aetherfest.test` | `StudentB!26` |

The fest head has a visible management form to edit ticket pricing and announcements. Students see only their own registrations and **no administration controls** in the normal UI.

## What is deliberately broken? (for the developer / judges, not shown on the website)

1. **Object-level authorization:** `GET /api/registrations/reg-b-1002` returns Student B's private registration even when the valid token belongs to Student A. This is an authorization failure, not an authentication failure.
2. **Role-based authorization:** `PATCH /api/fest/settings` accepts a ticket-price change from Student B, even though only the fest head should be able to change it. A trusted reread as the head proves the new price persisted.

Both are implemented in [`src/permissions.mjs`](src/permissions.mjs). The **normal frontend does not expose a student edit control**; the HTTP API is intentionally insufficiently protected. This is the bug we want CanTheySeeIt? to catch.

## Verify the bug without CanTheySeeIt?

Keep the website running in Terminal 1. In Terminal 2, from this folder:

```bash
npm run test:exposure
```

You should see that Student A received Student B's record, and Student B changed the public ticket price from **₹499** to **₹1**. The script resets the fictional data afterward.

To demonstrate the bug in the browser itself:

- Log in as **Student A** using the modal, open Developer Tools Console, then run:

```js
const aToken = sessionStorage.getItem('aether-demo-token');
const leak = await fetch('/api/registrations/reg-b-1002', {
  headers: { Authorization: `Bearer ${aToken}` }
});
console.log(leak.status, await leak.json());
```

- Log out, sign in as **Student B**, open Developer Tools Console, then run:

```js
const bToken = sessionStorage.getItem('aether-demo-token');
const edit = await fetch('/api/fest/settings', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bToken}`
  },
  body: JSON.stringify({ ticketPrice: 1 })
});
console.log(edit.status, await edit.json());
```

Reload the homepage: the ticket is now **₹1** although Student B had no visible management interface. Restart the lab or run the reproduction script to restore the original state.

## Fix both bugs and rerun the same tests

Stop the site (`Ctrl+C`), then on Mac/Linux:

```bash
FEST_MODE=secure npm start
```

On Windows PowerShell:

```powershell
$env:FEST_MODE = 'secure'
npm.cmd start
```

The implementation in `src/permissions.mjs` now checks the resource's `ownerUserId` and the head role. Student A should receive **403** for Student B's registration; Student B should receive **403** when attempting to edit fest settings. The head can still update the ticket price. No source files need modification for this controlled comparison.

For automated independent checks:

```bash
npm test
```

This starts both modes in succession and tests the two bugs, valid user controls and resets.

## Test with your CanTheySeeIt? platform

**Recommended:** Download the accompanying **CanTheySeeIt_Studio_With_AetherFest.zip**, which has this lab and adapter integrated into the earlier Studio Light platform.

1. Start the College Fest lab on port **4400** with `npm run fest:start` from the integrated Studio project root.
2. Start CanTheySeeIt? dashboard/API on port **4100** with `npm install` and then `npm run dev` (Node.js 22+ recommended for Studio).
3. Open **http://127.0.0.1:4100** → **Start here** → **Upload website ZIP**.
4. Choose **College Events / Fest** and upload the accompanying **AetherFest_Approved_Website.zip** (the approved sample ZIP, **not** the full project/tooling bundle).
5. Choose both predefined rules (registration privacy and head-only ticket pricing), approve **synthetic write testing**, and click **Check my website**.
6. The real verifier should report **F01 PASS, F02 PASS, F03 FAIL, F04 PASS, F05 FAIL** in vulnerable mode. Overall: **FAIL**. Both rejected writes are restored automatically by the trusted fixture adapter.
7. Restart the College Fest lab in secure mode (same source ZIP) and rerun. All five tests should PASS.

Alternative: With both services running, execute `npm run test:platform` in this demo folder to register the suite, run its actual backend verification, and print the resulting verdicts.

**Important boundary:** The approved ZIP is checked against the installed, matching local source and selects a trusted test adapter. It is **not** unpacked and executed as an unknown website. Arbitrary college fest ZIPs are not yet supported by this platform. This is a genuine local HTTP integration, not universal zero-setup scanning.

## Code map

| Path | Purpose |
| --- | --- |
| `public/index.html`, `styles.css`, `app.js` | Responsive event website, signup view, login modal, head-only visible edit form |
| `src/server.mjs` | HTTP API, identity validation, registrations, pricing, reset |
| `src/data.mjs` | Fictional seeded accounts, registrations and prices |
| `src/permissions.mjs` | Two deliberate authorization defects, with secure-mode fixes |
| `target-manifest.json` | Approved project identification for the ZIP verifier |
| `cantheyseeit-integration/adapters/aetherfest.adapter.ts` | Trusted V2 identity, resource and before/after state adapter (must be installed inside Studio's `adapters/`) |
| `cantheyseeit-integration/suites/aetherfest.college-vulnerabilities.json` | Five actual verifier test definitions |
| `scripts/check-platform.mjs` | Run the real local CanTheySeeIt? HTTP verifier API |
| `scripts/reproduce-bugs.mjs` | Independently demonstrate the two local mistakes |

### Safety scope

Fictional accounts only; deliberately insecure mode; local-loopback server. **Do not deploy this app publicly or reuse the vulnerable permissions in a real site.** `FEST_MODE=secure` is a controlled demonstration fix, not a production security audit.
