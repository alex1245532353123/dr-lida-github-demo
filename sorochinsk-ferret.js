(() => {
  const ferret = document.querySelector('.contact-route-ferret');
  const route = ferret.previousElementSibling;
  const stage = ferret.querySelector('.contact-route-ferret-frames');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = matchMedia('(hover: hover)');
  const atlas = new Image();
  atlas.alt = '';
  stage.append(atlas);

  const columns = 8;
  const rows = 24;
  const gestureFrameCount = 168;
  const breathFrameCount = columns * rows - gestureFrameCount;
  const duration = 3850;
  const restDuration = 6000;
  // Keep both sprite coordinates on one timeline so they always select the same frame.
  function frameAt(frame, offset) {
    const x = -100 * (frame % columns) / columns;
    const y = -100 * Math.floor(frame / columns) / rows;
    return { transform: `translate(${x}%, ${y}%)`, offset, easing: 'steps(1, end)' };
  }

  const gesture = Array.from({ length: gestureFrameCount + 1 }, (_, index) =>
    frameAt(Math.min(index, gestureFrameCount - 1), index / gestureFrameCount)
  );

  function easeBetween(time, start, end) {
    const progress = Math.min(1, Math.max(0, (time - start) / (end - start)));
    return progress * progress * (3 - 2 * progress);
  }

  const breathing = [];
  let previousFrame = -1;
  for (let time = 0; time < restDuration; time += 1000 / 60) {
    const breath = easeBetween(time, 0, 1020) - easeBetween(time, 1020, 2750)
      + .82 * (easeBetween(time, 2970, 4150) - easeBetween(time, 4150, restDuration));
    const frame = gestureFrameCount + Math.round((breathFrameCount - 1) * breath);
    if (frame !== previousFrame) breathing.push(frameAt(frame, time / restDuration));
    previousFrame = frame;
  }
  breathing.push(frameAt(gestureFrameCount, 1));

  let visible = false;
  let loading = false;
  let playback;
  let pawPress;

  function canPlay() {
    return visible && !document.hidden && !reducedMotion.matches;
  }

  function stop() {
    if (!playback) return;
    playback.cancel();
    pawPress?.cancel();
    playback = null;
    pawPress = null;
    ferret.classList.remove('is-playing', 'is-resting');
  }

  function animate(frames, duration, state, onFinish) {
    playback?.cancel();
    const animation = atlas.animate(frames, { duration, fill: 'both' });
    playback = animation;
    ferret.classList.toggle('is-playing', state === 'is-playing');
    ferret.classList.toggle('is-resting', state === 'is-resting');
    animation.onfinish = () => {
      if (playback !== animation) return;
      if (canPlay()) onFinish();
      else stop();
    };
    return animation;
  }

  function rest() {
    pawPress?.cancel();
    pawPress = null;
    animate(breathing, restDuration, 'is-resting', play);
  }

  async function play() {
    if (!canPlay() || loading || ferret.classList.contains('is-playing')) return;
    loading = true;
    try {
      if (!atlas.src) atlas.src = stage.dataset.src;
      await atlas.decode();
      if (!canPlay()) return;

      const movement = animate(gesture, duration, 'is-playing', rest);
      const pressed = {
        translate: '0 var(--ferret-press-depth, 3px)',
        boxShadow: '0 1px var(--ink), inset 0 1px rgb(255 255 255 / 65%)',
      };
      pawPress = route.animate([
        { easing: 'ease-in' },
        { ...pressed, offset: .23 },
        { ...pressed, offset: .36, easing: 'cubic-bezier(.25, .65, .35, 1)' },
        {},
      ], { id: 'sorochinsk-paw-press', delay: 2190, duration: 440 });
      // Start both effects on the same frame; the delay matches the paw's reach.
      const startTime = movement.timeline.currentTime;
      movement.startTime = startTime;
      pawPress.startTime = startTime;
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

  reducedMotion.addEventListener('change', syncPlayback);
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
  observer.observe(ferret);
})();

