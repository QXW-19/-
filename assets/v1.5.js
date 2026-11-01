/* V1.5：考试中心。选项与解析通过 textContent 安全呈现；无网络请求。 */
(function(){
'use strict';
const bank=window.DigitalExamBank, E=window.DigitalExam;
if(!bank||!E){console.error('[V1.5] 考试资源未正确加载');return;}
try{E.validateBank(bank)}catch(err){console.error('[V1.5] 题库校验失败',err);return;}
const STORE='digital-course-v1.5',byId=new Map(bank.questions.map(q=>[q.id,q]));
let state=E.fresh(),modeSelect,chapterSelect,mainBody,summary,feedback,ticker=null,lastResult=null;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const btn=(text,fn,cls='v15-btn')=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
const box=(title)=>{const x=el('section',undefined,'v15-panel');if(title)x.append(el('h2',title));return x;};
function nameOf(mode,chapter){
 if(mode==='chapter')return '第 '+chapter+' 章 · '+bank.chapters[chapter-1]+' 测试';
 if(mode==='comprehensive')return '全书综合模拟考试';
 return '待纠正错题复习';
}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state));return true}catch(err){say('本地保存失败，请检查浏览器存储：'+err.message,true);return false}}
function say(msg,warning){if(!feedback)return;feedback.textContent=msg;feedback.className=warning?'v15-warning':'v15-muted';}
function load(){
 try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');return E.safeState(bank,saved);}
 catch(_){return E.fresh();}
}
function timeLeft(){const a=state.active;return a&&a.durationMs!==null?Math.max(0,a.startedAt+a.durationMs-Date.now()):null;}
function timeText(ms){if(ms===null)return '不限时';const seconds=Math.ceil(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
function stopClock(){if(ticker!==null){clearInterval(ticker);ticker=null;}}
function tick(){
 const a=state.active;
 if(!a){stopClock();return;}
 const countdown=document.getElementById('v15-timer');
 if(countdown)countdown.textContent=timeText(timeLeft());
 if(a.durationMs!==null&&timeLeft()<=0){stopClock();submit(true);}
}
function startClock(){stopClock();if(state.active&&state.active.durationMs!==null){tick();if(state.active)ticker=setInterval(tick,1000);}}
function reviewIds(){return Object.entries(state.mistakes).filter(([id,r])=>byId.has(id)&&r.corrected===false).map(([id])=>id);}
function dashboard(){
 const wrap=box('学习成绩概览');const stats=el('div',undefined,'v15-stats');
 let completed=0;try{const old=JSON.parse(localStorage.getItem('digital-course-v1.1')||'{}');completed=Array.isArray(old.completed)?old.completed.filter(id=>/^c[1-8]$/.test(id)).length:0;}catch(_){}
 const best=state.history.length?Math.max(...state.history.map(h=>h.score)):null;
 [[String(state.history.length),'累计考试次数'],[best===null?'—':best+' 分','历史最高分'],[String(reviewIds().length),'待复习错题'],[String(Math.min(completed,8))+'/8','V1.1 章节完成数']].forEach(([value,label])=>{
  const stat=el('div',undefined,'v15-stat');stat.append(el('b',value),el('span',label));stats.append(stat);
 });wrap.append(stats);
 wrap.append(el('p','成绩与错题保存在本浏览器；V1.1 章节进度仅作展示，不会被修改。','v15-muted'));return wrap;
}
function paperControls(){
 const wrap=box('创建测试');
 const row=el('div',undefined,'v15-controls');
 const mode=el('label',undefined,'v15-label');mode.append(el('span','测试模式'));
 modeSelect=el('select',undefined,'v15-select');
 [['chapter','章节测试（6 题）'],['comprehensive','综合模拟考试（24 题 / 30 分钟）'],['wrong','错题复习（最多 24 题）']].forEach(([value,label])=>{const opt=el('option',label);opt.value=value;modeSelect.append(opt)});
 mode.append(modeSelect);
 const chapter=el('label',undefined,'v15-label');chapter.append(el('span','选择章节'));
 chapterSelect=el('select',undefined,'v15-select');
 bank.chapters.forEach((title,i)=>{const option=el('option','第 '+(i+1)+' 章 · '+title);option.value=String(i+1);chapterSelect.append(option)});
 chapter.append(chapterSelect);modeSelect.addEventListener('change',()=>{chapter.style.display=modeSelect.value==='chapter'?'flex':'none'});
 row.append(mode,chapter,btn('开始新测试',startNew,'v15-btn v15-btn-primary'));
 row.append(btn('导出成绩与错题',exportData));
 const uploader=el('input');uploader.type='file';uploader.accept='.json,application/json';uploader.hidden=true;
 uploader.addEventListener('change',async()=>{
  const file=uploader.files?.[0];if(!file)return;
  try{
   if(file.size>250000)throw Error('文件不能超过 250 KB');
   const input=JSON.parse(await file.text());const clean=E.safeState(bank,input);
   if(window.confirm('导入会覆盖本浏览器 V1.5 的考试记录、错题与正在进行的试卷，是否继续？')){
    stopClock();state=clean;lastResult=null;persist();render();
   }
  }catch(err){say('导入失败：'+err.message,true)}
  finally{uploader.value=''}
 });
 row.append(btn('导入 V1.5 记录',()=>uploader.click()),uploader);
 row.append(btn('清除 V1.5 数据',()=>{
  if(window.confirm('确定清除 V1.5 的考试和错题记录吗？不可撤销。')){
   stopClock();state=E.fresh();lastResult=null;persist();render();
  }
 }));
 wrap.append(row);
 wrap.append(el('p','章节测验随机排列该章 6 题；综合测试每章随机选 3 题；未提交前不显示答案。未作答计零分。','v15-muted'));
 feedback=el('p','请选择测试模式，然后点击“开始新测试”。','v15-muted');feedback.setAttribute('role','status');wrap.append(feedback);
 return wrap;
}
function startNew(){
 if(state.active&&!window.confirm('正在进行的测试尚未提交。开始新测试将丢弃这份答卷，是否继续？'))return;
 const kind=modeSelect.value,ch=Number(chapterSelect.value);
 let paper;
 try{paper=E.buildPaper(bank,{mode:kind,chapter:ch,wrongIds:reviewIds(),seed:(Date.now()^(Math.random()*4294967296))>>>0});}
 catch(err){say(err.message,true);return;}
 state.active={...paper,id:'test-'+Date.now(),startedAt:Date.now(),answers:{}};
 lastResult=null;persist();render();
 const active=document.getElementById('v15-active');if(active)active.scrollIntoView({behavior:'smooth',block:'start'});
}
function writeAnswer(id,value){
 if(!state.active)return;
 if(value===null){delete state.active.answers[id];}
 else state.active.answers[id]=value;
 persist();updateProgress();
}
function updateProgress(){
 const a=state.active;if(!a)return;
 const attempts=a.questionIds.filter(id=>E.gradeQuestion(byId.get(id),a.answers[id]).attempted).length;
 const node=document.getElementById('v15-attempts');
 if(node)node.textContent='已答 '+attempts+'/'+a.questionIds.length;
 const bar=document.getElementById('v15-progress-bar');
 if(bar)bar.style.width=(attempts/a.questionIds.length*100)+'%';
}
function questionWidget(id,index){
 const q=byId.get(id),fieldset=el('fieldset',undefined,'v15-question');
 fieldset.style.border='0';fieldset.style.margin='0';fieldset.style.padding='17px 0';fieldset.style.minWidth='0';
 const legend=el('legend','第 '+(index+1)+' 题 · '+bank.chapters[q.chapter-1]+' · '+q.prompt);fieldset.append(legend);
 const old=state.active.answers[id];
 if(q.type==='number'){
  const input=el('input',undefined,'v15-number');input.type='text';input.inputMode='decimal';
  input.maxLength=60;input.placeholder='输入数值'+(q.unit?'（'+q.unit+'）':'');
  input.setAttribute('aria-label','第 '+(index+1)+' 题数值答案');
  if(old!==undefined)input.value=String(old);
  input.addEventListener('input',()=>writeAnswer(id,input.value.trim()||null));
  fieldset.append(input);
 }else{
  const choices=q.type==='boolean'?['正确','错误']:q.options;
  choices.forEach((txt,i)=>{
   const label=el('label',undefined,'v15-option');const input=el('input');
   input.type='radio';input.name='v15-'+id;
   const value=q.type==='boolean'?i===0:i;
   if(old!==undefined&&value===old)input.checked=true;
   input.addEventListener('change',()=>writeAnswer(id,value));
   label.append(input,el('span',txt));fieldset.append(label);
  });
 }
 return fieldset;
}
function running(){
 const a=state.active;if(!a)return null;
 const wrap=box('进行中的测试');wrap.id='v15-active';
 const title=el('div',undefined,'v15-exam-head');
 title.append(el('h3',nameOf(a.mode,a.chapter)));
 const meta=el('div',undefined,'v15-controls');
 const counter=el('span','', 'v15-muted');counter.id='v15-attempts';
 meta.append(counter);
 const timer=el('strong','', 'v15-warning');timer.id='v15-timer';
 meta.append(el('span','剩余时间：','v15-muted'),timer);
 title.append(meta);wrap.append(title);
 const bar=el('div',undefined,'v15-progress');const fill=el('span');fill.id='v15-progress-bar';bar.append(fill);wrap.append(bar);
 for(let i=0;i<a.questionIds.length;i++)wrap.append(questionWidget(a.questionIds[i],i));
 wrap.append(btn('提交试卷并评分',()=>submit(false),'v15-btn v15-btn-primary'));
 wrap.append(el('p','提示：考试刷新后可继续；限时综合测试按开始时间计时，关闭页面也不会暂停计时。','v15-muted'));
 return wrap;
}
function submit(auto){
 const a=state.active;if(!a)return;
 if(!auto){
  const answered=a.questionIds.filter(id=>E.gradeQuestion(byId.get(id),a.answers[id]).attempted).length;
  const missing=a.questionIds.length-answered;
  if(!window.confirm('确认提交本次测试吗？'+(missing?' 尚有 '+missing+' 题未作答，将按错误计分。':'')))return;
 }
 try{
  const {state:next,result}=E.record(bank,state,a,a.answers,Date.now());
  lastResult={paper:{...a},result,expired:auto};
  stopClock();state=next;persist();render();
  document.getElementById('v15-results')?.scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){say('评分失败：'+err.message,true)}
}
function answerText(q,value){
 if(value===null||value===undefined)return '未作答';
 if(q.type==='choice')return q.options[Number(value)]||'无效选择';
 if(q.type==='boolean')return value?'正确':'错误';
 return String(value)+(q.unit?' '+q.unit:'');
}
function resultsPanel(){
 if(!lastResult)return null;
 const {paper,result,expired}=lastResult;
 const wrap=box('本次考试报告');wrap.id='v15-results';
 wrap.append(el('div',result.score+' 分','v15-score'));
 wrap.append(el('p',nameOf(paper.mode,paper.chapter)+' · 正确 '+result.correct+'/'+result.total+' · 未作答 '+result.unanswered+(expired?' · 因限时结束自动交卷':''),'v15-muted'));
 const grouped=el('div',undefined,'v15-list');
 for(const row of result.items){
  const q=byId.get(row.id);const line=el('div',undefined,'v15-item-result'+(row.correct?'':' v15-wrong'));
  line.append(el('strong',(row.correct?'✓ ':'✗ ')+q.prompt));
  line.append(el('p','你的答案：'+answerText(q,row.answer)+'。正确答案：'+answerText(q,q.answer)+(q.type==='number'&&q.tolerance!==undefined?'（允许误差 ±'+q.tolerance+(q.unit||'')+'）':''),'v15-muted'));
  line.append(el('p','解析：'+q.explain,'v15-muted'));grouped.append(line);
 }
 wrap.append(grouped);return wrap;
}
function wrongPanel(){
 const ids=reviewIds();
 const wrap=box('错题本 · 优先复习未纠正的题目');
 wrap.append(el('p','待纠正错题 '+ids.length+' 道。重新做对的题会标为已纠正，不会抹掉原有错误次数。','v15-muted'));
 if(!ids.length)wrap.append(el('p','暂无待复习错题。先完成一次章节测试或综合考试。','v15-muted'));
 else{
  for(const id of ids.slice(0,25)){
   const q=byId.get(id),item=el('div',undefined,'v15-history-row');
   item.append(el('span',bank.chapters[q.chapter-1]+' · '+q.prompt));
   item.append(el('strong','错 '+state.mistakes[id].errors+' 次'));wrap.append(item);
  }
  wrap.append(btn('进入错题复习',()=>{
   modeSelect.value='wrong';
   const x=modeSelect.closest('label')?.nextElementSibling;if(x)x.style.display='none';
   startNew();
  }));
 }
 return wrap;
}
function historyPanel(){
 const wrap=box('最近考试历史');
 if(!state.history.length){wrap.append(el('p','尚无考试成绩。','v15-muted'));return wrap;}
 state.history.slice(-12).reverse().forEach(x=>{
  const row=el('div',undefined,'v15-history-row');
  row.append(el('span',nameOf(x.mode,x.chapter)+' · '+new Date(x.date).toLocaleString('zh-CN')));
  row.append(el('strong',x.score+' 分（'+x.correct+'/'+x.total+'）'));
  wrap.append(row);
 });
 return wrap;
}
function exportData(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='数字电子考试记录-v1.5.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 say('已生成 V1.5 成绩与错题 JSON。');
}
function render(){
 if(!mainBody)return;
 // 当前计时器需要与正在进行的试卷保持一致，重绘前停止旧 interval。
 stopClock();mainBody.replaceChildren();
 mainBody.append(dashboard(),paperControls());
 if(state.active)mainBody.append(running());
 if(lastResult)mainBody.append(resultsPanel());
 mainBody.append(wrongPanel(),historyPanel());
 if(state.active){updateProgress();startClock();}
}
function init(){
 const main=document.getElementById('main'),nav=document.getElementById('nav');
 if(!main||!nav||typeof window.show!=='function')return;
 const ch=el('div',undefined,'chap');ch.append(el('div','学习评估 · V1.5','chap-h'));
 const item=el('div',undefined,'nav-item');item.dataset.mod='v15-exam';
 item.append(el('span',undefined,'dot'),el('span','📝 章节测试与综合考试'));ch.append(item);nav.append(ch);
 const section=el('section',undefined,'mod');section.id='v15-exam';
 const header=el('div',undefined,'mod-h');
 header.append(el('div','V1.5 · 学习成果评估','crumb'),el('h1','考试中心与错题复习'),el('p','八章共 48 道原创练习，支持章节测验、综合模拟考试、数值计算题和错题复习。','claim'));
 section.append(header);mainBody=el('div');section.append(mainBody);main.append(section);
 state=load();
 render();
 // V2.0 学习中心直接进入某章考试设置，不擅自开始新试卷。
 window.DigitalV15Navigation=Object.freeze({openChapter(ch){
  if(!Number.isInteger(ch)||ch<1||ch>8)return false;
  if(state.active){window.show('v15-exam');return true;}
  modeSelect.value='chapter';chapterSelect.value=String(ch);
  chapterSelect.closest('label').style.display='flex';
  window.show('v15-exam');return true;
 }});
 // 关闭浏览器并不暂停限时测试；回来后仍然按绝对时间检查截止。
 if(state.active&&state.active.durationMs!==null&&timeLeft()<=0)submit(true);
 if(window.location.hash==='#v15-exam'||window.__v13InitialHash==='#v15-exam')window.show('v15-exam');
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 nav.addEventListener('click',evt=>{if(evt.target.closest('.nav-item[data-mod]'))tick();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();