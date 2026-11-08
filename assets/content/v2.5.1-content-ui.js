/* ==========================================================================
   V2.5.1 教学内容呈现层（阶段 1）
   --------------------------------------------------------------------------
   职责：
   1. 讲义页：把四块深读内容以「可折叠面板」插进第一部分 / 第二部分，
      不新增 .v18-panel，因此不改变 V2.4.1 的七段学习路径与既有断言；
   2. 案例库：新增独立模块 #v251-cases，支持按章筛选、搜索、十三部分详情；
   3. 互动：七段数码管小实验（与案例真值表同源）、案例 → 实验室/章节模块跳转；
   4. 综合项目：#v251-projects（有数据才显示入口）。
   约束：只读既有讲义与实验接口，不写任何旧版 localStorage 键。
   ========================================================================== */
(function(root){
'use strict';
const doc=document;
const C=root.DigitalV251Content;
if(!C){console.error('[V2.5.1] 内容注册中心未加载，呈现层退出');return;}
const UI=root.DigitalV241UI;
const el=UI&&UI.el?UI.el:function(tag,text,cls){
 const n=doc.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
};
const CASES='v251-cases',PROJECTS='v251-projects';

/* 与案例 1-1 真值表完全同源：段序 a b c d e f g，1=亮（共阴）。 */
const SEG_TABLE=['1111110','0110000','1101101','1111001','0110011',
 '1011011','1011111','1111000','1111111','1111011'];
const SEG_NAMES=['a','b','c','d','e','f','g'];

function button(label,fn,cls){
 const b=el('button',label,cls||'v251-btn');
 b.type='button';b.addEventListener('click',fn);return b;
}
function paras(text,cls){
 const box=doc.createDocumentFragment();
 String(text).split(/\n{2,}/).forEach(t=>{if(t.trim())box.append(el('p',t.trim(),cls||'v251-p'));});
 return box;
}
function lessonId(){
 const L=root.DigitalV241Learning;
 if(L&&typeof L.currentLessonId==='function')return L.currentLessonId();
 try{
  const s=JSON.parse(localStorage.getItem('digital-course-v1.8-study')||'null');
  return s&&typeof s.last==='string'?s.last:'l1-1';
 }catch(_){return 'l1-1';}
}
function pane(){return doc.querySelector('#v18-school .v18-main');}
function panels(){const p=pane();return p?[...p.children].filter(n=>n.classList&&n.classList.contains('v18-panel')):[];}
function panelByHead(word){return panels().find(p=>{
 const h=p.querySelector('h2');return h&&h.textContent.includes(word);
})||null;}

/* ---------------------------- 折叠面板 ---------------------------- */
function fold(kind,title,body,open){
 const d=el('details','','v251-deep');
 d.dataset.kind=kind;
 if(open)d.open=true;
 const s=el('summary','','v251-deep-head');
 s.append(el('span','','v251-deep-ico'),el('span',title,'v251-deep-title'));
 d.append(s);
 const wrap=el('div','','v251-deep-body');
 if(typeof body==='string')wrap.append(paras(body));
 else wrap.append(body);
 d.append(wrap);
 return d;
}

function exampleBody(ex){
 const box=doc.createDocumentFragment();
 box.append(el('p','题目：'+ex.question,'v251-example-q'));
 const ol=el('ol','','v251-example-steps');
 ex.steps.forEach(s=>ol.append(el('li',s)));
 box.append(ol);
 const ans=el('div','','v251-answer');
 ans.append(el('strong','答案：'),doc.createTextNode(ex.answer));
 box.append(ans);
 if(ex.check){
  const chk=el('p','自查：'+ex.check,'v251-check');
  box.append(chk);
 }
 return box;
}
function mistakesBody(list){
 const box=doc.createDocumentFragment();
 list.forEach((m,i)=>{
  const item=el('div','','v251-mistake');
  item.append(el('p','误区 '+(i+1)+'：'+m.wrong,'v251-wrong'));
  item.append(el('p','为什么错：'+m.why));
  item.append(el('p','正确做法：'+m.fix,'v251-fix'));
  box.append(item);
 });
 return box;
}

/* ------------------------ 讲义页：注入深读 ------------------------ */
function caseLinksFor(chapter){
 const list=C.casesOf(chapter);
 if(!list.length)return null;
 const box=el('div','','v251-case-links');
 box.append(el('p','本章实战案例（看完理论就去动手）：','v251-case-links-title'));
 const row=el('div','','v251-chip-row');
 list.forEach(c=>{
  row.append(button('📗 '+c.title,()=>openCase(c.id),'v251-btn soft'));
 });
 box.append(row);
 return box;
}

function injectLesson(){
 const p=pane();if(!p)return;
 const id=lessonId(),data=C.lessons[id];
 if(!data)return;
 const theory=panelByHead('第一部分'),worked=panelByHead('第二部分');
 if(!theory||!worked)return;
 if(p.dataset.v251Lesson===id&&p.querySelector('.v251-deep'))return;
 p.querySelectorAll('.v251-deep,.v251-deep-tools,.v251-case-links').forEach(n=>n.remove());
 p.dataset.v251Lesson=id;

 const tools=el('div','','v251-deep-tools');
 tools.append(el('span','本篇另有 4 个深读模块','v251-deep-tools-label'));
 const all=()=>[...p.querySelectorAll('.v251-deep')];
 tools.append(button('全部展开',()=>all().forEach(d=>{d.open=true;}),'v251-btn soft'),
  button('全部收起',()=>all().forEach(d=>{d.open=false;}),'v251-btn soft'));
 theory.insertBefore(tools,theory.firstChild);

 const beginner=fold('beginner','零基础引入 · 先建立一个直觉',data.beginner,true);
 const principle=fold('principle','深入原理 · 为什么必须这样定义',data.principle,false);
 theory.append(beginner,principle);

 const example=fold('example','分步计算例题 · 再跟着算一遍',exampleBody(data.example),false);
 const mistakes=fold('mistakes','常见错误解析 · 三个高频误区',mistakesBody(data.mistakes),false);
 worked.append(example,mistakes);

 const header=panels()[0];
 const links=caseLinksFor(Number(id.split('-')[0].slice(1)));
 if(header&&links&&!header.querySelector('.v251-case-links'))header.append(links);
}

/* -------------------------- 案例库模块 -------------------------- */
function buildCaseSection(main){
 const sec=el('section','','mod');sec.id=CASES;
 const head=el('div','','mod-h');
 head.append(el('div','V2.5.1 · 实用案例库','crumb'),
  el('h1','从真值表到能用的电路'),
  el('p','每个案例都按同一套十三部分展开：需求、框图、真值表、表达式、器件、搭建、实验验证、测试、排错、拓展、自评。','claim'));
 sec.append(head);

 const bar=el('div','','v251-filter');
 const chips=el('div','','v251-chip-row');
 const search=el('input');search.type='search';search.className='v251-search';
 search.placeholder='搜索案例标题或知识点';search.setAttribute('aria-label','搜索案例');
 bar.append(chips,search);sec.append(bar);

 const list=el('div','','v251-case-grid');sec.append(list);
 const detail=el('div','','v251-detail');detail.hidden=true;sec.append(detail);
 main.append(sec);

 let chapter=0,keyword='';
 function card(c){
  const box=el('article','','v251-card');
  const top=el('div','','v251-card-top');
  top.append(el('span','第 '+c.chapter+' 章','v251-badge'),
   el('span',c.level,'v251-badge soft'),el('span',c.minutes+' 分钟','v251-badge ghost'));
  box.append(top);
  box.append(el('h3',c.title,'v251-card-title'));
  box.append(el('p',c.goal,'v251-card-goal'));
  box.append(button('查看案例 →',()=>openCase(c.id),'v251-btn'));
  return box;
 }
 function renderList(){
  list.replaceChildren();
  const items=C.cases.filter(c=>(chapter===0||c.chapter===chapter)&&
   (!keyword||(c.title+c.goal+c.concepts.join('')).toLowerCase().includes(keyword)));
  if(!items.length){list.append(el('p','没有匹配的案例，换个关键词或选择「全部章节」。','v251-empty'));return;}
  items.forEach(c=>list.append(card(c)));
 }
 function chip(label,value){
  const b=button(label,()=>{
   chapter=value;
   [...chips.children].forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.ch)===value)));
   renderList();
  },'v251-chip');
  b.dataset.ch=String(value);
  b.setAttribute('aria-pressed',String(value===0));
  return b;
 }
 chips.append(chip('全部章节',0));
 for(let ch=1;ch<=8;ch++)if(C.casesOf(ch).length)chips.append(chip('第 '+ch+' 章',ch));
 search.addEventListener('input',()=>{keyword=search.value.trim().toLowerCase();renderList();});
 renderList();
 return sec;
}

