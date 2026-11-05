/* 第二章 · 最小项与公式速查（g7）：原样外置的同步 IIFE，仅依赖自身 DOM 控件。
 * 由 数字电子技术基础-互动课堂.html 原位外置；同步加载，执行时机与原内联脚本一致。
 * 不修改任何教学公式与计算逻辑，只搬迁代码位置。
 */
    (function(){
      var box = document.getElementById("g7mt");
      if (!box) return;

      var SEL = {};    /* 选中的最小项 */
      var VAR = ["A","B","C","D"];

      function pad(v, n){ var s = v.toString(2); while (s.length < n) s = "0" + s; return s; }
      function term(i){
        var b = pad(i, 4), t = "", k;
        for (k = 0; k < 4; k++) t += (b.charAt(k) === "1" ? VAR[k] : VAR[k] + "′");
        return t;
      }

      function render(){
        var h = "", i;
        for (i = 0; i < 16; i++){
          h += '<div class="mt-cell' + (SEL[i] ? " on" : "") + '" data-mt="' + i + '">' +
               '<b>' + i + '</b><small>' + pad(i, 4) + '</small></div>';
        }
        box.innerHTML = h;

        var on = [], off = [], k;
        for (k = 0; k < 16; k++){ if (SEL[k]) on.push(k); else off.push(k); }

        var res = "";
        if (!on.length){
          res = '<span class="big">还没选中任何最小项</span>点上面的格子，选出让 Y = 1 的那些最小项。';
        } else {
          var terms = on.map(term).join(" + ");
          if (on.length > 6) terms = on.slice(0, 6).map(term).join(" + ") + " + …";
          res = '<span class="big">Y = Σm(' + on.join(",") + ')</span>' +
                '标准与或式：<b>' + terms + '</b><br>' +
                '最大项写法：Y = ΠM(<b>' + off.join(",") + '</b>)<br>' +
                '反函数：<b>Y′ = Σm(' + off.join(",") + ')</b>　（正好是补集）<br>' +
                '<span style="color:#94a3b8">共 ' + on.length + ' 个 1、' + off.length + ' 个 0，合计 16 项</span>';
        }
        document.getElementById("g7res").innerHTML = res;

        box.querySelectorAll('[data-mt]').forEach(function(c){
          c.addEventListener("click", function(){
            var i2 = +this.getAttribute("data-mt");
            SEL[i2] = !SEL[i2];
            render();
          });
        });
      }
      render();
    })();
    