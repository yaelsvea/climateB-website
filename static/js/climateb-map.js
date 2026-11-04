/* climateB interactive world map (choropleth): number of fossil fuel energy bank deals per country.
   Needs two data files loaded before it:
     climateb-world.js     -> window.CLIMATEB_WORLD     (country outlines, generated from Natural Earth)
     climateb-map-data.js  -> window.CLIMATEB_MAP_DATA  (the deal numbers; at the moment MADE-UP sample data)
   Everything is drawn in the browser, nothing is loaded from other websites. */
(function () {
  var root = document.getElementById("climateb-map");
  var W = window.CLIMATEB_WORLD, D = window.CLIMATEB_MAP_DATA;
  if (!root || !W || !D) { return; }

  var NS = "http://www.w3.org/2000/svg";
  var COLORS = ["#eaf0f4", "#c9dce8", "#9fc0d5", "#6e9fbd", "#40789b", "#1f4f6e"]; // 0 deals, then 5 steps
  var years = D.years, fuels = D.fuels;
  var yearIdx = -1;          // -1 = all years
  var selectedId = null;
  var vb = { x: 0, y: 0, w: W.w, h: W.h };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text !== undefined) { e.textContent = text; }
    return e;
  }
  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) { e.setAttribute(k, attrs[k]); }
    return e;
  }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  /* ---------- numbers ---------- */
  function byFuel(id) {            // [coal, oil, gas] for the selected period
    var rows = D.countries[id];
    if (!rows) { return null; }
    var out = [0, 0, 0];
    for (var y = 0; y < rows.length; y++) {
      if (yearIdx !== -1 && y !== yearIdx) { continue; }
      for (var f = 0; f < 3; f++) { out[f] += rows[y][f]; }
    }
    return out;
  }
  function total(id) {
    var f = byFuel(id);
    return f ? f[0] + f[1] + f[2] : null;
  }
  function maxTotal() {
    var m = 1;
    for (var id in D.countries) { m = Math.max(m, total(id)); }
    return m;
  }
  var currentMax = 1;
  function bin(v) {
    if (v === 0) { return 0; }
    return Math.min(5, Math.max(1, Math.ceil(5 * Math.sqrt(v / currentMax))));
  }

  /* ---------- page structure ---------- */
  root.innerHTML = "";
  var bar = el("div", "cm-bar");
  var title = el("div", "cm-title", "Fossil fuel energy bank deals by country");
  var yearWrap = el("label", "cm-year", "Period ");
  var select = document.createElement("select");
  var optAll = el("option", "", "All years (" + years[0] + "–" + years[years.length - 1] + ")");
  optAll.value = "-1"; select.appendChild(optAll);
  years.forEach(function (y, i) { var o = el("option", "", String(y)); o.value = String(i); select.appendChild(o); });
  yearWrap.appendChild(select);
  bar.appendChild(title); bar.appendChild(yearWrap);
  if (D.sample) { bar.appendChild(el("span", "cm-badge", "Sample data (made up), for testing only")); }

  var body = el("div", "cm-body");
  var mapCol = el("div", "cm-mapcol");
  var wrap = el("div", "cm-wrap");
  var svg = svgEl("svg", { viewBox: "0 0 " + W.w + " " + W.h, class: "cm-svg", role: "group", "aria-label": "World map of fossil fuel energy bank deals. Select a country for details." });
  var defs = svgEl("defs", {});
  var pat = svgEl("pattern", { id: "cm-hatch", width: 5, height: 5, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  pat.appendChild(svgEl("rect", { width: 5, height: 5, fill: "#f5f5f5" }));
  pat.appendChild(svgEl("line", { x1: 0, y1: 0, x2: 0, y2: 5, stroke: "#d9d9d9", "stroke-width": 1.4 }));
  defs.appendChild(pat); svg.appendChild(defs);
  svg.appendChild(svgEl("rect", { x: 0, y: 0, width: W.w, height: W.h, fill: "transparent", class: "cm-bg" }));
  var g = svgEl("g", {});
  var paths = {};
  W.countries.forEach(function (c) {
    var p = svgEl("path", { d: c.d, class: "cm-c" });
    p.setAttribute("data-id", c.id);
    p.setAttribute("data-name", c.name);
    if (D.countries[c.id]) {
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
    }
    g.appendChild(p);
    if (c.id) { paths[c.id] = p; }
  });
  svg.appendChild(g);
  var overlay = svgEl("path", { d: "", class: "cm-sel" });
  svg.appendChild(overlay);
  wrap.appendChild(svg);
  var tip = el("div", "cm-tip"); tip.style.display = "none"; wrap.appendChild(tip);

  var zoom = el("div", "cm-zoom");
  function zbtn(label, aria) { var b = el("button", "cm-zbtn", label); b.type = "button"; b.setAttribute("aria-label", aria); return b; }
  var zin = zbtn("+", "Zoom in"), zout = zbtn("−", "Zoom out"), zreset = zbtn("↺", "Reset zoom");
  zoom.appendChild(zin); zoom.appendChild(zout); zoom.appendChild(zreset);
  wrap.appendChild(zoom);

  var legend = el("div", "cm-legend");
  mapCol.appendChild(wrap); mapCol.appendChild(legend);

  var panel = el("div", "cm-panel");
  panel.setAttribute("aria-live", "polite");
  body.appendChild(mapCol); body.appendChild(panel);
  root.appendChild(bar); root.appendChild(body);

  /* ---------- drawing ---------- */
  function colorize() {
    currentMax = maxTotal();
    var all = g.childNodes;
    for (var i = 0; i < all.length; i++) {
      var p = all[i], id = p.getAttribute("data-id"), name = p.getAttribute("data-name");
      var t = id ? total(id) : null;
      if (t === null) {
        p.setAttribute("fill", "url(#cm-hatch)");
        p.removeAttribute("aria-label");
      } else {
        p.setAttribute("fill", COLORS[bin(t)]);
        p.setAttribute("aria-label", name + ": " + t + " deals");
      }
    }
    drawLegend();
  }
  function drawLegend() {
    legend.innerHTML = "";
    legend.appendChild(el("span", "cm-lg-title", "Deals"));
    function item(color, label, hatch) {
      var it = el("span", "cm-lg-item");
      var sw = el("span", "cm-lg-sw" + (hatch ? " is-hatch" : ""));
      if (color) { sw.style.background = color; }
      it.appendChild(sw); it.appendChild(document.createTextNode(label));
      legend.appendChild(it);
    }
    item(COLORS[0], "0");
    for (var k = 1; k <= 5; k++) {
      var lo = Math.floor(currentMax * Math.pow((k - 1) / 5, 2)) + 1;
      var hi = k === 5 ? currentMax : Math.floor(currentMax * Math.pow(k / 5, 2));
      if (lo > hi) { continue; }
      item(COLORS[k], lo === hi ? fmt(lo) : fmt(lo) + "–" + fmt(hi));
    }
    item(null, "No data", true);
  }
  function periodLabel() { return yearIdx === -1 ? years[0] + "–" + years[years.length - 1] : String(years[yearIdx]); }

  function drawPanel() {
    panel.innerHTML = "";
    if (selectedId === null) {
      panel.appendChild(el("p", "cm-hint", "Click a country on the map to see its number of deals."));
      if (D.sample) { panel.appendChild(el("p", "cm-note", "The numbers on this map are made up and only show how the map will work.")); }
      return;
    }
    var name = paths[selectedId] ? paths[selectedId].getAttribute("data-name") : "";
    panel.appendChild(el("h3", "cm-name", name));
    var f = byFuel(selectedId);
    if (!f) { panel.appendChild(el("p", "cm-hint", "No data for this country.")); return; }
    var tot = f[0] + f[1] + f[2];
    var big = el("div", "cm-big"); big.appendChild(el("span", "cm-num", fmt(tot))); big.appendChild(el("span", "cm-unit", " deals, " + periodLabel()));
    panel.appendChild(big);

    var fb = el("div", "cm-fuels");
    fuels.forEach(function (label, i) {
      var row = el("div", "cm-frow");
      row.appendChild(el("span", "cm-flabel", label));
      var track = el("span", "cm-ftrack"); var fill = el("span", "cm-ffill");
      fill.style.width = (tot ? (100 * f[i] / tot) : 0) + "%"; track.appendChild(fill); row.appendChild(track);
      row.appendChild(el("span", "cm-fnum", fmt(f[i])));
      fb.appendChild(row);
    });
    panel.appendChild(fb);

    var rows = D.countries[selectedId];
    var sums = rows.map(function (r) { return r[0] + r[1] + r[2]; });
    var top = Math.max.apply(null, sums.concat([1]));
    panel.appendChild(el("div", "cm-sub", "Deals per year"));
    var chart = el("div", "cm-years");
    sums.forEach(function (s, i) {
      var col = el("div", "cm-ycol" + (yearIdx === i ? " is-on" : ""));
      var b = el("span", "cm-ybar"); b.style.height = Math.max(2, Math.round(60 * s / top)) + "px"; b.title = years[i] + ": " + s;
      col.appendChild(b); col.appendChild(el("span", "cm-ylab", String(years[i]).slice(2)));
      chart.appendChild(col);
    });
    panel.appendChild(chart);
    panel.appendChild(el("p", "cm-note", "Placeholder: the largest banks and a link to the details will appear here once the dataset is ready."));
    if (D.sample) { panel.appendChild(el("p", "cm-note", "Sample data (made up).")); }
  }
  function select_(id) {
    selectedId = id;
    overlay.setAttribute("d", id && paths[id] ? paths[id].getAttribute("d") : "");
    drawPanel();
  }

  /* ---------- zoom and pan ---------- */
  function applyVB() {
    vb.x = Math.min(Math.max(0, vb.x), W.w - vb.w);
    vb.y = Math.min(Math.max(0, vb.y), W.h - vb.h);
    svg.setAttribute("viewBox", vb.x + " " + vb.y + " " + vb.w + " " + vb.h);
    wrap.classList.toggle("is-zoomed", vb.w < W.w - 1);
  }
  function zoomBy(f) {
    var cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
    var nw = Math.min(W.w, Math.max(W.w / 8, vb.w / f));
    vb.w = nw; vb.h = nw * W.h / W.w; vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2;
    applyVB();
  }
  zin.addEventListener("click", function () { zoomBy(1.6); });
  zout.addEventListener("click", function () { zoomBy(1 / 1.6); });
  zreset.addEventListener("click", function () { vb = { x: 0, y: 0, w: W.w, h: W.h }; applyVB(); });

  var drag = null, dragged = false;
  svg.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0 || vb.w >= W.w - 1) { return; }
    drag = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y }; dragged = false;
  });
  window.addEventListener("pointermove", function (e) {
    if (!drag) { return; }
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!dragged && Math.abs(dx) + Math.abs(dy) < 5) { return; }
    dragged = true; tip.style.display = "none";
    var scale = vb.w / svg.getBoundingClientRect().width;
    vb.x = drag.vx - dx * scale; vb.y = drag.vy - dy * scale; applyVB();
  });
  window.addEventListener("pointerup", function () { drag = null; });

  /* ---------- events ---------- */
  svg.addEventListener("click", function (e) {
    if (dragged) { dragged = false; return; }
    var t = e.target;
    if (t.classList && t.classList.contains("cm-c")) {
      var id = t.getAttribute("data-id");
      select_(id && id === selectedId ? null : id || null);
    } else { select_(null); }
  });
  svg.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("cm-c")) {
      e.preventDefault(); select_(e.target.getAttribute("data-id"));
    }
  });
  svg.addEventListener("pointermove", function (e) {
    if (drag || e.pointerType !== "mouse") { return; }
    var t = e.target;
    if (!t.classList || !t.classList.contains("cm-c")) { tip.style.display = "none"; return; }
    var id = t.getAttribute("data-id"), v = id ? total(id) : null;
    tip.textContent = t.getAttribute("data-name") + ": " + (v === null ? "no data" : fmt(v) + " deals");
    var r = wrap.getBoundingClientRect();
    tip.style.left = (e.clientX - r.left + 14) + "px"; tip.style.top = (e.clientY - r.top + 14) + "px";
    tip.style.display = "block";
  });
  svg.addEventListener("pointerleave", function () { tip.style.display = "none"; });
  select.addEventListener("change", function () {
    yearIdx = parseInt(select.value, 10); colorize(); drawPanel();
  });

  colorize();
  drawPanel();
  root.classList.add("is-ready");
})();
