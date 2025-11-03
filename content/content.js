// Content script для внедрения стилей на страницы FunPay

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
    const settings = await chrome.storage.sync.get({
      theme: 'default',
      customTheme: null,
      font: 'default',
      fontSize: '14',
      coverImage: null,
      coverPosition: 'center',
      coverSize: 'cover'
    });

    this.applySettings(settings);
  }

  applySettings(settings) {
    this.applyTheme(settings.theme, settings.customTheme);
    this.applyFont(settings.font, settings.fontSize);
    this.applyCover(settings.coverImage, settings.coverPosition, settings.coverSize);
  }

  applyTheme(themeName, customTheme) {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'funpay-customizer-theme';
      document.head.appendChild(this.styleElement);
    }

    let themeCSS = '';

    if (themeName === 'custom' && customTheme) {
      themeCSS = this.generateCustomThemeCSS(customTheme);
    } else {
      themeCSS = this.getPresetTheme(themeName);
    }

    this.styleElement.textContent = themeCSS;
  }

  getPresetTheme(themeName) {
    const themes = {
      default: '',
      dark: `
        :root {
          --bg-primary: #1a1a1a;
          --bg-secondary: #2d2d2d;
          --bg-tertiary: #3a3a3a;
          --text-primary: #ffffff;
          --text-secondary: #b0b0b0;
          --border-color: #404040;
          --link-color: #5cb3ff;
          --link-hover: #7ec8ff;
        }
        
        body {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }
        
        .header, .navigation, .footer {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-color) !important;
        }
        
        .card, .panel, .offer-list-item, .order-list-item, 
        .chat-message, .profile-box {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-color) !important;
          color: var(--text-primary) !important;
        }
        
        .content, .page-content, .param-item,
        div[class*="content"], div[class*="block"],
        section, article {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }
        
        input, textarea, select, .form-control {
          background-color: var(--bg-tertiary) !important;
          color: var(--text-primary) !important;
          border-color: var(--border-color) !important;
        }
        
        a {
          color: var(--link-color) !important;
        }
        
        a:hover {
          color: var(--link-hover) !important;
        }
        
        h1, h2, h3, h4, h5, h6, p, span, div, label {
          color: var(--text-primary) !important;
        }
        
        .text-muted, .hint {
          color: var(--text-secondary) !important;
        }
        
        .btn-primary {
          background-color: #0066cc !important;
          border-color: #0052a3 !important;
        }
        
        .btn-primary:hover {
          background-color: #0052a3 !important;
        }
      `,
      light: `
        :root {
          --bg-primary: #ffffff;
          --bg-secondary: #f5f5f5;
          --bg-tertiary: #e8e8e8;
          --text-primary: #333333;
          --text-secondary: #666666;
          --border-color: #d0d0d0;
          --link-color: #0066cc;
          --link-hover: #0052a3;
        }
        
        body {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }
        
        .header, .navigation, .footer {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-color) !important;
        }
        
        .card, .panel, .offer-list-item, .order-list-item {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-color) !important;
        }
      `,
      blue: `
        :root {
          --bg-primary: #0a1929;
          --bg-secondary: #132f4c;
          --bg-tertiary: #1e4976;
          --text-primary: #e3f2fd;
          --text-secondary: #90caf9;
          --border-color: #1e4976;
          --link-color: #90caf9;
          --link-hover: #bbdefb;
        }
        
        body {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }
        
        .header, .navigation, .footer {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-color) !important;
        }
        
        .card, .panel, .offer-list-item, .order-list-item,
        .chat-message, .profile-box {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-color) !important;
          color: var(--text-primary) !important;
        }
        
        .content, .page-content, .param-item,
        div[class*="content"], div[class*="block"],
        section, article {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }
        
        input, textarea, select, .form-control {
          background-color: var(--bg-tertiary) !important;
          color: var(--text-primary) !important;
          border-color: var(--border-color) !important;
        }
        
        a {
          color: var(--link-color) !important;
        }
        
        a:hover {
          color: var(--link-hover) !important;
        }
        
        h1, h2, h3, h4, h5, h6, p, span, div, label {
          color: var(--text-primary) !important;
        }
        
        .text-muted, .hint {
          color: var(--text-secondary) !important;
        }
      `,
      purple: `
        :root {
          --bg-primary: #1a0a29;
          --bg-secondary: #2d1b4c;
          --bg-tertiary: #4a2976;
          --text-primary: #f3e5fd;
          --text-secondary: #ce93d8;
          --border-color: #4a2976;
          --link-color: #ce93d8;
          --link-hover: #e1bee7;
        }
        
        body {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }
        
        .header, .navigation, .footer {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-color) !important;
        }
        
        .card, .panel, .offer-list-item, .order-list-item,
        .chat-message, .profile-box {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-color) !important;
          color: var(--text-primary) !important;
        }
        
        .content, .page-content, .param-item,
        div[class*="content"], div[class*="block"],
        section, article {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }
        
        input, textarea, select, .form-control {
          background-color: var(--bg-tertiary) !important;
          color: var(--text-primary) !important;
          border-color: var(--border-color) !important;
        }
        
        a {
          color: var(--link-color) !important;
        }
        
        a:hover {
          color: var(--link-hover) !important;
        }
        
        h1, h2, h3, h4, h5, h6, p, span, div, label {
          color: var(--text-primary) !important;
        }
        
        .text-muted, .hint {
          color: var(--text-secondary) !important;
        }
      `
    };

    return themes[themeName] || themes.default;
  }

  generateCustomThemeCSS(customTheme) {
    return `
      :root {
        --bg-primary: ${customTheme.bgPrimary || '#1a1a1a'};
        --bg-secondary: ${customTheme.bgSecondary || '#2d2d2d'};
        --bg-tertiary: ${customTheme.bgTertiary || '#3a3a3a'};
        --text-primary: ${customTheme.textPrimary || '#ffffff'};
        --text-secondary: ${customTheme.textSecondary || '#b0b0b0'};
        --border-color: ${customTheme.borderColor || '#404040'};
        --link-color: ${customTheme.linkColor || '#5cb3ff'};
        --link-hover: ${customTheme.linkHover || '#7ec8ff'};
      }
      
      body {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
      }
      
      .header, .navigation, .footer {
        background-color: var(--bg-secondary) !important;
        border-color: var(--border-color) !important;
      }
      
      .card, .panel, .offer-list-item, .order-list-item,
      .chat-message, .profile-box {
        background-color: var(--bg-secondary) !important;
        border-color: var(--border-color) !important;
        color: var(--text-primary) !important;
      }
      
      .content, .page-content, .param-item,
      div[class*="content"], div[class*="block"],
      section, article {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
      }
      
      input, textarea, select, .form-control {
        background-color: var(--bg-tertiary) !important;
        color: var(--text-primary) !important;
        border-color: var(--border-color) !important;
      }
      
      a {
        color: var(--link-color) !important;
      }
      
      a:hover {
        color: var(--link-hover) !important;
      }
      
      h1, h2, h3, h4, h5, h6, p, span, div, label {
        color: var(--text-primary) !important;
      }
      
      .text-muted, .hint {
        color: var(--text-secondary) !important;
      }
    `;
  }

  applyFont(fontFamily, fontSize) {
    if (fontFamily && fontFamily !== 'default') {
      if (!this.fontLinkElement) {
        this.fontLinkElement = document.createElement('link');
        this.fontLinkElement.rel = 'stylesheet';
        document.head.appendChild(this.fontLinkElement);
      }

      const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
      this.fontLinkElement.href = fontUrl;

      if (!this.fontStyleElement) {
        this.fontStyleElement = document.createElement('style');
        this.fontStyleElement.id = 'funpay-customizer-font';
        document.head.appendChild(this.fontStyleElement);
      }

      this.fontStyleElement.textContent = `
        * {
          font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        
        body, input, textarea, select, button {
          font-size: ${fontSize}px !important;
        }
      `;
    } else {
      if (this.fontLinkElement) {
        this.fontLinkElement.remove();
        this.fontLinkElement = null;
      }
      if (this.fontStyleElement) {
        this.fontStyleElement.remove();
        this.fontStyleElement = null;
      }
    }
  }

  applyCover(imageData, position, size) {
    if (imageData) {
      if (!this.coverElement) {
        this.coverElement = document.createElement('style');
        this.coverElement.id = 'funpay-customizer-cover';
        document.head.appendChild(this.coverElement);
      }

      this.coverElement.textContent = `
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('${imageData}');
          background-position: ${position};
          background-size: ${size};
          background-repeat: no-repeat;
          z-index: -1;
          opacity: 0.3;
        }
      `;
    } else {
      if (this.coverElement) {
        this.coverElement.remove();
        this.coverElement = null;
      }
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateSettings') {
        this.applySettings(request.settings);
        sendResponse({ success: true });
      } else if (request.action === 'importLot') {
        this.handleLotImport(request.lot, request.reviewMode);
        sendResponse({ success: true });
      }
      return true;
    });
  }

  handleLotImport(lot, reviewMode) {
    if (reviewMode) {
      this.showReviewOverlay(lot);
    } else {
      this.prefillLotForm(lot);
    }
  }

  showReviewOverlay(lot) {
    const overlay = document.createElement('div');
    overlay.id = 'funpay-lot-review-overlay';
    overlay.innerHTML = `
      <div class="lot-review-modal">
        <div class="lot-review-header">
          <h2>Проверка данных лота</h2>
          <button class="lot-review-close">✕</button>
        </div>
        <div class="lot-review-content">
          <div class="lot-field">
            <label>Название:</label>
            <input type="text" id="lot-name" value="${this.escapeHtml(lot.name || '')}">
          </div>
          <div class="lot-field">
            <label>Описание:</label>
            <textarea id="lot-description" rows="4">${this.escapeHtml(lot.description || '')}</textarea>
          </div>
          <div class="lot-field">
            <label>Цена:</label>
            <input type="number" id="lot-price" value="${lot.price || ''}">
          </div>
          <div class="lot-field">
            <label>Валюта:</label>
            <input type="text" id="lot-currency" value="${this.escapeHtml(lot.currency || 'RUB')}">
          </div>
          <div class="lot-field">
            <label>Количество:</label>
            <input type="number" id="lot-stock" value="${lot.stock || '1'}">
          </div>
          <div class="lot-field">
            <label>Категория:</label>
            <input type="text" id="lot-category" value="${this.escapeHtml(lot.category || '')}">
          </div>
          <div class="lot-field">
            <label>Подкатегория:</label>
            <input type="text" id="lot-subcategory" value="${this.escapeHtml(lot.subcategory || '')}">
          </div>
          <div class="lot-field">
            <label>ID игры:</label>
            <input type="text" id="lot-gameId" value="${this.escapeHtml(lot.gameId || '')}">
          </div>
          <div class="lot-field">
            <label>ID сервера:</label>
            <input type="text" id="lot-serverId" value="${this.escapeHtml(lot.serverId || '')}">
          </div>
        </div>
        <div class="lot-review-actions">
          <button class="lot-review-btn lot-review-btn-primary" id="lot-review-apply">✓ Применить</button>
          <button class="lot-review-btn lot-review-btn-secondary" id="lot-review-skip">⏭ Пропустить</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.addOverlayStyles();

    const closeBtn = overlay.querySelector('.lot-review-close');
    const applyBtn = overlay.querySelector('#lot-review-apply');
    const skipBtn = overlay.querySelector('#lot-review-skip');

    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });

    skipBtn.addEventListener('click', () => {
      overlay.remove();
    });

    applyBtn.addEventListener('click', () => {
      const reviewedLot = {
        name: document.getElementById('lot-name').value,
        description: document.getElementById('lot-description').value,
        price: parseFloat(document.getElementById('lot-price').value),
        currency: document.getElementById('lot-currency').value,
        stock: parseInt(document.getElementById('lot-stock').value),
        category: document.getElementById('lot-category').value,
        subcategory: document.getElementById('lot-subcategory').value,
        gameId: document.getElementById('lot-gameId').value,
        serverId: document.getElementById('lot-serverId').value
      };

      this.prefillLotForm(reviewedLot);
      overlay.remove();
    });
  }

  prefillLotForm(lot) {
    const formSelectors = {
      name: [
        'input[name="offer[summary]"]',
        'input[name="summary"]',
        '#offer-summary',
        'input[placeholder*="название"]',
        'input[placeholder*="Название"]'
      ],
      description: [
        'textarea[name="offer[description]"]',
        'textarea[name="description"]',
        '#offer-description',
        'textarea[placeholder*="описание"]',
        'textarea[placeholder*="Описание"]'
      ],
      price: [
        'input[name="offer[price]"]',
        'input[name="price"]',
        '#offer-price',
        'input[type="number"][placeholder*="цена"]',
        'input[type="number"][placeholder*="Цена"]'
      ],
      stock: [
        'input[name="offer[amount]"]',
        'input[name="amount"]',
        'input[name="stock"]',
        '#offer-amount',
        'input[type="number"][placeholder*="количество"]'
      ]
    };

    let successCount = 0;
    const results = [];

    if (lot.name) {
      const nameField = this.findField(formSelectors.name);
      if (nameField) {
        nameField.value = lot.name;
        nameField.dispatchEvent(new Event('input', { bubbles: true }));
        nameField.dispatchEvent(new Event('change', { bubbles: true }));
        successCount++;
        results.push({ field: 'название', success: true });
      } else {
        results.push({ field: 'название', success: false });
      }
    }

    if (lot.description) {
      const descField = this.findField(formSelectors.description);
      if (descField) {
        descField.value = lot.description;
        descField.dispatchEvent(new Event('input', { bubbles: true }));
        descField.dispatchEvent(new Event('change', { bubbles: true }));
        successCount++;
        results.push({ field: 'описание', success: true });
      } else {
        results.push({ field: 'описание', success: false });
      }
    }

    if (lot.price) {
      const priceField = this.findField(formSelectors.price);
      if (priceField) {
        priceField.value = lot.price;
        priceField.dispatchEvent(new Event('input', { bubbles: true }));
        priceField.dispatchEvent(new Event('change', { bubbles: true }));
        successCount++;
        results.push({ field: 'цена', success: true });
      } else {
        results.push({ field: 'цена', success: false });
      }
    }

    if (lot.stock) {
      const stockField = this.findField(formSelectors.stock);
      if (stockField) {
        stockField.value = lot.stock;
        stockField.dispatchEvent(new Event('input', { bubbles: true }));
        stockField.dispatchEvent(new Event('change', { bubbles: true }));
        successCount++;
        results.push({ field: 'количество', success: true });
      } else {
        results.push({ field: 'количество', success: false });
      }
    }

    this.showImportNotification(successCount, results);
  }

  findField(selectors) {
    for (const selector of selectors) {
      const field = document.querySelector(selector);
      if (field) {
        return field;
      }
    }
    return null;
  }

  showImportNotification(successCount, results) {
    const notification = document.createElement('div');
    notification.className = 'funpay-import-notification';
    
    let message = `✓ Заполнено полей: ${successCount}\n`;
    results.forEach(result => {
      if (!result.success) {
        message += `⚠️ Не найдено поле: ${result.field}\n`;
      }
    });

    notification.textContent = message;
    notification.style.whiteSpace = 'pre-line';
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  addOverlayStyles() {
    if (document.getElementById('funpay-lot-overlay-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'funpay-lot-overlay-styles';
    style.textContent = `
      #funpay-lot-review-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .lot-review-modal {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          transform: translateY(50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .lot-review-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 12px 12px 0 0;
      }

      .lot-review-header h2 {
        margin: 0;
        font-size: 22px;
        color: white !important;
      }

      .lot-review-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .lot-review-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
      }

      .lot-review-content {
        padding: 30px;
      }

      .lot-field {
        margin-bottom: 20px;
      }

      .lot-field label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333 !important;
        font-size: 14px;
      }

      .lot-field input,
      .lot-field textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        transition: border-color 0.3s ease;
        color: #333 !important;
        background: white !important;
      }

      .lot-field input:focus,
      .lot-field textarea:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .lot-review-actions {
        padding: 20px 30px;
        background: #f8f9fa;
        display: flex;
        gap: 15px;
        justify-content: flex-end;
        border-radius: 0 0 12px 12px;
      }

      .lot-review-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .lot-review-btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      .lot-review-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      }

      .lot-review-btn-secondary {
        background: #e0e0e0;
        color: #666;
      }

      .lot-review-btn-secondary:hover {
        background: #d0d0d0;
      }

      .funpay-import-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        font-weight: 600;
        z-index: 999998;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease;
        max-width: 400px;
      }

      .funpay-import-notification.show {
        opacity: 1;
        transform: translateX(0);
      }
    `;

    document.head.appendChild(style);
  }
}

const customizer = new FunPayCustomizer();
