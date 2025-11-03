let currentSection = 'customization';
let currentSettings = {};

document.addEventListener('DOMContentLoaded', async () => {
  await initializeOptions();
  setupNavigation();
  setupActionButtons();
  await loadAllSettings();
});

async function initializeOptions() {
  showLoading(true);
  
  const sections = {
    customization: createCustomizationSection(),
    'market-analytics': createMarketAnalyticsSection(),
    lots: createLotsSection(),
    automation: createAutomationSection(),
    chat: createChatSection(),
    translation: createTranslationSection(),
    visual: createVisualSection(),
    utilities: createUtilitiesSection(),
    accounts: createAccountsSection(),
    about: createAboutSection()
  };

  const container = document.getElementById('sections-container');
  
  for (const [key, section] of Object.entries(sections)) {
    const panel = document.createElement('div');
    panel.className = 'section-panel';
    panel.dataset.section = key;
    
    if (key === 'customization') {
      panel.classList.add('active');
    }
    
    panel.appendChild(section);
    container.appendChild(panel);
  }
  
  showLoading(false);
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      switchSection(section);
    });
    
    item.addEventListener('keydown', (e) => {
      handleNavKeyboard(e, navItems);
    });
  });
}

function switchSection(section) {
  currentSection = section;
  
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.section-panel');
  
  navItems.forEach(item => {
    const isActive = item.dataset.section === section;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-selected', isActive);
    item.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  
  panels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.section === section);
  });
}

function handleNavKeyboard(e, navItems) {
  const items = Array.from(navItems);
  const currentIndex = items.indexOf(e.target);
  let nextIndex = currentIndex;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    nextIndex = (currentIndex + 1) % items.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    nextIndex = (currentIndex - 1 + items.length) % items.length;
  } else if (e.key === 'Home') {
    e.preventDefault();
    nextIndex = 0;
  } else if (e.key === 'End') {
    e.preventDefault();
    nextIndex = items.length - 1;
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.target.click();
    return;
  }
  
  if (nextIndex !== currentIndex) {
    items[nextIndex].focus();
  }
}

function setupActionButtons() {
  document.getElementById('save-all-btn').addEventListener('click', saveAllSettings);
  document.getElementById('reset-section-btn').addEventListener('click', resetCurrentSection);
  document.getElementById('export-btn').addEventListener('click', exportSettings);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', importSettings);
}

async function loadAllSettings() {
  try {
    currentSettings = await StorageHelper.getSettings();
    populateSettingsUI();
  } catch (error) {
    console.error('Error loading settings:', error);
    UIComponents.showNotification('Ошибка загрузки настроек', 'error');
  }
}

function populateSettingsUI() {
  populateCustomizationSettings();
  populateMarketAnalyticsSettings();
  populateLotsSettings();
  populateAutomationSettings();
  populateChatSettings();
  populateTranslationSettings();
  populateVisualSettings();
  populateUtilitiesSettings();
  populateAccountsSettings();
}

