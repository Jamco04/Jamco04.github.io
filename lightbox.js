// Full-screen photo viewer: arrows (and swipe / arrow keys) step through every
// photo on the page, X or Esc closes it.
(function () {
  const links = [...document.querySelectorAll('.frames a')];
  if (!links.length) return;

  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Photo viewer');
  box.hidden = true;
  box.innerHTML = `
    <button class="lb-btn lb-close" type="button" aria-label="Close">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <button class="lb-btn lb-prev" type="button" aria-label="Previous photo">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    <figure class="lb-stage"><img alt=""><figcaption><span class="lb-cap"></span><span class="lb-count"></span></figcaption></figure>
    <button class="lb-btn lb-next" type="button" aria-label="Next photo">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>`;
  document.body.appendChild(box);

  const img = box.querySelector('img');
  const cap = box.querySelector('.lb-cap');
  const count = box.querySelector('.lb-count');
  const prev = box.querySelector('.lb-prev');
  const next = box.querySelector('.lb-next');
  const close = box.querySelector('.lb-close');
  let index = 0, opener = null;

  function caption(a) {
    const fc = a.closest('figure') && a.closest('figure').querySelector('figcaption');
    return fc ? fc.textContent.trim() : '';
  }

  function show(i) {
    index = (i + links.length) % links.length;
    const a = links[index], thumb = a.querySelector('img');
    img.classList.remove('in');
    img.src = a.getAttribute('href');
    img.alt = thumb ? thumb.alt : '';
    cap.textContent = caption(a);
    count.textContent = links.length > 1 ? `${index + 1} / ${links.length}` : '';
    requestAnimationFrame(() => img.classList.add('in'));
    // warm up the neighbours so stepping feels instant
    [index - 1, index + 1].forEach(j => { const n = links[(j + links.length) % links.length]; new Image().src = n.getAttribute('href'); });
  }

  function open(i) {
    opener = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add('lb-open');
    show(i);
    requestAnimationFrame(() => box.classList.add('show'));
    close.focus();
  }

  function shut() {
    box.classList.remove('show');
    document.documentElement.classList.remove('lb-open');
    setTimeout(() => { box.hidden = true; img.removeAttribute('src'); }, 200);
    if (opener) opener.focus();
  }

  links.forEach((a, i) => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    open(i);
  }));

  if (links.length < 2) { prev.hidden = true; next.hidden = true; }
  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  close.addEventListener('click', shut);
  box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('lb-stage')) shut(); });

  document.addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'Escape') shut();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'Tab') {
      // keep focus inside the viewer
      const f = [close, prev, next].filter(b => !b.hidden);
      const at = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  let sx = 0, sy = 0;
  box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) shut();
  }, { passive: true });
})();
