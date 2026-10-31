# CanTheySeeIt? — Final Demo Presentation, Speaking Roles & Contribution Handoff

**Team:** The Gatekeepers · **Event:** Kodikon 6.0 · **Prepared:** 31 October 2026  
**Presentation target:** ~5 minutes + live demonstration + mentor questions  
**Project repository:** https://github.com/snehal-bravo8886/THE_GATEKEEPERS  
**Live example:** Sprout & Stone, an intentionally vulnerable, **local-only synthetic grocery shop**

> **Accuracy note:** This document distinguishes code currently present on GitHub branches, locally demonstrated integration, and proposed future features. It is a speaking plan, not a claim that every demo artifact has been merged into \`main\`. Team members should confirm the exact credit for their contribution before presenting.

---

## 1. Who says what — the speaking order

| Order | Speaker | Role | Time | What they demonstrate/explain |
|---|---|---|---|---|
| 1 | **Suprita Shinganmakki** | Backend & Security Verification Lead | ~60–75 s | Problem, verifier, permission rules, real HTTP testing and honest verdicts |
| 2 | **Snehal Agrawal** | Grocery Demo, Test Cases & Trusted Fixture Adapter Lead | ~60 s | Synthetic users/resources, intended access rules, seeded vulnerable routes, repeatable fixtures |
| 3 | **Maulik Bishop** | Frontend & UX Lead | ~55–65 s | Simple ZIP + rule selection journey, results on one page, evidence, history and usability |
| 4 | **Arjun** | QA, Integration & Live Demo Lead | ~85–100 s | Tested outcomes: 11 protected checks PASS; 5 known-vulnerability checks with 2 FAIL; actual browser reproduction and limitation |
| 5 | **All four** | Mentor Q&A | As needed | Each person answers questions about their ownership area |

### Speaker 1 — Suprita: Problem and verification engine

> “AI tools can help beginners build functional websites quickly, but beginners often don't know whether the application obeys the access rules they originally requested.
>
> For example, in a grocery shop, Customer A must not be able to read Customer B's private order, and an ordinary customer must not be able to change shopkeeper-only settings.
>
> CanTheySeeIt? turns a user-confirmed access rule into repeatable authorization checks. Our verifier makes real HTTP requests using approved synthetic identities, validates the expected records and permissions, and returns three possible outcomes: **PASS**, **FAIL**, or **INCONCLUSIVE**.
>
> PASS means the particular rule held under valid test conditions. FAIL means we observed a confirmed rule violation. INCONCLUSIVE means we could not establish a trustworthy result, such as when authentication expires.
>
> We save test evidence and run history so developers can check the same security promises again after changes.”

**On-screen handoff:** Show the selected security promises and verification flow; pass to Snehal to explain the tested application.

### Speaker 2 — Snehal: Grocery application and reliable test setup

> “We use a local, fictional grocery shop called **Sprout & Stone** to show real permission problems in a multi-user website.
>
> It has a shopkeeper, Customer A, and Customer B. We test private orders, personal delivery addresses, inventory, and shopkeeper settings.
>
> The important distinction is that the application does **not** have identical security on every route: customer addresses and inventory are protected in our tested scenarios, while we've deliberately left two permission bugs in separate routes.
>
> I worked on the synthetic test-case definitions and trusted fixture adapter so the verifier knows which fake accounts and records to use. The adapter is designed to supply known test identities and resources rather than requiring a beginner to create every request manually.
>
> The test environment is disposable and local. We do not use actual grocery customers, production inventory or real private information.”

**On-screen handoff:** Briefly show normal customer-facing pages; pass to Maulik.

### Speaker 3 — Maulik: Frontend and easy-to-use workflow

> “Our goal is to make security verification understandable even for developers who don't know how to manually configure API requests.
>
> The guided workflow is: **upload a supported website ZIP, choose from a limited list of permission rules, approve testing on synthetic data, and run the checks**.
>
> We display PASS, FAIL, and INCONCLUSIVE on the **same page**, along with the individual test descriptions and evidence. The existing workspace also includes findings and run history.
>
> For safety, ZIP upload currently identifies an **approved, already installed demo integration**. It does not execute any arbitrary website ZIP or automatically discover every application's business logic.
>
> We are demonstrating a supported integration rather than claiming universal one-click security testing.”

**On-screen handoff:** Show the guided landing page and select two rules:
1. “Customers can read only their own orders.”
2. “Only the shopkeeper can edit store settings.”

Then pass to Arjun to run it and show the evidence.

### Speaker 4 — Arjun: Integration QA and the live proof

> “My job is to test the **security-testing tool itself**. I check that the frontend, verifier, and grocery application work together, and especially that our tool never gives a false security PASS.
>
> We have two separate test suites. In the **address and inventory suite**, all **11 checks passed**, including checks that customers cannot read or modify another customer's address and cannot change inventory.
>
> In the **known-vulnerability suite**, **3 checks passed and 2 failed**. Those two failures are exactly the planted bugs we wanted our tool to detect.
>
> **S03:** Customer A asks for Customer B's private order; the API returns HTTP 200 with B's record and private marker. That's broken object-level authorization.
>
> **S05:** Customer B updates the shopkeeper's settings; the API accepts the request and the stored settings change. That's broken function-level authorization.
>
> We also check outcomes beyond HTTP codes: a forbidden update should leave the protected record unchanged. If the server replies 403 but the unauthorized change is actually saved, the security verdict must still be FAIL.
>
> These results demonstrate real detection on **our supported local grocery lab**. They do not yet prove compatibility with arbitrary uploaded websites or OWASP crAPI.”

**Live-demo handoff:** Show the two screenshots/results and, if time permits, reproduce S03 as a logged-in customer.

### Closing line — one speaker, ideally Arjun or Suprita

> “Our core value is making specific privacy and permission promises **testable, understandable, and repeatable** for beginner developers. We're starting with a supported grocery application, with broader integrations as future work.”

---

## 2. Who has done what — contribution record and verification status

| Member | Assigned work | Concrete work we can point to | Honest status |
|---|---|---|---|
| **Suprita** | Backend verifier, security contracts, execution and evidence | A packaged **\`CanTheySeeIt_Generic_Verifier_v2.zip\`** exists on repository \`main\`; the locally demonstrated integration executed the verifier and returned per-test outcomes/history | **Verifier package on GitHub; integrated execution demonstrated locally.** Do not claim full backend source was extracted/merged into \`main\`. |
| **Snehal** | Synthetic grocery test definitions, trusted test data/adapter, demo integration | GitHub branch **\`feat/snehal-test-cases-fixtures\`** contains \`member2-snehal/fixture/fixture-adapter.mjs\`, \`member2-snehal/test-cases/grocery-test-cases.json\`, and V2 suite definitions | **Fixture/test-case code committed on feature branch.** Its README explicitly says that an adapter bridge and target-specific validation are still required; do not claim that that feature-branch adapter is already live against the final Sprout & Stone integration. |
| **Maulik** | Beginner-facing frontend UX, rules flow, results and navigation | GitHub branch **\`frontend\`** contains \`CanTheySeeIt_Ready_Frontend2.tsx\` (an earlier student-portal-style frontend). After the laptop issue, a **replacement integrated dashboard and guided ZIP/rule-selection interface** were assembled for the local demo | **Frontend prototype committed; newer demo UI works in the local integrated package, but is not yet committed as source to \`main\`.** Confirm individual authorship before taking personal credit for later reconstruction. |
| **Arjun** | Independent QA, integration, negative tests, demo reproduction | GitHub branch **\`test/qa\`** contains contract tests, negative-case checks, grocery matrix, write-verdict oracle, API-integration test scaffolds, QA runbook, and an offline CI workflow. The local integrated demo has been checked visually and through real HTTP responses | **QA code committed on branch; local screenshots show live 11-pass and 3-pass/2-fail results.** The newer integrated packages are separate local artifacts, not yet committed to \`main\`. |

**Branch and source links:**
- Backend package on \`main\`: [Generic verifier ZIP](https://github.com/snehal-bravo8886/THE_GATEKEEPERS/blob/main/CanTheySeeIt_Generic_Verifier_v2.zip)
- Snehal: [Fixture adapter and grocery suites](https://github.com/snehal-bravo8886/THE_GATEKEEPERS/tree/feat/snehal-test-cases-fixtures/member2-snehal)
- Maulik: [Earlier frontend prototype](https://github.com/snehal-bravo8886/THE_GATEKEEPERS/blob/frontend/CanTheySeeIt_Ready_Frontend2.tsx)
- Arjun: [QA test folder](https://github.com/snehal-bravo8886/THE_GATEKEEPERS/tree/test/qa/tests/qa)
- Grocery roadmap: [Team roadmap](https://github.com/snehal-bravo8886/THE_GATEKEEPERS/blob/test/qa/GROCERY_TEAM_ROADMAP.md)

### What was demonstrably observed in the local integrated app

These are **separate runs**, not a single universal “website security score”:

| Suite | PASS | FAIL | INCONCLUSIVE | What was tested |
|---|---:|---:|---:|---|
| **Grocery address / inventory** | **11** | **0** | **0** | Own/cross-user address read/update, anonymous requests, shopkeeper inventory edit, customer inventory denial and protected owner field |
| **Known grocery vulnerabilities** | **3** | **2** | **0** | Customer own-order positive controls, cross-user order leakage, owner store-settings positive control, customer shop-settings mutation |
| **Total across both displayed suites** | **14** | **2** | **0** | **16 individual observations**, split across distinct permission promises |

**Known-vulnerability evidence shown in the dashboard:**
- **S03:** Alice reads Bob's order → HTTP **200** + Bob's private marker → **FAIL**.
- **S05:** Bob changes shopkeeper settings → HTTP **200** + persisted state changed → **FAIL**.
- **G02:** Bob requests A's address → HTTP **403** on the verifier's authenticated check → **PASS**.
- A separate manual browser attempt produced **401** when its session was not recognized. **401 is not proof of G02 PASS** when the intended authenticated user cannot be established.

**Browser reproduction:** While authenticated as Alice on the same origin, visiting \`/api/orders/order-b-1002\` returned Bob's order JSON; the screenshot showed \`ownerUserId: customer-b\`, Bob's order items, and the known private marker. This is the concrete live S03 demonstration.

---

## 3. Live demonstration checklist — projected screen and action

| Step | Presenter | Screen / action | What to say |
|---|---|---|---|
| 1 | **Snehal** | Open local Sprout & Stone grocery storefront; explain the three fictional account types | “This is a deliberately isolated, synthetic application with realistic roles and resources.” |
| 2 | **Maulik** | Open CanTheySeeIt?'s **Start here** page; upload the *approved* Sprout & Stone ZIP | “A beginner supplies a supported project ZIP; we safely identify the prepared integration rather than executing arbitrary uploaded code.” |
| 3 | **Maulik** | Select **own orders** and **shopkeeper-only settings** | “These are restricted, developer-confirmed permission options.” |
| 4 | **Arjun** | Approve synthetic write tests and click **Run my security checks** | “The backend generates and executes the reviewed checks against the running local app.” |
| 5 | **Arjun** | Show same-page **3 PASS / 2 FAIL** and S03/S05 detail evidence | “Both planted vulnerabilities were detected; legitimate actions still passed.” |
| 6 | **Arjun** | As Alice on the *same browser origin and active session*, open \`/api/orders/order-b-1002\` | “Alice received Bob's private order: an authorization failure we can reproduce independently.” |
| 7 | **Suprita** | Briefly show per-test evidence or history | “Verdicts depend on observed responses and saved-state checks, not a UI toggle.” |
| 8 | **All** | Q&A | Answer by ownership area below |

**Quick local run reference** (run from the integrated project's root; actual packaged scripts/ports must be checked before presentation):
- Grocery lab: \`npm.cmd run lab:start\`
- Security app: \`npm.cmd install\` then \`npm.cmd run dev\`
- Expected local endpoints in the demo: grocery \`http://127.0.0.1:4200/\`; dashboard \`http://127.0.0.1:4100/\`.

**Browser authentication gotcha:** Login must be active and the test request must use the same origin (avoid switching between \`localhost\` and \`127.0.0.1\`). Validate \`/api/me\` before manually comparing a 401/403.

---

## 4. Questions mentors are likely to ask and who answers

| Mentor question | Person | Safe, precise answer |
|---|---|---|
| “How does the system determine PASS vs FAIL?” | **Suprita** | “It compares a confirmed access rule with real HTTP responses, validated identities and, for edits, observed state changes. Incomplete prerequisites are INCONCLUSIVE.” |
| “Why did 11 pass if the grocery app has vulnerabilities?” | **Arjun** | “Those 11 checked *different protected address/inventory rules*. The other suite tested vulnerable order/settings endpoints and found two violations.” |
| “Does uploading any ZIP work?” | **Maulik** | “Not yet. We support the approved Sprout & Stone integration. Unknown ZIPs are rejected rather than executed.” |
| “Why use fake users and data?” | **Snehal** | “It gives reproducible ownership tests without risking real customers, stock or credentials.” |
| “What does 403 mean? What if you get 401?” | **Arjun** | “403 is an expected authenticated cross-user denial. 401 can mean the login was invalid, so an authenticated-authorization test must not claim PASS solely from that.” |
| “Do you modify customer data to test writes?” | **Snehal + Arjun** | “Only disposable synthetic fixtures, with explicit approval and before/after state checks and reset.” |
| “Is the product a new vulnerability scanner?” | **Suprita** | “No. Our focus is turning beginner-confirmed access promises into configured, repeatable authorization verification and understandable evidence.” |
| “Can it automatically fix and deploy?” | **Suprita + Maulik** | “No production automatic repair/deployment in the current MVP; reviewed suggestions are future work.” |
| “Is encryption the solution to this?” | **Suprita** | “Encryption protects confidentiality in certain threat models, but server-side authorization must still prevent one customer accessing or modifying another's resources.” |
| “Have you tested crAPI or Juice Shop?” | **Arjun** | “They are future external benchmark integrations; our demonstrated evidence currently comes from the local synthetic grocery app.” |
| “What's actually on GitHub?” | **Arjun** | “The verifier ZIP is on main, and individual QA, fixture and earlier frontend work is on named branches. The integrated guided demo is available locally and must be separately committed if we want it available as source on main.” |

---

## 5. Status labels to use (avoid overclaiming)

### Ready to show
- [x] Grocery demo with three synthetic roles.
- [x] Browser reproduction of cross-customer private order exposure.
- [x] Verifier dashboard with evidence-backed PASS, FAIL and INCONCLUSIVE concepts.
- [x] Local screenshots showing 11 protected checks PASS and 2 planted failures caught in the five-case suite.
- [x] GitHub branch artifacts for verifier package, fixture/test definitions, earlier frontend and QA.

### Known limitations / not yet demonstrated
- [ ] Arbitrary user-uploaded ZIP deployment or endpoint discovery.
- [ ] End-to-end integration of every other third-party website, including OWASP crAPI/Juice Shop.
- [ ] Automatic secure code repair and production deployment.
- [ ] Proof that all local integrated frontend/backend source has been merged into repository \`main\`.
- [ ] Proof that feature-branch fixture adapter connects to this exact final Sprout & Stone integration without extra mapping.

## 6. Final one-line roles for an introduction slide

- **Suprita — Backend & Security Verifier:** Implements the verification engine, security contracts, execution and evidence.
- **Snehal — Grocery Demo & Fixture Integration:** Defines synthetic users/resources, test cases and target-specific adapter setup.
- **Maulik — Frontend & User Experience:** Owns the guided user workflow and understandable security findings.
- **Arjun — QA, Integration & Demo:** Verifies real cross-user behavior, tests false-PASS edge cases and demonstrates evidence.

**Presentation reminder:** Do **not** say “the entire website is secure” just because G01–G10 passed. Say “the specific address/inventory permissions passed; the independent order/settings promises failed as expected, and our verifier caught them.”
