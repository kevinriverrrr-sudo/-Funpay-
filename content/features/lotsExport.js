class LotsExporter {
  constructor() {
    this.isExporting = false;
    this.exportFormat = 'json';
    this.overlayButton = null;
    this.progressOverlay = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.injectUI();
    this.setupMessageListener();
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get({
      exportFormat: 'json'
    });
    this.exportFormat = settings.exportFormat;
  }

  injectUI() {
    if (!this.isLotsPage()) {
      return;
    }

    if (this.overlayButton) {
      return;
    }

    this.overlayButton = document.createElement('button');
    this.overlayButton.id = 'funpay-export-btn';
    this.overlayButton.innerHTML = '📥 Экспорт';
    this.overlayButton.title = 'Экспортировать лоты';
    this.overlayButton.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 9999;
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    `;

    this.overlayButton.addEventListener('mouseenter', () => {
      this.overlayButton.style.transform = 'translateY(-2px)';
      this.overlayButton.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)';
    });

    this.overlayButton.addEventListener('mouseleave', () => {
      this.overlayButton.style.transform = 'translateY(0)';
      this.overlayButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    this.overlayButton.addEventListener('click', () => {
      this.showFormatDialog();
    });

    document.body.appendChild(this.overlayButton);
  }

  isLotsPage() {
    const url = window.location.href;
    return url.includes('/lots/') || 
           url.includes('/offer') || 
           url.includes('/chips') ||
           url.includes('/game') ||
           document.querySelector('.offer-list-item, .tc-item, a[href*="/lot/"]');
  }

  showFormatDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'funpay-export-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      min-width: 320px;
    `;

    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">Выберите формат экспорта</h3>
      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">
          <input type="radio" name="export-format" value="json" ${this.exportFormat === 'json' ? 'checked' : ''} style="margin-right: 8px;">
          <span style="color: #333;">JSON (структурированный)</span>
        </label>
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" name="export-format" value="txt" ${this.exportFormat === 'txt' ? 'checked' : ''} style="margin-right: 8px;">
          <span style="color: #333;">TXT (текстовый)</span>
        </label>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="export-cancel-btn" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; color: #666;">
          Отмена
        </button>
        <button id="export-confirm-btn" style="padding: 8px 16px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
          Экспортировать
        </button>
      </div>
    `;

    const backdrop = document.createElement('div');
    backdrop.id = 'funpay-export-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);

    const cancelBtn = dialog.querySelector('#export-cancel-btn');
    const confirmBtn = dialog.querySelector('#export-confirm-btn');
    const radioButtons = dialog.querySelectorAll('input[name="export-format"]');

    cancelBtn.addEventListener('click', () => {
      backdrop.remove();
      dialog.remove();
    });

    backdrop.addEventListener('click', () => {
      backdrop.remove();
      dialog.remove();
    });

    confirmBtn.addEventListener('click', async () => {
      const selectedFormat = dialog.querySelector('input[name="export-format"]:checked').value;
      this.exportFormat = selectedFormat;
      await chrome.storage.sync.set({ exportFormat: selectedFormat });
      
      backdrop.remove();
      dialog.remove();
      
      await this.startExport();
    });
  }

  async startExport() {
    if (this.isExporting) {
      this.showNotification('⚠ Экспорт уже выполняется', 'warning');
      return;
    }

    this.isExporting = true;
    this.showProgressOverlay();

    try {
      this.updateProgress('Сбор информации о лотах...', 10);
      
      const lots = await this.collectAllLots();
      
      if (lots.length === 0) {
        throw new Error('Лоты не найдены на странице');
      }

      this.updateProgress(`Собрано ${lots.length} лотов. Подготовка файла...`, 70);

      const metadata = this.getPageMetadata();
      const fileData = this.serializeData(lots, metadata);
      
      this.updateProgress('Создание файла для скачивания...', 90);

      await this.downloadFile(fileData, metadata);

      this.updateProgress('Готово!', 100);
      
      setTimeout(() => {
        this.hideProgressOverlay();
        this.showNotification(`✓ Успешно экспортировано ${lots.length} лотов`, 'success');
      }, 500);

    } catch (error) {
      console.error('Export error:', error);
      this.hideProgressOverlay();
      this.showNotification(`✗ Ошибка: ${error.message}`, 'error');
    } finally {
      this.isExporting = false;
    }
  }

  async collectAllLots() {
    const lots = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const currentLots = this.parseLots();
      
      if (currentLots.length > 0) {
        lots.push(...currentLots);
        break;
      }

      attempts++;
      if (attempts < maxAttempts) {
        this.updateProgress(`Попытка ${attempts + 1}/${maxAttempts}...`, 20 + attempts * 10);
        await this.waitForContent();
      }
    }

    return this.deduplicateLots(lots);
  }

  parseLots() {
    const lots = [];
    
    const selectors = [
      '.offer-list-item',
      '.tc-item',
      'a[href*="/lot/"]',
      '.lots-list .lot-item',
      '[class*="offer"] [class*="item"]'
    ];

    let lotElements = [];
    for (const selector of selectors) {
      lotElements = document.querySelectorAll(selector);
      if (lotElements.length > 0) {
        break;
      }
    }

    if (lotElements.length === 0) {
      throw new Error('Структура страницы не поддерживается. Лоты не найдены.');
    }

    lotElements.forEach((element, index) => {
      try {
        const lot = this.parseLotElement(element, index);
        if (lot) {
          lots.push(lot);
        }
      } catch (error) {
        console.warn('Failed to parse lot element:', error);
      }
    });

    return lots;
  }

  parseLotElement(element, index) {
    const lot = {
      id: this.extractLotId(element),
      title: this.extractText(element, [
        '.tc-desc-text',
        '.offer-list-title',
        'h3',
        '.title',
        'a[href*="/lot/"]'
      ]),
      price: this.extractPrice(element),
      currency: this.extractCurrency(element),
      seller: this.extractSeller(element),
      sellerStatus: this.extractSellerStatus(element),
      availability: this.extractAvailability(element),
      timestamp: this.extractTimestamp(element),
      url: this.extractUrl(element),
      index: index + 1
    };

    return lot;
  }

  extractLotId(element) {
    const href = element.href || element.querySelector('a')?.href || '';
    const match = href.match(/\/lot\/(\d+)/);
    if (match) {
      return match[1];
    }
    
    const dataId = element.getAttribute('data-id') || 
                   element.getAttribute('data-lot-id') ||
                   element.getAttribute('data-offer-id');
    
    return dataId || `unknown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  extractText(element, selectors) {
    for (const selector of selectors) {
      const el = element.matches(selector) ? element : element.querySelector(selector);
      if (el) {
        return el.textContent.trim();
      }
    }
    return 'N/A';
  }

  extractPrice(element) {
    const priceSelectors = [
      '.tc-price',
      '.offer-price',
      '[class*="price"]',
      '.cost'
    ];

    for (const selector of priceSelectors) {
      const el = element.querySelector(selector);
      if (el) {
        const priceText = el.textContent.trim();
        const priceMatch = priceText.match(/[\d\s,.]+/);
        if (priceMatch) {
          return priceMatch[0].replace(/\s/g, '').replace(',', '.');
        }
      }
    }
    
    return 'N/A';
  }

  extractCurrency(element) {
    const priceSelectors = [
      '.tc-price',
      '.offer-price',
      '[class*="price"]',
      '.cost'
    ];

    for (const selector of priceSelectors) {
      const el = element.querySelector(selector);
      if (el) {
        const text = el.textContent.trim();
        if (text.includes('₽') || text.includes('RUB')) return 'RUB';
        if (text.includes('$') || text.includes('USD')) return 'USD';
        if (text.includes('€') || text.includes('EUR')) return 'EUR';
      }
    }
    
    return 'RUB';
  }

  extractSeller(element) {
    const sellerSelectors = [
      '.media-user-name',
      '.username',
      '[class*="seller"]',
      '[class*="user"]'
    ];

    for (const selector of sellerSelectors) {
      const el = element.querySelector(selector);
      if (el) {
        return el.textContent.trim();
      }
    }
    
    return 'N/A';
  }

  extractSellerStatus(element) {
    const onlineIndicators = [
      '.user-online',
      '.online',
      '[class*="online"]'
    ];

    for (const selector of onlineIndicators) {
      const el = element.querySelector(selector);
      if (el) {
        return 'online';
      }
    }
    
    return 'offline';
  }

  extractAvailability(element) {
    const text = element.textContent.toLowerCase();
    
    if (text.includes('нет в наличии') || text.includes('недоступ')) {
      return 'unavailable';
    }
    
    if (text.includes('в наличии') || text.includes('доступ')) {
      return 'available';
    }
    
    return 'unknown';
  }

  extractTimestamp(element) {
    const timeSelectors = [
      'time',
      '.timestamp',
      '[datetime]',
      '[class*="date"]',
      '[class*="time"]'
    ];

    for (const selector of timeSelectors) {
      const el = element.querySelector(selector);
      if (el) {
        const datetime = el.getAttribute('datetime');
        if (datetime) {
          return datetime;
        }
        return el.textContent.trim();
      }
    }
    
    return new Date().toISOString();
  }

  extractUrl(element) {
    const link = element.href ? element : element.querySelector('a[href*="/lot/"]');
    if (link && link.href) {
      return link.href;
    }
    return window.location.href;
  }

  deduplicateLots(lots) {
    const seen = new Set();
    return lots.filter(lot => {
      const key = lot.id || lot.title;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async waitForContent() {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  getPageMetadata() {
    const url = window.location.href;
    const title = document.title;
    const sectionName = this.extractSectionName();
    const account = this.extractAccountInfo();
    
    return {
      url,
      title,
      sectionName,
      account,
      exportDate: new Date().toISOString(),
      exportTimestamp: Date.now()
    };
  }

  extractSectionName() {
    const breadcrumbs = document.querySelector('.breadcrumb, [class*="breadcrumb"]');
    if (breadcrumbs) {
      return breadcrumbs.textContent.trim();
    }

    const h1 = document.querySelector('h1');
    if (h1) {
      return h1.textContent.trim();
    }

    const pathMatch = window.location.pathname.match(/\/([^/]+)/);
    return pathMatch ? pathMatch[1] : 'Unknown Section';
  }

  extractAccountInfo() {
    const userLink = document.querySelector('.user-link, .username, [class*="user-name"]');
    if (userLink) {
      return userLink.textContent.trim();
    }
    return 'N/A';
  }

  serializeData(lots, metadata) {
    if (this.exportFormat === 'json') {
      return this.serializeJSON(lots, metadata);
    } else {
      return this.serializeTXT(lots, metadata);
    }
  }

  serializeJSON(lots, metadata) {
    const data = {
      metadata: {
        exportDate: metadata.exportDate,
        exportTimestamp: metadata.exportTimestamp,
        url: metadata.url,
        pageTitle: metadata.title,
        sectionName: metadata.sectionName,
        account: metadata.account,
        totalLots: lots.length,
        format: 'json',
        version: '1.0'
      },
      lots: lots
    };

    return JSON.stringify(data, null, 2);
  }

  serializeTXT(lots, metadata) {
    let output = '';
    
    output += '='.repeat(80) + '\n';
    output += 'FUNPAY LOTS EXPORT\n';
    output += '='.repeat(80) + '\n';
    output += `Export Date: ${new Date(metadata.exportDate).toLocaleString()}\n`;
    output += `Section: ${metadata.sectionName}\n`;
    output += `Account: ${metadata.account}\n`;
    output += `URL: ${metadata.url}\n`;
    output += `Total Lots: ${lots.length}\n`;
    output += '='.repeat(80) + '\n\n';

    lots.forEach((lot, index) => {
      output += `Lot #${index + 1}\n`;
      output += '-'.repeat(80) + '\n';
      output += `ID: ${lot.id}\n`;
      output += `Title: ${lot.title}\n`;
      output += `Price: ${lot.price} ${lot.currency}\n`;
      output += `Seller: ${lot.seller}\n`;
      output += `Status: ${lot.sellerStatus}\n`;
      output += `Availability: ${lot.availability}\n`;
      output += `Timestamp: ${lot.timestamp}\n`;
      output += `URL: ${lot.url}\n`;
      output += '\n';
    });

    output += '='.repeat(80) + '\n';
    output += `End of Export - ${lots.length} lots total\n`;
    output += '='.repeat(80) + '\n';

    return output;
  }

  async downloadFile(content, metadata) {
    const extension = this.exportFormat === 'json' ? 'json' : 'txt';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `funpay-lots-${timestamp}.${extension}`;

    const blob = new Blob([content], { 
      type: this.exportFormat === 'json' ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);

    try {
      await chrome.runtime.sendMessage({
        action: 'downloadFile',
        url: url,
        filename: filename
      });

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (error) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    }
  }

  showProgressOverlay() {
    this.progressOverlay = document.createElement('div');
    this.progressOverlay.id = 'funpay-export-progress';
    this.progressOverlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10001;
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      min-width: 320px;
      text-align: center;
    `;

    this.progressOverlay.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333;">Экспорт лотов</h3>
      <div style="margin-bottom: 12px;">
        <div id="progress-bar-container" style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
          <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: width 0.3s ease;"></div>
        </div>
      </div>
      <p id="progress-text" style="margin: 0; color: #666; font-size: 14px;">Инициализация...</p>
    `;

    const backdrop = document.createElement('div');
    backdrop.id = 'funpay-progress-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(this.progressOverlay);
  }

  updateProgress(message, percentage) {
    if (!this.progressOverlay) return;

    const progressBar = this.progressOverlay.querySelector('#progress-bar');
    const progressText = this.progressOverlay.querySelector('#progress-text');

    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent = message;
    }
  }

  hideProgressOverlay() {
    const backdrop = document.getElementById('funpay-progress-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    if (this.progressOverlay) {
      this.progressOverlay.remove();
      this.progressOverlay = null;
    }
  }

  showNotification(message, type = 'info') {
    const colors = {
      success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      error: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
      warning: 'linear-gradient(135deg, #f09819 0%, #edde5d 100%)',
      info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };

    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors[type]};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10002;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: slideInDown 0.3s ease;
      max-width: 400px;
      text-align: center;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutUp 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'exportLots') {
        if (this.isLotsPage()) {
          this.startExport().then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
        } else {
          sendResponse({ success: false, error: 'Not on a lots page' });
        }
        return true;
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.lotsExporter = new LotsExporter();
}
