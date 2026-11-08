/* ==========================================================================
   V2.5.1 阶段 3 单元测试：波形分段归档的容量、FIFO、字节上限、
   全局窗口、导出/导入校验与三值逻辑约束。纯 Node，不启动浏览器。
   ========================================================================== */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
require(path.join(root,'assets/labs/waveform-analyzer/v2.5.1-wave-archive.js'));
const A=global.DigitalV251WaveArchive;
let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name);}
const sample=(t,edge=false)=>({tick:t,edge,channels:{n1:[t%2],n2:[['X',0,1][t%3]]}});

check('默认上限为 8 段 × 256 条 = 2048 条采样',()=>{
 const a=A.create();
 assert.equal(a.stats().capacity,2048);
 assert.equal(a.stats().maxSegments,8);
 assert.equal(a.stats().segmentSize,256);
});

check('超过 256 条自动分段，flatten 顺序与写入顺序一致',()=>{
 const a=A.create();
 for(let i=0;i<600;i++)a.append(sample(i));
 const all=a.flatten();
 assert.equal(all.length,600);
 assert.equal(all[0].tick,0);
 assert.equal(all[599].tick,599);
 assert.equal(a.stats().segments,3);   // 256 + 256 + 88
});

check('超过 8 段按 FIFO 丢弃最旧整段，总数与内存估算保持有界',()=>{
 const a=A.create();
 for(let i=0;i<2600;i++)a.append(sample(i));
 const st=a.stats();
 assert.ok(st.total<=st.capacity+st.segmentSize,'总数不得超过容量 + 当前段');
 assert.ok(st.dropped>0,'应有旧的采样被丢弃');
 assert.equal(st.firstIndex,st.dropped);
 const all=a.flatten();
 assert.equal(all[0].tick,st.dropped);
 assert.equal(all[all.length-1].tick,2599);
 assert.ok(st.bytes<=st.maxBytes+4096,'估算字节数必须有上界');
});

check('按全局采样序号取窗口支持时间游标与缩放滚动',()=>{
 const a=A.create();
 for(let i=0;i<500;i++)a.append(sample(i));
 const r=a.range(300,16);
 assert.equal(r.samples.length,16);
 assert.equal(r.samples[0].tick,300);
 assert.equal(r.fromIndex,300);
});

check('导出带版本与类型标记，导入后数据一致',()=>{
 const a=A.create();
 for(let i=0;i<300;i++)a.append(sample(i,i%3===0));
 const data=a.exportData();
 assert.equal(data.version,2);
 assert.equal(data.kind,'v2.5.1-wave-archive');
 assert.ok(Array.isArray(data.segments));
 const b=A.create();
 const n=b.importData(JSON.parse(JSON.stringify(data)));
 assert.equal(n,300);
 const all=b.flatten();
 assert.equal(all.length,300);
 assert.equal(all[299].tick,299);
 assert.equal(all[0].edge,true);
 assert.equal(all[1].edge,false);
});

check('导入非法版本、非法通道值或超长分段会被拒绝',()=>{
 const a=A.create();
 assert.throws(()=>a.importData({version:1,kind:'v2.5.1-wave-archive',segments:[]}),/不是 V2\.5\.1/);
 assert.throws(()=>a.importData({version:2,kind:'other',segments:[]}),/不是 V2\.5\.1/);
 assert.throws(()=>a.importData({version:2,kind:'v2.5.1-wave-archive',segments:[[{tick:0,edge:false,channels:{n1:[2]}}]]}),/0 \/ 1 \/ X/);
 assert.throws(()=>a.importData({version:2,kind:'v2.5.1-wave-archive',segments:new Array(9).fill([])}),/超过上限/);
});

check('只接受 0 / 1 / X 三值，写入非法值立即抛错',()=>{
 const a=A.create();
 assert.throws(()=>a.append({tick:0,edge:false,channels:{n1:[null]}}),/0 \/ 1 \/ X/);
 assert.throws(()=>a.append({tick:-1,edge:false,channels:{n1:[0]}}),/时钟序号/);
 assert.doesNotThrow(()=>a.append({tick:0,edge:false,channels:{n1:[0,1,'X']}}));
});

check('清除后统计归零，可继续接收新采样',()=>{
 const a=A.create();
 for(let i=0;i<300;i++)a.append(sample(i));
 a.clear();
 assert.equal(a.stats().total,0);
 assert.equal(a.stats().bytes,0);
 assert.equal(a.stats().segments,1);
 a.append(sample(0));
 assert.equal(a.stats().total,1);
});
console.log('V2.5.1 波形归档单元测试共 '+count+' 项通过（理想离散事件教学数据）。');
