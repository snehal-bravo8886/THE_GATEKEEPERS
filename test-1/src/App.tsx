import { useEffect, useMemo, useState, type CSSProperties, type DragEvent } from 'react';
import { ShieldCheck, Building2, GraduationCap, UserRound, BriefcaseBusiness, Users, LayoutDashboard, SlidersHorizontal, Plus, Trash2, Check, AlertTriangle, Activity, Search, ArrowRight, RotateCcw, X, LockKeyhole, Clock3, Globe, ExternalLink } from 'lucide-react';

type Model = 'business' | 'organisation';
type Role = 'customer' | 'employee' | 'owner' | 'student' | 'teacher';
type Level = 'Low' | 'Medium' | 'High' | 'Critical';
type Permission = { id:string; title:string; description:string; group:string; risk:Level; enabled:boolean; custom?:boolean };
type EventItem = { id:string; time:string; title:string; detail:string; tone:'safe'|'warning'|'danger'|'neutral'; sample?:boolean };
type SiteProfile = { id:string; name:string; url:string; lists:Record<Role,Permission[]>; events:EventItem[]; model:Model|null; role:Role|null };
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
const riskPoints:Record<Level,number>={Low:8,Medium:22,High:48,Critical:75};
// A fresh storage namespace keeps this website-based test workspace separate from older prototypes.
const key='cantheyseeit-test1-websites-v1';
const time=()=>new Date().toLocaleString([],{dateStyle:'medium',timeStyle:'short'});
const id=()=>Math.random().toString(36).slice(2,9);
function score(items:Permission[]){const a=items.filter(x=>x.enabled);return a.length?Math.min(100,Math.round(a.reduce((n,x)=>n+riskPoints[x.risk],0)/a.length)):0}
function band(n:number):Level{return n>=60?'Critical':n>=38?'High':n>=18?'Medium':'Low'}

