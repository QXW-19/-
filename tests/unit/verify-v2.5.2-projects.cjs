/* V2.5.2 项目实训台单元测试
 * 1) 密码锁门级电路：真值覆盖、触发器保持、复位；
 * 2) 项目脚本完整性：4 项目 × 8 步，字段齐全；
 * 3) 复用模型的关键数值：交通灯 30 秒循环、时钟跨午夜、ADC 步长与码值。
 * 不访问浏览器，不修改任何存档。
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');

let count=0;
function ok(cond,label){assert.ok(cond,label);count++;console.log('PASS '+label);}

/* ---------- 1. 密码锁：复用 V1.6 引擎 ---------- */
const L=require(path.join(root,'assets/projects/v2.5.2-lock-core.js'));
const M=require(path.join(root,'assets/v1.6-core.js'));

const built=L.build();
ok(built.circuit.nodes.length===25,'密码锁电路共 25 个元件（当前 '+built.circuit.nodes.length+'）');
ok(built.circuit.wires.length===24,'密码锁电路共 24 根连线（当前 '+built.circuit.wires.length+'）');
const types=built.circuit.nodes.reduce((m,n)=>{m[n.type]=(m[n.type]||0)+1;return m;},{});
ok(types.XOR===4&&types.NOT===5&&types.AND===3,'4 异或 + 5 非 + 3 与构成比较与指示');
ok(types.DFF===1&&types.CLOCK===1,'恰好 1 个 D 触发器与 1 个时钟');
ok(types.SWITCH===8&&types.LED===3,'8 个输入开关与 3 只指示灯');
M.validate(built.circuit);

let c=built.circuit;
const ids=built.ids;
c=L.setBits(c,ids,'p',[1,0,1,0]);
c=L.setBits(c,ids,'k',[0,0,0,0]);
let s=L.read(c,ids);
ok(s.match===0&&s.unlock===0,'预设 1010、输入 0000 时匹配为 0、未开锁');

c=L.confirm(c);
ok(L.read(c,ids).unlock===0,'错误密码按确认后仍不开锁');
ok(L.read(c,ids).err===1,'错误时错误指示为 1');
ok(L.read(c,ids).tick===1,'确认一次，时钟计数为 1');

c=L.setBits(c,ids,'k',[1,0,1,0]);
ok(L.read(c,ids).unlock===0,'只改输入不确认时，开锁状态保持为 0');
s=L.read(c,ids);
ok(s.match===1,'输入与预设一致时匹配为 1');
c=L.confirm(c);
ok(L.read(c,ids).unlock===1,'正确密码按确认后开锁并保持');
ok(L.read(c,ids).err===0,'匹配时错误指示为 0');

c=L.setBits(c,ids,'k',[0,1,1,0]);
ok(L.read(c,ids).unlock===1,'开锁后改动输入，Q 仍保持 1（时序保持）');
ok(L.read(c,ids).match===0,'此时组合比较结果已经变为 0');

c=L.reset(c);
ok(L.read(c,ids).unlock===0&&L.read(c,ids).tick===0,'复位后 Q=0、时钟计数归零');

/* 全 16 组输入：MATCH 必须等于「输入等于预设」。 */
let combos=0;
for(let n=0;n<16;n++){
 const bits=[(n>>3)&1,(n>>2)&1,(n>>1)&1,n&1];
 let t=L.build();
 t.circuit=L.setBits(t.circuit,t.ids,'p',[1,0,1,0]);
 t.circuit=L.setBits(t.circuit,t.ids,'k',bits);
 const expect=bits.join('')==='1010'?1:0;
 assert.equal(L.read(t.circuit,t.ids).match,expect);
 combos++;
}
ok(combos===16,'16 种输入组合下匹配结果全部正确');

/* ---------- 2. 项目脚本完整性 ---------- */
const sandbox={console:{log(){},error(){}},window:{}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'assets/projects/v2.5.2-lab-data.js'),'utf8'),sandbox,
 {filename:'v2.5.2-lab-data.js'});
