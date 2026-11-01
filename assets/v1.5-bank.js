/* V1.5 原创考试题库：每章 4 单选、1 判断、1 数值。 */
(function (host) {
  'use strict';
  host.DigitalExamBank = {
  "version": 1,
  "chapters": [
    "数制与码制",
    "逻辑代数",
    "门电路",
    "组合逻辑",
    "半导体存储",
    "时序逻辑",
    "脉冲电路",
    "ADC/DAC"
  ],
  "questions": [
    {
      "id": "c1-01",
      "chapter": 1,
      "type": "choice",
      "prompt": "二进制 110101₂ 对应的十进制数是多少？",
      "options": [
        "45",
        "53",
        "55",
        "61"
      ],
      "answer": 1,
      "explain": "32+16+4+1=53。"
    },
    {
      "id": "c1-02",
      "chapter": 1,
      "type": "choice",
      "prompt": "十六进制 2F₁₆ 对应十进制数是多少？",
      "options": [
        "31",
        "46",
        "47",
        "48"
      ],
      "answer": 2,
      "explain": "2×16+15=47。"
    },
    {
      "id": "c1-03",
      "chapter": 1,
      "type": "choice",
      "prompt": "十进制 37 的 8421 BCD 编码是？",
      "options": [
        "0010 0101",
        "0011 0111",
        "0010 1111",
        "100101"
      ],
      "answer": 1,
      "explain": "BCD 为每个十进制数字分别编码，3=0011、7=0111。"
    },
    {
      "id": "c1-04",
      "chapter": 1,
      "type": "choice",
      "prompt": "4 位二进制补码 1110₂ 表示？",
      "options": [
        "14",
        "−1",
        "−2",
        "−8"
      ],
      "answer": 2,
      "explain": "4 位补码最高位权重为 −8，其余 4+2=6，得到 −2。"
    },
    {
      "id": "c1-05",
      "chapter": 1,
      "type": "boolean",
      "prompt": "8421 BCD 的四位编码 1010 可以表示一个合法的十进制数字。",
      "answer": false,
      "explain": "8421 BCD 单个数字只允许 0000～1001。"
    },
    {
      "id": "c1-06",
      "chapter": 1,
      "type": "number",
      "prompt": "8 位无符号二进制整数的最大十进制值是多少？",
      "answer": 255,
      "explain": "8 位无符号最大值为 2⁸−1=255。"
    },
    {
      "id": "c2-01",
      "chapter": 2,
      "type": "choice",
      "prompt": "逻辑表达式 A·B + A·B̅ 化简为？",
      "options": [
        "A",
        "B",
        "A+B",
        "A·B"
      ],
      "answer": 0,
      "explain": "提取 A 后得到 A(B+B̅)=A。"
    },
    {
      "id": "c2-02",
      "chapter": 2,
      "type": "choice",
      "prompt": "根据德摩根定律，(A+B)̅ 等于？",
      "options": [
        "A̅+B̅",
        "A̅·B̅",
        "A·B",
        "A+B"
      ],
      "answer": 1,
      "explain": "对整体或取反需逐项取反，并将或改为与。"
    },
    {
      "id": "c2-03",
      "chapter": 2,
      "type": "choice",
      "prompt": "两个二进制输入 A、B 的异或在什么情况下输出 1？",
      "options": [
        "A=B",
        "A≠B",
        "A=B=0",
        "总是 1"
      ],
      "answer": 1,
      "explain": "异或当输入不同时为 1。"
    },
    {
      "id": "c2-04",
      "chapter": 2,
      "type": "choice",
      "prompt": "3 个布尔变量的完整真值表包含多少行输入组合？",
      "options": [
        "3",
        "6",
        "8",
        "9"
      ],
      "answer": 2,
      "explain": "3 个独立二值输入，共 2³=8 种组合。"
    },
    {
      "id": "c2-05",
      "chapter": 2,
      "type": "boolean",
      "prompt": "卡诺图相邻的两个 1 可以在适当条件下合并，消去一个变化的变量。",
      "answer": true,
      "explain": "相邻最小项只有一个变量不同，可成对合并消掉该变量。"
    },
    {
      "id": "c2-06",
      "chapter": 2,
      "type": "number",
      "prompt": "4 个布尔变量的完整真值表有多少行？",
      "answer": 16,
      "explain": "输入组合数为 2⁴=16。"
    },
    {
      "id": "c3-01",
      "chapter": 3,
      "type": "choice",
      "prompt": "理想 CMOS 反相器输入为低电平时，输出接近？",
      "options": [
        "0 V",
        "VDD",
        "高阻态",
        "不确定"
      ],
      "answer": 1,
      "explain": "PMOS 上拉导通，NMOS 下拉截止，输出接近电源电压。"
    },
    {
      "id": "c3-02",
      "chapter": 3,
      "type": "choice",
      "prompt": "三态门输出 Z 的含义是什么？",
      "options": [
        "逻辑 0",
        "逻辑 1",
        "高阻态",
        "反相"
      ],
      "answer": 2,
      "explain": "Z 表示输出近似断开驱动，既不是确定的 0 也不是确定的 1。"
    },
    {
      "id": "c3-03",
      "chapter": 3,
      "type": "choice",
      "prompt": "若 VOH(min)=2.8 V，VIH(min)=2.0 V，则高电平噪声容限为？",
      "options": [
        "0.8 V",
        "1.8 V",
        "2.8 V",
        "4.8 V"
      ],
      "answer": 0,
      "explain": "NMH=VOH(min)−VIH(min)=2.8−2.0=0.8 V。"
    },
    {
      "id": "c3-04",
      "chapter": 3,
      "type": "choice",
      "prompt": "把 5 V 数字输出接到 3.3 V MCU 前，最应该核对？",
      "options": [
        "引脚颜色",
        "数据手册的额定电压和输入阈值",
        "电路板大小",
        "程序语言"
      ],
      "answer": 1,
      "explain": "应检查最大额定值、电平阈值和接口兼容性，避免损伤。"
    },
    {
      "id": "c3-05",
      "chapter": 3,
      "type": "boolean",
      "prompt": "三态输出的高阻态等同于主动输出逻辑 0。",
      "answer": false,
      "explain": "高阻表示输出端不主动驱动，不等于输出低电平。"
    },
    {
      "id": "c3-06",
      "chapter": 3,
      "type": "number",
      "prompt": "若 VOH(min)=3.2 V、VIH(min)=2.4 V，高电平噪声容限是多少伏？",
      "answer": 0.8,
      "explain": "噪声容限等于 3.2−2.4=0.8 V。",
      "unit": "V",
      "tolerance": 0.0001
    },
    {
      "id": "c4-01",
      "chapter": 4,
      "type": "choice",
      "prompt": "全加器 A=1、B=1、Cin=1 时，S 和 Cout 是？",
      "options": [
        "0、1",
        "1、0",
        "1、1",
        "0、0"
      ],
      "answer": 2,
      "explain": "1+1+1=3=11₂，因此和位 S=1、进位 Cout=1。"
    },
    {
      "id": "c4-02",
      "chapter": 4,
      "type": "choice",
      "prompt": "3-8 译码器通常有几根地址输入线？",
      "options": [
        "2",
        "3",
        "8",
        "11"
      ],
      "answer": 1,
      "explain": "3 位地址能选择 2³=8 种输出。"
    },
    {
      "id": "c4-03",
      "chapter": 4,
      "type": "choice",
      "prompt": "4 选 1 数据选择器需要几位选择信号？",
      "options": [
        "1",
        "2",
        "3",
        "4"
      ],
      "answer": 1,
      "explain": "两位选择信号有 00、01、10、11 四种组合。"
    },
    {
      "id": "c4-04",
      "chapter": 4,
      "type": "choice",
      "prompt": "理想半加器的两个输出是？",
      "options": [
        "和与进位",
        "地址与数据",
        "时钟与复位",
        "输入与使能"
      ],
      "answer": 0,
      "explain": "半加器产生和位 S=A⊕B、进位 C=A·B。"
    },
    {
      "id": "c4-05",
      "chapter": 4,
      "type": "boolean",
      "prompt": "组合逻辑电路的理想稳态输出取决于当前输入，而非内部存储状态。",
      "answer": true,
      "explain": "组合逻辑无记忆；真实门存在传播延迟但不具备时序存储。"
    },
    {
      "id": "c4-06",
      "chapter": 4,
      "type": "number",
      "prompt": "5-32 译码器理论上可以选通多少种输出组合？",
      "answer": 32,
      "explain": "5 个二进制地址位对应 2⁵=32 条输出选通状态。"
    },
    {
      "id": "c5-01",
      "chapter": 5,
      "type": "choice",
      "prompt": "理想正沿 D 触发器的下一状态是？",
      "options": [
        "Q̅",
        "D",
        "0",
        "时钟电平"
      ],
      "answer": 1,
      "explain": "仅在指定上升沿采样 D。"
    },
    {
      "id": "c5-02",
      "chapter": 5,
      "type": "choice",
      "prompt": "T 触发器在 T=1 且发生有效时钟沿时？",
      "options": [
        "清零",
        "置位",
        "翻转",
        "保持"
      ],
      "answer": 2,
      "explain": "T=1，Q⁺=Q̅。"
    },
    {
      "id": "c5-03",
      "chapter": 5,
      "type": "choice",
      "prompt": "JK 触发器 J=K=0 时？",
      "options": [
        "保持",
        "置位",
        "清零",
        "翻转"
      ],
      "answer": 0,
      "explain": "JK=00 对应状态保持。"
    },
    {
      "id": "c5-04",
      "chapter": 5,
      "type": "choice",
      "prompt": "触发器的建立时间是指？",
      "options": [
        "有效时钟沿前输入需稳定的时间",
        "有效沿后任意时长",
        "复位耗时",
        "时钟周期的一半"
      ],
      "answer": 0,
      "explain": "建立时间指采样沿到来前输入需稳定的最短时间。"
    },
    {
      "id": "c5-05",
      "chapter": 5,
      "type": "boolean",
      "prompt": "违反触发器建立/保持时间可能导致亚稳态。",
      "answer": true,
      "explain": "异步信号靠近采样沿可能进入不可确定的临界状态。"
    },
    {
      "id": "c5-06",
      "chapter": 5,
      "type": "number",
      "prompt": "理想 T 触发器从 Q=0 开始，T 始终为 1，经过 5 个有效沿后 Q 是多少？",
      "answer": 1,
      "explain": "连续翻转五次：0→1→0→1→0→1。"
    },
    {
      "id": "c6-01",
      "chapter": 6,
      "type": "choice",
      "prompt": "模 6 同步计数器至少需要多少位状态寄存器？",
      "options": [
        "2",
        "3",
        "4",
        "6"
      ],
      "answer": 1,
      "explain": "2²<6≤2³，因此至少 3 位。"
    },
    {
      "id": "c6-02",
      "chapter": 6,
      "type": "choice",
      "prompt": "模 6 计数器按 000、001……计数，101 之后应为？",
      "options": [
        "110",
        "111",
        "000",
        "001"
      ],
      "answer": 2,
      "explain": "模 6 具有 0～5 六个状态，5 之后返回 0。"
    },
    {
      "id": "c6-03",
      "chapter": 6,
      "type": "choice",
      "prompt": "Moore 状态机的输出只由什么决定？",
      "options": [
        "当前状态",
        "当前输入",
        "时钟频率",
        "当前状态与输入同时决定"
      ],
      "answer": 0,
      "explain": "Moore 模型输出 Y=g(Q)，不直接依赖当前输入。"
    },
    {
      "id": "c6-04",
      "chapter": 6,
      "type": "choice",
      "prompt": "3 位二进制状态寄存器最多能表示多少种状态？",
      "options": [
        "3",
        "6",
        "8",
        "16"
      ],
      "answer": 2,
      "explain": "2³=8 个互不相同的二进制状态。"
    },
    {
      "id": "c6-05",
      "chapter": 6,
      "type": "boolean",
      "prompt": "设计模 6 的三位计数器时，不需要考虑 110 和 111 两种未使用状态。",
      "answer": false,
      "explain": "真实电路可能进入未使用状态，应考虑恢复或锁死风险。"
    },
    {
      "id": "c6-06",
      "chapter": 6,
      "type": "number",
      "prompt": "模 10 计数器最少需要几位二进制触发器？",
      "answer": 4,
      "explain": "2³=8 不够，2⁴=16 可以覆盖 10 种状态。"
    },
    {
      "id": "c7-01",
      "chapter": 7,
      "type": "choice",
      "prompt": "经典 555 无稳态振荡器的周期近似是？",
      "options": [
        "0.693(R1+2R2)C",
        "0.693R1C",
        "R1/R2",
        "2πRC"
      ],
      "answer": 0,
      "explain": "高低电平时间相加，T≈0.693(R1+2R2)C。"
    },
    {
      "id": "c7-02",
      "chapter": 7,
      "type": "choice",
      "prompt": "经典 555 无稳态接法在正电阻条件下，占空比通常？",
      "options": [
        "固定 0%",
        "小于 50%",
        "大于 50%",
        "固定 100%"
      ],
      "answer": 2,
      "explain": "D=(R1+R2)/(R1+2R2)，当 R1>0 时 D>50%。"
    },
    {
      "id": "c7-03",
      "chapter": 7,
      "type": "choice",
      "prompt": "施密特触发器抗输入噪声抖动主要依赖？",
      "options": [
        "滞回阈值",
        "地址译码",
        "移位寄存器",
        "寄存器数量"
      ],
      "answer": 0,
      "explain": "上、下切换阈值形成回差。"
    },
    {
      "id": "c7-04",
      "chapter": 7,
      "type": "choice",
      "prompt": "RC 参数不变时，振荡频率与周期的关系是？",
      "options": [
        "f=T",
        "f=1/T",
        "f=T²",
        "无关系"
      ],
      "answer": 1,
      "explain": "周期单位秒，频率单位 Hz，f=1/T。"
    },
    {
      "id": "c7-05",
      "chapter": 7,
      "type": "boolean",
      "prompt": "在经典 555 无稳态电路中，电容 C 增大两倍，理想振荡频率约减半。",
      "answer": true,
      "explain": "振荡周期与 C 成正比，频率与 C 成反比。"
    },
    {
      "id": "c7-06",
      "chapter": 7,
      "type": "number",
      "prompt": "某方波周期为 2 ms，频率是多少 Hz？",
      "answer": 500,
      "explain": "2 ms=0.002 s；f=1/0.002=500 Hz。",
      "unit": "Hz",
      "tolerance": 0.001
    },
    {
      "id": "c8-01",
      "chapter": 8,
      "type": "choice",
      "prompt": "理想 10 位 ADC 共有多少个数字码值？",
      "options": [
        "10",
        "1023",
        "1024",
        "2048"
      ],
      "answer": 2,
      "explain": "10 位共 2¹⁰=1024 种编码，码值从 0 到 1023。"
    },
    {
      "id": "c8-02",
      "chapter": 8,
      "type": "choice",
      "prompt": "理想单极性 8 位 ADC、Vref=5 V 的量化步长近似为？",
      "options": [
        "5/8 V",
        "5/255 V",
        "5/256 V",
        "1/5 V"
      ],
      "answer": 2,
      "explain": "采用 2⁸ 码段约定，步长 Δ=Vref/256。"
    },
    {
      "id": "c8-03",
      "chapter": 8,
      "type": "choice",
      "prompt": "逐次逼近型 ADC 的基本过程最接近？",
      "options": [
        "二分试探",
        "连续积分",
        "瞬时并行全部比较",
        "无限循环计数"
      ],
      "answer": 0,
      "explain": "SAR 每一步试探一位并比较结果。"
    },
    {
      "id": "c8-04",
      "chapter": 8,
      "type": "choice",
      "prompt": "带限信号最高频率 4 kHz，理想无混叠重建的采样率应？",
      "options": [
        "低于 4 kHz",
        "高于 8 kHz",
        "等于 2 kHz",
        "任意"
      ],
      "answer": 1,
      "explain": "对于严格带限信号，理想采样频率应高于最高频率两倍，并留有实际裕量。"
    },
    {
      "id": "c8-05",
      "chapter": 8,
      "type": "boolean",
      "prompt": "提高 ADC 采样率能自动消除所有量化误差。",
      "answer": false,
      "explain": "采样率与量化位数是不同指标，提高采样率不会自动消除量化误差。"
    },
    {
      "id": "c8-06",
      "chapter": 8,
      "type": "number",
      "prompt": "3.3 V 输入范围的理想 10 位 ADC，量化步长约多少毫伏？结果保留两位小数。",
      "answer": 3.22,
      "explain": "Δ=3.3/1024 V≈3.222656 mV，保留两位小数为 3.22 mV。",
      "unit": "mV",
      "tolerance": 0.005
    }
  ]
};
})(typeof window !== 'undefined' ? window : globalThis);
