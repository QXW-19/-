/* V2.1 教材内容质量回归，运行：node tests/verify-v2.1.cjs */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../assets/v1.8-lessons.js');
require('../assets/v2.1-data.js');
const base=globalThis.DigitalV18Lessons,data=globalThis.DigitalV21Data;
const E=require('../assets/v2.1-core.js'),V20=require('../assets/v2.0-core.js');
const root=path.resolve(__dirname,'..');
let count=0;const check=(label,fn)=>{fn();count++;console.log('PASS',label)};
const example=(id)=>base.lessons.find(l=>l.id===id);
check('完整 V1.8 原课仍为八章32节',()=>{assert.equal(base.lessons.length,32);assert.equal(base.chapters.length,8)});
check('V2.1 知识材料通过对齐校验',()=>assert.equal(E.validate(base,data),true));
check('参考书保持阎石数字电子技术第六版',()=>assert.match(data.reference,/阎石《数字电子技术基础》第六版/));
check('八章各有一个跨概念综合案例',()=>{assert.equal(data.caseStudies.length,8);for(let c=1;c<=8;c++)assert.equal(data.caseStudies[c-1].chapter,c);});
check('八个案例全部含五步推导共40步',()=>{assert.equal(data.caseStudies.flatMap(x=>x.steps).length,40);assert.ok(data.caseStudies.every(x=>x.steps.length===5));});
check('各案例有明确问题、结论、知识衔接',()=>{for(const x of data.caseStudies)for(const k of ['title','given','goal','question','answer','next'])assert.ok(x[k].length>12);});
check('八章各有不同的案例迁移检测',()=>{assert.equal(data.checkpoints.length,8);assert.equal(new Set(data.checkpoints.map(q=>q.question)).size,8);});
check('所有案例检测有唯一的三个选项',()=>{data.checkpoints.forEach(q=>{assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.ok(q.options[q.correct]);});});
check('32节原有随堂题逐题匹配诊断',()=>{assert.equal(data.feedback.length,32);data.feedback.forEach((f,i)=>assert.equal(f.id,base.lessons[i].id));});
check('64条错误选项都有不同于正确答案的解释',()=>{
 let explanations=0;
 data.feedback.forEach((f,i)=>{
  const correct=base.lessons[i].quiz.correct;
  f.wrong.forEach((s,j)=>{if(j===correct)assert.equal(s,null);else{assert.ok(s&&s.length>=12);explanations++;}});
 });assert.equal(explanations,64);
});
check('回答正确返回核心解析',()=>{const l=example('l4-2'),a=E.answerFeedback(base,data,l.id,l.quiz.correct);assert.equal(a.correct,true);assert.ok(a.why.includes('1+1'));});
check('错误答案显示与选项对应的诊断',()=>{
 const r=E.answerFeedback(base,data,'l1-1',0);assert.equal(r.correct,false);assert.match(r.guidance,/4 bit/);
});
check('两个错误选项的诊断必须不同',()=>{
 const a=E.answerFeedback(base,data,'l1-1',0),b=E.answerFeedback(base,data,'l1-1',1);
 assert.notEqual(a.guidance,b.guidance);
});
check('非法课号或选项不能通过诊断',()=>{
 assert.throws(()=>E.answerFeedback(base,data,'ghost',0));assert.throws(()=>E.answerFeedback(base,data,'l1-1',5));
});
check('第一节前置知识为空，下一节正确',()=>{const b=E.lessonBridge(base,'l1-1');assert.equal(b.prev,null);assert.equal(b.next.id,'l1-2')});
check('章节内的知识衔接不缺失',()=>{
 const b=E.lessonBridge(base,'l6-2');assert.equal(b.prev.id,'l6-1');assert.equal(b.next.id,'l6-3');
});
check('章节之间的知识路线相连',()=>{
 const b=E.lessonBridge(base,'l2-1');assert.equal(b.prev.id,'l1-4');assert.equal(b.next.id,'l2-2');
});
check('最后一节没有不存在的下一节',()=>assert.equal(E.lessonBridge(base,'l8-4').next,null));
check('缺少错因的材料必须被拒绝',()=>{
 const bad=JSON.parse(JSON.stringify(data));bad.feedback[0].wrong[0]=null;
 assert.throws(()=>E.validate(base,bad),/错因/);
});
check('教材选项一旦调整与旧诊断不匹配会拒绝',()=>{
 const bad=JSON.parse(JSON.stringify(base));bad.lessons[0].quiz.correct=0;
 assert.throws(()=>E.validate(bad,data),/正确选项/);
});
check('不完整案例不能悄悄通过',()=>{
 const bad=JSON.parse(JSON.stringify(data));bad.caseStudies[0].steps.pop();
 assert.throws(()=>E.validate(base,bad),/案例|推导/);
});
check('案例检测正确答案会通过',()=>{
 const q=data.checkpoints[0],a=E.gradeCheckpoint(data,E.fresh(),1,q.correct);
 assert.equal(a.correct,true);assert.deepEqual(a.state.passed,[1]);
});
check('错误答案只增加次数，不误标通过',()=>{
 const q=data.checkpoints[0],a=E.gradeCheckpoint(data,E.fresh(),1,(q.correct+1)%3);
 assert.equal(a.correct,false);assert.deepEqual(a.state.passed,[]);assert.equal(a.state.attempts.c1,1);
});
check('重做正确后会转为通过且保留答题次数',()=>{
 const q=data.checkpoints[2],bad=(q.correct+1)%3;
 let s=E.gradeCheckpoint(data,E.fresh(),3,bad).state;
 s=E.gradeCheckpoint(data,s,3,q.correct).state;
 assert.deepEqual(s.passed,[3]);assert.equal(s.attempts.c3,2);
});
check('已过关再答错不会删除曾通过记录',()=>{
 const q=data.checkpoints[3];
 let s=E.gradeCheckpoint(data,E.fresh(),4,q.correct).state;
 s=E.gradeCheckpoint(data,s,4,(q.correct+1)%3).state;
 assert.deepEqual(s.passed,[4]);
});
check('非法案例编号与选项必须拒绝',()=>{
 assert.throws(()=>E.gradeCheckpoint(data,E.fresh(),0,0));
 assert.throws(()=>E.gradeCheckpoint(data,E.fresh(),5,3));
});
check('存档导出导入保持同样的掌握记录',()=>{
 let s=E.gradeCheckpoint(data,E.fresh(),1,data.checkpoints[0].correct).state;
 s=E.gradeCheckpoint(data,s,8,data.checkpoints[7].correct).state;
 assert.deepEqual(E.safeState(JSON.parse(JSON.stringify(s))),s);
});
check('损坏存档的非法通过章节必须过滤',()=>{
 assert.deepEqual(E.safeState({version:1,passed:[8,8,9,0,3],attempts:{c1:3,c9:5}}),{version:1,passed:[3,8],attempts:{c1:3}});
});
check('没有历史数据时 V2.0 首页不会崩溃',()=>{
 const r=V20.gather({getItem:()=>null});assert.equal(r.totals.cases,0);
});
check('案例通过数会汇总首页但不改变旧四项规则',()=>{
 const store={getItem:k=>k===E.KEY?JSON.stringify({version:1,passed:[1,4],attempts:{}}):null};
 const r=V20.gather(store);assert.equal(r.totals.cases,2);
 assert.equal(r.chapters[0].caseStudyPassed,true);assert.equal(r.chapters[1].caseStudyPassed,false);
 assert.equal(r.chapters[0].milestones,0);
});
check('汇总完全只读，不能写入旧存档',()=>{
 const store={getItem:k=>null,setItem:()=>{throw Error('不允许写入')}};
 assert.equal(V20.gather(store).totals.cases,0);
});
check('全部新版脚本可被 JS 解析器解析',()=>{
 for(const p of ['assets/v2.1-data.js','assets/v2.1-core.js','assets/v2.1.js','assets/v1.8.js','assets/v2.0.js','assets/v2.0-core.js'])
  new vm.Script(fs.readFileSync(path.join(root,p),'utf8'));
});
check('主网页仍保留51个原始教学模块',()=>{
 const h=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.equal([...h.matchAll(/<section class="mod" id="/g)].length,51);
});
check('V1.1至V1.9和V2.0功能脚本均仍存在',()=>{
 const h=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 for(let i=1;i<=9;i++)assert.ok(h.includes('assets/v1.'+i+'.js'));
 assert.ok(h.includes('assets/v2.0.js'));
});
check('V2.1资源顺序正确且 CSS 引入',()=>{
 const h=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 for(const f of ['assets/v2.1-data.js','assets/v2.1-core.js','assets/v2.1.js','assets/v2.1.css'])assert.ok(h.includes(f));
 assert.ok(h.indexOf('assets/v2.1-data.js')<h.indexOf('assets/v2.1-core.js'));
 assert.ok(h.indexOf('assets/v2.1-core.js')<h.indexOf('assets/v2.1.js'));
});
check('V1.8 页面同时有知识增强挂钩与错题诊断挂钩',()=>{
 const s=fs.readFileSync(path.join(root,'assets/v1.8.js'),'utf8');
 assert.ok(s.includes('DigitalV21Enhance?.renderLesson'));
 assert.ok(s.includes('DigitalV21Enhance?.diagnostic'));
});
console.log('全部 '+count+' 项 V2.1 自动检查通过；浏览器动效仍须在用户本机验收。');
