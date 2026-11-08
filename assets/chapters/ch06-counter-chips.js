/* 第六章 · 74160/74161 与任意进制构造（g4）：原样外置的同步 IIFE。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    /* ==================== 74160 / 74161 与任意进制构造 ==================== */
    (function(){
      var svg161 = document.getElementById("svg161");
      if (!svg161) return;

      var C = { chip: 160, q: [0,0,0,0], d: [1,0,0,1],
                cr: 1, ld: 1, ep: 1, et: 1 };
      var G = { n: 6, fb: "clr" };

      function maxQ(){ return C.chip === 160 ? 9 : 15; }
      function maxN(){ return C.chip === 160 ? 10 : 16; }
      function qv(){ return C.q[0] + C.q[1]*2 + C.q[2]*4 + C.q[3]*8; }
      function bits(v){ return [v & 1, (v >> 1) & 1, (v >> 2) & 1, (v >> 3) & 1]; }
      function bin4(v){ return ("000" + v.toString(2)).slice(-4); }
      function qstr(q){ return "" + q[3] + q[2] + q[1] + q[0]; }
      function andTerm(v){
        var b = bits(v), nm = ["Q₀","Q₁","Q₂","Q₃"], t = [], i;
        for (i = 3; i >= 0; i--) if (b[i]) t.push(nm[i]);
        return t.length ? t.join("·") : "1";
      }
      /* SVG 里没有 <sub>，用 tspan 下沉模拟下标 */
      function SUB(b, t, sz){ return b + '<tspan font-size="' + (sz || 8) + '" dy="3">' + t + '</tspan>'; }

      /* ---------- 芯片引脚图 ---------- */
      function draw161(){
        var st = "#3b4a5f", s = "", i;
        s += '<rect x="170" y="46" width="180" height="190" rx="5" fill="#fff" stroke="' + st + '" stroke-width="2.2"/>';
        s += '<text x="260" y="66" font-size="11" font-weight="800" fill="#94a3b8" text-anchor="middle" letter-spacing="1">74' +
             (C.chip === 160 ? "160" : "161") + '</text>';

        /* 左侧 */
        var crOn = C.cr === 0;
        s += '<line x1="112" y1="84" x2="161" y2="84" stroke="' + (crOn ? "#dc2626" : st) + '" stroke-width="' + (crOn ? 2.4 : 1.8) + '"/>';
        s += '<circle cx="166" cy="84" r="4.5" fill="#fff" stroke="' + (crOn ? "#dc2626" : st) + '" stroke-width="2"/>';
        s += '<text x="106" y="88" font-size="11" font-weight="800" fill="' + (crOn ? "#b91c1c" : "#475569") + '" text-anchor="end">/CR</text>';
        s += '<text x="177" y="87.5" font-size="9.5" font-weight="700" fill="#94a3b8">' + C.cr + '</text>';

        var ldOn = C.ld === 0;
        s += '<line x1="112" y1="112" x2="161" y2="112" stroke="' + (ldOn ? "#dc2626" : st) + '" stroke-width="' + (ldOn ? 2.4 : 1.8) + '"/>';
        s += '<circle cx="166" cy="112" r="4.5" fill="#fff" stroke="' + (ldOn ? "#dc2626" : st) + '" stroke-width="2"/>';
        s += '<text x="106" y="116" font-size="11" font-weight="800" fill="' + (ldOn ? "#b91c1c" : "#475569") + '" text-anchor="end">/LD</text>';
        s += '<text x="177" y="115.5" font-size="9.5" font-weight="700" fill="#94a3b8">' + C.ld + '</text>';

        s += '<line x1="112" y1="140" x2="170" y2="140" stroke="' + st + '" stroke-width="1.8"/>';
        s += '<path d="M170,134 L183,140 L170,146 Z" fill="none" stroke="' + st + '" stroke-width="1.6"/>';
        s += '<text x="106" y="144" font-size="11" font-weight="800" fill="#475569" text-anchor="end">CP</text>';

        var en = [[SUB("CT","P"), 172, C.ep], [SUB("CT","T"), 200, C.et]];
        en.forEach(function(p){
          var on = p[2] === 1;
          s += '<line x1="112" y1="' + p[1] + '" x2="170" y2="' + p[1] + '" stroke="' + (on ? "#f59e0b" : st) + '" stroke-width="' + (on ? 2.4 : 1.8) + '"/>';
          s += '<text x="106" y="' + (p[1] + 4) + '" font-size="11" font-weight="800" fill="' + (on ? "#b45309" : "#475569") + '" text-anchor="end">' + p[0] + '</text>';
          s += '<text x="177" y="' + (p[1] + 3.5) + '" font-size="9.5" font-weight="700" fill="#94a3b8">' + p[2] + '</text>';
        });

        /* 上方数据 */
        for (i = 0; i < 4; i++){
          var dx = 200 + i*40, don = C.d[i] === 1;
          s += '<line x1="' + dx + '" y1="22" x2="' + dx + '" y2="46" stroke="' + (don ? "#2563eb" : st) + '" stroke-width="' + (don ? 2.4 : 1.8) + '"/>';
          s += '<text x="' + dx + '" y="17" font-size="10.5" font-weight="800" fill="' + (don ? "#1d4ed8" : "#475569") + '" text-anchor="middle">D' + i + '</text>';
        }

        /* 右侧输出 */
        for (i = 0; i < 4; i++){
          var oy = 76 + i*32, qon = C.q[i] === 1;
          s += '<line x1="350" y1="' + oy + '" x2="408" y2="' + oy + '" stroke="' + (qon ? "#f59e0b" : st) + '" stroke-width="' + (qon ? 2.4 : 1.8) + '"/>';
          s += '<text x="414" y="' + (oy + 4) + '" font-size="11" font-weight="800" fill="' + (qon ? "#b45309" : "#475569") + '">Q' + i + '</text>';
        }

        /* RCO */
        var rco = (qv() === maxQ() && C.et === 1);
        s += '<line x1="350" y1="216" x2="408" y2="216" stroke="' + (rco ? "#dc2626" : st) + '" stroke-width="' + (rco ? 2.4 : 1.8) + '"/>';
        s += '<text x="414" y="220" font-size="11" font-weight="800" fill="' + (rco ? "#b91c1c" : "#475569") + '">RCO</text>';

        /* 框内读数 */
        s += '<text x="260" y="196" font-size="9.5" font-weight="800" fill="#b3c0d1" text-anchor="middle">当前计数</text>';
        s += '<text x="260" y="218" font-size="19" font-weight="800" font-family="ui-monospace,Consolas,monospace" fill="#b45309" text-anchor="middle">' + qv() + '</text>';

        svg161.innerHTML = s;
      }

      /* ---------- 更新 ---------- */
      function render161(){
        draw161();
        document.getElementById("chipTag").textContent = C.chip === 160 ? "74160" : "74161";

        var html = "", i;
        for (i = 3; i >= 0; i--){
          html += '<div class="lamp' + (C.q[i] ? " act" : "") + '">' + C.q[i] + '<small>Q' + i + '</small></div>';
        }
        var rco = (qv() === maxQ() && C.et === 1);
        html += '<div class="lamp' + (rco ? " act" : "") + '">' + qv() + '<small>十进制</small></div>';
        document.getElementById("lamp161").innerHTML = html;

        var note = document.getElementById("note161"), t;
        if (C.cr === 0){
          t = "<b style='color:#b91c1c'>/CR = 0，异步清零。</b>Q 立刻变成 0000，<b>不等时钟</b>。这是 74160/74161 与 74162/74163 的关键差别。";
        } else if (C.ld === 0){
          var dv = C.d[0] + C.d[1]*2 + C.d[2]*4 + C.d[3]*8;
          t = "<b>/LD = 0，同步置数。</b>下一个上升沿把 D₃D₂D₁D₀ = <b>" + qstr(C.d) + "</b>（" + dv +
              "）装入 Q。<b>注意要等时钟</b>，这一点和 /CR 不同。";
          if (C.chip === 160 && dv > 9){
            t += " <b style='color:#b91c1c'>但 " + bin4(dv) + " 属于 1010~1111，是 74160 的无效码（伪码），" +
                 "实际电路会跑出打乱的计数序列，考试里不要这样设计。</b>";
          }
        } else if (C.ep === 0 || C.et === 0){
          t = "<b>CT<sub>P</sub> 或 CT<sub>T</sub> 为 0，计数被禁止。</b>当前保持 " + qv() +
              " 不变。CT<sub>T</sub> 还兼管 RCO —— 它一为 0，进位输出也恒为 0。";
        } else {
          var nx = qv() + 1;
          if (nx > maxQ()) nx = 0;
          t = "<b>正在计数。</b>下一个上升沿：" + qv() + " → <b>" + nx + "</b>" +
              (qv() === maxQ() ? "，同时 RCO 输出一个周期的进位脉冲（进位宽度 = 1 个时钟）。" : "。");
        }
        note.innerHTML = t;

        document.querySelectorAll('[data-chip]').forEach(function(b){
          b.classList.toggle("on", +b.getAttribute("data-chip") === C.chip);
        });
        document.querySelectorAll('[data-pd]').forEach(function(b){
          b.classList.toggle("on", C.d[+b.getAttribute("data-pd")] === 1);
        });
        document.querySelectorAll('[data-pc]').forEach(function(b){
          var k = b.getAttribute("data-pc");
          var v = C[k];
          b.classList.toggle("on", v === 1);
          b.classList.toggle("hi", v === 0);
          var base = { cr: "/CR", ld: "/LD", ep: "CT<sub>P</sub>", et: "CT<sub>T</sub>" }[k];
          b.innerHTML = base + " = " + v;
        });
      }

      /* ---------- 任意进制构造器 ---------- */
      function renderN(){
        var N = G.n, M = maxQ() + 1, s = "", i, y = 20, h = 48, w = 44, gap = 48;
        var isMax = (N === M);
        var fbState = (G.fb === "clr") ? N : N - 1;

        function cx(k){ return 12 + k * gap; }

        for (i = 0; i < 16; i++){
          var x = cx(i), used = (i < N), pseudo = (i > maxQ());
          var isFb = !isMax && (i === fbState);
          var fill, stroke, tc, sw = 1.6, dash = "";

          if (used) { fill = "#fffbeb"; stroke = "#f59e0b"; tc = "#b45309"; sw = 2; }
          else if (pseudo) { fill = "#f8fafc"; stroke = "#e8edf5"; tc = "#cbd5e1"; }
          else { fill = "#f8fafc"; stroke = "#dde4ee"; tc = "#c3ccd8"; }

          if (isFb){
            if (G.fb === "clr"){ fill = "#fff"; stroke = "#dc2626"; tc = "#b91c1c"; dash = ' stroke-dasharray="4 3"'; sw = 2.2; }
            else { stroke = "#dc2626"; tc = "#b91c1c"; sw = 2.6; }
          }

          s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + fill +
               '" stroke="' + stroke + '" stroke-width="' + sw + '"' + dash + '/>';
          s += '<text x="' + (x + w/2) + '" y="' + (y + 31) + '" font-size="15" font-weight="800" font-family="ui-monospace,Consolas,monospace" fill="' +
               tc + '" text-anchor="middle">' + i + '</text>';
          if (pseudo) s += '<text x="' + (x + w/2) + '" y="' + (y + 44) + '" font-size="7" font-weight="700" fill="#cbd5e1" text-anchor="middle">伪码</text>';
        }

        if (!isMax){
          var x1 = cx(N - 1) + w/2, x2 = cx(0) + w/2;
          s += '<path d="M' + x1 + ' ' + (y + h) + ' L' + x1 + ' 86 L' + x2 + ' 86 L' + x2 + ' ' + (y + h + 6) +
               '" fill="none" stroke="#dc2626" stroke-width="1.8"/>';
          s += '<path d="M' + x2 + ' ' + (y + h) + ' l-4.5 8 l9 0 z" fill="#dc2626"/>';
          s += '<text x="' + ((x1 + x2) / 2) + '" y="106" font-size="10.5" font-weight="700" fill="#b91c1c" text-anchor="middle">' +
               (G.fb === "clr" ? "清零后回到 0（不占时钟周期）" : "置数后回到 0（占用一个时钟沿）") + '</text>';
        } else {
          s += '<text x="395" y="100" font-size="10.5" font-weight="700" fill="#94a3b8" text-anchor="middle">本身已是满模，0 ~ ' + (M-1) + ' 自然循环</text>';
        }

        document.getElementById("svgN").innerHTML = s;
        document.getElementById("nView").textContent = N;

        var note = document.getElementById("noteN"), t;
        if (isMax){
          t = "<b>不需要反馈。</b>" + (C.chip === 160 ? "74160" : "74161") + " 本身就是模 " + M +
              "，直接取 Q₃~Q₀ 就是模 " + M + " 计数。要得到更小的模值，才需要用下面两种方法之一。";
        } else if (G.fb === "clr"){
          t = "<b>反馈清零法（异步）：反馈取自状态 " + fbState + "。</b>" +
              "当 Q₃Q₂Q₁Q₀ = <b>" + bin4(fbState) + "</b> 时，<b>" + andTerm(fbState) + " = 1</b>，经与非/直接接到 <b>/CR</b>，" +
              "芯片<b>立刻</b>清零。状态 " + fbState + " 只存在极短一瞬，不计入循环，所以有效状态是 0 ~ " + (N-1) +
              " 共 <b>" + N + " 个 → 模 " + N + "</b>。";
        } else {
          t = "<b>反馈置数法（同步）：反馈取自状态 " + fbState + "。</b>" +
              "当 Q₃Q₂Q₁Q₀ = <b>" + bin4(fbState) + "</b> 时，<b>" + andTerm(fbState) + " = 1</b>，接到 <b>/LD</b>（低有效），" +
              "并令 D₃D₂D₁D₀ = 0000。<b>下一个上升沿</b>才装入 0，所以状态 " + fbState + " 是有效状态，共 0 ~ " + fbState +
              " 计 <b>" + N + " 个 → 模 " + N + "</b>。";
        }
        note.innerHTML = t;

        document.querySelectorAll('[data-fb]').forEach(function(b){
          b.classList.toggle("on", b.getAttribute("data-fb") === G.fb);
        });
      }

      /* ---------- 事件 ---------- */
      document.querySelectorAll('[data-chip]').forEach(function(b){
        b.addEventListener("click", function(){
          C.chip = +this.getAttribute("data-chip");
          if (qv() > maxQ()) C.q = [0,0,0,0];
          var dv0 = C.d[0] + C.d[1]*2 + C.d[2]*4 + C.d[3]*8;
          if (dv0 > maxQ()) C.d = bits(maxQ());
          if (G.n > maxN()) G.n = maxN();
          render161(); renderN();
        });
      });
      document.querySelectorAll('[data-pd]').forEach(function(b){
        b.addEventListener("click", function(){
          var i = +this.getAttribute("data-pd");
          C.d[i] = C.d[i] ? 0 : 1;
          render161();
        });
      });
      document.querySelectorAll('[data-pc]').forEach(function(b){
        b.addEventListener("click", function(){
          var k = this.getAttribute("data-pc");
          C[k] = C[k] ? 0 : 1;
          if (k === "cr" && C.cr === 0) C.q = [0,0,0,0];
          render161();
        });
      });
      document.querySelectorAll('[data-n]').forEach(function(b){
        b.addEventListener("click", function(){
          var d = +this.getAttribute("data-n");
          G.n = Math.min(maxN(), Math.max(2, G.n + d));
          renderN();
        });
      });
      document.querySelectorAll('[data-fb]').forEach(function(b){
        b.addEventListener("click", function(){
          G.fb = this.getAttribute("data-fb");
          renderN();
        });
      });

      document.getElementById("btn161").addEventListener("click", function(){
        var btn = this;
        btn.classList.add("flash");
        setTimeout(function(){ btn.classList.remove("flash"); }, 150);

        if (C.cr === 0){ C.q = [0,0,0,0]; render161(); return; }
        if (C.ld === 0){ C.q = C.d.slice(); render161(); return; }
        if (C.ep === 1 && C.et === 1){
          var v = qv() + 1;
          if (v > maxQ()) v = 0;
          C.q = bits(v);
        }
        render161();
      });

      render161();
      renderN();
    })();
    