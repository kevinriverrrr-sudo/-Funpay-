class MessageBus {
  constructor() {
    this.handlers = new Map();
    this.setupListener();
  }

  setupListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      return this.handleMessage(message, sender, sendResponse);
    });
  }

  handleMessage(message, sender, sendResponse) {
    const { type, payload, requestId } = message;
    
    if (!type) {
      console.warn('Received message without type:', message);
      return false;
    }

    const handler = this.handlers.get(type);
    
    if (!handler) {
      console.warn(`No handler registered for message type: ${type}`);
      sendResponse({ success: false, error: 'No handler found' });
      return false;
    }

    const result = handler(payload, sender);
    
    if (result instanceof Promise) {
      result
        .then(data => {
          sendResponse({ success: true, data, requestId });
        })
        .catch(error => {
          console.error(`Error handling message type ${type}:`, error);
          sendResponse({ success: false, error: error.message, requestId });
        });
      return true;
    }
    
    sendResponse({ success: true, data: result, requestId });
    return false;
  }

  on(type, handler) {
    if (this.handlers.has(type)) {
      console.warn(`Handler for ${type} already exists, overwriting`);
    }
    this.handlers.set(type, handler);
  }

  off(type) {
    this.handlers.delete(type);
  }

  async send(target, type, payload = {}) {
    const requestId = this.generateRequestId();
    const message = { type, payload, requestId };

    if (target === 'background' || target === 'runtime') {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Unknown error'));
          }
        });
      });
    }

    if (typeof target === 'number') {
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(target, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Unknown error'));
          }
        });
      });
    }

    if (target === 'all-tabs') {
      const tabs = await chrome.tabs.query({ 
        url: ['https://funpay.com/*', 'https://*.funpay.com/*'] 
      });
      
      const promises = tabs.map(tab => {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id, message, (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, tabId: tab.id, error: chrome.runtime.lastError.message });
            } else {
              resolve({ success: true, tabId: tab.id, data: response?.data });
            }
          });
        });
      });
      
      return Promise.all(promises);
    }

    throw new Error(`Invalid target: ${target}`);
  }

  async broadcast(type, payload = {}) {
    return this.send('all-tabs', type, payload);
  }

  async sendToBackground(type, payload = {}) {
    return this.send('background', type, payload);
  }

  async sendToTab(tabId, type, payload = {}) {
    return this.send(tabId, type, payload);
  }

  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  createResponseHandler(sendResponse) {
    return {
      success: (data) => {
        sendResponse({ success: true, data });
      },
      error: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        sendResponse({ success: false, error: message });
      }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageBus;
}
