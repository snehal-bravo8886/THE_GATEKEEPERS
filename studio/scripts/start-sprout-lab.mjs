// Windows and Unix launcher; fail cleanly if another server is already using :4200.
import {spawn} from 'node:child_process';
import net from 'node:net';
const client=net.connect({host:'127.0.0.1',port:4200});
client.once('connect',()=>{client.destroy();console.error('Sprout & Stone is already running on port 4200. Close its earlier terminal, or use the existing site.');process.exitCode=1;});
client.once('error',()=>{
  client.destroy();
  const proc=spawn(process.execPath,['lab/grocery-security-lab/src/app.mjs'],{env:{...process.env,PORT:'4200'},stdio:'inherit',shell:false});
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>proc.kill(signal));
  proc.on('exit',code=>{process.exitCode=code===null?0:code;});
});
