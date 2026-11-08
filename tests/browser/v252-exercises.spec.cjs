/* ==========================================================================
   V2.5.2 分层练习与评分验收（阶段 E）
   覆盖：五类题量、概念/计算判分、定向错误反馈、设计题不自动打分、
        验证清单持久化、分类筛选、旧学习记录不被改写。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function openEx(page){
 await page.goto('/');
 await expect(page.locator('#v20-home')).toHaveClass(/active/);
 await expect(page.locator('.nav-item[data-mod="v252-exercises"]')).toHaveCount(1);
 await page.evaluate(()=>window.DigitalV252Exercises.open());
 await expect(page.locator('#v252-exercises')).toHaveClass(/active/);
}

test('五类练习齐全，题量与题库一致',async({page})=>{
 const errs=[];
 page.on('pageerror',e=>errs.push(e.message));
 await openEx(page);
 await expect(page.locator('#v252-exercises .v252-ex-card')).toHaveCount(16);
 const chips=page.locator('#v252-exercises .v252-filter .v252-chip');
 await expect(chips).toHaveCount(6); // 全部 + 五类
 await expect(page.locator('#v252-exercises .v252-filter .v252-chip',{hasText:'基础概念（4）'})).toHaveCount(1);
 await expect(page.locator('#v252-exercises .v252-filter .v252-chip',{hasText:'项目综合设计（2）'})).toHaveCount(1);
 expect(errs).toEqual([]);
});

test('概念题：错误选项给出定向反馈，改对后计入正确率',async({page})=>{
 await openEx(page);
 const card=page.locator('#v252-exercises [data-qid="e1"]');
 await card.locator('input[value="0"]').check();
 await card.locator('button',{hasText:'提交答案'}).click();
 await expect(card.locator('.v252-ex-feedback')).toContainText('✗');
 await expect(card.locator('.v252-ex-feedback')).toContainText('把位数当成了状态数');

 await card.locator('input[value="2"]').check();
 await card.locator('button',{hasText:'提交答案'}).click();
 await expect(card.locator('.v252-ex-feedback')).toContainText('✓ 正确');
 const summary=page.locator('#v252-exercises .v252-ex-summary');
 await expect(summary).toContainText('1 / 1 正确');
});

test('计算题按容差判分，并展示分步过程',async({page})=>{
 await openEx(page);
 const adc=page.locator('#v252-exercises [data-qid="e5"]');
 await adc.locator('input.v252-input').fill('465');
 await adc.locator('button',{hasText:'提交答案'}).click();
 await expect(adc.locator('.v252-ex-feedback')).toContainText('✓ 正确');
 await expect(adc.locator('.v252-ex-steps li')).toHaveCount(3);

 const f555=page.locator('#v252-exercises [data-qid="e6"]');
 await f555.locator('input.v252-input').fill('481');
 await f555.locator('button',{hasText:'提交答案'}).click();
 await expect(f555.locator('.v252-ex-feedback')).toContainText('✓ 正确');

 const wrong=page.locator('#v252-exercises [data-qid="e7"]');
 await wrong.locator('input.v252-input').fill('14');
 await wrong.locator('button',{hasText:'提交答案'}).click();
 await expect(wrong.locator('.v252-ex-feedback')).toContainText('✗');
 await expect(wrong.locator('.v252-ex-feedback')).toContainText('正确答案：-2');
});

test('设计题只给量规与清单，不生成分数',async({page})=>{
 await openEx(page);
 const card=page.locator('#v252-exercises [data-qid="e15"]');
 await expect(card).toContainText('不会自动生成分数');
 await expect(card.locator('.v252-ex-check')).toHaveCount(5);
 await expect(card).toContainText('评分量规');
 await expect(card.locator('button',{hasText:'提交答案'})).toHaveCount(0);

 await card.locator('.v252-ex-check input').nth(0).check();
 await card.locator('.v252-ex-check input').nth(3).check();
 await page.reload();
 await page.evaluate(()=>window.DigitalV252Exercises.open());
 const again=page.locator('#v252-exercises [data-qid="e15"]');
 await expect(again.locator('.v252-ex-check input').nth(0)).toBeChecked();
 await expect(again.locator('.v252-ex-check input').nth(3)).toBeChecked();
 await expect(again.locator('.v252-ex-check input').nth(1)).not.toBeChecked();
});

test('分类筛选与旧学习记录兼容',async({page})=>{
 const legacy=JSON.stringify({version:1,completed:['l1-1'],last:'l1-1',attempts:{}});
 await page.addInitScript(v=>localStorage.setItem('digital-course-v1.8-study',v),legacy);
 await openEx(page);
 await page.locator('#v252-exercises .v252-filter .v252-chip',{hasText:'故障定位'}).click();
 await expect(page.locator('#v252-exercises .v252-ex-card')).toHaveCount(3);
 await expect(page.locator('#v252-exercises [data-qid="e12"]')).toHaveCount(1);

 await page.locator('#v252-exercises .v252-filter .v252-chip',{hasText:'全部'}).click();
 await expect(page.locator('#v252-exercises .v252-ex-card')).toHaveCount(16);
 const stored=await page.evaluate(()=>localStorage.getItem('digital-course-v1.8-study'));
 expect(stored).toBe(legacy);
});
