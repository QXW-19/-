
/* ==================== 第七章 · 555 多谐振荡器 ==================== */
(function(){
  var cv = document.getElementById("neCanvas"), sv = document.getElementById("neSvg");
  if (!cv || !sv) return;

  var VCC = 5, P = { R1: 10, R2: 20, C: 0.30 };
  var t = 0, last = 0, running = true, raf = null, lastPhase = -1;

  function T1(){ return 0.7 * (P.R1 + P.R2) * P.C; }   // ms
  function T2(){ return 0.7 * P.R2 * P.C; }             // ms

  function fmt(ms){
    if (ms >= 1) return ms.toFixed(2) + " ms";
    return (ms * 1000).toFixed(0) + " μs";
  }

  function drawSchematic(charging){
    var o = [];
    o.push('<line x1="60" y1="24" x2="200" y2="24" stroke="#475569" stroke-width="2.6"/>');
    o.push('<text x="54" y="28" font-size="11.5" font-weight="700" fill="#475569" text-anchor="end">V CC</text>');

    // 充电路径 / 放电路径
    o.push('<path d="M90 24 L90 208" fill="none" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" opacity="' + (charging ? ".26" : "0") + '"/>');
    o.push('<path d="M90 208 L90 110 L226 110" fill="none" stroke="#0ea5a4" stroke-width="10" stroke-linecap="round" opacity="' + (charging ? "0" : ".26") + '"/>');

    // R1
    o.push('<line x1="90" y1="24" x2="90" y2="42" stroke="#475569" stroke-width="2.2"/>');
    o.push('<rect x="77" y="42" width="26" height="52" rx="4" fill="#fff" stroke="#475569" stroke-width="2"/>');
    o.push('<text x="112" y="72" font-size="12" font-weight="700" fill="#475569">R₁</text>');
    o.push('<line x1="90" y1="94" x2="90" y2="112" stroke="#475569" stroke-width="2.2"/>');

    // R2
    o.push('<rect x="77" y="112" width="26" height="52" rx="4" fill="#fff" stroke="#475569" stroke-width="2"/>');
    o.push('<text x="112" y="142" font-size="12" font-weight="700" fill="#475569">R₂</text>');
    o.push('<line x1="90" y1="164" x2="90" y2="196" stroke="#475569" stroke-width="2.2"/>');

    // 电容
    o.push('<line x1="72" y1="196" x2="108" y2="196" stroke="#475569" stroke-width="3"/>');
    o.push('<line x1="72" y1="208" x2="108" y2="208" stroke="#475569" stroke-width="3"/>');
    o.push('<text x="112" y="206" font-size="12" font-weight="700" fill="#475569">C</text>');
    o.push('<line x1="90" y1="208" x2="90" y2="252" stroke="#475569" stroke-width="2.2"/>');
    o.push('<line x1="74" y1="252" x2="106" y2="252" stroke="#475569" stroke-width="2.6"/>');
    o.push('<line x1="80" y1="258" x2="100" y2="258" stroke="#475569" stroke-width="2.2"/>');
    o.push('<line x1="86" y1="264" x2="94" y2="264" stroke="#475569" stroke-width="2"/>');

    // 555
    o.push('<rect x="226" y="70" width="132" height="140" rx="8" fill="#f8fafc" stroke="#475569" stroke-width="2"/>');
    o.push('<text x="292" y="130" font-size="15" font-weight="800" fill="#475569" text-anchor="middle">555</text>');
    o.push('<text x="292" y="150" font-size="10" fill="#8b9bb4" text-anchor="middle">定时器</text>');
    o.push('<line x1="90" y1="110" x2="226" y2="110" stroke="#475569" stroke-width="2.2"/>');
    o.push('<circle cx="90" cy="110" r="3.6" fill="#475569"/>');
    o.push('<text x="160" y="102" font-size="11" fill="#8b9bb4" text-anchor="middle">⑦ 放电端</text>');
    o.push('<line x1="90" y1="196" x2="226" y2="196" stroke="#475569" stroke-width="2.2"/>');
    o.push('<circle cx="90" cy="196" r="3.6" fill="#475569"/>');
    o.push('<text x="160" y="216" font-size="11" fill="#8b9bb4" text-anchor="middle">②⑥ 阈值 / 触发</text>');

    // 输出
    o.push('<line x1="358" y1="140" x2="400" y2="140" stroke="#0ea5a4" stroke-width="2.6"/>');
    o.push('<text x="406" y="145" font-size="13" font-weight="800" fill="#0ea5a4">v O</text>');

    o.push('<text x="210" y="290" font-size="11.5" fill="' + (charging ? "#b45309" : "#0f766e") + '" text-anchor="middle">' +
           (charging ? "充电：V CC → R₁ → R₂ → C" : "放电：C → R₂ → ⑦ → 内部放电管 → 地") + '</text>');
    sv.innerHTML = o.join("");
  }

  function vc(ph){
    var a = T1(), b = T2(), T = a + b;
    var tau1 = a / Math.LN2, tau2 = b / Math.LN2;
    if (ph < a) return VCC - (VCC - VCC / 3) * Math.exp(-ph / tau1);
    return (2 * VCC / 3) * Math.exp(-(ph - a) / tau2);
  }
  function vo(ph){ return ph < T1() ? 1 : 0; }

  function draw(){
    var ctx = cv.getContext("2d");
    var W = cv.width, H = cv.height;
    var L = 52, R = 26;
    var V_TOP = 80, V_BOT = 214;                 // vC 的 0~VCC 映射区间
    var a = T1(), b = T2(), T = a + b;
    var span = T * 2;
    var X = function(tt){ return L + tt / span * (W - L - R); };
    var Y = function(v){ return V_BOT - (v / VCC) * (V_BOT - V_TOP); };

    ctx.clearRect(0, 0, W, H);
    // 阈值线
    [[VCC, "#e2e8f0", "V CC"], [VCC * 2 / 3, "#f59e0b", "2/3"], [VCC / 3, "#f59e0b", "1/3"], [0, "#e2e8f0", "0"]].forEach(function(l){
      ctx.beginPath(); ctx.moveTo(L, Y(l[0])); ctx.lineTo(W - R, Y(l[0]));
      ctx.strokeStyle = l[1]; ctx.lineWidth = 1;
      ctx.setLineDash(l[1] === "#f59e0b" ? [4, 4] : []);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(l[2], L - 6, Y(l[0]) + 3);
    });

    // vC 曲线
    ctx.beginPath();
    for (var i = 0; i <= 400; i++){
      var tt = span * i / 400, ph = tt % T;
      var x = X(tt), y = Y(vc(ph));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#0ea5a4"; ctx.lineWidth = 2.4; ctx.stroke();

    // vO 方波
    ctx.beginPath();
    for (var j = 0; j <= 400; j++){
      var t2 = span * j / 400, ph2 = t2 % T;
      var x2 = X(t2), y2 = vo(ph2) ? 46 : 64;
      if (j === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2; ctx.stroke();

    // 当前游标
    var phc = t % T, xc = X(t), yc = Y(vc(phc));
    ctx.beginPath(); ctx.arc(xc, yc, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#0ea5a4"; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = "#475569"; ctx.font = "11.5px sans-serif"; ctx.textAlign = "left";
    ctx.strokeStyle = "#0ea5a4"; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(W - R - 106, 22); ctx.lineTo(W - R - 86, 22); ctx.stroke();
    ctx.fillStyle = "#0f766e"; ctx.fillText("v C", W - R - 80, 26);
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W - R - 44, 22); ctx.lineTo(W - R - 24, 22); ctx.stroke();
    ctx.fillStyle = "#b45309"; ctx.fillText("v O", W - R - 18, 26);
    ctx.fillStyle = "#b3c0d1"; ctx.textAlign = "right";
    ctx.fillText("时间 →（横轴按 T 自动缩放）", W - R, H - 8);

    var nowCharging = phc < a;
    if ((nowCharging ? 1 : 0) !== lastPhase){ lastPhase = nowCharging ? 1 : 0; drawSchematic(nowCharging); }
  }

  function loop(ts){
    var host = document.getElementById("m7");
    if (!host || !host.classList.contains("active")){ raf = null; last = 0; return; }
    if (!last) last = ts;
    var dt = Math.min(ts - last, 60); last = ts;
    if (running){ t += dt * 0.0016 * 2; }   // 一个完整窗口约 2.5 s
    draw();
    raf = requestAnimationFrame(loop);
  }
  function startLoop(){ if (!raf){ last = 0; raf = requestAnimationFrame(loop); } }
  window.onShow_m7 = startLoop;

  function numbers(){
    var a = T1(), b = T2(), T = a + b;
    document.getElementById("neT1").textContent = fmt(a);
    document.getElementById("neT2").textContent = fmt(b);
    var fhz = 1000 / T;
    document.getElementById("neF").textContent = fhz >= 1000 ? (fhz / 1000).toFixed(2) + " kHz" : fhz.toFixed(1) + " Hz";
    document.getElementById("neQ").textContent = (a / T * 100).toFixed(1) + " %";
    document.getElementById("neR1v").textContent = P.R1 + " kΩ";
    document.getElementById("neR2v").textContent = P.R2 + " kΩ";
    document.getElementById("neCv").textContent = P.C.toFixed(2) + " μF";
    if (P.R2 <= 2){
      document.getElementById("neNarr").innerHTML = "R₂ 很小 → 放电很快 → <b>占空比逼近 100%</b>，输出几乎一直是高电平。这也说明为什么普通 555 振荡器做不出 50% 以下的占空比。";
    } else {
      document.getElementById("neNarr").innerHTML = "T₁ 走 R₁+R₂，T₂ 只走 R₂，所以 <b>T₁ 恒大于 T₂</b>，占空比永远 > 50%。";
    }
  }

  function bind(id, key, factor){
    document.getElementById(id).addEventListener("input", function(){
      P[key] = +this.value * factor;
      numbers(); draw();
    });
  }
  bind("neR1", "R1", 1);
  bind("neR2", "R2", 1);
  document.getElementById("neC").addEventListener("input", function(){
    P.C = +this.value / 100; numbers(); draw();
  });

  document.getElementById("nePause").addEventListener("click", function(){
    running = !running;
    this.textContent = running ? "⏸ 暂停" : "▶ 继续";
  });

  numbers();
  drawSchematic(true);
  startLoop();
})();
