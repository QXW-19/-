/* ==========================================================================
   V2.5 单元测试：电路仿真核心复用、三值逻辑、教学案例与波形采样。
   直接加载既有 V1.6 引擎与 V2.5 增强模块，不启动浏览器、不访问网络。
   ========================================================================== */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const M=require(path.join(root,'assets/v1.6-core.js'));
global.window=global;
global.DigitalMixedCircuit=M;
require(path.join(root,'assets/labs/examples/v2.5-examples.js'));
require(path.join(root,'assets/labs/circuit-renderer/v2.5-signals.js'));
const E=global.DigitalV25Examples;
const S=global.DigitalV25Signals;
let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name);}

const nodeByType=(c,t)=>c.nodes.filter(n=>n.type===t);
const out=(c,state,id,i=0)=>state[id].outputs[i];

check('六个教学案例都能构建并通过 V1.6 引擎校验',()=>{
 for(const id of E.CASE_IDS){
  const c=E.build(id);
  M.validate(c);
  assert.ok(c.nodes.length>=3 && c.wires.length>=2,id+' 电路规模过小');
  const meta=E.get(id);
  assert.ok(meta&&meta.goal&&meta.steps.length>=3&&meta.expect&&meta.verify,id+' 教学信息不全');
 }
});

check('半加器四种输入满足 S=A⊕B、C=A·B 与 A+B=S+2C',()=>{
 let c=E.build('halfadder');
 const sw=nodeByType(c,'SWITCH'),xor=nodeByType(c,'XOR')[0],and=nodeByType(c,'AND')[0];
 for(const a of[0,1])for(const b of[0,1]){
  c=M.setSwitch(c,sw[0].id,a);c=M.setSwitch(c,sw[1].id,b);
  const st=M.evaluate(c),s=out(c,st,xor.id),carry=out(c,st,and.id);
  assert.equal(s,a^b,'S');assert.equal(carry,a&b,'C');
  assert.equal(s+2*carry,a+b,'A+B=S+2C');
 }
});

check('悬空输入产生未知态 X，并触发悬空与 X 两类诊断',()=>{
 let c=M.empty();
 c=M.add(c,'AND',60,60);c=M.add(c,'LED',300,60);
 c=M.connect(c,'n1',0,'n2',0);
 const st=M.evaluate(c);
 assert.equal(st.n1.outputs[0],null,'AND 的 A/B 悬空时输出应为 null');
 assert.equal(S.valueOf(null),'X');
 const items=S.diagnose(c,st);
 assert.ok(items.some(i=>i.code==='FLOAT_INPUT'),'缺少悬空输入诊断');
 assert.ok(items.some(i=>i.code==='UNKNOWN_X'),'缺少未知态诊断');
 assert.ok(items.some(i=>i.level==='warning'));
});

check('CLK 接到开关而非 CLOCK 时给出中文警告',()=>{
 let c=M.empty();
 c=M.add(c,'SWITCH',40,60);c=M.add(c,'DFF',260,60);
 c=M.connect(c,'n1',0,'n2',1);
 const items=S.diagnose(c,M.evaluate(c));
 assert.ok(items.some(i=>i.code==='CLOCK_SOURCE'&&i.level==='warning'));
 assert.ok(items.some(i=>/时钟源/.test(i.text)));
});

check('重复接线与组合逻辑环路会被引擎拒绝并转成中文错误',()=>{
 const c=E.build('halfadder');
 const bad=JSON.parse(JSON.stringify(c));
 bad.wires.push({from:bad.wires[0].from,output:0,to:bad.wires[0].to,input:0});
 assert.throws(()=>M.validate(bad),/一个输入端不能接多根线/);
 const items=S.diagnose(bad,M.evaluate(c));
 assert.ok(items.some(i=>i.level==='error'));
});

check('D 触发器只在完整时钟脉冲的上升沿采样',()=>{
 let c=E.build('dff');
 const sw=nodeByType(c,'SWITCH')[0],ff=nodeByType(c,'DFF')[0];
 assert.equal(M.evaluate(c)[ff.id].outputs[0],0);
 c=M.setSwitch(c,sw.id,1);
 assert.equal(M.evaluate(c)[ff.id].outputs[0],0,'只改 D 不应改变 Q');
 c=M.pulse(c);
 assert.equal(M.evaluate(c)[ff.id].outputs[0],1,'有效沿后 Q 应等于 D');
 assert.equal(c.tick,1);
 assert.equal(c.history.length,1,'每个脉冲只记录一条历史');
});

