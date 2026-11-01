/**
 * Finite, non-AI sector and access-rule catalog.
 * This module generates test PLANS. It neither contacts target sites nor grants
 * permission to execute a test. Supported local adapters are a separate gate.
 */
import { WorkspaceError } from './workspace.ts';
export const CORE_RULES = [
  {id:'own-view',title:'People should only see their own private information',detail:'Check that two different accounts cannot see each other’s records.',tests:[
    ['Owner can open their own record','A successful legitimate request proves the record and login work.'],
    ['Another account cannot open that record','Checks if knowing a record link bypasses its owner restriction.']]},
  {id:'own-edit',title:'People should only change their own information',detail:'Check edits and make sure rejected changes are not saved.',tests:[
    ['Owner can make an approved change','Use disposable data and confirm the expected change was saved.'],
    ['Another account cannot change that record','Compare the record before and after an unauthorized change; restore test data.']]},
  {id:'admin-change',title:'Only admins or assigned staff can change protected settings',detail:'Check permissions even if the admin page is hidden.',tests:[
    ['Authorized staff can perform the approved action','Verify the role and the intended change.'],
    ['Ordinary users cannot perform the staff action','Check both the response and that protected data stayed unchanged.']]},
  {id:'guest-private',title:'People who are not signed in cannot view private information',detail:'Check that a visitor cannot open a protected record link.',tests:[
    ['A signed-in owner can view the private record','Verify the private record exists and its owner is known.'],
    ['A signed-out visitor cannot view the private record','Send a request without login and check for unintended disclosure.']]}
] as const;

