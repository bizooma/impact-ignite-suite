(function() {
  'use strict';
  
  // Prevent double loading
  if (window.CauseioWidgetLoader) {
    console.warn('Causeio embed script already loaded');
    return;
  }
  window.CauseioWidgetLoader = true;

  // Get config from script attributes
  var script = document.currentScript;
  if (!script) {
    // Fallback for older browsers
    var scripts = document.getElementsByTagName('script');
    script = scripts[scripts.length - 1];
  }

  var chatbotId = script.getAttribute('data-chatbot-id');
  var primaryColor = script.getAttribute('data-primary-color');
  var accentColor = script.getAttribute('data-accent-color');

  if (!chatbotId) {
    console.error('Causeio Widget: data-chatbot-id attribute is required');
    return;
  }

  // Determine the app URL from the embed script location
  var scriptSrc = script.src;
  var WIDGET_BASE_URL = scriptSrc.substring(0, scriptSrc.lastIndexOf('/')) + '/widget';
  
  console.log('Causeio Widget: Loading from', WIDGET_BASE_URL);

  // Add cache-busting timestamp
  var timestamp = Date.now();

  // Load widget assets with fallback to Supabase Storage if primary fails
  var STORAGE_BASE_URL = 'https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting';

  function loadStylesWithFallback(primaryUrl, fallbackUrl) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = primaryUrl;
    var triedFallback = false;
    link.onerror = function() {
      if (!triedFallback) {
        triedFallback = true;
        var newHref = fallbackUrl;
        console.warn('Causeio Widget: Primary styles failed, retrying from', newHref);
        link.href = newHref;
      } else {
        console.error('Causeio Widget: Failed to load styles from both sources');
      }
    };
    document.head.appendChild(link);
  }

  function loadScriptWithFallback(primaryUrl, fallbackUrl, onload) {
    var scriptEl = document.createElement('script');
    scriptEl.src = primaryUrl;
    scriptEl.async = true;
    var triedFallback = false;

    scriptEl.onload = onload;
    scriptEl.onerror = function() {
      if (!triedFallback) {
        triedFallback = true;
        var newSrc = fallbackUrl;
        console.warn('Causeio Widget: Primary script failed, retrying from', newSrc);
        // Swap to fallback and try again
        var fallbackScript = document.createElement('script');
        fallbackScript.src = newSrc;
        fallbackScript.async = true;
        fallbackScript.onload = onload;
        fallbackScript.onerror = function() {
          console.error('Causeio Widget: Failed to load widget script from both sources');
        };
        document.head.appendChild(fallbackScript);
      } else {
        console.error('Causeio Widget: Failed to load widget script');
      }
    };

    document.head.appendChild(scriptEl);
  }

  var primaryCss = WIDGET_BASE_URL + '/widget.css?v=' + timestamp;
  var fallbackCss = STORAGE_BASE_URL + '/widget.css?v=' + timestamp;
  var primaryJs = WIDGET_BASE_URL + '/widget.umd.js?v=' + timestamp;
  var fallbackJs = STORAGE_BASE_URL + '/widget.umd.js?v=' + timestamp;

  // Load widget styles (with fallback)
  loadStylesWithFallback(primaryCss, fallbackCss);

  // Load the widget bundle (with fallback)
  loadScriptWithFallback(primaryJs, fallbackJs, function() {
    // Initialize widget once loaded
    if (window.CauseioWidget && typeof window.CauseioWidget.init === 'function') {
      window.CauseioWidget.init({
        chatbotId: chatbotId,
        primaryColor: primaryColor,
        accentColor: accentColor
      });
    } else {
      console.error('Causeio Widget: Failed to initialize - CauseioWidget not found');
    }
  });

})();
