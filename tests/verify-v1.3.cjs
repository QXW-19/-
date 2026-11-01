/* V1.3 零依赖 Node.js 回归测试：node tests/verify-v1.3.cjs */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const M=require('../assets/v1.3-core.js');
let n=0;
const test=(name,fn)=>{fn();n++;console.log('PASS '+name)};
function gate(type,a,b){
 let c=M.newCircuit();c=M.addNode(c,'SWITCH',20,20);c=M.addNode(c,'SWITCH',20,150);c=M.addNode(c,type,350,100);c=M.addNode(c,'LED',550,100);
 if(a)c=M.toggleSwitch(c,'n1');if(b)c=M.toggleSwitch(c,'n2');
 c=M.connect(c,'n1','n3',0);if(type!=='NOT')c=M.connect(c,'n2','n3',1);c=M.connect(c,'n3','n4',0);return M.evaluate(c).n4.value;
}
for(const [type,want] of Object.entries({AND:[0,0,0,1],OR:[0,1,1,1],XOR:[0,1,1,0],NAND:[1,1,1,0],NOR:[1,0,0,0]})){
 test(type+' 真值表',()=>assert.deepEqual([gate(type,0,0),gate(type,0,1),gate(type,1,0),gate(type,1,1)],want));
}
test('NOT 真值表',()=>{assert.equal(gate('NOT',0,0),1);assert.equal(gate('NOT',1,0),0)});
test('悬空输入输出未知 X',()=>{let c=M.newCircuit();c=M.addNode(c,'AND');assert.equal(M.evaluate(c).n1.value,null)});
test('与门示例四种输入',()=>{const t=M.truthTable(M.example('and'));assert.deepEqual(t.rows.map(r=>r.outputs[0]),[0,0,0,1])});
test('半加器 SUM/CARRY',()=>{const t=M.truthTable(M.example('halfAdder'));assert.deepEqual(t.rows.map(r=>Array.from(r.outputs)),[[0,0],[1,0],[1,0],[0,1]])});
test('非法端口、自反馈、重复输入拒绝',()=>{let c=M.example('and');assert.throws(()=>M.connect(c,'n3','n3',0),/反馈/);assert.throws(()=>M.connect(c,'n1','n3',3),/端口/);const clone=JSON.parse(JSON.stringify(c));clone.wires.push({...clone.wires[0]});assert.throws(()=>M.validate(clone),/最多只能接/);});
test('双元件循环被拒绝',()=>{let c=M.newCircuit();c=M.addNode(c,'NOT');c=M.addNode(c,'NOT');c=M.connect(c,'n1','n2',0);assert.throws(()=>M.connect(c,'n2','n1',0),/反馈/);assert.equal(c.wires.length,1)});
test('删除元件清理导线',()=>{let c=M.example('and');c=M.removeNode(c,'n3');assert.equal(c.wires.length,0);assert.equal(c.nodes.length,3)});
test('断开后输出未知',()=>{let c=M.disconnect(M.example('and'),'n4',0);assert.equal(M.evaluate(c).n4.value,null)});
test('恶意或损坏的 JSON 拒绝',()=>{for(const data of [{version:2,nodes:[],wires:[]},{version:1,nodes:[{id:'n1',type:'SCRIPT',x:1,y:1}],wires:[]},{version:1,nodes:[{id:'n1',type:'SWITCH',value:5,x:1,y:1}],wires:[]}])assert.throws(()=>M.validate(data))});
test('开关与元件移动后可以导入还原',()=>{let c=M.example('halfAdder');c=M.moveNode(c,'n1',123,234);c=M.toggleSwitch(c,'n1');const obj=JSON.parse(JSON.stringify(c));assert.ok(M.validate(obj));assert.equal(obj.nodes[0].x,123);assert.equal(obj.nodes[0].value,1)});
test('真值表最多四个输入开关',()=>{let c=M.example('and');for(let i=0;i<3;i++)c=M.addNode(c,'SWITCH');assert.throws(()=>M.truthTable(c),/最多/);});
test('UI JS 语法和 CSS 结构',()=>{new vm.Script(fs.readFileSync(path.join(__dirname,'../assets/v1.3.js'),'utf8'));assert.match(fs.readFileSync(path.join(__dirname,'../assets/v1.3.css'),'utf8'),/\.v13-board/);});
test('三值逻辑控制值：0 AND X 与 1 OR X',()=>{let c=M.newCircuit();c=M.addNode(c,'SWITCH');c=M.addNode(c,'AND');c=M.addNode(c,'OR');c=M.connect(c,'n1','n2',0);c=M.connect(c,'n1','n3',0);assert.equal(M.evaluate(c).n2.value,0);assert.equal(M.evaluate(c).n3.value,null);c=M.toggleSwitch(c,'n1');assert.equal(M.evaluate(c).n2.value,null);assert.equal(M.evaluate(c).n3.value,1)});
console.log('共 '+n+' 项检查通过。实际浏览器端到端验收需另行执行。');
