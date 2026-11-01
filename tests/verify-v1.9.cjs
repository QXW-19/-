/* V1.9 图解与分层练习的零依赖自动验收。
 * 用法：node tests/verify-v1.9.cjs
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../assets/v1.9-data.js');
const data=globalThis.DigitalV19Data,Core=require('../assets/v1.9-core.js');
const root=path.resolve(__dirname,'..');
let tests=0;const verify=(name,fn)=>{fn();tests++;console.log('PASS '+name);};
verify('数据集通过严格校验',()=>assert.equal(Core.validateData(data),true));
verify('参考书是阎石数字电子技术第六版',()=>assert.match(data.reference,/阎石.*数字电子技术.*第六版/));
verify('八章各有一幅独立图解',()=>{assert.equal(data.diagrams.length,8);assert.deepEqual(data.diagrams.map(d=>d.chapter),[1,2,3,4,5,6,7,8]);});
verify('全部图解各有四步，合计 32 帧',()=>{assert.equal(data.diagrams.reduce((n,d)=>n+d.frames.length,0),32);assert.ok(data.diagrams.every(d=>d.frames.length===4));});
verify('全部图解节点与连接都是有效引用',()=>{
 for(const d of data.diagrams){
  const ids=new Set(d.nodes.map(n=>n.id)),wires=new Set(d.edges.map(e=>e.id));
  d.edges.forEach(e=>{assert.ok(ids.has(e.from));assert.ok(ids.has(e.to));});
  d.frames.forEach(f=>{f.nodes.forEach(x=>assert.ok(ids.has(x)));f.edges.forEach(x=>assert.ok(wires.has(x)));});
 }
});
verify('图解说明具有逐步讲解内容',()=>data.diagrams.forEach(d=>d.frames.forEach(f=>{assert.ok(f.label.length>=2);assert.ok(f.description.length>=12);})));
verify('题库总共 24 题',()=>assert.equal(data.questions.length,24));
verify('每章有基础、进阶、应用各一题',()=>{
 for(let ch=1;ch<=8;ch++){
  const items=data.questions.filter(q=>q.chapter===ch);
  assert.equal(items.length,3);assert.deepEqual(items.map(q=>q.level),['基础','进阶','应用']);
 }
});
verify('题目 ID 唯一、选项和解析完整',()=>{
 const ids=data.questions.map(q=>q.id);assert.equal(new Set(ids).size,24);
 data.questions.forEach(q=>{assert.equal(q.options.length,3);assert.ok(q.options[q.correct]);assert.ok(q.why.length>=6);});
});
verify('空白进度可恢复',()=>assert.deepEqual(Core.safeState(data,Core.fresh()),Core.fresh()));
verify('八章步进存储相互独立',()=>{
 let s=Core.fresh();s=Core.setFrame(data,s,1,3);s=Core.setFrame(data,s,2,2);
 assert.equal(s.frames.c1,3);assert.equal(s.frames.c2,2);assert.equal(s.lastChapter,2);
});
verify('无效图解步骤会拒绝',()=>{assert.throws(()=>Core.setFrame(data,Core.fresh(),1,4));assert.throws(()=>Core.setFrame(data,Core.fresh(),9,0));});
verify('选择正确答案即记为掌握',()=>{
 const q=data.questions[0],x=Core.recordAnswer(data,Core.fresh(),q.id,q.correct);
 assert.equal(x.correct,true);assert.equal(x.state.results[q.id].mastered,true);
});
verify('错误答案会增加错题计数',()=>{
 const q=data.questions[0],wrong=(q.correct+1)%3;
 const result=Core.recordAnswer(data,Core.fresh(),q.id,wrong);
 assert.equal(result.correct,false);assert.equal(result.state.results[q.id].attempts,1);
 assert.equal(Core.review(data,result.state)[0],q.id);
});
verify('答错后重新答对会退出待复习',()=>{
 const q=data.questions[0],wrong=(q.correct+1)%3;
 let s=Core.recordAnswer(data,Core.fresh(),q.id,wrong).state;
 s=Core.recordAnswer(data,s,q.id,q.correct).state;
 assert.equal(s.results[q.id].attempts,2);assert.equal(Core.review(data,s).length,0);
});
verify('掌握题重复复习仍保留曾通过状态',()=>{
 const q=data.questions[0],wrong=(q.correct+1)%3;
 let s=Core.recordAnswer(data,Core.fresh(),q.id,q.correct).state;
 s=Core.recordAnswer(data,s,q.id,wrong).state;
 assert.equal(s.results[q.id].mastered,true);
});
verify('提交未知题号或选项被拒绝',()=>{
 assert.throws(()=>Core.recordAnswer(data,Core.fresh(),'unknown',1));
 assert.throws(()=>Core.recordAnswer(data,Core.fresh(),data.questions[0].id,7));
});
verify('只掌握一道题时总掌握度正确',()=>{
 const q=data.questions[0],s=Core.recordAnswer(data,Core.fresh(),q.id,q.correct).state;
 const total=Core.summary(data,s),chapter=Core.summary(data,s,1);
 assert.equal(total.total,24);assert.equal(total.mastered,1);assert.equal(chapter.total,3);assert.equal(chapter.mastered,1);
});
verify('尚未答对的错题会计入章节统计',()=>{
 const q=data.questions[0],s=Core.recordAnswer(data,Core.fresh(),q.id,(q.correct+1)%3).state;
 assert.equal(Core.summary(data,s,1).mistakes,1);
});
verify('导出导入保留进度和正确答案',()=>{
 const q=data.questions[0];let s=Core.recordAnswer(data,Core.fresh(),q.id,q.correct).state;
 s=Core.setFrame(data,s,8,2);
 assert.deepEqual(Core.safeState(data,JSON.parse(JSON.stringify(s))),s);
});
verify('损坏的存档字段被安全丢弃',()=>{
 const s=Core.fresh();s.frames.c2=999;s.results.unknown={attempts:3,mastered:false,lastAnswer:1};
 s.results[data.questions[0].id]={attempts:-5,mastered:true,lastAnswer:0};
 const restored=Core.safeState(data,s);
 assert.equal(restored.frames.c2,undefined);assert.deepEqual(restored.results,{});
});
verify('其他版本存档拒绝导入',()=>assert.throws(()=>Core.safeState(data,{version:2,frames:{},results:{}})));
verify('原始 51 个教材页面模块存在',()=>{
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.equal([...html.matchAll(/<section class="mod" id="/g)].length,51);
});
verify('V1.1～V1.9 原有脚本资源均有引用',()=>{
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 for(let i=1;i<=9;i++)assert.ok(html.includes('assets/v1.'+i+'.js'),'v1.'+i+' missing');
});
verify('V1.9 脚本加载顺序、CSS 正确',()=>{
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.ok(html.includes('assets/v1.9.css'));
 assert.ok(html.indexOf('assets/v1.9-data.js')<html.indexOf('assets/v1.9-core.js'));
 assert.ok(html.indexOf('assets/v1.9-core.js')<html.indexOf('assets/v1.9.js'));
});
verify('V1.9 JS 文件语法都能解析',()=>{
 for(const file of ['assets/v1.9-data.js','assets/v1.9-core.js','assets/v1.9.js'])
 new vm.Script(fs.readFileSync(path.join(root,file),'utf8'));
});
console.log('共 '+tests+' 项 V1.9 检查通过。浏览器图解播放与旧 3D 仍需本机交互验收。');
