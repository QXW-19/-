/* V2.5.1 教学内容质量门（阶段 1：第一章）
 * 只用独立实现复算，不调用页面里的任何函数：
 *   1. 结构：四节深读齐全、每节四块、每案例十三部分；
 *   2. 体量：每节正文不少于 500 字，不得出现占位词；
 *   3. 正确性：七段段码、段表达式、格雷码表、补码 Cp/Cs/OV 全部逐行复算；
 *   4. 来源：不得出现伪造页码或「教材原文」式表述。
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');

let count=0;
function ok(cond,label){
 assert.ok(cond,label);
 count++;
 console.log('PASS '+label);
}

/* ---------- 载入内容数据（纯数据文件，不依赖 DOM） ---------- */
const sandbox={console:{log(){},error(){}},window:{}};
vm.createContext(sandbox);
const LESSON_DIR=path.join(root,'assets/content/lessons');
const CASE_DIR=path.join(root,'assets/content/cases');
const chapterFiles=dir=>fs.readdirSync(dir).filter(f=>/^ch\d{2}\.js$/.test(f)).sort();
const FILES=[
 'assets/content/v2.5.1-content-core.js',
 ...chapterFiles(LESSON_DIR).map(f=>'assets/content/lessons/'+f),
 ...chapterFiles(CASE_DIR).map(f=>'assets/content/cases/'+f),
 'assets/content/projects/v2.5.1-projects.js'
];
for(const f of FILES){
 vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),sandbox,{filename:f});
}
const C=sandbox.window.DigitalV251Content;
ok(C&&C.version==='2.5.1','内容注册中心已加载且版本为 2.5.1');

const lessons=C.lessonIds();
const chapterNums=[...new Set(lessons.map(id=>Number(id.split('-')[0].slice(1))))].sort((a,b)=>a-b);
ok(chapterNums.length>=1,'至少已注册一章深读讲义');
for(const ch of chapterNums){
 const ids=lessons.filter(id=>Number(id.split('-')[0].slice(1))===ch);
 ok(ids.length===4,'第 '+ch+' 章四节深读讲义齐全（当前 '+ids.length+' 节）');
 ok(C.casesOf(ch).length>=2,'第 '+ch+' 章至少 2 个实用案例（当前 '+C.casesOf(ch).length+' 个）');
}
ok(chapterNums.length===new Set(chapterFiles(LESSON_DIR).map(f=>Number(f.slice(2,4)))).size,
 '讲义文件与已注册章节一一对应');

/* ---------- 1. 结构 ---------- */
const text=v=>typeof v==='string'?v:(Array.isArray(v)?v.join(''):'');
for(const id of lessons){
 const l=C.lessons[id];
 for(const k of C.LESSON_PARTS){
  const v=k==='example'?l.example.question:(k==='mistakes'?l.mistakes.map(m=>m.wrong+m.why+m.fix).join(''):l[k]);
  ok(Boolean(text(v).trim()),id+' 的深读模块 '+k+' 非空');
 }
 ok(l.example.steps.length>=3,id+' 的分步例题至少 3 步');
 ok(l.mistakes.length>=3,id+' 至少 3 条常见错误解析');
 l.mistakes.forEach((m,i)=>{
  ok(Boolean(m.wrong&&m.why&&m.fix),id+' 第 '+(i+1)+' 条错误解析三段齐全');
 });
}

/* ---------- 2. 体量：每节 500~900 字左右 ---------- */
for(const id of lessons){
 const l=C.lessons[id];
 const body=[l.beginner,l.principle,l.example.question,l.example.steps.join(''),
  l.example.answer,l.example.check||'',l.mistakes.map(m=>m.wrong+m.why+m.fix).join('')].join('');
 const n=C.charCount(body);
 ok(n>=500,id+' 原创正文不少于 500 字（当前 '+n+' 字）');
}

const PLACEHOLDER=/待补充|TODO|Lorem|占位|敬请期待|此处省略/;
for(const id of lessons){
 const blob=JSON.stringify(C.lessons[id]);
 ok(!PLACEHOLDER.test(blob),id+' 不含占位文字');
}
const PAGE_REF=/第\s*\d+\s*页|教材原文|原文第/;
for(const id of lessons)ok(!PAGE_REF.test(JSON.stringify(C.lessons[id])),id+' 未伪造页码或原文');

