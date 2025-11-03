class TranslationService {
  constructor() {
    this.cache = new Map();
    this.apiEndpoint = null;
    this.apiKey = null;
    this.apiProvider = 'libretranslate';
    this.sourceLang = 'auto';
    this.targetLang = 'en';
    this.maxCacheSize = 500;
    this.initialized = false;
  }

  async init() {
    const settings = await chrome.storage.local.get({
      translationApiEndpoint: '',
      translationApiKey: '',
      translationApiProvider: 'libretranslate',
      translationSourceLang: 'auto',
      translationTargetLang: 'en'
    });

    this.apiEndpoint = settings.translationApiEndpoint;
    this.apiKey = settings.translationApiKey;
    this.apiProvider = settings.translationApiProvider;
    this.sourceLang = settings.translationSourceLang;
    this.targetLang = settings.translationTargetLang;
    this.initialized = true;
  }

  async translate(text, sourceLang = null, targetLang = null) {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.apiEndpoint) {
      throw new Error('Translation API endpoint not configured');
    }

    const source = sourceLang || this.sourceLang;
    const target = targetLang || this.targetLang;
    const cacheKey = `${source}:${target}:${text}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let translatedText;
      
      if (this.apiProvider === 'libretranslate') {
        translatedText = await this.translateLibre(text, source, target);
      } else if (this.apiProvider === 'deepl') {
        translatedText = await this.translateDeepL(text, source, target);
      } else {
        throw new Error(`Unsupported API provider: ${this.apiProvider}`);
      }

      this.addToCache(cacheKey, translatedText);
      return translatedText;
    } catch (error) {
      if (error.message.includes('quota') || error.message.includes('limit')) {
        this.showNotification('Translation quota exceeded', 'You have reached the API usage limit. Please try again later.');
        throw new Error('QUOTA_EXCEEDED');
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        this.showNotification('Translation timeout', 'The translation service is not responding. Please try again.');
        throw new Error('TIMEOUT');
      } else {
        this.showNotification('Translation error', error.message);
        throw error;
      }
    }
  }

  async translateLibre(text, sourceLang, targetLang) {
    const url = `${this.apiEndpoint}/translate`;
    const body = {
      q: text,
      source: sourceLang === 'auto' ? 'auto' : sourceLang,
      target: targetLang,
      format: 'text'
    };

    if (this.apiKey) {
      body.api_key = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API quota exceeded');
        } else if (response.status === 403) {
          throw new Error('Invalid API key');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async translateDeepL(text, sourceLang, targetLang) {
    const url = 'https://api-free.deepl.com/v2/translate';
    const params = new URLSearchParams({
      auth_key: this.apiKey,
      text: text,
      target_lang: targetLang.toUpperCase()
    });

    if (sourceLang !== 'auto') {
      params.append('source_lang', sourceLang.toUpperCase());
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 456) {
          throw new Error('Quota exceeded');
        } else if (response.status === 403) {
          throw new Error('Invalid API key');
        } else {
          throw new Error(`DeepL API error: ${response.status}`);
        }
      }

      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  addToCache(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clearCache() {
    this.cache.clear();
  }

  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
      title: title,
      message: message,
      priority: 2
    });
  }

  async testConnection() {
    try {
      await this.translate('Hello', 'en', this.targetLang);
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async updateSettings(settings) {
    if (settings.translationApiEndpoint !== undefined) {
      this.apiEndpoint = settings.translationApiEndpoint;
    }
    if (settings.translationApiKey !== undefined) {
      this.apiKey = settings.translationApiKey;
    }
    if (settings.translationApiProvider !== undefined) {
      this.apiProvider = settings.translationApiProvider;
    }
    if (settings.translationSourceLang !== undefined) {
      this.sourceLang = settings.translationSourceLang;
    }
    if (settings.translationTargetLang !== undefined) {
      this.targetLang = settings.translationTargetLang;
    }
    this.clearCache();
  }

  getSupportedLanguages(provider = 'libretranslate') {
    if (provider === 'libretranslate') {
      return {
        'auto': 'Auto-detect',
        'en': 'English',
        'ru': 'Russian',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'pl': 'Polish',
        'uk': 'Ukrainian',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'tr': 'Turkish'
      };
    } else if (provider === 'deepl') {
      return {
        'auto': 'Auto-detect',
        'en': 'English',
        'ru': 'Russian',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'pl': 'Polish',
        'uk': 'Ukrainian',
        'zh': 'Chinese',
        'ja': 'Japanese'
      };
    }
    return {};
  }
}
