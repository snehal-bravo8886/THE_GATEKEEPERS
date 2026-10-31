# CanTheySeeIt? — Grocery Shop Pivot: Team Roadmap

**Team:** The Gatekeepers · **Hackathon:** Kodikon 6.0  
**Document status:** PROPOSED team roadmap for approval, not proof of implementation.  
**Repository:** https://github.com/snehal-bravo8886/THE_GATEKEEPERS  
**Baseline:** The earlier Checkpoint 0 contract is read-only (`OWNER_ONLY_READ`, T1–T5). The new grocery scope requires a **new, explicitly approved contract** for controlled updates. Do not silently reinterpret T1–T5 or claim the new write tests already work.

## 1. Product decision in one paragraph

CanTheySeeIt? helps beginner AI-assisted developers verify that their web app enforces the security rules they intended. For a **supported local Express grocery-shop app**, the developer selects the app, confirms who may view or edit which resources, and the tool prepares **disposable test users/records** using a trusted adapter, runs real authorization tests, shows evidence-based PASS/FAIL/INCONCLUSIVE results, and remembers the same promise across code revisions. A **suggested fix with human review** is an optional stretch; automatically patching and deploying arbitrary applications is **not** the MVP. Encryption can protect sensitive stored data but **does not replace authorization**.

### The precise MVP problems

1. **Customer data isolation:** Customer B must not read or edit Customer A's private delivery address.
2. **Restricted inventory editing:** Ordinary customers must not update inventory; authorized staff can.
3. **Onboarding barrier:** A beginner should not manually supply bearer tokens, resource IDs, private markers, or individual HTTP requests for this **one supported integration**.

### Clear limits

- Only **approved, local, synthetic** grocery-shop applications. No real customer records, payment information, live stock, public scanning, automatic deployments or arbitrary code execution.
- User confirms the permission rules. Route inspection can suggest endpoints; **an adapter supplies trusted fixtures**; readiness checks establish that they actually work.
- Keep existing read-only student tests as compatibility checks until migration is approved. New grocery test IDs and update-policy semantics must be separately frozen.
- Do not claim universal endpoint discovery, broad web vulnerability scanning, full encryption isolation or automatic source fixing.

## 2. Frozen-after-approval grocery demo contract (PROPOSAL)

All paths, identifiers and methods below are **suggested**. Freeze together before teammates independently code them.

### Actors and resources

| Actor | Role | Synthetic resources |
|---|---|---|
| `customer-a` | customer | `address-a-101` (owner A) |
| `customer-b` | customer | `address-b-102` (owner B) |
| `staff-1` | inventory_staff | Can edit stock of `sku-apple-01` |
| `anonymous` | unauthenticated | Cannot read private addresses or edit stock |

Suggested demo endpoints, all on an approved loopback port:

| Endpoint | Intended permission |
|---|---|
| `GET /api/me` | Check synthetic identity and role |
| `GET /api/addresses/:addressId` | Address owner only |
| `PATCH /api/addresses/:addressId` | Address owner only, limited to an approved field such as a test delivery note |
| `GET /api/products/:sku` | Read product and stock for before/after assertions |
| `PATCH /api/products/:sku/inventory` | Authorized inventory staff only |

Suggested policy families: `OWNER_ONLY_READ` (existing concept), **`OWNER_ONLY_UPDATE`** (new), and **`STAFF_ONLY_INVENTORY_UPDATE`** (new). Existing T1–T5 remain unchanged. Introduce **new, versioned** grocery test IDs after shared schema approval; don't rename T1–T5 to fit new actions.

### Example minimal acceptance matrix

| Proposed case | Actor/action | Expected server behavior | QA must verify |
|---|---|---|---|
| G1 | A GET A's address | 200 + exact owner/id/marker | Correct personal record, valid identity |
| G2 | B GET A's address | 403 (authenticated) | No private marker exposed; B session still valid |
| G3 | A PATCH A's delivery note | 200/approved 2xx | Exact intended field changed; can restore it |
| G4 | B PATCH A's delivery note | 403 | **Address stays identical** after attempt |
| G5 | Staff PATCH stock | 200/approved 2xx | Approved inventory value actually changes; restore it |
| G6 | Customer A PATCH stock | 403 | **Inventory stays identical** after attempt |
| G7 | Anonymous GET A's address | 401 | No private data exposed |
| G8 | Expired session, missing fixture or offline server | Unreliable observation | INCONCLUSIVE, never a false PASS |

