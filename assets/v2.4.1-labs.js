/* ==========================================================================
   V2.4.1 互动实验增强（阶段 C）
   --------------------------------------------------------------------------
   C1/C2：为既有组合/时序实验追加「当前输出 + 结果解读 + 变化高亮」，
          并为时序模块补一幅理想时钟波形（图形取自同一计算内核的图解）。
   C3   ：为五个 Three.js 场景追加分级状态条、降级说明、触摸提示；
          明确区分「入口打开 / WebGL 初始化 / 真实渲染」，
          不把 canvas 存在当作渲染成功（真实渲染由浏览器截图测试验收）。
   性能：全局只注册 1 个 click + 1 个 input 委托监听、1 个 class 观察者；
         结果文本未变化时不写 DOM，定时器与观察者在页面卸载时释放。
   ========================================================================== */
(function(root){
'use strict';
const doc=document;
const UI=root.DigitalV241UI;
if(!UI)return;
const el=UI.el;

/* ---------- C1 / C2：既有实验配置（只读取，不改写实验逻辑） ---------- */
const LABS=[
 {id:'m1',out:'#m1narr',name:'补码',chapter:1,
  explain:'补码让最高位带负权，减法因而可以写成「加上负数的补码」。核对刻度盘读数与位串是否一致。'},
 {id:'m2',out:'#kmExpr',name:'卡诺图',chapter:2,
  explain:'卡诺图按相邻 2ᵏ 个格子合并，每扩大一圈消掉一个变量；上下、左右边界也是相邻的。'},
 {id:'m3',out:'#cmVout',name:'CMOS 反相器',chapter:3,
  explain:'输入 0 时 PMOS 上拉输出 1，输入 1 时 NMOS 下拉输出 0；理想模型不含阈值、延迟与驱动能力限制。'},
 {id:'m4',out:'#rcResult',name:'竞争-冒险',chapter:4,
  explain:'不同路径的传播延迟会在输出产生毛刺；真实电路要靠选通、滤波或同步设计规避，毛刺不是逻辑错误本身。'},
 {id:'m5',out:'#ffNarr',name:'D 触发器',chapter:5,
  explain:'D 触发器只在有效时钟沿采样；改变 D 不会立刻改变 Q。理想模型忽略建立/保持时间与亚稳态。',timing:true},
 {id:'m6',out:'#stNow',name:'状态机',chapter:6,
  explain:'次态由现态与输入共同决定；时序波形上的箭头顺序就是状态转移顺序。真实电路还有传播延迟。',timing:true},
 {id:'m7',out:'#neF',name:'555 多谐振荡器',chapter:7,
  explain:'理想模型 T≈0.693(R1+2R2)C，占空比 =(R1+R2)/(R1+2R2)；真实电容容差与比较器阈值会改变频率。'},
 {id:'m8',out:'#adcCode',name:'逐次逼近 ADC',chapter:8,
  explain:'量化码 D=floor(Vin/(Vref/2ⁿ))，误差小于一个步长；真实器件还有非线性、失调与参考电压漂移。'},
 {id:'n1',out:'#gcVal',name:'格雷码',chapter:1,
  explain:'相邻十进制数的格雷码只差一位，可减少计数器跳变时多位同时翻转带来的译码毛刺。'},
 {id:'n3',out:'#triBus',name:'三态总线',chapter:3,
  explain:'0 路驱动为高阻 Z（不是 0）；1 路驱动给出确定电平；2 路电平相反同时驱动即冲突，真实硬件有短路风险。'},
 {id:'n10',out:'#memInfo',name:'存储器扩展',chapter:5,
  explain:'字长不足时并联芯片扩位，容量不足时扩展地址并用片选分时；两者可组合使用。'},
 {id:'n11',out:'#tsHint',name:'时序设计四步',chapter:6,
  explain:'状态定义 → 状态表 → 化简 → 实现。未使用状态必须有回到有效循环的明确路径。',timing:true},
 {id:'g6',out:'#g6nv',name:'数制对照',chapter:1,
  explain:'同一个位串代表什么取决于编码约定；位权相加只是其中一种解读方式。'},
 {id:'g7',out:'#g7res',name:'最小项',chapter:2,
  explain:'选中的最小项构成原函数，未选中的恰好构成反函数，合计 16 项。'},
 {id:'g8',out:'#g8nv',name:'ADC 量化指标',chapter:8,
  explain:'位数每增加 1，码数翻倍、步长减半；最大码是 2ⁿ−1 而不是 2ⁿ。'},
 {id:'v13-lab',out:'#v13-lab .v13-status',name:'半加器',chapter:4,
  explain:'A+B = S + 2C，四种输入都应满足这个关系，可以当作实验自检。'},
 {id:'v14-lab',out:'#v14-lab .v14-note',name:'触发器与计数器',chapter:6,
  explain:'计数器按有效沿逐拍跳转；模 N 回绕后必须回到 0，真实器件还要考虑延迟与频率上限。',timing:true}
];
const LAB_MAP=new Map(LABS.map(x=>[x.id,x]));
const strips=new Map();
const timers=new Map();
let raf=0,lastText=new Map();

function stripFor(cfg){
  const sec=doc.getElementById(cfg.id);if(!sec)return null;
  let strip=sec.querySelector(':scope > .v241-lab-strip');
  if(strip)return strip;
  strip=el('div',undefined,'v241-lab-strip');
  const head=el('div',undefined,'v241-lab-head');
  head.append(el('strong','实验结果解读'),el('span','等待操作','v241-badge info'));
  strip.append(head);
  const value=el('p',undefined,'v241-lab-value');value.textContent='（先在上方操作一次实验）';
  strip.append(value);
  const explain=el('p',cfg.explain,'v241-lab-explain');strip.append(explain);
  const model=el('p',undefined,'v241-note');
  model.textContent='模型边界：以上为课堂理想模型；真实器件的电气参数、时序与容差须查数据手册。';
  strip.append(model);
  if(cfg.timing&&root.DigitalV24LearningLoop){
    try{
      const d=root.DigitalV24LearningLoop.DIAGRAMS[cfg.chapter===5?5:cfg.chapter===6?6:7]();
      const fig=el('figure',undefined,'v241-wave');
      const box=el('div',undefined,'v24-diagram');
      box.innerHTML=d.svg;                 // SVG 由本站生成，不含外部输入
      fig.append(box,el('figcaption','理想时钟波形：边沿瞬时完成采样；真实器件存在建立/保持时间与传播延迟。','v241-hint'));
      strip.append(fig);
    }catch(_){/* 图解模块未加载时不影响实验本体 */}
  }
  sec.append(strip);
  strips.set(cfg.id,strip);
  return strip;
}

function refreshLab(id){
  const cfg=LAB_MAP.get(id);if(!cfg)return;
  const out=doc.querySelector(cfg.out);if(!out)return;
  const text=(out.textContent||'').trim().slice(0,220);
  if(!text||lastText.get(id)===text)return;   // 文本未变化时不写 DOM
  lastText.set(id,text);
  const strip=stripFor(cfg);if(!strip)return;
  const value=strip.querySelector('.v241-lab-value');
  if(value)value.textContent='当前输出：'+text;
  const badge=strip.querySelector('.v241-badge');
  if(badge){
    badge.textContent='已更新';badge.classList.remove('info');badge.classList.add('ok');
    strip.classList.remove('v241-focus');void strip.offsetWidth;strip.classList.add('v241-focus');
  }
  // 单次短定时用于把徽标恢复为静态提示；旧定时器先清除，避免堆积。
  clearTimeout(timers.get(id));
  timers.set(id,setTimeout(()=>{
    if(badge){badge.textContent='等待下一次变化';badge.classList.remove('ok');badge.classList.add('info');}
    strip.classList.remove('v241-focus');
    timers.delete(id);
  },1600));
}

function onInteraction(){
  const active=doc.querySelector('#main > section.mod.active');
  if(!active)return;
  const id=active.id;
  if(!LAB_MAP.has(id))return;
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;refreshLab(id);});
}