async function saveAllSettings() {
  showLoading(true);
  
  try {
    const result = await StorageHelper.saveAllSettings(currentSettings);
    
    if (result.success) {
      chrome.runtime.sendMessage({
        action: 'applyToAllTabs',
        settings: currentSettings
      });
      
      UIComponents.showNotification('✓ Настройки успешно сохранены!', 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    UIComponents.showNotification('✕ Ошибка сохранения настроек', 'error');
  } finally {
    showLoading(false);
  }
}

async function resetCurrentSection() {
  if (!confirm(`Вы уверены, что хотите сбросить настройки раздела "${getSectionName(currentSection)}"?`)) {
    return;
  }
  
  showLoading(true);
  
  try {
    const result = await StorageHelper.resetSettings(currentSection);
    
    if (result.success) {
      await loadAllSettings();
      UIComponents.showNotification('↺ Настройки раздела сброшены', 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error resetting settings:', error);
    UIComponents.showNotification('✕ Ошибка сброса настроек', 'error');
  } finally {
    showLoading(false);
  }
}

async function exportSettings() {
  try {
    const result = await StorageHelper.exportSettings();
    
    if (result.success) {
      UIComponents.showNotification('📤 Настройки экспортированы', 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error exporting settings:', error);
    UIComponents.showNotification('✕ Ошибка экспорта настроек', 'error');
  }
}

async function importSettings(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  showLoading(true);
  
  try {
    const result = await StorageHelper.importSettings(file);
    
    if (result.success) {
      await loadAllSettings();
      UIComponents.showNotification('📥 Настройки импортированы', 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error importing settings:', error);
    UIComponents.showNotification('✕ Ошибка импорта настроек', 'error');
  } finally {
    showLoading(false);
    e.target.value = '';
  }
}

function getSectionName(section) {
  const names = {
    customization: 'Кастомизация',
    'market-analytics': 'Аналитика рынка',
    lots: 'Управление лотами',
    automation: 'Автоматизация',
    chat: 'Чат и сообщения',
    translation: 'Перевод',
    visual: 'Визуальные эффекты',
    utilities: 'Утилиты',
    accounts: 'Аккаунты',
    about: 'О расширении'
  };
  return names[section] || section;
}

function showLoading(show) {
  const loadingOverlay = document.getElementById('loading-state');
  loadingOverlay.classList.toggle('hidden', !show);
}

function createCustomizationSection() {
  const section = document.createElement('div');
  
  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `
    <h2 class="section-title">🎨 Кастомизация</h2>
    <p class="section-description">Настройте внешний вид FunPay под свой стиль</p>
  `;
  section.appendChild(header);
  
  const themesGroup = document.createElement('div');
  themesGroup.className = 'settings-group';
  themesGroup.innerHTML = `
    <h3 class="group-title">Темы оформления</h3>
    <div class="theme-grid" id="theme-grid">
      <div class="theme-card" data-theme="default">
        <div class="theme-preview" style="background: #fff; border: 1px solid #ddd;"></div>
        <h4>По умолчанию</h4>
        <p style="font-size: 13px; color: #666;">Стандартная тема FunPay</p>
      </div>
      <div class="theme-card" data-theme="dark">
        <div class="theme-preview" style="background: #1a1a1a;"></div>
        <h4>Тёмная</h4>
        <p style="font-size: 13px; color: #666;">Тёмное оформление</p>
      </div>
      <div class="theme-card" data-theme="light">
        <div class="theme-preview" style="background: #f5f5f5;"></div>
        <h4>Светлая</h4>
        <p style="font-size: 13px; color: #666;">Светлое оформление</p>
      </div>
      <div class="theme-card" data-theme="blue">
        <div class="theme-preview" style="background: #0a1929;"></div>
        <h4>Синяя</h4>
        <p style="font-size: 13px; color: #666;">Синие тона</p>
      </div>
      <div class="theme-card" data-theme="purple">
        <div class="theme-preview" style="background: #1a0a29;"></div>
        <h4>Фиолетовая</h4>
        <p style="font-size: 13px; color: #666;">Фиолетовые тона</p>
      </div>
    </div>
  `;
  section.appendChild(themesGroup);
  
  const fontsGroup = document.createElement('div');
  fontsGroup.className = 'settings-group';
  fontsGroup.innerHTML = `
    <h3 class="group-title">Шрифты</h3>
    <div class="settings-grid">
      <div class="form-field">
        <label class="field-label" for="cust-font-family">Семейство шрифтов</label>
        <select id="cust-font-family" class="field-input">
          <option value="default">По умолчанию</option>
          <option value="Roboto">Roboto</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Lato">Lato</option>
          <option value="Montserrat">Montserrat</option>
          <option value="Raleway">Raleway</option>
          <option value="PT Sans">PT Sans</option>
          <option value="PT Serif">PT Serif</option>
          <option value="Ubuntu">Ubuntu</option>
        </select>
      </div>
      <div class="form-field">
        <label class="field-label" for="cust-font-size">Размер шрифта: <span id="cust-font-size-value">14</span>px</label>
        <input type="range" id="cust-font-size" class="field-input" min="12" max="20" value="14" step="1">
      </div>
      <div class="form-field full-width">
        <label class="field-label">Предпросмотр</label>
        <div id="cust-font-preview" class="font-preview">
          <p>Быстрая бурая лиса прыгает через ленивую собаку</p>
          <p>The quick brown fox jumps over the lazy dog</p>
          <p>1234567890 !@#$%^&*()</p>
        </div>
      </div>
    </div>
  `;
  section.appendChild(fontsGroup);
  
  const coverGroup = document.createElement('div');
  coverGroup.className = 'settings-group';
  coverGroup.innerHTML = `
    <h3 class="group-title">Обложка</h3>
    <div class="settings-grid">
      <div class="setting-card full-width">
        <label for="cust-cover-upload" class="upload-label">
          <span class="upload-icon">📁</span>
          <span>Выбрать изображение</span>
          <span style="font-size: 13px; opacity: 0.8;">JPG, PNG или GIF, до 5 МБ</span>
        </label>
        <input type="file" id="cust-cover-upload" accept="image/jpeg,image/png,image/gif" style="display: none;">
      </div>
      <div id="cust-cover-preview" class="cover-preview-large" style="display: none; grid-column: 1 / -1;">
        <img id="cust-cover-img" src="" alt="Preview">
        <button id="cust-remove-cover" class="remove-cover-btn">✕ Удалить обложку</button>
      </div>
      <div class="form-field">
        <label class="field-label" for="cust-cover-position">Позиционирование</label>
        <select id="cust-cover-position" class="field-input">
          <option value="center">По центру</option>
          <option value="top">Сверху</option>
          <option value="bottom">Снизу</option>
          <option value="left">Слева</option>
          <option value="right">Справа</option>
        </select>
      </div>
      <div class="form-field">
        <label class="field-label" for="cust-cover-size">Масштабирование</label>
        <select id="cust-cover-size" class="field-input">
          <option value="cover">Заполнить</option>
          <option value="contain">Вместить</option>
          <option value="auto">Оригинальный размер</option>
        </select>
      </div>
    </div>
  `;
  section.appendChild(coverGroup);
  
  setupCustomizationListeners();
  
  return section;
}

function createMarketAnalyticsSection() {
  const section = document.createElement('div');
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📊 Аналитика рынка</h2>
      <p class="section-description">Отслеживайте цены и анализируйте рынок</p>
    </div>
    <div class="settings-group">
      <div id="analytics-toggles"></div>
    </div>
    <div class="settings-group">
      <h3 class="group-title">Настройки обновления</h3>
      <div class="settings-grid">
        <div class="form-field">
          <label class="field-label" for="analytics-refresh-interval">Интервал обновления (сек)</label>
          <input type="number" id="analytics-refresh-interval" class="field-input" min="30" max="600" value="60">
          <span class="field-description">Как часто обновлять данные аналитики</span>
        </div>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const container = section.querySelector('#analytics-toggles');
    
    container.appendChild(UIComponents.createToggle({
      id: 'analytics-overlay',
      label: 'Оверлей аналитики',
      description: 'Показывать информацию о ценах прямо на странице',
      checked: false,
      onChange: (e) => updateSetting('marketAnalytics', 'analyticsOverlay', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'analytics-auto-update',
      label: 'Автообновление',
      description: 'Автоматически обновлять данные аналитики',
      checked: true,
      onChange: (e) => updateSetting('marketAnalytics', 'analyticsAutoUpdate', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'price-tracking',
      label: 'Отслеживание цен',
      description: 'Следить за изменениями цен конкурентов',
      checked: false,
      onChange: (e) => updateSetting('marketAnalytics', 'priceTracking', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'competitor-analysis',
      label: 'Анализ конкурентов',
      description: 'Анализировать предложения конкурентов',
      checked: false,
      onChange: (e) => updateSetting('marketAnalytics', 'competitorAnalysis', e.target.checked)
    }));
  }, 0);
  
  return section;
}

function createLotsSection() {
  const section = document.createElement('div');
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📦 Управление лотами</h2>
      <p class="section-description">Инструменты для управления вашими лотами</p>
    </div>
    <div class="settings-group">
      <div id="lots-toggles"></div>
    </div>
    <div class="settings-group">
      <h3 class="group-title">Настройки сортировки</h3>
      <div class="settings-grid">
        <div class="form-field">
          <label class="field-label" for="lot-sorting">Сортировка по умолчанию</label>
          <select id="lot-sorting" class="field-input">
            <option value="default">По умолчанию</option>
            <option value="price-asc">По цене (возр.)</option>
            <option value="price-desc">По цене (убыв.)</option>
            <option value="date-new">Сначала новые</option>
            <option value="date-old">Сначала старые</option>
          </select>
        </div>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const container = section.querySelector('#lots-toggles');
    
    container.appendChild(UIComponents.createToggle({
      id: 'lot-tools',
      label: 'Инструменты лотов',
      description: 'Включить дополнительные инструменты управления',
      checked: false,
      onChange: (e) => updateSetting('lots', 'lotTools', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'lot-filtering',
      label: 'Фильтрация лотов',
      description: 'Быстрая фильтрация по различным параметрам',
      checked: false,
      onChange: (e) => updateSetting('lots', 'lotFiltering', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'lot-notifications',
      label: 'Уведомления о лотах',
      description: 'Получать уведомления о изменениях',
      checked: false,
      onChange: (e) => updateSetting('lots', 'lotNotifications', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'lot-quick-edit',
      label: 'Быстрое редактирование',
      description: 'Редактировать лоты прямо в списке',
      checked: false,
      onChange: (e) => updateSetting('lots', 'quickEdit', e.target.checked)
    }));
  }, 0);
  
  return section;
}

function createAutomationSection() {
  const section = document.createElement('div');
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🤖 Автоматизация</h2>
      <p class="section-description">Автоматизируйте рутинные задачи</p>
    </div>
    <div class="settings-group">
      <div id="automation-toggles"></div>
    </div>
    <div class="settings-group">
      <h3 class="group-title">Автоответчик</h3>
      <div class="settings-grid">
        <div class="form-field full-width">
          <label class="field-label" for="autoresponder-message">Текст автоответа</label>
          <textarea id="autoresponder-message" class="field-input" rows="4" placeholder="Введите текст автоматического ответа..."></textarea>
        </div>
        <div class="form-field">
          <label class="field-label" for="autoresponder-delay">Задержка (сек)</label>
          <input type="number" id="autoresponder-delay" class="field-input" min="0" max="60" value="5">
          <span class="field-description">Задержка перед отправкой ответа</span>
        </div>
      </div>
    </div>
    <div class="settings-group">
      <h3 class="group-title">Автообновление</h3>
      <div class="settings-grid">
        <div class="form-field">
          <label class="field-label" for="auto-refresh-interval">Интервал обновления (сек)</label>
          <input type="number" id="auto-refresh-interval" class="field-input" min="60" max="3600" value="300">
          <span class="field-description">Как часто обновлять страницу</span>
        </div>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const container = section.querySelector('#automation-toggles');
    
    container.appendChild(UIComponents.createToggle({
      id: 'autoresponder',
      label: 'Автоответчик',
      description: 'Автоматически отвечать на сообщения',
      checked: false,
      onChange: (e) => updateSetting('automation', 'autoresponder', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'auto-refresh',
      label: 'Автообновление страницы',
      description: 'Автоматически обновлять страницу',
      checked: false,
      onChange: (e) => updateSetting('automation', 'autoRefresh', e.target.checked)
    }));
  }, 0);
  
  return section;
}

function createChatSection() {
  const section = document.createElement('div');
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">💬 Чат и сообщения</h2>
      <p class="section-description">Улучшите работу с чатом</p>
    </div>
    <div class="settings-group">
      <div id="chat-toggles"></div>
    </div>
    <div class="settings-group">
      <h3 class="group-title">Шаблоны сообщений</h3>
      <div class="settings-grid">
        <div class="setting-card full-width">
          <p style="color: #666; text-align: center; padding: 20px;">
            Управление шаблонами сообщений будет доступно в следующей версии
          </p>
        </div>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const container = section.querySelector('#chat-toggles');
    
    container.appendChild(UIComponents.createToggle({
      id: 'chat-enhancements',
      label: 'Улучшения чата',
      description: 'Дополнительные функции для чата',
      checked: false,
      onChange: (e) => updateSetting('chat', 'chatEnhancements', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'chat-notifications',
      label: 'Уведомления',
      description: 'Уведомления о новых сообщениях',
      checked: true,
      onChange: (e) => updateSetting('chat', 'chatNotifications', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'message-history',
      label: 'История сообщений',
      description: 'Сохранять историю сообщений',
      checked: true,
      onChange: (e) => updateSetting('chat', 'messageHistory', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'quick-replies',
      label: 'Быстрые ответы',
      description: 'Использовать шаблоны для быстрых ответов',
      checked: false,
      onChange: (e) => updateSetting('chat', 'quickReplies', e.target.checked)
    }));
  }, 0);
  
  return section;
}

function createTranslationSection() {
  const section = document.createElement('div');
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🌐 Перевод</h2>
      <p class="section-description">Настройки автоматического перевода</p>
    </div>
    <div class="settings-group">
      <div id="translation-toggles"></div>
    </div>
    <div class="settings-group">
      <h3 class="group-title">Настройки перевода</h3>
      <div class="settings-grid">
        <div class="form-field">
          <label class="field-label" for="translation-lang">Язык перевода</label>
          <select id="translation-lang" class="field-input">
            <option value="en">Английский</option>
            <option value="ru">Русский</option>
            <option value="de">Немецкий</option>
            <option value="fr">Французский</option>
            <option value="es">Испанский</option>
            <option value="zh">Китайский</option>
          </select>
        </div>
        <div class="form-field">
          <label class="field-label" for="translation-provider">Провайдер перевода</label>
          <select id="translation-provider" class="field-input">
            <option value="google">Google Translate</option>
            <option value="yandex">Яндекс.Переводчик</option>
          </select>
        </div>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const container = section.querySelector('#translation-toggles');
    
    container.appendChild(UIComponents.createToggle({
      id: 'auto-translate',
      label: 'Автоперевод',
      description: 'Автоматически переводить сообщения',
      checked: false,
      onChange: (e) => updateSetting('translation', 'autoTranslate', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'detect-language',
      label: 'Определять язык',
      description: 'Автоматически определять язык текста',
      checked: true,
      onChange: (e) => updateSetting('translation', 'detectLanguage', e.target.checked)
    }));
  }, 0);
  
  return section;
}

function createVisualSection() {
  const section = document.createElement('div');
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">✨ Визуальные эффекты</h2>
      <p class="section-description">Настройте визуальное оформление</p>
    </div>
    <div class="settings-group">
      <div id="visual-toggles"></div>
    </div>
    <div class="settings-group">
      <h3 class="group-title">Пользовательский CSS</h3>
      <div class="settings-grid">
        <div class="form-field full-width">
          <label class="field-label" for="custom-css">Ваш CSS код</label>
          <textarea id="custom-css" class="field-input" rows="8" placeholder="/* Введите ваш CSS код здесь */"></textarea>
          <span class="field-description">Добавьте свои стили для дополнительной кастомизации</span>
        </div>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const container = section.querySelector('#visual-toggles');
    
    container.appendChild(UIComponents.createToggle({
      id: 'visual-effects',
      label: 'Визуальные эффекты',
      description: 'Включить дополнительные визуальные эффекты',
      checked: false,
      onChange: (e) => updateSetting('visual', 'visualEffects', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'animations',
      label: 'Анимации',
      description: 'Плавные анимации интерфейса',
      checked: true,
      onChange: (e) => updateSetting('visual', 'animations', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'compact-mode',
      label: 'Компактный режим',
      description: 'Более плотное отображение элементов',
      checked: false,
      onChange: (e) => updateSetting('visual', 'compactMode', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'dark-mode',
      label: 'Тёмный режим',
      description: 'Использовать тёмную тему для всего сайта',
      checked: false,
      onChange: (e) => updateSetting('visual', 'darkMode', e.target.checked)
    }));
  }, 0);
  
  return section;
}

function createUtilitiesSection() {
  const section = document.createElement('div');
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🔧 Утилиты</h2>
      <p class="section-description">Полезные инструменты и функции</p>
    </div>
    <div class="settings-group">
      <div id="utilities-toggles"></div>
    </div>
    <div class="settings-group">
      <h3 class="group-title">Инструменты</h3>
      <div class="settings-grid">
        <div class="setting-card">
          <p style="color: #666; text-align: center; padding: 20px;">
            Дополнительные утилиты будут доступны в следующих версиях
          </p>
        </div>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const container = section.querySelector('#utilities-toggles');
    
    container.appendChild(UIComponents.createToggle({
      id: 'quick-actions',
      label: 'Быстрые действия',
      description: 'Панель быстрых действий',
      checked: false,
      onChange: (e) => updateSetting('utilities', 'quickActions', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'shortcuts',
      label: 'Горячие клавиши',
      description: 'Использовать сочетания клавиш',
      checked: true,
      onChange: (e) => updateSetting('utilities', 'shortcuts', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'export-data',
      label: 'Экспорт данных',
      description: 'Возможность экспорта данных',
      checked: false,
      onChange: (e) => updateSetting('utilities', 'exportData', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'clipboard',
      label: 'Расширенный буфер обмена',
      description: 'Дополнительные функции копирования',
      checked: true,
      onChange: (e) => updateSetting('utilities', 'clipboard', e.target.checked)
    }));
  }, 0);
  
  return section;
}

function createAccountsSection() {
  const section = document.createElement('div');
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">👤 Аккаунты</h2>
      <p class="section-description">Управление несколькими аккаунтами</p>
    </div>
    <div class="settings-group">
      <div id="accounts-toggles"></div>
    </div>
    <div class="settings-group">
      <h3 class="group-title">Сохранённые аккаунты</h3>
      <div class="settings-grid">
        <div class="setting-card full-width">
          <p style="color: #666; text-align: center; padding: 20px;">
            Функция управления аккаунтами будет доступна в следующей версии
          </p>
        </div>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const container = section.querySelector('#accounts-toggles');
    
    container.appendChild(UIComponents.createToggle({
      id: 'multi-account',
      label: 'Мультиаккаунт',
      description: 'Поддержка нескольких аккаунтов',
      checked: false,
      onChange: (e) => updateSetting('accounts', 'multiAccount', e.target.checked)
    }));
    
    container.appendChild(UIComponents.createToggle({
      id: 'account-switching',
      label: 'Быстрое переключение',
      description: 'Быстрое переключение между аккаунтами',
      checked: false,
      onChange: (e) => updateSetting('accounts', 'accountSwitching', e.target.checked)
    }));
  }, 0);
  
  return section;
}

function createAboutSection() {
  const section = document.createElement('div');
  
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">ℹ️ О расширении</h2>
      <p class="section-description">Информация о FunPay Customizer</p>
    </div>
    <div class="settings-group">
      <div class="settings-grid">
        <div class="setting-card">
          <h3 style="margin-bottom: 10px;">Версия</h3>
          <p style="font-size: 24px; font-weight: 600; color: var(--primary-color);">1.0.0</p>
        </div>
        <div class="setting-card">
          <h3 style="margin-bottom: 10px;">Автор</h3>
          <p style="font-size: 18px; font-weight: 500;">@MarkusGarantor</p>
        </div>
        <div class="setting-card full-width">
          <h3 style="margin-bottom: 10px;">Описание</h3>
          <p style="line-height: 1.8; color: #666;">
            FunPay Customizer - мощное расширение для браузера, которое позволяет настроить 
            внешний вид и функциональность сайта FunPay.com под ваши нужды. Расширение включает 
            кастомизацию тем, шрифтов, аналитику рынка, автоматизацию задач и многое другое.
          </p>
        </div>
        <div class="setting-card full-width">
          <h3 style="margin-bottom: 10px;">Возможности</h3>
          <ul style="line-height: 2; color: #666; padding-left: 20px;">
            <li>Настройка тем оформления и шрифтов</li>
            <li>Пользовательские обложки профиля</li>
            <li>Аналитика рынка и отслеживание цен</li>
            <li>Инструменты управления лотами</li>
            <li>Автоматизация рутинных задач</li>
            <li>Улучшения чата и сообщений</li>
            <li>Автоматический перевод</li>
            <li>Визуальные эффекты и пользовательский CSS</li>
            <li>Полезные утилиты и горячие клавиши</li>
          </ul>
        </div>
        <div class="setting-card full-width">
          <h3 style="margin-bottom: 10px;">Ссылки</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="https://github.com" target="_blank" class="btn btn-outline btn-small">
              GitHub
            </a>
            <a href="https://github.com/issues" target="_blank" class="btn btn-outline btn-small">
              Сообщить об ошибке
            </a>
            <a href="https://github.com/wiki" target="_blank" class="btn btn-outline btn-small">
              Документация
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return section;
}

function setupCustomizationListeners() {
  setTimeout(() => {
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
      card.addEventListener('click', () => {
        themeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        updateSetting('customization', 'theme', card.dataset.theme);
      });
    });
    
    const fontFamily = document.getElementById('cust-font-family');
    if (fontFamily) {
      fontFamily.addEventListener('change', (e) => {
        updateSetting('customization', 'font', e.target.value);
        updateFontPreview();
      });
    }
    
    const fontSize = document.getElementById('cust-font-size');
    const fontSizeValue = document.getElementById('cust-font-size-value');
    if (fontSize && fontSizeValue) {
      fontSize.addEventListener('input', (e) => {
        fontSizeValue.textContent = e.target.value;
        updateSetting('customization', 'fontSize', e.target.value);
        updateFontPreview();
      });
    }
    
    const coverUpload = document.getElementById('cust-cover-upload');
    if (coverUpload) {
      coverUpload.addEventListener('change', handleCoverUpload);
    }
    
    const removeCover = document.getElementById('cust-remove-cover');
    if (removeCover) {
      removeCover.addEventListener('click', handleRemoveCover);
    }
    
    const coverPosition = document.getElementById('cust-cover-position');
    if (coverPosition) {
      coverPosition.addEventListener('change', (e) => {
        updateSetting('customization', 'coverPosition', e.target.value);
      });
    }
    
    const coverSize = document.getElementById('cust-cover-size');
    if (coverSize) {
      coverSize.addEventListener('change', (e) => {
        updateSetting('customization', 'coverSize', e.target.value);
      });
    }
    
    const autoresponderMessage = document.getElementById('autoresponder-message');
    if (autoresponderMessage) {
      autoresponderMessage.addEventListener('change', (e) => {
        updateSetting('automation', 'autoresponderMessage', e.target.value);
      });
    }
    
    const autoresponderDelay = document.getElementById('autoresponder-delay');
    if (autoresponderDelay) {
      autoresponderDelay.addEventListener('change', (e) => {
        updateSetting('automation', 'autoresponderDelay', parseInt(e.target.value));
      });
    }
    
    const autoRefreshInterval = document.getElementById('auto-refresh-interval');
    if (autoRefreshInterval) {
      autoRefreshInterval.addEventListener('change', (e) => {
        updateSetting('automation', 'autoRefreshInterval', parseInt(e.target.value));
      });
    }
    
    const analyticsRefreshInterval = document.getElementById('analytics-refresh-interval');
    if (analyticsRefreshInterval) {
      analyticsRefreshInterval.addEventListener('change', (e) => {
        updateSetting('marketAnalytics', 'analyticsRefreshInterval', parseInt(e.target.value));
      });
    }
    
    const lotSorting = document.getElementById('lot-sorting');
    if (lotSorting) {
      lotSorting.addEventListener('change', (e) => {
        updateSetting('lots', 'lotSorting', e.target.value);
      });
    }
    
    const translationLang = document.getElementById('translation-lang');
    if (translationLang) {
      translationLang.addEventListener('change', (e) => {
        updateSetting('translation', 'translationLang', e.target.value);
      });
    }
    
    const translationProvider = document.getElementById('translation-provider');
    if (translationProvider) {
      translationProvider.addEventListener('change', (e) => {
        updateSetting('translation', 'translationProvider', e.target.value);
      });
    }
    
    const customCSS = document.getElementById('custom-css');
    if (customCSS) {
      customCSS.addEventListener('change', (e) => {
        updateSetting('visual', 'customCSS', e.target.value);
      });
    }
  }, 100);
}

function handleCoverUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    UIComponents.showNotification('✕ Размер файла не должен превышать 5 МБ', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const imageData = event.target.result;
    const img = document.getElementById('cust-cover-img');
    const preview = document.getElementById('cust-cover-preview');
    
    if (img && preview) {
      img.src = imageData;
      preview.style.display = 'block';
      updateSetting('customization', 'coverImage', imageData);
    }
  };
  reader.readAsDataURL(file);
}

function handleRemoveCover() {
  const img = document.getElementById('cust-cover-img');
  const preview = document.getElementById('cust-cover-preview');
  const upload = document.getElementById('cust-cover-upload');
  
  if (img && preview && upload) {
    img.src = '';
    preview.style.display = 'none';
    upload.value = '';
    updateSetting('customization', 'coverImage', null);
  }
}

function updateFontPreview() {
  const preview = document.getElementById('cust-font-preview');
  if (!preview || !currentSettings.customization) return;
  
  const font = currentSettings.customization.font;
  const fontSize = currentSettings.customization.fontSize;
  
  if (font && font !== 'default') {
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap`;
    
    let fontLink = document.getElementById('font-preview-link');
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'font-preview-link';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    fontLink.href = fontUrl;
    
    preview.style.fontFamily = `'${font}', sans-serif`;
  } else {
    preview.style.fontFamily = '';
  }
  
  if (fontSize) {
    preview.style.fontSize = `${fontSize}px`;
  }
}

function updateSetting(section, key, value) {
  if (!currentSettings[section]) {
    currentSettings[section] = {};
  }
  currentSettings[section][key] = value;
}

function populateCustomizationSettings() {
  if (!currentSettings.customization) return;
  
  const settings = currentSettings.customization;
  
  const themeCards = document.querySelectorAll('.theme-card');
  themeCards.forEach(card => {
    if (card.dataset.theme === settings.theme) {
      card.classList.add('selected');
    }
  });
  
  const fontFamily = document.getElementById('cust-font-family');
  if (fontFamily && settings.font) {
    fontFamily.value = settings.font;
  }
  
  const fontSize = document.getElementById('cust-font-size');
  const fontSizeValue = document.getElementById('cust-font-size-value');
  if (fontSize && fontSizeValue && settings.fontSize) {
    fontSize.value = settings.fontSize;
    fontSizeValue.textContent = settings.fontSize;
  }
  
  const coverPosition = document.getElementById('cust-cover-position');
  if (coverPosition && settings.coverPosition) {
    coverPosition.value = settings.coverPosition;
  }
  
  const coverSize = document.getElementById('cust-cover-size');
  if (coverSize && settings.coverSize) {
    coverSize.value = settings.coverSize;
  }
  
  if (settings.coverImage) {
    const img = document.getElementById('cust-cover-img');
    const preview = document.getElementById('cust-cover-preview');
    if (img && preview) {
      img.src = settings.coverImage;
      preview.style.display = 'block';
    }
  }
  
  updateFontPreview();
}

function populateMarketAnalyticsSettings() {
  if (!currentSettings.marketAnalytics) return;
  
  const settings = currentSettings.marketAnalytics;
  
  const analyticsOverlay = document.getElementById('analytics-overlay');
  if (analyticsOverlay) analyticsOverlay.checked = settings.analyticsOverlay || false;
  
  const analyticsAutoUpdate = document.getElementById('analytics-auto-update');
  if (analyticsAutoUpdate) analyticsAutoUpdate.checked = settings.analyticsAutoUpdate !== false;
  
  const priceTracking = document.getElementById('price-tracking');
  if (priceTracking) priceTracking.checked = settings.priceTracking || false;
  
  const competitorAnalysis = document.getElementById('competitor-analysis');
  if (competitorAnalysis) competitorAnalysis.checked = settings.competitorAnalysis || false;
  
  const refreshInterval = document.getElementById('analytics-refresh-interval');
  if (refreshInterval) refreshInterval.value = settings.analyticsRefreshInterval || 60;
}

function populateLotsSettings() {
  if (!currentSettings.lots) return;
  
  const settings = currentSettings.lots;
  
  const lotTools = document.getElementById('lot-tools');
  if (lotTools) lotTools.checked = settings.lotTools || false;
  
  const lotFiltering = document.getElementById('lot-filtering');
  if (lotFiltering) lotFiltering.checked = settings.lotFiltering || false;
  
  const lotNotifications = document.getElementById('lot-notifications');
  if (lotNotifications) lotNotifications.checked = settings.lotNotifications || false;
  
  const quickEdit = document.getElementById('lot-quick-edit');
  if (quickEdit) quickEdit.checked = settings.quickEdit || false;
  
  const sorting = document.getElementById('lot-sorting');
  if (sorting) sorting.value = settings.lotSorting || 'default';
}

function populateAutomationSettings() {
  if (!currentSettings.automation) return;
  
  const settings = currentSettings.automation;
  
  const autoresponder = document.getElementById('autoresponder');
  if (autoresponder) autoresponder.checked = settings.autoresponder || false;
  
  const autoRefresh = document.getElementById('auto-refresh');
  if (autoRefresh) autoRefresh.checked = settings.autoRefresh || false;
  
  const message = document.getElementById('autoresponder-message');
  if (message) message.value = settings.autoresponderMessage || '';
  
  const delay = document.getElementById('autoresponder-delay');
  if (delay) delay.value = settings.autoresponderDelay || 5;
  
  const interval = document.getElementById('auto-refresh-interval');
  if (interval) interval.value = settings.autoRefreshInterval || 300;
}

function populateChatSettings() {
  if (!currentSettings.chat) return;
  
  const settings = currentSettings.chat;
  
  const chatEnhancements = document.getElementById('chat-enhancements');
  if (chatEnhancements) chatEnhancements.checked = settings.chatEnhancements || false;
  
  const chatNotifications = document.getElementById('chat-notifications');
  if (chatNotifications) chatNotifications.checked = settings.chatNotifications !== false;
  
  const messageHistory = document.getElementById('message-history');
  if (messageHistory) messageHistory.checked = settings.messageHistory !== false;
  
  const quickReplies = document.getElementById('quick-replies');
  if (quickReplies) quickReplies.checked = settings.quickReplies || false;
}

function populateTranslationSettings() {
  if (!currentSettings.translation) return;
  
  const settings = currentSettings.translation;
  
  const autoTranslate = document.getElementById('auto-translate');
  if (autoTranslate) autoTranslate.checked = settings.autoTranslate || false;
  
  const detectLanguage = document.getElementById('detect-language');
  if (detectLanguage) detectLanguage.checked = settings.detectLanguage !== false;
  
  const lang = document.getElementById('translation-lang');
  if (lang) lang.value = settings.translationLang || 'en';
  
  const provider = document.getElementById('translation-provider');
  if (provider) provider.value = settings.translationProvider || 'google';
}

function populateVisualSettings() {
  if (!currentSettings.visual) return;
  
  const settings = currentSettings.visual;
  
  const visualEffects = document.getElementById('visual-effects');
  if (visualEffects) visualEffects.checked = settings.visualEffects || false;
  
  const animations = document.getElementById('animations');
  if (animations) animations.checked = settings.animations !== false;
  
  const compactMode = document.getElementById('compact-mode');
  if (compactMode) compactMode.checked = settings.compactMode || false;
  
  const darkMode = document.getElementById('dark-mode');
  if (darkMode) darkMode.checked = settings.darkMode || false;
  
  const customCSS = document.getElementById('custom-css');
  if (customCSS) customCSS.value = settings.customCSS || '';
}

function populateUtilitiesSettings() {
  if (!currentSettings.utilities) return;
  
  const settings = currentSettings.utilities;
  
  const quickActions = document.getElementById('quick-actions');
  if (quickActions) quickActions.checked = settings.quickActions || false;
  
  const shortcuts = document.getElementById('shortcuts');
  if (shortcuts) shortcuts.checked = settings.shortcuts !== false;
  
  const exportData = document.getElementById('export-data');
  if (exportData) exportData.checked = settings.exportData || false;
  
  const clipboard = document.getElementById('clipboard');
  if (clipboard) clipboard.checked = settings.clipboard !== false;
}

function populateAccountsSettings() {
  if (!currentSettings.accounts) return;
  
  const settings = currentSettings.accounts;
  
  const multiAccount = document.getElementById('multi-account');
  if (multiAccount) multiAccount.checked = settings.multiAccount || false;
  
  const accountSwitching = document.getElementById('account-switching');
  if (accountSwitching) accountSwitching.checked = settings.accountSwitching || false;
}
