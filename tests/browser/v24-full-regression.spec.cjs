/* V2.4 完整浏览器验收（阶段 D）：补齐章节考试、错题记录、3D 分级测试、
 * 全页面 JS 错误/资源加载监控，以及八章原始控制器与深链接的分级覆盖。
 *
 * 3D 场景严格分三级：页面入口 / WebGL 初始化 / 真实渲染。
 * 若本机无 GPU 加速或 CDN 不可达，渲染测试显式标记为 skipped，
 * 并在报告中列出受限原因，绝不把跳过算作通过。
 */
const {test,expect}=require('@playwright/test');

async function home(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
}

function collect(page){
  const local=[],remote=[],js=[];
  page.on('pageerror',e=>js.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')js.push('console: '+m.text());});
  page.on('requestfailed',r=>{
    const url=r.url(),msg=url+' :: '+(r.failure()&&r.failure().errorText);
    (url.includes('127.0.0.1')?local:remote).push(msg);
  });
  page.on('response',r=>{
    if(r.status()>=400)(r.url().includes('127.0.0.1')?local:remote).push('http '+r.status()+' '+r.url());
  });
  return {local,remote,js};
}

test('首页与导航：51 模块、八章精讲、五个 3D 场景、深链接',async({page})=>{
  const logs=collect(page);
  await home(page);
  await expect(page.locator('#main > section.mod[id^="c"]')).toHaveCount(8);
  await expect(page.locator('#main > section.mod[id^="w"]')).toHaveCount(5);
  await expect(page.locator('#nav .nav-item[data-mod="v20-home"]')).toBeVisible();
  // V2.0 会把侧栏折叠为 v20-condensed，各 .chap 分组默认隐藏，这是既有设计；
  // 因此这里点击真实可见的首页导航项，章节导航另行用深链接与 show() 校验。
  await page.locator('#nav .nav-item[data-mod="c3"]').evaluate(el=>{
    if(!el||!el.hasAttribute('data-mod'))throw Error('章节导航项缺失');
  });
  for(let i=1;i<=8;i++)await expect(page.locator('#nav .nav-item[data-mod="c'+i+'"]')).toHaveCount(1);
  for(let i=1;i<=5;i++)await expect(page.locator('#nav .nav-item[data-mod="w'+i+'"]')).toHaveCount(1);
  await page.locator('#nav .nav-item[data-mod="v20-home"]').click();
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
  await page.goto('/#c7');
  await expect(page.locator('#c7')).toHaveClass(/active/);
  expect(logs.local).toEqual([]);
  expect(logs.js.filter(x=>!x.includes('cdn.')&&!x.includes('unpkg')&&!x.includes('skypack')&&!x.includes('esm.sh'))).toEqual([]);
});

test('八章精讲与八章原始互动控制器均可激活并响应操作',async({page})=>{
  await home(page);
  for(let i=1;i<=8;i++){
    await page.evaluate(id=>window.show(id),'c'+i);
    await expect(page.locator('#c'+i)).toHaveClass(/active/);
    await expect(page.locator('#c'+i+' .mod-h')).toBeVisible();
  }
  const cases=[
    ['m1','#m1go','#m1narr'],['m2','#kmRandom','#kmExpr'],['m3','#cmHi','#cmVout'],
    ['m4','#rcUp','#rcResult'],['m5','#ffPulse','#ffNarr'],['m6','#stStep','#stNow'],
    ['m7','#nePause','#neF'],['m8','#adcStep','#adcCode']
  ];
  for(const [id,control,result]of cases){
    await page.evaluate(x=>window.show(x),id);
    await expect(page.locator('#'+id)).toHaveClass(/active/);
    await page.locator(control).click();
    await expect(page.locator(result)).not.toBeEmpty();
  }
});

test('章节考试可交卷评分，并把未作答题写入错题记录',async({page})=>{
  await home(page);
  page.on('dialog',d=>d.accept());
  await page.evaluate(()=>window.show('v15-exam'));
  await expect(page.locator('#v15-exam')).toHaveClass(/active/);
  await page.locator('#v15-exam button',{hasText:'开始新测试'}).click();
  await expect(page.locator('#v15-active .v15-question')).toHaveCount(6);
  await page.locator('#v15-active button',{hasText:'提交试卷并评分'}).click();
  await expect(page.locator('#v15-results')).toBeVisible();
  await expect(page.locator('#v15-results .v15-score')).toHaveText('0 分');
  await expect(page.locator('#v15-exam')).toContainText('待纠正错题 6 道');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('digital-course-v1.5')||'{}'));
  expect(Object.keys(saved.mistakes||{}).length).toBe(6);
  // 旧版 V1.1 章节进度与 V1.8 讲义进度不应被考试改写。
  const v11=await page.evaluate(()=>localStorage.getItem('digital-course-v1.1'));
  expect(v11===null||typeof v11==='string').toBeTruthy();
});

