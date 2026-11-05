/* 第六章 · 时序电路设计四步（n11）：原样外置的同步 IIFE，含状态表与步骤渲染。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    (function(){
      var ST = 0;
      var body = document.getElementById("tsBody");
      var hint = document.getElementById("tsHint");
      var bar = document.getElementById("tsBar");

      /* ---------- 绘图小工具 ---------- */
      function L(x1, y1, x2, y2, c, w, dash){
        return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
               '" stroke="' + (c || "#94a3b8") + '" stroke-width="' + (w || 1.6) + '"' +
               (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
      }
      function DT(x, y, c, r){
        return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 3) + '" fill="' + (c || "#94a3b8") + '"/>';
      }
      function TX(x, y, t, sz, c, a, w){
        return '<text x="' + x + '" y="' + y + '" font-size="' + (sz || 10) + '" fill="' + (c || "#475569") +
               '" text-anchor="' + (a || "middle") + '" font-weight="' + (w || 700) + '">' + t + '</text>';
      }
      function SV(w, h, inner){
        return '<div style="display:flex;justify-content:center;"><svg viewBox="0 0 ' + w + ' ' + h +
               '" style="width:100%;max-width:900px;height:auto;display:block;">' + inner + '</svg></div>';
      }

      /* ---------- ① 状态图 ---------- */
      var NODE = {
        S0: { x: 152, y: 236, r: 38, id: "S₀", code: "00" },
        S1: { x: 412, y: 108, r: 38, id: "S₁", code: "01" },
        S2: { x: 412, y: 340, r: 38, id: "S₂", code: "10" }
      };

      function cpt(c, p){
        var dx = p.x - c.x, dy = p.y - c.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        return { x: c.x + c.r * dx / d, y: c.y + c.r * dy / d };
      }
      function qp(p0, p1, p2, t){
        var u = 1 - t;
        return {
          x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
          y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
        };
      }
      function tri(p1, p2, c){
        var dx = p2.x - p1.x, dy = p2.y - p1.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        var ux = dx / d, uy = dy / d, nx = -uy, ny = ux, b = 9, w = 4.8;
        return '<path d="M' + p2.x + ' ' + p2.y +
               ' L' + (p2.x - ux * b + nx * w) + ' ' + (p2.y - uy * b + ny * w) +
               ' L' + (p2.x - ux * b - nx * w) + ' ' + (p2.y - uy * b - ny * w) + ' Z" fill="' + c + '"/>';
      }

      function edge(a, b, ctrl, label, col, lox){
        var s = cpt(a, ctrl), e = cpt(b, ctrl);
        var d = "M" + s.x + " " + s.y + " Q" + ctrl.x + " " + ctrl.y + " " + e.x + " " + e.y;
        var mid = qp(s, ctrl, e, 0.5);
        var out = '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="1.9"/>';
        out += tri(ctrl, e, col);
        out += TX(mid.x + (lox || 0), mid.y - 7, label, 10.5, col, "middle", 800);
        return out;
      }

      function selfLoop(c, a0, a1, label, col, lx, ly){
        var p0 = { x: c.x + c.r * Math.cos(a0), y: c.y + c.r * Math.sin(a0) };
        var p1 = { x: c.x + c.r * Math.cos(a1), y: c.y + c.r * Math.sin(a1) };
        var m = (a0 + a1) / 2, R = c.r + 40;
        var ctrl = { x: c.x + R * Math.cos(m), y: c.y + R * Math.sin(m) };
        var out = '<path d="M' + p0.x + ' ' + p0.y + ' Q' + ctrl.x + ' ' + ctrl.y + ' ' + p1.x + ' ' + p1.y +
                  '" fill="none" stroke="' + col + '" stroke-width="1.9"/>';
        out += tri(ctrl, p1, col);
        out += TX(lx, ly, label, 10.5, col, "middle", 800);
        return out;
      }

      function graphSVG(){
        var s = "";
        var B = "#2563eb", A = "#b45309", G = "#94a3b8";
        s += edge(NODE.S0, NODE.S1, { x: 268, y: 122 }, "1 / 0", B, 12);
        s += edge(NODE.S1, NODE.S0, { x: 258, y: 236 }, "0 / 0", B, -6);
        s += edge(NODE.S1, NODE.S2, { x: 552, y: 224 }, "1 / 0", B, 26);
        s += edge(NODE.S2, NODE.S0, { x: 252, y: 330 }, "0 / 1", A, 0);
        s += selfLoop(NODE.S0, 2.55, 3.95, "0 / 0", B, 54, 240);
        s += selfLoop(NODE.S2, 0.35, 1.05, "1 / 0", B, 504, 396);

        Object.keys(NODE).forEach(function(k){
          var n = NODE[k];
          s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + n.r + '" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>';
          s += TX(n.x, n.y - 2, n.id, 14, "#0f172a", "middle", 800);
          s += TX(n.x, n.y + 16, n.code, 9.5, "#94a3b8", "middle", 700);
        });

        s += '<rect x="556" y="34" width="158" height="78" rx="9" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.3"/>';
        s += TX(635, 54, "弧上写法", 10, "#64748b", "middle", 800);
        s += TX(635, 74, "X / Y", 14, "#0f172a", "middle", 800);
        s += TX(635, 92, "输入 / 输出", 9.5, "#94a3b8", "middle", 700);

        s += '<rect x="556" y="128" width="158" height="88" rx="9" fill="#fffbeb" stroke="#fcd9a0" stroke-width="1.3"/>';
        s += TX(635, 148, "2 个触发器", 10, "#b45309", "middle", 800);
        s += TX(635, 165, "→ 4 个编码", 10, "#b45309", "middle", 800);
        s += TX(635, 184, "只用了 3 个", 9.5, "#94a3b8", "middle", 700);
        s += TX(635, 202, "11 是无关态", 9.5, "#94a3b8", "middle", 700);

        return SV(720, 430, s);
      }

      var P0 = graphSVG() +
        '<div class="tut-note" style="margin-top:12px; font-size:12.5px;">' +
        '<b>要求：</b>串行输入 X 逐位进来，一旦出现连续三位 <b>110</b>，同一拍输出 Y = 1。允许重叠——' +
        '例如 1 1 0 1 1 0 应输出两次 1。<br>' +
        '<b>定状态：</b>S₀ 表示「还没匹配上」，S₁ 表示「末尾是 1」，S₂ 表示「末尾是 11」，' +
        '一旦再来一个 0 就凑成 110，输出 1 并退回 S₀。<br>' +
        '<b>注意 S₂ 遇 1 仍留在 S₂</b>：序列 111 的末尾两位还是 11，这正是「允许重叠」的含义。' +
        '</div>';

      /* ---------- ② 次态表 ---------- */
      var TT = [
        ["00", "00", 0, "01", 0],
        ["01", "00", 0, "10", 0],
        ["11", "—", "d", "—", "d"],
        ["10", "00", 1, "10", 0]
      ];
      function tableHTML(){
        var h = '<table class="tb" style="width:100%;max-width:560px;margin-top:0;table-layout:fixed;">' +
          '<colgroup><col style="width:92px"><col style="width:130px"><col style="width:62px">' +
          '<col style="width:130px"><col style="width:62px"></colgroup>' +
          '<thead><tr>' +
          '<th rowspan="2" style="text-align:center;padding:9px 6px;">现态<br>Q₁Q₀</th>' +
          '<th colspan="2" style="text-align:center;padding:8px 6px;">X = 0</th>' +
          '<th colspan="2" style="text-align:center;padding:8px 6px;">X = 1</th></tr>' +
          '<tr><th style="text-align:center;padding:7px 4px;font-size:10.5px;">次态 Q₁*Q₀*</th>' +
          '<th style="text-align:center;padding:7px 4px;">Y</th>' +
          '<th style="text-align:center;padding:7px 4px;font-size:10.5px;">次态 Q₁*Q₀*</th>' +
          '<th style="text-align:center;padding:7px 4px;">Y</th></tr></thead><tbody>';
        TT.forEach(function(r){
          var d = (r[2] === "d");
          h += '<tr' + (d ? ' style="color:#94a3b8;"' : '') + '><td style="text-align:center;padding:9px 4px;"><b>' + r[0] + '</b></td>';
          h += '<td style="text-align:center;padding:9px 4px;">' + r[1] + '</td>' +
               '<td style="text-align:center;padding:9px 4px;' + (d ? 'color:#b45309;' : '') + '">' + r[2] + '</td>';
          h += '<td style="text-align:center;padding:9px 4px;">' + r[3] + '</td>' +
               '<td style="text-align:center;padding:9px 4px;' + (d ? 'color:#b45309;' : '') + '">' + r[4] + '</td></tr>';
        });
        return h + '</tbody></table>';
      }

      var P1 = '<div style="display:flex;gap:22px;flex-wrap:wrap;align-items:flex-start;">' +
        '<div>' + tableHTML() + '</div>' +
        '<div style="flex:1;min-width:260px;" class="tut-note">' +
        '<b>怎么读这张表：</b>行是现态，列是输入，格子写「次态 / 输出」。' +
        'Mealy 机的输出跟输入有关，所以 Y 只能写在格子里，不能写在状态上。<br><br>' +
        '<b>11 那一行为什么全是 d：</b>两个触发器能表示 4 个编码，状态图只用了 3 个，' +
        '11 永远不会自然到达——它的次态和输出<b>爱填什么都行</b>。<br><br>' +
        '<b>行序特意排成格雷码：</b>00 → 01 → 11 → 10。这样下一步抄进卡诺图时一行对一行，不用挪位置。' +
        '如果按 00 → 01 → 10 → 11 排，抄的时候就得自己换行，最容易在这一步出错。<br><br>' +
        '<b>但 d 是可以用的资源：</b>下一步填卡诺图时，把 d 当成 1 就能圈出更大的圈，方程更短。' +
        '用完之后必须回来验证自启动，第四步会做这件事。' +
        '</div></div>';

      /* ---------- ③ 卡诺图 ---------- */
      var ROWG = ["00", "01", "11", "10"];
      var MAPS = [
        { t: "Q₁*", sub: "= D₁", v: [["0","0"],["0","1"],["d","d"],["0","1"]],
          g: [{ r0:1, r1:2, c0:1, c1:1, c:"#f59e0b", n:3 }, { r0:2, r1:3, c0:1, c1:1, c:"#0d9488", n:6 }] },
        { t: "Q₀*", sub: "= D₀", v: [["0","1"],["0","0"],["d","d"],["0","0"]],
          g: [{ r0:0, r1:0, c0:1, c1:1, c:"#f59e0b", n:3 }] },
        { t: "Y", sub: "", v: [["0","0"],["0","0"],["d","d"],["1","0"]],
          g: [{ r0:2, r1:3, c0:0, c1:0, c:"#f59e0b", n:3 }] }
      ];

      function kmap(m, gx, gy){
        var CW = 64, CH = 46, s = "", c, r, c2;
        s += TX(gx + CW - 12, gy - 34, m.t, 13.5, "#0f172a", "middle", 800);
        if (m.sub) s += TX(gx + CW + 10, gy - 34, m.sub, 10.5, "#94a3b8", "start", 700);

        s += TX(gx - 10, gy - 26, "Q₁Q₀", 9.5, "#64748b", "end", 800);
        for (c = 0; c < 2; c++){
          s += TX(gx + c * CW + CW / 2, gy - 8, "X=" + c, 10, "#64748b", "middle", 800);
        }
        for (r = 0; r < 4; r++){
          s += TX(gx - 10, gy + r * CH + CH / 2 + 4, ROWG[r], 10.5, "#475569", "end", 800);
          for (c2 = 0; c2 < 2; c2++){
            var x = gx + c2 * CW, y = gy + r * CH;
            var v = m.v[r][c2];
            var fill = v === "1" ? "#fffbeb" : (v === "d" ? "#f1f5f9" : "#fff");
            var idx = (+ROWG[r].charAt(0)) * 4 + (+ROWG[r].charAt(1)) * 2 + c2;
            s += '<rect x="' + x + '" y="' + y + '" width="' + CW + '" height="' + CH +
                 '" fill="' + fill + '" stroke="#cbd5e1" stroke-width="1.2"/>';
            s += TX(x + CW / 2, y + CH / 2 + 6, v, 15,
                    v === "d" ? "#b45309" : (v === "1" ? "#0f172a" : "#cbd5e1"), "middle", 800);
            s += TX(x + CW - 7, y + CH - 6, String(idx), 8.5, "#b3c0d1", "end", 700);
          }
        }
        (m.g || []).forEach(function(g){
          var inset = 3 + (g.n % 2) * 4;
          s += '<rect x="' + (gx + g.c0 * CW + inset) + '" y="' + (gy + g.r0 * CH + inset) +
               '" width="' + ((g.c1 - g.c0 + 1) * CW - inset * 2) + '" height="' + ((g.r1 - g.r0 + 1) * CH - inset * 2) +
               '" rx="9" fill="none" stroke="' + g.c + '" stroke-width="2.2"/>';
        });
        return s;
      }

      function kmapAll(){
        var s = kmap(MAPS[0], 76, 84) + kmap(MAPS[1], 330, 84) + kmap(MAPS[2], 584, 84);
        return SV(720, 292, s);
      }
      var P2 = kmapAll() +
        '<div class="kmap-legend">' +
        '<span><i style="background:#fffbeb;border:1.5px solid #f59e0b;"></i>圈出的组</span>' +
        '<span><i style="background:#fff;border:1.5px solid #0d9488;"></i>Q₁* 的第二个圈</span>' +
        '<span><i style="background:#f1f5f9;border:1.5px solid #cbd5e1;"></i>无关项 d（当 1 用）</span>' +
        '<span>格中小字 = 最小项编号</span></div>' +
        '<div class="tut-note" style="margin-top:10px; font-size:12.5px;">' +
        '<b>Q₁* 要圈两次：</b>(01,1) 与 (11,1) 的<b style="color:#b45309">琥珀圈</b>给出 <b>X·Q₀</b>；' +
        '(10,1) 与 (11,1) 的<b style="color:#0d9488">青色圈</b>给出 <b>X·Q₁</b>。' +
        '两个圈共用 (11,1) 这一个 d——<b>无关项可以被重复使用</b>，这是它比真 1 更好用的地方。<br>' +
        '<b>Q₀* 只有一个 1：</b>(00,1) 周围四个邻居全是 0，圈不成对，只能写成 <b>X·Q₁′·Q₀′</b>。<br>' +
        '<b>Y 用了 d：</b>(10,0) 与 (11,0) 圈成一对，得 <b>Q₁·X′</b>。若不用 d，则是 Q₁Q₀′X′；' +
        '两者在三个可达状态下完全等价，因为 11 根本到不了。' +
        '</div>';

      /* ---------- ④ 方程与电路 ---------- */
      function gate(x, y, w, h, sym, out){
        var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
                '" rx="3" fill="#fff" stroke="#94a3b8" stroke-width="1.6"/>';
        s += TX(x + w / 2, y + h / 2 + 5, sym, 11, "#0f172a", "middle", 800);
        if (out) s += '<circle cx="' + (x + w + 3.5) + '" cy="' + (y + h / 2) + '" r="3.5" fill="#fff" stroke="#94a3b8" stroke-width="1.4"/>';
        return s;
      }
      function ff(x, y, nm){
        var s = '<rect x="' + x + '" y="' + y + '" width="98" height="66" rx="5" fill="#fff" stroke="#94a3b8" stroke-width="1.8"/>';
        s += TX(x + 52, y + 13, nm, 10.5, "#0f172a", "middle", 800);
        s += TX(x + 9, y + 22, "D", 9.5, "#2563eb", "start", 800);
        s += TX(x + 89, y + 22, "Q", 9.5, "#b45309", "end", 800);
        s += TX(x + 89, y + 56, "Q′", 9.5, "#94a3b8", "end", 800);
        s += '<path d="M' + x + ' ' + (y + 40) + ' l9 4 l-9 4 z" fill="#94a3b8"/>';
        s += TX(x + 12, y + 47, "CP", 7.5, "#94a3b8", "start", 700);
        return s;
      }
      function term(x, y, t, col){
        return TX(x + 2, y - 7, t, 11, col || "#475569", "start", 800);
      }

      function circuitSVG(){
        var s = "", B = "#2563eb", A = "#b45309";

        /* ---- D1 = X(Q1+Q0) ---- */
        s += term(44, 58, "X");
        s += L(44, 58, 208, 58, B, 1.5);
        s += term(44, 86, "Q₁");
        s += L(44, 86, 106, 86, B, 1.5);
        s += term(44, 112, "Q₀");
        s += L(44, 112, 106, 112, B, 1.5);
        s += gate(106, 74, 54, 58, "≥1");
        s += L(160, 103, 208, 103, B, 1.5);
        s += gate(208, 44, 54, 76, "&");
        s += L(262, 82, 400, 82, A, 1.8);
        s += TX(330, 74, "D₁ = X(Q₁+Q₀)", 10, A, "middle", 800);
        s += ff(400, 64, "触发器 1");

        /* ---- D0 = X·Q1′·Q0′ ---- */
        s += term(44, 212, "X");
        s += L(44, 212, 150, 212, B, 1.5);
        s += term(44, 238, "Q₁′");
        s += L(44, 238, 150, 238, B, 1.5);
        s += term(44, 264, "Q₀′");
        s += L(44, 264, 150, 264, B, 1.5);
        s += gate(150, 198, 58, 78, "&");
        s += L(208, 237, 400, 237, A, 1.8);
        s += TX(322, 229, "D₀ = X·Q₁′·Q₀′", 10, A, "middle", 800);
        s += ff(400, 219, "触发器 0");

        /* ---- Y = Q1·X′ ---- */
        s += term(44, 322, "Q₁");
        s += L(44, 322, 168, 322, B, 1.5);
        s += term(44, 346, "X′");
        s += L(44, 346, 168, 346, B, 1.5);
        s += gate(168, 308, 54, 52, "&");
        s += L(222, 334, 300, 334, A, 1.8);
        s += '<circle cx="310" cy="334" r="3.5" fill="' + A + '"/>';
        s += TX(322, 338, "Y", 12, A, "start", 800);
        s += TX(252, 326, "Y = Q₁·X′", 10, A, "middle", 800);

        /* ---- 触发器输出 ---- */
        s += L(498, 82, 540, 82, A, 1.5) + TX(546, 86, "Q₁", 10, A, "start", 800);
        s += L(498, 116, 540, 116, "#94a3b8", 1.5) + TX(546, 120, "Q₁′", 10, "#94a3b8", "start", 800);
        s += L(498, 237, 540, 237, A, 1.5) + TX(546, 241, "Q₀", 10, A, "start", 800);
        s += L(498, 271, 540, 271, "#94a3b8", 1.5) + TX(546, 275, "Q₀′", 10, "#94a3b8", "start", 800);

        return SV(720, 372, s);
      }

      var P3 = '<div class="eq-box">' +
        '<b>驱动方程</b>（D 触发器：D<sub>i</sub> = Q<sub>i</sub>*，次态方程直接抄下来即可）<br>' +
        '&nbsp;&nbsp;D₁ = X ( Q₁ + Q₀ )<br>' +
        '&nbsp;&nbsp;D₀ = X · Q₁′ · Q₀′<br><br>' +
        '<b>输出方程</b>（Mealy：与输入有关）<br>' +
        '&nbsp;&nbsp;Y = Q₁ · X′' +
        '</div>' + circuitSVG() +
        '<div class="tut-note" style="margin-top:10px; font-size:12.5px;">' +
        '<b>电路：</b>一只 <b>2 输入或门</b>（≥1）串一只 <b>2 输入与门</b>（&）驱动 D₁，' +
        '一只 <b>3 输入与门</b>（&）驱动 D₀，一只 <b>2 输入与门</b>出 Y。两个触发器<b>共用时钟 CP</b>，' +
        'Q′ 端直接作为反馈量（图上用同名标号 Q₁′、Q₀′ 表示相连）。<br><br>' +
        '<b>自启动检查（用 d 之后必须做）：</b>把无关态 11 代进方程 ——' +
        'X = 0 时 D₁D₀ = 00，落到 S₀；X = 1 时 D₁D₀ = 10，落到 S₂。<b>两个方向都回到有效状态</b>，' +
        '所以这个电路可以自启动，无关项用得合法。<br>' +
        '<b>如果算出 11 → 11，就必须改设计</b>：把某个 d 当成 0 重新圈组，牺牲一点简洁换取自启动。' +
        '</div>';

      var PANELS = [P0, P1, P2, P3];
      var NAMES = ["① 画状态图", "② 列次态表", "③ 填卡诺图", "④ 写方程·画电路"];
      var HINTS = [
        "先数状态，再定编码——状态数决定用几个触发器",
        "把状态图逐条抄成表格，无关态一律写 d",
        "行序必须是格雷码 00→01→11→10",
        "D_i = Q_i*，方程写完立刻验自启动"
      ];

      function render(){
        body.innerHTML = PANELS[ST];
        hint.textContent = "第 " + (ST + 1) + " / 4 步 · " + HINTS[ST];
        var bs = bar.querySelectorAll("[data-st]");
        for (var i = 0; i < bs.length; i++){
          bs[i].classList.toggle("on", +bs[i].getAttribute("data-st") === ST);
        }
        document.getElementById("tsPrev").disabled = (ST === 0);
        document.getElementById("tsNext").disabled = (ST === 3);
        document.getElementById("tsPrev").style.opacity = ST === 0 ? ".4" : "1";
        document.getElementById("tsNext").style.opacity = ST === 3 ? ".4" : "1";
      }

      bar.addEventListener("click", function(e){
        var t = e.target;
        if (!t.getAttribute || t.getAttribute("data-st") === null) return;
        ST = +t.getAttribute("data-st");
        render();
      });
      document.getElementById("tsPrev").addEventListener("click", function(){
        if (ST > 0){ ST--; render(); }
      });
      document.getElementById("tsNext").addEventListener("click", function(){
        if (ST < 3){ ST++; render(); }
      });
      render();
    })();
    