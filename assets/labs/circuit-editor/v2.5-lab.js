/* ==========================================================================
   V2.5 可视化数字电路实验室 2.0（阶段 A）
   --------------------------------------------------------------------------
   完全复用 V1.6 的 window.DigitalMixedCircuit 作为唯一仿真引擎：
   元件/连线/求值/时钟边沿/历史记录全部调用 M 的 API，不另建逻辑核心。
   本文件只负责：分类元件库、拖拽与触摸放置、网格对齐、缩放平移、
   选中/复制/删除/撤销/重做、端口吸附与连线预览/断线/重连、
   三值信号可视化、中文故障诊断，以及与波形分析仪的采样同步。
   ========================================================================== */
(function(root){
'use strict';
const M=root.DigitalMixedCircuit,S=root.DigitalV25Signals,W=root.DigitalV25Waveform;
const E=root.DigitalV25Examples;
if(!M||!S){console.error('[V2.5] 仿真引擎或信号渲染模块未加载');return;}
const NS='http://www.w3.org/2000/svg';
const KEY='digital-course-v2.5-circuit';     // 独立且带版本号的存储键
const LEGACY_KEY='digital-course-v1.6-mixed'; // 只读兼容旧版存档
const CANVAS_W=1180,CANVAS_H=620,NODE_W=152,GRID=20;
const MAX_UNDO=40;

function el(tag,text,cls){
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
}
function svg(tag,attrs){
 const n=document.createElementNS(NS,tag);
 for(const [k,v]of Object.entries(attrs||{}))n.setAttribute(k,String(v));
 return n;
}
function btn(label,fn,cls){
 const b=el('button',label,cls||'v25-btn');b.type='button';
 b.addEventListener('click',fn);return b;
}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const snap=v=>Math.round(v/GRID)*GRID;
const copy=c=>JSON.parse(JSON.stringify(c));
const txt=v=>S.valueOf(v);

/* 元件分类：输入 / 组合逻辑 / 时序逻辑 / 输出 / 时钟 */
const CATEGORIES=[
 {name:'输入',types:['SWITCH']},
 {name:'时钟',types:['CLOCK']},
 {name:'组合逻辑',types:['AND','OR','XOR','NOT','NAND','NOR']},
 {name:'时序逻辑',types:['DFF','TFF','JKFF','COUNTER']},
 {name:'输出',types:['LED']}
];
function nodeHeight(type){
 const s=M.SPECS[type];
 return Math.max(76,34+Math.max(s.ins.length,s.outs.length,1)*24);
}
function portPos(n,i,kind){
 const s=M.SPECS[n.type],count=kind==='out'?s.outs.length:s.ins.length;
 const h=nodeHeight(n.type);
 return {x:n.x+(kind==='out'?NODE_W:0),y:n.y+34+(i+1)*h/(count+1)};
}

/* ---------- 存储：兼容 V1.6 原始 JSON 与 V2.5 带版本配置 ---------- */
function normalize(input){
 if(!input||typeof input!=='object')throw Error('文件不是 JSON 对象');
 let c=null,config=null;
 if(input.version===2&&input.circuit){c=input.circuit;config=input.config||null;}
 else if(input.version===1&&Array.isArray(input.nodes)){c=input;} // V1.6 原始存档
 else if(input.circuit){c=input.circuit;config=input.config||null;}
 else throw Error('无法识别的电路文件版本');
 M.validate(c);
 return {circuit:c,config};
}
function restore(){
 for(const key of [KEY,LEGACY_KEY]){
  try{
   const raw=localStorage.getItem(key);if(!raw)continue;
   if(raw.length>200000)continue;
   const r=normalize(JSON.parse(raw));
   return r;
  }catch(_){/* 损坏或旧版不兼容时继续尝试下一个键 */}
 }
 return {circuit:E?E.build('halfadder'):M.example('sample'),config:null};
}

function createLab(){
 let saved;
 try{saved=restore();}catch(err){saved={circuit:M.empty(),config:null};}
 let circuit=saved.circuit;
 let undo=[],redo=[],selected=null,pending=null,scale=1,tx=0,ty=0;
 let drag=null,pan=null,timer=null,autoPeriod=900,edgeTimer=null,placing=null;
 let waveform=null,section=null,canvas=null,viewport=null,wireLayer=null,nodeLayer=null,previewLine=null;
 let info=null,stats=null,diagBox=null,runButton=null,gridOn=true;

 function announce(msg,bad){if(info){info.textContent=msg;info.classList.toggle('v25-error',!!bad);}}
 function save(){
  try{
   localStorage.setItem(KEY,JSON.stringify({version:2,circuit,config:waveform?waveform.getConfig():null}));
  }catch(err){announce('本地保存失败，请导出 JSON 备份：'+err.message,true);}
 }
 function commit(next,message,edge){
  M.validate(next);
  undo.push(copy(circuit));if(undo.length>MAX_UNDO)undo.shift();
  redo.length=0;
  circuit=next;save();draw();
  if(waveform)waveform.record(circuit,edge);
  if(message)announce(message);
 }
 function apply(fn,message,edge){
  try{commit(fn(circuit),message,edge);return true;}
  catch(err){announce('操作失败：'+err.message,true);return false;}
 }
 function evaluate(){return M.evaluate(circuit);}

 /* ---------- 画布绘制 ---------- */
 function drawGrid(){
  viewport.replaceChildren();
  const defs=svg('defs');
  const pat=svg('pattern',{id:'v25-grid-pattern',width:GRID,height:GRID,patternUnits:'userSpaceOnUse'});
  pat.append(svg('path',{d:'M '+GRID+' 0 L 0 0 0 '+GRID,fill:'none',class:'v25-grid-line'}));
  defs.append(pat);viewport.append(defs);
  const bg=svg('rect',{x:0,y:0,width:CANVAS_W,height:CANVAS_H,class:'v25-canvas-bg'});
  if(gridOn)bg.setAttribute('fill','url(#v25-grid-pattern)');
  viewport.append(bg);
  wireLayer=svg('g',{class:'v25-wires'});nodeLayer=svg('g',{class:'v25-nodes'});
  previewLine=svg('path',{class:'v25-preview',d:''});
  viewport.append(wireLayer,previewLine,nodeLayer);
  viewport.setAttribute('transform','translate('+tx+','+ty+') scale('+scale+')');
 }
 function drawWires(state){
  wireLayer.replaceChildren();
  const nodes=new Map(circuit.nodes.map(n=>[n.id,n]));
  const illegal=new Set();
  for(const w of circuit.wires){
   const a=nodes.get(w.from),b=nodes.get(w.to);
   if(a&&M.SPECS[a.type]&&M.SPECS[a.type].kind==='sink')illegal.add(w);
  }
  for(const w of circuit.wires){
   const a=nodes.get(w.from),b=nodes.get(w.to);
   if(!a||!b)continue;
   const pa=portPos(a,w.output,'out'),pb=portPos(b,w.input,'in');
   const bend=Math.max(38,Math.abs(pa.x-pb.x)*.42);
   const d='M'+pa.x+','+pa.y+' C'+(pa.x+bend)+','+pa.y+' '+(pb.x-bend)+','+pb.y+' '+pb.x+','+pb.y;
   const raw=state[w.from]?state[w.from].outputs[w.output]:null;
   const cls='v25-wire '+S.signalClass(raw)+(illegal.has(w)?' v25-wire-illegal':'');
   const path=svg('path',{d,class:cls,'data-key':w.from+':'+w.output+'>'+w.to+':'+w.input});
   path.addEventListener('click',e=>{
    e.stopPropagation();
    apply(c=>M.disconnect(c,w.to,w.input),'已断开 '+w.from+' → '+w.to+' 的导线。');
   });
   wireLayer.append(path);
   // 命中区域：加粗透明路径，便于鼠标与触摸点选断线
   const hit=svg('path',{d,class:'v25-wire-hit',tabindex:0,role:'button',
    'aria-label':'断开 '+w.from+' 到 '+w.to+' 的导线'});
   hit.addEventListener('click',()=>apply(c=>M.disconnect(c,w.to,w.input),'已断开导线。'));
   hit.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();apply(c=>M.disconnect(c,w.to,w.input),'已断开导线。');}
   });
   wireLayer.append(hit);
   const v=txt(raw);
   if(v==='X'||illegal.has(w)){
    const label=svg('text',{x:(pa.x+pb.x)/2,y:(pa.y+pb.y)/2-6,
      class:'v25-wire-label'+(illegal.has(w)?' v25-wire-label-error':'')});
    label.textContent=illegal.has(w)?'✕ 连接类型错误':v;
    wireLayer.append(label);
   }
  }
 }
 function drawNodes(state){
  nodeLayer.replaceChildren();
  for(const n of circuit.nodes){
   const spec=M.SPECS[n.type],h=nodeHeight(n.type);
   const g=svg('g',{class:'v25-node'+(selected===n.id?' selected':''),
    transform:'translate('+n.x+','+n.y+')','data-id':n.id});
   g.append(svg('rect',{x:0,y:0,width:NODE_W,height:h,rx:10,class:'v25-node-box'}));
   g.append(svg('rect',{x:0,y:0,width:NODE_W,height:26,rx:10,class:'v25-node-head'}));
   const title=svg('text',{x:9,y:18,class:'v25-node-title'});
   title.textContent=n.id+' · '+spec.label;g.append(title);
   const values=spec.kind==='source'?state[n.id].outputs
     :spec.kind==='sink'?state[n.id].inputs:state[n.id].outputs;
   const value=svg('text',{x:9,y:46,class:'v25-node-value '+S.signalClass(values[0])});
   value.textContent=(spec.kind==='sink'?'IN ':'OUT ')+(values||[]).map(txt).join('');
   g.append(value);
   if(spec.kind==='seq'){
    const sub=svg('text',{x:9,y:h-8,class:'v25-node-sub'});
    sub.textContent=n.type==='COUNTER'?'MOD '+n.modulus+' · 上升沿计数':'上升沿采样';
    g.append(sub);
   }
   spec.ins.forEach((label,i)=>{
    const p=portPos(n,i,'in');
    const c=svg('circle',{cx:0,cy:p.y-n.y,r:7,class:'v25-port in',tabindex:0,role:'button',
      'aria-label':n.id+' 输入 '+label});
    c.addEventListener('click',e=>{e.stopPropagation();onInput(n.id,i);});
    c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onInput(n.id,i);}});
    g.append(c);
    const t=svg('text',{x:12,y:p.y-n.y+4,class:'v25-port-label'});t.textContent=label;g.append(t);
   });
   spec.outs.forEach((label,i)=>{
    const p=portPos(n,i,'out');
    const c=svg('circle',{cx:NODE_W,cy:p.y-n.y,r:7,class:'v25-port out'+
      (pending&&pending.id===n.id&&pending.output===i?' pending':''),tabindex:0,role:'button',
      'aria-label':n.id+' 输出 '+label});
    c.addEventListener('click',e=>{e.stopPropagation();onOutput(n.id,i);});
    c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOutput(n.id,i);}});
    g.append(c);
    const t=svg('text',{x:NODE_W-12,y:p.y-n.y+4,class:'v25-port-label out'});t.textContent=label;g.append(t);
   });
   if(n.type==='SWITCH'||n.type==='CLOCK'){
    const t=svg('text',{x:NODE_W/2,y:h-8,class:'v25-node-action','text-anchor':'middle'});
    t.textContent=n.type==='SWITCH'?'点击切换 0/1':'时钟源';
    g.append(t);
    const hit=svg('rect',{x:4,y:26,width:NODE_W-8,height:h-30,class:'v25-node-hit',tabindex:0,role:'button',
      'aria-label':'切换 '+n.id+' 的输入值'});
    hit.addEventListener('click',e=>{
     e.stopPropagation();
     if(n.type==='SWITCH')apply(c=>M.toggle(c,n.id),'已切换 '+n.id+' 的输入值。');
     else pulse();
    });
    hit.addEventListener('keydown',e=>{
     if(e.key==='Enter'||e.key===' '){e.preventDefault();
      if(n.type==='SWITCH')apply(c=>M.toggle(c,n.id),'已切换 '+n.id+' 的输入值。');else pulse();}
    });
    g.append(hit);
   }
   g.addEventListener('pointerdown',e=>beginNodeDrag(e,n.id));
   g.addEventListener('click',e=>{e.stopPropagation();selected=n.id;draw();});
   nodeLayer.append(g);
  }
 }
 function drawDiagnostics(state){
  const items=S.diagnose(circuit,state);
  diagBox.replaceChildren();
  const counts={error:0,warning:0,tip:0};
  items.forEach(x=>counts[x.level]++);
  const head=el('div',undefined,'v25-diag-head');
  head.append(el('strong','故障诊断'),
   el('span','错误 '+counts.error+' · 警告 '+counts.warning+' · 教学提示 '+counts.tip,'v25-hint'));
  diagBox.append(head);
  const list=el('ul',undefined,'v25-diag-list');
  items.forEach(it=>{
   const li=el('li',undefined,'v25-diag v25-diag-'+it.level);
   const tag=el('span',it.level==='error'?'错误':it.level==='warning'?'警告':'提示','v25-diag-tag');
   li.append(tag,el('span',it.text));list.append(li);
  });
  diagBox.append(list);
 }
 function draw(){
  if(!canvas)return;
  const state=evaluate();
  drawWires(state);drawNodes(state);drawDiagnostics(state);
  if(stats)stats.textContent=circuit.nodes.length+' 元件 · '+circuit.wires.length+' 导线 · 脉冲 '+circuit.tick+
    ' · 上限 '+M.MAX_NODES+'/'+M.MAX_WIRES;
 }

 /* ---------- 端口连线 ---------- */
 function onOutput(id,output){
  pending={id,output};selected=id;
  announce('已选择 '+id+' 的输出端，请点击目标元件的输入端（或直接点画布取消）。');
  draw();
 }
 function onInput(id,input){
  if(pending){
   const from=pending;pending=null;
   const occupied=circuit.wires.find(w=>w.to===id&&w.input===input);
   const before=occupied?'（该输入端原有连线会被替换）':'';
   apply(c=>M.connect(c,from.id,from.output,id,input),
     '已连接 '+from.id+' → '+id+' '+before);
  }else if(circuit.wires.some(w=>w.to===id&&w.input===input)){
   apply(c=>M.disconnect(c,id,input),'已断开 '+id+' 的输入接线。');
  }else announce('请先点击一个蓝色输出端口，再点击目标橙色输入端口。');
 }
 function canvasPoint(evt){
  const rect=canvas.getBoundingClientRect();
  return {
   x:(evt.clientX-rect.left)/rect.width*CANVAS_W,
   y:(evt.clientY-rect.top)/rect.height*CANVAS_H
  };
 }
 function toWorld(p){return {x:(p.x-tx)/scale,y:(p.y-ty)/scale};}
 function updatePreview(evt){
  if(!previewLine||!pending)return;
  const n=circuit.nodes.find(x=>x.id===pending.id);if(!n)return;
  const a=portPos(n,pending.output,'out'),p=toWorld(canvasPoint(evt));
  previewLine.setAttribute('d','M'+a.x+','+a.y+' L'+p.x+','+p.y);
  previewLine.setAttribute('class','v25-preview active');
 }
 function clearPreview(){
  pending=null;
  if(previewLine){previewLine.setAttribute('d','');previewLine.setAttribute('class','v25-preview');}
 }

 /* ---------- 拖拽 / 平移 / 缩放 ---------- */
 function beginNodeDrag(evt,id){
  if(evt.button!==0&&evt.pointerType==='mouse')return;
  const n=circuit.nodes.find(x=>x.id===id);if(!n)return;
  const cls=evt.target.classList||{contains:()=>false};
  // 端口、输入开关与动作区要响应 click；若此处捕获指针会吞掉点击事件。
  if(['v25-port','v25-node-hit','v25-node-action','v25-node-value'].some(c=>cls.contains(c)))return;
  evt.stopPropagation();
  selected=id;
  drag={id,origX:n.x,origY:n.y,start:canvasPoint(evt),pointer:evt.pointerId};
  try{canvas.setPointerCapture(evt.pointerId);}catch(_){}
 }
 function onPointerMove(evt){
  if(drag){
   const p=toWorld(canvasPoint(evt)),origin=toWorld(drag.start);
   const n=circuit.nodes.find(x=>x.id===drag.id);if(!n)return;
   // 只更新图形的临时位置，不修改 circuit；撤销栈因此在落盘前仍保存原始坐标。
   drag.lastX=clamp(snap(drag.origX+(p.x-origin.x)),0,CANVAS_W-NODE_W-6);
   drag.lastY=clamp(snap(drag.origY+(p.y-origin.y)),0,CANVAS_H-nodeHeight(n.type)-6);
   const g=nodeLayer.querySelector('.v25-node[data-id="'+drag.id+'"]');
   if(g)g.setAttribute('transform','translate('+drag.lastX+','+drag.lastY+')');
   const state=evaluate();drawWires(state);
   return;
  }
  if(pan){
   const p=canvasPoint(evt);
   tx=pan.tx+(p.x-pan.start.x);ty=pan.ty+(p.y-pan.start.y);
   viewport.setAttribute('transform','translate('+tx+','+ty+') scale('+scale+')');
   return;
  }
  if(pending)updatePreview(evt);
 }
 function onPointerUp(evt){
  if(drag){
   const d=drag;drag=null;
   try{canvas.releasePointerCapture(evt.pointerId);}catch(_){}
   if(d.lastX!==undefined)apply(c=>M.move(c,d.id,d.lastX,d.lastY),'元件已按网格对齐。');
   else draw();
   return;
  }
  if(pan){pan=null;return;}
 }
 function zoom(factor,evt){
  const old=scale;
  scale=clamp(scale*factor,0.5,2.2);
  if(evt){
   const p=canvasPoint(evt),w=toWorld(p);
   tx=p.x-w.x*scale;ty=p.y-w.y*scale;
  }
  viewport.setAttribute('transform','translate('+tx+','+ty+') scale('+scale+')');
 }

 /* ---------- 元件操作 ---------- */
 function addNode(type,x,y){
  if(circuit.nodes.length>=M.MAX_NODES){announce('元件数量已达上限 '+M.MAX_NODES+' 个。',true);return;}
  apply(c=>M.add(c,type,clamp(snap(x),0,CANVAS_W-NODE_W-10),clamp(snap(y),0,CANVAS_H-120)),
    '已添加 '+M.SPECS[type].label+'。');
 }
 function removeSelected(){
  if(!selected){announce('请先选中一个元件。',true);return;}
  const id=selected;selected=null;clearPreview();
  apply(c=>M.remove(c,id),'已删除 '+id+' 及其相连导线。');
 }
 function copySelected(){
  const n=circuit.nodes.find(x=>x.id===selected);
  if(!n){announce('请先选中一个元件再复制。',true);return;}
  apply(c=>{
   const next=M.add(c,n.type,clamp(n.x+GRID*2,0,CANVAS_W-NODE_W-10),clamp(n.y+GRID*2,0,CANVAS_H-120));
   const added=next.nodes[next.nodes.length-1];
   for(const k of ['value','q','lastClk','modulus','count'])if(k in n)added[k]=n[k];
   M.validate(next);return next;
  },'已复制 '+n.id+'（'+M.SPECS[n.type].label+'）。');
 }
 function doUndo(){
  if(!undo.length){announce('没有可撤销的操作。');return;}
  redo.push(copy(circuit));circuit=undo.pop();selected=null;clearPreview();
  save();draw();if(waveform)waveform.record(circuit,false);announce('已撤销。');
 }
 function doRedo(){
  if(!redo.length){announce('没有可重做的操作。');return;}
  undo.push(copy(circuit));circuit=redo.pop();selected=null;clearPreview();
  save();draw();if(waveform)waveform.record(circuit,false);announce('已重做。');
 }

 /* ---------- 时钟与波形同步 ---------- */
 function pulse(){
  const ok=apply(c=>M.pulse(c),null,true);
  if(ok){
   flashEdge();
   announce('已发送一个完整时钟脉冲（低→高→低），波形已记录本次采样。');
  }
 }
 function flashEdge(){
  if(edgeTimer)clearTimeout(edgeTimer);
  const clocks=[...nodeLayer.querySelectorAll('.v25-node')].filter(g=>{
   const n=circuit.nodes.find(x=>x.id===g.dataset.id);return n&&n.type==='CLOCK';
  });
  clocks.forEach(g=>g.classList.add('v25-edge-flash'));
  edgeTimer=setTimeout(()=>clocks.forEach(g=>g.classList.remove('v25-edge-flash')),500);
 }
 function toggleAutoClock(button){
  if(button)runButton=button;
  if(timer!==null){clearInterval(timer);timer=null;if(runButton)runButton.textContent='▶ 自动时钟';announce('自动时钟已暂停。');return;}
  timer=setInterval(()=>{
   if(!section.classList.contains('active')||document.hidden){
    clearInterval(timer);timer=null;if(runButton)runButton.textContent='▶ 自动时钟';return;
   }
   pulse();
  },autoPeriod);
  if(runButton)runButton.textContent='⏸ 暂停时钟';
  announce('自动时钟已启动，每 '+autoPeriod+' ms 触发一个完整脉冲。');
 }
 function stopClock(){
  if(timer!==null){clearInterval(timer);timer=null;if(runButton)runButton.textContent='▶ 自动时钟';}
  if(edgeTimer){clearTimeout(edgeTimer);edgeTimer=null;}
 }
 function resetCircuit(){
  stopClock();
  apply(c=>M.reset(c),'寄存器与时钟历史已复位。');
  if(waveform)waveform.reset();
  if(waveform)waveform.record(circuit,false);
 }
 function loadCircuit(next,label){
  stopClock();M.validate(next);selected=null;clearPreview();
  commit(next,label||'已载入电路。');
  if(waveform){waveform.reset();waveform.record(circuit,false);waveform.rebuildChannels(circuit);}
 }
 function exportData(){
  // 导出 V1.6 原始 JSON 结构，旧版实验室可以直接导入，保证存档向后兼容。
  const blob=new Blob([JSON.stringify(circuit,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=el('a');
  a.href=url;a.download='数字电路-V2.5-兼容V1.6.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
  announce('已导出 V1.6 兼容 JSON（旧版实验室可直接导入）。');
 }

 /* ---------- 构建界面 ---------- */
 function buildUI(main,nav){
  const ch=el('div',undefined,'chap');
  ch.append(el('div','综合实验 · V2.5','chap-h'));
  const item=el('div',undefined,'nav-item');item.dataset.mod='v25-lab';
  item.append(el('span',undefined,'dot'),el('span','⚡ 电路实验室 2.0'));
  ch.append(item);nav.append(ch);

  section=el('section',undefined,'mod');section.id='v25-lab';
  const title=el('div',undefined,'mod-h');
  title.append(el('div','V2.5 · 可视化数字电路实验室','crumb'),
   el('h1','电路搭建 · 信号状态 · 时序波形'),
   el('p','复用 V1.6 混合电路仿真引擎：拖拽元件、连接端口、观察 0 / 1 / X 三值信号，并在同一核心上记录波形。','claim'));
  section.append(title);

  const toolbar=el('div',undefined,'v25-toolbar');
  toolbar.append(btn('↶ 撤销',doUndo),btn('↷ 重做',doRedo),btn('⧉ 复制',copySelected),
   btn('✕ 删除',removeSelected),btn('清空画布',()=>{
    if(window.confirm('确定清空全部元件与连线？'))loadCircuit(M.empty(),'画布已清空。');
   }),btn('导出 JSON',exportData));
  const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
  file.addEventListener('change',async()=>{
   const f=file.files&&file.files[0];if(!f)return;
   try{
    if(f.size>200000)throw Error('文件超过 200 KB');
    const r=normalize(JSON.parse(await f.text()));
    loadCircuit(r.circuit,'已导入电路（'+(r.config?'V2.5 配置':'V1.6 兼容格式')+'）。');
    if(r.config&&waveform)waveform.setConfig(r.config);
   }catch(err){announce('导入失败：'+err.message,true);}
   finally{file.value='';}
  });
  toolbar.append(btn('导入 JSON',()=>file.click()),file);
  toolbar.append(btn('+ 放大',()=>zoom(1.2)),btn('− 缩小',()=>zoom(1/1.2)),
   btn('⟲ 视角复位',()=>{scale=1;tx=0;ty=0;viewport.setAttribute('transform','translate(0,0) scale(1)');}),
   btn('网格',()=>{gridOn=!gridOn;drawGrid();draw();}));
  const speed=el('select',undefined,'v25-select');speed.setAttribute('aria-label','自动时钟间隔');
  [400,900,1500].forEach(ms=>{const o=el('option',ms+' ms');o.value=String(ms);speed.append(o);});
  speed.addEventListener('change',()=>{autoPeriod=Number(speed.value);if(timer!==null){stopClock();toggleAutoClock();}});
  toolbar.append(speed);
  section.append(toolbar);

  const layout=el('div',undefined,'v25-layout');
  const palette=el('aside',undefined,'v25-palette');
  palette.append(el('h3','元件库'),el('p','鼠标拖入画布；触屏先点元件再点画布。','v25-hint'));
  CATEGORIES.forEach(cat=>{
   const group=el('div',undefined,'v25-cat');group.append(el('h4',cat.name));
   cat.types.forEach(type=>{
    const b=btn('+ '+M.SPECS[type].label,()=>{placing=type;announce('已选择 '+M.SPECS[type].label+'，请点击画布放置（再次点击元件可取消）。');});
    b.draggable=true;
    b.addEventListener('dragstart',e=>{
     e.dataTransfer.setData('text/plain',type);e.dataTransfer.effectAllowed='copy';
    });
    b.classList.add('v25-palette-item');
    group.append(b);
   });
   palette.append(group);
  });
  const examples=el('div',undefined,'v25-cat');examples.append(el('h4','快速案例'));
  if(E)E.CASES.forEach(c=>{
   examples.append(btn(c.name,()=>{
    loadCircuit(E.build(c.id),'已载入案例：'+c.name);
    waveform.showCase(c.id);
   },'v25-btn soft'));
  });
  palette.append(examples);
  layout.append(palette);

  const work=el('div',undefined,'v25-work');
  const holder=el('div',undefined,'v25-canvas-holder');
  canvas=svg('svg',{class:'v25-canvas',viewBox:'0 0 '+CANVAS_W+' '+CANVAS_H,
   role:'application','aria-label':'V2.5 电路接线画布'});
  viewport=svg('g',{class:'v25-viewport'});canvas.append(viewport);holder.append(canvas);work.append(holder);
  const foot=el('div',undefined,'v25-status');
  info=el('span','已就绪。');info.setAttribute('role','status');
  stats=el('span');foot.append(info,stats);work.append(foot);
  layout.append(work);section.append(layout);

  diagBox=el('div',undefined,'v25-diagnostics');section.append(diagBox);
  const waveHost=el('div',undefined,'v25-wave-host');section.append(waveHost);
  const limits=el('div',undefined,'v25-limits');
  limits.append(el('h3','模型边界与使用说明'));
  limits.append(el('p','本实验室提供理想数字逻辑与离散事件教学仿真：逻辑值只有 0、1、X（未知）。它不计算真实传播延迟、噪声、建立/保持时间违例或亚稳态；波形是离散采样记录，不是真实示波器测量结果。'));
  limits.append(el('p','导线颜色直接来自 M.evaluate()：高亮实线为 1，低亮实线为 0，虚线并标注 X 为未知；红色标记为非法连接。点击输出端口再点输入端口接线，点击导线或已连接的输入端可断线。'));
  section.append(limits);
  main.append(section);

  /* 画布事件：拖放、点选放置、平移、缩放、连线预览 */
  canvas.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});
  canvas.addEventListener('drop',e=>{
   e.preventDefault();
   const type=e.dataTransfer.getData('text/plain');
   if(!M.SPECS[type])return;
   const p=toWorld(canvasPoint(e));addNode(type,p.x,p.y);
  });
  canvas.addEventListener('click',e=>{
   if(e.target===canvas||e.target.classList.contains('v25-canvas-bg')){
    if(placing){const p=toWorld(canvasPoint(e));addNode(placing,p.x,p.y);placing=null;return;}
    if(pending){clearPreview();announce('已取消连线。');return;}
    selected=null;draw();
   }
  });
  canvas.addEventListener('pointerdown',e=>{
   if(e.target===canvas||e.target.classList.contains('v25-canvas-bg')){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    pan={start:canvasPoint(e),tx,ty,pointer:e.pointerId};
    try{canvas.setPointerCapture(e.pointerId);}catch(_){}
   }
  });
  canvas.addEventListener('pointermove',onPointerMove);
  canvas.addEventListener('pointerup',onPointerUp);
  canvas.addEventListener('pointercancel',onPointerUp);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.1:1/1.1,e);},{passive:false});
  canvas.addEventListener('pointermove',e=>{if(pending)updatePreview(e);});

  document.addEventListener('keydown',e=>{
   if(!section.classList.contains('active'))return;
   if(/INPUT|SELECT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?doRedo():doUndo();}
   else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();doRedo();}
   else if(['Delete','Backspace'].includes(e.key)){e.preventDefault();removeSelected();}
   else if(e.key==='Escape'){clearPreview();placing=null;}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopClock();});
  nav.addEventListener('click',e=>{
   const it=e.target.closest&&e.target.closest('.nav-item[data-mod]');
   if(it&&it.dataset.mod!=='v25-lab')stopClock();
  });
  root.addEventListener('pagehide',stopClock,{once:true});

  drawGrid();draw();
  if(W){
   const labApi={getCircuit:()=>circuit,pulse,resetCircuit,toggleAutoClock,loadCircuit};
   waveform=W.create(waveHost,labApi);
   if(saved.config)waveform.setConfig(saved.config);
   waveform.rebuildChannels(circuit);
   waveform.record(circuit,false);
  }
  return section;
 }

 function init(){
  const main=document.getElementById('main'),nav=document.getElementById('nav');
  if(!main||!nav||!root.show||document.getElementById('v25-lab'))return;
  buildUI(main,nav);
  if(location.hash==='#v25-lab'||root.__v13InitialHash==='#v25-lab')root.show('v25-lab');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();

 /* 课程联动与测试使用的公开接口：不暴露内部可变状态。 */
 root.DigitalV25Lab=Object.freeze({
  SECTION:'v25-lab',
  getCircuit:()=>circuit,
  evaluate,
  diagnose:()=>S.diagnose(circuit,evaluate()),
  pulse,resetCircuit,loadCircuit,exportData,
  /* 导入/导出使用 V1.6 原始 JSON 结构，旧版实验室可直接读取，便于测试与迁移。 */
  importJSON(obj){const r=normalize(obj);loadCircuit(r.circuit,'已导入电路。');return r;},
  exportJSON:()=>copy(circuit),
  normalize,
  openCase(id){
   if(!E)return false;
   const c=E.get(id);if(!c)return false;
   root.show('v25-lab');
   loadCircuit(E.build(id),'课程联动：'+c.name);
   if(waveform){waveform.showCase(id);waveform.reset();waveform.record(circuit,false);}
   return true;
  },
  KEY
 });
}
createLab();
})(typeof window!=='undefined'?window:globalThis);
