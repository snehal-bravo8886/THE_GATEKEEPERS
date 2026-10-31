import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type ChangeEvent } from 'react';
import JSZip from 'jszip';
import { ShieldCheck, Building2, GraduationCap, UserRound, BriefcaseBusiness, Users, LayoutDashboard, SlidersHorizontal, Plus, Trash2, Check, AlertTriangle, Activity, Search, ArrowRight, RotateCcw, X, LockKeyhole, Clock3, Globe, ExternalLink, Code2, FolderOpen, FileCode2 } from 'lucide-react';

type Model = 'business' | 'organisation';
type Role = 'customer' | 'employee' | 'owner' | 'student' | 'teacher';
type Level = 'Low' | 'Medium' | 'High' | 'Critical';
type Permission = { id:string; title:string; description:string; group:string; risk:Level; enabled:boolean; custom?:boolean };
type EventItem = { id:string; time:string; title:string; detail:string; tone:'safe'|'warning'|'danger'|'neutral'; sample?:boolean };
type SourceFile = { path:string; size:number; content:string };
type SiteProfile = { id:string; name:string; url:string; kind?:'website'|'source'; sourceFiles?:{path:string;size:number}[]; scenario?:ScenarioId|null; lists:Record<Role,Permission[]>; events:EventItem[]; model:Model|null; role:Role|null };
type ScenarioId = 'medical-clinic'|'restaurant'|'small-business'|'college-event'|'marks-grades'|'attendance'|'library'|'exam-management'|'student-records';
type ScenarioCase = { title:string; outcome:'ALLOW'|'DENY'; note:string };
type ScenarioDefinition = { id:ScenarioId; model:Model; title:string; emoji:string; description:string; roles:Partial<Record<Role,string>>; cases:ScenarioCase[] };

const roleData:Record<Model,{id:Role;name:string;desc:string;icon:any}[]> = {
 business:[
  {id:'customer',name:'Customer',desc:'People who buy or use your services.',icon:UserRound},
  {id:'employee',name:'Employee',desc:'Team members who help run the business.',icon:BriefcaseBusiness},
  {id:'owner',name:'Owner',desc:'The person responsible for the business.',icon:ShieldCheck}
 ],
 organisation:[
  {id:'student',name:'Student',desc:'Learners using school or college services.',icon:GraduationCap},
  {id:'teacher',name:'Teacher',desc:'Teachers and academic staff.',icon:Users}
 ]
};
const p=(id:string,title:string,description:string,group:string,risk:Level,enabled:boolean):Permission=>({id,title,description,group,risk,enabled});
const templates:Record<Role,Permission[]> = {
 customer:[
  p('c1','View own profile','See your name, contact details and account information.','Personal information','Low',true),
  p('c2','Change own profile','Update your own contact details and preferences.','Personal information','Low',true),
  p('c3','View other customers’ profiles','See personal information belonging to other customers.','Other people’s information','High',false),
  p('c4','Change other customers’ profiles','Edit another customer’s personal information.','Other people’s information','Critical',false),
  p('c5','View own orders','See purchases and delivery information linked to your account.','Orders and payments','Low',true),
  p('c6','View other customers’ orders','Access another customer’s purchases or delivery details.','Orders and payments','Critical',false),
  p('c7','Approve refunds','Approve or issue refunds to customer accounts.','Orders and payments','High',false)
 ],
 employee:[
  p('e1','View own profile','See your own employment and contact details.','Personal information','Low',true),
  p('e2','Change own profile','Update permitted personal details.','Personal information','Low',true),
  p('e3','View customer profiles','See customer details needed to do your job.','Customer information','Medium',true),
  p('e4','Change customer profiles','Edit customer information on their behalf.','Customer information','High',false),
  p('e5','View and manage orders','Check order status and resolve fulfilment issues.','Operations','Medium',true),
  p('e6','Issue refunds','Send money back without owner approval.','Finance','High',false),
  p('e7','Change business settings','Change business-wide settings and security options.','Administration','Critical',false)
 ],
 owner:[
  p('o1','View own profile','See your own owner account details.','Personal information','Low',true),
  p('o2','Change own profile','Update your owner account information.','Personal information','Low',true),
  p('o3','View customer profiles','Access customer information for business needs.','Customer information','Medium',true),
  p('o4','Change customer profiles','Correct customer account details.','Customer information','High',true),
  p('o5','View employee records','Review staff details and employment records.','Staff information','Medium',true),
  p('o6','Change employee records','Edit staff roles or employment information.','Staff information','High',true),
  p('o7','View business finances','See revenue, costs and financial reports.','Finance','High',true),
  p('o8','Manage all permissions','Grant or remove access for every role.','Administration','Critical',true)
 ],
 student:[
  p('s1','View own information','See your profile, attendance and academic information.','My information','Low',true),
  p('s2','Change own information','Update permitted profile details.','My information','Low',true),
  p('s3','View other students’ information','See another student’s personal or academic records.','Other students’ information','High',false),
  p('s4','Change other students’ information','Edit another student’s profile, marks or attendance.','Other students’ information','Critical',false),
  p('s5','View own marks and results','See your own grades and exam results.','Academic records','Low',true),
  p('s6','View other students’ marks','Access grades belonging to classmates.','Academic records','Critical',false),
  p('s7','Change own attendance','Edit your own attendance records.','Academic records','High',false),
  p('s8','View course materials','Access learning material shared with your class.','Learning','Low',true)
 ],
 teacher:[
  p('t1','View own profile','See your own staff profile and details.','Personal information','Low',true),
  p('t2','Change own profile','Update permitted contact and profile details.','Personal information','Low',true),
  p('t3','View assigned students’ information','See records for students in your classes.','Student information','Medium',true),
  p('t4','Change assigned students’ information','Edit permitted details for students you teach.','Student information','High',false),
  p('t5','View student marks','See grades for students you teach.','Academic records','Medium',true),
  p('t6','Add or change student marks','Enter and update grades for your students.','Academic records','High',true),
  p('t7','Update class attendance','Record attendance for assigned classes.','Academic records','Medium',true),
  p('t8','View every student’s full record','Access records outside your assigned classes.','Administration','Critical',false),
  p('t9','Manage all accounts','Create, disable or change accounts.','Administration','Critical',false)
 ]
};

