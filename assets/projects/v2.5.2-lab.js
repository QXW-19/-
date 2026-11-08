/* ==========================================================================
   V2.5.2 项目实训台（阶段 B）
   --------------------------------------------------------------------------
   四个可操作项目，全部复用既有内核，不新建第二套仿真：
   - 数字密码锁：V1.6 DigitalMixedCircuit 真实门级电路（比较 + D 触发器）
   - 交通信号灯：V1.7 DigitalProjects 六相位状态机 + 故障注入
   - 数字时钟：V1.7 DigitalProjects 三级计数模型
   - 电压采集：V1.8 DigitalV18Lab.adc 理想量化模型
   界面：项目列表 → 八步导航 → 内容/仿真/波形/排查/总结，进度写入独立新键。
   ========================================================================== */
(function(root){
'use strict';
const D=root.DigitalV252ProjectData;
const M=root.DigitalMixedCircuit;
const P=root.DigitalProjects;
const A=root.DigitalV18Lab;
if(!D){console.error('[V2.5.2] 项目数据未加载');return;}
const SECTION='v252-lab';
const KEY='digital-course-v2.5.2-project-progress';
const NS='http://www.w3.org/2000/svg';

/* ---------------------------- 基础工具 ---------------------------- */
function el(tag,text,cls){
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
}
function svg(tag,attrs){
 const n=document.createElementNS(NS,tag);
 for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));
 return n;
}
function btn(label,fn,cls){
 const b=el('button',label,cls||'v252-btn');
 b.type='button';b.addEventListener('click',fn);return b;
}
function readProgress(){
 try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&typeof v==='object'?v:{};}catch(_){return {};}
}
function saveProgress(p){
 try{localStorage.setItem(KEY,JSON.stringify(p));}catch(_){/* 隐私模式下忽略 */}
}

/* 记录波形：values 只允许 0 / 1 / null（null 用虚线表示不确定）。 */
function drawWaves(host,traces,opt){
 host.replaceChildren();
 const o=opt||{};
 const rows=Math.max(1,traces.length);
 const rowH=34,padL=104,padR=18,padT=18,W=760,H=padT+rows*rowH+14;
 const n=Math.max(1,traces.reduce((m,t)=>Math.max(m,t.values.length),0));
 const stepX=(W-padL-padR)/Math.max(1,n-1);
 const s=svg('svg',{viewBox:'0 0 '+W+' '+H,class:'v252-wave','role':'img','aria-label':o.label||'项目波形'});
 s.append(svg('title',{}));
 s.lastChild.textContent=o.label||'项目波形';
 traces.forEach((tr,idx)=>{
  const base=padT+idx*rowH;
  const yHigh=base+4,yLow=base+rowH-10;
  s.append(svg('line',{x1:padL,y1:yHigh,x2:W-padR,y2:yHigh,class:'v252-wave-grid'}));
  s.append(svg('line',{x1:padL,y1:yLow,x2:W-padR,y2:yLow,class:'v252-wave-grid'}));
  const label=svg('text',{x:8,y:base+rowH/2+4,class:'v252-wave-label'});
  label.textContent=tr.name;s.append(label);
  let d='',prev=null;
  tr.values.forEach((v,i)=>{
   const x=padL+i*stepX;
   if(v===null||v===undefined){ prev=null; return; }
   const y=v?yHigh:yLow;
   if(prev===null)d+='M'+x+' '+y; else d+='L'+x+' '+y;
   prev=v;
  });
  if(d)s.append(svg('path',{d,class:'v252-wave-path '+(tr.cls||'')}));
 });
 for(let i=0;i<=n;i+=Math.max(1,Math.ceil(n/6))){
  const x=padL+i*stepX;
  s.append(svg('line',{x1:x,y1:padT-4,x2:x,y2:H-8,class:'v252-wave-tick'}));
  const t=svg('text',{x,y:H-1,class:'v252-wave-ticktext'});t.textContent=String(i);s.append(t);
 }
 host.append(s);
 if(o.note)host.append(el('p',o.note,'v252-hint'));
}

