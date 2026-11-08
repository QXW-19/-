/* ==========================================================================
   V2.5.1 阶段 1：五个 Three.js 场景的视觉精修与资源生命周期
   --------------------------------------------------------------------------
   只通过 V2.5 注入的 register() 接口操作既有场景，不改写教学模型几何与逻辑：
   1) 视觉：补光、材质粗糙度/金属度、曝光对比度、按包围盒自动取景。
   2) 教学信息：关键元件名称、信号状态图例与本场景教学说明。
   3) 相机：按包围球推导缩放上下限，避免相机进入模型内部；平滑过渡。
   4) 生命周期：暂时隐藏只停 RAF；release() 永久释放 GPU/监听器；
      recreate() 重新执行原始内联模块脚本，验证释放后能正确重建。
   ========================================================================== */
(function(root){
'use strict';
const S=root.DigitalV25Scenes;
if(!S)return;
const released=new Set();
const polished=new Set();
const sources=new Map();
const injected=new Map();
const snapshots=new Map();
const rebuildWindowListeners=new Map();
let bootTimer=null,bootTries=0,transitionRaf=0;

/* 每个场景的教学补充：关键元件、信号状态与说明（原创解说，不引用教材原文）。 */
const INFO={
 w1:{title:'数字之城 · 全书知识地图',
  parts:[
   {name:'八章主题建筑',signal:'当前选中章节高亮',note:'点击建筑可跳到对应章节。'},
   {name:'中央总线',signal:'逻辑 1 时为高亮连线',note:'表示章节之间的知识依赖。'},
   {name:'状态指示光点',signal:'0 / 1 / X 三态图例',note:'X 表示尚未确定，不是 0。'}
  ],
  note:'本场景用于建立全书空间印象；比例是示意性的，不代表真实器件尺寸。'},
 w2:{title:'时序流水线 · 模 4 状态环',
  parts:[
   {name:'四级平台',signal:'Q=1 的位点亮',note:'光点按顺序走过四座平台。'},
   {name:'时钟脉冲柱',signal:'上升沿 ↑ 触发状态转移',note:'只在有效沿更新状态。'},
   {name:'回流箭头',signal:'逻辑 1 表示回到初态',note:'四个状态都在环内，无自启动问题。'}
  ],
  note:'理想离散事件模型：不计算传播延迟与时钟偏斜。'},
 w3:{title:'CMOS 剖面 · 反相器',
  parts:[
   {name:'PMOS 上拉网络',signal:'Vin=0 时导通 → Vout=1',note:'输出高电平。'},
   {name:'NMOS 下拉网络',signal:'Vin=1 时导通 → Vout=0',note:'输出低电平。'},
   {name:'输入/输出端子',signal:'0 / 1 / X',note:'输入悬空时输出按未知 X 处理。'}
  ],
  note:'理想开关模型；真实阈值、噪声容限与驱动能力须查数据手册。'},
 w4:{title:'555 振荡器 · RC 充放电',
  parts:[
   {name:'定时电容',signal:'电压在 1/3 VCC ↔ 2/3 VCC 之间',note:'决定周期长短。'},
   {name:'比较器与放电管',signal:'翻转时输出 0/1 切换',note:'形成方波。'},
   {name:'输出方波',signal:'高/低电平 + 占空比',note:'R1 同时参与充放电，占空比大于 50%。'}
  ],
  note:'理想 0.693·RC 模型；真实容差与比较器偏移会改变频率。'},
 w5:{title:'R-2R 梯子 · 位权网络',
  parts:[
   {name:'位开关',signal:'每位 0 / 1',note:'最高位权重最大。'},
   {name:'R-2R 电阻链',signal:'按位权递减',note:'每往下一位权重减半。'},
   {name:'输出节点',signal:'模拟电压 ∝ 数字码',note:'输出与码值成正比。'}
  ],
  note:'理想电阻网络；真实器件受电阻精度与运放失调影响。'}
};

/* ---------- 视觉与取景 ---------- */
function worldBounds(scene){
 scene.updateMatrixWorld(true);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 scene.traverse(obj=>{
  if(!obj.isMesh||!obj.geometry||!obj.geometry.attributes||!obj.geometry.attributes.position)return;
  const g=obj.geometry;
  if(!g.boundingBox)g.computeBoundingBox();
  const b=g.boundingBox;if(!b)return;
  const e=obj.matrixWorld.elements;
  for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z]){
   const p=[
    e[0]*x+e[4]*y+e[8]*z+e[12],
    e[1]*x+e[5]*y+e[9]*z+e[13],
    e[2]*x+e[6]*y+e[10]*z+e[14]
   ];
   for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}
  }
 });
 if(!Number.isFinite(min[0]))return {radius:40,center:[0,0,0]};
 return {
  radius:Math.max(1,0.5*Math.hypot(max[0]-min[0],max[1]-min[1],max[2]-min[2])),
  center:[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2]
 };
}
function applyVisual(id,api){
 if(!api||polished.has(id))return false;
 const scene=api.scene;
 // 补一盏冷色填充光：克隆已有方向光，避免依赖模块作用域内的 THREE 构造器。
 const key=scene.children.find(x=>x.isDirectionalLight||x.isHemisphereLight);
 if(key){
  const fill=key.clone();
  fill.intensity=(key.intensity||1)*0.35;
  if(fill.color&&fill.color.set)fill.color.set(0x9fd8ff);
  fill.position&&fill.position.set(-35,45,-30);
  fill.castShadow=false;
  fill.name='v251-fill-light';
  scene.add(fill);
 }
 // 材质：降低过强的金属感、保留清晰高光，提升模型与背景的对比度。
 let mats=0,geos=0;
 scene.traverse(o=>{
  if(!o.isMesh)return;
  geos++;
  const list=Array.isArray(o.material)?o.material:[o.material];
  list.forEach(m=>{
   if(!m)return;mats++;
   if('roughness' in m)m.roughness=Math.max(0.28,Math.min(0.85,(m.roughness??0.7)*0.88));
   if('metalness' in m)m.metalness=Math.max(0.05,Math.min(0.45,(m.metalness??0.2)*0.8));
  });
 });
 try{api.renderer.toneMappingExposure=1.25;}catch(_){}
 // 按真实包围球取景：默认视角刚好框住内容，且相机不得进入模型内部。
 const b=worldBounds(scene);
 api.v251Bounds=b;
 const fov=(api.camera.fov||45)*Math.PI/180;
 const framed=b.radius/Math.sin(fov/2)*0.9;
 const original=api.defaults?api.defaults.r:framed;
 if(api.limits){
  api.limits.min=Math.max(api.limits.min,Math.round(b.radius*0.95)); // 防穿模下限
  api.limits.max=Math.max(api.limits.max,api.limits.min+10,Math.round(framed*1.35));
 }
 // 取原视角与包围球取景的中值：既不裁切内容，也不过分拉远损失沉浸感。
 const wanted=Math.round((original+framed)/2);
 api.defaults.r=Math.round(Math.min(api.limits?api.limits.max:wanted,
  Math.max(api.limits?api.limits.min:wanted,wanted)));
 const t=api.getTarget();t.r=api.defaults.r;
 api.applyCam();
 polished.add(id);
 return {geometries:geos,materials:mats,fillLight:!!key,bounds:b};
}

