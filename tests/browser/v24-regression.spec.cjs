/* V2.4 增量浏览器回归：保留原课堂行为，重点检查旧存档、跨屏和 3D 入口。
 * 本文件不会修改用户真实浏览器数据；Playwright 使用独立的临时浏览器上下文。
 * 3D 仅验证页面与容器入口，WebGL 实际渲染另需具备 GPU 的专项验收。
 */
const {test,expect}=require('@playwright/test');

async function enter(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
}

test('五个原始 3D 教学模块仍可导航且正确激活', async ({page})=>{
  await enter(page);
  for(let i=1;i<=5;i++){
    const id='w'+i;
    await expect(page.locator('#'+id)).toHaveCount(1);
    await page.evaluate(target=>window.show(target),id);
    await expect(page.locator('#'+id)).toHaveClass(/active/);
  }
});

for(const [width,height] of [[375,812],[390,844],[768,1024],[1440,900]]){
  test('资源库在 '+width+'×'+height+' 视口可使用',async({page})=>{
    await page.setViewportSize({width,height});
    await enter(page);
    const search=page.locator('#v22-resource-section .v22-search');
    await expect(search).toBeVisible();
    await search.fill('555');
    await expect(page.locator('#v22-resource-section .v22-item').first()).toBeVisible();
    await page.evaluate(()=>window.show('c7'));
    await expect(page.locator('#c7')).toHaveClass(/active/);
  });
}

test('打开课堂和切换课程不会覆写互相独立的旧版记录',async({page})=>{
  const entries={
    'digital-course-v1.3-circuit':'{"sentinel":"v1.3","nodes":[]}',
    'digital-course-v1.4-sequential':'{"sentinel":"v1.4"}',
    'digital-course-v1.6-mixed':'{"sentinel":"v1.6"}',
    'digital-course-v1.7-projects':'{"sentinel":"v1.7"}',
    'digital-course-v2.1-cases':'{"sentinel":"v2.1"}'
  };
  await page.addInitScript(data=>{
    for(const [key,value] of Object.entries(data))localStorage.setItem(key,value);
  },entries);
  await enter(page);
  await page.evaluate(()=>window.show('c1'));
  await page.evaluate(()=>window.show('v20-home'));
  const actual=await page.evaluate(keys=>Object.fromEntries(
    keys.map(key=>[key,localStorage.getItem(key)])
  ),Object.keys(entries));
  expect(actual).toEqual(entries);
});

test('第一章格雷码外置后仍能计算 7 到 8 的翻转差异',async({page})=>{
  await enter(page);
  const slider=page.locator('#gcSlider');
  await expect(slider).toBeAttached();
  await page.locator('#gcReset').click();
  for(const value of [7,8]){
    await slider.evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
    await expect(page.locator('#gcVal')).toHaveText(String(value));
  }
  await expect(page.locator('#gcGrayFlip')).toHaveText('1 位');
  await expect(page.locator('#gcBinFlip')).toHaveText('4 位');
});
