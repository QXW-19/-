/* ==========================================================================
   V2.5 多通道逻辑波形分析仪
   --------------------------------------------------------------------------
   波形数据来自 V2.5 电路实验室在同一仿真核心上的采样记录：
   每次输入改变、接线改变或点击单步时钟后，实验室调用 record(circuit)，
   本模块只读取 M.evaluate() 的结果绘制 0 / 1 / X 三值波形，不重算逻辑。
   明确边界：这是理想离散事件采样的教学波形，不是真实示波器测量。
   ========================================================================== */
(function(root){
'use strict';
const M=root.DigitalMixedCircuit,S=root.DigitalV25Signals;
const NS='http://www.w3.org/2000/svg';
function el(tag,text,cls){
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
}
function svg(tag,attrs){
 const n=document.createElementNS(NS,tag);
 for(const [k,v]of Object.entries(attrs||{}))n.setAttribute(k,String(v));
 return n;
}
function button(label,fn,cls){
 const b=el('button',label,cls||'v25-btn');b.type='button';
 b.addEventListener('click',fn);return b;
}

function create(host,lab){
 if(!host||!lab)throw Error('波形分析仪缺少宿主或实验室接口');
 /* V2.5.1：分段归档替代线性数组；samples 只作为扁平化只读缓存。 */
 const WA=root.DigitalV251WaveArchive;
 if(!WA)throw Error('波形归档模块未加载');
 const archive=WA.create();
 let samples=[],channelKeys=[],view=16,offset=0,cursor=0,onClock=null;
 const wrap=el('section',undefined,'v25-wave');
 wrap.append(el('h3','交互式时序波形分析仪'));
 const note=el('p',undefined,'v25-hint');
 note.textContent='每个采样点都是同一仿真引擎的一次状态记录；↑ 表示有效上升沿。本工具为理想数字逻辑与离散事件教学仿真，不计算真实传播延迟、噪声、建立保持时间违例或亚稳态，不能当作真实示波器测量结果。';
 wrap.append(note);

 const bar=el('div',undefined,'v25-wave-controls');
 const stepBtn=button('↑ 单步时钟',()=>lab.pulse());
 const sampleBtn=button('⏺ 采样当前状态',()=>record(lab.getCircuit(),false));
 const runBtn=button('▶ 自动时钟',()=>lab.toggleAutoClock(runBtn));
 const resetBtn=button('⟲ 复位',()=>lab.resetCircuit());
 const clearBtn=button('清除历史',()=>{archive.clear();samples=[];offset=0;cursor=0;updateStats();draw();});
 const zoomIn=button('+ 放大',()=>{view=Math.max(4,view/2);draw();});
 const zoomOut=button('− 缩小',()=>{view=Math.min(64,view*2);draw();});
 const left=button('◀',()=>{offset=Math.max(0,offset-Math.max(1,Math.floor(view/2)));draw();});
 const right=button('▶',()=>{offset=Math.min(Math.max(0,samples.length-1),offset+Math.max(1,Math.floor(view/2)));draw();});
 const exportBtn=button('⇩ 导出波形',exportWave);
 const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
 file.addEventListener('change',async()=>{
  const f=file.files&&file.files[0];if(!f)return;
  try{
   if(f.size>4*1024*1024)throw Error('波形文件不能超过 4 MB');
   importWave(JSON.parse(await f.text()));
  }catch(err){readout.textContent='波形导入失败：'+err.message;}
  finally{file.value='';}
 });
 const importBtn=button('⇧ 导入波形',()=>file.click());
 bar.append(stepBtn,sampleBtn,runBtn,resetBtn,clearBtn,zoomIn,zoomOut,left,right,exportBtn,importBtn,file);
 wrap.append(bar);

 const channelBox=el('div',undefined,'v25-channel-box');
 wrap.append(channelBox);
 const plot=svg('svg',{class:'v25-wave-svg',viewBox:'0 0 900 300',role:'img','aria-label':'多通道数字信号波形'});
 wrap.append(plot);
 const readout=el('p',undefined,'v25-wave-readout');readout.setAttribute('aria-live','polite');
 wrap.append(readout);
 const statBox=el('p',undefined,'v251-archive-stat');
 statBox.setAttribute('aria-live','polite');wrap.append(statBox);
 function updateStats(){
  const a=archive.stats();
  const text='归档：'+a.segments+' 段 / 上限 '+a.maxSegments+' 段（每段 '+a.segmentSize+
   ' 采样，共 '+a.capacity+' 条）· 当前 '+a.total+' 条 · 估算 '+Math.round(a.bytes/1024)+
   ' KB / 上限 '+Math.round(a.maxBytes/1024)+' KB · 已丢弃最旧 '+a.dropped+' 条';
  if(statBox.textContent!==text)statBox.textContent=text;
 }
 const caseBox=el('div',undefined,'v25-case-box');
 wrap.append(caseBox);
 host.append(wrap);

 /* ---------- 通道 ---------- */
 function availableChannels(circuit){
  const out=[];
  for(const n of circuit.nodes){
   const spec=M.SPECS[n.type];
   const count=spec.kind==='source'?spec.outs.length
     :spec.kind==='sink'?spec.ins.length:spec.outs.length;
   const base=spec.kind==='sink'?spec.ins:spec.outs;
   for(let i=0;i<count;i++){
    out.push({key:n.id+':'+i,label:n.id+' · '+spec.label+' · '+(base[i]||('Q'+i))});
   }
  }
  return out;
 }
 function rebuildChannels(circuit){
  const all=availableChannels(circuit);
  const keys=new Set(all.map(x=>x.key));
  channelKeys=channelKeys.filter(k=>keys.has(k));
  if(!channelKeys.length)channelKeys=all.slice(0,6).map(x=>x.key);
  channelBox.replaceChildren();
  channelBox.append(el('strong','观察通道：'));
  all.forEach(ch=>{
   const label=el('label',undefined,'v25-channel');
   const box=el('input');box.type='checkbox';box.checked=channelKeys.includes(ch.key);
   box.addEventListener('change',()=>{
    if(box.checked){if(!channelKeys.includes(ch.key))channelKeys.push(ch.key);}
    else channelKeys=channelKeys.filter(k=>k!==ch.key);
    draw();
   });
   label.append(box,el('span',ch.label));channelBox.append(label);
  });
  if(!all.length)channelBox.append(el('span','（画布为空，先载入一个教学案例）','v25-hint'));
 }
 function rebuildCases(){
  const E=root.DigitalV25Examples;if(!E)return;
  caseBox.replaceChildren(el('strong','教学案例：'));
  E.CASES.forEach(c=>{
   const b=button(c.name,()=>loadCase(c.id),'v25-btn soft');
   b.title=c.goal;caseBox.append(b);
  });
  const panel=el('div',undefined,'v25-case-detail');panel.id='v25-case-detail';
  caseBox.append(panel);
 }
 function loadCase(id){
  const E=root.DigitalV25Examples;if(!E)return;
  lab.loadCircuit(E.build(id),'案例：'+E.get(id).name);
  archive.clear();samples=[];offset=0;cursor=0;
  showCase(id);
  record(lab.getCircuit());
 }
 function showCase(id){
  const E=root.DigitalV25Examples,panel=document.getElementById('v25-case-detail');
  if(!E||!panel)return;
  const c=E.get(id);if(!c)return;
  panel.replaceChildren();
  panel.append(el('h4',c.name+' · '+c.goal));
  const ol=el('ol');c.steps.forEach(s=>ol.append(el('li',s)));panel.append(ol);
  panel.append(el('p','预期结果：'+c.expect),el('p','验证说明：'+c.verify));
 }

 /* ---------- 采样与绘制 ---------- */
 function record(circuit,edge){
  if(!circuit||!circuit.nodes.length)return;
  const snap=S.sample(circuit,circuit.tick,edge);
  archive.append(snap);
  samples=archive.flatten();   // 归档上限固定，缓存不会无限增长
  updateStats();
  if(samples.length>view)offset=samples.length-view;
  cursor=samples.length-1;
  rebuildChannels(circuit);
  draw();
 }
 function valueAt(sample,key){
  if(!sample)return 'X';
  const [id,idx]=key.split(':');
  const arr=sample.channels[id];
  if(!arr||arr[idx]===undefined)return 'X';
  return arr[idx];
 }
 function draw(){
  plot.replaceChildren();
  const W=900,H=300,left=150,top=18,rowH=34;
  const rows=Math.max(1,channelKeys.length);
  const usableH=H-top-28;
  const rh=Math.min(38,usableH/rows);
  const visible=samples.slice(offset,offset+view);
  const stepW=visible.length>1?(W-left-20)/Math.max(view-1,1):(W-left-20);
  plot.setAttribute('viewBox','0 0 '+W+' '+Math.max(160,top+rows*rh+30));

  // 时间栅格与刻度
  for(let i=0;i<view;i++){
   const x=left+i*stepW;
   plot.append(svg('line',{x1:x,y1:top,x2:x,y2:top+rows*rh,class:'v25-grid'}));
   if(i%4===0){
    const tick=svg('text',{x:x+2,y:top-4,class:'v25-axis'});
    const s=visible[i];
    tick.textContent=s?'T'+s.tick:String(offset+i);
    plot.append(tick);
   }
  }
  // 有效上升沿标记
  visible.forEach((s,i)=>{
   if(!s.edge)return;
   const x=left+i*stepW;
   plot.append(svg('line',{x1:x,y1:top,x2:x,y2:top+rows*rh,class:'v25-edge-line'}));
   const t=svg('text',{x:x+2,y:top+10,class:'v25-edge-text'});t.textContent='↑';plot.append(t);
  });
  // 每条通道的数字阶梯波
  channelKeys.forEach((key,row)=>{
   const y0=top+row*rh+rh*0.72,y1=top+row*rh+rh*0.28,yx=top+row*rh+rh*0.5;
   plot.append(svg('line',{x1:left,y1:y0,x2:W-16,y2:y0,class:'v25-baseline'}));
   const label=svg('text',{x:6,y:top+row*rh+rh*0.62,class:'v25-channel-label'});
   label.textContent=key;plot.append(label);
   const yOf=v=>v===1?y1:v===0?y0:yx;
   let prev=null;
   visible.forEach((s,i)=>{
    const v=valueAt(s,key),x=left+i*stepW;
    const y=yOf(v);
    if(prev!==null&&prev.v!==v){
     plot.append(svg('line',{x1:x,y1:yOf(prev.v),x2:x,y2:y,class:'v25-step '+(v==='X'?'v25-sig-x':'v25-sig-high')}));
    }
    if(prev===null||prev.v!==v||i===visible.length-1){
     plot.append(svg('line',{x1:x,y1:y,x2:x+stepW,y2:y,class:'v25-level '+S.signalClass(v==='X'?null:Number(v))}));
     if(v==='X'){
      const t=svg('text',{x:x+3,y:y-4,class:'v25-x-text'});t.textContent='X';plot.append(t);
     }
    }
    prev={v};
   });
  });
  // 时间游标
  if(visible.length){
   const ci=Math.max(0,Math.min(visible.length-1,cursor-offset));
   const cx=left+ci*stepW;
   plot.append(svg('line',{x1:cx,y1:top,x2:cx,y2:top+rows*rh,class:'v25-cursor'}));
  }
  const cur=samples[cursor];
  readout.textContent=cur
   ?'游标：采样 #'+cursor+' · 时钟脉冲 '+cur.tick+(cur.edge?' · 本次含有效上升沿 ↑':'')+
     ' · '+channelKeys.map(k=>k+'='+valueAt(cur,k)).join('，')
   :'暂无采样记录。载入案例或切换输入开关后会自动记录。';
 }
 plot.addEventListener('click',e=>{
  const rect=plot.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width*900;
  const visible=samples.slice(offset,offset+view);
  const stepW=(900-150-20)/Math.max(view-1,1);
  const idx=Math.max(0,Math.min(visible.length-1,Math.round((x-150)/stepW)));
  if(visible.length){cursor=offset+idx;draw();}
 });

 /* ---------- 对外接口（V2.5.1：归档导出/导入与内存上限） ---------- */
 function exportWave(){
  // 导出文件带版本与类型标记，导入时逐条校验，防止把任意 JSON 当波形数据。
  const data=Object.assign(archive.exportData(),{channelKeys,view,source:'V1.6 DigitalMixedCircuit 离散事件采样'});
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=el('a');
  a.href=url;a.download='数字电路-V2.5.1-波形归档.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
  readout.textContent='已导出 '+archive.stats().total+' 条采样（理想离散事件教学数据，非示波器测量）。';
  return data;
 }
 function importWave(data){
  const count=archive.importData(data);          // 版本/分段/逐条采样校验
  samples=archive.flatten();
  if(Array.isArray(data.channelKeys))channelKeys=data.channelKeys.slice(0,12);
  if(Number.isFinite(data.view))view=Math.max(4,Math.min(64,data.view));
  cursor=Math.max(0,samples.length-1);
  offset=Math.max(0,samples.length-view);
  updateStats();rebuildChannels(lab.getCircuit());draw();
  readout.textContent='已导入 '+count+' 条波形采样。';
  return count;
 }
 function setConfig(cfg){
  if(!cfg)return;
  // 兼容 V2.5 的旧配置（线性 samples 数组），逐条校验后写入归档。
  if(Array.isArray(cfg.samples)&&!cfg.archive){
   archive.clear();
   cfg.samples.slice(-archive.stats().capacity).forEach(x=>{
    try{WA.validateSample(x);archive.append(x);}catch(_){}
   });
   samples=archive.flatten();
  }else if(cfg.archive){
   try{archive.importData(cfg.archive);samples=archive.flatten();}catch(_){}
  }
  if(Array.isArray(cfg.channelKeys))channelKeys=cfg.channelKeys.slice(0,12);
  if(Number.isFinite(cfg.view))view=Math.max(4,Math.min(64,cfg.view));
  cursor=Math.max(0,samples.length-1);
  offset=Math.max(0,samples.length-view);
  updateStats();draw();
 }
 // 历史波形只在当前会话保存；localStorage 仅记录通道与缩放配置，避免存档膨胀。
 function getConfig(){return {channelKeys,view};}
 function reset(){archive.clear();samples=[];offset=0;cursor=0;updateStats();draw();}
 function archiveStats(){return archive.stats();}
 function currentCircuit(){return lab.getCircuit();}

 rebuildCases();
 const c=currentCircuit();
 if(c)rebuildChannels(c);
 updateStats();draw();
 return Object.freeze({record,draw,rebuildChannels,showCase,loadCase,setConfig,getConfig,reset,
   exportWave,importWave,archiveStats,
   get samples(){return samples;},get channelKeys(){return channelKeys;}});
}

root.DigitalV25Waveform=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
