/* CanTheySeeIt? — native dashboard over the real local verifier API.
 * No static verdicts, no browser credentials, no direct synthetic writes.
 * API calls are same-origin. All visible backend strings are escaped.
 */
(() => {
  'use strict';
  const ICON = {
    'layout-dashboard':'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
    layers:'<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',scan:'<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4M5 12h14"/>',
    'shield-alert':'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 7v6M12 17h.01"/>',history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',plug:'<path d="M12 22v-5M9 8V2M15 8V2M7 8h10v5a5 5 0 0 1-10 0V8Z"/>',
    'book-open':'<path d="M12 7v14M3 5a8 8 0 0 1 9 2 8 8 0 0 1 9-2v14a8 8 0 0 0-9 2 8 8 0 0 0-9-2V5Z"/>','chevrons-up-down':'<path d="m7 9 5-5 5 5m-10 6 5 5 5-5"/>','shopping-bag':'<path d="M5 8h14l1 13H4L5 8ZM9 9V6a3 3 0 0 1 6 0v3"/>',
    'chevron-right':'<path d="m9 18 6-6-6-6"/>','refresh-cw':'<path d="M20 11a8 8 0 0 0-14-5L4 8M4 4v4h4M4 13a8 8 0 0 0 14 5l2-2m0 4v-4h-4"/>',sparkles:'<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6ZM19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"/>',play:'<path d="m8 5 11 7-11 7V5Z"/>','arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>','arrow-right':'<path d="M4 12h16m-7-7 7 7-7 7"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>','shield-check':'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',plus:'<path d="M12 5v14M5 12h14"/>',lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    'sliders-horizontal':'<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',server:'<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6h.01M7 17h.01"/>',monitor:'<rect x="2" y="3" width="20" height="15" rx="2"/><path d="M8 22h8M12 18v4"/>',
    'external-link':'<path d="M12 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-7M13 3h8v8M21 3l-11 11"/>','search-check':'<circle cx="10.5" cy="10.5" r="7.5"/><path d="M16 16l5 5m-14-11 2 2 4-4"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    'check-circle':'<circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/>','alert-triangle':'<path d="m10.3 3.2-9 16A2 2 0 0 0 3 22h18a2 2 0 0 0 1.7-2.8l-9-16a2 2 0 0 0-3.4 0Z"/><path d="M12 9v5M12 18h.01"/>','clock':'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'file-check':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6m-12 7 2 2 4-4"/>',activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',check:'<path d="m5 12 4 4L19 6"/>',database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  };
  const $ = (id) => document.getElementById(id);
  const safe = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${ICON[name] || ICON.shield}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  const state = {page:'workspace',health:false,readiness:null,lab:null,hospital:null,fest:null,suites:[],histories:{},selectedSuite:'',selectedRun:null,filter:'ALL',running:false,updating:false};
  const known = [ {file:'sprout.g01-g10.json',id:'sprout-grocery-g01-g10-v1'},{file:'sprout-known-vulnerabilities.json',id:'sprout-lab-known-vulnerabilities-v1'} ];
  const PAGES = {workspace:'Start here',overview:'Overview',suites:'Security promises',verify:'Live verification',findings:'Findings',history:'Run history',connections:'Connections',guide:'How it works'};
  const descriptions = {
    G01:'Customer A reads their own address',G01B:'Customer B reads their own address',G02:'Customer B tries to read A\'s address',G03:'Anonymous reads Customer A\'s address',
    G04:'Customer A updates their own address',G05:'Customer B tries to update A\'s address',G06:'Anonymous tries to update A\'s address',G07:'Shopkeeper updates product inventory',G08:'Customer tries to update inventory',G09:'Anonymous tries to update inventory',G10:'Customer attempts to reassign address ownership',
    S01:'Customer A reads their own order',S02:'Customer B reads their own order',S03:'Customer A tries to read Customer B\'s order',S04:'Shopkeeper updates store settings',S05:'Customer B tries to modify shopkeeper settings',
    F01:'Student A accesses their own registration',F02:'Student B accesses their own registration',F03:'Student A tries to view Student B private registration',F04:'Fest head edits ticket pricing',F05:'Student B tries to change fest ticket prices'
  };
  const isKnown = (suite) => suite.suiteId.includes('known-vulnerabilities');
  const latest = (sid) => (state.histories[sid] || []).slice().sort((a,b)=>String(b.executedAt).localeCompare(String(a.executedAt)))[0] || null;
  const allRuns = () => Object.values(state.histories).flat().sort((a,b)=>String(b.executedAt).localeCompare(String(a.executedAt)));
  const suiteById = (id) => state.suites.find(s=>s.suiteId===id);
  const currentSuite = () => suiteById(state.selectedSuite) || state.suites[0];
  const fmtDate = (v) => {if(!v)return 'Not run yet';const date=new Date(v);return Number.isNaN(date.getTime())?'Unknown':date.toLocaleString(undefined,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});};
  const verdictChip = (v) => `<span class="status-chip ${['PASS','FAIL','INCONCLUSIVE'].includes(v)?v:'NEVER'}">${safe(v||'NOT RUN')}</span>`;
  const verdictIcon = (v) => v==='FAIL'?'alert-triangle':v==='PASS'?'check-circle':'clock';
  const word = (v) => v===true?'Yes':v===false?'No':'—';
  const short = (v,n=13) => {const x=String(v||'');return x.length>n?x.slice(0,n)+'…':x;};
  function empty(title,description,ico='shield'){return `<div class="empty-state"><div class="empty-icon">${icon(ico)}</div><h4>${safe(title)}</h4><p>${safe(description)}</p></div>`;}
  async function request(path, init = {}, timeout = 60000) {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
    try {
      const response=await fetch(path,{...init,signal:controller.signal,cache:'no-store',headers:{'Accept':'application/json',...(init.body?{'Content-Type':'application/json'}:{}),...(init.headers||{})}});
      const data=await response.json();
      if(!response.ok){const error=new Error(data.reason||data.error||`HTTP ${response.status}`);error.code=data.error;throw error;}
      return data;
    } finally {clearTimeout(timer);}
  }
  function toast(message,failed=false){const el=document.createElement('div');el.className='toast'+(failed?' error':'');el.innerHTML=icon(failed?'alert-triangle':'check-circle')+`<span>${safe(message)}</span>`;$('toast-stack').append(el);setTimeout(()=>el.remove(),5300);}
  function route(page){if(!PAGES[page])return;const advanced=$('sidebar-advanced');if(advanced&&['overview','suites','verify','findings','connections'].includes(page))advanced.open=true;state.page=page;document.querySelectorAll('[data-page]').forEach(e=>e.classList.toggle('active',e.dataset.page===page));document.querySelectorAll('.nav-item[data-route]').forEach(e=>e.classList.toggle('active',e.dataset.route===page));$('crumb').textContent=PAGES[page];$('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'instant'});render();}
  async function refresh({silent=false}={}){
    if(state.updating)return;state.updating=true;try{
      const [health,readiness,lab,hospital,fest,suites]=await Promise.allSettled([request('/api/health',{},4000),request('/api/readiness',{},4000),request('/api/ui/lab-health',{},4000),request('/api/ui/hospital-health',{},4000),request('/api/ui/fest-health',{},4000),request('/api/suites',{},6000)]);
      state.health=health.status==='fulfilled'&&health.value.ok===true;
      state.readiness=readiness.status==='fulfilled'?readiness.value:null;
      state.lab=lab.status==='fulfilled'?lab.value:{reachable:false};
      state.hospital=hospital.status==='fulfilled'?hospital.value:{reachable:false};
      state.fest=fest.status==='fulfilled'?fest.value:{reachable:false};
      if(suites.status==='fulfilled'&&Array.isArray(suites.value)){state.suites=suites.value;state.histories={};await Promise.all(state.suites.map(async s=>{try{const runs=await request(`/api/suites/${encodeURIComponent(s.suiteId)}/runs`,{},6500);state.histories[s.suiteId]=Array.isArray(runs)?runs:[];}catch{state.histories[s.suiteId]=[];}}));}
      if(!state.suites.some(s=>s.suiteId===state.selectedSuite))state.selectedSuite=state.suites[0]?.suiteId||'';
      if(!state.selectedRun)state.selectedRun=allRuns()[0]||null;
      if(state.selectedRun){const updated=allRuns().find(r=>r.runId===state.selectedRun.runId);if(updated)state.selectedRun=updated;}
      if(!silent)toast('Workspace refreshed with live API data.');
    }catch(e){toast(e.message,true);}finally{state.updating=false;render();}
  }
  function topStatus(){const clinic=typeof ws!=='undefined'&&ws.mode==='link'&&ws.linkPlan?.mode==='SUPPORTED_LOCAL';const on=clinic?state.hospital?.reachable===true:ws.mode==='zip'&&state.lab?.reachable===true;$('sidebar-target-dot').className='target-dot '+(on?'online':'offline');$('topbar-live-dot').className='live-dot '+(on?'on':'off');$('topbar-target-label').textContent=clinic?(on?'Clinic demo connected':'Clinic demo offline'):ws.mode==='zip'?(on?'Grocery demo connected':'Grocery demo offline'):'Plan mode · no live scan';const failed=(state.selectedRun?.results||[]).filter(r=>r.verdict==='FAIL').length;const count=$('nav-fail-count');count.textContent=failed;count.hidden=!failed;}
  function renderOverview(){
    const runs=allRuns(),r=runs[0],checks=state.suites.reduce((n,s)=>n+s.cases.length,0);
    const metrics=[
      {name:'Registered promises',value:state.suites.length,note:'Approved test contracts',ico:'file-check'},
      {name:'Available checks',value:checks,note:'From registered suites',ico:'scan'},
      {name:'Latest run verdict',value:r?.aggregateVerdict||'—',note:r?fmtDate(r.executedAt):'No runs recorded yet',ico:verdictIcon(r?.aggregateVerdict)},
      {name:'Recorded runs',value:runs.length,note:'Actual saved verifications',ico:'history'}
    ];
    $('metrics').innerHTML=metrics.map(m=>`<div class="metric-card"><div class="metric-top"><span class="metric-title">${safe(m.name)}</span><span class="metric-icon">${icon(m.ico)}</span></div><div class="metric-number ${String(m.value).length>8?'muted':''}">${safe(m.value)}</div><div class="metric-note">${safe(m.note)}</div></div>`).join('');
    $('overview-suites').innerHTML=state.suites.length?state.suites.map(s=>`<div class="suite-overview-item"><div class="suite-logo ${isKnown(s)?'warn':''}">${icon(isKnown(s)?'shield-alert':'shield-check')}</div><div class="suite-overview-copy"><strong>${safe(s.title)}</strong><small>${s.cases.length} test cases · ${isKnown(s)?'Known vulnerabilities':'Grocery permissions'}</small></div>${verdictChip(latest(s.suiteId)?.aggregateVerdict)}</div>`).join(''):empty('No security promises yet','Load the two reviewed demo suites to begin.','layers')+`<div style="text-align:center;margin-bottom:8px"><button class="btn btn-outline" data-action="register">Load demo suites</button></div>`;
    $('overview-history').innerHTML=runs.length?runs.slice(0,4).map(r=>{const s=suiteById(r.suiteId);return `<div class="activity-item"><div class="activity-marker">${icon(verdictIcon(r.aggregateVerdict))}</div><div class="activity-copy"><strong>${safe(s?.title||r.suiteId)}</strong><small>${safe(fmtDate(r.executedAt))} · ${safe(r.revisionLabel)}</small></div>${verdictChip(r.aggregateVerdict)}</div>`;}).join(''):empty('No activity recorded','Run a suite to create your first evidence-backed security record.','history');
  }
  function renderSuites(){
    const suites=state.suites;
    $('suite-list').innerHTML=suites.length?suites.map(s=>`<article class="suite-card ${state.selectedSuite===s.suiteId?'selected':''}"><div class="suite-card-top"><span class="suite-icon ${isKnown(s)?'warn':''}">${icon(isKnown(s)?'shield-alert':'shield-check')}</span>${verdictChip(latest(s.suiteId)?.aggregateVerdict)}</div><strong>${safe(s.title)}</strong><p>${safe(s.originalRequirement)}</p><div class="suite-card-bottom"><span>${s.cases.length} checks · ${s.cases.filter(c=>c.method==='PATCH').length} write tests</span><button data-select-suite="${safe(s.suiteId)}">Inspect promise ${icon('arrow-right')}</button></div></article>`).join(''):empty('No promises are registered','Load the bundled Sprout & Stone contracts to inspect their explicit permissions.','layers');
    const suite=currentSuite();$('suite-details').innerHTML=suite?`<div class="section-heading"><div><h3>Contract details · ${safe(suite.suiteId)}</h3><p>${safe(suite.originalRequirement)}</p></div><button class="btn btn-outline" data-action="start">${icon('play')} Run this suite</button></div><div class="detail-list">${suite.cases.map(c=>`<div class="detail-case"><span class="case-num">${safe(c.testId)}</span><div class="detail-case-text"><strong>${safe(descriptions[c.testId]||c.operationRef)}</strong><small>${safe(c.actorRef)} → ${safe(c.resourceRef)} · ${safe(c.expectation)}</small></div><span class="case-method ${safe(c.method)}">${safe(c.method)}</span></div>`).join('')}</div>`:`<div class="section-heading"><h3>Review a registered suite</h3></div>${empty('Ready for a confirmed contract','Only registered, reviewed local test suites appear here.','file-check')}`;
  }
  function renderVerify(){const s=currentSuite();$('suite-picker').innerHTML=state.suites.length?state.suites.map(x=>`<option value="${safe(x.suiteId)}" ${x.suiteId===s?.suiteId?'selected':''}>${safe(x.title)}</option>`).join(''):'<option value="">No registered suites</option>';
    $('selected-suite-info').innerHTML=s?`<strong>${safe(s.title)}</strong>${safe(s.originalRequirement)}<div style="margin-top:10px;color:#4e8860;font-size:10px;font-weight:800">${s.cases.length} checks · ${s.cases.filter(c=>c.method==='GET').length} reads · ${s.cases.filter(c=>c.method==='PATCH').length} controlled updates</div>`:'No selected test suite. Load the reviewed demo suites to start.';
    const lab=!!state.lab?.reachable,registered=!!state.readiness?.adapters?.length;
    $('run-status').innerHTML=`${icon(lab&&registered?'check-circle':'alert-triangle')}<span>${lab&&registered?'Verifier adapter registered and grocery lab reachable':!lab?'Grocery lab is offline. Start it on port 4200.':'No trusted adapter registered. Check verifier setup.'}</span>`;
    $('launch-run').disabled=!s||!lab||!registered||state.running;
    $('launch-run').innerHTML=state.running?`<span class="loading-spinner"></span> Running real HTTP checks…`:`${icon('play')} Review & run tests ${icon('arrow-right')}`;
    $('run-case-preview').innerHTML=s?s.cases.map(c=>`<div class="preview-row"><span class="case-num">${safe(c.testId)}</span><div style="flex:1"><strong>${safe(descriptions[c.testId]||c.operationRef)}</strong><small>${safe(c.actorRef)} / ${safe(c.resourceRef)}</small></div><span class="case-method ${safe(c.method)}">${safe(c.method)}</span><span class="preview-exp">${safe(c.expectation)}</span></div>`).join(''):empty('Nothing to preview','Register a suite first.','layers');
    const r=latest(s?.suiteId);$('run-latest-results').innerHTML=r?`<div class="section-heading"><div><h3>Last verification of this promise</h3><p>${safe(fmtDate(r.executedAt))} · ${safe(r.revisionLabel)}</p></div><button class="text-action" data-action="view-latest">Open findings ${icon('arrow-right')}</button></div>${runSummary(r)}`:`<div class="section-heading"><div><h3>Latest verification</h3><p>Your result will appear here after a live run</p></div></div>${empty('No checks run for this promise','Use Review & run tests to create a real result.','scan')}`;
  }
  function runSummary(r){const p=r.results.filter(x=>x.verdict==='PASS').length,f=r.results.filter(x=>x.verdict==='FAIL').length,i=r.results.filter(x=>x.verdict==='INCONCLUSIVE').length;return `<div class="run-overview-card"><span class="large-icon ${safe(r.aggregateVerdict)}">${icon(verdictIcon(r.aggregateVerdict))}</span><div><strong>${safe(r.aggregateVerdict==='FAIL'?'Authorization issue detected':r.aggregateVerdict==='PASS'?'All required checks verified':'Could not reach a definitive conclusion')}</strong><small>${r.results.length} real checks · ${p} passed · ${f} failed · ${i} inconclusive</small></div>${verdictChip(r.aggregateVerdict)}</div>${r.comparison?`<div style="font-size:10px;color:#678d70">Compared with previous matching contract: <strong>${safe(r.comparison.aggregateTransition)}</strong></div>`:''}`;}
  function renderFindings(){const r=state.selectedRun||allRuns()[0];if(!r){$('findings-summary').innerHTML='';$('findings-subtitle').textContent='No completed verification run';$('findings-table').innerHTML=empty('No security findings yet','Execute a real test suite to view the evidence and observed HTTP responses.','shield-check');return;}
    const counts={PASS:0,FAIL:0,INCONCLUSIVE:0};r.results.forEach(t=>{if(t.verdict in counts)counts[t.verdict]++;});
    $('findings-summary').innerHTML=`<div class="summary-strip"><div class="summary-tile"><small>Overall verdict</small><div style="margin-top:15px">${verdictChip(r.aggregateVerdict)}</div></div><div class="summary-tile pass"><small>Passed checks</small><strong>${counts.PASS}</strong></div><div class="summary-tile fail"><small>Confirmed failures</small><strong>${counts.FAIL}</strong></div><div class="summary-tile"><small>Inconclusive checks</small><strong>${counts.INCONCLUSIVE}</strong></div></div>`;
    $('findings-subtitle').textContent=`${r.suiteId} · ${fmtDate(r.executedAt)} · ${r.revisionLabel}`;
    document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.filter));
    const visible=state.filter==='ALL'?r.results:r.results.filter(t=>t.verdict===state.filter);
    $('findings-table').innerHTML=visible.length?`<div style="overflow-x:auto"><table class="results-table"><thead><tr><th>Case</th><th>Verification / policy</th><th>Verdict</th><th>HTTP</th><th>Evidence</th><th></th></tr></thead><tbody>${visible.map(x=>`<tr data-test-id="${safe(x.testId)}"><td><strong>${safe(x.testId)}</strong></td><td><strong>${safe(descriptions[x.testId]||x.reasonCode)}</strong><small>${safe(x.reasonCode)}</small></td><td>${verdictChip(x.verdict)}</td><td>${x.observed?.status===null||x.observed?.status===undefined?'—':safe(x.observed.status)}</td><td><span style="font-size:10px;color:#688873">${x.observed?.fixtureMatched===true?'Private marker matched':x.observed?.stateChanged===true?'State changed':x.observed?.stateChanged===false?'State unchanged':'See details'}</span></td><td><button class="tiny-link" data-detail="${safe(x.testId)}">Details ${icon('arrow-right')}</button></td></tr>`).join('')}</tbody></table></div>`:empty('No matching findings','Try another filter to review the rest of the run.','search-check');
  }
  function renderHistory(){const runs=allRuns();$('history-list').innerHTML=runs.length?runs.map(r=>{const s=suiteById(r.suiteId);return `<div class="history-row"><span class="history-icon">${icon(verdictIcon(r.aggregateVerdict))}</span><div class="history-info"><strong>${safe(s?.title||r.suiteId)}</strong><small>${safe(fmtDate(r.executedAt))} · ${safe(r.revisionLabel)} · ${r.results.length} cases · contract ${safe(short(r.contractHash,12))}</small></div><span class="history-transition">${r.comparison?safe(r.comparison.aggregateTransition):'—'}</span>${verdictChip(r.aggregateVerdict)}<div class="history-actions"><button data-open-run="${safe(r.runId)}">View</button></div></div>`}).join(''):empty('No saved runs yet','Run a registered suite to start an honest, comparable security history.','history');}
  function renderConnections(){const adapter=!!state.readiness?.adapters?.length,lab=!!state.lab?.reachable;const items=[
    {name:'Verifier API',info:'CanTheySeeIt? core verification engine',url:'127.0.0.1:4100',status:state.health,ico:'server',yes:'Connected',no:'Unavailable'},
    {name:'Trusted adapter',info:'Reviewed Sprout & Stone fixture integration',url:'sprout-stone-local-grocery-lab',status:adapter,ico:'plug',yes:'Registered',no:'Needs setup'},
    {name:'Grocery test lab',info:'Actual local synthetic shopping application',url:'127.0.0.1:4200',status:lab,ico:'shopping-bag',yes:'Reachable',no:'Offline'},
    {name:'College Fest lab',info:'AETHER fictional college fest with two deliberate permission errors',url:'127.0.0.1:4400',status:state.fest?.reachable===true,ico:'users',yes:'Reachable',no:'Offline'},
    {name:'Fictional hospital lab',info:'Independent local patient-file training application',url:'127.0.0.1:4300',status:state.hospital?.reachable===true,ico:'shield-check',yes:'Reachable',no:'Offline'}
  ];$('connection-cards').innerHTML=items.map(x=>`<div class="connection-card"><div class="connection-card-top"><span class="connection-card-icon">${icon(x.ico)}</span>${verdictChip(x.status?'PASS':'NEVER')}</div><strong>${safe(x.name)}</strong><p>${safe(x.info)} · ${safe(x.status?x.yes:x.no)}</p><code>${safe(x.url)}</code></div>`).join('');}
  function render(){topStatus();renderWorkspace();renderOverview();renderSuites();renderVerify();renderFindings();renderHistory();renderConnections();}
  async function register(){if(state.running)return;const btn=$('suite-register');if(btn)btn.disabled=true;try{
      let saved=0;for(const entry of known){const contract=await request('/presets/'+entry.file,{},5000);if(contract.suiteId!==entry.id||contract.targetProfileId!=='sprout-stone-local-grocery-lab'||contract.confirmed!==true)throw new Error('Invalid reviewed suite preset');
        try{await request('/api/suites',{method:'POST',body:JSON.stringify(contract)},10000);saved++;}catch(e){if(e.code!=='SUITE_ALREADY_EXISTS_OR_STORE_ERROR')throw e;}}
      await refresh({silent:true});toast(saved?`${saved} reviewed suite${saved===1?'':'s'} registered. You can now run them.`:'Demo suites were already registered.');route('suites');
    }catch(e){toast(`Could not register suites: ${e.message}`,true);}finally{if(btn)btn.disabled=false;}}
  function openRunModal(){const s=currentSuite();if(!s){toast('Register a suite first.',true);route('suites');return;}const festSuite=s.targetProfileId==='aetherfest-college-lab';if(!(festSuite?state.fest?.reachable:state.lab?.reachable)){toast(festSuite?'Start AETHER College Fest on port 4400.':'Start the grocery lab on port 4200 first.',true);route('connections');return;}
    $('modal-summary').innerHTML=`<div><small>CONFIRMED PROMISE</small><strong>${safe(s.title)}</strong></div><div><small>LIVE CHECKS</small><strong>${s.cases.length} total · ${s.cases.filter(c=>c.method==='PATCH').length} PATCH</strong></div>`;
    $('modal-desc').textContent=festSuite?'This executes real authorization checks against the local College Fest backend. Pricing changes are verified and reset.':'This executes real HTTP requests against the local synthetic grocery lab. The result is calculated by the verifier API.';
    $('approve-writes').checked=false;$('revision-label').value=`demo-${new Date().toISOString().slice(0,16).replace('T','-')}`;
    $('run-modal').hidden=false;document.body.style.overflow='hidden';$('revision-label').focus();}
  function closeModals(){document.querySelectorAll('.modal-backdrop').forEach(e=>e.hidden=true);document.body.style.overflow='';}
  async function executeRun(){const s=currentSuite();if(!s)return;const revisionLabel=$('revision-label').value.trim();const needsWrites=s.cases.some(c=>c.method==='PATCH');const approved=$('approve-writes').checked;
    if(!revisionLabel||revisionLabel.length>100){toast('Enter a revision label of up to 100 characters.',true);return;}
    if(needsWrites&&!approved){toast('Explicitly approve disposable synthetic PATCH tests before running.',true);return;}
    closeModals();state.running=true;render();route('verify');toast(`Executing ${s.cases.length} actual checks against the local lab…`);
    try{const r=await request(`/api/suites/${encodeURIComponent(s.suiteId)}/run`,{method:'POST',body:JSON.stringify({revisionLabel,approveSyntheticWrites:approved})},150000);
      if(!r.runId||!Array.isArray(r.results))throw new Error('Unexpected verifier response');
      state.selectedRun=r;await refresh({silent:true});state.selectedRun=r;route('findings');toast(`Verification finished: ${r.aggregateVerdict}. ${r.results.length} results saved.`);
    }catch(e){toast(`Verification unavailable: ${e.message}`,true);await refresh({silent:true});}finally{state.running=false;render();}}
  function showDetail(testId){const r=state.selectedRun||allRuns()[0];const t=r?.results.find(x=>x.testId===testId);if(!t)return;const s=suiteById(r.suiteId),c=s?.cases.find(x=>x.testId===testId),obs=t.observed||{};
    $('detail-title').textContent=`${testId} · ${descriptions[testId]||'Verification evidence'}`;
    $('detail-content').innerHTML=`<div style="margin:15px 0">${verdictChip(t.verdict)} <span style="color:#91a196;font-size:10px;margin-left:9px">${safe(fmtDate(t.checkedAt))}</span></div><div class="detail-explanation">${safe(t.explanation)}</div>${[
      ['Reason code',t.reasonCode],['Expected policy',c?`${c.expectation} · ${c.method}`:'—'],['Authenticated actor',c?.actorRef||'—'],['Protected synthetic resource',c?.resourceRef||'—'],['Observed HTTP status',obs.status??'No valid response'],['Exact private marker matched',word(obs.fixtureMatched)],['Persisted state changed',word(obs.stateChanged)],['Only the intended fields changed',word(obs.intendedChange)],['Observation error',obs.error||'None'],['Run revision',r.revisionLabel]
    ].map(([a,b])=>`<div class="detail-pair"><span>${safe(a)}</span><strong>${safe(b)}</strong></div>`).join('')}<p style="font-size:10px;line-height:1.7;color:#97a79b">Evidence is sanitized by the verifier. Raw tokens and protected response bodies are not displayed.</p>`;
    $('detail-modal').hidden=false;document.body.style.overflow='hidden';}
  document.addEventListener('click',(e)=>{
    const el=e.target.closest('[data-route],[data-action],[data-select-suite],[data-open-run],[data-filter],[data-detail]');if(!el)return;
    if(el.dataset.route){route(el.dataset.route);return;}
    if(el.dataset.selectSuite){state.selectedSuite=el.dataset.selectSuite;render();return;}
    if(el.dataset.openRun){const r=allRuns().find(x=>x.runId===el.dataset.openRun);if(r){state.selectedRun=r;route('findings');}return;}
    if(el.dataset.filter){state.filter=el.dataset.filter;renderFindings();return;}
    if(el.dataset.detail){showDetail(el.dataset.detail);return;}
    if(el.dataset.action==='close-modal'){closeModals();return;}
    if(el.dataset.action==='register'){register();return;}
    if(el.dataset.action==='start'){openRunModal();return;}
    if(el.dataset.action==='view-latest'){state.selectedRun=latest(currentSuite()?.suiteId);route('findings');}
  });
  $('suite-picker').addEventListener('change',e=>{state.selectedSuite=e.target.value;render();});
  $('header-refresh').addEventListener('click',()=>refresh());$('overview-refresh').addEventListener('click',()=>refresh());$('connections-refresh').addEventListener('click',()=>refresh());$('history-refresh').addEventListener('click',()=>refresh());
  $('suite-register').addEventListener('click',register);$('launch-run').addEventListener('click',openRunModal);$('confirm-run').addEventListener('click',executeRun);
  $('mobile-menu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
  document.querySelectorAll('.modal-backdrop').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)closeModals();}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModals();});
  // Beginner experience: familiar words at the UI boundary; real reviewed cases in the backend.
  // No simulated verdicts, arbitrary URL scanning, or execution of uploaded website source.
  const friendlyGroups = [
    { id:'privacy', icon:'lock', category:'PERSONAL INFORMATION',
      title:'People should only see their own private information',
      detail:'Keep each customer’s orders and delivery addresses private.',
      ruleIds:['orders.owner_read','addresses.owner_read'] },
    { id:'my-edits', icon:'file-check', category:'PERSONAL CHANGES',
      title:'People should only edit their own information',
      detail:'A customer may change their own address — not someone else’s.',
      ruleIds:['addresses.owner_edit'] },
    { id:'admin', icon:'shield-check', category:'ADMIN PROTECTION',
      title:'Only admins should change important settings',
      detail:'Customers must not change shop settings or stock levels.',
      ruleIds:['settings.owner_edit','inventory.owner_edit'] },
    { id:'visitors', icon:'users', category:'VISITORS',
      title:'People who aren’t logged in shouldn’t see private information',
      detail:'Check that a visitor cannot read a private delivery address.',
      ruleIds:['visitors.private_read'] }
  ];
  const explainTests = {
    S01:'Customer A can see their own order', S02:'Customer B can see their own order',
    S03:'Customers cannot see someone else’s private order',
    S04:'The shopkeeper can change store settings', S05:'Customers cannot change shopkeeper settings',
    G01:'Customer A can see their own delivery address', G01B:'Customer B can see their own delivery address',
    G02:'Customers cannot see another customer’s address',
    G03:'Visitors cannot see private addresses',
    G04:'Customers can change their own address', G05:'Customers cannot change another person’s address',
    G06:'Visitors cannot change private addresses',
    G07:'The shopkeeper can update stock', G08:'Customers cannot change stock',
    G09:'Visitors cannot change stock', G10:'Customers cannot take ownership of another address',
    H01:'Patient A can view their own medical record',H02:'Patient B can view their own medical record',
    H03:'Patients cannot see each other’s personal records',H04:'Logged-out visitors cannot see patient records',
    H05:'Patients may update their own contact notes',H06:'Patients cannot edit another patient’s contact notes',
    H07:'Assigned clinician can view the assigned patient’s record',H08:'Patients cannot alter clinician-only notes',
    H09:'Hospital admin can update hospital settings',H10:'Ordinary patients cannot modify hospital settings',
    H11:'Patient A can view their own medical file',H12:'Patients cannot view another patient’s private files',
    H13:'Patients cannot change who owns a medical record',
    F01:'Student A can see their own fest registration',F02:'Student B can see their own fest registration',
    F03:'Student A cannot see Student B private fest registration',F04:'Only fest head can edit prices',F05:'Students cannot edit fest ticket prices'
  };
  const suggestedFixes = {
    S03:'Before showing an order, check on the server that the signed-in customer owns that order.',
    S05:'Require the shopkeeper role on the server before changing shop settings. Hiding the admin screen is not enough.',
    F03:'Before returning registration details, confirm the signed-in student owns the requested registration.',
    F05:'Require the fest head role in the backend before permitting ticket-price or event settings changes.',
    G02:'Check the address owner against the signed-in customer before returning private fields.',
    G03:'Require a valid login before serving private addresses.',
    G05:'Check ownership before saving an address update, then verify the record did not change for another user.',
    G06:'Reject changes from visitors who have not signed in.',
    G08:'Require an authorized staff/owner role before updating product stock.',
    G09:'Require a valid authorized session before changing inventory.',
    G10:'Never let ordinary customers update protected fields such as ownerUserId.',
    H03:'On the server, confirm that the signed-in patient owns the record before returning details.',
    H04:'Require login for patient records and prove anonymous requests cannot read the private marker.',
    H06:'Compare the authenticated patient against the stored record owner before any update.',
    H08:'Only an assigned clinician should change clinical notes; block patient-side modification.',
    H10:'Enforce an admin role on the settings update route, not just on the admin screen.',
    H12:'Check file ownership on the server before returning the document. A known file ID must never bypass permissions.',
    H13:'Treat owner IDs as protected server-managed fields, not customer-editable inputs.'
  };
  const hospitalGroups = [
    {id:'privacy',icon:'lock',category:'PRIVATE PATIENT RECORDS',title:'Patients should only see their own records',detail:'Check that one patient cannot view another patient’s record.'},
    {id:'my-edits',icon:'file-check',category:'PATIENT INFORMATION',title:'Patients should only edit their own information',detail:'Check personal note updates, denied cross-patient edits, and persisted state.'},
    {id:'admin',icon:'shield-check',category:'HOSPITAL ADMIN',title:'Only admins should change important hospital settings',detail:'Patients must not be able to change organization settings.'},
    {id:'visitors',icon:'users',category:'VISITOR PRIVACY',title:'Logged-out visitors should not see patient files',detail:'Request a protected record without any login.'},
    {id:'clinician',icon:'users',category:'RECOMMENDED • CLINICAL ROLES',title:'Only assigned clinicians should access a patient’s clinical record',detail:'Check assigned clinician access and block patients changing clinical notes.'},
    {id:'files',icon:'lock',category:'RECOMMENDED • FILE PRIVACY',title:'Keep patient file downloads private',detail:'Even knowing a file ID must not reveal another patient’s document.'},
    {id:'protected-fields',icon:'shield-alert',category:'RECOMMENDED • RECORD INTEGRITY',title:'Prevent changes to who owns a patient record',detail:'Check that protected fields cannot be reassigned.'}
  ];
  const collegeGroups=[
    {id:'privacy',icon:'lock',category:'COLLEGE FEST PRIVACY',title:'Students should only see their own registrations',detail:'Use valid student A and B sessions to test private registrations.',ruleIds:['fest.registration.owner_read']},
    {id:'admin',icon:'shield-check',category:'FEST MANAGEMENT',title:'Only the fest head can edit public details and ticket prices',detail:'Test that a student cannot change the ticket price through the API.',ruleIds:['fest.settings.head_edit']}
  ];
  const ws = {mode:'link',upload:null,linkPlan:null,groceryOptions:[],options:[],chosen:new Set(),selected:new Set(),result:null,processing:false,error:'',note:''};
  // Sector choices come from a finite backend catalog, not text classification or an LLM.
  const sectors = {catalog:null,id:null,features:new Set(),core:new Set(['own-view','guest-private']),loading:true};
  const selectedSector = () => sectors.catalog?.sectors.find(x=>x.id===sectors.id);
  function invalidateSectorPlan(){
    ws.linkPlan=null;ws.options=[];ws.chosen=new Set();ws.selected=new Set();ws.result=null;ws.error='';
  }
  async function loadSectorCatalog(){
    try{
      const payload=await request('/api/workspace/sectors',{},7000);
      if(!Array.isArray(payload.sectors)||payload.sectors.length!==4||!Array.isArray(payload.coreRules))throw Error('Incomplete website category list.');
      sectors.catalog=payload;sectors.loading=false;
    }catch(e){sectors.loading=false;ws.error='Could not load website categories: '+e.message;}
    renderWorkspace();
  }
  function renderSectorWizard(){
    const box=$('workspace-sector-cards'),data=sectors.catalog;
    if(!box)return;
    if(!data){box.innerHTML='<p class="workspace-muted">Website categories are unavailable. Refresh the page to try again.</p>';return;}
    const logos={restaurant:'🍽️',retail:'🛒',clinic:'🏥',campus:'🎓'};
    box.innerHTML=data.sectors.map(s=>`<label class="sector-choice ${sectors.id===s.id?'selected':''}">
      <input type="radio" name="workspace-sector" value="${safe(s.id)}" ${sectors.id===s.id?'checked':''}/>
      <span class="sector-emoji" aria-hidden="true">${logos[s.id]||'🏪'}</span>
      <span><strong>${safe(s.name)}</strong><small>${safe(s.subtitle)}</small></span><span class="sector-choice-tick" aria-hidden="true">✓</span></label>`).join('');
    const chosen=selectedSector();$('workspace-sector-options').hidden=!chosen;
    if(chosen){
      $('workspace-sector-features').innerHTML=chosen.features.map(f=>`<label class="sector-toggle ${sectors.features.has(f.id)?'checked':''}"><input type="checkbox" data-sector-feature="${safe(f.id)}" ${sectors.features.has(f.id)?'checked':''}/><span><strong>${safe(f.title)}</strong><small>${safe(f.detail)}</small></span></label>`).join('');
      $('workspace-core-rules').innerHTML=data.coreRules.map(r=>`<label class="sector-toggle ${sectors.core.has(r.id)?'checked':''}"><input type="checkbox" data-sector-core="${safe(r.id)}" ${sectors.core.has(r.id)?'checked':''}/><span><strong>${safe(r.title)}</strong><small>${safe(r.detail)}</small></span></label>`).join('');
    }
    const n=sectors.core.size+sectors.features.size;
    $('workspace-sector-feedback').textContent=chosen?
      `${n} ${n===1?'choice':'choices'} selected for ${chosen.name}. ${n?'Now add your website link and preview the test plan.':'Choose at least one feature or rule.'}`:
      'Select your type of website to show the right questions.';
    $('workspace-plan-link').disabled=ws.processing||!chosen||n===0;
  }
  const isFestZip=()=>ws.mode==='zip'&&ws.upload?.projectId==='aetherfest-college-lab';
  const activeGroups = () => ws.mode==='link'?hospitalGroups:isFestZip()?collegeGroups:friendlyGroups;
  const chosenRules = () => activeGroups().filter(g=>ws.chosen.has(g.id));
  function syncRuleIds(){
    const available=new Set(ws.options.map(x=>x.id));
    ws.selected=new Set(chosenRules().flatMap(g=>ws.mode==='link'?[g.id]:g.ruleIds).filter(x=>available.has(x)));
  }
  function supportedGroup(group){const available=new Set(ws.options.map(x=>x.id));return (ws.mode==='link'?[group.id]:group.ruleIds).every(id=>available.has(id));}
  function switchWebsiteMode(mode){
    ws.mode=mode;ws.chosen=new Set();ws.selected=new Set();ws.result=null;ws.error='';
    ws.options=mode==='zip'?ws.groceryOptions:(ws.linkPlan?.options||[]);
    $('workspace-mode-zip').classList.toggle('active',mode==='zip');$('workspace-mode-link').classList.toggle('active',mode==='link');
    $('workspace-mode-zip').setAttribute('aria-pressed',String(mode==='zip'));$('workspace-mode-link').setAttribute('aria-pressed',String(mode==='link'));
    $('workspace-zip-form').hidden=mode==='link';$('workspace-link-form').hidden=mode==='zip';
    $('workspace-revision').value=mode==='link'?'hospital-synthetic-v1':'grocery-demo-v1';
    syncRuleIds();renderWorkspace();
  }
  function renderLinkPlan(){
    const box=$('workspace-link-plan');const p=ws.linkPlan;
    if(!p){box.innerHTML='';return;}
    const runnable=p.mode==='SUPPORTED_LOCAL';
    const common=p.generalCases||[],extra=p.extraCases||[];
    box.innerHTML=`<div class="site-plan-header"><div class="sector-plan-title"><strong>${safe(p.sectorName||'Your website')} · Test plan</strong><span class="sector-plan-pill ${runnable?'supported':'planning'}">${runnable?'Local test available':'Plan only · setup needed'}</span></div>
      <p>${safe(p.rationale)}</p><small>Website: ${safe(p.url)}</small></div>
      <div class="site-plan-notice">${safe(runnable?'This specific local clinic demo can run its supported checks after it is started. Every test uses synthetic patient data.':
         'This is a RECOMMENDED PLAN, not a security result. We have not contacted or tested the website. To run these checks you need a supported test connection and fake accounts.')}</div>
      <div class="sector-plan-count"><strong>${common.length+extra.length} proposed checks</strong><span>from the choices you ticked</span></div>
      ${common.length?`<details class="sector-check-details" open><summary>${common.length} general privacy and access checks</summary><div>${common.map(c=>`<div class="sector-check-line"><span aria-hidden="true">✓</span><div><strong>${safe(c.title)}</strong><small>${safe(c.why)}</small></div></div>`).join('')}</div></details>`:''}
      ${extra.length?`<details class="sector-check-details" open><summary>${extra.length} extra checks for this website type</summary><div>${extra.map(c=>`<div class="sector-check-line"><span aria-hidden="true">✦</span><div><strong>${safe(c.title)}</strong><small>${safe(c.why)}</small><em>${safe(c.execution==='AVAILABLE_ON_SAMPLE'?'Sample check available with confirmed local setup':'Requires a supported test connection')}</em></div></div>`).join('')}</div></details>`:''}
      ${!runnable?'<div class="sector-setup-card"><strong>What happens next?</strong><p>Save this plan or connect a supported local test version with two fictional accounts. We will not label an untested website PASS or FAIL.</p></div>':''}`;
  }
  async function planWebsiteLink(){
    if(ws.processing)return;
    if(!selectedSector()){ws.error='Choose your website type first.';renderWorkspace();return;}
    if(!sectors.core.size&&!sectors.features.size){ws.error='Tick at least one feature or protection rule.';renderWorkspace();return;}
    if(!$('workspace-link-url').value.trim()){ws.error='Add the website link to create a plan.';renderWorkspace();return;}
    ws.processing=true;ws.linkPlan=null;ws.options=[];ws.error='';ws.result=null;renderWorkspace();
    try{
      const plan=await request('/api/workspace/plan-link',{method:'POST',body:JSON.stringify({
        websiteUrl:$('workspace-link-url').value.trim(),
        sectorId:sectors.id,selectedFeatures:[...sectors.features],selectedCoreRules:[...sectors.core]
      })},15000);
      if(!plan.planId||!Array.isArray(plan.generalCases))throw Error('The server returned an incomplete plan.');
      ws.linkPlan=plan;ws.options=plan.options||[];
      if(plan.mode==='SUPPORTED_LOCAL'){
        await refresh({silent:true});
        const mapped={ 'own-view':'privacy','own-edit':'my-edits','admin-change':'admin','guest-private':'visitors',
          'clinic-files':'files','clinic-clinician':'clinician','clinic-notes':'clinician','clinic-ownership':'protected-fields' };
        ws.chosen=new Set([...sectors.core,...sectors.features].map(x=>mapped[x]).filter(x=>plan.options.some(o=>o.id===x)));
      }else ws.chosen=new Set();
      syncRuleIds();
      toast(plan.mode==='SUPPORTED_LOCAL'?'Local clinic recognized. Review your selected tests.':'Your test plan is ready. No website was scanned.');
    }catch(e){ws.error=e.message||'Could not build the test plan.';toast(ws.error,true);}
    finally{ws.processing=false;renderWorkspace();}
  }
  function useHospitalDemo(){
    switchWebsiteMode('link');sectors.id='clinic';
    sectors.features=new Set(['clinic-clinician','clinic-files']);
    sectors.core=new Set(['own-view','guest-private','admin-change']);
    $('workspace-link-url').value='http://127.0.0.1:4300/';
    renderSectorWizard();planWebsiteLink();
  }
  async function loadWorkspaceOptions(){
    try{
      const data=await request('/api/workspace/options',{},7000);
      ws.groceryOptions=Array.isArray(data.rules)?data.rules:[];
      if(ws.mode==='zip')ws.options=ws.groceryOptions;
      ws.error='';syncRuleIds();renderWorkspace();
    }catch(e){ws.error=`Cannot load permission options: ${e.message}`;renderWorkspace();}
  }
  function updateWorkspaceRunButton(){
    const hasWrites=ws.options.some(rule=>ws.selected.has(rule.id)&&rule.writes);
    const lab=ws.mode==='zip'?(isFestZip()?state.fest?.reachable===true:state.lab?.reachable===true):(ws.linkPlan?.mode==='SUPPORTED_LOCAL'&&state.hospital?.reachable===true);
    const requiresConsent=hasWrites&&!$('workspace-write-approval').checked;
    const ready=(ws.mode==='zip'?!!ws.upload:(ws.linkPlan?.mode==='SUPPORTED_LOCAL'))&&lab&&state.health&&ws.selected.size>0&&!requiresConsent&&!ws.processing;
    $('workspace-run').disabled=!ready;
    $('workspace-run').innerHTML=ws.processing?`${icon('clock')} Checking your website…`:`${icon('shield-check')} Check my website ${icon('arrow-right')}`;
    const errEl=$('workspace-error');errEl.hidden=!ws.error;if(ws.error)errEl.textContent=ws.error;
    const status=$('workspace-readiness');status.className='workspace-readiness '+(lab?'ready':'unready');
    status.textContent=ws.mode==='link'?(ws.linkPlan?.mode!=='SUPPORTED_LOCAL'?'Your plan is ready. Live tests require a supported local test connection; no website was contacted.':lab?'✓ Fictional hospital is connected and ready for approved test accounts.':'Start the fictional hospital in another terminal: npm.cmd run hospital:start'):(lab?'✓ '+(isFestZip()?'College Fest':'Grocery')+' test website is connected and ready.':isFestZip()?'Start the AETHER College Fest website: npm run fest:start':'Start the grocery test website: npm run lab:start');
    const intake=ws.mode==='link'?!!ws.linkPlan:!!ws.upload;
    const step=ws.result?4:ws.processing?3:intake&&ws.selected.size?3:intake?2:1;
    document.querySelectorAll('[data-progress-step]').forEach(el=>{
      const n=Number(el.dataset.progressStep);el.classList.toggle('active',n===step);el.classList.toggle('done',n<step);
    });
    document.querySelectorAll('.experience-card').forEach(el=>{
      el.classList.toggle('experience-step-current',(el.id==='workspace-section-upload'&&step===1)||
        (el.id==='workspace-section-rules'&&step===2)||(el.id==='workspace-section-run'&&step===3));
    });
  }
  function renderWorkspace(){
    if(!$('workspace-rules'))return;
    renderSectorWizard();
    if(ws.mode==='link' && ws.linkPlan?.mode!=='SUPPORTED_LOCAL'){
      $('workspace-rules').innerHTML=ws.linkPlan?'<div class="sector-setup-card"><strong>Your choices have been saved in the proposed plan above.</strong><p>Live checks are unavailable for this link until a trusted staging integration exists. Nothing has been scanned or marked as safe.</p></div>':
        '<p class="workspace-muted">First select your website category and rules above, then preview the proposed checks.</p>';
    }else $('workspace-rules').innerHTML=ws.options.length?activeGroups().map(g=>{
      const supported=supportedGroup(g), checked=ws.chosen.has(g.id);
      return `<label class="experience-rule-card ${checked?'checked':''} ${supported?'':'unsupported'}">
        <input type="checkbox" data-workspace-group="${safe(g.id)}" ${checked?'checked':''} ${supported?'':'disabled'} />
        <span class="experience-rule-icon">${icon(g.icon)}</span>
        <span class="experience-rule-copy"><span class="experience-rule-category">${safe(g.category)}</span><strong>${safe(g.title)}</strong><small>${safe(g.detail)}</small>
          ${supported?'':`<em>Not available for this website</em>`}</span>
        <span class="experience-rule-check" aria-hidden="true">${checked?'✓':''}</span>
      </label>`;
    }).join(''):`<p class="workspace-muted">${safe(ws.error||(ws.mode==='link'?'Live tests require a supported local synthetic integration; read the suggested plan above.':'Loading available security rules…'))}</p>`;
    const count=ws.chosen.size;
    $('workspace-rules-label').textContent=ws.mode==='link'?(ws.linkPlan?.mode==='SUPPORTED_LOCAL'?'Live checks available for the approved clinic demo':'Plan first · verify only when supported'):(isFestZip()?'2 college-event permission rules':'4 easy-to-understand options');
    const rail=$('workspace-rail-help')?.querySelector('p');
    if(rail)rail.textContent=ws.mode==='link'?'For clinic demos, run npm.cmd run hospital:start to connect fictional patient accounts. All other URL plans need a reviewed adapter before checks can run.':(isFestZip()?'The AETHER college fest runs on port 4400 with fictional accounts. The two intentional server-side bugs should FAIL the checks.':'The grocery shop runs on port 4200 with fictional accounts.');
    $('workspace-selection-summary').textContent=ws.mode==='link'&&ws.linkPlan?.mode!=='SUPPORTED_LOCAL'?'Plan only — no security results have been generated.':count?`${count} promise${count===1?'':'s'} selected. We’ll create the matching checks and confirm the test accounts work.`:'Choose at least one promise.';
    const status=$('workspace-upload-state');status.className='workspace-upload-state '+(ws.upload?'good':ws.error?'bad':'');
    status.textContent=ws.upload?`✓ ${ws.upload.fileName} — supported sample recognized`:(ws.error||'No website selected yet.');
    renderLinkPlan();
    $('workspace-drop-label').textContent=ws.upload?`${ws.upload.fileName} is ready. Click to change it.`:'Drop your website ZIP here, or browse files';
    $('workspace-results').hidden=!ws.result;
    if(ws.result)renderWorkspaceResults();
    updateWorkspaceRunButton();
  }
  async function uploadWorkspaceFile(file){
    if(!file)return;
    ws.upload=null;ws.error='';ws.result=null;
    if(!/\.zip$/i.test(file.name)||file.size>8*1024*1024||file.size===0){
      ws.error='Choose a .zip file smaller than 8 MB.';renderWorkspace();return;
    }
    ws.processing=true;renderWorkspace();
    $('workspace-upload-state').textContent=`Inspecting ${file.name}…`;
    try{
      const chosenZipCategory=$('workspace-zip-category').value;
      const data=await request('/api/workspace/upload',{method:'POST',body:await file.arrayBuffer(),
        headers:{'Content-Type':'application/zip','X-Archive-Name':encodeURIComponent(file.name)}},30000);
      if(!data.uploadId||!['sprout-stone-local-grocery-lab','aetherfest-college-lab'].includes(data.projectId))throw new Error('Unexpected website response');
      const actualCategory=data.projectId==='aetherfest-college-lab'?'campus':'retail';
      if(chosenZipCategory!==actualCategory)throw new Error('This ZIP is for '+(actualCategory==='campus'?'College Events':'Grocery')+'. Select the matching category above and upload again.');
      ws.upload={...data,fileName:file.name};
      const options=await request('/api/workspace/options?profileId='+encodeURIComponent(data.projectId),{},7000);
      ws.options=options.rules||[];ws.chosen=new Set();ws.selected=new Set();ws.error='';
      if(data.projectId==='aetherfest-college-lab'){sectors.id='campus';sectors.features=new Set(['campus-signups','campus-organizers']);}
      toast('Approved '+(isFestZip()?'College Fest':'grocery')+' website recognized. Choose the security promises below.');
    }catch(e){ws.error=e.message||'Could not inspect the website ZIP.';toast(ws.error,true);}
    finally{ws.processing=false;renderWorkspace();}
  }
  async function useSample(){
    $('workspace-zip-category').value='retail';
    ws.error='';ws.processing=true;renderWorkspace();
    try{
      const response=await fetch('/api/workspace/sample-zip',{cache:'no-store'});
      if(!response.ok)throw new Error('The sample website is unavailable.');
      const blob=await response.blob();
      await uploadWorkspaceFile(new File([blob],'SproutStone_Approved_Website.zip',{type:'application/zip'}));
      if(ws.upload && !ws.chosen.size){ws.chosen=new Set(['privacy','admin']);syncRuleIds();$('workspace-prompt-note').textContent='We suggested two sample promises. Please review them before running your checks.';}
    }catch(e){ws.error=e.message||'Could not load the sample ZIP.';toast(ws.error,true);}
    finally{ws.processing=false;renderWorkspace();}
  }
  function suggestFromPrompt(){
    const value=$('workspace-prompt').value.toLowerCase().trim();
    if(!value){$('workspace-prompt-note').textContent='Add a short description of the website first.';return;}
    const picked=[];
    if(/own|private|order|invoice|purchase|personal|confidential|records?|grades?|student|patient|photo/.test(value))picked.push('privacy');
    if(/edit|update|change|modify|address|profile|account|details/.test(value))picked.push('my-edits');
    if(/admin|shopkeeper|owner|staff|inventory|stock|settings|manage|permission|role/.test(value))picked.push('admin');
    if(/guest|anonymous|visitor|public|logged?\s*in|not\s+signed\s*in|login|unauthenticated/.test(value))picked.push('visitors');
    ws.chosen=new Set(picked.filter(id=>supportedGroup(friendlyGroups.find(g=>g.id===id))));syncRuleIds();renderWorkspace();
    $('workspace-prompt-note').textContent=picked.length?
      `Suggested ${ws.chosen.size} rule${ws.chosen.size===1?'':'s'} using simple keywords. Please review the checkboxes — these are suggestions, not an AI guarantee.`:
      'We could not match that description to a supported permission rule. Please choose the rule yourself below.';
  }
  async function runWorkspace(){
    if(!(ws.mode==='zip'?ws.upload:ws.linkPlan)||ws.selected.size===0||ws.processing)return;
    const label=$('workspace-revision').value.trim();
    if(!label||label.length>100){toast('Give this check a short name.',true);return;}
    if(ws.mode==='zip'&&!(isFestZip()?state.fest?.reachable:state.lab?.reachable)){toast(isFestZip()?'Start the AETHER College Fest on port 4400 first.':'Start the grocery sample on port 4200 first.',true);return;}
    if(ws.mode==='link'&&(!ws.linkPlan||ws.linkPlan.mode!=='SUPPORTED_LOCAL'||!state.hospital?.reachable)){toast('This link is planning-only or the fictional hospital lab is offline.',true);return;}
    if(ws.options.some(rule=>ws.selected.has(rule.id)&&rule.writes)&&!$('workspace-write-approval').checked){
      toast('Please approve testing with temporary changes to fake data.',true);return;
    }
    ws.processing=true;ws.result=null;ws.error='';renderWorkspace();
    try{
      const endpoint=ws.mode==='link'?'/api/workspace/verify-link':'/api/workspace/verify';
      const input=ws.mode==='link'?{planId:ws.linkPlan.planId,selectedRules:[...ws.selected],revisionLabel:label,approveSyntheticWrites:$('workspace-write-approval').checked}:{
        uploadId:ws.upload.uploadId,selectedRules:[...ws.selected],originalPrompt:$('workspace-prompt').value.trim(),revisionLabel:label,approveSyntheticWrites:$('workspace-write-approval').checked
      };
      const response=await request(endpoint,{method:'POST',body:JSON.stringify(input)},165000);
      if(!response.run||!response.suite||!Array.isArray(response.run.results))throw new Error('The verification response was incomplete.');
      ws.result=response;state.selectedRun=response.run;
      await refresh({silent:true});
      toast('Your real security check is complete. Read the findings below.');
    }catch(e){ws.error=e.message||'Verification could not finish.';toast(ws.error,true);}
    finally{ws.processing=false;renderWorkspace();if(ws.result)$('workspace-results').scrollIntoView({behavior:'smooth',block:'start'});}
  }
  function humanMeaning(result){
    const positive=explainTests[result.testId]||descriptions[result.testId]||result.testId;
    const denied=result.verdict==='FAIL';
    const headlines={
      S03:'A customer can see another customer’s private order',
      S05:'A customer can change shopkeeper-only settings',
      G02:'A customer can see someone else’s private delivery address',
      G03:'A visitor can see private delivery details',
      G05:'A customer can edit another customer’s address',
      G06:'A visitor can change private delivery details',
      G08:'A customer can change shop inventory',
      G09:'A visitor can change shop inventory',
      G10:'A customer can change who owns an address',
      H03:'A patient can see another patient’s private record',H04:'A visitor can view a private patient record',
      H06:'A patient can change another patient’s personal record',H08:'A patient can alter clinician-only notes',
      H10:'A patient can change hospital administration settings',H12:'A patient can read another patient’s medical file',H13:'A patient can change record ownership'
    };
    return {title:denied?(headlines[result.testId]||`Security rule broken: ${positive}`):positive,
      fix:denied?(suggestedFixes[result.testId]||'Review the server-side permissions for this action and repeat the test after the fix.'):'',
      tone:result.verdict==='FAIL'?'Needs fixing':result.verdict==='PASS'?'Working as expected':'Couldn’t confirm'};
  }
  function renderWorkspaceResults(){
    const {run,suite}=ws.result;const counts={PASS:0,FAIL:0,INCONCLUSIVE:0};
    for(const r of run.results)if(r.verdict in counts)counts[r.verdict]++;
    $('workspace-results-meta').textContent=`${run.results.length} real checks · ${fmtDate(run.executedAt)} · saved to history`;
    $('workspace-human-headline').textContent=run.aggregateVerdict==='FAIL'?
      `${counts.FAIL} issue${counts.FAIL===1?'':'s'} found that need your attention.`:
      run.aggregateVerdict==='PASS'?'The selected rules worked in our checks.':
      'Some rules could not be checked reliably.';
    $('workspace-results-summary').innerHTML=`<div class="experience-result-summary ${safe(run.aggregateVerdict)}">
      <div class="experience-result-overall"><span class="experience-result-overall-icon">${run.aggregateVerdict==='FAIL'?'!':run.aggregateVerdict==='PASS'?'✓':'?'}</span><div><small>OVERALL RESULT</small><strong>${safe(run.aggregateVerdict==='FAIL'?'Needs fixing':run.aggregateVerdict==='PASS'?'Checked rules look good':'Could not fully confirm')}</strong><p>${safe(run.aggregateVerdict==='FAIL'?'At least one selected rule was definitely broken. See the affected checks below.':run.aggregateVerdict==='PASS'?'All required checks passed for this specific test setup. This is not a whole-site security guarantee.':'At least one check lacked reliable proof. It does not count as a pass.')}</p></div></div>
      <div class="experience-result-counters"><div><strong>${counts.PASS}</strong><span>Working</span></div><div><strong>${counts.FAIL}</strong><span>Need fixing</span></div><div><strong>${counts.INCONCLUSIVE}</strong><span>Not confirmed</span></div></div></div>`;
    $('workspace-results-caption').textContent='Technical details are available only if you want them.';
    const results=[...run.results].sort((a,b)=>({FAIL:0,INCONCLUSIVE:1,PASS:2}[a.verdict]??3)-({FAIL:0,INCONCLUSIVE:1,PASS:2}[b.verdict]??3));
    $('workspace-results-list').innerHTML=results.map(result=>{
      const interpretation=humanMeaning(result);const spec=suite.cases.find(c=>c.testId===result.testId);
      const status= result.verdict==='FAIL'?'fail':result.verdict==='PASS'?'pass':'uncertain';
      const reason=result.verdict==='FAIL'?`<p class="experience-fix"><strong>How to fix it:</strong> ${safe(interpretation.fix)}</p>`:'';
      return `<article class="experience-finding ${status}"><span class="experience-finding-icon">${result.verdict==='FAIL'?'!':result.verdict==='PASS'?'✓':'?'}</span>
        <div class="experience-finding-content"><span class="experience-finding-kicker">${safe(interpretation.tone)} <span>· Check ${safe(result.testId)}</span></span><h3>${safe(interpretation.title)}</h3>
          <p>${safe(result.explanation)}</p>${reason}
          <details class="experience-finding-evidence"><summary>See technical evidence</summary><div class="experience-evidence-items"><span>Response: ${safe(result.observed?.status??'Unavailable')}</span><span>Expected: ${safe(spec?.expectation||'—')}</span><span>Method: ${safe(spec?.method||'—')}</span><span>Reason: ${safe(result.reasonCode)}</span><span>Saved state changed: ${safe(word(result.observed?.stateChanged))}</span></div></details></div></article>`;
    }).join('');
  }
  function downloadReport(){
    if(!ws.result)return;
    const {run,suite}=ws.result;
    const lines=['CanTheySeeIt? · Website permission check','',`Date: ${fmtDate(run.executedAt)}`,
      `Input: ${ws.mode==='link'?(ws.linkPlan?.url||'Unknown URL'):'approved ZIP'}`,`Scope: ${ws.mode==='link'?'approved fictional hospital test lab':isFestZip()?'approved fictional college fest lab':'approved synthetic grocery lab'}`, 
      `Selected promises: ${chosenRules().map(g=>g.title).join('; ')}`,`Overall: ${run.aggregateVerdict}`,
      `Verified checks: ${run.results.length}`,`Run ID: ${run.runId}`,'',
      ...run.results.map(result=>{const x=humanMeaning(result);return `[${result.verdict}] ${x.title}\nWhat happened: ${result.explanation}${x.fix?'\nSuggested next step: '+x.fix:''}\nCheck: ${result.testId}\nReason: ${result.reasonCode}\n`; }),
      'Scope: Only the selected promises and supported synthetic records were checked. This does not prove the entire website is secure.'];
    const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='CanTheySeeIt-security-report.txt';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  document.addEventListener('change',e=>{
    const sectorInput=e.target.closest?.('input[name="workspace-sector"]');
    if(sectorInput){sectors.id=sectorInput.value;sectors.features=new Set();invalidateSectorPlan();renderWorkspace();return;}
    const feature=e.target.closest?.('[data-sector-feature]');
    if(feature){feature.checked?sectors.features.add(feature.dataset.sectorFeature):sectors.features.delete(feature.dataset.sectorFeature);invalidateSectorPlan();renderWorkspace();return;}
    const core=e.target.closest?.('[data-sector-core]');
    if(core){core.checked?sectors.core.add(core.dataset.sectorCore):sectors.core.delete(core.dataset.sectorCore);invalidateSectorPlan();renderWorkspace();return;}
  });
  $('workspace-mode-zip').addEventListener('click',()=>switchWebsiteMode('zip'));
  $('workspace-mode-link').addEventListener('click',()=>switchWebsiteMode('link'));
  $('workspace-plan-link').addEventListener('click',planWebsiteLink);
  $('workspace-use-hospital').addEventListener('click',useHospitalDemo);
  $('workspace-file').addEventListener('change',e=>{uploadWorkspaceFile(e.target.files?.[0]);});
  const drop=$('workspace-drop');
  drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('workspace-file').click();}});
  ['dragenter','dragover'].forEach(name=>drop.addEventListener(name,e=>{e.preventDefault();drop.classList.add('drag');}));
  ['dragleave','drop'].forEach(name=>drop.addEventListener(name,e=>{e.preventDefault();drop.classList.remove('drag');}));
  drop.addEventListener('drop',e=>uploadWorkspaceFile(e.dataTransfer?.files?.[0]));
  $('workspace-use-sample').addEventListener('click',useSample);
  $('workspace-suggest').addEventListener('click',suggestFromPrompt);
  $('workspace-write-approval').addEventListener('change',updateWorkspaceRunButton);
  $('workspace-run').addEventListener('click',runWorkspace);
  $('workspace-download').addEventListener('click',downloadReport);
  document.addEventListener('change',e=>{
    const input=e.target.closest?.('[data-workspace-group]');if(!input)return;
    if(input.checked)ws.chosen.add(input.dataset.workspaceGroup);else ws.chosen.delete(input.dataset.workspaceGroup);
    syncRuleIds();ws.result=null;renderWorkspace();
  });
  switchWebsiteMode('link');route('workspace');refresh({silent:true});loadWorkspaceOptions();loadSectorCatalog();
  setInterval(()=>{if(!state.running&&document.visibilityState==='visible')refresh({silent:true});},30000);
})();
