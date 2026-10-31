# QA Runbook — Arjun

## 1. Pre-flight
1. Record repository commit IDs for web/API/demo, Node version and contract version.
2. Confirm all services are on approved loopback addresses (API: 4100, demo: 4000; web: 5173), or update ONE team-approved contract if changed.
3. Ensure disposable synthetic Alice/Bob sessions and exact markers are installed; never store credentials in Git.
4. Run \`cd tests/qa && npm.cmd test\` to validate QA fixtures and oracle.
5. Start the actual backend and demo app using the commands **verified by their owners**.

## 2. Protected baseline
- Use the real protected app revision.
- Health check: \`GET http://127.0.0.1:4100/api/health\` returns contractVersion 1.0.0.
- Create a promise through the public API, inspect T1–T5 ordering and exact roles.
- Run it with revisionLabel \`v1-protected\`.
- Confirm owner positive controls and cross-owner and anonymous denials.
- Inspect stored evidence; no real secret/session material.
- Record real run ID, contractHash and observed aggregate PASS.

## 3. Negative conditions (each must be independently reproducible)
- Expired peer before /api/me: INCONCLUSIVE.
- Peer session expires after /api/me but before a denied resource GET: INCONCLUSIVE.
- Owner record missing/malformed marker: INCONCLUSIVE.
- Server unavailable/timeouts/5xx: INCONCLUSIVE.
- Unexpected 200 without exact verified private fixture: INCONCLUSIVE.
- Authenticated peer 401 or unconfigured 404: INCONCLUSIVE.
- Wrong target host/path: API validation error with **zero** outbound target requests.
- Any confirmed leak of exact owner ID + exam ID + marker: FAIL, not an uncertain guess.
- Verify all partial outcomes retained; NOT_RUN must have verdict null.
- Revalidate actor credentials after denial as required by contract.

**Caution:** The default protected-portal suite must not be run in the deliberately regressed revision. Fault injection requires owner-approved synthetic fixtures and isolated state.

## 4. Version regression demonstration
- Run unchanged saved promise on protected backend, record PASS.
- Snehal introduces an actual missing ownership check; record Git commit/diff.
- Run *same* promise with a new label, record FAIL with exact marker evidence.
- Restore the ownership check in another code revision; rerun, record PASS.
- Confirm contractHash remains identical across runs and the revision label does not influence verdict.
- Check a changed rule/target fixture is marked NOT COMPARABLE, not a regression.

## 5. Frontend sanity check
- Display original requirement and explicitly confirmed rule.
- Preview exactly five generated cases.
- The UI must use API verdicts; it cannot inject its own result.
- INCONCLUSIVE visible and distinguishable from PASS.
- A never-run promise reads NOT YET RUN; NOT_RUN is coverage, not a fourth security verdict.
- Confirm history persists after restart, is chronological and redacted.

## 6. Evidence record

| Git commit / date | Scenario | API run ID | Expected | Observed | PASS/FAIL/BLOCKED |
|---|---|---|---|---|---|
| Pending | Protected baseline | — | PASS | Not run | BLOCKED |
| Pending | Regressed app | — | FAIL | Not run | BLOCKED |
| Pending | Restored app | — | PASS | Not run | BLOCKED |
| Pending | Mid-test session expiry | — | INCONCLUSIVE | Not run | BLOCKED |

## 7. Bug report template

\`\`\`markdown
# QA-NNN — Title
- Severity:
- Commit:
- Contract hash:
- Preconditions:
- Synthetic fixture:
- Steps to reproduce:
- Expected verdict:
- Actual verdict:
- Sanitised response statuses and reasons:
- Backend owner:
- Fix commit:
- Retest outcome:
\`\`\`

Do not claim that a bug has been fixed until the regression test turns green and the full suite still passes.

## 8. Clean laptop demonstration
Fresh clone → checkout main → install based on team's verified scripts → start API/demo/web → create promise → execute → real regression → retest → repair → retest → invalid-session demonstration. Capture sanitized screenshots and the actual console test summary for backup.
