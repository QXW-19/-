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
const FILES=[
 'assets/content/v2.5.1-content-core.js',
 'assets/content/lessons/ch01.js',
 'assets/content/cases/ch01.js'
];
for(const f of FILES){
 vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),sandbox,{filename:f});
}
const C=sandbox.window.DigitalV251Content;
ok(C&&C.version==='2.5.1','内容注册中心已加载且版本为 2.5.1');

const lessons=C.lessonIds();
ok(lessons.length===4,'第一章四节深读讲义全部注册（当前 '+lessons.length+'）');

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

console.log('V2.5.1 第一章教学内容共 '+count+' 项检查通过（章节 '+lessons.length+' 节 / 案例 '+cases.length+' 个）。');
