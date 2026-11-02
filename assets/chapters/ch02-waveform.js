
    /* ==================== 第二章 · 波形图与真值表 ==================== */
    (function(){
      var svg = document.getElementById("wfSvg");
      if (!svg) return;
      var S = { y: [0,1,1,0,0,1,0,1], cur: 0, timer: null, on: false };
      var W = 620, L = 56, CW = 66, TOP = 60, GAP = 56, H = 30;

      function bit(i, k){ return (i >> (2 - k)) & 1; }   // k=0 → A

      function render(){
        var o = [], i, k;
        var names = ["A", "B", "C", "Y"];

        // 当前列底色
        o.push('<rect x="' + (L + S.cur * CW) + '" y="28" width="' + CW + '" height="' + (3 * GAP + H + 14) + '" fill="#f59e0b" opacity=".12"/>');

        for (k = 0; k < 4; k++){
          var base = TOP + k * GAP;
          o.push('<line x1="' + L + '" y1="' + base + '" x2="' + (L + 8 * CW) + '" y2="' + base + '" stroke="#f1f5f9"/>');
          var col = k === 3 ? "#0ea5a4" : "#475569";
          o.push('<text x="' + (L - 12) + '" y="' + (base - H / 2 + 1) + '" font-size="13" font-weight="800" fill="' + col + '" text-anchor="end">' + names[k] + '</text>');

          for (i = 0; i < 8; i++){
            var v = (k === 3) ? S.y[i] : bit(i, k);
            var y = v ? base - H : base;
            var x1 = L + i * CW;
            o.push('<line x1="' + x1 + '" y1="' + y + '" x2="' + (x1 + CW) + '" y2="' + y + '" stroke="' + col + '" stroke-width="2.6"/>');
            if (i > 0){
              var pv = (k === 3) ? S.y[i - 1] : bit(i - 1, k);
              if (pv !== v){
                o.push('<line x1="' + x1 + '" y1="' + (base - (pv ? H : 0)) + '" x2="' + x1 + '" y2="' + (base - (v ? H : 0)) + '" stroke="' + col + '" stroke-width="2.6"/>');
              }
            }
          }
        }

        // 时间轴标签
        for (i = 0; i < 8; i++){
          o.push('<text x="' + (L + i * CW + CW / 2) + '" y="' + (TOP + 3 * GAP + H + 24) + '" font-size="10.5" fill="#b3c0d1" text-anchor="middle">m' + ("00" + i.toString(2)).slice(-3) + '</text>');
        }

        // 点击热区
        for (i = 0; i < 8; i++){
          o.push('<rect class="wf-col" data-i="' + i + '" x="' + (L + i * CW) + '" y="28" width="' + CW + '" height="' + (3 * GAP + H + 14) + '" fill="transparent" style="cursor:pointer;"/>');
        }
        svg.innerHTML = o.join("");

        // 真值表
        var tb = document.getElementById("wfTable").querySelector("tbody");
        var rows = "";
        for (i = 0; i < 8; i++){
          rows += '<tr class="wf-row" data-i="' + i + '" style="cursor:pointer;' + (i === S.cur ? "background:#fff8ec;" : "") + '">' +
                  '<td style="font-family:monospace;color:#8b9bb4">m' + ("00" + i.toString(2)).slice(-3) + '</td>' +
                  '<td>' + bit(i,0) + '</td><td>' + bit(i,1) + '</td><td>' + bit(i,2) + '</td>' +
                  '<td style="font-weight:800;color:' + (S.y[i] ? "#e8552f" : "#b3c0d1") + '">' + S.y[i] + '</td></tr>';
        }
        tb.innerHTML = rows;

        // 读数
        var ones = [];
        for (i = 0; i < 8; i++) if (S.y[i]) ones.push(i);
        document.getElementById("wfMin").textContent = "m" + ("00" + S.cur.toString(2)).slice(-3);
        document.getElementById("wfExpr").textContent = ones.length ? "Σm(" + ones.join(",") + ")" : "0";
        document.getElementById("wfCap").innerHTML =
          "第 <b>" + (S.cur + 1) + "</b> 列对应 ABC = <b>" + bit(S.cur,0) + bit(S.cur,1) + bit(S.cur,2) +
          "</b>，即最小项 <b>m" + ("00" + S.cur.toString(2)).slice(-3) + "</b>，此时 Y = <b>" + S.y[S.cur] + "</b>。";
        document.getElementById("wfNarr").innerHTML = "共有 <b>" + ones.length +
          "</b> 个最小项让 Y = 1。点波形或表格里的任意一格，Y 就翻一次，两边同时变。";
      }

      function toggle(i){ S.y[i] = S.y[i] ? 0 : 1; S.cur = i; render(); }

      svg.addEventListener("click", function(e){
        var t = e.target.closest(".wf-col");
        if (t) toggle(+t.getAttribute("data-i"));
      });
      document.getElementById("wfTable").addEventListener("click", function(e){
        var r = e.target.closest(".wf-row");
        if (r) toggle(+r.getAttribute("data-i"));
      });

      function stop(){ if (S.timer){ clearInterval(S.timer); S.timer = null; } S.on = false;
        var b = document.getElementById("wfScan"); if (b) b.textContent = "▶ 从头扫一遍"; }

      document.getElementById("wfScan").addEventListener("click", function(){
        if (S.on){ stop(); return; }
        S.on = true; this.textContent = "⏸ 停止";
        S.cur = 0; render();
        S.timer = setInterval(function(){
          if (S.cur >= 7){ stop(); return; }
          S.cur++; render();
        }, 600);
      });
      document.getElementById("wfEg1").addEventListener("click", function(){
        stop(); S.y = [0,1,1,0,0,1,0,1]; S.cur = 0; render();
      });
      document.getElementById("wfEg2").addEventListener("click", function(){
        stop(); S.y = [0,0,0,0,0,0,0,0]; S.cur = 0; render();
      });

      render();
    })();
    