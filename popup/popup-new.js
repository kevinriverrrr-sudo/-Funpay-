const storage = new StorageManager();
const messageBus = new MessageBus();

document.addEventListener('DOMContentLoaded', async () => {
  const themeSelect = document.getElementById('theme-select');
  const fontSelect = document.getElementById('font-select');
  const fontSizeInput = document.getElementById('font-size');
  const fontSizeValue = document.getElementById('font-size-value');
  const coverUpload = document.getElementById('cover-upload');
  const coverPreview = document.getElementById('cover-preview');
  const coverPreviewImg = document.getElementById('cover-preview-img');
  const removeCoverBtn = document.getElementById('remove-cover');
  const coverPosition = document.getElementById('cover-position');
  const coverSize = document.getElementById('cover-size');
  const applyBtn = document.getElementById('apply-btn');
  const resetBtn = document.getElementById('reset-btn');
  const optionsBtn = document.getElementById('options-btn');

  let currentSettings = {};

  await loadSettings();

  fontSizeInput.addEventListener('input', (e) => {
    fontSizeValue.textContent = e.target.value;
  });

  coverUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5 МБ');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        coverPreviewImg.src = imageData;
        coverPreview.style.display = 'block';
        currentSettings.coverImage = imageData;
      };
      reader.readAsDataURL(file);
    }
  });

  removeCoverBtn.addEventListener('click', () => {
    coverPreview.style.display = 'none';
    coverPreviewImg.src = '';
    currentSettings.coverImage = null;
    coverUpload.value = '';
  });

  applyBtn.addEventListener('click', async () => {
    const settings = {
      theme: themeSelect.value,
      customTheme: currentSettings.customTheme || null,
      font: fontSelect.value,
      fontSize: fontSizeInput.value,
      coverImage: currentSettings.coverImage || null,
      coverPosition: coverPosition.value,
      coverSize: coverSize.value
    };

    try {
      await storage.set(settings, true);

      await messageBus.sendToBackground(MESSAGE_TYPES.APPLY_TO_ALL_TABS, { settings });

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && (tab.url.includes('funpay.com'))) {
        try {
          await messageBus.sendToTab(tab.id, MESSAGE_TYPES.UPDATE_SETTINGS, { settings });
        } catch (error) {
          console.log('Could not send message to tab, it may need a reload');
          chrome.tabs.reload(tab.id);
        }
      }

      showNotification('✓ Настройки применены!');
    } catch (error) {
      console.error('Failed to apply settings:', error);
      showNotification('❌ Ошибка при применении настроек', 'error');
    }
  });

  resetBtn.addEventListener('click', async () => {
    if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
      const defaultSettings = {
        theme: 'default',
        customTheme: null,
        font: 'default',
        fontSize: '14',
        coverImage: null,
        coverPosition: 'center',
        coverSize: 'cover'
      };

      try {
        await storage.set(defaultSettings, true);

        await messageBus.sendToBackground(MESSAGE_TYPES.APPLY_TO_ALL_TABS, { settings: defaultSettings });

        await loadSettings();
        showNotification('⟲ Настройки сброшены!');
      } catch (error) {
        console.error('Failed to reset settings:', error);
        showNotification('❌ Ошибка при сбросе настроек', 'error');
      }
    }
  });

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  async function loadSettings() {
    const settings = await storage.get({
      theme: 'default',
      customTheme: null,
      font: 'default',
      fontSize: '14',
      coverImage: null,
      coverPosition: 'center',
      coverSize: 'cover'
    }, true);

    currentSettings = settings;

    themeSelect.value = settings.theme;
    fontSelect.value = settings.font;
    fontSizeInput.value = settings.fontSize;
    fontSizeValue.textContent = settings.fontSize;
    coverPosition.value = settings.coverPosition;
    coverSize.value = settings.coverSize;

    if (settings.coverImage) {
      coverPreviewImg.src = settings.coverImage;
      coverPreview.style.display = 'block';
    }
  }

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    const backgroundColor = type === 'error' 
      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${backgroundColor};
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
});
