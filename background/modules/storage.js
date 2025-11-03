function setupStorageListeners(storage, messageBus) {
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    console.log(`Storage changed in ${areaName}:`, changes);
    
    if (areaName === 'sync') {
      const settingsChanged = Object.keys(changes).some(key => 
        key === 'theme' || 
        key === 'customTheme' || 
        key === 'font' || 
        key === 'fontSize' || 
        key === 'coverImage' || 
        key === 'coverPosition' || 
        key === 'coverSize'
      );
      
      if (settingsChanged) {
        const settings = await storage.getSettingsWithDefaults();
        
        try {
          await messageBus.broadcast(MESSAGE_TYPES.SETTINGS_CHANGED, { settings });
        } catch (error) {
          console.error('Failed to broadcast settings change:', error);
        }
      }
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupStorageListeners };
}
