// Background service worker для FunPay Customizer

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      theme: 'default',
      customTheme: null,
      font: 'default',
      fontSize: '14',
      coverImage: null,
      coverPosition: 'center',
      coverSize: 'cover'
    });
    
    chrome.tabs.create({
      url: 'options/options.html'
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'applyToAllTabs') {
    chrome.tabs.query({ url: ['https://funpay.com/*', 'https://*.funpay.com/*'] }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateSettings',
          settings: request.settings
        }).catch(() => {
          // Игнорируем ошибки для табов, где content script еще не загружен
        });
      });
    });
    sendResponse({ success: true });
  }
  return true;
});
