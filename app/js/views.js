/* TalNXT Digital Console: views. Each view is { title, render() -> html, mount(root) }. */
window.TND = window.TND || {};
TND.views = (function () {
  'use strict';
  var S = TND.store, U = TND.ui, esc = U.esc;
  var projectFilter = { q: '', status: '', type: '', sort: 'due' };
  var enquiryFilter = { q: '', status: '' };

  var STATUS_TONE = { 'Planning': 'neutral', 'In progress': '', 'In review': 'warning', 'Delivered': 'success',
                      'New': 'spark', 'Contacted': '', 'Qualified': 'success', 'Closed': 'neutral' };
  function badge(s) { return '<span class="badge ' + (STATUS_TONE[s] || '') + '">' + esc(s) + '</span>'; }
  function opts(list, sel, blank) { return (blank ? '<option value="">' + esc(blank) + '</option>' : '') + list.map(function (o) { return '<option' + (o === sel ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join(''); }
  function daysUntil(iso) { if (!iso) return null; return Math.round((new Date(iso + 'T12:00:00') - new Date(S.today() + 'T12:00:00')) / 86400000); }
  function dueBadge(p) {
    if (p.status === 'Delivered' || !p.due) return '';
    var d = daysUntil(p.due);
    if (d < 0) return ' <span class="badge danger">' + Math.abs(d) + 'd overdue</span>';
    if (d <= 7) return ' <span class="badge warning">due in ' + d + 'd</span>';
    return '';
  }
  function header(title, sub, actions) { return '<div class="page-head"><div><h1 id="view-title" tabindex="-1">' + esc(title) + '</h1>' + (sub ? '<p class="muted">' + esc(sub) + '</p>' : '') + '</div>' + (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>'; }

  /* ---------------- forms ---------------- */
  function projectForm(p, onDone) {
    p = p || {};
    U.formModal({
      title: p.id ? 'Edit project' : 'New project', submitLabel: p.id ? 'Save changes' : 'Create project', values: p,
      fields: [
        { name: 'name', label: 'Project name', required: true, full: true },
        { name: 'client', label: 'Client', required: true },
        { name: 'owner', label: 'Owner', hint: '(optional)' },
        { name: 'type', label: 'Type', type: 'select', options: S.PROJECT_TYPE },
        { name: 'status', label: 'Status', type: 'select', options: S.PROJECT_STATUS },
        { name: 'due', label: 'Due date', type: 'date', hint: '(optional)', full: true },
        { name: 'notes', label: 'Notes', type: 'textarea', hint: '(optional)', full: true }
      ],
      onSubmit: function (v) { v.id = p.id; S.saveProject(v); U.toast(p.id ? 'Project updated' : 'Project created'); if (onDone) onDone(); }
    });
  }
  function enquiryForm(onDone) {
    U.formModal({
      title: 'Log an enquiry', submitLabel: 'Add enquiry', values: { status: 'New' },
      fields: [
        { name: 'name', label: 'Name', required: true }, { name: 'email', label: 'Email', type: 'email', required: true, error: 'Enter a valid email address.' },
        { name: 'company', label: 'Company', hint: '(optional)' }, { name: 'interest', label: 'Interested in', type: 'select', options: S.PROJECT_TYPE, blank: 'Not sure' },
        { name: 'message', label: 'Message', type: 'textarea', required: true, full: true }
      ],
      onSubmit: function (v) { v.status = 'New'; v.received = S.today(); S.saveEnquiry(v); U.toast('Enquiry added'); if (onDone) onDone(); }
    });
  }

  /* ---------------- dashboard ---------------- */
  var dashboard = {
    title: 'Dashboard',
    render: function () {
      var P = S.projects(), E = S.enquiries();
      var active = P.filter(function (p) { return p.status !== 'Delivered'; });
      var delivered = P.length - active.length;
      var newEnq = E.filter(function (e) { return e.status === 'New'; }).length;
      var dueSoon = active.filter(function (p) { var d = daysUntil(p.due); return d !== null && d <= 14; }).length;
      var max = Math.max.apply(null, S.PROJECT_STATUS.map(function (s) { return P.filter(function (p) { return p.status === s; }).length; }).concat([1]));
      var bars = S.PROJECT_STATUS.map(function (s) {
        var n = P.filter(function (p) { return p.status === s; }).length;
        return '<div class="bar-row"><span class="bar-label">' + esc(s) + '</span><span class="bar-track"><span class="bar-fill" style="width:' + Math.round(n / max * 100) + '%"></span></span><span class="bar-n">' + n + '</span></div>';
      }).join('');
      var upcoming = active.filter(function (p) { return p.due; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }).slice(0, 5);
      var recent = E.sort(function (a, b) { return a.received < b.received ? 1 : -1; }).slice(0, 5);
      function kpi(label, value, tone, href) { return '<a class="kpi card hover" href="' + href + '"><span class="kpi-label">' + label + '</span><span class="kpi-value">' + value + '</span><span class="kpi-bar ' + tone + '"></span></a>'; }
      return header('Dashboard', S.isSample() ? 'Showing sample data. Add your own or reset it under Settings.' : 'A snapshot of projects and enquiries.',
          '<button type="button" class="btn accent sm" data-act="new-project">New project</button>') +
        '<div class="kpi-grid">' + kpi('Active projects', active.length, '', '#/projects') + kpi('Delivered', delivered, 'scale', '#/projects') +
          kpi('New enquiries', newEnq, 'spark', '#/enquiries') + kpi('Due in 14 days', dueSoon, 'advise', '#/projects') + '</div>' +
        '<div class="grid-2" style="margin-top:16px;">' +
          '<section class="card"><h2 class="panel-title">Projects by status</h2><div class="bars">' + bars + '</div></section>' +
          '<section class="card"><h2 class="panel-title">Upcoming deadlines</h2>' + (upcoming.length ? '<ul class="mini-list">' + upcoming.map(function (p) {
            return '<li><div><div class="cell-title">' + esc(p.name) + '</div><div class="cell-sub">' + esc(p.client) + '</div></div><div class="right">' + esc(U.fmtDate(p.due)) + dueBadge(p) + '</div></li>'; }).join('') + '</ul>' : '<p class="muted">No dated projects yet.</p>') + '</section>' +
        '</div>' +
        '<section class="card" style="margin-top:16px;"><div class="panel-head"><h2 class="panel-title">Recent enquiries</h2><a class="link-arrow" href="#/enquiries">View all →</a></div>' +
          (recent.length ? '<ul class="mini-list">' + recent.map(function (e) {
            return '<li><div><div class="cell-title">' + esc(e.name) + (e.company ? ' <span class="muted" style="font-weight:400;">· ' + esc(e.company) + '</span>' : '') + '</div><div class="cell-sub">' + esc(e.message.slice(0, 90)) + '</div></div><div class="right">' + badge(e.status) + '</div></li>'; }).join('') + '</ul>' : '<p class="muted">No enquiries yet.</p>') + '</section>';
    },
    mount: function (root, rerender) {
      root.querySelector('[data-act="new-project"]').addEventListener('click', function () { projectForm(null, rerender); });
    }
  };

  /* ---------------- projects ---------------- */
  function filteredProjects() {
    var f = projectFilter, q = f.q.toLowerCase();
    var rows = S.projects().filter(function (p) {
      return (!q || (p.name + ' ' + p.client + ' ' + p.owner).toLowerCase().indexOf(q) > -1) && (!f.status || p.status === f.status) && (!f.type || p.type === f.type);
    });
    rows.sort(function (a, b) {
      if (f.sort === 'name') return a.name.localeCompare(b.name);
      if (f.sort === 'client') return a.client.localeCompare(b.client);
      if (f.sort === 'status') return S.PROJECT_STATUS.indexOf(a.status) - S.PROJECT_STATUS.indexOf(b.status);
      var ad = a.due || '9999', bd = b.due || '9999'; return ad < bd ? -1 : ad > bd ? 1 : 0;
    });
    return rows;
  }
  function projectRows() {
    var rows = filteredProjects();
    if (!rows.length) return '<div class="empty"><strong>No projects found</strong>' + (S.projects().length ? 'Try clearing the search or filters.' : 'Create your first project to get started.') + '</div>';
    return '<table class="table"><thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Due</th><th>Owner</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows.map(function (p) {
      return '<tr><td class="cell-main"><div class="cell-title">' + esc(p.name) + '</div><div class="cell-sub">' + esc(p.client) + '</div></td>' +
        '<td data-label="Type">' + esc(p.type) + '</td><td data-label="Status">' + badge(p.status) + '</td>' +
        '<td data-label="Due">' + esc(U.fmtDate(p.due)) + dueBadge(p) + '</td><td data-label="Owner">' + esc(p.owner || '-') + '</td>' +
        '<td><div class="actions"><button type="button" class="btn sm" data-edit="' + esc(p.id) + '" aria-label="Edit ' + esc(p.name) + '">Edit</button><button type="button" class="btn sm" data-del="' + esc(p.id) + '" aria-label="Delete ' + esc(p.name) + '">Delete</button></div></td></tr>';
    }).join('') + '</tbody></table>';
  }
  var projects = {
    title: 'Projects',
    render: function () {
      var f = projectFilter;
      return header('Projects', 'Track delivery across every client.', '<button type="button" class="btn sm" data-act="export">Export CSV</button><button type="button" class="btn accent sm" data-act="new">New project</button>') +
        '<div class="filter-bar" role="search"><label class="search-field"><span class="sr-only">Search projects</span><input id="p-q" type="search" placeholder="Search name, client or owner" value="' + esc(f.q) + '"></label>' +
        '<label class="search-field fixed"><span class="sr-only">Status</span><select id="p-status">' + opts(S.PROJECT_STATUS, f.status, 'All statuses') + '</select></label>' +
        '<label class="search-field fixed"><span class="sr-only">Type</span><select id="p-type">' + opts(S.PROJECT_TYPE, f.type, 'All types') + '</select></label>' +
        '<label class="search-field fixed"><span class="sr-only">Sort by</span><select id="p-sort"><option value="due">Sort: due date</option><option value="name">Sort: name</option><option value="client">Sort: client</option><option value="status">Sort: status</option></select></label></div>' +
        '<div class="table-wrap" id="p-table" style="margin-top:14px;">' + projectRows() + '</div><p class="muted count" id="p-count" aria-live="polite"></p>';
    },
    mount: function (root, rerender) {
      var f = projectFilter, table = root.querySelector('#p-table'), count = root.querySelector('#p-count');
      root.querySelector('#p-sort').value = f.sort;
      function refresh() { table.innerHTML = projectRows(); var n = filteredProjects().length; count.textContent = n + (n === 1 ? ' project' : ' projects'); }
      refresh();
      root.querySelector('#p-q').addEventListener('input', function (e) { f.q = e.target.value; refresh(); });
      root.querySelector('#p-status').addEventListener('change', function (e) { f.status = e.target.value; refresh(); });
      root.querySelector('#p-type').addEventListener('change', function (e) { f.type = e.target.value; refresh(); });
      root.querySelector('#p-sort').addEventListener('change', function (e) { f.sort = e.target.value; refresh(); });
      root.querySelector('[data-act="new"]').addEventListener('click', function () { projectForm(null, rerender); });
      root.querySelector('[data-act="export"]').addEventListener('click', function () {
        U.download('projects.csv', U.toCSV(filteredProjects(), ['name', 'client', 'type', 'status', 'owner', 'due', 'notes']), 'text/csv'); U.toast('Exported ' + filteredProjects().length + ' projects');
      });
      table.addEventListener('click', function (e) {
        var ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
        if (ed) projectForm(S.getProject(ed.getAttribute('data-edit')), rerender);
        if (del) { var p = S.getProject(del.getAttribute('data-del')); U.confirm('Delete project', 'Delete "' + p.name + '"? This cannot be undone.').then(function (ok) { if (ok) { S.deleteProject(p.id); U.toast('Project deleted'); rerender(); } }); }
      });
    }
  };

  /* ---------------- enquiries ---------------- */
  function filteredEnquiries() {
    var f = enquiryFilter, q = f.q.toLowerCase();
    return S.enquiries().filter(function (e) { return (!q || (e.name + ' ' + e.company + ' ' + e.email + ' ' + e.message).toLowerCase().indexOf(q) > -1) && (!f.status || e.status === f.status); })
      .sort(function (a, b) { return a.received < b.received ? 1 : -1; });
  }
  function enquiryRows() {
    var rows = filteredEnquiries();
    if (!rows.length) return '<div class="empty"><strong>No enquiries found</strong>' + (S.enquiries().length ? 'Try clearing the search or filter.' : 'Enquiries you log will appear here.') + '</div>';
    return '<table class="table"><thead><tr><th>From</th><th>Interested in</th><th>Received</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>' + rows.map(function (e) {
      return '<tr><td class="cell-main"><div class="cell-title">' + esc(e.name) + (e.company ? ' · ' + esc(e.company) : '') + '</div><div class="cell-sub">' + esc(e.email) + '</div></td>' +
        '<td data-label="Interested in">' + esc(e.interest || 'Not sure') + '</td><td data-label="Received">' + esc(U.fmtDate(e.received)) + '</td>' +
        '<td data-label="Status"><select class="select status-select" data-status="' + esc(e.id) + '" aria-label="Status for ' + esc(e.name) + '">' + opts(S.ENQUIRY_STATUS, e.status) + '</select></td>' +
        '<td><div class="actions"><button type="button" class="btn sm" data-view="' + esc(e.id) + '">View</button><button type="button" class="btn sm" data-del="' + esc(e.id) + '" aria-label="Delete enquiry from ' + esc(e.name) + '">Delete</button></div></td></tr>';
    }).join('') + '</tbody></table>';
  }
  var enquiries = {
    title: 'Enquiries',
    render: function () {
      var f = enquiryFilter;
      return header('Enquiries', 'Leads that came in through the website or were logged by the team.', '<button type="button" class="btn accent sm" data-act="new">Log enquiry</button>') +
        '<div class="filter-bar" role="search"><label class="search-field"><span class="sr-only">Search enquiries</span><input id="e-q" type="search" placeholder="Search name, company, email or message" value="' + esc(f.q) + '"></label>' +
        '<label class="search-field fixed"><span class="sr-only">Status</span><select id="e-status">' + opts(S.ENQUIRY_STATUS, f.status, 'All statuses') + '</select></label></div>' +
        '<div class="table-wrap" id="e-table" style="margin-top:14px;">' + enquiryRows() + '</div><p class="muted count" id="e-count" aria-live="polite"></p>';
    },
    mount: function (root, rerender) {
      var f = enquiryFilter, table = root.querySelector('#e-table'), count = root.querySelector('#e-count');
      function refresh() { table.innerHTML = enquiryRows(); var n = filteredEnquiries().length; count.textContent = n + (n === 1 ? ' enquiry' : ' enquiries'); }
      refresh();
      root.querySelector('#e-q').addEventListener('input', function (e) { f.q = e.target.value; refresh(); });
      root.querySelector('#e-status').addEventListener('change', function (e) { f.status = e.target.value; refresh(); });
      root.querySelector('[data-act="new"]').addEventListener('click', function () { enquiryForm(rerender); });
      table.addEventListener('change', function (e) {
        var sel = e.target.closest('[data-status]'); if (!sel) return;
        var en = S.getEnquiry(sel.getAttribute('data-status')); en.status = sel.value; S.saveEnquiry(en); U.toast('Status set to ' + sel.value); refresh();
      });
      table.addEventListener('click', function (e) {
        var view = e.target.closest('[data-view]'), del = e.target.closest('[data-del]');
        if (view) {
          var en = S.getEnquiry(view.getAttribute('data-view'));
          var b = U.open('Enquiry from ' + en.name, '<dl class="detail"><dt>Email</dt><dd><a href="mailto:' + esc(en.email) + '">' + esc(en.email) + '</a></dd><dt>Company</dt><dd>' + esc(en.company || '-') + '</dd><dt>Interested in</dt><dd>' + esc(en.interest || 'Not sure') + '</dd><dt>Received</dt><dd>' + esc(U.fmtDate(en.received)) + '</dd><dt>Message</dt><dd style="white-space:pre-wrap;">' + esc(en.message) + '</dd></dl><div class="modal-actions"><button type="button" class="btn" data-close>Close</button><button type="button" class="btn accent" data-convert>Create project</button></div>');
          b.querySelector('[data-close]').addEventListener('click', U.close);
          b.querySelector('[data-convert]').addEventListener('click', function () {
            U.close();
            projectForm({ name: (en.interest || 'New') + ' project', client: en.company || en.name, type: en.interest || S.PROJECT_TYPE[0], status: 'Planning', notes: 'From enquiry: ' + en.message.slice(0, 200) }, function () { en.status = 'Qualified'; S.saveEnquiry(en); location.hash = '#/projects'; });
          });
        }
        if (del) { var d = S.getEnquiry(del.getAttribute('data-del')); U.confirm('Delete enquiry', 'Delete the enquiry from ' + d.name + '? This cannot be undone.').then(function (ok) { if (ok) { S.deleteEnquiry(d.id); U.toast('Enquiry deleted'); refresh(); } }); }
      });
    }
  };

  /* ---------------- settings ---------------- */
  var settings = {
    title: 'Settings',
    render: function () {
      return header('Settings', 'Data and storage for this console.') +
        '<section class="card"><h2 class="panel-title">Where your data lives</h2><p class="copy sm">This demo console stores everything in <strong>this browser only</strong> (localStorage). Nothing is sent to a server, other people cannot see it, and clearing site data removes it. Connect an API in <code>app/js/store.js</code> to make it multi-user.</p>' +
        '<p class="copy sm" style="margin-top:8px;">Currently: <strong>' + S.projects().length + '</strong> projects, <strong>' + S.enquiries().length + '</strong> enquiries' + (S.isSample() ? ' (sample data)' : '') + '. Browser storage: <strong>' + (S.persisted() ? 'saving' : 'not available, changes last until you close the tab') + '</strong>.</p></section>' +
        '<section class="card" style="margin-top:16px;"><h2 class="panel-title">Backup &amp; restore</h2><div class="btn-row"><button type="button" class="btn" data-act="export">Export JSON backup</button><label class="btn" for="import-file" tabindex="0" role="button" id="import-label">Import JSON…</label><input type="file" id="import-file" accept="application/json,.json" class="sr-only"></div></section>' +
        '<section class="card" style="margin-top:16px;"><h2 class="panel-title">Reset</h2><div class="btn-row"><button type="button" class="btn" data-act="reset">Load sample data</button><button type="button" class="btn danger" data-act="clear">Delete all data</button></div></section>';
    },
    mount: function (root, rerender) {
      root.querySelector('[data-act="export"]').addEventListener('click', function () { U.download('talnxt-digital-console-backup.json', S.exportJSON(), 'application/json'); U.toast('Backup downloaded'); });
      var file = root.querySelector('#import-file'), label = root.querySelector('#import-label');
      label.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
      file.addEventListener('change', function () {
        var fl = file.files[0]; if (!fl) return;
        if (fl.size > 2 * 1024 * 1024) { U.toast('That file is too large (max 2 MB).', 'err'); return; }
        var r = new FileReader();
        r.onload = function () { try { var n = S.importJSON(String(r.result)); U.toast('Imported ' + n.projects + ' projects and ' + n.enquiries + ' enquiries'); rerender(); } catch (err) { U.toast(err.message, 'err'); } };
        r.readAsText(fl);
      });
      root.querySelector('[data-act="reset"]').addEventListener('click', function () { U.confirm('Load sample data', 'This replaces everything with the sample data.', 'Replace').then(function (ok) { if (ok) { S.reset(); U.toast('Sample data loaded'); rerender(); } }); });
      root.querySelector('[data-act="clear"]').addEventListener('click', function () { U.confirm('Delete all data', 'All projects and enquiries will be removed from this browser.').then(function (ok) { if (ok) { S.clearAll(); U.toast('All data deleted'); rerender(); } }); });
    }
  };

  return { dashboard: dashboard, projects: projects, enquiries: enquiries, settings: settings };
})();
