import React from 'react';
import ReactDOM from 'react-dom/client';
import { StandaloneWidget } from './components/chatbot/StandaloneWidget';
import './index.css';

// Declare global window interface
declare global {
  interface Window {
    CauseioWidget: {
      init: (config: {
        chatbotId: string;
        primaryColor?: string;
        accentColor?: string;
      }) => void;
    };
  }
}

// Expose global function for embedding
window.CauseioWidget = {
  init: (config) => {
    // Prevent double initialization
    if (document.getElementById('causeio-widget-root')) {
      console.warn('Causeio widget already initialized');
      return;
    }

    // Create container
    const container = document.createElement('div');
    container.id = 'causeio-widget-root';
    container.style.position = 'fixed';
    container.style.zIndex = '999999';
    document.body.appendChild(container);

    // Render widget
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <StandaloneWidget
          chatbotId={config.chatbotId}
          primaryColor={config.primaryColor}
          accentColor={config.accentColor}
        />
      </React.StrictMode>
    );

    console.log('Causeio widget initialized:', config.chatbotId);
  },
};

// Auto-initialize if script has data attributes
const currentScript = document.currentScript as HTMLScriptElement;
if (currentScript && currentScript.hasAttribute('data-chatbot-id')) {
  window.CauseioWidget.init({
    chatbotId: currentScript.getAttribute('data-chatbot-id')!,
    primaryColor: currentScript.getAttribute('data-primary-color') || undefined,
    accentColor: currentScript.getAttribute('data-accent-color') || undefined,
  });
}
