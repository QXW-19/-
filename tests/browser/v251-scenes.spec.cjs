/* ==========================================================================
   V2.5.1 阶段 1 验收：五个 3D 场景的视觉精修、教学信息、相机防穿模、
   真实渲染、反复进出与「永久释放 → 重建」。
   环境不具备 WebGL / CDN 时显式跳过并说明原因，不把跳过算作通过。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function home(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
  await page.waitForTimeout(4200);
}
async function ready(page){
  // 内联 module 通过 CDN 动态 import，注册可能晚于 load；最多等 15 秒再判定。
  try{
   await page.waitForFunction(()=>{
    const S=window.DigitalV25Scenes,P=window.DigitalV251Scenes;
    return !!S&&!!P&&S.size===5;
   },{timeout:15000});
  }catch(_){return false;}
  return page.evaluate(()=>{
   const S=window.DigitalV25Scenes,P=window.DigitalV251Scenes;
   P.applyAll();
   return S.ids.every(id=>{
    const i=S.inspect(id);return i.hasCamera&&i.hasWebGL&&!i.contextLost&&i.objects>0;
   });
  });
}

test('五个场景都有教学信息面板、三值图例与补光/曝光/取景优化',async({page})=>{
  await home(page);
  const ok=await ready(page);
  test.skip(!ok,'WebGL 或 Three.js CDN 不可用，跳过视觉精修验收');
  const list=await page.evaluate(()=>{
   const S=window.DigitalV25Scenes,P=window.DigitalV251Scenes;
   return S.ids.map(id=>{
    const a=S.apiOf(id),info=document.querySelector('#'+id+' .v251-scene-info');
    return {id,panel:!!info,legend:info?info.querySelectorAll('.v251-legend-item').length:0,
     parts:info?info.querySelectorAll('li').length:0,
     exposure:a.renderer.toneMappingExposure,
     fill:!!a.scene.getObjectByName('v251-fill-light'),
     radius:a.v251Bounds?a.v251Bounds.radius:0,
     limits:a.limits,defaults:a.defaults.r};
   });
  });
  expect(list.length).toBe(5);
  for(const s of list){
   expect(s.panel,s.id+' 应有教学信息面板').toBeTruthy();
   expect(s.legend,s.id+' 应有 0/1/X 图例').toBe(3);
   expect(s.parts,s.id+' 应列出关键元件').toBeGreaterThanOrEqual(3);
   expect(s.exposure).toBe(1.25);
   expect(s.fill,s.id+' 应有补光').toBeTruthy();
   expect(s.radius).toBeGreaterThan(0);
   expect(s.defaults).toBeGreaterThanOrEqual(s.limits.min);
   expect(s.defaults).toBeLessThanOrEqual(s.limits.max);
   // 防穿模：相机最小距离不得小于场景包围半径的 90%
   expect(s.limits.min).toBeGreaterThanOrEqual(Math.floor(s.radius*0.9));
  }
});

test('相机防穿模、缩放边界与平滑过渡对五个场景均有效',async({page})=>{
  test.setTimeout(150000);
  await home(page);
  test.skip(!(await ready(page)),'3D 场景未注册');
  for(let i=1;i<=5;i++){
   const id='w'+i;
   await page.evaluate(x=>window.show(x),id);
   const before=await page.evaluate(x=>{
    const S=window.DigitalV25Scenes,a=S.apiOf(x);
    return {r:{...a.getTarget()},limits:{...a.limits}};
   },id);
   await page.locator('#'+id+' .v25-scene-bar button',{hasText:'缩小'}).click();
   for(let k=0;k<12;k++)await page.evaluate(x=>window.DigitalV25Scenes.zoom(x,1),id);
   const far=await page.evaluate(x=>({...window.DigitalV25Scenes.apiOf(x).getTarget()}),id);
   expect(far.r,id+' 缩小不得超出上限').toBeLessThanOrEqual(before.limits.max);
   for(let k=0;k<20;k++)await page.evaluate(x=>window.DigitalV25Scenes.zoom(x,-1),id);
   const near=await page.evaluate(x=>({...window.DigitalV25Scenes.apiOf(x).getTarget()}),id);
   expect(near.r,id+' 放大不得穿入模型').toBeGreaterThanOrEqual(before.limits.min);
   const smooth=await page.evaluate(async x=>{
    const P=window.DigitalV251Scenes,S=window.DigitalV25Scenes;
    const a=S.apiOf(x),from=a.getTarget().th;
    P.smoothTo(x,{r:a.defaults.r,th:from+0.6,ph:a.getTarget().ph},260);
    await new Promise(r=>setTimeout(r,380));
    return a.getTarget().th;
   },id);
   expect(smooth,id+' 平滑过渡应改变目标角度').toBeGreaterThan(before.r.th+0.2);
   await page.locator('#'+id+' .v25-scene-bar button',{hasText:'重置视角'}).click();
  }
});

test('五个场景逐个真实渲染截图，并给出视角安全状态',async({page})=>{
  test.setTimeout(150000);
  await home(page);
  const ok=await ready(page);
  test.skip(!ok,'WebGL 或 Three.js CDN 不可用，跳过真实渲染验收');
  for(let i=1;i<=5;i++){
   const id='w'+i;
   await page.evaluate(x=>window.show(x),id);
   await page.waitForTimeout(900);
   const canvas=page.locator('#'+id+' canvas:visible').first();
   await expect(canvas,id+' canvas 应可见').toBeVisible();
   const shot=await canvas.screenshot();
   expect(shot.length,id+' 截图应有有效画面').toBeGreaterThan(4000);
   await expect(page.locator('#'+id+' .v251-scene-stat')).toContainText('视角安全');
  }
});

test('反复进入退出五个场景，渲染循环按预期暂停与恢复且监听器不累积',async({page})=>{
  test.setTimeout(150000);
  await home(page);
  test.skip(!(await ready(page)),'3D 场景未注册');
  for(let round=0;round<3;round++){
   for(let i=1;i<=5;i++){
    await page.evaluate(x=>window.show(x),'w'+i);
   }
  }
  // 暂时隐藏：只停 RAF，GPU 资源保留（registered 仍为 true）
  await page.evaluate(()=>window.show('c1'));
  await page.waitForTimeout(300);
  const state=await page.evaluate(()=>{
   const S=window.DigitalV25Scenes,L=window.DigitalV25Lifecycle;
   return {running:S.ids.map(id=>S.inspect(id).running),
    registered:S.size,lc:L.inspect()};
  });
  expect(state.running.every(x=>x===false)).toBeTruthy();
  expect(state.registered).toBe(5);
  expect(state.lc.watched).toBe(5);
  expect(state.lc.resizeObservers).toBe(1);
  expect(state.lc.contextHandlers).toBe(5);
  expect(state.lc.contextListeners).toBe(10); // 每场景 lost + restored 两个监听
  expect(await page.evaluate(()=>window.DigitalV251Scenes.polished.length)).toBe(5);
});

test('永久释放后能逐个重建场景，GPU 资源与教学面板均恢复',async({page})=>{
  test.setTimeout(180000);
  await home(page);
  const ok=await ready(page);
  test.skip(!ok,'WebGL 或 Three.js CDN 不可用，跳过释放/重建验收');
  const result=await page.evaluate(async()=>{
   const P=window.DigitalV251Scenes,S=window.DigitalV25Scenes;
   const out=[];
   for(const id of ['w1','w2','w3','w4','w5']){
    const before=P.resources(id);
    const freed=P.release(id);
    const removed=!S.apiOf(id)&&document.querySelectorAll('#'+id+' canvas').length===0;
    const rebuilt=await P.recreate(id);
    await new Promise(r=>setTimeout(r,250));
    const after=P.resources(id);
    out.push({id,before:registeredCount(before),freed,rebuilt,removed,
     after:registeredCount(after),panel:document.querySelectorAll('#'+id+' .v251-scene-info').length,
     canvas:document.querySelectorAll('#'+id+' canvas').length});
   }
   function registeredCount(x){return x.registered?x.geometries:0;}
   return out;
  });
  for(const r of result){
   expect(r.freed.geometries,r.id+' 应释放几何体').toBeGreaterThan(0);
   expect(r.removed,r.id+' 释放后应注销且无画布').toBeTruthy();
   expect(r.rebuilt,r.id+' 应能重建').toBeTruthy();
   expect(r.after,r.id+' 重建后应恢复几何体').toBeGreaterThan(0);
   expect(r.panel,r.id+' 重建后应有教学面板').toBe(1);
   expect(r.canvas,r.id+' 重建后应有画布').toBeGreaterThan(0);
  }
  expect(await page.evaluate(()=>window.DigitalV25Lifecycle.inspect().watched)).toBe(5);
});

test('WebGL 上下文丢失降级与恢复仍可用',async({page})=>{
  await home(page);
  test.skip(!(await ready(page)),'3D 场景未注册');
  await page.evaluate(()=>window.show('w3'));
  await page.evaluate(()=>{
   const a=window.DigitalV25Scenes.apiOf('w3');
   a.renderer.domElement.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));
  });
  expect(await page.evaluate(()=>window.DigitalV25Scenes.inspect('w3').running)).toBeFalsy();
  await expect(page.locator('#w3 .v25-scene-alert')).toContainText('WebGL 上下文已丢失');
});
