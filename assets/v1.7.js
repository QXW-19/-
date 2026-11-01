/* V1.7 项目实训页面：全部内容采用原创讲解和理想逻辑教学仿真。 */
(function(){
'use strict';
const M=window.DigitalProjects;if(!M){console.error('[V1.7] 项目引擎未加载');return;}
const KEY='digital-course-v1.7-projects',ACH='digital-course-v1.7-checkpoints';
let state=M.fresh(),done={segment:false,traffic:false,clock:false},tab='segment',timer=null,interval=1000;
let section,area,status,playButton;
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);if(cls)x.className=cls;return x};
const btn=(text,fn,cls='v17-btn')=>{const x=el('button',text,cls);x.type='button';x.addEventListener('click',fn);return x};
function panel(title){const x=el('section',undefined,'v17-panel');if(title)x.append(el('h2',title));return x;}
function getSaved(){
 try{const s=JSON.parse(localStorage.getItem(KEY)||'null');M.validate(s);state=s}catch(_){}
 try{const c=JSON.parse(localStorage.getItem(ACH)||'null');if(c&&typeof c==='object')for(const k of Object.keys(done))done[k]=c[k]===true}catch(_){}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));localStorage.setItem(ACH,JSON.stringify(done));}catch(e){message('存储失败：'+e.message,true)}}
