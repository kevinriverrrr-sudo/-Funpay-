const STORAGE_VERSION = 1;

const STORAGE_KEYS = {
  VERSION: 'storageVersion',
  SETTINGS: {
    THEME: 'theme',
    CUSTOM_THEME: 'customTheme',
    FONT: 'font',
    FONT_SIZE: 'fontSize',
    COVER_IMAGE: 'coverImage',
    COVER_POSITION: 'coverPosition',
    COVER_SIZE: 'coverSize',
  },
  FEATURES: {
    ANALYTICS_ENABLED: 'analyticsEnabled',
    ANALYTICS_TRACKING_ID: 'analyticsTrackingId',
    LOT_TOOLS_ENABLED: 'lotToolsEnabled',
    TEMPLATES_ENABLED: 'templatesEnabled',
    TEMPLATES: 'templates',
    AUTOMATION_ENABLED: 'automationEnabled',
    AUTOMATION_SCHEDULES: 'automationSchedules',
    VISUAL_TOGGLES: 'visualToggles',
    ACCOUNT_PROFILES: 'accountProfiles',
    ACTIVE_PROFILE: 'activeProfile',
  }
};

const DEFAULT_SETTINGS = {
  [STORAGE_KEYS.VERSION]: STORAGE_VERSION,
  [STORAGE_KEYS.SETTINGS.THEME]: 'default',
  [STORAGE_KEYS.SETTINGS.CUSTOM_THEME]: null,
  [STORAGE_KEYS.SETTINGS.FONT]: 'default',
  [STORAGE_KEYS.SETTINGS.FONT_SIZE]: '14',
  [STORAGE_KEYS.SETTINGS.COVER_IMAGE]: null,
  [STORAGE_KEYS.SETTINGS.COVER_POSITION]: 'center',
  [STORAGE_KEYS.SETTINGS.COVER_SIZE]: 'cover',
  [STORAGE_KEYS.FEATURES.ANALYTICS_ENABLED]: false,
  [STORAGE_KEYS.FEATURES.ANALYTICS_TRACKING_ID]: null,
  [STORAGE_KEYS.FEATURES.LOT_TOOLS_ENABLED]: false,
  [STORAGE_KEYS.FEATURES.TEMPLATES_ENABLED]: false,
  [STORAGE_KEYS.FEATURES.TEMPLATES]: [],
  [STORAGE_KEYS.FEATURES.AUTOMATION_ENABLED]: false,
  [STORAGE_KEYS.FEATURES.AUTOMATION_SCHEDULES]: [],
  [STORAGE_KEYS.FEATURES.VISUAL_TOGGLES]: {},
  [STORAGE_KEYS.FEATURES.ACCOUNT_PROFILES]: [],
  [STORAGE_KEYS.FEATURES.ACTIVE_PROFILE]: null,
};

const MESSAGE_TYPES = {
  APPLY_TO_ALL_TABS: 'applyToAllTabs',
  UPDATE_SETTINGS: 'updateSettings',
  GET_SETTINGS: 'getSettings',
  SETTINGS_CHANGED: 'settingsChanged',
  STORAGE_MIGRATED: 'storageMigrated',
  EXPORT_SETTINGS: 'exportSettings',
  IMPORT_SETTINGS: 'importSettings',
  CREATE_PROFILE: 'createProfile',
  SWITCH_PROFILE: 'switchProfile',
  DELETE_PROFILE: 'deleteProfile',
  SAVE_TEMPLATE: 'saveTemplate',
  DELETE_TEMPLATE: 'deleteTemplate',
  SCHEDULE_AUTOMATION: 'scheduleAutomation',
  CANCEL_AUTOMATION: 'cancelAutomation',
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORAGE_VERSION,
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    MESSAGE_TYPES,
  };
}
