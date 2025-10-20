(function() {
  'use strict';

  // Get the current script tag
  var currentScript = document.currentScript;
  if (!currentScript) {
    console.error('Causeio Widget: Could not find script tag');
    return;
  }

  // Get configuration from data attributes
  var chatbotId = currentScript.getAttribute('data-chatbot-id');
  var primaryColor = currentScript.getAttribute('data-primary-color');
  var accentColor = currentScript.getAttribute('data-accent-color');

  if (!chatbotId) {
    console.error('Causeio Widget: data-chatbot-id is required');
    return;
  }

  // Prevent double initialization
  if (window.__CAUSEIO_WIDGET_LOADING__ || window.__CAUSEIO_WIDGET_LOADED__) {
    console.warn('Causeio Widget: Already loading or loaded');
    return;
  }
  window.__CAUSEIO_WIDGET_LOADING__ = true;

  // Get the base URL from the script src
  var scriptSrc = currentScript.src;
  var baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

  // Version from embed query string for cache-busting
  var versionQuery = scriptSrc.indexOf('?') !== -1 ? scriptSrc.substring(scriptSrc.indexOf('?')) : '';

  // Load CSS (non-blocking)
  var cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = baseUrl + '/widget/widget.css' + versionQuery;
  document.head.appendChild(cssLink);

  // Ensure process shim for UMD bundles that expect process.env
  (function ensureProcessShim(){
    try {
      if (typeof window.process === 'undefined') {
        window.process = { env: { NODE_ENV: 'production' } };
      } else {
        window.process.env = window.process.env || {};
        window.process.env.NODE_ENV = window.process.env.NODE_ENV || 'production';
      }
    } catch (e) {}
  })();

  function initWidget() {
    if (window.CauseioWidget && window.CauseioWidget.init) {
      try {
        window.CauseioWidget.init({
          chatbotId: chatbotId,
          primaryColor: primaryColor || undefined,
          accentColor: accentColor || undefined
        });
        console.log('Causeio Widget initialized successfully');
      } catch (error) {
        console.error('Causeio Widget: Initialization error', error);
      }
    } else {
      console.error('Causeio Widget: CauseioWidget.init not found');
    }
  }

  // Load UMD build first
  var script = document.createElement('script');
  script.src = baseUrl + '/widget/widget.umd.js' + versionQuery;
  script.async = true;

  script.onload = function() {
    window.__CAUSEIO_WIDGET_LOADED__ = true;
    window.__CAUSEIO_WIDGET_LOADING__ = false;
    initWidget();
  };

  function loadDevFallback() {
    var isPreview = /lovable(project|\.app)/.test(location.hostname);
    if (!isPreview) return; // Only attempt in Lovable previews
    var mod = document.createElement('script');
    mod.type = 'module';
    // Import the Vite dev entry directly so window.CauseioWidget becomes available
    mod.textContent = "import '/src/widget-entry.tsx';";
    mod.onload = function(){ setTimeout(initWidget, 0); };
    document.head.appendChild(mod);
  }

  script.onerror = function() {
    window.__CAUSEIO_WIDGET_LOADING__ = false;
    console.error('Causeio Widget: Failed to load widget script');
    loadDevFallback();
  };

  document.head.appendChild(script);
})();
