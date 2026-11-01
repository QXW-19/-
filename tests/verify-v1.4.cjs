/* V1.4 时序逻辑单元测试。运行：node tests/verify-v1.4.cjs */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const E=require('../assets/v1.4-core.js');
let total=0;
function check(label,fn){fn();total++;console.log('PASS',label);}
const stepN=(s,n)=>{for(let i=0;i<n;i++)s=E.step(s);return s;};
check('D=0 正沿采样 0',()=>assert.equal(E.step(E.create('D')).q,0));
check('D=1 正沿采样 1',()=>assert.equal(E.step(E.setInput(E.create('D'),'D',1)).q,1));
check('仅切换 D 不会立即改变 Q',()=>{
 let s=E.setInput(E.create('D'),'D',1);s=E.step(s);
 s=E.setInput(s,'D',0);assert.equal(s.q,1);assert.equal(s.tick,1);
 assert.equal(E.step(s).q,0);
});
check('T=0 保持',()=>{
 let s=E.setInput(E.create('T'),'T',0);s=stepN(s,3);assert.equal(s.q,0);
});
check('T=1 连续翻转',()=>{
 let s=E.create('T');const results=[];for(let i=0;i<5;i++){s=E.step(s);results.push(s.q)}
 assert.deepEqual(results,[1,0,1,0,1]);
});
check('JK=00 保持现有状态 1',()=>{
 let s=E.create('JK');s=E.setInput(s,'J',1);s=E.setInput(s,'K',0);s=E.step(s);
 s=E.setInput(s,'J',0);s=E.setInput(s,'K',0);assert.equal(E.step(s).q,1);
});
check('JK=01 复位',()=>{
 let s=E.create('JK');s=E.setInput(s,'K',0);s=E.step(s);s=E.setInput(s,'J',0);s=E.setInput(s,'K',1);assert.equal(E.step(s).q,0);
});
check('JK=10 置位',()=>{
 let s=E.create('JK');s=E.setInput(s,'K',0);assert.equal(E.step(s).q,1);
});
check('JK=11 翻转',()=>{
 let s=E.create('JK');s=E.step(s);assert.equal(s.q,1);
 s=E.step(s);assert.equal(s.q,0);
});
check('模 6 计数 000 到 101 后回绕',()=>{
 let s=E.create('COUNTER',6),arr=[];
 for(let i=0;i<7;i++){arr.push(E.bits(s));s=E.step(s);}
 assert.deepEqual(arr,['000','001','010','011','100','101','000']);
 assert.equal(s.count,1);
});
check('模 2/16 计数回绕',()=>{
 assert.equal(stepN(E.create('COUNTER',2),2).count,0);
 assert.equal(stepN(E.create('COUNTER',16),16).count,0);
});
check('记录包含边沿前后状态与采样输入',()=>{
 let s=E.setInput(E.create('D'),'D',1);s=E.step(s);
 assert.equal(s.history[0].before,0);
 assert.equal(s.history[0].after,1);
 assert.equal(s.history[0].inputs.D,1);
 assert.equal(s.history[0].tick,1);
});
check('历史最多 48 个边沿且保留全局 tick',()=>{
 const s=stepN(E.create('T'),75);
 assert.equal(s.tick,75);assert.equal(s.history.length,48);
 assert.equal(s.history[0].tick,28);assert.equal(s.history[47].tick,75);
});
check('软件复位清空历史与时钟',()=>{
 const s=E.reset(stepN(E.create('T'),4));
 assert.equal(s.q,0);assert.equal(s.tick,0);assert.equal(s.history.length,0);
});
check('切换模式/模数清空历史',()=>{
 let s=stepN(E.create('T'),3);
 s=E.setMode(s,'COUNTER');assert.equal(s.tick,0);assert.equal(s.mode,'COUNTER');
 s=E.setModulus(E.step(s),9);assert.equal(s.modulus,9);assert.equal(s.count,0);assert.equal(s.history.length,0);
});
check('JK 转移表完整',()=>assert.equal(E.transitionTable('JK').length,8));
check('模 6 转移表完整且最后一项回到 000',()=>{
 const t=E.transitionTable('COUNTER',6);
 assert.equal(t.length,6);assert.equal(t[5].current,'101');assert.equal(t[5].next,'000');
});
check('不合法输入或模数拒绝',()=>{
 assert.throws(()=>E.create('COUNTER',1),/模数/);
 assert.throws(()=>E.create('COUNTER',17),/模数/);
 assert.throws(()=>E.setInput(E.create(),'D',2),/输入端/);
});
check('损坏与超限记录拒绝',()=>{
 const invalid=E.create();invalid.history=[{tick:3}];
 assert.throws(()=>E.validate(invalid),/历史/);
 const huge=stepN(E.create('D'),4);huge.tick=1000001;
 assert.throws(()=>E.validate(huge),/时钟/);
});
check('JSON 导出导入可还原模型状态',()=>{
 const s=stepN(E.setInput(E.create('D'),'D',1),4);
 const obj=JSON.parse(JSON.stringify(s));
 assert.equal(E.validate(obj),true);assert.deepEqual(obj,s);
});
check('增量资源与 HTML 装配顺序',()=>{
 const root=path.resolve(__dirname,'..');
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 const ids=[...html.matchAll(/<section class="mod" id="([^"]+)"/g)];
 assert.equal(ids.length,51);
 ['assets/v1.1.js','assets/v1.2.js','assets/v1.3.js','assets/v1.4-core.js','assets/v1.4.js','assets/v1.4.css'].forEach(p=>assert.ok(html.includes(p)));
 assert.ok(html.indexOf('assets/v1.4-core.js')<html.indexOf('assets/v1.4.js'));
 new vm.Script(fs.readFileSync(path.join(root,'assets/v1.4.js'),'utf8'));
});
console.log('共 '+total+' 项 V1.4 检查通过；实际网页交互和 3D 需另做浏览器验收。');
