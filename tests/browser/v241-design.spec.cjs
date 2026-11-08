/* V2.4.1 阶段 B 验收：设计系统、统一首页、主题切换、阅读分区。
 * 断言不降低：原有首页/资源/讲义测试继续独立运行，本文件只验证新增能力。
 */
const {test,expect}=require('@playwright/test');

async function home(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
}

test('统一首页呈现八项学习信息，且旧版重复入口默认收起',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await home(page);
  await expect(page.locator('#v241-dashboard')).toBeVisible();
  await expect(page.locator('#v241-dashboard .v241-card')).toHaveCount(8);
  for(const title of ['当前学习进度','八章学习路线','继续上次学习','推荐下一节',
    '最近使用的互动实验','待复习错题','章节测试入口','课程资源搜索']){
    await expect(page.locator('#v241-dashboard'),'缺少 '+title).toContainText(title);
  }
  expect(await page.locator('body').evaluate(b=>b.classList.contains('v241-compact'))).toBeTruthy();
  await expect(page.locator('#main > .v11-tools')).toBeHidden();
  await expect(page.locator('#v20-chapter-root')).toBeHidden();
  // 资源搜索仍可见，且保持原有 V2.2 实现可用。
  await expect(page.locator('#v22-resource-section .v22-search')).toBeVisible();
  expect(errors).toEqual([]);
});

test('主题切换同步深浅色变量，并复用 V1.1 的持久化状态',async({page})=>{
  await home(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  const light=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--v241-bg').trim());
  await page.locator('#v241-theme-btn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const dark=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--v241-bg').trim());
  expect(dark).not.toBe(light);
  expect(await page.evaluate(()=>document.body.classList.contains('v11-dark'))).toBeTruthy();
  // 刷新后仍保持深色（由旧版键 digital-course-v1.1 持久化）。
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('#v241-theme-btn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});

test('旧版工具开关可恢复全部历史入口',async({page})=>{
  await home(page);
  const toggle=page.locator('#v241-dashboard button',{hasText:'显示旧版工具'});
  await toggle.click();
  await expect(page.locator('#main > .v11-tools')).toBeVisible();
  await expect(page.locator('#v20-chapter-root')).toBeVisible();
  await page.locator('#v241-dashboard button',{hasText:'收起旧版工具'}).click();
  await expect(page.locator('#main > .v11-tools')).toBeHidden();
});

test('仪表盘搜索复用 V2.2 资源库并显示筛选结果',async({page})=>{
  await home(page);
  const input=page.locator('#v241-dashboard .v241-input');
  await input.fill('555');
  const target=page.locator('#v22-resource-section .v22-search');
  await expect(target).toHaveValue('555');
  await expect(page.locator('#v22-resource-section .v22-item').first()).toBeVisible();
});

test('学习进度卡片读取旧版存档且不改写它',async({page})=>{
  const stored=JSON.stringify({version:1,completed:['l1-1','l1-2'],last:'l1-2',attempts:{}});
  await page.addInitScript(v=>localStorage.setItem('digital-course-v1.8-study',v),stored);
  await home(page);
  await expect(page.locator('#v241-dashboard .v241-card').first()).toContainText('2/32');
  expect(await page.evaluate(()=>localStorage.getItem('digital-course-v1.8-study'))).toBe(stored);
});

test('讲义七段学习路径可点击定位，窄屏不溢出',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await home(page);
  await page.evaluate(()=>window.DigitalV18Navigation.openLesson('l3-1'));
  const nav=page.locator('#v18-school .v241-steps');
  await expect(nav).toBeVisible();
  await expect(nav.locator('button')).toHaveCount(7);
  const disabled=await nav.locator('button:disabled').count();
  expect(disabled).toBe(0);
  await nav.locator('button',{hasText:'知识总结'}).click();
  await expect(page.locator('#v18-school .v241-summary')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
});

test('八章路线与考试入口按钮能真实导航',async({page})=>{
  await home(page);
  await page.locator('#v241-dashboard .v241-chip',{hasText:'第 3 章'}).click();
  await expect(page.locator('#c3')).toHaveClass(/active/);
  await page.evaluate(()=>window.show('v20-home'));
  await page.locator('#v241-dashboard button',{hasText:'进入考试中心'}).click();
  await expect(page.locator('#v15-exam')).toHaveClass(/active/);
});
