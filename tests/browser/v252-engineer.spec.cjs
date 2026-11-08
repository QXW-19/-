/* ==========================================================================
   V2.5.2 工程师视角验收（阶段 D）
   32 节都必须有独立的第五个折叠块（设计取舍/芯片要点/思考题），
   且不能改变 V2.4.1 原有四个深读块的数量与七段学习路径。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

test('32 节讲义都有工程师视角，且原有四个深读块不变',async({page})=>{
 test.setTimeout(150000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#v20-home')).toHaveClass(/active/);
 for(let ch=1;ch<=8;ch++)for(let i=1;i<=4;i++){
  const id='l'+ch+'-'+i;
  await page.evaluate(lid=>window.DigitalV18Navigation.openLesson(lid),id);
  await expect(page.locator('#v18-school .v252-engineer'),id).toHaveCount(1,{timeout:8000});
  await expect(page.locator('#v18-school .v251-deep'),id).toHaveCount(4);
  const title=await page.locator('#v18-school .v252-engineer .v252-eng-title').innerText();
  expect(title,id).toContain('工程师视角');
  // 折叠状态下 innerText 为空，这里读 textContent 校验内容本身。
  const tradeoff=await page.locator('#v18-school .v252-engineer .v252-eng-body > p').first().evaluate(n=>n.textContent);
  expect(tradeoff.length,id).toBeGreaterThan(40);
 }
 expect(errors).toEqual([]);
});

test('思考题答案默认隐藏，展开后可见真实解析',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>window.DigitalV18Navigation.openLesson('l5-4'));
 const block=page.locator('#v18-school .v252-engineer');
 await block.locator('summary').click();
 const answer=block.locator('.v252-eng-answer');
 await expect(answer).toBeHidden();
 await block.locator('button',{hasText:'展开参考答案'}).click();
 await expect(answer).toBeVisible();
 await expect(answer).toContainText('保持');
 await block.locator('button',{hasText:'收起参考答案'}).click();
 await expect(answer).toBeHidden();
});

test('芯片要点明确提示查数据手册，不编造电气参数',async({page})=>{
 await page.goto('/');
 for(const id of ['l2-1','l4-3','l7-3','l8-1']){
  await page.evaluate(lid=>window.DigitalV18Navigation.openLesson(lid),id);
  const block=page.locator('#v18-school .v252-engineer');
  await block.locator('summary').click();
  await expect(block,id).toContainText('芯片要点');
  await expect(block,id).toContainText('手册');
 }
});
