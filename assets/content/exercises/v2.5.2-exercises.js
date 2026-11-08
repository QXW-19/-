/* ==========================================================================
   V2.5.2 分层练习界面（阶段 E）
   --------------------------------------------------------------------------
   五类练习：概念、计算、真值表、故障定位、项目设计。
   前四类自动判分并给出定向反馈；设计题只提供量规与验证清单，不伪造分数。
   答题记录写入独立新键 digital-course-v2.5.2-exercises，不触碰旧学习记录。
   ========================================================================== */
(function(root){
'use strict';
const B=root.DigitalV252ExerciseBank;
if(!B){console.error('[V2.5.2] 练习题库未加载');return;}
const SECTION='v252-exercises';
const KEY='digital-course-v2.5.2-exercises';

function el(tag,text,cls){
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
}
function btn(label,fn,cls){
 const b=el('button',label,cls||'v252-btn');
 b.type='button';b.addEventListener('click',fn);return b;
}
function load(){
 try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&typeof v==='object'?v:{answers:{},checks:{}};}
 catch(_){return {answers:{},checks:{}};}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){/* 忽略隐私模式 */}}

let state=load();
let section=null,filter='all';

function autoStats(){
 let answered=0,correct=0,total=0;
 B.questions.forEach(q=>{
  if(q.type==='design')return;
  total++;
  const a=state.answers[q.id];
  if(a){answered++;if(a.correct)correct++;}
 });
 return {answered,correct,total};
}
function refreshSummary(){
 if(!section)return;
 const s=autoStats();
 const box=section.querySelector('.v252-ex-summary');
 if(!box)return;
 box.replaceChildren();
 const item=(k,v,cls)=>{const d=el('div','','v252-readout-item '+(cls||''));
  d.append(el('span',k,'v252-readout-label'),el('strong',v,'v252-readout-value'));box.append(d);};
 item('自动判分题',s.correct+' / '+s.answered+' 正确','ok');
 item('已作答',s.answered+' / '+s.total,'idle');
 item('正确率',s.answered?Math.round(s.correct/s.answered*100)+'%':'—','idle');
 item('设计题','按量规自评','warn');
}

function relatedLink(q){
 const row=el('div','','v252-row');
 const lesson='l'+q.chapter+'-1';
 row.append(btn('复习第 '+q.chapter+' 章',()=>{
  if(root.DigitalV241UI)root.DigitalV241UI.openLesson(lesson);
 },'v252-chip'));
 if(q.type==='design'){
  row.append(btn('去项目实训台',()=>{if(root.DigitalV252Lab)root.DigitalV252Lab.open('lock');},'v252-chip'));
 }
 return row;
}

function feedbackBox(q,res){
 const box=el('div','','v252-ex-feedback');
 if(!res.gradable){
  box.append(el('p','本题为开放设计，不自动打分。请对照量规与验证清单自评。','v252-hint'));
  return box;
 }
 box.append(el('p',res.correct?'✓ 正确':'✗ 还需要检查',res.correct?'v252-ok-text':'v252-bad-text'));
 box.append(el('p','解析：'+res.explain,'v252-p'));
 box.append(relatedLink(q));
 return box;
}

