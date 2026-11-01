/* V2.0 统一学习中心数据层。
 * 严格只读 V1.1、V1.5、V1.8、V1.9 的旧版记录；
 * 仅在新的 digital-course-v2.0-hub 中保存实验自评与导航偏好。
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DigitalV20=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CHAPTERS=Object.freeze([
 {number:1,name:'数制与码制',experiment:'m1'},
 {number:2,name:'逻辑代数基础',experiment:'m2'},
 {number:3,name:'门电路',experiment:'m3'},
 {number:4,name:'组合逻辑电路',experiment:'v13-lab'},
 {number:5,name:'半导体存储电路',experiment:'v14-lab'},
 {number:6,name:'时序逻辑电路',experiment:'v16-lab'},
 {number:7,name:'脉冲波形产生与整形',experiment:'m7'},
 {number:8,name:'数模与模数转换',experiment:'m8'}
]);
const KEYS=Object.freeze({
 hub:'digital-course-v2.0-hub',
 base:'digital-course-v1.1',
 exam:'digital-course-v1.5',
 course:'digital-course-v1.8-study',
 diagrams:'digital-course-v1.9-learning'
});
function fresh(){return {version:1,currentChapter:1,labDone:[],navExpanded:false};}
function safeHub(raw){
 const out=fresh();if(!raw||typeof raw!=='object'||raw.version!==1)return out;
 if(Number.isInteger(raw.currentChapter)&&raw.currentChapter>=1&&raw.currentChapter<=8)out.currentChapter=raw.currentChapter;
 if(Array.isArray(raw.labDone))out.labDone=[...new Set(raw.labDone.filter(n=>Number.isInteger(n)&&n>=1&&n<=8))].sort((a,b)=>a-b);
 out.navExpanded=raw.navExpanded===true;
 return out;
}
function readJSON(storage,key){
 try{const text=storage?.getItem?.(key);return typeof text==='string'&&text?JSON.parse(text):null}catch(_){return null;}
}
function lessonIds(c){return Array.from({length:4},(_,i)=>'l'+c+'-'+(i+1));}
function questionIds(c){return Array.from({length:3},(_,i)=>'v19-q'+String((c-1)*3+i+1).padStart(2,'0'));}
function gather(storage){
 const legacy1=readJSON(storage,KEYS.base),legacy5=readJSON(storage,KEYS.exam),v18=readJSON(storage,KEYS.course),v19=readJSON(storage,KEYS.diagrams);
 const hub=safeHub(readJSON(storage,KEYS.hub));
 const lessons=new Set(Array.isArray(v18?.completed)?v18.completed.filter(x=>typeof x==='string') : []);
 const questions=v19?.results&&typeof v19.results==='object'&&!Array.isArray(v19.results)?v19.results:{};
 const history=Array.isArray(legacy5?.history)?legacy5.history:[];
 const oldCompleted=new Set(Array.isArray(legacy1?.completed)?legacy1.completed.filter(x=>/^c[1-8]$/.test(x)) : []);
 const chapterData=CHAPTERS.map(info=>{
  const c=info.number;
  const completedLessons=lessonIds(c).filter(x=>lessons.has(x));
  const masteredQuestions=questionIds(c).filter(x=>questions[x]?.mastered===true);
  const exams=history.filter(h=>h&&h.mode==='chapter'&&h.chapter===c&&Number.isFinite(h.score)&&h.score>=0&&h.score<=100);
  const bestExam=exams.length?Math.max(...exams.map(h=>h.score)):null;
  const labDone=hub.labDone.includes(c);
  const milestones=(completedLessons.length===4?1:0)+(masteredQuestions.length===3?1:0)+(labDone?1:0)+(bestExam!==null&&bestExam>=80?1:0);
  const done=milestones===4;
  const stage=done?'已达成':completedLessons.length||masteredQuestions.length||labDone||exams.length?'学习中':'尚未开始';
  return {...info,completedLessons,masteredQuestions,lessons:completedLessons.length,questions:masteredQuestions.length,labDone,bestExam,examAttempts:exams.length,milestones,done,stage,legacyDone:oldCompleted.has('c'+c)};
 });
 const totals={
  lessons:chapterData.reduce((s,c)=>s+c.lessons,0),
  questions:chapterData.reduce((s,c)=>s+c.questions,0),
  labDone:chapterData.filter(c=>c.labDone).length,
  passedExams:chapterData.filter(c=>c.bestExam!==null&&c.bestExam>=80).length,
  milestones:chapterData.reduce((s,c)=>s+c.milestones,0),
  chapters:chapterData.filter(c=>c.done).length
 };
 const recommendation=chapterData.find(c=>!c.done)||chapterData[7];
 return {hub,chapters:chapterData,totals,upNext:recommendation.number,
   oldChapterCompletions:oldCompleted.size,examHistoryCount:history.length,
   sources:{course:Boolean(v18),diagrams:Boolean(v19),exam:Boolean(legacy5),base:Boolean(legacy1)}};
}
function nextAction(chapter){
 if(!chapter||!Number.isInteger(chapter.number)||chapter.number<1||chapter.number>8)throw Error('章节数据不正确');
 if(chapter.lessons<4){
  const id=lessonIds(chapter.number).find(x=>!chapter.completedLessons.includes(x));
  return {kind:'learn',label:'继续零基础讲义',lessonId:id,chapter:chapter.number};
 }
 if(chapter.questions<3)return {kind:'diagram',label:'进入图解与分层练习',chapter:chapter.number};
 if(!chapter.labDone)return {kind:'lab',label:'开始动手实验',chapter:chapter.number};
 if(chapter.bestExam===null||chapter.bestExam<80)return {kind:'exam',label:'参加章节测试（80 分达标）',chapter:chapter.number};
 return {kind:'review',label:'复习本章',chapter:chapter.number};
}
function setLabDone(hub,chapter,done){
 if(!Number.isInteger(chapter)||chapter<1||chapter>8||typeof done!=='boolean')throw Error('非法章节自评参数');
 const out=safeHub(hub);
 out.labDone=out.labDone.filter(x=>x!==chapter);
 if(done)out.labDone.push(chapter);
 out.labDone.sort((a,b)=>a-b);
 return out;
}
return Object.freeze({CHAPTERS,KEYS,fresh,safeHub,readJSON,lessonIds,questionIds,gather,nextAction,setLabDone});
});