export default function App(){
 const [model,setModel]=useState<Model|null>(null);
 const [role,setRole]=useState<Role|null>(null);
 const [lists,setLists]=useState<Record<Role,Permission[]>>(()=>structuredClone(templates));
 const [events,setEvents]=useState<EventItem[]>([]);
 const [sites,setSites]=useState<SiteProfile[]>([]);
 const [activeSiteId,setActiveSiteId]=useState('');
 const [siteNameInput,setSiteNameInput]=useState('');
 const [siteUrlInput,setSiteUrlInput]=useState('');
 const [authorized,setAuthorized]=useState(false);
 const [isDragging,setIsDragging]=useState(false);
 const [page,setPage]=useState<'model'|'targets'|'setup'|'dashboard'>('model');
 const [search,setSearch]=useState('');
 const [filter,setFilter]=useState('All');
 const [add,setAdd]=useState(false);
 const [title,setTitle]=useState('');
 const [desc,setDesc]=useState('');
 const [level,setLevel]=useState<Level>('Medium');
 const [toast,setToast]=useState('');
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{
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
    }
   }
  }catch{ /* Start with a clean workspace if saved data is invalid. */ }
  finally{setHydrated(true)}
 },[]);
 useEffect(()=>{if(hydrated)localStorage.setItem(key,JSON.stringify({sites,activeSiteId}))},[sites,activeSiteId,hydrated]);
 useEffect(()=>{
  if(!hydrated||!activeSiteId)return;
  setSites(previous=>previous.map(site=>site.id===activeSiteId?{...site,lists,events,model,role}:site));
 },[lists,events,model,role,activeSiteId,hydrated]);
 useEffect(()=>{if(!toast)return;const t=window.setTimeout(()=>setToast(''),2200);return()=>window.clearTimeout(t)},[toast]);
 const activeSite=sites.find(site=>site.id===activeSiteId)??null;
 const selected=role&&model?roleData[model].find(x=>x.id===role):null;
 const current=role?lists[role]:[];
 const groups=['All',...Array.from(new Set(current.map(x=>x.group)))];
 const shown=current.filter(x=>(filter==='All'||x.group===filter)&&`${x.title} ${x.description}`.toLowerCase().includes(search.toLowerCase()));
 const all=Object.values(lists).flat(),enabled=all.filter(x=>x.enabled),risk=score(enabled);
 const addEvent=(title:string,detail:string,tone:EventItem['tone']='neutral',sample=false)=>setEvents(v=>[{id:id(),time:time(),title,detail,tone,sample},...v].slice(0,60));
 function changePermission(item:Permission){if(!role||!selected)return;const next=!item.enabled;setLists(v=>({...v,[role]:v[role].map(x=>x.id===item.id?{...x,enabled:next}:x)}));addEvent(`${next?'Permission granted':'Permission removed'}: ${item.title}`,`${selected.name} · ${item.description}`,next&&(item.risk==='High'||item.risk==='Critical')?'warning':'safe');setToast(next?'Permission granted':'Permission removed')}
 function addCustom(){if(!role||!title.trim())return;const item:Permission={id:`custom-${id()}`,title:title.trim(),description:desc.trim()||'Custom permission added by an administrator.',group:'Custom permissions',risk:level,enabled:true,custom:true};setLists(v=>({...v,[role]:[...v[role],item]}));addEvent(`Custom permission added: ${item.title}`,`${selected?.name} · Risk marked ${level}`,level==='High'||level==='Critical'?'warning':'neutral');setTitle('');setDesc('');setLevel('Medium');setAdd(false);setToast('Permission added')}
 function removeCustom(item:Permission){if(!role)return;setLists(v=>({...v,[role]:v[role].filter(x=>x.id!==item.id)}));addEvent(`Permission deleted: ${item.title}`,`${selected?.name} · Removed from this role`);setToast('Permission deleted')}
 function reset(){if(!role)return;setLists(v=>({...v,[role]:structuredClone(templates[role])}));addEvent('Role permissions reset',`${selected?.name} restored to the starter template`);setToast('Role restored')}
 function sample(){addEvent('Suspicious access attempt (sample)','A student attempted to open another student’s private marks. This is a demonstration event, not a live backend alert.','danger',true);setToast('Sample alert added')}
 const rolesAll=(Object.keys(roleData) as Model[]).flatMap(m=>roleData[m].map(r=>({...r,model:m})));
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
  const url=parsedWebsiteUrl(siteUrlInput);
  if(!model){setPage('model');setToast('Choose Business or Organisation first');return}
   if(!url){setToast('Enter a valid website address');return}
  if(!authorized){setToast('Please confirm you are allowed to test this website');return}
  const site:SiteProfile={id:`site-${id()}`,name:siteNameInput.trim()||new URL(url).hostname,url,lists:structuredClone(templates),events:[],model,role:null};
  setSites(previous=>[...previous,site]);
  setActiveSiteId(site.id);
  setLists(structuredClone(templates));setEvents([]);setRole(null);
  setSiteNameInput('');setSiteUrlInput('');setAuthorized(false);setPage('setup');setToast('Website added — configure its permissions');
 }
 function chooseModel(next:Model){setModel(next);setRole(null);setPage('targets')}
  function handleWebsiteDrop(event:DragEvent<HTMLDivElement>){
   event.preventDefault();setIsDragging(false);
   const raw=event.dataTransfer.getData('text/uri-list')||event.dataTransfer.getData('text/plain')||event.dataTransfer.getData('text');
   const candidate=raw.split(String.fromCharCode(10)).map(value=>value.trim()).find(value=>value&&!value.startsWith('#'));
   if(candidate){setSiteUrlInput(candidate);setToast('Website link added — review it before continuing')}
   else setToast('Drop a website link from your browser address bar, not a folder or file')
  }
  function selectTarget(site:SiteProfile){
  setActiveSiteId(site.id);setLists(site.lists??structuredClone(templates));setEvents(site.events??[]);setModel(site.model??null);setRole(site.role??null);setPage('setup');setToast(`Switched to ${site.name}`);
 }
 function removeTarget(site:SiteProfile){
  if(!window.confirm(`Remove ${site.name} and its locally saved permission setup?`))return;
  const remaining=sites.filter(item=>item.id!==site.id);setSites(remaining);
  if(activeSiteId===site.id){setActiveSiteId('');setLists(structuredClone(templates));setEvents([]);setModel(null);setRole(null);setPage('targets')}
  setToast('Website removed from this browser');
 }
 return <div className="app"><header className="top"><div className="brand"><span className="brand-icon"><ShieldCheck size={21}/></span><span><b>CanTheySeeIt?</b><small>Simple access control</small></span></div><nav><button className={page==='model'?'active':''} onClick={()=>setPage('model')}><Building2 size={16}/> Model</button><button className={page==='targets'?'active':''} onClick={()=>model?setPage('targets'):setPage('model')}><Globe size={16}/> Website</button><button className={page==='setup'?'active':''} onClick={()=>activeSiteId?setPage('setup'):setPage('model')}><SlidersHorizontal size={16}/> Permissions</button><button className={page==='dashboard'?'active':''} onClick={()=>activeSiteId?setPage('dashboard'):setPage('model')}><LayoutDashboard size={16}/> Dashboard</button></nav><span className="local"><i/>{activeSite?activeSite.name:'No website selected'}</span>{activeSite&&<a className="open-target" href={activeSite.url} target="_blank" rel="noreferrer">Open website <ExternalLink size={12}/></a>}</header>
 <main><div className="intro"><div><small>TEST 1 · ACCESS MADE SIMPLE</small><h1>{page==='model'?'What type of setup are you managing?':page==='targets'?'Now, add the website you want to review':page==='setup'?'Who should be able to do what?':'Your access overview'}</h1><p>{page==='model'?'Start by choosing Business or Organisation. We’ll ask for your website in the next step.':page==='targets'?'Drop your website link below. You can also paste or type it.':page==='setup'?'Choose a role and switch permissions on or off. No technical knowledge needed.':'A clear picture of configured permissions and the risks they may introduce.'}</p></div>{page==='setup'&&<button className="link" onClick={()=>setPage('dashboard')}>View dashboard <ArrowRight size={15}/></button>}</div>
 {page==='model'?<>
  <section className="card"><div className="heading"><div><small>STEP 1 · CHOOSE YOUR MODEL</small><h2>What are you setting up?</h2><p>Pick the option that best describes your website or service.</p></div></div><div className="models">{(['business','organisation'] as Model[]).map(m=><button className={model===m?'model chosen':'model'} onClick={()=>chooseModel(m)}><span className="model-icon">{m==='business'?<Building2/>:<GraduationCap/>}</span><span><b>{m==='business'?'Business':'Organisation'}</b><small>{m==='business'?'For a company, shop, startup or service.':'For a school, college, academy or institution.'}</small><em>{m==='business'?'Customers · Employees · Owner':'Students · Teachers'}</em></span><ArrowRight className="check"/></button>)}</div></section>
  {sites.length>0&&<section className="card"><div className="heading"><div><small>EXISTING WORKSPACES</small><h2>Your saved websites</h2><p>Open a website you have already added.</p></div><span className="count">{sites.length} saved</span></div><div className="site-list">{sites.map(site=><div className="site-row"><span className="site-icon"><Globe size={18}/></span><span className="site-copy"><b>{site.name}</b><small>{site.url}</small></span><button className="light" onClick={()=>selectTarget(site)}>Open</button></div>)}</div></section>}
  </>:page==='targets'?<>
 <section className="card target-form">
  <div className="heading"><div><small>STEP 2 · ADD YOUR WEBSITE</small><h2>Bring your website into the workspace</h2><p>Drag a link from your browser’s address bar, or paste the website address below.</p></div><span className="target-mark"><Globe size={21}/></span></div>
  <label className="site-name-field">Website name <span>Optional</span><input value={siteNameInput} onChange={e=>setSiteNameInput(e.target.value)} placeholder="e.g. My Vibe-Coded Store"/></label>
  <div className={isDragging?'dropzone dragging':'dropzone'} onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={e=>{if(e.currentTarget===e.target)setIsDragging(false)}} onDrop={handleWebsiteDrop}>
   <span className="drop-icon"><Globe size={25}/></span><b>{isDragging?'Drop your website link here':'Drag & drop your website link here'}</b><p>Drag the URL from your browser address bar, or drag a website link from a page.</p><span className="drop-or">OR PASTE / TYPE BELOW</span>
  </div>
  <div className="target-fields single">
   <label>Website address<input value={siteUrlInput} onChange={e=>setSiteUrlInput(e.target.value)} onDragOver={e=>e.preventDefault()} onDrop={handleWebsiteDrop} placeholder="https://your-website.com" inputMode="url"/><small>Examples: https://my-site.com or http://localhost:3000</small></label>
  </div>
  <label className="authorise"><input type="checkbox" checked={authorized} onChange={e=>setAuthorized(e.target.checked)}/><span><b>I own this website or have explicit permission to test it.</b><small>Only add websites you are authorised to assess.</small></span></label>
  <div className="target-submit"><button className="light" onClick={()=>setPage('model')}>Back to model</button><button className="blue" onClick={createTarget} disabled={!parsedWebsiteUrl(siteUrlInput)||!authorized}><Plus size={15}/> Add website and continue</button><p>This adds the link to your {model==='business'?'Business':'Organisation'} workspace. It does not scan the website yet.</p></div>
 </section>
 {sites.length>0&&<section className="card"><div className="heading"><div><small>YOUR WORKSPACES</small><h2>Websites added</h2><p>Switch between sites. Each one keeps its own permissions and timeline.</p></div><span className="count">{sites.length} saved</span></div><div className="site-list">{sites.map(site=><div className={site.id===activeSiteId?'site-row current':'site-row'}><span className="site-icon"><Globe size={18}/></span><span className="site-copy"><b>{site.name}</b><small>{site.url}</small></span>{site.id===activeSiteId&&<em>Current</em>}<button className="light" onClick={()=>selectTarget(site)}>Open</button><button className="site-remove" onClick={()=>removeTarget(site)} title="Remove website"><Trash2 size={15}/></button></div>)}</div></section>}
 <div className="target-note"><AlertTriangle size={17}/><span><b>Authorisation reminder:</b> only add websites you own or have permission to assess. This step stores the target URL; it does not crawl pages or send security requests.</span></div>
 </>:page==='setup'?<>
 <div className="active-site-banner"><Globe size={16}/><span><small>MANAGING WEBSITE</small><b>{activeSite?.name??'Selected website'}</b></span><button className="light" onClick={()=>setPage('targets')}>Change website</button></div>
 {model&&<section className="card"><div className="heading"><div><small>STEP 2</small><h2>Choose a category</h2><p>Select whose permissions you want to manage.</p></div><span className="count">{roleData[model].length} categories</span></div><div className="roles">{roleData[model].map(r=>{const Icon=r.icon;return <button className={role===r.id?'role selected':'role'} onClick={()=>{setRole(r.id);setSearch('');setFilter('All')}}><span className="role-icon"><Icon size={19}/></span><b>{r.name}</b><small>{r.desc}</small><em>{lists[r.id].filter(x=>x.enabled).length} of {lists[r.id].length} enabled</em></button>})}</div></section>}
 {role&&selected&&<section className="card"><div className="perm-head"><div><small>STEP 3</small><h2>{selected.name} permissions</h2><p>Turn each permission on or off. The description explains what it means.</p></div><div className="actions"><button className="light" onClick={reset}><RotateCcw size={14}/> Reset role</button><button className="blue" onClick={()=>setAdd(true)}><Plus size={15}/> Add permission</button></div></div><div className="summary"><span><small>Permissions enabled</small><b>{current.filter(x=>x.enabled).length}<i> / {current.length}</i></b></span><span><small>Estimated role risk</small><b className={band(score(current)).toLowerCase()}>{score(current)}% <i>{band(score(current))}</i></b></span><p>Risk is estimated from enabled permissions. It is not a live security scan.</p></div><div className="tools"><label><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search permissions…"/></label><select value={filter} onChange={e=>setFilter(e.target.value)}>{groups.map(g=><option>{g}</option>)}</select></div><div className="list">{shown.length===0?<p className="empty">No permissions match your search.</p>:shown.map(item=><div className="permission"><span className={item.enabled?'symbol on':'symbol'}>{item.enabled?<Check size={15}/>:<LockKeyhole size={14}/>}</span><div className="permission-copy"><div><b>{item.title}</b><span className={'risk '+item.risk.toLowerCase()}>{item.risk} risk</span>{item.custom&&<span className="custom">Custom</span>}</div><p>{item.description}</p><small>{item.group}</small></div><span className={item.enabled?'allowed':'blocked'}>{item.enabled?'Allowed':'Not allowed'}</span><button className={item.enabled?'switch on':'switch'} role="switch" aria-checked={item.enabled} onClick={()=>changePermission(item)}><i/></button>{item.custom&&<button className="delete" onClick={()=>removeCustom(item)} title="Delete permission"><Trash2 size={15}/></button>}</div>)}</div><div className="tip">ⓘ <span><b>Tip:</b> Give people only the access they need. A student usually needs to view their own marks, not everyone else’s.</span></div></section>}
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