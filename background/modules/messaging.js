async function setupMessageHandlers(storage, messageBus) {
  messageBus.on(MESSAGE_TYPES.APPLY_TO_ALL_TABS, async (payload) => {
    const { settings } = payload;
    
    await storage.set(settings, true);
    
    const results = await messageBus.broadcast(MESSAGE_TYPES.UPDATE_SETTINGS, { settings });
    
    return { success: true, results };
  });

  messageBus.on(MESSAGE_TYPES.GET_SETTINGS, async () => {
    const settings = await storage.getSettingsWithDefaults();
    return settings;
  });

  messageBus.on(MESSAGE_TYPES.UPDATE_SETTINGS, async (payload) => {
    const { settings } = payload;
    await storage.set(settings, true);
    return { success: true };
  });

  messageBus.on(MESSAGE_TYPES.EXPORT_SETTINGS, async () => {
    const json = await storage.exportSettings();
    return { json };
  });

  messageBus.on(MESSAGE_TYPES.IMPORT_SETTINGS, async (payload) => {
    const { json } = payload;
    const success = await storage.importSettings(json);
    
    if (success) {
      const settings = await storage.getSettingsWithDefaults();
      await messageBus.broadcast(MESSAGE_TYPES.SETTINGS_CHANGED, { settings });
    }
    
    return { success };
  });

  messageBus.on(MESSAGE_TYPES.CREATE_PROFILE, async (payload) => {
    const { name } = payload;
    const currentSettings = await storage.getSettingsWithDefaults();
    
    const profiles = currentSettings.accountProfiles || [];
    const newProfile = {
      id: Date.now().toString(),
      name,
      settings: {
        theme: currentSettings.theme,
        customTheme: currentSettings.customTheme,
        font: currentSettings.font,
        fontSize: currentSettings.fontSize,
        coverImage: currentSettings.coverImage,
        coverPosition: currentSettings.coverPosition,
        coverSize: currentSettings.coverSize,
      },
      createdAt: new Date().toISOString(),
    };
    
    profiles.push(newProfile);
    await storage.set({ accountProfiles: profiles }, false);
    
    return { profile: newProfile };
  });

  messageBus.on(MESSAGE_TYPES.SWITCH_PROFILE, async (payload) => {
    const { profileId } = payload;
    const settings = await storage.getSettingsWithDefaults();
    
    const profiles = settings.accountProfiles || [];
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    await storage.set(profile.settings, true);
    await storage.set({ activeProfile: profileId }, false);
    
    await messageBus.broadcast(MESSAGE_TYPES.SETTINGS_CHANGED, { settings: profile.settings });
    
    return { success: true };
  });

  messageBus.on(MESSAGE_TYPES.DELETE_PROFILE, async (payload) => {
    const { profileId } = payload;
    const settings = await storage.getSettingsWithDefaults();
    
    const profiles = settings.accountProfiles || [];
    const filtered = profiles.filter(p => p.id !== profileId);
    
    await storage.set({ accountProfiles: filtered }, false);
    
    if (settings.activeProfile === profileId) {
      await storage.set({ activeProfile: null }, false);
    }
    
    return { success: true };
  });

  messageBus.on(MESSAGE_TYPES.SAVE_TEMPLATE, async (payload) => {
    const { name, content } = payload;
    const settings = await storage.getSettingsWithDefaults();
    
    const templates = settings.templates || [];
    const newTemplate = {
      id: Date.now().toString(),
      name,
      content,
      createdAt: new Date().toISOString(),
    };
    
    templates.push(newTemplate);
    await storage.set({ templates }, false);
    
    return { template: newTemplate };
  });

  messageBus.on(MESSAGE_TYPES.DELETE_TEMPLATE, async (payload) => {
    const { templateId } = payload;
    const settings = await storage.getSettingsWithDefaults();
    
    const templates = settings.templates || [];
    const filtered = templates.filter(t => t.id !== templateId);
    
    await storage.set({ templates: filtered }, false);
    
    return { success: true };
  });

  messageBus.on(MESSAGE_TYPES.SCHEDULE_AUTOMATION, async (payload) => {
    const { schedule } = payload;
    const settings = await storage.getSettingsWithDefaults();
    
    const schedules = settings.automationSchedules || [];
    const newSchedule = {
      id: Date.now().toString(),
      ...schedule,
      createdAt: new Date().toISOString(),
    };
    
    schedules.push(newSchedule);
    await storage.set({ automationSchedules: schedules }, false);
    
    if (schedule.type === 'alarm') {
      await chrome.alarms.create(`automation-${newSchedule.id}`, {
        when: schedule.when || Date.now() + 60000,
        periodInMinutes: schedule.periodInMinutes
      });
    }
    
    return { schedule: newSchedule };
  });

  messageBus.on(MESSAGE_TYPES.CANCEL_AUTOMATION, async (payload) => {
    const { scheduleId } = payload;
    const settings = await storage.getSettingsWithDefaults();
    
    const schedules = settings.automationSchedules || [];
    const filtered = schedules.filter(s => s.id !== scheduleId);
    
    await storage.set({ automationSchedules: filtered }, false);
    
    try {
      await chrome.alarms.clear(`automation-${scheduleId}`);
    } catch (error) {
      console.error('Failed to clear alarm:', error);
    }
    
    return { success: true };
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupMessageHandlers };
}