check('T 触发器在 T=1 时每个上升沿翻转，一个脉冲只翻转一次',()=>{
 let c=E.build('tff');
 const ff=nodeByType(c,'TFF')[0],seq=[];
 for(let i=0;i<4;i++){c=M.pulse(c);seq.push(M.evaluate(c)[ff.id].outputs[0]);}
 assert.deepEqual(seq,[1,0,1,0]);
});

check('JK 触发器 J=K=1 翻转；J=1/K=0 置位；J=0/K=1 复位；J=K=0 保持',()=>{
 let c=E.build('jkff');
 const sw=nodeByType(c,'SWITCH'),ff=nodeByType(c,'JKFF')[0];
 const pulse=()=>{c=M.pulse(c);return M.evaluate(c)[ff.id].outputs[0];};
 assert.equal(pulse(),1,'J=K=1 翻转');
 c=M.setSwitch(c,sw[0].id,1);c=M.setSwitch(c,sw[1].id,0);
 assert.equal(pulse(),1,'置位');
 c=M.setSwitch(c,sw[0].id,0);c=M.setSwitch(c,sw[1].id,1);
 assert.equal(pulse(),0,'复位');
 c=M.setSwitch(c,sw[1].id,0);
 assert.equal(pulse(),0,'保持');
});

check('模 6 计数器六个上升沿后回绕到 0，RST 可清零',()=>{
 let c=E.build('counter6');
 const cnt=nodeByType(c,'COUNTER')[0],sw=nodeByType(c,'SWITCH');
 const values=[];
 for(let i=0;i<6;i++){c=M.pulse(c);values.push(c.nodes.find(n=>n.id===cnt.id).count);}
 assert.deepEqual(values,[1,2,3,4,5,0]);
 c=M.pulse(c);c=M.setSwitch(c,sw[1].id,1);
 c=M.pulse(c);
 assert.equal(c.nodes.find(n=>n.id===cnt.id).count,0,'RST=1 应清零');
});

check('波形采样只读取引擎状态，通道值为 0/1/X 且覆盖所有元件',()=>{
 const c=E.build('dff');
 const snap=S.sample(c,c.tick,true);
 assert.equal(snap.edge,true);
 assert.equal(Object.keys(snap.channels).length,c.nodes.length);
 for(const arr of Object.values(snap.channels))
  for(const v of arr)assert.ok(v===0||v===1||v==='X','非法通道值 '+v);
 const st=M.evaluate(c);
 assert.equal(S.valueOf(st[nodeByType(c,'DFF')[0].id].outputs[0]),snap.channels[nodeByType(c,'DFF')[0].id][0]);
});

check('V1.6 原始 JSON 存档与 V2.5 案例格式互相兼容',()=>{
 const legacy=M.example('sample');
 M.validate(legacy);
 const modern=E.build('halfadder');
 M.validate(modern);
 for(const c of [legacy,modern]){
  const text=JSON.stringify(c);
  const parsed=JSON.parse(text);
  assert.equal(parsed.version,1,'导出结构必须保持 V1.6 版本 1');
  assert.ok(Array.isArray(parsed.nodes)&&Array.isArray(parsed.wires)&&Array.isArray(parsed.history));
  M.validate(parsed);
 }
});

check('元件与导线上限来自同一引擎常量',()=>{
 assert.equal(M.MAX_NODES,80);
 assert.equal(M.MAX_WIRES,200);
 let c=M.empty();
 for(let i=0;i<M.MAX_NODES;i++)c=M.add(c,'SWITCH',20+(i%8)*60,20+Math.floor(i/8)*40);
 assert.throws(()=>M.add(c,'SWITCH',20,20),/上限/);
});
console.log('V2.5 单元测试共 '+count+' 项通过（理想离散事件模型，非真实硬件测量）。');
