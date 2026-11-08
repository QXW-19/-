/* ==========================================================================
   V2.5.2 案例深度联动验收（阶段 C）
   覆盖：19 个案例的联动卡、能力统计、自检真实计算、电路/章节/项目三类入口。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function home(page){
 await page.goto('/');
 await expect(page.locator('#v20-home')).toHaveClass(/active/);
}
async function openCase(page,id){
 await page.evaluate(cid=>window.DigitalV251ContentUI.openCase(cid),id);
 await expect(page.locator('#v251-cases .v251-detail')).toBeVisible();
}

test('19 个案例都有联动卡，电路与章节互动合计不少于 12 个',async({page})=>{
 const errs=[];
 page.on('pageerror',e=>errs.push(e.message));
 await home(page);
 const stats=await page.evaluate(()=>window.DigitalV252CaseLinks.stats());
 expect(stats.circuit).toBe(8);
 expect(stats.module).toBe(5);
 expect(stats.numeric).toBe(6);
 expect(stats.circuit+stats.module).toBeGreaterThanOrEqual(12);
 const ids=await page.evaluate(()=>window.DigitalV252CaseLinks.ids);
 expect(ids.length).toBe(19);
 for(const id of ids){
  await openCase(page,id);
  await expect(page.locator('#v251-cases .v252-case-link'),id).toHaveCount(1);
  await expect(page.locator('#v251-cases .v252-case-link .v252-cap')).toHaveCount(1);
  expect(await page.locator('#v251-cases .v252-case-link .v252-chip').count(),id).toBeGreaterThan(0);
 }
 expect(errs).toEqual([]);
});

test('电路类案例自检按真值表逐行通过，不是写死的结论',async({page})=>{
 await home(page);
 const expectMap={
  'case-2-3':{pass:'5 / 5',rows:5},
  'case-4-1':{pass:'4 / 4',rows:4},
  'case-5-2':{pass:'4 / 4',rows:4},
  'case-6-1':{pass:'3 / 3',rows:3},
  'case-8-1':{pass:'3 / 3',rows:3}
 };
 for(const [id,spec] of Object.entries(expectMap)){
  await openCase(page,id);
  await page.locator('#v251-cases button',{hasText:'运行自检'}).click();
  const box=page.locator('#v251-cases .v252-probe');
  await expect(box,id).toContainText('自检结果：'+spec.pass+' 项通过');
  await expect(box.locator('tbody tr'),id).toHaveCount(spec.rows);
  await expect(box.locator('td',{hasText:'✗'}),id).toHaveCount(0);
 }
});

test('电路类入口把真实电路载入实验室',async({page})=>{
 await home(page);
 await openCase(page,'case-1-2');
 await page.locator('#v251-cases button',{hasText:'载入格雷码转换器'}).click();
 await expect(page.locator('#v25-lab')).toHaveClass(/active/);
 let c=await page.evaluate(()=>window.DigitalV25Lab.getCircuit());
 expect(c.nodes.filter(n=>n.type==='XOR').length).toBe(3);

 await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-2-3'));
 await page.locator('#v251-cases button',{hasText:'载入楼层判断电路'}).click();
 c=await page.evaluate(()=>window.DigitalV25Lab.getCircuit());
 expect(c.nodes.length).toBe(8);            // 4 开关 + 或 + 与 + 或 + LED
 expect(c.nodes.filter(n=>n.type==='AND').length).toBe(1);
 expect(c.nodes.filter(n=>n.type==='OR').length).toBe(2);
});

test('章节互动与项目实训入口均可达',async({page})=>{
 await home(page);
 await openCase(page,'case-1-3');
 await page.locator('#v251-cases button',{hasText:'打开补码互动'}).click();
 await expect(page.locator('#c1')).toHaveClass(/active/);

 await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-3-2'));
 await page.locator('#v251-cases button',{hasText:'打开三态总线互动'}).click();
 await expect(page.locator('#n3')).toHaveClass(/active/);

 await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-8-1'));
 await page.locator('#v251-cases button',{hasText:'打开项目实训台的 ADC'}).click();
 await expect(page.locator('#v252-lab')).toHaveClass(/active/);
 await expect(page.locator('#v252-lab .v252-step-title')).toContainText('数字电压采集系统');
});

test('数值演示类案例明确标注能力边界，不声称已仿真',async({page})=>{
 await home(page);
 for(const id of ['case-3-3','case-7-1','case-8-2']){
  await openCase(page,id);
  const cap=page.locator('#v251-cases .v252-case-link .v252-cap');
  await expect(cap,id).toHaveText('仅数值计算或图形演示');
  await expect(page.locator('#v251-cases .v252-link-note'),id).toContainText('实验室');
 }
});