/* ============================ 项目一：密码锁 ============================ */
/* 门级电路由 v2.5.2-lock-core.js 构建（同一份代码在 Node 单元测试中复用）。 */
function makeLock(){
 const LK=root.DigitalV252Lock;
 if(!LK)throw new Error('密码锁逻辑模块未加载');
 const built=LK.build();
 const ids=built.ids;
 let c=built.circuit;
 const preset=[0,1,0,1]; // 下标为位号 P0~P3，即显示 1010
 const attempt=[0,0,0,0];
 const history=[];
 let host=null,readout=null,tickText=null;
 function applyPreset(){c=LK.setBits(c,ids,'p',preset);}
 function read(){return LK.read(c,ids);}
 function record(action){
  const s=read();
  history.push({action,match:s.match,unlock:s.unlock,err:s.err});
  if(history.length>60)history.shift();
  render();
 }
 function render(){
  if(!host||!readout)return;
  const s=read();
  readout.replaceChildren();
  const row=(label,value,cls)=>{
   const item=el('div','','v252-readout-item '+(cls||''));
   item.append(el('span',label,'v252-readout-label'),el('strong',value,'v252-readout-value'));
   readout.append(item);
  };
  row('比较结果 MATCH',s.match===1?'1（匹配）':s.match===0?'0（不匹配）':'X（未知）',s.match===1?'ok':'warn');
  row('开锁状态 Q',String(s.unlock),s.unlock===1?'ok':'idle');
  row('错误指示',String(s.err),s.err===1?'bad':'idle');
  row('确认次数',String(s.tick),'idle');
  tickText.textContent='当前预设密码 '+preset.slice().reverse().join('')+'；尝试密码 '+attempt.slice().reverse().join('')+'。改动开关不会影响 Q，只有「确认」的上升沿才采样。';
  syncButtons();
 }
 function syncButtons(){
  if(!host)return;
  host.querySelectorAll('[data-kind="preset"]').forEach(b=>{
   const i=Number(b.dataset.i);
   b.textContent='P'+i+'='+preset[i];
   b.setAttribute('aria-pressed',String(preset[i]===1));
  });
  host.querySelectorAll('[data-kind="attempt"]').forEach(b=>{
   const i=Number(b.dataset.i);
   b.textContent='K'+i+'='+attempt[i];
   b.setAttribute('aria-pressed',String(attempt[i]===1));
  });
 }
 function mount(node){
  host=node;host.replaceChildren();
  const wrap=el('div','','v252-sim');
  const presetBox=el('div','','v252-sim-group');
  presetBox.append(el('h4','预设密码（4 位拨码）'));
  const prow=el('div','','v252-row');
  for(let i=3;i>=0;i--){
   const b=btn('P'+i+'=0',()=>{
    preset[i]=preset[i]?0:1;
    c=LK.setBits(c,ids,'p',preset);
    record('改预设 P'+i);
   },'v252-bit');
   b.dataset.kind='preset';b.dataset.i=String(i);prow.append(b);
  }
  presetBox.append(prow);
  const attemptBox=el('div','','v252-sim-group');
  attemptBox.append(el('h4','尝试密码（4 位输入）'));
  const arow=el('div','','v252-row');
  for(let i=3;i>=0;i--){
   const b=btn('K'+i+'=0',()=>{
    attempt[i]=attempt[i]?0:1;
    c=LK.setBits(c,ids,'k',attempt);
    record('改输入 K'+i);
   },'v252-bit');
   b.dataset.kind='attempt';b.dataset.i=String(i);arow.append(b);
  }
  attemptBox.append(arow);
  const acts=el('div','','v252-row');
  acts.append(
   btn('⏱ 确认（一个时钟沿）',()=>{c=LK.confirm(c);record('确认');},'v252-btn primary'),
   btn('清除 / 复位',()=>{c=LK.reset(c);attempt.fill(0);applyPreset();record('清除');},'v252-btn')
  );
  const readbox=el('div','','v252-readout');readout=readbox;
  tickText=el('p','','v252-hint');
  wrap.append(presetBox,attemptBox,acts,readbox,tickText);
  host.append(wrap);
  c=LK.setBits(c,ids,'p',preset);
  c=LK.setBits(c,ids,'k',attempt);
  render();
 }
 function resetAll(){
  c=LK.reset(c);attempt.fill(0);applyPreset();
  history.length=0;record('复位');
 }
 function setPreset(arr){
  arr.slice(0,4).forEach((v,i)=>{preset[i]=v?1:0;});
  c=LK.setBits(c,ids,'p',preset);
  record('设置预设');
 }
 function setAttempt(arr){
  arr.slice(0,4).forEach((v,i)=>{attempt[i]=v?1:0;});
  c=LK.setBits(c,ids,'k',attempt);
  record('设置输入');
 }
 function confirm(){c=LK.confirm(c);record('确认');return read();}
 return {id:'lock',mount,reset:resetAll,setPreset,setAttempt,confirm,dispose(){/* 无定时器 */},
  state:()=>read(),history:()=>history.slice(),
  traces:()=>[
   {name:'MATCH',values:history.map(h=>h.match),cls:'v252-truth'},
   {name:'Q（保持）',values:history.map(h=>h.unlock),cls:'v252-lock'},
   {name:'ERR',values:history.map(h=>h.err),cls:'v252-err'}
  ]};
}

