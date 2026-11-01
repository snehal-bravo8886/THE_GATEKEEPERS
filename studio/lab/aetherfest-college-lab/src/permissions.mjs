/**
 * DELIBERATELY INSECURE DEMO — local, disposable training data only.
 * The vulnerable mode mimics a vibe-coded backend that checks authentication
 * but fails to enforce object ownership or the organizer role on two endpoints.
 * Never deploy vulnerable mode to a public network.
 */
export function mayViewRegistration(actor,registration,mode='vulnerable'){
  if(!actor || !registration)return false;
  if(mode==='vulnerable') return true; // BUG 1: authenticated != authorized owner
  return actor.role==='head' || actor.id===registration.ownerUserId;
}
export function mayEditFestSettings(actor,mode='vulnerable'){
  if(!actor)return false;
  if(mode==='vulnerable') return true; // BUG 2: ordinary student gets head privileges
  return actor.role==='head';
}
