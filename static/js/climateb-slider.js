/* climateB case-study slider: image + short text, click left/right through the case studies */
document.addEventListener("DOMContentLoaded", function () {
  var sliders = document.querySelectorAll(".cs-slider");
  Array.prototype.forEach.call(sliders, function (root) {
    var slides = root.querySelectorAll(".cs-slide");
    if (slides.length < 2) { return; }
    var current = 0;

    function svg(points) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="' + points + '"/></svg>';
    }
    function button(cls, label, html) {
      var b = document.createElement("button");
      b.type = "button"; b.className = cls; b.setAttribute("aria-label", label); b.innerHTML = html || "";
      return b;
    }

    var controls = document.createElement("div");
    controls.className = "cs-controls";
    var count = document.createElement("span");
    count.className = "cs-count"; count.setAttribute("aria-live", "polite");
    var prev = button("cs-btn cs-prev", "Previous case study", svg("15 4 7 12 15 20"));
    var next = button("cs-btn cs-next", "Next case study", svg("9 4 17 12 9 20"));
    var dots = document.createElement("div");
    dots.className = "cs-dots";
    var dotButtons = [];
    Array.prototype.forEach.call(slides, function (_, i) {
      var d = button("cs-dot", "Go to case study " + (i + 1));
      d.addEventListener("click", function () { show(i); });
      dots.appendChild(d); dotButtons.push(d);
    });
    controls.appendChild(count); controls.appendChild(prev); controls.appendChild(next); controls.appendChild(dots);
    root.appendChild(controls);

    function show(i) {
      current = (i + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (s, k) {
        var on = k === current;
        s.classList.toggle("is-active", on);
        s.setAttribute("aria-hidden", on ? "false" : "true");
        dotButtons[k].classList.toggle("is-active", on);
      });
      count.textContent = (current + 1) + " / " + slides.length;
    }

    prev.addEventListener("click", function () { show(current - 1); });
    next.addEventListener("click", function () { show(current + 1); });
    root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(current - 1); }
      if (e.key === "ArrowRight") { show(current + 1); }
    });
    var startX = null;
    root.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (startX === null) { return; }
      var dx = e.changedTouches[0].clientX - startX; startX = null;
      if (Math.abs(dx) > 40) { show(current + (dx < 0 ? 1 : -1)); }
    });

    root.classList.add("is-ready");
    show(0);
  });
});