/* ---------- 教学信息面板 ---------- */
function buildInfo(id){
 const section=document.getElementById(id);
 if(!section||section.querySelector('.v251-scene-info'))return;
 const cfg=INFO[id];if(!cfg)return;
 const box=document.createElement('section');
 box.className='v251-scene-info';
 const h=document.createElement('h4');h.textContent=cfg.title;box.append(h);
 const legend=document.createElement('div');legend.className='v251-legend';
 [['1','逻辑 1','v251-hi'],['0','逻辑 0','v251-lo'],['X','未知态','v251-x']].forEach(([v,label,cls])=>{
  const s=document.createElement('span');s.className='v251-legend-item '+cls;
  s.textContent=v+' '+label;legend.append(s);
 });
 box.append(legend);
 const ul=document.createElement('ul');
 cfg.parts.forEach(p=>{
  const li=document.createElement('li');
  const b=document.createElement('strong');b.textContent=p.name;
  const sig=document.createElement('span');sig.className='v251-signal';sig.textContent='信号：'+p.signal;
  const note=document.createElement('em');note.textContent=p.note;
  li.append(b,sig,note);ul.append(li);
 });
 box.append(ul);
 const note=document.createElement('p');note.className='v251-hint';note.textContent=cfg.note;
 box.append(note);
 const stat=document.createElement('p');stat.className='v251-scene-stat';
 stat.setAttribute('aria-live','polite');box.append(stat);
 section.append(box);
 refreshStat(id);
}
function refreshStat(id){
 const api=S.apiOf(id),cfg=INFO[id];
 if(!api||!cfg)return;
 const node=document.querySelector('#'+id+' .v251-scene-stat');
 if(!node)return;
 const b=api.v251Bounds||worldBounds(api.scene);
 const t=api.getTarget(),L=api.limits||{min:0,max:0};
 const inside=t.r<b.radius*1.02;
 const text='3D 对象 '+api.scene.children.length+' 个 · 包围半径 '+b.radius.toFixed(0)+
  ' · 相机 r='+t.r.toFixed(0)+'（安全区间 '+L.min+'～'+L.max+'）'+
  ' · '+(inside?'⚠ 可能穿模':'视角安全')+' · '+(api.isRunning()?'渲染中':'已暂停');
 if(node.textContent!==text)node.textContent=text;   // 文本未变化不写 DOM
}

