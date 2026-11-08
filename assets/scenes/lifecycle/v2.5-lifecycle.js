/* ==========================================================================
   V2.5 阶段 C：3D 场景生命周期与资源管理
   --------------------------------------------------------------------------
   1. 离开场景时把原模块的 running 置 false，requestAnimationFrame 循环随之停止；
      重新进入时由原 onShow_wN 恢复，避免后台空转。
   2. 全站只创建一个 ResizeObserver，观察五个 host，不重复注册。
   3. WebGL 上下文丢失/恢复有明确中文降级提示与渲染循环暂停/恢复。
   4. CDN 或 WebGL 不可用时不伪造成功，显示降级说明。
   5. pagehide 时释放观察者、定时器与自动环绕，避免监听器泄漏。
   ========================================================================== */
(function(root){
'use strict';
const Scenes=root.DigitalV25Scenes;
if(!Scenes)return;
const watched=new Map();
let observer=null,mutation=null,contextHandlers=0,disposed=false;
const activeBefore=new Set();

function message(id,text,bad){
 const bar=document.querySelector('#'+id+' .v25-scene-bar');
 if(!bar)return;
 let box=bar.querySelector('.v25-scene-alert');
 if(!box){box=document.createElement('span');box.className='v25-scene-alert';bar.append(box);}
 box.textContent=text;
 box.classList.toggle('v25-error',!!bad);
}
function ensureResizeObserver(){
 if(observer||typeof ResizeObserver==='undefined')return;
 // 单一实例：所有场景共用，重复进入退出不会再注册。
 observer=new ResizeObserver(entries=>{
  for(const e of entries){
   const item=[...watched.values()].find(x=>x.api.host===e.target);
   if(item)try{item.api.resize();}catch(_){}
  }
 });
}
function onRegister(id,api){
 if(watched.has(id))return;               // 防止同一场景重复绑定
 const entry={api,bound:true,listeners:[],canvas:null,host:api.host};
 watched.set(id,entry);
 ensureResizeObserver();
 if(observer&&api.host)observer.observe(api.host);
 if(api.renderer&&api.renderer.domElement){
  const canvas=api.renderer.domElement;
  entry.canvas=canvas;
  const lost=e=>{
   e.preventDefault();api.stop();Scenes.stopOrbit(id);
   message(id,'WebGL 上下文已丢失，3D 渲染暂停；文字与二维内容仍可使用。',true);
  };
  const restored=()=>{api.start();message(id,'WebGL 上下文已恢复，3D 渲染继续。',false);};
  canvas.addEventListener('webglcontextlost',lost);
  canvas.addEventListener('webglcontextrestored',restored);
  entry.listeners.push({node:canvas,type:'webglcontextlost',fn:lost},
   {node:canvas,type:'webglcontextrestored',fn:restored});
  contextHandlers++;
 }
 // 若 CDN 未加载导致画布迟迟未创建，给出降级说明（不声称渲染成功）。
 setTimeout(()=>{
  if(disposed)return;
  const hasWebGL=!!(root.__K3&&root.__K3.hasWebGL());
  const section=document.getElementById(id);
  if(!section)return;
  const canvas=section.querySelector('canvas');
  if(!canvas||canvas.width<100){
   message(id,hasWebGL
    ?'Three.js CDN 未加载完成，3D 场景暂不可用；请联网后刷新，本讲二维内容不受影响。'
    :'此设备未启用 WebGL，3D 场景无法显示；本讲文字与二维内容仍可学习。',true);
  }
 },3500);
}
function syncActivation(){
 const changed=[];
 for(const [id,item]of watched){
  const section=document.getElementById(id);
  if(!section)continue;
  const active=section.classList.contains('active');
  if(active&&!activeBefore.has(id)){
   activeBefore.add(id);
   if(!item.api.isRunning())item.api.start();
   Scenes.updateStatus(id);
  }else if(!active&&activeBefore.has(id)){
   activeBefore.delete(id);
   item.api.stop();
   Scenes.stopOrbit(id);
   Scenes.updateStatus(id);
   changed.push(id);
  }
 }
 return changed;
}
/* V2.5.1：区分「暂时隐藏」与「永久释放」。
 * 暂时隐藏只停 RAF，GPU 资源保留；forget() 才移除监听器与尺寸观察，
 * 供 scene-polish 在永久销毁后重建场景时重新注册。 */
function forget(id){
 const item=watched.get(id);
 if(item){
  item.listeners.forEach(x=>{
   try{x.node.removeEventListener(x.type,x.fn);}catch(_){}
  });
  contextHandlers-=item.listeners.filter(x=>x.type.indexOf('webglcontext')===0).length;
  if(observer&&item.host){try{observer.unobserve(item.host);}catch(_){}}
 }
 watched.delete(id);
 activeBefore.delete(id);
 Scenes.stopOrbit(id);
 return !!item;
}
function init(){
 const main=document.getElementById('main');if(!main)return;
 // 已注册但生命周期模块晚于场景加载的情况，补齐绑定。
 for(const id of Scenes.ids){const api=Scenes.apiOf(id);if(api)onRegister(id,api);}
 mutation=new MutationObserver(syncActivation);
 mutation.observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
 syncActivation();
 root.addEventListener('pagehide',dispose,{once:true});
}
function dispose(){
 disposed=true;
 if(mutation)mutation.disconnect();
 if(observer)observer.disconnect();
 Scenes.stopAllOrbits();
 for(const [id,item]of watched)item.api.stop();
}
/* 分级验收与泄漏检查用的只读快照。 */
function inspect(){
 return {
  watched:watched.size,
  resizeObservers:observer?1:0,
  contextHandlers,
  active:[...activeBefore],
  running:[...watched].filter(([,v])=>v.api.isRunning()).map(([k])=>k),
  disposed
 };
}
root.DigitalV25Lifecycle=Object.freeze({onRegister,forget,syncActivation,dispose,inspect});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(typeof window!=='undefined'?window:globalThis);