/* ---------- 3. 案例结构 ---------- */
const cases=C.casesOf(1);
ok(cases.length>=2,'第一章至少 2 个实用案例（当前 '+cases.length+'）');
const CASE_KEYS=C.CASE_PARTS.map(p=>p.key);
ok(CASE_KEYS.length===13,'案例固定为十三部分');
for(const c of cases){
 for(const k of CASE_KEYS){
  const v=c[k];
  const present=typeof v==='string'?v.trim().length>0
   :(Array.isArray(v)?v.length>0:(v&&typeof v==='object'?Object.keys(v).length>0:false));
  ok(present,c.id+' 的第 '+k+' 部分存在');
 }
 ok(c.table.rows.length>=6,c.id+' 真值表/状态表至少 6 行');
 ok(c.tests.length>=2,c.id+' 至少 2 条测试用例');
 ok(c.trouble.length>=2,c.id+' 至少 2 条故障排查');
 ok(c.extend.length>=2,c.id+' 至少 2 个拓展任务');
 ok(c.summary.points.length>=3,c.id+' 小结至少 3 条');
 ok(c.summary.rubric.length>=3,c.id+' 自评量规至少 3 级');
 ok(!PLACEHOLDER.test(JSON.stringify(c)),c.id+' 不含占位文字');
 ok(!PAGE_REF.test(JSON.stringify(c)),c.id+' 未伪造页码或原文');
}

