// Lot automation helpers for DOM interactions with FunPay

class LotAutomation {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.selectors = {
      lotList: '.tc-item, .offer-list-item, [class*="lot-"], [class*="offer-"]',
      liftButton: '[data-action="raise"], .tc-order-btn-raise, button[title*="поднять"], button[title*="Поднять"]',
      toggleButton: '[data-action="toggle"], .tc-order-btn-toggle, button[title*="активировать"], button[title*="деактивировать"]',
      activeIndicator: '.tc-active, .status-active, [class*="active"]',
      inactiveIndicator: '.tc-inactive, .status-inactive, [class*="inactive"]'
    };
  }

  async findLotElements() {
    let retries = 0;
    while (retries < this.maxRetries) {
      const lots = document.querySelectorAll(this.selectors.lotList);
      if (lots.length > 0) {
        return Array.from(lots);
      }
      await this.sleep(this.retryDelay);
      retries++;
    }
    return [];
  }

  async liftLot(lotElement) {
    try {
      const liftButton = this.findButton(lotElement, this.selectors.liftButton);
      if (!liftButton) {
        return { success: false, error: 'Кнопка поднятия не найдена' };
      }

      if (liftButton.disabled || liftButton.classList.contains('disabled')) {
        return { success: false, error: 'Кнопка поднятия недоступна (возможно, превышен лимит)' };
      }

      liftButton.click();
      await this.sleep(500);

      return { success: true, message: 'Лот успешно поднят' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async toggleLot(lotElement, targetState = null) {
    try {
      const toggleButton = this.findButton(lotElement, this.selectors.toggleButton);
      if (!toggleButton) {
        return { success: false, error: 'Кнопка переключения не найдена' };
      }

      const currentState = this.isLotActive(lotElement);
      
      if (targetState !== null && currentState === targetState) {
        return { success: true, message: `Лот уже в нужном состоянии: ${targetState ? 'активен' : 'неактивен'}` };
      }

      toggleButton.click();
      await this.sleep(500);

      return { success: true, message: `Лот ${currentState ? 'деактивирован' : 'активирован'}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  isLotActive(lotElement) {
    const activeIndicator = lotElement.querySelector(this.selectors.activeIndicator);
    const inactiveIndicator = lotElement.querySelector(this.selectors.inactiveIndicator);
    
    if (activeIndicator) return true;
    if (inactiveIndicator) return false;
    
    return !lotElement.classList.contains('inactive') && 
           !lotElement.classList.contains('disabled');
  }

  findButton(container, selector) {
    const button = container.querySelector(selector);
    if (button) return button;

    const buttons = container.querySelectorAll('button, a.btn, [role="button"]');
    for (const btn of buttons) {
      const text = btn.textContent.toLowerCase();
      if (selector.includes('raise') && (text.includes('поднять') || text.includes('raise'))) {
        return btn;
      }
      if (selector.includes('toggle') && (text.includes('активировать') || text.includes('деактивировать') || text.includes('toggle'))) {
        return btn;
      }
    }
    
    return null;
  }

  async liftAllLots() {
    const lots = await this.findLotElements();
    const results = {
      total: lots.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const lot of lots) {
      const result = await this.liftLot(lot);
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push(result.error);
      }
      await this.sleep(1000);
    }

    return results;
  }

  async toggleAllLots(targetState) {
    const lots = await this.findLotElements();
    const results = {
      total: lots.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const lot of lots) {
      const result = await this.toggleLot(lot, targetState);
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push(result.error);
      }
      await this.sleep(1000);
    }

    return results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async navigateToLotsPage() {
    const currentUrl = window.location.href;
    if (!currentUrl.includes('/lots') && !currentUrl.includes('/offers')) {
      const lotsLink = document.querySelector('a[href*="/lots"], a[href*="/offers"], a[href*="/my/lots"]');
      if (lotsLink) {
        window.location.href = lotsLink.href;
        return true;
      }
      return false;
    }
    return true;
  }
}

if (typeof window !== 'undefined') {
  window.LotAutomation = LotAutomation;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const automation = new LotAutomation();

  if (request.action === 'liftAllLots') {
    automation.liftAllLots().then(results => {
      sendResponse(results);
    }).catch(error => {
      sendResponse({ total: 0, successful: 0, failed: 0, errors: [error.message] });
    });
    return true;
  }

  if (request.action === 'toggleAllLots') {
    automation.toggleAllLots(request.targetState).then(results => {
      sendResponse(results);
    }).catch(error => {
      sendResponse({ total: 0, successful: 0, failed: 0, errors: [error.message] });
    });
    return true;
  }

  if (request.action === 'navigateToLots') {
    automation.navigateToLotsPage().then(result => {
      sendResponse({ success: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});
