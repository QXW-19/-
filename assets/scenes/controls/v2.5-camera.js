/* ==========================================================================
   V2.5 阶段 C：五个 Three.js 场景的统一相机与交互控制器
   --------------------------------------------------------------------------
   场景内部原本已有球坐标相机 sph/tar、鼠标拖拽旋转与滚轮缩放、running 循环。
   本模块通过原模块注入的 register() 拿到同一组对象，只补充：
   一键重置视角、自动环绕/暂停、缩放边界、触摸双指缩放、
   状态显示与分级验收查询接口。不复制渲染循环，不改动教学模型。
   ========================================================================== */
(function(root){
'use strict';
const scenes=new Map();
const el=(tag,text,cls)=>{
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
};
function button(label,fn){
 const b=el('button',label,'v25-btn');b.type='button';
 b.addEventListener('click',fn);return b;
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function register(id,api){
 if(!api||!api.camera||!api.renderer||!api.scene||!api.host)return false;
 scenes.set(id,api);
 buildBar(id,api);
 bindTouch(id,api);
 // 生命周期模块（若已加载）在此接入上下文丢失与尺寸观察，避免重复注册。
 if(root.DigitalV25Lifecycle&&root.DigitalV25Lifecycle.onRegister)
  root.DigitalV25Lifecycle.onRegister(id,api);
 return true;
}
function buildBar(id,api){
 const section=document.getElementById(id);
 if(!section||section.querySelector('.v25-scene-bar'))return;
 const bar=el('div',undefined,'v25-scene-bar');
 bar.append(el('strong','3D 相机控制'));
 const status=el('span',undefined,'v25-scene-status');status.setAttribute('aria-live','polite');
 bar.append(button('⟲ 重置视角',()=>{
  Object.assign(api.getTarget(),api.defaults);
  api.applyCam();
  setStatus(id,'已重置为默认视角。');
 }));
 const orbit=button('↻ 自动环绕',()=>toggleOrbit(id,orbit));
 bar.append(orbit);
 const pause=button('⏸ 暂停渲染',()=>{
  if(api.isRunning()){api.stop();pause.textContent='▶ 继续渲染';setStatus(id,'已暂停渲染循环。');}
  else{api.start();pause.textContent='⏸ 暂停渲染';setStatus(id,'渲染循环已恢复。');}
 });
 bar.append(pause);
 bar.append(button('+ 放大',()=>zoom(id,-1)),button('− 缩小',()=>zoom(id,1)));
 bar.append(status);
 section.append(bar);
 updateStatus(id);
}
function setStatus(id,text){
 const s=document.querySelector('#'+id+' .v25-scene-status');
 if(s)s.textContent=text;
}
function updateStatus(id){
 const api=scenes.get(id);if(!api)return;
 const t=api.getTarget(),s=api.getSpherical();
 const node=document.querySelector('#'+id+' .v25-scene-status');
 if(!node)return;
 const text='目标 r='+t.r.toFixed(0)+' θ='+t.th.toFixed(2)+
   ' / 实际 r='+s.r.toFixed(0)+' · '+(api.isRunning()?'渲染中':'已暂停');
 if(node.textContent!==text)node.textContent=text;
}
function zoom(id,dir){
 const api=scenes.get(id);if(!api)return;
 const t=api.getTarget(),L=api.limits||{min:40,max:200};
 t.r=clamp(t.r+dir*(L.max-L.min)*0.12,L.min,L.max);
 api.applyCam();updateStatus(id);
}
/* 双指触摸缩放：与原有单指拖拽旋转并存，不改变原事件绑定。 */
function bindTouch(id,api){
 const host=api.host;if(!host||host.dataset.v25Touch==='1')return;
 host.dataset.v25Touch='1';
 host.style.touchAction='none';
 let last=null;
 host.addEventListener('touchstart',e=>{
  if(e.touches.length===2)last=dist(e.touches);
 },{passive:true});
 host.addEventListener('touchmove',e=>{
  if(e.touches.length!==2)return;
  e.preventDefault();
  const d=dist(e.touches);
  if(last&&d>0){
   const t=api.getTarget(),L=api.limits||{min:40,max:200};
   t.r=clamp(t.r+(last-d)*0.35,L.min,L.max);
   api.applyCam();updateStatus(id);
  }
  last=d;
 },{passive:false});
 host.addEventListener('touchend',()=>{last=null;},{passive:true});
}
function dist(t){
 const dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;
 return Math.sqrt(dx*dx+dy*dy);
}
const orbits=new Map();
function toggleOrbit(id,button){
 const api=scenes.get(id);if(!api)return;
 if(orbits.has(id)){
  clearInterval(orbits.get(id));orbits.delete(id);
  button.textContent='↻ 自动环绕';
  setStatus(id,'自动环绕已暂停。');return;
 }
 if(api.setAuto)api.setAuto(false);   // w1 自带自动旋转，先关掉避免叠加
 const timer=setInterval(()=>{
  if(!api.isRunning())return;
  api.getTarget().th+=0.02;
  api.applyCam();
 },50);
 orbits.set(id,timer);
 button.textContent='⏸ 停止环绕';
 setStatus(id,'自动环绕中（每 50 ms 更新目标角度，沿用原渲染循环）。');
}
function stopOrbit(id){
 if(!orbits.has(id))return;
 clearInterval(orbits.get(id));orbits.delete(id);
 const b=document.querySelector('#'+id+' .v25-scene-bar button:nth-of-type(2)');
 if(b)b.textContent='↻ 自动环绕';
}
function stopAllOrbits(){[...orbits.keys()].forEach(stopOrbit);}

/* 分级验收查询：真实对象、WebGL 上下文与相机状态，不靠 canvas 存在与否判断。 */
function inspect(id){
 const api=scenes.get(id);
 if(!api)return {id,registered:false};
 let gl=null,contextLost=false;
 try{
  gl=api.renderer.getContext();
  contextLost=gl?gl.isContextLost():true;
 }catch(_){contextLost=true;}
 return {
  id,registered:true,
  objects:api.scene?api.scene.children.length:0,
  hasCamera:!!api.camera,
  hasWebGL:!!gl,contextLost,
  running:api.isRunning(),
  target:{...api.getTarget()},
  spherical:{...api.getSpherical()},
  limits:api.limits
 };
}
function apiOf(id){return scenes.get(id)||null;}

root.DigitalV25Scenes=Object.freeze({
 register,inspect,zoom,updateStatus,stopOrbit,stopAllOrbits,apiOf,
 get ids(){return [...scenes.keys()];},
 get size(){return scenes.size;}
});
})(typeof window!=='undefined'?window:globalThis);
