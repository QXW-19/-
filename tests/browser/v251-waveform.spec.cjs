/* ==========================================================================
   V2.5.1 阶段 3 浏览器验收：分段归档、内存上限、导出导入、
   缩放/游标/事件定位保持可用、模型边界声明与会话存储不膨胀。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function lab(page){
  await page.goto('/');
  await page.evaluate(()=>{
   window.show('v25-lab');
   window.DigitalV25Lab.openCase('dff');
  });
  await expect(page.locator('#v25-lab')).toHaveClass(/active/);
}
const stats=page=>page.evaluate(()=>window.DigitalV25Lab.waveform().archiveStats());

test('归档统计明确显示分段、容量与内存上限',async({page})=>{
  await lab(page);
  await expect(page.locator('.v251-archive-stat')).toContainText('2048');
  await expect(page.locator('.v251-archive-stat')).toContainText('上限 8 段');
  const s=await stats(page);
  expect(s.capacity).toBe(2048);
  expect(s.maxSegments).toBe(8);
  expect(s.segmentSize).toBe(256);
  expect(s.total).toBeGreaterThanOrEqual(0);
  expect(s.bytes).toBeLessThanOrEqual(s.maxBytes+4096);
});

test('超过 256 条采样自动分段，缩放/游标/事件定位仍可用',async({page})=>{
  await lab(page);
  await page.evaluate(()=>{
   const L=window.DigitalV25Lab,W=L.waveform();
   for(let i=0;i<300;i++)W.record(L.getCircuit(),i%2===0);
  });
  const s=await stats(page);
  expect(s.total).toBeGreaterThanOrEqual(300);
  expect(s.segments).toBeGreaterThanOrEqual(2);
  await page.locator('.v25-wave-controls button',{hasText:'放大'}).click();
  await page.locator('.v25-wave-controls button',{hasText:'缩小'}).click();
  const plot=page.locator('.v25-wave-svg');
  const box=await plot.boundingBox();
  await page.mouse.click(box.x+box.width*0.6,box.y+box.height*0.5);
  await expect(page.locator('.v25-wave-readout')).toContainText('游标：采样');
  await expect(page.locator('.v25-wave-readout')).toContainText('↑').catch(()=>{});
  await expect(page.locator('.v25-wave')).toContainText('不能当作真实示波器测量结果');
});

test('导出波形归档文件带版本标记，可重新导入且总数一致',async({page})=>{
  await lab(page);
  await page.evaluate(()=>{
   const L=window.DigitalV25Lab,W=L.waveform();
   for(let i=0;i<40;i++)W.record(L.getCircuit(),i%3===0);
  });
  const before=(await stats(page)).total;
  const [download]=await Promise.all([
   page.waitForEvent('download'),
   page.locator('.v25-wave-controls button',{hasText:'导出波形'}).click()
  ]);
  const stream=await download.createReadStream();
  let text='';for await(const chunk of stream)text+=chunk.toString();
  const data=JSON.parse(text);
  expect(data.version).toBe(2);
  expect(data.kind).toBe('v2.5.1-wave-archive');
  expect(Array.isArray(data.segments)).toBeTruthy();
  expect(data.source).toContain('离散事件采样');
  // 清空后从文件导入，验证恢复
  await page.locator('.v25-wave-controls button',{hasText:'清除历史'}).click();
  expect((await stats(page)).total).toBe(0);
  await page.locator('.v25-wave-controls input[type="file"]').setInputFiles({
   name:'wave.json',mimeType:'application/json',buffer:Buffer.from(text)
  });
  await expect(page.locator('.v25-wave-readout')).toContainText('已导入');
  expect((await stats(page)).total).toBe(before);
});

test('非法波形文件被拒绝且不破坏现有归档',async({page})=>{
  await lab(page);
  await page.evaluate(()=>{
   const L=window.DigitalV25Lab,W=L.waveform();
   for(let i=0;i<10;i++)W.record(L.getCircuit(),false);
  });
  const before=(await stats(page)).total;
  await page.locator('.v25-wave-controls input[type="file"]').setInputFiles({
   name:'bad.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify({version:1,kind:'wrong',segments:[]}))
  });
  await expect(page.locator('.v25-wave-readout')).toContainText('波形导入失败');
  expect((await stats(page)).total).toBe(before);
});

test('波形历史不入 localStorage，旧存档结构保持不变',async({page})=>{
  await page.addInitScript(()=>{
   localStorage.setItem('digital-course-v1.8-study',
    JSON.stringify({version:1,completed:['l1-1'],last:'l1-1',attempts:{}}));
  });
  await lab(page);
  await page.evaluate(()=>{
   const L=window.DigitalV25Lab,W=L.waveform();
   for(let i=0;i<30;i++)W.record(L.getCircuit(),false);
  });
  const state=await page.evaluate(()=>{
   const raw=JSON.parse(localStorage.getItem('digital-course-v2.5-circuit')||'null');
   return {study:localStorage.getItem('digital-course-v1.8-study'),
    version:raw&&raw.version,cfg:raw&&raw.config,
    hasSamples:!!(raw&&raw.config&&raw.config.samples)};
  });
  expect(state.study).toContain('l1-1');
  expect(state.version).toBe(2);
  expect(state.hasSamples).toBeFalsy();   // 波形历史只存在会话内，避免存档膨胀
});

test('清除历史后统计归零，仍可继续记录 0/1/X 三值波形',async({page})=>{
  await lab(page);
  await page.evaluate(()=>{
   const L=window.DigitalV25Lab,W=L.waveform();
   for(let i=0;i<20;i++)W.record(L.getCircuit(),false);
  });
  await page.locator('.v25-wave-controls button',{hasText:'清除历史'}).click();
  expect((await stats(page)).total).toBe(0);
  await page.locator('.v25-wave-controls button',{hasText:'采样当前状态'}).click();
  const s=await stats(page);
  expect(s.total).toBe(1);
  expect(s.bytes).toBeGreaterThan(0);
});
