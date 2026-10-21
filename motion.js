(() => {
  'use strict';

  const init = () => {
    const root = document.documentElement;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canAnimate = typeof Element.prototype.animate === 'function';
    const seen = new WeakSet();
    const settings = new WeakMap();
    const active = new Set();
    const runningOn = new WeakMap();
    const ease = 'cubic-bezier(.16,1,.3,1)';
    let reduced = preference.matches;

    // Content stays visible if motion is unsupported or JavaScript stops.
    root.classList.toggle('motion-reduced', reduced);
    root.classList.add('motion-ready');

    const animate = (element, frames, options = {}) => {
      if (reduced || !canAnimate || !element?.isConnected) return;
      runningOn.get(element)?.cancel();
      const animation = element.animate(frames, {
        duration: 620, easing: ease, fill: 'backwards', ...options,
      });
      active.add(animation);
      runningOn.set(element, animation);
      const cleanup = () => {
        active.delete(animation);
        if (runningOn.get(element) === animation) runningOn.delete(element);
      };
      animation.finished.then(cleanup, cleanup);
      return animation;
    };

    const reveal = (element) => {
      if (seen.has(element)) return;
      seen.add(element);
      const { delay = 0, distance = 26, side = 0 } = settings.get(element) || {};
      const focused = element.contains(document.activeElement);
      animate(element, [
        { opacity: focused ? 1 : 0, transform: `translate3d(${side}px,${distance}px,0)` },
        { opacity: 1, transform: 'translate3d(0,0,0)' },
      ], { delay: focused ? 0 : delay });
    };

    const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }) : null;

    const watch = (element, options = {}) => {
      if (!element || seen.has(element)) return;
      settings.set(element, options);
      if (!reduced && observer) observer.observe(element);
    };

    document.querySelectorAll('.hero-copy > *').forEach((element, index) => {
      watch(element, { delay: Math.min(index * 75, 300), distance: 24 });
    });
    watch(document.querySelector('.hero-art'), { delay: 130, distance: 16, side: 24 });
    document.querySelectorAll('.section-heading, .gallery-toolbar, .gallery-overview, .story-visual, .story-copy, .order-copy, .order-form, .faq > div, .social-banner > div, .social-banner > a').forEach((element) => watch(element));
    document.querySelectorAll('.steps article').forEach((element, index) => {
      watch(element, { delay: index * 90 });
    });

    const gallery = document.querySelector('#gallery-grid');
    const watchCards = () => {
      const columns = window.matchMedia('(max-width: 800px)').matches ? 2 : 3;
      gallery?.querySelectorAll('.creation-card').forEach((element, index) => {
        watch(element, { delay: (index % columns) * 65, distance: 24 });
      });
    };
    watchCards();
    if (gallery) new MutationObserver(watchCards).observe(gallery, { childList: true });

    // Never leave a keyboard user's focused control waiting to appear.
    document.addEventListener('focusin', (event) => {
      let element = event.target;
      while (element instanceof Element) {
        runningOn.get(element)?.finish();
        element = element.parentElement;
      }
    });

    const dialog = document.querySelector('#gallery-dialog');
    const photo = document.querySelector('#dialog-image');
    photo?.addEventListener('load', () => {
      if (!dialog?.open) return;
      animate(photo, [
        { opacity: 0.25, transform: 'scale(.975)' },
        { opacity: 1, transform: 'scale(1)' },
      ], { duration: 360 });
    });
    dialog?.addEventListener('close', () => runningOn.get(photo)?.cancel());

    const progress = document.createElement('div');
    progress.className = 'reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.prepend(progress);
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const distance = root.scrollHeight - window.innerHeight;
      const fraction = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      progress.style.transform = `scaleX(${fraction})`;
    };
    const scheduleProgress = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    window.addEventListener('scroll', scheduleProgress, { passive: true });
    window.addEventListener('resize', scheduleProgress, { passive: true });
    window.addEventListener('load', scheduleProgress, { once: true });
    if ('ResizeObserver' in window) new ResizeObserver(scheduleProgress).observe(document.body);
    updateProgress();

    preference.addEventListener('change', (event) => {
      reduced = event.matches;
      root.classList.toggle('motion-reduced', reduced);
      if (reduced) {
        observer?.disconnect();
        active.forEach((animation) => animation.cancel());
        active.clear();
      } else {
        document.querySelectorAll('.hero-copy > *, .hero-art, .section-heading, .gallery-toolbar, .gallery-overview, .story-visual, .story-copy, .steps article, .order-copy, .order-form, .faq > div, .social-banner > div, .social-banner > a').forEach((element) => watch(element, settings.get(element)));
        watchCards();
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
