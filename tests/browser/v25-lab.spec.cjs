/* ==========================================================================
   V2.5 阶段 A/B 浏览器验收：真实 Chromium 中的电路编辑、三值信号与波形同步。
   不修改任何课程 DOM，不删除既有测试。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function lab(page){
  await page.goto('/');
  await expect(page.locator('#v20-home')).toHaveClass(/active/);
  await page.evaluate(()=>window.show('v25-lab'));
  await expect(page.locator('#v25-lab')).toHaveClass(/active/);
}
function watch(page){
  const js=[],bad=[];
  page.on('pageerror',e=>js.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')js.push('console: '+m.text());});
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('127.0.0.1'))bad.push(r.url());});
  return {js,bad};
}
const circuit=page=>page.evaluate(()=>{
 const c=window.DigitalV25Lab.getCircuit();
 return {nodes:c.nodes.length,wires:c.wires.length,tick:c.tick};
});

test('实验室与波形分析仪正常加载，五类元件库与六个教学案例齐全',async({page})=>{
  const logs=watch(page);
  await lab(page);
  await expect(page.locator('.v25-canvas')).toBeVisible();
  await expect(page.locator('.v25-palette h4')).toHaveCount(6); // 五类 + 快速案例
  await expect(page.locator('.v25-palette-item')).toHaveCount(13);
  await expect(page.locator('.v25-case-box .v25-btn')).toHaveCount(6);
  await expect(page.locator('.v25-wave-svg')).toBeVisible();
  await expect(page.locator('.v25-diagnostics')).toBeVisible();
  expect(logs.bad).toEqual([]);
  expect(logs.js).toEqual([]);
});

test('端口接线、断线、重新连接与撤销重做均可真实操作',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('halfadder'));
  expect((await circuit(page)).wires).toBe(6);
  // 点击 LED n5 的输入端口：无待连接时应断开
  await page.locator('.v25-node[data-id="n5"] .v25-port.in').click();
  expect((await circuit(page)).wires).toBe(5);
  // 撤销恢复、重做再断开
  await page.locator('#v25-lab .v25-toolbar button',{hasText:'撤销'}).first().click();
  expect((await circuit(page)).wires).toBe(6);
  await page.locator('#v25-lab .v25-toolbar button',{hasText:'重做'}).first().click();
  expect((await circuit(page)).wires).toBe(5);
  // 点击 XOR 输出端再点 LED 输入端重新连接
  await page.locator('.v25-node[data-id="n3"] .v25-port.out').click();
  await page.locator('.v25-node[data-id="n5"] .v25-port.in').click();
  expect((await circuit(page)).wires).toBe(6);
  await expect(page.locator('.v25-status [role="status"]')).toContainText('已连接');
});

test('选中、复制、删除元件与 Ctrl+Z 快捷键',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('halfadder'));
  const before=(await circuit(page)).nodes;
  await page.locator('.v25-node[data-id="n3"] .v25-node-box').click();
  await page.locator('#v25-lab .v25-toolbar button',{hasText:'复制'}).click();
  expect((await circuit(page)).nodes).toBe(before+1);
  await page.locator('#v25-lab .v25-toolbar button',{hasText:'删除'}).click();
  expect((await circuit(page)).nodes).toBe(before);
  await page.keyboard.press('Control+z');
  expect((await circuit(page)).nodes).toBe(before+1);
});

test('半加器四种输入在画布上显示正确的 0/1 输出',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('halfadder'));
  const values=async()=>page.evaluate(()=>{
   const c=window.DigitalV25Lab.getCircuit(),st=window.DigitalV25Lab.evaluate();
   const leds=c.nodes.filter(n=>n.type==='LED');
   return leds.map(n=>st[n.id].inputs[0]);
  });
  const a='.v25-node[data-id="n1"] .v25-node-hit',b='.v25-node[data-id="n2"] .v25-node-hit';
  expect(await values()).toEqual([0,0]);
  await page.locator(a).click();expect(await values()).toEqual([1,0]);
  await page.locator(b).click();expect(await values()).toEqual([0,1]);
  await page.locator(a).click();expect(await values()).toEqual([1,0]);
});

test('D 触发器只在单步时钟后更新，波形采样与引擎同步',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('dff'));
  const q=()=>page.evaluate(()=>{
   const c=window.DigitalV25Lab.getCircuit(),n=c.nodes.find(x=>x.type==='DFF');
   return window.DigitalV25Lab.evaluate()[n.id].outputs[0];
  });
  expect(await q()).toBe(0);
  await page.locator('.v25-node[data-id="n1"] .v25-node-hit').click(); // D 置 1
  expect(await q()).toBe(0);
  await page.locator('.v25-wave-controls button',{hasText:'单步时钟'}).click();
  expect(await q()).toBe(1);
  await expect(page.locator('.v25-wave-readout')).toContainText('时钟脉冲 1');
  expect((await circuit(page)).tick).toBe(1);
});

test('模 6 计数器六次脉冲回绕，波形记录含有效沿标记',async({page})=>{
  await lab(page);
  await page.evaluate(()=>window.DigitalV25Lab.openCase('counter6'));
  for(let i=0;i<6;i++)await page.locator('.v25-wave-controls button',{hasText:'单步时钟'}).click();
  const count=await page.evaluate(()=>window.DigitalV25Lab.getCircuit().nodes.find(n=>n.type==='COUNTER').count);
  expect(count).toBe(0);
  await expect(page.locator('.v25-wave-readout')).toContainText('时钟脉冲 6');
  expect(await page.locator('.v25-edge-text').count()).toBeGreaterThan(0);
});

test('悬空输入显示 X 虚线并给出中文诊断',async({page})=>{
  await lab(page);
  await page.evaluate(()=>{
   const M=window.DigitalMixedCircuit;
   let c=M.empty();c=M.add(c,'AND',80,80);c=M.add(c,'LED',360,80);c=M.connect(c,'n1',0,'n2',0);
   window.DigitalV25Lab.loadCircuit(c,'X 态测试');
  });
  await expect(page.locator('.v25-wire.v25-sig-x')).toHaveCount(1);
  await expect(page.locator('.v25-wire-label').first()).toHaveText('X');
  await expect(page.locator('.v25-diagnostics')).toContainText('输入端悬空');
  await expect(page.locator('.v25-diagnostics')).toContainText('未知态 X');
});

test('导入旧版 V1.6 JSON 与 V2.5 配置均能校验通过',async({page})=>{
  await lab(page);
  const result=await page.evaluate(()=>{
   const M=window.DigitalMixedCircuit,L=window.DigitalV25Lab;
   const legacy=M.example('sample');
   const a=L.normalize(legacy);M.validate(a.circuit);
   const b=L.normalize({version:2,circuit:legacy,config:{samples:[],channelKeys:[],view:16}});
   M.validate(b.circuit);
   let rejected=false;
   try{L.normalize({version:9,foo:1});}catch(_){rejected=true;}
   return {legacy:a.circuit.nodes.length,wrapped:b.circuit.nodes.length,rejected,
    exported:L.exportJSON().version};
  });
  expect(result.legacy).toBeGreaterThan(0);
  expect(result.wrapped).toBe(result.legacy);
  expect(result.rejected).toBeTruthy();
  expect(result.exported).toBe(1); // 导出保持 V1.6 原始结构
});

test('旧版 localStorage 电路存档可被 V2.5 实验室读取',async({page})=>{
  await page.addInitScript(()=>{
   // 构造一份符合 V1.6 结构的旧存档，不触碰任何学习记录键。
   localStorage.removeItem('digital-course-v2.5-circuit');
   localStorage.setItem('digital-course-v1.6-mixed',JSON.stringify({
    version:1,tick:3,history:[],
    nodes:[{id:'n1',type:'SWITCH',x:60,y:60,value:1},{id:'n2',type:'LED',x:300,y:60}],
    wires:[{from:'n1',output:0,to:'n2',input:0}]
   }));
  });
  await lab(page);
  const c=await circuit(page);
  expect(c.nodes).toBe(2);
  expect(c.wires).toBe(1);
  expect(c.tick).toBe(3);
  await expect(page.locator('.v25-node')).toHaveCount(2);
});

for(const [w,h,name]of[[375,812,'375×812'],[390,844,'390×844'],[768,1024,'768×1024'],[1440,900,'1440×900']]){
  test('视口 '+name+' 下实验室与波形仪无横向溢出、无 JS 异常',async({page})=>{
    const logs=watch(page);
    await page.setViewportSize({width:w,height:h});
    await lab(page);
    await page.evaluate(()=>window.DigitalV25Lab.openCase('dff'));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
    expect(logs.bad).toEqual([]);
    expect(logs.js).toEqual([]);
  });
}

test('51 个原始模块与 32 节讲义在新增实验室后仍完整',async({page})=>{
  await lab(page);
  await expect(page.locator('#main > section.mod[id^="c"]')).toHaveCount(8);
  await expect(page.locator('#main > section.mod[id^="w"]')).toHaveCount(5);
  await page.evaluate(()=>window.DigitalV18Navigation.openLesson('l8-4'));
  await expect(page.locator('#v18-school .v18-quiz')).toHaveCount(1);
  const count=await page.evaluate(()=>window.DigitalV18Lessons.lessons.length);
  expect(count).toBe(32);
});
