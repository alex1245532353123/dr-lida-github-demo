(() => {
  const cat = document.querySelector('.contact-route-cat');
  const route = cat.previousElementSibling;
  const stage = cat.querySelector('.contact-route-cat-frames');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = matchMedia('(hover: hover)');
  const atlas = new Image();
  atlas.alt = '';
  stage.append(atlas);

  const columns = 6;
  const rows = 20;
  const frameCount = columns * rows;
  // A single transform timeline keeps both atlas coordinates on the same frame.
  const keyframes = Array.from({ length: frameCount + 1 }, (_, index) => {
    const frame = Math.min(index, frameCount - 1);
    const x = -100 * (frame % columns) / columns;
    const y = -100 * Math.floor(frame / columns) / rows;
    return { transform: `translate(${x}%, ${y}%)`, offset: index / frameCount, easing: 'steps(1, end)' };
  });
  let loading = false;
  let playback;

  function stop() {
    playback?.cancel();
    playback = null;
    cat.classList.remove('is-playing');
  }

  async function play() {
    if (loading || reducedMotion.matches || playback) return;
    loading = true;

    try {
      if (!atlas.src) atlas.src = stage.dataset.src;
      await atlas.decode();
      if (reducedMotion.matches) return;

      cat.classList.add('is-playing');
      playback = atlas.animate(keyframes, { duration: 2000, fill: 'both' });
      playback.onfinish = stop;
    } catch {
      stop();
    } finally {
      loading = false;
    }
  }

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) stop();
  });
  route.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch' && canHover.matches) play();
  });
  route.addEventListener('focus', () => {
    if (route.matches(':focus-visible')) play();
  });

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio < .6) return;
    observer.disconnect();
    play();
  }, { threshold: .6 });
  observer.observe(cat);
})();

