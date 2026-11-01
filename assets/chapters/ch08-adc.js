
/* ==================== 第八章 · 逐次逼近 ADC ==================== */
(function(){
  var svg = document.getElementById("adcSvg");
  if (!svg) return;

  var VREF = 5, N = 4, LSB = VREF / Math.pow(2, N);
  var ST = { vin: 3.30, code: 0, step: 0, recs: [] };

  function X(v, L, pw){ return L + v / VREF * pw; }

  function draw(){
    var L = 44, R = 20, W = 640, pw = W - L - R;
    var axisY = 168;
    var o = [];

    // 刻度和 LSB 刻度
    for (var i = 0; i <= 16; i++){
      var v = i * LSB, x = X(v, L, pw);
      var big = i % 4 === 0;
      o.push('<line x1="' + x + '" y1="' + (axisY) + '" x2="' + x + '" y2="' + (axisY + (big ? 9 : 5)) + '" stroke="#cbd5e1" stroke-width="1.2"/>');
      if (big) o.push('<text x="' + x + '" y="' + (axisY + 24) + '" font-size="10.5" fill="#94a3b8" text-anchor="middle">' + (+v.toFixed(2)) + 'V</text>');
    }
    o.push('<line x1="' + L + '" y1="' + axisY + '" x2="' + (L + pw) + '" y2="' + axisY + '" stroke="#cbd5e1" stroke-width="1.6"/>');

    // 已确定的数字量区间
    var codeV = ST.code * LSB;
    o.push('<rect x="' + X(0, L, pw) + '" y="' + (axisY - 14) + '" width="' + Math.max(0, X(codeV, L, pw) - X(0, L, pw)) + '" height="14" fill="#0ea5a4" opacity=".22"/>');
    o.push('<line x1="' + X(codeV, L, pw) + '" y1="' + (axisY - 18) + '" x2="' + X(codeV, L, pw) + '" y2="' + axisY + '" stroke="#0ea5a4" stroke-width="2.6"/>');

    // 本轮试探值
    if (ST.step > 0 && ST.step <= N){
      var rec = ST.recs[ST.recs.length - 1];
      if (rec){
        o.push('<line x1="' + X(rec.trial * LSB, L, pw) + '" y1="46" x2="' + X(rec.trial * LSB, L, pw) + '" y2="' + (axisY) + '" stroke="#0ea5a4" stroke-width="1.6" stroke-dasharray="5 4"/>');
        o.push('<text x="' + X(rec.trial * LSB, L, pw) + '" y="38" font-size="11" fill="#0ea5a4" text-anchor="middle">试探 ' + rec.trial.toString(2).padStart(4, "0") + '</text>');
      }
    }

    // 输入电压
    var xv = X(ST.vin, L, pw);
    o.push('<line x1="' + xv + '" y1="56" x2="' + xv + '" y2="' + (axisY + 6) + '" stroke="#e8552f" stroke-width="2.8"/>');
    o.push('<circle cx="' + xv + '" cy="56" r="4.5" fill="#e8552f"/>');
    o.push('<text x="' + xv + '" y="46" font-size="12" font-weight="800" fill="#e8552f" text-anchor="middle">v I = ' + ST.vin.toFixed(2) + 'V</text>');

    // 说明
    o.push('<text x="' + (L + pw) + '" y="228" font-size="11.5" fill="#8b9bb4" text-anchor="end">V REF = ' + VREF + ' V　1 LSB = ' + LSB.toFixed(3) + ' V</text>');

    svg.innerHTML = o.join("");

    // 比较记录表
    var tb = document.getElementById("adcTable").querySelector("tbody");
    tb.innerHTML = ST.recs.map(function(r, i){
      return '<tr><td>' + (i + 1) + '</td><td>b' + r.bit + '</td><td style="font-family:monospace">' + r.trial.toString(2).padStart(4, "0") +
        '</td><td>' + (r.trial * LSB).toFixed(3) + ' V</td><td>' + (r.cmp ? "DAC &gt; v I" : "DAC ≤ v I") +
        '</td><td style="color:' + (r.keep ? "#0f766e" : "#b91c1c") + ';font-weight:700">' + (r.keep ? "保留 1" : "退回 0") + '</td></tr>';
    }).join("");

    // 位寄存器
    var bits = "";
    for (var b = N - 1; b >= 0; b--){
      var bitNo = b, decided = (N - 1 - b) < ST.step;
      var val = (ST.code >> bitNo) & 1;
      var style = decided
        ? (val ? "background:#0ea5a4;color:#fff;border-color:#0ea5a4;" : "background:#f8fafc;color:#94a3b8;border-color:#cbd5e1;")
        : "background:#fff;color:#cbd5e1;border-color:#e2e8f0;";
      bits += '<div style="flex:1;text-align:center;border:1.5px solid;border-radius:9px;padding:9px 0;font-weight:800;font-size:17px;' + style + '">' + (decided ? val : "?") + '</div>';
    }
    document.getElementById("adcBits").innerHTML = bits;
    document.getElementById("adcCode").textContent = ST.code.toString(2).padStart(4, "0");
    document.getElementById("adcVinV").textContent = ST.vin.toFixed(2) + " V";

    var nar = document.getElementById("adcNarr");
    if (ST.step === 0){
      nar.innerHTML = "从最高位 b3 开始。先把 b3 假设成 1，得到试探码 1000。";
    } else if (ST.step < N){
      nar.innerHTML = "已确定 " + ST.step + " 位。下一位 b" + (N - 1 - ST.step) + " 先试 1，再看 DAC 输出跟 v I 谁大。";
    } else {
      var err = ST.vin - ST.code * LSB;
      nar.innerHTML = "转换完成：<b>" + ST.code.toString(2).padStart(4, "0") + "</b>，量化误差 " + (err).toFixed(3) +
        " V（小于 1 个 LSB = " + LSB.toFixed(3) + " V）。";
    }
  }

  function step(){
    if (ST.step >= N) return;
    var bit = N - 1 - ST.step;
    var trial = ST.code | (1 << bit);
    var dacV = trial * LSB;
    var keep = dacV <= ST.vin;
    ST.recs.push({ bit: bit, trial: trial, dacV: dacV, cmp: dacV > ST.vin, keep: keep });
    if (keep) ST.code = trial;
    ST.step++;
    draw();
  }

  document.getElementById("adcVin").addEventListener("input", function(){
    ST.vin = +this.value; ST.code = 0; ST.step = 0; ST.recs = []; draw();
  });
  document.getElementById("adcStep").addEventListener("click", step);
  document.getElementById("adcReset").addEventListener("click", function(){
    ST.code = 0; ST.step = 0; ST.recs = []; draw();
  });

  draw();
})();
