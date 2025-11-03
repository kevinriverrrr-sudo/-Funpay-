importScripts(
  '../shared/constants.js',
  '../shared/storage.js',
  '../shared/messaging.js',
  'modules/migrations.js',
  'modules/install.js',
  'modules/messaging.js',
  'modules/storage.js'
);

console.log('FunPay Customizer Background Service Worker starting...');

const storage = new StorageManager();
const messageBus = new MessageBus();

async function init() {
  try {
    console.log('Initializing background service worker...');
    
    const currentVersion = await storage.getVersion();
    console.log(`Current storage version: ${currentVersion}`);
    
    if (currentVersion > 0 && currentVersion < STORAGE_VERSION) {
      console.log('Running migrations...');
      await runMigrations(storage);
    }
    
    setupInstallHandler(storage, messageBus);
    
    await setupMessageHandlers(storage, messageBus);
    
    setupStorageListeners(storage, messageBus);
    
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name.startsWith('automation-')) {
        const scheduleId = alarm.name.replace('automation-', '');
        console.log(`Executing automation schedule: ${scheduleId}`);
        
        const settings = await storage.getSettingsWithDefaults();
        const schedules = settings.automationSchedules || [];
        const schedule = schedules.find(s => s.id === scheduleId);
        
        if (schedule && schedule.action) {
          try {
            await messageBus.broadcast(schedule.action.type, schedule.action.payload);
          } catch (error) {
            console.error('Failed to execute scheduled automation:', error);
          }
        }
      }
    });
    
    console.log('Background service worker initialized successfully');
  } catch (error) {
    console.error('Failed to initialize background service worker:', error);
  }
}

init();