/* ---------------------- 案例详情：十三部分 ---------------------- */
function kvTable(rows){
 const wrap=el('div','','v251-table-wrap');
 const t=el('table','','v251-table');
 const tb=el('tbody');
 rows.forEach(r=>{
  const tr=el('tr');
  tr.append(el('th',r.k),el('td',r.v));
  tb.append(tr);
 });
 t.append(tb);wrap.append(t);return wrap;
}
function dataTable(spec){
 const wrap=el('div','','v251-table-wrap');
 const t=el('table','','v251-table');
 if(spec.caption)t.append(el('caption',spec.caption));
 const thead=el('thead'),tr=el('tr');
 spec.head.forEach(h=>tr.append(el('th',h)));
 thead.append(tr);t.append(thead);
 const tb=el('tbody');
 spec.rows.forEach(r=>{
  const row=el('tr');
  r.forEach(c=>row.append(el('td',c)));
  tb.append(row);
 });
 t.append(tb);wrap.append(t);
 if(spec.note)wrap.append(el('p',spec.note,'v251-note'));
 return wrap;
}
function flowDiagram(block){
 const box=el('div','','v251-flow');
 block.flow.forEach((step,i)=>{
  if(i)box.append(el('span','→','v251-arrow'));
  box.append(el('span',step,'v251-flow-step'));
 });
 const wrap=el('div','');
 wrap.append(box);
 if(block.text)wrap.append(el('p',block.text,'v251-p'));
 return wrap;
}
function listBlock(items){
 const ul=el('ul','','v251-list');
 items.forEach(t=>ul.append(el('li',t)));
 return ul;
}

