/* V1.8 零基础系统课程静态和核心计算回归。
 * Windows VSCode：node tests/verify-v1.8.cjs
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../assets/v1.8-lessons.js');
const data=globalThis.DigitalV18Lessons,M=require('../assets/v1.8-core.js');
const root=path.join(__dirname,'..');let count=0;
const test=(title,fn)=>{fn();count++;console.log('PASS '+title);};
test('V1.8 课程数据版本与参考书信息',()=>{
 assert.equal(data.version,1);assert.match(data.reference,/阎石/);assert.match(data.reference,/第六版/);
});
test('八章、每章四节、总计 32 节',()=>{
 assert.equal(data.chapters.length,8);assert.equal(data.lessons.length,32);
 for(let i=1;i<=8;i++)assert.equal(data.lessons.filter(l=>l.chapter===i).length,4);
});
test('课程 ID 唯一且章节编号顺序正确',()=>{
 const ids=data.lessons.map(l=>l.id);assert.equal(new Set(ids).size,32);
 data.lessons.forEach((l,i)=>{assert.equal(l.chapter,Math.floor(i/4)+1);assert.equal(l.id,'l'+l.chapter+'-'+l.index);});
});
test('每一节有通俗类比与关键推理',()=>{
 for(const l of data.lessons){
  for(const field of ['title','analogy','explanation','formula','pitfall','practice'])assert.ok(typeof l[field]==='string'&&l[field].length>=10,l.id+': '+field);
 }
});
test('每节的三步例题完整',()=>{
 data.lessons.forEach(l=>{assert.equal(l.steps.length,3);l.steps.forEach(s=>assert.ok(s.length>=8));});
});
test('每节理解检测均有三个有效且互不重复的选项',()=>{
 for(const l of data.lessons){
  const q=l.quiz;assert.ok(q.question&&q.why);
  assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);
  assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<3);
 }
});
test('二进制位权演示 13=00001101₂',()=>{const r=M.binary(13);assert.equal(r.bits.join(''),'00001101');assert.equal(r.decimal,13);});
test('二进制 175 = AF₁₆',()=>assert.equal(M.binary(175).hex,'AF'));
test('8 位二进制全 1 等于 255',()=>assert.equal(M.binary(255).weights.reduce((a,b)=>a+b,0),255));
test('二进制非法范围拒绝',()=>{assert.throws(()=>M.binary(-1));assert.throws(()=>M.binary(256));assert.throws(()=>M.binary(16,4));});
test('AND 四行真值表正确',()=>assert.deepEqual([[0,0],[0,1],[1,0],[1,1]].map(([a,b])=>M.gate('AND',a,b).output),[0,0,0,1]));
test('OR 四行真值表正确',()=>assert.deepEqual([[0,0],[0,1],[1,0],[1,1]].map(([a,b])=>M.gate('OR',a,b).output),[0,1,1,1]));
test('XOR 四行真值表正确',()=>assert.deepEqual([[0,0],[0,1],[1,0],[1,1]].map(([a,b])=>M.gate('XOR',a,b).output),[0,1,1,0]));
test('NOT 反相正确',()=>{assert.equal(M.gate('NOT',0,0).output,1);assert.equal(M.gate('NOT',1,0).output,0);});
test('CMOS 反相器输入与上拉下拉描述一致',()=>{assert.equal(M.cmos(0).output,1);assert.match(M.cmos(0).conducting,/PMOS/);assert.equal(M.cmos(1).output,0);assert.match(M.cmos(1).conducting,/NMOS/);});
test('半加器 A=B=1 得 10₂',()=>{assert.deepEqual(M.adder(1,1),{a:1,b:1,sum:0,carry:1,result:2});});
test('半加器全真值表',()=>assert.deepEqual([[0,0],[0,1],[1,0],[1,1]].map(([a,b])=>{const x=M.adder(a,b);return [x.sum,x.carry]}),[[0,0],[1,0],[1,0],[0,1]]));
test('D 触发器 D 变化不会立即更新 Q',()=>{let s=M.setDff(M.newDff(),1);assert.equal(s.Q,0);assert.equal(s.edges,0);s=M.clockDff(s);assert.equal(s.Q,1);assert.equal(s.edges,1);});
test('D 触发器仅在下一沿采样最新 D',()=>{let s=M.clockDff(M.setDff(M.newDff(),1));s=M.setDff(s,0);assert.equal(s.Q,1);assert.equal(M.clockDff(s).Q,0);});
test('模 6 计数六拍回绕',()=>{let n=0;const values=[n];for(let i=0;i<6;i++){n=M.tickCounter(n,6).value;values.push(n)}assert.deepEqual(values,[0,1,2,3,4,5,0]);});
test('模 16 高位计数显示为 4 位',()=>assert.equal(M.counter(15,16).binary,'1111'));
test('经典 555 R1=R2=10k C=10n 约 4.81kHz',()=>{
 const t=M.timer555(10,10,10);
 assert.ok(Math.abs(t.frequency-4810)<25);
 assert.ok(Math.abs(t.duty-66.6666667)<0.01);
});
test('555 电容加倍频率减半',()=>{const a=M.timer555(10,10,10),b=M.timer555(10,10,20);assert.ok(Math.abs(a.frequency/b.frequency-2)<1e-9);});
test('555 无效电阻电容应拒绝',()=>{assert.throws(()=>M.timer555(0,10,10));assert.throws(()=>M.timer555(10,-1,10));});
test('ADC 8 位 Vref 3.3 V 中点码值 128',()=>{const a=M.adc(8,3.3,1.65);assert.equal(a.code,128);assert.equal(a.levels,256);});
test('ADC 10 位中点 512 且步长约 3.2227mV',()=>{const a=M.adc(10,3.3,1.65);assert.equal(a.code,512);assert.ok(Math.abs(a.step*1000-3.22265625)<1e-9);});
test('ADC 上端 Vin=Vref 码值夹在最大值',()=>assert.equal(M.adc(8,3.3,3.3).code,255));
test('ADC 拒绝非法输入',()=>{assert.throws(()=>M.adc(7,3.3,0));assert.throws(()=>M.adc(8,3.3,4));});
test('新增四个 JavaScript 文件语法正确',()=>{
 for(const pathPart of ['v1.8-lessons.js','v1.8-core.js','v1.8.js'])new vm.Script(fs.readFileSync(path.join(root,'assets',pathPart),'utf8'));
});
test('HTML 保留原 51 教学模块与旧版脚本',()=>{
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.equal([...html.matchAll(/<section class="mod" id="/g)].length,51);
 for(let version=1;version<=8;version++)assert.ok(html.includes('assets/v1.'+version+'.js'));
});
test('V1.8 三份脚本顺序正确且 CSS 已链接',()=>{
 const h=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.ok(h.includes('assets/v1.8.css'));
 assert.ok(h.indexOf('assets/v1.8-lessons.js')<h.indexOf('assets/v1.8-core.js'));
 assert.ok(h.indexOf('assets/v1.8-core.js')<h.indexOf('assets/v1.8.js'));
});
console.log('全部 '+count+' 项 V1.8 自动检查通过。浏览器交互和旧 3D 场景仍需本地验收。');
