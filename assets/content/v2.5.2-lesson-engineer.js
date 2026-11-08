/* ==========================================================================
   V2.5.2 工程师视角注入（阶段 D）
   --------------------------------------------------------------------------
   在既有四个深读面板之外，向「第二部分 · 从头推导一道例题」追加一个折叠块：
   设计取舍、常见芯片要点、工程师思考题（含提示与参考答案）。
   不新增 .v18-panel，不改动 V2.4.1 七段路径与既有四个深读块的数量。
   ========================================================================== */
(function(root){
'use strict';
const doc=document;
function lessonId(){
 const L=root.DigitalV241Learning;
 if(L&&typeof L.currentLessonId==='function')return L.currentLessonId();
 try{
  const s=JSON.parse(localStorage.getItem('digital-course-v1.8-study')||'null');
  return s&&typeof s.last==='string'?s.last:'l1-1';
 }catch(_){return 'l1-1';}
}
function pane(){return doc.querySelector('#v18-school .v18-main');}
function panelByHead(word){
 const p=pane();if(!p)return null;
 return [...p.children].find(n=>{
  if(!n.classList||!n.classList.contains('v18-panel'))return false;
  const h=n.querySelector('h2');return h&&h.textContent.includes(word);
 })||null;
}
function el(tag,text,cls){
 const n=doc.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
}
function build(id){
 const E=root.DigitalV252Engineer;
 const data=E&&E.get(id);
 if(!data)return null;
 const d=el('details','','v252-engineer');
 const summary=el('summary','','v252-eng-head');
 summary.append(el('span','','v252-eng-ico'),el('span','工程师视角 · 取舍、芯片与思考题','v252-eng-title'));
 d.append(summary);
 const body=el('div','','v252-eng-body');
 body.append(el('h4','设计取舍','v252-eng-sub'));
 body.append(el('p',data.tradeoff,'v252-p'));
 if(data.chip){
  body.append(el('h4','芯片要点：'+data.chip.name,'v252-eng-sub'));
  const ul=el('ul','','v252-list');
  data.chip.facts.forEach(f=>ul.append(el('li',f)));
  body.append(ul);
  body.append(el('p',data.chip.note,'v252-hint'));
 }
 body.append(el('h4','工程师思考题','v252-eng-sub'));
 body.append(el('p',data.question,'v252-eng-q'));
 body.append(el('p','提示：'+data.hint,'v252-hint'));
 const ans=el('div','','v252-eng-answer');
 ans.hidden=true;
 ans.append(el('p','参考答案：'+data.answer,'v252-p'));
 const btn=el('button','展开参考答案','v252-btn soft');
 btn.type='button';
 btn.addEventListener('click',()=>{
  ans.hidden=!ans.hidden;
  btn.textContent=ans.hidden?'展开参考答案':'收起参考答案';
 });
 body.append(btn,ans);
 d.append(body);
 return d;
}
let last='';
function inject(){
 const p=pane();if(!p)return;
 const id=lessonId();
 if(p.dataset.v252Engineer===id&&p.querySelector('.v252-engineer'))return;
 p.querySelectorAll('.v252-engineer').forEach(n=>n.remove());
 const data=root.DigitalV252Engineer&&root.DigitalV252Engineer.get(id);
 if(!data)return;
 const worked=panelByHead('第二部分');
 if(!worked)return;
 const block=build(id);
 if(!block)return;
 worked.append(block);
 p.dataset.v252Engineer=id;
 last=id;
}
let raf=0;
function schedule(){
 if(raf)return;
 raf=requestAnimationFrame(()=>{raf=0;inject();});
}
function init(){
 const p=pane();
 if(!p){setTimeout(init,300);return;}
 new MutationObserver(schedule).observe(p,{childList:true});
 inject();
 root.addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);raf=0;},{once:true});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
else init();
root.DigitalV252LessonEngineer=Object.freeze({inject,current:()=>last});
})(typeof window!=='undefined'?window:globalThis);
