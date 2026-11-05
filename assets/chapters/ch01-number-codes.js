/* 第一章 · 数制与五种编码对照表（g6）：原样外置的同步 IIFE，仅依赖自身 DOM 控件。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    (function(){
      var rng = document.getElementById("g6n");
      if (!rng) return;
      var N = 45;

      function pad(v, n){ var s = v.toString(2); while (s.length < n) s = "0" + s; return s; }
      function grayOf(v){ return v ^ (v >> 1); }
      function perDigit(v, off){
        var t = v.toString(), out = [], i;
        for (i = 0; i < t.length; i++) out.push(pad(parseInt(t.charAt(i), 10) + off, 4));
        return out.join(" ");
      }
      function cell(k, v, sub, hi){
        return '<div class="g6-cell' + (hi ? " hi" : "") + '"><div class="k">' + k + '</div>' +
               '<div class="v">' + v + (sub ? '<em>' + sub + '</em>' : '') + '</div></div>';
      }

      function render(){
        var h = "";
        h += cell("二进制 BIN", pad(N, 8), "8 位");
        h += cell("八进制 OCT", N.toString(8), "每 3 位一组");
        h += cell("十六进制 HEX", N.toString(16).toUpperCase(), "每 4 位一组");
        h += cell("8421 BCD", perDigit(N, 0), "每 4 位一个十进制位", true);
        h += cell("余 3 码", perDigit(N, 3), "BCD 逐位 + 0011", true);
        h += cell("格雷码", pad(grayOf(N), 8), "相邻只差一位");
        document.getElementById("g6out").innerHTML = h;
        document.getElementById("g6nv").textContent = N;
        rng.value = N;
      }

      rng.addEventListener("input", function(){ N = parseInt(this.value, 10); render(); });
      document.querySelectorAll('[data-g6]').forEach(function(b){
        b.addEventListener("click", function(){
          N = Math.min(255, Math.max(0, N + parseInt(this.getAttribute("data-g6"), 10)));
          render();
        });
      });

      /* 0~15 对照表 */
      var Y3 = [0,1,2,3,4,5,6,7,8,9];
      var C2421 = ["0000","0001","0010","0011","0100","1011","1100","1101","1110","1111"];
      var tb = "";
      for (var i = 0; i < 16; i++){
        var b = pad(i, 4);
        tb += '<tr style="' + (i % 2 ? "background:#fbfdff;" : "") + '">' +
              '<td style="padding:5px 8px; border-bottom:1px solid #f1f5f9; font-weight:800;">' + i + '</td>' +
              '<td style="padding:5px 8px; border-bottom:1px solid #f1f5f9;">' + b + '</td>' +
              '<td style="padding:5px 8px; border-bottom:1px solid #f1f5f9;">' + (i <= 9 ? pad(i, 4) : '<span style="color:#cbd5e1">' + pad(i, 4) + ' 伪</span>') + '</td>' +
              '<td style="padding:5px 8px; border-bottom:1px solid #f1f5f9;">' + (i <= 9 ? pad(i+3, 4) : "—") + '</td>' +
              '<td style="padding:5px 8px; border-bottom:1px solid #f1f5f9;">' + (i <= 9 ? C2421[i] : "—") + '</td>' +
              '<td style="padding:5px 8px; border-bottom:1px solid #f1f5f9; color:#b45309; font-weight:800;">' + pad(grayOf(i), 4) + '</td>' +
              '</tr>';
      }
      document.getElementById("g6tab").innerHTML = tb;
      render();
    })();
    