/* ---------- 平滑视角过渡（可被新操作取消，卸载时释放） ---------- */
function smoothTo(id,target,ms=520){
 const api=S.apiOf(id);if(!api)return false;
 if(transitionRaf)cancelAnimationFrame(transitionRaf);
 const t=api.getTarget(),from={r:t.r,th:t.th,ph:t.ph},start=performance.now();
 const ease=x=>1-Math.pow(1-x,3);
 function frame(now){
  const k=Math.min(1,(now-start)/ms),e=ease(k);
  t.r=from.r+(target.r-from.r)*e;
  t.th=from.th+(target.th-from.th)*e;
  t.ph=from.ph+(target.ph-from.ph)*e;
  api.applyCam();refreshStat(id);
  if(k<1)transitionRaf=requestAnimationFrame(frame);else transitionRaf=0;
 }
 transitionRaf=requestAnimationFrame(frame);
 return true;
}

/* ---------- 资源统计、暂时隐藏、永久释放与重建 ---------- */
function resources(id){
 const api=S.apiOf(id);
 if(!api)return {id,registered:false,released:released.has(id)};
 let geometries=0,materials=0,textures=0;
 const seenG=new Set(),seenM=new Set(),seenT=new Set();
 api.scene.traverse(o=>{
  if(!o.isMesh)return;
  if(o.geometry&&!seenG.has(o.geometry.uuid)){seenG.add(o.geometry.uuid);geometries++;}
  (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
   if(!m||seenM.has(m.uuid))return;seenM.add(m.uuid);materials++;
   for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','alphaMap'])
    if(m[k]&&!seenT.has(m[k].uuid)){seenT.add(m[k].uuid);textures++;}
  });
 });
 return {id,registered:true,released:released.has(id),geometries,materials,textures,
  running:api.isRunning(),contextLost:(()=>{try{return api.renderer.getContext().isContextLost();}catch(_){return true;}})()};
}
/* 暂时隐藏：只停 RAF，保留全部 GPU 资源，重新进入由 onShow 恢复。 */
function suspend(id){
 const api=S.apiOf(id);if(!api)return false;
 api.stop();S.stopOrbit(id);refreshStat(id);return true;
}
/* 重建用区段快照：首次保存原始 HTML（剥掉脚本/画布/我们附加的面板）。 */
function saveSnapshot(id){
 if(snapshots.has(id))return;
 const sec=document.getElementById(id);if(!sec)return;
 const wrap=document.createElement('div');wrap.innerHTML=sec.innerHTML;
 wrap.querySelectorAll('script,canvas,.v25-scene-bar,.v251-scene-info').forEach(n=>n.remove());
 snapshots.set(id,wrap.innerHTML);
}
/* 用干净副本替换整个场景区段，连同旧按钮/宿主上的匿名监听一起丢弃。 */
function resetSection(id){
 const sec=document.getElementById(id);if(!sec||!sec.parentNode)return false;
 const html=snapshots.get(id);
 if(!html)return false;
 const fresh=document.createElement('section');
 for(const a of sec.attributes)fresh.setAttribute(a.name,a.value);
 fresh.innerHTML=html;
 sec.parentNode.replaceChild(fresh,sec);
 return true;
}
/* 永久释放：释放 GPU 资源、移除监听器、清空宿主，可再 recreate 重建。 */
function release(id){
 const api=S.apiOf(id);if(!api)return false;
 suspend(id);
 if(root.DigitalV25Lifecycle&&root.DigitalV25Lifecycle.forget)
  root.DigitalV25Lifecycle.forget(id);
 const seenG=new Set(),seenM=new Set(),seenT=new Set();
 api.scene.traverse(o=>{
  if(!o.isMesh)return;
  if(o.geometry&&!seenG.has(o.geometry.uuid)){seenG.add(o.geometry.uuid);o.geometry.dispose();}
  (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
   if(!m||seenM.has(m.uuid))return;seenM.add(m.uuid);
   for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','alphaMap']){
    const tex=m[k];if(tex&&!seenT.has(tex.uuid)){seenT.add(tex.uuid);tex.dispose();}
   }
   m.dispose();
  });
 });
 try{api.renderer.dispose();api.renderer.forceContextLoss();}catch(_){}
 S.unregister(id);
 // 移除上一次重建时该模块新增的 window 级监听，避免逐次累积。
 (rebuildWindowListeners.get(id)||[]).forEach(x=>{
  try{root.removeEventListener(x.type,x.fn,x.opts);}catch(_){}
 });
 rebuildWindowListeners.delete(id);
 resetSection(id);
 polished.delete(id);released.add(id);
 return {geometries:seenG.size,materials:seenM.size,textures:seenT.size};
}
/* 重建：重新执行原始内联 module 源码，验证释放后可正确恢复。 */
function captureSources(){
 for(let i=1;i<=5;i++){
  const id='w'+i;
  saveSnapshot(id);
  if(sources.has(id))continue;
  const needle="DigitalV25Scenes.register('"+id+"'";
  for(const s of document.querySelectorAll('script[type="module"]')){
   if((s.textContent||'').includes(needle)){sources.set(id,s.textContent);break;}
  }
 }
}
function recreate(id){
 if(!sources.has(id))captureSources();
 const src=sources.get(id);if(!src)return Promise.resolve(false);
 const old=injected.get(id);if(old&&old.parentNode)old.parentNode.removeChild(old);
 // 临时包裹 window.addEventListener，记录本次模块新增的监听以便下次释放。
 const collected=[];
 const original=root.addEventListener;
 root.addEventListener=function(type,fn,opts){
  collected.push({type,fn,opts});
  return original.call(this,type,fn,opts);
 };
 const script=document.createElement('script');
 script.type='module';script.textContent=src;
 injected.set(id,script);
 document.body.append(script);
 return new Promise(resolve=>{
  let tries=0;
  const poll=setInterval(()=>{
   const api=S.apiOf(id);
   if(api){
    clearInterval(poll);
    root.addEventListener=original;
    rebuildWindowListeners.set(id,collected);
    released.delete(id);
    applyVisual(id,api);buildInfo(id);refreshStat(id);
    resolve(true);
   }else if(++tries>60){
    clearInterval(poll);root.addEventListener=original;resolve(false);
   }
  },120);
 });
}
function applyAll(){
 captureSources();
 for(const id of S.ids){const api=S.apiOf(id);if(api){applyVisual(id,api);buildInfo(id);}}
 for(let i=1;i<=5;i++)refreshStat('w'+i);
}
function init(){
 applyAll();
 // 内联 module 通过 CDN 动态 import，注册可能晚于本脚本；有上限地等待并合批应用。
 bootTimer=setInterval(()=>{
  bootTries++;
  applyAll();
  if(polished.size>=5||bootTries>40)clearInterval(bootTimer);
 },400);
 root.addEventListener('pagehide',e=>{
  if(bootTimer)clearInterval(bootTimer);
  if(transitionRaf)cancelAnimationFrame(transitionRaf);
  // 真正关闭页面时释放 5 个 WebGL 上下文：只停动画不释放，浏览器关闭
  // 上下文会等待 GPU 队列清空，在并行测试里表现为收尾超时。
  // bfcache 恢复（persisted=true）时不能释放，否则返回页面会看到空白场景。
  if(e&&e.persisted)return;
  for(const id of S.ids){
   try{suspend(id);}catch(_){}
   const api=S.apiOf(id);
   if(api&&api.renderer){
    try{api.renderer.dispose();api.renderer.forceContextLoss();}catch(_){}
   }
  }
 },{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

root.DigitalV251Scenes=Object.freeze({
 INFO,applyVisual,applyAll,buildInfo,refreshStat,smoothTo,
 resources,suspend,release,recreate,
 get released(){return [...released];},
 get polished(){return [...polished];},
 get sourceCount(){return sources.size;}
});
})(typeof window!=='undefined'?window:globalThis);
