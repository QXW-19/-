/* ==========================================================================
   V2.5.1 阶段 3：波形分段归档（纯数据模块）
   --------------------------------------------------------------------------
   保留 V2.5 的 0/1/X 三值采样结构，把线性数组升级为「固定大小分段」：
   - 每段 256 个采样，最多 8 段（2048 个采样），并有 2 MB 估算字节上限；
   - 超出上限时按 FIFO 丢弃最旧整段，长期运行内存不会持续增长；
   - 支持导出 / 导入（带版本与逐条校验）、按全局序号取窗口、明确统计信息。
   本模块不计算任何逻辑值，采样仍由 DigitalV25Signals.sample() 从
   V1.6 仿真引擎的 M.evaluate() 结果生成。
   波形属于理想离散事件教学数据，不是实际示波器测量结果。
   ========================================================================== */
(function(root){
'use strict';
const DEFAULTS=Object.freeze({segmentSize:256,maxSegments:8,maxBytes:2*1024*1024});
const VALID=v=>v===0||v===1||v==='X';

function validateSample(s){
 if(!s||typeof s!=='object')throw Error('采样记录不是对象');
 if(!Number.isInteger(s.tick)||s.tick<0)throw Error('采样时钟序号无效');
 if(typeof s.edge!=='boolean')throw Error('采样边沿标记无效');
 if(!s.channels||typeof s.channels!=='object'||Array.isArray(s.channels))throw Error('采样通道缺失');
 for(const [id,arr]of Object.entries(s.channels)){
  if(!/^n[1-9]\d{0,6}$/.test(id))throw Error('通道元件 ID 无效：'+id);
  if(!Array.isArray(arr))throw Error('通道值不是数组：'+id);
  for(const v of arr)if(!VALID(v))throw Error('通道值必须为 0 / 1 / X：'+id);
 }
 return true;
}
function approxBytes(s){
 // 只按序列化长度估算，避免遍历对象图带来的额外开销。
 try{return JSON.stringify(s).length;}catch(_){return 256;}
}
function create(opts){
 const cfg=Object.assign({},DEFAULTS,opts||{});
 cfg.segmentSize=Math.max(16,Math.min(1024,cfg.segmentSize|0));
 cfg.maxSegments=Math.max(1,Math.min(32,cfg.maxSegments|0));
 let segments=[[]],dropped=0,bytes=0,held=0;

 function flatten(){
  const out=[];
  for(const seg of segments)for(const s of seg)out.push(s);
  return out;
 }
 function trim(){
  // 按整段 FIFO 丢弃；同时用估算字节数兜住异常大的通道数据。
  while(segments.length>cfg.maxSegments||
        (bytes>cfg.maxBytes&&segments.length>1)){
   const old=segments.shift();
   dropped+=old.length;held-=old.length;
   bytes-=old.reduce((n,s)=>n+s.__bytes,0);
  }
  if(!segments.length)segments.push([]);
 }
 function append(sample){
  validateSample(sample);
  const item={tick:sample.tick,edge:sample.edge,channels:sample.channels};
  const size=approxBytes(item);
  item.__bytes=size;
  segments[segments.length-1].push(item);
  bytes+=size;held++;
  if(segments[segments.length-1].length>=cfg.segmentSize)segments.push([]);
  trim();
  return held;
 }
 function clear(){segments=[[]];dropped=0;bytes=0;held=0;}
 function stats(){
  return {total:held,segments:segments.length,segmentSize:cfg.segmentSize,
   maxSegments:cfg.maxSegments,capacity:cfg.segmentSize*cfg.maxSegments,
   maxBytes:cfg.maxBytes,bytes,dropped,firstIndex:dropped};
 }
 /* 支持按全局采样序号取窗口：时间游标与缩放滚动都基于同一份归档。 */
 function range(globalStart,count){
  const all=flatten();
  const from=Math.max(0,Math.min(all.length,globalStart-dropped));
  return {samples:all.slice(from,from+count),fromIndex:dropped+from,total:all.length};
 }
 function exportData(){
  return {
   version:2,kind:'v2.5.1-wave-archive',
   segmentSize:cfg.segmentSize,maxSegments:cfg.maxSegments,
   dropped,segments:segments.map(seg=>seg.map(s=>({
    tick:s.tick,edge:s.edge,channels:s.channels
   })))
  };
 }
 function importData(data){
  if(!data||data.kind!=='v2.5.1-wave-archive'||data.version!==2)
   throw Error('不是 V2.5.1 波形归档文件');
  if(!Array.isArray(data.segments))throw Error('归档分段缺失');
  if(data.segments.length>cfg.maxSegments)throw Error('归档分段数超过上限');
  const incoming=[];let count=0;
  for(const seg of data.segments){
   if(!Array.isArray(seg)||seg.length>cfg.segmentSize)throw Error('分段长度不合法');
   const clean=[];
   for(const raw of seg){
    validateSample(raw);
    clean.push({tick:raw.tick,edge:raw.edge,channels:raw.channels,__bytes:approxBytes(raw)});
    count++;
   }
   incoming.push(clean);
  }
  segments=incoming.length?incoming:[[]];
  dropped=Number.isSafeInteger(data.dropped)&&data.dropped>=0?data.dropped:0;
  held=count;
  bytes=segments.reduce((n,seg)=>n+seg.reduce((m,s)=>m+s.__bytes,0),0);
  // 导入后最后一个分段若已满，补一个空段继续接收新采样。
  if(segments[segments.length-1].length>=cfg.segmentSize)segments.push([]);
  trim();
  return count;
 }
 return Object.freeze({append,clear,flatten,stats,range,exportData,importData,
  get length(){return held;}});
}
root.DigitalV251WaveArchive=Object.freeze({create,DEFAULTS,validateSample});
})(typeof window!=='undefined'?window:globalThis);
