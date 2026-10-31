import test from "node:test";
import assert from "node:assert/strict";
import { TEST_IDS, makeResult, makeRun } from "../fixtures/contract-v1.mjs";
import { auditRun, expectedAggregate } from "../lib/qa-contract.mjs";

const invalidCases = [
  ["SESSION_VALIDATION_FAILED", 401],
  ["OWNER_FIXTURE_MISSING", 404],
  ["EXPECTED_RECORD_MISMATCH", 200],
  ["AUTHENTICATED_DENIAL_UNVERIFIED", 401],
  ["TARGET_UNREACHABLE", null],
  ["TARGET_TIMEOUT", null],
  ["TARGET_SERVER_ERROR", 500],
  ["UNEXPECTED_STATUS", 404],
  ["AMBIGUOUS_RESPONSE", 200],
  ["REDIRECT_REJECTED", 302],
  ["RESPONSE_TOO_LARGE", null],
];

for (const [reasonCode, observedStatus] of invalidCases) {
  test("unresolved " + reasonCode + " must not aggregate to PASS", () => {
    const results = TEST_IDS.map(id => makeResult(id));
    results[2] = makeResult(TEST_IDS[2], "INCONCLUSIVE", {
      observedStatus, reasonCode, prerequisitesValid: reasonCode === "AMBIGUOUS_RESPONSE"
    });
    const run = makeRun({results, aggregateVerdict:"INCONCLUSIVE"});
    assert.equal(expectedAggregate(run.results), "INCONCLUSIVE");
    assert.deepEqual(auditRun(run), []);
  });
}

test("known data exposure outranks an unresolved second test", () => {
  const results=TEST_IDS.map(id=>makeResult(id));
  results[2]=makeResult(TEST_IDS[2],"FAIL",{
    observedStatus:200, reasonCode:"PROTECTED_MARKER_EXPOSED",
    evidence:{responseStatus:200,expectedResourceId:"exam-alice-101",
      protectedMarkerMatch:true,authenticationRechecked:true,rawResponseStored:false}
  });
  results[3]=makeResult(TEST_IDS[3],"INCONCLUSIVE",{observedStatus:null,reasonCode:"TARGET_TIMEOUT"});
  const run=makeRun({results,aggregateVerdict:"FAIL"});
  assert.equal(expectedAggregate(run.results),"FAIL");
  assert.deepEqual(auditRun(run),[]);
});
