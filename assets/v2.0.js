/* V2.0 统一首页。旧版 localStorage 仅读取，不做迁移或覆盖。 */
(function(){
'use strict';
const C=window.DigitalV20;
const nav=document.getElementById('nav'),main=document.getElementById('main');
if(!C||!nav||!main)return;
let hub=C.safeHub(C.readJSON(localStorage,C.KEYS.hub)),view;
let page,stats,chapters,detail,shortcuts,message,toggle;
const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const button=(text,fn,cls='v20-button')=>{const n=make('button',text,cls);n.type='button';n.addEventListener('click',fn);return n;};
const section=(heading)=>{const n=make('section',undefined,'v20-box');n.append(make('h2',heading));return n;};
function note(s,error=false){if(message){message.textContent=s;message.style.color=error?'#b91c1c':'';}}
function persist(){try{localStorage.setItem(C.KEYS.hub,JSON.stringify(hub))}catch(e){note('保存设置失败：'+e.message,true)}}
function expandOld(expanded,remember=false){
 nav.classList.toggle('v20-condensed',!expanded);
 toggle.textContent=expanded?'▾ 收起旧版全部功能':'▸ 展开全部旧版功能';
 toggle.setAttribute('aria-expanded',String(expanded));
 if(remember){hub.navExpanded=expanded;persist();}
}
function navigate(id){
 if(typeof window.show!=='function'||!document.getElementById(id)){
  note('目标页面 '+id+' 未加载，请展开旧版导航检查。',true);return false;
 }
 expandOld(true);window.show(id);return true;
}
function launch(kind,c,lessonId){
 if(!Number.isInteger(c)||c<1||c>8)return;
 let success=false;
 if(kind==='learn'){
  const api=window.DigitalV18Navigation;
  if(api){expandOld(true);success=lessonId?api.openLesson(lessonId):api.openChapter(c);}
  if(!success)success=navigate('v18-school');
 }else if(kind==='diagram'){
  const api=window.DigitalV19Navigation;
  if(api){expandOld(true);success=api.openChapter(c);}
  if(!success)success=navigate('v19-studio');
 }else if(kind==='exam'){
  const api=window.DigitalV15Navigation;
  if(api){expandOld(true);success=api.openChapter(c);}
  if(!success)success=navigate('v15-exam');
 }else if(kind==='lab')success=navigate(C.CHAPTERS[c-1].experiment);
 else if(kind==='textbook')success=navigate('c'+c);
 else if(kind==='projects')success=navigate('v17-projects');
 else if(kind==='mix')success=navigate('v16-lab');
 else if(kind==='examCenter')success=navigate('v15-exam');
 if(!success)note('无法跳转，请检查目标功能是否正确加载。',true);
}
function selectChapter(c){
 hub.currentChapter=c;persist();renderChapters();
}
function refresh(){
 view=C.gather(localStorage);hub=view.hub;render();expandOld(hub.navExpanded);
}
function renderStats(){
 stats.replaceChildren();
 const s=view.totals;
 const rows=[[s.lessons+'/32','已完成零基础知识点'],[s.questions+'/24','已掌握分层练习'],[s.cases+'/8','完整案例已过关'],[s.labDone+'/8','已自评实验'],[s.chapters+'/8','章节学习里程碑']];
 for(const [v,label]of rows){
  const item=make('div',undefined,'v20-kpi');item.append(make('b',v),make('span',label));stats.append(item);
 }
}
function step(num,title,description,ok,label,action){
 const item=make('div',undefined,'v20-step'+(ok?' done':'')),
 mark=make('div',ok?'✓':num,'v20-step-number'),
 body=make('div',undefined,'v20-step-body');
 body.append(make('strong',title),make('p',description),button(label,action));
 item.append(mark,body);return {item,body};
}
function renderDetail(c){
 detail.replaceChildren();
 const heading=make('div',undefined,'v20-section-head'),headingBox=make('div');
 headingBox.append(make('h2','第 '+c.number+' 章 · '+c.name),make('p','按以下四步学习，所有历史学习记录保留在各自原模块。','v20-muted'));
 heading.append(headingBox);detail.append(heading);
 const p=make('div',undefined,'v20-progress'),fill=make('span');fill.style.width=(c.milestones*25)+'%';
 p.append(fill);p.setAttribute('role','progressbar');p.setAttribute('aria-valuenow',String(c.milestones));
 p.setAttribute('aria-valuemin','0');p.setAttribute('aria-valuemax','4');detail.append(p);
 const stack=make('div',undefined,'v20-steps');
 const missed=C.lessonIds(c.number).find(id=>!c.completedLessons.includes(id));
 stack.append(step(1,'先学懂 · 零基础讲义',c.lessons+'/4 节已通过。包含通俗讲解、例题推导、可操作的基础演示；五步综合案例'+(c.caseStudyPassed?'已通过。':'尚待完成。'),c.lessons===4,
  c.lessons===4?'复习讲义':'继续未完成的一节',()=>launch('learn',c.number,missed||C.lessonIds(c.number)[0])).item);
 stack.append(step(2,'再看懂 · 图解与分层练习',c.questions+'/3 道分层题已掌握。四步动画、基础题、进阶题和应用题。',c.questions===3,
  '进入本章图解与练习',()=>launch('diagram',c.number)).item);
 const lab=step(3,'自己动手 · 实验操作',c.labDone?'已手动确认完成本章实验，可随时取消标记。':'进入对应实验动手操作，完成后手动确认（不是系统自动验收）。',c.labDone,
 '打开本章实验',()=>launch('lab',c.number));
 const mark=button(c.labDone?'取消本章实验自评':'我已完成本章实验',()=>{
  hub=C.setLabDone(hub,c.number,!c.labDone);persist();view=C.gather(localStorage);render();
  note('已更新本章实验自评，不会修改旧实验记录。');
 });
 mark.setAttribute('aria-pressed',String(c.labDone));lab.body.append(mark);stack.append(lab.item);
 stack.append(step(4,'最后检测 · 章节考试',c.bestExam===null?'尚无本章考试成绩。本学习路线以 80 分为建议达标线。':'本章历史最高 '+c.bestExam+' 分，建议达到 80 分。',c.bestExam!==null&&c.bestExam>=80,
 '打开本章章节考试',()=>launch('exam',c.number)).item);
 detail.append(stack);
 const more=make('div',undefined,'v20-btn-row');
 more.append(button('阅读原教材章节',()=>launch('textbook',c.number)),
 button('打开综合实训项目',()=>launch('projects',c.number)));
 const next=C.nextAction(c);
 more.append(button('推荐下一步：'+next.label,()=>launch(next.kind==='review'?'learn':next.kind,c.number,next.lessonId),'v20-button primary'));
 detail.append(more);
 detail.append(make('p','注意：80 分达标、手动实验标记、四项里程碑是本网站设置的学习建议，不代表原书官方标准或认证。','v20-muted'));
}
function renderChapters(){
 chapters.replaceChildren();
 const active=view.chapters.find(x=>x.number===hub.currentChapter)||view.chapters[0];
 for(const chapter of view.chapters){
  const b=button(chapter.number+'. '+chapter.name,()=>selectChapter(chapter.number),'v20-chapter-button');
  b.classList.toggle('selected',active.number===chapter.number);
  b.setAttribute('aria-pressed',String(active.number===chapter.number));
  b.append(make('small',chapter.stage+' · 四项里程碑 '+chapter.milestones+'/4'));
  chapters.append(b);
 }
 renderDetail(active);
}
function renderShortcuts(){
 shortcuts.replaceChildren();
 const cards=[
 ['32 节零基础讲义','概念、生活类比、例题推导及微型实验。','开始学理论',()=>launch('learn',hub.currentChapter)],
 ['逐步图解与分层练习','八章四步信号示意图、三档练习与错题。','看电路怎么工作',()=>launch('diagram',hub.currentChapter)],
 ['混合数字电路实验室','逻辑门、D/T/JK 触发器、时钟与计数器自由接线。','动手搭电路',()=>launch('mix',hub.currentChapter)],
 ['考试中心与错题本','章节测试、综合测试、自动评分及错题讲解。','打开考试中心',()=>launch('examCenter',hub.currentChapter)]
 ];
 for(const [name,desc,label,fn]of cards){
  const a=make('article');a.append(make('strong',name),make('p',desc),button(label,fn));shortcuts.append(a);
 }
}
function render(){
 view=C.gather(localStorage);hub=view.hub;renderStats();renderChapters();renderShortcuts();
}
function init(){
 const group=make('div',undefined,'chap v20-hub-nav');
 group.append(make('div','学习首页 · V2.0','chap-h'));
 const entry=make('div',undefined,'nav-item');entry.dataset.mod='v20-home';
 entry.append(make('span',undefined,'dot'),make('span','🏠 我的学习路线'));group.append(entry);
 toggle=button('▸ 展开全部旧版功能',()=>expandOld(nav.classList.contains('v20-condensed'),true),'v20-nav-toggle');
 group.append(toggle);nav.insertBefore(group,nav.firstChild);
 page=make('section',undefined,'mod');page.id='v20-home';
 const hero=make('div',undefined,'v20-hero');
 hero.append(make('small','阎石《数字电子技术基础》第六版 · 原创互动辅助教学'));
 hero.append(make('h1','从零开始，学懂数字电子技术'));
 hero.append(make('p','只需要按照“学概念 → 看图解 → 做实验 → 参加测试”的顺序前进。旧课程、实验和考试会自动在这里汇总进度。'));
 const calls=make('div',undefined,'v20-hero-actions');
 calls.append(button('▶ 继续推荐学习',()=>{
  const target=view.chapters.find(c=>c.number===view.upNext);
  hub.currentChapter=target.number;persist();
  const action=C.nextAction(target);launch(action.kind==='review'?'learn':action.kind,target.number,action.lessonId);
 },'v20-button primary'));
 calls.append(button('选择要学的章节',()=>{
  selectChapter(view.upNext);
  document.getElementById('v20-chapter-root')?.scrollIntoView({behavior:'smooth',block:'start'});
 },'v20-button outline'));
 hero.append(calls);page.append(hero);
 stats=make('div',undefined,'v20-kpis');page.append(stats);
 const course=section('八章循序渐进学习路线');course.id='v20-chapter-root';
 course.append(make('p','选择一章，再按四个步骤完成。系统会读取旧版进度，不需要重新做已经完成的题。','v20-muted'));
 const grid=make('div',undefined,'v20-chapter-layout');
 chapters=make('nav',undefined,'v20-chapter-nav');chapters.setAttribute('aria-label','八章学习导航');
 detail=make('div');grid.append(chapters,detail);course.append(grid);page.append(course);
 const library=section('常用学习工具');shortcuts=make('div',undefined,'v20-shelf');library.append(shortcuts);page.append(library);
 const footer=section('学习数据说明');
 footer.append(make('p','V1.8 的 32 节进度、V1.9 的 24 道分层题、V1.5 的章节考试和 V1.1 的旧章记录会分别保存在原来的浏览器存储中。V2.0 不修改旧数据，只保存本版实验自评和导航偏好。','v20-muted'));
 footer.append(make('p','当前无云端同步：切换设备、浏览器或清理存储前，请在各旧版工具中导出 JSON 备份。原有 51 个教材页面及所有实验仍可通过“展开全部旧版功能”访问。','v20-muted'));page.append(footer);
 message=make('p','返回本首页时会重新读取进度。','v20-muted');message.setAttribute('role','status');page.append(message);
 main.append(page);
 window['onShow_v20-home']=refresh;
 render();expandOld(hub.navExpanded);
 const firstHash=window.__v13InitialHash;
 if(firstHash===''||firstHash==='#v20-home')window.show('v20-home');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();