/* ========================== 项目二：交通灯 ========================== */
function makeTraffic(){
 let st=P.fresh();
 let fault=null;           // null | 'both-green' | 'skip-yellow'
 let host=null,lamps=null,readout=null,tableBody=null,timer=null,scale=1;
 const history=[];
 function lamp(){
  const l=P.lampState(st);
  if(fault==='both-green')return {phase:l.phase,label:'非法输出',ns:'green',ew:'green',remaining:l.remaining};
  return l;
 }
 function diagnose(){
  const l=lamp(),list=[];
  if(l.ns==='green'&&l.ew==='green')list.push('双向同时为绿：输出译码冲突，必须互锁或复位。');
  if(fault==='skip-yellow')list.push('检测到相位从绿灯直接跳到另一方向绿灯，缺少黄灯与全红缓冲。');
  if(st.traffic.elapsed>0&&l.remaining<=0)list.push('剩余时间为 0，定时器未装载。');
  return list;
 }
 function render(){
  if(!host)return;
  const l=lamp(),diag=diagnose();
  if(lamps){
   lamps.replaceChildren();
   [['南北',l.ns],['东西',l.ew]].forEach(([name,state])=>{
    const box=el('div','','v252-lampbox');
    box.append(el('div',name,'v252-lampname'));
    ['red','yellow','green'].forEach(color=>{
     const dot=el('span','','v252-lamp '+color+(state===color?' on':''));
     box.append(dot);
    });
    box.append(el('div',state==='green'?'绿':state==='yellow'?'黄':'红','v252-lampstate'));
    lamps.append(box);
   });
  }
  if(readout){
   readout.replaceChildren();
   const item=(k,v,cls)=>{const d=el('div','','v252-readout-item '+(cls||''));
    d.append(el('span',k,'v252-readout-label'),el('strong',v,'v252-readout-value'));readout.append(d);};
   item('相位',l.phase,'idle');
   item('说明',l.label,'idle');
   item('剩余',String(l.remaining)+' s','ok');
   item('已运行',String(st.traffic.elapsed)+' s','idle');
   item('周期倍率',scale+'×','idle');
  }
  if(tableBody){
   [...tableBody.children].forEach((tr,i)=>tr.classList.toggle('on',i===st.traffic.phase));
  }
  if(host){
   host.querySelectorAll('[data-scale]').forEach(b=>{
    b.setAttribute('aria-pressed',String(Number(b.dataset.scale)===scale));
   });
  }
  const box=host.querySelector('.v252-diag');
  if(box){
   box.replaceChildren();
   box.append(el('h4',diag.length?'诊断结果':'安全状态'));
   if(!diag.length)box.append(el('p','当前输出组合合法：两个方向没有同时绿，且每次切换都经过黄灯与全红。','v252-ok-text'));
   diag.forEach(d=>box.append(el('p','⚠ '+d,'v252-bad-text')));
  }
 }
 function record(){
  const l=lamp();
  history.push({ns_g:l.ns==='green'?1:0,ns_y:l.ns==='yellow'?1:0,
   ew_g:l.ew==='green'?1:0,ew_y:l.ew==='yellow'?1:0});
  if(history.length>90)history.shift();
 }
 function step(){
  if(fault==='skip-yellow'){fault=null;}
  st=P.trafficStep(st);
  record();render();
  return lamp();
 }
 function start(){
  if(timer!==null)return;
  const period=Math.max(120,Math.round(700/scale));
  timer=setInterval(step,period);
  render();
 }
 function stop(){if(timer!==null){clearInterval(timer);timer=null;}}
 function reset(){
  stop();st=P.fresh();fault=null;history.length=0;record();render();
 }
 function inject(kind){
  fault=kind;
  if(kind==='skip-yellow'){
   // 直接把相位推到下一个绿灯，模拟译码/推进错误
   st=P.trafficStep(P.trafficStep(P.trafficStep(st)));
  }
  render();
 }
 function mount(node){
  host=node;host.replaceChildren();
  const wrap=el('div','','v252-sim');
  lamps=el('div','','v252-lamps');wrap.append(lamps);
  const acts=el('div','','v252-row');
  acts.append(
   btn('单步 1 秒',()=>{stop();step();},'v252-btn primary'),
   btn('自动运行',()=>start(),'v252-btn'),
   btn('暂停',()=>{stop();render();},'v252-btn'),
   btn('安全复位',()=>reset(),'v252-btn')
  );
  const scales=el('div','','v252-row');
  [0.5,1,2].forEach(v=>{
   const b=btn(v+'× 周期',()=>{scale=v;if(timer!==null){stop();start();}render();},'v252-chip');
   b.dataset.scale=String(v);scales.append(b);
  });
  const faults=el('div','','v252-row');
  faults.append(btn('注入：双向绿',()=>inject('both-green'),'v252-btn warn'),
   btn('注入：跳过黄灯',()=>inject('skip-yellow'),'v252-btn warn'));
  readout=el('div','','v252-readout');
  const table=el('div','','v252-table-wrap');
  const t=el('table','','v252-table');
  const thead=el('thead'),tr=el('tr');
  ['相位','时长','南北','东西'].forEach(h=>tr.append(el('th',h)));
  thead.append(tr);t.append(thead);
  tableBody=el('tbody');
  P.trafficTable().forEach(p=>{
   const row=el('tr');
   row.append(el('td',p.id),el('td',p.duration+' s'),el('td',p.ns),el('td',p.ew));
   tableBody.append(row);
  });
  t.append(tableBody);table.append(t);
  const diag=el('div','','v252-diag');
  wrap.append(acts,scales,faults,readout,table,diag);
  host.append(wrap);
  record();render();
 }
 return {id:'traffic',mount,step,start,stop,reset,inject,diagnose,dispose:stop,
  state:()=>{const l=lamp();return {phase:l.phase,ns:l.ns,ew:l.ew,remaining:l.remaining,elapsed:st.traffic.elapsed,cycles:st.traffic.cycles,fault};},
  history:()=>history.slice(),
  traces:()=>[
   {name:'南北绿',values:history.map(h=>h.ns_g),cls:'v252-truth'},
   {name:'南北黄',values:history.map(h=>h.ns_y),cls:'v252-warn'},
   {name:'东西绿',values:history.map(h=>h.ew_g),cls:'v252-lock'},
   {name:'东西黄',values:history.map(h=>h.ew_y),cls:'v252-warn'}
  ]};
}

