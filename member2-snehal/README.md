# Snehal — Member 2: test cases and trusted fixture adapter

These files were created for the CanTheySeeIt? project and reviewed against Suprita's `CanTheySeeIt_Generic_Verifier_v2.zip` (main commit fcc6d7ac).

## Contents
- `test-cases/grocery-test-cases.json`: original G01–G12 expected-behavior definitions; **not** the strict V2 SuiteSchema.
- `fixture/fixture-adapter.mjs`: trusted local synthetic fixture adapter (prepares sessions, snapshots/reset/expiry); **target-specific**, not ready to run against the friend's replacement demo.
- `suites/`: strict Generic Verifier V2 suites. G11 and G12 are intentionally separate controlled scenarios.

## Important integration notes for Suprita
- The generic engine must remain in Suprita's area; do not replace it with this adapter.
- The V2 `TargetAdapter` interface requires an adapter bridge; the demo's actual authentication, endpoints, fixtures, key file and reset hooks must be mapped and reviewed first.
- The original adapter assumes the earlier synthetic grocery fixture API; it is **not** proof of compatibility with the teammate's different demo.
- G10 uses denial status **400**; Suprita's current strict `CaseSchema` only accepts 401/403/404. Review a controlled G10 schema extension or agree a different target-denial status before importing.
- G11 is a deliberate backend-fault check; a forbidden persisted mutation must yield FAIL regardless of the HTTP status.
- G12 must yield INCONCLUSIVE on an expired authenticated session; its 403 acceptance applies only while actor identity remains valid.
- Local synthetic fixtures only. Do not commit bearer tokens, real customer records, adapter keys or credentials.
- No live integration run is claimed. The friend-provided demo and Suprita's runner still need connecting and testing.

## GitHub ownership
This directory belongs to Snehal; use a separate review branch. Suprita should import the approved definitions/adapter after confirming the target demo contract.
