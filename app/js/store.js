/* TalNXT Digital Console: data layer.
   Data lives in THIS browser only (localStorage). To go multi-user, replace the bodies of load()/save()
   with calls to your API; the rest of the app only talks to the functions returned at the bottom. */
window.TND = window.TND || {};
TND.store = (function () {
  'use strict';
  var KEY = 'tnd.console.v1';
  var PROJECT_STATUS = ['Planning', 'In progress', 'In review', 'Delivered'];
  var PROJECT_TYPE = ['Web & Product', 'Cloud & DevOps', 'Data & AI', 'Growth'];
  var ENQUIRY_STATUS = ['New', 'Contacted', 'Qualified', 'Closed'];
  var memory = null;      // fallback when localStorage is blocked

  function uid() { return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function isoDay(offset) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }

  function seed() {
    return {
      sample: true,
      projects: [
        { id: uid(), name: 'Customer portal revamp', client: 'Northwind Retail', type: 'Web & Product', status: 'In progress', owner: 'Asha', due: isoDay(12), notes: 'Phase 2: self-serve invoices.' },
        { id: uid(), name: 'Cloud cost review', client: 'Bluepeak Logistics', type: 'Cloud & DevOps', status: 'In review', owner: 'Rahul', due: isoDay(5), notes: '' },
        { id: uid(), name: 'Sales analytics dashboard', client: 'Fernhill Foods', type: 'Data & AI', status: 'Planning', owner: 'Meera', due: isoDay(30), notes: '' },
        { id: uid(), name: 'Website relaunch', client: 'Orchid Hospitals', type: 'Growth', status: 'In progress', owner: 'Asha', due: isoDay(-3), notes: 'Waiting on content sign-off.' },
        { id: uid(), name: 'CI/CD migration', client: 'Northwind Retail', type: 'Cloud & DevOps', status: 'Delivered', owner: 'Rahul', due: isoDay(-20), notes: '' },
        { id: uid(), name: 'Mobile booking app', client: 'Lumen Travel', type: 'Web & Product', status: 'Delivered', owner: 'Meera', due: isoDay(-45), notes: '' }
      ],
      enquiries: [
        { id: uid(), name: 'Priya Nair', email: 'priya@example.com', company: 'Kestrel Finance', interest: 'Data & AI', message: 'We want a risk dashboard for our credit team.', status: 'New', received: isoDay(-1) },
        { id: uid(), name: 'Daniel Joseph', email: 'daniel@example.com', company: 'Harbor Health', interest: 'Web & Product', message: 'Looking to rebuild our patient portal.', status: 'New', received: isoDay(-2) },
        { id: uid(), name: 'Sana Iqbal', email: 'sana@example.com', company: 'Mosaic Learning', interest: 'Cloud & DevOps', message: 'Need help moving to AWS.', status: 'Contacted', received: isoDay(-6) },
        { id: uid(), name: 'Vikram Rao', email: 'vikram@example.com', company: 'Atlas Auto', interest: 'Growth', message: 'SEO and analytics set-up for a new site.', status: 'Qualified', received: isoDay(-9) },
        { id: uid(), name: 'Neha Kulkarni', email: 'neha@example.com', company: 'Pinecone Foods', interest: '', message: 'General question about your process.', status: 'Closed', received: isoDay(-20) }
      ]
    };
  }

  function valid(s) { return s && typeof s === 'object' && Array.isArray(s.projects) && Array.isArray(s.enquiries); }
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var s = JSON.parse(raw); if (valid(s)) return s; } } catch (e) {}
    return memory && valid(memory) ? memory : seed();
  }
  var state = load();
  function save() {
    memory = state;
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }

  function str(v, max) { return String(v == null ? '' : v).slice(0, max || 500); }
  function pick(v, list, dflt) { return list.indexOf(v) > -1 ? v : dflt; }
  function cleanProject(p) {
    return { id: str(p.id, 40) || uid(), name: str(p.name, 120), client: str(p.client, 120), type: pick(p.type, PROJECT_TYPE, PROJECT_TYPE[0]),
      status: pick(p.status, PROJECT_STATUS, PROJECT_STATUS[0]), owner: str(p.owner, 60),
      due: /^\d{4}-\d{2}-\d{2}$/.test(p.due || '') ? p.due : '', notes: str(p.notes, 1000) };
  }
  function cleanEnquiry(e) {
    return { id: str(e.id, 40) || uid(), name: str(e.name, 120), email: str(e.email, 160), company: str(e.company, 120),
      interest: pick(e.interest, PROJECT_TYPE, ''), message: str(e.message, 2000), status: pick(e.status, ENQUIRY_STATUS, 'New'),
      received: /^\d{4}-\d{2}-\d{2}$/.test(e.received || '') ? e.received : isoDay(0) };
  }
  function upsert(list, item, clean) {
    var c = clean(item), i = -1;
    list.forEach(function (x, k) { if (x.id === c.id) i = k; });
    if (i > -1) list[i] = c; else list.unshift(c);
    state.sample = false; save(); return c;
  }
  function remove(list, id) { var n = list.length; state[list === state.projects ? 'projects' : 'enquiries'] = list.filter(function (x) { return x.id !== id; }); state.sample = false; save(); return n; }

  return {
    PROJECT_STATUS: PROJECT_STATUS, PROJECT_TYPE: PROJECT_TYPE, ENQUIRY_STATUS: ENQUIRY_STATUS,
    projects: function () { return state.projects.slice(); },
    enquiries: function () { return state.enquiries.slice(); },
    getProject: function (id) { return state.projects.filter(function (p) { return p.id === id; })[0]; },
    getEnquiry: function (id) { return state.enquiries.filter(function (e) { return e.id === id; })[0]; },
    saveProject: function (p) { return upsert(state.projects, p, cleanProject); },
    saveEnquiry: function (e) { return upsert(state.enquiries, e, cleanEnquiry); },
    deleteProject: function (id) { remove(state.projects, id); },
    deleteEnquiry: function (id) { remove(state.enquiries, id); },
    isSample: function () { return !!state.sample; },
    reset: function () { state = seed(); save(); },
    clearAll: function () { state = { sample: false, projects: [], enquiries: [] }; save(); },
    exportJSON: function () { return JSON.stringify({ exportedAt: new Date().toISOString(), projects: state.projects, enquiries: state.enquiries }, null, 2); },
    importJSON: function (text) {
      var s; try { s = JSON.parse(text); } catch (e) { throw new Error('That file is not valid JSON.'); }
      if (!valid(s)) throw new Error('The file must contain "projects" and "enquiries" lists.');
      state = { sample: false, projects: s.projects.slice(0, 2000).map(cleanProject), enquiries: s.enquiries.slice(0, 2000).map(cleanEnquiry) };
      save(); return { projects: state.projects.length, enquiries: state.enquiries.length };
    },
    persisted: function () { try { return localStorage.getItem(KEY) !== null; } catch (e) { return false; } },
    today: function () { return isoDay(0); }, inDays: isoDay
  };
})();
