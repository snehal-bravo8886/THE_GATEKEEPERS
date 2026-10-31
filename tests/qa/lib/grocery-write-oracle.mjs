// Independent QA oracle for synthetic PATCH outcomes.
// Does not modify application state, run requests, or replace the verifier.
// Compare the real verifier's verdict to this expected decision during integration.
export function expectedWriteVerdict({
  expectedAccess,
  authenticated = true,
  actorValid = false,
  fixtureValid = false,
  beforeVerified = false,
  afterVerified = false,
  observedStatus = null,
  stateChanged = null,
  intendedChangeOnly = false
} = {}) {
  if (!["ALLOW","DENY"].includes(expectedAccess)) return "INCONCLUSIVE";
  if (!fixtureValid || !beforeVerified || !afterVerified || typeof stateChanged !== "boolean") {
    return "INCONCLUSIVE";
  }

  // A confirmed, unauthorized persistent mutation is the most important bug:
  // an apparently successful denial status cannot erase this real side effect.
  if (expectedAccess === "DENY" && stateChanged === true) {
    return "FAIL";
  }

  // When a session should be authenticated, it must be demonstrably valid.
  if (authenticated && !actorValid) return "INCONCLUSIVE";

  if (expectedAccess === "DENY") {
    const expectedDenial = authenticated ? 403 : 401;
    return observedStatus === expectedDenial && stateChanged === false
      ? "PASS" : "INCONCLUSIVE";
  }

  if (!actorValid) return "INCONCLUSIVE";
  return Number.isInteger(observedStatus) && observedStatus >= 200 &&
    observedStatus < 300 && stateChanged === true && intendedChangeOnly === true
    ? "PASS" : "INCONCLUSIVE";
}
