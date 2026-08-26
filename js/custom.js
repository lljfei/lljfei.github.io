// ==========================================================================
// 李神的小站 · 殿堂级交互与微动效引擎 (Interactive Aesthetics Engine)
// ==========================================================================

// 1. Toast 极光毛玻璃通知
function showToast(message) {
  let toast = document.getElementById('lishen-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'lishen-toast';
    toast.className = 'lishen-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981; margin-right: 8px;"></i>${message}`;
  toast.classList.add('show');
  
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// 2. Linear 级光斑跟随算法 (Spotlight Effect)
function initCardSpotlight() {
  const cards = document.querySelectorAll('.recent-post-item, #aside-content .card-widget, .bento-card, .flink-list-item, #post-copyright');
  cards.forEach(card => {
    if (card.dataset.spotlightInitialized) return;
    card.dataset.spotlightInitialized = 'true';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// 3. Hero 深空星尘粒子引擎 (Cosmic Dust Particle Canvas)
let particleAnimationId = null;
function initHeroParticles() {
  const header = document.getElementById('page-header');
  if (!header || !header.classList.contains('full_page')) {
    if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
    return;
  }

  let canvas = document.getElementById('hero-particle-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'hero-particle-canvas';
    header.insertBefore(canvas, header.firstChild);
  }

  const ctx = canvas.getContext('2d');
  let width = canvas.width = header.offsetWidth;
  let height = canvas.height = header.offsetHeight;

  const particles = [];
  const particleCount = Math.min(38, Math.floor(width / 25));

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.5 + 0.25,
      color: Math.random() > 0.5 ? '#818cf8' : (Math.random() > 0.5 ? '#38bdf8' : '#f472b6')
    });
  }

  let mouseX = -999;
  let mouseY = -999;
  header.addEventListener('mousemove', (e) => {
    const rect = header.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  header.addEventListener('mouseleave', () => {
    mouseX = -999;
    mouseY = -999;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    // 绘制粒子
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // 鼠标斥力交互
      if (mouseX > 0 && mouseY > 0) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();
    }

    // 粒子近距离连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#6366f1';
          ctx.globalAlpha = (1 - dist / 110) * 0.18;
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    particleAnimationId = requestAnimationFrame(render);
  }

  if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
  render();

  window.addEventListener('resize', () => {
    width = canvas.width = header.offsetWidth;
    height = canvas.height = header.offsetHeight;
  }, { passive: true });
}

// 4. Hero 徽标与行动按钮注入
function initHeroElements() {
  const siteInfo = document.getElementById('site-info');
  if (!siteInfo) return;

  if (!document.getElementById('hero-badge')) {
    const badge = document.createElement('div');
    badge.id = 'hero-badge';
    badge.className = 'hero-badge';
    badge.innerHTML = '<span class="hero-badge-dot"></span><span>LISHEN\'S DIGITAL GARDEN · EXPLORING TECH</span>';
    siteInfo.insertBefore(badge, siteInfo.firstChild);
  }

  if (!document.getElementById('hero-actions')) {
    const actions = document.createElement('div');
    actions.id = 'hero-actions';
    actions.className = 'hero-actions';
    actions.innerHTML = `
      <a href="#recent-posts" class="hero-btn hero-btn-primary" id="btn-explore-posts">
        <i class="fas fa-compass"></i> 探索博文
      </a>
      <a href="/about/" class="hero-btn hero-btn-glass">
        <i class="fas fa-user-astronaut"></i> 关于李神
      </a>
      <a href="https://github.com/lljfei" target="_blank" class="hero-btn hero-btn-glass">
        <i class="fab fa-github"></i> GitHub
      </a>
    `;
    siteInfo.appendChild(actions);

    const exploreBtn = document.getElementById('btn-explore-posts');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const recentPosts = document.getElementById('recent-posts');
        if (recentPosts) {
          recentPosts.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }
}

// 5. 实时秒级跳动建站计时器 (Live Uptime Clock)
function initLiveUptime() {
  const startDate = new Date('2026-08-26T00:00:00+08:00');
  const updateTimer = () => {
    const now = new Date();
    const diff = Math.max(0, now - startDate);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const timeStr = `${days} 天 ${hours} 时 ${minutes} 分 ${seconds} 秒`;

    // 更新侧边栏与页脚计时
    const webinfoItems = document.querySelectorAll('#aside-content .card-webinfo .webinfo-item');
    webinfoItems.forEach(item => {
      if (item.innerText.includes('运行时间') || item.innerText.includes('runtime')) {
        const valSpan = item.querySelector('span:last-child') || item;
        valSpan.innerHTML = `<span style="color: var(--primary-color); font-weight: 700;">${timeStr}</span>`;
      }
    });

    const footerClock = document.getElementById('footer-runtime-clock');
    if (footerClock) {
      footerClock.innerHTML = `已在数字化星空中稳定运行 <span style="color: var(--primary-color); font-weight: 700;">${timeStr}</span>`;
    }
  };

  clearInterval(window.uptimeInterval);
  window.uptimeInterval = setInterval(updateTimer, 1000);
  updateTimer();
}

// 6. 顶部极光阅读进度条
function initReadingProgress() {
  let progressBar = document.getElementById('reading-progress-bar');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'reading-progress-bar';
    document.body.appendChild(progressBar);
  }

  const updateProgress = () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) {
      progressBar.style.width = '0%';
      return;
    }
    const currentProgress = (window.pageYOffset / totalHeight) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, currentProgress))}%`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// 7. 代码复制监听与 Toast 触发
function initCodeCopyListener() {
  document.querySelectorAll('.copy-button').forEach(btn => {
    if (btn.dataset.toastBound) return;
    btn.dataset.toastBound = 'true';
    btn.addEventListener('click', () => {
      showToast('代码已成功复制到剪贴板 ✨');
    });
  });
}

// 全局启动与挂载
function boot() {
  initHeroElements();
  initHeroParticles();
  initCardSpotlight();
  initReadingProgress();
  initLiveUptime();
  initCodeCopyListener();
}

document.addEventListener('DOMContentLoaded', () => {
  boot();

  // 控制台极客徽章
  const brandStyle = 'color: #ffffff; background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 6px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);';
  const sloganStyle = 'color: #6366f1; font-size: 12px; font-weight: 600; padding: 4px 8px;';
  
  console.log('%c李神的小站 · 殿堂级旗舰版', brandStyle);
  console.log('%c“保持热爱，奔赴山海。探索前沿技术，构建智能未来。”', sloganStyle);
  console.log('%cGitHub: https://github.com/lljfei', 'color: #8b5cf6; font-size: 11px;');
});

// PJAX 页面切换无缝挂载
document.addEventListener('pjax:complete', boot);