/* 七段小实验：与 SEG_TABLE 同源，非法码明确显示为「无关项」。 */
function sevenSegWidget(){
 const box=el('div','','v251-sevenseg');
 const stage=el('div','','v251-sevenseg-stage');
 const NS='http://www.w3.org/2000/svg';
 const svg=doc.createElementNS(NS,'svg');
 svg.setAttribute('viewBox','0 0 120 200');
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label','七段数码管显示');
 const rects={};
 const geo={
  a:[22,8,76,12],b:[88,22,12,66],c:[88,104,12,66],d:[22,176,76,12],
  e:[10,104,12,66],f:[10,22,12,66],g:[22,92,76,12]
 };
 SEG_NAMES.forEach(name=>{
  const [x,y,w,h]=geo[name];
  const r=doc.createElementNS(NS,'rect');
  r.setAttribute('x',x);r.setAttribute('y',y);
  r.setAttribute('width',w);r.setAttribute('height',h);
  r.setAttribute('rx',3);
  r.setAttribute('class','v251-seg');
  rects[name]=r;svg.append(r);
 });
 stage.append(svg);
 const panel=el('div','','v251-sevenseg-panel');
 const readout=el('p','','v251-sevenseg-readout');readout.setAttribute('aria-live','polite');
 const row=el('div','','v251-chip-row');
 const keys=[];
 for(let i=3;i>=0;i--){
  const b=button('B'+i+'=0',()=>{
   bits[i]=bits[i]?0:1;sync();
  },'v251-bit');
  b.dataset.bit=String(i);keys.push(b);row.append(b);
 }
 const quick=el('div','','v251-chip-row');
 for(let d=0;d<=9;d++)quick.append(button(String(d),()=>{setValue(d);},'v251-chip'));
 panel.append(row,quick,readout);
 box.append(stage,panel);
 let bits=[1,0,1,0]; // 初始 0101（十进制 5），按 B0~B3 存放

 function segList(n){
  if(n>9)return null;
  return SEG_TABLE[n].split('').map((v,i)=>v==='1'?SEG_NAMES[i]:null).filter(Boolean);
 }
 function sync(){
  const n=bits[3]*8+bits[2]*4+bits[1]*2+bits[0];
  const shown=[bits[3],bits[2],bits[1],bits[0]].join('');
  const on=segList(n);
  SEG_NAMES.forEach(name=>{
   const lit=on?on.includes(name):false;
   rects[name].setAttribute('class','v251-seg'+(lit?' on':''));
  });
  keys.forEach((b,idx)=>{
   const i=3-idx;
   b.textContent='B'+i+'='+bits[i];
   b.setAttribute('aria-pressed',String(bits[i]===1));
  });
  readout.textContent=on
   ? '输入 '+shown+'（B3…B0，十进制 '+n+'）→ 点亮 '+on.join(' ')+'（段码 '+SEG_TABLE[n]+' / 0x'+parseInt(SEG_TABLE[n],2).toString(16).toUpperCase()+'）'
   : '输入 '+shown+'（B3…B0，十进制 '+n+'）超出 8421BCD 的合法范围，属于无关项：本设计不保证输出，实际芯片可能全灭或显示怪字符。';
  readout.classList.toggle('v251-warn',!on);
  box.dataset.value=String(n);
  box.dataset.seg=on?SEG_TABLE[n]:'';
 }
 function setValue(d){
  const n=Math.max(0,Math.min(9,d));
  bits=[n&1,(n>>1)&1,(n>>2)&1,(n>>3)&1];
  sync();
 }
 box.setValue=setValue;
 sync();
 return box;
}

