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
      document.body.classList.toggle('nav-scrolled', window.scrollY > 30);
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
        var currentTop = window.scrollY || document.documentElement.scrollTop || 0;
        document.body.classList.toggle('nav-scrolled', currentTop > 30);

        var header = document.querySelector('#page-header.full_page');
        // Keep the fixed home navigation on the dark surface until the hero leaves the viewport.
        if (header) {
          document.body.classList.toggle('nav-over-hero', currentTop > 30 && header.getBoundingClientRect().bottom > 0);
        } else {
          document.body.classList.remove('nav-over-hero');
        }

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
    initScrollReveal();
    initTocOffset();
    initNavState();
    initScrollEffects();
    initEditorialRail();
    initLiveUptime();
    initTableScroll();
  }

  document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('pjax:complete', boot);
}());
