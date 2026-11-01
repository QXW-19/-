/* V1.4 时序逻辑实验室：基于理想正沿离散事件模型。 */
(function(){
'use strict';
const Engine=window.DigitalSequential;
if(!Engine){console.error('[V1.4] 核心模型未加载');return;}
const STORE='digital-course-v1.4-sequential';
let state=Engine.create('D'),timer=null,period=1000;
const e=(tag,text,cls)=>{
  const node=document.createElement(tag);if(text!==undefined)node.textContent=text;
  if(cls)node.className=cls;return node;
};
const button=(label,fn,cls='v14-btn')=>{const b=e('button',label,cls);b.type='button';b.addEventListener('click',fn);return b;};
const svgNode=(tag,props={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(props).forEach(([key,value])=>n.setAttribute(key,String(value)));return n;};
let section,modeSelect,modSelect,inputArea,register,metrics,hint,historyBox,stateBox,waveBox,playBtn,rateSelect;
function load(){
  try{const parsed=JSON.parse(localStorage.getItem(STORE)||'null');Engine.validate(parsed);return parsed}
  catch(_){return Engine.create('D');}
}
function save(){
  try{localStorage.setItem(STORE,JSON.stringify(state));return true;}
  catch(err){announce('本地保存不可用，请使用“导出记录”：'+err.message,true);return false;}
}
function announce(message,bad=false){if(hint){hint.textContent=message;hint.className=bad?'v14-error':'v14-note';}}
function active(){return !!section&&section.classList.contains('active')&&!document.hidden;}
function stop(reason){
  if(timer!==null){clearInterval(timer);timer=null;}
  if(playBtn)playBtn.textContent='▶ 自动时钟';
  if(reason)announce(reason);
}
function press(){
  try{state=Engine.step(state);save();render();}
  catch(err){stop();announce(err.message,true);}
}
function start(){
  if(timer!==null){stop('自动时钟已暂停');return;}
  if(!active()){announce('请先打开 V1.4 时序实验室标签页。',true);return;}
  playBtn.textContent='⏸ 暂停时钟';
  timer=setInterval(()=>{if(!active()){stop('页面已切换，自动时钟已暂停');return;}press();},period);
  announce('自动时钟每 '+period+' ms 触发一次理想上升沿。');
}
function setFresh(next,verb){
  if(state.tick>0&&!window.confirm('更改'+verb+'会清除当前波形记录，继续吗？'))return;
  stop();state=next();save();render();
}
function inputControl(name){
  const wrap=e('div',undefined,'v14-input-control');
  const label=e('span','输入 '+name);const val=e('strong',String(state.inputs[name]));
  const toggle=button('切换',()=>{state=Engine.setInput(state,name,1-state.inputs[name]);save();render();});
  toggle.setAttribute('aria-label','切换输入 '+name+'，当前 '+state.inputs[name]);
  wrap.append(label,val,toggle);return wrap;
}
function updateInputs(){
  inputArea.replaceChildren();
  const names=state.mode==='COUNTER'?[]:state.mode==='JK'?['J','K']:[state.mode];
  if(!names.length){inputArea.append(e('p','计数器每个有效时钟沿递增一次，达到 N−1 后同步回到 0。','v14-note'));return;}
  names.forEach(name=>inputArea.append(inputControl(name)));
  inputArea.append(e('p','输入设置立即改变，但 Q 只在“单步时钟”或自动上升沿后改变。','v14-note'));
}
function renderTrace(){
  historyBox.replaceChildren();
  const table=e('table',undefined,'v14-table'),thead=e('thead'),headrow=e('tr');
  ['时钟沿','边沿前','采样输入','边沿后','转移原因'].forEach(t=>headrow.append(e('th',t)));
  thead.append(headrow);table.append(thead);
  const tbody=e('tbody');
  state.history.slice().reverse().forEach(row=>{
    const tr=e('tr');const input=row.mode==='D'?'D='+row.inputs.D:row.mode==='T'?'T='+row.inputs.T:row.mode==='JK'?'J='+row.inputs.J+' K='+row.inputs.K:'—';
    [row.tick,row.before,input,row.after,row.note].forEach(value=>tr.append(e('td',String(value))));tbody.append(tr);
  });
  if(!state.history.length){
    const tr=e('tr'),td=e('td','尚无时钟沿记录。点击“单步时钟”开始。');td.colSpan=5;tr.append(td);tbody.append(tr);
  }
  table.append(tbody);historyBox.append(table);
}
function renderStates(){
  stateBox.replaceChildren();
  const rows=Engine.transitionTable(state.mode,state.modulus);
  const table=e('table',undefined,'v14-table'),h=e('thead'),header=e('tr');
  ['当前 Q','边沿采样输入','下一状态 Q⁺'].forEach(t=>header.append(e('th',t)));h.append(header);table.append(h);
  const body=e('tbody');
  rows.forEach(row=>{const tr=e('tr');[row.current,row.input,row.next].forEach(v=>tr.append(e('td',v)));body.append(tr)});
  table.append(body);stateBox.append(table);
}
function drawWave(){
  waveBox.replaceChildren();
  const records=state.history.slice(-12);
  if(!records.length){waveBox.append(e('p','波形记录将在第一个时钟上升沿后出现。','v14-note'));return;}
  const width=960,left=100,right=26,delta=(width-left-right)/records.length;
  const labels=['CLK',...(state.mode==='D'?['D']:state.mode==='T'?['T']:state.mode==='JK'?['J','K']:[]),...(state.mode==='COUNTER'?
    Array.from({length:Math.ceil(Math.log2(state.modulus))},(_,i)=>'Q'+(Math.ceil(Math.log2(state.modulus))-i-1)):['Q'])];
  const height=42+labels.length*54+28;
  const svg=svgNode('svg',{viewBox:'0 0 '+width+' '+height,role:'img','aria-label':'按时钟上升沿记录的输入与输出逻辑波形',class:'v14-wave'});
  const text=(x,y,body)=>{const node=svgNode('text',{x,y});node.textContent=String(body);svg.append(node);};
  const addPath=(d,cls)=>svg.append(svgNode('path',{d,class:cls}));
  labels.forEach((label,row)=>{
    const base=32+row*54,hi=base,lo=base+22;
    text(17,base+17,label);
    addPath('M'+left+','+(base+35)+' H'+(width-right),'v14-grid');
    let d='',last=0;
    for(let i=0;i<records.length;i++){
      const rec=records[i],start=left+i*delta,end=start+delta;
      const value=label==='CLK'?1:label==='D'?rec.inputs.D:label==='T'?rec.inputs.T:label==='J'?rec.inputs.J:label==='K'?rec.inputs.K:
        label==='Q'?rec.after:(rec.after>>Number(label.slice(1)))&1;
      const y=value?hi:lo;
      if(label==='CLK'){
        d+=' M'+start+','+lo+' H'+(start+delta*.22)+' V'+hi+' H'+(start+delta*.65)+' V'+lo+' H'+end;
      }else{
        if(i===0)d+=' M'+start+','+y;
        else if(last!==value)d+=' V'+y;
        d+=' H'+end;
      }
      last=value;
    }
    addPath(d,label==='CLK'?'v14-clock':'v14-path');
  });
  records.forEach((rec,i)=>text(left+i*delta+delta*.45,height-12,'↑'+rec.tick));
  waveBox.append(svg);
  waveBox.append(e('p','示意波形：CLK 的每个 ↑ 表示一次离散采样事件，输入显示该沿采样值，Q 显示沿后状态；不表示真实器件传播延迟。','v14-note'));
}
function render(){
  modeSelect.value=state.mode;modSelect.value=String(state.modulus);
  modSelect.disabled=state.mode!=='COUNTER';modSelect.closest('label').classList.toggle('v14-hidden',state.mode!=='COUNTER');
  updateInputs();
  register.textContent=Engine.bits(state);
  metrics.replaceChildren();
  metrics.append(e('span','有效上升沿：'+state.tick,'v14-chip'));
  metrics.append(e('span',state.mode==='COUNTER'?'十进制计数：'+state.count:'Q：'+state.q,'v14-chip'));
  if(state.mode==='COUNTER')metrics.append(e('span','MOD '+state.modulus,'v14-chip'));
  const last=state.history[state.history.length-1];
  if(last)announce('最近一次：'+last.note+'（'+last.before+' → '+last.after+'）');
  else announce('开始：通过切换输入并按下单步时钟观察状态变化。');
  renderStates();renderTrace();drawWave();
}
function download(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=e('a');a.href=url;a.download='数字时序实验-V1.4.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function init(){
  const main=document.getElementById('main'),nav=document.getElementById('nav');
  if(!main||!nav||typeof window.show!=='function')return;
  const chap=e('div',undefined,'chap');
  chap.append(e('div','扩展实验 · V1.4','chap-h'));
  const navItem=e('div',undefined,'nav-item');navItem.dataset.mod='v14-lab';
  navItem.append(e('span',undefined,'dot'),e('span','⏱ 时序逻辑实验室'));
  chap.append(navItem);nav.append(chap);
  section=e('section',undefined,'mod');section.id='v14-lab';
  const header=e('div',undefined,'mod-h');
  header.append(e('div','V1.4 · 触发器与同步计数器','crumb'),e('h1','时序逻辑实验室'),e('p','设置输入 → 触发时钟上升沿 → 观察 Q、转移表与采样波形。','claim'));
  section.append(header);
  const controls=e('div',undefined,'v14-panel');
  const row=e('div',undefined,'v14-toolbar');
  const modeLabel=e('label',undefined,'v14-label');modeLabel.append(e('span','实验模式'));
  modeSelect=e('select',undefined,'v14-select');modeSelect.setAttribute('aria-label','选择实验模式');
  Object.entries(Engine.MODES).forEach(([value,label])=>{const opt=e('option',label);opt.value=value;modeSelect.append(opt)});
  modeSelect.addEventListener('change',()=>{const wanted=modeSelect.value;setFresh(()=>Engine.setMode(state,wanted),'实验模式');modeSelect.value=state.mode;});
  modeLabel.append(modeSelect);
  const modLabel=e('label',undefined,'v14-label');modLabel.append(e('span','计数模数 N'));
  modSelect=e('select',undefined,'v14-select');modSelect.setAttribute('aria-label','选择同步计数器模数');
  for(let n=2;n<=16;n++){const o=e('option',String(n));o.value=String(n);modSelect.append(o)}
  modSelect.addEventListener('change',()=>{const next=Number(modSelect.value);setFresh(()=>Engine.setModulus(state,next),'模数');modSelect.value=String(state.modulus)});
  modLabel.append(modSelect);
  row.append(modeLabel,modLabel);
  row.append(button('↑ 单步时钟',press,'v14-btn v14-btn-primary'));
  playBtn=button('▶ 自动时钟',start);row.append(playBtn);
  const speedLabel=e('label',undefined,'v14-label');speedLabel.append(e('span','时钟间隔'));
  rateSelect=e('select',undefined,'v14-select');rateSelect.setAttribute('aria-label','自动时钟间隔');
  for(const n of [500,1000,1500,2000]){const o=e('option',n+' ms');o.value=String(n);rateSelect.append(o)}
  rateSelect.value=String(period);
  rateSelect.addEventListener('change',()=>{period=Number(rateSelect.value);if(timer!==null){stop();start()}});
  speedLabel.append(rateSelect);row.append(speedLabel);
  row.append(button('↺ 软件复位',()=>{stop();state=Engine.reset(state);save();render()}));
  row.append(button('导出记录',download));
  const file=e('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
  file.addEventListener('change',async()=>{
    const selected=file.files?.[0];if(!selected)return;
    try{
      if(selected.size>100000)throw Error('记录不能超过 100 KB');
      const parsed=JSON.parse(await selected.text());Engine.validate(parsed);
      if(window.confirm('导入会覆盖当前 V1.4 实验状态和波形，继续吗？')){
        stop();state=JSON.parse(JSON.stringify(parsed));save();render();
      }
    }catch(err){announce('导入失败：'+err.message,true)}
    finally{file.value=''}
  });
  row.append(button('导入记录',()=>file.click()),file);
  controls.append(row);
  controls.append(e('p','注意：切换实验模式或模数将清空当前实验状态。软件复位将 Q 置 0、计数置 0、清空时钟历史，不代表真实芯片复位引脚的电气时序。'));
  section.append(controls);
  const layout=e('div',undefined,'v14-layout');
  const left=e('div'),right=e('div');
  const monitor=e('div',undefined,'v14-panel');monitor.append(e('h2','当前寄存器状态'));
  inputArea=e('div',undefined,'v14-inputs');monitor.append(inputArea);
  const output=e('div',undefined,'v14-register');
  output.append(e('span','Q 当前位串','v14-metric'));
  register=e('div','0','v14-big');
  metrics=e('div');output.append(register,metrics);monitor.append(output);
  hint=e('p','', 'v14-note');hint.setAttribute('role','status');hint.setAttribute('aria-live','polite');monitor.append(hint);
  left.append(monitor);
  const transitions=e('div',undefined,'v14-panel');transitions.append(e('h2','理想状态转移表'));
  stateBox=e('div',undefined,'v14-table-scroll');transitions.append(stateBox);left.append(transitions);
  const waveform=e('div',undefined,'v14-panel');waveform.append(e('h2','时序波形（最近 12 次上升沿）'));
  waveBox=e('div',undefined,'v14-wave-scroll');waveform.append(waveBox);right.append(waveform);
  const records=e('div',undefined,'v14-panel');records.append(e('h2','状态变化记录（最近 48 次上升沿）'));
  historyBox=e('div',undefined,'v14-table-scroll');records.append(historyBox);right.append(records);
  layout.append(left,right);section.append(layout);
  const foot=e('div',undefined,'v14-panel');
  foot.append(e('h2','学习任务'));
  foot.append(e('p','① D：D=1 时单步一次，Q 应为 1；之后把 D=0，不按时钟时 Q 不变。'));
  foot.append(e('p','② T：T=1 时连续按三次上升沿，Q 应依次 1→0→1。'));
  foot.append(e('p','③ JK：依次测试 J/K=00、01、10、11 对 Q 的保持、复位、置位、翻转。'));
  foot.append(e('p','④ 同步模 N 计数器：取 N=6，记录 000→001→010→011→100→101→000 的回绕序列。'));
  foot.append(e('p','范围声明：本版本是独立于 V1.3 接线画布的理想教学实验室；未实现触发器元件与 V1.3 线路的混合接线，也不模拟芯片传播延迟、建立/保持时间、亚稳态。'));
  section.append(foot);main.append(section);
  state=load();render();
  nav.addEventListener('click',evt=>{
    const item=evt.target.closest('.nav-item[data-mod]');
    if(item&&item.dataset.mod!=='v14-lab')stop();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop('浏览器页面隐藏，自动时钟已暂停');});
  window.addEventListener('beforeunload',()=>stop());
  // 原页面启动时尚未注入动态实验页面；深链接在新增模块加载后解析。
  if(window.__v13InitialHash==='#v14-lab'||window.location.hash==='#v14-lab')window.show('v14-lab');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();