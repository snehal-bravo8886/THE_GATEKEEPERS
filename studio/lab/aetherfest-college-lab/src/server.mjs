import http from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {dirname,join,extname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {ACCOUNTS,createState,publicAccount} from './data.mjs';
import {mayViewRegistration,mayEditFestSettings} from './permissions.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const publicRoot=resolve(here,'../public');
const mode=process.env.FEST_MODE === 'secure'?'secure':'vulnerable';
const port=Number(process.env.FEST_PORT||4400);
if(!Number.isInteger(port)||port!==4400)throw Error('Only local test port 4400 is supported');
let db=createState();
const sessions=new Map();
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};

function json(res,status,body){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY'});res.end(JSON.stringify(body));}
function error(res,status,code,reason){json(res,status,{error:code,message:reason});}
async function parseBody(req){let total=0;const chunks=[];for await(const c of req){total+=c.length;if(total>20000)throw Error('REQUEST_TOO_LARGE');chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{throw Error('INVALID_JSON');}}
function getActor(req){const header=req.headers.authorization||'';const token=/^Bearer (.+)$/i.exec(header)?.[1];const userId=token&&sessions.get(token);return userId?ACCOUNTS[userId]:null;}
function auth(res,actor){if(!actor){error(res,401,'NOT_AUTHENTICATED','Sign in first.');return false;}return true;}
function serve(res,path){let name=path==='/'?'/index.html':path;try{name=decodeURIComponent(name);}catch{res.writeHead(400).end();return;}const file=resolve(publicRoot,'.'+name);if(file!==publicRoot&&!file.startsWith(publicRoot+sep)){res.writeHead(404).end();return;}try{if(!statSync(file).isFile())throw Error('NOT_FOUND');res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','x-content-type-options':'nosniff'});createReadStream(file).pipe(res);}catch{res.writeHead(404).end('Not found');}}
function validateSettings(body){if(!body||typeof body!=='object'||Array.isArray(body))return null;const keys=Object.keys(body);if(!keys.length||keys.some(x=>!['ticketPrice','earlyBirdPrice','tagline','venue','announced'].includes(x)))return null;for(const [k,v] of Object.entries(body)){if(k==='ticketPrice'||k==='earlyBirdPrice'){if(!Number.isInteger(v)||v<0||v>9999)return null;}else if(typeof v!=='string'||!v.trim()||v.length>150)return null;}return Object.fromEntries(Object.entries(body).map(([k,v])=>[k,typeof v==='string'?v.trim():v]));}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');const path=url.pathname;
  const actor=getActor(req);
  if(req.method==='GET'&&path==='/api/health')return json(res,200,{app:'aetherfest-college-lab',ready:true,synthetic:true});
  if(req.method==='GET'&&path==='/api/fest')return json(res,200,{fest:structuredClone(db.fest)});
  if(req.method==='GET'&&path==='/api/events')return json(res,200,{events:structuredClone(db.events)});
  if(req.method==='POST'&&path==='/api/auth/login'){
   const body=await parseBody(req);const user=Object.values(ACCOUNTS).find(a=>a.email===body.email&&a.password===body.password);
   if(!user)return error(res,401,'INVALID_LOGIN','Incorrect demo credentials.');
   const token=randomBytes(28).toString('hex');sessions.set(token,user.id);
   return json(res,200,{token,user:publicAccount(user)});
  }
  if(req.method==='GET'&&path==='/api/me'){
   if(!auth(res,actor))return;
   return json(res,200,{userId:actor.id,role:actor.role,name:actor.name,email:actor.email});
  }
  if(req.method==='GET'&&path==='/api/registrations/me'){
   if(!auth(res,actor))return;
   const rows=actor.role==='head'?db.registrations:db.registrations.filter(r=>r.ownerUserId===actor.id);
   return json(res,200,{registrations:structuredClone(rows.map(({privateMarker,...r})=>r))});
  }
  const match=/^\/api\/registrations\/([a-z0-9-]+)$/.exec(path);
  if(req.method==='GET'&&match){
   if(!auth(res,actor))return;
   const row=db.registrations.find(x=>x.registrationId===match[1]);
   if(!row)return error(res,404,'NOT_FOUND','Registration not found.');
   if(!mayViewRegistration(actor,row,mode))return error(res,403,'FORBIDDEN','That registration belongs to a different student.');
   return json(res,200,{registration:structuredClone(row)});
  }
  if(req.method==='GET'&&path==='/api/fest/settings'){
   if(!auth(res,actor))return;
   if(actor.role!=='head')return error(res,403,'FORBIDDEN','Only the fest head may view management settings.');
   return json(res,200,{settings:structuredClone(db.fest)});
  }
  if(req.method==='PATCH'&&path==='/api/fest/settings'){
   if(!auth(res,actor))return;
   if(!mayEditFestSettings(actor,mode))return error(res,403,'FORBIDDEN','Only the fest head may edit ticket pricing and site details.');
   const body=validateSettings(await parseBody(req));
   if(!body)return error(res,400,'BAD_SETTINGS','Supply valid ticket pricing or approved fest details.');
   Object.assign(db.fest,body);
   return json(res,200,{settings:structuredClone(db.fest)});
  }
  if(req.method==='POST'&&path==='/api/lab/reset'){
   if(!auth(res,actor))return;
   if(actor.role!=='head')return error(res,403,'FORBIDDEN','Only the fest head may reset synthetic data.');
   db=createState();return json(res,200,{ok:true,reset:true});
  }
  if(path.startsWith('/api/'))return error(res,404,'NOT_FOUND','API route not found.');
  if(req.method==='GET')return serve(res,path);
  return error(res,405,'METHOD_NOT_ALLOWED','Unsupported method.');
 }catch(e){return error(res,e.message==='REQUEST_TOO_LARGE'?413:e.message==='INVALID_JSON'?400:500,'REQUEST_ERROR','Invalid request.');}
});
server.listen(port,'127.0.0.1',()=>{
 console.log(`AETHER College Fest → http://127.0.0.1:${port}`);
 console.log('Local synthetic demo only. Do not expose this service publicly.');
 console.log('Authorization mode: '+mode+' (test scenarios described in README)');
});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
