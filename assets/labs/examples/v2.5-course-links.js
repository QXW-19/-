/* ==========================================================================
   V2.5 阶段 D：课程内容 ↔ 电路实验室 / 波形分析仪联动
   --------------------------------------------------------------------------
   在 32 节讲义的「先预测实验结果」面板中加入一键打开对应教学案例的按钮，
   形成：理论精讲 → 预测结果 → 打开实验 → 修改参数 → 观察波形 → 理解原因 → 随堂检测。
   只读取现有讲义 ID，不修改讲义数据、公式、题库答案或 localStorage 结构。
   ========================================================================== */
(function(root){
'use strict';
/* 知识点 → 教学案例映射；未列出的小节不显示按钮，避免无意义的跳转。 */
const MAP={
 'l2-1':'halfadder','l2-2':'halfadder','l2-3':'halfadder','l2-4':'halfadder',
 'l4-1':'halfadder','l4-2':'halfadder',
 'l5-1':'dff','l5-2':'dff','l5-3':'jkff','l5-4':'dff',
 'l6-1':'statemachine','l6-2':'counter6','l6-3':'counter6','l6-4':'statemachine',
 'l7-1':'tff',
 'l1-4':'halfadder'
};
function lessonId(){
 const L=root.DigitalV241Learning;
 if(L&&typeof L.currentLessonId==='function')return L.currentLessonId();
 try{
  const s=JSON.parse(localStorage.getItem('digital-course-v1.8-study')||'null');
  return s&&typeof s.last==='string'?s.last:'l1-1';
 }catch(_){return 'l1-1';}
}
function labelOf(caseId){
 const E=root.DigitalV25Examples;
 const c=E&&E.get?E.get(caseId):null;
 return c?c.name:caseId;
}
function inject(){
 const pane=document.querySelector('#v18-school .v18-main');
 if(!pane)return;
 const id=lessonId(),caseId=MAP[id];
 const panel=pane.querySelector('.v241-predict');
 if(!panel)return;
 const old=panel.querySelector('.v25-course-link');
 if(old)old.remove();
 if(!caseId)return;
 const box=document.createElement('div');
 box.className='v25-course-link';
 const text=document.createElement('p');
 text.className='v25-hint';
 text.textContent='下一步：打开对应实验修改参数，并在下方波形分析仪观察 0/1/X 与有效时钟边沿，再回到本节完成理解检测。';
 const b=document.createElement('button');
 b.type='button';b.className='v25-btn';
 b.textContent='⚡ 打开实验：'+labelOf(caseId);
 b.addEventListener('click',()=>{
  const lab=root.DigitalV25Lab;
  if(!lab){text.textContent='实验模块尚未加载完成，请稍后重试。';return;}
  const ok=lab.openCase(caseId);
  text.textContent=ok?'已打开实验并载入案例，可在波形面板单步时钟或切换输入。':'案例加载失败，请刷新页面重试。';
 });
 box.append(text,b);
 panel.append(box);
}
let raf=0;
function schedule(){
 if(raf)return;
 raf=requestAnimationFrame(()=>{raf=0;inject();});
}
function init(){
 const pane=document.querySelector('#v18-school .v18-main');
 if(!pane){setTimeout(init,300);return;}
 new MutationObserver(schedule).observe(pane,{childList:true});
 inject();
 root.addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);},{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
root.DigitalV25CourseLinks=Object.freeze({MAP,inject});
})(typeof window!=='undefined'?window:globalThis);
