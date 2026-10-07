// Rotating dot sphere with orbit rings, drawn into every canvas.orb.
(function () {
  const canvases = document.querySelectorAll('canvas.orb');
  if (!canvases.length) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Points spread evenly over a sphere (Fibonacci lattice).
  const N = 520, pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * golden;
    pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }

  // Pointer tilt, shared by every orb on the page.
  let tx = 0, ty = 0, cx = 0, cy = 0;
  addEventListener('pointermove', e => {
    tx = (e.clientY / innerHeight - 0.5) * 0.5;
    ty = (e.clientX / innerWidth - 0.5) * 0.7;
  }, { passive: true });

  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, visible = true, t0 = performance.now();

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ring(R, tilt, spin, t, color) {
      // An ellipse lying on a tilted plane, with a small satellite riding it.
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(spin);
      ctx.beginPath();
      ctx.ellipse(0, 0, R, R * Math.abs(Math.sin(tilt)), 0, 0, Math.PI * 2);
      ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]); ctx.stroke(); ctx.setLineDash([]);
      const a = t;
      const sx = Math.cos(a) * R, sy = Math.sin(a) * R * Math.abs(Math.sin(tilt));
      ctx.beginPath(); ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#80ef80'; ctx.shadowColor = '#80ef80'; ctx.shadowBlur = 10; ctx.fill();
      ctx.restore();
    }

    function draw(now) {
      const t = (now - t0) / 1000;
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.34;
      const dotScale = Math.max(0.65, Math.min(1.15, R / 140));
      const rotY = t * 0.18 + cy, rotX = -0.35 + cx;
      const sY = Math.sin(rotY), cY = Math.cos(rotY), sX = Math.sin(rotX), cX = Math.cos(rotX);

      ring(R * 1.42, 0.38, -0.32, t * 0.6, 'rgba(124, 58, 237, .28)');

      const proj = [];
      for (const [x, y, z] of pts) {
        const x1 = x * cY - z * sY, z1 = x * sY + z * cY;
        const y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
        const p = 2.6 / (2.6 - z2);
        proj.push([w / 2 + x1 * R * p, h / 2 + y1 * R * p, z2, y]);
      }
      proj.sort((a, b) => a[2] - b[2]);
      for (const [px, py, z, lat] of proj) {
        const depth = (z + 1) / 2;
        const hue = 262 + lat * 22;
        ctx.beginPath();
        ctx.arc(px, py, (0.7 + depth * 1.7) * dotScale, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 80%, ${58 + depth * 6}%, ${0.12 + depth * 0.78})`;
        ctx.fill();
      }

      ring(R * 1.18, 0.9, 0.5, -t * 0.9 + 2, 'rgba(167, 139, 250, .35)');
      if (!still && visible) requestAnimationFrame(draw);
    }

    size();
    new ResizeObserver(() => { size(); if (still) draw(performance.now()); }).observe(canvas);
    new IntersectionObserver(([e]) => {
      const was = visible; visible = e.isIntersecting;
      if (visible && !was && !still) requestAnimationFrame(draw);
    }).observe(canvas);
    requestAnimationFrame(draw);
  });
})();
