(function () {
  // Lovable Accessibility Layer — lightweight widget loader
  try {
    var currentScript = document.currentScript || (function () {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf('accessibility.js') !== -1) return scripts[i];
      }
      return null;
    })();
    if (!currentScript) return;
    var src = currentScript.src;
    var siteId = (src.match(/[?&]site=([^&]+)/) || [])[1];
    if (!siteId) return;

    var origin = (src.split('/accessibility.js')[0]) || '';
    var configUrl = origin + '/functions/v1/accessibility-widget-config?site=' + encodeURIComponent(siteId);

    var STORAGE_KEY = 'lov_a11y_state_' + siteId;
    function loadState() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
    }
    function saveState(s) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
    }

    function injectStyles() {
      if (document.getElementById('lov-a11y-styles')) return;
      var s = document.createElement('style');
      s.id = 'lov-a11y-styles';
      s.textContent = [
        '.lov-a11y-launcher{position:fixed;bottom:20px;right:20px;width:48px;height:48px;border-radius:50%;background:#2563eb;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:2147483646;display:flex;align-items:center;justify-content:center;font-size:22px;font-family:system-ui,sans-serif}',
        '.lov-a11y-launcher:focus{outline:3px solid #fff;outline-offset:2px}',
        '.lov-a11y-panel{position:fixed;bottom:80px;right:20px;width:280px;background:#fff;color:#111;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.18);z-index:2147483647;font-family:system-ui,sans-serif;padding:14px;display:none}',
        '.lov-a11y-panel.open{display:block}',
        '.lov-a11y-panel h3{margin:0 0 8px;font-size:14px;font-weight:600}',
        '.lov-a11y-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:13px}',
        '.lov-a11y-row button{font-size:12px;padding:4px 10px;border:1px solid #d4d4d8;background:#f4f4f5;border-radius:6px;cursor:pointer}',
        '.lov-a11y-row button.on{background:#2563eb;color:#fff;border-color:#2563eb}',
        '.lov-a11y-foot{margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center}',
        '.lov-a11y-hc{filter:invert(1) hue-rotate(180deg)!important;background:#000!important}',
        '.lov-a11y-hc img,.lov-a11y-hc video,.lov-a11y-hc iframe{filter:invert(1) hue-rotate(180deg)!important}',
        '.lov-a11y-fs{font-size:120%!important}',
        '.lov-a11y-rm *,.lov-a11y-rm *::before,.lov-a11y-rm *::after{transition:none!important;animation:none!important}',
        '.lov-a11y-sp{letter-spacing:.05em!important;word-spacing:.1em!important;line-height:1.7!important}',
        '.lov-a11y-hl a{text-decoration:underline!important;background:#fff59d!important;color:#111!important;padding:0 2px!important}'
      ].join('\n');
      document.head.appendChild(s);
    }

    function applyClass(name, on) {
      document.documentElement.classList.toggle(name, !!on);
    }

    function build(features) {
      injectStyles();
      var state = loadState();

      var btn = document.createElement('button');
      btn.className = 'lov-a11y-launcher';
      btn.setAttribute('aria-label', 'Accessibility menu');
      btn.innerHTML = '♿';

      var panel = document.createElement('div');
      panel.className = 'lov-a11y-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Accessibility options');

      var title = document.createElement('h3');
      title.textContent = 'Accessibility';
      panel.appendChild(title);

      var defs = [
        { key: 'high_contrast', label: 'High contrast', cls: 'lov-a11y-hc' },
        { key: 'font_scaling',  label: 'Larger text',    cls: 'lov-a11y-fs' },
        { key: 'reduced_motion',label: 'Reduce motion',  cls: 'lov-a11y-rm' },
        { key: 'spacing',       label: 'More spacing',   cls: 'lov-a11y-sp' },
        { key: 'highlight_links',label:'Highlight links',cls: 'lov-a11y-hl' }
      ];

      defs.forEach(function (d) {
        if (!features[d.key]) return;
        var row = document.createElement('div');
        row.className = 'lov-a11y-row';
        var lbl = document.createElement('span');
        lbl.textContent = d.label;
        var b = document.createElement('button');
        var on = !!state[d.key];
        b.textContent = on ? 'On' : 'Off';
        b.className = on ? 'on' : '';
        b.setAttribute('aria-pressed', String(on));
        applyClass(d.cls, on);
        b.addEventListener('click', function () {
          on = !on;
          state[d.key] = on;
          saveState(state);
          b.textContent = on ? 'On' : 'Off';
          b.className = on ? 'on' : '';
          b.setAttribute('aria-pressed', String(on));
          applyClass(d.cls, on);
        });
        row.appendChild(lbl);
        row.appendChild(b);
        panel.appendChild(row);
      });

      var foot = document.createElement('div');
      foot.className = 'lov-a11y-foot';
      foot.textContent = 'Accessibility Layer';
      panel.appendChild(foot);

      btn.addEventListener('click', function () {
        panel.classList.toggle('open');
      });

      document.body.appendChild(btn);
      document.body.appendChild(panel);
    }

    function init() {
      fetch(configUrl).then(function (r) { return r.json(); }).then(function (cfg) {
        if (!cfg || cfg.active === false) return;
        var features = cfg.features || {};
        if (document.body) build(features);
        else document.addEventListener('DOMContentLoaded', function () { build(features); });
      }).catch(function () {});
    }
    init();
  } catch (e) { /* fail silently */ }
})();