const scenarios:ScenarioDefinition[] = [
 {id:'medical-clinic',model:'business',title:'Medical clinic',emoji:'🩺',description:'Protect patient records, appointments, prescriptions and clinic administration.',roles:{customer:'Patient',employee:'Receptionist / Staff',owner:'Clinic Admin / Doctor'},cases:[
  {title:'Patient views their own appointment',outcome:'ALLOW',note:'Patients can see their own bookings.'},
  {title:'Patient opens another patient’s medical file',outcome:'DENY',note:'Private health records must stay separated.'},
  {title:'Receptionist changes a prescription',outcome:'DENY',note:'Clinical actions need an authorised clinician.'},
  {title:'Clinic admin updates a patient record',outcome:'ALLOW',note:'Authorised clinic administrators can manage records.'}
 ]},
 {id:'restaurant',model:'business',title:'Restaurant',emoji:'🍽️',description:'Control menu updates, customer orders, refunds and payment settings.',roles:{customer:'Diner / Customer',employee:'Restaurant Staff',owner:'Restaurant Owner'},cases:[
  {title:'Customer checks their own order',outcome:'ALLOW',note:'Customers can track their own purchases.'},
  {title:'Customer reads another diner’s order',outcome:'DENY',note:'Orders and contact details are private.'},
  {title:'Staff member changes payout bank details',outcome:'DENY',note:'Only the owner should manage payout settings.'},
  {title:'Owner issues an approved refund',outcome:'ALLOW',note:'Owners can resolve payment issues.'}
 ]},
 {id:'small-business',model:'business',title:'Small business',emoji:'🏪',description:'Manage customer profiles, inventory, invoices, staff and business settings.',roles:{customer:'Customer',employee:'Employee',owner:'Business Owner'},cases:[
  {title:'Customer views their own invoice',outcome:'ALLOW',note:'Customers can access their own billing records.'},
  {title:'Customer edits stock quantities',outcome:'DENY',note:'Inventory is an internal business resource.'},
  {title:'Employee updates product stock',outcome:'ALLOW',note:'Operational staff can manage inventory.'},
  {title:'Employee views owner payroll records',outcome:'DENY',note:'Sensitive finance data is restricted.'}
 ]},
 {id:'college-event',model:'business',title:'College event',emoji:'🎟️',description:'Manage attendee tickets, check-in, event details, volunteers and refunds.',roles:{customer:'Attendee',employee:'Event Staff / Volunteer',owner:'Event Organiser'},cases:[
  {title:'Attendee opens their own ticket QR',outcome:'ALLOW',note:'Attendees need their own entry pass.'},
  {title:'Attendee downloads the full attendee list',outcome:'DENY',note:'Other attendees’ details are private.'},
  {title:'Volunteer checks in an attendee',outcome:'ALLOW',note:'Door staff can validate and check in tickets.'},
  {title:'Volunteer changes event payout settings',outcome:'DENY',note:'Financial settings belong to the organiser.'}
 ]},
 {id:'marks-grades',model:'organisation',title:'Marks & grades',emoji:'📝',description:'Protect exam results, class gradebooks, re-evaluation requests and teacher access.',roles:{student:'Student',teacher:'Teacher / Faculty'},cases:[
  {title:'Student views their own marks',outcome:'ALLOW',note:'Students can see their published results.'},
  {title:'Student views a classmate’s marks',outcome:'DENY',note:'Grades are private to each student.'},
  {title:'Student edits their own marks',outcome:'DENY',note:'Only authorised academic staff can change grades.'},
  {title:'Teacher updates marks for an assigned class',outcome:'ALLOW',note:'Teachers can manage their assigned gradebook.'}
 ]},
 {id:'attendance',model:'organisation',title:'Attendance management',emoji:'📅',description:'Set boundaries for student attendance, class registers and correction requests.',roles:{student:'Student',teacher:'Teacher / Class Staff'},cases:[
  {title:'Student views their own attendance',outcome:'ALLOW',note:'Students can check their attendance record.'},
  {title:'Student marks themselves present',outcome:'DENY',note:'Students cannot certify their own attendance.'},
  {title:'Student views another student’s attendance',outcome:'DENY',note:'Attendance information is personal.'},
  {title:'Teacher updates attendance for an assigned class',outcome:'ALLOW',note:'Teachers can manage their own class register.'}
 ]},
 {id:'library',model:'organisation',title:'Library management',emoji:'📚',description:'Manage book catalogue, loans, renewals, member records and library staff actions.',roles:{student:'Student / Member',teacher:'Librarian'},cases:[
  {title:'Student views their own borrowed books',outcome:'ALLOW',note:'Members can see their own loans.'},
  {title:'Student views another member’s loan history',outcome:'DENY',note:'Borrowing history is private.'},
  {title:'Student edits the library catalogue',outcome:'DENY',note:'Only library staff can manage books.'},
  {title:'Librarian issues and returns books',outcome:'ALLOW',note:'Librarians manage circulation.'}
 ]},
 {id:'exam-management',model:'organisation',title:'Exam management',emoji:'📋',description:'Cover exam schedules, admit cards, answer scripts, marks entry and result publishing.',roles:{student:'Student',teacher:'Exam Staff / Faculty'},cases:[
  {title:'Student downloads their own admit card',outcome:'ALLOW',note:'Students can access their own exam documents.'},
  {title:'Student changes their final result',outcome:'DENY',note:'Students must not edit official grades.'},
  {title:'Exam staff uploads marks for an assigned subject',outcome:'ALLOW',note:'Authorised exam staff can submit marks.'},
  {title:'Teacher opens an unrelated class answer script',outcome:'DENY',note:'Access is restricted to assigned subjects.'}
 ]},
 {id:'student-records',model:'organisation',title:'Student records',emoji:'🪪',description:'Secure personal details, enrolment documents, identity information and academic records.',roles:{student:'Student',teacher:'Faculty / Office Staff'},cases:[
  {title:'Student views their own profile',outcome:'ALLOW',note:'Students can review their own details.'},
  {title:'Student downloads another student’s ID document',outcome:'DENY',note:'Identity documents must remain private.'},
  {title:'Student changes their enrolment status',outcome:'DENY',note:'Official enrolment changes need staff approval.'},
  {title:'Staff views records for assigned students',outcome:'ALLOW',note:'Staff access is limited to their responsibility.'}
 ]}
];

