/* V2.2 资源目录/搜索/收藏回归，Windows VSCode: node tests/verify-v2.2.cjs */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../assets/v2.2-catalog.js');
const root=path.resolve(__dirname,'..');
let passed=0;
function test(label,fn){fn();passed++;console.log('PASS '+label);}
const sample=C.build([
 {id:'c1',kind:'module',category:'reference',chapter:1,title:'数制与码制',subtitle:'第一章 · 教材精讲'},
 {id:'m2',kind:'module',category:'experiment',chapter:2,title:'卡诺图化简',subtitle:'第二章 · 互动'},
 {id:'v16-lab',kind:'module',category:'experiment',chapter:6,title:'混合数字电路实验',subtitle:'同步计数器'},
 {id:'w3',kind:'module',category:'three-d',chapter:3,title:'CMOS 反相器',subtitle:'第三章 · 3D'},
 {id:'x5',kind:'module',category:'exercise',chapter:5,title:'存储电路考研题',subtitle:'第五章'},
 {id:'l1-1',kind:'lesson',category:'lesson',chapter:1,title:'二进制 bit 基础',subtitle:'第一章 零基础'}
]);
test('分类包含系统讲义、实验、精讲、考试和 3D',()=>{
 assert.deepEqual(C.CATEGORIES.map(x=>x.id),['all','lesson','experiment','reference','exercise','three-d']);
});
test('资源列表保留有效条目',()=>assert.equal(sample.length,6));
test('自动为资源生成稳定唯一键',()=>{
 assert.ok(sample.some(r=>r.key==='module:c1'));assert.ok(sample.some(r=>r.key==='lesson:l1-1'));
});
test('避免重复资源 ID',()=>{
 assert.equal(C.build([{id:'c1',kind:'module',chapter:1,category:'reference',title:'A'},{id:'c1',kind:'module',chapter:1,category:'reference',title:'B'}]).length,1);
});
test('过滤无效 ID、章节和分类',()=>{
 assert.equal(C.build([{id:'<x>',kind:'module',chapter:1,category:'reference',title:'A'},{id:'c1',kind:'module',chapter:9,category:'reference',title:'B'},{id:'m1',kind:'module',chapter:1,category:'invalid',title:'C'}]).length,0);
});
test('中文关键词可以搜索完整标题',()=>{
 assert.deepEqual(C.filter(sample,{query:'卡诺图'}).map(r=>r.id),['m2']);
});
test('字母搜索忽略大小写',()=>assert.deepEqual(C.filter(sample,{query:'CMOS'}).map(r=>r.id),['w3']));
test('大小写和全角 NFKC 归一化',()=>{
 assert.equal(C.normalize('ＡＤＣ ５５５'),'adc555');
});
test('空查询可列出全部资源',()=>assert.equal(C.filter(sample).length,6));
test('不存在的关键词返回空数组',()=>assert.equal(C.filter(sample,{query:'不存在的词'}).length,0));
test('类别筛选仅展示练习考试',()=>assert.deepEqual(C.filter(sample,{category:'exercise'}).map(x=>x.id),['x5']));
test('只看第 1 章筛选正确',()=>assert.deepEqual(C.filter(sample,{chapter:1}).map(x=>x.id).sort(),['c1','l1-1']));
test('章+类别双条件筛选有效',()=>assert.deepEqual(C.filter(sample,{chapter:2,category:'experiment'}).map(x=>x.id),['m2']));
test('多关键词空格查询支持分别匹配',()=>assert.deepEqual(C.filter(sample,{query:'数制 第一章'}).map(x=>x.id),['c1']));
test('目录的章节分类可以识别 51 个原模块常用前缀',()=>{
 assert.equal(C.sectionChapter('m5',''),5);assert.equal(C.sectionChapter('n11',''),6);
 assert.equal(C.sectionChapter('w5',''),8);assert.equal(C.sectionChapter('c2',''),2);
 assert.equal(C.sectionChapter('v13-lab',''),4);
});
test('3D 与题库资源分类准确',()=>{
 assert.equal(C.sectionCategory('w5'),'three-d');assert.equal(C.sectionCategory('x4'),'exercise');
 assert.equal(C.sectionCategory('m5'),'experiment');assert.equal(C.sectionCategory('g4'),'reference');
});
test('空收藏进度正常',()=>assert.deepEqual(C.safeState(null),{version:1,favorites:[],recent:[]}));
test('收藏可增加和取消',()=>{
 let s=C.toggleFavorite(C.safeState(null),'module:m2');
 assert.deepEqual(s.favorites,['module:m2']);s=C.toggleFavorite(s,'module:m2');assert.equal(s.favorites.length,0);
});
test('收藏优先排序',()=>{
 const s=C.toggleFavorite(C.safeState(null),'module:w3');
 assert.equal(C.filter(sample,{state:s})[0].id,'w3');
});
test('只看收藏仅展示收藏内容',()=>{
 const s=C.toggleFavorite(C.safeState(null),'module:m2');
 assert.deepEqual(C.filter(sample,{state:s,favorites:true}).map(x=>x.id),['m2']);
});
test('最近访问记录最新在前且自动去重',()=>{
 let s=C.fresh?.()||C.safeState(null);s=C.remember(s,'module:c1');s=C.remember(s,'module:m2');s=C.remember(s,'module:c1');
 assert.deepEqual(s.recent,['module:c1','module:m2']);
});
test('非法收藏或最近记录键被拒绝',()=>{
 assert.throws(()=>C.toggleFavorite(C.safeState(null),'<script>'));
 assert.throws(()=>C.remember(C.safeState(null),'../private'));
});
test('损坏收藏内容安全过滤',()=>{
 const s=C.safeState({version:1,favorites:['module:c1','module:c1','xxx'],recent:['lesson:l1-1','<bad>']});
 assert.deepEqual(s.favorites,['module:c1']);assert.deepEqual(s.recent,['lesson:l1-1']);
});
test('限额保护：收藏最多 100、最近最多 12 条',()=>{
 const raw={version:1,favorites:[],recent:[]};
 for(let i=0;i<130;i++){raw.favorites.push('module:m'+i);raw.recent.push('module:m'+i);}
 const s=C.safeState(raw);assert.equal(s.favorites.length,100);assert.equal(s.recent.length,12);
});
test('不修改旧版 51 个原教学模块',()=>{
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.equal([...html.matchAll(/<section class="mod" id="/g)].length,51);
});
test('从原页面仍能识别 51 个资源条目',()=>{
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 const names=[...html.matchAll(/<section class="mod" id="([^"]+)">/g)].map(x=>x[1]);
 assert.equal(new Set(names).size,51);
 assert.ok(names.includes('m1')&&names.includes('w5')&&names.includes('x8'));
});
test('原 V1.8 讲义仍保留 32 节可索引课程',()=>{
 require('../assets/v1.8-lessons.js');
 assert.equal(globalThis.DigitalV18Lessons.lessons.length,32);
});
test('旧版 V1.1～V2.1 脚本引用不丢失',()=>{
 const h=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 for(let i=1;i<=9;i++)assert.ok(h.includes('assets/v1.'+i+'.js'));
 for(const id of ['assets/v2.0.js','assets/v2.1.js','assets/v2.2-catalog.js','assets/v2.2.js','assets/v2.2.css'])assert.ok(h.includes(id));
});
test('资源目录先于搜索 UI 加载',()=>{
 const h=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.ok(h.indexOf('assets/v2.2-catalog.js')<h.indexOf('assets/v2.2.js'));
});
test('旧版 V2.0 首页仍能提供 fallback 卡片',()=>{
 const s=fs.readFileSync(path.join(root,'assets/v2.0.js'),'utf8');
 assert.ok(s.includes('DigitalV22Tools?.render'));assert.ok(s.includes('const cards=['));
});
test('资源浏览器 UI 不创建新版多余章节模块',()=>{
 const s=fs.readFileSync(path.join(root,'assets/v2.2.js'),'utf8');
 assert.ok(!s.includes('section.id=\'v22-studio\''));
 assert.ok(s.includes("document.querySelectorAll('#main > section.mod[id]')"));
});
test('所有 V2.2 JS 源码都可解析',()=>{
 for(const p of ['assets/v2.2-catalog.js','assets/v2.2.js','assets/v2.0.js'])new vm.Script(fs.readFileSync(path.join(root,p),'utf8'));
});
console.log('共 '+passed+' 项 V2.2 核心与静态回归通过。浏览器端 UI 仍需本机验收。');