/* ---------- C3：五个 3D 场景的分级状态 ---------- */
const SCENES=[
 {id:'w1',name:'数字之城（全书地图）',canvas:'#city3d canvas'},
 {id:'w2',name:'时序流水线（第六章）',canvas:null},
 {id:'w3',name:'CMOS 剖面（第三章）',canvas:null},
 {id:'w4',name:'555 振荡器（第七章）',canvas:null},
 {id:'w5',name:'R-2R 梯子（第八章）',canvas:null}
];
function sceneCanvas(cfg){
  const sec=doc.getElementById(cfg.id);if(!sec)return null;
  if(cfg.canvas){const c=sec.querySelector(cfg.canvas);return c&&getComputedStyle(c).display!=='none'?c:null;}
  return [...sec.querySelectorAll('canvas')].find(c=>getComputedStyle(c).display!=='none'&&c.width>100)||null;
}
function statusFor(cfg){
  const sec=doc.getElementById(cfg.id);if(!sec)return null;
  let bar=sec.querySelector(':scope > .v241-3d-status');
  if(bar)return bar;
  bar=el('div',undefined,'v241-3d-status');
  bar.setAttribute('aria-live','polite');
  sec.append(bar);
  return bar;
}
function refreshScene(id){
  const cfg=SCENES.find(s=>s.id===id);if(!cfg)return;
  const bar=statusFor(cfg);if(!bar)return;
  const webgl=!!(root.__K3&&root.__K3.hasWebGL());
  const canvas=sceneCanvas(cfg);
  const reason=root.__K3&&root.__K3.reason?root.__K3.reason().replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim():'';
  const parts=[];
  parts.push(el('span','① 入口：已打开','v241-badge ok'));
  parts.push(el('span',webgl?'② WebGL：可用':'② WebGL：不可用',
    'v241-badge '+(webgl?'ok':'')));
  parts.push(el('span',canvas?'③ Three.js 画布：已创建 '+canvas.width+'×'+canvas.height:'③ Three.js 画布：未创建',
    'v241-badge '+(canvas?'info':'')));
  // 明确不把 canvas 存在等同于渲染成功，真实渲染由 Playwright 截图验收。
  parts.push(el('span','④ 真实渲染：需浏览器截图验收','v241-badge info'));
  parts.push(el('span','操作：拖拽旋转 / 滚轮缩放 / 触摸单指旋转、双指缩放','v241-hint'));
  parts.push(el('span','模型：场景为教学示意，尺寸与比例不代表真实器件封装。','v241-hint'));
  if(!webgl||!canvas)parts.push(el('span','降级说明：'+reason,'v241-hint'));
  bar.replaceChildren(...parts);
}

