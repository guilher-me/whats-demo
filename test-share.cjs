const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const S=require('./share.js'),E=require('./engine.js');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/defaults.js','utf8'),sandbox);
(async()=>{
 const project=JSON.parse(JSON.stringify(sandbox.window.FakeFlowsDefault()));
 project.contact.name='Clínica São João 🩺';project.steps[0].text='Olá! Ação, informação e café ☕';project.contact.avatar='data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
 const encoded=await S.encode(project);assert(encoded.startsWith('v1z.'));assert.deepEqual(E.validateProject(await S.decode('#project='+encoded)),project);
 const url=await S.createURL(project,'https://example.com/editor/index.html?theme=light#old');const parsed=new URL(url);assert.equal(parsed.pathname,'/editor/index.html');assert.equal(parsed.search,'?theme=light');assert.deepEqual(await S.decode(parsed.hash),project);assert.equal(parsed.origin,'https://example.com');
 const raw='v1j.'+Buffer.from(JSON.stringify(project)).toString('base64url');assert.deepEqual(await S.decode(raw),project);
 await assert.rejects(()=>S.decode('#project=v99.data'),/versão/);await assert.rejects(()=>S.decode('v1z.broken'),/corrompido/);await assert.rejects(()=>S.decode('v1j.@@@@'),/versão/);await assert.rejects(()=>S.encode({text:'x'.repeat(5*1024*1024)}),/4 MB/);
 console.log('OK: compressed/raw round trips, UTF-8, profile image, full default Flows, URL paths/query preserved, version/corruption/size errors.');
})().catch(error=>{console.error(error);process.exitCode=1;});