For forbidden **writes**, a 403 alone is not enough. Independently read back the saved record after the attempted update. If an unauthorized write changed state, it is a **confirmed security FAIL** even if the response claimed denial. An unexpected 2xx without a state change should not be called PASS for authorization; investigate and mark INCONCLUSIVE under the agreed contract.

For permitted writes, verify the correct field changed on the correct record, and reset it after the test. **Never run mutation tests on production/customer data.**

### Encryption decision

- **Mandatory:** Authorization enforced server-side on *every* private read/edit; no shared client-provided owner flag trusted as proof of ownership.
- **Prudent baseline:** Secure sensitive data in transit when deployed (HTTPS); protect test credentials; avoid storing raw sensitive response bodies.
- **Optional supported demo:** Encrypt synthetic private address fields *at rest* using a maintained authenticated-encryption library and separately managed keys. QA verifies that stored fixtures are not plaintext, authorized access works, and keys aren't returned in API output.
- Encryption at rest alone cannot prevent a broken backend from decrypting and returning Customer A's data to B. **Do not pitch encryption as a substitute for access control.**

## 3. Ownership and deliverables

### Suprita — Backend, verification engine & onboarding orchestrator

**Owns proposed `apps/api/` and shared API/runner integration.**

- [ ] Confirm actual repository folder structure and freeze shared contract with the team. Do not assume `apps/api` or npm scripts exist yet.
- [ ] Preserve evidence-gated read-only behavior and three-state verdicts.
- [ ] Add a **separate controlled write-test capability** for approved synthetic PATCH operations only: exact allowlist, explicit user approval, before/after snapshots, verification and reliable cleanup/reset. Never enable arbitrary methods/hosts.
- [ ] Expand deterministic policy/test generation for owner-only update and staff-only inventory update using **new IDs**.
- [ ] Implement the supported-app onboarding project registry, inspect/prepare flow, candidate rule confirmation and validated, server-owned TargetProfile; reuse the trusted adapter from Snehal.
- [ ] Validate authentication before/after protected tests, exact owner/resource/marker assertions, response status, post-write state and session expiry.
- [ ] Save immutable contract hash, sanitized per-case evidence and chronological history. UI labels must not decide verdicts.
- [ ] Optional stretch: propose one narrow human-reviewable Express authorization fix; do not auto-merge/deploy.

**Handoff to Maulik + Arjun:** Final API endpoint schemas, sample genuine responses, new reason codes, policy IDs, accepted denial statuses, trusted test controls, reset workflow, and startup scripts.

**Done when:** The same verifier reliably identifies a forbidden address read and a forbidden address/inventory edit, with proper state checks and no false PASS.

### Snehal — Grocery demo application, synthetic fixtures & trusted adapter

**Owns proposed `apps/demo/` or the team-approved equivalent.**

- [ ] Build a **small, functional** local Express grocery website/backend: product list, customer delivery addresses, and inventory editing by staff.
- [ ] Create only fake `customer-a`, `customer-b` and `staff-1` identities plus unique test-only address records, roles, login sessions and stable markers.
- [ ] Implement server-side permission checks on GET/PATCH addresses and PATCH inventory. Trust the authenticated user/role, not a client-supplied ownership field.
- [ ] Supply a **trusted, idempotent test fixture adapter**: on explicit approval it provisions/resolves disposable sessions/records and returns private test references to the verifier (never raw tokens to browser).
- [ ] Make supported route patterns inspectable and document whether each route was detected from source or declared by the adapter; no fabricated discovery.
- [ ] Provide safe reset/rollback to original synthetic address and stock values after every permitted update test.
- [ ] Create actual protected → broken → restored **backend code changes** for at least one unauthorized address access and one unauthorized edit; the API response must change due to server code, never because of a UI verdict selector.
- [ ] Optional stretch: encrypt the synthetic address field at rest, document key storage and threat-model limitations.

**Handoff to Suprita + Arjun:** Exact endpoints/status codes, test fixture schema, adapter interface, setup/cleanup hooks, session provisioning, stable test markers, protected/broken/fixed commit references and observed HTTP examples.

**Done when:** A controlled unauthorized GET/PATCH attempt is denied in protected mode and reproducibly exposes/changes the synthetic target only after a real intentionally vulnerable code revision.

### Maulik — Frontend and beginner onboarding UX

**Owns proposed `apps/web/` or the team-approved equivalent.**

