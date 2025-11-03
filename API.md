# API документация для разработчиков

Документация для разработчиков, желающих расширить функциональность FunPay Customizer.

## 📋 Содержание

1. [Архитектура](#архитектура)
2. [Структура данных](#структура-данных)
3. [Storage API](#storage-api)
4. [Messaging API](#messaging-api)
5. [Content Script API](#content-script-api)
6. [Модули Background Service Worker](#модули-background-service-worker)
7. [Миграции и версионирование](#миграции-и-версионирование)
8. [Разрешения манифеста](#разрешения-манифеста)
9. [Добавление новых тем](#добавление-новых-тем)
10. [Добавление новых шрифтов](#добавление-новых-шрифтов)

---

## 🏗️ Архитектура

### Модульная структура

Расширение построено на модульной MV3 архитектуре:

```
FunPay Customizer/
├── shared/                    # Общие утилиты и константы
│   ├── constants.js          # Константы (MESSAGE_TYPES, STORAGE_KEYS, DEFAULT_SETTINGS)
│   ├── storage.js            # StorageManager - управление хранилищем
│   ├── messaging.js          # MessageBus - система обмена сообщениями
│   └── dom.js                # DOMHelpers - вспомогательные функции для DOM
├── background/               # Background service worker
│   ├── index.js             # Главный файл service worker
│   └── modules/             # Модули background worker
│       ├── install.js       # Обработка установки/обновления
│       ├── messaging.js     # Обработчики сообщений
│       ├── storage.js       # Слушатели изменений storage
│       └── migrations.js    # Миграции версий хранилища
├── content/                 # Content scripts
│   └── content-new.js      # Скрипт внедрения стилей (использует MessageBus)
├── popup/                   # Popup UI
│   └── popup-new.js        # Логика popup (использует MessageBus)
└── options/                 # Options page
    └── options.js          # Логика настроек (использует MessageBus)
```

### Основные компоненты

**StorageManager** - Унифицированное управление chrome.storage.sync и chrome.storage.local с поддержкой версионирования.

**MessageBus** - Абстракция для обмена сообщениями между компонентами расширения (popup, options, background, content).

**DOMHelpers** - Утилиты для работы с DOM в content scripts.

---

## 🗂️ Структура данных

### Storage Schema v1

Настройки хранятся в двух областях:

#### chrome.storage.sync (синхронизируемые настройки)

```javascript
{
  theme: string,              // 'default' | 'dark' | 'light' | 'blue' | 'purple' | 'custom'
  customTheme: object | null, // Объект кастомной темы
  font: string,               // Название шрифта или 'default'
  fontSize: string,           // Размер шрифта в px ('12'-'20')
  coverImage: string | null,  // base64 изображение или null
  coverPosition: string,      // CSS значение background-position
  coverSize: string,          // CSS значение background-size
  lotToolsEnabled: boolean,   // Включены ли инструменты для лотов
  templatesEnabled: boolean,  // Включены ли шаблоны
  visualToggles: object       // Настройки визуальных переключателей
}
```

#### chrome.storage.local (локальные настройки)

```javascript
{
  storageVersion: number,           // Версия схемы хранилища
  analyticsEnabled: boolean,        // Включена ли аналитика
  analyticsTrackingId: string,      // ID отслеживания
  templates: array,                 // Сохранённые шаблоны
  automationEnabled: boolean,       // Включена ли автоматизация
  automationSchedules: array,       // Расписания автоматизации
  accountProfiles: array,           // Профили аккаунтов
  activeProfile: string | null      // ID активного профиля
}
```

### Custom Theme Object

```javascript
{
  bgPrimary: string,     // Hex цвет основного фона
  bgSecondary: string,   // Hex цвет вторичного фона
  bgTertiary: string,    // Hex цвет третичного фона
  textPrimary: string,   // Hex цвет основного текста
  textSecondary: string, // Hex цвет вторичного текста
  borderColor: string,   // Hex цвет границ
  linkColor: string,     // Hex цвет ссылок
  linkHover: string      // Hex цвет ссылок при наведении
}
```

### Profile Object

```javascript
{
  id: string,            // Уникальный ID профиля
  name: string,          // Название профиля
  settings: object,      // Настройки профиля (theme, font, etc.)
  createdAt: string      // ISO timestamp создания
}
```

### Template Object

```javascript
{
  id: string,            // Уникальный ID шаблона
  name: string,          // Название шаблона
  content: string,       // Содержимое шаблона
  createdAt: string      // ISO timestamp создания
}
```

### Automation Schedule Object

```javascript
{
  id: string,            // Уникальный ID расписания
  type: string,          // Тип расписания ('alarm' | 'interval')
  when: number,          // Timestamp для разового запуска
  periodInMinutes: number, // Период в минутах для повторяющихся
  action: {
    type: string,        // Тип действия (MESSAGE_TYPE)
    payload: object      // Данные для действия
  },
  createdAt: string      // ISO timestamp создания
}
```

---

## 💾 Storage API

### StorageManager Class

```javascript
const storage = new StorageManager();

// Получить настройки (useSync=true для sync, false для local)
const settings = await storage.get(['theme', 'font'], true);

// Получить с дефолтными значениями
const settings = await storage.get({
  theme: 'default',
  font: 'default'
}, true);

// Сохранить настройки
await storage.set({ theme: 'dark' }, true);

// Удалить настройки
await storage.remove(['theme'], true);

// Очистить хранилище
await storage.clear(true);

// Получить версию схемы
const version = await storage.getVersion();

// Установить версию
await storage.setVersion(1);

// Получить все настройки (sync + local)
const allSettings = await storage.getAllSettings();

// Получить настройки с дефолтами
const settings = await storage.getSettingsWithDefaults();

// Инициализировать дефолтные настройки
await storage.initializeDefaults();

// Экспорт настроек в JSON
const json = await storage.exportSettings();

// Импорт настроек из JSON
const success = await storage.importSettings(jsonString);

// Слушатель изменений
storage.onChange((changes) => {
  console.log('Settings changed:', changes);
}, true); // true для sync, false для local
```

---

## 📨 Messaging API

### MessageBus Class

MessageBus предоставляет унифицированный API для обмена сообщениями между всеми компонентами расширения.

#### Инициализация

```javascript
const messageBus = new MessageBus();
```

#### Регистрация обработчиков

```javascript
// Регистрация синхронного обработчика
messageBus.on(MESSAGE_TYPES.GET_SETTINGS, (payload, sender) => {
  return { theme: 'dark' };
});

// Регистрация асинхронного обработчика
messageBus.on(MESSAGE_TYPES.UPDATE_SETTINGS, async (payload, sender) => {
  await storage.set(payload.settings, true);
  return { success: true };
});

// Удаление обработчика
messageBus.off(MESSAGE_TYPES.GET_SETTINGS);
```

#### Отправка сообщений

```javascript
// Отправить в background
const result = await messageBus.sendToBackground(MESSAGE_TYPES.GET_SETTINGS);

// Отправить на конкретную вкладку
const result = await messageBus.sendToTab(tabId, MESSAGE_TYPES.UPDATE_SETTINGS, {
  settings: { theme: 'dark' }
});

// Broadcast всем вкладкам FunPay
const results = await messageBus.broadcast(MESSAGE_TYPES.SETTINGS_CHANGED, {
  settings: { theme: 'dark' }
});
```

#### Типы сообщений

```javascript
MESSAGE_TYPES = {
  APPLY_TO_ALL_TABS: 'applyToAllTabs',         // Применить настройки ко всем вкладкам
  UPDATE_SETTINGS: 'updateSettings',            // Обновить настройки
  GET_SETTINGS: 'getSettings',                  // Получить настройки
  SETTINGS_CHANGED: 'settingsChanged',          // Настройки изменены
  STORAGE_MIGRATED: 'storageMigrated',          // Хранилище мигрировано
  EXPORT_SETTINGS: 'exportSettings',            // Экспорт настроек
  IMPORT_SETTINGS: 'importSettings',            // Импорт настроек
  CREATE_PROFILE: 'createProfile',              // Создать профиль
  SWITCH_PROFILE: 'switchProfile',              // Переключить профиль
  DELETE_PROFILE: 'deleteProfile',              // Удалить профиль
  SAVE_TEMPLATE: 'saveTemplate',                // Сохранить шаблон
  DELETE_TEMPLATE: 'deleteTemplate',            // Удалить шаблон
  SCHEDULE_AUTOMATION: 'scheduleAutomation',    // Запланировать автоматизацию
  CANCEL_AUTOMATION: 'cancelAutomation'         // Отменить автоматизацию
}
```

#### Примеры использования

```javascript
// В popup/options: Применить настройки
await messageBus.sendToBackground(MESSAGE_TYPES.APPLY_TO_ALL_TABS, {
  settings: { theme: 'dark', font: 'Roboto' }
});

// В content script: Получить настройки
const settings = await messageBus.sendToBackground(MESSAGE_TYPES.GET_SETTINGS);

// В background: Создать профиль
messageBus.on(MESSAGE_TYPES.CREATE_PROFILE, async (payload) => {
  const { name } = payload;
  const profile = {
    id: Date.now().toString(),
    name,
    settings: await storage.getSettingsWithDefaults(),
    createdAt: new Date().toISOString()
  };
  
  const profiles = await storage.get('accountProfiles', false) || [];
  profiles.push(profile);
  await storage.set({ accountProfiles: profiles }, false);
  
  return { profile };
});
```

---

## 🎨 Content Script API

### FunPayCustomizer Class

```javascript
class FunPayCustomizer {
  async init()                      // Инициализация
  async loadSettings()              // Загрузка настроек
  applySettings(settings)           // Применение настроек
  applyTheme(themeName, customTheme) // Применение темы
  applyFont(fontFamily, fontSize)   // Применение шрифта
  applyCover(imageData, position, size) // Применение обложки
  setupMessageListener()            // Настройка слушателей
}
```

### DOMHelpers Utilities

```javascript
// Создать элемент
const div = DOMHelpers.createElement('div', {
  class: 'my-class',
  style: { color: 'red' },
  onClick: () => console.log('clicked')
}, ['Child text']);

// Создать/обновить style элемент
DOMHelpers.createStyleElement('my-styles', 'body { color: red; }');

// Удалить style элемент
DOMHelpers.removeStyleElement('my-styles');

// Ждать появления элемента
const element = await DOMHelpers.waitForElement('.my-selector', 5000);

// Выполнить после загрузки DOM
DOMHelpers.onReady(() => {
  console.log('DOM ready');
});

// Инжектировать CSS
DOMHelpers.injectCSS('body { color: red; }', 'my-id');

// Показать/скрыть элементы
DOMHelpers.show('.my-selector');
DOMHelpers.hide('.my-selector');

// Добавить/удалить классы
DOMHelpers.addClass('.my-selector', 'active');
DOMHelpers.removeClass('.my-selector', 'active');
```

---

## 🔧 Модули Background Service Worker

### install.js

Обрабатывает установку и обновление расширения.

```javascript
// Автоматически вызывается при установке
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Инициализация дефолтных настроек
    // Открытие страницы опций
  } else if (details.reason === 'update') {
    // Запуск миграций
  }
});
```

### messaging.js

Регистрирует обработчики всех типов сообщений.

```javascript
setupMessageHandlers(storage, messageBus);

// Обрабатывает:
// - APPLY_TO_ALL_TABS
// - GET_SETTINGS
// - UPDATE_SETTINGS
// - EXPORT_SETTINGS
// - IMPORT_SETTINGS
// - CREATE_PROFILE
// - SWITCH_PROFILE
// - DELETE_PROFILE
// - SAVE_TEMPLATE
// - DELETE_TEMPLATE
// - SCHEDULE_AUTOMATION
// - CANCEL_AUTOMATION
```

### storage.js

Настраивает слушателей изменений хранилища.

```javascript
setupStorageListeners(storage, messageBus);

// Автоматически транслирует изменения настроек на все вкладки
```

### migrations.js

Содержит логику миграций между версиями схемы хранилища.

```javascript
// Запуск миграций
const migrated = await runMigrations(storage);

// Миграции индексируются по версии
migrations[0] = async (storage) => {
  // Миграция из версии 0 в версию 1
};
```

---

## 🔄 Миграции и версионирование

### Система версионирования

Текущая версия схемы: **v1**

Версия хранится в `chrome.storage.local` под ключом `storageVersion`.

### Создание новой миграции

При изменении структуры хранилища:

1. Увеличьте `STORAGE_VERSION` в `shared/constants.js`
2. Добавьте миграцию в `background/modules/migrations.js`:

```javascript
migrations[1] = async (storage) => {
  console.log('Running migration from version 1 to 2');
  
  // Получить текущие данные
  const settings = await storage.getAllSettings();
  
  // Трансформировать данные
  const newSettings = {
    ...settings,
    newField: 'defaultValue'
  };
  
  // Сохранить обновлённые данные
  await storage.set(newSettings, true);
  
  console.log('Migration to version 2 completed');
  return true;
};
```

3. Миграция автоматически запустится при обновлении расширения

### Триггеры миграций

Миграции запускаются:
- При обновлении расширения (`chrome.runtime.onInstalled`, reason='update')
- При инициализации background worker (если версия устарела)

---

## 🔐 Разрешения манифеста

### Текущие разрешения

```json
{
  "permissions": [
    "storage",        // Доступ к chrome.storage API
    "activeTab",      // Доступ к активной вкладке
    "tabs",           // Доступ к информации о вкладках
    "alarms",         // Планирование задач
    "notifications",  // Системные уведомления
    "contextMenus",   // Контекстные меню
    "scripting"       // Динамическое внедрение скриптов
  ],
  "host_permissions": [
    "https://funpay.com/*",
    "https://*.funpay.com/*"
  ]
}
```

### Rationale (обоснование)

- **storage** - Хранение пользовательских настроек и профилей
- **activeTab** - Применение стилей к текущей активной вкладке FunPay
- **tabs** - Применение настроек ко всем открытым вкладкам FunPay
- **alarms** - Планирование автоматических действий (будущая функциональность)
- **notifications** - Уведомления о важных событиях (будущая функциональность)
- **contextMenus** - Контекстное меню для быстрого доступа (будущая функциональность)
- **scripting** - Динамическое внедрение функций (будущая функциональность)

### Добавление нового разрешения

При добавлении нового разрешения в `manifest.json`:

1. Добавьте разрешение в массив `permissions` или `host_permissions`
2. Обновите эту документацию с обоснованием
3. Обновите README.md, упомянув новое разрешение

---

## 🎨 Добавление новых тем

### Шаг 1: Добавить CSS в content-new.js

```javascript
getPresetTheme(themeName) {
  const themes = {
    // ... существующие темы
    'my-theme': `
      :root {
        --bg-primary: #1a1a2e;
        --bg-secondary: #16213e;
        // ... остальные CSS переменные
      }
      
      body {
        background-color: var(--bg-primary) !important;
        // ... остальные стили
      }
    `
  };
  
  return themes[themeName] || themes.default;
}
```

### Шаг 2: Добавить в popup.html

```html
<select id="theme-select">
  <!-- ... существующие опции -->
  <option value="my-theme">Моя тема</option>
</select>
```

### Шаг 3: Добавить в options.html

```html
<div class="theme-card" data-theme="my-theme">
  <div class="theme-preview my-theme-preview">
    <div class="preview-header"></div>
    <div class="preview-content"></div>
  </div>
  <h3>Моя тема</h3>
  <p>Описание моей темы</p>
  <button class="btn btn-outline select-theme">Выбрать</button>
</div>
```

### Шаг 4: Добавить CSS для превью

```css
/* options/options.css */
.my-theme-preview {
  background: #1a1a2e;
}

.my-theme-preview .preview-header {
  background: #16213e;
  border-bottom-color: #0f3460;
}
```

---

## 🔤 Добавление новых шрифтов

### Шаг 1: Добавить в popup.html

```html
<select id="font-select">
  <!-- ... существующие опции -->
  <option value="My Font">My Font</option>
</select>
```

### Шаг 2: Добавить в options.html

```html
<select id="font-family">
  <!-- ... существующие опции -->
  <option value="My Font">My Font</option>
</select>
```

**Примечание**: Шрифт должен быть доступен в Google Fonts. Загрузка происходит автоматически через Google Fonts API.

---

## 🛠️ Утилиты для разработчиков

### Экспорт/Импорт настроек

```javascript
// Экспорт
const json = await messageBus.sendToBackground(MESSAGE_TYPES.EXPORT_SETTINGS);
console.log(json);

// Импорт
await messageBus.sendToBackground(MESSAGE_TYPES.IMPORT_SETTINGS, { json });
```

### Работа с профилями

```javascript
// Создать профиль
const result = await messageBus.sendToBackground(MESSAGE_TYPES.CREATE_PROFILE, {
  name: 'Мой профиль'
});

// Переключить профиль
await messageBus.sendToBackground(MESSAGE_TYPES.SWITCH_PROFILE, {
  profileId: result.profile.id
});

// Удалить профиль
await messageBus.sendToBackground(MESSAGE_TYPES.DELETE_PROFILE, {
  profileId: result.profile.id
});
```

### Работа с шаблонами

```javascript
// Сохранить шаблон
const result = await messageBus.sendToBackground(MESSAGE_TYPES.SAVE_TEMPLATE, {
  name: 'Мой шаблон',
  content: 'Содержимое шаблона'
});

// Удалить шаблон
await messageBus.sendToBackground(MESSAGE_TYPES.DELETE_TEMPLATE, {
  templateId: result.template.id
});
```

### Работа с автоматизацией

```javascript
// Запланировать действие
const result = await messageBus.sendToBackground(MESSAGE_TYPES.SCHEDULE_AUTOMATION, {
  schedule: {
    type: 'alarm',
    when: Date.now() + 60000, // Через 1 минуту
    action: {
      type: MESSAGE_TYPES.UPDATE_SETTINGS,
      payload: { settings: { theme: 'dark' } }
    }
  }
});

// Отменить автоматизацию
await messageBus.sendToBackground(MESSAGE_TYPES.CANCEL_AUTOMATION, {
  scheduleId: result.schedule.id
});
```

---

## 🔍 Отладка

### Console Logging

```javascript
// В background service worker
console.log('[Background]', 'Message:', data);

// В content script
console.log('[Content]', 'Settings applied:', settings);

// В popup/options
console.log('[Popup]', 'Button clicked');
```

### Проверка storage

```javascript
// В консоли DevTools
const storage = new StorageManager();
const allSettings = await storage.getAllSettings();
console.log('All settings:', allSettings);
```

### Мониторинг сообщений

```javascript
// В background service worker
const originalHandler = messageBus.handleMessage;
messageBus.handleMessage = function(message, sender, sendResponse) {
  console.log('[MessageBus] Received:', message, 'from:', sender);
  return originalHandler.call(this, message, sender, sendResponse);
};
```

---

## 📚 Дополнительные ресурсы

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [MDN Web Extensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome Runtime API](https://developer.chrome.com/docs/extensions/reference/runtime/)

---

**Удачи в разработке!** 🚀
