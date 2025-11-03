importScripts(
  'automation/autoresponder.js',
  'automation/review-monitor.js',
  'automation/settings-manager.js'
);

const autoResponderManager = new AutoResponderManager();
const reviewMonitor = new ReviewMonitor(autoResponderManager);
const settingsManager = new SettingsManager();

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set({
      theme: 'default',
      customTheme: null,
      font: 'default',
      fontSize: '14',
      coverImage: null,
      coverPosition: 'center',
      coverSize: 'cover'
    });

    await settingsManager.migrateSettings();
    
    chrome.tabs.create({
      url: 'options/options.html'
    });
  } else if (details.reason === 'update') {
    await settingsManager.migrateSettings();
  }

  await autoResponderManager.initialize();
  await autoResponderManager.loadPendingMessages();
  await reviewMonitor.initialize();
});

chrome.runtime.onStartup.addListener(async () => {
  await autoResponderManager.initialize();
  await autoResponderManager.loadPendingMessages();
  await reviewMonitor.initialize();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkPendingMessages') {
    await autoResponderManager.processPendingMessages();
  } else if (alarm.name === 'checkReviews') {
    await reviewMonitor.checkForNewReviews();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'applyToAllTabs') {
        const tabs = await chrome.tabs.query({ 
          url: ['https://funpay.com/*', 'https://*.funpay.com/*'] 
        });
        
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              action: 'updateSettings',
              settings: request.settings
            });
          } catch (error) {
            console.error(`Error updating tab ${tab.id}:`, error);
          }
        }
        
        sendResponse({ success: true });
      }
      
      else if (request.action === 'getAutomationConfig') {
        const config = await autoResponderManager.getConfig();
        sendResponse({ success: true, config });
      }
      
      else if (request.action === 'setAutomationConfig') {
        await autoResponderManager.setConfig(request.config);
        sendResponse({ success: true });
      }
      
      else if (request.action === 'scheduleFollowUp') {
        const result = await autoResponderManager.scheduleFollowUp(
          request.contactId,
          request.templateId,
          request.delayMinutes
        );
        sendResponse(result);
      }
      
      else if (request.action === 'scheduleDelayedResponse') {
        const result = await autoResponderManager.scheduleDelayedResponse(
          request.contactId,
          request.templateId,
          request.delayMinutes
        );
        sendResponse(result);
      }
      
      else if (request.action === 'scheduleEscalation') {
        const result = await autoResponderManager.scheduleEscalation(
          request.contactId,
          request.templateId,
          request.delayHours
        );
        sendResponse(result);
      }
      
      else if (request.action === 'cancelMessage') {
        const result = await autoResponderManager.cancelMessage(request.messageId);
        sendResponse(result);
      }
      
      else if (request.action === 'getPendingMessages') {
        const messages = await autoResponderManager.getPendingMessages();
        sendResponse({ success: true, messages });
      }
      
      else if (request.action === 'getAutomationStats') {
        const stats = await autoResponderManager.getStats();
        sendResponse({ success: true, stats });
      }
      
      else if (request.action === 'exportSettings') {
        const data = await settingsManager.exportSettings();
        sendResponse({ success: true, data });
      }
      
      else if (request.action === 'importSettings') {
        const result = await settingsManager.importSettings(
          request.data,
          request.options
        );
        sendResponse(result);
      }
      
      else if (request.action === 'validateImportData') {
        const validation = settingsManager.validateImportData(request.data);
        sendResponse({ success: true, validation });
      }
      
      else if (request.action === 'clearReviewHistory') {
        await reviewMonitor.clearHistory();
        sendResponse({ success: true });
      }
      
      else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true;
});

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({
    url: 'https://funpay.com/'
  });
});
