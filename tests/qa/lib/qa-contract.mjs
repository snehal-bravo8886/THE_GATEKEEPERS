// Independent QA assertions: checks the agreed public contract, NOT a fake
// replacement for Suprita's verifier. Failures are human-readable strings.
import { CASES, TEST_IDS, RECORDS } from "../fixtures/contract-v1.mjs";

export const VERDICTS = Object.freeze(["PASS", "FAIL", "INCONCLUSIVE"]);
export const REASON_CODES = Object.freeze([
  "OWNER_CONTROL_OK", "SESSION_VALIDATION_FAILED", "OWNER_FIXTURE_MISSING",
  "EXPECTED_RECORD_MISMATCH", "DENIED_AS_EXPECTED", "PROTECTED_MARKER_EXPOSED",
  "AUTHENTICATED_DENIAL_UNVERIFIED", "ANONYMOUS_DENIAL_OK", "UNEXPECTED_STATUS",
  "AMBIGUOUS_RESPONSE", "TARGET_UNREACHABLE", "TARGET_TIMEOUT",
  "TARGET_SERVER_ERROR", "TARGET_NOT_ALLOWED", "REDIRECT_REJECTED",
  "RESPONSE_TOO_LARGE", "DEPENDENCY_INCONCLUSIVE", "NOT_RUN_DEPENDENCY_FAILED",
  "CONTRACT_INVALID", "CONTRACT_NOT_COMPARABLE"
]);

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const validDate = (value) => typeof value === "string"
  && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value)
  && !Number.isNaN(Date.parse(value));

// The QA oracle uses the contract's explicit aggregation precedence.
// It is deliberately separate from the backend under test.
export function expectedAggregate(results) {
  if (!Array.isArray(results)) return "INCONCLUSIVE";
  if (results.some((r) => r?.executionStatus === "RUN" && r.verdict === "FAIL")) return "FAIL";
  if (results.length !== TEST_IDS.length ||
      TEST_IDS.some((id) => !results.some((r) => r?.testId === id))) return "INCONCLUSIVE";
  if (results.every((r) => r.executionStatus === "RUN" && r.verdict === "PASS"
    && r.prerequisitesValid === true)) return "PASS";
  return "INCONCLUSIVE";
}

export function auditGeneratedTests(tests) {
  const errors = [];
  if (!Array.isArray(tests) || tests.length !== CASES.length) return ["Exactly five generated tests are required"];
  tests.forEach((actual, index) => {
    const expected = CASES[index];
    if (!object(actual)) { errors.push("Test " + index + " is not an object"); return; }
    for (const key of ["testId", "actorRef", "resourceRef", "expectedAccess", "isPrerequisite"]) {
      if (actual[key] !== expected[key]) errors.push(expected.testId + ": incorrect " + key);
    }
    if (actual.method !== "GET") errors.push(expected.testId + ": only GET is approved");
    if (!same(actual.allowedStatuses, expected.allowedStatuses)) errors.push(expected.testId + ": wrong accepted statuses");
    if (actual.path !== RECORDS[expected.resourceRef].path) errors.push(expected.testId + ": wrong resource path");
  });
  if (new Set(tests.map((t) => t?.testId)).size !== CASES.length) errors.push("Generated test IDs must be unique");
  return errors;
}

export function auditNoSensitiveData(payload) {
  const errors = [];
  const badKey = /^(authorization|accessToken|bearerToken|token|password|secret|rawResponse|rawBody|responseBody|credentials)$/i;
  function visit(value, location) {
    if (Array.isArray(value)) return value.forEach((item, i) => visit(item, location + "[" + i + "]"));
    if (object(value)) return Object.entries(value).forEach(([key, v]) => {
      if (badKey.test(key)) errors.push("Sensitive field: " + location + "." + key);
      visit(v, location + "." + key);
    });
    if (typeof value === "string" && /Bearer\s+[A-Za-z0-9._~-]{8,}/i.test(value)) {
      errors.push("Possible bearer credential at " + location);
    }
  }
  visit(payload, "payload");
  return errors;
}

