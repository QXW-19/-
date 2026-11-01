
/* ==================== 第二章 · 卡诺图化简 ==================== */
(function(){
  var svg = document.getElementById("kmSvg");
  if (!svg) return;

  var S = { n: 4, vals: [], showGroups: true, showTerms: true };
  for (var i = 0; i < 16; i++) S.vals.push(0);   // 0=空 1=1 2=无关项
  var PALETTE = ["#e8552f", "#0ea5a4", "#7c5cd6", "#2563eb", "#d97706", "#059669"];

  var LET = "ABCD";

  function rows(){ return S.n === 4 ? [0,1,3,2] : [0,1]; }
  function cols(){ return [0,1,3,2]; }
  function minterm(ri, ci){ return rows()[ri] * 4 + cols()[ci]; }

  function validSets(cnt){
    var out = [], seen = {}, k;
    for (var i = 0; i < cnt; i++) out.push([i]);
    if (cnt >= 2){
      for (var j = 0; j < cnt; j++){
        var s = [j, (j + 1) % cnt].slice().sort(function(a, b){ return a - b; });
        var key = s.join(",");
        if (!seen[key]){ seen[key] = 1; out.push(s); }
      }
    }
    if (cnt === 4) out.push([0, 1, 2, 3]);
    return out;
  }

  function cellsOf(rs, cs){
    var list = [];
    rs.forEach(function(r){
      cs.forEach(function(c){
        var m = rows()[r] * 4 + cols()[c];
        if (list.indexOf(m) < 0) list.push(m);
      });
    });
    return list;
  }

  function termOf(cells){
    var parts = [];
    for (var i = 0; i < S.n; i++){
      var bp = S.n - 1 - i;
      var v0 = (cells[0] >> bp) & 1;
      var same = cells.every(function(m){ return ((m >> bp) & 1) === v0; });
      if (same) parts.push({ ch: LET[i], neg: v0 === 0 });
    }
    return parts;
  }

  function termHTML(parts){
    if (!parts.length) return "1";
    return parts.map(function(p){
      return p.neg ? '<span class="ovl">' + p.ch + "</span>" : p.ch;
    }).join("");
  }

  function solve(){
    var rs = validSets(rows().length), cs = validSets(cols().length);
    var cands = [];
    rs.forEach(function(r){
      cs.forEach(function(c){
        var cells = cellsOf(r, c);
        var hasOne = cells.some(function(m){ return S.vals[m] === 1; });
        var allOK = cells.every(function(m){ return S.vals[m] === 1 || S.vals[m] === 2; });
        if (hasOne && allOK) cands.push({ r: r, c: c, cells: cells });
      });
    });
    cands.sort(function(a, b){ return b.cells.length - a.cells.length; });

    var covered = {}, chosen = [];
    cands.forEach(function(g){
      var gains = g.cells.some(function(m){ return S.vals[m] === 1 && !covered[m]; });
      if (gains){
        chosen.push(g);
        g.cells.forEach(function(m){ if (S.vals[m] === 1) covered[m] = 1; });
      }
    });

    // 去掉被别的圈完全覆盖的冗余圈
    for (var i = chosen.length - 1; i >= 0; i--){
      var test = chosen.slice(0, i).concat(chosen.slice(i + 1));
      var cov = {};
      test.forEach(function(g){ g.cells.forEach(function(m){ if (S.vals[m] === 1) cov[m] = 1; }); });
      var allCovered = chosen[i].cells.every(function(m){ return S.vals[m] !== 1 || cov[m]; });
      if (allCovered) chosen.splice(i, 1);
    }
    return chosen;
  }

  function segs(set, n){
    if (set.length === n) return [[0, n - 1]];
    var mn = Math.min.apply(null, set), mx = Math.max.apply(null, set);
    if (mx - mn + 1 === set.length) return [[mn, mx]];
    return [[mx, n - 1], [0, mn]];
  }

  function draw(){
    var CW = 86, CH = 78, X0 = 74, Y0 = 62;
    var RSN = rows().length, CSN = 4;
    var W = X0 + CSN * CW + 34, H = Y0 + RSN * CH + 46;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    var out = [];
    var groups = (S.showGroups && S.vals.indexOf(1) >= 0) ? solve() : [];

    // 列标签（格雷码）
    var cg = cols();
    for (var c = 0; c < CSN; c++){
      var lab = cg[c].toString(2).length < 2 ? "0" + cg[c].toString(2) : cg[c].toString(2);
      out.push('<text x="' + (X0 + c * CW + CW / 2) + '" y="34" font-size="13" font-weight="700" fill="#475569" text-anchor="middle">' + lab + '</text>');
    }
    out.push('<text x="' + (X0 + 2 * CW) + '" y="16" font-size="11" fill="#8b9bb4" text-anchor="middle">' +
      (S.n === 4 ? "CD" : "BC") + '（格雷码）</text>');

    // 行标签
    var rg = rows();
    for (var r = 0; r < RSN; r++){
      var rl = RSN === 4 ? ("0" + rg[r].toString(2)).slice(-2) : String(rg[r]);
      out.push('<text x="' + (X0 - 16) + '" y="' + (Y0 + r * CH + CH / 2) + '" font-size="13" font-weight="700" fill="#475569" text-anchor="middle" dominant-baseline="middle">' + rl + '</text>');
    }
    out.push('<text x="' + (X0 - 42) + '" y="' + (Y0 + RSN * CH / 2) + '" font-size="11" fill="#8b9bb4" text-anchor="middle" transform="rotate(-90 ' + (X0 - 42) + ' ' + (Y0 + RSN * CH / 2) + ')">' + (S.n === 4 ? "AB" : "A") + '</text>');

    // 格子
    for (var rr = 0; rr < RSN; rr++){
      for (var cc = 0; cc < CSN; cc++){
        var m = minterm(rr, cc);
        var v = S.vals[m];
        var x = X0 + cc * CW, y = Y0 + rr * CH;
        var fill = v === 1 ? "#fff3ef" : (v === 2 ? "#f1f5f9" : "#fff");
        out.push('<rect class="km-cell" data-m="' + m + '" x="' + x + '" y="' + y + '" width="' + CW + '" height="' + CH +
                 '" fill="' + fill + '" stroke="#dfe7f1" stroke-width="1.5"/>');
        if (S.showTerms){
          out.push('<text x="' + (x + 7) + '" y="' + (y + 15) + '" font-size="10" fill="#b3c0d1">m' + m + '</text>');
        }
        var txt = v === 1 ? "1" : (v === 2 ? "×" : "0");
        var col = v === 1 ? "#e8552f" : (v === 2 ? "#94a3b8" : "#d7dfe9");
        out.push('<text x="' + (x + CW / 2) + '" y="' + (y + CH / 2 + 2) + '" font-size="' + (v ? 25 : 19) +
                 '" font-weight="' + (v ? 800 : 400) + '" fill="' + col + '" text-anchor="middle" dominant-baseline="middle">' + txt + '</text>');
      }
    }

    // 圈组
    var exprParts = [];
    groups.forEach(function(g, gi){
      var color = PALETTE[gi % PALETTE.length];
      var off = gi * 3.5;
      var rsegs = segs(g.r, RSN), csegs = segs(g.c, CSN);
      rsegs.forEach(function(rsg){
        csegs.forEach(function(csg){
          var x = X0 + csg[0] * CW + 5 + off;
          var y = Y0 + rsg[0] * CH + 5 + off;
          var w = (csg[1] - csg[0] + 1) * CW - 10 - off * 2;
          var h = (rsg[1] - rsg[0] + 1) * CH - 10 - off * 2;
          out.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
                   '" rx="14" fill="none" stroke="' + color + '" stroke-width="2.6" opacity=".92"/>');
        });
      });
      exprParts.push({ html: termHTML(termOf(g.cells)), color: color });
    });

    svg.innerHTML = out.join("");

    var exprEl = document.getElementById("kmExpr");
    if (!S.vals.some(function(v){ return v === 1; })){
      exprEl.innerHTML = "0";
    } else if (!groups.length){
      exprEl.innerHTML = "—";
    } else {
      exprEl.innerHTML = exprParts.map(function(p){
        return '<span style="color:' + p.color + '">' + p.html + "</span>";
      }).join(" <span style='color:#94a3b8'>+</span> ");
    }

    var nar = document.getElementById("kmNarr");
    if (groups.length){
      var big = groups.reduce(function(a, b){ return b.cells.length > a.cells.length ? b : a; }, groups[0]);
      nar.innerHTML = "共 <b>" + groups.length + " 个圈</b>，最大的圈含 <b>" + big.cells.length +
        "</b> 格 → 消去 " + (Math.log2(big.cells.length) | 0) + " 个变量。" +
        (groups.length > 1 ? "每个圈对应一项，最后或起来。" : "");
    } else {
      nar.innerHTML = "还没有 1 可圈。";
    }
  }

  svg.addEventListener("click", function(e){
    var cell = e.target.closest(".km-cell");
    if (!cell) return;
    var m = +cell.getAttribute("data-m");
    S.vals[m] = (S.vals[m] + 1) % 3;
    draw();
  });

  document.getElementById("km3").addEventListener("click", function(){
    S.n = 3;
    this.setAttribute("aria-pressed", "true");
    document.getElementById("km4").setAttribute("aria-pressed", "false");
    for (var i = 8; i < 16; i++) S.vals[i] = 0;
    draw();
  });
  document.getElementById("km4").addEventListener("click", function(){
    S.n = 4;
    this.setAttribute("aria-pressed", "true");
    document.getElementById("km3").setAttribute("aria-pressed", "false");
    draw();
  });
  document.getElementById("kmClear").addEventListener("click", function(){
    for (var i = 0; i < 16; i++) S.vals[i] = 0;
    draw();
  });
  document.getElementById("kmRandom").addEventListener("click", function(){
    var pool = S.n === 3 ? [0,1,2,3,4,5,6,7] : [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    for (var i = 0; i < 16; i++) S.vals[i] = 0;
    var cnt = 4 + Math.floor(Math.random() * 4);
    for (var k = 0; k < cnt; k++){
      S.vals[pool[Math.floor(Math.random() * pool.length)]] = 1;
    }
    if (Math.random() > 0.5){
      S.vals[pool[Math.floor(Math.random() * pool.length)]] = 2;
    }
    draw();
  });
  document.getElementById("kmToggle").addEventListener("click", function(){
    S.showGroups = !S.showGroups;
    this.setAttribute("aria-pressed", String(S.showGroups));
    draw();
  });
  document.getElementById("kmTerms").addEventListener("click", function(){
    S.showTerms = !S.showTerms;
    this.setAttribute("aria-pressed", String(S.showTerms));
    draw();
  });

  // 初始：Y = Σm(0,1,4,5, ...) 一个能看出"圈成方块"的例子
  [0, 1, 4, 5, 12, 13].forEach(function(m){ S.vals[m] = 1; });
  draw();
})();
