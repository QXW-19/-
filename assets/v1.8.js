/* V1.8：按“理解→推导→动手→检测→复习”展开原创零基础课程。 */
(function(){
'use strict';
const source=window.DigitalV18Lessons,M=window.DigitalV18Lab;
if(!source||!M||!Array.isArray(source.lessons)||source.lessons.length!==32)return;
const STORAGE='digital-course-v1.8-study';
const lessons=source.lessons,byId=new Map(lessons.map(x=>[x.id,x]));
const defaults=()=>({version:1,completed:[],last:'l1-1',attempts:{}});
let state=defaults(),chosen=state.last,mainPane,navPane,summaryPane,notice;
function restore(){
 try{
  const data=JSON.parse(localStorage.getItem(STORAGE)||'null');
  if(!data||data.version!==1||!Array.isArray(data.completed)||typeof data.attempts!=='object'||!data.attempts||Array.isArray(data.attempts))return defaults();
  const out=defaults();
  out.completed=[...new Set(data.completed.filter(id=>byId.has(id)))];
  out.last=byId.has(data.last)?data.last:'l1-1';
  for(const [k,v] of Object.entries(data.attempts))if(byId.has(k)&&Number.isInteger(v)&&v>=0&&v<10000)out.attempts[k]=v;
  return out;
 }catch(_){return defaults();}
}
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e;};
const btn=(text,action,cls='v18-btn')=>{const e=el('button',text,cls);e.type='button';e.addEventListener('click',action);return e;};
const section=(title)=>{const e=el('section',undefined,'v18-panel');if(title)e.append(el('h2',title));return e;};
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));return true}catch(e){notify('无法写入浏览器学习进度：'+e.message,true);return false}}
function notify(text,isError=false){if(notice){notice.textContent=text;notice.className='v18-notice'+(isError?' v18-error':'');}}
function openModule(id){if(typeof window.show==='function'&&document.getElementById(id))window.show(id);else notify('未找到课程模块：'+id,true)}
function counts(chapter){
 const chapterLessons=lessons.filter(x=>x.chapter===chapter);
 return {total:chapterLessons.length,done:chapterLessons.filter(x=>state.completed.includes(x.id)).length};
}
function renderSide(){
 navPane.replaceChildren();
 const intro=el('p','每个知识点先学原理，再完成三步例题，答对随堂题即可通关。','v18-help');navPane.append(intro);
 for(const ch of source.chapters){
  const info=counts(ch.chapter);
  const group=el('div',undefined,'v18-side-chapter');
  group.append(el('strong','第 '+ch.chapter+' 章 · '+ch.theme));
  group.append(el('small',info.done+'/'+info.total+' 已完成'));
  const sub=el('div',undefined,'v18-side-list');
  lessons.filter(x=>x.chapter===ch.chapter).forEach(l=>{
   const done=state.completed.includes(l.id);
   const b=btn((done?'✓ ':'○ ')+l.index+'. '+l.title,()=>choose(l.id),'v18-lesson-link');
   b.setAttribute('aria-current',chosen===l.id?'true':'false');
   sub.append(b);
  });
  group.append(sub);navPane.append(group);
 }
}
function renderSummary(){
 summaryPane.replaceChildren();
 const finished=state.completed.length;
 const bar=el('div',undefined,'v18-progress');
 const fill=el('span');fill.style.width=(finished/lessons.length*100)+'%';bar.append(fill);
 bar.setAttribute('role','progressbar');bar.setAttribute('aria-valuenow',finished);bar.setAttribute('aria-valuemin',0);bar.setAttribute('aria-valuemax',lessons.length);
 summaryPane.append(el('strong','已学会 '+finished+'/'+lessons.length+' 个知识点（'+Math.round(finished/32*100)+'%）'),bar);
 const weak=Object.entries(state.attempts).filter(([id,count])=>count>0&&!state.completed.includes(id)).length;
 summaryPane.append(el('p','还需要复习 '+weak+' 个曾答错、尚未通过的知识点。','v18-help'));
 const controls=el('div',undefined,'v18-actions');
 controls.append(btn('继续上次学习',()=>choose(state.last)));
 if(weak){
  controls.append(btn('复习未掌握内容',()=>{
   const target=lessons.find(x=>(state.attempts[x.id]||0)>0&&!state.completed.includes(x.id));
   if(target)choose(target.id);
  }));
 }
 controls.append(btn('导出学习记录',()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  const link=el('a');link.href=url;link.download='数字电子零基础-V1.8-进度.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }));
 const upload=el('input');upload.type='file';upload.accept='.json,application/json';upload.hidden=true;
 upload.addEventListener('change',async()=>{
  const file=upload.files?.[0];if(!file)return;
  try{
   if(file.size>100000)throw Error('文件不能超过 100 KB');
   const parsed=JSON.parse(await file.text());
   if(parsed.version!==1||!Array.isArray(parsed.completed)||!parsed.attempts||typeof parsed.attempts!=='object'||Array.isArray(parsed.attempts))throw Error('不是有效的 V1.8 学习记录');
   if(window.confirm('导入会覆盖当前 V1.8 学习进度，是否继续？')){
    localStorage.setItem(STORAGE,JSON.stringify(parsed));
    state=restore();chosen=state.last;render();notify('进度导入成功。');
   }
  }catch(e){notify('导入失败：'+e.message,true)}finally{upload.value=''}
 });
 controls.append(btn('导入学习记录',()=>upload.click()),upload);
 controls.append(btn('清除 V1.8 记录',()=>{
  if(window.confirm('确定清除 V1.8 的全部知识点学习记录吗？此操作无法撤回。')){
   state=defaults();chosen=state.last;save();render();notify('V1.8 进度已清除。');
  }
 }));
 controls.append(upload);summaryPane.append(controls);
}
function infoCard(title,content,cls){
 const card=el('div',undefined,cls||'v18-card');
 card.append(el('h3',title),el('p',content));return card;
}
function buildPractice(l){
 const wrap=section('动手实验 · 改一个参数，立即观察');
 const context=el('p','这是本节所在章节的基础演示。完成后再用下方按钮打开原课堂互动实验。','v18-help');
 wrap.append(context);
 const slot=el('div',undefined,'v18-lab');
 wrap.append(slot);
 const line=el('div',undefined,'v18-actions');
 line.append(btn('打开原教材第 '+l.chapter+' 章',()=>openModule('c'+l.chapter)));
 line.append(btn('打开第 '+l.chapter+' 章原有互动',()=>openModule('m'+l.chapter)));
 if(l.chapter===4)line.append(btn('尝试 V1.3 半加器',()=>openModule('v13-lab')));
 if(l.chapter===5||l.chapter===6)line.append(btn('尝试 V1.4 触发器/计数器',()=>openModule('v14-lab')));
 if(l.chapter===7)line.append(btn('尝试 555 原有演示',()=>openModule('m7')));
 if(l.chapter===8)line.append(btn('尝试 ADC 原有演示',()=>openModule('m8')));
 wrap.append(line);
 const heading=(text)=>slot.append(el('p',text,'v18-lab-description'));
 const controls=()=>{const div=el('div',undefined,'v18-actions');slot.append(div);return div};
 const output=()=>{const div=el('div',undefined,'v18-lab-result');div.setAttribute('aria-live','polite');slot.append(div);return div};
 const select=(entries,callback)=>{
  const s=el('select',undefined,'v18-select');s.setAttribute('aria-label','选择实验参数');
  for(const [value,label]of entries){const o=el('option',label);o.value=String(value);s.append(o)}
  s.addEventListener('change',()=>callback(s.value));return s;
 };
 if(l.chapter===1){
  heading('点击位开关改变 8 位二进制数，观察位权相加结果。');
  let num=13;const actions=controls(),result=output();
  function redraw(){
   actions.replaceChildren();const {bits,weights,hex}=M.binary(num);
   bits.forEach((bit,i)=>{
    const b=btn('2^'+(7-i)+' · '+bit,()=>{num^=weights[i];redraw()},'v18-bit');
    b.setAttribute('aria-pressed',bit===1?'true':'false');actions.append(b);
   });
   result.textContent='二进制 '+bits.join('')+' = '+bits.map((b,i)=>b?weights[i]:null).filter(x=>x!==null).join(' + ').replace(/^$/,'0')+' = '+num+'₁₀；十六进制 0x'+hex;
  }redraw();
 }else if(l.chapter===2){
  heading('选择与/或/非/异或，再点 A、B 开关，观察真值表结果。');
  let gate='AND',a=0,b=0;const acts=controls(),result=output();
  const menu=select(['AND','OR','NOT','XOR'].map(x=>[x,x]),v=>{gate=v;redraw()});acts.append(menu);
  const ab=el('div',undefined,'v18-actions');acts.append(ab);
  function redraw(){
   ab.replaceChildren();ab.append(btn('输入 A='+a,()=>{a=1-a;redraw()}));
   if(gate!=='NOT')ab.append(btn('输入 B='+b,()=>{b=1-b;redraw()}));
   const row=M.gate(gate,a,b);
   result.textContent=gate+'：'+(gate==='NOT'?'非 '+a:a+' 和 '+b)+' → 输出 Y='+row.output+'。';
  }redraw();
 }else if(l.chapter===3){
  heading('切换理想 CMOS 反相器的输入，观察上下拉的导通情况。');
  let a=0;const acts=controls(),result=output();
  acts.append(btn('输入开关：切换',()=>{a=1-a;redraw()}));
  function redraw(){const r=M.cmos(a);result.textContent='Vin='+a+' → Vout='+r.output+'；'+r.conducting+'，'+r.other+'。真实电压请以芯片手册为准。';}redraw();
 }else if(l.chapter===4){
  heading('两个单比特相加，半加器的“和”与“进位”必须同时观察。');
  let a=0,b=0;const acts=controls(),result=output();
  const aButton=btn('切换 A',()=>{a=1-a;redraw()}),bButton=btn('切换 B',()=>{b=1-b;redraw()});
  acts.append(aButton,bButton);
  function redraw(){const r=M.adder(a,b);aButton.textContent='A='+a;bButton.textContent='B='+b;result.textContent=a+' + '+b+' = '+r.carry+r.sum+'₂；S='+r.sum+'，进位 C='+r.carry+'。';}redraw();
 }else if(l.chapter===5){
  heading('先调整 D，再点时钟上升沿：不按时钟，Q 不会改变。');
  let st=M.newDff();const acts=controls(),result=output();
  const change=btn('切换 D',()=>{st=M.setDff(st,1-st.D);redraw();});
  acts.append(change,btn('↑ 采样一次',()=>{st=M.clockDff(st);redraw();}),btn('复位',()=>{st=M.newDff();redraw();}));
  function redraw(){change.textContent='输入 D='+st.D;result.textContent='存储 Q='+st.Q+'；已发生 '+st.edges+' 个有效时钟沿。';}redraw();
 }else if(l.chapter===6){
  heading('每点击一次时钟上升沿，模 6 计数器状态递增，5 后返回 0。');
  let n=0;const acts=controls(),result=output();
  acts.append(btn('↑ 单步时钟',()=>{n=M.tickCounter(n,6).value;redraw();}),btn('复位',()=>{n=0;redraw();}));
  function redraw(){const r=M.counter(n,6);result.textContent='当前计数 '+n+'（'+r.binary+'₂），下一个状态 '+r.next+'。';}redraw();
 }else if(l.chapter===7){
  heading('经典 555 无稳态模型：分别调整电阻与电容，观察周期、频率和占空比。');
  let r1=10,r2=10,c=10;const acts=controls(),result=output();
  const field=(name,vals,callback)=>{const label=el('label',name+' ', 'v18-lab-label');label.append(select(vals.map(v=>[v,v]),callback));acts.append(label)};
  field('R1 (kΩ)',[1,10,47,100],v=>{r1=Number(v);redraw()});
  field('R2 (kΩ)',[1,10,47,100],v=>{r2=Number(v);redraw()});
  field('C (nF)',[1,10,100,1000],v=>{c=Number(v);redraw()});
  // 默认选项与内部默认值一致。
  acts.querySelectorAll('select').forEach((s,i)=>s.value=String([r1,r2,c][i]));
  function redraw(){const x=M.timer555(r1,r2,c);result.textContent='高电平 '+(x.tHigh*1e6).toFixed(1)+' μs，低电平 '+(x.tLow*1e6).toFixed(1)+' μs，频率 '+x.frequency.toFixed(2)+' Hz，占空比 '+x.duty.toFixed(1)+'%。';}redraw();
 }else if(l.chapter===8){
  heading('理想单极性 ADC：改变模拟输入电压，观察量化码和每码的电压宽度。');
  let bits=8,mv=1650;const acts=controls(),result=output();
  const s=select([[8,'8 位'],[10,'10 位'],[12,'12 位']],v=>{bits=Number(v);redraw()});
  const label=el('label','ADC 位数 ', 'v18-lab-label');label.append(s);acts.append(label);
  const slider=el('input');slider.type='range';slider.min=0;slider.max=3300;slider.step=10;slider.value=mv;
  slider.setAttribute('aria-label','输入电压（毫伏）');
  slider.addEventListener('input',()=>{mv=Number(slider.value);redraw();});acts.append(slider);
  function redraw(){const x=M.adc(bits,3.3,mv/1000);result.textContent='Vin='+(mv/1000).toFixed(2)+' V；量化步长 '+(x.step*1000).toFixed(3)+' mV；码值 '+x.code+'（'+x.codeBinary+'₂）。';}redraw();
 }
 return wrap;
}
function quizPanel(l){
 const p=section('理解检测 · 答对后解锁下一节'),form=el('fieldset',undefined,'v18-quiz'),legend=el('legend',l.quiz.question);
 form.append(legend);let selected=null;
 l.quiz.options.forEach((text,i)=>{
  const label=el('label',undefined,'v18-choice'),radio=el('input');
  radio.type='radio';radio.name='v18-'+l.id;radio.value=i;
  radio.addEventListener('change',()=>{selected=i});
  label.append(radio,el('span',String.fromCharCode(65+i)+'. '+text));form.append(label);
 });
 const feedback=el('p',undefined,'v18-feedback');feedback.setAttribute('aria-live','polite');
 form.append(btn('提交答案',()=>{
  if(selected===null){feedback.textContent='请先选择一个答案。';return;}
  const right=selected===l.quiz.correct;
  feedback.textContent=(right?'✓ 回答正确！':'✗ 还需要复习。')+' '+l.quiz.why;
  feedback.classList.toggle('v18-wrong',!right);
  if(right&&!state.completed.includes(l.id)){
   state.completed.push(l.id);save();renderSummary();renderSide();
  }
  if(!right){state.attempts[l.id]=Math.min(9999,(state.attempts[l.id]||0)+1);save();renderSummary();}
 }));
 form.append(feedback);
 if(state.completed.includes(l.id))form.append(el('p','✓ 本节已掌握，可以继续下一节。','v18-ok'));
 p.append(form);return p;
}
function renderLesson(){
 mainPane.replaceChildren();const l=byId.get(chosen);
 const header=section('学习目标 · 第 '+l.chapter+' 章 / 第 '+l.index+' 节');
 header.append(el('h2',l.title));
 header.append(el('p','知识目标：'+source.chapters[l.chapter-1].goal,'v18-help'));
 header.append(infoCard('先用生活例子理解',l.analogy,'v18-callout'));
 mainPane.append(header);
 const theory=section('第一部分 · 把概念真正讲明白');
 theory.append(el('p',l.explanation,'v18-paragraph'));
 theory.append(infoCard('请记住这个核心关系',l.formula,'v18-formula'));
 theory.append(infoCard('容易弄错的地方',l.pitfall,'v18-caution'));
 mainPane.append(theory);
 const worked=section('第二部分 · 从头推导一道例题');
 worked.append(el('p','先自己思考，再按顺序揭开三步答案。','v18-help'));
 const list=el('ol',undefined,'v18-steps'),act=el('div',undefined,'v18-actions');let revealed=0;
 const next=btn('显示第 1 步',()=>{
  if(revealed<l.steps.length){
   list.append(el('li',l.steps[revealed]));revealed++;
   next.textContent=revealed<l.steps.length?'显示第 '+(revealed+1)+' 步':'已显示全部步骤';
   next.disabled=revealed===l.steps.length;
  }
 });
 act.append(next,btn('重新推导',()=>{revealed=0;list.replaceChildren();next.disabled=false;next.textContent='显示第 1 步';}));
 worked.append(list,act);mainPane.append(worked);
 mainPane.append(buildPractice(l));
 const assignment=section('课后动手 · 不看答案再做一次');
 assignment.append(el('p',l.practice,'v18-paragraph'));mainPane.append(assignment);
 mainPane.append(quizPanel(l));
 const footer=el('div',undefined,'v18-actions');
 const index=lessons.findIndex(x=>x.id===l.id);
 if(index>0)footer.append(btn('上一节',()=>choose(lessons[index-1].id)));
 if(index<lessons.length-1)footer.append(btn('下一节',()=>choose(lessons[index+1].id),'v18-btn v18-primary'));
 mainPane.append(footer);
 mainPane.append(el('p','资料定位：参考阎石《数字电子技术基础》第六版的相关知识体系，本页为原创教学解说，不是未经核实的教材原文。','v18-help'));
}
function choose(id){
 if(!byId.has(id))return;
 chosen=id;state.last=id;save();renderSide();renderLesson();
 if(typeof window.show==='function'&&!document.getElementById('v18-school').classList.contains('active'))window.show('v18-school');
 const target=document.getElementById('v18-school');
 if(target&&target.classList.contains('active'))target.scrollIntoView({block:'start',behavior:'smooth'});
}
function render(){renderSummary();renderSide();renderLesson();}
function init(){
 const main=document.getElementById('main'),nav=document.getElementById('nav');
 if(!main||!nav||typeof window.show!=='function')return;
 state=restore();chosen=state.last;
 const chapter=el('div',undefined,'chap'),heading=el('div','进阶导学 · V1.8','chap-h');
 const link=el('div',undefined,'nav-item');link.dataset.mod='v18-school';
 link.append(el('span',undefined,'dot'),el('span','📚 32 节零基础系统课程'));
 chapter.append(heading,link);
 // 放在最上方，避免新手不知从何开始。
 nav.insertBefore(chapter,nav.firstChild);
 const root=el('section',undefined,'mod');root.id='v18-school';
 const modH=el('div',undefined,'mod-h');
 modH.append(el('div','阎石《数字电子技术基础》第六版 · 原创通俗课','crumb'),el('h1','数字电子技术 · 从零到会做实验'),el('p','32 节系统课程：理解概念、一步步推导、改参数做实验、答题掌握。','claim'));root.append(modH);
 summaryPane=el('div',undefined,'v18-panel');root.append(summaryPane);
 const split=el('div',undefined,'v18-layout');
 navPane=el('aside',undefined,'v18-sidebar');mainPane=el('div',undefined,'v18-main');
 split.append(navPane,mainPane);root.append(split);
 notice=el('p','学习进度仅保存在当前浏览器，请定期导出备份。','v18-notice');root.append(notice);
 main.append(root);
 render();
 if(window.location.hash==='#v18-school'||window.__v13InitialHash==='#v18-school')window.show('v18-school');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();