export function auditRun(run) {
  const errors = [];
  if (!object(run)) return ["VerificationRun must be an object"];
  for (const k of ["runId", "promiseId", "contractHash"]) {
    if (typeof run[k] !== "string" || !run[k]) errors.push("Missing " + k);
  }
  if (typeof run.contractHash !== "string" || !/^sha256:[a-f0-9]{64}$/i.test(run.contractHash)) {
    errors.push("Invalid contractHash");
  }
  for (const key of ["executedAt", "finishedAt"]) {
    if (!validDate(run[key])) errors.push("Invalid " + key + " UTC timestamp");
  }
  if (validDate(run.executedAt) && validDate(run.finishedAt)
      && Date.parse(run.finishedAt) < Date.parse(run.executedAt)) errors.push("Run finished before it started");
  if (!Array.isArray(run.results)) return [...errors, "Missing results array"];
  if (run.results.length !== TEST_IDS.length ||
      !same(run.results.map((r) => r?.testId), TEST_IDS)) errors.push("Results must contain T1–T5 in frozen order");
  for (const [i, r] of run.results.entries()) {
    if (!object(r)) { errors.push("Invalid result at " + i); continue; }
    const prefix = r.testId || "result " + i;
    if (!["RUN", "NOT_RUN"].includes(r.executionStatus)) errors.push(prefix + ": invalid executionStatus");
    if (r.executionStatus === "NOT_RUN") {
      if (r.verdict !== null || r.observedStatus !== null || r.prerequisitesValid !== null) {
        errors.push(prefix + ": NOT_RUN requires null verdict/status/prerequisites");
      }
    } else if (!VERDICTS.includes(r.verdict)) errors.push(prefix + ": invalid verdict");
    if (r.executionStatus === "RUN" &&
      r.observedStatus !== null && (!Number.isInteger(r.observedStatus) || r.observedStatus < 100 || r.observedStatus > 599)) {
      errors.push(prefix + ": invalid HTTP status");
    }
    if (!["ALLOW", "DENY"].includes(r.expectedAccess)) errors.push(prefix + ": invalid expectedAccess");
    if (!REASON_CODES.includes(r.reasonCode)) errors.push(prefix + ": unknown reasonCode");
    if (!Number.isInteger(r.durationMs) || r.durationMs < 0) errors.push(prefix + ": invalid durationMs");
    if (!validDate(r.checkedAt)) errors.push(prefix + ": invalid checkedAt");
    if (!object(r.evidence)) errors.push(prefix + ": evidence missing");
    else {
      const allowedKeys = ["responseStatus", "expectedResourceId", "protectedMarkerMatch", "authenticationRechecked", "rawResponseStored", "actorRef"];
      for (const key of Object.keys(r.evidence)) {
        if (!allowedKeys.includes(key)) errors.push(prefix + ": evidence field not allowlisted: " + key);
      }
      if (r.evidence.rawResponseStored !== false) errors.push(prefix + ": rawResponseStored must be false");
    }
    if (r.verdict === "PASS" && r.prerequisitesValid !== true) errors.push(prefix + ": false PASS without valid prerequisites");
  }
  if (!VERDICTS.includes(run.aggregateVerdict)) errors.push("Invalid aggregateVerdict");
  else if (run.aggregateVerdict !== expectedAggregate(run.results)) {
    errors.push("Aggregate disagrees with required precedence");
  }
  errors.push(...auditNoSensitiveData(run));
  return errors;
}

export function comparableRuns(a, b) {
  return object(a) && object(b) &&
    typeof a.promiseId === "string" && a.promiseId === b.promiseId &&
    typeof a.contractHash === "string" && /^sha256:[a-f0-9]{64}$/i.test(a.contractHash) &&
    a.contractHash === b.contractHash &&
    Array.isArray(a.results) && Array.isArray(b.results) &&
    same(a.results.map((r) => r.testId), b.results.map((r) => r.testId));
}
