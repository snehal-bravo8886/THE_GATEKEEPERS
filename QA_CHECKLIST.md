# CanTheySeeIt? — QA Acceptance Checklist

**Owner:** Arjun Sharma (QA & Integration)  
**Branch:** `test/qa`  
**Source of truth:** Team-approved Checkpoint 0 Compatibility Contract, version 1.0.0  
**Status:** Test plan prepared; implementation and execution not yet verified.

> A test case marked FAIL below means the **security promise fails** for that scenario, not that the automated QA assertion should fail.

## Checkpoint 0 — Confirm before testing

- [ ] All members agree on the repository baseline and contract version.
- [ ] Shared TypeScript/runtime contract exists.
- [ ] Demo endpoint and synthetic fixture IDs are frozen.
- [ ] Runner exposes the agreed API.
- [ ] The test suite uses only synthetic records and approved loopback targets.

## Mandatory T1–T5 permission checks

| Test ID | Actor | Target | Expected HTTP / evidence | Security verdict when correctly implemented |
|---|---|---|---|---|
| `T1-owner-alice` | Alice | exam-alice-101 | 200 + exact exam ID, owner ID and Alice marker | PASS (baseline) |
| `T2-owner-bob` | Bob | exam-bob-102 | 200 + exact exam ID, owner ID and Bob marker | PASS (baseline) |
| `T3-bob-to-alice` | Bob | exam-alice-101 | 403 with valid Bob session rechecked | PASS (denial) |
| `T4-alice-to-bob` | Alice | exam-bob-102 | 403 with valid Alice session rechecked | PASS (denial) |
| `T5-anonymous-to-alice` | Anonymous | exam-alice-101 | 401 with no authorization header | PASS (denial) |

A confirmed leak of the *exact protected synthetic record/marker* under an unauthorized identity must produce **FAIL**.

## Required negative scenarios

- [ ] Peer authentication invalid before execution → INCONCLUSIVE, not PASS.
- [ ] Peer session expires between validation and access → INCONCLUSIVE, not PASS.
- [ ] Owner's expected record or marker is missing → INCONCLUSIVE.
- [ ] Target server unavailable / timeout / 5xx → INCONCLUSIVE.
- [ ] Unexpected 200 without exact protected-record match → INCONCLUSIVE.
- [ ] Unexpected authenticated 401 / unapproved 404 → INCONCLUSIVE.
- [ ] Unsafe target or disallowed path → API rejection before any target request.
- [ ] Missing/incorrect required contract fields → validation error.
- [ ] Unrun required checks → executionStatus NOT_RUN; verdict null.

## Aggregate rules to verify

- [ ] One confirmed FAIL among required checks → aggregate FAIL even if another check is unresolved.
- [ ] No FAIL but any INCONCLUSIVE or NOT_RUN → aggregate INCONCLUSIVE.
- [ ] All five required checks PASS with valid prerequisites → aggregate PASS.
- [ ] No completed run → latestVerdict null (NOT YET RUN).

## Regression and integration

- [ ] Same contractHash + actual protected application → PASS.
- [ ] Same contractHash + real authorization regression → FAIL.
- [ ] Same contractHash + restored ownership check → PASS.
- [ ] Changing only revisionLabel does not alter observed verdict.
- [ ] Different contractHash yields NOT COMPARABLE, not a security-regression claim.
- [ ] Saved history and evidence contain no synthetic session credentials or raw HTTP bodies.
- [ ] Frontend displays exactly the API's returned verdict and reason.
- [ ] Fresh clone, install, start and test are documented and reproducible.

## Test execution log

| Date / commit | Command or scenario | Observed result | Status | Notes |
|---|---|---|---|---|
| Pending | Backend and demo not yet integrated | Not executed | NOT RUN | Do not claim tests have passed |

## Bug report format

- **Bug ID:**
- **Title:**
- **Source commit:**
- **Preconditions and synthetic fixture:**
- **Steps to reproduce:**
- **Expected result:**
- **Actual result:**
- **Sanitized evidence:**
- **Owner / status:**
- **Verified fix commit:**

## Testing principle

A denial is only a security **PASS** when valid identity, fixture and request prerequisites have been demonstrated. A test that cannot establish those prerequisites must not incorrectly report the application as secure.
