document.addEventListener('DOMContentLoaded', async () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  const themeCards = document.querySelectorAll('.theme-card');
  const fontFamily = document.getElementById('font-family');
  const fontSizeOptions = document.getElementById('font-size-options');
  const fontSizeDisplay = document.getElementById('font-size-display');
  const fontPreview = document.getElementById('font-preview');
  
  const coverUploadOptions = document.getElementById('cover-upload-options');
  const coverPreviewOptions = document.getElementById('cover-preview-options');
  const coverPreviewImgOptions = document.getElementById('cover-preview-img-options');
  const removeCoverOptions = document.getElementById('remove-cover-options');
  const coverPositionOptions = document.getElementById('cover-position-options');
  const coverSizeOptions = document.getElementById('cover-size-options');
  
  const bgPrimary = document.getElementById('bg-primary');
  const bgSecondary = document.getElementById('bg-secondary');
  const bgTertiary = document.getElementById('bg-tertiary');
  const textPrimary = document.getElementById('text-primary');
  const textSecondary = document.getElementById('text-secondary');
  const borderColor = document.getElementById('border-color');
  const linkColor = document.getElementById('link-color');
  const linkHover = document.getElementById('link-hover');
  const saveCustomTheme = document.getElementById('save-custom-theme');
  const themePreview = document.getElementById('theme-preview');
  
  const saveAll = document.getElementById('save-all');
  const resetAll = document.getElementById('reset-all');

  const automationEnabled = document.getElementById('automation-enabled');
  const rateLimitPerContact = document.getElementById('rate-limit-per-contact');
  const rateLimitPeriod = document.getElementById('rate-limit-period');
  const quietHoursEnabled = document.getElementById('quiet-hours-enabled');
  const quietHoursStart = document.getElementById('quiet-hours-start');
  const quietHoursEnd = document.getElementById('quiet-hours-end');
  const defaultDelay = document.getElementById('default-delay');
  const escalationDelay = document.getElementById('escalation-delay');
  const escalationEnabled = document.getElementById('escalation-enabled');
  const showNotificationsCheckbox = document.getElementById('show-notifications');
  const saveAutomation = document.getElementById('save-automation');
  const addReviewTemplate = document.getElementById('add-review-template');
  const addMessageTemplate = document.getElementById('add-message-template');
  const reviewTemplatesList = document.getElementById('review-templates-list');
  const messageTemplatesList = document.getElementById('message-templates-list');

  const exportSettings = document.getElementById('export-settings');
  const importFile = document.getElementById('import-file');
  const importConfirm = document.getElementById('import-confirm');
  const importCancel = document.getElementById('import-cancel');

  let currentSettings = {};
  let automationConfig = {};
  let pendingImportData = null;

  await loadSettings();
  await loadAutomationSettings();

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });

  themeCards.forEach(card => {
    const selectBtn = card.querySelector('.select-theme');
    selectBtn.addEventListener('click', () => {
      themeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentSettings.theme = card.dataset.theme;
    });
  });

  fontFamily.addEventListener('change', () => {
    currentSettings.font = fontFamily.value;
    updateFontPreview();
  });

  fontSizeOptions.addEventListener('input', (e) => {
    fontSizeDisplay.textContent = e.target.value;
    currentSettings.fontSize = e.target.value;
    updateFontPreview();
  });

  coverUploadOptions.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('❌ Размер файла не должен превышать 5 МБ', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        coverPreviewImgOptions.src = imageData;
        coverPreviewOptions.style.display = 'block';
        currentSettings.coverImage = imageData;
      };
      reader.readAsDataURL(file);
    }
  });

  removeCoverOptions.addEventListener('click', () => {
    coverPreviewOptions.style.display = 'none';
    coverPreviewImgOptions.src = '';
    currentSettings.coverImage = null;
    coverUploadOptions.value = '';
  });

  coverPositionOptions.addEventListener('change', () => {
    currentSettings.coverPosition = coverPositionOptions.value;
  });

  coverSizeOptions.addEventListener('change', () => {
    currentSettings.coverSize = coverSizeOptions.value;
  });

  const customThemeInputs = [
    bgPrimary, bgSecondary, bgTertiary, 
    textPrimary, textSecondary, borderColor, 
    linkColor, linkHover
  ];

  customThemeInputs.forEach(input => {
    input.addEventListener('input', updateCustomThemePreview);
  });

  saveCustomTheme.addEventListener('click', () => {
    const customTheme = {
      bgPrimary: bgPrimary.value,
      bgSecondary: bgSecondary.value,
      bgTertiary: bgTertiary.value,
      textPrimary: textPrimary.value,
      textSecondary: textSecondary.value,
      borderColor: borderColor.value,
      linkColor: linkColor.value,
      linkHover: linkHover.value
    };

    currentSettings.customTheme = customTheme;
    currentSettings.theme = 'custom';
    
    themeCards.forEach(c => c.classList.remove('selected'));
    
    showNotification('✓ Пользовательская тема сохранена!');
  });

  saveAll.addEventListener('click', async () => {
    const settings = {
      theme: currentSettings.theme,
      customTheme: currentSettings.customTheme || null,
      font: currentSettings.font,
      fontSize: currentSettings.fontSize,
      coverImage: currentSettings.coverImage || null,
      coverPosition: currentSettings.coverPosition,
      coverSize: currentSettings.coverSize
    };

    await chrome.storage.sync.set(settings);

    chrome.runtime.sendMessage({
      action: 'applyToAllTabs',
      settings: settings
    });

    showNotification('✓ Настройки сохранены и применены!');
  });

  resetAll.addEventListener('click', async () => {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
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

      chrome.runtime.sendMessage({
        action: 'applyToAllTabs',
        settings: defaultSettings
      });

      await loadSettings();
      showNotification('⟲ Все настройки сброшены!');
    }
  });

  async function loadSettings() {
    const settings = await chrome.storage.sync.get({
      theme: 'default',
      customTheme: null,
      font: 'default',
      fontSize: '14',
      coverImage: null,
      coverPosition: 'center',
      coverSize: 'cover'
    });

    currentSettings = settings;

    themeCards.forEach(card => {
      if (card.dataset.theme === settings.theme) {
        card.classList.add('selected');
      }
    });

    fontFamily.value = settings.font;
    fontSizeOptions.value = settings.fontSize;
    fontSizeDisplay.textContent = settings.fontSize;
    coverPositionOptions.value = settings.coverPosition;
    coverSizeOptions.value = settings.coverSize;

    if (settings.coverImage) {
      coverPreviewImgOptions.src = settings.coverImage;
      coverPreviewOptions.style.display = 'block';
    }

    if (settings.customTheme) {
      bgPrimary.value = settings.customTheme.bgPrimary;
      bgSecondary.value = settings.customTheme.bgSecondary;
      bgTertiary.value = settings.customTheme.bgTertiary;
      textPrimary.value = settings.customTheme.textPrimary;
      textSecondary.value = settings.customTheme.textSecondary;
      borderColor.value = settings.customTheme.borderColor;
      linkColor.value = settings.customTheme.linkColor;
      linkHover.value = settings.customTheme.linkHover;
      updateCustomThemePreview();
    }

    updateFontPreview();
  }

  function updateFontPreview() {
    if (currentSettings.font && currentSettings.font !== 'default') {
      const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(currentSettings.font)}:wght@300;400;500;600;700&display=swap`;
      
      let fontLink = document.getElementById('font-preview-link');
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = 'font-preview-link';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      fontLink.href = fontUrl;

      fontPreview.style.fontFamily = `'${currentSettings.font}', sans-serif`;
    } else {
      fontPreview.style.fontFamily = '';
    }

    fontPreview.style.fontSize = `${currentSettings.fontSize}px`;
  }

  function updateCustomThemePreview() {
    const previewHeader = themePreview.querySelector('.preview-header-custom');
    const previewContent = themePreview.querySelector('.preview-content-custom');
    const previewTextPrimary = themePreview.querySelector('.preview-text-primary');
    const previewTextSecondary = themePreview.querySelector('.preview-text-secondary');
    const previewLink = themePreview.querySelector('.preview-link');

    themePreview.style.background = bgPrimary.value;
    previewHeader.style.background = bgSecondary.value;
    previewHeader.style.color = textPrimary.value;
    previewHeader.style.borderBottomColor = borderColor.value;
    previewContent.style.background = bgPrimary.value;
    previewTextPrimary.style.color = textPrimary.value;
    previewTextSecondary.style.color = textSecondary.value;
    previewLink.style.color = linkColor.value;

    previewLink.addEventListener('mouseenter', () => {
      previewLink.style.color = linkHover.value;
    });

    previewLink.addEventListener('mouseleave', () => {
      previewLink.style.color = linkColor.value;
    });
  }

  saveAutomation.addEventListener('click', async () => {
    automationConfig.enabled = automationEnabled.checked;
    automationConfig.rateLimitPerContact = parseInt(rateLimitPerContact.value);
    automationConfig.rateLimitPeriodMinutes = parseInt(rateLimitPeriod.value);
    automationConfig.quietHoursEnabled = quietHoursEnabled.checked;
    automationConfig.quietHoursStart = quietHoursStart.value;
    automationConfig.quietHoursEnd = quietHoursEnd.value;
    automationConfig.delayMinutes = parseInt(defaultDelay.value);
    automationConfig.escalationEnabled = escalationEnabled.checked;
    automationConfig.escalationDelayHours = parseInt(escalationDelay.value);
    automationConfig.showNotifications = showNotificationsCheckbox.checked;

    const response = await chrome.runtime.sendMessage({
      action: 'setAutomationConfig',
      config: automationConfig
    });

    if (response.success) {
      showNotification('✓ Настройки автоматизации сохранены!');
    } else {
      showNotification('❌ Ошибка сохранения настроек', 'error');
    }
  });

  addReviewTemplate.addEventListener('click', () => {
    const templateId = `review_${Date.now()}`;
    const template = {
      id: templateId,
      name: 'Новый шаблон',
      enabled: true,
      content: '',
      delayMinutes: 5,
      ratingFilter: [],
      keywordFilter: [],
      oneResponsePerReview: true
    };

    automationConfig.reviewTemplates = automationConfig.reviewTemplates || [];
    automationConfig.reviewTemplates.push(template);
    renderReviewTemplates();
  });

  addMessageTemplate.addEventListener('click', () => {
    const templateId = `message_${Date.now()}`;
    const template = {
      id: templateId,
      name: 'Новый шаблон',
      content: ''
    };

    automationConfig.templates = automationConfig.templates || [];
    automationConfig.templates.push(template);
    renderMessageTemplates();
  });

  exportSettings.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({
      action: 'exportSettings'
    });

    if (response.success) {
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `funpay-customizer-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('✓ Настройки экспортированы!');
    }
  });

  importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        const validation = await chrome.runtime.sendMessage({
          action: 'validateImportData',
          data: data
        });

        if (validation.success && validation.validation.valid) {
          pendingImportData = data;
          displayImportPreview(data);
        } else {
          showNotification('❌ Неверный формат файла: ' + validation.validation.errors.join(', '), 'error');
        }
      } catch (error) {
        showNotification('❌ Ошибка чтения файла: ' + error.message, 'error');
      }
    };
    reader.readAsText(file);
  });

  importConfirm.addEventListener('click', async () => {
    if (!pendingImportData) return;

    const options = {
      includeThemes: document.getElementById('import-themes').checked,
      includeAutomation: document.getElementById('import-automation').checked,
      includeStats: document.getElementById('import-stats').checked,
      clearExisting: document.getElementById('clear-existing').checked
    };

    const response = await chrome.runtime.sendMessage({
      action: 'importSettings',
      data: pendingImportData,
      options: options
    });

    if (response.success) {
      showNotification('✓ Настройки импортированы!');
      document.getElementById('import-preview').style.display = 'none';
      pendingImportData = null;
      await loadSettings();
      await loadAutomationSettings();
    } else {
      showNotification('❌ Ошибка импорта: ' + response.errors.join(', '), 'error');
    }
  });

  importCancel.addEventListener('click', () => {
    document.getElementById('import-preview').style.display = 'none';
    pendingImportData = null;
    importFile.value = '';
  });

  async function loadAutomationSettings() {
    const response = await chrome.runtime.sendMessage({
      action: 'getAutomationConfig'
    });

    if (response.success) {
      automationConfig = response.config;
      
      automationEnabled.checked = automationConfig.enabled || false;
      rateLimitPerContact.value = automationConfig.rateLimitPerContact || 3;
      rateLimitPeriod.value = automationConfig.rateLimitPeriodMinutes || 60;
      quietHoursEnabled.checked = automationConfig.quietHoursEnabled || false;
      quietHoursStart.value = automationConfig.quietHoursStart || '22:00';
      quietHoursEnd.value = automationConfig.quietHoursEnd || '08:00';
      defaultDelay.value = automationConfig.delayMinutes || 5;
      escalationDelay.value = automationConfig.escalationDelayHours || 24;
      escalationEnabled.checked = automationConfig.escalationEnabled || false;
      showNotificationsCheckbox.checked = automationConfig.showNotifications !== false;

      renderReviewTemplates();
      renderMessageTemplates();
    }
  }

  function renderReviewTemplates() {
    reviewTemplatesList.innerHTML = '';
    const templates = automationConfig.reviewTemplates || [];

    templates.forEach((template, index) => {
      const div = document.createElement('div');
      div.className = 'template-item';
      div.innerHTML = `
        <div class="template-header">
          <input type="text" value="${template.name}" class="template-name" data-index="${index}" data-type="review">
          <label class="checkbox-label">
            <input type="checkbox" ${template.enabled ? 'checked' : ''} class="template-enabled" data-index="${index}" data-type="review">
            <span>Включено</span>
          </label>
          <button class="btn-delete" data-index="${index}" data-type="review">✕</button>
        </div>
        <textarea class="template-content" data-index="${index}" data-type="review" placeholder="Текст шаблона...">${template.content}</textarea>
        <div class="template-options">
          <label>Задержка (мин): <input type="number" value="${template.delayMinutes || 5}" min="1" class="template-delay" data-index="${index}" data-type="review"></label>
          <label>Фильтр рейтинга: <input type="text" value="${(template.ratingFilter || []).join(',')}" placeholder="1,2,3,4,5" class="template-rating" data-index="${index}" data-type="review"></label>
        </div>
      `;
      reviewTemplatesList.appendChild(div);
    });

    attachTemplateListeners();
  }

  function renderMessageTemplates() {
    messageTemplatesList.innerHTML = '';
    const templates = automationConfig.templates || [];

    templates.forEach((template, index) => {
      const div = document.createElement('div');
      div.className = 'template-item';
      div.innerHTML = `
        <div class="template-header">
          <input type="text" value="${template.name}" class="template-name" data-index="${index}" data-type="message">
          <button class="btn-delete" data-index="${index}" data-type="message">✕</button>
        </div>
        <textarea class="template-content" data-index="${index}" data-type="message" placeholder="Текст шаблона...">${template.content}</textarea>
      `;
      messageTemplatesList.appendChild(div);
    });

    attachTemplateListeners();
  }

  function attachTemplateListeners() {
    document.querySelectorAll('.template-name').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        const type = e.target.dataset.type;
        if (type === 'review') {
          automationConfig.reviewTemplates[index].name = e.target.value;
        } else {
          automationConfig.templates[index].name = e.target.value;
        }
      });
    });

    document.querySelectorAll('.template-content').forEach(textarea => {
      textarea.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        const type = e.target.dataset.type;
        if (type === 'review') {
          automationConfig.reviewTemplates[index].content = e.target.value;
        } else {
          automationConfig.templates[index].content = e.target.value;
        }
      });
    });

    document.querySelectorAll('.template-enabled').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        automationConfig.reviewTemplates[index].enabled = e.target.checked;
      });
    });

    document.querySelectorAll('.template-delay').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        automationConfig.reviewTemplates[index].delayMinutes = parseInt(e.target.value);
      });
    });

    document.querySelectorAll('.template-rating').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        const ratings = e.target.value.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
        automationConfig.reviewTemplates[index].ratingFilter = ratings;
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const type = e.target.dataset.type;
        if (type === 'review') {
          automationConfig.reviewTemplates.splice(index, 1);
          renderReviewTemplates();
        } else {
          automationConfig.templates.splice(index, 1);
          renderMessageTemplates();
        }
      });
    });
  }

  function displayImportPreview(data) {
    const preview = document.getElementById('import-preview');
    const details = document.getElementById('import-details');
    
    const summary = {
      version: data.version,
      exportDate: data.exportDate,
      hasThemes: !!data.settings?.theme,
      hasAutomation: !!data.settings?.automation,
      hasPendingMessages: data.automation?.pendingMessages?.length || 0,
      hasStats: !!data.automation?.stats
    };

    details.textContent = JSON.stringify(summary, null, 2);
    preview.style.display = 'block';
  }

  function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');

    if (type === 'error') {
      notification.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)';
    } else {
      notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
});
