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

  // Load widget styles
  var widgetStyles = document.createElement('link');
  widgetStyles.rel = 'stylesheet';
  widgetStyles.href = WIDGET_BASE_URL + '/widget.css?v=' + timestamp;
  widgetStyles.onerror = function() {
    console.error('Causeio Widget: Failed to load styles from', widgetStyles.href);
  };
  document.head.appendChild(widgetStyles);

  // Load the widget bundle
  var widgetScript = document.createElement('script');
  widgetScript.src = WIDGET_BASE_URL + '/widget.umd.js?v=' + timestamp;
  widgetScript.async = true;
  
  widgetScript.onload = function() {
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
  };
  
  widgetScript.onerror = function() {
    console.error('Causeio Widget: Failed to load widget script');
  };

  document.head.appendChild(widgetScript);
})();
