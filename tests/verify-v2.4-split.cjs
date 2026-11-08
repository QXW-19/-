/* V2.4 第一批 HTML 拆分结构回归（阶段 B）。
 * 核对：五个自包含 IIFE 已原位外置、脚本总数与顺序不变、无 defer/async/module 化、
 * 51 个原始教学模块与 DOM 控件 ID 保留、外置文件语法可解析。
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');

let checks=0;
function ok(condition,label){
  assert.ok(condition,label);
  checks++;
  console.log('PASS '+label);
}

// 原位外置清单：文件、原始内联标记（用于确认没有残留）、以及模块内必须保留的控件 ID。
const BATCH=[
  {file:'assets/chapters/ch01-number-codes.js',marker:'getElementById("g6n")',ids:['g6n','g6nv','g6out','g6tab']},
  {file:'assets/chapters/ch02-minterms.js',marker:'getElementById("g7mt")',ids:['g7mt','g7res']},
  {file:'assets/chapters/ch08-adc-specs.js',marker:'getElementById("g8n")',ids:['g8n','g8nv','g8v','g8vv','g8x','g8xv','g8out']},
  {file:'assets/chapters/ch05-memory-expansion.js',marker:'var CHIPS = [',ids:['memChip','memTgt','memSvg','memInfo','memNote']},
  {file:'assets/chapters/ch06-sequential-design.js',marker:'getElementById("tsBody")',ids:['tsBar','tsBody','tsPrev','tsHint','tsNext']}
];

const tags=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
// 基线 71 个脚本标签；V2.4 学习闭环 +1（72），V2.4.1 UI/学习闭环/实验增强 +3（75），V2.5 实验室/波形 +4（79），3D 控制/生命周期 +2（81），课程联动 +1（82），V2.5.1 场景精修 +1（83），波形归档 +1（84），V2.5.1 教学内容：注册/呈现 2 + 每章讲义与案例各 1（第 1~2 章 → 90）。
// 这里仍固定总数，任何批量 defer/async 化或脚本位置变动都会被发现。
ok(tags.length===90,'脚本标签总数保持 90 个（原 84 + 内容注册/呈现 2 + 两章讲义与案例 4）');

const inlineBodies=tags.filter(t=>!/\bsrc\s*=/.test(t[1])).map(t=>t[2]);
const allSrc=tags.map(t=>(t[1].match(/\bsrc\s*=\s*["']([^"']+)["']/i)||[])[1]).filter(Boolean);
const positions=[];
for(const item of BATCH){
  const tag='<script src="'+item.file+'"></script>';
  ok(html.split(tag).length-1===1,item.file+' 在 HTML 中恰好引用一次');
  ok(!/\bdefer\b|\basync\b|type\s*=\s*["']module["']/i.test(
      (tags.find(t=>t[1].includes(item.file))||['',''])[1]),item.file+' 保持传统同步加载（无 defer/async/module）');
  const src=fs.readFileSync(path.join(root,item.file),'utf8');
  ok(new vm.Script(src, {filename:item.file})!==null,item.file+' 语法可解析');
  ok(!inlineBodies.some(b=>b.includes(item.marker)),item.file+' 的原内联正文已移除');
  ok(src.includes(item.marker),item.file+' 保留了原控制器入口');
  for(const id of item.ids)ok(html.includes('id="'+id+'"'),item.file+' 依赖的 DOM 控件 #'+id+' 仍存在');
  positions.push(allSrc.indexOf(item.file));
}
ok(positions.every((p,i)=>p>=0&&(i===0||p>positions[i-1])),'五个外置脚本保持原始相对加载顺序');
ok(positions.every(p=>p<allSrc.indexOf('assets/legacy/navigation.js')),
   '五个外置脚本仍位于页面尾部公共导航脚本之前');

// 保护已有项目：51 个原始模块、八章、五个 3D 场景。
const sections=[...html.matchAll(/<section\b[^>]*class=["'][^"']*\bmod\b[^"']*["'][^>]*\bid=["']([^"']+)["']/gi)].map(x=>x[1]);
ok(sections.length===51,'51 个原始教学模块全部保留');
for(let i=1;i<=8;i++)ok(sections.includes('c'+i),'第 '+i+' 章精讲模块 #c'+i+' 保留');
for(let i=1;i<=5;i++)ok(sections.includes('w'+i),'第 '+i+' 个 3D 场景 #w'+i+' 保留');

// 规模指标：便于与拆分前 412978 字符基线对照。
const chars=html.length;
ok(chars<412978,'HTML 字符数低于拆分前基线 412978（当前 '+chars+'）');
console.log('V2.4 第一批拆分结构回归全部 '+checks+' 项通过；HTML '+chars+' 字符，内联脚本 '+inlineBodies.length+' 个。');
