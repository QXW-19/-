/* V2.4.1 阶段 A 持久化质量验收：把基线巡检固化为回归测试。
 * 覆盖：四种视口布局溢出、深链接定位、旧版学习记录兼容、
 * 关键互动按钮响应、本地资源 404 / JS 异常、WebGL 与 CDN 分级探测。
 * 不新增或修改任何课程内容。
 */
const {test,expect}=require('@playwright/test');

function watch(page){
  const js=[],local=[],remote=[];
  page.on('pageerror',e=>js.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')js.push('console: '+m.text());});
  page.on('requestfailed',r=>{
    const u=r.url();(u.includes('127.0.0.1')?local:remote).push(u);
  });
  page.on('response',r=>{
    if(r.status()>=400)(r.url().includes('127.0.0.1')?local:remote).push(r.status()+' '+r.url());
  });
  return {js,local,remote};
}

for(const [width,height,name] of [[375,812,'375×812'],[390,844,'390×844'],[768,1024,'768×1024'],[1440,900,'1440×900']]){
  test('视口 '+name+'：首页与讲义均无横向溢出、无 JS 异常',async({page})=>{
    const logs=watch(page);
    await page.setViewportSize({width,height});
    await page.goto('/');
    await expect(page.locator('#v20-home')).toHaveClass(/active/);
    const check=()=>page.evaluate(()=>{
      const de=document.documentElement;
      const wide=[...document.querySelectorAll('#main *,#nav *,.app *')]
        .filter(e=>{
          const r=e.getBoundingClientRect();
          return r.width>window.innerWidth+2&&r.height>0&&getComputedStyle(e).display!=='none';
        }).length;
      return {overflow:de.scrollWidth-window.innerWidth,wide};
    });
    const home=await check();
    expect(home.overflow).toBeLessThanOrEqual(1);
    expect(home.wide).toBe(0);
    await page.evaluate(()=>window.DigitalV18Navigation.openLesson('l1-2'));
    await expect(page.locator('#v18-school')).toHaveClass(/active/);
    const lesson=await check();
    expect(lesson.overflow).toBeLessThanOrEqual(1);
    expect(lesson.wide).toBe(0);
    expect(logs.local).toEqual([]);
    expect(logs.js.filter(x=>!/cdn\.|unpkg|skypack|esm\.sh|Failed to load resource/.test(x))).toEqual([]);
  });
}

test('11 个代表性深链接均能定位到对应模块',async({page})=>{
  for(const id of ['c1','c3','c8','m1','m5','m8','w1','w5','v18-school','v15-exam','v20-home']){
    await page.goto('/#'+id);
    await expect(page.locator('#'+id),'深链接 #'+id).toHaveClass(/active/);
  }
});

test('旧版学习记录与 32 节进度在首页加载后保持原值',async({page})=>{
  const stored=JSON.stringify({version:1,completed:['l1-1'],last:'l1-1',attempts:{}});
  await page.addInitScript(v=>{
    localStorage.setItem('digital-course-v1.8-study',v);
    localStorage.setItem('digital-course-v1.3-circuit','{"sentinel":"v1.3"}');
  },stored);
  await page.goto('/');
  await expect(page.locator('.v20-kpis')).toContainText('1/32');
  const after=await page.evaluate(()=>({
    study:localStorage.getItem('digital-course-v1.8-study'),
    old:localStorage.getItem('digital-course-v1.3-circuit')
  }));
  expect(after.study).toBe(stored);
  expect(after.old).toBe('{"sentinel":"v1.3"}');
});

test('八章互动按钮仍可响应真实点击',async({page})=>{
  await page.goto('/');
  const cases=[['m1','#m1go','#m1narr'],['m2','#kmRandom','#kmExpr'],['m3','#cmHi','#cmVout'],
    ['m4','#rcUp','#rcResult'],['m5','#ffPulse','#ffNarr'],['m6','#stStep','#stNow'],
    ['m7','#nePause','#neF'],['m8','#adcStep','#adcCode']];
  for(const [id,btn,out]of cases){
    await page.evaluate(x=>window.show(x),id);
    await page.locator(btn).click();
    await expect(page.locator(out)).not.toBeEmpty();
  }
});

test('WebGL 与 Three.js CDN 状态如实分级报告',async({page})=>{
  const logs=watch(page);
  await page.goto('/');
  const state=await page.evaluate(()=>({
    webgl:window.__K3?window.__K3.hasWebGL():null,
    reason:window.__K3?window.__K3.reason():''
  }));
  expect(typeof state.webgl).toBe('boolean');
  expect(state.reason.length).toBeGreaterThan(10);
  console.log('[V2.4.1 环境] WebGL='+state.webgl+'，本地失败 '+logs.local.length+' 项，远端失败 '+logs.remote.length+' 项');
  expect(logs.local).toEqual([]);
});
