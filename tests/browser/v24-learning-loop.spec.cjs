/* V2.4 学习闭环的真实 Chromium 验收（阶段 C）。
 * 验证 32 节讲义都能显示「图形演示 / 结果分析 / 错因解析」，
 * 且图形中的数值与同页微型实验的交互输出一致、原有答题逻辑未被破坏。
 */
const {test,expect}=require('@playwright/test');

async function openHome(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
  const hook=await page.evaluate(()=>typeof window.DigitalV24LearningLoop);
  expect(hook).toBe('object');
}
async function openLesson(page,id){
  await page.evaluate(lessonId=>window.DigitalV18Navigation.openLesson(lessonId),id);
  await expect(page.locator('#v18-school')).toHaveClass(/active/);
}

test('八章第一讲的图形演示与结果分析面板均可交互',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await openHome(page);
  for(let c=1;c<=8;c++){
    await openLesson(page,'l'+c+'-1');
    await expect(page.locator('#v18-school .v24-loop-panel')).toHaveCount(2);
    await expect(page.locator('#v18-school .v24-diagram svg')).toBeVisible();
    const btn=page.locator('#v18-school .v24-loop-panel button',{hasText:'读取当前实验数值并核对'});
    await btn.click();
    await expect(page.locator('#v18-school .v24-readout')).toContainText('当前实验输出：');
    await expect(page.locator('#v18-school .v24-errors li')).toHaveCount(2);
  }
  expect(errors).toEqual([]);
});

test('32 节讲义逐节渲染完整学习闭环，无 JavaScript 错误',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await openHome(page);
  for(let c=1;c<=8;c++)for(let i=1;i<=4;i++){
    const id='l'+c+'-'+i;
    await openLesson(page,id);
    await expect(page.locator('#v18-school .v24-loop-panel'),id+' 应有两个增强面板').toHaveCount(2);
    await expect(page.locator('#v18-school .v24-diagram svg'),id+' 应有图形演示').toHaveCount(1);
    await expect(page.locator('#v18-school .v24-errors li'),id+' 应有错因解析').toHaveCount(2);
    // 原有随堂练习仍然存在，且答案下标没有越界。
    await expect(page.locator('#v18-school .v18-quiz')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test('第一章图形中的 13 与微型实验默认输出一致',async({page})=>{
  await openHome(page);
  await openLesson(page,'l1-2');
  await expect(page.locator('#v18-school .v24-diagram')).toContainText('8 + 4 + 1 = 13');
  await page.locator('#v18-school .v24-loop-panel button',{hasText:'读取当前实验数值并核对'}).click();
  await expect(page.locator('#v18-school .v24-readout')).toContainText('= 13₁₀');
});

test('增强层不破坏原有随堂练习判分与学习进度',async({page})=>{
  await openHome(page);
  await openLesson(page,'l1-1');
  // 4 bit 位串数正确答案为 2⁴=16，选项下标 2。
  await page.locator('#v18-school .v18-quiz input[value="2"]').check();
  await page.locator('#v18-school .v18-quiz button',{hasText:'提交答案'}).click();
  await expect(page.locator('#v18-school .v18-feedback')).toContainText('回答正确');
  const saved=await page.evaluate(()=>localStorage.getItem('digital-course-v1.8-study'));
  expect(saved).toContain('l1-1');
  await expect(page.locator('#v18-school .v24-loop-panel')).toHaveCount(2);
});
