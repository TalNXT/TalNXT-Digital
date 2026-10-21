/* Cookie consent + Google Analytics loader.
   Does NOTHING unless window.TALNXT.gaId is set in js/config.js (no ID = no analytics = no banner).
   Analytics is only loaded after the visitor clicks "Accept". Choice is remembered in localStorage.
   Any element with [data-cookie-settings] re-opens the banner. */
(function () {
  var GA_ID = (window.TALNXT && window.TALNXT.gaId) || '';
  if (!GA_ID) return;
  var KEY = 'tn_cookie_consent';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var loaded = false;
  function enable() {
    window['ga-disable-' + GA_ID] = false;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (loaded) return; loaded = true;
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(s);
    gtag('js', new Date()); gtag('config', GA_ID, { anonymize_ip: true });
  }
  function disable() {
    window['ga-disable-' + GA_ID] = true;
    gtag('consent', 'update', { analytics_storage: 'denied' });
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n === '_ga' || n.indexOf('_ga_') === 0 || n === '_gid' || n === '_gat') {
        [location.hostname, '.' + location.hostname, ''].forEach(function (d) {
          document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }
  var choice = read();
  if (choice === 'granted') enable(); else if (choice === 'denied') disable();

  var banner;
  function build() {
    if (banner) return banner;
    var st = document.createElement('style');
    st.textContent = '#tn-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:var(--z-cookie,500);max-width:760px;margin:0 auto;background:#fff;color:var(--ink,#14203a);border:1px solid var(--line,#dbe1ea);border-radius:12px;box-shadow:0 10px 40px rgba(10,18,36,.22);padding:16px 18px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;font-size:13.5px;line-height:1.5}#tn-cookie[hidden]{display:none}#tn-cookie p{margin:0;flex:1 1 320px}#tn-cookie strong{display:block;font-size:14.5px;margin-bottom:2px}#tn-cookie .tn-btns{display:flex;gap:10px}#tn-cookie button{font:inherit;font-weight:700;border-radius:6px;padding:10px 18px;cursor:pointer;border:1.5px solid var(--accent,#1b5fc4)}#tn-cookie .tn-accept{background:var(--accent,#1b5fc4);color:#fff}#tn-cookie .tn-decline{background:#fff;color:var(--accent,#1b5fc4)}@media(max-width:520px){#tn-cookie .tn-btns{width:100%}#tn-cookie button{flex:1}}';
    document.head.appendChild(st);
    banner = document.createElement('div'); banner.id = 'tn-cookie'; banner.hidden = true;
    banner.setAttribute('role', 'dialog'); banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = '<p><strong>Cookies &amp; analytics</strong>We use Google Analytics cookies to understand how visitors use this site. Analytics only runs if you accept. We do not use advertising cookies.</p><div class="tn-btns"><button type="button" class="tn-decline">Decline</button><button type="button" class="tn-accept">Accept analytics</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('.tn-accept').addEventListener('click', function () { save('granted'); enable(); banner.hidden = true; });
    banner.querySelector('.tn-decline').addEventListener('click', function () { save('denied'); disable(); banner.hidden = true; });
    return banner;
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (!read()) build().hidden = false;
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-cookie-settings]')) build().hidden = false; });
  });
})();
