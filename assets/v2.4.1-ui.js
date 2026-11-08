/* ==========================================================================
   V2.4.1 统一 UI 层：设计系统落地 + 学习首页重构
   --------------------------------------------------------------------------
   1) UI Kit：本项目新增模块共用的 el / button / card / badge，避免各写一套。
   2) 主题：复用 V1.1 已有的 dark 状态（body.v11-dark），只同步到
      documentElement[data-theme]，不新增、不重命名、不清空任何历史存档。
   3) 首页：把分散在 V1.1/V1.2/V2.0 的重复入口收拢到一张仪表盘，
      只读取 localStorage 进度，绝不写回旧版键。
   4) 事件：全局仅一个 MutationObserver + 一次 show() 包装，避免重复绑定。
   ========================================================================== */
(function(root){
'use strict';
const doc=document;
const KEYS={
  base:'digital-course-v1.1',exam:'digital-course-v1.5',
  course:'digital-course-v1.8-study',v19:'digital-course-v1.9-learning',
  cases:'digital-course-v2.1-cases',resources:'digital-course-v2.2-resources'
};

/* ---------- UI Kit：供 V2.4.1 各模块共用 ---------- */
function el(tag,text,cls){
  const n=doc.createElement(tag);
  if(text!==undefined&&text!==null)n.textContent=String(text);
  if(cls)n.className=cls;
  return n;
}
function button(text,onClick,cls){
  const b=el('button',text,cls||'v241-btn');
  b.type='button';
  b.addEventListener('click',onClick);
  return b;
}
function card(title,icon){
  const c=el('section',undefined,'v241-card');
  const h=el('h3');
  h.append(el('span',icon,'v241-ico'),el('span',title));
  c.append(h);
  return c;
}
function badge(text,kind){return el('span',text,'v241-badge'+(kind?' '+kind:''));}
function hint(text){return el('p',text,'v241-hint');}

/* ---------- 只读旧版存档 ---------- */
function read(key){
  try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}
}
function lessons(){
  const d=root.DigitalV18Lessons;
  return d&&Array.isArray(d.lessons)?d.lessons:[];
}
function study(){
  const s=read(KEYS.course)||{};
  return {
    completed:Array.isArray(s.completed)?s.completed:[],
    last:typeof s.last==='string'?s.last:'',
    attempts:s.attempts&&typeof s.attempts==='object'?s.attempts:{}
  };
}
function wrongCount(){
  const exam=read(KEYS.exam)||{};
  const v15=exam.mistakes&&typeof exam.mistakes==='object'
    ?Object.keys(exam.mistakes).filter(k=>!exam.mistakes[k].corrected).length:0;
  const base=read(KEYS.base)||{};
  const v11=base.answers&&typeof base.answers==='object'
    ?Object.values(base.answers).filter(a=>a&&a.correct===false).length:0;
  return v15+v11;
}
function recentLabs(){
  const state=read(KEYS.resources)||{};
  const keys=Array.isArray(state.recent)?state.recent.slice(0,4):[];
  let rows=[];
  try{
    const all=root.DigitalV22Tools&&root.DigitalV22Tools.catalog?root.DigitalV22Tools.catalog():[];
    rows=keys.map(k=>all.find(r=>r.key===k)).filter(Boolean);
  }catch(_){/* 目录尚未就绪时退化为只显示键名 */}
  if(!rows.length)rows=keys.map(k=>({key:k,title:k}));
  return rows;
}

/* ---------- 主题（复用 V1.1 状态） ---------- */
function syncTheme(){
  const dark=doc.body.classList.contains('v11-dark');
  doc.documentElement.setAttribute('data-theme',dark?'dark':'light');
  const btn=doc.getElementById('v241-theme-btn');
  if(btn)btn.textContent=dark?'☀ 切换浅色':'☾ 切换深色';
}
function toggleTheme(){
  // 直接调用旧版按钮，让 V1.1 自己负责保存，避免产生第二份主题状态。
  const old=doc.getElementById('v11-theme');
  if(old)old.click();
  else{doc.body.classList.toggle('v11-dark');syncTheme();}
}

/* ---------- 首页仪表盘 ---------- */
function openLesson(id){
  const api=root.DigitalV18Navigation;
  if(api&&typeof api.openLesson==='function')api.openLesson(id);
  else if(typeof root.show==='function')root.show('v18-school');
}
function openModule(id){
  if(typeof root.show!=='function'||!doc.getElementById(id))return;
  root.show(id);
  // V2.0 会折叠侧栏；进入具体模块时展开导航，避免用户迷路。
  const toggle=doc.querySelector('.v20-nav-toggle');
  if(toggle&&toggle.getAttribute('aria-expanded')==='false')toggle.click();
}
function nextLesson(){
  const all=lessons(),done=new Set(study().completed);
  return all.find(l=>!done.has(l.id))||all[0]||null;
}
function chapterStats(){
  const all=lessons(),done=new Set(study().completed);
  const out=[];
  for(let c=1;c<=8;c++){
    const list=all.filter(l=>l.chapter===c);
    out.push({chapter:c,total:list.length,done:list.filter(l=>done.has(l.id)).length});
  }
  return out;
}

function progressCard(){
  const all=lessons(),s=study();
  const done=Math.min(s.completed.length,all.length||32);
  const total=all.length||32;
  const base=read(KEYS.base)||{};
  const chapters=Array.isArray(base.completed)
    ?base.completed.filter(x=>/^c[1-8]$/.test(x)).length:0;
  const c=card('当前学习进度','①');
  const stat=el('div',undefined,'v241-stat');
  stat.append(el('strong',done+'/'+total),el('span','节零基础讲义已掌握'));
  c.append(stat);
  const bar=el('div',undefined,'v241-progress');
  const fill=el('span');fill.style.width=(total?Math.round(done/total*100):0)+'%';
  bar.append(fill);c.append(bar);
  c.append(el('p','章节进度 '+chapters+'/8 章；错题待复习 '+wrongCount()+' 条。'));
  return c;
}
function continueCard(){
  const all=lessons(),s=study();
  const current=all.find(l=>l.id===s.last)||all[0];
  const c=card('继续上次学习','②');
  c.append(el('p',current?current.title:'从第一节开始学习，逐节建立概念。'));
  c.append(button('继续学习 →',()=>openLesson(current?current.id:'l1-1')));
  return c;
}
function recommendCard(){
  const n=nextLesson();
  const c=card('推荐下一节','③');
  c.append(el('p',n?'第 '+n.chapter+' 章 · 第 '+n.index+' 节｜'+n.title:'全部讲义已完成，建议进入章节测试巩固。'));
  c.append(hint('按未完成的第一节顺序推荐，避免跳跃造成概念断层。'));
  c.append(button('开始这一节',()=>openLesson(n?n.id:'l1-1')));
  return c;
}
function roadmapCard(){
  const c=card('八章学习路线','④');c.classList.add('v241-wide');
  const wrap=el('div',undefined,'v241-chips');
  chapterStats().forEach(x=>{
    const label='第 '+x.chapter+' 章 · '+x.done+'/'+x.total;
    const b=button(label,()=>openModule('c'+x.chapter),'v241-chip');
    if(x.total&&x.done===x.total)b.append(el('span','✓','v241-chip-done'));
    wrap.append(b);
  });
  c.append(wrap,hint('点击章节进入精讲；括号内为该章 32 节讲义的完成数。'));
  return c;
}
function recentCard(){
  const c=card('最近使用的互动实验','⑤');
  const rows=recentLabs();
  if(!rows.length){
    c.append(el('p','还没有访问记录。建议从补码、卡诺图或 555 实验开始。'));
    const wrap=el('div',undefined,'v241-chips');
    [['补码','m1'],['卡诺图','m2'],['555 定时器','m7']].forEach(([t,id])=>
      wrap.append(button(t,()=>openModule(id),'v241-chip')));
    c.append(wrap);
  }else{
    const list=el('ul',undefined,'v241-list');
    rows.forEach(r=>{
      const li=el('li');
      li.append(el('span',r.title));
      li.append(button('打开',()=>openModule(r.key),'v241-chip'));
      list.append(li);
    });
    c.append(list);
  }
  return c;
}
function wrongCard(){
  const n=wrongCount();
  const c=card('待复习错题','⑥');
  c.append(el('p',n?'还有 '+n+' 条错题需要复习。':'暂时没有待复习错题，保持得不错。'));
  c.append(button('打开错题复习',()=>openModule('v15-exam'),'v241-btn soft'));
  return c;
}
function examCard(){
  const exam=read(KEYS.exam)||{};
  const times=Array.isArray(exam.history)?exam.history.length:0;
  const c=card('章节测试入口','⑦');
  c.append(el('p','累计考试 '+times+' 次；支持章节测试、综合模拟与错题复习三种模式。'));
  c.append(button('进入考试中心',()=>openModule('v15-exam'),'v241-btn soft'));
  return c;
}
function searchCard(){
  const c=card('课程资源搜索','⑧');
  const row=el('div',undefined,'v241-search');
  const input=el('input',undefined,'v241-input');
  input.type='search';input.placeholder='搜索讲义、互动实验、习题或 3D 场景';
  input.setAttribute('aria-label','课程资源搜索');
  const target=()=>doc.querySelector('#v22-resource-section .v22-search');
  const forward=()=>{
    const t=target();
    if(!t)return;
    t.value=input.value;
    t.dispatchEvent(new Event('input',{bubbles:true}));
  };
  input.addEventListener('input',forward);
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      forward();
      const section=doc.getElementById('v22-resource-section');
      if(section)section.scrollIntoView({behavior:'smooth',block:'start'});
    }
  });
  row.append(input,button('查看结果',()=>{
    forward();
    const section=doc.getElementById('v22-resource-section');
    if(section)section.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  c.append(row,hint('复用 V2.2 统一资源库，不重复实现一套搜索逻辑。'));
  return c;
}

function buildDashboard(){
  const wrap=el('div',undefined,'v241-dashboard');
  wrap.id='v241-dashboard';
  const top=el('header',undefined,'v241-topbar');
  const left=el('div');
  left.append(el('h2','数字电子技术基础 · 互动课堂 V2.4.1'));
  left.append(el('p','零基础 → 原理 → 图解 → 实验 → 练习 → 复盘'));
  const actions=el('div',undefined,'v241-topbar-actions');
  const themeBtn=button('☾ 切换深色',toggleTheme,'v241-btn ghost');themeBtn.id='v241-theme-btn';
  const legacyBtn=button('▸ 显示旧版工具',()=>{
    const compact=doc.body.classList.toggle('v241-compact');
    legacyBtn.textContent=compact?'▸ 显示旧版工具':'▾ 收起旧版工具';
  },'v241-btn ghost');
  actions.append(themeBtn,legacyBtn);
  top.append(left,actions);
  wrap.append(top);
  const grid=el('div',undefined,'v241-grid');
  [progressCard(),continueCard(),recommendCard(),roadmapCard(),
   recentCard(),wrongCard(),examCard(),searchCard()].forEach(x=>grid.append(x));
  wrap.append(grid);
  syncTheme();
  return wrap;
}

/* ---------- 安装与刷新（单个观察者 + 一次 show 包装） ---------- */
let raf=0;
function install(){
  const home=doc.getElementById('v20-home');
  if(!home)return;
  // 标记旧版说明面板，供紧凑模式样式定位；不移动、不删除任何节点。
  [...home.children].forEach(n=>{
    if((n.textContent||'').includes('学习数据说明'))n.classList.add('v241-legacy-note');
  });
  const old=doc.getElementById('v241-dashboard');
  if(old)old.remove();
  home.insertBefore(buildDashboard(),home.firstChild);
}
function scheduleInstall(){
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;install();});
}
function init(){
  doc.documentElement.classList.add('v241-design');
  doc.body.classList.add('v241-compact');
  syncTheme();
  install();
  // 主题由 V1.1 的 body.v11-dark 驱动；只观察 class 变化，不轮询。
  new MutationObserver(syncTheme).observe(doc.body,{attributes:true,attributeFilter:['class']});
  // V2.0 重绘首页时重新注入仪表盘；用 rAF 合批，避免重复 DOM 更新。
  const home=doc.getElementById('v20-home');
  if(home)new MutationObserver(()=>{
    if(!doc.getElementById('v241-dashboard'))scheduleInstall();
  }).observe(home,{childList:true});
  // 回到首页时刷新进度、推荐与最近访问。
  const show=root.show;
  if(typeof show==='function'){
    root.show=function(id){
      const result=show.apply(this,arguments);
      if(id==='v20-home')scheduleInstall();
      return result;
    };
  }
  // 页面卸载时释放我们自己的观察者与待执行帧（不触碰旧版定时器）。
  root.addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);raf=0;},{once:true});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
else init();

root.DigitalV241UI=Object.freeze({el,button,card,badge,hint,read,openLesson,openModule,
  syncTheme,toggleTheme,install,KEYS});
})(typeof window!=='undefined'?window:globalThis);
