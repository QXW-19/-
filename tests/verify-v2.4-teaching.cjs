/* V2.4 教学计算质量门：使用独立数学事实检验理想实验模型。
 * 不修改任何教材数据、公式或旧版 localStorage。
 */
'use strict';
const assert=require('node:assert/strict');
const M=require('../assets/v1.8-core.js');
const P=require('../assets/v1.7-core.js');
let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name);}
function near(actual,expected,tol=1e-10){
 assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol,
  '数值不一致：实际 '+actual+'，期望 '+expected);
}
check('二进制 0～255 全值的位权求和与十六进制一致',()=>{
 for(let n=0;n<=255;n++){
  const r=M.binary(n);
  assert.equal(r.bits.reduce((s,b,i)=>s+b*r.weights[i],0),n);
  assert.equal(parseInt(r.hex,16),n);
 }
});
check('四种逻辑门覆盖 0/1 输入真值表',()=>{
 for(const a of [0,1])for(const b of [0,1]){
  assert.equal(M.gate('AND',a,b).output,Number(a===1&&b===1));
  assert.equal(M.gate('OR',a,b).output,Number(a===1||b===1));
  assert.equal(M.gate('XOR',a,b).output,Number(a!==b));
  assert.equal(M.gate('NOT',a,b).output,1-a);
 }
});
check('CMOS 理想反相器输出与上下拉文字相符',()=>{
 assert.deepEqual([M.cmos(0).output,M.cmos(1).output],[1,0]);
 assert.match(M.cmos(0).conducting,/PMOS/);
 assert.match(M.cmos(1).conducting,/NMOS/);
});
check('半加器四种输入满足 A+B=SUM+2×CARRY',()=>{
 for(const a of [0,1])for(const b of [0,1]){
  const x=M.adder(a,b);
  assert.equal(x.sum+2*x.carry,a+b);
 }
});
check('D 触发器仅在模拟有效时钟沿更新 Q',()=>{
 let s=M.newDff();
 s=M.setDff(s,1);assert.equal(s.Q,0);
 s=M.clockDff(s);assert.equal(s.Q,1);
 s=M.setDff(s,0);assert.equal(s.Q,1);
 s=M.clockDff(s);assert.equal(s.Q,0);assert.equal(s.edges,2);
});
check('模 2～16 计数器准确回绕',()=>{
 for(let mod=2;mod<=16;mod++){
  let s=0;
  for(let i=0;i<mod;i++)s=M.tickCounter(s,mod).value;
  assert.equal(s,0,'模 '+mod+' 回绕');
 }
});
check('555 理想无稳态公式频率、周期、占空比自洽',()=>{
 for(const [r1,r2,c]of [[1,1,1],[10,20,10],[100,47,100]]){
  const t=M.timer555(r1,r2,c);
  near(t.period,t.tHigh+t.tLow,1e-12);
  near(t.frequency*t.period,1,1e-12);
  near(t.duty,100*(r1+r2)/(r1+2*r2),1e-10);
 }
});
check('ADC 8/10/12 位量化单调、码范围正确',()=>{
 for(const bits of [8,10,12]){
  const max=2**bits-1,vref=3.3;
  assert.equal(M.adc(bits,vref,0).code,0);
  assert.equal(M.adc(bits,vref,vref).code,max);
  let prev=-1;
  for(let k=0;k<=100;k++){
   const x=M.adc(bits,vref,vref*k/100);
   assert.ok(x.code>=prev&&x.code<=max);
   assert.ok(x.error>=-1e-12&&x.error<=x.step+1e-12);
   prev=x.code;
  }
 }
});
check('七段数码管显示 8 时七段全亮',()=>{
 const s=P.fresh();
 const d=P.digit(8);
 assert.equal(d.bits.reduce((a,b)=>a+b,0),7);
 assert.equal(d.symbol,'8');
});
check('交通灯完整 30 模拟秒回到南北绿阶段',()=>{
 let s=P.fresh();
 for(let i=0;i<30;i++)s=P.trafficStep(s);
 assert.equal(s.traffic.phase,0);
 assert.equal(s.traffic.cycles,1);
});
check('电子钟从 23:59:59 下一秒回到 00:00:00',()=>{
 let s=P.setTime(P.fresh(),23,59,59);
 s=P.clockStep(s);
 assert.equal(P.timeString(s),'00:00:00');
});
console.log('V2.4 '+count+' 项教学计算一致性检查通过（理想模型；非真实硬件验证）。');
