# CanTheySeeIt? — Promise-to-Proof Experience

**Build:** Beginner-first Experience Edition  
**Team:** The Gatekeepers · Kodikon 6.0  
**Principle:** "You tell us what your website should protect. We show whether that rule actually works."

## 1. The user and problem

The intended user is a nonexpert who built a website with AI-assisted tools (ChatGPT, Lovable, Cursor, etc.). They can describe intended privacy and access rules, but should **not** have to understand HTTP methods, API endpoints, bearer tokens, resource IDs or automated testing frameworks.

A website that *looks* correct may have missing checks on hidden backend routes. The product must connect an **original requirement** to specific **confirmed tests** and real observations. A PASS must **never** mean “this whole website is secure.”

## 2. What ships in this edition

This codebase retains the existing Sprout & Stone integration:

- **Frontend:** `dashboard/index.html`, `dashboard/app.js`, `dashboard/styles.css`, and the new `dashboard/experience.css`.
- **Server:** original `src/server.ts` and `src/engine.ts`, preserving suite creation, execution, saved run history and the trusted adapter.
- **Input:** a safely inspected ZIP that must match **the approved, preinstalled local Sprout & Stone training site**; no arbitrary code execution from the ZIP.
- **Output:** a real per-case verdict (PASS, FAIL or INCONCLUSIVE) from the backend, with plain-English explanations, optional technical evidence, a suggested next step for failed rules and a downloadable text report.
- **Traceability:** the optional original user prompt is included in the saved confirmed requirement (bounded to 1,200 characters); **only user-confirmed choices** decide which tests run. The prompt suggestion helper uses transparent browser-side keyword matching, *not a language model*.
- **Privacy:** browser does not store test credentials or raw private records. Controlled changes to synthetic fixtures require explicit approval; the adapter attempts reset and state read-back.
- **Advanced tools:** original Overview, Security Promises, Live Verification, Findings, Run History and Connections pages remain available.

### Beginner flow

1. **Add your website** — drag an approved ZIP or click **Use the sample grocery shop**.
2. **Tell us your rules** — optionally paste the original website prompt, request suggested rules, then confirm one or more of four nontechnical permissions.
3. **Check it** — explicit approval for synthetic updates, clear offline/ready states and one primary action.
4. **Understand results** — failing checks first, explanation, suggestion, evidence on demand, report download and repeatable history.

### Four rule cards and their existing backend mapping

| User-facing promise | Backend rule IDs | Verified resource scope |
|---|---|---|
| People should only see their own private information | `orders.owner_read`, `addresses.owner_read` | **Orders + delivery addresses** |
| People should only edit their own information | `addresses.owner_edit` | **Delivery addresses** |
| Only admins should change important settings | `settings.owner_edit`, `inventory.owner_edit` | **Shop settings + inventory** |
| People who aren't logged in shouldn't see private information | `visitors.private_read` | **Private delivery addresses** (`G01` prerequisite and `G03` anonymous denial) |

The rule mapping is **specific to this reviewed grocery integration**. Do not claim that these options automatically test every private resource on an arbitrary site.

## 3. Core invariants we will not compromise

- **Evidence before confidence:** A matching protected marker, trusted identity checks and before/after state for mutations are necessary. An expired session or offline target cannot become PASS.
- **Failure takes priority:** A confirmed unauthorized exposure or unauthorized saved change ⇒ FAIL, even when other checks are incomplete.
- **No insecure convenience:** Uploaded ZIPs are not executed; no public or user-supplied URLs are fetched by the runner; only approved local synthetic targets.
- **Confirmation over AI guessing:** Optional prompt helper suggests, but never silently confirms policy rules or creates hidden test accounts.
- **No misleading universality:** Explain the supported-profile limit before upload and after results.
- **Separation of actions:** Synthetic fixture setup and write tests require explicit permission; GET testing remains read-only.
- **Same contract across versions:** A revision label does not alter pass/fail logic; saved comparable runs use a stable contract hash.
- **Human-readable first, technical evidence second:** Show “another customer can read an order” before “Broken Object-Level Authorization, HTTP 200.”

