
/* ==================== 目录与导航 ==================== */
var BOOK = [
  { ch:"第一章 数制和码制", items:[
    { id:"c1", t:"精讲｜数制和码制" },
    { id:"g6", t:"速查｜数制与五种编码" },
    { id:"m1", t:"互动｜补码：减法变加法" },
    { id:"n1", t:"互动｜格雷码：相邻只差一位" },
    { id:"x1", t:"习题｜第一章" }
  ]},
  { ch:"第二章 逻辑代数基础", items:[
    { id:"c2", t:"精讲｜逻辑代数基础" },
    { id:"g7", t:"速查｜公式·三规则·最小项" },
    { id:"m2", t:"互动｜卡诺图：圈得越大项越短" },
    { id:"n2", t:"互动｜波形图 ↔ 真值表" },
    { id:"x2", t:"习题｜第二章" }
  ]},
  { ch:"第三章 门电路", items:[
    { id:"c3", t:"精讲｜门电路" },
    { id:"g1", t:"速查｜八种门的符号与真值表" },
    { id:"m3", t:"互动｜CMOS 反相器与传输特性" },
    { id:"n3", t:"互动｜三态门与总线" },
    { id:"x3", t:"习题｜第三章" }
  ]},
  { ch:"第四章 组合逻辑电路", items:[
    { id:"c4", t:"精讲｜组合逻辑电路" },
    { id:"g2", t:"速查｜74LS138 与 74LS151" },
    { id:"m4", t:"互动｜竞争-冒险：毛刺从哪来" },
    { id:"n4", t:"互动｜超前进位：不用等前一级" },
    { id:"x4", t:"习题｜第四章" }
  ]},
  { ch:"第五章 半导体存储电路", items:[
    { id:"c5", t:"精讲｜半导体存储电路" },
    { id:"g3", t:"速查｜74LS194 四种模式" },
    { id:"m5", t:"互动｜触发器的采样窗口" },
    { id:"n5", t:"互动｜SR 锁存器的双稳态" },
    { id:"n10", t:"互动｜存储器扩展：拼字长与拼容量" },
    { id:"x5", t:"习题｜第五章" }
  ]},
  { ch:"第六章 时序逻辑电路", items:[
    { id:"c6", t:"精讲｜时序逻辑电路" },
    { id:"g4", t:"速查｜74160/74161 与任意进制" },
    { id:"m6", t:"互动｜状态表·状态图·时序图" },
    { id:"n6", t:"互动｜任意进制计数器" },
    { id:"n11", t:"互动｜时序设计四步" },
    { id:"n9", t:"互动｜序列发生器与节拍分配器" },
    { id:"x6", t:"习题｜第六章" }
  ]},
  { ch:"第七章 脉冲波形的产生和整形", items:[
    { id:"c7", t:"精讲｜脉冲波形的产生和整形" },
    { id:"g5", t:"速查｜555 的五种接法" },
    { id:"m7", t:"互动｜555 多谐振荡器" },
    { id:"n7", t:"互动｜施密特触发器的滞回" },
    { id:"x7", t:"习题｜第七章" }
  ]},
  { ch:"第八章 数-模和模-数转换", items:[
    { id:"c8", t:"精讲｜数-模和模-数转换" },
    { id:"g8", t:"速查｜ADC/DAC 指标与选型" },
    { id:"m8", t:"互动｜逐次逼近型 ADC" },
    { id:"n8", t:"互动｜倒 T 型 R-2R 网络" },
    { id:"x8", t:"习题｜第八章" }
  ]},
  { ch:"附录 · 教师用", items:[
    { id:"t1", t:"速查讲义（一页 16 讲）" },
    { id:"t2", t:"精读讲义（每讲一页）" }
  ]},
  { ch:"综合冲刺 · 考研大题", items:[
    { id:"z1", t:"跨章综合大题（5 题）" }
  ]},
  { ch:"3D 沉浸", items:[
    { id:"w1", t:"数字之城（全书地图）" },
    { id:"w2", t:"时序流水线（第六章）" },
    { id:"w3", t:"CMOS 剖面（第三章）" },
    { id:"w4", t:"555 振荡器（第七章）" },
    { id:"w5", t:"R-2R 梯子（第八章）" }
  ]}
];

(function buildNav(){
  var nav = document.getElementById("nav");
  var html = "";
  BOOK.forEach(function(ch){
    html += '<div class="chap"><div class="chap-h">' + ch.ch + '</div>';
    ch.items.forEach(function(it){
      if (it.live === false){
        html += '<div class="nav-item off">' + it.t + ' <span style="font-size:10px;opacity:.7">·后续</span></div>';
      } else {
        html += '<div class="nav-item" data-mod="' + it.id + '"><span class="dot"></span><span>' + it.t + '</span></div>';
      }
    });
    html += '</div>';
  });
  nav.innerHTML = html;

  nav.addEventListener("click", function(e){
    var el = e.target.closest(".nav-item[data-mod]");
    if (!el) return;
    show(el.getAttribute("data-mod"));
  });
})();

function show(id){
  var mods = document.querySelectorAll(".mod");
  for (var i = 0; i < mods.length; i++){
    mods[i].classList.toggle("active", mods[i].id === id);
  }
  var items = document.querySelectorAll(".nav-item[data-mod]");
  for (var j = 0; j < items.length; j++){
    items[j].classList.toggle("active", items[j].getAttribute("data-mod") === id);
  }
  if (typeof window["onShow_" + id] === "function") window["onShow_" + id]();
  window.scrollTo(0, 0);
  if (history.replaceState) history.replaceState(null, "", "#" + id);
}

/* 启动：优先打开地址栏里的模块 */
(function boot(){
  var first = "c1";
  var h = (location.hash || "").replace("#", "");
  if (h && document.getElementById(h)) first = h;
  show(first);
  // 浏览器自带的 hash 定位可能在 show 之后才执行，这里再归零一次
  setTimeout(function(){ window.scrollTo(0, 0); }, 0);
  window.addEventListener("load", function(){ window.scrollTo(0, 0); });
})();