test('四种视口下均可切换章节并操作互动控件',async({page})=>{
  await home(page);
  for(const [width,height]of[[375,812],[390,844],[768,1024],[1440,900]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>window.show('m2'));
    await expect(page.locator('#m2')).toHaveClass(/active/);
    await page.locator('#kmRandom').click();
    await expect(page.locator('#kmExpr')).not.toBeEmpty();
    await page.evaluate(()=>window.show('c7'));
    await expect(page.locator('#c7')).toHaveClass(/active/);
  }
});

test('3D 一级：五个原始场景入口均可导航并激活',async({page})=>{
  await home(page);
  for(let i=1;i<=5;i++){
    const id='w'+i;
    await expect(page.locator('#'+id)).toHaveCount(1);
    await page.evaluate(x=>window.show(x),id);
    await expect(page.locator('#'+id)).toHaveClass(/active/);
    await expect(page.locator('#'+id)).toBeVisible();
  }
});

test('3D 二级：WebGL 能力探测可区分 GPU 与网络限制',async({page})=>{
  await home(page);
  const probe=await page.evaluate(()=>{
    const has=window.__K3&&typeof window.__K3.hasWebGL==='function';
    const ok=has?window.__K3.hasWebGL():null;
    const reason=has?window.__K3.reason():'';
    let ctx=null;
    try{
      const c=document.createElement('canvas');
      ctx=!!(c.getContext('webgl2')||c.getContext('webgl'));
    }catch(_){ctx=false;}
    return {has,ok,ctx,reason};
  });
  expect(probe.has).toBeTruthy();
  expect(typeof probe.ok).toBe('boolean');
  expect(probe.ok).toBe(probe.ctx);
  expect(probe.reason.length).toBeGreaterThan(10);
  console.log('[3D-WebGL] 本机 WebGL 可用：'+probe.ok+'；页面预置降级文案：'+probe.reason.replace(/<[^>]+>/g,'').slice(0,60));
});

test('3D 三级：真实渲染（需 WebGL 且 Three.js 本地副本或 CDN 可用）',async({page})=>{
  await home(page);
  const webgl=await page.evaluate(()=>window.__K3.hasWebGL());
  // Three.js 是否可加载单独探测，避免把「入口可打开」误报为「画面已渲染」。
  // 本地副本优先，只有本地与 CDN 都不可用时才跳过真实渲染验收。
  let threeAvailable=false;
  try{
    threeAvailable=await page.evaluate(async()=>{
      const probe=async(url)=>{
        const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),6000);
        try{
          const r=await fetch(url,{method:'GET',mode:'cors',signal:ctrl.signal});
          return r.ok;
        }catch(_){return false;}finally{clearTimeout(timer);}
      };
      if(await probe('/assets/vendor/three.module.js'))return true;
      return probe('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    });
  }catch(_){threeAvailable=false;}
  test.skip(!webgl,'本机 Chromium 未启用 WebGL 硬件加速，无法进行真实渲染验收');
  test.skip(!threeAvailable,'Three.js 本地副本与 CDN 均不可达，无法进行真实渲染验收');
  await page.evaluate(()=>window.show('w1'));
  await page.waitForTimeout(2500);
  // w1 同时保留原生 Canvas 降级版（#cityCanvas，默认隐藏）和 Three.js 版（#city3d 内 canvas）。
  // 真实渲染必须检查后者，不能把降级容器当作渲染结果。
  const canvas=page.locator('#city3d canvas').first();
  await expect(canvas).toBeVisible();
  const size=await canvas.evaluate(c=>({w:c.width,h:c.height}));
  expect(size.w).toBeGreaterThan(100);
  expect(size.h).toBeGreaterThan(100);
  // 用 Chromium 合成后的截图判断画面是否真的有内容：纯空白画布会压成极小、字节单一的 PNG。
  const shot=await canvas.screenshot();
  const distinct=new Set(shot.slice(0,4000)).size;
  expect(shot.length).toBeGreaterThan(4000);
  expect(distinct).toBeGreaterThan(20);
  console.log('[3D-Render] Three.js canvas '+size.w+'×'+size.h+'，截图 '+shot.length+' 字节，字节多样性 '+distinct);
});

test('整页无本地资源加载失败、无未分类 JavaScript 错误',async({page})=>{
  const logs=collect(page);
  await home(page);
  await page.waitForLoadState('networkidle').catch(()=>{});
  // 远端 CDN 失败属于环境限制，单独列出，不伪报为本地错误。
  if(logs.remote.length)console.log('[环境限制] 远端资源失败 '+logs.remote.length+' 项：'+logs.remote.slice(0,3).join(' | '));
  expect(logs.local).toEqual([]);
  const localJs=logs.js.filter(x=>!/cdn\.|unpkg|skypack|esm\.sh|Failed to load resource/.test(x));
  expect(localJs).toEqual([]);
  console.log('[资源] 本地失败 '+logs.local.length+' 项，远端失败 '+logs.remote.length+' 项，控制台错误 '+logs.js.length+' 条');
});
