/* ==========================================================================
   V2.4.1 阅读体验与学习闭环（阶段 B3 + D）
   --------------------------------------------------------------------------
   B3：把 32 节讲义的既有面板整理为
       学习目标 → 理论精讲 → 公式推导 → 图形演示 → 互动实验 → 练习反馈 → 知识总结
       的可点击分区导航，并让公式/SVG 在窄屏下自适应。
   D ：新增「先预测实验结果」环节（记录预测 → 做实验 → 查看解析）、
       知识总结、按答题结果给出复习建议，并对涉及电气特性的章节
       明确标注「理想模型 vs 真实器件」。
   约束：不改任何已验证公式、讲义正文、题库答案或 localStorage 存档；
        全部使用事件委托 + 单个 MutationObserver，避免重复绑定。
   ========================================================================== */
(function(root){
'use strict';
const doc=document;
const UI=root.DigitalV241UI;
/* 复用 V2.4.1 公共 UI 组件，避免各模块重复实现 DOM 构造。 */
const el=UI?UI.el:(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const C=root.DigitalV18Lab;

/* 每章一个可直接用同页微型实验验证的预测题。
 * correct 为 options 下标；explain 只解释原理，不引入未经核对的器件参数。 */
const PREDICT={
 1:{q:'把 8 位开关的最高位（2⁷=128）从 0 点亮，显示值原为 13，会变成多少？',
    options:['141','13','128'],correct:0,
    explain:'该位权为 128，13 + 128 = 141（即 10001101₂）。位权相加必须等于十进制读数。'},
 2:{q:'AND 门下把输入 A 拨到 1、B 保持 0，输出 Y 会怎样？',
    options:['变为 1','仍为 0','不确定'],correct:1,
    explain:'与门只有两个输入全为 1 时输出才为 1；真值表 1·0=0。'},
 3:{q:'把理想 CMOS 反相器的输入从 0 切到 1，输出 Vout 会怎样？',
    options:['保持 1','变为 0','变为高阻'],correct:1,
    explain:'输入为 0 时 PMOS 上拉输出 1，输入为 1 时 NMOS 下拉输出 0，二者不会同时导通。'},
 4:{q:'半加器输入 A=1、B=1 时，和 S 与进位 C 分别是什么？',
    options:['S=1, C=0','S=0, C=1','S=1, C=1'],correct:1,
    explain:'1+1=2，二进制写作 10₂，故 S=0、C=1；只写 S 会丢失进位。'},
 5:{q:'把 D 触发器的 D 改成 1，但先不点时钟上升沿，Q 会怎样？',
    options:['立刻变为 1','保持原值 0','变为高阻'],correct:1,
    explain:'D 触发器只在有效时钟沿采样；只改 D 不改变 Q，这正是它与电平透明锁存器的区别。'},
 6:{q:'从 0 开始连续点击 6 次单步时钟，模 6 计数器的状态会？',
    options:['回到 0','停在 5','变成 6'],correct:0,
    explain:'模 6 只有 0～5 六个状态，第 6 次时钟沿后回绕到 0。'},
 7:{q:'把 555 实验中的电容 C 从 10 nF 增大到 100 nF，频率会？',
    options:['约变为原来的 1/10','保持不变','约变为 10 倍'],correct:0,
    explain:'理想模型中周期 T∝(R1+2R2)·C，故频率 f∝1/C；C 增大 10 倍，频率约降为 1/10，占空比不变。'},
 8:{q:'把理想 ADC 的位数从 8 位切到 10 位，量化步长会？',
    options:['变为原来的 1/4','变为原来的 1/2','不变'],correct:0,
    explain:'步长 Δ=Vref/2ⁿ，位数增加 2 位，码数变为 4 倍，步长变为 1/4。'}
};

/* 涉及电气特性的章节：明确区分课堂理想模型与真实器件限制。 */
const HARDWARE={
 3:'本章用理想开关模型讲解 CMOS：真实器件有阈值电压、噪声容限、传输延迟与输出驱动能力，具体数值须查芯片数据手册。',
 5:'课堂里的触发器在「有效沿瞬间」完成采样，是理想时序模型；真实器件有建立时间、保持时间、时钟偏斜与亚稳态风险。',
 6:'计数器按理想时钟逐拍跳转；真实电路还要考虑传播延迟、时钟频率上限与上电后的未使用状态归位。',
 7:'555 使用理想的 0.693·RC 充放电模型；真实电容误差、比较器阈值与输出级负载都会改变频率与占空比。',
 8:'ADC/DAC 采用理想均匀量化模型；真实器件还有积分/微分非线性、失调误差、采样保持与参考电压漂移。'
};

function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
function lessons(){const d=root.DigitalV18Lessons;return d&&Array.isArray(d.lessons)?d.lessons:[];}
function lessonById(id){return lessons().find(l=>l.id===id)||null;}
function pane(){return doc.querySelector('#v18-school .v18-main');}
function panels(){const p=pane();return p?[...p.children].filter(n=>n.classList&&n.classList.contains('v18-panel')):[];}
/* 签名只统计 V2.4.1 之外的原有面板，避免自己插入的面板触发无限重绘。 */
function originalPanels(){return panels().filter(p=>!p.classList.contains('v241-b3'));}
function headOf(p){const h=p.querySelector('h2');return h?h.textContent.trim():'';}

/* ---------- 七段学习路径导航 ---------- */
const STEPS=[
 ['① 学习目标',t=>t.includes('学习目标')],
 ['② 理论精讲',t=>t.includes('第一部分')],
 ['③ 公式推导',t=>t.includes('第二部分')],
 ['④ 图形演示',t=>t.includes('图形演示')],
 ['⑤ 互动实验',t=>t.includes('动手实验')&&t.includes('改一个参数')],
 ['⑥ 练习反馈',t=>t.includes('理解检测')],
 ['⑦ 知识总结',t=>t.includes('知识总结')]
];
function buildStepNav(){
  const p=pane();if(!p)return;
  const list=panels();
  const old=p.querySelector(':scope > .v241-steps');if(old)old.remove();
  const nav=el('nav');
  nav.className='v241-steps';
  nav.setAttribute('aria-label','本节学习路径');
  STEPS.forEach(([label,match])=>{
    const target=list.find(x=>match(headOf(x)));
    const b=el('button');
    b.type='button';b.className='v241-step'+(target?'':' v241-step-off');
    b.textContent=label;
    b.disabled=!target;
    if(target)b.addEventListener('click',()=>target.scrollIntoView({behavior:'smooth',block:'start'}));
    nav.append(b);
  });
  p.insertBefore(nav,p.firstChild);
}

/* ---------- 先预测实验结果 ---------- */
function predictionPanel(l){
  const data=PREDICT[l.chapter];if(!data)return null;
  const sec=el('section');
  sec.className='v18-panel v241-b3 v241-predict';
  const h=el('h2');h.textContent='先预测 · 再做实验';sec.append(h);
  const intro=el('p');intro.className='v18-help';
  intro.textContent='第 '+l.chapter+' 章 · '+l.title+'。先在心里给出答案，然后到下方动手实验改参数验证。';
  sec.append(intro);
  const q=el('p');q.className='v241-predict-q';q.textContent=data.q;sec.append(q);
  const form=el('fieldset');form.className='v241-predict-form';
  const legend=el('legend');legend.textContent='你的预测';form.append(legend);
  let picked=null;
  data.options.forEach((text,i)=>{
    const label=el('label');label.className='v18-choice';
    const radio=el('input');radio.type='radio';radio.name='v241-predict-'+l.id;radio.value=String(i);
    radio.addEventListener('change',()=>{picked=i;});
    const span=el('span');span.textContent=String.fromCharCode(65+i)+'. '+text;
    label.append(radio,span);form.append(label);
  });
  const actions=el('div');actions.className='v18-actions';
  const feedback=el('p');feedback.className='v241-predict-feedback';feedback.setAttribute('aria-live','polite');
  const record=el('button');record.type='button';record.className='v241-btn';record.textContent='记录预测';
  const reveal=el('button');reveal.type='button';reveal.className='v241-btn soft';reveal.textContent='查看解析';
  record.addEventListener('click',()=>{
    if(picked===null){feedback.textContent='请先选择一个预测。';return;}
    feedback.textContent='已记录：'+data.options[picked]+'。现在请到下方「动手实验」改参数验证，再回来看解析。';
  });
  reveal.addEventListener('click',()=>{
    const right=picked===data.correct;
    feedback.textContent=(right?'✓ 预测正确。':'✗ 预测与实际输出不同。')+
      '正确答案：'+data.options[data.correct]+'。'+data.explain;
    feedback.classList.toggle('v18-wrong',!right);
  });
  actions.append(record,reveal);form.append(actions,feedback);sec.append(form);
  const note=el('p');note.className='v18-help';
  note.textContent='预测不参与判分，也不会写入学习记录；它的作用是让实验结果变成一次可验证的预期。';
  sec.append(note);
  return sec;
}

/* ---------- 知识总结与复习建议 ---------- */
function summaryPanel(l){
  const sec=el('section');
  sec.className='v18-panel v241-b3 v241-summary';
  const h=el('h2');h.textContent='知识总结 · 带走这一节';sec.append(h);
  const core=el('p');core.className='v18-paragraph';
  core.textContent='核心关系：'+l.formula;sec.append(core);
  const pit=el('p');pit.className='v18-paragraph';
  pit.textContent='最容易错的地方：'+l.pitfall;sec.append(pit);
  const hw=HARDWARE[l.chapter];
  if(hw){
    const note=el('p');note.className='v241-note';
    note.textContent='模型边界：'+hw+' 具体电气参数与时序指标须查芯片数据手册。';sec.append(note);
  }
  const all=lessons(),idx=all.findIndex(x=>x.id===l.id),next=all[idx+1];
  const review=el('p');review.className='v241-review';review.id='v241-review';
  review.setAttribute('aria-live','polite');
  const s=read('digital-course-v1.8-study')||{};
  const attempts=s.attempts&&typeof s.attempts==='object'?Number(s.attempts[l.id]||0):0;
  review.textContent=attempts>0
    ? '复习建议：本节曾答错 '+attempts+' 次，建议重做一次上方微型实验，再回到「理解检测」重新作答。'
    : (next?'复习建议：完成后进入下一节「'+next.title+'」，把本节结论用在新情境里。'
           :'复习建议：这是最后一节，建议进入章节测试做一次综合检索。');
  sec.append(review);
  if(next){
    const b=el('button');b.type='button';b.className='v241-btn soft';b.textContent='进入下一节 →';
    b.addEventListener('click',()=>UI&&UI.openLesson(next.id));
    const row=el('div');row.className='v18-actions';row.append(b);sec.append(row);
  }
  return sec;
}

/* ---------- 答题后的复习建议（事件委托，只绑定一次） ---------- */
function refreshReview(l){
  const box=doc.getElementById('v241-review');if(!box)return;
  const fb=doc.querySelector('#v18-school .v18-feedback');
  const text=fb?fb.textContent.trim():'';
  if(!text)return;
  if(text.includes('还需要复习')){
    const all=lessons(),idx=all.findIndex(x=>x.id===l.id),prev=all[idx-1];
    box.textContent='复习建议：本题答错了。'+(prev?'先回看「'+prev.title+'」的'+'核心关系，':'先重读本节公式与三步推导，')+
      '再重做一次上方微型实验，最后重新作答。'+text.replace(/^✗\s*还需要复习。?/,'');
  }else if(text.includes('回答正确')){
    box.textContent='复习建议：回答正确。建议把结论用自己的话复述一遍，再改一个实验参数验证它仍然成立。';
  }
}

/* ---------- 安装：单个观察者按讲义内容变化重绘 ---------- */
let signature='';
let boundSchool=null;
function currentLessonId(){
  // V1.8 的 choose() 会把 state.last 写入 localStorage；优先读它，避免猜测 DOM。
  const s=read('digital-course-v1.8-study')||{};
  const id=typeof s.last==='string'?s.last:'';
  return lessonById(id)?id:(lessons()[0]||{}).id||'';
}
function enhance(){
  const p=pane();if(!p)return;
  const list=panels();
  const sig=originalPanels().map(headOf).join('|');
  if(sig===signature&&p.querySelector(':scope > .v241-steps'))return;
  signature=sig;
  const l=lessonById(currentLessonId());if(!l)return;
  // 换课时先清理上一节注入的面板，再重新注入，保证只有一份。
  p.querySelectorAll(':scope > .v241-b3').forEach(n=>n.remove());
  const diagram=list.find(x=>headOf(x).includes('图形演示'));
  const predict=predictionPanel(l);
  if(predict){
    if(diagram)p.insertBefore(predict,diagram);
    else p.insertBefore(predict,p.firstChild);
  }
  const summary=summaryPanel(l);
  if(summary)p.append(summary);
  buildStepNav();
}
let raf=0;
function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;enhance();});
}
function init(){
  const school=doc.getElementById('v18-school');
  const p=pane();
  if(!school||!p)return;
  // 一个委托监听器负责全部讲义的答题反馈，不随换课重复绑定。
  if(boundSchool!==school){
    boundSchool=school;
    school.addEventListener('click',e=>{
      const btn=e.target.closest&&e.target.closest('.v18-quiz button');
      if(btn&&btn.textContent.includes('提交答案')){
        setTimeout(()=>refreshReview(lessonById(currentLessonId())||{}),40);
      }
    });
  }
  new MutationObserver(schedule).observe(p,{childList:true});
  enhance();
  root.addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);raf=0;},{once:true});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
else init();

root.DigitalV241Learning=Object.freeze({PREDICT,HARDWARE,enhance,buildStepNav,
  predictionPanel,summaryPanel,currentLessonId});
})(typeof window!=='undefined'?window:globalThis);