- [ ] Build the beginner flow: **Choose approved grocery app → Enter original requirement → Confirm owner/staff rules → Inspect supported routes → Approve synthetic setup → Review tests → Verify → Ledger/history**.
- [ ] Show a clear permission matrix: which actor can **view** versus **edit** which resource; use simple terms, not raw bearer tokens or custom HTTP request editing.
- [ ] Distinguish source-inspected routes from adapter-declared routes; label unsupported configurations **UNSUPPORTED/NEEDS_SETUP**, never READY without real validation.
- [ ] Display actual API-calculated PASS/FAIL/INCONCLUSIVE results, sanitized evidence and friendly explanations. Show NOT_RUN as execution coverage, not a verdict.
- [ ] For write tests, show **before/after validation** in sanitized form (e.g., “record unchanged after unauthorized edit”), never raw customer data.
- [ ] Show exact saved security promise, checks and comparable history with immutable contract hash; no hardcoded PASS/FAIL demo selectors.
- [ ] Optional stretch: a human-reviewable patch suggestion and retest workflow, not an “auto deploy” button.

**Handoff to Arjun:** End-to-end clickable demo path, network/API calls, screenshot-safe evidence, error states and the UI-to-API field mapping.

**Done when:** A beginner can run the supported synthetic grocery checks without manually writing endpoints, bearer headers, test data or assertions.

### Arjun — QA, integration and demonstration

**Owns existing `tests/qa/` and `QA_CHECKLIST.md`.**

- [ ] Retain old T1–T5 contract tests as backward compatibility checks; add a **new grocery matrix** once shared contracts are frozen.
- [ ] Verify correct ALLOW/DENY decisions for owner read/update and staff-only inventory update.
- [ ] Verify **actual persisted state** after permitted and forbidden writes, plus deterministic restore/reset.
- [ ] Validate onboarding discovery provenance, approved project only, no path traversal, explicit setup consent, idempotent fixtures and actual generated TargetProfile.
- [ ] Inject invalid/expired sessions, wrong resource markers, missing adapter, unsupported project, timeout, unexpected 2xx/401/403/404/5xx, redirects and partial-run crashes.
- [ ] Verify sanitization: no bearer tokens, address plaintext, session secrets or encryption keys in reports, client network responses, logs or history.
- [ ] Confirm same-contract protected → broken → fixed results from real backend changes; verify revision label alone cannot change a verdict.
- [ ] Run a clean-clone start/demo test and document actual command outputs. If an integration test isn't executable yet, label it **BLOCKED**, not passed.

**Done when:** The complete supported-app journey works, and deliberately broken access-control cases are caught without falsely approving inconclusive cases.

## 4. Interface freeze before parallel work

All four members must sign off on ONE shared compatibility commit, covering:

- [ ] Actual repo folders, current main commit, branches, Node/package manager and real start commands.
- [ ] Exact approved grocery project ID, local port and allowed file/source roots.
- [ ] Account/session model, roles, resource ownership rules, synthetic fixture markers.
- [ ] Endpoint paths, body shapes and status codes for address GET/PATCH, inventory GET/PATCH and `/api/me`.
- [ ] New policy names and stable grocery test IDs; preserve old T1–T5 separately.
- [ ] Typed runtime schemas, error responses, test-result structure, timeouts/request limits and revised **method allowlist** for safe PATCH tests.
- [ ] Adapter setup/reset methods, separate setup permission from test permission, isolation from real data.
- [ ] Onboarding project/inspect/prepare response shapes and source-vs-adapter provenance.
- [ ] How to store contract hashes and demonstrate real code revisions without changing fixture meanings.
- [ ] Encryption scope and key handling **if** implementing the optional encryption demo.
- [ ] Who approves each PR and which automated QA checks block merging.

**Important:** Previous documents referenced `cantheyseeit-v2`, but the current shared GitHub repo is **`snehal-bravo8886/THE_GATEKEEPERS`**. Treat the latter as the working location unless all teammates explicitly decide otherwise. The former v2 directory names and ports are not verified for the current fresh repo.

## 5. Dependency order and checkpoints

