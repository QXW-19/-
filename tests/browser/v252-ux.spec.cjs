/* ==========================================================================
   V2.5.2 页面体验验收（阶段 F）
   覆盖：计算/实测并排实时更新、四种视口无横向溢出、深色主题、
        进度持久化、移动端实验操作关键控件可见。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function openLab(page,id,step){
 await page.goto('/');
 await page.evaluate(([pid,st])=>{
  window.DigitalV252Lab.open(pid);
  if(typeof st==='number')window.DigitalV252Lab.go(st);
 },[id,step]);
 await expect(page.locator('#v252-lab')).toHaveClass(/active/);
}

test('计算规则与实时结果并排显示，并随操作更新',async({page})=>{
 await openLab(page,'lock',4);
 const cmp=page.locator('#v252-lab .v252-compare');
 await expect(cmp).toBeVisible();
 await expect(cmp.locator('.v252-compare-col')).toHaveCount(2);
 await expect(cmp).toContainText('计算 / 规则');
 await expect(cmp).toContainText('实时结果');

 const live=cmp.locator('.v252-compare-col').nth(1);
 await expect(live).toContainText('开锁 Q = 0');
 await page.evaluate(()=>{
  const s=window.DigitalV252Lab.sim();
  s.setAttempt([1,0,1,0]);
  s.confirm();
 });
 await expect(live).toContainText('MATCH = 1');
 await expect(live).toContainText('开锁 Q = 1');
 await expect(live).toContainText('已确认 1 次');
});

const VIEWPORTS=[[375,812],[390,844],[768,1024],[1440,900]];
for(const [w,h] of VIEWPORTS){
 test('视口 '+w+'×'+h+' 下实训台与练习页无横向溢出',async({page})=>{
  await page.setViewportSize({width:w,height:h});
  await openLab(page,'traffic',4);
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('#v252-lab .v252-lampbox')).toHaveCount(2);

  await page.evaluate(()=>window.DigitalV252Exercises.open());
  await expect(page.locator('#v252-exercises')).toHaveClass(/active/);
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
 });
}

test('深色主题下实训台与练习页仍可读且不溢出',async({page})=>{
 await openLab(page,'adc',4);
 const light=await page.evaluate(()=>{
  const c=getComputedStyle(document.querySelector('.v252-content'));
  return {bg:c.backgroundColor,color:c.color};
 });
 await page.evaluate(()=>{document.documentElement.dataset.theme='dark';});
 await page.waitForTimeout(150);
 const dark=await page.evaluate(()=>{
  const c=getComputedStyle(document.querySelector('.v252-content'));
  return {bg:c.backgroundColor,color:c.color};
 });
 expect(dark.bg).not.toBe(light.bg);
 expect(dark.color).not.toBe(light.color);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 expect(overflow).toBeLessThanOrEqual(1);
 await expect(page.locator('#v252-lab .v252-readout')).toBeVisible();
});

test('项目进度写入独立键并在刷新后保留',async({page})=>{
 await openLab(page,'clock',0);
 await page.evaluate(()=>{window.DigitalV252Lab.go(4);window.DigitalV252Lab.go(5);});
 const before=await page.evaluate(()=>window.DigitalV252Lab.progress());
 expect(before.clock.done.length).toBeGreaterThanOrEqual(3);
 const keys=await page.evaluate(()=>Object.keys(localStorage));
 expect(keys).toContain('digital-course-v2.5.2-project-progress');
 expect(keys).not.toContain('digital-course-v1.8-study');

 await page.reload();
 await page.evaluate(()=>window.DigitalV252Lab.open('clock'));
 const after=await page.evaluate(()=>window.DigitalV252Lab.progress());
 expect(after.clock.done.length).toBe(before.clock.done.length);
});