function caseDetail(c){
 const box=doc.createDocumentFragment();
 const back=button('← 返回案例列表',()=>{
  const sec=doc.getElementById(CASES);
  if(!sec)return;
  sec.querySelector('.v251-case-grid').hidden=false;
  sec.querySelector('.v251-detail').hidden=true;
  sec.querySelector('.v251-filter').hidden=false;
  sec.scrollIntoView({block:'start',behavior:'smooth'});
 },'v251-btn soft');
 box.append(back);
 const head=el('div','','v251-detail-head');
 head.append(el('div','第 '+c.chapter+' 章 · '+c.level+' · 建议 '+c.minutes+' 分钟','v251-badge'));
 head.append(el('h2',c.title,'v251-detail-title'));
 head.append(el('p','目标：'+c.goal,'v251-detail-goal'));
 box.append(head);

 const body=el('div','','v251-detail-body');
 const sec=(label,node)=>{
  const s=el('section','','v251-part');
  s.append(el('h3',label,'v251-part-title'));
  s.append(node);
  body.append(s);
 };
 sec('一、案例背景与工程目标',paras(c.bg));
 sec('二、用到的知识点',listBlock(c.concepts));
 sec('三、功能需求与指标',kvTable(c.spec));
 sec('四、系统框图与信号流',flowDiagram(c.block));
 sec('五、真值表 / 状态表',dataTable(c.table));
 const logicBox=el('div','');
 c.logic.items.forEach(item=>{
  const row=el('div','','v251-logic-row');
  row.append(el('span',item.seg,'v251-logic-label'),el('code',item.expr,'v251-expr'));
  logicBox.append(row);
 });
 logicBox.append(el('p',c.logic.note,'v251-note'));
 sec('六、逻辑表达式与化简',logicBox);
 const partsWrap=el('div','','v251-table-wrap');
 const pt=el('table','','v251-table');
 const ph=el('thead'),phr=el('tr');
 ['器件','数量','说明'].forEach(h=>phr.append(el('th',h)));
 ph.append(phr);pt.append(ph);
 const pb=el('tbody');
 c.parts.forEach(p=>{
  const tr=el('tr');
  tr.append(el('td',p.name),el('td',p.qty),el('td',p.note));
  pb.append(tr);
 });
 pt.append(pb);partsWrap.append(pt);
 sec('七、器件与参数（理想模型）',partsWrap);
 const stepsOl=el('ol','','v251-steps');
 c.steps.forEach(s=>{
  const li=el('li','');
  li.append(el('strong',s.t),el('span',s.d,'v251-step-d'));
  stepsOl.append(li);
 });
 sec('八、搭建步骤',stepsOl);

 const labBox=el('div','','v251-lab-box');
 labBox.append(el('p',c.lab.hint,'v251-p'));
 const labRow=el('div','','v251-chip-row');
 if(c.lab.widget==='sevenseg')labBox.append(sevenSegWidget());
 if(c.lab.module){
  labRow.append(button('打开章节互动模块',()=>{
   if(typeof root.show==='function')root.show(c.lab.module);
  },'v251-btn'));
 }
 if(c.lab.exampleId){
  labRow.append(button('⚡ 打开实验：'+c.lab.exampleId,()=>openExample(c.lab.exampleId),'v251-btn'));
 }
 if(labRow.children.length)labBox.append(labRow);
 sec('九、在互动模块中验证',labBox);

 const testWrap=el('div','','v251-table-wrap');
 const tt=el('table','','v251-table');
 const th=el('thead'),thr=el('tr');
 ['输入 / 操作','预期现象','判定理由'].forEach(h=>thr.append(el('th',h)));
 th.append(thr);tt.append(th);
 const tbody=el('tbody');
 c.tests.forEach(t=>{
  const tr=el('tr');
  tr.append(el('td',t.input),el('td',t.expect),el('td',t.why));
  tbody.append(tr);
 });
 tt.append(tbody);testWrap.append(tt);
 sec('十、测试用例与预期',testWrap);

 const troubleBox=el('div','');
 c.trouble.forEach(t=>{
  const item=el('div','','v251-trouble');
  item.append(el('p','现象：'+t.symptom,'v251-wrong'));
  item.append(el('p','原因：'+t.cause));
  item.append(el('p','处理：'+t.fix,'v251-fix'));
  troubleBox.append(item);
 });
 sec('十一、常见故障排查',troubleBox);
 sec('十二、拓展任务',listBlock(c.extend));

 const sumBox=el('div','');
 sumBox.append(el('h4','带走这几条','v251-sub'));
 sumBox.append(listBlock(c.summary.points));
 sumBox.append(el('h4','自评量规','v251-sub'));
 const rubricWrap=el('div','','v251-table-wrap');
 const rt=el('table','','v251-table');
 const rh=el('thead'),rhr=el('tr');
 ['等级','达到的表现'].forEach(h=>rhr.append(el('th',h)));
 rh.append(rhr);rt.append(rh);
 const rb=el('tbody');
 c.summary.rubric.forEach(r=>{
  const tr=el('tr');
  tr.append(el('td',r.level),el('td',r.desc));
  rb.append(tr);
 });
 rt.append(rb);rubricWrap.append(rt);
 sumBox.append(rubricWrap);
 sec('十三、小结与自评量规',sumBox);

 box.append(body);
 return box;
}

