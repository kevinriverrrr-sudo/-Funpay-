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
      coverSize: 'cover',
      automationSchedules: [],
      automationEnabled: true,
      notificationsEnabled: true
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

  if (request.action === 'createSchedule') {
    createAutomationSchedule(request.schedule).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'deleteSchedule') {
    deleteAutomationSchedule(request.scheduleId).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'pauseSchedule') {
    pauseAutomationSchedule(request.scheduleId, request.paused).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'executeLotAction') {
    executeLotAction(request.actionType, request.targetState).then(results => {
      sendResponse(results);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('lot-automation-')) {
    const scheduleId = alarm.name.replace('lot-automation-', '');
    await handleScheduledTask(scheduleId);
  }
});

async function createAutomationSchedule(schedule) {
  const data = await chrome.storage.sync.get('automationSchedules');
  const schedules = data.automationSchedules || [];
  
  schedule.id = schedule.id || `schedule-${Date.now()}`;
  schedule.created = Date.now();
  schedule.paused = false;
  
  schedules.push(schedule);
  await chrome.storage.sync.set({ automationSchedules: schedules });
  
  await scheduleAlarm(schedule);
}

async function deleteAutomationSchedule(scheduleId) {
  const data = await chrome.storage.sync.get('automationSchedules');
  const schedules = data.automationSchedules || [];
  
  const filteredSchedules = schedules.filter(s => s.id !== scheduleId);
  await chrome.storage.sync.set({ automationSchedules: filteredSchedules });
  
  await chrome.alarms.clear(`lot-automation-${scheduleId}`);
}

async function pauseAutomationSchedule(scheduleId, paused) {
  const data = await chrome.storage.sync.get('automationSchedules');
  const schedules = data.automationSchedules || [];
  
  const schedule = schedules.find(s => s.id === scheduleId);
  if (schedule) {
    schedule.paused = paused;
    await chrome.storage.sync.set({ automationSchedules: schedules });
    
    if (paused) {
      await chrome.alarms.clear(`lot-automation-${scheduleId}`);
    } else {
      await scheduleAlarm(schedule);
    }
  }
}

async function scheduleAlarm(schedule) {
  if (schedule.paused) return;
  
  const alarmName = `lot-automation-${schedule.id}`;
  
  if (schedule.frequency === 'once') {
    const when = new Date(schedule.datetime).getTime();
    await chrome.alarms.create(alarmName, { when });
  } else {
    const periodInMinutes = convertFrequencyToMinutes(schedule.frequency);
    await chrome.alarms.create(alarmName, {
      delayInMinutes: periodInMinutes,
      periodInMinutes: periodInMinutes
    });
  }
}

function convertFrequencyToMinutes(frequency) {
  const conversions = {
    '15min': 15,
    '30min': 30,
    '1hour': 60,
    '2hours': 120,
    '4hours': 240,
    '6hours': 360,
    '12hours': 720,
    '24hours': 1440
  };
  return conversions[frequency] || 60;
}

async function handleScheduledTask(scheduleId) {
  const data = await chrome.storage.sync.get(['automationSchedules', 'automationEnabled']);
  
  if (!data.automationEnabled) return;
  
  const schedules = data.automationSchedules || [];
  const schedule = schedules.find(s => s.id === scheduleId);
  
  if (!schedule || schedule.paused) return;
  
  const results = await executeLotAction(schedule.actionType, schedule.targetState);
  
  await showNotification(schedule, results);
  
  schedule.lastExecution = Date.now();
  schedule.executionCount = (schedule.executionCount || 0) + 1;
  await chrome.storage.sync.set({ automationSchedules: schedules });
  
  if (schedule.frequency === 'once') {
    await deleteAutomationSchedule(scheduleId);
  }
}

async function executeLotAction(actionType, targetState = null) {
  try {
    const tabs = await chrome.tabs.query({ 
      url: ['https://funpay.com/*', 'https://*.funpay.com/*'],
      active: false
    });

    let targetTab = tabs.find(tab => 
      tab.url.includes('/lots') || 
      tab.url.includes('/offers') || 
      tab.url.includes('/my/lots')
    );

    if (!targetTab) {
      targetTab = await chrome.tabs.create({
        url: 'https://funpay.com/lots/my',
        active: false
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    let response;
    if (actionType === 'lift') {
      response = await chrome.tabs.sendMessage(targetTab.id, {
        action: 'liftAllLots'
      });
    } else if (actionType === 'toggle') {
      response = await chrome.tabs.sendMessage(targetTab.id, {
        action: 'toggleAllLots',
        targetState: targetState
      });
    }

    return response || { total: 0, successful: 0, failed: 0, errors: [] };
  } catch (error) {
    return { total: 0, successful: 0, failed: 0, errors: [error.message] };
  }
}

async function showNotification(schedule, results) {
  const data = await chrome.storage.sync.get('notificationsEnabled');
  if (!data.notificationsEnabled) return;

  const actionName = schedule.actionType === 'lift' ? 'Поднятие лотов' : 'Переключение лотов';
  
  let title, message;
  if (results.successful > 0 && results.failed === 0) {
    title = `${actionName} выполнено`;
    message = `Успешно обработано: ${results.successful} из ${results.total}`;
  } else if (results.successful > 0 && results.failed > 0) {
    title = `${actionName} выполнено частично`;
    message = `Успешно: ${results.successful}, Ошибок: ${results.failed}`;
  } else {
    title = `${actionName} не выполнено`;
    message = results.errors[0] || 'Неизвестная ошибка';
  }

  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icons/icon128.png',
    title: title,
    message: message,
    priority: results.failed > 0 ? 2 : 1
  });
}
