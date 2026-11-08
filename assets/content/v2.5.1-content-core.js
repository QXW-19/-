/* ==========================================================================
   V2.5.1 教学内容注册中心（阶段 1）
   --------------------------------------------------------------------------
   本文件只做三件事：
   1. 提供讲义深读、实用案例、综合项目三类数据的注册入口；
   2. 用同一套结构约束校验内容，缺字段立刻报错，避免「空白页面」上线；
   3. 提供只读统计，供页面渲染与自动化测试共用同一事实来源。
   内容全部原创：不复制教材原文、不编造页码、不虚构器件参数。
   ========================================================================== */
(function(root){
'use strict';

/* 讲义深读四块固定结构：零基础引入 / 深入原理 / 分步计算例题 / 常见错误解析。 */
const LESSON_PARTS=['beginner','principle','example','mistakes'];

/* 实用案例十三部分固定结构，顺序即页面呈现顺序。 */
const CASE_PARTS=[
 ['bg','一、案例背景与工程目标'],
 ['concepts','二、用到的知识点'],
 ['spec','三、功能需求与指标'],
 ['block','四、系统框图与信号流'],
 ['table','五、真值表 / 状态表'],
 ['logic','六、逻辑表达式与化简'],
 ['parts','七、器件与参数（理想模型）'],
 ['steps','八、搭建步骤'],
 ['lab','九、在互动模块中验证'],
 ['tests','十、测试用例与预期'],
 ['trouble','十一、常见故障排查'],
 ['extend','十二、拓展任务'],
 ['summary','十三、小结与自评量规']
];
const CASE_KEYS=CASE_PARTS.map(x=>x[0]);

/* 综合项目八部分结构：从需求到联调，最后是交付自评。 */
const PROJECT_PARTS=[
 ['bg','一、项目背景与最终形态'],
 ['spec','二、指标与验收标准'],
 ['block','三、系统框图与模块划分'],
 ['plan','四、阶段计划与里程碑'],
 ['detail','五、关键模块设计'],
 ['integration','六、联调顺序与排错'],
 ['test','七、测试记录表'],
 ['review','八、交付自评量规']
];

const R={
 version:'2.5.1',
 reference:'阎石《数字电子技术基础》第六版（仅作知识顺序参考，全部为原创解说）',
 lessons:{},   // 讲义深读：id → {beginner,principle,example,mistakes,keywords}
 cases:[],     // 实用案例
 projects:[]   // 综合项目
};

function fail(msg){throw new Error('[V2.5.1 内容] '+msg);}
function text(v){
 if(typeof v==='string')return v.trim();
 if(Array.isArray(v))return v.join('');
 return '';
}
function nonEmpty(v){
 if(typeof v==='string')return v.trim().length>0;
 if(Array.isArray(v))return v.length>0;
 return v!==undefined&&v!==null;
}
/* 中文字符数：只统计实际汉字与数字字母，用于「内容不得注水」的下限检查。 */
function charCount(v){
 return text(v).replace(/\s+/g,'').length;
}

/* ---------- 注册：讲义深读 ---------- */
R.lesson=function(id,data){
 if(!/^l[1-8]-[1-4]$/.test(String(id||'')))fail('讲义 ID 非法：'+id);
 for(const k of LESSON_PARTS){
  if(!nonEmpty(data&&data[k]))fail(id+' 缺少深读模块 '+k);
 }
 const ex=data.example;
 if(!nonEmpty(ex.question)||!Array.isArray(ex.steps)||ex.steps.length<3||!nonEmpty(ex.answer)){
  fail(id+' 的分步例题必须含 question、至少 3 条 steps、answer');
 }
 if(!Array.isArray(data.mistakes)||data.mistakes.length<3){
  fail(id+' 至少需要 3 条常见错误解析');
 }
 data.mistakes.forEach((m,i)=>{
  if(!nonEmpty(m.wrong)||!nonEmpty(m.why)||!nonEmpty(m.fix))fail(id+' 第 '+(i+1)+' 条错误解析缺少 wrong/why/fix');
 });
 if(R.lessons[id])fail('讲义 '+id+' 重复注册');
 R.lessons[id]=data;
 return data;
};

/* ---------- 注册：实用案例 ---------- */
R.case=function(data){
 if(!data||!data.id)fail('案例缺少 id');
 if(R.cases.some(c=>c.id===data.id))fail('案例 '+data.id+' 重复注册');
 if(!(data.chapter>=1&&data.chapter<=8))fail(data.id+' 的 chapter 必须在 1~8');
 for(const k of CASE_KEYS){
  if(!nonEmpty(data[k]))fail(data.id+' 缺少第 '+k+' 部分（'+CASE_PARTS.find(p=>p[0]===k)[1]+'）');
 }
 const t=data.table;
 if(t&&(!Array.isArray(t.head)||!Array.isArray(t.rows)||t.rows.length<2)){
  fail(data.id+' 的真值表/状态表至少要有表头与 2 行数据');
 }
 if(!Array.isArray(data.tests)||data.tests.length<2)fail(data.id+' 至少需要 2 条测试用例');
 if(!Array.isArray(data.trouble)||data.trouble.length<2)fail(data.id+' 至少需要 2 条故障排查');
 R.cases.push(data);
 return data;
};

/* ---------- 注册：综合项目 ---------- */
R.project=function(data){
 if(!data||!data.id)fail('项目缺少 id');
 if(R.projects.some(p=>p.id===data.id))fail('项目 '+data.id+' 重复注册');
 for(const [k,label]of PROJECT_PARTS){
  if(!nonEmpty(data[k]))fail(data.id+' 缺少'+label);
 }
 R.projects.push(data);
 return data;
};

/* ---------- 查询 ---------- */
R.lessonIds=()=>Object.keys(R.lessons).sort();
R.casesOf=ch=>R.cases.filter(c=>c.chapter===ch);
R.caseById=id=>R.cases.find(c=>c.id===id)||null;
R.projectById=id=>R.projects.find(p=>p.id===id)||null;
R.chapterStats=()=>{
 const out=[];
 for(let ch=1;ch<=8;ch++){
  const lessons=Object.keys(R.lessons).filter(id=>Number(id.split('-')[0].slice(1))===ch);
  out.push({chapter:ch,lessons:lessons.length,cases:R.casesOf(ch).length});
 }
 return out;
};
R.stats=()=>({
 version:R.version,
 lessons:R.lessonIds().length,
 cases:R.cases.length,
 projects:R.projects.length,
 chapters:R.chapterStats()
});
R.LESSON_PARTS=LESSON_PARTS.slice();
R.CASE_PARTS=CASE_PARTS.map(x=>({key:x[0],label:x[1]}));
R.PROJECT_PARTS=PROJECT_PARTS.map(x=>({key:x[0],label:x[1]}));
R.charCount=charCount;

root.DigitalV251Content=Object.freeze(R);
})(typeof window!=='undefined'?window:globalThis);
