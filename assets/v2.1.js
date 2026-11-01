/* V2.1：增强现有 V1.8 课程，而不是另外制造一个重复的课程入口。 */
(function(){
'use strict';
const base=window.DigitalV18Lessons,data=window.DigitalV21Data,C=window.DigitalV21Core;
if(!base||!data||!C)return;
try{C.validate(base,data)}catch(e){console.error('[V2.1] 内容校验不通过',e);return;}
let state;
try{state=C.safeState(JSON.parse(localStorage.getItem(C.KEY)||'null'))}catch(_){state=C.fresh();}
const el=(tag,text,cls)=>{
 const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;return n;
};
const btn=(text,fn,cls='v21-btn')=>{
 const b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;
};
function save(){try{localStorage.setItem(C.KEY,JSON.stringify(state));return true}catch(e){console.warn('V2.1 进度未保存',e);return false;}}
function toLesson(id){
 const api=window.DigitalV18Navigation;
 if(api&&api.openLesson(id))return;
 console.warn('未能跳转到 V1.8 章节',id);
}
function bridge(id){
 const entry=C.lessonBridge(base,id);
 const box=el('section',undefined,'v21-bridge');
 box.append(el('h2','衔接提示 · 上一节 → 本节 → 下一节'));
 box.append(el('p','本章目标：'+entry.chapterGoal));
 const links=el('div',undefined,'v21-bridge-links');
 if(entry.prev)links.append(btn('← 回顾：'+entry.prev.title,()=>toLesson(entry.prev.id)));
 else links.append(el('span','这是整套课程的第一节，从 0 和 1 开始。','v21-status'));
 links.append(el('span','正在学习：'+entry.current.title,'v21-status'));
 if(entry.next)links.append(btn('预习下一节 →',()=>toLesson(entry.next.id)));
 box.append(links);return box;
}
function caseStudy(chapter,index){
 const c=data.caseStudies[chapter-1],check=data.checkpoints[chapter-1],box=el('details',undefined,'v21-case');
 // 每章最后一节默认展开综合案例，先掌握前三节再处理跨知识点推导。
 box.open=index===4;
 const title=el('summary','本章完整推导 · '+c.title);
 box.append(title);
 box.append(el('p','能力目标：'+c.goal));
 const prompt=el('div','已知条件：'+c.given,'v21-note');box.append(prompt);
 const list=el('ol'),buttons=el('div',undefined,'v21-actions'),stat=el('span',undefined,'v21-status');
 let revealed=0,answered=false;
 const quiz=el('fieldset');quiz.hidden=true;
 const legend=el('legend',check.question);
 quiz.append(legend);let picked=null;
 check.options.forEach((option,i)=>{
  const label=el('label',undefined,'v21-choice'),radio=el('input');
  radio.type='radio';radio.name='v21-check-'+chapter;radio.value=i;
  radio.addEventListener('change',()=>{picked=i;});
  label.append(radio,el('span',String.fromCharCode(65+i)+' · '+option));
  quiz.append(label);
 });
 const answer=el('div',undefined,'v21-result');answer.hidden=true;answer.setAttribute('aria-live','polite');
 const update=()=>{
  next.disabled=revealed>=c.steps.length;
  next.textContent=revealed===c.steps.length?'全部五步已显示':'展示第 '+(revealed+1)+' 步';
  stat.textContent='已查看 '+revealed+'/5 步';
  quiz.hidden=revealed<c.steps.length;
 };
 const next=btn('展示第 1 步',()=>{
  if(revealed<c.steps.length){
   const [heading,body]=c.steps[revealed],li=el('li');
   li.append(el('strong',heading),el('span',body));list.append(li);revealed++;
   update();
  }
 });
 buttons.append(next,btn('重新推导',()=>{
  revealed=0;list.replaceChildren();quiz.hidden=true;update();
 }));
 buttons.append(stat);
 box.append(list,buttons);
 box.append(el('p','最后先自己回答再看解析：'+c.question,'v21-note'));
 const result=el('p','案例思考提示：完成五步后，先用自己的话解释为什么，再提交下面的迁移检测。');
 box.append(result);
 quiz.append(btn('提交案例理解检测',()=>{
  if(picked===null){
   answer.hidden=false;answer.classList.add('error');answer.textContent='请先选择一个答案。';return;
  }
  try{
   const grade=C.gradeCheckpoint(data,state,chapter,picked);
   state=grade.state;save();answered=true;
   answer.hidden=false;answer.classList.toggle('error',!grade.correct);
   answer.textContent=(grade.correct?'✓ 回答正确！':'✗ 还没完全掌握。')+' 正确答案：'+grade.answer+'。'+grade.why+' 原因复盘：'+c.answer;
   status.textContent=state.passed.includes(chapter)?'✓ 本章综合案例已通过':'本章综合案例待通过';
  }catch(e){answer.hidden=false;answer.classList.add('error');answer.textContent='检测失败：'+e.message;}
 }));
 quiz.append(answer);box.append(quiz);
 const status=el('p',state.passed.includes(chapter)?'✓ 本章综合案例已通过':'本章综合案例待通过','v21-status');
 box.append(status,el('p','下一步：'+c.next));
 box.append(el('p','以上数值、器件前提和例题是教学约定。完整硬件设计应参考原书相关内容及真实器件数据手册。'));
 update();return box;
}
function renderLesson(main,id){
 if(!main||!base.lessons.some(l=>l.id===id))return false;
 main.querySelectorAll('.v21-bridge,.v21-case').forEach(n=>n.remove());
 const lesson=base.lessons.find(l=>l.id===id);
 const before=main.children[1]||null;
 main.insertBefore(bridge(id),before);
 // 插在原三步例题之后、微型实验之前：章节案例默认收起，第四节默认展开。
 const originalLab=[...main.children].find(n=>n.classList?.contains('v18-panel')&&
  n.querySelector('.v18-lab'));
 main.insertBefore(caseStudy(lesson.chapter,lesson.index),originalLab||null);
 return true;
}
function diagnostic(id,choice){
 try{
  const x=C.answerFeedback(base,data,id,choice);
  if(x.correct)return '';
  const prior=x.repair?'建议回顾：'+x.repair.title+'。':'建议回到本节的核心公式重新推导。';
  return ' 你选择的选项为何不对：'+x.guidance+' '+prior;
 }catch(e){console.error('V2.1 错因解析失败',e);return '';}
}
function init(){
 window.DigitalV21Enhance=Object.freeze({renderLesson,diagnostic});
 // V1.8 的 DOMContentLoaded 回调先执行；为初次渲染补挂一次。
 const main=document.querySelector('#v18-school .v18-main');
 let id='l1-1';
 try{const old=JSON.parse(localStorage.getItem('digital-course-v1.8-study')||'null');if(old&&typeof old.last==='string')id=old.last;}catch(_){}
 if(main){if(!base.lessons.some(l=>l.id===id))id='l1-1';renderLesson(main,id);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();