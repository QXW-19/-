/* V2.0 统一学习路线回归：node tests/verify-v2.0.cjs */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const M=require('../assets/v2.0-core.js');
const root=path.resolve(__dirname,'..');let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('PASS '+name)};
function storage(objects){
 const data=new Map(Object.entries(objects||{}).map(([k,v])=>[k,JSON.stringify(v)]));
 return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),entries:()=>Object.fromEntries(data)};
}
const sampleHub={version:1,currentChapter:2,labDone:[1,2],navExpanded:false};
const oldDone=['l1-1','l1-2','l1-3','l1-4'];
const v19Answers={'v19-q01':{mastered:true},'v19-q02':{mastered:true},'v19-q03':{mastered:true}};
const combined=storage({
 [M.KEYS.hub]:sampleHub,
 [M.KEYS.course]:{version:1,completed:oldDone,last:'l2-1'},
 [M.KEYS.diagrams]:{version:1,results:v19Answers},
 [M.KEYS.exam]:{version:1,history:[{mode:'chapter',chapter:1,score:85,total:6,correct:5,date:1762000000000}]},
 [M.KEYS.base]:{version:1,completed:['c1','c2']}
});
test('参考书有八章且原模块跳转正确',()=>{
 assert.equal(M.CHAPTERS.length,8);
 assert.equal(M.CHAPTERS[0].experiment,'m1');assert.equal(M.CHAPTERS[3].experiment,'v13-lab');
 assert.equal(M.CHAPTERS[4].experiment,'v14-lab');assert.equal(M.CHAPTERS[5].experiment,'v16-lab');
});
test('全部旧存档键名保持明确',()=>{
 assert.equal(M.KEYS.course,'digital-course-v1.8-study');
 assert.equal(M.KEYS.diagrams,'digital-course-v1.9-learning');
 assert.equal(M.KEYS.exam,'digital-course-v1.5');assert.equal(M.KEYS.base,'digital-course-v1.1');
});
test('无旧存档时安全显示零进度',()=>{
 const r=M.gather(storage());assert.equal(r.totals.lessons,0);
 assert.equal(r.totals.questions,0);assert.equal(r.totals.chapters,0);assert.equal(r.upNext,1);
});
test('无旧进度时第一步推荐讲义',()=>{
 const c=M.gather(storage()).chapters[0];
 assert.equal(M.nextAction(c).kind,'learn');
 assert.equal(M.nextAction(c).lessonId,'l1-1');
});
test('第 1 章四节讲义统计正确',()=>{
 const c=M.gather(combined).chapters[0];assert.equal(c.lessons,4);
 assert.deepEqual(c.completedLessons,oldDone);
});
test('分层题掌握度统计正确',()=>{
 const c=M.gather(combined).chapters[0];assert.equal(c.questions,3);
 assert.deepEqual(c.masteredQuestions,['v19-q01','v19-q02','v19-q03']);
});
test('汇总考试只取章节测试最高分',()=>{
 const c=M.gather(combined).chapters[0];assert.equal(c.bestExam,85);
});
test('旧 V1.1 完成标记只读展示',()=>{
 const r=M.gather(combined);assert.equal(r.oldChapterCompletions,2);assert.equal(r.chapters[1].legacyDone,true);
});
test('自评缺失时本章只达成三个里程碑',()=>{
 const s=storage({...Object.fromEntries(Object.entries(combined.entries()).map(([k,v])=>[k,JSON.parse(v)])),[M.KEYS.hub]:{version:1,currentChapter:2,labDone:[],navExpanded:false}});
 const c=M.gather(s).chapters[0];assert.equal(c.milestones,3);assert.equal(c.done,false);
});
test('四项里程碑达成后章节标已达成',()=>{
 const c=M.gather(combined).chapters[0];assert.equal(c.milestones,4);
 assert.equal(c.done,true);assert.equal(c.stage,'已达成');
});
test('全局下一个推荐跳转至第 2 章',()=>{
 const r=M.gather(combined);assert.equal(r.upNext,2);
});
test('讲义未完成时优先下一节',()=>{
 const s=storage({[M.KEYS.course]:{completed:['l2-1','l2-2'],version:1}});
 const c=M.gather(s).chapters[1];
 assert.equal(M.nextAction(c).lessonId,'l2-3');
});
test('讲义通过后推荐图解和分层题',()=>{
 const s=storage({[M.KEYS.course]:{completed:oldDone}});
 const c=M.gather(s).chapters[0];assert.equal(M.nextAction(c).kind,'diagram');
});
test('讲义与分层题通过后推荐实验',()=>{
 const s=storage({[M.KEYS.course]:{completed:oldDone},[M.KEYS.diagrams]:{results:v19Answers}});
 assert.equal(M.nextAction(M.gather(s).chapters[0]).kind,'lab');
});
test('实验完成后且成绩不达标时推荐考试',()=>{
 const s=storage({...Object.fromEntries(Object.entries(combined.entries()).map(([k,v])=>[k,JSON.parse(v)])),[M.KEYS.exam]:{history:[{mode:'chapter',chapter:1,score:60}]}});
 assert.equal(M.nextAction(M.gather(s).chapters[0]).kind,'exam');
});
test('重复章节成绩只取最高且只认 V1.5 章节考试',()=>{
 const s=storage({[M.KEYS.exam]:{history:[{mode:'comprehensive',chapter:1,score:100},{mode:'chapter',chapter:1,score:72},{mode:'chapter',chapter:1,score:88}]}});
 const c=M.gather(s).chapters[0];assert.equal(c.bestExam,88);
 assert.equal(c.examAttempts,2);
});
test('合法的 V2.0 自评保存可恢复',()=>{
 const s=M.safeHub({version:1,currentChapter:5,labDone:[3,1,3,9,0],navExpanded:true});
 assert.deepEqual(s.labDone,[1,3]);assert.equal(s.currentChapter,5);assert.equal(s.navExpanded,true);
});
test('新版本的实验完成标记可取消',()=>{
 const a=M.setLabDone(M.fresh(),6,true),b=M.setLabDone(a,6,false);
 assert.ok(a.labDone.includes(6));assert.equal(b.labDone.length,0);
});
test('不合法章节和自评参数拒绝',()=>{
 assert.throws(()=>M.setLabDone(M.fresh(),9,true));
 assert.throws(()=>M.setLabDone(M.fresh(),2,'yes'));
});
test('旧版或损坏的 V2.0 存档回退默认值',()=>{
 assert.deepEqual(M.safeHub({version:5,labDone:[1]}),M.fresh());
});
test('损坏 JSON 不会阻断课程首页',()=>{
 const broken={getItem:()=>'{bad json'};
 assert.equal(M.gather(broken).totals.lessons,0);
});
test('读取只发生在旧版 key，绝不重写旧数据',()=>{
 const calls=[];const store={getItem:key=>{calls.push('read:'+key);return null},setItem:()=>{calls.push('WRITE')}};
 M.gather(store);assert.equal(calls.includes('WRITE'),false);assert.ok(calls.length>=4);
});
test('所有八章四节课与三档题 ID 正确',()=>{
 for(let c=1;c<=8;c++){
  assert.equal(M.lessonIds(c).length,4);assert.equal(M.questionIds(c).length,3);
  assert.ok(M.lessonIds(c).every(x=>x.startsWith('l'+c+'-')));
  assert.ok(M.questionIds(c).every(x=>/^v19-q\d\d$/.test(x)));
 }
});
test('V2.0 代码均可解析',()=>{
 for(const x of ['assets/v2.0-core.js','assets/v2.0.js','assets/v1.8.js','assets/v1.9.js','assets/v1.5.js'])
  new vm.Script(fs.readFileSync(path.join(root,x),'utf8'));
});
test('老教材 51 个模块以及 V1.1～V1.9 脚本均被保留',()=>{
 const h=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
 assert.equal([...h.matchAll(/<section class="mod" id="/g)].length,51);
 for(let i=1;i<=9;i++)assert.ok(h.includes('assets/v1.'+i+'.js'));
 assert.ok(h.includes('assets/v2.0-core.js')&&h.includes('assets/v2.0.js')&&h.includes('assets/v2.0.css'));
});
test('旧版新加的章节定位桥接都存在',()=>{
 for(const p of ['assets/v1.8.js','assets/v1.9.js','assets/v1.5.js']){
  assert.ok(fs.readFileSync(path.join(root,p),'utf8').includes('Navigation=Object.freeze'));
 }
});
test('新增 index.html 可直接进入课堂且保留深链接',()=>{
 const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(page.includes('window.location.replace'));
 assert.ok(page.includes('window.location.hash'));
 assert.ok(page.includes('数字电子技术基础-互动课堂.html'));
});
console.log('全部 '+passed+' 项 V2.0 数据与集成检查通过。真实浏览器 UI 仍需本地验收。');
