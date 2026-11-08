/* V2.4.1 阶段 D 验收：32 节的先预测、解析、知识总结、复习建议，
 * 以及涉及电气特性章节的「理想模型 vs 真实器件」标注。
 */
const {test,expect}=require('@playwright/test');

async function lesson(page,id){
  await page.goto('/');
  await page.evaluate(x=>window.DigitalV18Navigation.openLesson(x),id);
  await expect(page.locator('#v18-school')).toHaveClass(/active/);
}

test('八章预测题均可记录预测并给出与实验一致的解析',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await lesson(page,'l1-1');
  for(let c=1;c<=8;c++){
    const id='l'+c+'-1';
    await page.evaluate(x=>window.DigitalV18Navigation.openLesson(x),id);
    const panel=page.locator('#v18-school .v241-predict');
    await expect(panel,id+' 应有预测面板').toHaveCount(1);
    await expect(panel.locator('input[type="radio"]')).toHaveCount(3);
    await panel.locator('input[type="radio"]').first().check();
    await panel.locator('button',{hasText:'记录预测'}).click();
    await expect(panel.locator('.v241-predict-feedback')).toContainText('已记录');
    await panel.locator('button',{hasText:'查看解析'}).click();
    await expect(panel.locator('.v241-predict-feedback')).toContainText('正确答案');
  }
  expect(errors).toEqual([]);
});

test('32 节讲义都有知识总结、易错点与复习建议',async({page})=>{
  await lesson(page,'l1-1');
  for(let c=1;c<=8;c++)for(let i=1;i<=4;i++){
    const id='l'+c+'-'+i;
    await page.evaluate(x=>window.DigitalV18Navigation.openLesson(x),id);
    const s=page.locator('#v18-school .v241-summary');
    await expect(s,id+' 应有知识总结').toHaveCount(1);
    await expect(s,id+' 总结应含核心关系').toContainText('核心关系');
    await expect(s,id+' 总结应含易错点').toContainText('最容易错的地方');
    await expect(s.locator('.v241-review')).not.toBeEmpty();
  }
});

test('涉及电气特性的章节标注模型边界，纯逻辑章节不误标',async({page})=>{
  await lesson(page,'l3-1');
  for(const c of [3,5,6,7,8]){
    await page.evaluate(x=>window.DigitalV18Navigation.openLesson('l'+x+'-1'),c);
    await expect(page.locator('#v18-school .v241-summary .v241-note'),'第 '+c+' 章').toContainText('模型边界');
    await expect(page.locator('#v18-school .v241-summary .v241-note')).toContainText('数据手册');
  }
  await page.evaluate(()=>window.DigitalV18Navigation.openLesson('l1-1'));
  await expect(page.locator('#v18-school .v241-summary .v241-note')).toHaveCount(0);
});

test('答错随堂题后复习建议会更新，原有判分与存档不变',async({page})=>{
  await lesson(page,'l1-1');
  // 第一题正确答案是下标 2；故意选 0 制造错题记录。
  await page.locator('#v18-school .v18-quiz input[value="0"]').check();
  await page.locator('#v18-school .v18-quiz button',{hasText:'提交答案'}).click();
  await expect(page.locator('#v18-school .v18-feedback')).toContainText('还需要复习');
  await expect(page.locator('#v18-school .v241-review')).toContainText('本题答错');
  const saved=await page.evaluate(()=>localStorage.getItem('digital-course-v1.8-study'));
  expect(saved).toContain('attempts');
  await expect(page.locator('#v18-school .v241-summary')).toHaveCount(1);
  await expect(page.locator('#v18-school .v18-quiz')).toHaveCount(1);
});

test('预测题正确答案与理想模型公式自洽（八章逐项）',async({page})=>{
  await lesson(page,'l1-1');
  const data=await page.evaluate(()=>window.DigitalV241Learning.PREDICT);
  expect(Object.keys(data).length).toBe(8);
  for(const c of [1,2,3,4,5,6,7,8]){
    const p=data[c];
    expect(p.options.length).toBe(3);
    expect(p.correct).toBeGreaterThanOrEqual(0);
    expect(p.correct).toBeLessThan(3);
    expect(p.explain.length).toBeGreaterThan(20);
  }
  expect(data[1].options[data[1].correct]).toBe('141');
  expect(data[4].options[data[4].correct]).toBe('S=0, C=1');
  expect(data[6].options[data[6].correct]).toBe('回到 0');
  expect(data[8].options[data[8].correct]).toBe('变为原来的 1/4');
});
