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

  const snowTrailEnabled = document.getElementById('snow-trail-enabled');
  const animatedLogoEnabled = document.getElementById('animated-logo-enabled');
  const customCursorEnabled = document.getElementById('custom-cursor-enabled');
  const cursorType = document.getElementById('cursor-type');
  const cursorUpload = document.getElementById('cursor-upload');
  const cursorSettings = document.getElementById('cursor-settings');
  const cursorUploadSettings = document.getElementById('cursor-upload-settings');
  const cursorPreviewContainer = document.getElementById('cursor-preview-container');
  const cursorPreviewArea = document.getElementById('cursor-preview-area');
  const removeCursorBtn = document.getElementById('remove-cursor');

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

  snowTrailEnabled.addEventListener('change', () => {
    currentSettings.snowTrailEnabled = snowTrailEnabled.checked;
  });

  animatedLogoEnabled.addEventListener('change', () => {
    currentSettings.animatedLogoEnabled = animatedLogoEnabled.checked;
  });

  customCursorEnabled.addEventListener('change', () => {
    currentSettings.customCursorEnabled = customCursorEnabled.checked;
    cursorSettings.style.display = customCursorEnabled.checked ? 'block' : 'none';
    if (!customCursorEnabled.checked) {
      cursorUploadSettings.style.display = 'none';
    }
  });

  cursorType.addEventListener('change', () => {
    currentSettings.customCursorType = cursorType.value;
    cursorUploadSettings.style.display = cursorType.value === 'custom' ? 'block' : 'none';
    
    if (cursorType.value !== 'custom') {
      cursorPreviewArea.style.cursor = getCursorValue(cursorType.value);
    }
  });

  cursorUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        showNotification('❌ Размер файла не должен превышать 1 МБ', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        currentSettings.customCursorImage = imageData;
        cursorPreviewContainer.style.display = 'block';
        cursorPreviewArea.style.cursor = `url("${imageData}") 16 16, auto`;
      };
      reader.readAsDataURL(file);
    }
  });

  removeCursorBtn.addEventListener('click', () => {
    currentSettings.customCursorImage = null;
    cursorUpload.value = '';
    cursorPreviewContainer.style.display = 'none';
    cursorPreviewArea.style.cursor = 'default';
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
      coverSize: currentSettings.coverSize,
      snowTrailEnabled: currentSettings.snowTrailEnabled || false,
      animatedLogoEnabled: currentSettings.animatedLogoEnabled || false,
      customCursorEnabled: currentSettings.customCursorEnabled || false,
      customCursorType: currentSettings.customCursorType || 'default',
      customCursorImage: currentSettings.customCursorImage || null
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
        snowTrailEnabled: false,
        animatedLogoEnabled: false,
        customCursorEnabled: false,
        customCursorType: 'default',
        customCursorImage: null
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
      snowTrailEnabled: false,
      animatedLogoEnabled: false,
      customCursorEnabled: false,
      customCursorType: 'default',
      customCursorImage: null
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

    snowTrailEnabled.checked = settings.snowTrailEnabled || false;
    animatedLogoEnabled.checked = settings.animatedLogoEnabled || false;
    customCursorEnabled.checked = settings.customCursorEnabled || false;
    cursorType.value = settings.customCursorType || 'default';

    cursorSettings.style.display = settings.customCursorEnabled ? 'block' : 'none';
    cursorUploadSettings.style.display = (settings.customCursorEnabled && settings.customCursorType === 'custom') ? 'block' : 'none';

    if (settings.customCursorImage) {
      cursorPreviewContainer.style.display = 'block';
      cursorPreviewArea.style.cursor = `url("${settings.customCursorImage}") 16 16, auto`;
    }

    updateFontPreview();
  }

  function getCursorValue(cursorType) {
    const presetCursors = {
      default: 'default',
      pointer: 'pointer',
      neonPointer: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'10\' fill=\'%23667eea\' opacity=\'0.5\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'5\' fill=\'%23764ba2\'/%3E%3C/svg%3E") 16 16, auto',
      arrow: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\'%3E%3Cpath d=\'M2 2 L2 20 L8 14 L12 22 L14 21 L10 13 L18 13 Z\' fill=\'%23ffffff\' stroke=\'%23000000\' stroke-width=\'1\'/%3E%3C/svg%3E") 2 2, auto',
      target: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'12\' fill=\'none\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'6\' fill=\'none\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'16\' y1=\'4\' x2=\'16\' y2=\'10\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'16\' y1=\'22\' x2=\'16\' y2=\'28\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'4\' y1=\'16\' x2=\'10\' y2=\'16\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'22\' y1=\'16\' x2=\'28\' y2=\'16\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3C/svg%3E") 16 16, auto',
      gaming: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'14\' fill=\'%2300ff00\' opacity=\'0.3\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'8\' fill=\'%2300ff00\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'2\' fill=\'%23000000\'/%3E%3C/svg%3E") 16 16, auto'
    };
    
    return presetCursors[cursorType] || 'default';
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
