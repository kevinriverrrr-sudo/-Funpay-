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

  const manualLiftAll = document.getElementById('manual-lift-all');
  const manualActivateAll = document.getElementById('manual-activate-all');
  const manualDeactivateAll = document.getElementById('manual-deactivate-all');
  const lotActionResults = document.getElementById('lot-action-results');
  const lotResultsContent = document.getElementById('lot-results-content');

  const automationEnabled = document.getElementById('automation-enabled');
  const notificationsEnabled = document.getElementById('notifications-enabled');
  const scheduleFrequency = document.getElementById('schedule-frequency');
  const datetimeRow = document.getElementById('datetime-row');
  const createScheduleBtn = document.getElementById('create-schedule-btn');
  const schedulesList = document.getElementById('schedules-list');

  let currentSettings = {};

  await loadSettings();
  await loadAutomationSettings();
  await loadSchedules();

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

  manualLiftAll.addEventListener('click', async () => {
    manualLiftAll.disabled = true;
    manualLiftAll.textContent = '⏳ Выполняется...';
    
    const results = await chrome.runtime.sendMessage({
      action: 'executeLotAction',
      actionType: 'lift'
    });
    
    displayResults(results);
    manualLiftAll.disabled = false;
    manualLiftAll.textContent = '⬆️ Поднять все лоты';
  });

  manualActivateAll.addEventListener('click', async () => {
    manualActivateAll.disabled = true;
    manualActivateAll.textContent = '⏳ Выполняется...';
    
    const results = await chrome.runtime.sendMessage({
      action: 'executeLotAction',
      actionType: 'toggle',
      targetState: true
    });
    
    displayResults(results);
    manualActivateAll.disabled = false;
    manualActivateAll.textContent = '✓ Активировать все лоты';
  });

  manualDeactivateAll.addEventListener('click', async () => {
    manualDeactivateAll.disabled = true;
    manualDeactivateAll.textContent = '⏳ Выполняется...';
    
    const results = await chrome.runtime.sendMessage({
      action: 'executeLotAction',
      actionType: 'toggle',
      targetState: false
    });
    
    displayResults(results);
    manualDeactivateAll.disabled = false;
    manualDeactivateAll.textContent = '✕ Деактивировать все лоты';
  });

  automationEnabled.addEventListener('change', async () => {
    await chrome.storage.sync.set({ automationEnabled: automationEnabled.checked });
    showNotification(automationEnabled.checked ? '✓ Автоматизация включена' : '⏸ Автоматизация приостановлена');
  });

  notificationsEnabled.addEventListener('change', async () => {
    await chrome.storage.sync.set({ notificationsEnabled: notificationsEnabled.checked });
    showNotification(notificationsEnabled.checked ? '✓ Уведомления включены' : '🔕 Уведомления отключены');
  });

  scheduleFrequency.addEventListener('change', () => {
    if (scheduleFrequency.value === 'once') {
      datetimeRow.style.display = 'block';
    } else {
      datetimeRow.style.display = 'none';
    }
  });

  createScheduleBtn.addEventListener('click', async () => {
    const scheduleName = document.getElementById('schedule-name').value.trim();
    const scheduleAction = document.getElementById('schedule-action').value;
    const frequency = scheduleFrequency.value;
    const datetime = document.getElementById('schedule-datetime').value;

    if (!scheduleName) {
      showNotification('⚠️ Введите название расписания', 'error');
      return;
    }

    if (frequency === 'once' && !datetime) {
      showNotification('⚠️ Укажите дату и время выполнения', 'error');
      return;
    }

    const schedule = {
      name: scheduleName,
      actionType: scheduleAction.startsWith('toggle') ? 'toggle' : scheduleAction,
      targetState: scheduleAction === 'toggle-activate' ? true : (scheduleAction === 'toggle-deactivate' ? false : null),
      frequency: frequency,
      datetime: datetime || null
    };

    const response = await chrome.runtime.sendMessage({
      action: 'createSchedule',
      schedule: schedule
    });

    if (response.success) {
      showNotification('✓ Расписание создано успешно!');
      document.getElementById('schedule-name').value = '';
      document.getElementById('schedule-datetime').value = '';
      await loadSchedules();
    } else {
      showNotification('❌ Ошибка создания расписания', 'error');
    }
  });

  async function loadAutomationSettings() {
    const settings = await chrome.storage.sync.get({
      automationEnabled: true,
      notificationsEnabled: true
    });

    automationEnabled.checked = settings.automationEnabled;
    notificationsEnabled.checked = settings.notificationsEnabled;
  }

  async function loadSchedules() {
    const data = await chrome.storage.sync.get('automationSchedules');
    const schedules = data.automationSchedules || [];

    if (schedules.length === 0) {
      schedulesList.innerHTML = '<p class="empty-state">Нет активных расписаний. Создайте новое выше.</p>';
      return;
    }

    schedulesList.innerHTML = '';
    schedules.forEach(schedule => {
      const scheduleItem = createScheduleItem(schedule);
      schedulesList.appendChild(scheduleItem);
    });
  }

  function createScheduleItem(schedule) {
    const div = document.createElement('div');
    div.className = `schedule-item ${schedule.paused ? 'paused' : ''}`;
    
    const actionText = schedule.actionType === 'lift' ? 'Поднятие' : (schedule.targetState ? 'Активация' : 'Деактивация');
    const frequencyText = getFrequencyText(schedule.frequency);
    
    let nextExecution = '';
    if (!schedule.paused) {
      nextExecution = `<div class="next-execution">⏰ Следующее выполнение: ${getNextExecutionTime(schedule)}</div>`;
    }

    div.innerHTML = `
      <div class="schedule-header">
        <h4 class="schedule-title">${schedule.name}</h4>
        <div>
          <span class="schedule-badge ${schedule.actionType}">${actionText}</span>
          ${schedule.paused ? '<span class="schedule-badge paused">Приостановлено</span>' : ''}
        </div>
      </div>
      <div class="schedule-details">
        <div class="schedule-detail">
          <strong>Частота:</strong> ${frequencyText}
        </div>
        <div class="schedule-detail">
          <strong>Создано:</strong> ${new Date(schedule.created).toLocaleString('ru-RU')}
        </div>
        ${schedule.lastExecution ? `
          <div class="schedule-detail">
            <strong>Последнее выполнение:</strong> ${new Date(schedule.lastExecution).toLocaleString('ru-RU')}
          </div>
        ` : ''}
        ${schedule.executionCount ? `
          <div class="schedule-detail">
            <strong>Выполнено раз:</strong> ${schedule.executionCount}
          </div>
        ` : ''}
      </div>
      ${nextExecution}
      <div class="schedule-actions">
        <button class="btn ${schedule.paused ? 'btn-success' : 'btn-warning'} toggle-schedule-btn" data-id="${schedule.id}" data-paused="${schedule.paused}">
          ${schedule.paused ? '▶️ Возобновить' : '⏸ Приостановить'}
        </button>
        <button class="btn btn-danger delete-schedule-btn" data-id="${schedule.id}">
          🗑️ Удалить
        </button>
      </div>
    `;

    const toggleBtn = div.querySelector('.toggle-schedule-btn');
    const deleteBtn = div.querySelector('.delete-schedule-btn');

    toggleBtn.addEventListener('click', async () => {
      const isPaused = toggleBtn.dataset.paused === 'true';
      await chrome.runtime.sendMessage({
        action: 'pauseSchedule',
        scheduleId: schedule.id,
        paused: !isPaused
      });
      await loadSchedules();
      showNotification(isPaused ? '▶️ Расписание возобновлено' : '⏸ Расписание приостановлено');
    });

    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Удалить расписание "${schedule.name}"?`)) {
        await chrome.runtime.sendMessage({
          action: 'deleteSchedule',
          scheduleId: schedule.id
        });
        await loadSchedules();
        showNotification('🗑️ Расписание удалено');
      }
    });

    return div;
  }

  function getFrequencyText(frequency) {
    const texts = {
      'once': 'Один раз',
      '15min': 'Каждые 15 минут',
      '30min': 'Каждые 30 минут',
      '1hour': 'Каждый час',
      '2hours': 'Каждые 2 часа',
      '4hours': 'Каждые 4 часа',
      '6hours': 'Каждые 6 часов',
      '12hours': 'Каждые 12 часов',
      '24hours': 'Каждые 24 часа'
    };
    return texts[frequency] || frequency;
  }

  function getNextExecutionTime(schedule) {
    if (schedule.frequency === 'once' && schedule.datetime) {
      return new Date(schedule.datetime).toLocaleString('ru-RU');
    }
    
    const now = new Date();
    const lastExec = schedule.lastExecution ? new Date(schedule.lastExecution) : now;
    const intervals = {
      '15min': 15, '30min': 30, '1hour': 60, '2hours': 120,
      '4hours': 240, '6hours': 360, '12hours': 720, '24hours': 1440
    };
    
    const minutes = intervals[schedule.frequency] || 60;
    const nextTime = new Date(lastExec.getTime() + minutes * 60000);
    return nextTime.toLocaleString('ru-RU');
  }

  function displayResults(results) {
    lotActionResults.style.display = 'block';
    
    let html = `
      <p><strong>Всего лотов:</strong> ${results.total}</p>
      <p class="success"><strong>Успешно:</strong> ${results.successful}</p>
      <p class="error"><strong>Ошибок:</strong> ${results.failed}</p>
    `;
    
    if (results.errors && results.errors.length > 0) {
      html += '<p><strong>Детали ошибок:</strong></p><ul>';
      results.errors.slice(0, 5).forEach(error => {
        html += `<li class="error">${error}</li>`;
      });
      if (results.errors.length > 5) {
        html += `<li class="error">... и ещё ${results.errors.length - 5} ошибок</li>`;
      }
      html += '</ul>';
    }
    
    lotResultsContent.innerHTML = html;
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
