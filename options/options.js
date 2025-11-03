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

  const lotUtilitiesEnabledOptions = document.getElementById('lot-utilities-enabled-options');
  const quickTradePanelEnabledOptions = document.getElementById('quick-trade-panel-enabled-options');

  let currentSettings = {};

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

  saveAll.addEventListener('click', async () => {
    const settings = {
      theme: currentSettings.theme,
      customTheme: currentSettings.customTheme || null,
      font: currentSettings.font,
      fontSize: currentSettings.fontSize,
      lotUtilitiesEnabled: lotUtilitiesEnabledOptions.checked,
      quickTradePanelEnabled: quickTradePanelEnabledOptions.checked,
      pinnedLots: currentSettings.pinnedLots || [],
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
        lotUtilitiesEnabled: false,
        quickTradePanelEnabled: false,
        pinnedLots: [],
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
      lotUtilitiesEnabled: false,
      quickTradePanelEnabled: false,
      pinnedLots: [],
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
    lotUtilitiesEnabledOptions.checked = settings.lotUtilitiesEnabled;
    quickTradePanelEnabledOptions.checked = settings.quickTradePanelEnabled;
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
});
