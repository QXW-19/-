/* ==========================================================================
   V2.5.2 数字密码锁电路（纯逻辑，可在浏览器与 Node 中共用）
   --------------------------------------------------------------------------
   4 位并行比较（异或 + 非 + 与树）+ 1 个 D 触发器保持开锁状态。
   只使用 V1.6 引擎原语，不新建仿真核心；不含键盘扫描与去抖。
   ========================================================================== */
(function(root,factory){
'use strict';
const api=factory(typeof require==='function'?require('../v1.6-core.js'):root.DigitalMixedCircuit);
if(typeof module==='object'&&module.exports)module.exports=api;
else root.DigitalV252Lock=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(M){
'use strict';
if(!M)throw new Error('V1.6 引擎未加载');

function build(){
 let c=M.empty();
 const put=(type,x,y)=>{c=M.add(c,type,x,y);return c.nodes[c.nodes.length-1].id;};
 const wire=(a,o,b,i)=>{c=M.connect(c,a,o,b,i);};
 const p=[],k=[],x=[],e=[];
 for(let i=3;i>=0;i--)p[i]=put('SWITCH',40,60+(3-i)*120);
 for(let i=3;i>=0;i--)k[i]=put('SWITCH',40,560+(3-i)*120);
 for(let i=3;i>=0;i--){
  x[i]=put('XOR',300,80+(3-i)*120);
  e[i]=put('NOT',480,80+(3-i)*120);
 }
 const a1=put('AND',660,120),a2=put('AND',660,360),match=put('AND',820,240);
 const notM=put('NOT',960,460),ledM=put('LED',980,240),ledE=put('LED',1080,460);
 const clk=put('CLOCK',620,520),dff=put('DFF',840,560),ledU=put('LED',1020,560);
 for(let i=0;i<4;i++){
  wire(p[i],0,x[i],0);wire(k[i],0,x[i],1);wire(x[i],0,e[i],0);
 }
 wire(e[0],0,a1,0);wire(e[1],0,a1,1);
 wire(e[2],0,a2,0);wire(e[3],0,a2,1);
 wire(a1,0,match,0);wire(a2,0,match,1);
 wire(match,0,ledM,0);
 wire(match,0,notM,0);wire(notM,0,ledE,0);
 wire(match,0,dff,0);wire(clk,0,dff,1);wire(dff,0,ledU,0);
 M.validate(c);
 return {circuit:c,ids:{p,k,x,e,a1,a2,match,notM,ledM,ledE,clk,dff,ledU}};
}

function setBits(c,ids,kind,arr){
 let out=c;
 const list=ids[kind];
 arr.slice(0,4).forEach((v,i)=>{out=M.setSwitch(out,list[i],v?1:0);});
 return out;
}
function read(c,ids){
 const st=M.evaluate(c);
 const bit=id=>st[id].inputs[0]===null?'X':st[id].inputs[0];
 return {match:bit(ids.ledM),err:bit(ids.ledE),unlock:st[ids.dff].outputs[0],tick:c.tick};
}
function confirm(c){return M.pulse(c);}
function reset(c){return M.reset(c);}

return Object.freeze({build,setBits,read,confirm,reset});
});
