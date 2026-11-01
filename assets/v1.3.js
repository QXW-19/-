/* V1.3：虚拟数字电路实验室 UI。配合 v1.3-core.js 离线运行。 */
(function(){
'use strict';
const M=window.DigitalCircuit;
if(!M){console.error('缺少 v1.3-core.js');return;}
const KEY='digital-course-v1.3-circuit',W=1100,H=620,NW=145,NH=82;
let model,from=null,selected=null,canvas,svg,layer,status,stats,truth,drag=null;
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
const btn=(text,click,cls='v13-btn')=>{const x=el('button',text,cls);x.type='button';x.addEventListener('click',click);return x;};
function notice(s,bad=false){if(!status)return;status.textContent=s;status.classList.toggle('v13-error',bad);}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(model))}catch(e){notice('浏览器无法保存，请导出备份：'+e.message,true)}}
function restore(){try{const o=JSON.parse(localStorage.getItem(KEY));M.validate(o);return o}catch(_){return M.example('and')}}
function update(fn){try{const next=fn(model);M.validate(next);model=next;persist();draw();return true}catch(e){notice('操作失败：'+e.message,true);return false}}
function pos(n,output,i){return {x:n.x+(output?NW:0),y:n.y+(output?41:i===0?33:61)}}
function drawWires(){
svg.replaceChildren();const nodes=new Map(model.nodes.map(n=>[n.id,n]));
for(const w of model.wires){
const a=pos(nodes.get(w.from),true,0),b=pos(nodes.get(w.to),false,w.port),d=Math.max(45,Math.abs(b.x-a.x)*.45);
const curve='M'+a.x+','+a.y+' C'+(a.x+d)+','+a.y+' '+(b.x-d)+','+b.y+' '+b.x+','+b.y;
const line=document.createElementNS('http://www.w3.org/2000/svg','path');line.setAttribute('d',curve);line.setAttribute('class','v13-wire-line');svg.append(line);
const hit=document.createElementNS('http://www.w3.org/2000/svg','path');hit.setAttribute('d',curve);hit.setAttribute('class','v13-wire-hit');hit.setAttribute('role','button');hit.setAttribute('tabindex','0');hit.setAttribute('aria-label','删除 '+w.from+' 到 '+w.to+' 的连线');
const remove=()=>{if(confirm('断开这根线？')){from=null;update(c=>M.disconnect(c,w.to,w.port))}};
hit.addEventListener('click',remove);hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();remove()}});svg.append(hit);
}}
function outPin(id){from=id;selected=id;draw();notice('已选 '+id+' 输出端，点击一个左侧输入端连接。')}
function inPin(id,port){
if(from){const source=from;from=null;update(c=>M.connect(c,source,id,port))}
else if(model.wires.some(w=>w.to===id&&w.port===port)){update(c=>M.disconnect(c,id,port));notice('已经断开输入端。')}
else notice('请先点击右侧输出端，再点击此输入端。')
}
function draw(){
if(!layer)return;
const values=M.evaluate(model);layer.replaceChildren();
for(const n of model.nodes){
const spec=M.SPECS[n.type],v=values[n.id].value;
const card=el('article',undefined,'v13-node'+(selected===n.id?' v13-selected':''));card.dataset.id=n.id;card.style.left=n.x+'px';card.style.top=n.y+'px';
const head=el('div',n.id+' · '+spec.name,'v13-node-title');head.title='拖动标题移动元件';head.addEventListener('pointerdown',e=>startDrag(e,n.id,card,head));card.append(head);
const body=el('div',undefined,'v13-node-body');
if(n.type==='SWITCH')body.append(btn('开关 '+n.value+'（点击切换）',()=>{from=null;update(c=>M.toggleSwitch(c,n.id))},'v13-switch'));
else if(n.type==='LED')body.append(el('div','● '+(v===null?'未知':v?'亮':'灭'),'v13-led '+(v===null?'v13-led-x':v?'v13-led-on':'v13-led-off')));
else body.append(el('div','输出 '+(v===null?'X':v),'v13-value'));
card.append(body);
const pins=el('div',undefined,'v13-pins');
for(let i=0;i<spec.inputs;i++){const p=btn(String(i+1),()=>inPin(n.id,i),'v13-pin v13-in');p.style.top=(i===0?33:61)+'px';p.setAttribute('aria-label',n.id+' 输入 '+(i+1));p.title='点击输入端连线；无待连接输出时，点击已连接输入可断线';pins.append(p)}
if(spec.output){const p=btn('→',()=>outPin(n.id),'v13-pin v13-out'+(from===n.id?' v13-pending':''));p.style.top='41px';p.setAttribute('aria-label',n.id+' 输出端');pins.append(p)}
card.append(pins);card.addEventListener('click',()=>{selected=n.id;layer.querySelectorAll('.v13-node').forEach(x=>x.classList.toggle('v13-selected',x.dataset.id===selected))});layer.append(card);
}
drawWires();
stats.textContent=model.nodes.length+' 个元件 · '+model.wires.length+' 根线 · '+model.nodes.filter(n=>n.type==='LED'&&values[n.id].value===1).length+' 个 LED 点亮';
if(!from)notice('点击开关切换电平；输出端 → 输入端连线；点击已连线的输入端可断开。');
table();
}
function startDrag(e,id,card,head){
if(e.button!==0)return;e.preventDefault();selected=id;
const node=model.nodes.find(n=>n.id===id);if(!node)return;
drag={id,card,x:node.x,y:node.y,cx:e.clientX,cy:e.clientY,pointer:e.pointerId};
try{head.setPointerCapture(e.pointerId)}catch(_){}
head.addEventListener('pointermove',dragMove);head.addEventListener('pointerup',dragEnd,{once:true});head.addEventListener('pointercancel',dragEnd,{once:true});
}
function dragMove(e){
if(!drag||drag.pointer!==e.pointerId)return;
const x=Math.max(8,Math.min(W-NW-8,Math.round(drag.x+e.clientX-drag.cx)));
const y=Math.max(8,Math.min(H-NH-8,Math.round(drag.y+e.clientY-drag.cy)));
const n=model.nodes.find(n=>n.id===drag.id);n.x=x;n.y=y;drag.card.style.left=x+'px';drag.card.style.top=y+'px';drawWires();
}
function dragEnd(e){if(!drag||drag.pointer!==e.pointerId)return;drag.card.querySelector('.v13-node-title').removeEventListener('pointermove',dragMove);drag=null;persist();notice('元件位置已保存。')}
function table(){
truth.replaceChildren();let data;try{data=M.truthTable(model)}catch(e){truth.append(el('p',e.message,'v13-hint'));return;}
truth.append(el('p','输入 '+data.switches.join('、')+'；输出 '+data.outputs.join('、'),'v13-hint'));
const wrap=el('div',undefined,'v13-table-scroll'),t=el('table'),thead=el('thead'),tr=el('tr');
[...data.switches,...data.outputs].forEach(id=>tr.append(el('th',id)));thead.append(tr);t.append(thead);
const tbody=el('tbody');data.rows.forEach(r=>{const row=el('tr');[...r.inputs,...r.outputs].forEach(v=>row.append(el('td',v===null?'X':String(v))));tbody.append(row)});
t.append(tbody);wrap.append(t);truth.append(wrap);
}
function exportJson(){
const blob=new Blob([JSON.stringify(model,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');
a.href=url;a.download='数字电路-v1.3.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);notice('已生成电路 JSON。')
}
function init(){
const main=document.getElementById('main'),nav=document.getElementById('nav');if(!main||!nav||typeof window.show!=='function')return;
const ch=el('div',undefined,'chap');ch.append(el('div','扩展实验 · V1.3','chap-h'));
const link=el('div',undefined,'nav-item');link.dataset.mod='v13-lab';link.append(el('span',undefined,'dot'),el('span','🔌 虚拟数字电路实验室'));ch.append(link);nav.append(ch);
const section=el('section',undefined,'mod');section.id='v13-lab';
const header=el('div',undefined,'mod-h');header.append(el('div','V1.3 · 可交互电路仿真','crumb'),el('h1','虚拟数字电路实验室'),el('p','在元件库点击添加或拖动放置；拖动元件标题移动；先点击输出圆点，再点击输入圆点连接。','claim'));section.append(header);
const guide=el('div',undefined,'v13-guide');guide.append(el('strong','提示：'),document.createTextNode('建议先载入“与门”或“半加器”示例。本版模拟 0、1、X（未知）三值的无环组合逻辑，不模拟模拟电压、门延迟及触发器。'));section.append(guide);
const actions=el('div',undefined,'v13-actions');
actions.append(btn('载入与门示例',()=>{if(confirm('将替换当前电路，建议先导出备份，继续吗？')){selected=null;from=null;update(()=>M.example('and'))}}));
actions.append(btn('载入半加器',()=>{if(confirm('将替换当前电路，建议先导出备份，继续吗？')){selected=null;from=null;update(()=>M.example('halfAdder'))}}));
actions.append(btn('清空画布',()=>{if(confirm('删除当前全部元件与连线？')){selected=null;from=null;update(()=>M.newCircuit())}}));
actions.append(btn('删除选中元件',()=>{if(!selected){notice('请先选中元件。',true);return;}const id=selected;selected=null;from=null;update(c=>M.removeNode(c,id))}));
actions.append(btn('导出电路 JSON',exportJson));
const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
file.addEventListener('change',async()=>{
const f=file.files?.[0];if(!f)return;
try{if(f.size>100000)throw Error('文件不能超过 100KB');const parsed=JSON.parse(await f.text());M.validate(parsed);
if(confirm('导入将覆盖当前画布，继续吗？')){selected=null;from=null;update(()=>({version:1,nodes:parsed.nodes.map(n=>({...n})),wires:parsed.wires.map(w=>({...w}))}))}}
catch(e){notice('导入失败：'+e.message,true)}finally{file.value=''}});
actions.append(btn('导入电路 JSON',()=>file.click()),file);section.append(actions);
const layout=el('div',undefined,'v13-layout'),palette=el('aside',undefined,'v13-palette');palette.append(el('h2','元件库'),el('p','点击添加，或拖到画布','v13-hint'));
['SWITCH','AND','OR','NOT','XOR','NAND','NOR','LED'].forEach(type=>{
const add=()=>{const i=model.nodes.length,x=70+(i%4)*235,y=85+(Math.floor(i/4)%4)*112;update(c=>M.addNode(c,type,x,y))};
const p=btn('+ '+M.SPECS[type].name,add,'v13-palette-item');p.draggable=true;
p.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',type);e.dataTransfer.effectAllowed='copy'});palette.append(p)
});
palette.append(el('p','仅支持无环组合逻辑，未连接的输入显示 X。','v13-hint'));
const content=el('div',undefined,'v13-content'),wrap=el('div',undefined,'v13-board-wrap');canvas=el('div',undefined,'v13-board');canvas.style.width=W+'px';canvas.style.height=H+'px';canvas.setAttribute('aria-label','数字电路搭建画布');
canvas.append(el('div',undefined,'v13-grid'));
svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('class','v13-wires');canvas.append(svg);
layer=el('div',undefined,'v13-node-layer');canvas.append(layer);
canvas.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy'});
canvas.addEventListener('drop',e=>{e.preventDefault();const type=e.dataTransfer.getData('text/plain');if(!M.SPECS[type])return;const r=canvas.getBoundingClientRect();
update(c=>M.addNode(c,type,Math.max(8,Math.min(W-NW,e.clientX-r.left)),Math.max(8,Math.min(H-NH,e.clientY-r.top))))});
wrap.append(canvas);content.append(wrap);
const foot=el('div',undefined,'v13-status-bar');status=el('span','就绪','v13-status');status.setAttribute('role','status');stats=el('span');foot.append(status,stats);content.append(foot);
const truthPanel=el('section',undefined,'v13-truth');truthPanel.append(el('h2','自动真值表'),el('p','最多允许 4 个输入开关，共 16 种组合。X 表示未知。','v13-hint'));truth=el('div');truthPanel.append(truth);content.append(truthPanel);
layout.append(palette,content);section.append(layout);
section.append(el('p','本工具为理想逻辑教学仿真，不代替芯片数据手册、真实电气安全与时序检查。电路仅保存在当前浏览器，请定期导出。','v13-hint'));
main.append(section);model=restore();draw();
if(window.__v13InitialHash==='#v13-lab'||window.location.hash==='#v13-lab')window.show('v13-lab');
document.addEventListener('keydown',e=>{if(!section.classList.contains('active')||!selected||!(e.key==='Delete'||e.key==='Backspace'))return;const t=e.target;if(t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable))return;
e.preventDefault();const id=selected;selected=null;from=null;update(c=>M.removeNode(c,id))});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();