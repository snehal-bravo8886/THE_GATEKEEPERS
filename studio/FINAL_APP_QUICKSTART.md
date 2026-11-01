# CanTheySeeIt? — Final Guided ZIP-to-Results Workflow

**The Gatekeepers · local synthetic authorization verification**

## What changed (without removing the original workflow)

The existing Overview, Security promises, Live verification, Findings, Run history, Connections and How it works views are preserved. A new **Start here** page now lets the user:

1. **Upload a website ZIP** (`.zip`, up to 8 MB). The server safely checks the ZIP container and the source of the **one supported Sprout & Stone training application** against the local approved copy. It does **not** execute, extract or install uploaded code.
2. **Choose security rules from five approved options**, using checkboxes rather than writing custom API requests or test cases.
3. **Confirm synthetic writes** (when PATCH tests are selected), choose a revision label and click **Run my security checks**.
4. See **PASS, FAIL, INCONCLUSIVE**, actual HTTP/status evidence and individual explanations **on the same page**. Runs are saved into the original ledger and also visible from Findings and Run history.

The backend maps selections to existing reviewed test cases (G01–G10, S01–S05, including automatic prerequisite checks), then calls the original `runSuite()` and `saveRun()` functions. Rules and verdicts are **never hardcoded as final UI outcomes**.

## Start in Windows / VS Code

You need **Node.js 22+** and `npm`.

1. Extract the full `CanTheySeeIt_Final_Guided_App.zip` package and open its `CanTheySeeIt_SproutStone_Integration` folder.
2. In **terminal 1**, run:

   ```powershell
   npm.cmd run lab:start
   ```

   Or double-click `START_GROCERY_LAB_WINDOWS.cmd`. The deliberately vulnerable grocery test lab runs at **http://127.0.0.1:4200**.
3. In **terminal 2**, run:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

   Or double-click `START_SECURITY_DASHBOARD_WINDOWS.cmd`. The security dashboard and API run at **http://127.0.0.1:4100**.
4. Open **http://127.0.0.1:4100**, click **Start here**.
5. Select `demo-upload/SproutStone_Approved_Website.zip` from the same project folder, or click **Download the sample grocery website ZIP** on the page and re-upload it.
6. The default two checked options exercise **customer order privacy** and **shopkeeper-only settings editing**. Change these selections or add address and stock checks.
7. Check **I approve controlled tests on synthetic data** if any selected rule involves editing.
8. Click **Run my security checks**. The inline results should show the actual returned verdicts and evidence. The sample's two intentionally planted flaws are expected to produce **two FAIL results**, assuming the vulnerable backend revision is running and its synthetic records are clean.

## Five supported permission options

| User-friendly security requirement | Approved case IDs |
|---|---|
| Customers can read only their own orders | S01, S02, S03 |
| Only the shopkeeper can edit store settings | S02, S04, S05 (S02 prerequisite) |
| Customers can read only their own addresses | G01, G01B, G02, G03 |
| Customers can edit only their own addresses | G01, G01B, G04, G05, G06, G10 |
| Only the shopkeeper can edit inventory | G07, G08, G09 |

Overlapping cases are de-duplicated. Dependencies are included even if the user selects only a dependent rule. Existing published suites are unchanged.

## New backend endpoints

- `GET /api/workspace/options` — supported project and selectable permission rules.
- `GET /api/workspace/sample-zip` — downloadable approved training ZIP for this demo.
- `POST /api/workspace/upload` — accepts raw `application/zip` bytes, with an encoded `X-Archive-Name` header, verifies archive structure and known source files, and returns a short-lived upload reference. Does not store or execute the archive.
- `POST /api/workspace/verify` — accepts `{uploadId, selectedRules, approveSyntheticWrites, revisionLabel}`, builds a validated suite from reviewed cases, runs the real trusted local adapter, saves the run, and returns `{suite, run}` to display inline.

These are additive. Existing `/api/suites`, `/api/suites/:id/run`, `/api/suites/:id/runs` and all prior views still work.

## Safety and limitations — important for judges

- **ZIP upload is not arbitrary website scanning.** This version accepts a known approved Sprout & Stone package. Any unrelated website ZIP returns `UNSUPPORTED_APP` instead of being executed. Additional websites need their own reviewed, trusted adapter and fixture rules.
- The ZIP is **source/profile recognition**, not a deployment action. The matching local lab must already be running on **127.0.0.1:4200**. The uploaded archive is not started as a server. The server checks approved source files against its installed lab copy; it cannot attest to arbitrary external running processes.
- This demo is synthetic only. The grocery shop deliberately contains access-control bugs. Never deploy it publicly or run write tests against real customer/inventory data.
- A PASS applies to the **selected checks only**. It does not certify the entire website. A confirmed exposure is FAIL; invalid sessions or missing evidence are INCONCLUSIVE.
- The upload reference expires after 30 minutes or when the dashboard backend restarts. Upload again if needed.
- Encryption, auto-repair, arbitrary endpoint discovery, automatic launch of arbitrary user ZIPs, and OWASP crAPI integration are **not** included.

## Smoke checks

From the root project folder:

```powershell
node --check dashboard/app.js
npm.cmd run test:frontend
```

With dependencies installed, also run:

```powershell
npm.cmd run typecheck
npm.cmd test
```

For real integrated verifier checks, start the grocery lab and use the browser Start here flow. The original suite-selection and history flows remain independently available.