function message(t,bad=false){if(status){status.textContent=t;status.style.color=bad?'#b91c1c':'';}}
function stop(){if(timer!==null)clearInterval(timer);timer=null;}
function apply(fn){try{const n=fn(state);M.validate(n);state=n;save();render();return true}catch(e){message('操作失败：'+e.message,true);return false}}
function advance(){
 if(tab==='segment'){message('数码管由输入开关控制，不需要时钟。');return;}
 const updated=apply(s=>tab==='traffic'?M.trafficStep(s):M.clockStep(s));
 if(!updated){stop();return;}
 if(tab==='traffic'&&state.traffic.cycles>0&&!done.traffic){done.traffic=true;save();render();}
}
function nextSecond(){
 if(tab==='clock'&&M.timeString(state)==='23:59:59'){const ok=apply(s=>M.clockStep(s));if(ok&&M.timeString(state)==='00:00:00'){done.clock=true;save();render();}return;}
 advance();
}
function auto(){
 if(timer!==null){stop();render();message('自动运行已暂停。');return;}
 if(tab==='segment'){message('数码管输入由开关控制，无需自动运行。');return;}
 if(!section.classList.contains('active')||document.hidden){message('请先打开项目实训页面。',true);return;}
 timer=setInterval(()=>{if(!section.classList.contains('active')||document.hidden){stop();render();return;}nextSecond();},interval);
 render();message('已开始自动运行，每 '+interval+' ms 推进一个模拟秒。');
}
function table(headings,rows){
 const wrap=el('div',undefined,'v17-table-scroll'),t=el('table',undefined,'v17-table'),tr=el('tr');
 headings.forEach(h=>tr.append(el('th',h)));const thead=el('thead');thead.append(tr);t.append(thead);
 const tbody=el('tbody');rows.forEach(row=>{const tr=el('tr');row.forEach(x=>tr.append(el('td',x)));tbody.append(tr);});t.append(tbody);wrap.append(t);return wrap;
}
const svg=(type,attrs={})=>{const node=document.createElementNS('http://www.w3.org/2000/svg',type);for(const [a,b]of Object.entries(attrs))node.setAttribute(a,String(b));return node;};
function segmentSVG(){
 const code=M.digit(state.seven.value);
 const image=svg('svg',{viewBox:'0 0 200 265',class:'v17-hexdisplay',role:'img','aria-label':'当前数码管显示 '+code.symbol});
 const paths=[
 '54,26 140,26 132,38 62,38','148,34 159,47 153,116 141,125 137,112 143,48',
 '140,144 153,152 149,222 137,233 130,222 136,156','61,231 135,231 126,243 70,243',
 '43,144 54,155 60,219 48,232 36,219 30,156','43,34 54,47 49,113 37,125 30,115 33,48',
 '55,129 137,129 128,140 64,140'
 ];
 paths.forEach((points,i)=>image.append(svg('polygon',{points,class:code.bits[i]?'v17-segment-on':'v17-segment-off'})));
 const label=svg('text',{x:100,y:258,fill:'#f8fafc','font-size':12,'text-anchor':'middle'});label.textContent=code.symbol;image.append(label);return image;
}
function switchTabs(){
 const row=el('div',undefined,'v17-tabs');
 [['segment','① 七段数码管'],['traffic','② 交通信号灯'],['clock','③ 24 小时数字钟']].forEach(([id,name])=>{
 const b=btn(name,()=>{stop();tab=id;render();});b.setAttribute('aria-pressed',tab===id?'true':'false');row.append(b);
 });return row;
}
function segmentPage(){
 const page=panel('项目一 · 七段数码管译码器');
 page.append(el('p','先理解：4 个二进制开关可以组合成 0～15 共 16 种输入。译码器把这个数字变成七段灯条的亮灭模式。这里使用理想的共阴极数码管，逻辑 1 点亮。','v17-help'));
 const grid=el('div',undefined,'v17-grid'),left=panel('输入四位二进制'),right=panel('实时显示与真值表');
 const code=M.digit(state.seven.value),bits=el('div',undefined,'v17-switches');
 for(let i=3;i>=0;i--){
 const val=(code.value>>i)&1;
 const b=btn(['A','B','C','D'][i]+' = '+val,()=>{
 const value=state.seven.value^(1<<i);if(value===8)done.segment=true;apply(s=>M.setDigit(s,value));});
 b.setAttribute('aria-pressed',val?'true':'false');bits.append(b);
 }
 left.append(el('p','依次点击 D、C、B、A 开关，注意 A 是最低位。'));left.append(bits);
 const l=el('label',undefined,'v17-label');l.append(el('span','直接选择输入'));
 const select=el('select',undefined,'v17-select');
 M.SYMBOLS.forEach((symbol,index)=>{const option=el('option',index.toString(16).toUpperCase()+' → '+symbol);option.value=index;select.append(option);});
 select.value=String(code.value);select.addEventListener('change',()=>{const value=Number(select.value);if(value===8)done.segment=true;apply(s=>M.setDigit(s,value));});l.append(select);left.append(l);
 left.append(el('p','当前输入：'+code.value.toString(2).padStart(4,'0')+'₂；显示 '+code.symbol+'；段码：0x'+code.mask.toString(16).toUpperCase().padStart(2,'0')));
 left.append(el('div','实验步骤：① 从 0000 开始；② 逐个翻转位开关；③ 找到数字 8，使七段全亮；④ 想一想 BCD 只需要 0～9 时，A～F 是否仍是合法的十进制数字编码。','v17-notice'));
 const visual=el('div',undefined,'v17-visual');visual.append(segmentSVG());right.append(visual);
 right.append(el('h3','完整段码对照（a 到 g）'));
 right.append(table(['输入','字形','段码','a→g'],M.segmentTable().map(r=>[r.input.toString(16).toUpperCase(),r.symbol,'0x'+r.mask.toString(16).toUpperCase().padStart(2,'0'),r.bits.join('')])));
 grid.append(left,right);page.append(grid);return page;
}
function trafficLights(name,current){
 const wrap=el('div'),label=el('strong',name),bulbs=el('div',undefined,'v17-lights');label.style.display='block';label.style.marginBottom='8px';
 for(const color of ['red','yellow','green']){const circle=el('span',undefined,'v17-light '+color+(current===color?' active':''));circle.setAttribute('aria-label',color+(current===color?'亮':'灭'));bulbs.append(circle);}
 wrap.append(label,bulbs);return wrap;
}
function timeControls(reset){
 const row=el('div',undefined,'v17-actions');
 row.append(btn('推进 1 秒',nextSecond,'v17-btn v17-btn-primary'));
 playButton=btn(timer!==null?'暂停自动运行':'开始自动运行',auto);row.append(playButton);
 const sel=el('select',undefined,'v17-select');sel.setAttribute('aria-label','自动运行间隔');
 [250,500,1000,1500].forEach(ms=>{const opt=el('option',ms+' ms/模拟秒');opt.value=ms;sel.append(opt);});
 sel.value=String(interval);sel.addEventListener('change',()=>{const running=timer!==null;stop();interval=Number(sel.value);if(running)auto();});row.append(sel);
 row.append(btn('复位项目',()=>{stop();apply(reset);}));
 return row;
}
function trafficPage(){
 const p=panel('项目二 · 交通灯状态机与计数器');
 p.append(el('p','先理解：交通信号灯不是“随机变色”，而是在一组确定的状态间按时间顺序转换。我们用同步计数器推进六个状态，并加入全红缓冲，防止两个方向同时放行。'));
 const now=M.lampState(state),grid=el('div',undefined,'v17-grid'),left=panel('模拟路口显示'),right=panel('状态机与操作');
 const visual=el('div',undefined,'v17-visual v17-pair');visual.append(trafficLights('南北方向',now.ns),trafficLights('东西方向',now.ew));left.append(visual);
 left.append(el('h3',now.label));left.append(el('p','当前状态剩余：'+now.remaining+' 模拟秒；累计：'+state.traffic.elapsed+' 秒；完整循环：'+state.traffic.cycles+' 次。'));
 right.append(timeControls(s=>M.resetTraffic(s)));right.append(el('h3','六状态转换表'));
 right.append(table(['状态','持续','南北','东西','下一状态'],M.trafficTable().map(x=>[x.label,x.duration+' 秒',x.ns,x.ew,x.next])));
 grid.append(left,right);p.append(grid);
 const history=panel('最近 15 次状态记录');
 const rows=state.traffic.history.slice(-15).reverse().map(h=>[h.elapsed,M.PHASES[h.phase].label,h.remaining]);
 history.append(table(['模拟秒','状态','剩余'],rows.length?rows:[['—','未运行','—']]));p.append(history);
 p.append(el('div','实验步骤：① 先单步推进，观察南北绿灯持续 10 秒；② 观察黄灯与全红缓冲；③ 完成一个约 30 秒的循环；④ 检查任何时刻都不能南北和东西同时绿灯。','v17-notice'));return p;
}
function clockPage(){
 const p=panel('项目三 · 24 小时数字电子钟');
 p.append(el('p','先理解：电子钟由秒、分、时三组计数器级联。秒数从 59 变成 00 时，分钟加 1；分钟也从 59 变成 00 时，小时加 1。小时从 23 变成 00 时进入新的一天。'));
 const grid=el('div',undefined,'v17-grid'),left=panel('设置时间'),right=panel('时钟与秒脉冲');
 const fields=[],settings=el('div',undefined,'v17-actions');
 for(const [name,value,max] of [['小时',state.clock.hour,23],['分钟',state.clock.minute,59],['秒',state.clock.second,59]]){
  const label=el('label',undefined,'v17-label');label.append(el('span',name));const field=el('input',undefined,'v17-input');
  field.type='number';field.min='0';field.max=max;field.step=1;field.value=value;field.setAttribute('aria-label',name);label.append(field);fields.push(field);settings.append(label);
 }
 left.append(settings);
 left.append(btn('设置指定时间',()=>{
  const vals=fields.map(x=>x.value.trim()===''?NaN:Number(x.value));stop();apply(s=>M.setTime(s,...vals));
 }));
 left.append(el('div','实验步骤：① 设为 12:59:59 并推进一秒；② 设为 23:59:59 并推进一秒，验证 00:00:00；③ 解释模 60 和模 24 的区别。','v17-notice'));
 const visual=el('div',undefined,'v17-visual');visual.append(el('div',M.timeString(state),'v17-clock'));right.append(visual);
 right.append(timeControls(s=>M.resetClock(s)));
 right.append(el('p','累计推进 '+state.clock.elapsed+' 模拟秒。计时为理想模拟，不与电脑真实时间同步。'));
 grid.append(left,right);p.append(grid);
 const history=panel('时钟历史（最近 18 次）');
 const rows=state.clock.history.slice(-18).reverse().map(h=>[h.elapsed,[h.hour,h.minute,h.second].map(n=>String(n).padStart(2,'0')).join(':')]);
 history.append(table(['模拟秒','电子钟'],rows.length?rows:[['—','未运行']]));p.append(history);
 return p;
}
function summary(){
 const p=panel('实验验收进度 · 自动判断');
 p.append(el('p','检查点由正确的实验行为自动触发，不需要你手动打勾。','v17-help'));
 const checks=el('div',undefined,'v17-checks');
 for(const [id,name] of [['segment','显示数字 8，七段同时点亮'],['traffic','交通灯完成至少一个完整循环'],['clock','电子钟从 23:59:59 跨越到 00:00:00']]){
  const item=el('div',undefined,'v17-check'+(done[id]?' pass':''));
  item.append(el('span',done[id]?'✓':'○'),el('span',name));checks.append(item);
 }
 p.append(checks);return p;
}
function storage(){
 const p=panel('学习记录与安全提示'),actions=el('div',undefined,'v17-actions');
 actions.append(btn('导出项目记录',()=>{
  const blob=new Blob([JSON.stringify({version:1,projects:state,checkpoints:done},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='数字电子项目实训-V1.7.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
 }));
 const input=el('input');input.type='file';input.accept='.json,application/json';input.hidden=true;
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];if(!file)return;
  try{
   if(file.size>200000)throw Error('文件不能超过 200 KB');
   const data=JSON.parse(await file.text());
   if(data.version!==1||!data.projects||!data.checkpoints||typeof data.checkpoints!=='object'||Array.isArray(data.checkpoints))throw Error('V1.7 文件格式不正确');
   M.validate(data.projects);
   if(window.confirm('导入会覆盖目前 V1.7 的学习记录，继续吗？')){
    stop();state=JSON.parse(JSON.stringify(data.projects));
    for(const k of Object.keys(done))done[k]=data.checkpoints[k]===true;
    save();render();
   }
  }catch(e){message('导入失败：'+e.message,true);}finally{input.value='';}
 });
 actions.append(btn('导入项目记录',()=>input.click()),input);
 actions.append(btn('清除 V1.7 进度',()=>{if(window.confirm('确定删除 V1.7 三个项目的记录吗？')){stop();state=M.fresh();done={segment:false,traffic:false,clock:false};save();render();}}));
 p.append(actions);
 p.append(el('p','以上仿真模型是学习阎石《数字电子技术基础》第六版相关章节的原创辅助练习，不是实际交通控制设备，也不代表真实器件电气特性。','v17-help'));return p;
}
function render(){
 if(!area)return;
 area.replaceChildren();const nav=el('div',undefined,'v17-tabs');
 for(const [id,name] of [['segment','① 数码管'],['traffic','② 交通灯'],['clock','③ 数字电子钟']]){
  const b=btn(name,()=>{stop();tab=id;render();});b.setAttribute('aria-pressed',tab===id?'true':'false');nav.append(b);
 }
 area.append(nav,tab==='segment'?segmentPage():tab==='traffic'?trafficPage():clockPage(),summary(),storage());
}
function init(){
 const main=document.getElementById('main'),nav=document.getElementById('nav');
 if(!main||!nav||typeof window.show!=='function')return;
 const chap=el('div',undefined,'chap');chap.append(el('div','综合实训 · V1.7','chap-h'));
 const link=el('div',undefined,'nav-item');link.dataset.mod='v17-projects';link.append(el('span',undefined,'dot'),el('span','🛠 数码管 / 交通灯 / 电子钟'));chap.append(link);nav.append(chap);
 section=el('section',undefined,'mod');section.id='v17-projects';
 const head=el('div',undefined,'mod-h');head.append(el('div','阎石《数字电子技术基础》第六版 · 课程项目拓展','crumb'),el('h1','数字电子技术综合项目实训'),el('p','每个项目都有通俗解释、参数控制、实时反馈、实验步骤与验收条件。','claim'));section.append(head);
 status=el('p','已载入实验。','v17-status');status.setAttribute('role','status');section.append(status);
 area=el('div',undefined,'v17-projects');section.append(area);main.append(section);
 getSaved();render();
 nav.addEventListener('click',evt=>{const item=evt.target.closest('.nav-item[data-mod]');if(item&&item.dataset.mod!=='v17-projects')stop();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 if(window.location.hash==='#v17-projects'||window.__v13InitialHash==='#v17-projects')window.show('v17-projects');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();