/* ---------- 4. 七段段码逐行复算 ---------- */
/* 独立定义：段名 → 0~9 时应点亮的段（共阴，1=亮）。 */
const SEG_SETS={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',
 5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
const ORDER='abcdefg';
const canonical=n=>ORDER.split('').map(s=>SEG_SETS[n].includes(s)?1:0).join('');

const c1=C.caseById('case-1-1');
const rows1=c1.table.rows.filter(r=>/^\d+$/.test(r[0])&&Number(r[0])<=9);
ok(rows1.length===10,'案例 1-1 列出 0~9 共 10 行');
for(const r of rows1){
 const n=Number(r[0]);
 const code=canonical(n);
 ok(r[1]===n.toString(2).padStart(4,'0'),'案例 1-1 的 '+n+' 行 BCD 码正确');
 ok(r[2]===code,'案例 1-1 的 '+n+' 行段码与独立计算一致（'+code+'）');
 ok(parseInt(code,2).toString(16).toUpperCase().padStart(2,'0')===r[3].toUpperCase(),
  '案例 1-1 的 '+n+' 行十六进制段码自洽');
}

/* 段表达式交叉验证：a = B3+B1+(B2⊙B0)，b = /B2+(B1⊙B0)。 */
function bits4(n){return [(n>>3)&1,(n>>2)&1,(n>>1)&1,n&1];}
let exprOK=true;
for(let n=0;n<=9;n++){
 const [b3,b2,b1,b0]=bits4(n);
 const aExpected=(b3||b1||(b2===b0?1:0))?1:0;
 const bExpected=(b2===0||(b1===b0?1:0))?1:0;
 const code=canonical(n);
 if(String(aExpected)!==code[0]||String(bExpected)!==code[1])exprOK=false;
}
ok(exprOK,'案例 1-1 给出的 a、b 两段表达式对 0~9 全部成立');

/* ---------- 5. 格雷码表复算 ---------- */
const c2=C.caseById('case-1-2');
const grayRows=c2.table.rows;
ok(grayRows.length===16,'案例 1-2 列出 16 个码');
const grayOf=n=>n^(n>>1);
for(let n=0;n<16;n++){
 const row=grayRows[n];
 ok(row[0]===String(n),'格雷码表第 '+n+' 行序号正确');
 ok(row[1]===n.toString(2).padStart(4,'0'),'格雷码表第 '+n+' 行二进制正确');
 ok(row[2]===grayOf(n).toString(2).padStart(4,'0'),'格雷码表第 '+n+' 行格雷码正确');
}
let adjacentOK=true;
for(let n=0;n<16;n++){
 const a=grayOf(n),b=grayOf((n+1)%16);
 let d=a^b,c2bit=0;
 while(d){c2bit+=d&1;d>>=1;}
 if(c2bit!==1)adjacentOK=false;
}
ok(adjacentOK,'格雷码 16 个码首尾相邻均只差 1 位（含 15→0）');

/* ---------- 6. 补码算例逐行复算 ---------- */
const c3=C.caseById('case-1-3');
for(const r of c3.table.rows){
 const m=r[1].match(/^([01]{4})\+([01]{4})$/);
 ok(Boolean(m),'案例 1-3 运算列格式正确：'+r[1]);
 const A=parseInt(m[1],2),B=parseInt(m[2],2);
 let carry=0,cp=0,cs=0;
 for(let i=0;i<4;i++){
  const ai=(A>>i)&1,bi=(B>>i)&1;
  if(i===3)cp=carry;
  const s=ai+bi+carry;
  carry=s>>1;
  if(i===3)cs=carry;
 }
 const sum=(A+B)&0xF;
 const signed=sum>=8?sum-16:sum;
 const ov=cp^cs;
 ok(r[2]===sum.toString(2).padStart(4,'0'),'案例 1-3 的 '+r[0]+' 和正确（'+r[2]+'）');
 const expectedRead=signed>0?'+'+signed:(signed<0?'−'+Math.abs(signed):'0');
 ok(r[3]===expectedRead,'案例 1-3 的 '+r[0]+' 读作 '+r[3]);
 ok(Number(r[4])===cp,'案例 1-3 的 '+r[0]+' Cp='+r[4]);
 ok(Number(r[5])===cs,'案例 1-3 的 '+r[0]+' Cs='+r[5]);
 ok(Number(r[6])===ov,'案例 1-3 的 '+r[0]+' OV='+r[6]);
 ok((r[7]==='溢出')===Boolean(ov),'案例 1-3 的 '+r[0]+' 溢出结论与 OV 一致');
}
const minus8=c3.table.rows.some(r=>r[0]==='−8−1'&&r[7]==='溢出');
ok(minus8,'案例 1-3 覆盖 −8−1 的下溢情形');

/* ---------- 7. 第二章：多数表决真值表复算 ---------- */
const c21=C.caseById('case-2-1');
ok(c21.table.rows.length===8,'案例 2-1 列出三变量全部 8 行');
for(const r of c21.table.rows){
 const [a,b,cc]=r.map(Number);
 const f=Number(r[4]);
 ok(f===((a+b+cc)>=2?1:0),'案例 2-1 的 '+r.slice(0,3).join('')+' 行输出正确');
 ok(Number(r[3])===a+b+cc,'案例 2-1 的同意人数字段正确');
}

/* ---------- 8. 第二章：与非门异或的中间节点复算 ---------- */
const c22=C.caseById('case-2-2');
for(const r of c22.table.rows){
 const a=Number(r[0]),b=Number(r[1]);
 const n1=1-(a&b),n2=1-(a&n1),n3=1-(b&n1),y=1-(n2&n3);
 ok(Number(r[2])===n1,'案例 2-2 的 N1 正确');
 ok(Number(r[3])===n2,'案例 2-2 的 N2 正确');
 ok(Number(r[4])===n3,'案例 2-2 的 N3 正确');
 ok(Number(r[5])===y,'案例 2-2 的 Y 与异或真值一致');
}

/* ---------- 9. 第二章：无关项化简 ---------- */
const c23=C.caseById('case-2-3');
const floorRows=c23.table.rows;
ok(floorRows.length===16,'案例 2-3 列出 16 行（含 6 个无关项）');
for(const r of floorRows){
 const n=parseInt(r[0],2);
 const f=r[2];
 if(n>=5&&n<=9)ok(f==='1','案例 2-3 的楼层 '+n+' 应输出 1');
 else if(n<=4)ok(f==='0','案例 2-3 的楼层 '+n+' 应输出 0');
 else ok(f==='×','案例 2-3 的非法码 '+n+' 标记为无关项');
 // 表达式 F = B3 + B2·(B1+B0) 对 0~9 逐行回代
 const b3=(n>>3)&1,b2=(n>>2)&1,b1=(n>>1)&1,b0=n&1;
 const expr=b3||(b2&&(b1||b0))?1:0;
 if(n<=9)ok(String(expr)===f,'案例 2-3 的表达式对楼层 '+n+' 成立');
}

/* ---------- 10. 四个综合项目 ---------- */
ok(C.projects.length===4,'综合项目共 4 个（当前 '+C.projects.length+'）');
const PROJECT_KEYS=C.PROJECT_PARTS.map(p=>p.key);
ok(PROJECT_KEYS.length===8,'项目固定为八部分');
for(const p of C.projects){
 for(const k of PROJECT_KEYS){
  const v=p[k];
  const present=typeof v==='string'?v.trim().length>0
   :(Array.isArray(v)?v.length>0:(v&&typeof v==='object'));
  ok(present,p.id+' 的第 '+k+' 部分存在');
 }
 ok(p.spec.length>=4,p.id+' 指标表至少 4 行');
 ok(p.test.length>=5,p.id+' 测试记录至少 5 行');
 ok(p.plan.length>=3,p.id+' 阶段计划至少 3 条');
 ok(p.review.length>=3,p.id+' 自评量规至少 3 级');
 ok(!PLACEHOLDER.test(JSON.stringify(p)),p.id+' 不含占位文字');
}

console.log('V2.5.1 教学内容共 '+count+' 项检查通过（章节 '+(chapterNums.join('/')||'—')+
 '，讲义 '+lessons.length+' 节，案例 '+C.cases.length+' 个，项目 '+C.projects.length+' 个）。');
