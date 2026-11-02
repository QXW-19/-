
    /* ==================== 第三章 · 三态门与总线 ==================== */
    (function(){
      var svg = document.getElementById("triSvg");
      if (!svg) return;
      var S = { en: [0, 0, 0], data: [1, 0, 1] };

      function render(){
        var o = [], i;
        var busY = 258;
        var live = [];
        for (i = 0; i < 3; i++) if (S.en[i]) live.push(i);

        o.push('<line x1="60" y1="' + busY + '" x2="560" y2="' + busY + '" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>');
        o.push('<text x="60" y="' + (busY + 26) + '" font-size="11.5" font-weight="700" fill="#8b9bb4">总线 BUS</text>');

        for (i = 0; i < 3; i++){
          var x = 90 + i * 165;
          var on = S.en[i];
          var col = on ? "#0ea5a4" : "#b9c6d6";
          var fill = on ? "#f0fdfa" : "#f8fafc";

          // 门体
          o.push('<rect x="' + x + '" y="86" width="112" height="66" rx="9" fill="' + fill + '" stroke="' + col + '" stroke-width="2.2"/>');
          o.push('<text x="' + (x + 56) + '" y="112" font-size="12.5" font-weight="800" fill="' + (on ? "#0f766e" : "#8b9bb4") + '" text-anchor="middle">三态门 ' + (i + 1) + '</text>');
          o.push('<text x="' + (x + 56) + '" y="132" font-size="10.5" fill="#8b9bb4" text-anchor="middle">' + (on ? "缓冲输出" : "高阻 Z") + '</text>');

          // 数据输入
          o.push('<text x="' + (x - 8) + '" y="112" font-size="11" fill="#8b9bb4" text-anchor="end">D=' + S.data[i] + '</text>');
          o.push('<line x1="' + (x - 4) + '" y1="108" x2="' + x + '" y2="108" stroke="#e8552f" stroke-width="2"/>');

          // 使能输入
          o.push('<line x1="' + (x + 56) + '" y1="152" x2="' + (x + 56) + '" y2="176" stroke="' + (on ? "#f59e0b" : "#d7dfe9") + '" stroke-width="2"/>');
          o.push('<text x="' + (x + 64) + '" y="170" font-size="10.5" fill="' + (on ? "#b45309" : "#b9c6d6") + '">EN=' + S.en[i] + '</text>');

          // 输出到总线
          var oc = on ? (live.length > 1 ? "#b91c1c" : "#0ea5a4") : "#d7dfe9";
          o.push('<line x1="' + (x + 56) + '" y1="176" x2="' + (x + 56) + '" y2="' + (busY - 2) + '" stroke="' + oc + '" stroke-width="' + (on ? 3.2 : 1.8) + '"' + (on ? "" : ' stroke-dasharray="5 4"') + '/>');
          o.push('<circle cx="' + (x + 56) + '" cy="' + busY + '" r="5" fill="' + oc + '"/>');
        }

        // 总线电平
        var busTxt, busCol;
        if (live.length === 0){ busTxt = "高阻（悬空）"; busCol = "#94a3b8"; }
        else if (live.length === 1){ busTxt = String(S.data[live[0]]); busCol = "#0f766e"; }
        else {
          var conflict = false;
          for (i = 0; i < live.length; i++) if (S.data[live[i]] !== S.data[live[0]]) conflict = true;
          busTxt = conflict ? "冲突！" : String(S.data[live[0]]);
          busCol = conflict ? "#b91c1c" : "#0f766e";
        }

        o.push('<text x="470" y="' + (busY - 18) + '" font-size="20" font-weight="800" fill="' + busCol + '" text-anchor="middle">' + busTxt + '</text>');

        if (live.length > 1 && busTxt === "冲突！"){
          o.push('<rect x="70" y="26" width="470" height="30" rx="8" fill="#fef2f2" stroke="#b91c1c" stroke-width="1.6"/>');
          o.push('<text x="305" y="46" font-size="12.5" font-weight="800" fill="#b91c1c" text-anchor="middle">两路同时驱动且数据不同 → 总线冲突，形成 V DD 到地的低阻通路</text>');
        } else if (live.length === 0){
          o.push('<rect x="70" y="26" width="470" height="30" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.6"/>');
          o.push('<text x="305" y="46" font-size="12.5" font-weight="700" fill="#64748b" text-anchor="middle">全部高阻：总线悬空，电平由外接上拉/下拉或后续电路决定</text>');
        } else {
          o.push('<rect x="70" y="26" width="470" height="30" rx="8" fill="#f0fdfa" stroke="#0ea5a4" stroke-width="1.6"/>');
          o.push('<text x="305" y="46" font-size="12.5" font-weight="700" fill="#0f766e" text-anchor="middle">只有门 ' + (live[0] + 1) + ' 在驱动总线，其余两路处于高阻，等于"拔掉"</text>');
        }

        svg.innerHTML = o.join("");

        document.getElementById("triBus").textContent = busTxt;
        document.getElementById("triBus").style.color = busCol;
        for (i = 0; i < 3; i++){
          document.getElementById("triE" + (i + 1)).textContent = "EN" + "₁₂₃"[i] + " = " + S.en[i];
        }
        document.getElementById("triCap").innerHTML = "虚线 = 高阻（输出与总线断开）；实线 = 正在驱动总线。";

        var nb = document.getElementById("triNarr");
        if (live.length > 1 && busTxt === "冲突！"){
          nb.innerHTML = "<b style='color:#b91c1c'>总线冲突。</b>两路同时输出相反电平，等于把 V DD 和地直接短接，电流会非常大。实际电路中必须用译码器保证使能互斥。";
        } else if (live.length === 0){
          nb.innerHTML = "<b>高阻态。</b>三路的上管、下管全部截止，总线既不被拉高也不被拉低——这就是三态门「多出来的第三态」。";
        } else {
          nb.innerHTML = "<b>正常驱动。</b>只有一路使能，总线电平就等于它的数据（" + S.data[live[0]] + "）。其余门呈高阻，不影响总线。";
        }
      }

      for (var i = 0; i < 3; i++){
        (function(idx){
          document.getElementById("triE" + (idx + 1)).addEventListener("click", function(){
            S.en[idx] = S.en[idx] ? 0 : 1; render();
          });
        })(i);
      }
      document.getElementById("triClr").addEventListener("click", function(){
        S.en = [0, 0, 0]; render();
      });

      render();
    })();
    