// Lishen Editorial Observatory: interaction layer for the restored Hexo base.
(function () {
  'use strict';

  var particleFrame = null;
  var particleCleanup = null;
  var depthCardCleanup = null;
  var observatoryStorageKey = 'lishen-editorial-observatory-state';

  function readObservatorySnapshot() {
    try {
      var raw = window.sessionStorage.getItem(observatoryStorageKey);
      if (!raw) return null;
      var snapshot = JSON.parse(raw);
      if (!snapshot || typeof snapshot.paused !== 'boolean' || !Number.isInteger(snapshot.shape) || snapshot.shape < 0 || snapshot.shape > 2) return null;
      if (!Number.isFinite(snapshot.rotationX) || !Number.isFinite(snapshot.rotationY)) return null;
      if (snapshot.rotationX < -1.1 || snapshot.rotationX > 1.1 || Math.abs(snapshot.rotationY) > 100000) return null;
      return snapshot;
    } catch (error) {
      return null;
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initHeroElements() {
    var header = document.querySelector('#page-header.full_page');
    var siteInfo = document.getElementById('site-info');
    if (!header || !siteInfo) return;

    if (!document.getElementById('editorial-hero-badge')) {
      var badge = document.createElement('div');
      badge.id = 'editorial-hero-badge';
      badge.className = 'hero-badge';
      badge.innerHTML = '<span class="hero-badge-dot" aria-hidden="true"></span><span>FIELD NOTES · PERSONAL OBSERVATORY</span>';
      siteInfo.insertBefore(badge, siteInfo.firstChild);
    }

    if (!document.getElementById('editorial-hero-brief')) {
      var brief = document.createElement('div');
      var countNode = document.querySelector('#aside-content .site-data a .length-num');
      var postCount = countNode ? Number(countNode.textContent.trim()) : document.querySelectorAll('#recent-posts .recent-post-item').length;
      brief.id = 'editorial-hero-brief';
      brief.className = 'hero-brief';
      brief.innerHTML = '<span>OPEN KNOWLEDGE</span><span>' + String(postCount || 0).padStart(2, '0') + ' ENTRIES</span><span>EST. 2026</span>';
      siteInfo.appendChild(brief);
    }

    if (!document.getElementById('hero-actions')) {
      var actions = document.createElement('div');
      actions.id = 'hero-actions';
      actions.className = 'hero-actions';
      actions.innerHTML = '<a href="#recent-posts" class="hero-btn hero-btn-primary" data-editorial-scroll="recent-posts"><i class="fas fa-arrow-down" aria-hidden="true"></i><span>进入档案</span></a>'
        + '<a href="/about/" class="hero-btn hero-btn-glass"><i class="fas fa-fingerprint" aria-hidden="true"></i><span>关于李神</span></a>'
        + '<a href="https://github.com/lljfei" target="_blank" rel="noopener" class="hero-btn hero-btn-glass"><i class="fab fa-github" aria-hidden="true"></i><span>GitHub</span></a>';
      siteInfo.appendChild(actions);

      var exploreButton = actions.querySelector('[data-editorial-scroll]');
      if (exploreButton) {
        exploreButton.addEventListener('click', function (event) {
          var target = document.getElementById('recent-posts');
          if (!target) return;
          event.preventDefault();
          target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        });
      }
    }
  }

  /**
   * Mount the homepage's 3D scene and controls without changing article navigation.
   * Takes no parameters and returns void; unavailable WebGL falls back to static artwork.
   */
  function initHeroParticles() {
    var header = document.querySelector('#page-header.full_page');
    if (!header) {
      if (particleCleanup) particleCleanup();
      return;
    }
    if (header.querySelector('#editorial-observatory')) return;
    if (particleCleanup) particleCleanup();

    var observatory = document.createElement('section');
    observatory.id = 'editorial-observatory';
    observatory.className = 'observatory';
    observatory.setAttribute('aria-label', '3D 轨道观测台');
    observatory.innerHTML = '<div class="observatory-heading"><span class="observatory-kicker"><span class="observatory-eyebrow" aria-hidden="true">FORM / 01</span><span class="observatory-name">轨道观测台</span></span><span class="observatory-state"><i aria-hidden="true"></i><span class="observatory-state-label">缓慢自转</span></span></div>'
      + '<div class="observatory-stage"><canvas id="hero-observatory-canvas" class="observatory-canvas" tabindex="0" aria-label="交互式 3D 造型，方向键调整视角" aria-describedby="observatory-hint"></canvas><div class="observatory-fallback" aria-hidden="true"><span></span><span></span><span></span></div><div class="observatory-caption"><strong class="observatory-title">Orbital Sphere</strong><span class="observatory-subtitle">光沿轨道流动，灵感由此发生。</span></div></div>'
      + '<div class="observatory-controls"><div class="observatory-shapes" role="group" aria-label="切换 3D 形态"><button type="button" data-shape="0" aria-pressed="true">球体</button><button type="button" data-shape="1" aria-pressed="false">环流</button><button type="button" data-shape="2" aria-pressed="false">螺旋</button></div><div class="observatory-tools"><button type="button" data-action="pause" aria-label="暂停自动旋转"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M7 5v10M13 5v10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span>暂停</span></button><button type="button" data-action="reset" aria-label="复位 3D 视角"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 8a6 6 0 1 1 0 4M4 3v5h5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>复位</span></button></div></div>'
      + '<p id="observatory-hint" class="observatory-hint">拖动探索 <span aria-hidden="true">·</span> 方向键调整 <span aria-hidden="true">·</span> R 复位</p>';
    header.appendChild(observatory);
    header.classList.add('has-observatory');
    document.body.classList.add('observatory-in-view');

    var canvas = observatory.querySelector('canvas');
    var stage = observatory.querySelector('.observatory-stage');
    var pauseButton = observatory.querySelector('[data-action="pause"]');
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var renderer = null;
    var destroyed = false;
    var suspended = false;
    var visible = true;
    var paused = false;
    var pointerId = null;
    var lastX = 0;
    var lastY = 0;
    var previousTime = 0;
    var targetX = -0.2;
    var targetY = 0.7;
    var selectedShape = 0;
    var targetWeights = [1, 0, 0];
    var state = { rotationX: targetX, rotationY: targetY, weights: [1, 0, 0], width: 1, height: 1, pixelRatio: 1 };
    var visibilityObserver = null;
    var resizeObserver = null;
    var names = ['Orbital Sphere', 'Flux Torus', 'Helix Study'];
    var descriptions = ['光沿轨道流动，灵感由此发生。', '在循环之间，寻找新的连接。', '循序向上，让每一次探索延展。'];
    var restoredSnapshot = readObservatorySnapshot();
    if (restoredSnapshot) {
      paused = restoredSnapshot.paused;
      targetX = state.rotationX = restoredSnapshot.rotationX;
      targetY = state.rotationY = restoredSnapshot.rotationY;
    }

    /** Schedule at most one visible frame. No parameters; returns void. */
    function requestRender() {
      if (destroyed || suspended || !renderer || !visible || document.hidden || particleFrame !== null) return;
      particleFrame = window.requestAnimationFrame(renderFrame);
    }

    /** Cancel pending work and reset elapsed time. No parameters; returns void. */
    function stop() {
      if (particleFrame !== null) window.cancelAnimationFrame(particleFrame);
      particleFrame = null;
      previousTime = 0;
    }

    function saveSnapshot() {
      if (!renderer && !observatory.isConnected) return;
      try {
        window.sessionStorage.setItem(observatoryStorageKey, JSON.stringify({
          paused: paused,
          shape: selectedShape,
          rotationX: state.rotationX,
          rotationY: state.rotationY
        }));
      } catch (error) {
        // Storage may be disabled; the scene remains fully usable without persistence.
      }
    }

    /**
     * Advance rotation and shape weights using elapsed time, then render once.
     * Accepts a DOMHighResTimeStamp in milliseconds and returns void; paused scenes render only on input.
     */
    function renderFrame(timestamp) {
      particleFrame = null;
      if (destroyed || suspended || !renderer || !visible || document.hidden) return;
      var elapsed = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.05) : 1 / 60;
      previousTime = timestamp;
      var autoRotate = !paused && !motionQuery.matches && pointerId === null;
      if (autoRotate) targetY += elapsed * 0.085;
      var response = motionQuery.matches ? 1 : 1 - Math.exp(-elapsed * 10);
      var moving = false;
      state.rotationX += (targetX - state.rotationX) * response;
      state.rotationY += (targetY - state.rotationY) * response;
      // Interpolate from the current mixture, so repeated shape changes cannot jump.
      state.weights.forEach(function (weight, index) {
        state.weights[index] += (targetWeights[index] - weight) * response;
        if (Math.abs(targetWeights[index] - state.weights[index]) > 0.0005) moving = true;
        else state.weights[index] = targetWeights[index];
      });
      if (Math.abs(targetX - state.rotationX) + Math.abs(targetY - state.rotationY) > 0.0005) moving = true;
      else {
        state.rotationX = targetX;
        state.rotationY = targetY;
      }
      renderer.render(state);
      if (autoRotate || moving) requestRender();
      else previousTime = 0;
    }

    /** Synchronize visible and accessible playback labels. No parameters; returns void. */
    function syncControls() {
      var reduced = motionQuery.matches;
      observatory.classList.toggle('is-paused', paused);
      observatory.classList.toggle('is-static', reduced);
      var status = !renderer ? '静态预览' : reduced ? '静态展示' : paused ? '已暂停' : '缓慢自转';
      observatory.querySelector('.observatory-state-label').textContent = status;
      pauseButton.disabled = reduced || !renderer;
      pauseButton.querySelector('span').textContent = reduced ? '静态' : paused ? '播放' : '暂停';
      pauseButton.setAttribute('aria-label', reduced ? '已跟随系统减少动态效果设置' : paused ? '继续自动旋转' : '暂停自动旋转');
      pauseButton.querySelector('path').setAttribute('d', paused ? 'M7 4.5 15 10l-8 5.5z' : 'M7 5v10M13 5v10');
    }

    /** Size the drawing buffer to the stage with capped density. No parameters; returns void. */
    function resize() {
      if (destroyed) return;
      var bounds = stage.getBoundingClientRect();
      state.width = Math.max(1, bounds.width);
      state.height = Math.max(1, bounds.height);
      state.pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 1.75);
      var width = Math.round(state.width * state.pixelRatio);
      var height = Math.round(state.height * state.pixelRatio);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      if (!visibilityObserver) updateSceneVisibility();
      requestRender();
    }

    /** Initialize or restore GPU resources, retaining a static fallback on failure. No parameters; returns void. */
    function prepareRenderer() {
      if (destroyed) return;
      if (renderer) renderer.dispose();
      renderer = null;
      try {
        if (typeof window.createObservatoryRenderer === 'function') renderer = window.createObservatoryRenderer(canvas);
      } catch (error) {
        console.warn('3D observatory initialization failed:', error);
        renderer = null;
      }
      observatory.classList.toggle('is-ready', !!renderer);
      observatory.classList.toggle('is-unavailable', !renderer);
      canvas.tabIndex = renderer ? 0 : -1;
      observatory.querySelector('.observatory-hint').hidden = !renderer;
      syncControls();
      resize();
    }

    /** Toggle automatic rotation while keeping direct manipulation available. No parameters; returns void. */
    function togglePaused() {
      if (!renderer || motionQuery.matches) return;
      paused = !paused;
      syncControls();
      stop();
      requestRender();
    }

    /** Restore the initial viewing angle in the current shape. No parameters; returns void. */
    function resetView() {
      targetX = -0.2;
      var fullTurn = Math.PI * 2;
      targetY = 0.7 + Math.round((state.rotationY - 0.7) / fullTurn) * fullTurn;
      if (paused || motionQuery.matches) {
        state.rotationX = targetX;
        state.rotationY = targetY;
      }
      requestRender();
    }

    /** Select shape index {number} 0–2; returns void and updates the selected button and caption. */
    function setShape(index) {
      if (index === selectedShape) return;
      selectedShape = index;
      targetWeights = [0, 0, 0];
      targetWeights[index] = 1;
      if (motionQuery.matches) state.weights = targetWeights.slice();
      observatory.querySelectorAll('[data-shape]').forEach(function (button) {
        button.setAttribute('aria-pressed', String(Number(button.dataset.shape) === index));
      });
      observatory.querySelector('.observatory-eyebrow').textContent = 'FORM / 0' + (index + 1);
      observatory.querySelector('.observatory-title').textContent = names[index];
      observatory.querySelector('.observatory-subtitle').textContent = descriptions[index];
      requestRender();
    }

    /** Release an active pointer and its capture, then resume playback if needed. No parameters; returns void. */
    function stopDrag() {
      var activeId = pointerId;
      pointerId = null;
      canvas.classList.remove('is-dragging');
      if (activeId !== null && canvas.hasPointerCapture(activeId)) canvas.releasePointerCapture(activeId);
      requestRender();
    }

    canvas.addEventListener('pointerdown', function (event) {
      if (!renderer || !event.isPrimary || event.button !== 0 || pointerId !== null) return;
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      targetX = state.rotationX;
      targetY = state.rotationY;
      canvas.classList.add('is-dragging');
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', function (event) {
      if (event.pointerId !== pointerId) return;
      targetY += (event.clientX - lastX) * 0.008;
      if (event.pointerType !== 'touch') targetX = Math.max(-1.1, Math.min(1.1, targetX + (event.clientY - lastY) * 0.006));
      lastX = event.clientX;
      lastY = event.clientY;
      state.rotationX = targetX;
      state.rotationY = targetY;
      requestRender();
    });
    canvas.addEventListener('pointerup', stopDrag);
    canvas.addEventListener('pointercancel', stopDrag);
    canvas.addEventListener('lostpointercapture', function () { if (pointerId !== null) stopDrag(); });
    canvas.addEventListener('keydown', function (event) {
      if (!renderer || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.indexOf('Arrow') === 0) {
        event.preventDefault();
        targetX = state.rotationX;
        targetY = state.rotationY;
        if (event.key === 'ArrowLeft') targetY -= 0.12;
        if (event.key === 'ArrowRight') targetY += 0.12;
        if (event.key === 'ArrowUp') targetX -= 0.12;
        if (event.key === 'ArrowDown') targetX += 0.12;
        state.rotationX = targetX = Math.max(-1.1, Math.min(1.1, targetX));
        state.rotationY = targetY;
        requestRender();
      } else if (event.key === ' ') {
        event.preventDefault();
        togglePaused();
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetView();
      }
    });
    observatory.querySelectorAll('[data-shape]').forEach(function (button) {
      button.addEventListener('click', function () { setShape(Number(button.dataset.shape)); });
    });
    pauseButton.addEventListener('click', togglePaused);
    observatory.querySelector('[data-action="reset"]').addEventListener('click', resetView);
    var onContextLost = function (event) {
      if (destroyed) return;
      event.preventDefault();
      stopDrag();
      stop();
      if (renderer) renderer.dispose();
      renderer = null;
      observatory.classList.remove('is-ready');
      observatory.classList.add('is-unavailable');
      canvas.tabIndex = -1;
      observatory.querySelector('.observatory-hint').hidden = true;
      syncControls();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', prepareRenderer);

    var onVisibility = function () {
      if (destroyed) return;
      if (suspended || document.hidden || !visible) {
        stopDrag();
        stop();
      } else requestRender();
    };

    /** Update viewport visibility without IntersectionObserver. No parameters; returns void. */
    function updateSceneVisibility() {
      if (destroyed) return;
      var bounds = observatory.getBoundingClientRect();
      visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      document.body.classList.toggle('observatory-in-view', visible);
      onVisibility();
    }

    var onMotionChange = function () {
      if (destroyed) return;
      stop();
      state.rotationX = targetX;
      state.rotationY = targetY;
      state.weights = targetWeights.slice();
      syncControls();
      requestRender();
    };
    var onPageHide = function (event) {
      if (destroyed) return;
      saveSnapshot();
      if (event.persisted) {
        // Keep the scene and user settings intact while the browser caches this page.
        suspended = true;
        stopDrag();
        stop();
      } else if (particleCleanup) particleCleanup();
    };
    var onPageShow = function (event) {
      if (destroyed || !event.persisted) return;
      suspended = false;
      syncControls();
      resize();
      onVisibility();
    };
    document.addEventListener('visibilitychange', onVisibility);
    motionQuery.addEventListener('change', onMotionChange);
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stage);
    }
    if (window.IntersectionObserver) {
      visibilityObserver = new IntersectionObserver(function (entries) {
        if (destroyed) return;
        visible = entries[0].isIntersecting;
        document.body.classList.toggle('observatory-in-view', visible);
        onVisibility();
      }, { threshold: 0 });
      visibilityObserver.observe(observatory);
    } else window.addEventListener('scroll', updateSceneVisibility, { passive: true });

    particleCleanup = function () {
      saveSnapshot();
      destroyed = true;
      stopDrag();
      stop();
      if (resizeObserver) resizeObserver.disconnect();
      if (visibilityObserver) visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', updateSceneVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      motionQuery.removeEventListener('change', onMotionChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', prepareRenderer);
      if (renderer) renderer.dispose();
      renderer = null;
      observatory.remove();
      header.classList.remove('has-observatory');
      document.body.classList.remove('observatory-in-view');
      particleCleanup = null;
    };
    if (restoredSnapshot && restoredSnapshot.shape !== 0) setShape(restoredSnapshot.shape);
    if (restoredSnapshot) state.weights = targetWeights.slice();
    prepareRenderer();
  }

  /**
   * Add subtle pointer-driven depth to article cards while preserving their link behavior.
   * Takes no parameters and returns void; touch and reduced-motion preferences disable the effect.
   */
  function initDepthCards() {
    if (depthCardCleanup) depthCardCleanup();
    var cards = Array.from(document.querySelectorAll('#recent-posts .recent-post-item:not(.ads-wrap)'));
    if (!cards.length) return;
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    var listeners = [];
    var resets = [];

    cards.forEach(function (card) {
      card.classList.add('depth-card');
      var bounds = null;
      var frame = null;
      var x = 0.5;
      var y = 0.5;

      /** Clear a card's pending frame and tilt. No parameters; returns void. */
      function resetCard() {
        if (frame !== null) window.cancelAnimationFrame(frame);
        frame = null;
        bounds = null;
        card.classList.remove('is-tilting');
        ['--depth-x', '--depth-y', '--depth-light-x', '--depth-light-y'].forEach(function (name) { card.style.removeProperty(name); });
      }

      var move = function (event) {
        if (motionQuery.matches || !pointerQuery.matches || event.pointerType === 'touch') return;
        if (!bounds) bounds = card.getBoundingClientRect();
        x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
        if (frame !== null) return;
        frame = window.requestAnimationFrame(function () {
          frame = null;
          card.classList.add('is-tilting');
          card.style.setProperty('--depth-x', ((0.5 - y) * 5.5).toFixed(2) + 'deg');
          card.style.setProperty('--depth-y', ((x - 0.5) * 6.5).toFixed(2) + 'deg');
          card.style.setProperty('--depth-light-x', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--depth-light-y', (y * 100).toFixed(1) + '%');
        });
      };
      card.addEventListener('pointermove', move, { passive: true });
      card.addEventListener('pointerleave', resetCard);
      resets.push(resetCard);
      listeners.push(function () {
        resetCard();
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerleave', resetCard);
        card.classList.remove('depth-card');
      });
    });

    var resetAll = function () { resets.forEach(function (resetCard) { resetCard(); }); };
    motionQuery.addEventListener('change', resetAll);
    pointerQuery.addEventListener('change', resetAll);
    document.addEventListener('visibilitychange', resetAll);
    window.addEventListener('scroll', resetAll, { passive: true });
    window.addEventListener('resize', resetAll, { passive: true });
    depthCardCleanup = function () {
      listeners.forEach(function (remove) { remove(); });
      motionQuery.removeEventListener('change', resetAll);
      pointerQuery.removeEventListener('change', resetAll);
      document.removeEventListener('visibilitychange', resetAll);
      window.removeEventListener('scroll', resetAll);
      window.removeEventListener('resize', resetAll);
      depthCardCleanup = null;
    };
  }
  function initRecentPostCardLinks() {
    var targets = [
      { container: document.getElementById('recent-posts'), cardSelector: '.recent-post-item', linkSelector: '.article-title' },
      { container: document.querySelector('#aside-content .card-recent-post'), cardSelector: '.aside-list-item', linkSelector: 'a.title' }
    ];

    targets.forEach(function (target) {
      var container = target.container;
      if (!container || container.dataset.editorialCardLinks === 'true') return;
      container.dataset.editorialCardLinks = 'true';

      container.addEventListener('click', function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (window.getSelection && window.getSelection().toString()) return;

        var card = event.target.closest ? event.target.closest(target.cardSelector) : null;
        if (!card || !container.contains(card) || card.classList.contains('ads-wrap')) return;
        if (event.target.closest('a, button, input, textarea, select, summary')) return;

        var titleLink = card.querySelector(target.linkSelector);
        if (titleLink) titleLink.click();
      });
    });
  }

  function initScrollReveal() {
    var selectors = '.recent-post-item, #aside-content .card-widget, #post, #article-container h2, #pagination, .flink-list-item, .about-editorial > *, .about-grid > .editorial-panel';
    var targets = Array.from(document.querySelectorAll(selectors));
    if (!targets.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach(function (target) { target.classList.add('reveal-on-scroll', 'is-visible'); });
      return;
    }

    document.documentElement.classList.add('motion-ready');
    if (!window.editorialRevealObserver) {
      window.editorialRevealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    }

    targets.forEach(function (target, index) {
      if (target.dataset.editorialReveal === 'true') return;
      target.dataset.editorialReveal = 'true';
      target.classList.add('reveal-on-scroll');
      target.style.setProperty('--reveal-delay', Math.min(index, 7) * 55 + 'ms');
      // Large article wrappers rarely meet an area threshold on first paint,
      // so reveal anything already entering the initial viewport immediately.
      if (target.getBoundingClientRect().top < window.innerHeight) {
        target.classList.add('is-visible');
        return;
      }
      window.editorialRevealObserver.observe(target);
    });
  }

  function initTocOffset() {
    var tocContent = document.querySelector('#card-toc .toc-content');
    if (!tocContent || tocContent.dataset.editorialTocOffset === 'true') return;
    tocContent.dataset.editorialTocOffset = 'true';

    tocContent.addEventListener('click', function (event) {
      var target = event.target.closest ? event.target.closest('.toc-link') : null;
      if (!target || !tocContent.contains(target)) return;

      var href = target.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;

      var heading;
      try {
        heading = document.getElementById(decodeURI(href).replace(/^#/, ''));
      } catch (error) {
        return;
      }
      if (!heading) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      var nav = document.getElementById('nav');
      var navHeight = nav ? nav.getBoundingClientRect().height : 0;
      var minimumOffset = window.innerWidth <= 600 ? 72 : 90;
      var offset = Math.max(minimumOffset, navHeight + 16);
      var destination = heading.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - offset;

      history.pushState(null, '', href);
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      window.scrollTo({
        top: Math.max(0, destination),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });

      if (window.innerWidth < 900) {
        var tocLayout = document.getElementById('card-toc');
        if (tocLayout) tocLayout.classList.remove('open');
      }
    }, { capture: true });
  }

  function initMobileToc() {
    var toc = document.getElementById('card-toc');
    var trigger = document.getElementById('mobile-toc-button');
    if (!toc || !trigger || toc.dataset.editorialTocState) return;
    toc.dataset.editorialTocState = 'true';
    toc.setAttribute('role', 'dialog');
    toc.setAttribute('aria-label', '文章目录');
    toc.setAttribute('aria-modal', 'true');
    trigger.setAttribute('aria-controls', toc.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', '打开文章目录');

    var sync = function () {
      var mobile = window.innerWidth < 900;
      var open = toc.classList.contains('open');
      toc.setAttribute('role', mobile ? 'dialog' : 'navigation');
      if (mobile) toc.setAttribute('aria-modal', 'true');
      else toc.removeAttribute('aria-modal');
      trigger.setAttribute('aria-expanded', String(mobile && open));
      trigger.setAttribute('aria-label', mobile && open ? '关闭文章目录' : '打开文章目录');
      toc.setAttribute('aria-hidden', String(mobile && !open));
      toc.inert = mobile && !open;
      if (mobile && open) {
        var firstLink = toc.querySelector('.toc-link');
        if (firstLink && !toc.contains(document.activeElement)) firstLink.focus({ preventScroll: true });
      }
    };
    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        trigger.click();
      }
    });
    toc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && window.innerWidth < 900) {
        event.preventDefault();
        trigger.click();
        trigger.focus({ preventScroll: true });
      } else if (window.innerWidth < 900) {
        trapFocus(event, toc);
      }
    });
    new MutationObserver(sync).observe(toc, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', sync, { passive: true });
    sync();
  }

  function initNavState() {
    var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('#nav .menus_item > a, #sidebar-menus .menus_item > a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      var linkPath;
      try {
        linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
      } catch (error) {
        return;
      }
      var active = linkPath === currentPath || (linkPath !== '/' && currentPath.indexOf(linkPath + '/') === 0);
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (window.editorialNavBound) return;
    window.editorialNavBound = true;
    var update = function () {
      var currentTop = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
      // Keep the compact navigation state until the browser reaches the exact page origin.
      document.body.classList.toggle('nav-scrolled', currentTop > 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initScrollEffects() {
    var bar = document.getElementById('reading-progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'reading-progress-bar';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
    }

    if (window.editorialScrollEffectsBound) {
      if (window.editorialScrollEffectsUpdate) window.editorialScrollEffectsUpdate();
      return;
    }

    window.editorialScrollEffectsBound = true;
    var ticking = false;
    var update = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var currentTop = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
        document.body.classList.toggle('nav-scrolled', currentTop > 0);

        var header = document.querySelector('#page-header.full_page');

        if (header && !prefersReducedMotion()) {
          header.style.setProperty('--hero-scroll-shift', Math.min(currentTop * 0.08, 34).toFixed(2) + 'px');
        }

        var article = document.getElementById('article-container');
        var isPost = !!document.getElementById('post');
        bar.hidden = !isPost;
        var articleTop = article ? article.getBoundingClientRect().top + currentTop : 0;
        var totalHeight = article ? article.offsetHeight - window.innerHeight : 0;
        var progress = totalHeight > 0 ? (currentTop - articleTop) / totalHeight : (currentTop >= articleTop ? 1 : 0);
        bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, progress)) + ')';
        ticking = false;
      });
    };

    window.editorialScrollEffectsUpdate = update;
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function initEditorialRail() {
    if (document.getElementById('editorial-rail')) return;
    var rail = document.createElement('div');
    rail.id = 'editorial-rail';
    rail.textContent = 'LI SHEN / FIELD NOTES';
    rail.setAttribute('aria-hidden', 'true');
    document.body.appendChild(rail);
  }

  function initLiveUptime() {
    var startDate = new Date('2026-08-26T00:00:00+08:00');
    var update = function () {
      var diff = Math.max(0, Date.now() - startDate.getTime());
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor(diff / 3600000 % 24);
      var minutes = Math.floor(diff / 60000 % 60);
      var seconds = Math.floor(diff / 1000 % 60);
      var value = days + ' 天 ' + hours + ' 时 ' + minutes + ' 分 ' + seconds + ' 秒';
      document.querySelectorAll('#aside-content .card-webinfo .webinfo-item').forEach(function (item) {
        if (item.textContent.indexOf('运行时间') === -1 && item.textContent.indexOf('runtime') === -1) return;
        var valueNode = item.querySelector('span:last-child') || item;
        valueNode.textContent = value;
      });
      var footerClock = document.getElementById('footer-runtime-clock');
      if (footerClock) footerClock.textContent = '稳定运行 ' + value;
    };
    window.clearInterval(window.editorialUptimeInterval);
    window.editorialUptimeInterval = window.setInterval(update, 1000);
    update();
  }

  function initMermaidInlineViewer() {
    if (window.editorialMermaidViewerBound) return;
    window.editorialMermaidViewerBound = true;

    var openViewer = function (wrap, trigger) {
      if (window.editorialMermaidViewerClose) window.editorialMermaidViewerClose();

      var source = wrap.__mermaidOriginalSvg || wrap.querySelector('svg');
      var svg = null;
      if (typeof source === 'string') {
        var template = document.createElement('template');
        template.innerHTML = source.trim();
        var parsedSvg = template.content.querySelector('svg');
        if (parsedSvg) svg = parsedSvg.cloneNode(true);
      } else if (source && typeof source.cloneNode === 'function') {
        svg = source.cloneNode(true);
      }
      if (!svg) return false;

      var initViewBox = wrap.__mermaidInitViewBox;
      if (initViewBox && initViewBox.length === 4) svg.setAttribute('viewBox', initViewBox.join(' '));
      if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('aria-hidden', 'true');

      var viewer = document.createElement('div');
      viewer.className = 'mermaid-viewer';
      viewer.tabIndex = -1;
      viewer.setAttribute('role', 'dialog');
      viewer.setAttribute('aria-modal', 'true');
      viewer.setAttribute('aria-label', '流程图放大查看');

      var panel = document.createElement('div');
      panel.className = 'mermaid-viewer-panel';

      var stage = document.createElement('div');
      stage.className = 'mermaid-viewer-stage';

      var canvas = document.createElement('div');
      canvas.className = 'mermaid-viewer-canvas';
      canvas.appendChild(svg);
      stage.appendChild(canvas);

      var closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'mermaid-viewer-close';
      closeButton.setAttribute('aria-label', '关闭流程图放大查看');
      closeButton.textContent = '×';

      var hint = document.createElement('div');
      hint.className = 'mermaid-viewer-hint';
      hint.textContent = '滚轮 / 双指缩放 · 拖动查看 · 双击还原';

      panel.appendChild(closeButton);
      panel.appendChild(stage);
      panel.appendChild(hint);
      viewer.appendChild(panel);
      document.body.appendChild(viewer);
      document.documentElement.classList.add('mermaid-viewer-open');

      var viewBoxParts = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      var hasViewBox = viewBoxParts.length === 4 && viewBoxParts.every(function (value) {
        return Number.isFinite(value);
      }) && viewBoxParts[2] > 0 && viewBoxParts[3] > 0;
      var aspectRatio = hasViewBox ? viewBoxParts[2] / viewBoxParts[3] : 16 / 9;
      var zoom = 1;
      var panX = 0;
      var panY = 0;
      var pointers = new Map();
      var lastPointer = null;
      var pinch = null;
      var closed = false;

      var applyTransform = function () {
        canvas.style.left = 'calc(50% + ' + panX + 'px)';
        canvas.style.top = 'calc(50% + ' + panY + 'px)';
        canvas.style.transform = 'translate(-50%, -50%) scale(' + zoom + ')';
      };

      var fitCanvas = function () {
        var rect = stage.getBoundingClientRect();
        var availableWidth = Math.max(120, rect.width - 32);
        var availableHeight = Math.max(80, rect.height - 32);
        var width = Math.min(availableWidth, availableHeight * aspectRatio);
        var height = width / aspectRatio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        applyTransform();
      };

      var stageCenter = function () {
        var rect = stage.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      };

      var setZoom = function (nextZoom, clientX, clientY) {
        var boundedZoom = Math.max(1, Math.min(8, nextZoom));
        if (clientX !== undefined && clientY !== undefined && zoom > 0) {
          // Keep the content point under the mouse or finger midpoint fixed while zooming.
          var center = stageCenter();
          var ratio = boundedZoom / zoom;
          var offsetX = clientX - center.x;
          var offsetY = clientY - center.y;
          panX = offsetX - (offsetX - panX) * ratio;
          panY = offsetY - (offsetY - panY) * ratio;
        }
        zoom = boundedZoom;
        applyTransform();
      };

      var resetView = function () {
        zoom = 1;
        panX = 0;
        panY = 0;
        applyTransform();
      };

      var getPointerPair = function () {
        return Array.from(pointers.values()).slice(0, 2);
      };

      var onPointerDown = function (event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        if (stage.setPointerCapture) stage.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        stage.classList.add('is-dragging');

        if (pointers.size === 1) {
          lastPointer = { x: event.clientX, y: event.clientY };
          pinch = null;
          return;
        }

        if (pointers.size === 2) {
          var pair = getPointerPair();
          var dx = pair[0].x - pair[1].x;
          var dy = pair[0].y - pair[1].y;
          var distance = Math.max(1, Math.hypot(dx, dy));
          var midpoint = { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 };
          var center = stageCenter();
          pinch = {
            distance: distance,
            zoom: zoom,
            localX: (midpoint.x - center.x - panX) / zoom,
            localY: (midpoint.y - center.y - panY) / zoom
          };
        }
      };

      var onPointerMove = function (event) {
        if (!pointers.has(event.pointerId)) return;
        event.preventDefault();
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (pointers.size === 2 && pinch) {
          var pair = getPointerPair();
          var dx = pair[0].x - pair[1].x;
          var dy = pair[0].y - pair[1].y;
          var distance = Math.max(1, Math.hypot(dx, dy));
          var midpoint = { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 };
          var center = stageCenter();
          zoom = Math.max(1, Math.min(8, pinch.zoom * distance / pinch.distance));
          panX = midpoint.x - center.x - pinch.localX * zoom;
          panY = midpoint.y - center.y - pinch.localY * zoom;
          applyTransform();
          return;
        }

        if (pointers.size === 1 && !pinch && lastPointer) {
          panX += event.clientX - lastPointer.x;
          panY += event.clientY - lastPointer.y;
          lastPointer = { x: event.clientX, y: event.clientY };
          applyTransform();
        }
      };

      var onPointerUp = function (event) {
        if (stage.releasePointerCapture && stage.hasPointerCapture && stage.hasPointerCapture(event.pointerId)) {
          stage.releasePointerCapture(event.pointerId);
        }
        pointers.delete(event.pointerId);
        if (pointers.size === 1) {
          pinch = null;
          var remaining = pointers.values().next().value;
          lastPointer = { x: remaining.x, y: remaining.y };
        } else if (pointers.size === 0) {
          pinch = null;
          lastPointer = null;
          stage.classList.remove('is-dragging');
        }
      };

      var onWheel = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var delta = event.deltaY;
        if (event.deltaMode === 1) delta *= 16;
        else if (event.deltaMode === 2) delta *= 400;
        setZoom(zoom * Math.exp(-delta * 0.001), event.clientX, event.clientY);
      };

      var close = function () {
        if (closed) return;
        closed = true;
        window.removeEventListener('resize', fitCanvas);
        document.documentElement.classList.remove('mermaid-viewer-open');
        if (window.editorialMermaidViewerClose === close) window.editorialMermaidViewerClose = null;
        viewer.remove();
        if (!document.contains(trigger)) return;
        try {
          trigger.focus({ preventScroll: true });
        } catch (error) {
          trigger.focus();
        }
      };

      stage.addEventListener('pointerdown', onPointerDown);
      stage.addEventListener('pointermove', onPointerMove);
      stage.addEventListener('pointerup', onPointerUp);
      stage.addEventListener('pointercancel', onPointerUp);
      stage.addEventListener('wheel', onWheel, { passive: false });
      stage.addEventListener('dblclick', function (event) {
        event.preventDefault();
        resetView();
      });
      closeButton.addEventListener('click', close);
      viewer.addEventListener('click', function (event) {
        if (event.target === viewer) close();
      });
      viewer.addEventListener('keydown', function (event) {
        if (event.key === 'Tab') {
          event.preventDefault();
          closeButton.focus();
        } else if (event.key === 'Escape') close();
        else if (event.key === '+' || event.key === '=') setZoom(zoom * 1.25);
        else if (event.key === '-') setZoom(zoom / 1.25);
        else if (event.key === '0') resetView();
      });
      window.addEventListener('resize', fitCanvas);
      window.editorialMermaidViewerClose = close;
      trigger.setAttribute('aria-label', '在当前页面放大流程图');
      fitCanvas();
      viewer.focus({ preventScroll: true });
      return true;
    };

    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('.mermaid-open-btn') : null;
      var wrap = button && button.closest ? button.closest('.mermaid-wrap') : null;
      if (!button || !wrap || !document.documentElement.contains(button)) return;
      if (!openViewer(wrap, button)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, true);

    document.addEventListener('pjax:send', function () {
      if (window.editorialMermaidViewerClose) window.editorialMermaidViewerClose();
    });
  }

  function initTableScroll() {
    document.querySelectorAll('#article-container table').forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains('editorial-table-scroll')) return;
      var wrapper = document.createElement('div');
      wrapper.className = 'editorial-table-scroll';
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', '表格，可左右滚动');
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function trapFocus(event, container) {
    if (event.key !== 'Tab') return;
    var controls = Array.from(container.querySelectorAll('button, input, a[href], [tabindex="0"]')).filter(function (el) {
      return el.getClientRects().length && !el.disabled && !el.closest('[inert]');
    });
    if (!controls.length) return;
    var first = controls[0];
    var last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  }

  function initMobileNavigation() {
    var menu = document.getElementById('sidebar-menus');
    var trigger = document.getElementById('toggle-menu');
    var mask = document.getElementById('menu-mask');
    if (!menu || !trigger || !mask) return;
    trigger.setAttribute('aria-controls', menu.id);
    trigger.setAttribute('aria-expanded', String(menu.classList.contains('open')));
    if (menu.dataset.editorialNavigation) return;
    menu.dataset.editorialNavigation = 'true';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', '网站导航');
    menu.setAttribute('aria-modal', 'true');
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'editorial-menu-close';
    close.setAttribute('aria-label', '关闭导航');
    close.innerHTML = '<span class="editorial-menu-close-icon" aria-hidden="true"><span></span><span></span></span><span class="editorial-menu-close-label">关闭导航</span><kbd aria-hidden="true">ESC</kbd>';
    menu.prepend(close);
    close.addEventListener('click', function () { mask.click(); });
    menu.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); mask.click(); }
      else trapFocus(event, menu);
    });
    var wasOpen = false;
    var background = [];
    var sync = function () {
      var open = menu.classList.contains('open');
      menu.inert = !open;
      menu.setAttribute('aria-hidden', String(!open));
      var currentTrigger = document.getElementById('toggle-menu');
      if (currentTrigger) {
        currentTrigger.setAttribute('aria-expanded', String(open));
        currentTrigger.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
      }
      if (open && !wasOpen) {
        background = Array.from(document.querySelectorAll('#body-wrap, #rightside')).map(function (element) {
          var state = { element: element, inert: element.inert };
          element.inert = true;
          return state;
        });
        close.focus({ preventScroll: true });
      } else if (!open && wasOpen) {
        background.forEach(function (state) { state.element.inert = state.inert; });
        background = [];
        if (currentTrigger && currentTrigger.getClientRects().length) currentTrigger.focus({ preventScroll: true });
      }
      wasOpen = open;
    };
    new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['class'] });
    sync();
  }

  function initContentNavigation() {
    var main = document.getElementById('content-inner');
    if (main && !document.getElementById('editorial-skip-link')) {
      var skip = document.createElement('a');
      skip.id = 'editorial-skip-link';
      skip.href = '#content-inner';
      skip.textContent = '跳到主要内容';
      document.body.prepend(skip);
      skip.addEventListener('click', function () {
        var target = document.getElementById('content-inner');
        if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
      });
    }
    // Authors may already number their headings; avoid displaying a second number.
    document.querySelectorAll('.toc-link').forEach(function (link) {
      var label = link.querySelector('.toc-text');
      var number = link.querySelector('.toc-number');
      if (label && number) number.hidden = /^\s*\d+[.、．]/.test(label.textContent);
    });
    var tags = document.querySelector('.page.type-tags .tag-cloud-list');
    if (!tags || document.getElementById('editorial-tag-filter')) return;
    var links = Array.from(tags.querySelectorAll('a'));
    var filter = document.createElement('div');
    filter.className = 'editorial-tag-tools';
    filter.innerHTML = '<label for="editorial-tag-filter">查找标签</label><div class="editorial-tag-input"><input id="editorial-tag-filter" type="search" placeholder="输入标签名称，例如 Markdown" autocomplete="off"><button type="button">清除</button></div><p role="status" aria-live="polite"></p>';
    tags.before(filter);
    var input = filter.querySelector('input');
    var clear = filter.querySelector('button');
    var status = filter.querySelector('[role="status"]');
    var update = function () {
      var query = input.value.trim().toLocaleLowerCase();
      var count = 0;
      links.forEach(function (link) {
        var match = link.textContent.toLocaleLowerCase().includes(query);
        link.hidden = !match;
        if (match) count += 1;
      });
      status.textContent = count ? '显示 ' + count + ' / ' + links.length + ' 个标签' : '没有匹配的标签，试试其他关键词或清除筛选。';
      clear.disabled = !input.value;
    };
    input.addEventListener('input', update);
    clear.addEventListener('click', function () { input.value = ''; update(); input.focus(); });
    update();
  }

  function initAccessibleControls() {
    [
      ['#search-button .search', '搜索文章'],
      ['#toggle-menu', '打开导航菜单']
    ].forEach(function (item) {
      var control = document.querySelector(item[0]);
      if (!control || control.dataset.editorialKeyboard) return;
      control.dataset.editorialKeyboard = 'true';
      control.setAttribute('role', 'button');
      control.setAttribute('aria-label', item[1]);
      control.tabIndex = 0;
      if (item[0].indexOf('#search-button') === 0) {
        control.setAttribute('aria-haspopup', 'dialog');
        control.setAttribute('aria-controls', 'local-search');
        control.setAttribute('aria-expanded', 'false');
      }
      control.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          control.click();
        }
      });
    });
    var dialog = document.querySelector('#local-search .search-dialog');
    if (!dialog || dialog.dataset.editorialKeyboard) return;
    dialog.dataset.editorialKeyboard = 'true';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', '搜索文章');
    var closeButton = dialog.querySelector('.search-close-button');
    if (closeButton) closeButton.setAttribute('aria-label', '关闭搜索');
    var input = dialog.querySelector('input');
    if (input) input.setAttribute('aria-label', '搜索关键词');
    // The theme closes with an animation; restore focus once it hides the dialog.
    var wasOpen = false;
    var syncSearchState = function () {
      var open = getComputedStyle(dialog).display !== 'none';
      var trigger = document.querySelector('#search-button .search');
      if (trigger) trigger.setAttribute('aria-expanded', String(open));
      if (wasOpen && !open) {
        if (trigger) trigger.focus({ preventScroll: true });
      }
      wasOpen = open;
    };
    new MutationObserver(syncSearchState).observe(dialog, { attributes: true, attributeFilter: ['style', 'class'] });
    syncSearchState();
    dialog.addEventListener('keydown', function (event) { trapFocus(event, dialog); });
    var stats = dialog.querySelector('#local-search-stats');
    if (stats) { stats.setAttribute('role', 'status'); stats.setAttribute('aria-live', 'polite'); }
    // Re-run a query entered while the search index was still downloading.
    if (!window.editorialSearchLoadedBound) {
      window.editorialSearchLoadedBound = true;
      window.addEventListener('search:loaded', function () {
        var field = document.querySelector('#local-search input');
        if (field && field.value.trim()) field.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
  }

  function enhanceDynamicContent(root) {
    if (!root || root.nodeType !== 1) return;
    var links = [];
    if (root.matches('a[target="_blank"]')) links.push(root);
    links = links.concat(Array.from(root.querySelectorAll('a[target="_blank"]')));
    links.forEach(function (link) {
      var rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      link.setAttribute('rel', Array.from(rel).join(' '));
    });

    var images = [];
    if (root.matches('.flink-list-item img')) images.push(root);
    images = images.concat(Array.from(root.querySelectorAll('.flink-list-item img')));
    images.forEach(function (image) {
      if (!image.hasAttribute('loading')) image.setAttribute('loading', 'lazy');
      if (!image.hasAttribute('decoding')) image.setAttribute('decoding', 'async');
    });
  }

  function initDynamicContentEnhancements() {
    enhanceDynamicContent(document.body);
    if (window.editorialContentObserver) return;
    window.editorialContentObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.from(mutation.addedNodes).forEach(enhanceDynamicContent);
      });
    });
    window.editorialContentObserver.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    initAccessibleControls();
    initMobileNavigation();
    initContentNavigation();
    initHeroElements();
    initHeroParticles();
    initDepthCards();
    initRecentPostCardLinks();
    initScrollReveal();
    initTocOffset();
    initMobileToc();
    initNavState();
    initScrollEffects();
    initEditorialRail();
    initLiveUptime();
    initMermaidInlineViewer();
    initTableScroll();
    initDynamicContentEnhancements();
  }

  document.addEventListener('pjax:send', function () {
    if (window.editorialRevealObserver) window.editorialRevealObserver.disconnect();
    if (particleCleanup) particleCleanup();
    if (depthCardCleanup) depthCardCleanup();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('pjax:complete', boot);
  window.addEventListener('pagehide', function () {
    if (depthCardCleanup) depthCardCleanup();
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      initHeroParticles();
      initDepthCards();
    }
  });
}());