function card(q){
 const wrap=el('article','','v252-ex-card');
 wrap.dataset.qid=q.id;
 const top=el('div','','v252-card-top');
 top.append(el('span',B.LABELS[q.type],'v252-cap '+(q.type==='design'?'numeric':'circuit')));
 top.append(el('span','第 '+q.chapter+' 章','v252-cap'));
 wrap.append(top);
 wrap.append(el('h3',q.title,'v252-card-title'));
 wrap.append(el('p',q.q,'v252-p'));

 const saved=state.answers[q.id];
 if(q.type==='calc'){
  const row=el('div','','v252-row');
  const input=el('input');input.type='text';input.inputMode='decimal';
  input.className='v252-input';input.placeholder='输入数值';
  input.setAttribute('aria-label',q.title+' 答案');
  if(saved)input.value=String(saved.input);
  const unit=el('span',q.unit||'','v252-field-label');
  const submit=btn('提交答案',()=>{
   const res=B.grade(q.id,input.value);
   state.answers[q.id]={input:input.value,correct:res.correct};
   save();
   const old=wrap.querySelector('.v252-ex-feedback');if(old)old.remove();
   wrap.append(feedbackBox(q,res));
   if(q.steps){
    const ol=el('ol','','v252-ex-steps');
    q.steps.forEach(s=>ol.append(el('li',s)));
    wrap.append(el('h4','分步过程','v252-sub'),ol);
   }
   refreshSummary();
  },'v252-btn primary');
  row.append(input,unit,submit);
  wrap.append(row);
  if(saved){
   const res=B.grade(q.id,String(saved.input));
   wrap.append(feedbackBox(q,res));
  }
 }else if(q.type==='concept'||q.type==='truth'||q.type==='fault'){
  const form=el('div','','v252-ex-options');
  let picked=saved?Number(saved.input):null;
  q.options.forEach((text,i)=>{
   const label=el('label','','v252-ex-option');
   const radio=el('input');radio.type='radio';radio.name='q-'+q.id;radio.value=String(i);
   if(picked===i)radio.checked=true;
   radio.addEventListener('change',()=>{picked=i;});
   label.append(radio,el('span',String.fromCharCode(65+i)+'. '+text));
   form.append(label);
  });
  const submit=btn('提交答案',()=>{
   if(picked===null){alert('请先选择一个选项。');return;}
   const res=B.grade(q.id,picked);
   state.answers[q.id]={input:picked,correct:res.correct};save();
   const old=wrap.querySelector('.v252-ex-feedback');if(old)old.remove();
   wrap.append(feedbackBox(q,res));
   refreshSummary();
  },'v252-btn primary');
  wrap.append(form,submit);
  if(saved){
   const res=B.grade(q.id,Number(saved.input));
   wrap.append(feedbackBox(q,res));
  }
 }else{
  // 设计题：要求 + 量规 + 验证清单，不自动评分
  wrap.append(el('h4','设计任务书','v252-sub'));
  const ul=el('ul','','v252-list');
  q.requirements.forEach(r=>ul.append(el('li',r)));
  wrap.append(ul);
  wrap.append(el('h4','评分量规（教学评价，不折算分数）','v252-sub'));
  const tw=el('div','','v252-table-wrap');
  const t=el('table','','v252-table');
  const thead=el('thead'),tr=el('tr');
  q.rubric.head.forEach(h=>tr.append(el('th',h)));
  thead.append(tr);t.append(thead);
  const tb=el('tbody');
  q.rubric.rows.forEach(r=>{const row=el('tr');r.forEach(c=>row.append(el('td',c)));tb.append(row);});
  t.append(tb);tw.append(t);wrap.append(tw);
  wrap.append(el('h4','必要验证清单','v252-sub'));
  const checks=state.checks[q.id]||[];
  const list=el('div','','v252-ex-checks');
  q.checks.forEach((c,i)=>{
   const label=el('label','','v252-ex-check');
   const cb=el('input');cb.type='checkbox';cb.checked=Boolean(checks[i]);
   cb.addEventListener('change',()=>{
    const arr=state.checks[q.id]||new Array(q.checks.length).fill(false);
    arr[i]=cb.checked;state.checks[q.id]=arr;save();
   });
   label.append(cb,el('span',c));
   list.append(label);
  });
  wrap.append(list);
  const note=el('p','设计题不会自动生成分数；请用上面五项逐条自检，必要时请教师按量规评价。','v252-hint');
  wrap.append(note);
  wrap.append(relatedLink(q));
 }
 return wrap;
}

function renderList(){
 if(!section)return;
 const list=section.querySelector('.v252-ex-list');
 if(!list)return;
 list.replaceChildren();
 const items=B.questions.filter(q=>filter==='all'||q.type===filter);
 if(!items.length){list.append(el('p','该分类暂无题目。','v252-hint'));return;}
 items.forEach(q=>list.append(card(q)));
 refreshSummary();
}

function build(main,nav){
 const ch=el('div','','chap');
 ch.append(el('div','练习与评价 · V2.5.2','chap-h'));
 const item=el('div','','nav-item');item.dataset.mod=SECTION;
 item.append(el('span','','dot'),el('span','📝 分层练习与评分'));
 ch.append(item);nav.append(ch);

 section=el('section','','mod');section.id=SECTION;
 const head=el('div','','mod-h');
 head.append(el('div','V2.5.2 · 五类练习','crumb'),
  el('h1','从概念到项目设计的分层训练'),
  el('p','前四类自动判分并给出针对性的错误反馈；项目设计题只提供量规与验证清单，不伪造分数。','claim'));
 section.append(head);

 const bar=el('div','','v252-filter');
 const chips=el('div','','v252-chip-row');
 const mk=(label,key)=>{
  const b=btn(label,()=>{
   filter=key;
   [...chips.children].forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.k===key)));
   renderList();
  },'v252-chip');
  b.dataset.k=key;b.setAttribute('aria-pressed',String(key==='all'));
  return b;
 };
 chips.append(mk('全部','all'));
 B.TYPES.forEach(t=>chips.append(mk(t.label+'（'+B.stats()[t.key]+'）',t.key)));
 bar.append(chips);
 section.append(bar);

 const sum=el('div','','v252-ex-summary v252-readout');section.append(sum);
 const list=el('div','','v252-ex-list');section.append(list);
 main.append(section);
 renderList();
}
function init(){
 const main=document.getElementById('main'),nav=document.getElementById('nav');
 if(!main||!nav||!root.show||document.getElementById(SECTION))return;
 build(main,nav);
 if(location.hash==='#'+SECTION||root.__v13InitialHash==='#'+SECTION)root.show(SECTION);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

root.DigitalV252Exercises=Object.freeze({
 SECTION,KEY,
 open(){if(typeof root.show==='function')root.show(SECTION);return true;},
 stats:autoStats,
 answer(id,value){
  const res=B.grade(id,value);
  const q=B.byId(id);
  if(q&&q.type!=='design'&&res.gradable){state.answers[id]={input:value,correct:res.correct};save();}
  return res;
 },
 state:()=>JSON.parse(JSON.stringify(state)),
 reset(){state={answers:{},checks:{}};save();renderList();}
});
})(typeof window!=='undefined'?window:globalThis);
