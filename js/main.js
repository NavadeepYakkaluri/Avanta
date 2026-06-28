(function () {

  /* ===== Cart Utilities (localStorage) ===== */
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('avanta_cart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('avanta_cart', JSON.stringify(cart));
  }

  function getCartCount() {
    return getCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function addToCart(name, price) {
    var cart = getCart();
    var existing = cart.find(function (i) { return i.name === name; });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name: name, price: price, qty: 1 });
    }
    saveCart(cart);
    updateCartBadge();
  }

  function updateCartBadge() {
    var badge = document.getElementById('cart-badge');
    if (!badge) return;
    var count = getCartCount();
    badge.textContent = count;
    if (count > 0) {
      badge.classList.add('has-items');
    } else {
      badge.classList.remove('has-items');
    }
  }

  /* ===== Mobile Menu ===== */
  function initMobileMenu() {
    var menuBtn = document.querySelector('.mobile-menu-btn');
    var nav = document.querySelector('.navbar-nav');
    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      menuBtn.textContent = isOpen ? '✕' : '☰';
      menuBtn.setAttribute('aria-expanded', isOpen);
    });

    nav.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        menuBtn.textContent = '☰';
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ===== Active Nav Link ===== */
  function setActiveNavLink() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  /* ===== Toast ===== */
  function showToast(title, message) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML =
      '<div class="toast-title">' + title + '</div>' +
      '<div class="toast-message">' + message + '</div>';
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3500);
  }

  /* ===== Forms ===== */
  function initForms() {
    document.querySelectorAll('form[data-toast]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var title = form.dataset.toastTitle || 'Success!';
        var message = form.dataset.toast || 'Your request has been submitted.';
        showToast(title, message);
        form.reset();
      });
    });
  }

  /* ===== Add to Cart Buttons ===== */
  function initAddToCart() {
    document.querySelectorAll('[data-add-cart]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.dataset.addCart;
        var priceEl = btn.closest('.product-footer') && btn.closest('.product-footer').querySelector('.product-price');
        var priceText = priceEl ? priceEl.textContent.replace(/[^\d]/g, '') : '0';
        var price = parseInt(priceText, 10) || 0;
        addToCart(name, price);
        showToast('Added to cart! 🛒', name + ' has been added to your cart.');
      });
    });
  }

  /* ===== Init ===== */
  function init() {
    initMobileMenu();
    setActiveNavLink();
    initForms();
    initAddToCart();
    updateCartBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose to cart page */
  window.avantaCart = { getCart: getCart, saveCart: saveCart, updateCartBadge: updateCartBadge };
})();