const scenarioPresets:Record<ScenarioId,Partial<Record<Role,Permission[]>>> = {
 'medical-clinic':{
  customer:[
   p('mc-p1','View own patient profile','See your own contact details and patient ID.','Patient profile','Low',true),
   p('mc-p2','View own appointments','See upcoming and previous appointments linked to you.','Appointments','Low',true),
   p('mc-p3','View own prescriptions','See prescriptions issued to your account.','Medical records','Medium',true),
   p('mc-p4','View another patient’s medical file','Open another person’s diagnosis, notes or reports.','Medical records','Critical',false),
   p('mc-p5','Edit clinical notes or diagnosis','Change official medical information.','Medical records','Critical',false)
  ],
  employee:[
   p('mc-e1','View patient contact details','See the minimum details needed for reception and scheduling.','Patient information','Medium',true),
   p('mc-e2','Book or reschedule appointments','Manage appointment slots for patients.','Appointments','Medium',true),
   p('mc-e3','View private diagnosis and prescriptions','Open detailed clinical notes and treatment information.','Medical records','High',false),
   p('mc-e4','Issue or change prescriptions','Create or modify medication orders.','Clinical actions','Critical',false),
   p('mc-e5','Change clinic access settings','Grant roles or change security settings.','Administration','Critical',false)
  ],
  owner:[
   p('mc-o1','View patient medical records','Access records needed for authorised clinical or clinic administration work.','Medical records','High',true),
   p('mc-o2','Update clinical notes','Edit records with an authorised clinical role.','Clinical actions','Critical',true),
   p('mc-o3','Issue prescriptions','Create or update a prescription for a patient.','Clinical actions','Critical',true),
   p('mc-o4','Manage staff accounts and access','Grant or remove clinic staff permissions.','Administration','Critical',true),
   p('mc-o5','View clinic billing reports','Review clinic-level financial summaries.','Finance','High',true)
  ]
 },
 'restaurant':{
  customer:[
   p('rs-c1','Browse menu and prices','View items available for ordering.','Menu','Low',true),
   p('rs-c2','Place an order','Create an order for your own account.','Orders','Low',true),
   p('rs-c3','View or cancel own order','Track or cancel an eligible order linked to you.','Orders','Low',true),
   p('rs-c4','View another customer’s order','Access another diner’s items, address or contact details.','Customer data','High',false),
   p('rs-c5','Change menu prices','Edit restaurant-wide menu and pricing.','Administration','Critical',false)
  ],
  employee:[
   p('rs-e1','View kitchen order queue','See orders required to prepare and fulfil.','Operations','Medium',true),
   p('rs-e2','Update order status','Mark an order as preparing, ready or completed.','Operations','Medium',true),
   p('rs-e3','View limited customer contact details','See delivery or pickup information needed to fulfil an order.','Customer data','Medium',true),
   p('rs-e4','Issue refunds without approval','Return customer payments without owner authorisation.','Finance','High',false),
   p('rs-e5','Change payout bank details','Modify the account receiving restaurant funds.','Finance','Critical',false)
  ],
  owner:[
   p('rs-o1','Manage menu and prices','Add items, update descriptions and change prices.','Menu','High',true),
   p('rs-o2','View all restaurant orders','Review orders for operations and customer support.','Orders','Medium',true),
   p('rs-o3','Issue customer refunds','Approve or issue refunds under restaurant policy.','Finance','High',true),
   p('rs-o4','Change payout settings','Manage the restaurant’s payment destination.','Finance','Critical',true),
   p('rs-o5','Manage staff access','Grant or remove employee permissions.','Administration','Critical',true)
  ]
 },
 'small-business':{
  customer:[
   p('sb-c1','View own profile and invoices','See your own account details and bills.','Customer account','Low',true),
   p('sb-c2','Update own contact details','Change your phone number or delivery address.','Customer account','Low',true),
   p('sb-c3','View another customer’s invoices','Open someone else’s billing information.','Customer data','High',false),
   p('sb-c4','Change product inventory','Edit stock quantities or product listings.','Inventory','Critical',false),
   p('sb-c5','View own purchase history','See orders associated with your account.','Orders','Low',true)
  ],
  employee:[
   p('sb-e1','View customer details needed for orders','Access limited information needed to serve a customer.','Customer data','Medium',true),
   p('sb-e2','Update product stock','Record stock received or sold.','Inventory','Medium',true),
   p('sb-e3','Create and update customer orders','Process orders and update fulfilment status.','Orders','Medium',true),
   p('sb-e4','View payroll and owner bank details','Access sensitive salary or banking information.','Finance','Critical',false),
   p('sb-e5','Change owner security settings','Change administrator credentials or role access.','Administration','Critical',false)
  ],
  owner:[
   p('sb-o1','Manage inventory and product catalogue','Add products and control stock levels.','Inventory','High',true),
   p('sb-o2','View business sales and invoices','Review business-wide sales and billing.','Finance','High',true),
   p('sb-o3','Manage employee accounts','Create, disable or change staff accounts.','Administration','Critical',true),
   p('sb-o4','Change business payment settings','Control payout and payment configuration.','Finance','Critical',true),
   p('sb-o5','View and update customer orders','Resolve order issues and manage records.','Orders','Medium',true)
  ]
 },
 'college-event':{
  customer:[
   p('ce-c1','View own event ticket and QR','Open the entry pass assigned to your registration.','Tickets','Low',true),
   p('ce-c2','View event schedule and venue','See published event information.','Event information','Low',true),
   p('ce-c3','Update own attendee profile','Change your own contact details.','Attendee profile','Low',true),
   p('ce-c4','Download the full attendee list','Access names and contact details of all attendees.','Attendee data','Critical',false),
   p('ce-c5','Change another attendee’s ticket','Edit someone else’s booking or entry status.','Tickets','High',false)
  ],
  employee:[
   p('ce-e1','Scan and validate tickets','Check whether a ticket is valid at the entry gate.','Check-in','Medium',true),
   p('ce-e2','Check in registered attendees','Update entry status for event guests.','Check-in','Medium',true),
   p('ce-e3','View limited attendee details','See details needed to help an attendee at the venue.','Attendee data','Medium',true),
   p('ce-e4','Export all attendee contact details','Download the complete registration directory.','Attendee data','High',false),
   p('ce-e5','Change event payout settings','Modify payment destinations or financial settings.','Finance','Critical',false)
  ],
  owner:[
   p('ce-o1','Manage event details and schedule','Update the event page, venue and timings.','Event management','High',true),
   p('ce-o2','View attendee registrations','Review the attendee list for event operations.','Attendee data','High',true),
   p('ce-o3','Manage volunteers and staff access','Assign roles to event staff.','Administration','Critical',true),
   p('ce-o4','Approve ticket refunds','Authorise refunds under the event policy.','Finance','High',true),
   p('ce-o5','Manage event payment settings','Control ticket revenue and payout configuration.','Finance','Critical',true)
  ]
 },
 'marks-grades':{
  student:[
   p('mg-s1','View own marks and grades','See your published marks and grades.','Academic results','Low',true),
   p('mg-s2','Download own marks card','Download a result document belonging to you.','Academic results','Low',true),
   p('mg-s3','Request re-evaluation','Submit a request to review your own result.','Academic requests','Low',true),
   p('mg-s4','View another student’s marks','Open a classmate’s private results.','Academic results','Critical',false),
   p('mg-s5','Edit your own marks','Change official marks or grades.','Academic results','Critical',false)
  ],
  teacher:[
   p('mg-t1','View marks for assigned students','Access the gradebook for classes you teach.','Gradebook','Medium',true),
   p('mg-t2','Enter or update assigned marks','Record grades for students in your assigned classes.','Gradebook','High',true),
   p('mg-t3','Export assigned class gradebook','Download results for an assigned class.','Gradebook','High',true),
   p('mg-t4','Change marks in an unrelated class','Edit grades for students outside your assignment.','Gradebook','Critical',false),
   p('mg-t5','Change student account roles','Grant administrative access to student accounts.','Administration','Critical',false)
  ]
 },
 'attendance':{
  student:[
   p('at-s1','View own attendance summary','See your attendance percentage and class history.','Attendance','Low',true),
   p('at-s2','Request an attendance correction','Ask a teacher to review a disputed entry.','Attendance requests','Low',true),
   p('at-s3','Mark yourself present','Directly change your own official attendance.','Attendance','High',false),
   p('at-s4','View another student’s attendance','Open another student’s attendance record.','Attendance','High',false),
   p('at-s5','Edit a teacher’s class register','Change the official attendance register.','Attendance','Critical',false)
  ],
  teacher:[
   p('at-t1','View attendance for assigned classes','Open registers for the classes you teach.','Class register','Medium',true),
   p('at-t2','Mark assigned students present or absent','Record attendance for your own classes.','Class register','Medium',true),
   p('at-t3','Correct an attendance entry','Fix an incorrect record with a reason.','Class register','High',true),
   p('at-t4','Edit registers for unrelated classes','Change attendance outside your responsibility.','Class register','Critical',false),
   p('at-t5','Change student account permissions','Grant access to private student records.','Administration','Critical',false)
  ]
 },
 'library':{
  student:[
   p('lb-s1','Search the book catalogue','Browse titles and availability.','Catalogue','Low',true),
   p('lb-s2','View own loans and due dates','See books currently borrowed by you.','My loans','Low',true),
   p('lb-s3','Renew your own eligible books','Extend a loan when library rules allow it.','My loans','Low',true),
   p('lb-s4','View another member’s borrowing history','Open someone else’s loan record.','Member privacy','High',false),
   p('lb-s5','Edit catalogue or member records','Change official library data.','Administration','Critical',false)
  ],
  teacher:[
   p('lb-t1','Issue and return library books','Manage book circulation for members.','Circulation','Medium',true),
   p('lb-t2','Update catalogue details','Add books and correct catalogue information.','Catalogue','Medium',true),
   p('lb-t3','View member loan status','See information needed to manage library loans.','Member records','Medium',true),
   p('lb-t4','Change student academic marks','Access or edit academic results unrelated to library work.','Academic records','Critical',false),
   p('lb-t5','Export all member contact details','Download the entire member directory.','Member privacy','High',false)
  ]
 },
 'exam-management':{
  student:[
   p('ex-s1','View exam timetable','See exams assigned to your course.','Exam information','Low',true),
   p('ex-s2','Download own admit card','Access your own examination entry document.','Exam documents','Low',true),
   p('ex-s3','View own published results','See your own results after release.','Exam results','Low',true),
   p('ex-s4','View another student’s answer script','Open another student’s examination work.','Exam records','Critical',false),
   p('ex-s5','Change your final result','Edit official marks or result status.','Exam results','Critical',false)
  ],
  teacher:[
   p('ex-t1','View assigned exam roster','See students registered for your assigned exams.','Exam operations','Medium',true),
   p('ex-t2','Upload marks for assigned subjects','Submit marks for the subjects you are responsible for.','Exam results','High',true),
   p('ex-t3','Review re-evaluation requests','Review student requests assigned to you.','Exam operations','Medium',true),
   p('ex-t4','Edit results without approval','Change final published results without the required review.','Exam results','Critical',false),
   p('ex-t5','Access unrelated answer scripts','Open exam scripts outside your assigned subjects.','Exam records','Critical',false)
  ]
 },
 'student-records':{
  student:[
   p('sr-s1','View own student profile','See your own contact, course and enrolment information.','Student profile','Low',true),
   p('sr-s2','Update permitted contact details','Change your phone number or address.','Student profile','Low',true),
   p('sr-s3','Download own submitted documents','Access documents you submitted yourself.','My documents','Low',true),
   p('sr-s4','View another student’s ID documents','Open another student’s identity files.','Student privacy','Critical',false),
   p('sr-s5','Change official enrolment status','Alter your own course or admission status.','Enrolment','Critical',false)
  ],
  teacher:[
   p('sr-t1','View assigned students’ profiles','See basic student information for your assigned classes.','Student records','Medium',true),
   p('sr-t2','Add academic remarks for assigned students','Record relevant academic comments.','Student records','Medium',true),
   p('sr-t3','View private identity documents','Access sensitive identity documents without an assigned need.','Student privacy','High',false),
   p('sr-t4','Change admission or enrolment status','Modify official student enrolment.','Administration','Critical',false),
   p('sr-t5','View records outside assigned classes','Open student files beyond your authorised group.','Student privacy','High',false)
  ]
 }
};

