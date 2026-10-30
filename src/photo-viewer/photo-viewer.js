// Steadfast Code site-kit: photo viewer.
//
// A full-screen <dialog> that opens when a visitor clicks one of a set of photo links, with
// previous/next on buttons, arrow keys and swipe, and Esc, the close button or a click outside the
// photo to close. No dependencies. The links stay ordinary links to the full-size image, so with
// JavaScript off (or a ctrl/cmd/shift/middle click) the photo opens the way it always would.
//
// Markup (PhotoViewer.astro writes it; any site can write it by hand, see examples/plain.html):
//
//   <dialog data-photo-viewer data-links=".photos a" data-count-format="{n} of {total}" class="pv">
//     <button type="button" class="pv-close" data-pv="close" aria-label="Close">×</button>
//     <p class="pv-count" data-pv-count aria-live="polite"></p>
//     <button type="button" class="pv-prev" data-pv="prev" aria-label="Previous photo">‹</button>
//     <figure class="pv-stage" data-pv-stage><img data-pv-image alt=""><figcaption data-pv-caption></figcaption></figure>
//     <button type="button" class="pv-next" data-pv="next" aria-label="Next photo">›</button>
//   </dialog>
//
// Each link's href is the full-size image. Its alt text comes from data-alt or the <img> inside
// it; its caption from data-caption or the <figcaption> of the <figure> around it.
//
// One thing learned the hard way (Mr Dandyman, 2026-10-30): right after a swipe, Chrome on Android
// can swallow the first tap's click event. So touch taps act on pointerup, and the click that may or
// may not follow is ignored; mouse and keyboard use ordinary clicks.
(() => {
  const init = (d) => {
    if (!d.showModal || d.dataset.pvReady) return;
    d.dataset.pvReady = '1';
    const links = [...document.querySelectorAll(d.dataset.links || 'a[data-photo]')];
    if (!links.length) return;
    const img = d.querySelector('[data-pv-image]');
    const cap = d.querySelector('[data-pv-caption]');
    const num = d.querySelector('[data-pv-count]');
    const format = d.dataset.countFormat || '{n} of {total}';
    const many = links.length > 1;
    let i = 0;
    let x = null;
    let y = null;
    let tapped = false;
    d.classList.toggle('pv-single', !many);

    const at = (k) => links[(k + links.length) % links.length];
    const captionOf = (a) =>
      a.dataset.caption ?? a.closest('figure')?.querySelector('figcaption')?.textContent.replace(/\s+/g, ' ').trim() ?? '';
    const show = (n) => {
      i = (n + links.length) % links.length;
      const a = links[i];
      img.src = a.href;
      img.alt = a.dataset.alt ?? a.querySelector('img')?.alt ?? '';
      if (cap) cap.textContent = captionOf(a);
      if (num) num.textContent = many ? format.replace('{n}', String(i + 1)).replace('{total}', String(links.length)) : '';
      if (many) for (const p of [at(i + 1), at(i - 1)]) new Image().src = p.href; // neighbours load ahead
    };
    const act = (target) => {
      const button = target.closest('button');
      if (button) {
        if (button.dataset.pv === 'prev') show(i - 1);
        else if (button.dataset.pv === 'next') show(i + 1);
        else if (button.dataset.pv === 'close') d.close();
      } else if (target === d || target.matches('[data-pv-stage]')) {
        d.close(); // the dark area around the photo, not the photo itself
      }
    };

    links.forEach((a, n) =>
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
        e.preventDefault();
        show(n);
        d.showModal();
        document.documentElement.classList.add('pv-open');
      }),
    );
    d.addEventListener('close', () => {
      document.documentElement.classList.remove('pv-open');
      img.removeAttribute('src');
      links[i].focus();
    });
    d.addEventListener('keydown', (e) => {
      if (!many) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
    });
    d.addEventListener('pointerdown', (e) => { x = e.clientX; y = e.clientY; tapped = false; });
    d.addEventListener('pointercancel', () => { x = null; });
    d.addEventListener('pointerup', (e) => {
      if (x === null) return;
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      x = null;
      if (e.pointerType === 'mouse') return;
      tapped = true;
      if (many && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
      else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) act(e.target);
    });
    d.addEventListener('click', (e) => {
      if (tapped) { tapped = false; return; }
      act(e.target);
    });
  };

  const start = () => document.querySelectorAll('dialog[data-photo-viewer]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  document.addEventListener('astro:page-load', start); // sites using Astro's client router
})();
