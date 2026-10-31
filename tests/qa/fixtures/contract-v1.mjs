// Public synthetic fixture metadata. NEVER put bearer tokens here.
// Frozen Checkpoint 0 contract v1, not a production runner implementation.
export const PROMISE_ID = "promise-exam-owner-only-001";
export const TARGET_ID = "local-student-portal-v1";
export const TEST_IDS = Object.freeze([
  "T1-owner-alice",
  "T2-owner-bob",
  "T3-bob-to-alice",
  "T4-alice-to-bob",
  "T5-anonymous-to-alice"
]);

export const CASES = Object.freeze([
  { testId: TEST_IDS[0], actorRef: "alice", resourceRef: "aliceExam", expectedAccess: "ALLOW", allowedStatuses: [200], isPrerequisite: true },
  { testId: TEST_IDS[1], actorRef: "bob", resourceRef: "bobExam", expectedAccess: "ALLOW", allowedStatuses: [200], isPrerequisite: true },
  { testId: TEST_IDS[2], actorRef: "bob", resourceRef: "aliceExam", expectedAccess: "DENY", allowedStatuses: [403], isPrerequisite: false },
  { testId: TEST_IDS[3], actorRef: "alice", resourceRef: "bobExam", expectedAccess: "DENY", allowedStatuses: [403], isPrerequisite: false },
  { testId: TEST_IDS[4], actorRef: "anonymous", resourceRef: "aliceExam", expectedAccess: "DENY", allowedStatuses: [401], isPrerequisite: false }
]);

export const RECORDS = Object.freeze({
  aliceExam: { resourceId: "exam-alice-101", ownerUserId: "alice", marker: "EXAM_ALICE_PRIVATE_MARKER_51C0", path: "/api/exams/exam-alice-101" },
  bobExam: { resourceId: "exam-bob-102", ownerUserId: "bob", marker: "EXAM_BOB_PRIVATE_MARKER_86D2", path: "/api/exams/exam-bob-102" }
});

export function promiseInput() {
  return {
    title: "Students can only view their own exams",
    originalRequirement: "Students must only be able to view their own exam results.",
    confirmedPolicy: {
      policyType: "OWNER_ONLY_READ",
      resourceType: "exam",
      method: "GET",
      authenticatedDenyStatuses: [403],
      anonymousDenyStatuses: [401]
    },
    targetProfileId: TARGET_ID
  };
}

export function makeResult(testId, verdict = "PASS", overrides = {}) {
  const spec = CASES.find((item) => item.testId === testId);
  if (!spec) throw new Error("Unknown fixture test ID: " + testId);
  return {
    testId,
    executionStatus: "RUN",
    verdict,
    prerequisitesValid: true,
    expectedAccess: spec.expectedAccess,
    observedStatus: spec.allowedStatuses[0],
    reasonCode: spec.expectedAccess === "ALLOW" ? "OWNER_CONTROL_OK"
      : testId === TEST_IDS[4] ? "ANONYMOUS_DENIAL_OK" : "DENIED_AS_EXPECTED",
    reason: "Synthetic example for QA contract tests only",
    evidence: {
      responseStatus: spec.allowedStatuses[0],
      expectedResourceId: RECORDS[spec.resourceRef].resourceId,
      protectedMarkerMatch: spec.expectedAccess === "ALLOW",
      authenticationRechecked: spec.expectedAccess === "DENY" && testId !== TEST_IDS[4],
      rawResponseStored: false
    },
    durationMs: 1,
    checkedAt: "2026-10-31T06:10:00.000Z",
    ...overrides
  };
}

export function makeRun(overrides = {}) {
  return {
    runId: "synthetic-run-001",
    promiseId: PROMISE_ID,
    revisionLabel: "v1-protected",
    contractHash: "sha256:" + "a".repeat(64),
    aggregateVerdict: "PASS",
    executedAt: "2026-10-31T06:10:00.000Z",
    finishedAt: "2026-10-31T06:10:02.000Z",
    results: TEST_IDS.map((id) => makeResult(id)),
    ...overrides
  };
}
