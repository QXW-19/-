/* V1.6 混合数字电路引擎：组合门 + 边沿触发器 + 同步计数器。
 * 这是理想离散事件仿真：不包含电压、传播延迟、毛刺和亚稳态。
 */
(function(host,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else host.DigitalMixedCircuit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SPECS=Object.freeze({
 SWITCH:{label:'输入开关',ins:[],outs:['Y'],kind:'source'},
 CLOCK:{label:'时钟源',ins:[],outs:['CLK'],kind:'source'},
 AND:{label:'与门',ins:['A','B'],outs:['Y'],kind:'gate'},
 OR:{label:'或门',ins:['A','B'],outs:['Y'],kind:'gate'},
 XOR:{label:'异或门',ins:['A','B'],outs:['Y'],kind:'gate'},
 NOT:{label:'非门',ins:['A'],outs:['Y'],kind:'gate'},
 NAND:{label:'与非门',ins:['A','B'],outs:['Y'],kind:'gate'},
 NOR:{label:'或非门',ins:['A','B'],outs:['Y'],kind:'gate'},
 LED:{label:'LED',ins:['IN'],outs:[],kind:'sink'},
 DFF:{label:'D 触发器',ins:['D','CLK'],outs:['Q'],kind:'seq',clock:1},
 TFF:{label:'T 触发器',ins:['T','CLK'],outs:['Q'],kind:'seq',clock:1},
 JKFF:{label:'JK 触发器',ins:['J','K','CLK'],outs:['Q'],kind:'seq',clock:2},
 COUNTER:{label:'同步计数器',ins:['CLK','EN','RST'],outs:['Q0','Q1','Q2','Q3'],kind:'seq',clock:0}
});
const MAX_NODES=80,MAX_WIRES=200,HISTORY=48;
const bit=x=>x===0||x===1||x===null;
const copy=c=>JSON.parse(JSON.stringify(c));
const empty=()=>({version:1,nodes:[],wires:[],tick:0,history:[]});
function validate(c){
 if(!c||c.version!==1||!Array.isArray(c.nodes)||!Array.isArray(c.wires)||!Array.isArray(c.history))throw Error('不是 V1.6 电路文件');
 if(c.nodes.length>MAX_NODES||c.wires.length>MAX_WIRES||c.history.length>HISTORY)throw Error('电路规模超限');
 if(!Number.isSafeInteger(c.tick)||c.tick<0||c.tick>1000000)throw Error('时钟计数无效');
 const ids=new Set(),byId=new Map();
 for(const n of c.nodes){
  if(!n||typeof n.id!=='string'||!/^n[1-9]\d{0,6}$/.test(n.id)||ids.has(n.id)||!Object.prototype.hasOwnProperty.call(SPECS,n.type))throw Error('元件 ID 或类型无效');
  if(!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.x>5000||n.y<0||n.y>5000)throw Error('元件坐标无效');
  const spec=SPECS[n.type];ids.add(n.id);byId.set(n.id,n);
  if(spec.kind==='source'&&(n.value!==0&&n.value!==1))throw Error('输入源值必须为 0/1');
  if(spec.kind==='seq'&&(!bit(n.q)||!bit(n.lastClk)))throw Error('触发器状态或上一时钟状态无效');
  if(n.type==='COUNTER'&&(!Number.isInteger(n.modulus)||n.modulus<2||n.modulus>16||(n.count!==null&&(!Number.isInteger(n.count)||n.count<0||n.count>=n.modulus))))throw Error('计数器状态与模数无效');
 }
 const ports=new Set(),indeg=new Map(c.nodes.filter(n=>SPECS[n.type].kind!=='seq').map(n=>[n.id,0]));
 const adj=new Map(c.nodes.map(n=>[n.id,[]]));
 for(const w of c.wires){
  if(!w||typeof w.from!=='string'||typeof w.to!=='string'||!Number.isInteger(w.output)||!Number.isInteger(w.input))throw Error('非法导线结构');
  const a=byId.get(w.from),b=byId.get(w.to);
  if(!a||!b||w.output<0||w.output>=SPECS[a.type].outs.length||w.input<0||w.input>=SPECS[b.type].ins.length)throw Error('端口不存在或方向错误');
  const key=w.to+':'+w.input;if(ports.has(key))throw Error('一个输入端不能接多根线');
  ports.add(key);
  // 时序单元的输出来自寄存器旧状态，入边不形成组合逻辑循环。
  if(SPECS[b.type].kind!=='seq'){if(indeg.has(w.from))indeg.set(w.to,indeg.get(w.to)+1);adj.get(w.from).push(w.to);}
 }
 const queue=[...indeg.keys()].filter(k=>indeg.get(k)===0);
 let n=0;for(let i=0;i<queue.length;i++){n++;for(const to of adj.get(queue[i])){indeg.set(to,indeg.get(to)-1);if(indeg.get(to)===0)queue.push(to);}}
 if(n!==indeg.size)throw Error('不允许没有寄存器隔离的组合逻辑环路');
 let previous=0;
 for(const h of c.history){
  if(!h||!Number.isInteger(h.tick)||h.tick<=previous||h.tick>c.tick||!h.states||typeof h.states!=='object'||Array.isArray(h.states))throw Error('时钟历史无效');
  previous=h.tick;
  for(const [id,v] of Object.entries(h.states)){if(!ids.has(id)||typeof v!=='string'||v.length>8||!/^[01X]+$/.test(v))throw Error('时钟历史状态无效');}
 }
 return true;
}
function add(c,type,x=80,y=80){
 validate(c);if(!Object.prototype.hasOwnProperty.call(SPECS,type))throw Error('未知元件');
 if(c.nodes.length>=MAX_NODES)throw Error('元件数量已达上限');
 const out=copy(c);let i=1;while(out.nodes.some(n=>n.id==='n'+i))i++;
 const n={id:'n'+i,type,x:Math.round(Math.max(0,Math.min(5000,x))),y:Math.round(Math.max(0,Math.min(5000,y)))};
 if(SPECS[type].kind==='source')n.value=0;
 if(SPECS[type].kind==='seq'){n.q=0;n.lastClk=0;}
 if(type==='COUNTER'){n.modulus=6;n.count=0;}
 out.nodes.push(n);return out;
}
function move(c,id,x,y){validate(c);const out=copy(c),n=out.nodes.find(n=>n.id===id);if(!n)throw Error('元件不存在');n.x=Math.round(Math.max(0,Math.min(5000,x)));n.y=Math.round(Math.max(0,Math.min(5000,y)));return out;}
function remove(c,id){validate(c);const out=copy(c);out.nodes=out.nodes.filter(n=>n.id!==id);out.wires=out.wires.filter(w=>w.from!==id&&w.to!==id);out.history=[];out.tick=0;return out;}
function disconnect(c,to,input){validate(c);const out=copy(c);out.wires=out.wires.filter(w=>w.to!==to||w.input!==input);return out;}
function connect(c,from,output,to,input){
 validate(c);const out=disconnect(c,to,input);out.wires.push({from,output,to,input});validate(out);
 return out;
}
function evalGate(type,ins){
 const [a,b]=ins;
 switch(type){
  case 'AND':return ins.includes(0)?0:ins.includes(null)?null:1;
  case 'OR':return ins.includes(1)?1:ins.includes(null)?null:0;
  case 'NOT':return a===null?null:1-a;
  case 'XOR':return ins.includes(null)?null:a^b;
  case 'NAND':return ins.includes(0)?1:ins.includes(null)?null:0;
  case 'NOR':return ins.includes(1)?0:ins.includes(null)?null:1;
  default:return null;
 }
}
function evaluate(c){
 validate(c);
 const results=new Map(),pending=new Set(c.nodes.map(n=>n.id));
 const inbound=new Map(c.nodes.map(n=>[n.id,c.wires.filter(w=>w.to===n.id)]));
 for(const n of c.nodes){
  const spec=SPECS[n.type];
  if(spec.kind==='source')results.set(n.id,{inputs:[],outputs:[n.value]});
  if(spec.kind==='seq')results.set(n.id,{inputs:[],outputs:n.type==='COUNTER'?Array.from({length:4},(_,i)=>n.count===null?null:(n.count>>i)&1):[n.q]});
 }
 for(const id of results.keys())pending.delete(id);
 while(pending.size){
  let progress=false;
  for(const id of [...pending]){
   const n=c.nodes.find(n=>n.id===id),spec=SPECS[n.type];
   const wires=inbound.get(id);
   if(wires.some(w=>!results.has(w.from)))continue;
   const ins=Array(spec.ins.length).fill(null);
   for(const w of wires)ins[w.input]=results.get(w.from).outputs[w.output];
   results.set(id,{inputs:ins,outputs:spec.kind==='gate'?[evalGate(n.type,ins)]:[]});
   pending.delete(id);progress=true;
  }
  if(!progress)throw Error('逻辑计算无法完成');
 }
 // 时序单元的数据/时钟输入可能由组合门生成，必须在全部逻辑输出确定后计算。
 for(const n of c.nodes)if(SPECS[n.type].kind==='seq'){
  const ins=Array(SPECS[n.type].ins.length).fill(null);
  for(const w of inbound.get(n.id))ins[w.input]=results.get(w.from).outputs[w.output];
  results.get(n.id).inputs=ins;
 }
 const obj={};
 for(const n of c.nodes)obj[n.id]=results.get(n.id);
 return obj;
}
function nextSeq(n,input){
 if(n.type==='DFF')return {q:input[0]};
 if(n.type==='TFF')return {q:input[0]===0?n.q:input[0]===1?(n.q===null?null:1-n.q):null};
 if(n.type==='JKFF'){
  const [j,k]=input;
  if(j===0&&k===0)return {q:n.q};
  if(j===0&&k===1)return {q:0};
  if(j===1&&k===0)return {q:1};
  if(j===1&&k===1)return {q:n.q===null?null:1-n.q};
  return {q:null};
 }
 const [clk,en,rst]=input;
 if(rst===1)return {count:0};
 if(rst===0&&en===0)return {count:n.count};
 if(rst===0&&en===1)return {count:n.count===null?null:(n.count+1)%n.modulus};
 return {count:null};
}
function applyEdge(c){
 // 先对同一瞬间的所有寄存器采样，再同时写入结果；避免元件顺序影响。
 const snapshot=evaluate(c),updates=[];
 for(const n of c.nodes)if(SPECS[n.type].kind==='seq'){
  const clk=snapshot[n.id].inputs[SPECS[n.type].clock];
  const update=n.lastClk===0&&clk===1?nextSeq(n,snapshot[n.id].inputs):null;
  updates.push({id:n.id,clk,update});
 }
 const out=copy(c);
 for(const change of updates){
  const n=out.nodes.find(x=>x.id===change.id);n.lastClk=change.clk;
  if(change.update)Object.assign(n,change.update);
 }
 return out;
}
function setSwitch(c,id,value){
 validate(c);if(value!==0&&value!==1)throw Error('开关只能为 0 或 1');
 const out=copy(c),n=out.nodes.find(x=>x.id===id);
 if(!n||n.type!=='SWITCH')throw Error('请选择输入开关');
 n.value=value;return applyEdge(out);
}
function toggle(c,id){validate(c);const n=c.nodes.find(x=>x.id===id);if(!n||n.type!=='SWITCH')throw Error('请选择输入开关');return setSwitch(c,id,1-n.value);}
function pulse(c){
 validate(c);if(!c.nodes.some(n=>n.type==='CLOCK'))throw Error('请先添加时钟源 CLOCK');
 if(c.tick>=1000000)throw Error('时钟步数达到上限，请复位');
 // 各 CLK 源同步拉高、再拉低，分别检查是否有上升沿。
 let out=copy(c);
 for(const n of out.nodes)if(n.type==='CLOCK')n.value=1;
 out=applyEdge(out);
 for(const n of out.nodes)if(n.type==='CLOCK')n.value=0;
 out=applyEdge(out);
 out.tick++;
 const snapshot=evaluate(out);
 const states={};
 for(const n of out.nodes)if(SPECS[n.type].kind==='seq'){
  states[n.id]=n.type==='COUNTER'?Array.from({length:4},(_,i)=>snapshot[n.id].outputs[3-i]===null?'X':snapshot[n.id].outputs[3-i]).join(''):snapshot[n.id].outputs[0]===null?'X':String(snapshot[n.id].outputs[0]);
 }
 out.history.push({tick:out.tick,states});
 if(out.history.length>HISTORY)out.history.shift();
 return out;
}
function setModulus(c,id,modulus){
 validate(c);if(!Number.isInteger(modulus)||modulus<2||modulus>16)throw Error('模数为 2～16');
 const out=copy(c),n=out.nodes.find(x=>x.id===id);
 if(!n||n.type!=='COUNTER')throw Error('请选择计数器');
 n.modulus=modulus;n.count=0;out.tick=0;out.history=[];return out;
}
function reset(c){
 validate(c);const out=copy(c);out.tick=0;out.history=[];
 for(const n of out.nodes){if(n.type==='CLOCK')n.value=0;if(SPECS[n.type].kind==='seq'){n.q=0;n.lastClk=0;if(n.type==='COUNTER')n.count=0;}}
 // 重算时钟输入，避免 reset 后时钟线已为高电平造成虚假上升沿。
 const sampled=evaluate(out);
 for(const n of out.nodes)if(SPECS[n.type].kind==='seq')n.lastClk=sampled[n.id].inputs[SPECS[n.type].clock];
 return out;
}
function example(name){
 let c=empty();
 const addAt=(type,x,y)=>{c=add(c,type,x,y);return c.nodes[c.nodes.length-1].id;};
 const wire=(a,o,b,i)=>{c=connect(c,a,o,b,i);};
 if(name==='sample'){
  const a=addAt('SWITCH',55,145),b=addAt('SWITCH',55,305),xor=addAt('XOR',295,220),clock=addAt('CLOCK',55,460),d=addAt('DFF',525,220),led=addAt('LED',785,245);
  wire(a,0,xor,0);wire(b,0,xor,1);wire(xor,0,d,0);wire(clock,0,d,1);wire(d,0,led,0);
 }else if(name==='counter'){
  const clk=addAt('CLOCK',65,80),en=addAt('SWITCH',65,230),rst=addAt('SWITCH',65,380),counter=addAt('COUNTER',370,225);
  c=setSwitch(c,en,1);
  wire(clk,0,counter,0);wire(en,0,counter,1);wire(rst,0,counter,2);
  for(let i=0;i<4;i++){const led=addAt('LED',780,55+i*125);wire(counter,i,led,0);}
 }else if(name==='jk'){
  const clk=addAt('CLOCK',70,80),j=addAt('SWITCH',70,235),k=addAt('SWITCH',70,390),jk=addAt('JKFF',395,225),led=addAt('LED',760,235);
  c=setSwitch(c,j,1);c=setSwitch(c,k,1);wire(j,0,jk,0);wire(k,0,jk,1);wire(clk,0,jk,2);wire(jk,0,led,0);
 }else throw Error('未知示例');
 return c;
}
return Object.freeze({SPECS,MAX_NODES,MAX_WIRES,empty,validate,add,move,remove,connect,disconnect,evaluate,toggle,setSwitch,pulse,reset,setModulus,example});
});