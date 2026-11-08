/* 第七章 · 555 五种接法（g5）：原样外置的同步 IIFE，含 SVG 与波形绘制。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    /* ==================== 555 五种接法 ==================== */
    (function(){
      var svg = document.getElementById("g5svg");
      if (!svg) return;

      var M = 0;
      var P = { R1: 10, R2: 10, C: 1, vi: 0.5 };
      var HI = true;      /* 施密特输出状态 */
      var Q5 = false;     /* 双稳输出状态 */

      var ST = "#3b4a5f";

      /* ---------- 绘图原件 ---------- */
      function res(x, y1, y2){
        return '<rect x="' + (x-7) + '" y="' + y1 + '" width="14" height="' + (y2-y1) +
               '" fill="#fff" stroke="' + ST + '" stroke-width="1.8"/>';
      }
      function capS(x, y){
        return '<line x1="' + (x-10) + '" y1="' + y + '" x2="' + (x+10) + '" y2="' + y + '" stroke="' + ST + '" stroke-width="2.4"/>' +
               '<line x1="' + (x-10) + '" y1="' + (y+8) + '" x2="' + (x+10) + '" y2="' + (y+8) + '" stroke="' + ST + '" stroke-width="2.4"/>';
      }
      function dioS(x, y){
        return '<path d="M' + (x-8) + ' ' + y + ' L' + (x+8) + ' ' + y + ' L' + x + ' ' + (y+12) + ' Z" fill="' + ST + '"/>' +
               '<line x1="' + (x-8) + '" y1="' + (y+12) + '" x2="' + (x+8) + '" y2="' + (y+12) + '" stroke="' + ST + '" stroke-width="2.4"/>';
      }
      function dot(x, y){ return '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + ST + '"/>'; }
      function ln(x1, y1, x2, y2, w){
        return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
               '" stroke="' + ST + '" stroke-width="' + (w || 1.8) + '"/>';
      }
      function pl(y, name, num){
        return ln(160, y, 210, y) +
               '<text x="216" y="' + (y+4) + '" font-size="9.5" font-weight="800" fill="#64748b">' + name + '</text>' +
               '<text x="156" y="' + (y-3) + '" font-size="8" font-weight="700" fill="#b3c0d1" text-anchor="end">' + num + '</text>';
      }
      function pr(y, name, num){
        return ln(305, y, 355, y) +
               '<text x="299" y="' + (y+4) + '" font-size="9.5" font-weight="800" fill="#64748b" text-anchor="end">' + name + '</text>' +
               '<text x="359" y="' + (y-3) + '" font-size="8" font-weight="700" fill="#b3c0d1">' + num + '</text>';
      }
      function box(){
        return '<rect x="210" y="65" width="95" height="185" rx="4" fill="#fff" stroke="' + ST + '" stroke-width="2.2"/>' +
               '<text x="257" y="150" font-size="14" font-weight="800" fill="#94a3b8" text-anchor="middle" letter-spacing="1">555</text>' +
               '<text x="257" y="166" font-size="8.5" font-weight="700" fill="#c3ccd8" text-anchor="middle">定时器</text>';
      }
      function rails(){
        return ln(110, 38, 512, 38) +
               '<text x="106" y="42" font-size="10" font-weight="800" fill="#475569" text-anchor="end">VCC</text>' +
               ln(110, 268, 512, 268) +
               '<text x="106" y="272" font-size="10" font-weight="800" fill="#475569" text-anchor="end">GND</text>' +
               ln(240, 38, 240, 65) + '<text x="246" y="58" font-size="8" font-weight="700" fill="#b3c0d1">8</text>' +
               ln(275, 38, 275, 65) + '<text x="281" y="58" font-size="8" font-weight="700" fill="#b3c0d1">4</text>' +
               ln(257, 250, 257, 268) + '<text x="263" y="262" font-size="8" font-weight="700" fill="#b3c0d1">1</text>';
      }

      /* ---------- 原理图（RC 网络统一放在 NX 处） ---------- */
      var NX = 450;

      function drawSch(){
        var s = rails() + box();
        if (M === 0){
          s += pl(110, "TR", "2") + pl(155, "THR", "6") + pl(200, "CV", "5") + pr(130, "OUT", "3");
          s += ln(96, 132, 140, 132) + ln(140, 110, 140, 155) + ln(140, 110, 160, 110) + ln(140, 155, 160, 155);
          s += dot(140, 132);
          s += '<text x="92" y="136" font-size="10" font-weight="800" fill="#1d4ed8" text-anchor="end">vI</text>';
          s += ln(355, 130, 430, 130);
          s += '<text x="434" y="134" font-size="10" font-weight="800" fill="#1d4ed8">vO</text>';
          s += '<text x="316" y="234" font-size="8.5" font-weight="700" fill="#b3c0d1">CV 悬空或接 0.01μF 滤波</text>';
        } else if (M === 1){
          s += pl(110, "TR", "2") + pl(200, "CV", "5") + pr(100, "DIS", "7") + pr(155, "THR", "6") + pr(222, "OUT", "3");
          s += ln(120, 110, 160, 110) + '<text x="116" y="114" font-size="10" font-weight="800" fill="#1d4ed8" text-anchor="end">vI</text>';
          s += ln(NX, 38, NX, 52) + res(NX, 52, 82) + ln(NX, 82, NX, 100);
          s += ln(355, 100, NX, 100) + dot(NX, 100);
          s += ln(NX, 100, NX, 155) + dot(NX, 155);
          s += ln(355, 155, NX, 155);
          s += ln(NX, 155, NX, 203) + capS(NX, 205) + ln(NX, 213, NX, 268);
          s += ln(355, 222, 420, 222) + '<text x="424" y="226" font-size="10" font-weight="800" fill="#1d4ed8">vO</text>';
          s += '<text x="' + (NX+16) + '" y="72" font-size="9.5" font-weight="700" fill="#94a3b8">R</text>';
          s += '<text x="' + (NX+16) + '" y="215" font-size="9.5" font-weight="700" fill="#94a3b8">C</text>';
        } else if (M === 2){
          s += pl(120, "OUT", "3") + pl(210, "CV", "5") + pr(100, "DIS", "7") + pr(155, "THR", "6") + pr(195, "TR", "2");
          s += ln(110, 120, 160, 120) + '<text x="106" y="124" font-size="10" font-weight="800" fill="#1d4ed8" text-anchor="end">vO</text>';
          s += ln(NX, 38, NX, 52) + res(NX, 52, 82) + ln(NX, 82, NX, 100);
          s += ln(355, 100, NX, 100) + dot(NX, 100);
          s += ln(NX, 100, NX, 112) + res(NX, 112, 142) + ln(NX, 142, NX, 155);
          s += ln(355, 155, NX, 155) + dot(NX, 155);
          s += ln(NX, 155, NX, 203) + capS(NX, 205) + ln(NX, 213, NX, 268);
          s += ln(355, 195, NX, 195) + dot(NX, 195);
          s += '<text x="' + (NX+16) + '" y="72" font-size="9.5" font-weight="700" fill="#94a3b8">R1</text>';
          s += '<text x="' + (NX+16) + '" y="131" font-size="9.5" font-weight="700" fill="#94a3b8">R2</text>';
          s += '<text x="' + (NX+16) + '" y="215" font-size="9.5" font-weight="700" fill="#94a3b8">C</text>';
        } else if (M === 3){
          var L = NX - 30, R = NX + 30;
          s += pl(120, "OUT", "3") + pl(210, "CV", "5") + pr(100, "DIS", "7") + pr(155, "THR", "6") + pr(195, "TR", "2");
          s += ln(110, 120, 160, 120) + '<text x="106" y="124" font-size="10" font-weight="800" fill="#1d4ed8" text-anchor="end">vO</text>';
          s += ln(NX, 38, NX, 100);
          s += ln(355, 100, R, 100);
          s += dot(NX, 100) + dot(L, 100) + dot(R, 100);
          s += ln(L, 100, L, 112) + res(L, 112, 142) + ln(L, 142, L, 155);
          s += ln(R, 100, R, 112) + dioS(R, 112) + ln(R, 124, R, 155);
          s += ln(L, 155, R, 155) + dot(NX, 155);
          s += ln(355, 155, NX, 155);
          s += ln(NX, 155, NX, 203) + capS(NX, 205) + ln(NX, 213, NX, 268);
          s += ln(355, 195, NX, 195) + dot(NX, 195);
          s += '<text x="' + (NX+16) + '" y="76" font-size="9.5" font-weight="700" fill="#94a3b8">R1</text>';
          s += '<text x="' + (L-14) + '" y="131" font-size="9.5" font-weight="700" fill="#94a3b8" text-anchor="end">R2</text>';
          s += '<text x="' + (R+10) + '" y="122" font-size="9.5" font-weight="700" fill="#94a3b8">D1</text>';
          s += '<text x="' + (NX+16) + '" y="215" font-size="9.5" font-weight="700" fill="#94a3b8">C</text>';
        } else {
          s += pl(110, "TR", "2") + pl(155, "THR", "6") + pl(200, "CV", "5") + pr(130, "OUT", "3");
          s += ln(110, 110, 160, 110) + ln(110, 155, 160, 155);
          s += '<circle cx="114" cy="110" r="3.5" fill="#fff" stroke="#dc2626" stroke-width="1.8"/>';
          s += '<text x="104" y="114" font-size="10" font-weight="800" fill="#b91c1c" text-anchor="end">S′</text>';
          s += '<text x="104" y="159" font-size="10" font-weight="800" fill="#b91c1c" text-anchor="end">R</text>';
          s += '<text x="104" y="99" font-size="8" font-weight="700" fill="#b3c0d1" text-anchor="end">低有效</text>';
          s += '<text x="104" y="144" font-size="8" font-weight="700" fill="#b3c0d1" text-anchor="end">高有效</text>';
          s += ln(355, 130, 430, 130);
          s += '<text x="434" y="134" font-size="10" font-weight="800" fill="#1d4ed8">Q</text>';
        }
        svg.innerHTML = s;
      }

      function slider(id, name, min, max, step, val, unit){
        return '<div class="par-row"><span class="pn">' + name + '</span>' +
               '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">' +
               '<span class="pv" id="v' + id + '">' + val + ' ' + unit + '</span></div>';
      }
      function buildPar(){
        var h = "";
        if (M === 0){
          h += slider("vi", "v_I", 0, 100, 1, Math.round(P.vi*100), "%Vcc");
        } else if (M === 1){
          h += slider("R1", "R", 1, 100, 1, P.R1, "kΩ");
          h += slider("C", "C", 0.1, 10, 0.1, P.C, "μF");
        } else if (M === 2 || M === 3){
          h += slider("R1", "R₁", 1, 100, 1, P.R1, "kΩ");
          h += slider("R2", "R₂", 1, 100, 1, P.R2, "kΩ");
          h += slider("C", "C", 0.1, 10, 0.1, P.C, "μF");
        }
        if (M === 4){
          h += '<div class="pin-group" style="margin-top:2px;">' +
               '<button class="mini" id="bSet">置位（TR 拉低）</button>' +
               '<button class="mini" id="bRst">复位（THR 拉高）</button></div>';
        }
        document.getElementById("g5par").innerHTML = h;

        ["R1","R2","C","vi"].forEach(function(k){
          var el = document.getElementById("" + k);
          if (!el) return;
          var unit = (k === "C") ? "μF" : (k === "vi") ? "%Vcc" : "kΩ";
          el.addEventListener("input", function(){
            var v = parseFloat(this.value);
            if (k === "vi") P.vi = v/100; else P[k] = v;
            document.getElementById("v" + k).textContent = (k === "vi" ? v : v) + " " + unit;
            if (k === "vi"){
              if (P.vi >= 2/3) HI = false;
              else if (P.vi <= 1/3) HI = true;
            }
            updateOut();
          });
        });

        var bs = document.getElementById("bSet"), br = document.getElementById("bRst");
        if (bs) bs.addEventListener("click", function(){ Q5 = true; updateOut(); });
        if (br) br.addEventListener("click", function(){ Q5 = false; updateOut(); });
      }

      /* ---------- 结果 ---------- */
      function updateOut(){
        var h = "";
        if (M === 0){
          var vo = HI ? 1 : 0;
          h = '<span class="big">vO = ' + (vo ? "高电平" : "低电平") + '</span>' +
              'V<sub>T+</sub> = ⅔V<sub>CC</sub> = <b>' + (100*2/3).toFixed(1) + '% V<sub>CC</sub></b><br>' +
              'V<sub>T−</sub> = ⅓V<sub>CC</sub> = <b>' + (100/3).toFixed(1) + '% V<sub>CC</sub></b><br>' +
              '回差 ΔV<sub>T</sub> = <b>' + (100/3).toFixed(1) + '% V<sub>CC</sub></b>';
        } else if (M === 1){
          var tw = 1.1 * P.R1 * P.C;
          h = '<span class="big">t<sub>W</sub> = ' + fmt(tw) + ' ms</span>' +
              't<sub>W</sub> = 1.1 × R × C<br>= 1.1 × <b>' + P.R1 + 'k</b> × <b>' + P.C + 'μ</b><br>' +
              '输出高电平维持 <b>' + fmt(tw) + ' ms</b> 后自动回落';
        } else if (M === 2){
          var T = 0.693 * (P.R1 + 2*P.R2) * P.C;
          var q = (P.R1 + P.R2) / (P.R1 + 2*P.R2) * 100;
          h = '<span class="big">T = ' + fmt(T) + ' ms　f = ' + fmt(1000/T, 1) + ' Hz</span>' +
              'T = 0.693(R₁+2R₂)C = <b>' + fmt(T) + ' ms</b><br>' +
              't₁ = 0.693(R₁+R₂)C = <b>' + fmt(0.693*(P.R1+P.R2)*P.C) + ' ms</b><br>' +
              't₂ = 0.693R₂C = <b>' + fmt(0.693*P.R2*P.C) + ' ms</b><br>' +
              '占空比 q = <b>' + q.toFixed(1) + ' %</b>　（恒 &gt; 50%）';
        } else if (M === 3){
          var t1 = 0.693 * P.R1 * P.C, t2 = 0.693 * P.R2 * P.C;
          var T3 = t1 + t2, q3 = P.R1 / (P.R1 + P.R2) * 100;
          h = '<span class="big">T = ' + fmt(T3) + ' ms　q = ' + q3.toFixed(1) + ' %</span>' +
              't₁ = 0.693R₁C = <b>' + fmt(t1) + ' ms</b>（充电，走 D1）<br>' +
              't₂ = 0.693R₂C = <b>' + fmt(t2) + ' ms</b>（放电，走 R2）<br>' +
              'T = <b>' + fmt(T3) + ' ms</b>　f = <b>' + fmt(1000/T3, 1) + ' Hz</b><br>' +
              'q = R₁/(R₁+R₂) = <b>' + q3.toFixed(1) + ' %</b>';
        } else {
          h = '<span class="big">Q = ' + (Q5 ? "1（高电平）" : "0（低电平）") + '</span>' +
              'TR 加低电平 → Q 置 1<br>THR 加高电平 → Q 清 0<br>' +
              '两个输入都不动时 <b>一直保持</b>';
        }
        document.getElementById("g5res").innerHTML = h;
        drawSch();
        drawWav();
        document.getElementById("g5note").innerHTML = NOTE[M];
      }

      function fmt(v, d){
        if (v >= 1000) return (v/1000).toFixed(d || 2) + " s";
        if (v >= 10) return v.toFixed(d || 1);
        return v.toFixed(d || 2);
      }

      var NOTE = [
        "TR 与 THR 并接当输入。<b>vI 升过 ⅔V<sub>CC</sub> 输出翻低、降到 ⅓V<sub>CC</sub> 以下输出翻高</b>——两个阈值不一样就是回差，用来整形和抗干扰。",
        "平时输出低。<b>TR 来一个负脉冲就翻转，输出高电平维持 t<sub>W</sub> = 1.1RC 后自动回落</b>。触发脉冲必须比 t<sub>W</sub> 短，否则会重新计时。",
        "无稳态，靠电容在 ⅓~⅔V<sub>CC</sub> 之间充放电自激。<b>充电走 R₁+R₂，放电只走 R₂</b>，所以占空比恒大于 50%。",
        "在 R₂ 两端并一只二极管：<b>充电时电流走二极管旁路掉 R₂，放电时二极管截止只能走 R₂</b>。占空比变成 R₁/(R₁+R₂)，可以小于 50%。",
        "TR 低电平置位、THR 高电平复位，<b>两个比较器直接当 RS 触发器用，不需要外接 RC</b>。输出一直保持，直到下一次触发。"
      ];

      /* ---------- 波形 ---------- */
      function vy(v){ return 92 - v*62; }
      function vz(v){ return 104 - v*112; }   /* 两行版：把 ⅓~⅔ 的摆幅拉高一点 */

      var VMAP = vy;
      function seg(x1, x2, v1, v2, n){
        var pts = [], i, u, v;
        for (i = 0; i <= n; i++){
          u = i/n;
          if (v2 > v1) v = 1 - (1-v1)*Math.pow((1-v2)/(1-v1), u);
          else v = v1 * Math.pow(v2/v1, u);
          pts.push((x1 + (x2-x1)*u).toFixed(1) + "," + VMAP(v).toFixed(1));
        }
        return pts;
      }

      function drawWav(){
        var w = document.getElementById("g5wav"), s = "", i;

        if (M === 0){
          /* 滞回特性：单色双支 + 方向箭头 */
          var X = function(v){ return 82 + v*404; }, Y = function(v){ return 155 - v*90; };
          s += ln(82, 155, 510, 155, 1.2) + ln(82, 155, 82, 46, 1.2);
          s += '<text x="514" y="159" font-size="9.5" font-weight="800" fill="#94a3b8">vI</text>';
          s += '<text x="76" y="44" font-size="9.5" font-weight="800" fill="#94a3b8" text-anchor="end">vO</text>';
          s += '<line x1="' + X(1/3) + '" y1="50" x2="' + X(1/3) + '" y2="155" stroke="#e2e8f0" stroke-dasharray="4 3"/>';
          s += '<line x1="' + X(2/3) + '" y1="50" x2="' + X(2/3) + '" y2="155" stroke="#e2e8f0" stroke-dasharray="4 3"/>';
          s += '<text x="' + X(1/3) + '" y="169" font-size="9" font-weight="800" fill="#94a3b8" text-anchor="middle">⅓Vcc</text>';
          s += '<text x="' + X(2/3) + '" y="169" font-size="9" font-weight="800" fill="#94a3b8" text-anchor="middle">⅔Vcc</text>';
          s += '<path d="M' + X(0.02) + ' ' + Y(1) + ' H' + X(2/3) + ' V' + Y(0) + ' H' + X(0.98) +
               ' M' + X(0.98) + ' ' + Y(0) + ' H' + X(1/3) + ' V' + Y(1) + ' H' + X(0.02) +
               '" fill="none" stroke="#2563eb" stroke-width="2.8"/>';
          s += '<path d="M' + (X(0.13)+9) + ' ' + Y(1) + ' l-9 -4.5 l0 9 z" fill="#2563eb"/>';
          s += '<path d="M' + (X(0.87)-9) + ' ' + Y(0) + ' l9 -4.5 l0 9 z" fill="#2563eb"/>';
          s += '<text x="' + X(0.5) + '" y="' + (Y(1)-13) + '" font-size="10" font-weight="800" fill="#1d4ed8" text-anchor="middle">vI 上升 →</text>';
          s += '<text x="' + X(0.5) + '" y="' + (Y(0)-13) + '" font-size="10" font-weight="800" fill="#b45309" text-anchor="middle">← vI 下降</text>';
          s += '<circle cx="' + X(P.vi) + '" cy="' + Y(HI ? 1 : 0) + '" r="5.5" fill="#dc2626" stroke="#fff" stroke-width="2"/>';
        } else if (M === 1){
          s += '<text x="46" y="34" font-size="9.5" font-weight="800" fill="#475569" text-anchor="end">vI</text>';
          s += '<text x="46" y="90" font-size="9.5" font-weight="800" fill="#475569" text-anchor="end">vC</text>';
          s += '<text x="46" y="150" font-size="9.5" font-weight="800" fill="#475569" text-anchor="end">vO</text>';
          s += '<path d="M56 26 H110 V46 H132 V26 H530" fill="none" stroke="#94a3b8" stroke-width="1.8"/>';
          VMAP = vy;
          var p1 = ["56," + vy(0), "110," + vy(0)];
          p1 = p1.concat(seg(110, 420, 0, 2/3, 22));
          p1 = p1.concat(seg(420, 444, 2/3, 0, 5));
          p1.push("530," + vy(0));
          s += '<polyline points="' + p1.join(" ") + '" fill="none" stroke="#2563eb" stroke-width="2.2"/>';
          s += '<line x1="56" y1="' + vy(2/3) + '" x2="530" y2="' + vy(2/3) + '" stroke="#dc2626" stroke-dasharray="4 3" stroke-width="1.2"/>';
          s += '<text x="534" y="' + (vy(2/3)+4) + '" font-size="8.5" font-weight="800" fill="#b91c1c">⅔Vcc</text>';
          s += '<path d="M56 152 H110 V134 H420 V152 H530" fill="none" stroke="#f59e0b" stroke-width="2.2"/>';
          s += '<line x1="110" y1="166" x2="420" y2="166" stroke="#1d4ed8" stroke-width="1.2"/>';
          s += '<line x1="110" y1="162" x2="110" y2="170" stroke="#1d4ed8" stroke-width="1.2"/>';
          s += '<line x1="420" y1="162" x2="420" y2="170" stroke="#1d4ed8" stroke-width="1.2"/>';
          s += '<text x="265" y="180" font-size="10" font-weight="800" fill="#1d4ed8" text-anchor="middle">tW = 1.1RC</text>';
        } else if (M === 4){
          s += '<text x="46" y="28" font-size="9.5" font-weight="800" fill="#475569" text-anchor="end">S′</text>';
          s += '<text x="46" y="76" font-size="9.5" font-weight="800" fill="#475569" text-anchor="end">R</text>';
          s += '<text x="46" y="131" font-size="9.5" font-weight="800" fill="#475569" text-anchor="end">Q</text>';
          s += '<line x1="56" y1="18" x2="530" y2="18" stroke="#eef2f8"/>';
          s += '<line x1="56" y1="66" x2="530" y2="66" stroke="#eef2f8"/>';
          s += '<line x1="56" y1="121" x2="530" y2="121" stroke="#eef2f8"/>';
          s += '<path d="M56 22 H110 V40 H135 V22 H530" fill="none" stroke="#94a3b8" stroke-width="1.9"/>';
          s += '<path d="M56 88 H280 V70 H305 V88 H530" fill="none" stroke="#94a3b8" stroke-width="1.9"/>';
          var qy = Q5 ? 125 : 143;
          s += '<path d="M56 143 H110 V125 H280 V143 H530" fill="none" stroke="#f59e0b" stroke-width="2.4"/>';
          if (!Q5) s += '<line x1="56" y1="143" x2="530" y2="143" stroke="#f59e0b" stroke-width="2.4"/>';
          s += '<text x="118" y="14" font-size="9" font-weight="700" fill="#94a3b8">置位脉冲</text>';
          s += '<text x="288" y="62" font-size="9" font-weight="700" fill="#94a3b8">复位脉冲</text>';
        } else {
          /* 多谐 / 占空比可调：vC / vO 两拍 */
          VMAP = vz;
          var t1, t2;
          if (M === 2){ t1 = 0.693*(P.R1+P.R2)*P.C; t2 = 0.693*P.R2*P.C; }
          else { t1 = 0.693*P.R1*P.C; t2 = 0.693*P.R2*P.C; }
          var T = t1 + t2, X0 = 56, W = 460, sc = W/(2*T);
          s += '<text x="46" y="40" font-size="9.5" font-weight="800" fill="#475569" text-anchor="end">vC</text>';
          s += '<text x="46" y="146" font-size="9.5" font-weight="800" fill="#475569" text-anchor="end">vO</text>';
          s += '<line x1="56" y1="92" x2="530" y2="92" stroke="#eef2f8"/>';
          s += '<line x1="56" y1="160" x2="530" y2="160" stroke="#eef2f8"/>';
          s += '<line x1="56" y1="' + vz(2/3) + '" x2="530" y2="' + vz(2/3) + '" stroke="#dc2626" stroke-dasharray="4 3" stroke-width="1.2"/>';
          s += '<line x1="56" y1="' + vz(1/3) + '" x2="530" y2="' + vz(1/3) + '" stroke="#2563eb" stroke-dasharray="4 3" stroke-width="1.2"/>';
          s += '<text x="534" y="' + (vz(2/3)+4) + '" font-size="8.5" font-weight="800" fill="#b91c1c">⅔</text>';
          s += '<text x="534" y="' + (vz(1/3)+4) + '" font-size="8.5" font-weight="800" fill="#1d4ed8">⅓</text>';
          var pc = [X0 + "," + vz(1/3)], po = [X0 + ",140"], x = X0;
          for (i = 0; i < 2; i++){
            var xa = x + t1*sc, xb = xa + t2*sc;
            pc = pc.concat(seg(x, xa, 1/3, 2/3, 18));
            pc = pc.concat(seg(xa, xb, 2/3, 1/3, 18));
            po.push(xa + ",140"); po.push(xa + ",158"); po.push(xb + ",158");
            if (i === 0) po.push(xb + ",140");
            x = xb;
          }
          pc.push("530," + vz(1/3));
          s += '<polyline points="' + pc.join(" ") + '" fill="none" stroke="#2563eb" stroke-width="2.2"/>';
          s += '<polyline points="' + po.join(" ") + '" fill="none" stroke="#f59e0b" stroke-width="2.2"/>';
          s += '<line x1="' + X0 + '" y1="176" x2="' + (X0 + t1*sc) + '" y2="176" stroke="#1d4ed8" stroke-width="1.2"/>';
          s += '<text x="' + (X0 + t1*sc/2) + '" y="190" font-size="9.5" font-weight="800" fill="#1d4ed8" text-anchor="middle">t1</text>';
          s += '<line x1="' + (X0 + t1*sc) + '" y1="176" x2="' + (X0 + (t1+t2)*sc) + '" y2="176" stroke="#b45309" stroke-width="1.2"/>';
          s += '<text x="' + (X0 + t1*sc + t2*sc/2) + '" y="190" font-size="9.5" font-weight="800" fill="#b45309" text-anchor="middle">t2</text>';
        }
        w.innerHTML = s;
      }

      /* ---------- 事件 ---------- */
      document.querySelectorAll('[data-g5]').forEach(function(b){
        b.addEventListener("click", function(){
          M = +this.getAttribute("data-g5");
          document.querySelectorAll('[data-g5]').forEach(function(x){
            x.classList.toggle("on", +x.getAttribute("data-g5") === M);
          });
          if (M === 0) HI = true;
          buildPar();
          updateOut();
        });
      });

      document.querySelectorAll('[data-g5]')[0].classList.add("on");
      buildPar();
      updateOut();
    })();
    