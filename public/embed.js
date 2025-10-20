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

  // Load CSS
  var cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = baseUrl + '/widget/widget.css';
  document.head.appendChild(cssLink);

  // Load JavaScript
  var script = document.createElement('script');
  script.src = baseUrl + '/widget/widget.umd.js';
  script.async = true;

  script.onload = function() {
    window.__CAUSEIO_WIDGET_LOADED__ = true;
    window.__CAUSEIO_WIDGET_LOADING__ = false;

    // Initialize widget
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
  };

  script.onerror = function() {
    window.__CAUSEIO_WIDGET_LOADING__ = false;
    console.error('Causeio Widget: Failed to load widget script');
  };

  document.head.appendChild(script);
})();
