(function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initPageLoader() {
    if (prefersReduced) return;

    var loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML =
      '<div class="loader-logo">🌿 Avanta</div>' +
      '<div class="loader-spinner"></div>';
    document.body.prepend(loader);

    window.addEventListener('load', function () {
      setTimeout(function () {
        loader.classList.add('done');
        setTimeout(function () { loader.remove(); }, 700);
      }, 400);
    });
  }

  function initNavbarScroll() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    function onScroll() {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initScrollReveal() {
    if (prefersReduced) {
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    var selectors = [
      '.section-header',
      '.product-card',
      '.feature-item',
      '.value-card',
      '.order-card',
      '.contact-info-card',
      '.form-card',
      '.auth-card',
      '.about-grid > div',
      '.cta-banner',
      '.page-header .container > *'
    ];

    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        if (el.closest('.hero')) return;
        el.classList.add('reveal');
        if (i % 6 < 6) el.classList.add('reveal-delay-' + ((i % 6) + 1));
      });
    });

    var heroContent = document.querySelector('.hero-content');
    if (heroContent) heroContent.classList.add('reveal-left');
    var heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) heroVisual.classList.add('reveal-right');

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function (el) {
      observer.observe(el);
    });
  }

  function initRipple() {
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.classList.add('btn-shimmer');
      btn.addEventListener('click', function (e) {
        if (prefersReduced) return;
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'ripple';
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 600);
      });
    });
  }

  function initCardTilt() {
    if (prefersReduced || window.innerWidth < 768) return;

    document.querySelectorAll('.product-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          'perspective(800px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-8px) scale(1.02)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  function initHeroParallax() {
    if (prefersReduced || window.innerWidth < 992) return;

    var hero = document.querySelector('.hero');
    var blobs = document.querySelectorAll('.hero-blob');
    if (!hero || !blobs.length) return;

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      blobs.forEach(function (blob, i) {
        var factor = (i + 1) * 18;
        blob.style.transform = 'translate(' + (x * factor) + 'px, ' + (y * factor) + 'px)';
      });
    });
  }

  function initAddToCartEffect() {
    document.querySelectorAll('[data-add-cart]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.add('btn-add-pulse');
        setTimeout(function () { btn.classList.remove('btn-add-pulse'); }, 400);
      });
    });
  }

  function initSmoothAnchor() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  function init() {
    initPageLoader();
    initNavbarScroll();
    initScrollReveal();
    initRipple();
    initCardTilt();
    initHeroParallax();
    initAddToCartEffect();
    initSmoothAnchor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