/* 案例 1-2 的实验室电路：4 开关 + 3 异或 + 4 LED，全部用 V1.6 引擎原语。 */
function buildGray4(){
 const M=root.DigitalMixedCircuit;
 if(!M)return null;
 let c=M.empty();
 const put=(type,x,y)=>{c=M.add(c,type,x,y);return c.nodes[c.nodes.length-1].id;};
 const wire=(a,o,b,i)=>{c=M.connect(c,a,o,b,i);};
 const b3=put('SWITCH',40,40),b2=put('SWITCH',40,180),b1=put('SWITCH',40,320),b0=put('SWITCH',40,460);
 const x2=put('XOR',280,60),x1=put('XOR',280,220),x0=put('XOR',280,380);
 const g3=put('LED',540,40),g2=put('LED',540,180),g1=put('LED',540,320),g0=put('LED',540,460);
 wire(b3,0,g3,0);
 wire(b3,0,x2,0);wire(b2,0,x2,1);wire(x2,0,g2,0);
 wire(b2,0,x1,0);wire(b1,0,x1,1);wire(x1,0,g1,0);
 wire(b1,0,x0,0);wire(b0,0,x0,1);wire(x0,0,g0,0);
 M.validate(c);
 return c;
}
function openExample(id){
 const lab=root.DigitalV25Lab;
 if(!lab){alert('实验模块尚未加载完成，请稍后重试。');return false;}
 if(id==='gray4'){
  const c=buildGray4();
  if(!c)return false;
  if(typeof root.show==='function')root.show('v25-lab');
  lab.loadCircuit(c,'案例 1-2：4 位二进制 → 格雷码转换器');
  return true;
 }
 if(typeof lab.openCase==='function')return lab.openCase(id);
 return false;
}

/* ---------------------- 对外：打开案例 / 项目 ---------------------- */
let lastCase=null;
function openCase(id){
 const c=C.caseById(id);
 if(!c)return false;
 const sec=doc.getElementById(CASES);
 if(!sec)return false;
 const grid=sec.querySelector('.v251-case-grid');
 const detail=sec.querySelector('.v251-detail');
 const filter=sec.querySelector('.v251-filter');
 grid.hidden=true;filter.hidden=true;detail.hidden=false;
 detail.replaceChildren(caseDetail(c));
 lastCase=id;
 if(typeof root.show==='function')root.show(CASES);
 sec.scrollIntoView({block:'start'});
 return true;
}