/* ========================== 项目三：数字时钟 ========================== */
function makeClock(){
 let st=P.fresh();
 let host=null,display=null,readout=null,timer=null,mode='24';
 const history=[];
 function pad(n){return String(n).padStart(2,'0');}
 function view(){
  const c=st.clock;
  const h12=c.hour%12===0?12:c.hour%12;
  return {h24:pad(c.hour),h12:pad(h12),mm:pad(c.minute),ss:pad(c.second),
   suffix:c.hour<12?'AM':'PM',text24:P.timeString(st)};
 }
 function render(){
  if(!host)return;
  const v=view();
  if(display){
   display.replaceChildren();
   const unit=(txt,label)=>{
    const d=el('div','','v252-digit');
    d.append(el('span',txt,'v252-digit-num'),el('span',label,'v252-digit-label'));
    display.append(d);
   };
   const colon=()=>el('span',':','v252-colon');
   if(mode==='24'){
    unit(v.h24,'时');display.append(colon());unit(v.mm,'分');display.append(colon());unit(v.ss,'秒');
   }else{
    unit(v.h12,'时');display.append(colon());unit(v.mm,'分');display.append(colon());unit(v.ss,'秒');
    display.append(el('div',v.suffix,'v252-ampm'));
   }
   host.querySelectorAll('[data-mode]').forEach(b=>{
    b.setAttribute('aria-pressed',String(b.dataset.mode===mode));
   });
  }
  if(readout){
   readout.replaceChildren();
   const item=(k,val)=>{const d=el('div','','v252-readout-item');
    d.append(el('span',k,'v252-readout-label'),el('strong',val,'v252-readout-value'));readout.append(d);};
   item('24 小时制',v.text24);
   item('12 小时制',v.h12+':'+v.mm+':'+v.ss+' '+v.suffix);
   item('已走步数',String(st.clock.elapsed));
   item('历史记录',st.clock.history.length+' 条');
  }
 }
 function step(){
  const before=st.clock;
  st=P.clockStep(st);
  const after=st.clock;
  history.push({
   sec:before.second===59&&after.second===0?1:0,
   min:before.minute===59&&after.minute===0?1:0,
   hour:before.hour===23&&after.hour===0?1:0,
   midnight:before.hour===23&&before.minute===59&&before.second===59?1:0
  });
  if(history.length>90)history.shift();
  render();
  return view();
 }
 function start(){
  if(timer!==null)return;
  timer=setInterval(step,700);
 }
 function stop(){if(timer!==null){clearInterval(timer);timer=null;}}
 function setAt(h,m,s){stop();st=P.setTime(st,h,m,s);render();}
 function addMinute(){stop();st=P.setTime(st,st.clock.hour,(st.clock.minute+1)%60,st.clock.second);render();}
 function addHour(){stop();st=P.setTime(st,(st.clock.hour+1)%24,st.clock.minute,st.clock.second);render();}
 function reset(){stop();st=P.fresh();history.length=0;render();}
 function setMode(m){mode=m;render();}
 function mount(node){
  host=node;host.replaceChildren();
  const wrap=el('div','','v252-sim');
  display=el('div','','v252-clockface');wrap.append(display);
  const acts=el('div','','v252-row');
  acts.append(
   btn('单步 1 秒',()=>{stop();step();},'v252-btn primary'),
   btn('自动走时',()=>start(),'v252-btn'),
   btn('暂停',()=>{stop();render();},'v252-btn'),
   btn('+1 分',()=>addMinute(),'v252-btn'),
   btn('+1 时',()=>addHour(),'v252-btn'),
   btn('复位到 12:00:00',()=>reset(),'v252-btn')
  );
  const edges=el('div','','v252-row');
  edges.append(btn('跳到 23:59:55',()=>setAt(23,59,55),'v252-chip'),
   btn('跳到 12:59:58',()=>setAt(12,59,58),'v252-chip'),
   btn('跳到 00:00:00',()=>setAt(0,0,0),'v252-chip'));
  const modes=el('div','','v252-row');
  ['24','12'].forEach(m=>{
   const b=btn(m==='24'?'24 小时制':'12 小时制',()=>setMode(m),'v252-chip');
   b.dataset.mode=m;modes.append(b);
  });
  readout=el('div','','v252-readout');
  wrap.append(acts,edges,modes,readout);
  host.append(wrap);
  render();
 }
 return {id:'clock',mount,step,start,stop,reset,setAt,addMinute,addHour,setMode,dispose:stop,
  state:()=>Object.assign(view(),{elapsed:st.clock.elapsed,mode}),
  history:()=>history.slice(),
  traces:()=>[
   {name:'秒进位',values:history.map(h=>h.sec),cls:'v252-truth'},
   {name:'分进位',values:history.map(h=>h.min),cls:'v252-lock'},
   {name:'时进位',values:history.map(h=>h.hour),cls:'v252-warn'},
   {name:'跨午夜',values:history.map(h=>h.midnight),cls:'v252-err'}
  ]};
}

