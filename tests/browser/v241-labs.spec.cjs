/* V2.4.1 阶段 C 验收：组合/时序实验结果解读、高亮反馈、理想波形、
 * 五个 3D 场景的分级状态与降级说明。
 * 真实渲染是否成功由 v24-full-regression 的截图测试单独判定，本文件不伪报。
 */
const {test,expect}=require('@playwright/test');

async function home(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
}

test('八章互动实验都有结果解读条，操作后读数与解释同步更新',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await home(page);
  const cases=[['m1','#m1go','#m1narr'],['m2','#kmRandom','#kmExpr'],['m3','#cmHi','#cmVout'],
    ['m4','#rcUp','#rcResult'],['m5','#ffPulse','#ffNarr'],['m6','#stStep','#stNow'],
    ['m7','#nePause','#neF'],['m8','#adcStep','#adcCode']];
  for(const [id,btn,out]of cases){
    await page.evaluate(x=>window.show(x),id);
    const strip=page.locator('#'+id+' > .v241-lab-strip');
    await expect(strip,id+' 应有结果解读条').toHaveCount(1);
    await expect(strip.locator('.v241-lab-explain')).not.toBeEmpty();
    await page.locator(btn).click();
    const text=(await page.locator(out).textContent()||'').trim().slice(0,220);
    await expect(strip.locator('.v241-lab-value')).toContainText(text.slice(0,Math.min(18,text.length)));
    await expect(strip.locator('.v241-badge')).toHaveText(/已更新|等待下一次变化/);
  }
  expect(errors).toEqual([]);
});

test('三态总线与格雷码拆分模块也有实时结果解读',async({page})=>{
  await home(page);
  await page.evaluate(()=>window.show('n3'));
  await expect(page.locator('#n3 > .v241-lab-strip')).toHaveCount(1);
  await expect(page.locator('#n3 .v241-lab-explain')).toContainText('高阻 Z');
  await page.locator('#triE1').click();
  await expect(page.locator('#n3 .v241-lab-value')).toContainText('当前输出');
  await page.evaluate(()=>window.show('n1'));
  await page.locator('#gcReset').click();
  await expect(page.locator('#n1 > .v241-lab-strip')).toHaveCount(1);
});

test('时序模块展示理想时钟波形并标注真实器件限制',async({page})=>{
  await home(page);
  for(const id of ['m5','m6','n11']){
    await page.evaluate(x=>window.show(x),id);
    await expect(page.locator('#'+id+' .v241-wave svg')).toHaveCount(1);
    await expect(page.locator('#'+id+' .v241-wave figcaption')).toContainText('理想时钟');
    await expect(page.locator('#'+id+' .v241-lab-strip .v241-note')).toContainText('模型边界');
  }
});

test('五个 3D 场景分级状态条明确区分入口/WebGL/画布/渲染',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await home(page);
  for(let i=1;i<=5;i++){
    const id='w'+i;
    await page.evaluate(x=>window.show(x),id);
    const bar=page.locator('#'+id+' > .v241-3d-status');
    await expect(bar,id+' 应有状态条').toHaveCount(1);
    const text=await bar.textContent();
    expect(text).toContain('入口：已打开');
    expect(text).toContain('WebGL');
    expect(text).toContain('Three.js 画布');
    expect(text).toContain('④ 真实渲染：需浏览器截图验收');
    expect(text).toContain('触摸');
  }
  expect(errors).toEqual([]);
});

test('WebGL 不可用时给出降级说明，且不谎报渲染成功',async({page})=>{
  await home(page);
  await page.evaluate(()=>{
    // 只覆盖能力探测缓存用于验收降级文案，不改变页面真实 WebGL 能力。
    window.__K3._gl=false;
    window.DigitalV241Labs.refreshScene('w1');
    window.show('w1');
  });
  const bar=page.locator('#w1 > .v241-3d-status');
  await expect(bar).toContainText('② WebGL：不可用');
  await expect(bar).toContainText('降级说明：');
  await expect(bar).toContainText('真实渲染：需浏览器截图验收');
  // 恢复缓存，避免影响同页其它检查。
  await page.evaluate(()=>{delete window.__K3._gl;});
});