function buildProjectSection(main){
 if(!C.projects.length)return null;
 const sec=el('section','','mod');sec.id=PROJECTS;
 const head=el('div','','mod-h');
 head.append(el('div','V2.5.1 · 综合项目','crumb'),
  el('h1','四个能讲清楚的完整系统'),
  el('p','从需求、框图、模块设计到联调与验收，每个项目都给出可检查的阶段成果。','claim'));
 sec.append(head);
 const list=el('div','','v251-case-grid');sec.append(list);
 const detail=el('div','','v251-detail');detail.hidden=true;sec.append(detail);
 C.projects.forEach(p=>{
  const box=el('article','','v251-card');
  const top=el('div','','v251-card-top');
  top.append(el('span','综合项目','v251-badge'),el('span',p.level||'综合','v251-badge soft'));
  box.append(top);
  box.append(el('h3',p.title,'v251-card-title'));
  box.append(el('p',p.bg.slice(0,90)+'…','v251-card-goal'));
  box.append(button('查看项目 →',()=>openProject(p.id),'v251-btn'));
  list.append(box);
 });
 main.append(sec);
 return sec;
}
function openProject(id){
 const p=C.projectById(id);
 if(!p)return false;
 const sec=doc.getElementById(PROJECTS);
 if(!sec)return false;
 sec.querySelector('.v251-case-grid').hidden=true;
 const detail=sec.querySelector('.v251-detail');
 detail.hidden=false;
 const frag=doc.createDocumentFragment();
 frag.append(button('← 返回项目列表',()=>{
  sec.querySelector('.v251-case-grid').hidden=false;detail.hidden=true;
 },'v251-btn soft'));
 frag.append(el('h2',p.title,'v251-detail-title'));
 frag.append(el('p','目标：'+p.goal,'v251-detail-goal'));
 const body=el('div','','v251-detail-body');
 [['bg','一、项目背景与最终形态'],['spec','二、指标与验收标准'],['block','三、系统框图与模块划分'],
  ['plan','四、阶段计划与里程碑'],['detail','五、关键模块设计'],['integration','六、联调顺序与排错'],
  ['test','七、测试记录表'],['review','八、交付自评量规']].forEach(([k,label])=>{
  const s=el('section','','v251-part');
  s.append(el('h3',label,'v251-part-title'));
  const v=p[k];
  if(Array.isArray(v))s.append(Array.isArray(v[0])?dataTable({head:v[0],rows:v.slice(1)}):listBlock(v));
  else if(typeof v==='string')s.append(paras(v));
  else s.append(paras(JSON.stringify(v,null,2)));
  body.append(s);
 });
 frag.append(body);
 detail.replaceChildren(frag);
 if(typeof root.show==='function')root.show(PROJECTS);
 return true;
}

/* ---------------------------- 挂载 ---------------------------- */
function buildNav(nav){
 if(doc.querySelector('.nav-item[data-mod="'+CASES+'"]'))return;
 const ch=el('div','','chap');
 ch.append(el('div','实战与项目 · V2.5.1','chap-h'));
 if(C.cases.length){
  const a=el('div','','nav-item');a.dataset.mod=CASES;
  a.append(el('span','','dot'),el('span','📗 实用案例库'));
  ch.append(a);
 }
 if(C.projects.length){
  const b=el('div','','nav-item');b.dataset.mod=PROJECTS;
  b.append(el('span','','dot'),el('span','🧩 综合项目'));
  ch.append(b);
 }
 if(ch.children.length>1)nav.append(ch);
}
function init(){
 const main=doc.getElementById('main'),nav=doc.getElementById('nav');
 if(!main||!nav)return;
 if(C.cases.length&&!doc.getElementById(CASES))buildCaseSection(main);
 if(C.projects.length&&!doc.getElementById(PROJECTS))buildProjectSection(main);
 buildNav(nav);
 const p=pane();
 if(p){
  new MutationObserver(()=>{injectLesson();}).observe(p,{childList:true});
 }
 injectLesson();
 const hash=(location.hash||'').replace('#','');
 if(hash===CASES||hash===PROJECTS){
  if(doc.getElementById(hash)&&typeof root.show==='function')root.show(hash);
 }
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
else init();

root.DigitalV251ContentUI=Object.freeze({
 CASES,PROJECTS,
 openCase,openProject,injectLesson,openExample,
 SEG_TABLE:SEG_TABLE.slice(),
 buildGray4,
 currentCase:()=>lastCase
});
})(typeof window!=='undefined'?window:globalThis);