/* ---------- 单个 class 观察者统一驱动 3D 状态 ---------- */
let observer=null;
function init(){
  const main=doc.getElementById('main');if(!main)return;
  LABS.forEach(c=>stripFor(c));
  // 事件委托：只在 #main 上绑定一次，实验内部按钮无需逐个挂钩。
  main.addEventListener('click',onInteraction);
  main.addEventListener('input',onInteraction);
  observer=new MutationObserver(muts=>{
    for(const m of muts){
      const t=m.target;
      if(t.classList&&t.classList.contains('active')&&SCENES.some(s=>s.id===t.id)){
        refreshScene(t.id);
      }
    }
  });
  observer.observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
  // 活跃场景初始化一次状态条。
  const active=doc.querySelector('#main > section.mod.active');
  if(active&&SCENES.some(s=>s.id===active.id))refreshScene(active.id);
  function dispose(){
    if(raf)cancelAnimationFrame(raf);
    raf=0;
    timers.forEach(t=>clearTimeout(t));timers.clear();
    if(observer)observer.disconnect();
    main.removeEventListener('click',onInteraction);
    main.removeEventListener('input',onInteraction);
  }
  root.addEventListener('pagehide',dispose,{once:true});
  root.addEventListener('visibilitychange',()=>{
    if(doc.hidden&&raf){cancelAnimationFrame(raf);raf=0;}
  });
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
else init();

root.DigitalV241Labs=Object.freeze({LABS,SCENES,refreshLab,refreshScene,stripFor,statusFor});
})(typeof window!=='undefined'?window:globalThis);
