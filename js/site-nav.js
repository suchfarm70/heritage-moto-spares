/* Shared accessible navigation and small-screen catalog controls. */
(function () {
  function initSiteNavigation() {
    const header = document.querySelector('.site-header');
    const nav = document.querySelector('#primary-navigation');
    const toggle = document.querySelector('.nav-toggle');
    const dropdown = document.querySelector('.nav-dropdown details');

    if (header && nav && toggle) {
      const closeMenu = function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation');
      };

      toggle.addEventListener('click', function () {
        const isOpen = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      });

      nav.querySelectorAll('a').forEach(function (link) {
        const target = new URL(link.href, window.location.href);
        const current = new URL(window.location.href);
        const currentPath = current.pathname === '/' ? '/index.html' : current.pathname;
        if (target.pathname === currentPath && (!target.hash || target.hash === current.hash)) {
          link.setAttribute('aria-current', 'page');
          link.classList.add('active');
        }
        link.addEventListener('click', closeMenu);
      });

      if (dropdown) {
        const currentPath = window.location.pathname;
        const isBrandPage = currentPath.indexOf('/motorcycles/') !== -1;
        if (isBrandPage) {
          dropdown.classList.add('is-current');
          dropdown.querySelectorAll('.nav-dropdown-menu a').forEach(function (link) {
            if (new URL(link.href, window.location.href).pathname === currentPath) {
              link.setAttribute('aria-current', 'page');
              link.classList.add('active');
            }
          });
        }
        document.addEventListener('click', function (event) {
          if (!event.target.closest('.nav-dropdown')) dropdown.open = false;
        });
        header.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            dropdown.open = false;
            closeMenu();
          }
        });
      }

      window.addEventListener('resize', function () {
        if (window.innerWidth > 1020) closeMenu();
      });
    }

    const layout = document.querySelector('.marketplace-layout');
    const sidebar = document.querySelector('.marketplace-sidebar');
    if (layout && sidebar && !document.querySelector('.catalog-filter-toggle')) {
      const filterToggle = document.createElement('button');
      filterToggle.type = 'button';
      filterToggle.className = 'catalog-filter-toggle';
      filterToggle.setAttribute('aria-expanded', 'false');
      filterToggle.innerHTML = '<span>Refine the catalog</span><span aria-hidden="true">＋</span>';
      layout.insertBefore(filterToggle, sidebar);
      filterToggle.addEventListener('click', function () {
        const isOpen = sidebar.classList.toggle('is-open');
        filterToggle.setAttribute('aria-expanded', String(isOpen));
        filterToggle.innerHTML = '<span>' + (isOpen ? 'Hide catalog filters' : 'Refine the catalog') + '</span><span aria-hidden="true">' + (isOpen ? '−' : '＋') + '</span>';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteNavigation, { once: true });
  } else {
    initSiteNavigation();
  }
})();
