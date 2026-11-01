
/* ==================== 第五章 · 触发器采样窗口 ==================== */
(function(){
  var mech = document.getElementById("ffMech"), wave = document.getElementById("ffWave");
  if (!mech || !wave) return;

  var S = { mode: "level", clk: 0, d: 0, q: 0, hist: [{ clk: 0, d: 0, q: 0, rise: false }], flips: 0 };
  var pulseOn = false, pulseTimer = null, demoTimer = null, demoIdx = 0, demoOn = false;
  var SCRIPT = [{ t: "d", v: 1 }, { t: "clk", v: 1 }, { t: "d", v: 0 }, { t: "d", v: 1 }, { t: "clk", v: 0 }];

  function gateOpen(){ return S.mode === "level" ? S.clk === 1 : pulseOn; }

  function drawMech(){
    var open = gateOpen();
    var o = [];
    o.push('<path d="M108 150 H200" stroke="#9aa9bf" stroke-width="2.4" fill="none"/>');
    o.push('<path d="M272 150 H332" stroke="#9aa9bf" stroke-width="2.4" fill="none"/>');
    o.push('<path d="M500 122 H530" stroke="#9aa9bf" stroke-width="2.4" fill="none"/>');
    o.push('<path d="M500 178 H530" stroke="#9aa9bf" stroke-width="2.4" fill="none"/>');

    if (open) o.push('<rect x="198" y="92" width="76" height="116" rx="8" fill="#f59e0b" opacity=".22"/>');
    var shift = open ? 30 : 0;
    o.push('<rect x="' + (209 - shift) + '" y="88" width="11" height="124" rx="5" fill="' + (open ? "#f59e0b" : "#5b6b82") + '"/>');
    o.push('<rect x="' + (252 + shift) + '" y="88" width="11" height="124" rx="5" fill="' + (open ? "#f59e0b" : "#5b6b82") + '"/>');
    o.push('<text x="236" y="70" font-size="13" font-weight="700" fill="' + (open ? "#b45309" : "#475569") + '" text-anchor="middle">采样门（' + (open ? "开" : "关") + '）</text>');

    // CLK
    o.push('<path d="M236 254 V212" stroke="#b7c2d3" stroke-width="2" stroke-dasharray="5 4" fill="none"/>');
    o.push('<rect x="196" y="256" width="80" height="32" rx="8" fill="#fff" stroke="#cbd5e1" stroke-width="1.6"/>');
    o.push('<text x="236" y="277" font-size="13" font-weight="700" fill="#475569" text-anchor="middle">CLK ' + S.clk + '</text>');

    // D
    o.push('<rect x="20" y="110" width="88" height="80" rx="14" fill="#fff" stroke="#e8552f" stroke-width="2.2"/>');
    o.push('<text x="64" y="136" font-size="13" font-weight="600" fill="#8b9bb4" text-anchor="middle">D</text>');
    o.push('<text x="64" y="172" font-size="30" font-weight="800" fill="#e8552f" text-anchor="middle">' + S.d + '</text>');

    // 存储环
    o.push('<rect x="332" y="88" width="168" height="124" rx="16" fill="#f0fdfa" stroke="#0ea5a4" stroke-width="2"/>');
    o.push('<text x="416" y="141" font-size="16" font-weight="800" fill="#0f766e" text-anchor="middle">存储环</text>');
    o.push('<text x="416" y="166" font-size="11.5" fill="#5e8f8c" text-anchor="middle">双稳态反馈</text>');

    // Q / Q'
    o.push('<circle cx="554" cy="122" r="24" fill="#fff" stroke="#0ea5a4" stroke-width="2.4"/>');
    o.push('<text x="554" y="123" font-size="24" font-weight="800" fill="#0ea5a4" text-anchor="middle" dominant-baseline="middle">' + S.q + '</text>');
    o.push('<text x="586" y="123" font-size="13" font-weight="700" fill="#475569">Q</text>');
    o.push('<circle cx="554" cy="178" r="24" fill="#f8fafc" stroke="#b9c6d6" stroke-width="2"/>');
    o.push('<text x="554" y="179" font-size="20" font-weight="700" fill="#64748b" text-anchor="middle" dominant-baseline="middle">' + (S.q ? 0 : 1) + '</text>');
    o.push('<text x="586" y="179" font-size="13" font-weight="700" fill="#475569">Q′</text>');

    mech.innerHTML = o.join("");
  }

  function drawWave(){
    var n = S.hist.length;
    var slotW = Math.max(15, Math.min(42, Math.floor(840 / Math.max(n, 1))));
    var x0 = 62, totalW = Math.max(680, x0 + n * slotW + 30);
    wave.setAttribute("viewBox", "0 0 " + totalW + " 210");
    wave.setAttribute("width", totalW);

    var rows = [{ n: "CLK", k: "clk", c: "#475569" }, { n: "D", k: "d", c: "#e8552f" }, { n: "Q", k: "q", c: "#0ea5a4" }];
    var sigH = 30, base0 = 54, gap = 62;
    var o = [];

    for (var i = 0; i < n; i++){
      var st = S.hist[i], wx = x0 + i * slotW, bandH = base0 + 2 * gap + 14;
      if (S.mode === "level" && st.clk === 1){
        o.push('<rect x="' + wx + '" y="4" width="' + slotW + '" height="' + bandH + '" fill="#f59e0b" opacity=".13"/>');
      } else if (S.mode === "edge" && st.rise){
        o.push('<rect x="' + (wx - 4) + '" y="4" width="9" height="' + bandH + '" fill="#f59e0b" opacity=".55"/>');
      }
    }
    for (var g = 0; g <= n; g++){
      o.push('<line x1="' + (x0 + g * slotW) + '" y1="10" x2="' + (x0 + g * slotW) + '" y2="' + (base0 + 2 * gap + 10) + '" stroke="#eef2f7"/>');
    }
    rows.forEach(function(r, i){
      var by = base0 + i * gap;
      o.push('<line x1="' + x0 + '" y1="' + by + '" x2="' + (x0 + n * slotW) + '" y2="' + by + '" stroke="#f1f5f9"/>');
      o.push('<text x="46" y="' + (by - sigH / 2 + 1) + '" font-size="13" font-weight="700" fill="' + r.c + '" text-anchor="end">' + r.n + '</text>');
      var pts = [], prev = null;
      for (var k = 0; k < n; k++){
        var y = S.hist[k][r.k] ? by - sigH : by;
        var xa = x0 + k * slotW, xb = xa + slotW;
        if (prev === null) pts.push([xa, y]);
        else if (y !== prev){ pts.push([xa, prev]); pts.push([xa, y]); }
        pts.push([xb, y]); prev = y;
      }
      o.push('<polyline points="' + pts.map(function(p){ return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") +
             '" fill="none" stroke="' + r.c + '" stroke-width="2.6"/>');
    });
    var qLow = base0 + 2 * gap;
    for (var m = 1; m < n; m++){
      if (S.hist[m].q !== S.hist[m - 1].q){
        var mx = x0 + m * slotW, my = S.hist[m].q ? (qLow - sigH - 9) : (qLow + 9);
        o.push('<polygon points="' + (mx - 5) + ',' + (my + 5) + ' ' + (mx + 5) + ',' + (my + 5) + ' ' + mx + ',' + (my - 4) + '" fill="#f59e0b"/>');
      }
    }
    if (n <= 3){
      o.push('<text x="300" y="92" font-size="13" fill="#a9b7ca">← 拨动右侧的 CLK 和 D</text>');
      o.push('<text x="300" y="116" font-size="13" fill="#a9b7ca">三路波形会一格格长出来</text>');
    }
    wave.innerHTML = o.join("");
  }

  function readout(){
    document.getElementById("ffFlips").textContent = S.flips + " 次";
    document.getElementById("ffGate").textContent = gateOpen() ? "开" : "关";
    document.getElementById("ffClk").textContent = "CLK = " + S.clk + (S.clk ? " · 高" : " · 低");
    document.getElementById("ffD").textContent = "D = " + S.d;
    var nb = document.getElementById("ffNarr"), s = "";
    if (S.mode === "level"){
      s = S.clk === 1
        ? "<b>CLK=1，门敞开。</b>此刻 D 变成什么，Q 就立刻变成什么——门开多久，D 就有多少次机会改写 Q。"
        : "<b>CLK=0，门关闭。</b>D 再怎么拨也进不去，Q 保持刚才记住的值。";
      if (S.flips >= 2) s += "<br><b style='color:#b91c1c'>⚠ 空翻：一个时钟脉冲里 Q 已经翻了 " + S.flips + " 次。</b>";
    } else {
      s = S.clk === 1
        ? "<b>上升沿已过，门关上了。</b>高电平期间 D 再怎么变，Q 都不再响应。"
        : "<b>CLK=0，等下一个上升沿。</b>这段时间 D 的变化全部作废。";
    }
    nb.innerHTML = s;
  }

  function render(){ drawMech(); drawWave(); readout(); }

  function commit(rise){
    S.hist.push({ clk: S.clk, d: S.d, q: S.q, rise: !!rise });
    if (S.hist.length > 64) S.hist.shift();
  }
  function pulse(){ pulseOn = true; clearTimeout(pulseTimer); pulseTimer = setTimeout(function(){ pulseOn = false; render(); }, 420); }

  function setD(v){
    if (S.d === v) return;
    var pq = S.q; S.d = v;
    if (S.mode === "level" && S.clk === 1) S.q = v;
    commit(false);
    if (S.q !== pq && S.clk === 1) S.flips++;
    render();
  }
  function setClk(v){
    if (S.clk === v) return;
    var pq = S.q, rise = (S.clk === 0 && v === 1);
    S.clk = v;
    if (rise){ S.flips = 0; S.q = S.d; if (S.mode === "edge") pulse(); }
    commit(rise);
    if (S.clk === 1 && S.q !== pq) S.flips++;
    render();
  }

  function stopDemo(){ clearTimeout(demoTimer); demoTimer = null; demoIdx = 0; demoOn = false; document.getElementById("ffDemo").textContent = "▶ 自动演示：高电平期间 D 变了两次"; }
  function tick(){
    if (demoIdx >= SCRIPT.length){ stopDemo(); return; }
    var s = SCRIPT[demoIdx++];
    if (s.t === "d") setD(s.v); else setClk(s.v);
    demoTimer = setTimeout(tick, 760);
  }

  document.getElementById("ffLevel").addEventListener("click", function(){
    S.mode = "level"; pulseOn = false; stopDemo();
    this.setAttribute("aria-pressed", "true"); document.getElementById("ffEdge").setAttribute("aria-pressed", "false");
    render();
  });
  document.getElementById("ffEdge").addEventListener("click", function(){
    S.mode = "edge"; pulseOn = false; stopDemo();
    this.setAttribute("aria-pressed", "true"); document.getElementById("ffLevel").setAttribute("aria-pressed", "false");
    render();
  });
  document.getElementById("ffClk").addEventListener("click", function(){ stopDemo(); setClk(S.clk ? 0 : 1); });
  document.getElementById("ffD").addEventListener("click", function(){ stopDemo(); setD(S.d ? 0 : 1); });
  document.getElementById("ffPulse").addEventListener("click", function(){
    stopDemo(); if (S.clk === 1) setClk(0);
    setTimeout(function(){ setClk(1); }, 200);
    setTimeout(function(){ setClk(0); }, 760);
  });
  document.getElementById("ffReset").addEventListener("click", function(){
    stopDemo(); S.clk = 0; S.d = 0; S.q = 0; S.flips = 0; S.hist = [{ clk: 0, d: 0, q: 0, rise: false }]; render();
  });
  document.getElementById("ffDemo").addEventListener("click", function(){
    if (demoOn){ stopDemo(); render(); return; }
    stopDemo();
    S.clk = 0; S.d = 0; S.q = 0; S.flips = 0; S.hist = [{ clk: 0, d: 0, q: 0, rise: false }];
    render();
    demoOn = true;
    document.getElementById("ffDemo").textContent = "⏸ 暂停演示";
    demoTimer = setTimeout(tick, 320);
  });

  render();
})();
