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

  const highlightEnabled = document.getElementById('highlight-enabled');
  const notificationsEnabled = document.getElementById('notifications-enabled');
  const soundEnabled = document.getElementById('sound-enabled');
  const keywordText = document.getElementById('keyword-text');
  const keywordColor = document.getElementById('keyword-color');
  const keywordPriority = document.getElementById('keyword-priority');
  const keywordRegex = document.getElementById('keyword-regex');
  const addKeyword = document.getElementById('add-keyword');
  const keywordsList = document.getElementById('keywords-list');

  let currentSettings = {};
  let keywords = [];

  await loadSettings();

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

  addKeyword.addEventListener('click', () => {
    const text = keywordText.value.trim();
    if (!text) {
      showNotification('❌ Введите ключевое слово', 'error');
      return;
    }

    if (keywordRegex.checked) {
      try {
        new RegExp(text);
      } catch (e) {
        showNotification('❌ Неверное регулярное выражение', 'error');
        return;
      }
    }

    const keyword = {
      id: Date.now(),
      text: text,
      color: keywordColor.value,
      priority: keywordPriority.value,
      isRegex: keywordRegex.checked
    };

    keywords.push(keyword);
    renderKeywords();
    
    keywordText.value = '';
    keywordRegex.checked = false;
    
    showNotification('✓ Ключевое слово добавлено!');
  });

  keywordText.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addKeyword.click();
    }
  });

  saveAll.addEventListener('click', async () => {
    const settings = {
      theme: currentSettings.theme,
      customTheme: currentSettings.customTheme || null,
      font: currentSettings.font,
      fontSize: currentSettings.fontSize,
      coverImage: currentSettings.coverImage || null,
      coverPosition: currentSettings.coverPosition,
      coverSize: currentSettings.coverSize,
      chatTools: {
        highlightEnabled: highlightEnabled.checked,
        notificationsEnabled: notificationsEnabled.checked,
        soundEnabled: soundEnabled.checked,
        keywords: keywords
      }
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
        coverSize: 'cover',
        chatTools: {
          highlightEnabled: true,
          notificationsEnabled: true,
          soundEnabled: false,
          keywords: []
        }
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
      coverSize: 'cover',
      chatTools: {
        highlightEnabled: true,
        notificationsEnabled: true,
        soundEnabled: false,
        keywords: []
      }
    });

    currentSettings = settings;
    
    if (settings.chatTools) {
      highlightEnabled.checked = settings.chatTools.highlightEnabled;
      notificationsEnabled.checked = settings.chatTools.notificationsEnabled;
      soundEnabled.checked = settings.chatTools.soundEnabled;
      keywords = settings.chatTools.keywords || [];
      renderKeywords();
    }

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

  function renderKeywords() {
    keywordsList.innerHTML = '';
    
    keywords.forEach(keyword => {
      const item = document.createElement('div');
      item.className = 'keyword-item';
      item.style.borderLeftColor = keyword.color;
      
      const info = document.createElement('div');
      info.className = 'keyword-info';
      
      const text = document.createElement('span');
      text.className = 'keyword-text';
      text.textContent = keyword.text;
      
      const badge = document.createElement('span');
      badge.className = `keyword-badge ${keyword.priority}`;
      badge.textContent = keyword.priority;
      
      info.appendChild(text);
      info.appendChild(badge);
      
      if (keyword.isRegex) {
        const regexBadge = document.createElement('span');
        regexBadge.className = 'keyword-regex-badge';
        regexBadge.textContent = 'REGEX';
        info.appendChild(regexBadge);
      }
      
      const actions = document.createElement('div');
      actions.className = 'keyword-actions';
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon';
      deleteBtn.textContent = '✕';
      deleteBtn.title = 'Удалить';
      deleteBtn.addEventListener('click', () => {
        keywords = keywords.filter(k => k.id !== keyword.id);
        renderKeywords();
        showNotification('✓ Ключевое слово удалено');
      });
      
      actions.appendChild(deleteBtn);
      
      item.appendChild(info);
      item.appendChild(actions);
      keywordsList.appendChild(item);
    });
  }
});
