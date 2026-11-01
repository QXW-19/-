/* V1.7 综合实训回归：在 VSCode 终端运行 node tests/verify-v1.7.cjs */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const M=require('../assets/v1.7-core.js');
const root=path.resolve(__dirname,'..');
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}
test('理想项目初始状态合法',()=>assert.equal(M.validate(M.fresh()),true));
test('三个实训项目 API 均可执行',()=>{const s=M.fresh();assert.equal(M.digit(s.seven.value).symbol,'0');assert.equal(M.lampState(s).ns,'green');assert.equal(M.timeString(s),'12:00:00');});
test('七段译码表有 16 个互异合法输入',()=>{const t=M.segmentTable();assert.equal(t.length,16);assert.equal(new Set(t.map(x=>x.input)).size,16);});
test('数字 8 七段全亮',()=>assert.deepEqual(M.digit(8).bits,[1,1,1,1,1,1,1]));
test('数字 1 仅点亮 b/c',()=>assert.deepEqual(M.digit(1).bits,[0,1,1,0,0,0,0]));
test('数字 0 仅熄灭 g',()=>assert.deepEqual(M.digit(0).bits,[1,1,1,1,1,1,0]));
test('BCD 之外 A～F 提供显示字形',()=>{assert.equal(M.digit(10).symbol,'A');assert.equal(M.digit(15).symbol,'F');});
test('非法数码管值拒绝',()=>{for(const x of [-1,16,1.4,'5',NaN])assert.throws(()=>M.digit(x),/必须/);});
test('设置数码管输入为 8',()=>{const s=M.setDigit(M.fresh(),8);assert.equal(s.seven.value,8);assert.equal(M.validate(s),true);});
test('六个交通灯状态完整',()=>{const table=M.trafficTable();assert.equal(table.length,6);assert.equal(new Set(table.map(x=>x.id)).size,6);});
test('交通灯完整周期 30 秒',()=>assert.equal(M.PHASES.reduce((n,p)=>n+p.seconds,0),30));
test('南北绿灯持续 10 个模拟秒',()=>{let s=M.fresh();for(let i=0;i<9;i++){s=M.trafficStep(s);assert.equal(s.traffic.phase,0)}s=M.trafficStep(s);assert.equal(s.traffic.phase,1);});
test('南北黄灯维持 3 秒',()=>{let s=M.fresh();for(let i=0;i<12;i++)s=M.trafficStep(s);assert.equal(s.traffic.phase,1);s=M.trafficStep(s);assert.equal(s.traffic.phase,2);});
test('东西绿灯前有全红缓冲 2 秒',()=>{let s=M.fresh();for(let i=0;i<13;i++)s=M.trafficStep(s);assert.equal(M.lampState(s).ns,'red');assert.equal(M.lampState(s).ew,'red');s=M.trafficStep(s);assert.equal(s.traffic.phase,2);s=M.trafficStep(s);assert.equal(s.traffic.phase,3);});
test('全部状态均不会两个方向同时放行',()=>{let s=M.fresh();for(let i=0;i<1000;i++){assert.equal(M.assertSafeTraffic(s),true);s=M.trafficStep(s)}});
test('交通灯 30 秒返回首状态且循环数加一',()=>{let s=M.fresh();for(let i=0;i<30;i++)s=M.trafficStep(s);assert.equal(s.traffic.phase,0);assert.equal(s.traffic.remaining,10);assert.equal(s.traffic.cycles,1);});
test('交通灯可单独重置',()=>{let s=M.trafficStep(M.fresh());s=M.resetTraffic(s);assert.equal(s.traffic.elapsed,0);assert.equal(s.clock.hour,12);});
test('13:29:59 下一秒为 13:30:00',()=>{let s=M.setTime(M.fresh(),13,29,59);s=M.clockStep(s);assert.equal(M.timeString(s),'13:30:00')});
test('12:59:59 下一秒为 13:00:00',()=>{let s=M.setTime(M.fresh(),12,59,59);s=M.clockStep(s);assert.equal(M.timeString(s),'13:00:00');});
test('23:59:59 午夜回到 00:00:00',()=>{let s=M.setTime(M.fresh(),23,59,59);s=M.clockStep(s);assert.equal(M.timeString(s),'00:00:00');});
test('00:00:00 下一秒为 00:00:01',()=>{let s=M.setTime(M.fresh(),0,0,0);s=M.clockStep(s);assert.equal(M.timeString(s),'00:00:01');});
test('不允许设置超出 24 小时制范围的时间',()=>{for(const args of [[24,0,0],[0,60,0],[0,0,-1],[1.5,0,0]])assert.throws(()=>M.setTime(M.fresh(),...args),/时间必须/);});
test('电子钟不会修改交通灯独立状态',()=>{let s=M.trafficStep(M.fresh());const p=JSON.stringify(s.traffic);s=M.clockStep(s);assert.equal(JSON.stringify(s.traffic),p);});
test('两种历史记录分别最多保留 60 个模拟秒',()=>{let s=M.fresh();for(let i=0;i<85;i++){s=M.trafficStep(s);s=M.clockStep(s)}assert.equal(s.clock.history.length,60);assert.equal(s.traffic.history.length,60);assert.equal(s.clock.history[0].elapsed,26);});
test('安全检查点满足初始正确范围',()=>{const res=M.checkpoints(M.fresh());assert.equal(res.digit.pass,true);assert.equal(res.traffic.pass,true);assert.equal(res.clock.pass,true);});
test('导出的 JSON 可以恢复校验',()=>{const s=M.clockStep(M.setDigit(M.fresh(),8));assert.equal(M.validate(JSON.parse(JSON.stringify(s))),true);});
test('拒绝损坏或其他版本的记录',()=>{for(const s of [{version:2,seven:{value:0},traffic:{},clock:{}},{version:1,seven:{value:16},traffic:{},clock:{}},null])assert.throws(()=>M.validate(s));});
test('入门导学有 8 章、每章 3 个术语与三步例题',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/v1.7-beginner-data.js'),'utf8'),context);
 const all=context.window.DigitalBeginnerLessons;
 assert.equal(all.length,8);
 all.forEach((ch,i)=>{assert.equal(ch.chapter,i+1);assert.equal(ch.terms.length,3);assert.equal(ch.steps.length,3);assert.ok(ch.quiz.options[ch.quiz.correct]);assert.equal(ch.experiment,'m'+ch.chapter)});
});
test('原来的 51 个教学模块保留且新资源正确接入',()=>{
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.equal([...html.matchAll(/<section class="mod" id="/g)].length,51);
 for(const x of ['assets/v1.1.js','assets/v1.2.js','assets/v1.3.js','assets/v1.4.js','assets/v1.5.js','assets/v1.6.js','assets/v1.7.js','assets/v1.7-beginner.js','assets/v1.7-beginner-data.js','assets/v1.7-core.js','assets/v1.7.css'])assert.ok(html.includes(x));
 assert.ok(html.indexOf('assets/v1.7-core.js')<html.indexOf('assets/v1.7.js'));
 assert.ok(html.indexOf('assets/v1.7-beginner-data.js')<html.indexOf('assets/v1.7-beginner.js'));
});
test('浏览器脚本静态语法检查',()=>{
 for(const p of ['assets/v1.7-core.js','assets/v1.7-beginner-data.js','assets/v1.7-beginner.js','assets/v1.7.js'])
 new vm.Script(fs.readFileSync(path.join(root,p),'utf8'));
});
console.log('共 '+count+' 项 V1.7 项目与入门课程回归通过。真实浏览器视觉和操作仍需本机验收。');
