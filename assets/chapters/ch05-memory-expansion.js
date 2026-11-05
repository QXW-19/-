/* 第五章 · 存储器字长/容量扩展（n10）：原样外置的同步 IIFE，含芯片库数据与 SVG 绘制。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    (function(){
      var CHIPS = [
        { w:1, d:4, nm:"1K×4", pin:"2114" },
        { w:1, d:8, nm:"1K×8", pin:"—" },
        { w:2, d:8, nm:"2K×8", pin:"6116" },
        { w:4, d:4, nm:"4K×4", pin:"—" }
      ];
      var TGTS = [
        { w:4, d:8,  nm:"4K×8" },
        { w:8, d:8,  nm:"8K×8" },
        { w:4, d:16, nm:"4K×16" }
      ];
      var M = { chip:0, tgt:0, sel:0 };

      var svg = document.getElementById("memSvg");
      var info = document.getElementById("memInfo");
      var note = document.getElementById("memNote");

      var SUBS = "₀₁₂₃₄₅₆₇₈₉";
      function sub(v){
        var s = String(v), o = "", i, d;
        for (i = 0; i < s.length; i++){
          d = s.charCodeAt(i) - 48;
          o += (d >= 0 && d <= 9) ? SUBS.charAt(d) : s.charAt(i);
        }
        return o;
      }
      function lg(n){ return Math.round(Math.log(n) / Math.LN2); }
      function hexs(v, dg){
        var s = v.toString(16).toUpperCase();
        while (s.length < dg) s = "0" + s;
        return s;
      }
      function binb(v, n){
        var s = "", i;
        for (i = n - 1; i >= 0; i--) s += ((v >> i) & 1);
        return s;
      }
      function L(x1, y1, x2, y2, col, w, dash){
        return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
               '" stroke="' + (col || "#94a3b8") + '" stroke-width="' + (w || 1.6) + '"' +
               (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
      }
      function DT(x, y, col, r){
        return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 2.6) + '" fill="' + (col || "#94a3b8") + '"/>';
      }
      function TX(x, y, txt, size, col, anchor, weight){
        return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 10) + '" fill="' + (col || "#475569") +
               '" text-anchor="' + (anchor || "middle") + '" font-weight="' + (weight || 700) + '">' + txt + '</text>';
      }

      function calc(){
        var c = CHIPS[M.chip], t = TGTS[M.tgt];
        var perG = t.d / c.d, groups = t.w / c.w;
        var aTot = lg(t.w * 1024), aChip = lg(c.w * 1024);
        return {
          c:c, t:t, perG:perG, groups:groups, total:perG * groups,
          aTot:aTot, aChip:aChip,
          aSel: groups > 1 ? lg(groups) : 0,
          hd: Math.ceil(aTot / 4)
        };
      }

      function draw(){
        var q = calc(), c = q.c;
        var perG = q.perG, groups = q.groups;
        if (M.sel > groups - 1) M.sel = groups - 1;

        var W = 720;
        var cw = Math.min(170, Math.floor(420 / perG) - 8);
        var gap = 18, chh = 46, rowH = 80;
        var gridW = perG * cw + (perG - 1) * gap;
        var x0 = 148 + Math.round((468 - gridW) / 2);
        var y0 = groups > 1 ? 158 : 104;
        var dataX = 676;
        var H = y0 + (groups - 1) * rowH + 74;
        svg.setAttribute("viewBox", "0 0 " + W + " " + H);

        var s = "", i, r, cc, cx, cy, mid, sel;
        var lastMid = y0 + (groups - 1) * rowH + chh / 2;
        var lastDsY = y0 + (groups - 1) * rowH + 56;

        /* ---------- 译码器 ---------- */
        var outX = [];
        if (groups > 1){
          var bx1 = 58, bx2 = 322, by1 = 40, by2 = 100;
          s += '<rect x="' + bx1 + '" y="' + by1 + '" width="' + (bx2 - bx1) + '" height="' + (by2 - by1) +
               '" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.6"/>';
          s += TX((bx1 + bx2) / 2, 60, q.aSel + " → " + groups + " 线译码器", 10.5, "#0f172a", "middle", 800);
          s += TX((bx1 + bx2) / 2, 76, "输入：高位地址 A" + sub(q.aChip) + "~A" + sub(q.aTot - 1), 8.5, "#2563eb", "middle", 700);
          for (i = 0; i < groups; i++){
            var xi = 78 + i * (220 / Math.max(1, groups - 1));
            outX.push(xi);
            s += TX(xi, 93, "Y" + sub(i), groups > 4 ? 7.5 : 8.5, "#b45309", "middle", 800);
            s += L(xi, by2, xi, 112, "#f59e0b", 1.5);
            s += DT(xi, 112, "#f59e0b", 2.4);
          }
          /* 地址高位输入 */
          s += L(46, 70, bx1, 70, "#2563eb", 1.8);
          s += '<path d="M' + (bx1 - 1) + ' 70 l-8 -4 l0 8 z" fill="#2563eb"/>';
        }

        /* ---------- 地址总线（左） ---------- */
        var busTop = groups > 1 ? 70 : (y0 - 44);
        s += L(46, busTop, 46, lastMid, "#cbd5e1", 2.4);
        var ly = (busTop + lastMid) / 2;
        s += '<text x="28" y="' + ly + '" transform="rotate(-90 34 ' + ly + ')" font-size="9" font-weight="800" ' +
             'fill="#64748b" text-anchor="middle">地址 A' + sub(q.aChip - 1) + '~A' + sub(0) + ' 并联</text>';

        /* ---------- 数据总线（右） ---------- */
        s += L(dataX, busTop, dataX, lastDsY, "#cbd5e1", 2.4);
        s += '<text x="690" y="' + ly + '" transform="rotate(90 690 ' + ly + ')" font-size="9" font-weight="800" ' +
             'fill="#64748b" text-anchor="middle">数据 D' + sub(q.t.d - 1) + '~D' + sub(0) + '</text>';

        /* ---------- 芯片阵列 ---------- */
        for (r = 0; r < groups; r++){
          cy = y0 + r * rowH;
          mid = cy + chh / 2;
          sel = (r === M.sel);
          var lastCX = x0 + (perG - 1) * (cw + gap);

          if (sel){
            s += '<rect x="' + (x0 - 44) + '" y="' + (cy - 22) + '" width="' + (gridW + 66) + '" height="' + (chh + 38) +
                 '" rx="9" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.4" opacity=".92"/>';
          }

          /* 地址支线 */
          s += L(46, mid, x0, mid, sel ? "#2563eb" : "#94a3b8", sel ? 2 : 1.4);
          s += DT(46, mid, "#94a3b8", 3);

          /* 片选母线 + 各片 /CS */
          var csY = cy - 13;
          s += L(x0 - 34, csY, lastCX + 16, csY, sel ? "#dc2626" : "#94a3b8", sel ? 2 : 1.4);
          s += TX(lastCX + 21, csY + 3.5, groups > 1 ? ("Y" + sub(r)) : "GND", 8.5,
                  sel ? "#b91c1c" : "#94a3b8", "start", 800);
          for (cc = 0; cc < perG; cc++){
            cx = x0 + cc * (cw + gap);
            if (perG > 1) s += DT(cx + 16, csY, sel ? "#dc2626" : "#94a3b8", 2.8);
            s += L(cx + 16, csY, cx + 16, cy, sel ? "#dc2626" : "#94a3b8", 1.4);
          }

          /* 数据母排：走芯片下方，避免穿过同排其他芯片 */
          var dsY = cy + 56, dxA = x0 + cw - 30;
          s += L(dxA, dsY, dataX, dsY, sel ? "#2563eb" : "#94a3b8", sel ? 1.8 : 1.3);
          s += DT(dataX, dsY, "#94a3b8", 2.8);

          /* 芯片本体 */
          for (cc = 0; cc < perG; cc++){
            cx = x0 + cc * (cw + gap);
            s += '<rect x="' + cx + '" y="' + cy + '" width="' + cw + '" height="' + chh + '" rx="5" fill="#fff" stroke="' +
                 (sel ? "#f59e0b" : "#cbd5e1") + '" stroke-width="' + (sel ? 1.8 : 1.4) + '"/>';
            s += TX(cx + cw / 2, cy + 21, c.nm, 11.5, "#0f172a", "middle", 800);
            if (perG > 1){
              s += TX(cx + cw / 2, cy + 33, "D" + sub(cc * c.d + c.d - 1) + "~D" + sub(cc * c.d),
                      8, "#94a3b8", "middle", 700);
            }
            s += TX(cx + 20, cy + 10, "/CS", 7, "#b91c1c", "start", 700);
            /* 数据支线 */
            s += L(cx + cw - 30, cy + chh, cx + cw - 30, dsY, sel ? "#2563eb" : "#94a3b8", sel ? 1.8 : 1.3);
            s += DT(cx + cw - 30, dsY, sel ? "#2563eb" : "#94a3b8", 2.8);
          }

          /* 该组地址范围 */
          var a0v = r * c.w * 1024, a1v = (r + 1) * c.w * 1024 - 1;
          s += TX(58, mid + 13, hexs(a0v, q.hd) + "H–" + hexs(a1v, q.hd) + "H", 8.5,
                  sel ? "#b45309" : "#b3c0d1", "start", 700);

          /* 点击热区 */
          s += '<rect data-r="' + r + '" x="' + (x0 - 44) + '" y="' + (cy - 22) + '" width="' + (gridW + 66) +
               '" height="' + (chh + 38) + '" fill="transparent" style="cursor:pointer"/>';
        }

        /* ---------- 选中组：译码器 Y 到 /CS 的虚线 ---------- */
        if (groups > 1){
          var tx = outX[M.sel], tcy = y0 + M.sel * rowH - 13;
          s += '<path d="M' + tx + ' 112 L' + tx + ' ' + tcy + ' L' + (x0 - 34) + ' ' + tcy +
               '" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 4"/>';
          s += DT(x0 - 34, tcy, "#f59e0b", 3);
        }

        svg.innerHTML = s;
      }

      function render(){
        var bs = document.querySelectorAll("#n10 [data-memc]"), i;
        for (i = 0; i < bs.length; i++) bs[i].classList.toggle("on", +bs[i].getAttribute("data-memc") === M.chip);
        bs = document.querySelectorAll("#n10 [data-memt]");
        for (i = 0; i < bs.length; i++) bs[i].classList.toggle("on", +bs[i].getAttribute("data-memt") === M.tgt);

        draw();

        var q = calc(), c = q.c;
        var selA0 = M.sel * c.w * 1024, selA1 = (M.sel + 1) * c.w * 1024 - 1;

        var cells = [
          ["总片数", q.total + " 片", q.perG + " 片/组 × " + q.groups + " 组"],
          ["位扩展", q.perG > 1 ? (q.perG + " 片并联") : "不需要",
           q.perG > 1 ? ("数据线拆成 " + q.perG + " 段") : "单片字长已够"],
          ["字扩展", q.groups > 1 ? (q.groups + " 组") : "不需要",
           q.groups > 1 ? ("片选要 " + q.groups + " 选 1") : "单组够用，不必译码"],
          ["地址线", q.aTot + " 根",
           q.groups > 1 ? ("低 " + q.aChip + " 根并联，高 " + (q.aTot - q.aChip) + " 根进译码器")
                        : ("全部 " + q.aChip + " 根并联，无需译码")],
          ["数据线", q.t.d + " 根", "D" + sub(q.t.d - 1) + " ~ D" + sub(0)],
          ["第 " + M.sel + " 组地址", hexs(selA0, q.hd) + "H~" + hexs(selA1, q.hd) + "H",
           q.aSel ? ("高位 = " + binb(M.sel, q.aSel)) : "只有一组"]
        ];
        var h = "", k;
        for (k = 0; k < cells.length; k++){
          h += '<div class="mem-cell"><span>' + cells[k][0] + '</span><b>' + cells[k][1] +
               '</b><em>' + cells[k][2] + '</em></div>';
        }
        info.innerHTML = h;

        var t1 = "低 " + q.aChip + " 根地址 A" + sub(q.aChip - 1) + "~A" + sub(0) + " 并联到每一片，" +
                   "所有芯片同时收到同一个单元号（组内、组间都一样）。";
        var t2 = q.groups > 1
          ? "高 " + q.aSel + " 根 A" + sub(q.aTot - 1) + "~A" + sub(q.aChip) + " 进译码器，译出 " + q.groups +
            " 根片选，任一时刻只有选中那根是 0，其余组的数据端呈高阻，不会抢总线。"
          : "只有一组，不需要译码，/CS 直接接地让它常有效。";

        var t3;
        if (q.perG > 1){
          t3 = "字长要 " + q.t.d + " 位，单片只出 " + c.d + " 位，所以把 " + q.perG + " 片的数据端并到总线的不同位段上——";
          for (k = 0; k < q.perG; k++){
            t3 += (k ? "、" : "") + "第 " + k + " 片接 D" + sub(k * c.d + c.d - 1) + "~D" + sub(k * c.d);
          }
          t3 += "；各片读写同时进行，一次凑齐 " + q.t.d + " 位。";
        } else {
          t3 = "单片就有 " + c.d + " 位，数据端直接整体挂上数据总线，不需要拼接。";
        }

        var t4 = "第 " + M.sel + " 组占 " + hexs(selA0, q.hd) + "H ~ " + hexs(selA1, q.hd) + "H，共 " + (c.w * 1024) +
                 " 个单元——因为它的片选 Y" + sub(M.sel) + " 只在" +
                 (q.aSel ? ("高位地址 = " + binb(M.sel, q.aSel)) : "唯一一组") + " 时才为 0。";

        note.innerHTML = "<b>选中第 " + M.sel + " 组时，三件事同时成立：</b><br>" +
                         "· <b>地址怎么分</b>：" + t1 + t2 + "<br>" +
                         "· <b>数据怎么拼</b>：" + t3 + "<br>" +
                         "· <b>这组的地址范围</b>：" + t4;
      }

      function mkBtn(box, attr, idx, txt){
        var b = document.createElement("button");
        b.className = "mini";
        b.setAttribute(attr, idx);
        b.textContent = txt;
        box.appendChild(b);
      }

      var chipBox = document.getElementById("memChip");
      var tgtBox = document.getElementById("memTgt");
      var n;
      for (n = 0; n < CHIPS.length; n++) mkBtn(chipBox, "data-memc", n, CHIPS[n].nm);
      for (n = 0; n < TGTS.length; n++) mkBtn(tgtBox, "data-memt", n, TGTS[n].nm);

      chipBox.addEventListener("click", function(e){
        var t = e.target;
        if (!t.getAttribute || t.getAttribute("data-memc") === null) return;
        M.chip = +t.getAttribute("data-memc");
        M.sel = 0;
        render();
      });
      tgtBox.addEventListener("click", function(e){
        var t = e.target;
        if (!t.getAttribute || t.getAttribute("data-memt") === null) return;
        M.tgt = +t.getAttribute("data-memt");
        M.sel = 0;
        render();
      });
      svg.addEventListener("click", function(e){
        var t = e.target, r = t.getAttribute && t.getAttribute("data-r");
        if (r === null || r === undefined) return;
        M.sel = +r;
        render();
      });

      render();
    })();
    