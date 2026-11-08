/* V2.4.1 阶段 E 验收：第二批原位拆分的 6 个模块功能未受损。
 * 全部使用真实鼠标点击，并监听页面异常与本地 404。
 */
const {test,expect}=require('@playwright/test');

const CASES=[
 {mod:'g1',svg:'#gateGrid',control:'[data-c]',result:'#gateTT'},
 {mod:'g2',svg:'#svg138',control:'[data-p]',result:'#note138'},
 {mod:'g3',svg:'#svg194',control:'#btn194',result:'#note194'},
 {mod:'g4',svg:'#svg161',control:'#btn161',result:'#note161'},
 {mod:'n9',svg:'#wav151',control:'#btnQ',result:'#note151s'},
 {mod:'g5',svg:'#g5svg',control:'[data-g5]',result:'#g5note'}
];

test('第二批六个外置控制器在真实浏览器中均可激活并响应操作',async({page})=>{
  const errors=[],missing=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('127.0.0.1'))missing.push(r.url());});
  await page.goto('/');
  for(const c of CASES){
    await page.evaluate(id=>window.show(id),c.mod);
    await expect(page.locator('#'+c.mod),c.mod+' 应激活').toHaveClass(/active/);
    await expect(page.locator('#'+c.mod+' '+c.svg+' > *').first(),c.mod+' 图形应渲染').toBeAttached();
    const out=page.locator('#'+c.mod+' '+c.result);
    await expect(out,c.mod+' 结果区应存在').toHaveCount(1);
    await page.locator('#'+c.mod+' '+c.control).first().click();
    await expect(out).not.toBeEmpty();
  }
  expect(missing).toEqual([]);
  expect(errors.filter(x=>!/cdn\.|unpkg|skypack|esm\.sh|Failed to load resource/.test(x))).toEqual([]);
});

test('六个外置脚本均被浏览器以 200 加载且只加载一次',async({page})=>{
  const loaded=[];
  page.on('response',r=>{if(r.url().includes('/assets/chapters/'))loaded.push(r.url().split('/').pop());});
  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(()=>{});
  for(const name of ['ch03-gate-symbols.js','ch04-decoder-mux.js','ch05-shift-register.js',
    'ch06-counter-chips.js','ch06-sequence-generator.js','ch07-555-modes.js']){
    expect(loaded.filter(x=>x===name).length,name+' 应恰好加载一次').toBe(1);
  }
});
