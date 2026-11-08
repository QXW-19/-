/* 第六章 · 序列发生器与节拍分配器（n9）：原样外置的同步 IIFE。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    /* ==================== 序列发生器（151）与节拍分配器（138） ==================== */
    (function(){
      var svg1 = document.getElementById("wav151");
      if (!svg1) return;

      var S = { pos: 0, D: [1,0,1,1,0,0,1,0] };
      var CW = 48, X0 = 30;

      function bits3(v){ return [v & 1, (v >> 1) & 1, (v >> 2) & 1]; }
      function seqStr(){
        var t = "";
        for (var i = 0; i < 8; i++) t += S.D[i];
        return t;
      }

      /* ---------- 151 输出波形 ---------- */
      function draw151(){
        var s = "", i, yh = 26, yl = 62, prev = null, d = "";

        s += '<rect x="' + (X0 + S.pos*CW) + '" y="13" width="' + CW + '" height="59" rx="4" fill="#fffbeb"/>';

        for (i = 0; i < 8; i++){
          var lvl = S.D[i] ? yh : yl;
          var x = X0 + i*CW;
          if (prev === null) d += "M" + x + " " + lvl;
          else if (lvl !== prev) d += " V" + lvl;
          d += " h" + CW;
          prev = lvl;
        }
        s += '<path d="' + d + '" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linejoin="round"/>';

        s += '<line x1="' + X0 + '" y1="88" x2="' + (X0 + 8*CW) + '" y2="88" stroke="#e2e8f0" stroke-width="1.4"/>';
        for (i = 0; i < 8; i++){
          var lx = X0 + i*CW + CW/2, cur = (i === S.pos);
          s += '<text x="' + lx + '" y="100" font-size="9" font-weight="800" font-family="ui-monospace,Consolas,monospace" fill="' +
               (cur ? "#b45309" : "#b3c0d1") + '" text-anchor="middle">' + i + '</text>';
        }
        s += '<text x="10" y="50" font-size="10" font-weight="800" fill="#475569">Y</text>';

        var dy = S.D[S.pos] ? yh : yl;
        s += '<circle cx="' + (X0 + S.pos*CW + CW/2) + '" cy="' + dy + '" r="4" fill="#f59e0b" stroke="#fff" stroke-width="1.6"/>';

        svg1.innerHTML = s;
      }

      /* ---------- 138 节拍波形 ---------- */
      function draw138(){
        var s = "", i, k, top = 16, rh = 22, ph = 13, x0 = 52, cw = 45;

        s += '<rect x="' + (x0 + S.pos*cw) + '" y="8" width="' + cw + '" height="' + (8*rh + 4) + '" rx="4" fill="#fffbeb"/>';

        for (k = 0; k < 8; k++){
          var yh = top + k*rh, yl = yh + ph, prev = null, d = "";
          for (i = 0; i < 8; i++){
            var lvl = (i === k) ? yl : yh;
            if (prev === null) d += "M" + (x0 + i*cw) + " " + lvl;
            else if (lvl !== prev) d += " V" + lvl;
            d += " h" + cw;
            prev = lvl;
          }
          var hi = (k === S.pos);
          s += '<path d="' + d + '" fill="none" stroke="' + (hi ? "#f59e0b" : "#94a3b8") +
               '" stroke-width="' + (hi ? 2.2 : 1.5) + '" stroke-linejoin="round"/>';
          s += '<text x="46" y="' + (yh + 10) + '" font-size="9" font-weight="800" font-family="ui-monospace,Consolas,monospace" fill="' +
               (hi ? "#b45309" : "#94a3b8") + '" text-anchor="end">Y' + k + '</text>';
        }

        s += '<line x1="' + x0 + '" y1="' + (top + 8*rh + 2) + '" x2="' + (x0 + 8*cw) + '" y2="' + (top + 8*rh + 2) + '" stroke="#e2e8f0" stroke-width="1.4"/>';
        for (i = 0; i < 8; i++){
          var cur = (i === S.pos);
          s += '<text x="' + (x0 + i*cw + cw/2) + '" y="' + (top + 8*rh + 15) + '" font-size="9" font-weight="800" font-family="ui-monospace,Consolas,monospace" fill="' +
               (cur ? "#b45309" : "#b3c0d1") + '" text-anchor="middle">' + i + '</text>';
        }

        document.getElementById("wav138").innerHTML = s;
      }

      /* ---------- 汇总渲染 ---------- */
      function render(){
        var b = bits3(S.pos), h = "", i;
        for (i = 2; i >= 0; i--){
          h += '<div class="lamp' + (b[i] ? " act" : "") + '">' + b[i] + '<small>Q' + i + '</small></div>';
        }
        h += '<div class="lamp act">' + S.pos + '<small>计数</small></div>';
        document.getElementById("cntLamp").innerHTML = h;

        draw151();
        draw138();

        var bh = "";
        for (i = 0; i < 8; i++){
          var on = (i === S.pos);
          bh += '<div class="lamp' + (on ? " act" : "") + '">' + (on ? 0 : 1) + '<small>Y' + i + '</small></div>';
        }
        document.getElementById("beatLamp").innerHTML = bh;

        document.getElementById("note151s").innerHTML =
          "当前地址 A₂A₁A₀ = <b>" + b[2] + b[1] + b[0] + "</b>（" + S.pos + "），选中 <b>D<sub>" + S.pos + "</sub> = " +
          S.D[S.pos] + "</b>，这一拍 Y = <b>" + S.D[S.pos] + "</b>。八拍走完回到 D₀，序列 <b>" + seqStr() + "</b> 循环输出。";

        document.getElementById("note138b").innerHTML =
          "当前地址 = <b>" + S.pos + "</b>，选中 <b>Y<sub>" + S.pos + "</sub></b> —— 只有它为 <b>0</b>，其余七路全为 1。" +
          "下一个时钟低电平就挪到 Y<sub>" + ((S.pos + 1) % 8) + "</sub>。";

        document.querySelectorAll('[data-sd]').forEach(function(btn){
          var k = +btn.getAttribute("data-sd");
          btn.classList.toggle("on", S.D[k] === 1);
          btn.classList.toggle("hi", k === S.pos);
          btn.innerHTML = "D<sub>" + k + "</sub>=" + S.D[k];
        });
      }

      document.querySelectorAll('[data-sd]').forEach(function(btn){
        btn.addEventListener("click", function(){
          var k = +this.getAttribute("data-sd");
          S.D[k] = S.D[k] ? 0 : 1;
          render();
        });
      });

      document.getElementById("btnQ").addEventListener("click", function(){
        var btn = this;
        btn.classList.add("flash");
        setTimeout(function(){ btn.classList.remove("flash"); }, 150);
        S.pos = (S.pos + 1) % 8;
        render();
      });

      render();
    })();
    