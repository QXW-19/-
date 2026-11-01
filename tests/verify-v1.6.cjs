/* V1.6 综合逻辑实验室：零依赖回归。
 * Windows / VSCode: node tests/verify-v1.6.cjs
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../assets/v1.6-core.js');let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name)}
const value=(c,type)=>{const n=c.nodes.find(n=>n.type===type);return M.evaluate(c)[n.id].outputs[0]};
const count=c=>c.nodes.find(n=>n.type==='COUNTER').count;
test('空白电路可验证',()=>assert.equal(M.validate(M.empty()),true));
test('所有元件都在元件库',()=>assert.equal(Object.keys(M.SPECS).length,13));
test('开关初始输出 0',()=>{let c=M.add(M.empty(),'SWITCH');assert.equal(value(c,'SWITCH'),0)});
test('非门能反相',()=>{let c=M.empty();c=M.add(c,'SWITCH');c=M.add(c,'NOT');c=M.connect(c,'n1',0,'n2',0);assert.equal(value(c,'NOT'),1);c=M.toggle(c,'n1');assert.equal(value(c,'NOT'),0)});
test('AND 的 0 与 X 计算为 0',()=>{let c=M.empty();c=M.add(c,'SWITCH');c=M.add(c,'AND');c=M.connect(c,'n1',0,'n2',0);assert.equal(value(c,'AND'),0)});
test('OR 的 1 与 X 计算为 1',()=>{let c=M.empty();c=M.add(c,'SWITCH');c=M.add(c,'OR');c=M.connect(c,'n1',0,'n2',0);c=M.toggle(c,'n1');assert.equal(value(c,'OR'),1)});
test('完全悬空逻辑为 X',()=>{let c=M.add(M.empty(),'XOR');assert.equal(value(c,'XOR'),null)});
test('没有时钟源时拒绝手动脉冲',()=>assert.throws(()=>M.pulse(M.empty()),/时钟源/));
test('同一个输入端不能重复连接',()=>{let c=M.empty();c=M.add(c,'SWITCH');c=M.add(c,'SWITCH');c=M.add(c,'OR');c=M.connect(c,'n1',0,'n3',0);c=M.connect(c,'n2',0,'n3',0);assert.equal(c.wires.length,1);assert.equal(c.wires[0].from,'n2')});
test('输入/输出端口编号校验',()=>{let c=M.empty();c=M.add(c,'SWITCH');c=M.add(c,'DFF');assert.throws(()=>M.connect(c,'n1',7,'n2',0),/端口/);assert.throws(()=>M.connect(c,'n1',0,'n2',5),/端口/)});
test('组合逻辑环被拒绝',()=>{let c=M.add(M.empty(),'NOT');assert.throws(()=>M.connect(c,'n1',0,'n1',0),/环路/)});
test('经过寄存器的反馈可以连接',()=>{let c=M.empty();c=M.add(c,'DFF');c=M.add(c,'NOT');c=M.connect(c,'n1',0,'n2',0);c=M.connect(c,'n2',0,'n1',0);assert.equal(M.validate(c),true)});
test('DFF 在下一时钟沿前保持旧值',()=>{let c=M.example('sample'),a=c.nodes.find(n=>n.type==='SWITCH');c=M.toggle(c,a.id);assert.equal(value(c,'DFF'),0);c=M.pulse(c);assert.equal(value(c,'DFF'),1)});
test('DFF 下一时钟沿采样变更后的组合输出',()=>{let c=M.example('sample'),a=c.nodes.find(n=>n.type==='SWITCH');c=M.toggle(c,a.id);c=M.pulse(c);c=M.toggle(c,a.id);assert.equal(value(c,'DFF'),1);c=M.pulse(c);assert.equal(value(c,'DFF'),0)});
test('DFF 输入未知时可在时钟沿后变为 X',()=>{let c=M.empty();c=M.add(c,'CLOCK');c=M.add(c,'DFF');c=M.connect(c,'n1',0,'n2',1);c=M.pulse(c);assert.equal(value(c,'DFF'),null)});
test('计数器时钟沿计数并按 MOD6 回绕',()=>{let c=M.example('counter');for(let i=1;i<=12;i++){c=M.pulse(c);assert.equal(count(c),i%6)}});
test('计数器四路输出按 Q0-Q3 对应二进制',()=>{let c=M.example('counter');c=M.pulse(c);c=M.pulse(c);c=M.pulse(c);const n=c.nodes.find(n=>n.type==='COUNTER');assert.deepEqual(M.evaluate(c)[n.id].outputs,[1,1,0,0])});
test('EN=0 时计数保持',()=>{let c=M.example('counter');const en=c.nodes.filter(n=>n.type==='SWITCH')[0].id;c=M.setSwitch(c,en,0);c=M.pulse(c);assert.equal(count(c),0)});
test('RST=1 优先同步清零',()=>{let c=M.example('counter');c=M.pulse(c);c=M.pulse(c);const rst=c.nodes.filter(n=>n.type==='SWITCH')[1].id;c=M.setSwitch(c,rst,1);assert.equal(count(c),2);c=M.pulse(c);assert.equal(count(c),0)});
test('模数改为 10 后可正确回绕',()=>{let c=M.example('counter'),n=c.nodes.find(n=>n.type==='COUNTER');c=M.setModulus(c,n.id,10);for(let i=0;i<10;i++)c=M.pulse(c);assert.equal(count(c),0)});
test('JK=11 连续翻转',()=>{let c=M.example('jk');for(let i=1;i<=6;i++){c=M.pulse(c);assert.equal(value(c,'JKFF'),i%2)}});
test('JK=00 保持',()=>{let c=M.example('jk');const inputs=c.nodes.filter(n=>n.type==='SWITCH');c=M.setSwitch(c,inputs[0].id,0);c=M.setSwitch(c,inputs[1].id,0);c=M.pulse(c);assert.equal(value(c,'JKFF'),0)});
test('TFF T=1 每沿翻转',()=>{let c=M.empty();c=M.add(c,'CLOCK');c=M.add(c,'SWITCH');c=M.add(c,'TFF');c=M.connect(c,'n1',0,'n3',1);c=M.connect(c,'n2',0,'n3',0);c=M.toggle(c,'n2');c=M.pulse(c);assert.equal(value(c,'TFF'),1);c=M.pulse(c);assert.equal(value(c,'TFF'),0)});
test('组合反相时钟的下降相位也有上升沿',()=>{let c=M.empty();c=M.add(c,'CLOCK');c=M.add(c,'NOT');c=M.add(c,'TFF');c=M.add(c,'SWITCH');c=M.setSwitch(c,'n4',1);c=M.connect(c,'n1',0,'n2',0);c=M.connect(c,'n2',0,'n3',1);c=M.connect(c,'n4',0,'n3',0);c=M.pulse(c);assert.equal(value(c,'TFF'),1)});
test('手动开关作为 CLK 能产生上升沿',()=>{let c=M.empty();c=M.add(c,'SWITCH');c=M.add(c,'SWITCH');c=M.add(c,'DFF');c=M.setSwitch(c,'n2',1);c=M.connect(c,'n1',0,'n3',1);c=M.connect(c,'n2',0,'n3',0);c=M.toggle(c,'n1');assert.equal(value(c,'DFF'),1)});
test('复位清空时钟记录和 Q',()=>{let c=M.example('jk');c=M.pulse(c);assert.equal(value(c,'JKFF'),1);c=M.reset(c);assert.equal(value(c,'JKFF'),0);assert.equal(c.tick,0);assert.equal(c.history.length,0)});
test('波形记录保留最后 48 次',()=>{let c=M.example('counter');for(let i=0;i<55;i++)c=M.pulse(c);assert.equal(c.tick,55);assert.equal(c.history.length,48);assert.equal(c.history[0].tick,8)});
test('删除元件自动删除相关导线',()=>{let c=M.example('sample'),id=c.nodes.find(n=>n.type==='XOR').id;c=M.remove(c,id);assert.equal(c.wires.some(w=>w.from===id||w.to===id),false)});
test('修改连线后保存正确的时钟采样状态',()=>{let c=M.empty();c=M.add(c,'CLOCK');c=M.add(c,'DFF');c=M.connect(c,'n1',0,'n2',1);assert.equal(c.nodes[1].lastClk,0)});
test('对错误 JSON 数据拒绝导入',()=>{for(const d of [{version:2,nodes:[],wires:[],tick:0,history:[]},{version:1,nodes:[{id:'n1',type:'HACK',x:0,y:0}],wires:[],tick:0,history:[]},{version:1,nodes:[],wires:[{from:'n1',output:0,to:'n2',input:0}],tick:0,history:[]}])assert.throws(()=>M.validate(d))});
test('JSON 导出导入保留状态',()=>{const c=M.pulse(M.example('counter'));const data=JSON.parse(JSON.stringify(c));assert.equal(M.validate(data),true);assert.deepEqual(data,c)});
test('网页脚本语法与 HTML 资源顺序',()=>{
 const root=path.resolve(__dirname,'..');
 for(const name of ['v1.6-core.js','v1.6.js'])new vm.Script(fs.readFileSync(path.join(root,'assets',name),'utf8'));
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.equal([...html.matchAll(/<section class="mod" id="/g)].length,51);
 for(const key of ['assets/v1.1.js','assets/v1.2.js','assets/v1.3.js','assets/v1.4.js','assets/v1.5.js','assets/v1.6-core.js','assets/v1.6.js','assets/v1.6.css'])assert.ok(html.includes(key));
 assert.ok(html.indexOf('assets/v1.6-core.js')<html.indexOf('assets/v1.6.js'));
});
console.log('全部 '+passed+' 项 V1.6 回归通过（浏览器 UI 仍需实际验收）。');