## 4. Actual backend protocol (retained)

| Step | Existing endpoint | Payload/result |
|---|---|---|
| Get reviewed rule options | `GET /api/workspace/options` | Six supported technical rule options mapped to four friendly cards |
| One-click sample | `GET /api/workspace/sample-zip` | The approved demo ZIP; no execution |
| Approve uploaded source | `POST /api/workspace/upload` | Raw ZIP (`application/zip`) with `X-Archive-Name`; server returns `uploadId` |
| Verify selected rules | `POST /api/workspace/verify` | `uploadId`, `selectedRules[]`, optional `originalPrompt`, `revisionLabel`, `approveSyntheticWrites` |
| Show genuine findings | Response `run.results` | `testId`, `verdict`, `reasonCode`, `explanation`, sanitized `observed` metadata |
| Review past runs | `GET /api/suites/:id/runs` | Backend ledger saved results |

**No new arbitrary scan endpoint was added.** The existing `runSuite` continues to execute actual requests via the adapter. `originalPrompt` affects the saved requirement and identity of that requirement; it is not executable configuration.

## 5. What the product must *not* say

- "Upload any website ZIP and we'll run it" — **not supported**.
- "Our AI found all endpoints and ownership rules" — **not supported**.
- "Your whole site is safe" — a PASS only covers selected checks with valid prerequisites.
- "We've fixed the issue" — the product **suggests** a repair; no arbitrary patching or deployment.
- "Encryption solves customer-to-customer access" — **authorization** is required independently of encryption.
- "All tests ran" if dependencies, synthetic fixtures or adapters are unavailable — report inability to confirm.

## 6. Future roadmap, in order

**M1 — finish a complete beginner journey:** clean clone, start both services, approve ZIP, choose rules, run, inspect, download report, rerun with a real vulnerability fixed. Record the actual observed outputs.

**M2 — second independent supported application:** a different app (student portal or a documented local OWASP crAPI scenario) with its **own reviewed adapter and test fixture mapping**. Reuse the same rule templates and verdict engine; avoid hardcoded app names in the engine.

**M3 — standards-based import:** an OpenAPI file can suggest documented endpoints, but the user must approve resources and provide/prepare trusted test accounts and ownership fixtures. Validate the target against an explicit allowlist; never launch untrusted uploads.

**M4 — supported AI-assisted rule extraction:** propose rules from the original prompt, show exactly what was inferred and why, and require user confirmation; treat model output as untrusted until validated against the supported contract.

**M5 — assisted repair:** suggest a narrowly scoped, human-reviewed patch in a local supported repository, rerun the same contract and show before/after evidence. No automatic merge or deployment.

## 7. Presentation script (45 seconds)

> “People can build a website with AI without knowing how to test whether its private-data rules really work. CanTheySeeIt? asks what they expected, not which API calls to send. They add a supported website, select four simple kinds of privacy and editing rules, and we run real checks with safe test accounts. We then show what worked, what failed and what we couldn't prove, including why and what to fix. Our grocery demo catches two planted authorization bugs while correctly passing protected cases. We make our coverage limits explicit, and the same promise can be checked again after a real code change.”

## 8. Run commands — Windows PowerShell

From the folder containing `package.json`:

**Terminal 1 — training shop**

```powershell
npm.cmd run lab:start
```

**Terminal 2 — verifier + frontend**

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://127.0.0.1:4100/`, press **Use the sample grocery shop**, confirm the selected rules, approve synthetic edits, and press **Check my website**. The demo shop itself is on `http://127.0.0.1:4200/`.

Run dependency-free checks:

```powershell
node --test tests/frontend/*.test.mjs
node --test lab/grocery-security-lab/tests/lab.test.mjs
```

**Test honesty:** Frontend source/contract and grocery lab HTTP tests are runnable independently. End-to-end browser-to-Express verification requires `npm install` and both servers running; do not claim it passed in an environment where those prerequisites are unavailable.
