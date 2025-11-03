# API документация для разработчиков

Документация для разработчиков, желающих расширить функциональность FunPay Customizer.

## 📋 Содержание

1. [Структура данных](#структура-данных)
2. [Storage API](#storage-api)
3. [Messaging API](#messaging-api)
4. [Content Script API](#content-script-api)
5. [Добавление новых тем](#добавление-новых-тем)
6. [Добавление новых шрифтов](#добавление-новых-шрифтов)

---

## 🗂️ Структура данных

### Settings Object

Объект настроек хранится в `chrome.storage.sync`:

```javascript
{
  theme: string,              // 'default' | 'dark' | 'light' | 'blue' | 'purple' | 'custom'
  customTheme: object | null, // Объект кастомной темы (см. ниже)
  font: string,               // Название шрифта или 'default'
  fontSize: string,           // Размер шрифта в px ('12'-'20')
  coverImage: string | null,  // base64 изображение или null
  coverPosition: string,      // CSS значение background-position
  coverSize: string           // CSS значение background-size
}
```

### Custom Theme Object

Структура пользовательской темы:

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

---

## 💾 Storage API

### Получение настроек

```javascript
// Получить все настройки с дефолтными значениями
const settings = await chrome.storage.sync.get({
  theme: 'default',
  customTheme: null,
  font: 'default',
  fontSize: '14',
  coverImage: null,
  coverPosition: 'center',
  coverSize: 'cover'
});

console.log(settings);
```

### Сохранение настроек

```javascript
// Сохранить настройки
await chrome.storage.sync.set({
  theme: 'dark',
  font: 'Roboto',
  fontSize: '16'
});
```

### Обновление отдельных значений

```javascript
// Обновить только тему
await chrome.storage.sync.set({ theme: 'dark' });
```

### Слушатель изменений

```javascript
// Отслеживать изменения настроек
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    console.log('Настройки изменены:', changes);
    
    if (changes.theme) {
      console.log('Старая тема:', changes.theme.oldValue);
      console.log('Новая тема:', changes.theme.newValue);
    }
  }
});
```

---

## 📨 Messaging API

### Отправка сообщений из popup/options

```javascript
// Применить настройки ко всем вкладкам
chrome.runtime.sendMessage({
  action: 'applyToAllTabs',
  settings: settingsObject
});

// Отправить настройки конкретной вкладке
chrome.tabs.sendMessage(tabId, {
  action: 'updateSettings',
  settings: settingsObject
});
```

### Получение сообщений в content script

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    // Применить настройки
    applySettings(request.settings);
    sendResponse({ success: true });
  }
  return true; // Асинхронный ответ
});
```

---

## 🎨 Content Script API

### FunPayCustomizer Class

Основной класс для управления кастомизацией:

```javascript
class FunPayCustomizer {
  constructor() {
    this.styleElement = null;
    this.fontLinkElement = null;
    this.coverElement = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupMessageListener();
  }

  async loadSettings() {
    // Загрузить настройки из storage
  }

  applySettings(settings) {
    // Применить все настройки
  }

  applyTheme(themeName, customTheme) {
    // Применить тему
  }

  applyFont(fontFamily, fontSize) {
    // Применить шрифт
  }

  applyCover(imageData, position, size) {
    // Применить обложку
  }
}
```

### Использование класса

```javascript
// Создать экземпляр
const customizer = new FunPayCustomizer();

// Применить настройки программно
customizer.applySettings({
  theme: 'dark',
  font: 'Roboto',
  fontSize: '16',
  coverImage: null,
  coverPosition: 'center',
  coverSize: 'cover'
});
```

---

## 🎨 Добавление новых тем

### Шаг 1: Добавить в preset-themes.json

```javascript
// assets/themes/preset-themes.json
{
  "themes": [
    // ... существующие темы
    {
      "id": "my-theme",
      "name": "Моя тема",
      "description": "Описание моей темы",
      "colors": {
        "bgPrimary": "#1a1a2e",
        "bgSecondary": "#16213e",
        "bgTertiary": "#0f3460",
        "textPrimary": "#e8e8e8",
        "textSecondary": "#a8a8a8",
        "borderColor": "#0f3460",
        "linkColor": "#e94560",
        "linkHover": "#ff6b6b"
      }
    }
  ]
}
```

### Шаг 2: Добавить CSS в content.js

```javascript
// content/content.js - метод getPresetTheme()
getPresetTheme(themeName) {
  const themes = {
    // ... существующие темы
    'my-theme': `
      :root {
        --bg-primary: #1a1a2e;
        --bg-secondary: #16213e;
        --bg-tertiary: #0f3460;
        --text-primary: #e8e8e8;
        --text-secondary: #a8a8a8;
        --border-color: #0f3460;
        --link-color: #e94560;
        --link-hover: #ff6b6b;
      }
      
      body {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
      }
      
      /* ... остальные стили */
    `
  };

  return themes[themeName] || themes.default;
}
```

### Шаг 3: Добавить в popup.html

```html
<!-- popup/popup.html -->
<select id="theme-select">
  <!-- ... существующие опции -->
  <option value="my-theme">Моя тема</option>
</select>
```

### Шаг 4: Добавить в options.html

```html
<!-- options/options.html -->
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

### Шаг 5: Добавить CSS для превью

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

### Шаг 1: Добавить в available-fonts.json

```javascript
// assets/fonts/available-fonts.json
{
  "fonts": [
    // ... существующие шрифты
    {
      "name": "My Font",
      "family": "My Font",
      "category": "sans-serif",
      "description": "Описание моего шрифта"
    }
  ]
}
```

### Шаг 2: Добавить в popup.html

```html
<!-- popup/popup.html -->
<select id="font-select">
  <!-- ... существующие опции -->
  <option value="My Font">My Font</option>
</select>
```

### Шаг 3: Добавить в options.html

```html
<!-- options/options.html -->
<select id="font-family">
  <!-- ... существующие опции -->
  <option value="My Font">My Font</option>
</select>
```

**Примечание**: Шрифт должен быть доступен в Google Fonts, либо нужно добавить локальный шрифт в `assets/fonts/`.

---

## 🛠️ Утилиты для разработчиков

### Получение текущей темы

```javascript
const settings = await chrome.storage.sync.get(['theme']);
console.log('Текущая тема:', settings.theme);
```

### Экспорт настроек

```javascript
const settings = await chrome.storage.sync.get(null);
const json = JSON.stringify(settings, null, 2);
console.log(json);
// Или сохранить в файл
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
```

### Импорт настроек

```javascript
const settings = JSON.parse(jsonString);
await chrome.storage.sync.set(settings);
```

### Сброс к дефолтным настройкам

```javascript
const defaultSettings = {
  theme: 'default',
  customTheme: null,
  font: 'default',
  fontSize: '14',
  coverImage: null,
  coverPosition: 'center',
  coverSize: 'cover'
};

await chrome.storage.sync.set(defaultSettings);
```

---

## 🔍 Отладка

### Включение консоли для content script

1. Откройте DevTools на странице FunPay
2. Перейдите на вкладку Console
3. Добавьте `console.log` в content.js для отладки

### Проверка storage

```javascript
// В консоли DevTools
chrome.storage.sync.get(null, (items) => {
  console.log('Все настройки:', items);
});
```

### Мониторинг сообщений

```javascript
// В background.js добавить
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Получено сообщение:', request);
  console.log('От отправителя:', sender);
});
```

---

## 📚 Дополнительные ресурсы

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [MDN Web Extensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

**Удачи в разработке!** 🚀
