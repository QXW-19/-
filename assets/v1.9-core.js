/* V1.9 数据完整性校验与习题掌握度管理（可在 Node.js 单元测试）。
 * 高亮动画只用于讲解步骤，不代表电气传播速度。
 */
(function(root,factory){
 const lib=factory();
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.DigitalV19Core=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LEVELS=['基础','进阶','应用'];
function validateData(data){
 if(!data||data.version!==1||!Array.isArray(data.diagrams)||data.diagrams.length!==8||!Array.isArray(data.questions)||data.questions.length!==24)throw Error('V1.9 课程数据不完整');
 const diagramChapters=new Set(),ids=new Set();
 for(const d of data.diagrams){
  if(!Number.isInteger(d.chapter)||d.chapter<1||d.chapter>8||diagramChapters.has(d.chapter)||!d.title||!d.intro||!Array.isArray(d.nodes)||d.nodes.length<3||!Array.isArray(d.edges)||!Array.isArray(d.frames)||d.frames.length!==4)throw Error('图解的章节或步骤无效');
  diagramChapters.add(d.chapter);
  const nIds=new Set(d.nodes.map(n=>n.id)),eIds=new Set(d.edges.map(e=>e.id));
  if(nIds.size!==d.nodes.length||eIds.size!==d.edges.length)throw Error('图解节点或导线 ID 重复');
  for(const n of d.nodes)if(typeof n.id!=='string'||typeof n.text!=='string'||!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.y<0||n.x>680||n.y>230)throw Error('图解节点数据无效');
  for(const e of d.edges)if(!nIds.has(e.from)||!nIds.has(e.to)||e.from===e.to)throw Error('图解连接无效');
  for(const f of d.frames)if(!f.label||!f.description||!Array.isArray(f.nodes)||!Array.isArray(f.edges)||!f.nodes.every(id=>nIds.has(id))||!f.edges.every(id=>eIds.has(id)))throw Error('图解高亮步骤无效');
 }
 const per=new Map();
 for(const q of data.questions){
  if(typeof q.id!=='string'||ids.has(q.id)||!Number.isInteger(q.chapter)||q.chapter<1||q.chapter>8||!LEVELS.includes(q.level)||!q.question||!q.why||!Array.isArray(q.options)||q.options.length!==3||new Set(q.options).size!==3||!Number.isInteger(q.correct)||q.correct<0||q.correct>2)throw Error('练习题错误');
  ids.add(q.id);
  const arr=per.get(q.chapter)||[];arr.push(q.level);per.set(q.chapter,arr);
 }
 for(let c=1;c<=8;c++){
  const arr=per.get(c)||[];
  if(arr.length!==3||new Set(arr).size!==3)throw Error('第 '+c+' 章必须包含基础、进阶、应用各一题');
 }
 return true;
}
function fresh(){return {version:1,lastChapter:1,frames:{},results:{}};}
function safeState(data,candidate){
 validateData(data);const clean=fresh();
 if(!candidate||typeof candidate!=='object'||candidate.version!==1)throw Error('不是 V1.9 学习存档');
 if(Number.isInteger(candidate.lastChapter)&&candidate.lastChapter>=1&&candidate.lastChapter<=8)clean.lastChapter=candidate.lastChapter;
 if(candidate.frames&&typeof candidate.frames==='object'&&!Array.isArray(candidate.frames)){
  for(const d of data.diagrams){const k='c'+d.chapter,v=candidate.frames[k];if(Number.isInteger(v)&&v>=0&&v<d.frames.length)clean.frames[k]=v;}
 }
 const ids=new Map(data.questions.map(q=>[q.id,q]));
 if(candidate.results&&typeof candidate.results==='object'&&!Array.isArray(candidate.results)){
  for(const [id,r] of Object.entries(candidate.results)){
   if(!ids.has(id)||!r||!Number.isInteger(r.attempts)||r.attempts<1||r.attempts>10000||typeof r.mastered!=='boolean')continue;
   const answer=r.lastAnswer;
   if(!Number.isInteger(answer)||answer<0||answer>2)continue;
   clean.results[id]={attempts:r.attempts,mastered:r.mastered,lastAnswer:answer};
  }
 }
 return clean;
}
function recordAnswer(data,state,id,answer){
 validateData(data);
 const q=data.questions.find(x=>x.id===id);
 if(!q||!Number.isInteger(answer)||answer<0||answer>=q.options.length)throw Error('无效题目或答案');
 const out=safeState(data,state),before=out.results[id];
 const correct=answer===q.correct;
 out.results[id]={attempts:Math.min(10000,(before?before.attempts:0)+1),mastered:correct||(before?before.mastered:false),lastAnswer:answer};
 out.lastChapter=q.chapter;
 return {state:out,correct,explanation:q.why,answerText:q.options[q.correct]};
}
function setFrame(data,state,chapter,index){
 validateData(data);
 const d=data.diagrams.find(x=>x.chapter===chapter);
 if(!d||!Number.isInteger(index)||index<0||index>=d.frames.length)throw Error('步骤超出范围');
 const out=safeState(data,state);
 out.frames['c'+chapter]=index;out.lastChapter=chapter;return out;
}
function summary(data,state,chapter=null){
 validateData(data);const s=safeState(data,state);
 const pool=chapter===null?data.questions:data.questions.filter(q=>q.chapter===chapter);
 if(chapter!==null&&(!Number.isInteger(chapter)||chapter<1||chapter>8))throw Error('章节不正确');
 const mastered=pool.filter(q=>s.results[q.id]?.mastered===true).length;
 const attempted=pool.filter(q=>Boolean(s.results[q.id])).length;
 const mistakes=pool.filter(q=>s.results[q.id]&&!s.results[q.id].mastered).length;
 return {total:pool.length,mastered,attempted,mistakes,percent:Math.round(mastered/pool.length*100)};
}
function review(data,state){
 validateData(data);const s=safeState(data,state);
 return data.questions.filter(q=>s.results[q.id]&&!s.results[q.id].mastered).map(q=>q.id);
}
return Object.freeze({LEVELS,validateData,fresh,safeState,recordAnswer,setFrame,summary,review});
});