
/* ==================== 第三章 · CMOS 反相器 ==================== */
(function(){
  var svg = document.getElementById("cmosSvg");
  var vtc = document.getElementById("cmVtc");
  if (!svg || !vtc) return;

  var VDD = 5.0, VT = 1.0;          // 阈值按 0.2·VDD 取，仅作教学示意
  var ST = { vin: 0, showPath: true };

  function voutOf(vin){ return VDD / (1 + Math.exp((vin - VDD / 2) / 0.5)); }

  /* ---- 一只 MOS 管（竖放，栅极在左） ---- */
  function mos(cx, cy, type, on){
    var g = [], chColor = on ? "#f59e0b" : "#94a3b8";
    // 沟道
    g.push('<rect x="' + (cx - 2) + '" y="' + (cy - 38) + '" width="4" height="76" rx="2" fill="' + chColor + '"/>');
    // 栅极绝缘层
    g.push('<rect x="' + (cx - 9) + '" y="' + (cy - 32) + '" width="3.5" height="64" rx="1.5" fill="#475569"/>');
    // 栅极引线
    g.push('<line x1="' + (cx - 9) + '" y1="' + cy + '" x2="' + (cx - 64) + '" y2="' + cy + '" stroke="#475569" stroke-width="2.2"/>');
    // 上下引线
    g.push('<line x1="' + cx + '" y1="' + (cy - 38) + '" x2="' + (cx + 30) + '" y2="' + (cy - 38) + '" stroke="#475569" stroke-width="2.2"/>');
    g.push('<line x1="' + cx + '" y1="' + (cy + 38) + '" x2="' + (cx + 30) + '" y2="' + (cy + 38) + '" stroke="#475569" stroke-width="2.2"/>');
    // 箭头：NMOS 指向沟道，PMOS 背离沟道
    if (type === "n"){
      g.push('<polygon points="' + (cx + 4) + ',' + (cy + 38) + ' ' + (cx + 16) + ',' + (cy + 33) + ' ' + (cx + 16) + ',' + (cy + 43) + '" fill="#475569"/>');
    } else {
      g.push('<polygon points="' + (cx + 26) + ',' + (cy - 38) + ' ' + (cx + 14) + ',' + (cy - 43) + ' ' + (cx + 14) + ',' + (cy - 33) + '" fill="#475569"/>');
    }
    // 标注
    g.push('<text x="' + (cx + 40) + '" y="' + (cy - 22) + '" font-size="11.5" font-weight="700" fill="' + (on ? "#b45309" : "#94a3b8") + '">' + (type === "n" ? "NMOS" : "PMOS") + '</text>');
    g.push('<text x="' + (cx + 40) + '" y="' + (cy - 8) + '" font-size="10.5" fill="' + (on ? "#b45309" : "#b3c0d1") + '">' + (on ? "导通" : "截止") + '</text>');
    return g.join("");
  }

  function draw(vin){
    var vo = voutOf(vin);
    var nOn = vin > VT, pOn = (VDD - vin) > VT;
    var out = [];

    // 电源轨与地轨
    out.push('<line x1="200" y1="30" x2="330" y2="30" stroke="#475569" stroke-width="2.6"/>');
    out.push('<text x="196" y="26" font-size="11.5" font-weight="700" fill="#475569" text-anchor="end">V<tspan font-size="9">DD</tspan></text>');
    out.push('<line x1="200" y1="370" x2="330" y2="370" stroke="#475569" stroke-width="2.6"/>');
    out.push('<text x="196" y="374" font-size="11.5" font-weight="700" fill="#475569" text-anchor="end">GND</text>');

    // 导通电流路径（垫底）
    if (ST.showPath){
      if (pOn){
        out.push('<path d="M270 30 L270 200 L392 200" fill="none" stroke="#f59e0b" stroke-width="11" stroke-linecap="round" opacity=".2"/>');
      }
      if (nOn){
        out.push('<path d="M392 200 L270 200 L270 370" fill="none" stroke="#f59e0b" stroke-width="11" stroke-linecap="round" opacity=".2"/>');
      }
    }

    // 两只管子
    out.push(mos(240, 120, "p", pOn));
    out.push(mos(240, 280, "n", nOn));

    // 引线
    out.push('<line x1="270" y1="30" x2="270" y2="82" stroke="#475569" stroke-width="2.2"/>');
    out.push('<line x1="270" y1="158" x2="270" y2="200" stroke="#475569" stroke-width="2.2"/>');
    out.push('<line x1="270" y1="200" x2="270" y2="242" stroke="#475569" stroke-width="2.2"/>');
    out.push('<line x1="270" y1="318" x2="270" y2="370" stroke="#475569" stroke-width="2.2"/>');
    out.push('<line x1="270" y1="200" x2="392" y2="200" stroke="#475569" stroke-width="2.2"/>');
    out.push('<circle cx="270" cy="200" r="4.5" fill="#475569"/>');

    // 输入总线
    out.push('<line x1="176" y1="120" x2="176" y2="280" stroke="#475569" stroke-width="2.2"/>');
    out.push('<line x1="112" y1="200" x2="176" y2="200" stroke="#475569" stroke-width="2.2"/>');
    out.push('<circle cx="176" cy="200" r="3.8" fill="#475569"/>');
    out.push('<text x="106" y="196" font-size="11.5" font-weight="700" fill="#475569" text-anchor="end">v<tspan font-size="9">I</tspan></text>');
    out.push('<text x="106" y="218" font-size="12.5" font-weight="800" fill="#e8552f" text-anchor="end">' + vin.toFixed(2) + ' V</text>');

    // 输出
    out.push('<circle cx="392" cy="200" r="4.5" fill="#0ea5a4"/>');
    out.push('<text x="402" y="186" font-size="11.5" font-weight="700" fill="#0ea5a4">v<tspan font-size="9">O</tspan></text>');
    out.push('<text x="402" y="208" font-size="12.5" font-weight="800" fill="#0ea5a4">' + vo.toFixed(2) + ' V</text>');

    svg.innerHTML = out.join("");
  }

  function drawVTC(vin){
    var W = 300, H = 222, L = 40, R = 12, T = 14, B = 46;
    var pw = W - L - R, ph = H - T - B;
    function X(v){ return L + v / VDD * pw; }
    function Y(v){ return T + (1 - v / VDD) * ph; }

    var out = [];
    // 区域底色
    out.push('<rect x="' + X(0) + '" y="' + T + '" width="' + (X(VT) - X(0)) + '" height="' + ph + '" fill="#eef6ff"/>');
    out.push('<rect x="' + X(VDD - VT) + '" y="' + T + '" width="' + (X(VDD) - X(VDD - VT)) + '" height="' + ph + '" fill="#eef6ff"/>');
    out.push('<rect x="' + X(VT) + '" y="' + T + '" width="' + (X(VDD - VT) - X(VT)) + '" height="' + ph + '" fill="#fdf3e3"/>');

    // 坐标轴
    out.push('<line x1="' + L + '" y1="' + (T + ph) + '" x2="' + (L + pw) + '" y2="' + (T + ph) + '" stroke="#cbd5e1" stroke-width="1.4"/>');
    out.push('<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (T + ph) + '" stroke="#cbd5e1" stroke-width="1.4"/>');

    // 曲线
    var pts = [];
    for (var i = 0; i <= 100; i++){
      var v = VDD * i / 100;
      pts.push(X(v).toFixed(1) + "," + Y(voutOf(v)).toFixed(1));
    }
    out.push('<polyline points="' + pts.join(" ") + '" fill="none" stroke="#0ea5a4" stroke-width="2.6"/>');

    // 工作点
    var px = X(vin), py = Y(voutOf(vin));
    out.push('<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + (T + ph) + '" stroke="#f59e0b" stroke-width="1.3" stroke-dasharray="3 3"/>');
    out.push('<line x1="' + L + '" y1="' + py + '" x2="' + px + '" y2="' + py + '" stroke="#f59e0b" stroke-width="1.3" stroke-dasharray="3 3"/>');
    out.push('<circle cx="' + px + '" cy="' + py + '" r="5" fill="#f59e0b" stroke="#fff" stroke-width="2"/>');

    // 标注
    out.push('<text x="' + (L + pw) + '" y="' + (T + ph + 30) + '" font-size="10.5" fill="#8b9bb4" text-anchor="end">v I →</text>');
    out.push('<text x="' + (L - 6) + '" y="' + (T + 4) + '" font-size="10.5" fill="#8b9bb4" text-anchor="end">V DD</text>');
    out.push('<text x="' + (L - 6) + '" y="' + (T + ph + 4) + '" font-size="10.5" fill="#8b9bb4" text-anchor="end">0</text>');
    out.push('<text x="' + X(VT) + '" y="' + (T + ph + 17) + '" font-size="9.5" fill="#7c93b0" text-anchor="middle">V TN</text>');
    out.push('<text x="' + X(VDD - VT) + '" y="' + (T + ph + 17) + '" font-size="9.5" fill="#7c93b0" text-anchor="middle">V DD−|V TP|</text>');

    vtc.innerHTML = out.join("");
  }

  function narrate(vin){
    var nOn = vin > VT, pOn = (VDD - vin) > VT;
    var el = document.getElementById("cmNarr");
    var reg = document.getElementById("cmRegion");
    var box = document.getElementById("cmVout");
    box.textContent = voutOf(vin).toFixed(2) + " V";

    if (pOn && !nOn){
      reg.textContent = "上管导通区";
      el.innerHTML = "v<sub>I</sub> 低：<b>PMOS 导通、NMOS 截止</b>。输出通过上管接到 V<sub>DD</sub>，v<sub>O</sub> 为高电平。下管断路，所以没有 V<sub>DD</sub>→地 的直流电流。";
    } else if (!pOn && nOn){
      reg.textContent = "下管导通区";
      el.innerHTML = "v<sub>I</sub> 高：<b>NMOS 导通、PMOS 截止</b>。输出通过下管接到地，v<sub>O</sub> 为低电平。上管断路，同样没有直流通路。";
    } else {
      reg.textContent = "转折区";
      el.innerHTML = "两只管子<b>同时导通</b>，输出处于高、低之间的过渡段。此时 V<sub>DD</sub> 到地有瞬时电流，功耗上升——所以数字电路要避免让输入长期停在转折区。";
    }
  }

  function render(){
    draw(ST.vin);
    drawVTC(ST.vin);
    narrate(ST.vin);
    document.getElementById("cmVinVal").textContent = ST.vin.toFixed(2) + " V";
    document.getElementById("cmLo").setAttribute("aria-pressed", String(ST.vin < 0.05));
    document.getElementById("cmHi").setAttribute("aria-pressed", String(ST.vin > VDD - 0.05));
  }

  document.getElementById("cmVin").addEventListener("input", function(){
    ST.vin = +this.value; render();
  });
  document.getElementById("cmLo").addEventListener("click", function(){
    ST.vin = 0; document.getElementById("cmVin").value = 0; render();
  });
  document.getElementById("cmHi").addEventListener("click", function(){
    ST.vin = VDD; document.getElementById("cmVin").value = VDD; render();
  });
  document.getElementById("cmPath").addEventListener("click", function(){
    ST.showPath = !ST.showPath;
    this.setAttribute("aria-pressed", String(ST.showPath));
    render();
  });

  render();
})();
