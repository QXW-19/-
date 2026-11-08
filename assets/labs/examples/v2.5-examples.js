/* ==========================================================================
   V2.5 教学案例库：全部用 V1.6 的 DigitalMixedCircuit 原语搭建，
   不引入第二套电路模型。案例可直接载入电路实验室与波形分析仪。
   每个案例含「理论目标 / 操作步骤 / 预期结果 / 验证说明」四项教学信息。
   ========================================================================== */
(function(root){
'use strict';
const M=root.DigitalMixedCircuit;

/* 用引擎原语从空白画布搭建电路；build 返回符合 V1.6 JSON 格式的对象。 */
function buildWith(fn){
  let c=M.empty();
  const put=(type,x,y)=>{c=M.add(c,type,x,y);return c.nodes[c.nodes.length-1].id;};
  const wire=(a,o,b,i)=>{c=M.connect(c,a,o,b,i);};
  const set=(id,v)=>{c=M.setSwitch(c,id,v);};
  fn({put,wire,set,circuit:()=>c});
  M.validate(c);
  return c;
}

const BUILDERS={
 /* 半加器：S=A⊕B，C=A·B，用两个 LED 同时观察 */
 halfadder(){
  return buildWith(({put,wire})=>{
   const a=put('SWITCH',40,60),b=put('SWITCH',40,220);
   const xor=put('XOR',270,90),and=put('AND',270,260);
   const ls=put('LED',510,95),lc=put('LED',510,265);
   wire(a,0,xor,0);wire(b,0,xor,1);wire(a,0,and,0);wire(b,0,and,1);
   wire(xor,0,ls,0);wire(and,0,lc,0);
  });
 },
 /* D 触发器：只有上升沿才把 D 采到 Q */
 dff(){
  return buildWith(({put,wire})=>{
   const d=put('SWITCH',40,70),clk=put('CLOCK',40,230);
   const ff=put('DFF',290,150),led=put('LED',520,155);
   wire(d,0,ff,0);wire(clk,0,ff,1);wire(ff,0,led,0);
  });
 },
 /* T 触发器：T=1 时每个上升沿翻转 */
 tff(){
  return buildWith(({put,wire,set})=>{
   const t=put('SWITCH',40,70),clk=put('CLOCK',40,230);
   const ff=put('TFF',290,150),led=put('LED',520,155);
   set(t,1);
   wire(t,0,ff,0);wire(clk,0,ff,1);wire(ff,0,led,0);
  });
 },
 /* JK 触发器：J=K=1 翻转 */
 jkff(){
  return buildWith(({put,wire,set})=>{
   const j=put('SWITCH',40,60),k=put('SWITCH',40,190),clk=put('CLOCK',40,330);
   const ff=put('JKFF',290,180),led=put('LED',540,185);
   set(j,1);set(k,1);
   wire(j,0,ff,0);wire(k,0,ff,1);wire(clk,0,ff,2);wire(ff,0,led,0);
  });
 },
 /* 模 6 计数器：4 个 LED 显示 Q[3:0] */
 counter6(){
  return buildWith(({put,wire,set})=>{
   const clk=put('CLOCK',40,60),en=put('SWITCH',40,210),rst=put('SWITCH',40,350);
   const cnt=put('COUNTER',290,190);
   set(en,1);
   wire(clk,0,cnt,0);wire(en,0,cnt,1);wire(rst,0,cnt,2);
   for(let i=0;i<4;i++){const led=put('LED',560,40+i*120);wire(cnt,i,led,0);}
  });
 },
 /* 简单状态机：两个 D 触发器串成 2 位移位寄存器，输出经 XOR 反馈指示 */
 statemachine(){
  return buildWith(({put,wire})=>{
   const inp=put('SWITCH',40,80),clk=put('CLOCK',40,240);
   const d1=put('DFF',270,120),d2=put('DFF',470,120);
   const xor=put('XOR',680,200),led=put('LED',880,205);
   wire(inp,0,d1,0);wire(clk,0,d1,1);
   wire(d1,0,d2,0);wire(clk,0,d2,1);
   wire(d1,0,xor,0);wire(d2,0,xor,1);wire(xor,0,led,0);
  });
 }
};

/* 教学说明：不声称真实硬件测量结果，只描述理想离散事件模型下的预期。 */
const CASES=[
 {id:'halfadder',name:'半加器输入输出变化',
  goal:'理解 S=A⊕B、C=A·B 两条独立输出，验证 A+B = S + 2C。',
  steps:['载入案例，把 A、B 两个输入开关依次切到 00 / 01 / 10 / 11。','每次切换后观察两个 LED 与导线上的 0/1 高亮。','把 C 输出加入波形通道，确认只有 11 时进位为 1。'],
  expect:'四种输入下 (S,C) 依次为 (0,0)、(1,0)、(1,0)、(0,1)。',
  verify:'把 S + 2C 与 A + B 逐行对照，四种组合都必须相等。'},
 {id:'dff',name:'D 触发器边沿采样',
  goal:'区分「电平透明」与「上升沿采样」：只改 D 不会改变 Q。',
  steps:['载入案例，先把 D 切到 1，暂不点时钟。','观察 LED 仍为 0（Q 保持）。','点击一次「单步时钟」，观察有效沿后 Q 变为 1。','把 D 切回 0，再次单步，Q 才变回 0。'],
  expect:'Q 只在完整时钟脉冲的上升沿更新，且等于沿前的 D。',
  verify:'波形面板中 D 可在两个沿之间变化，而 Q 只在标注 ↑ 的采样点跳变。'},
 {id:'tff',name:'T 触发器翻转',
  goal:'理解 T=1 时每个上升沿翻转一次，输出频率为时钟的一半。',
  steps:['载入案例（T 已置 1），连续点击 4 次单步时钟。','观察 Q 的 0→1→0→1→0 序列。','把 T 置 0 后再点两次时钟，确认 Q 保持。'],
  expect:'T=1 时 Q 每沿翻转；T=0 时 Q 保持不变。',
  verify:'用波形游标数出两次 Q 上升沿之间的时钟脉冲数应为 2。'},
 {id:'jkff',name:'JK 触发器状态变化',
  goal:'验证 J=K=1 的翻转功能，以及 J/K 的置位、复位、保持组合。',
  steps:['载入案例（J=K=1），连续单步 4 次观察翻转。','改为 J=1、K=0 单步一次，Q 应被置 1。','改为 J=0、K=1 单步一次，Q 应被清 0。','改为 J=K=0，Q 应保持。'],
  expect:'四种 J/K 组合依次对应 保持 / 复位 / 置位 / 翻转。',
  verify:'对照波形中 J、K、CLK、Q 四条通道逐沿核对。'},
 {id:'counter6',name:'模 6 计数器',
  goal:'理解模 N 回绕与二进制位权输出。',
  steps:['载入案例（EN=1、RST=0），连续单步 6 次。','观察四个 LED 依次显示 0000→0001→…→0101→0000。','把 RST 置 1 再单步一次，确认计数立即清零。'],
  expect:'6 个上升沿后回到 0000；RST=1 时计数值归零。',
  verify:'波形中 Q0 翻转最快、Q3 最慢；四位组合始终小于 6。'},
 {id:'statemachine',name:'简单状态机（2 位移位寄存器）',
  goal:'观察现态如何经时钟沿转移到次态，组合输出随现态重新求值。',
  steps:['载入案例，把输入开关置 1。','连续单步 2 次，观察两级 D 触发器依次变为 1。','把输入置 0，再连续单步 2 次，观察 1 被逐级移出。','观察 XOR 输出在两级状态不同时为 1。'],
  expect:'两级寄存器在同一沿同时采样各自 D 端，构成移位；XOR 在状态不同时为 1。',
  verify:'波形中 Q1 的变化比 Q0 晚一个时钟脉冲，说明是同步时序而非组合直连。'}
];

function build(id){
 const fn=BUILDERS[id];
 if(!fn)throw Error('未知教学案例：'+id);
 return fn();
}
function get(id){return CASES.find(c=>c.id===id)||null;}
const CASE_IDS=CASES.map(c=>c.id);

root.DigitalV25Examples=Object.freeze({CASES,CASE_IDS,build,get});
})(typeof window!=='undefined'?window:globalThis);
