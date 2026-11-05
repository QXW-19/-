/* V2.4 学习闭环增强层（原创教学解释，不引用教材原文、页码或插图）。
 *
 * 目标：在原有 32 节讲义的「生活类比 → 原理 → 公式 → 推导 → 动手实验 → 练习」
 * 基础上补齐「图形演示 → 结果分析 → 错因解析」，形成完整学习闭环。
 *
 * 一致性保证：所有 SVG 图形中的数字都由 window.DigitalV18Lab（V1.8 微型实验
 * 的同一计算内核）实时算出，与课堂下方动手实验、随堂练习答案使用同一套函数；
 * 不改写任何已有公式、题库答案、章节结构或 localStorage 存档。
 *
 * 本脚本只注册一个全局对象，实际注入由 assets/v1.8.js 在 renderLesson 末尾调用。
 */
(function(root){
'use strict';

// 注意：本脚本在 HTML 解析期同步执行，而 v1.8-core.js 是 defer 脚本，
// 此刻 window.DigitalV18Lab 尚不存在。因此内核在真正渲染图形时才解析。
let C=root.DigitalV18Lab||(typeof module==='object'&&module.exports?require('./v1.8-core.js'):null);
function resolveCore(){C=C||root.DigitalV18Lab||null;return C;}

/* 每章的图形演示：返回 {svg, caption}。全部数值来自 C，避免图文两张皮。 */
const DIAGRAMS={
 1(){
  const r=C.binary(13);
  let cells='';
  r.bits.forEach((bit,i)=>{
   const x=18+i*74, w=64, on=bit===1;
   cells+='<rect x="'+x+'" y="46" width="'+w+'" height="52" rx="7" fill="'+(on?'#0f766e':'#e2e8f0')+'" stroke="#94a3b8"/>';
   cells+='<text x="'+(x+w/2)+'" y="79" text-anchor="middle" font-size="18" font-weight="700" fill="'+(on?'#ffffff':'#475569')+'">'+bit+'</text>';
   cells+='<text x="'+(x+w/2)+'" y="116" text-anchor="middle" font-size="13" fill="#334155">2⁷⁻'+i+'='+r.weights[i]+'</text>';
   cells+='<text x="'+(x+w/2)+'" y="34" text-anchor="middle" font-size="12" fill="#64748b">位 '+(i+1)+'</text>';
  });
  const picked=r.bits.map((b,i)=>b?r.weights[i]:null).filter(v=>v!==null);
  return {
   svg:'<svg viewBox="0 0 620 140" role="img" aria-label="8 位二进制位权示意图">'+cells+
       '<text x="18" y="134" font-size="13" fill="#0f172a">高亮位权相加：'+picked.join(' + ')+' = '+r.decimal+'₁₀（十六进制 0x'+r.hex+'）</text></svg>',
   caption:'同一个位串代表什么，取决于事先约定的编码规则；位权只是其中一种约定。'
  };
 },
 2(){
  let rows='';
  const types=['AND','OR','XOR'];
  const header='<text x="18" y="26" font-size="13" font-weight="700" fill="#0f172a">A B │ AND OR XOR</text>';
  for(const [a,b] of [[0,0],[0,1],[1,0],[1,1]]){
   const y=52+((a*2+b)*26);
   const outs=types.map(t=>C.gate(t,a,b).output);
   rows+='<text x="18" y="'+y+'" font-size="14" font-family="monospace" fill="#334155">'+a+' '+b+' │  '+outs.join('   ')+'</text>';
  }
  return {
   svg:'<svg viewBox="0 0 620 160" role="img" aria-label="与或非异或真值表">'+header+rows+
       '<text x="18" y="152" font-size="12" fill="#64748b">表内每个输出均由实验内核的 gate() 计算，与下方动手实验一致。</text></svg>',
   caption:'真值表要按二进制顺序穷举 2ⁿ 行；漏一行，化简结果就可能错。'
  };
 },
 3(){
  const hi=C.cmos(0),lo=C.cmos(1);
  return {
   svg:'<svg viewBox="0 0 620 170" role="img" aria-label="理想 CMOS 反相器传输特性">'+
    '<line x1="60" y1="140" x2="330" y2="140" stroke="#94a3b8"/><line x1="60" y1="140" x2="60" y2="20" stroke="#94a3b8"/>'+
    '<text x="18" y="30" font-size="12" fill="#475569">Vout</text><text x="336" y="145" font-size="12" fill="#475569">Vin</text>'+
    '<path d="M60 28 H190 V140 H330" fill="none" stroke="#0f766e" stroke-width="3"/>'+
    '<text x="82" y="50" font-size="13" fill="#b45309">Vin=0 → '+hi.conducting+'，Vout='+hi.output+'</text>'+
    '<text x="208" y="126" font-size="13" fill="#b45309">Vin=1 → '+lo.conducting+'，Vout='+lo.output+'</text>'+
    '<text x="60" y="162" font-size="12" fill="#64748b">理想模型用竖直跳变代替真实过渡区；实际阈值与噪声容限须查数据手册。</text></svg>',
   caption:'理想反相器任一时刻只有一侧网络导通，因此静态电流接近零。'
  };
 },
 4(){
  let rows='';
  for(const [a,b] of [[0,0],[0,1],[1,0],[1,1]]){
   const r=C.adder(a,b);
   rows+='<text x="20" y="'+(50+(a*2+b)*26)+'" font-size="14" font-family="monospace" fill="#334155">'+a+' + '+b+' = '+r.carry+' '+r.sum+'₂　（S='+r.sum+'，C='+r.carry+'）</text>';
  }
  return {
   svg:'<svg viewBox="0 0 620 160" role="img" aria-label="半加器四种输入的结果">'+
    '<text x="20" y="26" font-size="13" font-weight="700" fill="#0f172a">半加器：和 S=A⊕B，进位 C=A·B</text>'+rows+
    '<text x="20" y="152" font-size="12" fill="#64748b">四种输入均满足 A+B = S + 2C，可用作实验自检。</text></svg>',
   caption:'「和」与「进位」是两条独立输出，只写其中一个就等于没算完。'
  };
 },
 5(){
  let s=C.newDff();const points=[];
  // 用同一内核模拟：D 在第二个时钟沿前变 1，Q 只在上升沿更新。
  const timeline=[{d:0,edge:true},{d:1,edge:true},{d:1,edge:true}];
  let q=0;
  timeline.forEach((t,i)=>{s=C.setDff(s,t.d);if(t.edge){s=C.clockDff(s);q=s.Q;}points.push({d:t.d,q,edge:t.edge,i});});
  let lines='';
  points.forEach((p,i)=>{
   const x0=70+i*160,x1=x0+150;
   lines+='<line x1="'+x0+'" y1="'+(p.d?'40':'70')+'" x2="'+x1+'" y2="'+(p.d?'40':'70')+'" stroke="#0f766e" stroke-width="3"/>';
   lines+='<line x1="'+x0+'" y1="'+(p.q?'110':'140')+'" x2="'+x1+'" y2="'+(p.q?'110':'140')+'" stroke="#b45309" stroke-width="3"/>';
   lines+='<line x1="'+x0+'" y1="76" x2="'+x1+'" y2="76" stroke="#94a3b8" stroke-dasharray="3 3"/>';
   lines+='<line x1="'+x0+'" y1="150" x2="'+x0+'" y2="86" stroke="#475569"/>';
   lines+='<text x="'+(x0+4)+'" y="168" font-size="11" fill="#64748b">↑沿 '+(i+1)+'</text>';
  });
  return {
   svg:'<svg viewBox="0 0 620 180" role="img" aria-label="D 触发器时钟沿时序图">'+
    '<text x="8" y="44" font-size="12" fill="#0f766e">D</text><text x="8" y="80" font-size="12" fill="#475569">CLK</text>'+
    '<text x="8" y="114" font-size="12" fill="#b45309">Q</text>'+lines+
    '<text x="70" y="20" font-size="12" fill="#64748b">D 改变不会立刻改变 Q；只有上升沿才采样（共 '+s.edges+' 次）</text></svg>',
   caption:'锁存器「电平期间透明」，触发器「只在边沿采样」，这是两类记忆元件的分界。'
  };
 },
 6(){
  const mod=6;let circles='';
  for(let i=0;i<mod;i++){
   const ang=-Math.PI/2+i*2*Math.PI/mod, cx=310+180*Math.cos(ang), cy=95+62*Math.sin(ang);
   const r=C.counter(i,mod);
   circles+='<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="20" fill="#e2e8f0" stroke="#0f766e" stroke-width="2"/>';
   circles+='<text x="'+cx.toFixed(1)+'" y="'+(cy+5).toFixed(1)+'" text-anchor="middle" font-size="14" font-weight="700" fill="#0f172a">'+r.value+'</text>';
   circles+='<text x="'+cx.toFixed(1)+'" y="'+(cy+36).toFixed(1)+'" text-anchor="middle" font-size="11" fill="#64748b">'+r.binary+'</text>';
  }
  return {
   svg:'<svg viewBox="0 0 620 180" role="img" aria-label="模 6 计数器状态循环">'+
    '<circle cx="310" cy="95" r="180" fill="none" stroke="#cbd5e1" stroke-dasharray="5 5" opacity="0"/>'+circles+
    '<text x="310" y="95" text-anchor="middle" font-size="13" fill="#0f766e">按顺时针 0→1→2→3→4→5→0</text>'+
    '<text x="18" y="172" font-size="12" fill="#64748b">状态用 '+C.counter(0,mod).bits+' 位表示；模 6 共用 6 个状态，另有 2 个未使用状态。</text></svg>',
   caption:'未使用状态必须有明确归位路径，否则上电后可能卡在无效循环里。'
  };
 },
 7(){
  const t=C.timer555(10,10,10);
  const ratio=t.tHigh/t.period;
  const x1=60,x2=60+500*ratio,x3=560;
  return {
   svg:'<svg viewBox="0 0 620 170" role="img" aria-label="555 电容充放电与输出方波">'+
    '<line x1="60" y1="40" x2="560" y2="40" stroke="#cbd5e1"/><line x1="60" y1="100" x2="560" y2="100" stroke="#cbd5e1"/>'+
    '<path d="M'+x1+' 100 Q '+(x1+(x2-x1)/2)+' 46 '+x2+' 40 L'+x3+' 100" fill="none" stroke="#0f766e" stroke-width="3"/>'+
    '<path d="M'+x1+' 140 H'+x2+' V118 H'+x3+' V140" fill="none" stroke="#b45309" stroke-width="3"/>'+
    '<text x="18" y="44" font-size="12" fill="#475569">电容</text><text x="18" y="136" font-size="12" fill="#475569">输出</text>'+
    '<text x="60" y="162" font-size="12" fill="#64748b">R1=R2=10 kΩ，C=10 nF → tH='+(t.tHigh*1e6).toFixed(2)+' μs，tL='+(t.tLow*1e6).toFixed(2)+' μs，f='+t.frequency.toFixed(0)+' Hz，占空比 '+t.duty.toFixed(1)+'%</text></svg>',
   caption:'电容在 1/3 VCC 与 2/3 VCC 之间往返；R1 同时参与充电与放电路径，所以占空比大于 50%。'
  };
 },
 8(){
  const vref=3.3,bits=8,step=C.adc(bits,vref,0).step;
  let stairs='';
  const zoom=8; // 放大显示最低 8 个量化码，便于看清台阶
  for(let k=0;k<zoom;k++){
   const x=60+k*60,y=130-k*13;
   stairs+='<path d="M'+x+' '+(y-13)+' H'+(x+60)+' V'+y+'" fill="none" stroke="#0f766e" stroke-width="2.5"/>';
   stairs+='<text x="'+(x+30)+'" y="'+(y-18)+'" text-anchor="middle" font-size="11" fill="#334155">码 '+k+'</text>';
  }
  const sample=C.adc(bits,vref,step*3.4);
  return {
   svg:'<svg viewBox="0 0 620 165" role="img" aria-label="ADC 量化台阶示意图">'+
    '<line x1="60" y1="140" x2="560" y2="140" stroke="#94a3b8"/><line x1="60" y1="140" x2="60" y2="20" stroke="#94a3b8"/>'+stairs+
    '<circle cx="'+(60+3.4*60)+'" cy="130" r="5" fill="#b45309"/>'+
    '<text x="18" y="30" font-size="12" fill="#475569">码值</text><text x="510" y="156" font-size="12" fill="#475569">Vin</text>'+
    '<text x="60" y="160" font-size="12" fill="#64748b">'+bits+' 位 / Vref='+vref+' V → 步长 '+(step*1000).toFixed(2)+' mV；Vin='+(step*3.4).toFixed(4)+' V 落在码 '+sample.code+'，误差 '+(sample.error*1000).toFixed(2)+' mV（放大显示前 '+zoom+' 个码）</text></svg>',
   caption:'相邻两个码之间的一切电压都只能给出同一个码，这段差值就是量化误差的来源。'
  };
 }
};

/* 每节的动手建议、结果分析要点与错因解析（原创，不含教材原文或页码）。 */
const NOTES={
 'l1-1':{lab:'把 8 个位开关逐个切换，观察位权相加如何变化。',analysis:'数一数亮起的位数与 2ⁿ 的关系：每多一位，可区分的位串数翻倍，而不是增加 2 种。',errors:['把「8 bit 有 256 种」误写成「8×2=16 种」——组合数是 2ⁿ。','认为逻辑 1 在所有芯片里都是同一个固定电压——它其实是一个约定的电压范围。']},
 'l1-2':{lab:'点击位开关凑出 11、13、255，比较十进制和显示结果。',analysis:'检查每一位只贡献 0 或自己的位权；把显示中所有加数相加，必须等于右侧十进制数。',errors:['把 1011 读成「一千零一十一」——下标 2 表示二进制。','从右往左写位权时漏掉 2⁰=1，导致结果整体差 1。']},
 'l1-3':{lab:'用实验凑出 0xAF、0x10，再核对十六进制显示。',analysis:'把 8 位串按 4 位一组切开，每组的十进制值正好对应一位十六进制数字。',errors:['分组方向搞反——必须从右向左每四位一组，左侧不足才补 0。','把 A～F 当作字母而不是 10～15 的数值。']},
 'l1-4':{lab:'先用位开关摆出 11111101，再分别按「无符号」「补码」「BCD」解释它。',analysis:'同一个位串在不同约定下含义不同：补码最高位带负权，BCD 每四位只表示一个十进制数字。',errors:['把补码的符号位也当作普通正权相加。','认为 BCD 的 1010～1111 也是合法十进制位——它们是伪码。']},
 'l2-1':{lab:'依次切换 AND / OR / XOR，并把 A、B 拨到四种组合。',analysis:'对比三列输出：只有输入全 1 时 AND 为 1；只要有一个 1，OR 就为 1；XOR 在两输入不同时为 1。',errors:['把 XOR 记成「有 1 就为 1」，那是 OR。','NOT 门只有一个有效输入，别硬套两个输入去读表。']},
 'l2-2':{lab:'按 00、01、10、11 的顺序把真值表填满，再与实验输出逐行核对。',analysis:'2 个输入必须恰好 4 行；行数不足说明有输入组合被漏掉。',errors:['按十进制 0、1、2 的顺序写，漏掉高位为 1 的两行。','把输出列写成输入列的复制，没有代入门的定义。']},
 'l2-3':{lab:'把「先与后非」和「先取非再或」分别列出真值表，比较两列。',analysis:'两列逐行相同即可验证 (AB)′=A′+B′；只验证一行不足以证明恒等。',errors:['只对表达式的一部分取反，忘记把运算符也换掉。','把「非」分配到每一项时漏改变量个数。']},
 'l2-4':{lab:'在卡诺图里圈出相邻为 1 的格子，观察化简后项数如何变少。',analysis:'每扩大一圈，消掉一个在这组内发生变化的变量；圈的格子数必须是 2 的幂。',errors:['认为上下、左右边界不相邻——卡诺图是环状相邻。','圈了 3 个或 6 个格子，得到的不是合法的蕴含项。']},
 'l3-1':{lab:'对照符号图与真值表，找出输出端小圆圈代表的含义。',analysis:'小圆圈表示取反；符号、真值表、逻辑表达式三者描述的是同一个器件。',errors:['只看符号形状，忽略小圆圈导致整体取反被漏掉。','把逻辑符号当成引脚图，误以为能直接接线。']},
 'l3-2':{lab:'切换 CMOS 反相器输入，观察哪一侧网络导通。',analysis:'Vin=0 时上拉导通输出 1，Vin=1 时下拉导通输出 0；两侧不会同时导通。',errors:['把 PMOS 与 NMOS 的导通条件记反。','把理想模型当成真实电压传输曲线去读具体阈值。']},
 'l3-3':{lab:'逐渐改变输入电压，思考在阈值附近输出会怎样。',analysis:'噪声容限描述的是「还能被正确识别的余量」，不是逻辑电平本身；理想模型不给出具体电压值。',errors:['把噪声容限当作输出高电平的数值。','忽略过渡区，认为任何中间电压都会被稳定判成 0 或 1。']},
 'l3-4':{lab:'在总线实验里依次让 0 路、1 路、2 路设备使能。',analysis:'0 路驱动时总线高阻；1 路驱动时读到一个确定值；2 路同时驱动且电平相反即冲突。',errors:['把高阻 Z 当成逻辑 0——它其实是「不驱动」。','认为多个设备同时驱动总线会自动排队，实际会造成电源短路风险。']},
 'l4-1':{lab:'把一句需求改写成输入/输出表，再写出表达式。',analysis:'设计流程的每一步都能回溯到真值表；若表达式与表不符，问题一定出在转写环节。',errors:['跳过真值表直接凭直觉写表达式。','没有列出所有输入组合，导致设计只在部分情况下正确。']},
 'l4-2':{lab:'把 A、B 拨到 1、1，观察 S=0 而 C=1。',analysis:'1+1=2，必须用两位的「10」表示；只写 S 会丢失进位，全加器正是为接收低位进位而存在。',errors:['把进位输出当作错误标志。','全加器忘记把低位进位 Cᵢ 加进求和式。']},
 'l4-3':{lab:'改变地址输入，观察只有一条输出线被选中。',analysis:'n 位地址最多选中 2ⁿ 条输出中的一条；带使能端时还要先确认使能有效。',errors:['忽略使能端，导致「地址对但输出全无效」。','把低电平有效的输出当成高电平有效来读。']},
 'l4-4':{lab:'固定四路数据，改变选择端，观察输出跟随哪一路。',analysis:'数据选择器像多路开关：选择端决定「接通哪一路」，而不是参与数据运算。',errors:['把选择端当作数据输入一起相加。','认为未被选中的输入仍会影响输出。']},
 'l5-1':{lab:'对比组合逻辑实验：同样的输入，输出是否还依赖过去？',analysis:'组合电路只由当前输入决定；要记住「刚才发生过什么」，必须引入反馈与存储状态。',errors:['用纯组合电路实现「记住上次按过按钮」。','把输出延迟误认为记忆功能。']},
 'l5-2':{lab:'先改 D 不点时钟，再点一次上升沿，观察 Q 何时变化。',analysis:'Q 只在有效沿更新；改 D 之后 Q 保持不变，正是「按快门」的含义。',errors:['认为 D 一变 Q 立刻变——那描述的是锁存器或组合逻辑。','把下降沿与上升沿混用而不统一时序约定。']},
 'l5-3':{lab:'用 T 触发器的翻转功能，推导连续四个时钟后的状态。',analysis:'T=1 时每次有效沿翻转，因此输出频率是时钟的一半；JK 在 J=K=1 时同样翻转。',errors:['把 JK 的 J=K=1 误记为「保持」。','忽略有效沿次数，直接按时间长度估算翻转次数。']},
 'l5-4':{lab:'思考输入在时钟沿附近改变会发生什么。',analysis:'建立时间与保持时间规定了输入必须稳定的窗口；违反窗口可能进入亚稳态，输出无法在约定时间内确定。',errors:['认为触发器在任何时刻都能可靠采样。','把亚稳态当作稳定的中间电平 0.5，而不是不确定的过渡过程。']},
 'l6-1':{lab:'画出一个简单状态机，标出「现态 → 输入 → 次态 → 输出」。',analysis:'时序电路的输出同时取决于当前输入与现态；只列输入不列状态，描述一定不完整。',errors:['把状态表写成只有输入列的表。','忘记为所有状态都定义次态，留下悬空分支。']},
 'l6-2':{lab:'连续点击单步时钟，观察 000→111 后回到 000。',analysis:'三位计数器共有 2³=8 个状态，最高位的变化频率是最低位的一半。',errors:['数错状态数，以为三位能数到 8（最大码是 7）。','把状态二进制码直接当成十进制读数。']},
 'l6-3':{lab:'把模 6 计数器的 6、7 两个状态标出来，检查是否有归位路径。',analysis:'未使用状态若没有明确次态，上电后可能进入死循环；可靠设计必须为它们安排回到有效环的路径。',errors:['认为未使用状态永远不会出现。','把模 N 与「需要 log₂N 位」混为一谈，位数要向上取整。']},
 'l6-4':{lab:'用状态表走一遍交通灯的完整周期。',analysis:'把每个状态停留的时钟拍数累加，必须回到起始状态；否则周期不完整。',errors:['只检查灯色顺序，忽略每个状态的持续时间。','漏掉「全部红灯」等过渡状态导致相位重叠。']},
 'l7-1':{lab:'观察方波的高低电平与周期，指出信息藏在哪个维度。',analysis:'数字信号用「时间轴上的电平变化」携带信息，同一根线在不同时刻可以表示不同位。',errors:['把方波当成模拟量去读中间电压值。','忽略时间轴，只看某一瞬间的电平就下结论。']},
 'l7-2':{lab:'改变 R1、R2，比较占空比读数。',analysis:'占空比 = 高电平时间 ÷ 周期；R1 变大时高电平时间增长得比低电平更快，占空比上升。',errors:['把占空比写成分母为低电平时间的比值。','把占空比与频率混为一谈，二者可独立变化。']},
 'l7-3':{lab:'分别调整 R1、R2、C，记录频率与占空比的变化方向。',analysis:'周期与 (R1+2R2)·C 成正比，频率与它成反比；C 增大时周期变长但占空比不变。',errors:['把 0.693 系数漏掉或直接写成 1，导致理论值与实验值对不上。','认为改变 C 会改变占空比——理想模型中它只改变时间尺度。']},
 'l7-4':{lab:'给抖动输入加一个带滞回的比较器，观察输出边沿数量。',analysis:'两个不同阈值把小幅噪声挡在门外，输出翻转次数减少，波形被整形。',errors:['把滞回当成单个阈值使用。','认为整形会改变信号携带的时序信息。']},
 'l8-1':{lab:'慢慢拖动输入电压，找出输出码发生跳变的位置。',analysis:'输入连续变化而输出只有有限个码，二者之间的差就是量化误差；位数越少，台阶越粗。',errors:['把量化误差当成测量仪器故障。','认为数字量能无失真地表示任意模拟电压。']},
 'l8-2':{lab:'在 8、10、12 位之间切换，记录步长与最大码值。',analysis:'位数每增加 1，步长减半、码数翻倍；最大码是 2ⁿ−1，不是 2ⁿ。',errors:['把码数 2ⁿ 当作最大码值。','把步长写成 Vref/(2ⁿ−1) 与实验读数对比时产生系统性偏差。']},
 'l8-3':{lab:'设想用过低频率采样一个快速正弦波，画出看到的点。',analysis:'采样太慢会把高频信号误认成低频，这就是混叠；提高采样率或先滤波才能避免。',errors:['认为只要采到了点就能还原波形。','把量化误差与采样混叠混为一谈，前者是幅度误差、后者是时间误差。']},
 'l8-4':{lab:'从数字码出发，逐位推算 R-2R 网络的输出电压。',analysis:'每一位对输出的贡献按位权递减，最高位权重最大；输出与码值应成正比。',errors:['把最低位当成最高权位，输出变化趋势整个反过来。','忽略参考电压，只凭码值就说输出电压的绝对值。']}
};

const el=(tag,text,cls)=>{
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
};

function diagramPanel(l){
 const sec=el('section',undefined,'v18-panel v24-loop-panel');
 sec.append(el('h2','图形演示 · 把公式画出来'));
 const maker=DIAGRAMS[l.chapter];
 if(!resolveCore()||!maker)return sec;
 const d=maker(l);
 const box=el('div',undefined,'v24-diagram');
 box.innerHTML=d.svg;               // SVG 由本文件生成，不含外部输入
 box.setAttribute('role','img');
 sec.append(box,el('p',d.caption,'v18-help'));
 return sec;
}

function analysisPanel(l){
 const note=NOTES[l.id]||{lab:'',analysis:'',errors:[]};
 const sec=el('section',undefined,'v18-panel v24-loop-panel');
 sec.append(el('h2','动手实验 · 结果分析 · 错因解析'));
 sec.append(el('p','动手建议：'+note.lab,'v18-paragraph'));
 sec.append(el('p','结果分析：'+note.analysis,'v18-paragraph'));

 // 读取同页微型实验的实时输出，保证「讲解」与「交互结果」用的是同一组数值。
 const check=el('button','读取当前实验数值并核对','v18-btn');
 check.type='button';
 const readout=el('p',undefined,'v24-readout');
 readout.setAttribute('aria-live','polite');
 check.addEventListener('click',()=>{
  const host=sec.parentElement;
  const result=host?host.querySelector('.v18-lab-result'):null;
  const text=result?result.textContent.trim():'';
  readout.textContent=text
    ? '当前实验输出：'+text+'　｜　对照要点：'+note.analysis
    : '还没有读到实验输出，请先在上方「动手实验」区操作一次。';
 });
 const actions=el('div',undefined,'v18-actions');
 actions.append(check);
 sec.append(actions,readout);

 const list=el('ul',undefined,'v24-errors');
 note.errors.forEach(text=>list.append(el('li',text)));
 sec.append(el('h3','常见错因解析'),list);
 sec.append(el('p','以上解释为本平台原创教学说明，用于辅助理解，不对应教材原文、页码或插图；器件参数请以数据手册为准。','v18-help'));
 return sec;
}

function render(main,lesson){
 if(!main||!lesson||!document)return;
 // 图形演示插到动手实验之前，结果分析插到随堂练习之前，形成完整闭环。
 const panels=[...main.children].filter(n=>n.classList&&n.classList.contains('v18-panel'));
 const headingOf=p=>(p.querySelector('h2')||{}).textContent||'';
 const lab=panels.find(p=>headingOf(p).includes('动手实验'));
 const quiz=panels.find(p=>headingOf(p).includes('理解检测'));
 const diagram=diagramPanel(lesson),analysis=analysisPanel(lesson);
 if(lab)main.insertBefore(diagram,lab);else main.append(diagram);
 if(quiz)main.insertBefore(analysis,quiz);else main.append(analysis);
}

root.DigitalV24LearningLoop=Object.freeze({render,DIAGRAMS,NOTES,diagramPanel,analysisPanel});
})(typeof window!=='undefined'?window:globalThis);
