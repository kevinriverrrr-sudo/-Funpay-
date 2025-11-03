// Content script для внедрения стилей на страницы FunPay

class FunPayCustomizer {
  constructor() {
    this.styleElement = null;
    this.fontLinkElement = null;
    this.coverElement = null;
    this.snowTrail = null;
    this.animatedLogo = null;
    this.customCursor = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupMessageListener();
    this.initVisualEffects();
  }

  initVisualEffects() {
    if (typeof SnowTrailEffect !== 'undefined') {
      this.snowTrail = new SnowTrailEffect();
    }
    
    if (typeof AnimatedLogoEffect !== 'undefined') {
      this.animatedLogo = new AnimatedLogoEffect();
    }
    
    if (typeof CustomCursorEffect !== 'undefined') {
      this.customCursor = new CustomCursorEffect();
    }
  }

  async loadSettings() {
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

    this.applySettings(settings);
  }

  applySettings(settings) {
    this.applyTheme(settings.theme, settings.customTheme);
    this.applyFont(settings.font, settings.fontSize);
    this.applyCover(settings.coverImage, settings.coverPosition, settings.coverSize);
    this.applyVisualEffects(settings);
  }

  applyVisualEffects(settings) {
    if (this.snowTrail) {
      if (settings.snowTrailEnabled) {
        this.snowTrail.enable();
      } else {
        this.snowTrail.disable();
      }
    }

    if (this.animatedLogo) {
      if (settings.animatedLogoEnabled) {
        setTimeout(() => this.animatedLogo.enable(), 500);
      } else {
        this.animatedLogo.disable();
      }
    }

    if (this.customCursor) {
      if (settings.customCursorEnabled) {
        this.customCursor.setCursor(
          settings.customCursorType || 'default',
          settings.customCursorImage
        );
        this.customCursor.enable();
      } else {
        this.customCursor.disable();
      }
    }
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

const customizer = new FunPayCustomizer();
