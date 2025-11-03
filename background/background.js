// Background service worker для FunPay Customizer
importScripts('translation-service.js');

const translationService = new TranslationService();

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
    
    chrome.storage.local.set({
      translationApiEndpoint: '',
      translationApiKey: '',
      translationApiProvider: 'libretranslate',
      translationSourceLang: 'auto',
      translationTargetLang: 'en',
      autoTranslateProducts: false
    });
    
    chrome.tabs.create({
      url: 'options/options.html'
    });
  }
  
  createContextMenus();
});

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'translate-selection',
      title: 'Translate "%s"',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'translate-page',
      title: 'Translate this page',
      contexts: ['page']
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-selection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translateSelection',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'translate-page') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translatePage'
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
  } else if (request.action === 'translate') {
    translationService.translate(
      request.text,
      request.sourceLang,
      request.targetLang
    ).then(translatedText => {
      sendResponse({ success: true, translatedText });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'testTranslationConnection') {
    translationService.init().then(() => {
      return translationService.testConnection();
    }).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, message: error.message });
    });
    return true;
  } else if (request.action === 'updateTranslationSettings') {
    translationService.updateSettings(request.settings).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'clearTranslationCache') {
    translationService.clearCache();
    sendResponse({ success: true });
  } else if (request.action === 'getSupportedLanguages') {
    const languages = translationService.getSupportedLanguages(request.provider);
    sendResponse({ languages });
  }
  return true;
});