type Feature = {id:string; title:string; detail:string; checks:readonly {title:string; why:string; needs:string}[]};
type Sector = {id:string; name:string; subtitle:string; icon:string; example:string; features: readonly Feature[]};
const check=(title:string,why:string,needs:string)=>({title,why,needs});
export const SECTORS:readonly Sector[] = [
 {id:'restaurant',name:'Restaurants & dine-in ordering',subtitle:'QR menus, tables and payments',icon:'utensils',example:'Guests scan a QR code to order food at a table.',features:[
  {id:'table-orders',title:'Customers order from a table',detail:'Keep table orders separate.',checks:[
    check('A guest can see their own table order','A successful owner request is the control.','Two fictional tables and known orders'),
    check('A guest cannot view or change another table’s order','A table or order number must not grant unwanted access.','Two table sessions, safe reversible order changes')]},
  {id:'qr-links',title:'Tables use QR codes',detail:'QR links must not expose unrelated orders.',checks:[
    check('A QR code cannot be swapped to manage a different table','A guessed table ID must not bypass authorization.','Synthetic QR/table mapping and authenticated test sessions')]},
  {id:'restaurant-staff',title:'Staff update the menu and prices',detail:'Guests must not change the menu.',checks:[
    check('Staff can update a sample menu item','Check approved changes with disposable menu data.','Fake staff login and reversible menu fixture'),
    check('Guests cannot change prices or mark orders complete','A restricted interface must be protected on the server.','Fake guest/staff identities, state snapshots')]},
  {id:'restaurant-bills',title:'Customers see bills and receipts',detail:'Bills should be private.',checks:[
    check('Another table cannot read a private bill','Receipt IDs must not leak another party’s purchases.','Two synthetic bills and independent table identities')]}]},
 {id:'retail',name:'Grocery & stationery shops',subtitle:'Orders, stock and customer profiles',icon:'shopping-bag',example:'Customers order products while the shopkeeper manages stock.',features:[
  {id:'retail-orders',title:'Customers place orders',detail:'Each order belongs to one account.',checks:[
    check('Customers cannot read another customer’s order','A valid login must not expose someone else’s private purchase.','Two fictional customers, two orders and known ownership'),
    check('Customers cannot cancel or change someone else’s order','An unauthorized state change must be detected.','Isolated orders and rollback support')]},
  {id:'retail-stock',title:'Shopkeepers manage stock and prices',detail:'Only authorized staff can edit stock.',checks:[
    check('A normal shopper cannot change stock or prices','Check permissions and read back the saved values.','Fake staff/customer sessions and reversible stock fixture')]},
  {id:'retail-address',title:'Customers save delivery addresses',detail:'Addresses should be owner-only.',checks:[
    check('Customer addresses are not visible to other shoppers','Delivery information is personal data.','Two fictional addresses and independent identities'),
    check('A customer cannot take ownership of another address','Protected owner fields must not be editable.','Disposable addresses and server-side owner metadata')]},
  {id:'retail-pickup',title:'Customers collect or return items',detail:'Pickup and return details should be restricted.',checks:[
    check('Another shopper cannot claim or return an order','Changing a guessed pickup code should not reassign an order.','Synthetic pickup/return workflow and reset')]}]},
 {id:'clinic',name:'Clinics & patient management',subtitle:'Patient files, staff and appointments',icon:'heart-pulse',example:'Patients manage records while assigned clinicians provide care.',features:[
  {id:'clinic-files',title:'Patients have private files',detail:'Patients must not read each other’s documents.',checks:[
    check('A patient cannot download someone else’s file','Knowing a file ID is not proof of permission.','Two synthetic patient files and exact ownership markers')]},
  {id:'clinic-clinician',title:'Clinicians see assigned patients',detail:'Access depends on care-team assignment.',checks:[
    check('An assigned clinician can read a test patient record','Assignment must be explicitly known.','Fake clinician, assignment and patient record'),
    check('An unassigned clinician cannot view that patient','Staff role alone must not grant all-record access.','Assigned and unassigned fake clinicians')]},
  {id:'clinic-ownership',title:'Patient record ownership is protected',detail:'Patients should not reassign records.',checks:[
    check('Patients cannot change who owns a medical record','Owner IDs should be controlled by the server, not by patient input.','Fake patient records and safe reset')]},
  {id:'clinic-appointments',title:'Patients book appointments',detail:'Only the right person should see or edit a booking.',checks:[
    check('Patients cannot view or reschedule others’ appointments','Booking numbers must not bypass ownership.','Two fictional appointments and reversible reschedule')]},
  {id:'clinic-notes',title:'Clinical notes have special permissions',detail:'Patients cannot change clinician-only notes.',checks:[
    check('A patient cannot modify clinician-only fields','Personal profile editing must not rewrite clinical notes.','Synthetic clinician note and safe record reset')]}]},
 {id:'campus',name:'Student & institution events',subtitle:'Registrations, tickets and organizers',icon:'graduation-cap',example:'Students register for campus events and organizers manage attendance.',features:[
  {id:'campus-signups',title:'Students register for events',detail:'Registration details should remain private.',checks:[
    check('A student cannot see or edit another registration','A known registration ID must not allow cross-student access.','Two test students and two registrations')]},
  {id:'campus-tickets',title:'Events issue tickets or QR passes',detail:'Tickets should belong to the correct student.',checks:[
    check('A ticket belonging to another student cannot be used or viewed','Guessing a QR token should not permit entry.','Synthetic passes and a safe validation endpoint')]},
  {id:'campus-organizers',title:'Organizers create and manage events',detail:'Students should not change organizer settings.',checks:[
    check('Ordinary attendees cannot edit event details','An event management page is not sufficient access control.','Fake event organizer and attendee identities, reversible event settings')]},
  {id:'campus-attendance',title:'Volunteers check people in',detail:'Only assigned volunteers should check in students.',checks:[
    check('Only approved volunteers can mark attendance','A registered attendee must not claim staff actions.','Fake volunteer role and disposable check-in records')]},
  {id:'campus-export',title:'Organizers export attendee lists',detail:'Attendee information should not leak.',checks:[
    check('Students cannot export other attendees’ details','Bulk exports must use the same access restrictions as single records.','Synthetic attendee list and authorized export route')]}]}
] as const;
const coreIds=new Set(CORE_RULES.map(x=>x.id));
export function sectorCatalogForClient(){return {sectors:SECTORS,coreRules:CORE_RULES.map(({id,title,detail})=>({id,title,detail}))};}
export function buildSectorSuggestions(sectorId:string, featureIds:string[], coreRuleIds:string[]){
 const sector=SECTORS.find(s=>s.id===sectorId);
 if(!sector)throw new WorkspaceError('INVALID_SECTOR','Choose a supported website category.');
 if(!Array.isArray(featureIds)||featureIds.length>sector.features.length||new Set(featureIds).size!==featureIds.length||featureIds.some(id=>!sector.features.some(f=>f.id===id)))
  throw new WorkspaceError('INVALID_FEATURES','Choose only the options shown for this category.');
 if(!Array.isArray(coreRuleIds)||coreRuleIds.length>CORE_RULES.length||new Set(coreRuleIds).size!==coreRuleIds.length||coreRuleIds.some(id=>!coreIds.has(id)))
  throw new WorkspaceError('INVALID_RULES','Choose only the supported general privacy rules.');
 if(!featureIds.length&&!coreRuleIds.length)throw new WorkspaceError('MISSING_RULES','Choose at least one thing to check.');
 const chosenCore=CORE_RULES.filter(x=>coreRuleIds.includes(x.id));
 const generalCases=chosenCore.flatMap(rule=>rule.tests.map(([title,why],i)=>({id:`BASE-${rule.id}-${i+1}`,priority:'P0',title,why,requires:'Approved fictional accounts, known records, and trustworthy evidence'})));
 // Expired-session validation is a prerequisite; its absence may render a test inconclusive.
 if(coreRuleIds.length)generalCases.push({id:'BASE-session-preflight',priority:'P0',title:'Check that test accounts are actually signed in',why:'Expired sessions must not make a broken permission look safe.',requires:'Synthetic account readiness and session validation'});
 const extras=sector.features.filter(f=>featureIds.includes(f.id)).flatMap(f=>f.checks.map((c,i)=>({id:`${f.id}-${i+1}`,title:c.title,why:c.why,requires:c.needs,execution:'NEEDS_MAPPING' as const,featureId:f.id})));
 return {sector,features:sector.features.filter(f=>featureIds.includes(f.id)).map(({id,title})=>({id,title})),generalCases,extraCases:extras,selectedCoreRuleIds:[...coreRuleIds],selectedFeatureIds:[...featureIds]};
}
