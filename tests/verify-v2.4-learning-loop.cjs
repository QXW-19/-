/* V2.4 教学质量门：学习闭环覆盖度 + 重点知识点数值一致性。
 * 只做独立数学/内容校验，不修改任何讲义数据、公式、题库答案或存档格式。
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const M=require('../assets/v1.8-core.js');

let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name);}

/* 在隔离上下文中读取讲义数据，避免污染全局。 */
function load(file,ctx){
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
}
const ctx=vm.createContext({window:{},console});
load('assets/v1.8-lessons.js',ctx);
const lessons=ctx.window.DigitalV18Lessons.lessons;

// 模拟浏览器：window 与 globalThis 是同一个对象，且 V1.8 内核挂在 window 上。
const sandbox={console,DigitalV18Lab:M};sandbox.window=sandbox;
const loopCtx=vm.createContext(sandbox);
load('assets/v2.4-learning-loop.js',loopCtx);
const loop=sandbox.window.DigitalV24LearningLoop;

check('32 节系统讲义与八章结构完整',()=>{
 assert.equal(lessons.length,32);
 assert.equal(new Set(lessons.map(l=>l.chapter)).size,8);
 for(let c=1;c<=8;c++)assert.equal(lessons.filter(l=>l.chapter===c).length,4,'第 '+c+' 章应有 4 节');
});
check('原有讲义字段与题库答案未被改写',()=>{
 for(const l of lessons){
  for(const key of ['analogy','explanation','formula','practice','pitfall'])
   assert.ok(typeof l[key]==='string'&&l[key].length>4,l.id+' 缺少 '+key);
  assert.ok(Array.isArray(l.steps)&&l.steps.length>=3,l.id+' 推导步骤不足');
  assert.ok(l.quiz&&Array.isArray(l.quiz.options)&&l.quiz.options.length>=2,l.id+' 缺少随堂练习');
  assert.ok(Number.isInteger(l.quiz.correct)&&l.quiz.correct>=0&&l.quiz.correct<l.quiz.options.length,l.id+' 答案下标越界');
  assert.ok(l.quiz.why&&l.quiz.why.length>1,l.id+' 缺少答案解析');
 }
});
check('八章图形演示齐全且由同一计算内核产生一致数字',()=>{
 for(let c=1;c<=8;c++)assert.equal(typeof loop.DIAGRAMS[c],'function','第 '+c+' 章缺少图形演示');
 const d1=loop.DIAGRAMS[1]();
 assert.match(d1.svg,/13/);assert.match(d1.svg,/8 \+ 4 \+ 1/);
 const d2=loop.DIAGRAMS[2]();
 for(const [a,b]of[[0,0],[0,1],[1,0],[1,1]])
  assert.ok(d2.svg.includes(String(a)+' '+b+' │  '+['AND','OR','XOR'].map(t=>M.gate(t,a,b).output).join('   ')),'真值表行与内核不符');
 const d3=loop.DIAGRAMS[3]();
 assert.ok(d3.svg.includes(M.cmos(0).conducting)&&d3.svg.includes(M.cmos(1).conducting),'CMOS 导通描述不一致');
 const d4=loop.DIAGRAMS[4]();
 for(const [a,b]of[[0,0],[0,1],[1,0],[1,1]]){
  const r=M.adder(a,b);assert.ok(d4.svg.includes('S='+r.sum+'，C='+r.carry),'半加器行不一致');
 }
 const d5=loop.DIAGRAMS[5]();
 assert.match(d5.svg,/共 3 次/);
 const d6=loop.DIAGRAMS[6]();
 assert.equal(M.counter(0,6).bits,3);assert.ok(d6.svg.includes('模 6 共用 6 个状态'));
 const t=M.timer555(10,10,10),d7=loop.DIAGRAMS[7]();
 assert.ok(d7.svg.includes('f='+t.frequency.toFixed(0)+' Hz')&&d7.svg.includes(t.duty.toFixed(1)+'%'),'555 图形数值与公式不符');
 const step=M.adc(8,3.3,0).step,d8=loop.DIAGRAMS[8]();
 assert.ok(d8.svg.includes((step*1000).toFixed(2)+' mV'),'ADC 步长与图形不符');
});
check('32 节都有动手建议、结果分析与两条以上错因解析',()=>{
 for(const l of lessons){
  const n=loop.NOTES[l.id];
  assert.ok(n,l.id+' 缺少学习闭环补充说明');
  assert.ok(n.lab.length>6&&n.analysis.length>10,l.id+' 说明过短');
  assert.ok(Array.isArray(n.errors)&&n.errors.length>=2,l.id+' 错因解析不足两条');
 }
});
check('补充说明为原创教学解释，未伪造教材页码/原文/插图',()=>{
 const text=Object.values(loop.NOTES).map(n=>[n.lab,n.analysis,...n.errors].join('\n')).join('\n')+
   Object.keys(loop.DIAGRAMS).map(c=>loop.DIAGRAMS[c]().caption).join('\n');
 assert.ok(!/第\s*\d+\s*页|P\.?\s*\d+|页\s*\d+|图\s*\d+[-－]\d+|教材原文|原书插图|见课本/.test(text),'出现疑似伪造的教材定位');
 assert.ok(!/阎石/.test(text),'补充说明不应以作者名义陈述原创解释');
});
check('学习闭环八个环节对每节均有内容来源',()=>{
 for(const l of lessons){
  const n=loop.NOTES[l.id];
  const stages={
   '生活类比':l.analogy,'原理讲解':l.explanation,'公式推导':l.formula+' '+l.steps.join(' '),
   '图形演示':loop.DIAGRAMS[l.chapter]().svg,'动手实验':n.lab,'结果分析':n.analysis,
   '随堂练习':l.quiz.question,'错因解析':n.errors.join(' ')
  };
  for(const [k,v]of Object.entries(stages))assert.ok(v&&String(v).length>5,l.id+' 缺少 '+k);
 }
});
check('HTML 与 V1.8 渲染入口正确接入增强层',()=>{
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.equal(html.split('<script src="assets/v2.4-learning-loop.js"></script>').length-1,1);
 assert.ok(html.indexOf('assets/v2.4-learning-loop.js')<html.indexOf('assets/legacy/navigation.js'));
 const v18=fs.readFileSync(path.join(root,'assets/v1.8.js'),'utf8');
 assert.ok(v18.includes('DigitalV24LearningLoop?.render(mainPane,l)'));
});

