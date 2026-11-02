
    /* ==================== 第一章 · 格雷码 ==================== */
    (function(){
      var boxB = document.getElementById("gcBin");
      if (!boxB) return;
      var S = { n: 8, prev: null, timer: null, on: false };

      function bits4(v){ var a = []; for (var i = 3; i >= 0; i--) a.push((v >> i) & 1); return a; }

      function chip(val, hot){
        return '<div style="flex:1;height:52px;border-radius:11px;display:grid;place-items:center;font-size:22px;font-weight:800;' +
               'background:' + (hot ? "#fffbeb" : "#f8fafc") + ';color:' + (hot ? "#b45309" : "#475569") + ';' +
               'border:1.8px solid ' + (hot ? "#f59e0b" : "#dbe3ee") + ';transition:.18s;">' + val + '</div>';
      }
      function diff(a, b){
        var n = 0;
        for (var i = 0; i < 4; i++) if (a[i] !== b[i]) n++;
        return n;
      }

      function render(){
        var b = bits4(S.n);
        var g = bits4(S.n ^ (S.n >> 1));
        var pb = S.prev ? S.prev.b : null;
        var pg = S.prev ? S.prev.g : null;

        boxB.innerHTML = b.map(function(v, i){ return chip(v, pb && pb[i] !== v); }).join("");
        document.getElementById("gcGray").innerHTML = g.map(function(v, i){ return chip(v, pg && pg[i] !== v); }).join("");

        document.getElementById("gcN").textContent = S.n;
        document.getElementById("gcVal").textContent = S.n;

        var fb = pb ? diff(pb, b) : null;
        var fg = pg ? diff(pg, g) : null;
        document.getElementById("gcBinFlip").textContent = fb === null ? "—" : fb + " 位";
        document.getElementById("gcGrayFlip").textContent = fg === null ? "—" : fg + " 位";
        document.getElementById("gcBinFlip").style.color = (fb >= 2) ? "#b91c1c" : "#0f766e";
        document.getElementById("gcGrayFlip").style.color = "#0f766e";

        document.getElementById("gcCap").innerHTML = fb === null
          ? "拖动滑块，看每次加 1 时哪几位翻转。"
          : (fb >= 2
              ? "<b>这一次二进制翻了 " + fb + " 位</b>，格雷码只翻 " + fg + " 位。如果这几位不同时到达，中间就会出现一个<b>谁也不是</b>的错码。"
              : "这一次二进制恰好只翻了 1 位（只有最低位变），所以看不出差别。试试 7 → 8。");

        S.prev = { b: b, g: g };
      }

      document.getElementById("gcSlider").addEventListener("input", function(){
        stopPlay(); S.n = +this.value; render();
      });
      document.getElementById("gcReset").addEventListener("click", function(){
        stopPlay(); S.n = 0; S.prev = null;
        document.getElementById("gcSlider").value = 0;
        render();
      });

      function stopPlay(){
        if (S.timer){ clearInterval(S.timer); S.timer = null; }
        S.on = false;
        var b = document.getElementById("gcPlay");
        if (b) b.textContent = "▶ 0 → 15 慢慢数";
      }

      document.getElementById("gcPlay").addEventListener("click", function(){
        if (S.on){ stopPlay(); return; }
        S.on = true; this.textContent = "⏸ 停止";
        S.n = 0; S.prev = null; document.getElementById("gcSlider").value = 0; render();
        S.timer = setInterval(function(){
          if (S.n >= 15){ stopPlay(); return; }
          S.n++; document.getElementById("gcSlider").value = S.n; render();
        }, 700);
      });

      render();
    })();
    