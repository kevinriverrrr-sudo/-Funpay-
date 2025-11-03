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
      }
    });
  }
}

class TranslationUI {
  constructor() {
    this.floatingWidget = null;
    this.autoTranslateProducts = false;
    this.translatedElements = new Set();
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.createFloatingWidget();
    this.setupSelectionListener();
    this.setupMessageListener();
    if (this.autoTranslateProducts) {
      this.translateProducts();
    }
  }

  async loadSettings() {
    const settings = await chrome.storage.local.get({
      autoTranslateProducts: false
    });
    this.autoTranslateProducts = settings.autoTranslateProducts;
  }

  createFloatingWidget() {
    this.floatingWidget = document.createElement('div');
    this.floatingWidget.id = 'funpay-translation-widget';
    this.floatingWidget.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 300px;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-weight: 600;
    `;
    header.innerHTML = `
      <span>🌐 Translation</span>
      <button id="close-translation-widget" style="
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      ">×</button>
    `;

    const content = document.createElement('div');
    content.id = 'translation-widget-content';
    content.style.cssText = `
      margin-top: 10px;
      line-height: 1.4;
    `;

    const loadingSpinner = document.createElement('div');
    loadingSpinner.id = 'translation-loading';
    loadingSpinner.style.cssText = `
      display: none;
      text-align: center;
      padding: 10px;
    `;
    loadingSpinner.innerHTML = '⏳ Translating...';

    this.floatingWidget.appendChild(header);
    this.floatingWidget.appendChild(loadingSpinner);
    this.floatingWidget.appendChild(content);
    document.body.appendChild(this.floatingWidget);

    document.getElementById('close-translation-widget').addEventListener('click', () => {
      this.hideWidget();
    });
  }

  setupSelectionListener() {
    document.addEventListener('mouseup', (e) => {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText.length > 0 && selectedText.length < 500) {
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection.toString().trim() === selectedText) {
            this.showTranslationButton(e.pageX, e.pageY, selectedText);
          }
        }, 100);
      }
    });
  }

  showTranslationButton(x, y, text) {
    let btn = document.getElementById('quick-translate-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'quick-translate-btn';
      btn.textContent = '🌐 Translate';
      btn.style.cssText = `
        position: absolute;
        background: #0066cc;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      `;
      document.body.appendChild(btn);

      btn.addEventListener('click', () => {
        this.translateText(text);
        btn.style.display = 'none';
      });
    }

    btn.style.left = `${x}px`;
    btn.style.top = `${y + 15}px`;
    btn.style.display = 'block';

    setTimeout(() => {
      const handleClick = (e) => {
        if (e.target !== btn) {
          btn.style.display = 'none';
          document.removeEventListener('click', handleClick);
        }
      };
      document.addEventListener('click', handleClick);
    }, 100);
  }

  async translateText(text, sourceLang = null, targetLang = null) {
    this.showWidget();
    this.showLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        sourceLang: sourceLang,
        targetLang: targetLang
      });

      if (response.success) {
        this.displayTranslation(text, response.translatedText);
      } else {
        this.displayError(response.error);
      }
    } catch (error) {
      this.displayError(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  async translateProducts() {
    const productElements = document.querySelectorAll('.tc-item, .offer-list-item, [class*="product"], [class*="lot"]');
    
    for (const element of productElements) {
      if (this.translatedElements.has(element)) continue;
      
      const titleElement = element.querySelector('.tc-title, .offer-title, h3, h4, [class*="title"]');
      const descElement = element.querySelector('.tc-desc, .offer-desc, .description, [class*="desc"]');

      if (titleElement) {
        await this.translateElement(titleElement);
      }
      if (descElement) {
        await this.translateElement(descElement);
      }
      
      this.translatedElements.add(element);
    }
  }

  async translateElement(element) {
    const originalText = element.textContent.trim();
    if (!originalText || originalText.length < 3) return;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    
    const toggle = document.createElement('button');
    toggle.textContent = '🌐';
    toggle.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      background: rgba(0, 102, 204, 0.8);
      color: white;
      border: none;
      padding: 3px 6px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
      z-index: 100;
    `;

    element.style.position = 'relative';
    element.appendChild(toggle);

    let isTranslated = false;
    let translatedText = null;

    toggle.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isTranslated) {
        if (!translatedText) {
          toggle.textContent = '⏳';
          try {
            const response = await chrome.runtime.sendMessage({
              action: 'translate',
              text: originalText
            });
            if (response.success) {
              translatedText = response.translatedText;
            }
          } catch (error) {
            toggle.textContent = '❌';
            return;
          }
        }
        
        if (translatedText) {
          element.textContent = translatedText;
          element.appendChild(toggle);
          toggle.textContent = '↩️';
          isTranslated = true;
        }
      } else {
        element.textContent = originalText;
        element.appendChild(toggle);
        toggle.textContent = '🌐';
        isTranslated = false;
      }
    });
  }

  showWidget() {
    this.floatingWidget.style.display = 'block';
  }

  hideWidget() {
    this.floatingWidget.style.display = 'none';
  }

  showLoading(show) {
    const loading = document.getElementById('translation-loading');
    const content = document.getElementById('translation-widget-content');
    if (show) {
      loading.style.display = 'block';
      content.style.display = 'none';
    } else {
      loading.style.display = 'none';
      content.style.display = 'block';
    }
  }

  displayTranslation(originalText, translatedText) {
    const content = document.getElementById('translation-widget-content');
    content.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong style="color: #aaa; font-size: 11px;">Original:</strong>
        <div style="padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px; margin-top: 5px;">
          ${this.escapeHtml(originalText)}
        </div>
      </div>
      <div>
        <strong style="color: #90caf9; font-size: 11px;">Translation:</strong>
        <div style="padding: 8px; background: rgba(144, 202, 249, 0.2); border-radius: 5px; margin-top: 5px;">
          ${this.escapeHtml(translatedText)}
        </div>
      </div>
    `;
  }

  displayError(errorMessage) {
    const content = document.getElementById('translation-widget-content');
    content.innerHTML = `
      <div style="color: #ff6b6b; padding: 10px; background: rgba(255,107,107,0.2); border-radius: 5px;">
        <strong>❌ Error:</strong><br>
        ${this.escapeHtml(errorMessage)}
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'translateSelection') {
        this.translateText(request.text);
        sendResponse({ success: true });
      } else if (request.action === 'translatePage') {
        this.translateProducts();
        sendResponse({ success: true });
      }
    });
  }
}

const customizer = new FunPayCustomizer();
const translationUI = new TranslationUI();
