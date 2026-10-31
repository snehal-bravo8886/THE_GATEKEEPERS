// Proposal only: additional grocery security checks; not a live HTTP test engine.
// MUST be frozen with Suprita and Snehal before wiring to actual API endpoints.
export const GROCERY_ACTORS = Object.freeze(["customer-a","customer-b","staff-1","anonymous"]);
export const GROCERY_CASES = Object.freeze([
  { id:"G01", priority:"P0", type:"PERMISSION", actor:"customer-a", method:"GET", resource:"address-a-101", expected:"ALLOW", requires:["identityValid","exactRecord"] },
  { id:"G02", priority:"P0", type:"PERMISSION", actor:"customer-b", method:"GET", resource:"address-a-101", expected:"DENY", requires:["identityValid","ownerBaselineValid","noPrivateDataExposed"] },
  { id:"G03", priority:"P0", type:"PERMISSION", actor:"anonymous", method:"GET", resource:"address-a-101", expected:"DENY", requires:["noAuthHeader","ownerBaselineValid","noPrivateDataExposed"] },
  { id:"G04", priority:"P0", type:"PERMISSION", actor:"customer-a", method:"PATCH", resource:"address-a-101", expected:"ALLOW", requires:["identityValid","beforeSnapshot","intendedFieldChanged","otherFieldsUnchanged","cleanup"] },
  { id:"G05", priority:"P0", type:"PERMISSION", actor:"customer-b", method:"PATCH", resource:"address-a-101", expected:"DENY", requires:["identityValid","beforeSnapshot","afterSnapshot","stateUnchanged","cleanup"] },
  { id:"G06", priority:"P1", type:"PERMISSION", actor:"anonymous", method:"PATCH", resource:"address-a-101", expected:"DENY", requires:["noAuthHeader","beforeSnapshot","afterSnapshot","stateUnchanged","cleanup"] },
  { id:"G07", priority:"P0", type:"PERMISSION", actor:"staff-1", method:"PATCH", resource:"sku-apple-01", expected:"ALLOW", requires:["staffRoleValid","beforeSnapshot","intendedFieldChanged","otherFieldsUnchanged","cleanup"] },
  { id:"G08", priority:"P0", type:"PERMISSION", actor:"customer-a", method:"PATCH", resource:"sku-apple-01", expected:"DENY", requires:["identityValid","beforeSnapshot","afterSnapshot","stateUnchanged","cleanup"] },
  { id:"G09", priority:"P1", type:"PERMISSION", actor:"anonymous", method:"PATCH", resource:"sku-apple-01", expected:"DENY", requires:["noAuthHeader","beforeSnapshot","afterSnapshot","stateUnchanged","cleanup"] },
  { id:"G10", priority:"P1", type:"PROPERTY_GUARD", actor:"customer-a", method:"PATCH", resource:"address-a-101", expected:"REJECT", requires:["identityValid","forbiddenPropertyAttempt","beforeSnapshot","afterSnapshot","ownerUnchanged","cleanup"] },
  { id:"G11", priority:"P0", type:"QA_FAULT", actor:"customer-b", method:"PATCH", resource:"address-a-101", expected:"FAIL", requires:["identityValid","beforeSnapshot","afterSnapshot","unauthorizedStateChanged","expected403"] },
  { id:"G12", priority:"P0", type:"QA_FAULT", actor:"customer-b", method:"GET", resource:"address-a-101", expected:"INCONCLUSIVE", requires:["sessionExpiresMidTest","recheckIdentity","noFalsePass"] }
]);

export const ONBOARDING_CASES = Object.freeze([
  { id:"O01", priority:"P0", intent:"approved-project-selected", expected:"READY_AFTER_VALIDATION" },
  { id:"O02", priority:"P0", intent:"unsupported-or-remote-project", expected:"REJECT_WITHOUT_NETWORK" },
  { id:"O03", priority:"P0", intent:"prepare-without-confirmation", expected:"REJECT_WITHOUT_MUTATION" },
  { id:"O04", priority:"P0", intent:"prepare-twice", expected:"IDEMPOTENT" },
  { id:"O05", priority:"P1", intent:"adapter-route-metadata-only", expected:"TRUTHFUL_PROVENANCE" },
  { id:"O06", priority:"P0", intent:"clean-onboarding-without-saved-profile", expected:"NEW_PROFILE_USED_BY_RUNNER" },
  { id:"O07", priority:"P0", intent:"evidence-and-ui-secrets", expected:"SANITIZED" }
]);
