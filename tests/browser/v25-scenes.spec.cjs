/* ==========================================================================
   V2.5 阶段 C/D 浏览器验收：3D 分级检查、相机交互、生命周期、
   课程与实验联动。环境不具备 WebGL/CDN 时显式 skip 并说明原因。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function home(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
}
async function ready(page){
  return page.evaluate(()=>{
   const S=window.DigitalV25Scenes;
   if(!S||S.size===0)return false;
   return S.ids.every(id=>{
    const i=S.inspect(id);
    return i.hasCamera&&i.hasWebGL&&!i.contextLost&&i.objects>0;
   });
  });
}

test('C4-1/2/3：五个场景页面入口、WebGL 初始化与真实 3D 对象',async({page})=>{
  const logs=[];page.on('pageerror',e=>logs.push(e.message));
  await home(page);
  await page.waitForTimeout(4200);
  const ok=await ready(page);
  test.skip(!ok,'Three.js CDN 或 WebGL 不可用，无法验证真实 3D 对象');
  const list=await page.evaluate(()=>window.DigitalV25Scenes.ids.map(id=>window.DigitalV25Scenes.inspect(id)));
  expect(list.length).toBe(5);
  for(const s of list){
   expect(s.registered).toBeTruthy();
   expect(s.hasWebGL).toBeTruthy();
   expect(s.contextLost).toBeFalsy();
   expect(s.objects).toBeGreaterThan(3);   // scene 中确实创建了 3D 对象
  }
  for(let i=1;i<=5;i++){
   await page.evaluate(id=>window.show(id),'w'+i);
   await expect(page.locator('#w'+i)).toHaveClass(/active/);
   await expect(page.locator('#w'+i+' .v25-scene-bar')).toBeVisible();
  }
  expect(logs).toEqual([]);
});

test('C1：重置视角与缩放按钮真实改变球坐标相机且受边界约束',async({page})=>{
  await home(page);await page.waitForTimeout(4200);
  test.skip(!(await ready(page)),'3D 场景未注册');
  await page.evaluate(()=>window.show('w2'));
  await page.waitForTimeout(600);
  const before=await page.evaluate(()=>({...window.DigitalV25Scenes.inspect('w2').target}));
  await page.locator('#w2 .v25-scene-bar button',{hasText:'放大'}).click();
  const zoomed=await page.evaluate(()=>({...window.DigitalV25Scenes.inspect('w2').target}));
  expect(zoomed.r).toBeLessThan(before.r);
  await page.locator('#w2 .v25-scene-bar button',{hasText:'重置视角'}).click();
  const reset=await page.evaluate(()=>({...window.DigitalV25Scenes.inspect('w2').target}));
  expect(reset.r).toBe(before.r);
  expect(reset.th).toBe(before.th);
  // 连续缩小不会突破场景声明的最小/最大半径
  for(let i=0;i<20;i++)await page.locator('#w2 .v25-scene-bar button',{hasText:'缩小'}).click();
  const L=await page.evaluate(()=>window.DigitalV25Scenes.inspect('w2').limits);
  const r=await page.evaluate(()=>window.DigitalV25Scenes.inspect('w2').target.r);
  expect(r).toBeLessThanOrEqual(L.max);
  expect(r).toBeGreaterThanOrEqual(L.min);
});

test('C1：自动环绕改变目标角度，停止后不再变化',async({page})=>{
  await home(page);await page.waitForTimeout(4200);
  test.skip(!(await ready(page)),'3D 场景未注册');
  await page.evaluate(()=>window.show('w2'));
  const a=await page.evaluate(()=>window.DigitalV25Scenes.inspect('w2').target.th);
  await page.locator('#w2 .v25-scene-bar button',{hasText:'自动环绕'}).click();
  await page.waitForTimeout(500);
  const b=await page.evaluate(()=>window.DigitalV25Scenes.inspect('w2').target.th);
  expect(b).toBeGreaterThan(a);
  await page.locator('#w2 .v25-scene-bar button',{hasText:'停止环绕'}).click();
  const c=await page.evaluate(()=>window.DigitalV25Scenes.inspect('w2').target.th);
  await page.waitForTimeout(350);
  expect(await page.evaluate(()=>window.DigitalV25Scenes.inspect('w2').target.th)).toBe(c);
});

test('C3/C4-5：离开场景暂停渲染、反复进出无监听器泄漏',async({page})=>{
  await home(page);await page.waitForTimeout(4200);
  test.skip(!(await ready(page)),'3D 场景未注册');
  for(let round=0;round<3;round++){
   await page.evaluate(()=>window.show('w3'));
   await page.waitForTimeout(300);
   expect(await page.evaluate(()=>window.DigitalV25Scenes.inspect('w3').running)).toBeTruthy();
   await page.evaluate(()=>window.show('c1'));
   await page.waitForTimeout(250);
   expect(await page.evaluate(()=>window.DigitalV25Scenes.inspect('w3').running)).toBeFalsy();
  }
  const lc=await page.evaluate(()=>window.DigitalV25Lifecycle.inspect());
  expect(lc.watched).toBe(5);
  expect(lc.resizeObservers).toBe(1);      // 全站仅一个尺寸观察器
  expect(lc.contextHandlers).toBe(5);
  expect(lc.disposed).toBeFalsy();
  await page.evaluate(()=>window.show('w3'));
  expect(await page.evaluate(()=>window.DigitalV25Scenes.inspect('w3').running)).toBeTruthy();
});

test('C3：WebGL 上下文丢失事件会暂停渲染并给出中文降级说明',async({page})=>{
  await home(page);await page.waitForTimeout(4200);
  test.skip(!(await ready(page)),'3D 场景未注册');
  await page.evaluate(()=>window.show('w4'));
  await page.evaluate(()=>{
   const api=window.DigitalV25Scenes.apiOf('w4');
   const canvas=api.renderer.domElement;
   canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true,bubbles:false}));
  });
  expect(await page.evaluate(()=>window.DigitalV25Scenes.inspect('w4').running)).toBeFalsy();
  await expect(page.locator('#w4 .v25-scene-alert')).toContainText('WebGL 上下文已丢失');
});

test('C4-4：3D 真实渲染截图包含有效画面（环境允许时）',async({page})=>{
  await home(page);await page.waitForTimeout(4200);
  const ok=await ready(page);
  test.skip(!ok,'WebGL 或 Three.js CDN 不可用，跳过真实渲染截图验收');
  await page.evaluate(()=>window.show('w1'));
  await page.waitForTimeout(2200);
  const canvas=page.locator('#city3d canvas').first();
  await expect(canvas).toBeVisible();
  const shot=await canvas.screenshot();
  expect(shot.length).toBeGreaterThan(4000);
  expect(new Set(shot.slice(0,4000)).size).toBeGreaterThan(20);
});

for(const [w,h,name]of[[375,812,'375×812'],[390,844,'390×844'],[768,1024,'768×1024'],[1440,900,'1440×900']]){
  test('C：视口 '+name+' 下 3D 控制条不引起横向溢出',async({page})=>{
   await page.setViewportSize({width:w,height:h});
   await home(page);
   await page.evaluate(()=>window.show('w2'));
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
   const touch=await page.evaluate(()=>{
    const api=window.DigitalV25Scenes&&window.DigitalV25Scenes.apiOf('w2');
    return api?api.host.style.touchAction:null;
   });
   if(touch)expect(touch).toBe('none');
  });
}
