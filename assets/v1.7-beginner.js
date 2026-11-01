/* V1.7 零基础学习入口：知识卡片、分步例题、检测与阅读原章链接。 */
(function(){
'use strict';
const lessons=window.DigitalBeginnerLessons;
if(!Array.isArray(lessons)||lessons.length!==8)return;
const KEY='digital-course-v1.7-beginner';
let selected=1,progress={};
try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
for(const [k,v] of Object.entries(raw))if(/^c[1-8]$/.test(k)&&v===true)progress[k]=true;
}}catch(_){}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const button=(label,callback,cls='v17-btn')=>{const b=el('button',label,cls);b.type='button';b.addEventListener('click',callback);return b;};
const panel=(title)=>{const p=el('div',undefined,'v17-panel');p.append(el('h2',title));return p;};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(progress))}catch(e){console.warn('入门进度保存失败',e)}};
let section,container;
function openModule(id){
 if(typeof window.show!=='function'||!document.getElementById(id)){window.alert('暂时未找到教学模块 '+id);return;}
 window.show(id);
}
function render(){
 if(!container)return;container.replaceChildren();
 const count=Object.values(progress).filter(Boolean).length;
 const welcome=panel('零基础学习路线 · 8 章逐步入门');
 welcome.append(el('p','完全没有电子基础也可以从这里开始。每章只需要先理解一个生活场景，再掌握三个新词、跟着例题走三步，最后做一道自测。学懂后再阅读原教材的对应章节。'));
 welcome.append(el('p','已掌握 '+count+'/8 章。建议按顺序学习；完成标记由答对本页自测题自动记录。','v17-help'));
 const chooser=el('div',undefined,'v17-tabs');
 for(const l of lessons){
  const checked=progress['c'+l.chapter]?' ✓':'';
  const b=button(l.chapter+'. '+l.title+checked,()=>{selected=l.chapter;render();});
  b.setAttribute('aria-pressed',selected===l.chapter?'true':'false');chooser.append(b);
 }
 welcome.append(chooser);container.append(welcome);
 const l=lessons[selected-1],teach=panel('第 '+l.chapter+' 章 · '+l.title);
 const objective=el('div',undefined,'v17-notice');objective.append(el('strong','先理解：'),el('span',l.intro));teach.append(objective);
 const grid=el('div',undefined,'v17-grid');const terms=panel('第一步 · 只认识这三个新词');
 l.terms.forEach(([term,explanation])=>{const block=el('div',undefined,'v17-check');block.append(el('strong',term+'：'),el('span',explanation));terms.append(block);});
 const example=panel('第二步 · 跟着例题走');
 const steps=el('ol',undefined,'v17-steps'),actions=el('div',undefined,'v17-actions');let shown=0;
 const next=button('显示第 1 步',()=>{
  if(shown<l.steps.length){steps.append(el('li',l.steps[shown]));shown++;next.textContent=shown===3?'已展示全部步骤':'显示第 '+(shown+1)+' 步';next.disabled=shown===3;}
 });
 const reset=button('重新开始推导',()=>{shown=0;steps.replaceChildren();next.textContent='显示第 1 步';next.disabled=false;});
 actions.append(next,reset);example.append(steps,actions);
 grid.append(terms,example);teach.append(grid);
 const activity=panel('第三步 · 自己动手验证');
 activity.append(el('p',l.task));
 const controls=el('div',undefined,'v17-actions');
 controls.append(button('打开原教材第 '+l.chapter+' 章',()=>openModule('c'+l.chapter),'v17-btn v17-btn-primary'));
 controls.append(button('打开配套互动实验',()=>openModule(l.experiment)));
 activity.append(controls);teach.append(activity);
 const quiz=panel('第四步 · 不看答案能做对吗？');quiz.append(el('h3',l.quiz.q));
 const result=el('div',undefined,'v17-notice');result.hidden=true;
 l.quiz.options.forEach((option,index)=>{
  quiz.append(button(String.fromCharCode(65+index)+'. '+option,()=>{
   const right=index===l.quiz.correct;
   result.hidden=false;result.textContent=(right?'✓ 答对了！':'还需要再想想。')+' '+l.quiz.why;
   if(right){progress['c'+l.chapter]=true;save();}
  }));
 });
 quiz.append(result);
 if(progress['c'+l.chapter])quiz.append(el('p','✓ 本章入门检测已通过。可以继续下一章，或者返回复习。','v17-status'));
 teach.append(quiz);
 teach.append(el('p','参考框架：阎石《数字电子技术基础》第六版相关章节。本页是原创通俗解说，不是教材逐字摘录。教材与本页内容有差异时，请对照具体章节和适用条件。','v17-help'));
 container.append(teach);
}
function init(){
 const main=document.getElementById('main'),nav=document.getElementById('nav');
 if(!main||!nav||typeof window.show!=='function')return;
 const chapter=el('div',undefined,'chap');chapter.append(el('div','零基础课堂 · V1.7','chap-h'));
 const item=el('div',undefined,'nav-item');item.dataset.mod='v17-beginner';
 item.append(el('span',undefined,'dot'),el('span','📖 从 0 开始学习（推荐）'));chapter.append(item);
 // 把零基础入口放在导航靠前位置，方便初学者发现。
 nav.insertBefore(chapter,nav.firstChild);
 section=el('section',undefined,'mod');section.id='v17-beginner';
 const header=el('div',undefined,'mod-h');header.append(el('div','阎石《数字电子技术基础》第六版 · 原创入门导学','crumb'),el('h1','从 0 开始学数字电子技术'),el('p','生活类比 → 认识新词 → 分步推导 → 动手实验 → 自测过关。','claim'));
 section.append(header);container=el('div');section.append(container);main.append(section);
 render();
 if(window.location.hash==='#v17-beginner'||window.__v13InitialHash==='#v17-beginner')window.show('v17-beginner');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();