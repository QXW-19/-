/* ==========================================================================
   V2.5.2 案例自检引擎（阶段 C）
   --------------------------------------------------------------------------
   对可仿真的案例，用真实电路/模型按真值表逐行跑一遍，把实际结果回填到详情页：
   - 电路类：调用 V1.6 引擎逐组输入求值，不写死答案；
   - 数值类：调用 V1.8 ADC / 七段段码表计算，明确标注「模型计算」。
   不可仿真的案例返回 null，由界面提示能力边界，不用假动画冒充结果。
   ========================================================================== */
(function(root){
'use strict';
const M=root.DigitalMixedCircuit;
const A=root.DigitalV18Lab;
/* 延迟取用：本文件可能先于呈现层加载。 */
const ui=()=>root.DigitalV251ContentUI;
const E=root.DigitalV25Examples;

function put(c,type,x,y){const out=M.add(c,type,x,y);return {c:out,id:out.nodes[out.nodes.length-1].id};}
function wire(c,a,o,b,i){return M.connect(c,a,o,b,i);}
function leds(c){
 return c.nodes.filter(n=>n.type==='LED').map(n=>{
  const st=M.evaluate(c)[n.id];
  return st.inputs[0]===null?'X':String(st.inputs[0]);
 });
}
function switches(c){return c.nodes.filter(n=>n.type==='SWITCH').map(n=>n.id);}
function setBits(c,ids,bits){
 let out=c;
 ids.slice(0,bits.length).forEach((id,i)=>{out=M.setSwitch(out,id,bits[i]?1:0);});
 return out;
}

/* 案例 2-3：楼层 ≥5，F = B3 + B2·(B1+B0) */
function buildFloor5(){
 let c=M.empty(),r;
 const sw=[];
 for(let i=3;i>=0;i--){r=put(c,'SWITCH',40,80+(3-i)*120);c=r.c;sw[i]=r.id;}
 r=put(c,'OR',300,320);c=r.c;const o1=r.id;
 r=put(c,'AND',500,260);c=r.c;const a1=r.id;
 r=put(c,'OR',700,180);c=r.c;const o2=r.id;
 r=put(c,'LED',900,180);c=r.c;const led=r.id;
 c=wire(c,sw[1],0,o1,0);c=wire(c,sw[0],0,o1,1);
 c=wire(c,sw[2],0,a1,0);c=wire(c,o1,0,a1,1);
 c=wire(c,sw[3],0,o2,0);c=wire(c,a1,0,o2,1);
 c=wire(c,o2,0,led,0);
 M.validate(c);
 return {circuit:c,sw,led};
}

/* 案例 5-2：两级同步器 */
function buildSync2(){
 let c=M.empty(),r;
 r=put(c,'SWITCH',40,100);c=r.c;const d=r.id;
 r=put(c,'CLOCK',40,320);c=r.c;const clk=r.id;
 r=put(c,'DFF',300,120);c=r.c;const f1=r.id;
 r=put(c,'DFF',520,120);c=r.c;const f2=r.id;
 r=put(c,'LED',740,120);c=r.c;const l1=r.id;
 r=put(c,'LED',740,320);c=r.c;const l2=r.id;
 c=wire(c,d,0,f1,0);c=wire(c,clk,0,f1,1);
 c=wire(c,f1,0,f2,0);c=wire(c,clk,0,f2,1);
 c=wire(c,f1,0,l1,0);c=wire(c,f2,0,l2,0);
 M.validate(c);
 return {circuit:c,d,clk,f1,f2,l1,l2};
}

function rowsOf(list){
 const pass=list.filter(r=>r.pass).length;
 return {rows:list,pass,total:list.length,allPass:pass===list.length};
}

const RUN={
 'case-1-1':()=>{
  // 段码表与段集合独立比对：表在 UI 里，集合在这里，任一处被改错都会失败。
  const table=ui().SEG_TABLE;
  const sets={0:'abcdef',5:'acdfg',9:'abcdfg'};
  const rows=Object.keys(sets).map(k=>{
   const n=Number(k);
   const lit='abcdefg'.split('').filter((s,i)=>table[n][i]==='1').join('');
   return {input:'输入 BCD '+n.toString(2).padStart(4,'0')+'（'+n+'）',
    expect:table[n]+'（'+sets[k]+'）',actual:table[n]+'（'+lit+'）',pass:lit===sets[k]};
  });
  return rowsOf(rows);
 },
 'case-1-2':()=>{
  let c=ui().buildGray4();
  const sw=switches(c);
  // 构建顺序为 B3 B2 B1 B0
  const vec=[[0,0,0,0],[1,0,0,0],[0,1,1,1]];
  const rows=vec.map(bits=>{
   let t=setBits(c,sw,bits);
   const out=leds(t).join('');
   const n=bits[0]*8+bits[1]*4+bits[2]*2+bits[3];
   const g=n^(n>>1);
   const expect=g.toString(2).padStart(4,'0');
   return {input:'B='+bits.join(''),expect,actual:out,pass:out===expect};
  });
  return rowsOf(rows);
 },
 'case-2-1':()=>{
  let c=ui().buildMajority();
  const sw=switches(c);
  const rows=[[0,0,1],[1,0,1],[0,0,0],[1,1,1]].map(bits=>{
   const t=setBits(c,sw,bits);
   const out=leds(t)[0];
   const expect=bits.reduce((a,b)=>a+b,0)>=2?'1':'0';
   return {input:'ABC='+bits.join(''),expect,actual:out,pass:out===expect};
  });
  return rowsOf(rows);
 },
 'case-2-2':()=>{
  let c=ui().buildXor4Nand();
  const sw=switches(c);
  const rows=[[0,0],[0,1],[1,0],[1,1]].map(bits=>{
   const t=setBits(c,sw,bits);
   const out=leds(t)[0];
   const expect=String(bits[0]^bits[1]);
   return {input:'AB='+bits.join(''),expect,actual:out,pass:out===expect};
  });
  return rowsOf(rows);
 },
 'case-2-3':()=>{
  const built=buildFloor5();
  const rows=[0,4,5,7,9].map(n=>{
   const bits=[(n>>3)&1,(n>>2)&1,(n>>1)&1,n&1];
   const t=setBits(built.circuit,built.sw,bits);
   const out=leds(t)[0];
   const expect=n>=5?'1':'0';
   return {input:'BCD '+n.toString(2).padStart(4,'0')+'（'+n+'）',expect,actual:out,pass:out===expect};
  });
  return rowsOf(rows);
 },
 'case-4-1':()=>{
  let c=ui().buildFullAdder();
  const sw=switches(c);
  const rows=[[0,0,0],[0,1,1],[1,1,0],[1,1,1]].map(bits=>{
   const t=setBits(c,sw,bits);
   const outs=leds(t); // 顺序：S、Cout
   const s=bits[0]^bits[1]^bits[2],co=(bits[0]&bits[1])|(bits[2]&(bits[0]^bits[1]));
   const actual=outs.slice(0,2).join('');
   const expect=''+s+co;
   return {input:'A B Cin='+bits.join(''),expect:'S Cout='+expect,actual:'S Cout='+actual,pass:actual===expect};
  });
  return rowsOf(rows);
 },
 'case-5-1':()=>{
  let c=E.build('dff');
  const sw=switches(c)[0];
  c=M.setSwitch(c,sw,1);
  c=M.pulse(c); // 第一个时钟沿采样 1
  let q=leds(c)[0];
  const rows=[{input:'D=1 后第 1 个上升沿',expect:'1',actual:q,pass:q==='1'}];
  c=M.setSwitch(c,sw,0);
  q=leds(c)[0];
  rows.push({input:'D 改回 0（无时钟沿）',expect:'保持 1',actual:q,pass:q==='1'});
  c=M.pulse(c);
  q=leds(c)[0];
  rows.push({input:'再来一个上升沿',expect:'0',actual:q,pass:q==='0'});
  return rowsOf(rows);
 },
 'case-5-2':()=>{
  const b=buildSync2();
  let c=M.setSwitch(b.circuit,b.d,1);
  const out=()=>{
   const st=M.evaluate(c);
   const q1=st[b.f1].outputs[0],q2=st[b.f2].outputs[0];
   return ''+q1+q2;
  };
  const rows=[];
  c=M.pulse(c);rows.push({input:'输入 1，第 1 个时钟沿',expect:'10',actual:out(),pass:out()==='10'});
  c=M.pulse(c);rows.push({input:'第 2 个时钟沿',expect:'11',actual:out(),pass:out()==='11'});
  c=M.setSwitch(c,b.d,0);
  c=M.pulse(c);rows.push({input:'输入 0，第 3 个沿',expect:'01',actual:out(),pass:out()==='01'});
  c=M.pulse(c);rows.push({input:'第 4 个沿',expect:'00',actual:out(),pass:out()==='00'});
  return rowsOf(rows);
 },
 'case-6-1':()=>{
  let c=E.build('counter6');
  const rows=[];
  const read=()=>leds(c).slice(0,4).reverse().join('');
  c=M.pulse(c);rows.push({input:'第 1 个时钟沿',expect:'0001',actual:read(),pass:read()==='0001'});
  for(let i=0;i<4;i++)c=M.pulse(c);
  rows.push({input:'第 5 个时钟沿',expect:'0101',actual:read(),pass:read()==='0101'});
  c=M.pulse(c);
  rows.push({input:'第 6 个时钟沿（回绕）',expect:'0000',actual:read(),pass:read()==='0000'});
  return rowsOf(rows);
 },
 'case-8-1':()=>{
  const cases=[[10,3.3,1.0,310],[10,3.3,3.3,1023],[12,3.3,1.0,1241]];
  const rows=cases.map(([bits,vref,vin,expect])=>{
   const r=A.adc(bits,vref,vin);
   return {input:bits+' 位，Vin='+vin.toFixed(3)+' V',
    expect:'码值 '+expect,actual:'码值 '+r.code,pass:r.code===expect};
  });
  return rowsOf(rows);
 }
};

root.DigitalV252CaseProbe=Object.freeze({
 canRun:id=>Object.prototype.hasOwnProperty.call(RUN,id),
 /* 供「载入实验室」使用：把新增的两个门级电路交给 V2.5 实验室。 */
 build:id=>{
  if(id==='floor5')return buildFloor5().circuit;
  if(id==='sync2')return buildSync2().circuit;
  return null;
 },
 /* 供「载入实验室」使用：把新增的两个门级电路交给 V2.5 实验室。 */
 build:id=>{
  if(id==='floor5')return buildFloor5().circuit;
  if(id==='sync2')return buildSync2().circuit;
  return null;
 },
 run:id=>{
  if(!RUN[id])return null;
  try{return RUN[id]();}catch(err){return {error:err.message,rows:[],pass:0,total:0,allPass:false};}
 },
 cases:Object.keys(RUN)
});
})(typeof window!=='undefined'?window:globalThis);
