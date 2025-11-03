const DEFAULT_SETTINGS = {
  customization: {
    theme: 'default',
    customTheme: null,
    font: 'default',
    fontSize: '14',
    coverImage: null,
    coverPosition: 'center',
    coverSize: 'cover'
  },
  marketAnalytics: {
    analyticsOverlay: false,
    analyticsRefreshInterval: 60,
    analyticsAutoUpdate: true,
    priceTracking: false,
    competitorAnalysis: false
  },
  lots: {
    lotTools: false,
    lotSorting: 'default',
    lotFiltering: false,
    lotNotifications: false,
    quickEdit: false
  },
  automation: {
    autoresponder: false,
    autoresponderMessage: 'Здравствуйте! Я отвечу вам в ближайшее время.',
    autoresponderDelay: 5,
    autoRefresh: false,
    autoRefreshInterval: 300
  },
  chat: {
    chatEnhancements: false,
    chatTemplates: [],
    chatNotifications: true,
    messageHistory: true,
    quickReplies: false
  },
  translation: {
    autoTranslate: false,
    translationLang: 'en',
    translationProvider: 'google',
    detectLanguage: true
  },
  visual: {
    visualEffects: false,
    animations: true,
    compactMode: false,
    customCSS: '',
    darkMode: false
  },
  utilities: {
    quickActions: false,
    shortcuts: true,
    exportData: false,
    clipboard: true
  },
  accounts: {
    multiAccount: false,
    accountSwitching: false,
    savedAccounts: []
  }
};

const StorageHelper = {
  async getSettings(section = null) {
    try {
      if (section) {
        const data = await chrome.storage.sync.get(section);
        return data[section] || DEFAULT_SETTINGS[section];
      }
      
      const data = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
      const settings = {};
      
      for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        settings[key] = data[key] || defaultValue;
      }
      
      return settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return section ? DEFAULT_SETTINGS[section] : DEFAULT_SETTINGS;
    }
  },

  async saveSettings(section, settings) {
    try {
      await chrome.storage.sync.set({ [section]: settings });
      return { success: true };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { success: false, error: error.message };
    }
  },

  async saveAllSettings(settings) {
    try {
      await chrome.storage.sync.set(settings);
      return { success: true };
    } catch (error) {
      console.error('Error saving all settings:', error);
      return { success: false, error: error.message };
    }
  },

  async resetSettings(section = null) {
    try {
      if (section) {
        await chrome.storage.sync.set({ [section]: DEFAULT_SETTINGS[section] });
      } else {
        await chrome.storage.sync.set(DEFAULT_SETTINGS);
      }
      return { success: true };
    } catch (error) {
      console.error('Error resetting settings:', error);
      return { success: false, error: error.message };
    }
  },

  async exportSettings() {
    try {
      const settings = await this.getSettings();
      const dataStr = JSON.stringify(settings, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `funpay-customizer-settings-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting settings:', error);
      return { success: false, error: error.message };
    }
  },

  async importSettings(file) {
    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      await chrome.storage.sync.set(settings);
      return { success: true };
    } catch (error) {
      console.error('Error importing settings:', error);
      return { success: false, error: error.message };
    }
  },

  getDefaults(section = null) {
    return section ? DEFAULT_SETTINGS[section] : DEFAULT_SETTINGS;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageHelper;
}
