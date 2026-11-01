/* V1.5 原创题库 + 考试引擎回归，运行 node tests/verify-v1.5.cjs */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../assets/v1.5-bank.js');
const bank=globalThis.DigitalExamBank;
const E=require('../assets/v1.5-core.js');
let count=0;
function check(name,fn){fn();count++;console.log('PASS',name);}
function key(q){return q.answer;}
function paper(kind,extra){return E.buildPaper(bank,{mode:kind,seed:20261101,...extra});}
check('题库版本与 48 题结构正确',()=>{assert.equal(E.validateBank(bank),true);assert.equal(bank.questions.length,48)});
check('每章各六题且题号无重复',()=>{
 for(let chapter=1;chapter<=8;chapter++){
  const subset=bank.questions.filter(q=>q.chapter===chapter);
  assert.equal(subset.length,6);
  assert.equal(subset.filter(q=>q.type==='choice').length,4);
  assert.equal(subset.filter(q=>q.type==='boolean').length,1);
  assert.equal(subset.filter(q=>q.type==='number').length,1);
 }
 assert.equal(new Set(bank.questions.map(q=>q.id)).size,48);
});
check('章节测验正确抽取六题',()=>{
 const p=paper('chapter',{chapter:4});
 assert.equal(p.questionIds.length,6);
 assert.ok(p.questionIds.every(id=>id.startsWith('c4-')));
 assert.equal(p.durationMs,null);
});
check('综合考试 24 题且每章三题',()=>{
 const p=paper('comprehensive');
 assert.equal(p.questionIds.length,24);assert.equal(p.durationMs,1800000);
 assert.equal(new Set(p.questionIds).size,24);
 for(let i=1;i<=8;i++)assert.equal(p.questionIds.filter(id=>id.startsWith('c'+i+'-')).length,3);
});
check('同一随机种子生成相同试卷',()=>assert.deepEqual(paper('comprehensive'),paper('comprehensive')));
check('不同种子一般产生不同题目排列',()=>assert.notDeepEqual(paper('comprehensive'),E.buildPaper(bank,{mode:'comprehensive',seed:1918})));
check('错题复习仅抽指定合法题号',()=>{
 const p=paper('wrong',{wrongIds:['c1-01','c5-06','nonsense']});
 assert.deepEqual(p.questionIds.slice().sort(),['c1-01','c5-06']);
});
check('没有待纠正错题时拒绝启动',()=>assert.throws(()=>paper('wrong',{wrongIds:[]}),/没有待复习/));
check('单选题正确评分',()=>{const q=bank.questions.find(x=>x.id==='c4-01');assert.equal(E.gradeQuestion(q,2).correct,true);assert.equal(E.gradeQuestion(q,1).correct,false)});
check('判断题 false 不会被当成漏答',()=>{
 const q=bank.questions.find(x=>x.id==='c3-05');assert.equal(q.answer,false);
 assert.deepEqual(E.gradeQuestion(q,false),{attempted:true,correct:true});
});
check('判断题 true 判分',()=>{
 const q=bank.questions.find(x=>x.id==='c2-05');assert.deepEqual(E.gradeQuestion(q,true),{attempted:true,correct:true});
});
check('数值答案支持小数与容差',()=>{
 const q=bank.questions.find(x=>x.id==='c8-06');
 assert.equal(E.gradeQuestion(q,'3.22').correct,true);
 assert.equal(E.gradeQuestion(q,'3.224').correct,true);
 assert.equal(E.gradeQuestion(q,'3.3').correct,false);
});
check('输入空值与非法数字不视为已作答',()=>{
 const q=bank.questions.find(x=>x.id==='c7-06');
 for(const bad of ['',null,undefined,'Infinity','NaN','1abc','1,000'])assert.equal(E.gradeQuestion(q,bad).attempted,false);
});
check('数值题 0、负数可识别但按正确答案判断',()=>{
 assert.equal(E.numericValue('0'),0);assert.equal(E.numericValue('-0.5'),-0.5);
 assert.equal(E.numericValue('1e2'),100);
});
check('只答对一道章节题时按 17 分计分',()=>{
 const p=paper('chapter',{chapter:1});
 const q=bank.questions.find(x=>x.id===p.questionIds[0]);
 const result=E.gradePaper(bank,p,{[q.id]:key(q)});
 assert.equal(result.correct,1);assert.equal(result.unanswered,5);assert.equal(result.score,17);
});
check('全部答对时评分 100 分',()=>{
 const p=paper('comprehensive'),answers={};
 for(const id of p.questionIds)answers[id]=bank.questions.find(q=>q.id===id).answer;
 const result=E.gradePaper(bank,p,answers);
 assert.equal(result.correct,24);assert.equal(result.score,100);assert.equal(result.unanswered,0);
});
check('题号重复或不存在时拒绝判卷',()=>{
 const p=paper('chapter',{chapter:1});
 assert.throws(()=>E.gradePaper(bank,{...p,questionIds:[p.questionIds[0],p.questionIds[0]]},{}),/重复/);
 assert.throws(()=>E.gradePaper(bank,{...p,questionIds:['ghost']},{}),/无效/);
});
check('成绩写入最近考试历史',()=>{
 const p=paper('chapter',{chapter:1});
 const {state,result}=E.record(bank,E.fresh(),p,{},1762000000000);
 assert.equal(state.history.length,1);assert.equal(state.history[0].total,6);assert.equal(result.unanswered,6);
 assert.equal(state.active,null);
});
check('未作答题记入待纠正错题',()=>{
 const p=paper('chapter',{chapter:1});
 const {state}=E.record(bank,E.fresh(),p,{},1762000000000);
 for(const id of p.questionIds)assert.deepEqual(state.mistakes[id],{errors:1,corrected:false});
});
check('复习答对后错题标记为已纠正',()=>{
 const p=paper('chapter',{chapter:1});
 const a=E.record(bank,E.fresh(),p,{},1762000000000).state;
 const wrong=E.buildPaper(bank,{mode:'wrong',wrongIds:p.questionIds,seed:2});
 const correct={};for(const id of wrong.questionIds)correct[id]=bank.questions.find(q=>q.id===id).answer;
 const b=E.record(bank,a,wrong,correct,1762000030000).state;
 for(const id of wrong.questionIds)assert.equal(b.mistakes[id].corrected,true);
});
check('再次答错会重新打开已纠正记录',()=>{
 const p=paper('chapter',{chapter:1}),id=p.questionIds[0],q=bank.questions.find(x=>x.id===id);
 const first=E.record(bank,E.fresh(),p,{},1762000000000).state;
 const rec=E.record(bank,first,{...p,questionIds:[id]}, {[id]:q.answer},1762000005000).state;
 assert.equal(rec.mistakes[id].corrected,true);
 const wrong=E.record(bank,rec,{...p,questionIds:[id]}, {},1762000010000).state;
 assert.equal(wrong.mistakes[id].corrected,false);assert.equal(wrong.mistakes[id].errors,2);
});
check('考试历史最多保留 50 场',()=>{
 let state=E.fresh();const p={...paper('chapter',{chapter:1}),questionIds:['c1-01']};
 for(let i=0;i<57;i++)state=E.record(bank,state,p,{},1762000000000+i).state;
 assert.equal(state.history.length,50);
});
check('安全恢复正在考试的合法答案',()=>{
 const p=paper('chapter',{chapter:2}),q=bank.questions.find(x=>x.id===p.questionIds[0]);
 const s=E.fresh();s.active={...p,id:'test-123',startedAt:1762000000000,answers:{[q.id]:q.answer}};
 assert.equal(E.safeState(bank,JSON.parse(JSON.stringify(s))).active.answers[q.id],q.answer);
});
check('无法将其他版本的数据误导入 V1.5',()=>{
 assert.throws(()=>E.safeState(bank,{version:1,completed:['c1'],answers:{}}),/不符合 V1.5/);
});
check('损坏的单选答案和外来题号被丢弃',()=>{
 const p=paper('chapter',{chapter:1}),s=E.fresh();
 const choiceId=p.questionIds.find(id=>bank.questions.find(q=>q.id===id).type==='choice');
 s.active={...p,id:'test-invalid',startedAt:1762000000000,answers:{[choiceId]:99,ghost:3}};
 assert.deepEqual(E.safeState(bank,s).active.answers,{});
});
check('前端 JS 可解析且原有 51 模块保留',()=>{
 const root=path.resolve(__dirname,'..');
 for(const p of ['assets/v1.5-bank.js','assets/v1.5-core.js','assets/v1.5.js'])new vm.Script(fs.readFileSync(path.join(root,p),'utf8'));
 const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.equal([...html.matchAll(/<section class="mod" id="/g)].length,51);
 for(const p of ['assets/v1.1.js','assets/v1.2.js','assets/v1.3.js','assets/v1.4.js','assets/v1.5.js','assets/v1.5-core.js','assets/v1.5-bank.js','assets/v1.5.css'])assert.ok(html.includes(p));
 assert.ok(html.indexOf('assets/v1.5-bank.js')<html.indexOf('assets/v1.5-core.js'));
 assert.ok(html.indexOf('assets/v1.5-core.js')<html.indexOf('assets/v1.5.js'));
});
console.log('全部 '+count+' 项 V1.5 回归测试通过；浏览器点击、响应式与 3D 仍需另行验收。');
