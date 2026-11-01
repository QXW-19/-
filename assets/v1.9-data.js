/* V1.9 原创示意图与分层练习：示意高亮步骤，不代表实际电路传播时间。 */
(function(root){'use strict';root.DigitalV19Data={
  "version": 1,
  "reference": "阎石《数字电子技术基础》第六版",
  "diagrams": [
    {
      "chapter": 1,
      "title": "二进制位权怎样得到十进制结果",
      "intro": "先看每一位，再看位权，最后把选中的位权相加。",
      "nodes": [
        {
          "id": "n0",
          "text": "位串 1101",
          "x": 40,
          "y": 104
        },
        {
          "id": "n1",
          "text": "位权 8 4 2 1",
          "x": 225,
          "y": 104
        },
        {
          "id": "n2",
          "text": "选中 8+4+1",
          "x": 405,
          "y": 104
        },
        {
          "id": "n3",
          "text": "结果 13₁₀",
          "x": 580,
          "y": 104
        }
      ],
      "edges": [
        {
          "id": "e0",
          "from": "n0",
          "to": "n1"
        },
        {
          "id": "e1",
          "from": "n1",
          "to": "n2"
        },
        {
          "id": "e2",
          "from": "n2",
          "to": "n3"
        }
      ],
      "frames": [
        {
          "label": "认清输入",
          "nodes": [
            "n0"
          ],
          "edges": [],
          "description": "1101₂ 有四位，从右向左依次对应 1、2、4、8。"
        },
        {
          "label": "对应位权",
          "nodes": [
            "n0",
            "n1"
          ],
          "edges": [
            "e0"
          ],
          "description": "只有值为 1 的位才需要把该位权计入结果。"
        },
        {
          "label": "进行加法",
          "nodes": [
            "n1",
            "n2"
          ],
          "edges": [
            "e1"
          ],
          "description": "1101₂ 对应 8+4+0+1，因此可简化为 8+4+1。"
        },
        {
          "label": "核对输出",
          "nodes": [
            "n2",
            "n3"
          ],
          "edges": [
            "e2"
          ],
          "description": "8+4+1=13，所以 1101₂=13₁₀。"
        }
      ]
    },
    {
      "chapter": 2,
      "title": "两个开关怎样控制与门输出",
      "intro": "与门必须两个输入都为 1 才输出 1；这里演示 A=1，B=0。",
      "nodes": [
        {
          "id": "n0",
          "text": "输入 A=1",
          "x": 40,
          "y": 55
        },
        {
          "id": "n1",
          "text": "输入 B=0",
          "x": 40,
          "y": 172
        },
        {
          "id": "n2",
          "text": "与门 AND",
          "x": 275,
          "y": 113
        },
        {
          "id": "n3",
          "text": "输出 Y=0",
          "x": 535,
          "y": 113
        }
      ],
      "edges": [
        {
          "id": "e0",
          "from": "n0",
          "to": "n2"
        },
        {
          "id": "e1",
          "from": "n1",
          "to": "n2"
        },
        {
          "id": "e2",
          "from": "n2",
          "to": "n3"
        }
      ],
      "frames": [
        {
          "label": "读取两个输入",
          "nodes": [
            "n0",
            "n1"
          ],
          "edges": [],
          "description": "输入是两个开关，分别处于 1 和 0。"
        },
        {
          "label": "信号进入与门",
          "nodes": [
            "n0",
            "n1",
            "n2"
          ],
          "edges": [
            "e0",
            "e1"
          ],
          "description": "与门规则是所有输入都为 1 才输出 1。"
        },
        {
          "label": "代入条件",
          "nodes": [
            "n2"
          ],
          "edges": [
            "e0",
            "e1"
          ],
          "description": "由于 B=0，A·B=1·0=0。"
        },
        {
          "label": "得到输出",
          "nodes": [
            "n2",
            "n3"
          ],
          "edges": [
            "e2"
          ],
          "description": "输出 Y=0，因此 LED 不应点亮。"
        }
      ]
    },
    {
      "chapter": 3,
      "title": "CMOS 反相器为什么能反转信号",
      "intro": "这个示意图用于理解输入、上拉/下拉及输出，不表示真实晶体管电路布线。",
      "nodes": [
        {
          "id": "n0",
          "text": "输入 Vin=0",
          "x": 35,
          "y": 110
        },
        {
          "id": "n1",
          "text": "PMOS 上拉通",
          "x": 260,
          "y": 47
        },
        {
          "id": "n2",
          "text": "NMOS 下拉断",
          "x": 260,
          "y": 172
        },
        {
          "id": "n3",
          "text": "输出接近 VDD",
          "x": 520,
          "y": 110
        }
      ],
      "edges": [
        {
          "id": "e0",
          "from": "n0",
          "to": "n1"
        },
        {
          "id": "e1",
          "from": "n0",
          "to": "n2"
        },
        {
          "id": "e2",
          "from": "n1",
          "to": "n3"
        },
        {
          "id": "e3",
          "from": "n2",
          "to": "n3"
        }
      ],
      "frames": [
        {
          "label": "输入低电平",
          "nodes": [
            "n0"
          ],
          "edges": [],
          "description": "假设输入已经符合芯片的数据手册低电平要求。"
        },
        {
          "label": "检查 PMOS",
          "nodes": [
            "n0",
            "n1"
          ],
          "edges": [
            "e0"
          ],
          "description": "理想输入低时，PMOS 通导，提供上拉通路。"
        },
        {
          "label": "检查 NMOS",
          "nodes": [
            "n0",
            "n2"
          ],
          "edges": [
            "e1"
          ],
          "description": "理想输入低时，NMOS 截止，关闭下拉通路。"
        },
        {
          "label": "形成高输出",
          "nodes": [
            "n1",
            "n3"
          ],
          "edges": [
            "e2"
          ],
          "description": "输出被上拉到接近电源电压，形成逻辑高。"
        }
      ]
    },
    {
      "chapter": 4,
      "title": "半加器为什么需要两个输出",
      "intro": "把 A=1、B=1 输入 XOR 与 AND，两条支路分别计算和位与进位。",
      "nodes": [
        {
          "id": "n0",
          "text": "输入 A=1",
          "x": 35,
          "y": 55
        },
        {
          "id": "n1",
          "text": "输入 B=1",
          "x": 35,
          "y": 175
        },
        {
          "id": "n2",
          "text": "异或 XOR",
          "x": 230,
          "y": 55
        },
        {
          "id": "n3",
          "text": "与门 AND",
          "x": 230,
          "y": 175
        },
        {
          "id": "n4",
          "text": "和位 S=0",
          "x": 505,
          "y": 55
        },
        {
          "id": "n5",
          "text": "进位 C=1",
          "x": 505,
          "y": 175
        }
      ],
      "edges": [
        {
          "id": "e0",
          "from": "n0",
          "to": "n2"
        },
        {
          "id": "e1",
          "from": "n1",
          "to": "n2"
        },
        {
          "id": "e2",
          "from": "n0",
          "to": "n3"
        },
        {
          "id": "e3",
          "from": "n1",
          "to": "n3"
        },
        {
          "id": "e4",
          "from": "n2",
          "to": "n4"
        },
        {
          "id": "e5",
          "from": "n3",
          "to": "n5"
        }
      ],
      "frames": [
        {
          "label": "输入两个 1",
          "nodes": [
            "n0",
            "n1"
          ],
          "edges": [],
          "description": "单比特加法 1+1 的二进制结果是 10。"
        },
        {
          "label": "计算和位",
          "nodes": [
            "n0",
            "n1",
            "n2"
          ],
          "edges": [
            "e0",
            "e1"
          ],
          "description": "异或门 1⊕1=0，因此和位 S=0。"
        },
        {
          "label": "计算进位",
          "nodes": [
            "n0",
            "n1",
            "n3"
          ],
          "edges": [
            "e2",
            "e3"
          ],
          "description": "与门 1·1=1，因此进位 C=1。"
        },
        {
          "label": "组合最终结果",
          "nodes": [
            "n4",
            "n5"
          ],
          "edges": [
            "e4",
            "e5"
          ],
          "description": "输出 (C,S)=(1,0)，也就是 10₂。"
        }
      ]
    },
    {
      "chapter": 5,
      "title": "D 触发器什么时候更新输出",
      "intro": "示意的是满足建立/保持时间的理想上升沿采样，不表现真实传播延迟。",
      "nodes": [
        {
          "id": "n0",
          "text": "数据 D=1",
          "x": 35,
          "y": 57
        },
        {
          "id": "n1",
          "text": "时钟 ↑",
          "x": 35,
          "y": 177
        },
        {
          "id": "n2",
          "text": "D 触发器",
          "x": 280,
          "y": 110
        },
        {
          "id": "n3",
          "text": "状态 Q=1",
          "x": 537,
          "y": 110
        }
      ],
      "edges": [
        {
          "id": "e0",
          "from": "n0",
          "to": "n2"
        },
        {
          "id": "e1",
          "from": "n1",
          "to": "n2"
        },
        {
          "id": "e2",
          "from": "n2",
          "to": "n3"
        }
      ],
      "frames": [
        {
          "label": "准备数据",
          "nodes": [
            "n0"
          ],
          "edges": [],
          "description": "D 已变为 1，但没有时钟上升沿时，Q 可以继续保持旧值 0。"
        },
        {
          "label": "观察时钟",
          "nodes": [
            "n1"
          ],
          "edges": [],
          "description": "指定有效时钟沿来到之前，不能把 D=1 直接当成 Q=1。"
        },
        {
          "label": "上升沿采样",
          "nodes": [
            "n0",
            "n1",
            "n2"
          ],
          "edges": [
            "e0",
            "e1"
          ],
          "description": "有效沿到来时，理想 D 触发器采样 D=1。"
        },
        {
          "label": "更新存储输出",
          "nodes": [
            "n2",
            "n3"
          ],
          "edges": [
            "e2"
          ],
          "description": "上升沿之后 Q 更新为 1；之后直到下一次有效沿继续保持。"
        }
      ]
    },
    {
      "chapter": 6,
      "title": "模 6 计数器怎样回到起点",
      "intro": "计数器只在有效时钟沿改变状态，此例演示 101₂ 回绕到 000₂。",
      "nodes": [
        {
          "id": "n0",
          "text": "当前 101₂",
          "x": 35,
          "y": 110
        },
        {
          "id": "n1",
          "text": "时钟 ↑",
          "x": 205,
          "y": 110
        },
        {
          "id": "n2",
          "text": "模 6 规则",
          "x": 385,
          "y": 110
        },
        {
          "id": "n3",
          "text": "下一态 000₂",
          "x": 555,
          "y": 110
        }
      ],
      "edges": [
        {
          "id": "e0",
          "from": "n0",
          "to": "n1"
        },
        {
          "id": "e1",
          "from": "n1",
          "to": "n2"
        },
        {
          "id": "e2",
          "from": "n2",
          "to": "n3"
        }
      ],
      "frames": [
        {
          "label": "读取当前状态",
          "nodes": [
            "n0"
          ],
          "edges": [],
          "description": "101₂=5，已经是模 6 的最后一个合法状态。"
        },
        {
          "label": "等待有效沿",
          "nodes": [
            "n0",
            "n1"
          ],
          "edges": [
            "e0"
          ],
          "description": "没有时钟上升沿，状态仍然是 101。"
        },
        {
          "label": "执行回绕条件",
          "nodes": [
            "n1",
            "n2"
          ],
          "edges": [
            "e1"
          ],
          "description": "模 6 的下一个状态为 (5+1) mod 6=0。"
        },
        {
          "label": "锁存下一状态",
          "nodes": [
            "n2",
            "n3"
          ],
          "edges": [
            "e2"
          ],
          "description": "有效沿之后，计数器回到 000₂。"
        }
      ]
    },
    {
      "chapter": 7,
      "title": "555 为什么能输出连续方波",
      "intro": "经典无稳态电路的教学流程：电容充电、放电、重复。",
      "nodes": [
        {
          "id": "n0",
          "text": "R1/R2/C",
          "x": 35,
          "y": 110
        },
        {
          "id": "n1",
          "text": "充电到 2/3 VCC",
          "x": 250,
          "y": 48
        },
        {
          "id": "n2",
          "text": "放电到 1/3 VCC",
          "x": 250,
          "y": 174
        },
        {
          "id": "n3",
          "text": "输出周期方波",
          "x": 525,
          "y": 110
        }
      ],
      "edges": [
        {
          "id": "e0",
          "from": "n0",
          "to": "n1"
        },
        {
          "id": "e1",
          "from": "n1",
          "to": "n2"
        },
        {
          "id": "e2",
          "from": "n2",
          "to": "n3"
        },
        {
          "id": "e3",
          "from": "n3",
          "to": "n1"
        }
      ],
      "frames": [
        {
          "label": "选择元件参数",
          "nodes": [
            "n0"
          ],
          "edges": [],
          "description": "R1、R2、C 决定经典 555 无稳态电路的理想充放电时间。"
        },
        {
          "label": "电容充电",
          "nodes": [
            "n0",
            "n1"
          ],
          "edges": [
            "e0"
          ],
          "description": "充电路径涉及 R1+R2，电容升到约 2/3 VCC。"
        },
        {
          "label": "电容放电",
          "nodes": [
            "n1",
            "n2"
          ],
          "edges": [
            "e1"
          ],
          "description": "触发阈值切换后，电容经 R2 放电到约 1/3 VCC。"
        },
        {
          "label": "输出重复波形",
          "nodes": [
            "n2",
            "n3"
          ],
          "edges": [
            "e2",
            "e3"
          ],
          "description": "两段时间不断交替，形成重复方波；实际参数需按器件数据手册校核。"
        }
      ]
    },
    {
      "chapter": 8,
      "title": "ADC 怎样把电压转成数字码",
      "intro": "采用理想单极性 10 位 ADC，Vref=3.3 V，向下取整的量化约定。",
      "nodes": [
        {
          "id": "n0",
          "text": "Vin=1.65 V",
          "x": 30,
          "y": 60
        },
        {
          "id": "n1",
          "text": "Vref=3.3 V",
          "x": 30,
          "y": 176
        },
        {
          "id": "n2",
          "text": "量化 10 位 ADC",
          "x": 257,
          "y": 108
        },
        {
          "id": "n3",
          "text": "编码 D=512",
          "x": 522,
          "y": 108
        }
      ],
      "edges": [
        {
          "id": "e0",
          "from": "n0",
          "to": "n2"
        },
        {
          "id": "e1",
          "from": "n1",
          "to": "n2"
        },
        {
          "id": "e2",
          "from": "n2",
          "to": "n3"
        }
      ],
      "frames": [
        {
          "label": "读取模拟输入",
          "nodes": [
            "n0"
          ],
          "edges": [],
          "description": "输入电压为 1.65 V，是 3.3 V 参考范围的中间位置。"
        },
        {
          "label": "确定量化步长",
          "nodes": [
            "n1",
            "n2"
          ],
          "edges": [
            "e1"
          ],
          "description": "10 位共有 1024 个码段，步长 Δ=3.3/1024≈3.2227 mV。"
        },
        {
          "label": "计算数字码",
          "nodes": [
            "n0",
            "n2"
          ],
          "edges": [
            "e0"
          ],
          "description": "D=floor(Vin/Δ)=floor(1.65/(3.3/1024))=512。"
        },
        {
          "label": "输出离散编码",
          "nodes": [
            "n2",
            "n3"
          ],
          "edges": [
            "e2"
          ],
          "description": "10 位码值为 512，二进制 1000000000。"
        }
      ]
    }
  ],
  "questions": [
    {
      "id": "v19-q01",
      "chapter": 1,
      "level": "基础",
      "question": "1101₂ 中最右边一位的位权是？",
      "options": [
        "1",
        "2",
        "8"
      ],
      "correct": 0,
      "why": "二进制从右往左位权为 1、2、4、8。"
    },
    {
      "id": "v19-q02",
      "chapter": 1,
      "level": "进阶",
      "question": "十六进制 A₁₆ 在十进制中表示？",
      "options": [
        "8",
        "10",
        "16"
      ],
      "correct": 1,
      "why": "A 是十六进制数字 10。"
    },
    {
      "id": "v19-q03",
      "chapter": 1,
      "level": "应用",
      "question": "8 位无符号二进制最大值是多少？",
      "options": [
        "127",
        "255",
        "256"
      ],
      "correct": 1,
      "why": "最大值 2⁸−1=255。"
    },
    {
      "id": "v19-q04",
      "chapter": 2,
      "level": "基础",
      "question": "与门两个输入分别为 1、0，输出是？",
      "options": [
        "0",
        "1",
        "高阻态"
      ],
      "correct": 0,
      "why": "与门所有输入都为 1 才输出 1。"
    },
    {
      "id": "v19-q05",
      "chapter": 2,
      "level": "进阶",
      "question": "A·B+A·B̅ 化简为？",
      "options": [
        "A",
        "B",
        "A+B"
      ],
      "correct": 0,
      "why": "A(B+B̅)=A。"
    },
    {
      "id": "v19-q06",
      "chapter": 2,
      "level": "应用",
      "question": "两个按钮任意一个按下都要报警，应该选择？",
      "options": [
        "与门",
        "或门",
        "异或门"
      ],
      "correct": 1,
      "why": "或门只需一个输入为 1 就输出 1。"
    },
    {
      "id": "v19-q07",
      "chapter": 3,
      "level": "基础",
      "question": "理想非门输入 0，输出？",
      "options": [
        "0",
        "1",
        "Z"
      ],
      "correct": 1,
      "why": "反相器输出与输入相反。"
    },
    {
      "id": "v19-q08",
      "chapter": 3,
      "level": "进阶",
      "question": "三态输出的 Z 表示？",
      "options": [
        "低电平",
        "高电平",
        "高阻态"
      ],
      "correct": 2,
      "why": "Z 表示输出不主动驱动线路。"
    },
    {
      "id": "v19-q09",
      "chapter": 3,
      "level": "应用",
      "question": "发送端 VOH(min)=2.7 V、接收端 VIH(min)=2.0 V，高电平噪声容限？",
      "options": [
        "0.7 V",
        "2.7 V",
        "4.7 V"
      ],
      "correct": 0,
      "why": "NMH=VOH(min)−VIH(min)=0.7 V。"
    },
    {
      "id": "v19-q10",
      "chapter": 4,
      "level": "基础",
      "question": "半加器包含哪两个输出？",
      "options": [
        "和位与进位",
        "时钟与复位",
        "数据与地址"
      ],
      "correct": 0,
      "why": "半加器同时计算 S 与 C。"
    },
    {
      "id": "v19-q11",
      "chapter": 4,
      "level": "进阶",
      "question": "半加器 A=B=1 时，(C,S) 为？",
      "options": [
        "(0,1)",
        "(1,0)",
        "(1,1)"
      ],
      "correct": 1,
      "why": "1+1=10₂，C=1、S=0。"
    },
    {
      "id": "v19-q12",
      "chapter": 4,
      "level": "应用",
      "question": "四选一数据选择器至少需要几位选择信号？",
      "options": [
        "1",
        "2",
        "4"
      ],
      "correct": 1,
      "why": "2 位选择信号可以表达四种选择。"
    },
    {
      "id": "v19-q13",
      "chapter": 5,
      "level": "基础",
      "question": "理想 D 触发器在什么时刻更新 Q？",
      "options": [
        "数据变化时",
        "指定有效时钟沿",
        "随时"
      ],
      "correct": 1,
      "why": "它在指定时钟沿采样输入。"
    },
    {
      "id": "v19-q14",
      "chapter": 5,
      "level": "进阶",
      "question": "D=1，尚未到时钟上升沿，Q 原为 0，此时 Q？",
      "options": [
        "仍为 0",
        "立刻为 1",
        "必然不确定"
      ],
      "correct": 0,
      "why": "沿到来前 Q 保持先前状态。"
    },
    {
      "id": "v19-q15",
      "chapter": 5,
      "level": "应用",
      "question": "JK 触发器 J=K=1，遇有效沿后如何变化？",
      "options": [
        "保持",
        "翻转",
        "进入高阻"
      ],
      "correct": 1,
      "why": "JK=11 时在有效沿翻转。"
    },
    {
      "id": "v19-q16",
      "chapter": 6,
      "level": "基础",
      "question": "三位二进制状态位可表示几种状态？",
      "options": [
        "6",
        "8",
        "16"
      ],
      "correct": 1,
      "why": "2³=8。"
    },
    {
      "id": "v19-q17",
      "chapter": 6,
      "level": "进阶",
      "question": "模 6 计数器当前 101₂，下一次有效沿应变成？",
      "options": [
        "110₂",
        "000₂",
        "111₂"
      ],
      "correct": 1,
      "why": "5+1 在模 6 下回绕到 0。"
    },
    {
      "id": "v19-q18",
      "chapter": 6,
      "level": "应用",
      "question": "模 10 计数器至少需要几位触发器？",
      "options": [
        "3",
        "4",
        "10"
      ],
      "correct": 1,
      "why": "2³=8 不够，2⁴=16 足够。"
    },
    {
      "id": "v19-q19",
      "chapter": 7,
      "level": "基础",
      "question": "频率 f 与周期 T 的关系为？",
      "options": [
        "f=T",
        "f=1/T",
        "f=T²"
      ],
      "correct": 1,
      "why": "频率就是每秒重复的周期数。"
    },
    {
      "id": "v19-q20",
      "chapter": 7,
      "level": "进阶",
      "question": "经典 555 无稳态电路电容加倍，理想频率会？",
      "options": [
        "加倍",
        "不变",
        "减半"
      ],
      "correct": 2,
      "why": "T 与 C 成正比，f 与 C 成反比。"
    },
    {
      "id": "v19-q21",
      "chapter": 7,
      "level": "应用",
      "question": "周期 2 ms 的方波频率是多少？",
      "options": [
        "50 Hz",
        "500 Hz",
        "2000 Hz"
      ],
      "correct": 1,
      "why": "2 ms=0.002 s，频率 1/0.002=500 Hz。"
    },
    {
      "id": "v19-q22",
      "chapter": 8,
      "level": "基础",
      "question": "ADC 的主要作用是？",
      "options": [
        "数字转模拟",
        "模拟转数字",
        "存储电能"
      ],
      "correct": 1,
      "why": "ADC 将模拟输入映射成数字码。"
    },
    {
      "id": "v19-q23",
      "chapter": 8,
      "level": "进阶",
      "question": "理想 10 位 ADC 的离散输出码值有多少种？",
      "options": [
        "1023",
        "1024",
        "2048"
      ],
      "correct": 1,
      "why": "2¹⁰=1024 种，码值 0～1023。"
    },
    {
      "id": "v19-q24",
      "chapter": 8,
      "level": "应用",
      "question": "10 位理想单极性 ADC，Vref=3.3 V，Vin=1.65 V，按向下取整约定输出码值？",
      "options": [
        "256",
        "512",
        "1023"
      ],
      "correct": 1,
      "why": "步长为 3.3/1024 V，1.65 V 对应第 512 码。"
    }
  ]
};})(typeof window!=='undefined'?window:globalThis);
