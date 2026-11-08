/* 第三章 · 门电路符号速查（g1）：原样外置的同步 IIFE，仅依赖自身 DOM 控件。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    /* ==================== 门电路符号速查 ==================== */
    (function(){
      var grid = document.getElementById("gateGrid");
      if (!grid) return;

      var GATES = [
        { k:"AND",  cn:"与门",   q:"&",  eq:"Y = A · B",        f:function(a,b){ return a & b; } },
        { k:"OR",   cn:"或门",   q:"≥1", eq:"Y = A + B",        f:function(a,b){ return a | b; } },
        { k:"NOT",  cn:"非门",   q:"1",  eq:"Y = A′",     one:true, f:function(a,b){ return 1 - a; } },
        { k:"NAND", cn:"与非门", q:"&",  eq:"Y = (A · B)′",     bub:true, f:function(a,b){ return 1 - (a & b); } },
        { k:"NOR",  cn:"或非门", q:"≥1", eq:"Y = (A + B)′",     bub:true, f:function(a,b){ return 1 - (a | b); } },
        { k:"XOR",  cn:"异或门", q:"=1", eq:"Y = A ⊕ B",        f:function(a,b){ return a ^ b; } },
        { k:"XNOR", cn:"同或门", q:"=1", eq:"Y = A ⊙ B",        bub:true, f:function(a,b){ return 1 - (a ^ b); } },
        { k:"BUF",  cn:"缓冲器", q:"1",  eq:"Y = A",      one:true, f:function(a,b){ return a; } }
      ];

      /* 用 SVG 画 IEC 矩形符号 */
      function symbol(g){
        var s = '<svg class="gate-svg" viewBox="0 0 170 100" xmlns="http://www.w3.org/2000/svg">';
        var stroke = "#3b4a5f";
        // 框体
        s += '<rect x="48" y="22" width="48" height="56" rx="3" fill="#fff" stroke="' + stroke + '" stroke-width="2.2"/>';
        // 限定符
        s += '<text x="72" y="52" font-size="15" font-weight="700" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">' + g.q + '</text>';
        // 输入线
        if (g.one){
          s += '<line x1="20" y1="50" x2="48" y2="50" stroke="' + stroke + '" stroke-width="2"/>';
          s += '<text x="16" y="50" font-size="12" font-weight="700" fill="#475569" text-anchor="end" dominant-baseline="middle">A</text>';
        } else {
          s += '<line x1="20" y1="36" x2="48" y2="36" stroke="' + stroke + '" stroke-width="2"/>';
          s += '<line x1="20" y1="64" x2="48" y2="64" stroke="' + stroke + '" stroke-width="2"/>';
          s += '<text x="16" y="36" font-size="12" font-weight="700" fill="#475569" text-anchor="end" dominant-baseline="middle">A</text>';
          s += '<text x="16" y="64" font-size="12" font-weight="700" fill="#475569" text-anchor="end" dominant-baseline="middle">B</text>';
        }
        // 输出线 + 小圈
        if (g.bub){
          s += '<line x1="96" y1="50" x2="100" y2="50" stroke="' + stroke + '" stroke-width="2"/>';
          s += '<circle cx="105" cy="50" r="5" fill="#fff" stroke="' + stroke + '" stroke-width="2"/>';
          s += '<line x1="110" y1="50" x2="142" y2="50" stroke="' + stroke + '" stroke-width="2"/>';
        } else {
          s += '<line x1="96" y1="50" x2="142" y2="50" stroke="' + stroke + '" stroke-width="2"/>';
        }
        s += '<text x="148" y="50" font-size="12" font-weight="700" fill="#475569" text-anchor="start" dominant-baseline="middle">Y</text>';
        s += '</svg>';
        return s;
      }

      var A = 0, B = 0;

      grid.innerHTML = GATES.map(function(g, i){
        return '<div class="gate-card">' +
                 '<div class="gate-h">' + g.cn + '<span>' + g.k + '</span></div>' +
                 symbol(g) +
                 '<div class="gate-eq">' + g.eq + '</div>' +
                 '<div class="gate-out" data-out="' + i + '">Y = 0</div>' +
               '</div>';
      }).join("");

      /* 真值表矩阵 */
      var COMBOS = [[0,0],[0,1],[1,0],[1,1]];
      var tt = document.getElementById("gateTT");
      var head = '<thead><tr><th style="width:56px;">A</th><th style="width:56px;">B</th>' +
                 GATES.map(function(g){ return '<th>' + g.cn.replace("门","") + '<br><span style="font-weight:600;color:#94a3b8;">' + g.q + '</span></th>'; }).join("") +
                 '</tr></thead>';
      var body = '<tbody>' + COMBOS.map(function(c, ci){
        return '<tr data-c="' + ci + '"><td>' + c[0] + '</td><td>' + c[1] + '</td>' +
          GATES.map(function(g){ return '<td>' + g.f(c[0], c[1]) + '</td>'; }).join("") + '</tr>';
      }).join("") + '</tbody>';
      tt.innerHTML = head + body;

      function render(){
        document.getElementById("gA").textContent = "A = " + A;
        document.getElementById("gB").textContent = "B = " + B;
        document.getElementById("gA").style.background = A ? "#fff8ec" : "";
        document.getElementById("gA").style.borderColor = A ? "#f59e0b" : "";
        document.getElementById("gA").style.color = A ? "#92400e" : "";
        document.getElementById("gB").style.background = B ? "#fff8ec" : "";
        document.getElementById("gB").style.borderColor = B ? "#f59e0b" : "";
        document.getElementById("gB").style.color = B ? "#92400e" : "";

        GATES.forEach(function(g, i){
          var v = g.f(A, B);
          var el = document.querySelector('[data-out="' + i + '"]');
          el.textContent = "Y = " + v;
          el.classList.toggle("on", !!v);
        });

        Array.prototype.forEach.call(tt.querySelectorAll("tbody tr"), function(tr){
          var c = COMBOS[+tr.getAttribute("data-c")];
          tr.classList.toggle("hl", c[0] === A && c[1] === B);
        });
      }

      document.getElementById("gA").addEventListener("click", function(){ A = A ? 0 : 1; render(); });
      document.getElementById("gB").addEventListener("click", function(){ B = B ? 0 : 1; render(); });
      tt.addEventListener("click", function(e){
        var tr = e.target.closest("tr[data-c]");
        if (!tr) return;
        var c = COMBOS[+tr.getAttribute("data-c")];
        A = c[0]; B = c[1]; render();
      });

      render();
    })();
    