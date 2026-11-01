# CanTheySeeIt? — Multi-site Link Intake + Hospital Patient-File Test Lab

This is a **scoped, working extension** of the Experience Edition. It preserves the original **Sprout & Stone ZIP upload → rule choices → reviewed verifier → findings/history** path. It adds **website link → inferred test plan → user confirmation → real verification when approved local test fixtures exist**.

## Who it serves

A beginner who used an AI website builder and wants to ask, in plain language, “Can someone else see my files? Can normal users change admin settings?” They do **not** need to know HTTP request syntax or API endpoints.

**The link alone cannot establish security.** The planner does not browse, crawl, or scan the supplied site. A real supported staging adapter must provide a known test account for each role, actual synthetic records, route mapping, and safe state reset for writes. Without that, the UI presents a **plan only**, with clear setup needs and **no PASS/FAIL verdict**.

## Start on Windows (three terminals)

1. Extract the release ZIP and open its inner project folder in VS Code.
2. Terminal A: `npm.cmd install` (first time) then `npm.cmd run dev`. Open **http://127.0.0.1:4100/**.
3. Terminal B: `npm.cmd run hospital:start`. Open **http://127.0.0.1:4300/** for the separate fictional CareBridge hospital site.
4. On CanTheySeeIt?, select **Enter website link → Try fictional hospital demo → Suggest checks**.
5. Review the **four core promises** and **three additional medical-record checks**. Confirm selected rules. If editing tests were selected, approve disposable synthetic writes, then **Check my website**.
6. The real verifier should report a **confirmed FAIL on H12** because the intentionally flawed file endpoint allows Patient B to retrieve Patient A's private file. Other supported cases have been designed to enforce the correct policies; inspect their actual results rather than assuming they passed.
7. Use the **same-page explanation and technical evidence**. The run is saved in the existing ledger. Any INCONCLUSIVE check does not mean safe.

**Optional original grocery demo:** in a fourth terminal run `npm.cmd run lab:start`; choose **Upload website ZIP → Use sample grocery shop** and its original rules. Grocery runs on **http://127.0.0.1:4200/**. This earlier route is left intact.

### Explore a URL that isn't locally supported

In **Enter website link**, paste something such as `https://my-hospital.example` and describe its features:

> A hospital patient-file portal where patients view their records, assigned clinicians review them, documents can be downloaded, and guardians can be granted temporary access.

Click **Suggest the checks we should run**. You will see six baseline questions plus domain extras. In this case, patient ownership, clinician assignment, file download, and consent revocation are proposed. The URL is **not fetched**; the service will show **Planning only — live tests need setup** and disable the run button.

Never paste real patient data or credentials into the description. Do not point the product at a live hospital or a public service for invasive testing.

## Test-generation logic

**Always suggest baseline checks:**

- Own-record **positive control**: can a valid test user retrieve their own record?
- Other-owner **negative control**: can a different logged-in user retrieve it?
- Forbidden editing **with independent state readback** and reset.
- Admin-only action: can ordinary users execute the same action?
- Anonymous user: do private records require login?
- Expired/invalid session: don't confuse login failure with correct authorization.

**Conditional extra checks:**

| Clue in the user's description | Extra test ideas | Execution scope |
|---|---|---|
| Hospital, patient, clinician, health records | Assigned vs unassigned clinician, clinical note integrity, protected ownership, patient search/list privacy, file access | Supported sample has assigned clinician, clinical note, ownership and private-file tests; the others need a new fixture/route mapping |
| Upload or attachment | Unauthorized file upload or replacement | Suggested only until a safe upload fixture exists |
| Appointments or scheduling | Cross-patient booking visibility | Suggested only until known appointments are configured |
| Sharing, caregiver, consent, revoke | Revoked grants must actually stop access | Suggested only until test grant/revocation controls exist |
| Bulk export or download-all | A user's export must not include another user's data | Suggested only until safe export controls exist |
| Audit/history/log | Only authorized users can see appropriate logs | Suggested only until logs and expected rules are mapped |

**Design principle:** proposed tests and actual findings are separate types. A suggestion MUST NOT be rendered as PASS/FAIL.

## Real supported hospital tests

The `suites/hospital.patient-access.json` contract defines **13 reviewed synthetic checks** on a fixed local target. Main groups:

- H01–H04: own/other/anonymous patient record read.
- H05–H06: own/cross-patient personal record edit with state readback/restore.
- H07–H08: assigned clinician reads, patient denied clinical-note edits.
- H09–H10: admin-only settings updates.
- H11–H12: own vs other patient's file; **H12 intentionally exposes a private file** for detection.
- H13: unauthorized change to `ownerUserId` rejected.

The **hospital fixture data is fictional** and does not represent a real clinic, staff, or medical information. The intentionally vulnerable lab binds to localhost only. Do not expose it to a public interface.

## API integration and interface contract

- `POST /api/workspace/plan-link` accepts `{websiteUrl, description}`; returns `planId`, `mode: SUPPORTED_LOCAL | PLAN_ONLY`, six general cases, suggested extras, evidence/setup notes, and available local demo options. **No request to the provided website occurs.**
- `GET /api/ui/hospital-health` probes only the fixed CareBridge lab at `127.0.0.1:4300` and verifies its identity.
- `POST /api/workspace/verify-link` accepts `{planId, selectedRules, revisionLabel, approveSyntheticWrites}`. Requires a valid unexpired plan for the **exact fixed local CareBridge URL**; generates a SuiteSchema-valid contract, runs the existing `runSuite`, saves ledger history, and returns `{suite,run,...}`. The browser never supplies a URL to the HTTP verifier.
- Existing ZIP endpoints `/api/workspace/upload`, `/api/workspace/options`, `/api/workspace/verify` remain unchanged.

## Run checks

```powershell
npm.cmd run test:frontend
npm.cmd run test:multisite
npm.cmd run dashboard:check
npm.cmd run typecheck
```

`test:multisite` includes true local HTTP tests of the fictional hospital and static contract checks for the planner/connection. Other integration tests require dependencies and running services. The full browser-to-Express walkthrough still needs confirmation on a Windows laptop after installing npm dependencies.

## What remains before claiming support for an arbitrary hospital URL

1. **Consent / authorization** from the website owner for a **separate staging/test environment**.
2. A safe way to connect that environment (self-hosted agent, explicitly approved API spec + fixture adapter, or local project) without SSRF or untrusted-code execution.
3. Credential provisioning for two fictional patients and appropriate staff roles; no live patient information.
4. Accurate route and resource ownership mapping, session verification, exact private fixture markers and independent state assertions.
5. Supported tests for file downloads, user lists, appointments, clinician assignment/revocation and search according to actual app features.
6. Human approval for any synthetic write checks; reset hooks, rate limits and sanitized evidence.
7. Run the tests; report failures and blocked/inconclusive cases honestly. **Never guarantee whole-site security** from a small test set.

## Note on the earlier grocery startup crash

On Windows, `Cannot read properties of null (reading 'port')` during `lab:start` usually follows a failed bind, often because **4200 is already in use**. The new bundle logs a clearer bind error. Close the previous running lab or inspect the port with `netstat -ano | findstr :4200`, and use `tasklist /FI "PID eq <pid>"` to identify its process. Do not forcibly terminate an unrelated process.
