/* V2.5 阶段 D 验收：课程讲义 → 电路实验联动与旧存档兼容。 */
const {test,expect}=require('@playwright/test');

async function home(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
}

test('D：讲义一键打开对应实验，载入案例并可返回完成理解检测',async({page})=>{
  await home(page);
  await page.evaluate(()=>window.DigitalV18Navigation.openLesson('l4-2'));
  await expect(page.locator('#v18-school .v25-course-link button')).toBeVisible();
  await page.locator('#v18-school .v25-course-link button').click();
  await expect(page.locator('#v25-lab')).toHaveClass(/active/);
  const c=await page.evaluate(()=>{
   const x=window.DigitalV25Lab.getCircuit();
   return {nodes:x.nodes.length,wires:x.wires.length};
  });
  expect(c.nodes).toBe(6);
  expect(c.wires).toBe(6);
  await page.evaluate(()=>window.show('v18-school'));
  await expect(page.locator('#v18-school .v18-quiz')).toHaveCount(1);
  await expect(page.locator('#v18-school .v241-summary')).toHaveCount(1);
});

test('D：新增实验配置使用独立版本键，旧版学习记录未被改写',async({page})=>{
  const old=JSON.stringify({version:1,completed:['l1-1'],last:'l1-1',attempts:{}});
  await page.addInitScript(v=>localStorage.setItem('digital-course-v1.8-study',v),old);
  await home(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('dff'));
  const state=await page.evaluate(()=>({
   study:localStorage.getItem('digital-course-v1.8-study'),
   circuit:JSON.parse(localStorage.getItem('digital-course-v2.5-circuit')||'null')
  }));
  expect(state.study).toBe(old);
  expect(state.circuit.version).toBe(2);
  expect(state.circuit.circuit.version).toBe(1); // 内部仍是 V1.6 兼容结构
  expect(Array.isArray(state.circuit.circuit.nodes)).toBeTruthy();
});