/* =========================== 项目四：ADC =========================== */
function makeAdc(){
 let bits=10,vref=3.3,vin=1.0;
 let host=null,readout=null,chart=null,compare=null;
 const history=[];
 function calc(){
  const r=A.adc(bits,vref,vin);
  const ideal=r.code*r.step;
  return {code:r.code,binary:r.codeBinary,step:r.step,ideal,error:vin-ideal,
   errorLSB:(vin-ideal)/r.step,max:Math.pow(2,bits)-1};
 }
 function render(){
  if(!host)return;
  const r=calc();
  if(readout){
   readout.replaceChildren();
   const item=(k,v,cls)=>{const d=el('div','','v252-readout-item '+(cls||''));
    d.append(el('span',k,'v252-readout-label'),el('strong',v,'v252-readout-value'));readout.append(d);};
   item('量化步长 Δ',(r.step*1000).toFixed(4)+' mV','ok');
   item('二进制码',r.binary,'idle');
   item('十六进制','0x'+r.code.toString(16).toUpperCase(),'idle');
   item('量化电压',r.ideal.toFixed(6)+' V','idle');
   item('量化误差',(r.error*1000).toFixed(3)+' mV','warn');
   item('误差 / LSB',r.errorLSB.toFixed(3)+' LSB','idle');
  }
  drawChart(r);
  if(compare)renderCompare();
  const note=host.querySelector('.v252-adc-note');
  if(note)note.textContent='当前 '+bits+' 位、Vref='+vref.toFixed(2)+' V，共 '+(r.max+1)+' 个码；输入 '+vin.toFixed(3)+' V 对应码值 '+r.code+'。';
 }
 function drawChart(cur){
  if(!chart)return;
  chart.replaceChildren();
  const W=620,H=240,padL=52,padR=16,padT=14,padB=32;
  const max=Math.pow(2,bits)-1;
  const s=svg('svg',{viewBox:'0 0 '+W+' '+H,class:'v252-chart','role':'img','aria-label':'量化台阶图'});
  const x=v=>padL+v/vref*(W-padL-padR);
  const y=c=>H-padB-c/max*(H-padT-padB);
  s.append(svg('line',{x1:padL,y1:H-padB,x2:W-padR,y2:H-padB,class:'v252-axis'}));
  s.append(svg('line',{x1:padL,y1:padT,x2:padL,y2:H-padB,class:'v252-axis'}));
  let d='';
  const N=200;
  for(let i=0;i<=N;i++){
   const v=vref*i/N;
   const c=Math.min(max,Math.floor(v/(vref/Math.pow(2,bits))));
   const px=x(v),py=y(c);
   d+=(i?'L':'M')+px.toFixed(2)+' '+py.toFixed(2)+' ';
  }
  s.append(svg('path',{d,class:'v252-stair'}));
  s.append(svg('circle',{cx:x(Math.min(vin,vref)),cy:y(cur.code),r:5,class:'v252-point'}));
  const tx=svg('text',{x:W-padR,y:H-8,class:'v252-axis-label','text-anchor':'end'});
  tx.textContent='Vin / V（0~'+vref.toFixed(2)+'）';s.append(tx);
  const ty=svg('text',{x:4,y:padT+8,class:'v252-axis-label'});ty.textContent=max+' 码';s.append(ty);
  chart.append(s);
 }
 function renderCompare(){
  compare.replaceChildren();
  const t=el('table','','v252-table');
  const thead=el('thead'),tr=el('tr');
  ['分辨率','步长','码值','二进制','误差'].forEach(h=>tr.append(el('th',h)));
  thead.append(tr);t.append(thead);
  const tb=el('tbody');
  [8,10,12].forEach(b=>{
   const r=A.adc(b,vref,vin);
   const row=el('tr');
   if(b===bits)row.className='on';
   row.append(el('td',b+' 位'),el('td',(r.step*1000).toFixed(4)+' mV'),
    el('td',String(r.code)),el('td',r.codeBinary),
    el('td',((vin-r.code*r.step)*1000).toFixed(3)+' mV'));
   tb.append(row);
  });
  t.append(tb);compare.append(t);
 }
 function record(){
  history.push({vin,code:calc().code,bits});
  if(history.length>90)history.shift();
 }
 function setBits(b){bits=b;record();render();}
 function setVref(v){vref=Math.max(1,Math.min(5,v));if(vin>vref)vin=vref;record();render();}
 function setVin(v){vin=Math.max(0,Math.min(vref,v));record();render();}
 function reset(){bits=10;vref=3.3;vin=1.0;history.length=0;render();}
 function mount(node){
  host=node;host.replaceChildren();
  const wrap=el('div','','v252-sim');
  const controls=el('div','','v252-sim-group');
  controls.append(el('h4','分辨率'));
  const brow=el('div','','v252-row');
  [8,10,12].forEach(b=>{
   const x=btn(b+' 位',()=>setBits(b),'v252-chip');
   x.dataset.bits=String(b);brow.append(x);
  });
  controls.append(brow);
  const vrefRow=el('div','','v252-row');
  vrefRow.append(el('span','Vref','v252-field-label'));
  const vrefInput=el('input');vrefInput.type='range';vrefInput.min='1';vrefInput.max='5';vrefInput.step='0.1';vrefInput.value=String(vref);
  vrefInput.className='v252-range';vrefInput.setAttribute('aria-label','参考电压');
  vrefInput.addEventListener('input',()=>setVref(Number(vrefInput.value)));
  const vrefVal=el('span',vref.toFixed(2)+' V','v252-field-value');
  vrefInput.addEventListener('input',()=>{vrefVal.textContent=Number(vrefInput.value).toFixed(2)+' V';});
  vrefRow.append(vrefInput,vrefVal);controls.append(vrefRow);
  const vinRow=el('div','','v252-row');
  vinRow.append(el('span','Vin','v252-field-label'));
  const vinInput=el('input');vinInput.type='range';vinInput.min='0';vinInput.max='5';vinInput.step='0.001';vinInput.value=String(vin);
  vinInput.className='v252-range';vinInput.setAttribute('aria-label','输入电压');
  const vinVal=el('span',vin.toFixed(3)+' V','v252-field-value');
  vinInput.addEventListener('input',()=>{vinVal.textContent=Number(vinInput.value).toFixed(3)+' V';setVin(Number(vinInput.value));});
  vinRow.append(vinInput,vinVal);controls.append(vinRow);
  vinInput.max=String(vref);
  vrefInput.addEventListener('input',()=>{vinInput.max=String(vref);if(vin>vref){vin=vref;vinInput.value=String(vref);vinVal.textContent=vref.toFixed(3)+' V';}});
  readout=el('div','','v252-readout');
  chart=el('div','','v252-chartbox');
  compare=el('div','','v252-table-wrap');
  const note=el('p','','v252-hint v252-adc-note');
  const acts=el('div','','v252-row');
  acts.append(btn('复位参数',()=>reset(),'v252-btn'));
  wrap.append(controls,readout,chart,note,compare,acts);
  host.append(wrap);
  record();render();
 }
 return {id:'adc',mount,setBits,setVref,setVin,reset,dispose(){/* 无定时器 */},
  state:()=>Object.assign({bits,vref,vin},calc()),
  history:()=>history.slice(),
  traces:()=>[
   {name:'输入 ≥ 中点',values:history.map(h=>h.vin>=vref/2?1:0),cls:'v252-truth'},
   {name:'码值最高位',values:history.map(h=>Math.floor(h.code/Math.pow(2,h.bits-1))),cls:'v252-lock'}
  ]};
}

