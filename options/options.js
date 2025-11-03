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

  const lotFileUpload = document.getElementById('lot-file-upload');
  const lotFileInfo = document.getElementById('lot-file-info');
  const lotFileName = document.getElementById('lot-file-name');
  const lotCountInfo = document.getElementById('lot-count-info');
  const removeLotFile = document.getElementById('remove-lot-file');
  const batchSize = document.getElementById('batch-size');
  const batchSizeDisplay = document.getElementById('batch-size-display');
  const throttleDelay = document.getElementById('throttle-delay');
  const throttleDelayDisplay = document.getElementById('throttle-delay-display');
  const validateBeforeImport = document.getElementById('validate-before-import');
  const reviewBeforeSubmit = document.getElementById('review-before-submit');
  const validationResults = document.getElementById('validation-results');
  const validationContent = document.getElementById('validation-content');
  const startImport = document.getElementById('start-import');
  const importProgress = document.getElementById('import-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const cancelImport = document.getElementById('cancel-import');

  let currentSettings = {};
  let lotsData = null;
  let importCancelled = false;

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

  lotFileUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showNotification('❌ Размер файла не должен превышать 10 МБ', 'error');
        return;
      }

      try {
        const content = await readFileContent(file);
        const parsedLots = parseLotsFile(content, file.name);
        
        if (parsedLots && parsedLots.length > 0) {
          lotsData = parsedLots;
          lotFileName.textContent = `📄 ${file.name}`;
          lotCountInfo.textContent = `Найдено лотов: ${parsedLots.length}`;
          lotFileInfo.style.display = 'block';
          startImport.disabled = false;

          if (validateBeforeImport.checked) {
            validateLots(parsedLots);
          }

          showNotification(`✓ Файл загружен: ${parsedLots.length} лотов`);
        } else {
          showNotification('❌ Не удалось найти лоты в файле', 'error');
        }
      } catch (error) {
        showNotification(`❌ Ошибка при чтении файла: ${error.message}`, 'error');
      }
    }
  });

  removeLotFile.addEventListener('click', () => {
    lotsData = null;
    lotFileInfo.style.display = 'none';
    lotFileUpload.value = '';
    startImport.disabled = true;
    validationResults.style.display = 'none';
    importProgress.style.display = 'none';
  });

  batchSize.addEventListener('input', (e) => {
    batchSizeDisplay.textContent = e.target.value;
    saveImportSettings();
  });

  throttleDelay.addEventListener('input', (e) => {
    throttleDelayDisplay.textContent = e.target.value;
    saveImportSettings();
  });

  validateBeforeImport.addEventListener('change', () => {
    if (validateBeforeImport.checked && lotsData) {
      validateLots(lotsData);
    } else {
      validationResults.style.display = 'none';
    }
    saveImportSettings();
  });

  reviewBeforeSubmit.addEventListener('change', () => {
    saveImportSettings();
  });

  startImport.addEventListener('click', async () => {
    if (!lotsData || lotsData.length === 0) {
      showNotification('❌ Сначала загрузите файл с лотами', 'error');
      return;
    }

    importCancelled = false;
    startImport.disabled = true;
    importProgress.style.display = 'block';

    await performImport(lotsData);
  });

  cancelImport.addEventListener('click', () => {
    importCancelled = true;
    showNotification('⏸ Импорт отменен', 'error');
  });

  await loadImportSettings();

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

  async function readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }

  function parseLotsFile(content, fileName) {
    const isJSON = fileName.endsWith('.json');
    
    if (isJSON) {
      try {
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [data];
      } catch (error) {
        throw new Error('Неверный формат JSON');
      }
    } else {
      return parseTxtLots(content);
    }
  }

  function parseTxtLots(content) {
    const lots = [];
    const lotBlocks = content.split('---').map(block => block.trim()).filter(block => block);

    for (const block of lotBlocks) {
      const lot = {};
      const lines = block.split('\n');

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          
          if (key && value) {
            if (key === 'price' || key === 'stock') {
              lot[key] = parseFloat(value);
            } else {
              lot[key] = value;
            }
          }
        }
      }

      if (Object.keys(lot).length > 0) {
        lots.push(lot);
      }
    }

    return lots;
  }

  function validateLots(lots) {
    const results = [];
    const requiredFields = ['name', 'price'];
    const optionalFields = ['description', 'category', 'subcategory', 'gameId', 'serverId', 'stock', 'currency'];
    
    lots.forEach((lot, index) => {
      const lotErrors = [];
      const lotWarnings = [];

      requiredFields.forEach(field => {
        if (!lot[field]) {
          lotErrors.push(`Отсутствует обязательное поле: ${field}`);
        }
      });

      if (lot.price && (isNaN(lot.price) || lot.price <= 0)) {
        lotErrors.push('Цена должна быть положительным числом');
      }

      if (lot.stock && (isNaN(lot.stock) || lot.stock < 0)) {
        lotErrors.push('Количество должно быть неотрицательным числом');
      }

      if (lot.name && lot.name.length > 200) {
        lotWarnings.push('Название слишком длинное (более 200 символов)');
      }

      if (lot.description && lot.description.length > 5000) {
        lotWarnings.push('Описание слишком длинное (более 5000 символов)');
      }

      results.push({
        index: index + 1,
        name: lot.name || 'Без названия',
        errors: lotErrors,
        warnings: lotWarnings,
        valid: lotErrors.length === 0
      });
    });

    displayValidationResults(results);
    return results;
  }

  function displayValidationResults(results) {
    validationContent.innerHTML = '';
    
    const totalLots = results.length;
    const validLots = results.filter(r => r.valid).length;
    const invalidLots = totalLots - validLots;

    const summary = document.createElement('div');
    summary.className = 'validation-item ' + (invalidLots > 0 ? 'warning' : 'success');
    summary.innerHTML = `
      <strong>Итого:</strong>
      <span>Всего лотов: ${totalLots} | Валидных: ${validLots} | С ошибками: ${invalidLots}</span>
    `;
    validationContent.appendChild(summary);

    results.forEach(result => {
      if (result.errors.length > 0 || result.warnings.length > 0) {
        const item = document.createElement('div');
        item.className = 'validation-item ' + (result.errors.length > 0 ? 'error' : 'warning');
        
        let html = `<strong>Лот #${result.index}: ${result.name}</strong>`;
        
        if (result.errors.length > 0) {
          html += '<div style="margin-top: 5px;">';
          result.errors.forEach(error => {
            html += `<span style="display: block; color: #721c24;">❌ ${error}</span>`;
          });
          html += '</div>';
        }
        
        if (result.warnings.length > 0) {
          html += '<div style="margin-top: 5px;">';
          result.warnings.forEach(warning => {
            html += `<span style="display: block; color: #856404;">⚠️ ${warning}</span>`;
          });
          html += '</div>';
        }
        
        item.innerHTML = html;
        validationContent.appendChild(item);
      }
    });

    validationResults.style.display = 'block';
  }

  async function performImport(lots) {
    const batch = parseInt(batchSize.value);
    const delay = parseFloat(throttleDelay.value) * 1000;
    const reviewMode = reviewBeforeSubmit.checked;
    
    let processed = 0;
    const total = lots.length;

    for (let i = 0; i < total; i += batch) {
      if (importCancelled) {
        startImport.disabled = false;
        return;
      }

      const batchLots = lots.slice(i, Math.min(i + batch, total));
      
      for (const lot of batchLots) {
        if (importCancelled) {
          startImport.disabled = false;
          return;
        }

        try {
          await importLot(lot, reviewMode);
          processed++;
        } catch (error) {
          console.error('Ошибка импорта лота:', error);
          showNotification(`❌ Ошибка: ${error.message}`, 'error');
        }

        updateProgress(processed, total);
      }

      if (i + batch < total) {
        await sleep(delay);
      }
    }

    showNotification(`✓ Импорт завершен! Обработано: ${processed} из ${total}`);
    startImport.disabled = false;
    importProgress.style.display = 'none';
  }

  async function importLot(lot, reviewMode) {
    const tabs = await chrome.tabs.query({ url: ['https://funpay.com/*', 'https://*.funpay.com/*'] });
    
    if (tabs.length === 0) {
      throw new Error('Откройте вкладку FunPay для импорта');
    }

    await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'importLot',
      lot: lot,
      reviewMode: reviewMode
    });

    if (!reviewMode) {
      await sleep(500);
    }
  }

  function updateProgress(processed, total) {
    const percentage = (processed / total) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `Обработано: ${processed} из ${total}`;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function saveImportSettings() {
    const importSettings = {
      batchSize: parseInt(batchSize.value),
      throttleDelay: parseFloat(throttleDelay.value),
      validateBeforeImport: validateBeforeImport.checked,
      reviewBeforeSubmit: reviewBeforeSubmit.checked
    };

    await chrome.storage.sync.set({ importSettings });
  }

  async function loadImportSettings() {
    const data = await chrome.storage.sync.get({
      importSettings: {
        batchSize: 5,
        throttleDelay: 2,
        validateBeforeImport: true,
        reviewBeforeSubmit: true
      }
    });

    const settings = data.importSettings;
    batchSize.value = settings.batchSize;
    batchSizeDisplay.textContent = settings.batchSize;
    throttleDelay.value = settings.throttleDelay;
    throttleDelayDisplay.textContent = settings.throttleDelay;
    validateBeforeImport.checked = settings.validateBeforeImport;
    reviewBeforeSubmit.checked = settings.reviewBeforeSubmit;
  }
});
