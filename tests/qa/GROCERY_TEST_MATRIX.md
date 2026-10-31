# Grocery Shop — Proposed Expanded Security Test Matrix (G01–G12)

**Owner:** Arjun (QA & Integration)  
**Status:** Proposed test coverage, NOT live test results. Requires team approval of grocery-specific interfaces, fixture IDs, endpoints and write-safety rules.  
**Companion files:** \`fixtures/grocery-cases-proposed.mjs\`, \`lib/grocery-write-oracle.mjs\`, \`unit/grocery-cases.test.mjs\`.

## Important contract boundary

The original student portal **T1–T5** is an approved READ-only reference. Do **not** rename or change those existing IDs. \`G01\`–\`G12\` are **proposed distinct grocery tests**, not implementation of backend routes. The existing safe verifier is GET-only; controlled PATCH execution requires a new explicitly approved API contract and trusted isolated fixture setup/reset.

## Proposed actors/resources (synthetic ONLY)

- \`customer-a\` and \`customer-b\`, with separately authenticated sessions.
- \`staff-1\`, an authenticated staff user.
- \`anonymous\`, with **no** authentication.
- A's test-only address: \`address-a-101\`, owner \`customer-a\`.
- B's test-only address: \`address-b-102\`, owner \`customer-b\`.
- Inventory fixture: \`sku-apple-01\`.
- Only change a disposable delivery-note field and synthetic inventory count. Never use production stock, orders, addresses or credentials.

## Permission and fault cases

| ID | Priority | Actor/action | Expected behaviour | Required evidence |
|---|---|---|---|---|
| **G01** | P0 | Customer A GET own address | ALLOW | 200 + correct owner, resource and marker |
| **G02** | P0 | Customer B GET A's address | DENY | Verified B session + expected 403, no private marker returned |
| **G03** | P0 | Anonymous GET A's address | DENY | No auth header + 401, owner fixture verified |
| **G04** | P0 | Customer A PATCH own delivery note | ALLOW | Before/after read proves *correct authorized field* changed; reset after test |
| **G05** | P0 | Customer B PATCH A's delivery note | DENY | Valid B session + 403 + A's persisted note unchanged |
| **G06** | P1 | Anonymous PATCH A's delivery note | DENY | 401 + persisted note unchanged |
| **G07** | P0 | Staff PATCH product stock | ALLOW | Staff role validated + before/after stock changed as authorized + reset |
| **G08** | P0 | Customer A PATCH product stock | DENY | Valid customer session + 403 + stock unchanged |
| **G09** | P1 | Anonymous PATCH product stock | DENY | 401 + stock unchanged |
| **G10** | P1 | Customer A PATCH own address with forbidden \`ownerUserId\` field | REJECT | Forbidden property not applied; ownership unchanged; no unintended state changes |
| **G11** | P0 | Deliberately broken handler writes A's note but returns 403 to B | DETECT LEAK | Post-write snapshot shows unauthorized mutation => **verifier FAIL** despite response 403 |
| **G12** | P0 | B's session expires between identity check and denied request | INCONCLUSIVE | Verifier must not convert 401 into authorization PASS |

**P0:** required for first meaningful extended demo. **P1:** next if time permits. These case IDs and exact statuses are proposed; freeze with Suprita/Snehal before relying on them.

### Why these add real scope

- **G01–G03** test object-level read restrictions.
- **G04–G09** test **state-changing permissions**, including owner and staff authority.
- **G10** tests whether the app can be tricked into changing protected object properties (mass assignment / property-level authorization).
- **G11** tests an important *false PASS*: denial status returned even though unauthorized data modification occurred.
- **G12** tests another *false PASS*: a session expired instead of authorization working.

## Additional onboarding and safety matrix (O01–O07; proposed)

| ID | Priority | Scenario | Required outcome |
|---|---|---|---|
| O01 | P0 | Select registered, supported Express grocery app | Safe approved local project recognized |
| O02 | P0 | Select an unregistered project / non-loopback target | UNSUPPORTED or validation error; **zero outbound HTTP** |
| O03 | P0 | Request fixture setup without explicit user confirmation | No synthetic writes/setup performed; denied |
| O04 | P0 | Prepare fixtures twice for the same approved project | Idempotent: same identity/resource mapping, no duplicates |
| O05 | P1 | Route came from adapter manifest, not actual inspected source | Provenance says \`adapter-declared\`, never \`source-inspected\` |
| O06 | P0 | Onboard with no saved profile and create a fresh one | Newly created profile is actually passed to the real verifier |
| O07 | P0 | Report / saved run / browser data checked for tokens and keys | No secrets or raw private response bodies exposed |

## Security verdict semantics for PATCH

Verification of state-changing operations must use **independent before/after observations** and validated synthetic identities/fixtures. Status code alone is not conclusive.

1. **DENY + confirmed persisted unauthorized state change** ⇒ **FAIL**, even if HTTP returned 403.
2. **DENY + expected refusal + verified unchanged state + valid prerequisites** ⇒ **PASS** for that exact restriction.
3. **DENY + no verified state observation, invalid session, or ambiguous response** ⇒ **INCONCLUSIVE**, unless another conclusive violation was observed.
4. **ALLOW + permitted 2xx + intended state change only + valid prerequisites** ⇒ **PASS**.
5. **ALLOW + uncertain/incorrect/missing state** ⇒ **INCONCLUSIVE**, not an optimistic PASS.
6. Any write whose rollback/reset cannot be guaranteed is **NOT_RUN/BLOCKED**; never test actual customer/shop data.

Do not treat a response with 403 as proof of a safe denial unless the state is checked. A forbidden attempt that writes then responds 403 is a genuine security violation.

## Runner separation and safety

The earlier safe verifier was GET-only and did not modify app data. The new write-test module must be separate and explicitly approved. Restrict it to allowlisted local routes and \`PATCH\` methods, trusted synthetic users, a preinstalled adapter, explicit authorisation to prepare fixtures, bounded request limits, and reliable restore/reset. Fixture creation/setup is not the same operation as verification.

## What can be tested **right now**?

- \`unit/grocery-cases.test.mjs\` checks that this **proposed QA matrix** and our *independent* write-verdict oracle cover the intended cases correctly, even before the grocery app exists.
- Live G01–G12 and O01–O07 must wait until the team freezes their endpoint contracts, implements an isolated grocery backend and exposes safe fixture/setup/reset controls.
- Do not confuse **passing QA harness unit tests** with successfully detecting a vulnerability in the live grocery app.

## Mentor-ready statement

“We expanded beyond reading private records to testing **object ownership, editing permissions, staff privileges, protected properties, and actual state changes**. If an API returns ‘forbidden’ but the customer's data changes anyway, our verification must catch that as a real vulnerability. We also test false approvals caused by expired sessions and unsafe automated onboarding.”

## Mapping to established security categories

- OWASP API1:2023 — Broken Object Level Authorization
- OWASP API3:2023 — Broken Object Property Level Authorization (including mass assignment)
- OWASP API5:2023 — Broken Function Level Authorization

Reference: https://api-security.owasp.org/editions/2023/en/0x11-t10/
