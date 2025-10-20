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

  // Supabase storage URL for widget files
  var WIDGET_BASE_URL = 'https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting';

  // Load widget styles
  var widgetStyles = document.createElement('link');
  widgetStyles.rel = 'stylesheet';
  widgetStyles.href = WIDGET_BASE_URL + '/widget.css';
  widgetStyles.onerror = function() {
    console.error('Causeio Widget: Failed to load styles');
  };
  document.head.appendChild(widgetStyles);

  // Load the widget bundle
  var widgetScript = document.createElement('script');
  widgetScript.src = WIDGET_BASE_URL + '/widget.umd.js';
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
