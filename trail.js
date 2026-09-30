// Draws a winding path through each milestone and walks a dot along it as the page scrolls.
(function () {
  var trail = document.getElementById('trail');
  if (!trail) return;
  var svg = trail.querySelector('.trail-svg');
  var base = svg.querySelector('.trail-base');
  var lit = svg.querySelector('.trail-lit');
  var nodeLayer = svg.querySelector('.trail-nodes');
  var walker = svg.querySelector('.walker');
  var stops = Array.prototype.slice.call(trail.querySelectorAll('.stop'));
  var NS = 'http://www.w3.org/2000/svg';
  var nodes = [], lengths = [], total = 0, ticking = false;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  function layout() {
    var w = trail.clientWidth;
    var narrow = window.matchMedia('(max-width: 720px)').matches;
    var cx = narrow ? 16 : w / 2;
    var swing = narrow ? 10 : 60;

    nodes = stops.map(function (el) { return { x: cx, y: el.offsetTop + 17 }; });
    var d = 'M ' + cx + ' 0';
    var measure = document.createElementNS(NS, 'path');
    svg.appendChild(measure);
    var prev = { x: cx, y: 0 };
    lengths = [];
    nodes.forEach(function (n, i) {
      // Bulge away from the card that sits above this segment so the path never runs through text.
      var side = i === 0 ? 1 : (i % 2 === 1 ? 1 : -1);
      var h = n.y - prev.y;
      d += ' C ' + (prev.x + side * swing) + ' ' + (prev.y + h * 0.3) + ', ' +
        (n.x + side * swing) + ' ' + (n.y - h * 0.3) + ', ' + n.x + ' ' + n.y;
      measure.setAttribute('d', d);
      lengths.push(measure.getTotalLength());
      prev = n;
    });
    svg.removeChild(measure);

    base.setAttribute('d', d);
    lit.setAttribute('d', d);
    total = lengths[lengths.length - 1] || 0;
    lit.style.strokeDasharray = total + ' ' + total;

    nodeLayer.innerHTML = '';
    nodes.forEach(function (n) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', 5);
      nodeLayer.appendChild(c);
      n.el = c;
    });
    update();
  }

  function update() {
    ticking = false;
    if (!nodes.length) return;
    var top = trail.getBoundingClientRect().top;
    var p = window.innerHeight * 0.55 - top; // reading line, in trail coordinates
    var L;
    if (p <= nodes[0].y) {
      L = lengths[0] * clamp(p / nodes[0].y);
    } else {
      L = lengths[lengths.length - 1];
      for (var i = 0; i < nodes.length - 1; i++) {
        if (p < nodes[i + 1].y) {
          // Hold at each milestone for a while, then glide to the next.
          var t = (p - nodes[i].y) / (nodes[i + 1].y - nodes[i].y);
          var e = smooth(clamp((t - 0.3) / 0.4));
          L = lengths[i] + e * (lengths[i + 1] - lengths[i]);
          break;
        }
      }
    }

    lit.style.strokeDashoffset = total - L;
    var pt = lit.getPointAtLength(L);
    walker.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');

    var current = -1;
    nodes.forEach(function (n, i) {
      var on = L >= lengths[i] - 1;
      n.el.classList.toggle('lit', on);
      stops[i].classList.toggle('reached', on);
      if (on) current = i;
    });
    stops.forEach(function (s, i) { s.classList.toggle('current', i === current && Math.abs(L - lengths[i]) < 2); });
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(trail);
  layout();
})();
