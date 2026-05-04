(function () {
  // Lovable Accessibility Layer v2 — full-featured widget
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

    var attrPosition = (currentScript.getAttribute('data-position') || '').toLowerCase();
    var position = (attrPosition === 'left' || attrPosition === 'center' || attrPosition === 'right') ? attrPosition : 'right';

    var SUPABASE_FUNCTIONS_URL = 'https://svuxuhrsrawdqqkepeye.supabase.co/functions/v1';
    var configUrl = SUPABASE_FUNCTIONS_URL + '/accessibility-widget-config?site=' + encodeURIComponent(siteId);
    var feedbackUrl = SUPABASE_FUNCTIONS_URL + '/accessibility-feedback-submit';

    var STORAGE_KEY = 'lov_a11y_state_' + siteId;
    function loadState() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
    }
    function saveState(s) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
    }
    var state = loadState();

    function posCss(sel) {
      if (position === 'left') return sel + '{left:20px;right:auto}';
      if (position === 'center') return sel + '{left:50%;right:auto;transform:translateX(-50%)}';
      return sel + '{right:20px;left:auto}';
    }

    function injectStyles() {
      if (document.getElementById('lov-a11y-styles')) return;
      var brandPrimary = (window._lovA11yBrand && window._lovA11yBrand.primary) || '#1e3a8a';
      // Lighten brand for the active-tile background (mimic dbeafe = primary at ~12% on white)
      function lighten(hex) {
        try {
          var h = hex.replace('#', '');
          if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
          var r = parseInt(h.slice(0, 2), 16);
          var g = parseInt(h.slice(2, 4), 16);
          var b = parseInt(h.slice(4, 6), 16);
          var mix = function (c) { return Math.round(c + (255 - c) * 0.85); };
          return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
        } catch (e) { return '#dbeafe'; }
      }
      var brandSoft = lighten(brandPrimary);
      var s = document.createElement('style');
      s.id = 'lov-a11y-styles';
      var css = [
        // Launcher button
        '.lov-a11y-launcher{position:fixed;bottom:20px;width:52px;height:52px;border-radius:50%;background:#1e3a8a;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:2147483646;display:flex;align-items:center;justify-content:center;font-size:26px;font-family:system-ui,sans-serif}',
        posCss('.lov-a11y-launcher'),
        '.lov-a11y-launcher:focus{outline:3px solid #fbbf24;outline-offset:2px}',
        '.lov-a11y-launcher:hover{transform:scale(1.05);transition:transform .15s}',

        // Panel container
        '.lov-a11y-panel{position:fixed;bottom:84px;width:340px;max-height:80vh;background:#fff;color:#111827;border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.22);z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;display:none;flex-direction:column;overflow:hidden}',
        posCss('.lov-a11y-panel'),
        '.lov-a11y-panel.open{display:flex}',
        '.lov-a11y-panel.oversize{width:420px;font-size:115%}',

        // Header
        '.lov-a11y-head{background:#1e3a8a;color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px}',
        '.lov-a11y-head h3{margin:0;font-size:15px;font-weight:600}',
        '.lov-a11y-head-actions{display:flex;gap:4px}',
        '.lov-a11y-icon-btn{background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px}',
        '.lov-a11y-icon-btn:hover{background:rgba(255,255,255,.25)}',
        '.lov-a11y-icon-btn.on{background:#fbbf24;color:#111}',

        // Body scroll area
        '.lov-a11y-body{overflow-y:auto;padding:12px 14px;flex:1}',
        '.lov-a11y-section{margin-bottom:14px}',
        '.lov-a11y-section h4{margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280}',

        // Top utilities
        '.lov-a11y-utils{display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid #e5e7eb;background:#f9fafb}',
        '.lov-a11y-util-btn{flex:1;padding:8px 6px;background:#fff;border:1px solid #d1d5db;border-radius:6px;font-size:12px;cursor:pointer;color:#111}',
        '.lov-a11y-util-btn:hover{background:#f3f4f6}',

        // Tile grid (profiles, content, color)
        '.lov-a11y-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
        '.lov-a11y-grid.three{grid-template-columns:1fr 1fr 1fr}',
        '.lov-a11y-tile{padding:10px 6px;background:#f3f4f6;border:2px solid transparent;border-radius:8px;cursor:pointer;text-align:center;font-size:12px;color:#111;display:flex;flex-direction:column;align-items:center;gap:4px;line-height:1.2}',
        '.lov-a11y-tile:hover{background:#e5e7eb}',
        '.lov-a11y-tile.on{background:#dbeafe;border-color:#1e3a8a;color:#1e3a8a;font-weight:600}',
        '.lov-a11y-tile-icon{font-size:18px;line-height:1}',

        // Slider
        '.lov-a11y-slider{display:flex;align-items:center;gap:8px;padding:6px 0}',
        '.lov-a11y-slider-track{flex:1;display:flex;gap:3px}',
        '.lov-a11y-step{flex:1;height:6px;background:#e5e7eb;border-radius:3px}',
        '.lov-a11y-step.on{background:#1e3a8a}',
        '.lov-a11y-slider button{width:28px;height:28px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer}',
        '.lov-a11y-slider-label{display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:4px}',

        // Color swatches
        '.lov-a11y-swatch-row{display:flex;gap:4px;flex-wrap:wrap}',
        '.lov-a11y-swatch{width:24px;height:24px;border-radius:50%;border:2px solid #e5e7eb;cursor:pointer}',
        '.lov-a11y-swatch.on{border-color:#111}',

        // Footer
        '.lov-a11y-foot{padding:10px 14px;border-top:1px solid #e5e7eb;background:#f9fafb;display:flex;flex-direction:column;gap:6px}',
        '.lov-a11y-foot-row{display:flex;gap:6px}',
        '.lov-a11y-foot button,.lov-a11y-foot a{flex:1;padding:8px;border:1px solid #d1d5db;background:#fff;border-radius:6px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;color:#111}',
        '.lov-a11y-foot button:hover,.lov-a11y-foot a:hover{background:#f3f4f6}',
        '.lov-a11y-foot-brand{font-size:10px;color:#9ca3af;text-align:center}',

        // Modal (report issue)
        '.lov-a11y-modal{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px}',
        '.lov-a11y-modal-card{background:#fff;border-radius:12px;padding:20px;max-width:420px;width:100%;font-family:system-ui,sans-serif;color:#111}',
        '.lov-a11y-modal-card h3{margin:0 0 12px;font-size:16px}',
        '.lov-a11y-modal-card label{display:block;font-size:12px;font-weight:600;margin:8px 0 4px}',
        '.lov-a11y-modal-card input,.lov-a11y-modal-card textarea{width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-family:inherit;font-size:13px;box-sizing:border-box}',
        '.lov-a11y-modal-card textarea{min-height:80px;resize:vertical}',
        '.lov-a11y-modal-actions{display:flex;gap:8px;margin-top:14px;justify-content:flex-end}',
        '.lov-a11y-modal-actions button{padding:8px 14px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-size:13px}',
        '.lov-a11y-modal-actions button.primary{background:#1e3a8a;color:#fff;border-color:#1e3a8a}',

        // Reading overlays
        '#lov-a11y-mask-top,#lov-a11y-mask-bot{position:fixed;left:0;right:0;background:rgba(0,0,0,.7);z-index:2147483640;pointer-events:none}',
        '#lov-a11y-guide{position:fixed;left:0;right:0;height:36px;background:rgba(251,191,36,.35);border-top:2px solid #f59e0b;border-bottom:2px solid #f59e0b;z-index:2147483640;pointer-events:none}',

        // Applied utility classes (host page)
        '.lov-a11y-hc{filter:invert(1) hue-rotate(180deg)!important;background:#000!important}',
        '.lov-a11y-hc img,.lov-a11y-hc video,.lov-a11y-hc iframe{filter:invert(1) hue-rotate(180deg)!important}',
        '.lov-a11y-dark{filter:invert(.92) hue-rotate(180deg)!important;background:#111!important}',
        '.lov-a11y-dark img,.lov-a11y-dark video,.lov-a11y-dark iframe{filter:invert(1) hue-rotate(180deg)!important}',
        '.lov-a11y-light{background:#fff!important;color:#000!important}',
        '.lov-a11y-mono,.lov-a11y-mono *{filter:grayscale(1)!important}',
        '.lov-a11y-sat-low,.lov-a11y-sat-low *{filter:saturate(.5)!important}',
        '.lov-a11y-sat-high,.lov-a11y-sat-high *{filter:saturate(1.8)!important}',
        '.lov-a11y-fs-1{font-size:110%!important}',
        '.lov-a11y-fs-2{font-size:120%!important}',
        '.lov-a11y-fs-3{font-size:140%!important}',
        '.lov-a11y-fs-4{font-size:160%!important}',
        '.lov-a11y-fs-5{font-size:180%!important}',
        '.lov-a11y-rm *,.lov-a11y-rm *::before,.lov-a11y-rm *::after{transition:none!important;animation:none!important}',
        '.lov-a11y-stop-anim *,.lov-a11y-stop-anim *::before,.lov-a11y-stop-anim *::after{animation-play-state:paused!important;transition:none!important}',
        '.lov-a11y-stop-anim video,.lov-a11y-stop-anim audio{display:none!important}',
        '.lov-a11y-sp{letter-spacing:.05em!important;word-spacing:.1em!important;line-height:1.7!important}',
        '.lov-a11y-ls{letter-spacing:.12em!important}',
        '.lov-a11y-lh{line-height:2!important}',
        '.lov-a11y-fw,.lov-a11y-fw *{font-weight:700!important}',
        '.lov-a11y-hl a{text-decoration:underline!important;background:#fff59d!important;color:#111!important;padding:0 2px!important}',
        '.lov-a11y-ht h1,.lov-a11y-ht h2,.lov-a11y-ht h3{background:#fef3c7!important;color:#111!important;padding:2px 4px!important;border-left:4px solid #f59e0b!important}',
        '.lov-a11y-dyslexic,.lov-a11y-dyslexic *{font-family:"OpenDyslexic","Comic Sans MS",sans-serif!important}',
        '.lov-a11y-hide-img img,.lov-a11y-hide-img picture,.lov-a11y-hide-img svg{visibility:hidden!important}',
        '.lov-a11y-cursor-big-black,.lov-a11y-cursor-big-black *{cursor:url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2748%27 height=%2748%27 viewBox=%270 0 24 24%27><path fill=%27%23000%27 stroke=%27%23fff%27 stroke-width=%271%27 d=%27M3 2l7 18 2.5-7.5L20 10z%27/></svg>") 0 0,auto!important}',
        '.lov-a11y-cursor-big-white,.lov-a11y-cursor-big-white *{cursor:url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2748%27 height=%2748%27 viewBox=%270 0 24 24%27><path fill=%27%23fff%27 stroke=%27%23000%27 stroke-width=%271%27 d=%27M3 2l7 18 2.5-7.5L20 10z%27/></svg>") 0 0,auto!important}',
        '.lov-a11y-focus *:focus{outline:3px solid #f59e0b!important;outline-offset:2px!important}',
      ].join('\n');
      // Substitute the default brand blue + soft tile background with the org's brand kit colors.
      css = css.split('#1e3a8a').join(brandPrimary).split('#dbeafe').join(brandSoft);
      s.textContent = css;
      document.head.appendChild(s);
    }

    // ---- Atomic state appliers ----
    function applyAll() {
      var doc = document.documentElement;
      // Clear all our classes first
      var classes = doc.className.split(' ').filter(function (c) { return c.indexOf('lov-a11y-') !== 0; });
      doc.className = classes.join(' ');

      if (state.contrast === 'hc') doc.classList.add('lov-a11y-hc');
      else if (state.contrast === 'dark') doc.classList.add('lov-a11y-dark');
      else if (state.contrast === 'light') doc.classList.add('lov-a11y-light');

      if (state.saturation === 'low') doc.classList.add('lov-a11y-sat-low');
      else if (state.saturation === 'high') doc.classList.add('lov-a11y-sat-high');
      else if (state.saturation === 'mono') doc.classList.add('lov-a11y-mono');

      if (state.font_step) doc.classList.add('lov-a11y-fs-' + state.font_step);
      if (state.reduced_motion) doc.classList.add('lov-a11y-rm');
      if (state.stop_animations) doc.classList.add('lov-a11y-stop-anim');
      if (state.spacing) doc.classList.add('lov-a11y-sp');
      if (state.letter_spacing) doc.classList.add('lov-a11y-ls');
      if (state.line_height) doc.classList.add('lov-a11y-lh');
      if (state.font_weight) doc.classList.add('lov-a11y-fw');
      if (state.highlight_links) doc.classList.add('lov-a11y-hl');
      if (state.highlight_titles) doc.classList.add('lov-a11y-ht');
      if (state.dyslexia) {
        doc.classList.add('lov-a11y-dyslexic');
        loadDyslexicFont();
      }
      if (state.hide_images) doc.classList.add('lov-a11y-hide-img');
      if (state.big_cursor === 'black') doc.classList.add('lov-a11y-cursor-big-black');
      else if (state.big_cursor === 'white') doc.classList.add('lov-a11y-cursor-big-white');
      if (state.focus_outline) doc.classList.add('lov-a11y-focus');

      toggleReadingMask(!!state.reading_mask);
      toggleReadingGuide(!!state.reading_guide);
    }

    function loadDyslexicFont() {
      if (document.getElementById('lov-a11y-dyslexic-font')) return;
      var l = document.createElement('link');
      l.id = 'lov-a11y-dyslexic-font';
      l.rel = 'stylesheet';
      l.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.css';
      document.head.appendChild(l);
    }

    // ---- Reading mask / guide ----
    var maskTop, maskBot, guide, mouseHandler;
    function toggleReadingMask(on) {
      if (on) {
        if (!maskTop) {
          maskTop = document.createElement('div'); maskTop.id = 'lov-a11y-mask-top';
          maskBot = document.createElement('div'); maskBot.id = 'lov-a11y-mask-bot';
          document.body.appendChild(maskTop); document.body.appendChild(maskBot);
        }
        attachMouse();
      } else {
        if (maskTop) { maskTop.remove(); maskBot.remove(); maskTop = maskBot = null; }
        if (!state.reading_guide) detachMouse();
      }
    }
    function toggleReadingGuide(on) {
      if (on) {
        if (!guide) { guide = document.createElement('div'); guide.id = 'lov-a11y-guide'; document.body.appendChild(guide); }
        attachMouse();
      } else {
        if (guide) { guide.remove(); guide = null; }
        if (!state.reading_mask) detachMouse();
      }
    }
    function attachMouse() {
      if (mouseHandler) return;
      mouseHandler = function (e) {
        var y = e.clientY;
        if (maskTop) { maskTop.style.top = '0'; maskTop.style.height = Math.max(0, y - 60) + 'px'; }
        if (maskBot) { maskBot.style.top = (y + 60) + 'px'; maskBot.style.bottom = '0'; maskBot.style.height = 'auto'; }
        if (guide) { guide.style.top = (y - 18) + 'px'; }
      };
      document.addEventListener('pointermove', mouseHandler);
    }
    function detachMouse() {
      if (mouseHandler) { document.removeEventListener('pointermove', mouseHandler); mouseHandler = null; }
    }

    // ---- Profiles (bundles) ----
    var PROFILES = {
      seizure: { reduced_motion: true, stop_animations: true, saturation: 'low' },
      vision: { font_step: 3, contrast: 'hc', spacing: true, highlight_links: true },
      adhd: { reading_mask: true, reduced_motion: true, highlight_titles: true },
      cognitive: { highlight_links: true, font_step: 2, dyslexia: true, line_height: true },
      keyboard: { focus_outline: true, highlight_links: true },
      blind: { font_step: 4, contrast: 'hc', focus_outline: true, highlight_titles: true },
    };
    function applyProfile(key) {
      // Toggle: if already on, clear it
      var current = state.profile;
      if (current === key) {
        state = { profile: null };
      } else {
        state = Object.assign({ profile: key }, PROFILES[key]);
      }
      saveState(state);
      applyAll();
      rebuild();
    }

    // ---- Builders ----
    var panel;
    function rebuild() {
      if (!panel) return;
      var open = panel.classList.contains('open');
      var oversize = panel.classList.contains('oversize');
      panel.innerHTML = '';
      build(window._lovA11yFeatures || {});
      if (open) panel.classList.add('open');
      if (oversize) panel.classList.add('oversize');
    }

    function tile(label, icon, isOn, onClick) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lov-a11y-tile' + (isOn ? ' on' : '');
      b.setAttribute('aria-pressed', String(!!isOn));
      var i = document.createElement('span'); i.className = 'lov-a11y-tile-icon'; i.textContent = icon;
      var t = document.createElement('span'); t.textContent = label;
      b.appendChild(i); b.appendChild(t);
      b.addEventListener('click', onClick);
      return b;
    }

    function section(title, body) {
      var sec = document.createElement('div'); sec.className = 'lov-a11y-section';
      if (title) { var h = document.createElement('h4'); h.textContent = title; sec.appendChild(h); }
      sec.appendChild(body);
      return sec;
    }

    function buildHeader() {
      var head = document.createElement('div'); head.className = 'lov-a11y-head';
      var h3 = document.createElement('h3'); h3.textContent = 'Accessibility Menu';
      var actions = document.createElement('div'); actions.className = 'lov-a11y-head-actions';

      var darkBtn = document.createElement('button');
      darkBtn.className = 'lov-a11y-icon-btn' + (state.contrast === 'dark' ? ' on' : '');
      darkBtn.title = 'Dark mode'; darkBtn.innerHTML = '☾';
      darkBtn.onclick = function () { state.contrast = state.contrast === 'dark' ? null : 'dark'; saveState(state); applyAll(); rebuild(); };

      var hideImgBtn = document.createElement('button');
      hideImgBtn.className = 'lov-a11y-icon-btn' + (state.hide_images ? ' on' : '');
      hideImgBtn.title = 'Hide images'; hideImgBtn.innerHTML = '⊘';
      hideImgBtn.onclick = function () { state.hide_images = !state.hide_images; saveState(state); applyAll(); rebuild(); };

      var closeBtn = document.createElement('button');
      closeBtn.className = 'lov-a11y-icon-btn'; closeBtn.title = 'Close'; closeBtn.innerHTML = '✕';
      closeBtn.onclick = function () { panel.classList.remove('open'); };

      actions.appendChild(darkBtn); actions.appendChild(hideImgBtn); actions.appendChild(closeBtn);
      head.appendChild(h3); head.appendChild(actions);
      return head;
    }

    function buildUtils(features, statementUrl) {
      var utils = document.createElement('div'); utils.className = 'lov-a11y-utils';
      if (features.report_issue !== false) {
        var rep = document.createElement('button'); rep.className = 'lov-a11y-util-btn'; rep.textContent = 'Report an issue';
        rep.onclick = openReportModal;
        utils.appendChild(rep);
      }
      if (features.language_selector !== false) {
        var lang = document.createElement('button'); lang.className = 'lov-a11y-util-btn'; lang.textContent = '🌐 Translate';
        lang.onclick = openTranslate;
        utils.appendChild(lang);
      }
      if (features.oversize_widget !== false) {
        var os = document.createElement('button'); os.className = 'lov-a11y-util-btn' + (panel.classList.contains('oversize') ? ' on' : ''); os.textContent = '⤢ Oversize';
        os.onclick = function () { panel.classList.toggle('oversize'); state.oversize = panel.classList.contains('oversize'); saveState(state); };
        utils.appendChild(os);
      }
      return utils;
    }

    function buildProfiles() {
      var grid = document.createElement('div'); grid.className = 'lov-a11y-grid';
      var defs = [
        ['seizure', 'Seizure Safe', '⚡'],
        ['vision', 'Vision Impaired', '👁'],
        ['adhd', 'ADHD Friendly', '🎯'],
        ['cognitive', 'Cognitive', '🧠'],
        ['keyboard', 'Keyboard Nav', '⌨'],
        ['blind', 'Low Vision', '🔍'],
      ];
      defs.forEach(function (d) {
        grid.appendChild(tile(d[1], d[2], state.profile === d[0], function () { applyProfile(d[0]); }));
      });
      return section('Accessibility Profiles', grid);
    }

    function buildContent(features) {
      var wrap = document.createElement('div');

      // Font size slider
      if (features.font_scaling !== false) {
        var slLabel = document.createElement('div'); slLabel.className = 'lov-a11y-slider-label';
        slLabel.innerHTML = '<span>Font size</span><span>' + (100 + (state.font_step || 0) * 20) + '%</span>';
        wrap.appendChild(slLabel);
        var sl = document.createElement('div'); sl.className = 'lov-a11y-slider';
        var dec = document.createElement('button'); dec.textContent = '◀';
        var track = document.createElement('div'); track.className = 'lov-a11y-slider-track';
        for (var i = 1; i <= 5; i++) {
          var st = document.createElement('div'); st.className = 'lov-a11y-step' + ((state.font_step || 0) >= i ? ' on' : '');
          track.appendChild(st);
        }
        var inc = document.createElement('button'); inc.textContent = '▶';
        dec.onclick = function () { state.font_step = Math.max(0, (state.font_step || 0) - 1); saveState(state); applyAll(); rebuild(); };
        inc.onclick = function () { state.font_step = Math.min(5, (state.font_step || 0) + 1); saveState(state); applyAll(); rebuild(); };
        sl.appendChild(dec); sl.appendChild(track); sl.appendChild(inc);
        wrap.appendChild(sl);
      }

      var grid = document.createElement('div'); grid.className = 'lov-a11y-grid three';
      var toggles = [
        ['highlight_titles', 'Highlight Titles', 'T', features.font_scaling !== false],
        ['highlight_links', 'Highlight Links', '🔗', features.highlight_links !== false],
        ['dyslexia', 'Dyslexia Font', 'Dx', features.dyslexia_font !== false],
        ['letter_spacing', 'Letter Spacing', '↔', features.letter_spacing !== false],
        ['line_height', 'Line Height', '☰', features.line_height !== false],
        ['font_weight', 'Font Weight', 'B', features.font_weight_adj !== false],
      ];
      toggles.forEach(function (t) {
        if (!t[3]) return;
        grid.appendChild(tile(t[1], t[2], !!state[t[0]], function () { state[t[0]] = !state[t[0]]; saveState(state); applyAll(); rebuild(); }));
      });
      wrap.appendChild(grid);
      return section('Content Adjustments', wrap);
    }

    function buildColor(features) {
      var wrap = document.createElement('div');
      var grid = document.createElement('div'); grid.className = 'lov-a11y-grid three';

      // Contrast cycle
      if (features.high_contrast !== false) {
        var contrastModes = [null, 'dark', 'light', 'hc'];
        var cur = state.contrast || null;
        grid.appendChild(tile('Contrast', '◐', !!cur, function () {
          var idx = contrastModes.indexOf(cur);
          state.contrast = contrastModes[(idx + 1) % contrastModes.length];
          saveState(state); applyAll(); rebuild();
        }));
      }
      if (features.saturation_adj !== false) {
        var satModes = [null, 'low', 'high'];
        var curS = state.saturation === 'mono' ? null : state.saturation;
        grid.appendChild(tile('Saturation', '🎨', satModes.indexOf(curS) > 0, function () {
          var idx = satModes.indexOf(curS);
          state.saturation = satModes[(idx + 1) % satModes.length];
          saveState(state); applyAll(); rebuild();
        }));
      }
      if (features.monochrome !== false) {
        grid.appendChild(tile('Monochrome', '◑', state.saturation === 'mono', function () {
          state.saturation = state.saturation === 'mono' ? null : 'mono';
          saveState(state); applyAll(); rebuild();
        }));
      }
      wrap.appendChild(grid);
      return section('Color Adjustments', wrap);
    }

    function buildOrientation(features) {
      var grid = document.createElement('div'); grid.className = 'lov-a11y-grid';
      var items = [
        ['reading_mask', 'Reading Mask', '▭', features.reading_mask !== false],
        ['reading_guide', 'Reading Guide', '━', features.reading_guide !== false],
        ['stop_animations', 'Stop Animations', '⏸', features.stop_animations !== false],
        ['reduced_motion', 'Reduce Motion', '🐢', features.reduced_motion !== false],
        ['focus_outline', 'Focus Outline', '⊡', true],
        ['spacing', 'More Spacing', '⇲', features.spacing !== false],
      ];
      items.forEach(function (t) {
        if (!t[3]) return;
        grid.appendChild(tile(t[1], t[2], !!state[t[0]], function () { state[t[0]] = !state[t[0]]; saveState(state); applyAll(); rebuild(); }));
      });

      // Big cursor cycle
      if (features.big_cursor !== false) {
        grid.appendChild(tile('Big Cursor', '➤', !!state.big_cursor, function () {
          var modes = [null, 'black', 'white'];
          var idx = modes.indexOf(state.big_cursor || null);
          state.big_cursor = modes[(idx + 1) % modes.length];
          saveState(state); applyAll(); rebuild();
        }));
      }
      return section('Orientation & Navigation', grid);
    }

    function buildFooter(statementUrl) {
      var foot = document.createElement('div'); foot.className = 'lov-a11y-foot';
      var row = document.createElement('div'); row.className = 'lov-a11y-foot-row';
      var reset = document.createElement('button'); reset.textContent = 'Reset all';
      reset.onclick = function () { state = {}; saveState(state); applyAll(); rebuild(); };
      row.appendChild(reset);
      if (statementUrl) {
        var stmt = document.createElement('a'); stmt.textContent = 'Accessibility Statement'; stmt.href = statementUrl; stmt.target = '_blank'; stmt.rel = 'noopener';
        row.appendChild(stmt);
      }
      foot.appendChild(row);
      var brand = document.createElement('div'); brand.className = 'lov-a11y-foot-brand'; brand.textContent = 'Accessibility by Causeio';
      foot.appendChild(brand);
      return foot;
    }

    // ---- Translate ----
    function openTranslate() {
      if (document.getElementById('google_translate_element')) {
        document.getElementById('google_translate_element').scrollIntoView({ behavior: 'smooth' });
        return;
      }
      var div = document.createElement('div'); div.id = 'google_translate_element';
      div.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#fff;padding:8px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.2)';
      document.body.appendChild(div);
      window.googleTranslateElementInit = function () {
        new window.google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
      };
      var s = document.createElement('script');
      s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.head.appendChild(s);
    }

    // ---- Report issue modal ----
    function openReportModal() {
      var modal = document.createElement('div'); modal.className = 'lov-a11y-modal';
      var card = document.createElement('div'); card.className = 'lov-a11y-modal-card';
      card.innerHTML = '<h3>Report an accessibility issue</h3>' +
        '<label>Your name (optional)</label><input id="lov-a11y-name" type="text" />' +
        '<label>Email (optional)</label><input id="lov-a11y-email" type="email" />' +
        '<label>What\'s the issue?</label><textarea id="lov-a11y-msg" required></textarea>' +
        '<div class="lov-a11y-modal-actions">' +
        '<button type="button" id="lov-a11y-cancel">Cancel</button>' +
        '<button type="button" class="primary" id="lov-a11y-send">Send</button>' +
        '</div>';
      modal.appendChild(card);
      modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
      document.body.appendChild(modal);
      card.querySelector('#lov-a11y-cancel').onclick = function () { modal.remove(); };
      card.querySelector('#lov-a11y-send').onclick = function () {
        var msg = card.querySelector('#lov-a11y-msg').value.trim();
        if (!msg) { card.querySelector('#lov-a11y-msg').focus(); return; }
        var sendBtn = card.querySelector('#lov-a11y-send');
        sendBtn.disabled = true; sendBtn.textContent = 'Sending…';
        fetch(feedbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site: siteId,
            name: card.querySelector('#lov-a11y-name').value.trim(),
            email: card.querySelector('#lov-a11y-email').value.trim(),
            message: msg,
            page_url: location.href,
            user_agent: navigator.userAgent,
          }),
        }).then(function () {
          card.innerHTML = '<h3>Thanks!</h3><p style="font-size:13px;color:#374151">Your report has been sent. We appreciate your help.</p><div class="lov-a11y-modal-actions"><button type="button" class="primary" id="lov-a11y-close">Close</button></div>';
          card.querySelector('#lov-a11y-close').onclick = function () { modal.remove(); };
        }).catch(function () {
          sendBtn.disabled = false; sendBtn.textContent = 'Send';
          alert('Could not send report. Please try again.');
        });
      };
    }

    // ---- Build full panel ----
    function build(features) {
      window._lovA11yFeatures = features;
      injectStyles();
      panel.appendChild(buildHeader());
      var statementUrl = window._lovA11yStatementUrl || null;
      panel.appendChild(buildUtils(features, statementUrl));
      var body = document.createElement('div'); body.className = 'lov-a11y-body';
      if (features.profiles_enabled !== false) body.appendChild(buildProfiles());
      body.appendChild(buildContent(features));
      body.appendChild(buildColor(features));
      body.appendChild(buildOrientation(features));
      panel.appendChild(body);
      panel.appendChild(buildFooter(statementUrl));
    }

    function init() {
      fetch(configUrl).then(function (r) { return r.json(); }).then(function (cfg) {
        if (!cfg || cfg.active === false) return;
        if (!attrPosition && cfg.position && (cfg.position === 'left' || cfg.position === 'center' || cfg.position === 'right')) {
          position = cfg.position;
        }
        var features = cfg.features || {};
        window._lovA11yStatementUrl = cfg.statementUrl || null;
        window._lovA11yBrand = cfg.brand || null;

        function start() {
          injectStyles();
          var btn = document.createElement('button');
          btn.className = 'lov-a11y-launcher';
          btn.setAttribute('aria-label', 'Open accessibility menu');
          btn.innerHTML = '♿';
          panel = document.createElement('div');
          panel.className = 'lov-a11y-panel';
          panel.setAttribute('role', 'dialog');
          panel.setAttribute('aria-label', 'Accessibility options');
          if (state.oversize) panel.classList.add('oversize');
          build(features);
          btn.addEventListener('click', function () { panel.classList.toggle('open'); });
          document.body.appendChild(btn);
          document.body.appendChild(panel);
          applyAll();
        }
        if (document.body) start();
        else document.addEventListener('DOMContentLoaded', start);
      }).catch(function () {});
    }
    init();
  } catch (e) { /* fail silently */ }
})();
