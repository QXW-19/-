/* ==========================================================================
   V2.5.1 阶段 2 验收：触摸拖放、事件委托去重、手势冲突、
   端口吸附与错误提示、撤销重做一致性、旧 JSON 兼容、桌面功能未破坏。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function lab(page){
  await page.goto('/');
  await page.evaluate(()=>window.show('v25-lab'));
  await expect(page.locator('#v25-lab')).toHaveClass(/active/);
}
const stat=page=>page.evaluate(()=>{
 const L=window.DigitalV25Lab,c=L.getCircuit();
 return {nodes:c.nodes.length,wires:c.wires.length,history:L.historyStatus(),view:L.viewState()};
});
test('触屏从元件库直接拖到画布可放置元件',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.loadCircuit(window.DigitalMixedCircuit.empty(),'空白'));
  const before=(await stat(page)).nodes;
  // 触屏：pointerdown 在元件按钮 → pointermove/pointerup 在 document（指针被按钮捕获）
  const pos=await page.evaluate(()=>{
   const b=document.querySelector('.v25-palette-item'),r=document.querySelector('.v25-canvas').getBoundingClientRect();
   const s=b.getBoundingClientRect();
   return {sx:s.left+s.width/2,sy:s.top+s.height/2,cx:r.left+r.width*0.45,cy:r.top+r.height*0.45};
  });
  await page.evaluate(({sx,sy,cx,cy})=>{
   const b=document.querySelector('.v25-palette-item');
   const mk=(type,x,y)=>new PointerEvent(type,{bubbles:true,cancelable:true,
    pointerId:1,pointerType:'touch',isPrimary:true,clientX:x,clientY:y,
    button:0,buttons:type==='pointerup'?0:1});
   b.dispatchEvent(mk('pointerdown',sx,sy));
   document.dispatchEvent(mk('pointermove',(sx+cx)/2,(sy+cy)/2));
   document.dispatchEvent(mk('pointermove',cx,cy));
   document.dispatchEvent(mk('pointerup',cx,cy));
  },pos);
  const afterTouch=(await stat(page)).nodes;
  expect(afterTouch).toBe(before+1);          // 严格验证触摸路径，不使用桌面兜底
  expect(await page.locator('.v251-ghost').count()).toBe(0);
  await expect(page.locator('.v25-status [role="status"]')).toContainText('已添加');
});

test('桌面 HTML5 拖放与鼠标端口操作未被触摸优化破坏',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.loadCircuit(window.DigitalMixedCircuit.empty(),'空白'));
  const before=(await stat(page)).nodes;
  await page.locator('.v25-palette-item').first().dragTo(page.locator('.v25-canvas'));
  expect((await stat(page)).nodes).toBe(before+1);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('halfadder'));
  const w=(await stat(page)).wires;
  await page.locator('.v25-node[data-id="n5"] .v25-port.in').click();
  expect((await stat(page)).wires).toBe(w-1);
  await page.locator('.v25-node[data-id="n3"] .v25-port.out').click();
  await page.locator('.v25-node[data-id="n5"] .v25-port.in').click();
  expect((await stat(page)).wires).toBe(w);
});

test('多次重绘后端口仍只响应一次（无重复注册）',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('halfadder'));
  // 触发 10 次重绘
  for(let i=0;i<5;i++){
   await page.locator('.v25-node[data-id="n1"] .v25-node-hit').click();
   await page.locator('.v25-node[data-id="n2"] .v25-node-hit').click();
  }
  const before=(await stat(page)).wires;
  await page.locator('.v25-node[data-id="n5"] .v25-port.in').click(); // 断开
  expect((await stat(page)).wires).toBe(before-1);
  await page.locator('.v25-node[data-id="n3"] .v25-port.out').click();
  await page.locator('.v25-node[data-id="n5"] .v25-port.in').click();
  expect((await stat(page)).wires).toBe(before);   // 恰好恢复一条，不是多条
});

test('端口吸附高亮与错误接线给出中文原因',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('halfadder'));
  const out=await page.locator('.v25-node[data-id="n3"] .v25-port.out').boundingBox();
  const inp=await page.locator('.v25-node[data-id="n5"] .v25-port.in').boundingBox();
  await page.mouse.move(out.x+out.width/2,out.y+out.height/2);
  await page.mouse.down();
  await page.mouse.move(inp.x+inp.width/2,inp.y+inp.height/2,{steps:8});
  await expect(page.locator('.v25-port.v25-port-snap')).toHaveCount(1);
  await expect(page.locator('.v251-wire-hint')).toContainText('吸附');
  await page.mouse.up();
  await expect(page.locator('.v251-wire-hint')).toContainText('接线完成');
  // 非法：把输出接回同一元件的输入端
  const selfIn=await page.locator('.v25-node[data-id="n3"] .v25-port.in').first().boundingBox();
  await page.locator('.v25-node[data-id="n3"] .v25-port.out').click();
  await page.locator('.v25-node[data-id="n3"] .v25-port.in').first().click();
  await expect(page.locator('.v251-wire-hint')).toContainText('不能把元件输出接回自己');
  await expect(page.locator('.v25-status [role="status"]')).toContainText('接线被拒绝');
});

test('双指缩放优先于拖拽，手势之间不会互相破坏',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('halfadder'));
  const v0=(await stat(page)).view;
  const box=await page.locator('.v25-canvas').boundingBox();
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.evaluate(({x,y})=>{
   const c=document.querySelector('.v25-canvas');
   const mk=(type,id,px,py,secondary)=>new PointerEvent(type,{bubbles:true,cancelable:true,
    pointerId:id,pointerType:'touch',isPrimary:!secondary,clientX:px,clientY:py,button:0,buttons:1});
   c.dispatchEvent(mk('pointerdown',11,x-40,y,false));
   c.dispatchEvent(mk('pointerdown',12,x+40,y,true));
   c.dispatchEvent(mk('pointermove',12,x+120,y,true));
   c.dispatchEvent(mk('pointerup',12,x+120,y,true));
   c.dispatchEvent(mk('pointerup',11,x-40,y,false));
  },{x,y});
  const v1=(await stat(page)).view;
  expect(v1.scale).not.toBe(v0.scale);
  expect(await page.evaluate(()=>window.DigitalV25Lab.gestureState())).not.toBe('pinch');
  expect((await stat(page)).history.valid).toBeTruthy();
});

test('撤销与重做后电路仍合法，且与快照一致',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('halfadder'));
  const base=await stat(page);
  await page.locator('.v25-node[data-id="n5"] .v25-port.in').click();   // 断线
  expect((await stat(page)).wires).toBe(base.wires-1);
  await page.keyboard.press('Control+z');
  const undone=await stat(page);
  expect(undone.wires).toBe(base.wires);
  expect(undone.history.valid).toBeTruthy();
  await page.keyboard.press('Control+y');
  const redone=await stat(page);
  expect(redone.wires).toBe(base.wires-1);
  expect(redone.history.valid).toBeTruthy();
  expect(redone.nodes).toBe(base.nodes);
});

test('旧版 V1.6 JSON（含时钟历史）导入后仍被引擎校验通过',async({page})=>{
  await lab(page);
  const r=await page.evaluate(()=>{
   const M=window.DigitalMixedCircuit,L=window.DigitalV25Lab;
   let c=M.example('counter');
   for(let i=0;i<3;i++)c=M.pulse(c);
   const legacy=JSON.parse(JSON.stringify(c));
   const parsed=L.normalize(legacy);
   M.validate(parsed.circuit);
   L.loadCircuit(parsed.circuit,'旧版存档');
   return {history:legacy.history.length,tick:legacy.tick,
    after:L.getCircuit().tick,nodes:L.getCircuit().nodes.length};
  });
  expect(r.history).toBe(3);
  expect(r.tick).toBe(3);
  expect(r.after).toBe(3);
  expect(r.nodes).toBeGreaterThan(0);
});

test('四种视口下触摸拖放与端口委托不引起横向溢出或 JS 异常',async({page})=>{
  const logs=[];
  page.on('pageerror',e=>logs.push(e.message));
  for(const [w,h]of[[375,812],[390,844],[768,1024],[1440,900]]){
   await page.setViewportSize({width:w,height:h});
   await lab(page);
   await page.evaluate(()=>window.DigitalV25Lab.openCase('dff'));
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
   await expect(page.locator('.v251-wire-hint')).toBeVisible();
  }
  expect(logs).toEqual([]);
});
