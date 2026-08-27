// Lishen Editorial Observatory: interaction layer for the restored Hexo base.
(function () {
  'use strict';

  var particleFrame = null;
  var particleCleanup = null;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function supportsFinePointer() {
    return window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
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
      var postCount = document.querySelectorAll('#recent-posts .recent-post-item').length;
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

  function initHeroParticles() {
    var header = document.querySelector('#page-header.full_page');
    if (!header || prefersReducedMotion() || !supportsFinePointer()) {
      if (particleCleanup) particleCleanup();
      return;
    }

    if (header.dataset.editorialParticles === 'true') return;
    if (particleCleanup) particleCleanup();

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.id = 'hero-particle-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    header.insertBefore(canvas, header.firstChild);
    header.dataset.editorialParticles = 'true';

    var width = 0;
    var height = 0;
    var density = 0;
    var points = [];
    var palette = ['#e5b75e', '#e06a51', '#75aa91'];
    var isVisible = false;
    var isRunning = false;
    var visibilityObserver = null;

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = header.clientWidth;
      height = header.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      density = Math.min(32, Math.max(16, Math.floor(width / 58)));
      points = Array.from({ length: density }, function () {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          radius: Math.random() * 1.45 + 0.65,
          alpha: Math.random() * 0.42 + 0.18,
          color: palette[Math.floor(Math.random() * palette.length)]
        };
      });
    }

    function render() {
      if (!isRunning) {
        particleFrame = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);
      points.forEach(function (point) {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < -10) point.x = width + 10;
        if (point.x > width + 10) point.x = -10;
        if (point.y < -10) point.y = height + 10;
        if (point.y > height + 10) point.y = -10;

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.globalAlpha = point.alpha;
        ctx.fillStyle = point.color;
        ctx.fill();
      });

      var maxLineDistance = 112;
      var maxLineDistanceSquared = maxLineDistance * maxLineDistance;
      for (var i = 0; i < points.length; i += 1) {
        for (var j = i + 1; j < points.length; j += 1) {
          var xDistance = points[i].x - points[j].x;
          var yDistance = points[i].y - points[j].y;
          var lineDistanceSquared = xDistance * xDistance + yDistance * yDistance;
          if (lineDistanceSquared < maxLineDistanceSquared) {
            var lineDistance = Math.sqrt(lineDistanceSquared);
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.globalAlpha = (1 - lineDistance / maxLineDistance) * 0.16;
            ctx.strokeStyle = '#d8a44e';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      particleFrame = window.requestAnimationFrame(render);
    }

    function start() {
      if (isRunning || !isVisible || document.hidden) return;
      isRunning = true;
      particleFrame = window.requestAnimationFrame(render);
    }

    function stop() {
      isRunning = false;
      if (particleFrame) window.cancelAnimationFrame(particleFrame);
      particleFrame = null;
    }

    function updateVisibility() {
      if (isVisible && !document.hidden) start();
      else stop();
    }

    var resizeObserver = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (resizeObserver) resizeObserver.observe(header);
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', updateVisibility);
    if (window.IntersectionObserver) {
      visibilityObserver = new IntersectionObserver(function (entries) {
        isVisible = entries.some(function (entry) { return entry.isIntersecting; });
        updateVisibility();
      }, { rootMargin: '120px 0px', threshold: 0 });
      visibilityObserver.observe(header);
    } else {
      isVisible = true;
    }
    resize();
    updateVisibility();

    particleCleanup = function () {
      stop();
      if (resizeObserver) resizeObserver.disconnect();
      if (visibilityObserver) visibilityObserver.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', updateVisibility);
      canvas.remove();
      delete header.dataset.editorialParticles;
      particleFrame = null;
      particleCleanup = null;
    };
  }

  function initRecentPostCardLinks() {
    var recentPosts = document.getElementById('recent-posts');
    if (!recentPosts || recentPosts.dataset.editorialCardLinks === 'true') return;
    recentPosts.dataset.editorialCardLinks = 'true';

    recentPosts.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0) return;

      var card = event.target.closest ? event.target.closest('.recent-post-item') : null;
      if (!card || !recentPosts.contains(card) || card.classList.contains('ads-wrap')) return;
      if (event.target.closest('a, button, input, textarea, select, summary')) return;

      var titleLink = card.querySelector('.article-title');
      if (titleLink) titleLink.click();
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
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
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

  function initNavState() {
    var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('#nav .menus_item > a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      var linkPath;
      try {
        linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
      } catch (error) {
        return;
      }
      link.classList.toggle('is-current', linkPath === currentPath || (linkPath !== '/' && currentPath.indexOf(linkPath + '/') === 0));
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

        var totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        var progress = totalHeight > 0 ? currentTop / totalHeight : 0;
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
        if (event.key === 'Escape') close();
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
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function boot() {
    initHeroElements();
    initHeroParticles();
    initRecentPostCardLinks();
    initScrollReveal();
    initTocOffset();
    initNavState();
    initScrollEffects();
    initEditorialRail();
    initLiveUptime();
    initMermaidInlineViewer();
    initTableScroll();
  }

  document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('pjax:complete', boot);
}());
