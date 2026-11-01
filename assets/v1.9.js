/* V1.9 电路图解与三层练习：SVG 高亮仅表示教学步骤，不是电信号传播延迟。 */
(function(){
'use strict';
const data=window.DigitalV19Data,Core=window.DigitalV19Core;
if(!data||!Core)return;
try{Core.validateData(data)}catch(e){console.error('[V1.9] 课程数据无效',e);return;}
const STORE='digital-course-v1.9-learning';
let state=Core.fresh(),chapter=1,timer=null,playing=false,host,side,area,summary,feedback;
const ns='http://www.w3.org/2000/svg',svgEl=(tag,attributes={})=>{
 const n=document.createElementNS(ns,tag);
 for(const [key,value]of Object.entries(attributes))n.setAttribute(key,String(value));return n;
};
const el=(tag,text,cls)=>{
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;
};
const btn=(text,action,cls='v19-btn')=>{
 const b=el('button',text,cls);b.type='button';b.addEventListener('click',action);return b;
};
const panel=title=>{const n=el('section',undefined,'v19-panel');n.append(el('h2',title));return n;};
function tell(message,error){if(!feedback)return;feedback.textContent=message;feedback.style.color=error?'#b91c1c':'';}
function read(){
 try{const s=JSON.parse(localStorage.getItem(STORE)||'null');return Core.safeState(data,s)}catch(_){return Core.fresh()}
}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){tell('浏览器存储失败：'+e.message,true)}}
function stop(){
 if(timer!==null){clearInterval(timer);timer=null;}playing=false;
}
function setChapter(n){
 if(!Number.isInteger(n)||n<1||n>8)return;
 stop();chapter=n;state.lastChapter=n;persist();render();
 if(host&&host.classList.contains('active'))host.scrollIntoView({block:'start',behavior:'smooth'});
}
function lineGeometry(from,to){
 // 节点坐标表示卡片左上角，箭头起终点在卡片边缘附近。
 const a={x:from.x+116,y:from.y+22},b={x:to.x,y:to.y+22};
 const dx=b.x-a.x;
 if(dx>20){
  const bend=Math.max(27,dx*.43);
  return 'M'+a.x+','+a.y+' C'+(a.x+bend)+','+a.y+' '+(b.x-bend)+','+b.y+' '+b.x+','+b.y;
 }
 // 回路或上下分支采用折线绕行，避免连线穿过卡片。
 const routeX=Math.max(from.x,to.x)+146,offset=from.y<to.y?1:-1;
 return 'M'+a.x+','+a.y+' L'+routeX+','+a.y+' L'+routeX+','+(b.y+offset*16)+' L'+b.x+','+b.y;
}
function drawDiagram(target,diagram,index){
 target.replaceChildren();
 const frame=diagram.frames[index],activeNodes=new Set(frame.nodes),activeEdges=new Set(frame.edges);
 const svg=svgEl('svg',{viewBox:'0 0 720 265',class:'v19-diagram',role:'img','aria-label':diagram.title+'；步骤 '+(index+1)+'：'+frame.description});
 const defs=svgEl('defs'),arrow=svgEl('marker',{id:'v19-arrow',markerWidth:7,markerHeight:7,refX:5.6,refY:3.5,orient:'auto'});
 arrow.append(svgEl('path',{d:'M0,0 L7,3.5 L0,7 Z',fill:'#64748b'}));defs.append(arrow);
 const arrowActive=svgEl('marker',{id:'v19-arrow-active',markerWidth:7,markerHeight:7,refX:5.6,refY:3.5,orient:'auto'});
 arrowActive.append(svgEl('path',{d:'M0,0 L7,3.5 L0,7 Z',fill:'#0d9488'}));defs.append(arrowActive);svg.append(defs);
 const nodes=new Map(diagram.nodes.map(n=>[n.id,n]));
 diagram.edges.forEach(e=>{
  const active=activeEdges.has(e.id);
  const path=svgEl('path',{d:lineGeometry(nodes.get(e.from),nodes.get(e.to)),class:'v19-edge'+(active?' active':''),'marker-end':'url(#'+(active?'v19-arrow-active':'v19-arrow')+')'});
  const title=svgEl('title');title.textContent=nodes.get(e.from).text+' → '+nodes.get(e.to).text;path.append(title);svg.append(path);
 });
 for(const node of diagram.nodes){
  const group=svgEl('g',{class:'v19-node'+(activeNodes.has(node.id)?' active':''),transform:'translate('+node.x+' '+node.y+')'});
  group.append(svgEl('rect',{x:0,y:0,width:120,height:48,rx:8}));
  const chars=Array.from(node.text),chunks=[];
  for(let p=0;p<chars.length;p+=10)chunks.push(chars.slice(p,p+10).join(''));
  if(chunks.length===1){
   const text=svgEl('text',{x:60,y:29});text.textContent=node.text;group.append(text);
  }else{
   chunks.slice(0,2).forEach((part,i)=>{
    const t=svgEl('text',{x:60,y:i===0?21:38});t.textContent=part;group.append(t);
   });
  }
  const title=svgEl('title');title.textContent=node.text;group.append(title);svg.append(group);
 }
 target.append(svg);
}
function activeDiagram(){
 const d=data.diagrams.find(d=>d.chapter===chapter);
 return d;
}
function currentStep(){
 const d=activeDiagram(),i=state.frames['c'+chapter];
 return Number.isInteger(i)&&i>=0&&i<d.frames.length?i:0;
}
function updateFrame(index,stage,caption,indexText,stepBar,buttonPrev,buttonNext,buttonPlay){
 state=Core.setFrame(data,state,chapter,index);persist();
 const d=activeDiagram();drawDiagram(stage,d,index);
 const frame=d.frames[index];
 caption.replaceChildren(el('strong','第 '+(index+1)+' 步 · '+frame.label),el('span',frame.description));
 indexText.textContent=(index+1)+' / '+d.frames.length;
 stepBar.style.width=((index+1)/d.frames.length*100)+'%';
 buttonPrev.disabled=index===0;
 buttonNext.disabled=index===d.frames.length-1;
 buttonPlay.textContent=playing?'⏸ 暂停':'▶ 自动播放';
}
function diagramPanel(){
 const d=activeDiagram(),box=panel('可逐步播放的电路图解：'+d.title);
 box.append(el('p',d.intro,'v19-help'));
 const scroll=el('div',undefined,'v19-stage-scroll');box.append(scroll);
 const details=el('div',undefined,'v19-step');details.setAttribute('aria-live','polite');
 box.append(details);
 const progress=el('div',undefined,'v19-progress'),inner=el('span');progress.append(inner);box.append(progress);
 const actions=el('div',undefined,'v19-actions');
 const count=el('span','', 'v19-status');
 const refresh=i=>updateFrame(i,scroll,details,count,inner,previous,next,play);
 const previous=btn('← 上一步',()=>{stop();refresh(Math.max(0,currentStep()-1));});
 const next=btn('下一步 →',()=>{stop();refresh(Math.min(d.frames.length-1,currentStep()+1));});
 const play=btn('▶ 自动播放',()=>{
  if(playing){stop();refresh(currentStep());return;}
  if(currentStep()===d.frames.length-1)refresh(0);
  playing=true;refresh(currentStep());
  timer=setInterval(()=>{
   if(!host.classList.contains('active')||document.hidden){stop();refresh(currentStep());return;}
   const i=currentStep();
   if(i>=d.frames.length-1){stop();refresh(i);return;}
   refresh(i+1);
  },1800);
 });
 actions.append(previous,next,play,count);box.append(actions);
 box.append(el('p','高亮和箭头表示讲解顺序，不代表真实芯片的传播时间、时钟精度或电流路径。动画节奏由教学步骤决定。','v19-help'));
 refresh(currentStep());
 return box;
}
function choicePanel(q){
 const s=state.results[q.id],box=el('article',undefined,'v19-quiz');
 box.append(el('span',q.level+'练习','v19-tier'));
 box.append(el('h3',q.question));
 let picked=null;
 q.options.forEach((option,i)=>{
  const label=el('label',undefined,'v19-choice'),radio=el('input');
  radio.type='radio';radio.name='v19-'+q.id;radio.value=String(i);
  if(s&&s.lastAnswer===i){radio.checked=true;picked=i;}
  radio.addEventListener('change',()=>{picked=i});
  label.append(radio,el('span',String.fromCharCode(65+i)+' · '+option));box.append(label);
 });
 const explain=el('div',undefined,'v19-answer');explain.setAttribute('aria-live','polite');
 if(s){
  const right=s.lastAnswer===q.correct;
  explain.classList.toggle('wrong',!right);
  explain.textContent=(right?'✓ 上次答对。':'✗ 上次答错。')+' 正确答案：'+q.options[q.correct]+'。解析：'+q.why;
 }else explain.hidden=true;
 box.append(btn('提交并查看解析',()=>{
  if(picked===null){explain.hidden=false;explain.classList.add('wrong');explain.textContent='请先选择一个选项。';return;}
  try{
   const answer=Core.recordAnswer(data,state,q.id,picked);
   state=answer.state;persist();
   explain.hidden=false;explain.classList.toggle('wrong',!answer.correct);
   explain.textContent=(answer.correct?'✓ 回答正确！':'✗ 回答有误。')+' 正确答案：'+answer.answerText+'。解析：'+answer.explanation;
   updateSummary();renderSide();
  }catch(e){tell('提交失败：'+e.message,true);}
 }));
 box.append(explain);
 if(s?.mastered===true)box.append(el('p','✓ 这道题已通过；你仍可重新作答复习。','v19-status'));
 return box;
}
function exercisePanel(){
 const info=Core.summary(data,state,chapter);
 const wrap=panel('三层练习 · 基础 → 进阶 → 应用');
 wrap.append(el('p','当前章节已掌握 '+info.mastered+'/3 题。答错时会显示推导解析并进入待复习；重新答对后可消除待复习状态。','v19-help'));
 const questions=el('div',undefined,'v19-questions');
 data.questions.filter(q=>q.chapter===chapter).forEach(q=>questions.append(choicePanel(q)));
 wrap.append(questions);return wrap;
}
function updateSummary(){
 summary.replaceChildren();
 const overall=Core.summary(data,state);
 summary.append(el('h2','练习掌握情况 · '+overall.mastered+'/24'));
 const progress=el('div',undefined,'v19-progress');
 const fill=el('span');fill.style.width=overall.percent+'%';progress.append(fill);summary.append(progress);
 const text=el('p','已尝试 '+overall.attempted+' 题，已掌握 '+overall.mastered+' 题，待复习 '+overall.mistakes+' 题。学习结果仅保存在本浏览器。','v19-help');summary.append(text);
 const actions=el('div',undefined,'v19-actions');
 actions.append(btn('优先复习错题',()=>{
  const wrong=Core.review(data,state);if(!wrong.length){tell('当前没有已答错但未掌握的题。');return;}
  const q=data.questions.find(q=>q.id===wrong[0]);setChapter(q.chapter);
  tell('已跳转到第 '+q.chapter+' 章，请找到对应难度的未掌握题重新作答。');
 }));
 actions.append(btn('导出 V1.9 学习记录',()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  const a=el('a');a.href=url;a.download='数字电子课程-v1.9-进度.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }));
 const input=el('input');input.type='file';input.accept='.json,application/json';input.hidden=true;
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];if(!file)return;
  try{
   if(file.size>100000)throw Error('文件大小超过 100 KB');
   const loaded=JSON.parse(await file.text());const clean=Core.safeState(data,loaded);
   if(window.confirm('导入将覆盖当前 V1.9 学习进度，继续吗？')){
    stop();state=clean;chapter=clean.lastChapter;persist();render();tell('V1.9 记录已导入。');
   }
  }catch(e){tell('导入失败：'+e.message,true)}finally{input.value='';}
 });
 actions.append(btn('导入 V1.9 学习记录',()=>input.click()),input);
 actions.append(btn('清除 V1.9 进度',()=>{
  if(window.confirm('确定清除 V1.9 的全部答题与图解进度？')){
   stop();state=Core.fresh();chapter=1;persist();render();tell('已清除 V1.9 记录。');
  }
 }));
 summary.append(actions);
}
function renderSide(){
 side.replaceChildren();
 for(const d of data.diagrams){
  const count=Core.summary(data,state,d.chapter);
  const b=btn('第 '+d.chapter+' 章 · '+d.title,()=>setChapter(d.chapter),'v19-chapter');
  b.setAttribute('aria-pressed',chapter===d.chapter?'true':'false');
  b.append(el('small','分层练习已掌握 '+count.mastered+'/3'));
  side.append(b);
 }
}
function render(){
 stop();updateSummary();renderSide();area.replaceChildren();
 area.append(diagramPanel(),exercisePanel());
 const footer=el('div',undefined,'v19-actions');
 if(chapter>1)footer.append(btn('← 上一章',()=>setChapter(chapter-1)));
 footer.append(btn('查看 V1.8 完整讲义',()=>{
  if(typeof window.show==='function'&&document.getElementById('v18-school'))window.show('v18-school');
 }));
 if(chapter<8)footer.append(btn('下一章 →',()=>setChapter(chapter+1),'v19-btn primary'));
 area.append(footer);
}
function init(){
 const main=document.getElementById('main'),nav=document.getElementById('nav');
 if(!main||!nav||typeof window.show!=='function')return;
 state=read();chapter=state.lastChapter;
 const category=el('div',undefined,'chap');category.append(el('div','图解动画 · V1.9','chap-h'));
 const link=el('div',undefined,'nav-item');link.dataset.mod='v19-studio';
 link.append(el('span',undefined,'dot'),el('span','🎬 电路图解与分层练习'));category.append(link);
 nav.insertBefore(category,nav.firstChild);
 host=el('section',undefined,'mod');host.id='v19-studio';
 const head=el('div',undefined,'mod-h');
 head.append(el('div','阎石《数字电子技术基础》第六版 · 原创知识图解','crumb'),el('h1','看懂电路里的 0 和 1'),el('p','逐帧图解、信号标注、基础/进阶/应用练习以及错题复习。','claim'));
 host.append(head);summary=el('div',undefined,'v19-panel');host.append(summary);
 const layout=el('div',undefined,'v19-layout');side=el('aside',undefined,'v19-sidebar');
 area=el('div',undefined,'v19-work');layout.append(side,area);host.append(layout);
 feedback=el('p','提示：先按“下一步”读懂四步，再做三道分层题。','v19-status');
 feedback.setAttribute('role','status');host.append(feedback);main.append(host);
 render();
 // V2.0 学习中心可直接定位某章图解与分层练习。
 window.DigitalV19Navigation=Object.freeze({openChapter(ch){
  if(!Number.isInteger(ch)||ch<1||ch>8)return false;
  setChapter(ch);window.show('v19-studio');return true;
 }});
 nav.addEventListener('click',evt=>{
  const item=evt.target.closest('.nav-item[data-mod]');
  if(item&&item.dataset.mod!=='v19-studio')stop();
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 if(window.location.hash==='#v19-studio'||window.__v13InitialHash==='#v19-studio')window.show('v19-studio');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();