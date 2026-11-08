/* ==========================================================================
   V2.5.2 项目实训台浏览器验收（阶段 B/G）
   覆盖：四项目八步结构、密码锁门级交互、交通灯故障注入与安全复位、
        时钟跨午夜与 12/24 制、ADC 分辨率对比、波形、窄屏与深色主题。
   ========================================================================== */
const {test,expect}=require('@playwright/test');

async function openLab(page,id){
 await page.goto('/');
 await expect(page.locator('#v20-home')).toHaveClass(/active/);
 await page.evaluate(pid=>window.DigitalV252Lab.open(pid),id);
 await expect(page.locator('#v252-lab')).toHaveClass(/active/);
}
function watch(page){
 const errs=[];
 page.on('pageerror',e=>errs.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
 return errs;
}

test('实训台入口、四个项目与八步任务清单齐全',async({page})=>{
 const errs=watch(page);
 await page.goto('/');
 await expect(page.locator('#v20-home')).toHaveClass(/active/);
 await expect(page.locator('.nav-item[data-mod="v252-lab"]')).toHaveCount(1);
 await page.evaluate(()=>window.DigitalV252Lab.open('lock'));
 await expect(page.locator('#v252-lab .v252-project')).toHaveCount(4);
 await expect(page.locator('#v252-lab .v252-step')).toHaveCount(8);
 for(const name of ['数字密码锁','智能交通信号灯','数字时钟','数字电压采集系统']){
  await expect(page.locator('#v252-lab .v252-project',{hasText:name})).toHaveCount(1);
 }
 await expect(page.locator('#v252-lab .v252-boundary')).toContainText('不能作为真实');
 expect(errs).toEqual([]);
});

test('密码锁：错误不开锁、正确开锁并保持、清除后复位',async({page})=>{
 const errs=watch(page);
 await openLab(page,'lock');
 await page.evaluate(()=>window.DigitalV252Lab.go(4));
 const sim=page.locator('#v252-lab .v252-sim');
 await expect(sim).toBeVisible();

 const readout=page.locator('#v252-lab .v252-readout');
 const item=name=>readout.locator('.v252-readout-item',{hasText:name}).locator('.v252-readout-value');

 // 默认预设 1010、输入 0000，先确认一次：不应开锁
 await page.locator('#v252-lab button',{hasText:'确认'}).click();
 await expect(item('开锁状态')).toHaveText('0');
 await expect(item('错误指示')).toHaveText('1');

 // 把输入拨成 1010（K3、K1），确认后开锁
 await page.locator('#v252-lab .v252-bit',{hasText:'K3='}).click();
 await page.locator('#v252-lab .v252-bit',{hasText:'K1='}).click();
 await expect(item('比较结果')).toContainText('1（匹配）');
 await page.locator('#v252-lab button',{hasText:'确认'}).click();
 await expect(item('开锁状态')).toHaveText('1');

 // 改动输入但不确认：开锁状态必须保持
 await page.locator('#v252-lab .v252-bit',{hasText:'K0='}).click();
 await expect(item('比较结果')).toContainText('0（不匹配）');
 await expect(item('开锁状态')).toHaveText('1');

 // 清除后回到未开锁
 await page.locator('#v252-lab button',{hasText:'清除'}).click();
 await expect(item('开锁状态')).toHaveText('0');
 await expect(item('确认次数')).toHaveText('0');
 expect(errs).toEqual([]);
});

test('交通灯：单步推进、非法输出诊断与安全复位',async({page})=>{
 const errs=watch(page);
 await openLab(page,'traffic');
 await page.evaluate(()=>window.DigitalV252Lab.go(4));
 await expect(page.locator('#v252-lab .v252-lampbox')).toHaveCount(2);

 const phase=page.locator('#v252-lab .v252-readout-item',{hasText:'相位'}).locator('.v252-readout-value');
 // 南北绿持续 10 秒，走 10 步后进入黄灯
 for(let i=0;i<10;i++)await page.locator('#v252-lab button',{hasText:'单步 1 秒'}).click();
 await expect(phase).toHaveText('NS_YELLOW');

 await page.locator('#v252-lab button',{hasText:'注入：双向绿'}).click();
 await expect(page.locator('#v252-lab .v252-diag')).toContainText('双向同时为绿');
 await page.locator('#v252-lab button',{hasText:'安全复位'}).click();
 await expect(page.locator('#v252-lab .v252-diag')).toContainText('当前输出组合合法');
 await expect(phase).toHaveText('NS_GREEN');
 expect(errs).toEqual([]);
});

test('数字时钟：跨午夜边界与 12/24 小时制对比',async({page})=>{
 const errs=watch(page);
 await openLab(page,'clock');
 await page.evaluate(()=>window.DigitalV252Lab.go(4));
 await page.locator('#v252-lab button',{hasText:'跳到 23:59:55'}).click();
 const readout=page.locator('#v252-lab .v252-readout');
 const v24=readout.locator('.v252-readout-item',{hasText:'24 小时制'}).locator('.v252-readout-value');
 await expect(v24).toHaveText('23:59:55');
 for(let i=0;i<6;i++)await page.locator('#v252-lab button',{hasText:'单步 1 秒'}).click();
 await expect(v24).toHaveText('00:00:01');
 const v12=readout.locator('.v252-readout-item',{hasText:'12 小时制'}).locator('.v252-readout-value');
 await expect(v12).toContainText('12:00:01 AM');
 await page.locator('#v252-lab button',{hasText:'12 小时制'}).click();
 await expect(page.locator('#v252-lab .v252-ampm')).toHaveText('AM');
 expect(errs).toEqual([]);
});

test('电压采集：分辨率切换改变步长，对比表给出三种位数',async({page})=>{
 const errs=watch(page);
 await openLab(page,'adc');
 await page.evaluate(()=>window.DigitalV252Lab.go(4));
 const readout=page.locator('#v252-lab .v252-readout');
 const step=readout.locator('.v252-readout-item',{hasText:'量化步长'}).locator('.v252-readout-value');
 await expect(step).toHaveText('3.2227 mV');
 await page.locator('#v252-lab button',{hasText:'12 位'}).click();
 await expect(step).toHaveText('0.8057 mV');
 const bin=readout.locator('.v252-readout-item',{hasText:'二进制码'}).locator('.v252-readout-value');
 await expect(bin).toHaveText(/^[01]{12}$/);
 await expect(page.locator('#v252-lab .v252-table tbody tr')).toHaveCount(3);
 await expect(page.locator('#v252-lab .v252-table tbody tr').nth(2)).toContainText('12 位');
 expect(errs).toEqual([]);
});

test('操作后可在波形页看到真实采样，而不是静态占位',async({page})=>{
 await openLab(page,'clock');
 await page.evaluate(()=>window.DigitalV252Lab.go(4));
 await page.locator('#v252-lab button',{hasText:'跳到 23:59:55'}).click();
 for(let i=0;i<8;i++)await page.locator('#v252-lab button',{hasText:'单步 1 秒'}).click();
 await page.evaluate(()=>window.DigitalV252Lab.go(5));
 await expect(page.locator('#v252-lab .v252-wave')).toHaveCount(1);
 const paths=page.locator('#v252-lab .v252-wave-path');
 expect(await paths.count()).toBeGreaterThanOrEqual(3);
 await expect(page.locator('#v252-lab .v252-wave-label',{hasText:'跨午夜'})).toHaveCount(1);
});

test('项目卡片可一键进入实训台，窄屏与深色主题不溢出',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto('/');
 await page.evaluate(()=>window.show('v251-projects'));
 const jump=page.locator('#v251-projects button',{hasText:'进入实训台'}).first();
 await expect(jump).toBeVisible();
 await jump.click();
 await expect(page.locator('#v252-lab')).toHaveClass(/active/);
 await expect(page.locator('#v252-lab .v252-project')).toHaveCount(4);
 let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 expect(overflow).toBeLessThanOrEqual(1);

 await page.evaluate(()=>{document.documentElement.dataset.theme='dark';});
 await page.evaluate(()=>window.DigitalV252Lab.go(4));
 await expect(page.locator('#v252-lab .v252-sim')).toBeVisible();
 overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 expect(overflow).toBeLessThanOrEqual(1);
});
