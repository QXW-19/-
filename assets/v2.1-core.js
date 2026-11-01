/* V2.1 课程质量增强核心：与 V1.8 课程一一映射，不修改旧学习进度。 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DigitalV21Core=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='digital-course-v2.1-cases';
const fresh=()=>({version:1,passed:[],attempts:{}});
function validate(base,extra){
 if(!base||!Array.isArray(base.lessons)||base.lessons.length!==32)throw Error('缺少 V1.8 32 节讲义');
 if(!extra||extra.version!==1||!Array.isArray(extra.caseStudies)||extra.caseStudies.length!==8||
    !Array.isArray(extra.checkpoints)||extra.checkpoints.length!==8||
    !Array.isArray(extra.feedback)||extra.feedback.length!==32)throw Error('V2.1 内容不完整');
 const ids=new Set(base.lessons.map(l=>l.id));
 if(ids.size!==32)throw Error('原课程有重复题号');
 for(let i=0;i<32;i++){
  const lesson=base.lessons[i],f=extra.feedback[i];
  if(!f||f.id!==lesson.id||!Array.isArray(f.wrong)||f.wrong.length!==3)throw Error('错因与原题不匹配：'+lesson.id);
  if(f.wrong[lesson.quiz.correct]!==null)throw Error('正确选项不应配置错因：'+lesson.id);
  for(let option=0;option<3;option++)if(option!==lesson.quiz.correct&&
   (typeof f.wrong[option]!=='string'||f.wrong[option].length<12))throw Error('缺少有针对性的错因：'+lesson.id);
 }
 for(let i=0;i<8;i++){
  const c=extra.caseStudies[i],q=extra.checkpoints[i];
  if(!c||c.chapter!==i+1||!c.title||!c.goal||!c.given||!c.question||!c.answer||!c.next||!Array.isArray(c.steps)||c.steps.length!==5)throw Error('章级推导不完整');
  for(const row of c.steps)if(!Array.isArray(row)||row.length!==2||row.some(t=>typeof t!=='string'||t.length<5))throw Error('推导步骤缺失');
  if(!q||typeof q.question!=='string'||!Array.isArray(q.options)||q.options.length!==3||new Set(q.options).size!==3||
  !Number.isInteger(q.correct)||q.correct<0||q.correct>2||typeof q.why!=='string'||q.why.length<10)throw Error('迁移检测无效');
 }
 return true;
}
function lessonBridge(base,id){
 if(!base||!Array.isArray(base.lessons))throw Error('讲义数据缺失');
 const index=base.lessons.findIndex(l=>l.id===id);
 if(index<0)throw Error('未找到知识点');
 const current=base.lessons[index],prev=base.lessons[index-1]||null,next=base.lessons[index+1]||null;
 return {current:{id:current.id,title:current.title,chapter:current.chapter},
   prev:prev?{id:prev.id,title:prev.title,chapter:prev.chapter}:null,
   next:next?{id:next.id,title:next.title,chapter:next.chapter}:null,
   chapterGoal:base.chapters[current.chapter-1]?.goal||''};
}
function answerFeedback(base,extra,id,choice){
 validate(base,extra);
 const lesson=base.lessons.find(x=>x.id===id);
 if(!lesson||!Number.isInteger(choice)||choice<0||choice>2)throw Error('未知题目或选项');
 const correct=choice===lesson.quiz.correct;
 const guidance=correct?'回答正确，可以尝试不看提示解释推导。':extra.feedback.find(x=>x.id===id).wrong[choice];
 return {correct,guidance,why:lesson.quiz.why,correctOption:lesson.quiz.options[lesson.quiz.correct],repair:lessonBridge(base,id).prev};
}
function safeState(candidate){
 const output=fresh();
 if(!candidate||candidate.version!==1)return output;
 if(Array.isArray(candidate.passed))output.passed=[...new Set(candidate.passed.filter(c=>Number.isInteger(c)&&c>=1&&c<=8))].sort((a,b)=>a-b);
 if(candidate.attempts&&typeof candidate.attempts==='object'&&!Array.isArray(candidate.attempts)){
  for(const [key,val]of Object.entries(candidate.attempts)){
   if(/^c[1-8]$/.test(key)&&Number.isInteger(val)&&val>=0&&val<=10000)output.attempts[key]=val;
  }
 }
 return output;
}
function gradeCheckpoint(extra,state,chapter,choice){
 if(!extra||!Array.isArray(extra.checkpoints)||extra.checkpoints.length!==8||
  !Number.isInteger(chapter)||chapter<1||chapter>8||!Number.isInteger(choice)||choice<0||choice>2)throw Error('案例检测无效');
 const checkpoint=extra.checkpoints[chapter-1];
 if(!checkpoint||!Number.isInteger(checkpoint.correct))throw Error('案例答案不存在');
 const next=safeState(state),key='c'+chapter,correct=checkpoint.correct===choice;
 next.attempts[key]=Math.min(10000,(next.attempts[key]||0)+1);
 if(correct&&!next.passed.includes(chapter))next.passed.push(chapter);
 next.passed.sort((a,b)=>a-b);
 return {state:next,correct,why:checkpoint.why,answer:checkpoint.options[checkpoint.correct]};
}
return Object.freeze({KEY,validate,lessonBridge,answerFeedback,fresh,safeState,gradeCheckpoint});
});