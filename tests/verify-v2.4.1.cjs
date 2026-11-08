/* V2.4.1 阶段 E/F 结构与工程约束自检。
 * 校验设计系统变量、第二批原位拆分、公共 UI 组件、事件委托与资源释放，
 * 以及全部历史兼容性硬约束。不访问网络，不改写任何学习记录。
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'数字电子技术基础-互动课堂.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/v2.4.1-design.css'),'utf8');
let count=0;
function ok(cond,label){assert.ok(cond,label);count++;console.log('PASS '+label);}
function parse(file){
 const src=fs.readFileSync(path.join(root,file),'utf8');
 new vm.Script(src,{filename:file});
 return src;
}

/* ---------- B1 设计系统 ---------- */
ok(/:root\{[\s\S]*?--v241-primary:/.test(css),'浅色主题定义了完整颜色变量');
ok(/:root\[data-theme="dark"\]\{[\s\S]*?--v241-bg:/.test(css),'深色主题覆盖了颜色变量');
for(const token of ['--v241-font','--v241-fs-md','--v241-lh-body','--v241-sp-4',
  '--v241-r-md','--v241-shadow','--v241-t-fast','--v241-ease'])
 ok(css.includes(token),'设计令牌 '+token+' 存在');
ok(/prefers-reduced-motion:reduce/.test(css),'尊重系统减少动画设置');
ok(/:focus-visible/.test(css),'按钮与导航具备键盘焦点样式');
ok(/touch-action:none/.test(css),'3D 画布允许触摸操作');
ok(html.includes('<link rel="stylesheet" href="assets/v2.4.1-design.css">'),'设计系统样式已接入主页面');

/* ---------- E 第二批原位拆分 ---------- */
const BATCH2=[
 ['assets/chapters/ch03-gate-symbols.js','==================== 门电路符号速查 ====================','gateGrid'],
 ['assets/chapters/ch04-decoder-mux.js','==================== 74LS138 / 74LS151 交互 ====================','svg138'],
 ['assets/chapters/ch05-shift-register.js','==================== 74LS194 双向移位寄存器 ====================','svg194'],
 ['assets/chapters/ch06-counter-chips.js','==================== 74160 / 74161 与任意进制构造 ====================','svg161'],
 ['assets/chapters/ch06-sequence-generator.js','==================== 序列发生器（151）与节拍分配器（138） ====================','wav151'],
 ['assets/chapters/ch07-555-modes.js','==================== 555 五种接法 ====================','g5svg']
];
const tags=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const inlineBodies=tags.filter(t=>!/\bsrc\s*=/.test(t[1])).map(t=>t[2]);
const srcOrder=tags.map(t=>(t[1].match(/\bsrc\s*=\s*["']([^"']+)["']/i)||[])[1]).filter(Boolean);
const positions=[];
for(const [file,marker,domId]of BATCH2){
 const tag='<script src="'+file+'"></script>';
 ok(html.split(tag).length-1===1,file+' 恰好引用一次');
 const attrs=(tags.find(t=>t[1].includes(file))||['',''])[1];
 ok(!/\bdefer\b|\basync\b|type\s*=\s*["']module["']/i.test(attrs),file+' 保持传统同步加载');
 const src=parse(file);
 ok(src.includes(marker)&&src.includes(domId),file+' 保留原控制器与 DOM 绑定');
 ok(!inlineBodies.some(b=>b.includes(marker)),file+' 原内联正文已移除');
 positions.push(srcOrder.indexOf(file));
}
ok(positions.every((p,i)=>p>=0&&(i===0||p>positions[i-1])),'第二批脚本保持原始相对顺序');
ok(positions.every(p=>p<srcOrder.indexOf('assets/legacy/navigation.js')),
  '第二批脚本仍位于尾部公共导航脚本之前');

/* ---------- E 公共组件 / 事件委托 / 资源释放 ---------- */
const ui=parse('assets/v2.4.1-ui.js');
const labs=parse('assets/v2.4.1-labs.js');
const learning=parse('assets/v2.4.1-learning.js');
ok(/DigitalV241UI=Object\.freeze\(\{el,button,card,badge,hint/.test(ui),'公共 UI 组件对外暴露');
ok(learning.includes('UI.el')&&labs.includes('UI.el'),'新增模块复用公共 UI 组件，未重复造轮子');
ok(/addEventListener\('click',onInteraction\)/.test(labs)&&
   /addEventListener\('input',onInteraction\)/.test(labs),'实验增强只绑定一次委托监听');
ok(/new MutationObserver/.test(labs)&&/new MutationObserver/.test(ui),'模块状态用观察者而非轮询');
ok(/pagehide/.test(labs)&&/pagehide/.test(ui)&&/pagehide/.test(learning),'三个模块均注册页面卸载释放');
ok(/clearTimeout\(timers\.get\(id\)\)/.test(labs)&&/observer\.disconnect\(\)/.test(labs),'定时器与观察者在卸载时释放');
ok(/lastText\.get\(id\)===text/.test(labs),'输出未变化时不写 DOM，避免重复更新');

/* ---------- F 兼容性硬约束 ---------- */
const sections=[...html.matchAll(/<section\b[^>]*class=["'][^"']*\bmod\b[^"']*["'][^>]*\bid=["']([^"']+)["']/gi)].map(x=>x[1]);
ok(sections.length===51,'51 个原始教学模块全部保留');
for(let i=1;i<=8;i++)ok(sections.includes('c'+i),'第 '+i+' 章精讲保留');
for(let i=1;i<=5;i++)ok(sections.includes('w'+i),'第 '+i+' 个 3D 场景保留');
ok(html.includes('window.location.replace')||fs.readFileSync(path.join(root,'index.html'),'utf8').includes('window.location.replace'),
  '首页重定向与深链接保留');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
ok(pkg.version==='2.5.1','发布版本为 2.5.1');
ok(html.length<369524,'主 HTML 小于第二批拆分前基线 369524 字符（当前 '+html.length+'）');
console.log('V2.4.1 工程结构共 '+count+' 项检查通过；HTML '+html.length+' 字符，内联脚本 '+inlineBodies.length+' 个。');
