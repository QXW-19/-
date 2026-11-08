/* ==========================================================================
   V2.5.2 案例联动能力表（阶段 C）
   --------------------------------------------------------------------------
   为 19 个案例补齐八项实训信息：
   操作目标 / 前置知识 / 逻辑与计算 / 预期输入输出 / 交互入口 /
   实际仿真结果 / 故障排查（沿用原数据） / 设计改进思考。
   能力等级：
   circuit  已支持完整电路仿真（V1.6 门级或 V2.5 实验室案例）
   module   已支持原有章节互动
   numeric  仅数值计算或图形演示（明确边界）
   needs    需要扩展仿真元件（当前不做假动画）
   ========================================================================== */
(function(root){
'use strict';
const S={
 'case-1-1':{
  cap:'numeric',capNote:'七段译码用同源段码表驱动 SVG 数码管，属于交互式数值/图形演示；实验室没有七段数码管元件，因此不做门级接线。',
  objective:'把 4 位 BCD 码翻译成 0~9 的七段段码，并确认非法码的处理边界。',
  prereq:['l1-1','l1-3'],
  expected:[{input:'0000',expect:'显示 0，段码 1111110'},{input:'0101',expect:'显示 5，段码 1011011'},{input:'1010',expect:'无关项，提示不保证输出'}],
  improve:['把 0~F 的段码补齐，改造成十六进制显示','加入非法码判别项，使 1010~1111 明确熄灭'],
  entry:{type:'widget',id:'sevenseg',label:'在案例内操作七段小实验'}
 },
 'case-1-2':{
  cap:'circuit',capNote:'4 开关 + 3 异或 + 4 LED 可完整载入 V1.6 引擎，逐位观察格雷码输出。',
  objective:'用 3 个异或门实现二进制到格雷码的并行转换，并验证相邻码只变一位。',
  prereq:['l1-3','l2-1'],
  expected:[{input:'B=0000',expect:'G=0000'},{input:'B=1000',expect:'G=1100'},{input:'B=0111',expect:'G=0100'}],
  improve:['增加格雷码→二进制的反变换电路，比较门数','用 8 位码盘验证首尾相邻特性'],
  entry:{type:'circuit',id:'gray4',label:'⚡ 载入格雷码转换器'}
 },
 'case-1-3':{
  cap:'module',capNote:'补码加减由第一章精讲的补码互动演示位串运算；4 位全加器电路属于第四章案例 4-1。',
  objective:'用补码把减法变成加法，并判断结果是否溢出。',
  prereq:['l1-4','l4-2'],
  expected:[{input:'5−7',expect:'1110（−2），OV=0'},{input:'7+2',expect:'1001，OV=1 溢出'}],
  improve:['扩展到 8 位并加入饱和运算','把溢出标志接到 LED，做可视化判断'],
  entry:{type:'module',id:'c1',label:'打开补码互动'}
 },
 'case-2-1':{
  cap:'circuit',capNote:'3 开关 + 3 与门 + 2 或门 + 1 LED 可完整载入引擎，8 行真值表逐行可验。',
  objective:'把「两人及以上同意」翻译成与或式，并验证 8 种投票组合。',
  prereq:['l2-1','l2-2'],
  expected:[{input:'011',expect:'F=1'},{input:'101',expect:'F=1'},{input:'001',expect:'F=0'}],
  improve:['改成五人表决，观察门数与真值表行数增长','用与非门实现同一逻辑，比较门数'],
  entry:{type:'circuit',id:'majority',label:'⚡ 载入三人表决器'}
 },
 'case-2-2':{
  cap:'circuit',capNote:'2 开关 + 4 个与非门 + 1 LED，中间节点 N1~N3 可在实验室逐个测量。',
  objective:'只用与非门实现异或，理解德摩根定律如何把或运算变成与非。',
  prereq:['l2-3'],
  expected:[{input:'00',expect:'Y=0，N1=1'},{input:'01',expect:'Y=1，N3=0'},{input:'11',expect:'Y=0，N1=0'}],
  improve:['用 5 个与非门实现同或','改用或非门实现异或并比较门数'],
  entry:{type:'circuit',id:'xor4nand',label:'⚡ 载入四与非门异或'}
 },
 'case-2-3':{
  cap:'circuit',capNote:'新增门级电路：B3 + B2·(B1+B0)，4 开关 + 2 或门 + 2 与门 + 1 LED，可在实验室验证 0~9。',
  objective:'用无关项把「楼层 ≥5」化简为 B3 + B2·(B1+B0)，并验证 4/5 分界。',
  prereq:['l2-4','l1-4'],
  expected:[{input:'0100（4）',expect:'F=0'},{input:'0101（5）',expect:'F=1'},{input:'1001（9）',expect:'F=1'}],
  improve:['比较「用无关项」与「加非法码检测」的成本','换成 0~15 全码输入，观察表达式失效'],
  entry:{type:'circuit',id:'floor5',label:'⚡ 载入楼层判断电路'}
 },
 'case-3-1':{
  cap:'module',capNote:'CMOS 通断与电平由第三章精讲互动演示；实验室没有 MOS 管级的模拟模型。',
  objective:'理解输入阈值附近两管同时导通造成的直通电流。',
  prereq:['l3-2','l3-3'],
  expected:[{input:'Vin=0 V',expect:'PMOS 通，输出接近 VDD'},{input:'Vin=1.65 V',expect:'两管部分导通，输出不定'}],
  improve:['用真实器件测量转移特性曲线','加入施密特触发器消除中间电平'],
  entry:{type:'module',id:'c3',label:'打开 CMOS 互动'}
 },
 'case-3-2':{
  cap:'module',capNote:'三态与总线冲突由 n3 互动演示 8 种使能组合；V1.6 引擎没有高阻态元件，门级实现需扩展仿真元件。',
  objective:'用使能互斥保证任一时刻至多一个设备驱动总线。',
  prereq:['l3-4'],
  expected:[{input:'EN=000',expect:'高阻，由上拉给 1'},{input:'EN=011',expect:'冲突，电流异常'}],
  improve:['扩展三态缓冲器元件，做门级总线实验','加入总线仲裁，比较多设备请求的处理'],
  entry:{type:'module',id:'n3',label:'打开三态总线互动'}
 },
 'case-3-3':{
  cap:'numeric',capNote:'按键抖动与 RC 时间常数属于模拟/时间常数计算，课堂用公式与波形说明；实验室不模拟机械抖动和模拟电平。',
  objective:'用上拉电阻、RC 与施密特触发器把抖动输入整形成干净边沿。',
  prereq:['l3-3','l7-4'],
  expected:[{input:'R=10 kΩ，VDD=3.3 V',expect:'按下电流约 0.33 mA'},{input:'R=10 kΩ，C=1 μF',expect:'τ=10 ms，覆盖毫秒级抖动'}],
  improve:['用示波器实测抖动时间并重算 RC','比较硬件去抖与软件去抖的延迟与成本'],
  entry:{type:'module',id:'g1',label:'查看第三章电平资料'}
 },
 'case-4-1':{
  cap:'circuit',capNote:'3 开关 + 2 异或 + 2 与门 + 1 或门 + 2 LED 的全加器可完整载入引擎，8 行真值表可逐行验证。',
  objective:'用两个半加结果与一个进位合并实现全加器，并理解进位链。',
  prereq:['l4-2'],
  expected:[{input:'000',expect:'S=0，Cout=0'},{input:'111',expect:'S=1，Cout=1（和为 3）'},{input:'110',expect:'S=0，Cout=1'}],
  improve:['串联 4 个全加器做 4 位加法器','增加减法模式：B 取反并置 C0=1'],
  entry:{type:'circuit',id:'fulladder',label:'⚡ 载入一位全加器'}
 },
 'case-4-2':{
  cap:'module',capNote:'3-8 译码器与 4 选 1 由第四章精讲互动演示地址与输出；门级实现需要大量与门，课堂用译码器芯片模型。',
  objective:'把真值表直接映射成译码器输出之和，避免复杂化简。',
  prereq:['l4-3','l4-4'],
  expected:[{input:'ABC=011',expect:'Y3=1，F=1'},{input:'ABC=001',expect:'Y1=1，F=0'}],
  improve:['用 4-16 译码器实现四变量函数','比较译码器方案与卡诺图方案的门数'],
  entry:{type:'module',id:'c4',label:'打开 138/151 互动'}
 },
 'case-5-1':{
  cap:'circuit',capNote:'V2.5 实验室内置的 D 触发器案例，可单步时钟观察 Q 只在上升沿变化。',
  objective:'理解边沿采样：没有时钟沿，D 怎么变都不影响 Q。',
  prereq:['l5-2'],
  expected:[{input:'D 变化但无时钟沿',expect:'Q 保持'},{input:'D=1 且来一个上升沿',expect:'Q=1'}],
  improve:['串两个 D 触发器做移位寄存器','加入建立时间说明，讨论亚稳态'],
  entry:{type:'circuit',id:'dff',label:'⚡ 载入 D 触发器案例'}
 },
 'case-5-2':{
  cap:'circuit',capNote:'新增两级同步器电路：1 个异步输入开关 + 2 个 D 触发器 + 2 只 LED，单步时钟可见「晚两拍」。',
  objective:'用两级触发器把异步信号延迟两拍，观察第一级与第二级的先后变化。',
  prereq:['l5-2','l5-4'],
  expected:[{input:'输入=1，第 1 个时钟沿',expect:'Q1=1，Q2=0'},{input:'第 2 个时钟沿',expect:'Q1=1，Q2=1'}],
  improve:['加到三级，比较延迟与可靠性','用异步 FIFO 处理多位数据跨时钟域'],
  entry:{type:'circuit',id:'sync2',label:'⚡ 载入两级同步器'}
 },
 'case-6-1':{
  cap:'circuit',capNote:'V2.5 实验室内置模 6 计数器案例，可单步观察 101 之后回到 000。',
  objective:'用反馈清零实现模 6 计数，并检查未使用状态能否自恢复。',
  prereq:['l6-2','l6-3'],
  expected:[{input:'101 再单步',expect:'000'},{input:'人为置 110',expect:'111 → 000'}],
  improve:['改成模 10 做秒位计数','级联两片做模 60'],
  entry:{type:'circuit',id:'counter6',label:'⚡ 载入模 6 计数器'}
 },
 'case-6-2':{
  cap:'module',capNote:'六相位交通灯由第六章精讲互动逐秒推进；项目实训台提供带故障注入的可操作版本。',
  objective:'用状态表描述六相位循环，并证明任何时刻不会双向同时绿。',
  prereq:['l6-4','l6-1'],
  expected:[{input:'第 0 秒',expect:'南北绿、东西红'},{input:'第 13 秒',expect:'全红'},{input:'第 16 秒',expect:'东西绿'}],
  improve:['加入行人请求相位','增加夜间黄闪模式，切换先全红'],
  entry:{type:'module',id:'c6',label:'打开交通灯互动'}
 },
 'case-7-1':{
  cap:'numeric',capNote:'555 频率与占空比用理想公式计算，第三章速查可看五种接法；实验室没有 555 与模拟 RC 模型。',
  objective:'用 T≈0.693(R1+2R2)C 计算频率与占空比，并解释占空比恒大于 50% 的原因。',
  prereq:['l7-1','l7-2','l7-3'],
  expected:[{input:'10k/10k/10nF',expect:'T≈207.9 μs，f≈4.81 kHz'},{input:'C 改为 100 nF',expect:'频率降为约 481 Hz，占空比不变'}],
  improve:['加二极管把占空比调到 50% 以下','用实测数据反推器件误差'],
  entry:{type:'module',id:'g5',label:'查看 555 五种接法'}
 },
 'case-7-2':{
  cap:'numeric',capNote:'1 kHz/50% 的可行性分析属于参数计算；经典 555 结构限制无法用现有理想元件复现。',
  objective:'从目标频率反推阻容，并识别经典 555 的占空比下限。',
  prereq:['l7-3'],
  expected:[{input:'R1=1k，R2=6.7k，C=100nF',expect:'f≈1.00 kHz，D≈53.5%'},{input:'加二极管且 R1=R2=7.2k',expect:'D≈50%'}],
  improve:['用单片机 PWM 比较精度与成本','实测二极管方案的实际占空比'],
  entry:{type:'module',id:'g5',label:'在 555 互动中改参数'}
 },
 'case-8-1':{
  cap:'numeric',capNote:'理想 ADC 模型，案例内提供交互采集器（滑块改变 Vin/Vref/位数），不含噪声与非线性。',
  objective:'算清步长、码值、量化误差，并解释满量程附近误差为何接近 1 个 Δ。',
  prereq:['l8-1','l8-2'],
  expected:[{input:'Vin=1.000 V，10 位',expect:'码值 310，误差约 0.98 mV'},{input:'Vin=3.3 V',expect:'码值 1023，误差约 3.22 mV'}],
  improve:['加滑动平均滤波比较跳动','用两点校准消除失调与增益误差'],
  entry:{type:'project',id:'adc',label:'打开项目实训台的 ADC 采集器'}
 },
 'case-8-2':{
  cap:'numeric',capNote:'R-2R 权重由公式计算，第八章精讲有 R-2R 互动；实验室没有电阻网络与运放的模拟模型。',
  objective:'用「码值 × 1 LSB」算输出电压，并解释满量程比 Vref 小一个 LSB。',
  prereq:['l8-4'],
  expected:[{input:'1010（10）',expect:'2.0625 V'},{input:'1111（15）',expect:'3.09375 V'}],
  improve:['扩到 8 位比较 1 LSB 的变化','用 PWM+RC 模拟 DAC，比较精度与成本'],
  entry:{type:'module',id:'c8',label:'打开 R-2R 互动'}
 }
};
root.DigitalV252CaseLinks=Object.freeze({
 get:id=>S[id]||null,
 ids:Object.keys(S),
 stats:()=>{
  const out={circuit:0,module:0,numeric:0,needs:0};
  Object.values(S).forEach(x=>{out[x.cap]=(out[x.cap]||0)+1;});
  return out;
 },
 LABELS:{circuit:'已支持完整电路仿真',module:'已支持原有章节互动',numeric:'仅数值计算或图形演示',needs:'需要扩展仿真元件'}
});
})(typeof window!=='undefined'?window:globalThis);
