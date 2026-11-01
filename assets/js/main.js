/* =========================================================
   Lumen 官网 — 交互脚本
   原生 JS，无依赖，全部离线可用（file:// 协议安全）
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. 主题切换（明 / 暗）
     --------------------------------------------------------- */
  var THEME_KEY = 'lumen-theme';
  var root = document.documentElement;

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f7f5fb' : '#08070d');
    var btn = $('#themeToggle');
    if (btn) btn.setAttribute('title', t === 'light' ? '切换到深色模式' : '切换到浅色模式');
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* file:// 下 localStorage 可能不可用 */ }
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
    } else {
      applyTheme('dark');
    }

    var btn = $('#themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      toast(next === 'light' ? '已切换到浅色模式' : '已切换到深色模式');
    });
  }

  /* ---------------------------------------------------------
     2. Toast 提示
     --------------------------------------------------------- */
  var toastEl = null;
  var toastTimer = null;

  function toast(msg, ms) {
    if (!toastEl) toastEl = $('#toast');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-show');
    }, ms || 2200);
  }

  /* ---------------------------------------------------------
     3. 导航：滚动吸顶 / 高亮 / 移动端菜单
     --------------------------------------------------------- */
  function initNav() {
    var nav = $('#nav');
    var dock = $('#dock');
    var progress = $('#navProgress');
    var links = $$('.nav__link');
    var sections = links.map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;

      if (nav) nav.classList.toggle('is-stuck', y > 24);

      // 顶部滚动进度条
      if (progress) {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var pct = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0;
        progress.style.width = pct + '%';
      }

      // 吸底下载条：滚动过 hero 后显示，接近底部下载区时隐藏
      if (dock) {
        var dlSection = $('#download');
        var past = y > window.innerHeight * 0.75;
        var inDl = false;
        if (dlSection) {
          var r = dlSection.getBoundingClientRect();
          inDl = r.top < window.innerHeight * 0.85 && r.bottom > window.innerHeight * 0.2;
        }
        dock.classList.toggle('is-visible', past && !inDl);
      }

      // 当前区块高亮
      var current = null;
      for (var i = 0; i < sections.length; i++) {
        var rect = sections[i].getBoundingClientRect();
        if (rect.top <= 140 && rect.bottom > 140) { current = sections[i].id; break; }
      }
      links.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
      });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { onScroll(); ticking = false; });
    }, { passive: true });
    onScroll();

    // 移动端菜单
    var burger = $('#burger');
    var navLinks = $('#navLinks');
    if (burger && navLinks) {
      burger.addEventListener('click', function () {
        var open = navLinks.classList.toggle('is-open');
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
      });
      navLinks.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          navLinks.classList.remove('is-open');
          burger.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* ---------------------------------------------------------
     4. 滚动揭示动画
     --------------------------------------------------------- */
  function initReveal() {
    var els = $$('.reveal');
    if (!els.length) return;

    function showAll() {
      els.forEach(function (el) { el.classList.add('is-in'); });
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) {
          return c.classList && c.classList.contains('reveal');
        });
        var idx = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(idx * 70, 420) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });

    // 保险丝：无论 IO 是否触发，3.5 秒后全部显示，页面永远不会空着
    setTimeout(showAll, 3500);
  }

  /* ---------------------------------------------------------
     5. 数字滚动
     --------------------------------------------------------- */
  function initCounters() {
    var els = $$('[data-count]');
    if (!els.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }

      var dur = 1400;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      els.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     6. 下载标签页
     --------------------------------------------------------- */
  function initTabs() {
    var tabs = $$('.dl-tab');
    var panels = $$('.dl-panel');
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        panels.forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-panel') === key);
        });
      });
    });
  }

  /* ---------------------------------------------------------
     7. 复制 SHA-256（file:// 下 Clipboard API 常被禁用，退回 execCommand）
     --------------------------------------------------------- */
  function initCopy() {
    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var label = btn.getAttribute('data-copy-label') || '已复制';
        var original = btn.textContent;

        function done(ok) {
          btn.textContent = ok ? '✓ 已复制到剪贴板' : '复制失败，请手动选择';
          toast(ok ? label + ' 已复制到剪贴板' : '当前环境不允许自动复制，请手动选取');
          setTimeout(function () { btn.textContent = original; }, 2200);
        }

        if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(); });
        } else {
          fallback();
        }

        function fallback() {
          try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '-1000px';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, text.length);
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            done(ok);
          } catch (e) {
            done(false);
          }
        }
      });
    });
  }

  /* ---------------------------------------------------------
     8. 下载反馈（点击下载按钮时给出提示）
     --------------------------------------------------------- */
  function initDownloadFeedback() {
    var NAMES = {
      installer: 'Lumen-0.2.0-win32-x64-setup.exe',
      portable: 'Lumen-0.2.0-win32-x64.zip'
    };
    $$('[data-dl]').forEach(function (a) {
      a.addEventListener('click', function () {
        var kind = a.getAttribute('data-dl');
        var name = NAMES[kind] || '文件';
        toast('开始下载 ' + name + ' …');
      });
    });
  }

  /* ---------------------------------------------------------
     9. 粒子背景
     --------------------------------------------------------- */
  function initParticles() {
    var canvas = $('#particles');
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, particles = [];

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.min(Math.floor((w * h) / 22000), 90);
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          r: Math.random() * 1.7 + 0.5,
          a: Math.random() * 0.4 + 0.12,
          hue: 40 + Math.random() * 220
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ', 88%, 68%, ' + p.a + ')';
        ctx.fill();
      }

      // 连线
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var a = particles[i], b = particles[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 15000) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'hsla(45, 90%, 70%, ' + (0.11 * (1 - d2 / 15000)) + ')';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      window.requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', function () {
      clearTimeout(canvas._t);
      canvas._t = setTimeout(resize, 180);
    });
    draw();
  }

  /* ---------------------------------------------------------
     10. 便携版体积显示
     --------------------------------------------------------- */
  function initPortableSize() {
    var el = $('#portableSize');
    if (!el) return;
    el.textContent = '142.4';
    el.title = '压缩包体积约 142.4 MB，解压后约 339 MB';
  }

  /* ---------------------------------------------------------
     11. 下载链接改写
         - file:// 打开：保持 ./downloads/ 相对路径，整包可离线使用
         - http(s) 打开：改写为 GitHub Release 资产直链
           （大体积安装包 / 便携版不进 Git 仓库，只作为 Release 资产）
     --------------------------------------------------------- */
  var RELEASE_BASE = 'https://github.com/Lume-MC/Lumen/releases/download/v0.2.0/';

  function initReleaseLinks() {
    var online = /^https?:$/.test(location.protocol);
    if (!online) return;

    $$('[data-rel]').forEach(function (a) {
      var file = a.getAttribute('data-rel');
      if (!file) return;
      a.setAttribute('href', RELEASE_BASE + file);
    });

    var folder = $('[data-rel-folder]');
    if (folder) {
      folder.setAttribute('href', 'https://github.com/Lume-MC/Lumen/releases/tag/v0.2.0');
    }
  }

  /* ---------------------------------------------------------
     12. 下载目录链接（仅 file:// 场景）：
         转换为 file:// 绝对路径，
         这样整个站点文件夹被移动到别处后链接依然有效。
     --------------------------------------------------------- */
  function initDownloadsFolderLink() {
    var a = $('#openDownloads');
    if (!a) return;
    if (/^https?:$/.test(location.protocol)) return;
    try {
      var base = location.href.replace(/[?#].*$/, '').replace(/[^/]+$/, '');
      a.setAttribute('href', base + 'downloads/');
    } catch (e) { /* keep relative href as fallback */ }
  }

  /* ---------------------------------------------------------
     启动
     --------------------------------------------------------- */
  function boot() {
    initTheme();
    initNav();
    initReveal();
    initCounters();
    initTabs();
    initCopy();
    initDownloadFeedback();
    initParticles();
    initPortableSize();
    initReleaseLinks();
    initDownloadsFolderLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
