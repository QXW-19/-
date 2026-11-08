/* ==========================================================================
   V2.5 电路信号渲染与故障诊断
   --------------------------------------------------------------------------
   信号值全部直接取自 M.evaluate(circuit) 的 inputs / outputs，
   不维护第二套计算结果；X 表示引擎返回 null（未知态）。
   连线合法性检查复用 M.validate 的规则，并把异常翻译成中文教学反馈。
   ========================================================================== */
(function(root){
'use strict';
const M=root.DigitalMixedCircuit;

/* 三值逻辑的视觉编码：1 高亮实线、0 低亮实线、X 虚线 + 明确标签。 */
const SIGNAL={
 1:{cls:'v25-sig-high',label:'1',desc:'逻辑 1（高亮实线）'},
 0:{cls:'v25-sig-low',label:'0',desc:'逻辑 0（低亮实线）'},
 X:{cls:'v25-sig-x',label:'X',desc:'未知态 X（虚线）'}
};
const valueOf=v=>v===null||v===undefined?'X':(v===1?1:0);
function signalClass(v){return SIGNAL[valueOf(v)].cls;}
function signalLabel(v){return SIGNAL[valueOf(v)].label;}

/* 把引擎状态转成每个端口的取值，供导线与节点共用。 */
function portStates(circuit,state){
 const byId=new Map(circuit.nodes.map(n=>[n.id,n]));
 const out=new Map();
 for(const w of circuit.wires){
  const from=byId.get(w.from),spec=from?M.SPECS[from.type]:null;
  const raw=state[w.from]&&state[w.from].outputs?state[w.from].outputs[w.output]:null;
  out.set(w.to+':'+w.input,{value:raw,from:w.from,output:w.output,
    legal:!!spec&&w.output<spec.outs.length});
 }
 return out;
}

/* ---------- 故障诊断：error / warning / tip 三级 ---------- */
function diagnose(circuit,state){
 const items=[];
 const add=(level,code,text)=>items.push({level,code,text});
 const byId=new Map(circuit.nodes.map(n=>[n.id,n]));
 const name=n=>n.id+' · '+(M.SPECS[n.type]?M.SPECS[n.type].label:n.type);
 const wiredInputs=new Set(circuit.wires.map(w=>w.to+':'+w.input));

 // 1) 输入端悬空
 for(const n of circuit.nodes){
  const spec=M.SPECS[n.type];if(!spec)continue;
  spec.ins.forEach((pin,i)=>{
   if(!wiredInputs.has(n.id+':'+i))
    add('warning','FLOAT_INPUT',name(n)+' 的 '+pin+' 输入端悬空，引擎按未知态 X 处理；请从输出端拉一根导线接上。');
  });
 }
 // 2) 同一输入端重复接线（引擎会拒绝，这里给出更易懂的说明）
 const seen=new Set();
 for(const w of circuit.wires){
  const key=w.to+':'+w.input;
  if(seen.has(key))add('error','DUP_INPUT','输入端 '+key+' 接了多根导线；一个输入端同一时刻只能有一个驱动源。');
  seen.add(key);
 }
 // 3) 组合逻辑反馈环（复用引擎的拓扑检查结果）
 try{M.validate(circuit);}catch(err){
  const text=String(err.message||err);
  if(/环路|反馈/.test(text))add('error','COMB_LOOP','检测到没有寄存器隔离的组合逻辑环路：'+text+'。请在反馈路径中加入 D/T/JK 触发器或计数器。');
  else add('error','INVALID_CIRCUIT','电路结构不合法：'+text);
 }
 // 4) 时钟端接线不合理
 for(const n of circuit.nodes){
  const spec=M.SPECS[n.type];if(!spec||spec.kind!=='seq'||spec.clock===undefined)continue;
  const clkWire=circuit.wires.find(w=>w.to===n.id&&w.input===spec.clock);
  if(!clkWire)continue;
  const src=byId.get(clkWire.from);
  if(src&&src.type!=='CLOCK')
   add('warning','CLOCK_SOURCE',name(n)+' 的 CLK 端接的是「'+M.SPECS[src.type].label+'」而不是 CLOCK 时钟源；普通信号会产生意外上升沿，教学案例建议直接接 CLOCK。');
  if(src&&M.SPECS[src.type].kind==='sink')
   add('error','CLOCK_FROM_SINK',name(n)+' 的 CLK 端接到了输出型元件，输出型元件没有可驱动的信号。');
 }
 // 5) 输出/输入方向或类型错误
 for(const w of circuit.wires){
  const a=byId.get(w.from),b=byId.get(w.to);
  if(!a||!b){add('error','MISSING_NODE','导线 '+w.from+' → '+w.to+' 指向了不存在的元件。');continue;}
  if(M.SPECS[a.type].kind==='sink')
   add('error','SINK_AS_SOURCE',name(a)+' 是输出型元件，不能作为导线起点。');
  if(M.SPECS[b.type].kind==='source')
   add('error','SOURCE_AS_TARGET',name(b)+' 是输入型元件，没有输入端口。');
 }
 // 6) 仿真结果含未知态 X
 const unknown=[];
 for(const n of circuit.nodes){
  if(!state[n.id])continue;
  const vals=[...(state[n.id].inputs||[]),...(state[n.id].outputs||[])];
  if(vals.some(v=>v===null||v===undefined))unknown.push(n.id);
 }
 if(unknown.length)
  add('warning','UNKNOWN_X','仿真结果含未知态 X（'+unknown.slice(0,6).join('、')+(unknown.length>6?' 等':'')+'）。常见原因是输入悬空或存在未初始化的寄存器；X 不是 0，也不是 1。');
 // 7) 规模超限
 if(circuit.nodes.length>=M.MAX_NODES)
  add('error','MAX_NODES','元件数量已达上限 '+M.MAX_NODES+' 个，请先删除不用的元件。');
 if(circuit.wires.length>=M.MAX_WIRES)
  add('error','MAX_WIRES','导线数量已达上限 '+M.MAX_WIRES+' 根，请简化电路。');
 // 教学提示
 if(!items.some(x=>x.level==='error')&&circuit.nodes.length)
  add('tip','READY','结构检查通过。点击「单步时钟」或切换输入开关，导线颜色会直接反映 M.evaluate() 的真实输出。');
 return items;
}

/* 生成一次采样记录：只读取引擎状态，不重新实现逻辑运算。 */
function sample(circuit,tick,edge){
 const state=M.evaluate(circuit);
 const channels={};
 for(const n of circuit.nodes){
  const spec=M.SPECS[n.type];
  const values=spec.kind==='source'?state[n.id].outputs
    :spec.kind==='sink'?state[n.id].inputs
    :state[n.id].outputs;
  channels[n.id]=(values||[]).map(valueOf);
 }
 return {tick,edge:!!edge,channels};
}

root.DigitalV25Signals=Object.freeze({
 SIGNAL,valueOf,signalClass,signalLabel,portStates,diagnose,sample
});
})(typeof window!=='undefined'?window:globalThis);
