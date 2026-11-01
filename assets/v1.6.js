/* V1.6 统一接线实验台：让组合逻辑输出与时序器件的 CLK/D/T/JK/EN/RST 相连。 */
(function(){
'use strict';
const M=window.DigitalMixedCircuit;if(!M){console.error('[V1.6] 引擎未加载');return;}
const KEY='digital-course-v1.6-mixed',W=1180,H=760,NW=154;
let circuit=M.example('sample'),section,layer,svg,board,info,stats,historyBox,selected=null,pending=null,timer=null,period=1000,modSelect,modGroup,clockButton,drag=null;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const btn=(label,fn,cls='v16-btn')=>{const b=el('button',label,cls);b.type='button';b.addEventListener('click',fn);return b;};
const svgEl=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
const size=n=>n.type==='COUNTER'?185:n.type==='JKFF'?145:M.SPECS[n.type].ins.length===2?118:102;
const pxy=(n,index,kind)=>{const spec=M.SPECS[n.type],count=kind==='out'?spec.outs.length:spec.ins.length;return {x:n.x+(kind==='out'?NW:0),y:n.y+35+(index+1)*(size(n)-35)/(count+1)};};
const txt=v=>v===null?'X':String(v);
function announce(message,error=false){if(info){info.textContent=message;info.classList.toggle('v16-error',error)}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(circuit))}catch(err){announce('本地保存失败，请导出 JSON：'+err.message,true)}}
function restore(){try{const data=JSON.parse(localStorage.getItem(KEY)||'null');M.validate(data);return data}catch(_){return M.example('sample')}}
function stop(reason){if(timer!==null){clearInterval(timer);timer=null;}if(clockButton)clockButton.textContent='▶ 自动时钟';if(reason)announce(reason);}
function apply(fn){try{const next=fn(circuit);M.validate(next);circuit=next;save();draw();return true}catch(err){announce('操作失败：'+err.message,true);return false}}
function vals(){return M.evaluate(circuit)}
function drawWires(state){
 svg.replaceChildren();const nodes=new Map(circuit.nodes.map(n=>[n.id,n]));
 for(const wire of circuit.wires){
  const a=nodes.get(wire.from),b=nodes.get(wire.to),pa=pxy(a,wire.output,'out'),pb=pxy(b,wire.input,'in');
  const bend=Math.max(42,Math.abs(pa.x-pb.x)*.43);
  const d='M'+pa.x+','+pa.y+' C'+(pa.x+bend)+','+pa.y+' '+(pb.x-bend)+','+pb.y+' '+pb.x+','+pb.y;
  const signal=state[wire.from].outputs[wire.output];
  const line=svgEl('path',{d,class:'v16-wire','data-v':txt(signal)});svg.append(line);
  const hit=svgEl('path',{d,class:'v16-wire-hit',tabindex:0,role:'button','aria-label':'断开 '+wire.from+' 至 '+wire.to+' 的连接'});
  const remove=()=>{if(window.confirm('断开选中的导线吗？')){pending=null;apply(c=>M.disconnect(c,wire.to,wire.input));}};
  hit.addEventListener('click',remove);hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();remove()}});
  svg.append(hit);
 }
}
function onOutput(id,output){pending={id,output};selected=id;draw();announce('已选择 '+id+' 输出 '+M.SPECS[circuit.nodes.find(n=>n.id===id).type].outs[output]+'，请点击另一个元件的输入端。')}
function onInput(id,input){
 if(pending){const from=pending;pending=null;apply(c=>M.connect(c,from.id,from.output,id,input));}
 else if(circuit.wires.some(w=>w.to===id&&w.input===input)){apply(c=>M.disconnect(c,id,input));announce('已经断开该输入端。')}
 else announce('请先点击一个输出端，再点击目标输入端。')
}
function updateCounterControl(){
 const n=circuit.nodes.find(n=>n.id===selected);
 modGroup.style.display=n&&n.type==='COUNTER'?'flex':'none';
 if(n&&n.type==='COUNTER')modSelect.value=String(n.modulus);
}
function dragBegin(evt,id,card,head){
 if(evt.button!==0)return;
 evt.preventDefault();selected=id;updateCounterControl();
 const n=circuit.nodes.find(x=>x.id===id);
 drag={id,originalX:n.x,originalY:n.y,startX:evt.clientX,startY:evt.clientY,pointer:evt.pointerId,head,card};
 head.setPointerCapture(evt.pointerId);
 head.addEventListener('pointermove',dragMove);
 head.addEventListener('pointerup',dragFinish,{once:true});head.addEventListener('pointercancel',dragFinish,{once:true});
 layer.querySelectorAll('.v16-node').forEach(x=>x.classList.toggle('selected',x.dataset.id===id));
}
function dragMove(evt){
 if(!drag||evt.pointerId!==drag.pointer)return;
 const n=circuit.nodes.find(x=>x.id===drag.id);
 n.x=Math.min(W-NW-7,Math.max(7,Math.round(drag.originalX+evt.clientX-drag.startX)));
 n.y=Math.min(H-size(n)-7,Math.max(7,Math.round(drag.originalY+evt.clientY-drag.startY)));
 drag.card.style.left=n.x+'px';drag.card.style.top=n.y+'px';
 drawWires(vals());
}
function dragFinish(evt){
 if(!drag||evt.pointerId!==drag.pointer)return;
 drag.head.removeEventListener('pointermove',dragMove);drag=null;save();announce('元件位置已保存。');
}
function draw(){
 if(!layer)return;
 const state=vals();layer.replaceChildren();
 for(const n of circuit.nodes){
  const spec=M.SPECS[n.type],dom=el('article',undefined,'v16-node'+(selected===n.id?' selected':'')),h=size(n);
  dom.dataset.id=n.id;dom.style.left=n.x+'px';dom.style.top=n.y+'px';dom.style.height=h+'px';
  const head=el('div',n.id+' · '+spec.label,'v16-node-head');head.title='拖动标题移动元件';
  head.addEventListener('pointerdown',e=>dragBegin(e,n.id,dom,head));dom.append(head);
  const content=el('div',undefined,'v16-node-mid');
  if(n.type==='SWITCH'){
   content.append(btn('切换  '+n.value,()=>{pending=null;apply(c=>M.toggle(c,n.id))},'v16-node-switch'));
  }else if(n.type==='CLOCK'){content.append(el('div','↑ 共享脉冲时钟','v16-node-output'));content.append(el('small','点击上方单步时钟'));}
  else if(n.type==='LED'){
   const v=state[n.id].inputs[0];
   content.append(el('div','● '+(v===1?'亮':v===0?'灭':'未知'),'v16-led-'+(v===1?'on':v===0?'off':'x')));
  }else if(n.type==='COUNTER'){
   const binary=state[n.id].outputs.slice().reverse().map(txt).join('');
   content.append(el('div','Q[3:0] = '+binary,'v16-node-output'));
   content.append(el('small','MOD '+n.modulus+' · '+(n.count===null?'未知':n.count)));
  }else{
   const v=state[n.id].outputs[0];
   content.append(el('div','输出 '+txt(v),'v16-node-output'));
   if(spec.kind==='seq')content.append(el('small','上升沿采样'));
  }
  dom.append(content);
  const pins=el('div',undefined,'v16-pin-layer');
  spec.ins.forEach((label,i)=>{const p=btn(label,()=>onInput(n.id,i),'v16-port in');p.style.top=(pxy(n,i,'in').y-n.y)+'px';p.setAttribute('aria-label',n.id+' 输入 '+label);p.title='点击连接，或断开已连接的输入';pins.append(p);});
  spec.outs.forEach((label,i)=>{const p=btn(label,()=>onOutput(n.id,i),'v16-port out'+(pending&&pending.id===n.id&&pending.output===i?' pending':''));p.style.top=(pxy(n,i,'out').y-n.y)+'px';p.setAttribute('aria-label',n.id+' 输出 '+label);pins.append(p);});
  dom.append(pins);
  dom.addEventListener('click',()=>{selected=n.id;layer.querySelectorAll('.v16-node').forEach(x=>x.classList.toggle('selected',x.dataset.id===selected));updateCounterControl()});
  layer.append(dom);
 }
 drawWires(state);
 const ledCount=circuit.nodes.filter(n=>n.type==='LED'&&state[n.id].inputs[0]===1).length;
 stats.textContent=circuit.nodes.length+' 元件 · '+circuit.wires.length+' 导线 · '+circuit.tick+' 时钟脉冲 · '+ledCount+' LED 点亮';
 updateCounterControl();renderHistory();
}
function renderHistory(){
 historyBox.replaceChildren();
 const list=circuit.history.slice().reverse();
 if(!list.length){historyBox.append(el('p','暂无时钟波形记录。请点击“↑ 单步时钟”。'));return;}
 const table=el('table',undefined,'v16-table'),thead=el('thead'),tr=el('tr');
 ['脉冲序号','寄存器与计数器的沿后状态'].forEach(t=>tr.append(el('th',t)));thead.append(tr);table.append(thead);
 const tbody=el('tbody');
 for(const row of list){
  const t=el('tr');
  t.append(el('td',row.tick));
  const states=Object.entries(row.states).map(([id,v])=>id+'='+v).join(' | ');
  t.append(el('td',states||'当前没有时序元件'));
  tbody.append(t);
 }
 table.append(tbody);historyBox.append(table);
}
function pulse(){
 if(apply(c=>M.pulse(c)))announce('已发送一个完整的低→高→低时钟脉冲；历史已保存。');
}
function runClock(){
 if(timer!==null){stop('自动时钟已暂停。');return;}
 if(!section.classList.contains('active')||document.hidden){announce('请先打开 V1.6 页面。',true);return;}
 clockButton.textContent='⏸ 暂停时钟';
 timer=setInterval(()=>{
  if(!section.classList.contains('active')||document.hidden){stop('页面已切换，时钟自动暂停。');return;}
  if(!apply(c=>M.pulse(c)))stop('自动时钟遇到错误，已暂停。');
 },period);
 announce('自动时钟已启动，每 '+period+' ms 触发一个脉冲。');
}
function exportData(){
 const url=URL.createObjectURL(new Blob([JSON.stringify(circuit,null,2)],{type:'application/json'}));
 const a=el('a');a.href=url;a.download='数字综合电路-v1.6.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function init(){
 const main=document.getElementById('main'),nav=document.getElementById('nav');if(!main||!nav||typeof window.show!=='function')return;
 const ch=el('div',undefined,'chap');ch.append(el('div','综合实验 · V1.6','chap-h'));
 const item=el('div',undefined,'nav-item');item.dataset.mod='v16-lab';
 item.append(el('span',undefined,'dot'),el('span','🔌 混合电路搭建实验室'));
 ch.append(item);nav.append(ch);
 section=el('section',undefined,'mod');section.id='v16-lab';
 const title=el('div',undefined,'mod-h');
 title.append(el('div','V1.6 · 组合逻辑 + 同步时序逻辑','crumb'),el('h1','混合数字电路实验室'),el('p','同一张画布连接逻辑门、时钟、触发器与计数器，观察时钟采样后的输出变化。','claim'));
 section.append(title);
 const guide=el('div',undefined,'v16-panel');guide.append(el('p','建议先载入“异或 → D 触发器”示例：先调输入开关，再点击一次时钟，观察 LED 是否更新。输出端（蓝）点击后，再点输入端（橙）接线；点击已连接输入或导线可断开。'));section.append(guide);
 const actions=el('div',undefined,'v16-panel'),row=el('div',undefined,'v16-controls');
 const loadExample=(name)=>{if(window.confirm('载入示例将覆盖当前画布，建议先导出备份。确定继续？')){stop();selected=null;pending=null;apply(()=>M.example(name));}};
 row.append(btn('异或 → D 触发器',()=>loadExample('sample')));
 row.append(btn('模 6 计数器',()=>loadExample('counter')));
 row.append(btn('JK 触发器',()=>loadExample('jk')));
 row.append(btn('↑ 单步时钟',pulse,'v16-btn v16-btn-primary'));
 clockButton=btn('▶ 自动时钟',runClock);row.append(clockButton);
 const speed=el('label',undefined,'v16-label');speed.append(el('span','时钟间隔'));
 const speedSelect=el('select',undefined,'v16-select');
 for(const ms of [500,1000,1500,2000]){const opt=el('option',ms+' ms');opt.value=String(ms);speedSelect.append(opt);}
 speedSelect.value=String(period);speedSelect.setAttribute('aria-label','时钟间隔');
 speedSelect.addEventListener('change',()=>{const running=timer!==null;stop();period=Number(speedSelect.value);if(running)runClock();});
 speed.append(speedSelect);row.append(speed);
 row.append(btn('复位全部寄存器',()=>{stop();pending=null;apply(c=>M.reset(c));}));
 row.append(btn('删除选中元件',()=>{
  if(!selected){announce('请先选中一个元件。',true);return;}
  const id=selected;selected=null;pending=null;apply(c=>M.remove(c,id));
 }));
 row.append(btn('清空画布',()=>{if(window.confirm('确定删除全部元件和连线？')){stop();selected=null;pending=null;apply(()=>M.empty());}}));
 const modLabel=el('label',undefined,'v16-label');modLabel.append(el('span','选中计数器 MOD'));
 modSelect=el('select',undefined,'v16-select');modSelect.setAttribute('aria-label','设置计数器模数');
 for(let i=2;i<=16;i++){const opt=el('option',i);opt.value=String(i);modSelect.append(opt);}
 modSelect.addEventListener('change',()=>{
  const id=selected,next=Number(modSelect.value);
  if(!window.confirm('更改模数会清零时钟历史和当前计数，继续？')){updateCounterControl();return;}
  stop();apply(c=>M.setModulus(c,id,next));
 });
 modLabel.append(modSelect);modGroup=modLabel;modGroup.style.display='none';row.append(modGroup);
 row.append(btn('导出 JSON',exportData));
 const upload=el('input');upload.type='file';upload.accept='.json,application/json';upload.hidden=true;
 upload.addEventListener('change',async()=>{
  const f=upload.files?.[0];if(!f)return;
  try{
   if(f.size>200000)throw Error('电路文件不能大于 200KB');
   const parsed=JSON.parse(await f.text());M.validate(parsed);
   if(window.confirm('导入将覆盖当前 V1.6 电路，确定继续？')){stop();selected=null;pending=null;apply(()=>JSON.parse(JSON.stringify(parsed))); }
  }catch(err){announce('导入失败：'+err.message,true)}finally{upload.value='';}
 });
 row.append(btn('导入 JSON',()=>upload.click()),upload);
 actions.append(row);section.append(actions);
 const layout=el('div',undefined,'v16-layout'),palette=el('aside',undefined,'v16-panel v16-palette');
 palette.append(el('h2','元件库'),el('p','点击添加或拖入画布。端口字母表示引脚功能。'));
 Object.keys(M.SPECS).forEach(type=>{
  const add=()=>{const count=circuit.nodes.length,x=50+(count%5)*205,y=65+(Math.floor(count/5)%4)*155;apply(c=>M.add(c,type,x,y));};
  const b=btn('+ '+M.SPECS[type].label,add);b.draggable=true;
  b.addEventListener('dragstart',evt=>{evt.dataTransfer.setData('text/plain',type);evt.dataTransfer.effectAllowed='copy';});palette.append(b);
 });
 const work=el('div',undefined,'v16-work'),scroll=el('div',undefined,'v16-board-scroll');
 board=el('div',undefined,'v16-board');board.setAttribute('aria-label','V1.6 混合数字电路接线画布');
 board.append(el('div',undefined,'v16-grid'));
 svg=svgEl('svg',{class:'v16-wires',viewBox:'0 0 '+W+' '+H});board.append(svg);
 layer=el('div',undefined,'v16-nodes');board.append(layer);
 board.addEventListener('dragover',evt=>{evt.preventDefault();evt.dataTransfer.dropEffect='copy'});
 board.addEventListener('drop',evt=>{
  evt.preventDefault();const type=evt.dataTransfer.getData('text/plain');
  if(!Object.prototype.hasOwnProperty.call(M.SPECS,type))return;
  const rect=board.getBoundingClientRect();
  apply(c=>M.add(c,type,Math.max(7,Math.min(W-NW-7,evt.clientX-rect.left)),Math.max(7,Math.min(H-195,evt.clientY-rect.top))));
 });
 scroll.append(board);work.append(scroll);
 const foot=el('div',undefined,'v16-footer');info=el('span','已加载。');info.setAttribute('role','status');stats=el('span');foot.append(info,stats);work.append(foot);
 const log=el('div',undefined,'v16-panel');log.append(el('h2','时钟波形状态记录（最近 48 个脉冲）'));
 historyBox=el('div',undefined,'v16-scroll');log.append(historyBox);work.append(log);
 layout.append(palette,work);section.append(layout);
 const limits=el('div',undefined,'v16-panel');
 limits.append(el('h2','实验与注意事项'));
 limits.append(el('div','① 将 A、B 开关通过 XOR 接到 D 触发器 D 端；不按时钟时 LED 不应改变，按 ↑ 后采样最新 XOR。② 计数器设 MOD=6，CLK 接 CLOCK，EN 接 1、RST 接 0，6 个上升沿后回到 0000。③ JK 的 J=K=1 时，Q 每个上升沿翻转。','v16-callout'));
 limits.append(el('p','本版按理想离散事件模拟：只有经过寄存器隔离的反馈才允许。它不会模拟电压、门延迟、时钟毛刺、竞争冒险、建立保持时间或亚稳态；组合门与触发器已在同一画布协作，但不是物理芯片 SPICE 仿真。'));
 section.append(limits);main.append(section);
 circuit=restore();draw();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop('页面已隐藏，自动时钟暂停。');});
 nav.addEventListener('click',evt=>{const navItem=evt.target.closest('.nav-item[data-mod]');if(navItem&&navItem.dataset.mod!=='v16-lab')stop('离开实验室，已暂停自动时钟。');});
 document.addEventListener('keydown',evt=>{
  if(!section.classList.contains('active')||!selected||!['Delete','Backspace'].includes(evt.key))return;
  const target=evt.target;if(target&&(/INPUT|SELECT|TEXTAREA/.test(target.tagName)||target.isContentEditable))return;
  evt.preventDefault();const id=selected;selected=null;pending=null;apply(c=>M.remove(c,id));
 });
 if(window.location.hash==='#v16-lab'||window.__v13InitialHash==='#v16-lab')window.show('v16-lab');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();