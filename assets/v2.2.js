/* V2.2 统一资源浏览器：嵌入 V2.0 首页，不创建新的重复导航版本页面。 */
(function(){
'use strict';
const Core=window.DigitalV22Catalog;
if(!Core)return;
const LIMIT=10;
let state=Core.safeState(null);
try{state=Core.safeState(JSON.parse(localStorage.getItem(Core.KEY)||'null'))}catch(_){}
const view={query:'',category:'all',chapterOnly:false,favorites:false,limit:LIMIT};
const create=(tag,label,className)=>{
 const n=document.createElement(tag);if(label!==undefined)n.textContent=String(label);
 if(className)n.className=className;return n;
};
const button=(label,action,cls='v22-button')=>{
 const b=create('button',label,cls);b.type='button';b.addEventListener('click',action);return b;
};
function store(){try{localStorage.setItem(Core.KEY,JSON.stringify(state));return true}catch(err){console.warn('[V2.2] 收藏保存失败',err);return false;}}
function catalog(){
 const list=[];
 // 优先从真实教材页面采集名称、所属章节和类型，避免维护第二份过时页面清单。
 document.querySelectorAll('#main > section.mod[id]').forEach(section=>{
  if(section.id==='v20-home')return;
  const title=section.querySelector('.mod-h h1, h1')?.textContent?.trim()||section.id;
  const subtitle=section.querySelector('.crumb')?.textContent?.trim()||'互动课堂';
  list.push({id:section.id,kind:'module',chapter:Core.sectionChapter(section.id,subtitle),
    category:Core.sectionCategory(section.id),title,subtitle});
 });
 // V1.8 的 32 节讲义不是独立页面，因此额外注册为可直达的逻辑课程条目。
 const lessons=window.DigitalV18Lessons?.lessons;
 if(Array.isArray(lessons))for(const l of lessons){
  if(!Number.isInteger(l.chapter)||l.chapter<1||l.chapter>8)continue;
  list.push({id:l.id,kind:'lesson',chapter:l.chapter,category:'lesson',title:l.title,
    subtitle:'第 '+l.chapter+' 章 · 第 '+l.index+' 节 · 零基础讲义'});
 }
 return Core.build(list);
}
function render(container,api){
 if(!container||!api||typeof api.navigate!=='function'||typeof api.launch!=='function')return false;
 const all=catalog();
 const root=create('div',undefined,'v22-resource-center');
 const section=create('section',undefined,'v22-panel');
 const head=create('div',undefined,'v22-header');
 head.append(create('h3','统一课程资源库'),create('p','直接搜索教材章节、交互实验、32 节系统讲义、习题和 3D 场景；旧版资源不需要再逐个展开查找。','v22-muted'));
 section.append(head);
 const quick=create('div',undefined,'v22-quick');
 const chapter=Number.isInteger(api.chapter)&&api.chapter>=1&&api.chapter<=8?api.chapter:1;
 for(const [label,kind] of [['▶ 继续学本章','learn'],['🎬 电路图解','diagram'],['🔌 动手实验','lab'],['📝 章节考试','exam']]){
  quick.append(button(label,()=>api.launch(kind,chapter)));
 }
 section.append(quick);
 const controls=create('div',undefined,'v22-controls');
 const searchLabel=create('label','搜索课程、知识点或元件','v22-label');
 const search=create('input',undefined,'v22-search');
 search.type='search';search.value=view.query;search.placeholder='例如：卡诺图、555、触发器、ADC、半加器';
 search.autocomplete='off';search.maxLength=150;search.setAttribute('aria-label','搜索课程资源');
 searchLabel.append(search);
 const typeLabel=create('label','资源类型','v22-label');
 const type=create('select',undefined,'v22-select');type.setAttribute('aria-label','筛选资源类型');
 Core.CATEGORIES.forEach(c=>{
  const opt=create('option',c.label);opt.value=c.id;type.append(opt);
 });
 type.value=view.category;typeLabel.append(type);
 const filterBox=create('div',undefined,'v22-checks');
 const onlyChapter=create('label',undefined,'v22-check');
 const onlyChapterInput=create('input');onlyChapterInput.type='checkbox';onlyChapterInput.checked=view.chapterOnly;
 onlyChapter.append(onlyChapterInput,create('span','只看当前第 '+chapter+' 章'));
 const favorites=create('label',undefined,'v22-check');
 const favoritesInput=create('input');favoritesInput.type='checkbox';favoritesInput.checked=view.favorites;
 favorites.append(favoritesInput,create('span','只看收藏'));
 filterBox.append(onlyChapter,favorites);
 controls.append(searchLabel,typeLabel,filterBox);
 section.append(controls);
 const resultsInfo=create('p','', 'v22-info');resultsInfo.setAttribute('role','status');resultsInfo.setAttribute('aria-live','polite');
 const results=create('div',undefined,'v22-results'),actions=create('div',undefined,'v22-actions');
 const history=create('div',undefined,'v22-recent');
 const status=create('p','', 'v22-info');
 section.append(resultsInfo,history,results,actions,status);
 function open(row){
  const success=row.kind==='lesson'?api.launch('learn',row.chapter,row.id):api.navigate(row.id);
  if(success!==false){
   state=Core.remember(state,row.key);store();status.textContent='已打开：'+row.title;
  }else status.textContent='该资源暂时无法打开，请检查页面是否已加载。';
 }
 const favoriteButton=(row)=>{
  const checked=state.favorites.includes(row.key);
  const b=button(checked?'★ 已收藏':'☆ 收藏',()=>{
   state=Core.toggleFavorite(state,row.key);store();drawResults();drawRecent();
  },'v22-favorite');
  b.setAttribute('aria-pressed',String(checked));b.setAttribute('aria-label',(checked?'取消收藏 ':'收藏 ')+row.title);
  return b;
 };
 const rowCard=row=>{
  const card=create('article',undefined,'v22-item');
  const meta=create('span',undefined,'v22-tag');
  const cat=Core.CATEGORIES.find(c=>c.id===row.category);
  meta.textContent=cat?.label||'资源';
  const heading=create('h4',row.title);
  const info=create('p',row.subtitle+(row.chapter?' · 第 '+row.chapter+' 章':''));
  const bottom=create('div',undefined,'v22-item-actions');
  bottom.append(button('打开学习',()=>open(row),'v22-button v22-open'),favoriteButton(row));
  card.append(meta,heading,info,bottom);return card;
 };
 function drawRecent(){
  history.replaceChildren();
  // 最近访问独立于搜索和分类筛选：返回首页时也应可见，方便继续上次实验。
  const ids=new Map(all.map(row=>[row.key,row]));
  const recent=state.recent.map(k=>ids.get(k)).filter(Boolean).slice(0,4);
  if(!recent.length)return;
  const bar=create('div',undefined,'v22-recent-head');
  bar.append(create('strong','最近访问'));
  bar.append(create('span','仅保存在当前浏览器','v22-muted'));history.append(bar);
  const links=create('div',undefined,'v22-recent-links');
  recent.forEach(row=>links.append(button(row.title,()=>open(row),'v22-recent-link')));history.append(links);
 }
 function drawResults(){
  results.replaceChildren();actions.replaceChildren();
  const matches=Core.filter(all,{
   query:view.query,category:view.category,
   chapter:view.chapterOnly?chapter:null,
   favorites:view.favorites,state
  });
  resultsInfo.textContent='共找到 '+matches.length+' 项相关资源。已收录 '+all.length+' 项可访问内容；首次仅展示前 '+Math.min(matches.length,view.limit)+' 项。';
  if(!matches.length){
   const empty=create('div',undefined,'v22-empty');
   empty.append(create('strong','没有匹配结果'));
   empty.append(create('p','尝试更短的词，取消“只看本章”或“只看收藏”筛选。'));
   empty.append(button('清除所有筛选',()=>{
    view.query='';view.category='all';view.chapterOnly=false;view.favorites=false;view.limit=LIMIT;
    search.value='';type.value='all';onlyChapterInput.checked=false;favoritesInput.checked=false;drawResults();drawRecent();
   }));
   results.append(empty);return;
  }
  matches.slice(0,view.limit).forEach(row=>results.append(rowCard(row)));
  if(matches.length>view.limit){
   actions.append(button('查看更多（剩余 '+(matches.length-view.limit)+' 项）',()=>{
    view.limit+=LIMIT;drawResults();
   }));
  }
 }
 search.addEventListener('input',()=>{
  view.query=search.value;view.limit=LIMIT;drawResults();drawRecent();
 });
 type.addEventListener('change',()=>{
  view.category=type.value;view.limit=LIMIT;drawResults();drawRecent();
 });
 onlyChapterInput.addEventListener('change',()=>{
  view.chapterOnly=onlyChapterInput.checked;view.limit=LIMIT;drawResults();drawRecent();
 });
 favoritesInput.addEventListener('change',()=>{
  view.favorites=favoritesInput.checked;view.limit=LIMIT;drawResults();drawRecent();
 });
 drawRecent();drawResults();
 root.append(section);container.replaceChildren(root);
 return true;
}
window.DigitalV22Tools=Object.freeze({render,catalog});
// 如果 V2.0 首页比本脚本更早初始化，立即通知它升级资源列表。
if(typeof window.dispatchEvent==='function'&&typeof window.Event==='function')window.dispatchEvent(new window.Event('digital-v22-ready'));
})();