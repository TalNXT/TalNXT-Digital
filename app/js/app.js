/* TalNXT Digital Console: shell + hash router. */
(function () {
  'use strict';
  var V = TND.views, root, current = null;
  var ROUTES = { dashboard: V.dashboard, projects: V.projects, enquiries: V.enquiries, settings: V.settings };

  function route() {
    var name = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?')[0];
    if (!ROUTES[name]) name = 'dashboard';
    render(name, true);
  }
  function render(name, moveFocus) {
    current = name; var view = ROUTES[name];
    root.innerHTML = view.render();
    view.mount(root, function () { render(name, false); });
    document.title = view.title + ' | TalNXT Digital Console';
    document.querySelectorAll('.side-link').forEach(function (a) {
      var on = a.getAttribute('data-route') === name; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    closeDrawer();
    if (moveFocus) { var h = root.querySelector('#view-title'); if (h) h.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  }

  var shell, toggle;
  function setDrawer(open) { shell.classList.toggle('drawer-open', open); toggle.setAttribute('aria-expanded', String(open)); }
  function closeDrawer() { if (shell) setDrawer(false); }

  document.addEventListener('DOMContentLoaded', function () {
    root = document.getElementById('view'); shell = document.querySelector('.app-shell'); toggle = document.querySelector('.menu-btn');
    toggle.addEventListener('click', function () { setDrawer(!shell.classList.contains('drawer-open')); });
    document.querySelector('.backdrop').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    window.addEventListener('hashchange', route);
    route();
  });
})();