| Gate | Primary owner | Must be demonstrable before moving on |
|---|---|---|
| **0 — Freeze** | All | One agreed written grocery contract and ownership map |
| **1 — Synthetic shop** | Snehal | Valid customer/staff sessions and functioning local GET/PATCH endpoints |
| **2 — Reliable security verifier** | Suprita + Arjun | Authentic response checks, post-write state verification, PASS/FAIL/INCONCLUSIVE |
| **3 — Assisted onboarding** | Suprita + Snehal | Real supported-route detection/adapter provisioning, generated profile, readiness |
| **4 — Beginner experience** | Maulik + integration | UI invokes real API and shows actual generated checks/results |
| **5 — Versioned regression and demonstration** | Snehal + Arjun + all | Saved protected → broken → restored evidence, clean clone reproducibility |

Parallel work is encouraged **after Gate 0**. Mock *example responses* can help the frontend compile, but a demo must not substitute those examples for real API execution.

## 6. Minimal demo storyline for judges

1. Open the local synthetic grocery shop: Customer A has a private address; staff has inventory-edit permission.
2. Paste: **“Customers may read and edit only their own delivery addresses. Only staff may change inventory.”**
3. Select the **supported local Express grocery project**, inspect candidate routes, explicitly approve safe synthetic fixture preparation and confirm the rules.
4. Automatically create/read a fresh server-owned profile and generate the tests. No beginner-facing token/header entry.
5. Run protected app: correct own access/edit works; cross-customer read/edit and customer stock edit are denied; forbidden writes leave state unchanged.
6. Show a **real backend code diff** deliberately removing one ownership check; rerun the **same unchanged promise** and observe an evidence-backed FAIL.
7. Restore the check, rerun to PASS, and show saved history plus contract hash. Optionally show a fix suggestion, explicitly requiring developer approval.
8. Demonstrate an unsupported app or missing fixture yields clear NEEDS_SETUP/UNSUPPORTED/INCONCLUSIVE, not a fake success.

## 7. Definition of done and safety stop-lines

**Mandatory MVP:**
- [ ] A working local grocery backend with two customers, one staff identity, private address and inventory resources.
- [ ] At least one actual private GET rule and one safe synthetic PATCH rule with verified read-back.
- [ ] An owner allowed; another owner denied; staff inventory edit allowed; customer inventory edit denied.
- [ ] Real supported-app onboarding into a newly created profile, or explicitly downgrade the claim to “manual/preconfigured demo” if incomplete.
- [ ] PASS/FAIL/INCONCLUSIVE results grounded in correct sessions, exact fixtures and real responses.
- [ ] No state-changing test against real data; reset works; no raw credentials/sensitive responses in evidence.
- [ ] Real protected → broken → restored code changes produce reproducible matching-contract history.
- [ ] End-to-end reproducible on a teammate's fresh clone with observed test output.

**Do not ship or claim:**
- Arbitrary external website scanning or automatic discovery of *all* endpoint business permissions.
- Autonomous code repair, merging or production deployment.
- Encryption alone solves unauthorized edit or owner isolation.
- “All APIs secured,” “100% vulnerability coverage,” “production-safe encryption” without threat-model validation.
- “Integration tests passed” unless the actual services ran and their results were captured.

## 8. PR and communication protocol

1. Work on an agreed, separate branch. Current observed remote branches include `main`, `frontend` and `test/qa`; not every proposed feature branch exists yet.
2. Before writing code dependent on another member, agree on a checked-in schema/fixture example.
3. For each PR, describe **what changed**, source branch/commit, the **exact commands and observed results**, migration impact and anything not yet tested.
4. Protect `main` from forced pushes; require reviews for shared contract changes.
5. QA uses a clean pull of approved integration changes, reruns offline tests and real integration suites, then documents the genuine result.
6. When something is unfinished, show **BLOCKED/NOT RUN** honestly; don't change the expected verdicts to make a demo turn green.

## 9. Quick one-line handoff

- **Suprita:** “Implement the safe verifier and onboarding API that validates owner/staff permissions for read and controlled synthetic edits.”
- **Snehal:** “Build the grocery app, synthetic customer/staff fixtures, supported adapter, safe reset and genuine vulnerable/fixed server revisions.”
- **Maulik:** “Build the beginner permission-confirmation, onboarding, evidence, history and optional reviewed-fix UI using only real API data.”
- **Arjun:** “Independently prove that reads and writes respect permissions, unauthorized edits do not alter records, onboarding is real, and no uncertain result is reported as secure.”

**Mentor-ready positioning:** “We start from a developer-confirmed permission rule, automate safe test setup for a supported grocery app, verify both *reading and editing* permissions with real synthetic requests, and retain reproducible security evidence. We can recommend a controlled fix, but deployment remains developer-approved.”
