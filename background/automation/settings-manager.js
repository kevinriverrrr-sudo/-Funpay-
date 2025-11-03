class SettingsManager {
  async exportSettings() {
    const syncData = await chrome.storage.sync.get(null);
    const localData = await chrome.storage.local.get([
      'pendingMessages',
      'automationStats',
      'lastCheckedReviews'
    ]);

    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      settings: syncData,
      automation: {
        pendingMessages: localData.pendingMessages || [],
        stats: localData.automationStats || {},
        lastCheckedReviews: localData.lastCheckedReviews || {}
      }
    };

    return exportData;
  }

  async importSettings(data, options = {}) {
    const {
      includeThemes = true,
      includeAutomation = true,
      includeStats = false,
      clearExisting = false
    } = options;

    if (clearExisting) {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
    }

    const results = {
      success: true,
      imported: [],
      skipped: [],
      errors: []
    };

    if (includeThemes && data.settings) {
      try {
        const themeSettings = {
          theme: data.settings.theme,
          customTheme: data.settings.customTheme,
          font: data.settings.font,
          fontSize: data.settings.fontSize,
          coverImage: data.settings.coverImage,
          coverPosition: data.settings.coverPosition,
          coverSize: data.settings.coverSize
        };

        await chrome.storage.sync.set(themeSettings);
        results.imported.push('themes');
      } catch (error) {
        results.errors.push({ type: 'themes', error: error.message });
      }
    }

    if (includeAutomation && data.settings && data.settings.automation) {
      try {
        await chrome.storage.sync.set({ automation: data.settings.automation });
        results.imported.push('automation-config');
      } catch (error) {
        results.errors.push({ type: 'automation', error: error.message });
      }
    }

    if (includeAutomation && data.automation) {
      try {
        if (data.automation.pendingMessages) {
          await chrome.storage.local.set({ 
            pendingMessages: data.automation.pendingMessages 
          });
          results.imported.push('pending-messages');
        }

        if (includeStats && data.automation.stats) {
          await chrome.storage.local.set({ 
            automationStats: data.automation.stats 
          });
          results.imported.push('stats');
        }

        if (data.automation.lastCheckedReviews) {
          await chrome.storage.local.set({ 
            lastCheckedReviews: data.automation.lastCheckedReviews 
          });
          results.imported.push('review-history');
        }
      } catch (error) {
        results.errors.push({ type: 'automation-data', error: error.message });
      }
    }

    if (results.errors.length > 0) {
      results.success = false;
    }

    return results;
  }

  async migrateSettings() {
    const currentVersion = await this.getCurrentVersion();
    
    if (currentVersion === null) {
      await this.initializeDefaults();
      await this.setVersion('1.0.0');
      return { migrated: true, from: null, to: '1.0.0' };
    }

    return { migrated: false, from: currentVersion, to: currentVersion };
  }

  async initializeDefaults() {
    const defaults = {
      automation: {
        enabled: false,
        templates: [],
        reviewTemplates: [
          {
            id: 'positive-review-thanks',
            name: 'Благодарность за положительный отзыв',
            enabled: true,
            content: 'Спасибо за ваш отзыв! Рад, что вам понравилось. Буду рад видеть вас снова! 😊',
            delayMinutes: 5,
            ratingFilter: [5, 4],
            keywordFilter: [],
            oneResponsePerReview: true
          },
          {
            id: 'negative-review-response',
            name: 'Ответ на негативный отзыв',
            enabled: false,
            content: 'Извините, что у вас возникли проблемы. Я постараюсь исправить ситуацию. Пожалуйста, напишите мне в личные сообщения.',
            delayMinutes: 10,
            ratingFilter: [1, 2],
            keywordFilter: [],
            oneResponsePerReview: true
          }
        ],
        rateLimitPerContact: 3,
        rateLimitPeriodMinutes: 60,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        manualOverrideEnabled: true,
        delayMinutes: 5,
        escalationEnabled: false,
        escalationDelayHours: 24,
        showNotifications: true
      }
    };

    const existing = await chrome.storage.sync.get('automation');
    if (!existing.automation) {
      await chrome.storage.sync.set(defaults);
    }
  }

  async getCurrentVersion() {
    const data = await chrome.storage.local.get('settingsVersion');
    return data.settingsVersion || null;
  }

  async setVersion(version) {
    await chrome.storage.local.set({ settingsVersion: version });
  }

  validateImportData(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format');
      return { valid: false, errors };
    }

    if (!data.version) {
      errors.push('Missing version information');
    }

    if (!data.settings && !data.automation) {
      errors.push('No settings or automation data found');
    }

    if (data.automation) {
      if (data.automation.pendingMessages && !Array.isArray(data.automation.pendingMessages)) {
        errors.push('Invalid pending messages format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
