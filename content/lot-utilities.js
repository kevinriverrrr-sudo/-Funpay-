class LotUtilities {
  constructor() {
    this.enabled = false;
    this.quickTradePanelEnabled = false;
    this.pinnedLots = [];
    this.lotCache = new Map();
    this.observer = null;
    this.quickTradePanel = null;
    this.notificationManager = window.FunPayNotificationManager;
    this.init();
  }

  async init() {
    await this.loadSettings();
    
    if (this.enabled) {
      this.setupMutationObserver();
      this.injectStyles();
      this.processExistingLots();
      
      if (this.quickTradePanelEnabled) {
        this.createQuickTradePanel();
      }
    }
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get({
      lotUtilitiesEnabled: false,
      quickTradePanelEnabled: false,
      pinnedLots: []
    });

    this.enabled = settings.lotUtilitiesEnabled;
    this.quickTradePanelEnabled = settings.quickTradePanelEnabled;
    this.pinnedLots = settings.pinnedLots || [];
  }

  setupMutationObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (this.isLotElement(node) || node.querySelector && this.findLotElements(node).length > 0) {
                shouldProcess = true;
                break;
              }
            }
          }
        }
      }

      if (shouldProcess) {
        this.processExistingLots();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  isLotElement(element) {
    if (!element || !element.classList) return false;
    
    return element.classList.contains('tc-item') ||
           element.classList.contains('offer-list-item') ||
           element.classList.contains('tc-offer') ||
           (element.hasAttribute && element.hasAttribute('data-offer-id'));
  }

  findLotElements(container = document) {
    const selectors = [
      '.tc-item',
      '.offer-list-item',
      '.tc-offer',
      '[data-offer-id]'
    ];

    const elements = [];
    for (const selector of selectors) {
      try {
        const found = container.querySelectorAll(selector);
        elements.push(...found);
      } catch (e) {
        console.warn('LotUtilities: Error finding elements with selector', selector, e);
      }
    }

    return [...new Set(elements)];
  }

  processExistingLots() {
    const lots = this.findLotElements();
    
    lots.forEach(lot => {
      if (!lot.dataset.lotUtilitiesProcessed) {
        this.addUtilitiesToLot(lot);
        lot.dataset.lotUtilitiesProcessed = 'true';
      }
    });

    this.applyPinnedLots();
    this.updateGoodsCounter();
  }

  addUtilitiesToLot(lotElement) {
    if (!lotElement) return;

    const lotId = this.getLotId(lotElement);
    if (!lotId) return;

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'funpay-lot-utilities-actions';
    actionsContainer.style.cssText = `
      display: flex;
      gap: 6px;
      align-items: center;
      margin-top: 8px;
      flex-wrap: wrap;
    `;

    const pinBtn = this.createActionButton('📌', 'Закрепить', () => {
      this.togglePinLot(lotId, lotElement);
    });

    const duplicateBtn = this.createActionButton('📋', 'Дублировать', () => {
      this.duplicateLot(lotId, lotElement);
    });

    const disableBtn = this.createActionButton('⏸️', 'Отключить', () => {
      this.disableLot(lotId, lotElement);
    });

    const complaintBtn = this.createActionButton('⚠️', 'Жалоба', () => {
      this.openComplaintForm(lotId, lotElement);
    });

    actionsContainer.appendChild(pinBtn);
    actionsContainer.appendChild(duplicateBtn);
    actionsContainer.appendChild(disableBtn);
    actionsContainer.appendChild(complaintBtn);

    const insertPoint = this.findInsertionPoint(lotElement);
    if (insertPoint) {
      insertPoint.appendChild(actionsContainer);
    }

    if (this.pinnedLots.includes(lotId)) {
      this.addPinIndicator(lotElement);
      pinBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      pinBtn.style.color = 'white';
    }
  }

  createActionButton(icon, tooltip, onClick) {
    const btn = document.createElement('button');
    btn.className = 'funpay-lot-action-btn';
    btn.textContent = icon;
    btn.title = tooltip;
    btn.style.cssText = `
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = 'none';
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });

    return btn;
  }

  findInsertionPoint(lotElement) {
    const possiblePoints = [
      lotElement.querySelector('.tc-desc'),
      lotElement.querySelector('.offer-description'),
      lotElement.querySelector('.tc-content'),
      lotElement.querySelector('.offer-content'),
      lotElement
    ];

    for (const point of possiblePoints) {
      if (point) return point;
    }

    return lotElement;
  }

  getLotId(lotElement) {
    return lotElement.dataset.offerId || 
           lotElement.id || 
           lotElement.querySelector('[data-offer-id]')?.dataset.offerId ||
           `lot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async togglePinLot(lotId, lotElement) {
    const index = this.pinnedLots.indexOf(lotId);
    
    if (index > -1) {
      this.pinnedLots.splice(index, 1);
      this.removePinIndicator(lotElement);
      this.notificationManager.show('📌 Лот откреплён', 'info');
    } else {
      this.pinnedLots.push(lotId);
      this.addPinIndicator(lotElement);
      this.notificationManager.show('📌 Лот закреплён', 'success');
    }

    await chrome.storage.sync.set({ pinnedLots: this.pinnedLots });
    this.applyPinnedLots();
  }

  addPinIndicator(lotElement) {
    if (lotElement.querySelector('.funpay-pin-indicator')) return;

    const indicator = document.createElement('div');
    indicator.className = 'funpay-pin-indicator';
    indicator.textContent = '📌 Закреплено';
    indicator.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 12px;
      font-weight: 600;
      border-radius: 4px;
      z-index: 10;
    `;

    lotElement.style.position = 'relative';
    lotElement.insertBefore(indicator, lotElement.firstChild);
  }

  removePinIndicator(lotElement) {
    const indicator = lotElement.querySelector('.funpay-pin-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  applyPinnedLots() {
    const lots = this.findLotElements();
    const lotContainers = new Map();

    lots.forEach(lot => {
      const parent = lot.parentElement;
      if (parent && !lotContainers.has(parent)) {
        lotContainers.set(parent, []);
      }
      if (parent) {
        lotContainers.get(parent).push(lot);
      }
    });

    lotContainers.forEach((containerLots, container) => {
      const pinned = [];
      const unpinned = [];

      containerLots.forEach(lot => {
        const lotId = this.getLotId(lot);
        if (this.pinnedLots.includes(lotId)) {
          pinned.push(lot);
        } else {
          unpinned.push(lot);
        }
      });

      pinned.forEach(lot => {
        container.insertBefore(lot, container.firstChild);
      });
    });
  }

  duplicateLot(lotId, lotElement) {
    this.notificationManager.confirm('Дублировать этот лот?', (confirmed) => {
      if (confirmed) {
        try {
          const clone = lotElement.cloneNode(true);
          clone.dataset.lotUtilitiesProcessed = '';
          delete clone.dataset.offerId;
          
          const newId = `lot-copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          clone.dataset.offerId = newId;

          const actionsContainer = clone.querySelector('.funpay-lot-utilities-actions');
          if (actionsContainer) {
            actionsContainer.remove();
          }

          lotElement.parentElement.insertBefore(clone, lotElement.nextSibling);
          
          this.addUtilitiesToLot(clone);
          
          this.notificationManager.show('📋 Лот дублирован', 'success');
        } catch (error) {
          console.error('Error duplicating lot:', error);
          this.notificationManager.show('❌ Ошибка дублирования', 'error');
        }
      }
    });
  }

  disableLot(lotId, lotElement) {
    this.notificationManager.confirm('Отключить этот лот?', (confirmed) => {
      if (confirmed) {
        try {
          lotElement.style.opacity = '0.5';
          lotElement.style.pointerEvents = 'none';
          lotElement.dataset.disabled = 'true';
          
          this.notificationManager.show('⏸️ Лот отключён', 'success');
        } catch (error) {
          console.error('Error disabling lot:', error);
          this.notificationManager.show('❌ Ошибка отключения', 'error');
        }
      }
    });
  }

  openComplaintForm(lotId, lotElement) {
    const lotTitle = this.getLotTitle(lotElement);
    this.notificationManager.show(`⚠️ Открытие формы жалобы для: ${lotTitle}`, 'info');
    
    try {
      const complaintUrl = `https://funpay.com/complaint/?offer=${lotId}`;
      window.open(complaintUrl, '_blank');
    } catch (error) {
      console.error('Error opening complaint form:', error);
      this.notificationManager.show('❌ Ошибка открытия формы', 'error');
    }
  }

  getLotTitle(lotElement) {
    const titleSelectors = [
      '.tc-title',
      '.offer-title',
      'h3',
      '.title',
      '[data-title]'
    ];

    for (const selector of titleSelectors) {
      const titleEl = lotElement.querySelector(selector);
      if (titleEl) {
        return titleEl.textContent.trim().substring(0, 50);
      }
    }

    return 'Лот';
  }

  updateGoodsCounter() {
    if (!this.quickTradePanel) return;

    const lots = this.findLotElements();
    const totalLots = lots.length;
    const enabledLots = lots.filter(lot => !lot.dataset.disabled).length;
    const pinnedCount = this.pinnedLots.length;

    const counter = this.quickTradePanel.querySelector('.goods-counter');
    if (counter) {
      counter.innerHTML = `
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">
          📦 Всего лотов: ${totalLots}
        </div>
        <div style="font-size: 12px; color: #666;">
          ✅ Активных: ${enabledLots} | 📌 Закреплённых: ${pinnedCount}
        </div>
      `;
    }
  }

  createQuickTradePanel() {
    if (this.quickTradePanel) return;

    this.quickTradePanel = document.createElement('div');
    this.quickTradePanel.className = 'funpay-quick-trade-panel';
    this.quickTradePanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 280px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 999998;
      overflow: hidden;
      transition: transform 0.3s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
    `;
    header.textContent = '⚡ Быстрые действия';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.addEventListener('click', () => {
      this.quickTradePanel.style.display = 'none';
    });

    header.appendChild(closeBtn);

    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
    `;

    const counter = document.createElement('div');
    counter.className = 'goods-counter';
    counter.style.cssText = `
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 12px;
    `;

    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    const massDisableBtn = this.createPanelButton('⏸️ Отключить все', () => {
      this.massDisableLots();
    });

    const massEnableBtn = this.createPanelButton('▶️ Включить все', () => {
      this.massEnableLots();
    });

    const unpinAllBtn = this.createPanelButton('📌 Открепить все', () => {
      this.unpinAllLots();
    });

    const refreshBtn = this.createPanelButton('🔄 Обновить счётчик', () => {
      this.updateGoodsCounter();
      this.notificationManager.show('🔄 Счётчик обновлён', 'success');
    });

    actionsContainer.appendChild(massDisableBtn);
    actionsContainer.appendChild(massEnableBtn);
    actionsContainer.appendChild(unpinAllBtn);
    actionsContainer.appendChild(refreshBtn);

    content.appendChild(counter);
    content.appendChild(actionsContainer);

    this.quickTradePanel.appendChild(header);
    this.quickTradePanel.appendChild(content);

    document.body.appendChild(this.quickTradePanel);

    this.makeDraggable(this.quickTradePanel, header);
    this.updateGoodsCounter();
  }

  createPanelButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      font-size: 14px;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });

    btn.addEventListener('click', onClick);

    return btn;
  }

  massDisableLots() {
    this.notificationManager.confirm('Отключить все лоты?', (confirmed) => {
      if (confirmed) {
        const lots = this.findLotElements();
        let count = 0;

        lots.forEach(lot => {
          if (!lot.dataset.disabled) {
            lot.style.opacity = '0.5';
            lot.style.pointerEvents = 'none';
            lot.dataset.disabled = 'true';
            count++;
          }
        });

        this.updateGoodsCounter();
        this.notificationManager.show(`⏸️ Отключено лотов: ${count}`, 'success');
      }
    });
  }

  massEnableLots() {
    const lots = this.findLotElements();
    let count = 0;

    lots.forEach(lot => {
      if (lot.dataset.disabled) {
        lot.style.opacity = '1';
        lot.style.pointerEvents = 'auto';
        delete lot.dataset.disabled;
        count++;
      }
    });

    this.updateGoodsCounter();
    this.notificationManager.show(`▶️ Включено лотов: ${count}`, 'success');
  }

  async unpinAllLots() {
    this.notificationManager.confirm('Открепить все лоты?', (confirmed) => {
      if (confirmed) {
        const count = this.pinnedLots.length;
        this.pinnedLots = [];
        
        chrome.storage.sync.set({ pinnedLots: [] });

        const lots = this.findLotElements();
        lots.forEach(lot => {
          this.removePinIndicator(lot);
        });

        this.updateGoodsCounter();
        this.notificationManager.show(`📌 Откреплено лотов: ${count}`, 'success');
      }
    });
  }

  makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.addEventListener('mousedown', dragMouseDown);

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener('mouseup', closeDragElement);
      document.addEventListener('mousemove', elementDrag);
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + 'px';
      element.style.left = (element.offsetLeft - pos1) + 'px';
      element.style.bottom = 'auto';
      element.style.right = 'auto';
    }

    function closeDragElement() {
      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);
    }
  }

  injectStyles() {
    if (document.getElementById('funpay-lot-utilities-styles')) return;

    const style = document.createElement('style');
    style.id = 'funpay-lot-utilities-styles';
    style.textContent = `
      .funpay-lot-utilities-actions button:hover {
        border-color: #667eea !important;
      }

      .funpay-quick-trade-panel:hover {
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3) !important;
      }

      @media (max-width: 768px) {
        .funpay-quick-trade-panel {
          width: 240px !important;
          bottom: 10px !important;
          right: 10px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.quickTradePanel) {
      this.quickTradePanel.remove();
    }
  }
}

if (typeof window !== 'undefined' && window.FunPayNotificationManager) {
  window.FunPayLotUtilities = new LotUtilities();
}
