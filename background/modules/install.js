async function handleInstall(storage, messageBus) {
  console.log('Extension installed');
  
  await storage.initializeDefaults();
  
  try {
    await chrome.tabs.create({
      url: 'options/options.html'
    });
  } catch (error) {
    console.error('Failed to open options page:', error);
  }
  
  const settings = await storage.getSettingsWithDefaults();
  await messageBus.broadcast(MESSAGE_TYPES.SETTINGS_CHANGED, settings);
}

async function handleUpdate(details, storage, messageBus) {
  console.log(`Extension updated from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
  
  const migrated = await runMigrations(storage);
  
  if (migrated) {
    console.log('Storage migrated successfully');
    
    const settings = await storage.getSettingsWithDefaults();
    await messageBus.broadcast(MESSAGE_TYPES.STORAGE_MIGRATED, settings);
  }
}

async function setupInstallHandler(storage, messageBus) {
  chrome.runtime.onInstalled.addListener(async (details) => {
    try {
      if (details.reason === 'install') {
        await handleInstall(storage, messageBus);
      } else if (details.reason === 'update') {
        await handleUpdate(details, storage, messageBus);
      }
    } catch (error) {
      console.error('Error in install handler:', error);
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupInstallHandler, handleInstall, handleUpdate };
}
