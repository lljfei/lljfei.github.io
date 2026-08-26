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

  function showToast(message) {
    var toast = document.getElementById('lishen-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lishen-toast';
      toast.className = 'lishen-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = '<i class="fas fa-check-circle" aria-hidden="true"></i><span></span>';
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    window.clearTimeout(window.editorialToastTimer);
    window.editorialToastTimer = window.setTimeout(function () {
      toast.classList.remove('show');
    }, 2200);
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
    var mouseX = -1000;
    var mouseY = -1000;
    var points = [];
    var palette = ['#e5b75e', '#e06a51', '#75aa91'];

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = header.clientWidth;
      height = header.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      density = Math.min(46, Math.max(24, Math.floor(width / 34)));
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

    function move(event) {
      var rect = header.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
    }

    function leave() {
      mouseX = -1000;
      mouseY = -1000;
    }

    function render() {
      ctx.clearRect(0, 0, width, height);
      if (!document.hidden) {
        points.forEach(function (point) {
          var dx = point.x - mouseX;
          var dy = point.y - mouseY;
          var distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 0 && distance < 120) {
            var force = (120 - distance) / 120;
            point.x += (dx / distance) * force * 0.8;
            point.y += (dy / distance) * force * 0.8;
          }

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
          ctx.shadowBlur = 10;
          ctx.shadowColor = point.color;
          ctx.fill();
        });

        for (var i = 0; i < points.length; i += 1) {
          for (var j = i + 1; j < points.length; j += 1) {
            var xDistance = points[i].x - points[j].x;
            var yDistance = points[i].y - points[j].y;
            var lineDistance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
            if (lineDistance < 125) {
              ctx.beginPath();
              ctx.moveTo(points[i].x, points[i].y);
              ctx.lineTo(points[j].x, points[j].y);
              ctx.globalAlpha = (1 - lineDistance / 125) * 0.18;
              ctx.strokeStyle = '#d8a44e';
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      particleFrame = window.requestAnimationFrame(render);
    }

    var resizeObserver = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (resizeObserver) resizeObserver.observe(header);
    window.addEventListener('resize', resize, { passive: true });
    header.addEventListener('pointermove', move, { passive: true });
    header.addEventListener('pointerleave', leave, { passive: true });
    resize();
    render();

    particleCleanup = function () {
      if (particleFrame) window.cancelAnimationFrame(particleFrame);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      header.removeEventListener('pointermove', move);
      header.removeEventListener('pointerleave', leave);
      canvas.remove();
      delete header.dataset.editorialParticles;
      particleFrame = null;
      particleCleanup = null;
    };
  }

  function initCardSpotlight() {
    if (!supportsFinePointer()) return;
    var cards = document.querySelectorAll('.recent-post-item, #aside-content .card-widget, .editorial-panel, .flink-list-item');
    cards.forEach(function (card) {
      if (card.dataset.editorialSpotlight === 'true') return;
      card.dataset.editorialSpotlight = 'true';
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', event.clientX - rect.left + 'px');
        card.style.setProperty('--mouse-y', event.clientY - rect.top + 'px');
      }, { passive: true });
    });
  }

  function initHeroPointer() {
    var header = document.querySelector('#page-header.full_page');
    if (!header || !supportsFinePointer()) return;
    if (header.dataset.editorialPointer === 'true') return;
    header.dataset.editorialPointer = 'true';

    header.addEventListener('pointermove', function (event) {
      var rect = header.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
      var y = ((event.clientY - rect.top) / rect.height - 0.5) * 20;
      header.style.setProperty('--hero-pointer-x', x.toFixed(2) + 'px');
      header.style.setProperty('--hero-pointer-y', y.toFixed(2) + 'px');
      header.style.setProperty('--hero-grid-x', (x * -0.24).toFixed(2) + 'px');
      header.style.setProperty('--hero-grid-y', (y * -0.24).toFixed(2) + 'px');
    }, { passive: true });
    header.addEventListener('pointerleave', function () {
      header.style.setProperty('--hero-pointer-x', '0px');
      header.style.setProperty('--hero-pointer-y', '0px');
      header.style.setProperty('--hero-grid-x', '0px');
      header.style.setProperty('--hero-grid-y', '0px');
    }, { passive: true });
  }

  function initCursorAura() {
    if (prefersReducedMotion() || !supportsFinePointer() || window.editorialCursorBound) return;
    var aura = document.createElement('div');
    aura.className = 'cursor-aura';
    aura.setAttribute('aria-hidden', 'true');
    document.body.appendChild(aura);
    window.editorialCursorBound = true;

    var frame = null;
    var x = -100;
    var y = -100;
    var nextX = -100;
    var nextY = -100;
    document.addEventListener('pointermove', function (event) {
      nextX = event.clientX;
      nextY = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        x += (nextX - x) * 0.24;
        y += (nextY - y) * 0.24;
        aura.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
        frame = null;
      });
      document.body.style.setProperty('--pointer-x', (event.clientX / window.innerWidth * 100).toFixed(2) + '%');
      document.body.style.setProperty('--pointer-y', (event.clientY / window.innerHeight * 100).toFixed(2) + '%');
    }, { passive: true });
    document.addEventListener('pointerover', function (event) {
      if (event.target.closest && event.target.closest('a, button, input, select, textarea')) {
        document.body.classList.add('cursor-hover');
      }
    }, { passive: true });
    document.addEventListener('pointerout', function (event) {
      if (event.target.closest && event.target.closest('a, button, input, select, textarea')) {
        document.body.classList.remove('cursor-hover');
      }
    }, { passive: true });
    document.body.classList.add('cursor-ready');
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
      window.editorialRevealObserver.observe(target);
    });
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

  function initHeroParallax() {
    if (prefersReducedMotion() || window.editorialParallaxBound) return;
    window.editorialParallaxBound = true;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var header = document.querySelector('#page-header.full_page');
        if (header) header.style.setProperty('--hero-scroll-shift', Math.min(window.scrollY * 0.08, 34).toFixed(2) + 'px');
        ticking = false;
      });
    }, { passive: true });
  }

  function initReadingProgress() {
    var bar = document.getElementById('reading-progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'reading-progress-bar';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
    }
    if (window.editorialProgressBound) return;
    window.editorialProgressBound = true;
    var update = function () {
      var totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = totalHeight > 0 ? window.scrollY / totalHeight * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    };
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

  function initCodeCopyListener() {
    document.querySelectorAll('.copy-button').forEach(function (button) {
      if (button.dataset.editorialToast === 'true') return;
      button.dataset.editorialToast = 'true';
      button.addEventListener('click', function () {
        showToast('代码已复制到剪贴板');
      });
    });
  }

  function boot() {
    initHeroElements();
    initHeroParticles();
    initHeroPointer();
    initCardSpotlight();
    initCursorAura();
    initScrollReveal();
    initNavState();
    initHeroParallax();
    initReadingProgress();
    initEditorialRail();
    initLiveUptime();
    initTableScroll();
    initCodeCopyListener();
  }

  document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('pjax:complete', boot);
}());
