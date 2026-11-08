/* 第四章 · 74LS138 译码器与 74LS151 数据选择器（g2）：原样外置的同步 IIFE。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    /* ==================== 74LS138 / 74LS151 交互 ==================== */
    (function(){
      var svg138 = document.getElementById("svg138");
      if (!svg138) return;

      var S = { A: [0,0,0], G1: 0, G2A: 0, G2B: 0,      // 138
                EA: [0,0,0], EE: 1, D: [0,0,0,0,0,0,0,0] };  // 151

      /* ---------- 画 138 引脚框图 ---------- */
      function draw138(){
        var s = "";
        var st = "#3b4a5f";
        s += '<rect x="104" y="26" width="140" height="196" rx="5" fill="#fff" stroke="' + st + '" stroke-width="2.2"/>';
        s += '<text x="174" y="42" font-size="11" font-weight="800" fill="#94a3b8" text-anchor="middle" letter-spacing="1">74LS138</text>';

        var lp = [["A0","A₀",62],["A1","A₁",86],["A2","A₂",110],["G1","G₁",146],["G2A","/G₂A",170],["G2B","/G₂B",194]];
        lp.forEach(function(p){
          s += '<line x1="60" y1="' + p[2] + '" x2="104" y2="' + p[2] + '" stroke="' + st + '" stroke-width="1.8"/>';
          s += '<text x="54" y="' + (p[2] + 4) + '" font-size="11" font-weight="700" fill="#475569" text-anchor="end">' + p[1] + '</text>';
        });

        for (var i = 0; i < 8; i++){
          var y = 48 + i * 20;
          var on = (i === curOut()) && enabled();
          s += '<line x1="244" y1="' + y + '" x2="288" y2="' + y + '" stroke="' + (on ? "#f59e0b" : st) + '" stroke-width="' + (on ? 2.4 : 1.8) + '"/>';
          s += '<text x="292" y="' + (y + 4) + '" font-size="11" font-weight="800" fill="' + (on ? "#b45309" : "#475569") + '">Y' + i + '</text>';
          s += '<line x1="292" y1="' + (y - 7) + '" x2="' + (292 + 15) + '" y2="' + (y - 7) + '" stroke="' + (on ? "#b45309" : "#475569") + '" stroke-width="1.4"/>';
        }
        svg138.innerHTML = s;
      }

      function enabled(){ return S.G1 === 1 && S.G2A === 0 && S.G2B === 0; }
      /* 位序统一：下标 0 = 最低位 A0 */
      function curOut(){ return S.A[0] + S.A[1]*2 + S.A[2]*4; }
      function addrStr(a){ return "" + a[2] + a[1] + a[0]; }

      /* ---------- 画 151 引脚框图 ---------- */
      function draw151(){
        var s = "";
        var st = "#3b4a5f";
        s += '<rect x="104" y="18" width="140" height="220" rx="5" fill="#fff" stroke="' + st + '" stroke-width="2.2"/>';
        s += '<text x="174" y="34" font-size="11" font-weight="800" fill="#94a3b8" text-anchor="middle" letter-spacing="1">74LS151</text>';

        // 数据输入 D0..D7（上方，间距收紧）
        for (var i = 0; i < 8; i++){
          var y = 52 + i * 15;
          var sel = (i === curAddr()) && S.EE === 0;
          s += '<line x1="60" y1="' + y + '" x2="104" y2="' + y + '" stroke="' + (sel ? "#f59e0b" : st) + '" stroke-width="' + (sel ? 2.4 : 1.8) + '"/>';
          s += '<text x="54" y="' + (y + 4) + '" font-size="10.5" font-weight="700" fill="' + (sel ? "#b45309" : "#475569") + '" text-anchor="end">D' + i + '</text>';
        }

        // 地址与使能（下方）
        var lp = [["A₀", 182], ["A₁", 200], ["A₂", 218], ["/E", 234]];
        lp.forEach(function(p){
          s += '<line x1="60" y1="' + p[1] + '" x2="104" y2="' + p[1] + '" stroke="' + st + '" stroke-width="1.8"/>';
          s += '<text x="54" y="' + (p[1] + 4) + '" font-size="10.5" font-weight="700" fill="#475569" text-anchor="end">' + p[0] + '</text>';
        });

        // 右侧 Y / Y′
        s += '<line x1="244" y1="96" x2="288" y2="96" stroke="' + st + '" stroke-width="1.8"/>';
        s += '<text x="292" y="100" font-size="11" font-weight="800" fill="#475569">Y</text>';
        s += '<line x1="244" y1="150" x2="288" y2="150" stroke="' + st + '" stroke-width="1.8"/>';
        s += '<text x="292" y="154" font-size="11" font-weight="800" fill="#475569">Y</text>';
        s += '<line x1="292" y1="143" x2="307" y2="143" stroke="#475569" stroke-width="1.4"/>';

        svg151.innerHTML = s;
      }
      function curAddr(){ return S.EA[0] + S.EA[1]*2 + S.EA[2]*4; }

      /* ---------- 138 更新 ---------- */
      function render138(){
        draw138();
        var on = enabled(), idx = curOut();
        var html = "";
        for (var i = 0; i < 8; i++){
          var act = on && i === idx;
          html += '<div class="lamp' + (act ? " act" : "") + '">' + (act ? 0 : 1) + '<small>Y' + i + '</small></div>';
        }
        document.getElementById("lamp138").innerHTML = html;

        var note = document.getElementById("note138");
        if (!on){
          note.innerHTML = "<b>未使能。</b>G₁=" + S.G1 + "，/G₂A=" + S.G2A + "，/G₂B=" + S.G2B +
            "，三者不满足 -> 八个输出全部为高电平。";
        } else {
          note.innerHTML = "<b>已使能。</b>地址 A₂A₁A₀ = " + addrStr(S.A) + "，选中 <b>Y" + idx + "</b>，该路输出 0，其余全为 1。";
        }
        // 按钮态
        var LBL = { G1: "G₁", G2A: "/G₂A", G2B: "/G₂B" };
        document.querySelectorAll('[data-p]').forEach(function(b){
          var k = b.getAttribute("data-p");
          var v = (k === "G1") ? S.G1 : (k === "G2A") ? S.G2A : (k === "G2B") ? S.G2B : S.A[+k[1]];
          b.classList.toggle("on", v === 1 && k.indexOf("G2") !== 0);
          b.classList.toggle("hi", k.indexOf("G2") === 0 && v === 0);
          if (LBL[k]) b.textContent = LBL[k] + "=" + v;
        });
      }

      /* ---------- 151 更新 ---------- */
      function render151(){
        draw151();
        var idx = curAddr();
        var y = (S.EE === 0) ? S.D[idx] : 0;
        var html =
          '<div class="lamp' + (y ? " act" : "") + '">' + y + '<small>Y</small></div>' +
          '<div class="lamp' + (y ? "" : " act") + '">' + (y ? 0 : 1) + '<small>Y′</small></div>' +
          '<div class="lamp' + (S.EE === 0 ? " act" : "") + '">' + (S.EE === 0 ? "选中 " + idx : "禁止") + '<small>/E=' + S.EE + '</small></div>';
        document.getElementById("lamp151").innerHTML = html;

        document.getElementById("note151").innerHTML = (S.EE === 0)
          ? "<b>已使能。</b>地址 = " + addrStr(S.EA) + "，选中 <b>D" + idx + " = " + S.D[idx] + "</b>，所以 Y = " + y + "，Y′ = " + (y ? 0 : 1) + "。"
          : "<b>/E = 1，芯片被禁止。</b>Y 恒为 0、Y′ 恒为 1，与地址和数据无关。";

        document.querySelectorAll('[data-q]').forEach(function(b){
          var k = b.getAttribute("data-q");
          var v = (k === "E") ? S.EE : S.EA[+k[1]];
          b.classList.toggle("on", v === 1);
          if (k === "E") b.textContent = "/E=" + v;
        });
        document.querySelectorAll('[data-d]').forEach(function(b){
          var i2 = +b.getAttribute("data-d");
          b.classList.toggle("on", S.D[i2] === 1);
          b.classList.toggle("hi", (i2 === idx && S.EE === 0));
        });
      }

      /* ---------- 事件 ---------- */
      document.querySelectorAll('[data-p]').forEach(function(b){
        b.addEventListener("click", function(){
          var k = this.getAttribute("data-p");
          if (k === "G1") S.G1 = S.G1 ? 0 : 1;
          else if (k === "G2A") S.G2A = S.G2A ? 0 : 1;
          else if (k === "G2B") S.G2B = S.G2B ? 0 : 1;
          else S.A[+k[1]] = S.A[+k[1]] ? 0 : 1;
          render138();
        });
      });
      document.querySelectorAll('[data-q]').forEach(function(b){
        b.addEventListener("click", function(){
          var k = this.getAttribute("data-q");
          if (k === "E") S.EE = S.EE ? 0 : 1;
          else S.EA[+k[1]] = S.EA[+k[1]] ? 0 : 1;
          render151();
        });
      });
      document.querySelectorAll('[data-d]').forEach(function(b){
        b.addEventListener("click", function(){
          var i2 = +this.getAttribute("data-d");
          S.D[i2] = S.D[i2] ? 0 : 1;
          render151();
        });
      });

      // 初始：138 未使能（/G2A、/G2B 默认为 0 表示有效，G1=1 才工作）
      S.G1 = 1; S.G2A = 0; S.G2B = 0;
      S.D = [1,1,1,0,0,1,0,1];
      render138();
      render151();
    })();
    