
/* ==================== 第四章 · 竞争-冒险 ==================== */
(function(){
  var cs = document.getElementById("raceSvg"), ws = document.getElementById("raceWave");
  if (!cs || !ws) return;

  var ST = { dir: "down", delay: 16, fix: false };

  function gate(x, y, w, h, label, accent){
    var c = accent ? "#e8552f" : "#475569";
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="#fff" stroke="' + c + '" stroke-width="2"/>' +
           '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 1) + '" font-size="15" font-weight="700" fill="' + c + '" text-anchor="middle" dominant-baseline="middle">' + label + '</text>';
  }
  function box(x, y, w, h, label){
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.6"/>' +
           '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 1) + '" font-size="12" font-weight="700" fill="#475569" text-anchor="middle" dominant-baseline="middle">' + label + '</text>';
  }

  function drawCircuit(){
    var o = [];
    o.push('<text x="14" y="20" font-size="11" fill="#8b9bb4">IEC 逻辑符号（GB/T 4728）</text>');

    // 输入 A
    o.push(box(8, 138, 38, 24, "A"));
    o.push('<line x1="46" y1="150" x2="60" y2="150" stroke="#e8552f" stroke-width="2.2"/>');
    // A 主干
    o.push('<line x1="60" y1="77" x2="60" y2="201" stroke="#e8552f" stroke-width="2.2"/>');
    o.push('<circle cx="60" cy="150" r="3.6" fill="#e8552f"/>');
    // 上支路
    o.push('<line x1="60" y1="77" x2="186" y2="77" stroke="#e8552f" stroke-width="2.2"/>');
    // 下支路 → 非门
    o.push('<line x1="60" y1="201" x2="100" y2="201" stroke="#e8552f" stroke-width="2.2"/>');
    o.push(gate(100, 183, 40, 36, "1", false));
    o.push('<circle cx="143" cy="201" r="3.2" fill="#fff" stroke="#475569" stroke-width="2"/>');
    o.push('<line x1="146" y1="201" x2="186" y2="201" stroke="#475569" stroke-width="2.2"/>');

    // 常量 1
    o.push(box(146, 86, 28, 26, "1"));
    o.push('<line x1="174" y1="99" x2="186" y2="99" stroke="#cbd5e1" stroke-width="2"/>');
    o.push(box(146, 210, 28, 26, "1"));
    o.push('<line x1="174" y1="223" x2="186" y2="223" stroke="#cbd5e1" stroke-width="2"/>');

    // 与门
    o.push(gate(186, 66, 48, 46, "&amp;", false));
    o.push(gate(186, 190, 48, 46, "&amp;", false));
    o.push('<text x="262" y="60" font-size="11" fill="#8b9bb4">AB</text>');
    o.push('<text x="262" y="252" font-size="11" fill="#8b9bb4">A′C</text>');

    // 到或门
    o.push('<line x1="234" y1="89" x2="272" y2="89" stroke="#475569" stroke-width="2.2"/>');
    o.push('<line x1="272" y1="89" x2="272" y2="139" stroke="#475569" stroke-width="2.2"/>');
    o.push('<line x1="272" y1="139" x2="326" y2="139" stroke="#475569" stroke-width="2.2"/>');
    o.push('<line x1="234" y1="213" x2="272" y2="213" stroke="#475569" stroke-width="2.2"/>');
    o.push('<line x1="272" y1="213" x2="272" y2="161" stroke="#475569" stroke-width="2.2"/>');
    o.push('<line x1="272" y1="161" x2="326" y2="161" stroke="#475569" stroke-width="2.2"/>');

    // 或门
    o.push(gate(326, 127, 48, 46, "≥1", false));
    o.push('<line x1="374" y1="150" x2="432" y2="150" stroke="#0ea5a4" stroke-width="2.6"/>');
    o.push('<text x="440" y="155" font-size="15" font-weight="800" fill="#0ea5a4">Y</text>');

    if (ST.fix){
      o.push('<rect x="256" y="252" width="150" height="34" rx="8" fill="#fff8ec" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="5 3"/>');
      o.push('<text x="331" y="273" font-size="12" font-weight="700" fill="#b45309" text-anchor="middle">冗余项 BC → 或门</text>');
    }
    cs.innerHTML = o.join("");
  }

  function drawWave(){
    var W = 620, L = 66, R = 34, tMax = 100;
    var X = function(t){ return L + t * (W - L - R) / tMax; };
    var rows = [
      { n: "A",  c: "#e8552f" },
      { n: "A′", c: "#e8552f" },
      { n: "AB", c: "#475569" },
      { n: "A′C", c: "#475569" },
      { n: "Y",  c: "#0ea5a4" }
    ];
    var sigH = 22, base0 = 46, gap = 40;
    var te = 36, td = te + ST.delay;
    var down = ST.dir === "down";

    var f = {
      A:  function(t){ return down ? t < te : t >= te; },
      Ap: function(t){ return down ? t >= td : t < td; },   // A′ 是 A 的反相延迟
      AB: function(t){ return down ? t < te : t >= te; },   // B = 1，AB 跟随 A
      ApC:function(t){ return down ? t >= td : t < td; },   // C = 1，A′C 跟随 A′
      Y:  function(t){
        if (ST.fix) return true;
        var a = down ? t < te : t >= te;
        var ap = down ? t >= td : t < td;
        return a || ap;
      }
    };
    var keys = ["A", "Ap", "AB", "ApC", "Y"];

    var o = [];
    // 跳变时刻与延迟带
    o.push('<rect x="' + X(te) + '" y="10" width="' + (X(td) - X(te)) + '" height="' + (base0 + 4 * gap + 16) + '" fill="#fef3c7" opacity=".75"/>');
    o.push('<line x1="' + X(te) + '" y1="10" x2="' + X(te) + '" y2="' + (base0 + 4 * gap + 16) + '" stroke="#f59e0b" stroke-width="1.4" stroke-dasharray="4 3"/>');
    o.push('<line x1="' + X(td) + '" y1="10" x2="' + X(td) + '" y2="' + (base0 + 4 * gap + 16) + '" stroke="#f59e0b" stroke-width="1.4" stroke-dasharray="4 3"/>');
    o.push('<text x="' + ((X(te) + X(td)) / 2) + '" y="24" font-size="10.5" fill="#b45309" text-anchor="middle">Δt</text>');

    rows.forEach(function(r, i){
      var by = base0 + i * gap;
      o.push('<line x1="' + L + '" y1="' + by + '" x2="' + (W - R) + '" y2="' + by + '" stroke="#f1f5f9"/>');
      o.push('<text x="' + (L - 10) + '" y="' + (by - sigH / 2 + 1) + '" font-size="12" font-weight="700" fill="' + r.c + '" text-anchor="end">' + r.n + '</text>');

      var pts = [], prev = null, k = keys[i];
      for (var t = 0; t <= tMax; t += 0.4){
        var y = f[k](t) ? by - sigH : by;
        if (prev === null) pts.push([X(t), y]);
        else if (y !== prev){ pts.push([X(t), prev]); pts.push([X(t), y]); }
        prev = y;
      }
      pts.push([X(tMax), prev]);
      o.push('<polyline points="' + pts.map(function(p){ return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") +
             '" fill="none" stroke="' + r.c + '" stroke-width="2.4"/>');
    });

    // 毛刺标注
    if (!ST.fix && down){
      var gy = base0 + 4 * gap;
      o.push('<rect x="' + X(te) + '" y="' + (gy - sigH - 4) + '" width="' + (X(td) - X(te)) + '" height="' + (sigH + 10) + '" fill="none" stroke="#b91c1c" stroke-width="1.8" rx="4"/>');
      o.push('<text x="' + ((X(te) + X(td)) / 2) + '" y="' + (gy + 16) + '" font-size="11" font-weight="700" fill="#b91c1c" text-anchor="middle">毛刺</text>');
    }
    ws.innerHTML = o.join("");
  }

  function narrate(){
    var el = document.getElementById("rcResult");
    var nb = document.getElementById("rcNarr");
    var glitch = (!ST.fix && ST.dir === "down");
    if (ST.fix){
      el.textContent = "Y 恒为 1，毛刺消除";
      el.style.color = "#0ea5a4";
      nb.innerHTML = "加上冗余项 BC 后，B=C=1 使 BC 恒为 1，<b>在 A 跳变的整个空档里把或门顶住</b>，Y 不再掉下去。代价是多一个与门。";
    } else if (glitch){
      el.textContent = "出现负向毛刺（宽 Δt）";
      el.style.color = "#b91c1c";
      nb.innerHTML = "A 从 1 跳到 0：上支路立刻把 AB 拉低，而下支路的 A′ 要等 <b>Δt</b> 才升起来。这段空档里或门两个输入都是 0，<b>Y 掉下去</b>。";
    } else {
      el.textContent = "没有毛刺";
      el.style.color = "#0ea5a4";
      nb.innerHTML = "A 从 0 跳到 1：上支路的 AB 先升为 1，<b>把或门直接顶住</b>；等 A′ 慢慢降下来时，Y 早已稳定。所以这个方向看不到毛刺。";
    }
    document.getElementById("rcDelayVal").textContent = ST.delay;
  }

  function render(){ drawCircuit(); drawWave(); narrate(); }

  document.getElementById("rcDown").addEventListener("click", function(){
    ST.dir = "down"; this.setAttribute("aria-pressed", "true");
    document.getElementById("rcUp").setAttribute("aria-pressed", "false"); render();
  });
  document.getElementById("rcUp").addEventListener("click", function(){
    ST.dir = "up"; this.setAttribute("aria-pressed", "true");
    document.getElementById("rcDown").setAttribute("aria-pressed", "false"); render();
  });
  document.getElementById("rcDelay").addEventListener("input", function(){
    ST.delay = +this.value; render();
  });
  document.getElementById("rcFix").addEventListener("click", function(){
    ST.fix = !ST.fix; this.setAttribute("aria-pressed", String(ST.fix));
    this.textContent = ST.fix ? "去掉冗余项 BC" : "加入冗余项 BC";
    render();
  });

  render();
})();
