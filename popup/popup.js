let currentSettings = {};

document.addEventListener('DOMContentLoaded', async () => {
  await initializeDashboard();
});

async function initializeDashboard() {
  showLoading(true);
  
  try {
    currentSettings = await StorageHelper.getSettings();
    populateDashboard();
    setupEventListeners();
    updateStats();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showError(true);
  } finally {
    showLoading(false);
  }
}

function populateDashboard() {
  const quickTogglesContainer = document.getElementById('quick-toggles');
  quickTogglesContainer.innerHTML = '';
  
  const toggles = [
    {
      icon: '📊',
      label: 'Аналитика',
      description: 'Оверлей аналитики рынка',
      checked: currentSettings.marketAnalytics?.analyticsOverlay || false,
      onChange: (checked) => updateToggle('marketAnalytics', 'analyticsOverlay', checked)
    },
    {
      icon: '📦',
      label: 'Инструменты лотов',
      description: 'Дополнительные функции управления',
      checked: currentSettings.lots?.lotTools || false,
      onChange: (checked) => updateToggle('lots', 'lotTools', checked)
    },
    {
      icon: '🤖',
      label: 'Автоответчик',
      description: 'Автоматические ответы',
      checked: currentSettings.automation?.autoresponder || false,
      onChange: (checked) => updateToggle('automation', 'autoresponder', checked)
    },
    {
      icon: '✨',
      label: 'Визуальные эффекты',
      description: 'Дополнительные эффекты',
      checked: currentSettings.visual?.visualEffects || false,
      onChange: (checked) => updateToggle('visual', 'visualEffects', checked)
    }
  ];
  
  toggles.forEach(toggle => {
    const toggleElement = createQuickToggle(toggle);
    quickTogglesContainer.appendChild(toggleElement);
  });
  
  const themeSelect = document.getElementById('quick-theme');
  if (currentSettings.customization?.theme) {
    themeSelect.value = currentSettings.customization.theme;
  }
}

function createQuickToggle(config) {
  const container = document.createElement('label');
  container.className = 'quick-toggle';
  
  const info = document.createElement('div');
  info.className = 'quick-toggle-info';
  
  const icon = document.createElement('div');
  icon.className = 'quick-toggle-icon';
  icon.textContent = config.icon;
  
  const text = document.createElement('div');
  text.className = 'quick-toggle-text';
  
  const label = document.createElement('div');
  label.className = 'quick-toggle-label';
  label.textContent = config.label;
  
  const desc = document.createElement('div');
  desc.className = 'quick-toggle-desc';
  desc.textContent = config.description;
  
  text.appendChild(label);
  text.appendChild(desc);
  
  info.appendChild(icon);
  info.appendChild(text);
  
  const switchContainer = document.createElement('div');
  switchContainer.className = 'quick-toggle-switch';
  
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'quick-toggle-input';
  input.checked = config.checked;
  
  input.addEventListener('change', (e) => {
    if (config.onChange) {
      config.onChange(e.target.checked);
    }
  });
  
  const slider = document.createElement('span');
  slider.className = 'quick-toggle-slider';
  
  switchContainer.appendChild(input);
  switchContainer.appendChild(slider);
  
  container.appendChild(info);
  container.appendChild(switchContainer);
  
  return container;
}

function setupEventListeners() {
  const themeSelect = document.getElementById('quick-theme');
  themeSelect.addEventListener('change', (e) => {
    if (!currentSettings.customization) {
      currentSettings.customization = {};
    }
    currentSettings.customization.theme = e.target.value;
    updateStats();
  });
  
  const applyBtn = document.getElementById('apply-btn');
  applyBtn.addEventListener('click', applySettings);
  
  const advancedBtn = document.getElementById('advanced-btn');
  advancedBtn.addEventListener('click', openAdvancedSettings);
}

function updateToggle(section, key, value) {
  if (!currentSettings[section]) {
    currentSettings[section] = {};
  }
  currentSettings[section][key] = value;
  updateStats();
}

async function applySettings() {
  const applyBtn = document.getElementById('apply-btn');
  const originalText = applyBtn.innerHTML;
  
  applyBtn.innerHTML = '<span class="btn-icon">⏳</span><span>Применение...</span>';
  applyBtn.disabled = true;
  
  try {
    const result = await StorageHelper.saveAllSettings(currentSettings);
    
    if (result.success) {
      chrome.runtime.sendMessage({
        action: 'applyToAllTabs',
        settings: currentSettings
      });
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('funpay.com')) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'updateSettings',
            settings: currentSettings
          });
        } catch (err) {
          console.log('Tab reload may be needed');
        }
      }
      
      showNotification('✓ Настройки применены!', 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error applying settings:', error);
    showNotification('✕ Ошибка применения настроек', 'error');
  } finally {
    applyBtn.innerHTML = originalText;
    applyBtn.disabled = false;
  }
}

function openAdvancedSettings() {
  chrome.runtime.openOptionsPage();
}

function updateStats() {
  let activeFeatures = 0;
  
  const sections = ['marketAnalytics', 'lots', 'automation', 'chat', 'translation', 'visual', 'utilities', 'accounts'];
  
  sections.forEach(section => {
    if (currentSettings[section]) {
      Object.values(currentSettings[section]).forEach(value => {
        if (typeof value === 'boolean' && value === true) {
          activeFeatures++;
        }
      });
    }
  });
  
  const activeFeaturesEl = document.getElementById('active-features');
  if (activeFeaturesEl) {
    activeFeaturesEl.textContent = activeFeatures;
  }
  
  const currentThemeEl = document.getElementById('current-theme');
  if (currentThemeEl && currentSettings.customization?.theme) {
    const themeNames = {
      default: 'Default',
      dark: 'Тёмная',
      light: 'Светлая',
      blue: 'Синяя',
      purple: 'Фиолетовая'
    };
    currentThemeEl.textContent = themeNames[currentSettings.customization.theme] || 'Default';
  }
}

function showLoading(show) {
  const loadingState = document.getElementById('loading-state');
  const dashboardContent = document.getElementById('dashboard-content');
  
  if (show) {
    loadingState.classList.remove('hidden');
    dashboardContent.style.display = 'none';
  } else {
    loadingState.classList.add('hidden');
    dashboardContent.style.display = 'block';
  }
}

function showError(show) {
  const errorState = document.getElementById('error-state');
  const dashboardContent = document.getElementById('dashboard-content');
  
  if (show) {
    errorState.classList.remove('hidden');
    dashboardContent.style.display = 'none';
  } else {
    errorState.classList.add('hidden');
    dashboardContent.style.display = 'block';
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  const icon = document.createElement('span');
  icon.className = 'notification-icon';
  icon.textContent = type === 'success' ? '✓' : '✕';
  
  const text = document.createElement('span');
  text.className = 'notification-text';
  text.textContent = message;
  
  notification.appendChild(icon);
  notification.appendChild(text);
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}
