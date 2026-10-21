/* TalNXT Digital: shared site behaviour (nav, config values, contact form). No dependencies. */
(function () {
  'use strict';
  var cfg = window.TALNXT || {};
  var BREAKPOINT = 1180;   // must match the hamburger breakpoint in components.css

  document.addEventListener('DOMContentLoaded', function () {
    // footer year
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    // config-driven contact details; hide anything not configured
    document.querySelectorAll('[data-cfg="email"]').forEach(function (el) {
      if (!cfg.email) { el.hidden = true; return; }
      if (el.tagName === 'A') el.href = 'mailto:' + cfg.email;
      if (el.hasAttribute('data-cfg-text')) el.textContent = cfg.email;
    });
    document.querySelectorAll('[data-cfg="phone"]').forEach(function (el) {
      if (!cfg.phone) { el.hidden = true; return; }
      if (el.tagName === 'A') el.href = 'tel:' + cfg.phone.replace(/[^+\d]/g, '');
      if (el.hasAttribute('data-cfg-text')) el.textContent = cfg.phone;
    });

    // mark the current page in the nav
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-links a[href]').forEach(function (a) {
      var target = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
      if (target && target === here) { var li = a.closest('li'); if (li) li.classList.add('active'); }
    });

    // mobile drawer
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    function setOpen(open) {
      if (!toggle || !links) return;
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    }
    if (toggle && links) {
      toggle.addEventListener('click', function () { setOpen(!links.classList.contains('open')); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
      window.addEventListener('resize', function () { if (window.innerWidth > BREAKPOINT) setOpen(false); });
      links.addEventListener('click', function (e) {
        var a = e.target.closest('a');
        if (a && !a.closest('li.has-dropdown > a') && window.innerWidth <= BREAKPOINT) setOpen(false);
      });
    }
    // tap-to-open dropdown on touch / small screens (hover does not exist there)
    document.querySelectorAll('.nav-links > li.has-dropdown > a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.innerWidth <= BREAKPOINT) { e.preventDefault(); a.parentElement.classList.toggle('open'); }
      });
    });

    // contact form: validates, then opens the visitor's email app with the message filled in.
    // (A static site has no server to receive it. See README to swap in a form service.)
    var form = document.querySelector('[data-contact-form]');
    if (form) {
      var status = form.querySelector('.form-status');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true, data = {};
        form.querySelectorAll('.field').forEach(function (f) {
          var input = f.querySelector('input, select, textarea'); if (!input) return;
          var v = input.value.trim(); data[input.name] = v;
          var bad = (input.required && !v) || (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
          f.classList.toggle('invalid', !!bad);
          input.setAttribute('aria-invalid', bad ? 'true' : 'false');
          if (bad) ok = false;
        });
        if (!ok) { status.className = 'form-status err'; status.textContent = 'Please fix the highlighted fields.'; return; }
        var subject = 'Enquiry from ' + data.name + (data.company ? ' (' + data.company + ')' : '');
        var body = 'Name: ' + data.name + '\nEmail: ' + data.email + '\nCompany: ' + (data.company || '-') +
                   '\nCloud platform: ' + (data.platform || '-') +
                   '\nInterested in: ' + (data.interest || '-') + '\n\n' + data.message;
        window.location.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        status.className = 'form-status ok';
        status.textContent = 'Your email app should open with the message ready to send. If it does not, write to ' + cfg.email + '.';
      });
    }
  });
})();

/* zero-cost assessment dialog + form (opens the visitor's email app, same destination as the contact form) */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var dlg=document.getElementById('assess-dialog'); if(!dlg) return;
    var cfg=window.TALNXT||{}, form=dlg.querySelector('[data-assess-form]'), status=form.querySelector('.form-status');
    var opener=null;
    function open(el){ opener=el; if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open',''); var f=dlg.querySelector('input'); if(f) f.focus(); }
    document.querySelectorAll('[data-assess-open]').forEach(function(b){ b.addEventListener('click', function(){ open(b); }); });
    dlg.querySelector('[data-assess-close]').addEventListener('click', function(){ dlg.close ? dlg.close() : dlg.removeAttribute('open'); if(opener) opener.focus(); });
    dlg.addEventListener('click', function(e){ if(e.target===dlg){ dlg.close(); } });
    if (location.hash==='#assessment-form') open(null);
    form.addEventListener('submit', function(e){
      e.preventDefault(); var ok=true, d={};
      form.querySelectorAll('.field').forEach(function(f){ var i=f.querySelector('input,select,textarea'); if(!i) return; var v=i.value.trim(); d[i.name]=v;
        var bad=(i.required&&!v)||(i.type==='email'&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)); f.classList.toggle('invalid',!!bad); i.setAttribute('aria-invalid',bad?'true':'false'); if(bad) ok=false; });
      var c=form.querySelector('[name=consent]'), ce=form.querySelector('.za-consent-err'); ce.classList.toggle('show',!c.checked); if(!c.checked) ok=false;
      if(!ok){ status.className='form-status err'; status.textContent='Please fix the highlighted fields.'; return; }
      var subject='Free cloud assessment request: '+d.company;
      var body='Name: '+d.name+'\nEmail: '+d.email+'\nCompany: '+d.company+'\nCloud platform: '+d.platform+'\nPrimary area of interest: '+d.interest+'\nConsent to be contacted: Yes\n\n'+(d.message||'(no message)');
      window.location.href='mailto:'+cfg.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
      status.className='form-status ok'; status.textContent='Your email app should open with the request ready to send. If it does not, write to '+cfg.email+'.';
    });
  });
})();
