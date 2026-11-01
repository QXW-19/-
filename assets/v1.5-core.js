/* V1.5 纯函数考试引擎，可在 Node.js 无浏览器环境下验证。 */
(function(host,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else host.DigitalExam=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MODES=['chapter','comprehensive','wrong'];
function validateBank(bank){
  if(!bank||bank.version!==1||!Array.isArray(bank.chapters)||bank.chapters.length!==8||!Array.isArray(bank.questions))throw Error('题库结构不正确');
  const ids=new Set(),per=Array(8).fill(0);
  for(const q of bank.questions){
    if(!q||!/^c[1-8]-\d{2}$/.test(q.id)||ids.has(q.id)||!Number.isInteger(q.chapter)||q.chapter<1||q.chapter>8||q.id.slice(1,2)!==String(q.chapter)||!['choice','boolean','number'].includes(q.type)||!q.prompt||!q.explain)throw Error('题库题目错误：'+(q&&q.id));
    if(q.type==='choice'&&(!Array.isArray(q.options)||q.options.length<2||q.options.length>6||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length))throw Error('选择题选项错误：'+q.id);
    if(q.type==='boolean'&&typeof q.answer!=='boolean')throw Error('判断题答案错误：'+q.id);
    if(q.type==='number'&&(!Number.isFinite(q.answer)||(q.tolerance!==undefined&&(!Number.isFinite(q.tolerance)||q.tolerance<0))))throw Error('数值题答案错误：'+q.id);
    ids.add(q.id);per[q.chapter-1]++;
  }
  if(per.some(x=>x<6))throw Error('每章至少需要六道题');
  return true;
}
function rng(seed){
  let s=(Number(seed)>>>0)||0x9e3779b9;
  return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296};
}
function shuffle(list,random){
  const a=list.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function buildPaper(bank,{mode='chapter',chapter=1,wrongIds=[],seed=1}={}){
  validateBank(bank);
  if(!MODES.includes(mode))throw Error('未知测试模式');
  if(mode==='chapter'&&(!Number.isInteger(chapter)||chapter<1||chapter>8))throw Error('章节编号超出范围');
  const random=rng(seed),questions=bank.questions;
  let selected;
  if(mode==='chapter')selected=shuffle(questions.filter(q=>q.chapter===chapter),random).slice(0,6);
  else if(mode==='comprehensive'){
    selected=shuffle(bank.chapters.flatMap((_,i)=>shuffle(questions.filter(q=>q.chapter===i+1),random).slice(0,3)),random);
  }else{
    const allowed=new Set(wrongIds.filter(id=>typeof id==='string'));
    selected=shuffle(questions.filter(q=>allowed.has(q.id)),random).slice(0,24);
    if(!selected.length)throw Error('当前没有待复习错题');
  }
  return {mode,chapter:mode==='chapter'?chapter:null,questionIds:selected.map(q=>q.id),durationMs:mode==='comprehensive'?30*60*1000:null};
}
function numericValue(value){
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(typeof value!=='string'||value.length>60)return null;
  const text=value.trim();
  if(!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(text))return null;
  const number=Number(text);return Number.isFinite(number)?number:null;
}
function gradeQuestion(q,raw){
  if(raw===undefined||raw===null||raw==='')return {attempted:false,correct:false};
  if(q.type==='choice'){
    const v=typeof raw==='number'?raw:typeof raw==='string'&&/^\d+$/.test(raw)?Number(raw):NaN;
    return {attempted:Number.isInteger(v)&&v>=0&&v<q.options.length,correct:v===q.answer};
  }
  if(q.type==='boolean'){
    const bool=raw===true||raw===false?raw:raw==='true'?true:raw==='false'?false:null;
    return {attempted:bool!==null,correct:bool===q.answer};
  }
  const v=numericValue(raw);
  return {attempted:v!==null,correct:v!==null&&Math.abs(v-q.answer)<=(q.tolerance??1e-9)+1e-12};
}
function gradePaper(bank,paper,answers){
  validateBank(bank);
  if(!paper||!Array.isArray(paper.questionIds)||paper.questionIds.length<1||paper.questionIds.length>48)throw Error('试卷无效');
  const byId=new Map(bank.questions.map(q=>[q.id,q])),used=new Set(),items=[];
  for(const id of paper.questionIds){
    if(used.has(id)||!byId.has(id))throw Error('试卷存在无效或重复题号');
    used.add(id);
    const q=byId.get(id),raw=answers&&Object.prototype.hasOwnProperty.call(answers,id)?answers[id]:undefined;
    const g=gradeQuestion(q,raw);
    items.push({id,chapter:q.chapter,attempted:g.attempted,correct:g.correct,answer:g.attempted?raw:null});
  }
  const correct=items.filter(x=>x.correct).length,attempted=items.filter(x=>x.attempted).length,total=items.length;
  return {correct,attempted,unanswered:total-attempted,total,score:Math.round(correct/total*100),items};
}
function fresh(){return {version:1,active:null,history:[],mistakes:{}};}
function validAnswer(q,value){if(value===null||value===undefined)return false;return gradeQuestion(q,value).attempted;}
function safeState(bank,data){
  validateBank(bank);const clean=fresh(),byId=new Map(bank.questions.map(q=>[q.id,q]));
  if(!data||typeof data!=='object'||data.version!==1||!Array.isArray(data.history)||!data.mistakes||typeof data.mistakes!=='object'||Array.isArray(data.mistakes)||!Object.prototype.hasOwnProperty.call(data,'active'))throw Error('文件不符合 V1.5 成绩记录格式');
  if(data.mistakes&&typeof data.mistakes==='object'&&!Array.isArray(data.mistakes)){
    for(const [id,value]of Object.entries(data.mistakes)){
      if(!byId.has(id))continue;
      if(value&&Number.isInteger(value.errors)&&value.errors>=1&&value.errors<=1e5&&typeof value.corrected==='boolean')
        clean.mistakes[id]={errors:value.errors,corrected:value.corrected};
    }
  }
  if(Array.isArray(data.history)){
    for(const x of data.history.slice(-50)){
      if(!x||!MODES.includes(x.mode)||!Number.isInteger(x.score)||x.score<0||x.score>100||!Number.isInteger(x.total)||x.total<1||x.total>48||!Number.isInteger(x.correct)||x.correct<0||x.correct>x.total||!Number.isFinite(x.date)||x.date<0||x.date>1e15)continue;
      clean.history.push({mode:x.mode,chapter:Number.isInteger(x.chapter)&&x.chapter>=1&&x.chapter<=8?x.chapter:null,score:x.score,total:x.total,correct:x.correct,date:x.date});
    }
  }
  const a=data.active;
  if(a&&MODES.includes(a.mode)&&Array.isArray(a.questionIds)&&a.questionIds.length>=1&&a.questionIds.length<=48&&Number.isFinite(a.startedAt)&&a.startedAt>=0&&a.startedAt<=1e15&&typeof a.id==='string'&&a.id.length<80){
    const ids=a.questionIds;
    if(new Set(ids).size===ids.length&&ids.every(id=>byId.has(id))){
      const answers={};
      if(a.answers&&typeof a.answers==='object'&&!Array.isArray(a.answers))for(const [id,value]of Object.entries(a.answers)){
        if(ids.includes(id)&&validAnswer(byId.get(id),value))answers[id]=value;
      }
      clean.active={id:a.id,mode:a.mode,chapter:Number.isInteger(a.chapter)&&a.chapter>=1&&a.chapter<=8?a.chapter:null,questionIds:ids.slice(),durationMs:a.mode==='comprehensive'?30*60*1000:null,startedAt:a.startedAt,answers};
    }
  }
  return clean;
}
function record(bank,state,paper,answers,completedAt){
  const prior=safeState(bank,state),result=gradePaper(bank,paper,answers);
  if(!Number.isFinite(completedAt)||completedAt<0||completedAt>1e15)throw Error('提交时间无效');
  const mistakes={...prior.mistakes};
  for(const row of result.items){
    const former=mistakes[row.id];
    if(!row.correct){
      mistakes[row.id]={errors:Math.min(1e5,(former?.errors||0)+1),corrected:false};
    }else if(row.correct&&former){mistakes[row.id]={errors:former.errors,corrected:true};}
  }
  const history=prior.history.concat([{mode:paper.mode,chapter:paper.chapter,score:result.score,total:result.total,correct:result.correct,date:completedAt}]).slice(-50);
  return {state:{version:1,active:null,history,mistakes},result};
}
return Object.freeze({validateBank,buildPaper,gradeQuestion,gradePaper,record,fresh,safeState,numericValue});
});