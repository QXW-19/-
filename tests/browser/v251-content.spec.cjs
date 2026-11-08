/* ==========================================================================
   V2.5.1 教学内容阶段 1 浏览器验收（第一章）
   覆盖：讲义四块深读折叠、案例库筛选与详情、七段小实验、案例→实验室/章节联动、
        窄屏不溢出，以及「不破坏 V2.4.1 七段学习路径」的回归断言。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function home(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
  await expect(page.locator('#v251-cases')).toHaveCount(1);
}
async function lesson(page,id){
  await page.evaluate(lessonId=>window.DigitalV18Navigation.openLesson(lessonId),id);
  await expect(page.locator('#v18-school')).toHaveClass(/active/);
}
function watch(page){
  const js=[];
  page.on('pageerror',e=>js.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')js.push('console: '+m.text());});
  return js;
}

test('第一章四节都有四个折叠深读模块，首块默认展开',async({page})=>{
  const errors=watch(page);
  await home(page);
  for(const id of ['l1-1','l1-2','l1-3','l1-4']){
    await lesson(page,id);
    await expect(page.locator('#v18-school .v251-deep')).toHaveCount(4,{timeout:8000});
    await expect(page.locator('#v18-school .v251-deep[open]')).toHaveCount(1);
    const titles=await page.locator('#v18-school .v251-deep-title').allTextContents();
    expect(titles.join('|')).toContain('零基础引入');
    expect(titles.join('|')).toContain('常见错误解析');
    // 首块正文必须是真的教学内容，不是占位符。
    const body=await page.locator('#v18-school .v251-deep[open] .v251-deep-body').innerText();
    expect(body.length).toBeGreaterThan(80);
    expect(body).not.toContain('待补充');
  }
  expect(errors).toEqual([]);
});

test('全部展开/收起可用，且七段学习路径仍为 7 个可点按钮',async({page})=>{
  await home(page);
  await lesson(page,'l1-1');
  await page.locator('#v18-school .v251-deep-tools button',{hasText:'全部展开'}).click();
  await expect(page.locator('#v18-school .v251-deep[open]')).toHaveCount(4);
  await page.locator('#v18-school .v251-deep-tools button',{hasText:'全部收起'}).click();
  await expect(page.locator('#v18-school .v251-deep[open]')).toHaveCount(0);

  const nav=page.locator('#v18-school .v241-steps');
  await expect(nav.locator('button')).toHaveCount(7);
  expect(await nav.locator('button:disabled').count()).toBe(0);
});

test('讲义页的本章案例入口能直接打开案例详情',async({page})=>{
  await home(page);
  await lesson(page,'l1-4');
  const link=page.locator('#v18-school .v251-case-links button').first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.locator('#v251-cases')).toHaveClass(/active/);
  await expect(page.locator('#v251-cases .v251-part')).toHaveCount(13);
});

test('案例库可按章筛选、搜索，并展示十三部分',async({page})=>{
  const errors=watch(page);
  await home(page);
  await page.evaluate(()=>window.show('v251-cases'));
  await expect(page.locator('#v251-cases')).toHaveClass(/active/);
  const total=await page.evaluate(()=>window.DigitalV251Content.cases.length);
  await expect(page.locator('#v251-cases .v251-card')).toHaveCount(total);

  // 已收录案例的章节才显示筛选按钮；点击后只保留该章案例。
  const ch2=page.locator('#v251-cases .v251-chip',{hasText:'第 2 章'});
  await expect(ch2).toHaveCount(1);
  await ch2.click();
  await expect(page.locator('#v251-cases .v251-card')).toHaveCount(3);
  await page.locator('#v251-cases .v251-chip',{hasText:'全部章节'}).click();
  await expect(page.locator('#v251-cases .v251-card')).toHaveCount(total);
  // 未收录案例的章节不出现空列表入口。
  await expect(page.locator('#v251-cases .v251-chip',{hasText:'第 8 章'})).toHaveCount(0);
  const search=page.locator('#v251-cases .v251-search');
  await search.fill('格雷码');
  await expect(page.locator('#v251-cases .v251-card')).toHaveCount(1);
  await search.fill('');
  await expect(page.locator('#v251-cases .v251-card')).toHaveCount(total);

  await page.locator('#v251-cases .v251-card button',{hasText:'查看案例'}).first().click();
  await expect(page.locator('#v251-cases .v251-detail')).toBeVisible();
  await expect(page.locator('#v251-cases .v251-part')).toHaveCount(13);
  await expect(page.locator('#v251-cases .v251-part-title').first()).toContainText('案例背景');
  await page.locator('#v251-cases button',{hasText:'返回案例列表'}).click();
  await expect(page.locator('#v251-cases .v251-card')).toHaveCount(total);
  expect(errors).toEqual([]);
});

test('七段小实验的段码与真值表同源，非法码明确提示无关项',async({page})=>{
  await home(page);
  await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-1-1'));
  const box=page.locator('#v251-cases .v251-sevenseg');
  await expect(box).toBeVisible();

  await box.locator('.v251-chip',{hasText:/^5$/}).click();
  await expect(box).toHaveAttribute('data-seg','1011011');
  await expect(box).toHaveAttribute('data-value','5');
  await expect(box.locator('.v251-sevenseg-readout')).toContainText('0x5B');
  await expect(box.locator('.v251-seg.on')).toHaveCount(5);

  await box.locator('.v251-bit',{hasText:'B3'}).click();
  await expect(box).toHaveAttribute('data-value','13');
  await expect(box.locator('.v251-sevenseg-readout')).toContainText('无关项');
  await expect(box.locator('.v251-sevenseg-readout')).toHaveClass(/v251-warn/);
});

test('案例 1-2 的「打开实验」把格雷码转换器载入电路实验室',async({page})=>{
  await home(page);
  await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-1-2'));
  await page.locator('#v251-cases button',{hasText:'打开实验'}).click();
  await expect(page.locator('#v25-lab')).toHaveClass(/active/);
  const c=await page.evaluate(()=>window.DigitalV25Lab.getCircuit());
  expect(c.nodes.length).toBe(11);   // 4 开关 + 3 异或 + 4 LED
  expect(c.wires.length).toBe(10);
});

test('案例 1-3 的章节模块按钮回到第一章精讲',async({page})=>{
  await home(page);
  await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-1-3'));
  await page.locator('#v251-cases button',{hasText:'打开章节互动模块'}).click();
  await expect(page.locator('#c1')).toHaveClass(/active/);
});

test('窄屏 375px 下案例详情不产生横向溢出',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await home(page);
  await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-1-2'));
  await expect(page.locator('#v251-cases .v251-part')).toHaveCount(13);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('第二章深读与两个门电路案例同样可用',async({page})=>{
  const errors=watch(page);
  await home(page);
  for(const id of ['l2-1','l2-2','l2-3','l2-4']){
    await lesson(page,id);
    await expect(page.locator('#v18-school .v251-deep'),id).toHaveCount(4,{timeout:8000});
  }
  await expect(page.locator('#v251-cases .v251-card')).toHaveCount(await page.evaluate(()=>window.DigitalV251Content.cases.length));

  // 三人表决器：3 开关 + 3 与门 + 2 或门 + 1 LED
  await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-2-1'));
  await page.locator('#v251-cases button',{hasText:'打开实验'}).click();
  await expect(page.locator('#v25-lab')).toHaveClass(/active/);
  let c=await page.evaluate(()=>window.DigitalV25Lab.getCircuit());
  expect(c.nodes.filter(n=>n.type==='AND').length).toBe(3);
  expect(c.nodes.filter(n=>n.type==='OR').length).toBe(2);
  expect(c.wires.length).toBe(11);

  // 与非门异或：恰好 4 个 NAND，无其它门
  await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-2-2'));
  await page.locator('#v251-cases button',{hasText:'打开实验'}).click();
  c=await page.evaluate(()=>window.DigitalV25Lab.getCircuit());
  expect(c.nodes.filter(n=>n.type==='NAND').length).toBe(4);
  expect(c.nodes.filter(n=>['AND','OR','XOR','NOR'].includes(n.type)).length).toBe(0);
  expect(c.wires.length).toBe(9);
  expect(errors).toEqual([]);
});

test('第三章深读齐全，三态总线案例可跳到章节互动',async({page})=>{
  const errors=watch(page);
  await home(page);
  for(const id of ['l3-1','l3-2','l3-3','l3-4']){
    await lesson(page,id);
    await expect(page.locator('#v18-school .v251-deep'),id).toHaveCount(4,{timeout:8000});
  }
  await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-3-2'));
  await expect(page.locator('#v251-cases .v251-part')).toHaveCount(13);
  // 指标、8 种组合、器件、测试、自评量规共 5 张表
  await expect(page.locator('#v251-cases .v251-table')).toHaveCount(5);
  await page.locator('#v251-cases button',{hasText:'打开章节互动模块'}).click();
  await expect(page.locator('#n3')).toHaveClass(/active/);
  expect(errors).toEqual([]);
});

test('第四章全加器案例能载入 5 个门并保留两位输出',async({page})=>{
  await home(page);
  for(const id of ['l4-1','l4-2','l4-3','l4-4']){
    await lesson(page,id);
    await expect(page.locator('#v18-school .v251-deep'),id).toHaveCount(4,{timeout:8000});
  }
  await page.evaluate(()=>window.DigitalV251ContentUI.openCase('case-4-1'));
  await expect(page.locator('#v251-cases .v251-part')).toHaveCount(13);
  await page.locator('#v251-cases button',{hasText:'打开实验'}).click();
  await expect(page.locator('#v25-lab')).toHaveClass(/active/);
  const c=await page.evaluate(()=>window.DigitalV25Lab.getCircuit());
  expect(c.nodes.filter(n=>n.type==='XOR').length).toBe(2);
  expect(c.nodes.filter(n=>n.type==='AND').length).toBe(2);
  expect(c.nodes.filter(n=>n.type==='OR').length).toBe(1);
  expect(c.nodes.filter(n=>n.type==='LED').length).toBe(2);
  expect(c.wires.length).toBe(12);
});
