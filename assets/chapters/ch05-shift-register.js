/* 第五章 · 74LS194 双向移位寄存器（g3）：原样外置的同步 IIFE。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    /* ==================== 74LS194 双向移位寄存器 ==================== */
    (function(){
      var svg = document.getElementById("svg194");
      if (!svg) return;

      var R = { q: [1,0,1,1], d: [1,0,0,1], dsr: 1, dsl: 0, cr: 1, s: [1,0] };
      var hist = [];

      function mode(){ return R.s[1]*2 + R.s[0]; }
      function qstr(q){ return "" + q[3] + q[2] + q[1] + q[0]; }
      function qdec(q){ return q[0] + q[1]*2 + q[2]*4 + q[3]*8; }

      function arrow(x1, x2, y, col, w){
        var d = (x2 > x1) ? 1 : -1;
        var o = '<line x1="' + x1 + '" y1="' + y + '" x2="' + (x2 - d*8) + '" y2="' + y +
                '" stroke="' + col + '" stroke-width="' + (w || 1.8) + '"/>';
        o += '<path d="M' + x2 + ' ' + y + ' l' + (-d*8) + ' -4.5 l0 9 z" fill="' + col + '"/>';
        return o;
      }
      /* SVG 里没有 <sub>，用 tspan 下沉模拟下标 */
      function SUB(b, t, sz){ return b + '<tspan font-size="' + (sz || 8) + '" dy="3">' + t + '</tspan>'; }

      function draw194(){
        var st = "#3b4a5f", m = mode(), s = "", i;

        /* ---------- 芯片框 ---------- */
        s += '<rect x="170" y="46" width="180" height="204" rx="5" fill="#fff" stroke="' + st + '" stroke-width="2.2"/>';
        s += '<text x="260" y="64" font-size="11" font-weight="800" fill="#94a3b8" text-anchor="middle" letter-spacing="1">74LS194</text>';

        /* ---------- 左侧引脚 ---------- */
        var crOn = R.cr === 0;
        s += '<line x1="112" y1="88" x2="161" y2="88" stroke="' + (crOn ? "#dc2626" : st) + '" stroke-width="' + (crOn ? 2.4 : 1.8) + '"/>';
        s += '<circle cx="166" cy="88" r="4.5" fill="#fff" stroke="' + (crOn ? "#dc2626" : st) + '" stroke-width="2"/>';
        s += '<text x="106" y="92" font-size="11" font-weight="800" fill="' + (crOn ? "#b91c1c" : "#475569") + '" text-anchor="end">/CR</text>';

        s += '<line x1="112" y1="116" x2="170" y2="116" stroke="' + st + '" stroke-width="1.8"/>';
        s += '<path d="M170,110 L183,116 L170,122 Z" fill="none" stroke="' + st + '" stroke-width="1.6"/>';
        s += '<text x="106" y="120" font-size="11" font-weight="800" fill="#475569" text-anchor="end">CP</text>';

        var pins = [[SUB("D","SR"), 150, R.dsr, "#2563eb"], [SUB("D","SL"), 176, R.dsl, "#2563eb"],
                    ["S₁", 204, R.s[1], "#f59e0b"], ["S₀", 230, R.s[0], "#f59e0b"]];
        pins.forEach(function(p){
          var on = p[2] === 1;
          var col = on ? p[3] : st;
          var tc = on ? (p[3] === "#f59e0b" ? "#b45309" : "#1d4ed8") : "#475569";
          s += '<line x1="112" y1="' + p[1] + '" x2="170" y2="' + p[1] + '" stroke="' + col + '" stroke-width="' + (on ? 2.4 : 1.8) + '"/>';
          s += '<text x="106" y="' + (p[1] + 4) + '" font-size="11" font-weight="800" fill="' + tc + '" text-anchor="end">' + p[0] + '</text>';
          s += '<text x="177" y="' + (p[1] + 3.5) + '" font-size="9.5" font-weight="700" fill="#94a3b8">' + p[2] + '</text>';
        });
        s += '<text x="177" y="91.5" font-size="9.5" font-weight="700" fill="#94a3b8">' + R.cr + '</text>';

        /* ---------- 上方并行数据 ---------- */
        for (i = 0; i < 4; i++){
          var dx = 200 + i*40, don = R.d[i] === 1;
          s += '<line x1="' + dx + '" y1="22" x2="' + dx + '" y2="46" stroke="' + (don ? "#2563eb" : st) + '" stroke-width="' + (don ? 2.4 : 1.8) + '"/>';
          s += '<text x="' + dx + '" y="17" font-size="10.5" font-weight="800" fill="' + (don ? "#1d4ed8" : "#475569") + '" text-anchor="middle">D' + i + '</text>';
        }

        /* ---------- 右侧输出 ---------- */
        for (i = 0; i < 4; i++){
          var oy = 92 + i*36, qon = R.q[i] === 1;
          s += '<line x1="350" y1="' + oy + '" x2="408" y2="' + oy + '" stroke="' + (qon ? "#f59e0b" : st) + '" stroke-width="' + (qon ? 2.4 : 1.8) + '"/>';
          s += '<text x="414" y="' + (oy + 4) + '" font-size="11" font-weight="800" fill="' + (qon ? "#b45309" : "#475569") + '">Q' + i + '</text>';
        }

        /* ---------- 框内功能表 ---------- */
        var MROW = [["00","保持"],["01","右移"],["10","左移"],["11","置数"]];
        s += '<text x="238" y="92" font-size="9" font-weight="800" fill="#b3c0d1" text-anchor="middle">S₁S₀</text>';
        s += '<text x="286" y="92" font-size="9" font-weight="800" fill="#b3c0d1">功能</text>';
        s += '<line x1="198" y1="98" x2="342" y2="98" stroke="#e2e8f0" stroke-width="1"/>';
        for (i = 0; i < 4; i++){
          var ry = 116 + i*24, act = (i === m);
          if (act) s += '<rect x="198" y="' + (ry - 14) + '" width="144" height="21" rx="3" fill="#fffbeb"/>';
          s += '<text x="238" y="' + ry + '" font-size="10" font-weight="800" font-family="ui-monospace,Consolas,monospace" fill="' +
               (act ? "#b45309" : "#94a3b8") + '" text-anchor="middle">' + MROW[i][0] + '</text>';
          s += '<text x="286" y="' + ry + '" font-size="10" font-weight="700" fill="' + (act ? "#b45309" : "#94a3b8") + '">' + MROW[i][1] + '</text>';
        }

        /* ---------- 移位链 ---------- */
        s += '<text x="260" y="290" font-size="11" font-weight="700" fill="#94a3b8" text-anchor="middle">移位链（Q₀ 在左 → Q₃ 在右）</text>';

        var cx = [46, 162, 278, 394], cy = 306, cw = 80, ch = 54, k;
        for (k = 0; k < 4; k++){
          var lit = R.q[k] === 1;
          s += '<rect x="' + cx[k] + '" y="' + cy + '" width="' + cw + '" height="' + ch + '" rx="7" fill="' + (lit ? "#fffbeb" : "#fff") +
               '" stroke="' + (lit ? "#f59e0b" : "#cbd5e1") + '" stroke-width="' + (lit ? 2.2 : 1.6) + '"/>';
          s += '<text x="' + (cx[k] + cw/2) + '" y="' + (cy + 37) + '" font-size="24" font-weight="800" font-family="ui-monospace,Consolas,monospace" fill="' +
               (lit ? "#b45309" : "#94a3b8") + '" text-anchor="middle">' + R.q[k] + '</text>';
          s += '<text x="' + (cx[k] + cw/2) + '" y="' + (cy + ch + 19) + '" font-size="11" font-weight="800" fill="#475569" text-anchor="middle">Q' + k + '</text>';
        }

        var flowOn = (m === 1 || m === 2);
        var fcol = flowOn ? "#f59e0b" : "#cbd5e1";
        for (k = 0; k < 3; k++){
          var xa = cx[k] + cw, xb = cx[k+1];
          if (m === 2) s += arrow(xb, xa, cy + ch/2, fcol, flowOn ? 2.4 : 1.6);
          else s += arrow(xa, xb, cy + ch/2, fcol, flowOn ? 2.4 : 1.6);
        }

        var srOn = (m === 1), slOn = (m === 2);
        s += arrow(8, cx[0], cy + ch/2, srOn ? "#2563eb" : "#cbd5e1", srOn ? 2.6 : 1.6);
        s += '<text x="8" y="' + (cy + ch/2 - 10) + '" font-size="10" font-weight="800" fill="' + (srOn ? "#1d4ed8" : "#94a3b8") + '">' + SUB("D","SR",7) + '</text>';
        s += arrow(512, cx[3] + cw, cy + ch/2, slOn ? "#2563eb" : "#cbd5e1", slOn ? 2.6 : 1.6);
        s += '<text x="512" y="' + (cy + ch/2 - 10) + '" font-size="10" font-weight="800" fill="' + (slOn ? "#1d4ed8" : "#94a3b8") + '" text-anchor="end">' + SUB("D","SL",7) + '</text>';

        svg.innerHTML = s;
      }

      function renderHist(){
        var box = document.getElementById("hist194");
        if (!hist.length){
          box.innerHTML = '<span class="ht-empty">送第一个时钟脉冲后，这里会记录 Q₃Q₂Q₁Q₀ 的变化轨迹</span>';
          return;
        }
        var html = "";
        for (var i = 0; i < hist.length; i++){
          var h = hist[i];
          html += '<span class="ht' + (i === hist.length - 1 ? " now" : "") + '">' +
                  qstr(h.q) + ' <span style="opacity:.55">' + qdec(h.q) + '</span></span>';
        }
        box.innerHTML = html;
      }

      function render(){
        draw194();
        var m = mode();
        var note = document.getElementById("note194"), txt;

        if (R.cr === 0){
          txt = "<b style='color:#b91c1c'>/CR = 0，异步清零已生效。</b>Q₃Q₂Q₁Q₀ 立刻变成 " + qstr(R.q) +
                "，<b>不等时钟</b>——这就是异步的含义。此时 CP 来不来都没意义。";
        } else if (m === 0){
          txt = "<b>S₁S₀ = 00，保持。</b>时钟照来，但 Q 一直是 " + qstr(R.q) + "（十进制 " + qdec(R.q) + "）。";
        } else if (m === 1){
          txt = "<b>S₁S₀ = 01，右移。</b>下一个上升沿：D<sub>SR</sub> = " + R.dsr +
                " 进入 Q₀，原 Q₀→Q₁、Q₁→Q₂、Q₂→Q₃，Q₃ = " + R.q[3] + " 被挤出。";
        } else if (m === 2){
          txt = "<b>S₁S₀ = 10，左移。</b>下一个上升沿：D<sub>SL</sub> = " + R.dsl +
                " 进入 Q₃，原 Q₃→Q₂、Q₂→Q₁、Q₁→Q₀，Q₀ = " + R.q[0] + " 被挤出。";
        } else {
          txt = "<b>S₁S₀ = 11，并行置数。</b>下一个上升沿：D₃D₂D₁D₀ = " + qstr(R.d) +
                " 整体装入，Q 直接变成 " + qstr(R.d) + "，中间各位不经过移位。";
        }
        note.innerHTML = txt;

        document.querySelectorAll('[data-m]').forEach(function(b){
          b.classList.toggle("on", +b.getAttribute("data-m") === m);
        });
        document.querySelectorAll('[data-dd]').forEach(function(b){
          b.classList.toggle("on", R.d[+b.getAttribute("data-dd")] === 1);
        });
        document.querySelectorAll('[data-s]').forEach(function(b){
          var k = b.getAttribute("data-s");
          var v = (k === "sr") ? R.dsr : (k === "sl") ? R.dsl : R.cr;
          b.classList.toggle("on", v === 1);
          b.classList.toggle("hi", k === "cr" && v === 0);
          if (k === "cr") b.textContent = "/CR = " + v;
        });
        renderHist();
      }

      function pulse(){
        var btn = document.getElementById("btn194");
        btn.classList.add("flash");
        setTimeout(function(){ btn.classList.remove("flash"); }, 150);
        if (R.cr === 0) return;

        var m = mode();
        if (m === 3) R.q = R.d.slice();
        else if (m === 1) R.q = [R.dsr, R.q[0], R.q[1], R.q[2]];
        else if (m === 2) R.q = [R.q[1], R.q[2], R.q[3], R.dsl];

        hist.push({ q: R.q.slice() });
        if (hist.length > 9) hist.shift();
        render();
      }

      document.querySelectorAll('[data-m]').forEach(function(b){
        b.addEventListener("click", function(){
          var v = +this.getAttribute("data-m");
          R.s = [v & 1, (v >> 1) & 1];
          render();
        });
      });
      document.querySelectorAll('[data-dd]').forEach(function(b){
        b.addEventListener("click", function(){
          var i = +this.getAttribute("data-dd");
          R.d[i] = R.d[i] ? 0 : 1;
          render();
        });
      });
      document.querySelectorAll('[data-s]').forEach(function(b){
        b.addEventListener("click", function(){
          var k = this.getAttribute("data-s");
          if (k === "sr") R.dsr = R.dsr ? 0 : 1;
          else if (k === "sl") R.dsl = R.dsl ? 0 : 1;
          else {
            R.cr = R.cr ? 0 : 1;
            if (R.cr === 0){ R.q = [0,0,0,0]; hist = []; }
          }
          render();
        });
      });
      document.getElementById("btn194").addEventListener("click", pulse);

      hist = [{ q: R.q.slice() }];
      render();
    })();
    