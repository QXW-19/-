
/* ==================== 第一章 · 补码刻度盘 ==================== */
(function(){
  var CX = 190, CY = 172, R = 118, MOD = 16;
  var A = 8, B = 5;

  var svg = document.getElementById("dialSvg");
  if (!svg) return;

  function polar(r, deg){
    var a = (deg - 90) * Math.PI / 180;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  }
  function arcPath(r, fromDeg, toDeg){
    var p1 = polar(r, fromDeg), p2 = polar(r, toDeg);
    var d = toDeg - fromDeg;
    var large = Math.abs(d) > 180 ? 1 : 0;
    var sweep = d > 0 ? 1 : 0;
    return "M" + p1[0].toFixed(1) + " " + p1[1].toFixed(1) +
           " A" + r + " " + r + " 0 " + large + " " + sweep + " " +
           p2[0].toFixed(1) + " " + p2[1].toFixed(1);
  }
  function bin4(v){ return ("000" + v.toString(2)).slice(-4); }

  function draw(animate){
    var out = [];
    out.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="#fff" stroke="#e6ecf5" stroke-width="1.5"/>');

    // 刻度与标签
    for (var v = 0; v < MOD; v++){
      var deg = v * (360 / MOD);
      var p1 = polar(R, deg), p2 = polar(R - 11, deg);
      out.push('<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) +
               '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) +
               '" stroke="#cfdae8" stroke-width="2" stroke-linecap="round"/>');
      var lp = polar(R + 15, deg);
      out.push('<text x="' + lp[0].toFixed(1) + '" y="' + lp[1].toFixed(1) +
               '" font-size="11.5" fill="#8b9bb4" text-anchor="middle" dominant-baseline="middle">' + v + '</text>');
    }

    var dest = (A - B + MOD) % MOD;
    var dA = A * (360 / MOD);

    // 减法弧（内侧，红）
    out.push('<path id="arcSub" d="' + arcPath(92, dA, dA - B * (360 / MOD)) +
             '" fill="none" stroke="#e8552f" stroke-width="4" stroke-linecap="round" opacity=".9"/>');
    // 加补码弧（外侧，青）
    out.push('<path id="arcAdd" d="' + arcPath(64, dA, dA + (MOD - B) * (360 / MOD)) +
             '" fill="none" stroke="#0ea5a4" stroke-width="4" stroke-linecap="round" opacity=".9"/>');

    // 起点
    var ps = polar(R - 24, dA);
    out.push('<circle cx="' + ps[0].toFixed(1) + '" cy="' + ps[1].toFixed(1) + '" r="5" fill="#475569"/>');
    // 终点
    var pe = polar(R - 24, dest * (360 / MOD));
    out.push('<circle cx="' + pe[0].toFixed(1) + '" cy="' + pe[1].toFixed(1) + '" r="8" fill="#f59e0b" stroke="#fff" stroke-width="2.5"/>');

    // 中心读数
    out.push('<text x="' + CX + '" y="' + (CY - 8) + '" font-size="12" fill="#8b9bb4" text-anchor="middle">A − B</text>');
    out.push('<text x="' + CX + '" y="' + (CY + 26) + '" font-size="34" font-weight="800" fill="#0f172a" text-anchor="middle">' + dest + '</text>');

    svg.innerHTML = out.join("");

    if (animate){
      ["arcSub", "arcAdd"].forEach(function(id, i){
        var el = document.getElementById(id);
        if (!el) return;
        var L = el.getTotalLength();
        el.style.strokeDasharray = L;
        el.style.strokeDashoffset = L;
        void el.getBoundingClientRect();
        el.style.transition = "stroke-dashoffset .85s ease " + (i * 0.12) + "s";
        el.style.strokeDashoffset = 0;
      });
    }
  }

  function readout(){
    var dest = (A - B + MOD) % MOD;
    var comp = MOD - B;
    var sum = A + comp;
    var neg = A < B;

    document.getElementById("m1sub").textContent = A + " − " + B + " = " + (A - B) +
      (neg ? "（负数）" : "");
    document.getElementById("m1add").textContent = A + " + " + comp + " = " + sum;
    document.getElementById("m1bin").innerHTML =
      bin4(A) + " + " + bin4(comp) + " = " + (sum > 15 ? "1 " : "") + bin4(sum % 16) +
      " → 丢掉进位 <b>" + bin4(dest) + "</b>";

    var nar = document.getElementById("m1narr");
    if (neg){
      nar.innerHTML = "结果落在第 <b>" + dest + "</b> 格。这是一个负数——<b>" + bin4(dest) +
        "</b> 正是 −" + (B - A) + " 的补码。补码不用另设符号位，负号自然被「位置」表示出来了。";
    } else {
      nar.innerHTML = "两条路都落在第 <b>" + dest + "</b> 格。<b>" + comp + "</b> 就是 −" + B +
        " 的补码（16 − " + B + " = " + comp + "），所以减法可以用加法器完成。";
    }
    document.getElementById("dialCap").innerHTML =
      "<b>红弧</b> = 从 " + A + " 逆时针减 " + B + "；<b>青弧</b> = 从 " + A +
      " 顺时针加 " + comp + "（绕了 " + comp + " 格）。两者终点同在 <b>" + dest + "</b>。";
  }

  function render(animate){ draw(animate); readout(); }

  document.getElementById("mA_in").addEventListener("input", function(){
    A = +this.value;
    document.getElementById("mA_val").textContent = A;
    render(false);
  });
  document.getElementById("mB_in").addEventListener("input", function(){
    B = +this.value;
    document.getElementById("mB_val").textContent = B;
    render(false);
  });
  document.getElementById("m1go").addEventListener("click", function(){ render(true); });
  document.getElementById("m1rst").addEventListener("click", function(){
    A = 8; B = 5;
    document.getElementById("mA_in").value = 8; document.getElementById("mA_val").textContent = 8;
    document.getElementById("mB_in").value = 5; document.getElementById("mB_val").textContent = 5;
    render(false);
  });

  render(true);
})();