const D=sandbox.window.DigitalV252ProjectData;
ok(D&&D.ids.length===4,'四个项目全部注册');
ok(D.STEPS.length===8,'统一八步流程');
for(const id of D.ids){
 const p=D.get(id);
 for(const [key] of D.STEPS){
  ok(p.steps[key]!==undefined,id+' 缺步骤 '+key);
  if(key==='build')ok(Array.isArray(p.steps.build)&&p.steps.build.length>=5,id+' 分步搭建至少 5 步');
  if(key==='debug')ok(Array.isArray(p.steps.debug)&&p.steps.debug.length>=3,id+' 故障排查至少 3 条');
  if(key==='summary')ok(p.steps.summary.points.length>=3&&p.steps.summary.next.length>=2,
   id+' 总结含要点与后续建议');
 }
 ok(typeof p.boundary==='string'&&p.boundary.length>20,id+' 明确标注能力边界');
 ok(p.steps.sim&&p.steps.sim.hint,id+' 实时仿真提供操作提示');
 ok(p.steps.wave&&p.steps.wave.hint,id+' 波形分析提供观察提示');
}

/* ---------- 2b. 案例联动能力表 ---------- */
vm.runInContext(fs.readFileSync(path.join(root,'assets/content/cases/v2.5.2-case-links.js'),'utf8'),sandbox,
 {filename:'v2.5.2-case-links.js'});
const CL=sandbox.window.DigitalV252CaseLinks;
ok(CL&&CL.ids.length===19,'19 个案例都有联动能力条目（当前 '+CL.ids.length+'）');
const caps=CL.stats();
ok(caps.circuit===8,'8 个案例支持完整电路仿真');
ok(caps.module===5,'5 个案例连接原有章节互动');
ok(caps.numeric===6,'6 个案例为数值/图形演示');
ok(caps.circuit+caps.module>=12,'可操作案例合计不少于 12 个（当前 '+(caps.circuit+caps.module)+'）');
for(const id of CL.ids){
 const x=CL.get(id);
 ok(typeof x.objective==='string'&&x.objective.length>10,id+' 有操作目标');
 ok(Array.isArray(x.prereq)&&x.prereq.length>=1,id+' 有前置知识');
 ok(Array.isArray(x.expected)&&x.expected.length>=2,id+' 有预期输入输出');
 ok(Array.isArray(x.improve)&&x.improve.length>=2,id+' 有设计改进思考');
 ok(['circuit','module','numeric','needs'].includes(x.cap),id+' 能力等级合法');
 ok(x.entry&&['circuit','module','widget','project'].includes(x.entry.type),id+' 有交互入口');
}

/* ---------- 3. 交通灯与时钟模型 ---------- */
const P=require(path.join(root,'assets/v1.7-core.js'));
let st=P.fresh();
let illegal=0,phases=new Set();
for(let i=0;i<30;i++){
 st=P.trafficStep(st);
 const l=P.lampState(st);
 phases.add(l.phase);
 if(l.ns==='green'&&l.ew==='green')illegal++;
}
ok(st.traffic.cycles===1,'30 秒走完一个完整周期');
ok(illegal===0,'30 秒内没有出现双向同时绿');
ok(phases.size===6,'一个周期经过全部 6 个相位');
ok(P.PHASES.reduce((n,p)=>n+p.seconds,0)===30,'六相位时长合计 30 秒');

let clk=P.fresh();
clk=P.setTime(clk,23,59,59);
clk=P.clockStep(clk);
ok(P.timeString(clk)==='00:00:00','23:59:59 的下一秒回到 00:00:00');
const h12=clk.clock.hour%12===0?12:clk.clock.hour%12;
ok(h12===12,'午夜在 12 小时制显示为 12');

/* ---------- 4. ADC 步长与码值 ---------- */
const A=require(path.join(root,'assets/v1.8-core.js'));
const a10=A.adc(10,3.3,1.0);
ok(Math.abs(a10.step-3.3/1024)<1e-15,'10 位 3.3 V 步长等于 Vref/1024');
ok(a10.code===310,'1.000 V 在 10 位下码值为 310（当前 '+a10.code+'）');
const a12=A.adc(12,3.3,1.0);
ok(Math.abs(a12.step-a10.step/4)<1e-15,'12 位步长是 10 位的 1/4');
ok(a12.code===1241,'1.000 V 在 12 位下码值为 1241（当前 '+a12.code+'）');

console.log('V2.5.2 项目实训台单元测试共 '+count+' 项通过。');