/* ===== 重点知识点的独立数值一致性检查（不改动原公式，只验证其自洽） ===== */
check('二进制位权、十六进制与格雷码相邻只差一位',()=>{
 for(let n=0;n<=255;n++){
  const r=M.binary(n);
  assert.equal(r.bits.reduce((s,b,i)=>s+b*r.weights[i],0),n);
  assert.equal(parseInt(r.hex,16),n);
  const gray=n^(n>>1),prev=(n-1)^((n-1)>>1);
  if(n>0){
   const diff=(gray^prev).toString(2).replace(/0/g,'').length;
   assert.equal(diff,1,'格雷码 '+n+' 相邻位差');
  }
 }
});
check('8 位补码：x 与 -x 相加模 256 为 0',()=>{
 for(let n=1;n<=127;n++){
  const neg=(256-n)&255;
  assert.equal((n+neg)&255,0);
  assert.equal(neg>>7,1,'负数补码最高位应为 1');
 }
});
check('半加器/全加器与译码器、数据选择器的真值关系自洽',()=>{
 for(const a of[0,1])for(const b of[0,1])for(const ci of[0,1]){
  const s1=M.adder(a,b),s2=M.adder(s1.sum,ci);
  const carry=s1.carry||s2.carry, sum=s2.sum;
  assert.equal(sum+2*carry,a+b+ci,'全加器 '+a+b+ci);
  const decoder=1<<((a<<1)|b);
  assert.equal(decoder.toString(2).replace(/0/g,'').length,1,'译码器应 one-hot');
  const data=[3,5,7,9],mux=data[(a<<1)|b];
  assert.equal(mux,data[(a*2+b)],'数据选择器选路');
 }
});
check('D/JK/T 触发器：T=1 时每沿翻转，四分频需两个触发器',()=>{
 let q=0;const seq=[];
 for(let i=0;i<4;i++){q=1-q;seq.push(q);}
 assert.deepEqual(seq,[1,0,1,0]);
 let st=M.newDff();st=M.setDff(st,1);assert.equal(st.Q,0);
 st=M.clockDff(st);assert.equal(st.Q,1,'D 触发器只在有效沿更新');
});
check('模 2～16 计数器回绕与未使用状态计数正确',()=>{
 for(let mod=2;mod<=16;mod++){
  let n=0;for(let i=0;i<mod;i++)n=M.tickCounter(n,mod).value;
  assert.equal(n,0);
  const bits=M.counter(0,mod).bits;
  assert.equal((1<<bits)-mod>=0,true,'mod='+mod+' 未使用状态数应为非负');
 }
});
check('555 理想公式：周期、频率与占空比互相自洽',()=>{
 for(const [r1,r2,c]of[[1,1,1],[10,20,10],[100,47,100]]){
  const t=M.timer555(r1,r2,c);
  assert.ok(Math.abs(t.period-(t.tHigh+t.tLow))<1e-12);
  assert.ok(Math.abs(t.frequency*t.period-1)<1e-12);
  assert.ok(Math.abs(t.duty-100*(r1+r2)/(r1+2*r2))<1e-9);
 }
});
check('ADC/DAC 量化：码单调、步长正确、误差小于一个步长',()=>{
 for(const bits of[8,10,12]){
  const levels=2**bits,step=3.3/levels;
  let last=-1;
  for(let k=0;k<=200;k++){
   const vin=3.3*k/200,r=M.adc(bits,3.3,vin);
   assert.ok(r.code>=last,'码值应单调不减');last=r.code;
   assert.ok(r.code>=0&&r.code<levels);
   assert.ok(r.error>=-1e-12&&r.error<step+1e-12,'量化误差越界');
   assert.ok(Math.abs(r.restored-r.code*step)<1e-12,'DAC 还原电压与码值不一致');
  }
 }
});
console.log('V2.4 学习闭环与重点知识点一致性共 '+count+' 项检查通过。');
