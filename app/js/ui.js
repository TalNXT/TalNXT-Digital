/* TalNXT Digital Console: UI helpers (escaping, modal, form modal, confirm, toast, download). */
window.TND = window.TND || {};
TND.ui = (function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDate(iso) {
    if (!iso) return '-';
    var d = new Date(iso + 'T12:00:00'); if (isNaN(d)) return '-';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  var overlay, body, titleEl, lastFocus, onClose = null;
  function ensure() {
    if (overlay) return;
    overlay = document.createElement('div'); overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><button type="button" class="modal-close" aria-label="Close">✕</button><h3 id="modal-title"></h3><div class="modal-body"></div></div>';
    document.body.appendChild(overlay);
    body = overlay.querySelector('.modal-body'); titleEl = overlay.querySelector('#modal-title');
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.modal-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {   // keep focus inside the dialog
        var f = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        f = Array.prototype.filter.call(f, function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  function open(title, html) {
    ensure(); lastFocus = document.activeElement;
    titleEl.textContent = title; body.innerHTML = html; overlay.classList.add('open');
    var first = body.querySelector('input, select, textarea, button'); (first || overlay.querySelector('.modal-box')).focus();
    return body;
  }
  function close() {
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    var cb = onClose; onClose = null; if (cb) cb();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function confirmBox(title, message, okLabel) {
    return new Promise(function (resolve) {
      var b = open(title, '<p class="copy">' + esc(message) + '</p><div class="modal-actions" style="margin-top:20px;"><button type="button" class="btn" data-no>Cancel</button><button type="button" class="btn danger" data-yes>' + esc(okLabel || 'Delete') + '</button></div>');
      var done = false;
      function finish(v) { if (done) return; done = true; onClose = null; close(); resolve(v); }
      onClose = function () { if (!done) { done = true; resolve(false); } };
      b.querySelector('[data-yes]').addEventListener('click', function () { finish(true); });
      b.querySelector('[data-no]').addEventListener('click', function () { finish(false); });
    });
  }

  /* formModal({ title, fields:[{name,label,type,required,options,hint,full}], values, submitLabel, onSubmit(values) }) */
  function formModal(cfg) {
    var v = cfg.values || {};
    var html = '<form novalidate>';
    var rows = '', pending = [];
    function flush() { if (pending.length) { rows += '<div class="form-row">' + pending.join('') + '</div>'; pending = []; } }
    cfg.fields.forEach(function (f) {
      var id = 'f_' + f.name, val = v[f.name] == null ? '' : v[f.name], ctl;
      if (f.type === 'select') {
        ctl = '<select class="select" id="' + id + '" name="' + f.name + '"' + (f.required ? ' required' : '') + '>' +
          (f.blank ? '<option value="">' + esc(f.blank) + '</option>' : '') +
          f.options.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
      } else if (f.type === 'textarea') {
        ctl = '<textarea class="textarea" id="' + id + '" name="' + f.name + '" style="min-height:90px;"' + (f.required ? ' required' : '') + '>' + esc(val) + '</textarea>';
      } else {
        ctl = '<input class="input" id="' + id + '" name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + esc(val) + '"' + (f.required ? ' required' : '') + '>';
      }
      var fld = '<div class="field"><label for="' + id + '">' + esc(f.label) + (f.hint ? ' <span class="hint">' + esc(f.hint) + '</span>' : '') + '</label>' + ctl + '<div class="field-error">' + esc(f.error || 'This field is required.') + '</div></div>';
      if (f.full) { flush(); rows += fld; } else { pending.push(fld); if (pending.length === 2) flush(); }
    });
    flush();
    html += rows + '<div class="modal-actions"><button type="button" class="btn" data-cancel>Cancel</button><button type="submit" class="btn accent">' + esc(cfg.submitLabel || 'Save') + '</button></div></form>';
    var b = open(cfg.title, html), form = b.querySelector('form');
    b.querySelector('[data-cancel]').addEventListener('click', close);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, out = {};
      cfg.fields.forEach(function (f) {
        var input = form.elements[f.name], val = input.value.trim(), bad = false;
        if (f.required && !val) bad = true;
        if (f.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { bad = true; }
        input.closest('.field').classList.toggle('invalid', bad); input.setAttribute('aria-invalid', String(bad));
        if (bad) ok = false; out[f.name] = val;
      });
      if (!ok) { var firstBad = form.querySelector('.invalid input, .invalid select, .invalid textarea'); if (firstBad) firstBad.focus(); return; }
      var res = cfg.onSubmit(out);
      if (res !== false) close();
    });
  }

  var region;
  function toast(msg, type) {
    if (!region) { region = document.createElement('div'); region.className = 'toast-region'; region.setAttribute('role', 'status'); region.setAttribute('aria-live', 'polite'); document.body.appendChild(region); }
    var t = document.createElement('div'); t.className = 'toast' + (type === 'err' ? ' err' : ''); t.textContent = msg; region.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
  }
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function csvCell(v) { var s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }   // blocks spreadsheet formula injection
  function toCSV(rows, cols) { return [cols.map(csvCell).join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return csvCell(r[c]); }).join(','); })).join('\r\n'); }

  return { esc: esc, fmtDate: fmtDate, open: open, close: close, confirm: confirmBox, formModal: formModal, toast: toast, download: download, toCSV: toCSV };
})();
