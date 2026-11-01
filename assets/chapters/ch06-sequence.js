
/* ==================== 第六章 · 状态表 / 状态图 / 时序图 ==================== */
(function(){
  var tbl = document.getElementById("stTable");
  var gph = document.getElementById("stGraph");
  var wav = document.getElementById("stWave");
  if (!tbl || !gph || !wav) return;

  var cur = 0, path = [0], autoTimer = null;
  function nxt(s){ return (s + 1) % 4; }
  function bi(s){ return ("0" + s.toString(2)).slice(-2); }
  function pt(cx, cy, r, deg){ var a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }

  function drawTable(){
    var tb = tbl.querySelector("tbody");
    var rows = "";
    for (var s = 0; s < 4; s++){
      rows += '<tr' + (s === cur ? ' class="hl"' : '') + '><td>' + bi(s) + '</td><td>' + bi(nxt(s)) + '</td><td>' + s + '</td></tr>';
    }
    tb.innerHTML = rows;
  }

  function drawGraph(){
    var cx = 150, cy = 152, r = 92;
    var o = [];
    // 边
    for (var i = 0; i < 4; i++){
      var a1 = i * 90 + 24, a2 = (i + 1) * 90 - 24;
      var p1 = pt(cx, cy, r, a1), p2 = pt(cx, cy, r, a2);
      var large = (a2 - a1) > 180 ? 1 : 0;
      var active = (i === cur);
      o.push('<path d="M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) +
             ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) +
             '" fill="none" stroke="' + (active ? "#f59e0b" : "#c3cede") + '" stroke-width="' + (active ? 3.4 : 2) + '"/>');
      var pe = pt(cx, cy, r, a2 - 2), pp = pt(cx, cy, r, a2 - 9);
      var dx = pe[0] - pp[0], dy = pe[1] - pp[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= L; dy /= L;
      var nx = -dy, ny = dx;
      o.push('<polygon points="' +
        pe[0].toFixed(1) + ',' + pe[1].toFixed(1) + ' ' +
        (pe[0] - dx * 11 + nx * 5).toFixed(1) + ',' + (pe[1] - dy * 11 + ny * 5).toFixed(1) + ' ' +
        (pe[0] - dx * 11 - nx * 5).toFixed(1) + ',' + (pe[1] - dy * 11 - ny * 5).toFixed(1) +
        '" fill="' + (active ? "#f59e0b" : "#c3cede") + '"/>');
    }
    // 状态节点
    for (var j = 0; j < 4; j++){
      var p = pt(cx, cy, r, j * 90);
      var on = (j === cur);
      o.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (on ? 25 : 22) +
             '" fill="' + (on ? "#fff8ec" : "#fff") + '" stroke="' + (on ? "#f59e0b" : "#b9c6d6") + '" stroke-width="' + (on ? 3 : 2) + '"/>');
      o.push('<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 1).toFixed(1) + '" font-size="15" font-weight="' + (on ? 800 : 700) +
             '" fill="' + (on ? "#92400e" : "#475569") + '" text-anchor="middle" dominant-baseline="middle">' + bi(j) + '</text>');
    }
    o.push('<text x="150" y="290" font-size="11.5" fill="#8b9bb4" text-anchor="middle">箭头旁的状态即"次态"</text>');
    gph.innerHTML = o.join("");
  }

  function drawWave(){
    var n = Math.max(path.length, 4);
    var CW = Math.min(80, 560 / n);
    var x0 = 66, sigH = 30, gap = 46;
    var rows = [
      { n: "CLK", c: "#475569", f: function(i){ return null; } },
      { n: "Q₁", c: "#0ea5a4", f: function(i){ return (path[i] >> 1) & 1; } },
      { n: "Q₀", c: "#0ea5a4", f: function(i){ return path[i] & 1; } }
    ];
    var o = [];
    for (var g = 0; g <= n; g++){
      o.push('<line x1="' + (x0 + g * CW) + '" y1="16" x2="' + (x0 + g * CW) + '" y2="' + (46 + 2 * gap) + '" stroke="#eef2f7"/>');
    }
    rows.forEach(function(r, ri){
      var by = 46 + ri * gap;
      o.push('<line x1="' + x0 + '" y1="' + by + '" x2="' + (x0 + n * CW) + '" y2="' + by + '" stroke="#f1f5f9"/>');
      o.push('<text x="' + (x0 - 10) + '" y="' + (by - sigH / 2 + 1) + '" font-size="12.5" font-weight="700" fill="' + r.c + '" text-anchor="end">' + r.n + '</text>');
      var pts = [];
      for (var i = 0; i < n; i++){
        if (i >= path.length) break;
        var hi = (ri === 0) ? null : r.f(i);
        var xa = x0 + i * CW, xb = xa + CW;
        if (ri === 0){
          pts.push([xa, by - sigH], [xa + CW / 2, by - sigH], [xa + CW / 2, by], [xb, by]);
        } else {
          var y = hi ? by - sigH : by;
          var prev = (i === 0) ? null : (r.f(i - 1) ? by - sigH : by);
          if (prev === null) pts.push([xa, y]);
          else if (prev !== y){ pts.push([xa, prev], [xa, y]); }
          pts.push([xb, y]);
        }
      }
      o.push('<polyline points="' + pts.map(function(p){ return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") +
             '" fill="none" stroke="' + r.c + '" stroke-width="2.4"/>');
    });
    for (var k = 0; k < n; k++){
      o.push('<text x="' + (x0 + k * CW + CW / 2) + '" y="' + (46 + 2 * gap + 18) + '" font-size="10.5" fill="#b3c0d1" text-anchor="middle">第' + (k + 1) + '拍</text>');
    }
    wav.innerHTML = o.join("");
  }

  function readout(){
    document.getElementById("stNow").textContent = bi(cur);
    document.getElementById("stNext").textContent = bi(nxt(cur));
    document.getElementById("stNarr").innerHTML =
      "现态 <b>" + bi(cur) + "</b>，下一个上升沿来到后变为 <b>" + bi(nxt(cur)) +
      "</b>。状态图上就是从 " + bi(cur) + " 沿箭头走到 " + bi(nxt(cur)) + "；波形上就是 Q₁Q₀ 同时跳变成新的组合。";
  }

  function render(step){
    if (step){ cur = nxt(cur); path.push(cur); }
    drawTable(); drawGraph(); drawWave(); readout();
  }

  function stopAuto(){
    if (autoTimer){ clearInterval(autoTimer); autoTimer = null; }
    document.getElementById("stAuto").textContent = "▶ 自动走一圈";
  }

  document.getElementById("stStep").addEventListener("click", function(){ stopAuto(); render(true); });
  document.getElementById("stReset").addEventListener("click", function(){
    stopAuto(); cur = 0; path = [0]; render(false);
  });
  document.getElementById("stAuto").addEventListener("click", function(){
    if (autoTimer){ stopAuto(); return; }
    this.textContent = "⏸ 停止";
    var cnt = 0;
    autoTimer = setInterval(function(){
      render(true); cnt++;
      if (cnt >= 4 || path.length > 11) stopAuto();
    }, 760);
  });

  render(false);
})();