/* ============================== 页面装配 ============================== */
const FACTORY={lock:makeLock,traffic:makeTraffic,clock:makeClock,adc:makeAdc};
let section=null,state={projectId:'lock',step:0},ctrl=null,progress=readProgress();

function markStep(projectId,idx){
 const p=progress[projectId]||(progress[projectId]={done:[]});
 if(!p.done.includes(idx)){p.done.push(idx);p.done.sort((a,b)=>a-b);}
 progress[projectId]=p;saveProgress(progress);
 renderSteps();
}
function doneCount(id){const p=progress[id];return p&&Array.isArray(p.done)?p.done.length:0;}

function renderSteps(){
 if(!section)return;
 const list=section.querySelector('.v252-steps');
 if(!list)return;
 list.replaceChildren();
 const data=D.get(state.projectId);
 D.STEPS.forEach(([key,label],idx)=>{
  const b=btn((doneCount(state.projectId)>idx?'✓ ':'')+label,()=>{go(idx);},'v252-step');
  b.dataset.step=String(idx);
  if(idx===state.step)b.classList.add('active');
  list.append(b);
 });
 const bar=section.querySelector('.v252-progress-text');
 if(bar)bar.textContent='已完成 '+doneCount(state.projectId)+' / '+D.STEPS.length+' 步';
 const fill=section.querySelector('.v252-progress-fill');
 if(fill)fill.style.width=Math.round(doneCount(state.projectId)/D.STEPS.length*100)+'%';
}

