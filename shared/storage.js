class StorageManager {
  constructor() {
    this.storageVersion = STORAGE_VERSION;
  }

  async get(keys, useSync = true) {
    const storage = useSync ? chrome.storage.sync : chrome.storage.local;
    
    if (typeof keys === 'string') {
      const result = await storage.get(keys);
      return result[keys];
    }
    
    if (Array.isArray(keys)) {
      return await storage.get(keys);
    }
    
    if (typeof keys === 'object') {
      return await storage.get(keys);
    }
    
    return await storage.get(null);
  }

  async set(items, useSync = true) {
    const storage = useSync ? chrome.storage.sync : chrome.storage.local;
    return await storage.set(items);
  }

  async remove(keys, useSync = true) {
    const storage = useSync ? chrome.storage.sync : chrome.storage.local;
    return await storage.remove(keys);
  }

  async clear(useSync = true) {
    const storage = useSync ? chrome.storage.sync : chrome.storage.local;
    return await storage.clear();
  }

  async getVersion() {
    const result = await this.get(STORAGE_KEYS.VERSION, false);
    return result || 0;
  }

  async setVersion(version) {
    return await this.set({ [STORAGE_KEYS.VERSION]: version }, false);
  }

  async getAllSettings() {
    const syncData = await this.get(null, true);
    const localData = await this.get(null, false);
    return { ...localData, ...syncData };
  }

  async getSettingsWithDefaults() {
    const settings = await this.getAllSettings();
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  async initializeDefaults() {
    const currentVersion = await this.getVersion();
    
    if (currentVersion === 0) {
      const syncSettings = {};
      const localSettings = { [STORAGE_KEYS.VERSION]: STORAGE_VERSION };
      
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (key === STORAGE_KEYS.VERSION) continue;
        
        if (key.startsWith('analytics') || 
            key.startsWith('automation') || 
            key === STORAGE_KEYS.FEATURES.ACCOUNT_PROFILES ||
            key === STORAGE_KEYS.FEATURES.ACTIVE_PROFILE) {
          localSettings[key] = value;
        } else {
          syncSettings[key] = value;
        }
      }
      
      await this.set(syncSettings, true);
      await this.set(localSettings, false);
      
      return true;
    }
    
    return false;
  }

  async exportSettings() {
    const settings = await this.getAllSettings();
    const exportData = {
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      settings: settings
    };
    return JSON.stringify(exportData, null, 2);
  }

  async importSettings(jsonString) {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.settings) {
        throw new Error('Invalid import format');
      }
      
      const syncSettings = {};
      const localSettings = {};
      
      for (const [key, value] of Object.entries(importData.settings)) {
        if (key === STORAGE_KEYS.VERSION) {
          localSettings[key] = value;
        } else if (key.startsWith('analytics') || 
                   key.startsWith('automation') || 
                   key === STORAGE_KEYS.FEATURES.ACCOUNT_PROFILES ||
                   key === STORAGE_KEYS.FEATURES.ACTIVE_PROFILE) {
          localSettings[key] = value;
        } else {
          syncSettings[key] = value;
        }
      }
      
      await this.set(syncSettings, true);
      await this.set(localSettings, false);
      
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  onChange(callback, useSync = true) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      const targetArea = useSync ? 'sync' : 'local';
      if (areaName === targetArea) {
        callback(changes);
      }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
