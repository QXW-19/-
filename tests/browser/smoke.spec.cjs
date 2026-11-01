/* V2.3 Playwright 真实 Chromium 端到端冒烟测试。
 * 本次覆盖首页、章节导航、八章旧互动、课程搜索、收藏、学习进度；
 * Three.js 的外部依赖在后续单独增加在线/离线测试。
 */
const {test,expect}=require('@playwright/test');
async function openHome(page){
 await page.goto('/');
 await expect(page.locator('#v20-home')).toHaveClass(/active/);
 await expect(page.locator('#v22-resource-section .v22-search')).toBeVisible();
}
test('网站可从根目录启动，原 51 模块和公共样式保留',async({page})=>{
 await openHome(page);
 await expect(page.locator('#nav .nav-item[data-mod="v20-home"]')).toBeVisible();
 await expect(page.locator('#main > section.mod[id^="c"]')).toHaveCount(8);
 await expect(page.locator('#main > section.mod[id^="w"]')).toHaveCount(5);
 await expect(page.locator('#dialSvg > *').first()).toBeAttached();
 const css=await page.locator('.app').evaluate(e=>getComputedStyle(e).display);
 expect(css).not.toBe('none');
});
test('课程资源搜索 → 进入原补码互动 → 完成一次操作',async({page})=>{
 await openHome(page);
 const search=page.locator('#v22-resource-section .v22-search');
 await search.fill('补码');
 const result=page.locator('#v22-resource-section .v22-item')
  .filter({hasText:'补码：为什么减法能变成加法'});
 await expect(result).toBeVisible();
 await result.getByRole('button',{name:'打开学习'}).click();
 await expect(page.locator('#m1')).toHaveClass(/active/);
 await expect(page.locator('#m1go')).toBeVisible();
 await page.locator('#m1go').click();
 await expect(page.locator('#m1narr')).not.toBeEmpty();
 await page.locator('#m1rst').click();
});
test('第二章卡诺图和第三章 CMOS 的外置控制器可操作',async({page})=>{
 await openHome(page);
 await page.evaluate(()=>window.show('m2'));
 await expect(page.locator('#m2')).toHaveClass(/active/);
 await expect(page.locator('#kmSvg > *').first()).toBeAttached();
 await page.locator('#kmRandom').click();
 await expect(page.locator('#kmExpr')).not.toBeEmpty();
 await page.evaluate(()=>window.show('m3'));
 await expect(page.locator('#m3')).toHaveClass(/active/);
 await expect(page.locator('#cmosSvg > *').first()).toBeAttached();
 await page.locator('#cmHi').click();
 await expect(page.locator('#cmVout')).not.toBeEmpty();
});
test('32 节零基础讲义可从资源搜索直达，V2.1 知识衔接正常',async({page})=>{
 await openHome(page);
 const search=page.locator('#v22-resource-section .v22-search');
 await search.fill('bit');
 const target=page.locator('#v22-resource-section .v22-item').filter({hasText:'什么是 bit'});
 await expect(target).toBeVisible();
 await target.getByRole('button',{name:'打开学习'}).click();
 await expect(page.locator('#v18-school')).toHaveClass(/active/);
 await expect(page.locator('#v18-school .v21-bridge')).toBeVisible();
});
test('资源收藏和最近访问在刷新后仍保留',async({page})=>{
 await openHome(page);
 const search=page.locator('#v22-resource-section .v22-search');
 await search.fill('卡诺图');
 const item=page.locator('#v22-resource-section .v22-item').filter({hasText:'卡诺图：为什么'});
 await expect(item).toBeVisible();
 await item.getByRole('button',{name:/收藏/}).click();
 await expect(item.getByRole('button',{name:/取消收藏/})).toHaveAttribute('aria-pressed','true');
 await page.reload();
 await expect(page.locator('#v22-resource-section .v22-search')).toBeVisible();
 await page.locator('#v22-resource-section .v22-search').fill('卡诺图');
 const result=page.locator('#v22-resource-section .v22-item').filter({hasText:'卡诺图：为什么'});
 await expect(result.getByRole('button',{name:/取消收藏/})).toHaveAttribute('aria-pressed','true');
 await result.getByRole('button',{name:'打开学习'}).click();
 await expect(page.locator('#m2')).toHaveClass(/active/);
 await page.locator('#nav .nav-item[data-mod="v20-home"]').click();
 await expect(page.locator('#v22-resource-section .v22-recent-links')).toContainText('卡诺图');
});
test('载入已有的本地学习进度时不篡改旧版存档',async({page})=>{
 const stored=JSON.stringify({version:1,completed:['l1-1'],last:'l1-1',attempts:{}});
 await page.addInitScript(value=>localStorage.setItem('digital-course-v1.8-study',value),stored);
 await openHome(page);
 await expect(page.locator('.v20-kpis')).toContainText('1/32');
 const after=await page.evaluate(()=>localStorage.getItem('digital-course-v1.8-study'));
 expect(after).toBe(stored);
});
test('窄屏浏览器下仍可进入搜索及旧章节',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openHome(page);
 const search=page.locator('#v22-resource-section .v22-search');
 await search.fill('555');
 await expect(page.locator('#v22-resource-section .v22-item').first()).toBeVisible();
 await page.evaluate(()=>window.show('c7'));
 await expect(page.locator('#c7')).toHaveClass(/active/);
});