function renderContent(){
 const host=section.querySelector('.v252-content');
 if(!host)return;
 host.replaceChildren();
 const data=D.get(state.projectId);
 const [key,label]=D.STEPS[state.step];
 // 只要进入过某一步，就记入任务清单（进度 = 已浏览步骤数）。
 markStep(state.projectId,state.step);
 const head=el('div','','v252-step-head');
 head.append(el('h2',data.icon+' '+data.name+' · '+label,'v252-step-title'));
 head.append(el('p',data.subtitle+' · '+data.level,'v252-step-sub'));
 head.append(el('p','边界说明：'+data.boundary,'v252-boundary'));
 host.append(head);

 const body=el('div','','v252-step-body');
 const stepData=data.steps[key];
 if(key==='intro'||key==='theory'||key==='design'){
  (stepData.paras||[]).forEach(p=>body.append(el('p',p,'v252-p')));
  if(stepData.formula){
   const box=el('div','','v252-formula');
   stepData.formula.forEach(f=>{
    const row=el('div','','v252-formula-row');
    row.append(el('span',f.label,'v252-formula-label'),el('code',f.expr,'v252-expr'));
    box.append(row);
   });
   body.append(box);
  }
  if(stepData.table){
   const wrap=el('div','','v252-table-wrap');
   const t=el('table','','v252-table');
   const thead=el('thead'),tr=el('tr');
   stepData.table.head.forEach(h=>tr.append(el('th',h)));
   thead.append(tr);t.append(thead);
   const tb=el('tbody');
   stepData.table.rows.forEach(r=>{const row=el('tr');r.forEach(c=>row.append(el('td',c)));tb.append(row);});
   t.append(tb);wrap.append(t);body.append(wrap);
  }
  if(stepData.bullets){
   const ul=el('ul','','v252-list');
   stepData.bullets.forEach(t=>ul.append(el('li',t)));
   body.append(ul);
  }
 }else if(key==='build'){
  const ol=el('ol','','v252-build');
  stepData.forEach(s=>{
   const li=el('li','');
   li.append(el('strong',s.t),el('span',s.d,'v252-build-d'));
   ol.append(li);
  });
  body.append(ol);
 }else if(key==='sim'){
  (stepData.paras||[]).forEach(p=>body.append(el('p',p,'v252-p')));
  const host2=el('div','','v252-simhost');
  body.append(host2);
  body.append(el('p',stepData.hint,'v252-hint'));
  host.append(body);
  ctrl.mount(host2);
  return;
 }else if(key==='wave'){
  (stepData.paras||[]).forEach(p=>body.append(el('p',p,'v252-p')));
  const waveBox=el('div','','v252-wavebox');
  body.append(waveBox);
  const n=ctrl.history().length;
  if(n<2){
   waveBox.append(el('p','还没有足够的记录。请先到「实时仿真」操作至少 2 次，再回来看波形。','v252-empty'));
  }else{
   drawWaves(waveBox,ctrl.traces(),{label:data.name+' 关键节点波形',
    note:'横轴为操作/时钟步序，共 '+n+' 个采样点。'});
  }
  body.append(el('p',stepData.hint,'v252-hint'));
 }else if(key==='debug'){
  const list=el('div','','v252-debug');
  stepData.forEach((d,i)=>{
   const item=el('div','','v252-debug-item');
   item.append(el('p','现象 '+(i+1)+'：'+d.symptom,'v252-bad-text'));
   item.append(el('p','原因：'+d.cause));
   item.append(el('p','处理：'+d.fix,'v252-ok-text'));
   list.append(item);
  });
  body.append(list);
 }else if(key==='summary'){
  const box=el('div','','v252-summary');
  box.append(el('h3','带走这几条'));
  const ul=el('ul','','v252-list');
  stepData.points.forEach(t=>ul.append(el('li',t)));
  box.append(ul);
  box.append(el('h3','下一步建议'));
  const next=el('div','','v252-row');
  stepData.next.forEach(t=>next.append(el('span',t,'v252-next-item')));
  box.append(next);
  body.append(box);
 }else{
  body.append(el('p','本步骤暂无内容。'));
 }
 host.append(body);
 renderSteps();
}