function getScenarioLists(id:ScenarioId):Record<Role,Permission[]>{
 const preset=scenarioPresets[id];
 return {
  customer:structuredClone(preset.customer??templates.customer),
  employee:structuredClone(preset.employee??templates.employee),
  owner:structuredClone(preset.owner??templates.owner),
  student:structuredClone(preset.student??templates.student),
  teacher:structuredClone(preset.teacher??templates.teacher)
 };
}

const riskPoints:Record<Level,number>={Low:8,Medium:22,High:48,Critical:75};
// A fresh storage namespace keeps this website-based test workspace separate from older prototypes.
const key='cantheyseeit-test1-websites-v2';
const SOURCE_DB='cantheyseeit-source-projects';
const SOURCE_STORE='bundles';
const CODE_EXTENSIONS=['.ts','.tsx','.js','.jsx','.mjs','.cjs','.html','.htm','.css','.scss','.sass','.json','.md','.mdx','.py','.java','.go','.php','.rb','.vue','.svelte','.sql','.yaml','.yml','.toml','.xml','.sh','.bat','.txt','.env.example'];
const IGNORE_PARTS=['node_modules/','.git/','dist/','build/','.next/','coverage/','vendor/'];
function openSourceDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(SOURCE_DB,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(SOURCE_STORE))request.result.createObjectStore(SOURCE_STORE,{keyPath:'siteId'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function saveSourceBundle(siteId:string,files:SourceFile[]){const db=await openSourceDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(SOURCE_STORE,'readwrite');tx.objectStore(SOURCE_STORE).put({siteId,files});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}
async function readSourceBundle(siteId:string):Promise<SourceFile[]>{const db=await openSourceDb();const value=await new Promise<SourceFile[]>((resolve,reject)=>{const request=db.transaction(SOURCE_STORE,'readonly').objectStore(SOURCE_STORE).get(siteId);request.onsuccess=()=>resolve(request.result?.files??[]);request.onerror=()=>reject(request.error)});db.close();return value}
async function deleteSourceBundle(siteId:string){const db=await openSourceDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(SOURCE_STORE,'readwrite');tx.objectStore(SOURCE_STORE).delete(siteId);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}
function isCodePath(path:string){const clean=path.split(String.fromCharCode(92)).join('/').toLowerCase();if(IGNORE_PARTS.some(part=>clean.includes(part)))return false;const name=clean.split('/').pop()??'';if(name.startsWith('.')&&!name.startsWith('.env.example'))return false;return CODE_EXTENSIONS.some(ext=>name.endsWith(ext))||['dockerfile','makefile','gemfile'].includes(name)}
const time=()=>new Date().toLocaleString([],{dateStyle:'medium',timeStyle:'short'});
const id=()=>Math.random().toString(36).slice(2,9);
function score(items:Permission[]){const a=items.filter(x=>x.enabled);return a.length?Math.min(100,Math.round(a.reduce((n,x)=>n+riskPoints[x.risk],0)/a.length)):0}
function band(n:number):Level{return n>=60?'Critical':n>=38?'High':n>=18?'Medium':'Low'}

export default function App(){
 const [model,setModel]=useState<Model|null>(null);
 const [role,setRole]=useState<Role|null>(null);
 const [scenarioId,setScenarioId]=useState<ScenarioId|null>(null);
 const [lists,setLists]=useState<Record<Role,Permission[]>>(()=>structuredClone(templates));
 const [events,setEvents]=useState<EventItem[]>([]);
 const [sites,setSites]=useState<SiteProfile[]>([]);
 const [activeSiteId,setActiveSiteId]=useState('');
 const [siteNameInput,setSiteNameInput]=useState('');
 const [siteUrlInput,setSiteUrlInput]=useState('');
 const [inputMode,setInputMode]=useState<'website'|'source'>('website');
 const [sourceFiles,setSourceFiles]=useState<SourceFile[]>([]);
 const [isLoadingSource,setIsLoadingSource]=useState(false);
 const [sourceError,setSourceError]=useState('');
 const sourceFilesRef=useRef<HTMLInputElement>(null);
 const sourceFolderRef=useRef<HTMLInputElement>(null);
 const [authorized,setAuthorized]=useState(false);
 const [isDragging,setIsDragging]=useState(false);
 const [page,setPage]=useState<'model'|'scenario'|'targets'|'setup'|'dashboard'>('model');
 const [search,setSearch]=useState('');
 const [filter,setFilter]=useState('All');
 const [add,setAdd]=useState(false);
 const [title,setTitle]=useState('');
 const [desc,setDesc]=useState('');
 const [level,setLevel]=useState<Level>('Medium');
 const [toast,setToast]=useState('');
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{void (async()=>{
  try{
   const raw=localStorage.getItem(key);
   if(raw){
    const saved=JSON.parse(raw);
    const loaded:SiteProfile[]=Array.isArray(saved.sites)?saved.sites:[];
    setSites(loaded);
    const active=loaded.find(site=>site.id===saved.activeSiteId)??loaded[0];
    if(active){
     setActiveSiteId(active.id);
     setLists(active.lists??structuredClone(templates));
     setEvents(active.events??[]);
     setModel(active.model??null);
     setRole(active.role??null);
     setScenarioId(active.scenario??null);
     if(active.kind==='source'){try{setSourceFiles(await readSourceBundle(active.id))}catch{setSourceFiles([])}}
    }
   }
  }catch{ /* Start with a clean workspace if saved data is invalid. */ }
  finally{setHydrated(true)}
 })()},[]);
 useEffect(()=>{if(hydrated)localStorage.setItem(key,JSON.stringify({sites,activeSiteId}))},[sites,activeSiteId,hydrated]);
 useEffect(()=>{
  if(!hydrated||!activeSiteId)return;
  setSites(previous=>previous.map(site=>site.id===activeSiteId?{...site,lists,events,model,role,scenario:scenarioId}:site));
 },[lists,events,model,role,scenarioId,activeSiteId,hydrated]);
 useEffect(()=>{if(!toast)return;const t=window.setTimeout(()=>setToast(''),2200);return()=>window.clearTimeout(t)},[toast]);
 const activeSite=sites.find(site=>site.id===activeSiteId)??null;
 const selectedBase=role&&model?roleData[model].find(x=>x.id===role):null;
 const selectedScenario=scenarios.find(item=>item.id===scenarioId)??null;
 const selected=selectedBase?{...selectedBase,name:selectedScenario?.roles[role!]??selectedBase.name}:null;
 const current=role?lists[role]:[];
 const groups=['All',...Array.from(new Set(current.map(x=>x.group)))];
 const shown=current.filter(x=>(filter==='All'||x.group===filter)&&`${x.title} ${x.description}`.toLowerCase().includes(search.toLowerCase()));
 const all=model?roleData[model].flatMap(item=>lists[item.id]):Object.values(lists).flat(),enabled=all.filter(x=>x.enabled),risk=score(enabled);
 const addEvent=(title:string,detail:string,tone:EventItem['tone']='neutral',sample=false)=>setEvents(v=>[{id:id(),time:time(),title,detail,tone,sample},...v].slice(0,60));
 function changePermission(item:Permission){if(!role||!selected)return;const next=!item.enabled;setLists(v=>({...v,[role]:v[role].map(x=>x.id===item.id?{...x,enabled:next}:x)}));addEvent(`${next?'Permission granted':'Permission removed'}: ${item.title}`,`${selected.name} · ${item.description}`,next&&(item.risk==='High'||item.risk==='Critical')?'warning':'safe');setToast(next?'Permission granted':'Permission removed')}
 function addCustom(){if(!role||!title.trim())return;const item:Permission={id:`custom-${id()}`,title:title.trim(),description:desc.trim()||'Custom permission added by an administrator.',group:'Custom permissions',risk:level,enabled:true,custom:true};setLists(v=>({...v,[role]:[...v[role],item]}));addEvent(`Custom permission added: ${item.title}`,`${selected?.name} · Risk marked ${level}`,level==='High'||level==='Critical'?'warning':'neutral');setTitle('');setDesc('');setLevel('Medium');setAdd(false);setToast('Permission added')}
 function removeCustom(item:Permission){if(!role)return;setLists(v=>({...v,[role]:v[role].filter(x=>x.id!==item.id)}));addEvent(`Permission deleted: ${item.title}`,`${selected?.name} · Removed from this role`);setToast('Permission deleted')}
 function reset(){if(!role)return;setLists(v=>({...v,[role]:structuredClone(templates[role])}));addEvent('Role permissions reset',`${selected?.name} restored to the starter template`);setToast('Role restored')}
 function sample(){addEvent('Suspicious access attempt (sample)','A student attempted to open another student’s private marks. This is a demonstration event, not a live backend alert.','danger',true);setToast('Sample alert added')}
 const rolesAll=model?roleData[model].map(r=>({...r,model,name:selectedScenario?.roles[r.id]??r.name})):[];
 function parsedWebsiteUrl(raw:string):string|null{
  try{
   const value=raw.trim();
   if(!value)return null;
   const url=new URL(/^https?:\/\//i.test(value)?value:`https://${value}`);
   if(url.protocol!=='http:'&&url.protocol!=='https:')return null;
   if(url.username||url.password)return null;
   return url.toString().replace(/\/$/,'');
  }catch{return null}
 }
 function createTarget(){
  if(!model){setPage('model');setToast('Choose Business or Organisation first');return}
  if(!authorized){setToast(inputMode==='source'?'Confirm you have permission to review this code':'Confirm you have permission to review this website');return}
  const url=inputMode==='website'?parsedWebsiteUrl(siteUrlInput):'';
  if(inputMode==='website'&&!url){setToast('Enter a valid website address');return}
  if(inputMode==='source'&&!sourceFiles.length){setToast('Add a ZIP, folder or code files first');return}
  const fallbackName=inputMode==='website'?new URL(url).hostname:'Uploaded source project';
  const site:SiteProfile={id:`site-${id()}`,name:siteNameInput.trim()||fallbackName,url,kind:inputMode,sourceFiles:inputMode==='source'?sourceFiles.map(({path,size})=>({path,size})):[],scenario:scenarioId,lists:structuredClone(lists),events:[],model,role:null};
  setSites(previous=>[...previous,site]);setActiveSiteId(site.id);
  setLists(structuredClone(lists));setEvents([]);setRole(null);
  if(inputMode==='source'){void saveSourceBundle(site.id,sourceFiles).catch(()=>setToast('Could not save code files in this browser'));}
  setSourceFiles([]);setSiteNameInput('');setSiteUrlInput('');setAuthorized(false);setPage('setup');setToast(inputMode==='source'?'Source code added — configure its permissions':'Website added — configure its permissions');
 }
 function startNewTarget(){setActiveSiteId('');setSiteNameInput('');setSiteUrlInput('');setSourceFiles([]);setSourceError('');setAuthorized(false);setScenarioId(null);setPage(model?'scenario':'model')}
  function chooseModel(next:Model){setActiveSiteId('');setModel(next);setRole(null);setScenarioId(null);setLists(structuredClone(templates));setSiteNameInput('');setSiteUrlInput('');setSourceFiles([]);setSourceError('');setAuthorized(false);setPage('scenario')}
  function chooseScenario(next:ScenarioId){const definition=scenarios.find(item=>item.id===next);if(!definition||definition.model!==model)return;setScenarioId(next);setLists(getScenarioLists(next));setRole(null);setPage('targets');setToast(`${definition.title} test cases loaded`)}
  async function processSourceFiles(items:{file:File;path:string}[]){
  setIsLoadingSource(true);setSourceError('');
  try{
   const collected:SourceFile[]=[];let total=0;const maxTotal=12*1024*1024;const maxFile=2*1024*1024;const maxFiles=250;
   for(const item of items){
    const filePath=item.path.split(String.fromCharCode(92)).join('/');
    if(filePath.toLowerCase().endsWith('.zip')){
     const zip=await JSZip.loadAsync(item.file);
     for(const [zipPath,entry] of Object.entries(zip.files)){
      if(entry.dir||!isCodePath(zipPath)||collected.length>=maxFiles)continue;
      const content=await entry.async('string');const size=new Blob([content]).size;
      if(size>maxFile||total+size>maxTotal)continue;
      collected.push({path:zipPath,size,content});total+=size;
     }
    }else if(isCodePath(filePath)&&item.file.size<=maxFile&&total+item.file.size<=maxTotal&&collected.length<maxFiles){
     const content=await item.file.text();collected.push({path:filePath,size:item.file.size,content});total+=item.file.size;
    }
   }
   if(!collected.length)throw new Error('No supported source files found. Add a ZIP, project folder or files such as .tsx, .ts, .jsx, .js, .html, .css or .py.');
   setSourceFiles(previous=>{const map=new Map(previous.map(file=>[file.path,file]));for(const file of collected)map.set(file.path,file);return Array.from(map.values())});
   setToast(`${collected.length} source files loaded`);
  }catch(error){setSourceError(error instanceof Error?error.message:'Could not read those files')}
  finally{setIsLoadingSource(false)}
 }
 function handleSourceSelection(event:ChangeEvent<HTMLInputElement>){
  const files=Array.from(event.target.files??[]).map(file=>({file,path:(file as File&{webkitRelativePath?:string}).webkitRelativePath||file.name}));
  if(files.length)void processSourceFiles(files);event.target.value='';
 }
 async function collectDroppedEntries(event:DragEvent<HTMLElement>){
  const items=Array.from(event.dataTransfer.items) as (DataTransferItem&{webkitGetAsEntry?:()=>any})[];
  const entries=items.map(item=>item.webkitGetAsEntry?.()).filter(Boolean);
  if(!entries.length)return Array.from(event.dataTransfer.files).map(file=>({file,path:file.name}));
  const result:{file:File;path:string}[]=[];
  const walk=async(entry:any,prefix=''):Promise<void>=>{
   if(entry.isFile){const file:File=await new Promise<File>((resolve,reject)=>entry.file(resolve,reject));result.push({file,path:prefix+file.name});return}
   if(entry.isDirectory){const blocked=['node_modules','.git','dist','build','.next','coverage','vendor'];if(blocked.includes(String(entry.name).toLowerCase()))return;const reader=entry.createReader();while(true){const batch:any[]=await new Promise<any[]>((resolve,reject)=>reader.readEntries(resolve,reject));if(!batch.length)break;for(const child of batch){if(result.length>=500)return;await walk(child,prefix+entry.name+'/')}}}
  };
  for(const entry of entries)await walk(entry,'');return result;
 }
 async function handleSourceDrop(event:DragEvent<HTMLElement>){
  event.preventDefault();setIsDragging(false);
  const files=await collectDroppedEntries(event);
  if(files.length){await processSourceFiles(files);return}
  const text=event.dataTransfer.getData('text/plain')||event.dataTransfer.getData('text');
  const droppedText=text.trim();
  if(droppedText.startsWith('https://')||droppedText.startsWith('http://')){setInputMode('website');setSiteUrlInput(droppedText);setToast('That looks like a website link — switched to Website link');return}
  if(droppedText){const snippet=new File([text],'dropped-code-snippet.txt',{type:'text/plain'});await processSourceFiles([{file:snippet,path:snippet.name}]);return}
  setToast('Drop a code folder, ZIP, source files or a code selection here')
 }
 function handleWebsiteDrop(event:DragEvent<HTMLElement>){
   event.preventDefault();setIsDragging(false);
   const raw=event.dataTransfer.getData('text/uri-list')||event.dataTransfer.getData('text/plain')||event.dataTransfer.getData('text');
   const candidate=raw.split(String.fromCharCode(10)).map(value=>value.trim()).find(value=>value&&!value.startsWith('#'));
   if(candidate){setSiteUrlInput(candidate);setToast('Website link added — review it before continuing')}
   else setToast('Drop a website link from your browser address bar, not a folder or file')
  }
  function selectTarget(site:SiteProfile){
  setActiveSiteId(site.id);setLists(site.lists??structuredClone(templates));setEvents(site.events??[]);setModel(site.model??null);setRole(site.role??null);setScenarioId(site.scenario??null);setPage('setup');if(site.kind==='source'){void readSourceBundle(site.id).then(setSourceFiles).catch(()=>setSourceFiles([]))}else setSourceFiles([]);setToast(`Switched to ${site.name}`);
 }
 function removeTarget(site:SiteProfile){
  if(!window.confirm(`Remove ${site.name} and its locally saved permission setup?`))return;
  const remaining=sites.filter(item=>item.id!==site.id);setSites(remaining);if(site.kind==='source')void deleteSourceBundle(site.id).catch(()=>{});
  if(activeSiteId===site.id){setActiveSiteId('');setLists(structuredClone(templates));setEvents([]);setModel(null);setRole(null);setScenarioId(null);setPage('model')}
  setToast('Website removed from this browser');
 }
 return <div className="app"><header className="top"><div className="brand"><span className="brand-icon"><ShieldCheck size={21}/></span><span><b>CanTheySeeIt?</b><small>Simple access control</small></span></div><nav><button className={page==='model'?'active':''} onClick={()=>setPage('model')}><Building2 size={16}/> Model</button><button className={page==='targets'?'active':''} onClick={startNewTarget}><Globe size={16}/> Project</button><button className={page==='setup'?'active':''} onClick={()=>activeSiteId?setPage('setup'):setPage('model')}><SlidersHorizontal size={16}/> Permissions</button><button className={page==='dashboard'?'active':''} onClick={()=>activeSiteId?setPage('dashboard'):setPage('model')}><LayoutDashboard size={16}/> Dashboard</button></nav><span className="local"><i/>{activeSite?activeSite.name:'No website selected'}</span>{activeSite?.kind!=='source'&&activeSite?.url&&<a className="open-target" href={activeSite.url} target="_blank" rel="noreferrer">Open website <ExternalLink size={12}/></a>}</header>
 <main><div className="intro"><div><small>TEST 1 · ACCESS MADE SIMPLE</small><h1>{page==='model'?'What type of setup are you managing?':page==='scenario'?'Choose a scenario to test':page==='targets'?'Add your website or source code':page==='setup'?'Who should be able to do what?':'Your access overview'}</h1><p>{page==='model'?'Start by choosing Business or Organisation.':page==='scenario'?'Pick a real-world scenario. We will load matching permission presets and example test cases.':page==='targets'?'Now add the website link or source code for this scenario.':page==='setup'?'Choose a role and switch permissions on or off. No technical knowledge needed.':'A clear picture of configured permissions and the risks they may introduce.'}</p></div>{page==='setup'&&<button className="link" onClick={()=>setPage('dashboard')}>View dashboard <ArrowRight size={15}/></button>}</div>
 {page==='model'?<>
  <section className="card"><div className="heading"><div><small>STEP 1 · CHOOSE YOUR MODEL</small><h2>What are you setting up?</h2><p>Pick the option that best describes your website or service.</p></div></div><div className="models">{(['business','organisation'] as Model[]).map(m=><button className={model===m?'model chosen':'model'} onClick={()=>chooseModel(m)}><span className="model-icon">{m==='business'?<Building2/>:<GraduationCap/>}</span><span><b>{m==='business'?'Business':'Organisation'}</b><small>{m==='business'?'For a company, shop, startup or service.':'For a school, college, academy or institution.'}</small><em>{m==='business'?'Customers · Employees · Owner':'Students · Teachers'}</em></span><ArrowRight className="check"/></button>)}</div></section>
  {sites.length>0&&<section className="card"><div className="heading"><div><small>EXISTING WORKSPACES</small><h2>Your saved projects</h2><p>Open a project you have already added.</p></div><span className="count">{sites.length} saved</span></div><div className="site-list">{sites.map(site=><div className="site-row"><span className="site-icon"><Globe size={18}/></span><span className="site-copy"><b>{site.name}</b><small>{scenarios.find(item=>item.id===site.scenario)?.title??(site.kind==='source'?`Source code · ${site.sourceFiles?.length??0} files`:site.url)}</small></span><button className="light" onClick={()=>selectTarget(site)}>Open</button></div>)}</div></section>}
  </>:page==='scenario'?<>
  <section className="card scenario-picker">
   <div className="heading"><div><small>STEP 2 · PICK A TEST SCENARIO</small><h2>{model==='business'?'Business scenarios':'Organisation scenarios'}</h2><p>Choose the kind of system you want to check. Each scenario loads its own permission presets and test cases.</p></div><span className="count">{scenarios.filter(item=>item.model===model).length} scenarios</span></div>
   <div className="scenario-grid">{scenarios.filter(item=>item.model===model).map(item=><button type="button" className={scenarioId===item.id?'scenario-card chosen':'scenario-card'} onClick={()=>chooseScenario(item.id)}>
    <div className="scenario-card-head"><span className="scenario-emoji">{item.emoji}</span><span className="scenario-pick">{scenarioId===item.id?<Check size={15}/>:<ArrowRight size={15}/>}</span></div>
    <b>{item.title}</b><p>{item.description}</p>
    <div className="scenario-roles">{roleData[model!].map(roleItem=><span>{item.roles[roleItem.id]??roleItem.name}</span>)}</div>
    <div className="scenario-cases"><small>EXAMPLE TEST CASES</small>{item.cases.map(test=><div><span className={test.outcome==='ALLOW'?'case-allow':'case-deny'}>{test.outcome==='ALLOW'?'ALLOW':'DENY'}</span><span>{test.title}</span></div>)}<em>{item.cases.length} example test cases included</em></div>
   </button>)}</div>
   <div className="scenario-footer"><button className="light" onClick={()=>setPage('model')}>Back to model</button><span>Choose a scenario to continue to website or source-code upload.</span></div>
  </section>
  </>:page==='targets'?<>
 <section className="card target-form">
  <div className="heading"><div><small>STEP 3 · ADD YOUR PROJECT</small><h2>Add a website link or source code</h2><p>Choose how you want to provide the project. You can give us the live URL or the actual code files.</p></div><span className="target-mark"><Code2 size={21}/></span></div>
  {selectedScenario&&<div className="selected-scenario-note"><span>{selectedScenario.emoji}</span><div><small>SELECTED TEST SUITE</small><b>{selectedScenario.title}</b><em>{selectedScenario.cases.length} example access tests ready</em></div><button type="button" className="link" onClick={()=>setPage('scenario')}>Change</button></div>}
  <label className="site-name-field">Project name <span>Optional</span><input value={siteNameInput} onChange={e=>setSiteNameInput(e.target.value)} placeholder="e.g. My Vibe-Coded Store"/></label>
  <div className="input-modes">
   <button type="button" className={inputMode==='website'?'mode-option selected':'mode-option'} onClick={()=>{setInputMode('website');setSourceError('')}}><Globe size={16}/> Website link</button>
   <button type="button" className={inputMode==='source'?'mode-option selected':'mode-option'} onClick={()=>{setInputMode('source');setSourceError('')}}><Code2 size={16}/> Source code</button>
  </div>
  {inputMode==='website'?<>
   <div className={isDragging?'dropzone dragging':'dropzone'} onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={e=>{if(e.currentTarget===e.target)setIsDragging(false)}} onDrop={handleWebsiteDrop}>
    <span className="drop-icon"><Globe size={25}/></span><b>{isDragging?'Drop your website link here':'Drag & drop your website link here'}</b><p>Drag a URL from your browser address bar, or paste/type it below.</p>
   </div>
   <div className="target-fields single">
    <label>Website address<input value={siteUrlInput} onChange={e=>setSiteUrlInput(e.target.value)} onDragOver={e=>e.preventDefault()} onDrop={handleWebsiteDrop} placeholder="https://your-website.com" inputMode="url"/><small>Examples: https://my-site.com or http://localhost:3000</small></label>
   </div>
  </>:<>
   <div className={isDragging?'dropzone source-dropzone dragging':'dropzone source-dropzone'} onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={e=>{if(e.currentTarget===e.target)setIsDragging(false)}} onDrop={handleSourceDrop}>
    <span className="drop-icon"><Code2 size={27}/></span><b>{isDragging?'Drop your project here':'Drag & drop your source code here'}</b><p>Drop a whole project folder, a .zip file, or multiple code files from your computer.</p>
    <div className="source-pickers"><button type="button" className="light" onClick={()=>sourceFilesRef.current?.click()}><FileCode2 size={15}/> Choose files / ZIP</button><button type="button" className="light" onClick={()=>sourceFolderRef.current?.click()}><FolderOpen size={15}/> Choose project folder</button></div>
   </div>
   <input ref={sourceFilesRef} className="hidden-file" type="file" multiple accept=".zip,.ts,.tsx,.js,.jsx,.mjs,.cjs,.html,.htm,.css,.scss,.json,.md,.mdx,.py,.java,.go,.php,.rb,.vue,.svelte,.sql,.yaml,.yml,.toml,.xml,.sh,.bat,.txt" onChange={handleSourceSelection}/>
   <input ref={sourceFolderRef} className="hidden-file" type="file" multiple {...({webkitdirectory:'',directory:''} as any)} onChange={handleSourceSelection}/>
   {isLoadingSource&&<p className="source-status">Reading your project files…</p>}
   {sourceError&&<p className="source-error">{sourceError}</p>}
   {sourceFiles.length>0&&<div className="source-preview"><div className="source-preview-head"><span><b>{sourceFiles.length} source files loaded</b><small>{(sourceFiles.reduce((total,file)=>total+file.size,0)/1024).toFixed(1)} KB · saved in this browser</small></span><button type="button" className="light" onClick={()=>setSourceFiles([])}><Trash2 size={14}/> Clear</button></div><div className="source-file-list">{sourceFiles.slice(0,8).map(file=><div key={file.path}><FileCode2 size={13}/><span>{file.path}</span><small>{(file.size/1024).toFixed(1)} KB</small></div>)}{sourceFiles.length>8&&<small>and {sourceFiles.length-8} more files…</small>}</div></div>}
   <p className="source-footnote">Supported: ZIP, project folders, TS/TSX, JS/JSX, HTML, CSS, JSON, Python and more. node_modules, build folders and .git are skipped. Files stay in this browser; this prototype does not send your code to a server.</p>
  </>}
  <label className="authorise"><input type="checkbox" checked={authorized} onChange={e=>setAuthorized(e.target.checked)}/><span><b>I own this website or have permission to review this code.</b><small>Only add websites or source projects you are authorised to assess.</small></span></label>
  <div className="target-submit"><button className="light" onClick={()=>setPage('model')}>Back to model</button><button className="blue" onClick={createTarget} disabled={(inputMode==='website'?!parsedWebsiteUrl(siteUrlInput):sourceFiles.length===0)||!authorized||isLoadingSource}><Plus size={15}/> Add {inputMode==='website'?'website':'source project'} and continue</button><p>Choose website link or source code. The actual security analysis needs a connected backend.</p></div>
 </section>
 {sites.length>0&&<section className="card"><div className="heading"><div><small>YOUR WORKSPACES</small><h2>Projects added</h2><p>Switch between sites. Each one keeps its own permissions and timeline.</p></div><span className="count">{sites.length} saved</span></div><div className="site-list">{sites.map(site=><div className={site.id===activeSiteId?'site-row current':'site-row'}><span className="site-icon"><Globe size={18}/></span><span className="site-copy"><b>{site.name}</b><small>{scenarios.find(item=>item.id===site.scenario)?.title??(site.kind==='source'?`Source code · ${site.sourceFiles?.length??0} files`:site.url)}</small></span>{site.id===activeSiteId&&<em>Current</em>}<button className="light" onClick={()=>selectTarget(site)}>Open</button><button className="site-remove" onClick={()=>removeTarget(site)} title="Remove website"><Trash2 size={15}/></button></div>)}</div></section>}
 <div className="target-note"><AlertTriangle size={17}/><span><b>Authorisation reminder:</b> only add websites you own or have permission to assess. This step stores the target URL; it does not crawl pages or send security requests.</span></div>
 </>:page==='setup'?<>
 <div className="active-site-banner">{activeSite?.kind==='source'?<Code2 size={16}/>:<Globe size={16}/>}<span><small>MANAGING {activeSite?.kind==='source'?'SOURCE PROJECT':'WEBSITE'}</small><b>{activeSite?.name??'Selected target'}</b>{selectedScenario&&<small>{selectedScenario.title}</small>}</span>{activeSite?.kind==='source'&&<small>{activeSite.sourceFiles?.length??0} files</small>}<button className="light" onClick={startNewTarget}>Change target</button></div>
 {model&&<section className="card"><div className="heading"><div><small>STEP 4</small><h2>Choose a category</h2><p>Select whose permissions you want to manage.</p></div><span className="count">{roleData[model].length} categories</span></div><div className="roles">{roleData[model].map(r=>{const Icon=r.icon;return <button className={role===r.id?'role selected':'role'} onClick={()=>{setRole(r.id);setSearch('');setFilter('All')}}><span className="role-icon"><Icon size={19}/></span><b>{selectedScenario?.roles[r.id]??r.name}</b><small>{r.desc}</small><em>{lists[r.id].filter(x=>x.enabled).length} of {lists[r.id].length} enabled</em></button>})}</div></section>}
 {role&&selected&&<section className="card"><div className="perm-head"><div><small>STEP 5</small><h2>{selected.name} permissions</h2><p>Turn each permission on or off. The description explains what it means.</p></div><div className="actions"><button className="light" onClick={reset}><RotateCcw size={14}/> Reset role</button><button className="blue" onClick={()=>setAdd(true)}><Plus size={15}/> Add permission</button></div></div><div className="summary"><span><small>Permissions enabled</small><b>{current.filter(x=>x.enabled).length}<i> / {current.length}</i></b></span><span><small>Estimated role risk</small><b className={band(score(current)).toLowerCase()}>{score(current)}% <i>{band(score(current))}</i></b></span><p>Risk is estimated from enabled permissions. It is not a live security scan.</p></div><div className="tools"><label><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search permissions…"/></label><select value={filter} onChange={e=>setFilter(e.target.value)}>{groups.map(g=><option>{g}</option>)}</select></div><div className="list">{shown.length===0?<p className="empty">No permissions match your search.</p>:shown.map(item=><div className="permission"><span className={item.enabled?'symbol on':'symbol'}>{item.enabled?<Check size={15}/>:<LockKeyhole size={14}/>}</span><div className="permission-copy"><div><b>{item.title}</b><span className={'risk '+item.risk.toLowerCase()}>{item.risk} risk</span>{item.custom&&<span className="custom">Custom</span>}</div><p>{item.description}</p><small>{item.group}</small></div><span className={item.enabled?'allowed':'blocked'}>{item.enabled?'Allowed':'Not allowed'}</span><button className={item.enabled?'switch on':'switch'} role="switch" aria-checked={item.enabled} onClick={()=>changePermission(item)}><i/></button>{item.custom&&<button className="delete" onClick={()=>removeCustom(item)} title="Delete permission"><Trash2 size={15}/></button>}</div>)}</div><div className="tip">ⓘ <span><b>Tip:</b> Give people only the access they need. A student usually needs to view their own marks, not everyone else’s.</span></div></section>}
 {role&&<div className="bottom"><span><b>Changes are saved on this device.</b><small>Review all roles on your dashboard.</small></span><button className="blue" onClick={()=>setPage('dashboard')}>Open dashboard <ArrowRight size={15}/></button></div>}
 </>:<>
 <div className="stats">{[['Total permissions',all.length,'Across all categories'],['Currently allowed',enabled.length,`${all.length?Math.round(enabled.length/all.length*100):0}% of listed permissions`],['High / critical access',enabled.filter(x=>x.risk==='High'||x.risk==='Critical').length,'Enabled permissions to review'],['Timeline events',events.length,'Changes and sample alerts']].map((v,i)=><div className="stat"><span>{[<LockKeyhole/>,<ShieldCheck/>,<AlertTriangle/>,<Activity/>][i]}</span><small>{v[0]}</small><b>{v[1]}</b><em>{v[2]}</em></div>)}</div>
 <div className="dash-grid"><section className="card"><div className="heading"><div><h2>Risk detected</h2><p>Estimated from the permissions currently allowed.</p></div><span className={'risk '+band(risk).toLowerCase()}>{band(risk)} risk</span></div><div className="risk-summary"><div className="donut" style={{'--score':risk+'%'} as CSSProperties}><span><b>{risk}%</b><small>Risk estimate</small></span></div><p><b>{risk>=60?'Review high-impact access':risk>=38?'Some access needs attention':risk>=18?'A few permissions deserve a check':'Your current setup looks limited'}</b><small>Check whether every enabled permission is necessary for its role.</small></p></div><div className="disclaimer">ⓘ This is a configuration estimate, not proof that a breach happened or that the system is secure.</div></section>
 <section className="card"><div className="heading"><div><h2>Permissions by category</h2><p>What each type of user is currently allowed to do.</p></div><button className="link" onClick={()=>setPage('setup')}>Manage <ArrowRight size={14}/></button></div><div className="access">{rolesAll.map(r=><button onClick={()=>{setModel(r.model);setRole(r.id);setPage('setup')}}><span><b>{r.name}</b><small>{r.model}</small></span><span className="bar"><i style={{width:(lists[r.id].filter(x=>x.enabled).length/lists[r.id].length*100)+'%'}}/></span><small>{lists[r.id].filter(x=>x.enabled).length}/{lists[r.id].length}</small></button>)}</div></section></div>
 <section className="card timeline"><div className="heading"><div><h2>Activity timeline</h2><p>Permission changes and security events recorded in this workspace.</p></div><div className="actions"><button className="light" onClick={sample}>＋ Sample alert</button><button className="light" onClick={()=>setEvents([])}><Trash2 size={14}/> Clear</button></div></div>{events.length===0?<div className="empty-timeline"><Clock3/><b>No activity yet</b><small>Permission changes will appear here. Add a sample alert to preview an incident.</small></div>:events.map(e=><div className="event"><span className={'event-icon '+e.tone}>{e.tone==='danger'?<AlertTriangle size={15}/>:e.tone==='safe'?<Check size={15}/>:<Activity size={15}/>}</span><span className="event-copy"><b>{e.title} {e.sample&&<em>SAMPLE EVENT</em>}</b><small>{e.detail}</small><i>{e.time}</i></span><strong className={e.tone}>{e.tone==='danger'?'Alert':e.tone==='warning'?'Review':e.tone==='safe'?'Change':'Activity'}</strong></div>)}<div className="disclaimer">⚠ Real breach detection needs verified events from your backend or monitoring system. Sample alerts are not real breaches.</div></section>
 </>}
 </main><footer>CanTheySeeIt? · The Gatekeepers <span>Test 1 · Simple permission management</span></footer>
 {add&&<div className="backdrop" onClick={e=>{if(e.target===e.currentTarget)setAdd(false)}}><div className="modal"><div className="modal-title"><span><small>CUSTOM RULE</small><b>Add a permission</b><em>Create a permission for {selected?.name}.</em></span><button onClick={()=>setAdd(false)}><X/></button></div><label>Permission name<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Download class report"/></label><label>What does this allow?<textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Explain in everyday language…"/></label><label>Risk level<select value={level} onChange={e=>setLevel(e.target.value as Level)}>{(['Low','Medium','High','Critical'] as Level[]).map(x=><option>{x}</option>)}</select></label><p className="disclaimer">Choose the risk level that best describes the permission. This is only an estimate.</p><div className="actions"><button className="light" onClick={()=>setAdd(false)}>Cancel</button><button className="blue" disabled={!title.trim()} onClick={addCustom}><Plus size={15}/> Add permission</button></div></div></div>}
 {toast&&<div className="toast">✓ {toast}</div>}
 </div>
}