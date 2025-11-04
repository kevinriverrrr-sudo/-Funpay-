const migrations = {
  0: async (storage) => {
    console.log('Running migration from version 0 to 1');
    
    const syncData = await chrome.storage.sync.get(null);
    const localData = await chrome.storage.local.get(null);
    
    const migratedSync = {};
    const migratedLocal = { storageVersion: 1 };
    
    if (syncData.theme !== undefined) {
      migratedSync.theme = syncData.theme;
    } else {
      migratedSync.theme = DEFAULT_SETTINGS.theme;
    }
    
    if (syncData.customTheme !== undefined) {
      migratedSync.customTheme = syncData.customTheme;
    }
    
    if (syncData.font !== undefined) {
      migratedSync.font = syncData.font;
    } else {
      migratedSync.font = DEFAULT_SETTINGS.font;
    }
    
    if (syncData.fontSize !== undefined) {
      migratedSync.fontSize = syncData.fontSize;
    } else {
      migratedSync.fontSize = DEFAULT_SETTINGS.fontSize;
    }
    
    if (syncData.coverImage !== undefined) {
      migratedSync.coverImage = syncData.coverImage;
    }
    
    if (syncData.coverPosition !== undefined) {
      migratedSync.coverPosition = syncData.coverPosition;
    } else {
      migratedSync.coverPosition = DEFAULT_SETTINGS.coverPosition;
    }
    
    if (syncData.coverSize !== undefined) {
      migratedSync.coverSize = syncData.coverSize;
    } else {
      migratedSync.coverSize = DEFAULT_SETTINGS.coverSize;
    }
    
    migratedLocal.analyticsEnabled = DEFAULT_SETTINGS.analyticsEnabled;
    migratedLocal.analyticsTrackingId = DEFAULT_SETTINGS.analyticsTrackingId;
    migratedLocal.lotToolsEnabled = DEFAULT_SETTINGS.lotToolsEnabled;
    migratedLocal.templatesEnabled = DEFAULT_SETTINGS.templatesEnabled;
    migratedLocal.templates = DEFAULT_SETTINGS.templates;
    migratedLocal.automationEnabled = DEFAULT_SETTINGS.automationEnabled;
    migratedLocal.automationSchedules = DEFAULT_SETTINGS.automationSchedules;
    migratedLocal.visualToggles = DEFAULT_SETTINGS.visualToggles;
    migratedLocal.accountProfiles = DEFAULT_SETTINGS.accountProfiles;
    migratedLocal.activeProfile = DEFAULT_SETTINGS.activeProfile;
    
    await chrome.storage.sync.set(migratedSync);
    await chrome.storage.local.set(migratedLocal);
    
    console.log('Migration to version 1 completed');
    return true;
  }
};

async function runMigrations(storage) {
  const currentVersion = await storage.getVersion();
  console.log(`Current storage version: ${currentVersion}`);
  
  if (currentVersion >= STORAGE_VERSION) {
    console.log('Storage is up to date');
    return false;
  }
  
  console.log(`Migrating from version ${currentVersion} to ${STORAGE_VERSION}`);
  
  for (let version = currentVersion; version < STORAGE_VERSION; version++) {
    const migration = migrations[version];
    
    if (migration) {
      console.log(`Running migration for version ${version}`);
      await migration(storage);
    }
  }
  
  await storage.setVersion(STORAGE_VERSION);
  console.log('All migrations completed');
  
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { migrations, runMigrations };
}
