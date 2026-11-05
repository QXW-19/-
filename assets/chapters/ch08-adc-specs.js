/* 第八章 · ADC/DAC 量化指标速查（g8）：原样外置的同步 IIFE，仅依赖自身 DOM 控件。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    (function(){
      var rn = document.getElementById("g8n");
      if (!rn) return;
      var rv = document.getElementById("g8v"), rx = document.getElementById("g8x");
      var n = 8, vref = 5, vi = 3.15;

      function cell(k, v, sub, hi){
        return '<div class="g6-cell' + (hi ? " hi" : "") + '"><div class="k">' + k + '</div>' +
               '<div class="v">' + v + (sub ? '<em>' + sub + '</em>' : '') + '</div></div>';
      }
      function fx(v, d){ return v.toFixed(d === undefined ? 3 : d); }

      function render(){
        var lv = vref / Math.pow(2, n);
        var full = vref * (Math.pow(2, n) - 1) / Math.pow(2, n);
        var code = Math.round(vi / lv);
        if (code > Math.pow(2, n) - 1) code = Math.pow(2, n) - 1;
        if (code < 0) code = 0;
        var quant = code * lv;
        var err = quant - vi;

        var h = "";
        h += cell("1 LSB（分辨率）", fx(lv, 4) + " V", "V_REF / 2^n", true);
        h += cell("满量程", fx(full, 3) + " V", "V_REF·(2^n−1)/2^n");
        h += cell("量化误差", "±" + fx(lv/2, 4) + " V", "±½ LSB");
        h += cell("码数", Math.pow(2, n) + " 个", "0 ~ " + (Math.pow(2, n) - 1));
        h += cell("动态范围", (6.02 * n).toFixed(1) + " dB", "≈ 6.02n");
        h += cell("vI = " + fx(vi, 2) + " V 对应码", code.toString(2), "十进制 " + code, true);
        h += cell("量化后的电压", fx(quant, 4) + " V", "D × LSB");
        h += cell("本次量化误差", (err >= 0 ? "+" : "") + fx(err, 4) + " V", "应落在 ±½ LSB 内");
        document.getElementById("g8out").innerHTML = h;

        document.getElementById("g8nv").textContent = n + " 位";
        document.getElementById("g8vv").textContent = fx(vref, 1) + " V";
        document.getElementById("g8xv").textContent = fx(vi, 2) + " V";
      }

      rn.addEventListener("input", function(){ n = parseInt(this.value, 10); if (vi > vref) vi = vref; render(); });
      rv.addEventListener("input", function(){ vref = parseFloat(this.value); if (vi > vref) vi = vref; rx.value = vi/vref*100; render(); });
      rx.addEventListener("input", function(){ vi = vref * parseFloat(this.value) / 100; render(); });

      render();
    })();
    