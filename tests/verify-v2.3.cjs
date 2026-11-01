/* V2.3 代码拆分质量门：node tests/verify-v2.3.cjs
 * 哈希是从 V2.2 原始 HTML 中逐字节拷贝的 JS/CSS 内容计算的 FNV-1a。
 * 能检测“外置时误删一段代码”、脚本顺序和旧模块丢失。
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
const checks=[
 ['assets/legacy/classroom.css',30680,'7fbab3e2'],
 ['assets/chapters/ch01-complement.js',5171,'4baed199'],
 ['assets/chapters/ch02-karnaugh.js',9331,'75a17ffe'],
 ['assets/chapters/ch03-cmos.js',8844,'f19361a8'],
 ['assets/chapters/ch04-hazard.js',8415,'20828bbf'],
 ['assets/chapters/ch05-flipflop.js',9762,'d0b21364'],
 ['assets/chapters/ch06-sequence.js',6043,'9f754e51'],
 ['assets/chapters/ch07-555.js',8736,'6d264989'],
 ['assets/chapters/ch08-adc.js',5104,'d777a266'],
 ['assets/legacy/navigation.js',3952,'4ca7e900']
];
function fnv1a(src){let h=2166136261;for(let i=0;i<src.length;i++)h=Math.imul(h^src.charCodeAt(i),16777619);return (h>>>0).toString(16).padStart(8,'0')}
let count=0;function test(label,fn){fn();count++;console.log('PASS '+label)}
test('原始 51 个教学模块完整保留',()=>assert.equal([...html.matchAll(/<section class="mod" id="/g)].length,51));
test('原教材八个章节与 3D 页面均存在',()=>{
 for(let n=1;n<=8;n++)assert.ok(html.includes('<section class="mod" id="c'+n+'">'));
 for(let n=1;n<=5;n++)assert.ok(html.includes('<section class="mod" id="w'+n+'">'));
});
test('全部十份外置文件存在，内容与原版校验值完全一致',()=>{
 for(const [file,length,hash] of checks){
  const body=fs.readFileSync(path.join(root,file),'utf8');
  assert.equal(body.length,length,file+' size');
  assert.equal(fnv1a(body),hash,file+' source changed unexpectedly');
 }
});
test('原始公共 CSS 已外置且没有重复 inline style',()=>{
 assert.ok(html.includes('<link rel="stylesheet" href="assets/legacy/classroom.css">'));
 assert.equal((html.match(/<style(?:\s[^>]*)?>/g)||[]).length,0);
});
test('八章控制器按原位置同步执行，无 defer/module 延迟',()=>{
 let last=0;
 const files=checks.slice(1,9).map(x=>x[0]);
 for(const file of files){
  const tag='<script src="'+file+'"></script>';
  const index=html.indexOf(tag);
  assert.ok(index>=0,file+' missing');assert.ok(index>last,file+' script order changed');
  assert.ok(!html.includes('<script src="'+file+'" defer'),file+' must remain synchronous');
  last=index;
 }
});
test('导航脚本同步运行且在后续 V1 脚本之前',()=>{
 const at=html.indexOf('<script src="assets/legacy/navigation.js"></script>');
 const v1=html.indexOf('<script src="assets/v1.1.js" defer></script>');
 assert.ok(at>0&&v1>at);
});
test('新的源码只有解包拆分，未迁移原始 DOM 课程文本',()=>{
 const sections=[...html.matchAll(/<section class="mod" id="([^"]+)">/g)].map(m=>m[1]);
 assert.equal(new Set(sections).size,51);
});
test('外置九份 JS 均能被脚本语法解析',()=>{
 for(const [file] of checks.slice(1))new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
});
test('旧版本 V1.1～V2.2 仍全部接入',()=>{
 for(let v=1;v<=9;v++)assert.ok(html.includes('assets/v1.'+v+'.js'));
 for(const file of ['assets/v2.0.js','assets/v2.1.js','assets/v2.2.js'])assert.ok(html.includes(file));
});
test('现有主页一键进入的重定向仍然正确',()=>{
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(index.includes('数字电子技术基础-互动课堂.html'));assert.ok(index.includes('window.location.hash'));
});
test('浏览器测试文件和 Playwright 配置存在',()=>{
 for(const file of ['playwright.config.cjs','tests/browser/smoke.spec.cjs','package.json']){
  assert.ok(fs.readFileSync(path.join(root,file),'utf8').length>100);
 }
});
console.log('V2.3 '+count+' 项静态拆分回归通过。Playwright 浏览器测试需要独立运行。');