function render(){
 if(!section)return;
 const tabs=section.querySelector('.v252-projects');
 if(tabs){
  [...tabs.children].forEach(b=>b.classList.toggle('active',b.dataset.project===state.projectId));
 }
 renderSteps();
 renderContent();
}

function go(idx){
 if(idx<0||idx>=D.STEPS.length)return;
 state.step=idx;
 render();
 section.querySelector('.v252-content')?.scrollIntoView({block:'nearest'});
}
function selectProject(id){
 if(!D.get(id))return false;
 state.projectId=id;state.step=0;
 if(ctrl&&ctrl.dispose)ctrl.dispose();
 ctrl=FACTORY[id]();
 render();
 return true;
}
function open(projectId){
 if(typeof root.show==='function')root.show(SECTION);
 if(projectId&&D.get(projectId)&&projectId!==state.projectId)selectProject(projectId);
 else render();
 return true;
}

function build(main,nav){
 const ch=el('div','','chap');
 ch.append(el('div','项目实训 · V2.5.2','chap-h'));
 const item=el('div','','nav-item');item.dataset.mod=SECTION;
 item.append(el('span','','dot'),el('span','🧪 项目实训台'));
 ch.append(item);nav.append(ch);

 section=el('section','','mod');section.id=SECTION;
 const head=el('div','','mod-h');
 head.append(el('div','V2.5.2 · 四个可操作项目','crumb'),
  el('h1','从任务书到可运行电路'),
  el('p','四个项目都复用既有仿真内核：密码锁是真门级电路，交通灯与时钟是已验证的状态机/计数模型，采集系统是理想量化模型。','claim'));
 section.append(head);

 const layout=el('div','','v252-layout');
 const aside=el('aside','','v252-aside');
 const tabs=el('div','','v252-projects');
 D.ids.forEach(id=>{
  const p=D.get(id);
  const b=btn(p.icon+' '+p.name,()=>selectProject(id),'v252-project');
  b.dataset.project=id;tabs.append(b);
 });
 aside.append(tabs);
 const prog=el('div','','v252-progress');
 prog.append(el('div','','v252-progress-text'));
 const track=el('div','','v252-progress-track');
 const fill=el('div','','v252-progress-fill');track.append(fill);prog.append(track);
 aside.append(prog);
 const steps=el('div','','v252-steps');aside.append(steps);
 layout.append(aside);
 layout.append(el('div','','v252-content'));
 section.append(layout);
 main.append(section);

 ctrl=FACTORY[state.projectId]();
 render();
}
function init(){
 const main=document.getElementById('main'),nav=document.getElementById('nav');
 if(!main||!nav||!root.show||document.getElementById(SECTION))return;
 build(main,nav);
 if(location.hash==='#'+SECTION||root.__v13InitialHash==='#'+SECTION)root.show(SECTION);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

root.DigitalV252Lab=Object.freeze({
 SECTION,KEY,PROJECTS:D.ids,STEPS:D.STEPS.map(s=>s[0]),
 open,selectProject,go,
 current:()=>({projectId:state.projectId,step:state.step,stepKey:D.STEPS[state.step][0]}),
 sim:id=>{const target=id||state.projectId;if(target!==state.projectId)return null;return ctrl;},
 progress:()=>JSON.parse(JSON.stringify(progress)),
 resetProgress:()=>{progress={};saveProgress(progress);renderSteps();}
});
})(typeof window!=='undefined'?window:globalThis);
