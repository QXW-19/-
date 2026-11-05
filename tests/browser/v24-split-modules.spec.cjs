/* V2.4 第一批拆分模块的真实 Chromium 回归（阶段 B）。
 * 五个 IIFE 原位外置后，逐个进入对应章节并做真实鼠标/输入操作，
 * 同时监听页面 JavaScript 错误与资源加载失败，防止"结构通过但功能失效"。
 */
const {test,expect}=require('@playwright/test');

// 收集页面级错误；3D 模块的外部 CDN 依赖不在本文件验收范围内。
function watch(page){
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  page.on('requestfailed',r=>{
    const url=r.url();
    // 只统计本地资源；远端 CDN 失败单独在 3D 专项报告中说明。
    if(url.includes('127.0.0.1'))errors.push('requestfailed: '+url);
  });
  page.on('response',r=>{if(r.url().includes('127.0.0.1')&&r.status()>=400)errors.push('http '+r.status()+': '+r.url());});
  return errors;
}

async function enter(page,moduleId){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
  await page.evaluate(id=>window.show(id),moduleId);
  await expect(page.locator('#'+moduleId)).toHaveClass(/active/);
}

test('第一章 g6 数制与五种编码对照表外置后仍可切换数值',async({page})=>{
  const errors=watch(page);
  await enter(page,'g6');
  await expect(page.locator('#g6out .g6-cell')).toHaveCount(6);
  await expect(page.locator('#g6tab tr')).toHaveCount(16);
  await expect(page.locator('#g6nv')).toHaveText('45');
  await page.locator('[data-g6="1"]').click();
  await expect(page.locator('#g6nv')).toHaveText('46');
  await expect(page.locator('#g6out')).toContainText('00101110');
  // 46 的格雷码 = 46 ^ 23 = 57 = 00111001，验证公式与显示一致。
  await expect(page.locator('#g6out')).toContainText('00111001');
  expect(errors).toEqual([]);
});

test('第二章 g7 最小项选择器外置后仍可勾选并给出反函数',async({page})=>{
  const errors=watch(page);
  await enter(page,'g7');
  await expect(page.locator('#g7mt [data-mt]')).toHaveCount(16);
  const before=await page.locator('#g7res').textContent();
  await page.locator('#g7mt [data-mt="3"]').click();
  const after=await page.locator('#g7res').textContent();
  expect(after).not.toBe(before);
  expect(after).toContain('Σm');
  expect(errors).toEqual([]);
});

test('第八章 g8 ADC/DAC 量化指标外置后位数与电压可联动',async({page})=>{
  const errors=watch(page);
  await enter(page,'g8');
  await expect(page.locator('#g8nv')).toHaveText('8 位');
  await expect(page.locator('#g8out')).not.toBeEmpty();
  await page.locator('#g8n').evaluate(el=>{
    el.value='12';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await expect(page.locator('#g8nv')).toHaveText('12 位');
  await expect(page.locator('#g8out')).toContainText('4096');
  expect(errors).toEqual([]);
});

test('第五章 n10 存储器扩展外置后仍可切换芯片并刷新结论',async({page})=>{
  const errors=watch(page);
  await enter(page,'n10');
  await expect(page.locator('#memSvg > *').first()).toBeAttached();
  await expect(page.locator('#memInfo')).not.toBeEmpty();
  await expect(page.locator('#memChip [data-memc]').first()).toBeAttached();
  const before=await page.locator('#memInfo').textContent();
  await page.locator('#memChip [data-memc="2"]').click();
  await expect(page.locator('#memInfo')).not.toHaveText(before);
  await expect(page.locator('#memNote')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('第六章 n11 时序设计四步外置后仍可前后翻步',async({page})=>{
  const errors=watch(page);
  await enter(page,'n11');
  await expect(page.locator('#tsBody')).not.toBeEmpty();
  await expect(page.locator('#tsHint')).not.toBeEmpty();
  const first=await page.locator('#tsBody').textContent();
  await page.locator('#tsNext').click();
  await expect(page.locator('#tsBody')).not.toHaveText(first);
  await page.locator('#tsPrev').click();
  await expect(page.locator('#tsBody')).toHaveText(first);
  expect(errors).toEqual([]);
});

test('五个外置脚本均被浏览器成功加载（无 404 / 语法错误）',async({page})=>{
  const errors=watch(page);
  const loaded=[];
  page.on('response',r=>{
    if(r.url().includes('/assets/chapters/'))loaded.push({url:r.url().split('/').pop(),status:r.status()});
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(()=>{});
  for(const name of ['ch01-number-codes.js','ch02-minterms.js','ch08-adc-specs.js',
                     'ch05-memory-expansion.js','ch06-sequential-design.js']){
    expect(loaded.some(x=>x.url===name&&x.status===200),name+' 应返回 200').toBeTruthy();
  }
  expect(errors).toEqual([]);
});
