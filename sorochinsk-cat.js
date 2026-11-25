(() => {
  const cat = document.querySelector('.contact-route-cat');
  const route = cat.previousElementSibling;
  const stage = cat.querySelector('.contact-route-cat-frames');
  const motionButton = document.querySelector('.contact-cat-motion');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = matchMedia('(hover: hover)');
  const atlas = new Image();
  const idleAtlas = new Image();
  atlas.alt = '';
  atlas.className = 'contact-route-cat-gesture';
  idleAtlas.alt = '';
  idleAtlas.className = 'contact-route-cat-idle';
  stage.append(atlas, idleAtlas);

  const columns = 6;
  const rows = 20;
  const frameCount = columns * rows;
  const restDuration = 8000;
  // Move each atlas on one transform timeline to keep the row and column in sync.
  function atlasFrame(frame, atlasRows, offset) {
    const x = -100 * (frame % columns) / columns;
    const y = -100 * Math.floor(frame / columns) / atlasRows;
    return { transform: `translate(${x}%, ${y}%)`, offset, easing: 'steps(1, end)' };
  }

  const keyframes = Array.from({ length: frameCount + 1 }, (_, index) => {
    return atlasFrame(Math.min(index, frameCount - 1), rows, index / frameCount);
  });

  function easeBetween(time, start, end) {
    const progress = Math.min(1, Math.max(0, (time - start) / (end - start)));
    return progress * progress * (3 - 2 * progress);
  }

  function riseAndFall(time, start, peak, end) {
    return easeBetween(time, start, peak) - easeBetween(time, peak, end);
  }

  function restKeyframes(withBlink) {
    const poses = [];
    const duration = restDuration / 1000;
    let previousTile = -1;
    for (let index = 0; index < duration * 60; index++) {
      const time = index / 60;
      const breath = riseAndFall(time, 0, 1.48, 3.75) + riseAndFall(time, 4.04, 5.62, duration);
      const blink = withBlink ? Math.round(12 * riseAndFall(time, 3.78, 3.86, 4.02)) : 0;
      const tile = blink ? 23 + blink : Math.round(23 * breath);
      if (tile !== previousTile) poses.push(atlasFrame(tile, 6, time / duration));
      previousTile = tile;
    }
    poses.push(atlasFrame(0, 6, 1));
    return poses;
  }

  const rests = [restKeyframes(true), restKeyframes(false)];
  let loading = false;
  let playback;
  let idlePlayback;
  let replayTimer;
  let restIndex = 0;
  let visible = false;
  let paused = false;

  function canPlay() {
    return visible && !document.hidden && !reducedMotion.matches && !paused;
  }

  function stopRest() {
    clearTimeout(replayTimer);
    replayTimer = null;
    idlePlayback?.cancel();
    idlePlayback = null;
    cat.classList.remove('is-resting');
  }

  function stop() {
    stopRest();
    playback?.cancel();
    playback = null;
    cat.classList.remove('is-playing');
  }

  async function rest() {
    if (!canPlay()) return;
    const start = performance.now();
    const timer = setTimeout(play, restDuration);
    replayTimer = timer;

    try {
      await idleAtlas.decode();
      if (replayTimer !== timer || !canPlay()) return;
      idlePlayback = idleAtlas.animate(rests[restIndex], { duration: restDuration, fill: 'both' });
      idlePlayback.currentTime = performance.now() - start;
      cat.classList.add('is-resting');
      restIndex = 1 - restIndex;
    } catch {
      // The next paw gesture still runs if the idle image cannot load.
    }
  }

  async function play() {
    if (!canPlay() || loading || playback) return;
    stopRest();
    loading = true;

    try {
      if (!atlas.src) atlas.src = stage.dataset.src;
      await atlas.decode();
      if (!canPlay()) return;
      if (!idleAtlas.src) idleAtlas.src = stage.dataset.idleSrc;

      cat.classList.add('is-playing');
      const animation = atlas.animate(keyframes, { duration: 2000, fill: 'both' });
      playback = animation;
      animation.onfinish = () => {
        if (playback !== animation) return;
        stop();
        rest();
      };
    } catch {
      stop();
    } finally {
      loading = false;
    }
  }

  function syncPlayback() {
    if (canPlay()) play();
    else stop();
  }

  motionButton.hidden = reducedMotion.matches;
  motionButton.addEventListener('click', () => {
    paused = !paused;
    motionButton.textContent = paused ? 'Включить анимацию' : 'Пауза анимации';
    syncPlayback();
  });
  reducedMotion.addEventListener('change', () => {
    motionButton.hidden = reducedMotion.matches;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  route.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch' && canHover.matches) play();
  });
  route.addEventListener('focus', () => {
    if (route.matches(':focus-visible')) play();
  });

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= .6;
    syncPlayback();
  }, { threshold: .6 });
  observer.observe(cat);
})();
