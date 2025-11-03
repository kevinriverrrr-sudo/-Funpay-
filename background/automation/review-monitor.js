class ReviewMonitor {
  constructor(autoResponderManager) {
    this.autoResponderManager = autoResponderManager;
    this.lastCheckedReviews = new Map();
  }

  async initialize() {
    const data = await chrome.storage.local.get('lastCheckedReviews');
    if (data.lastCheckedReviews) {
      this.lastCheckedReviews = new Map(Object.entries(data.lastCheckedReviews));
    }
  }

  async checkForNewReviews() {
    const config = await this.autoResponderManager.getConfig();
    
    if (!config.enabled || config.reviewTemplates.length === 0) {
      return;
    }

    const tabs = await chrome.tabs.query({ 
      url: ['https://funpay.com/*', 'https://*.funpay.com/*'] 
    });

    if (tabs.length === 0) {
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        action: 'getReviews'
      });

      if (response && response.reviews) {
        await this.processReviews(response.reviews, config);
      }
    } catch (error) {
      console.error('Error checking reviews:', error);
    }
  }

  async processReviews(reviews, config) {
    const newReviews = [];

    for (const review of reviews) {
      const reviewId = review.id || `${review.author}_${review.timestamp}`;
      
      if (!this.lastCheckedReviews.has(reviewId)) {
        newReviews.push(review);
        this.lastCheckedReviews.set(reviewId, Date.now());
      }
    }

    if (newReviews.length > 0) {
      await this.handleNewReviews(newReviews, config);
      await this.saveLastCheckedReviews();
    }
  }

  async handleNewReviews(reviews, config) {
    for (const review of reviews) {
      for (const template of config.reviewTemplates) {
        if (!template.enabled) {
          continue;
        }

        const shouldRespond = this.shouldRespondToReview(review, template);
        
        if (shouldRespond) {
          const delayMinutes = template.delayMinutes || 5;
          
          await this.autoResponderManager.scheduleFollowUp(
            review.author,
            template.id,
            delayMinutes
          );

          await this.notifyUser(review, template);
          
          if (template.oneResponsePerReview) {
            break;
          }
        }
      }
    }
  }

  shouldRespondToReview(review, template) {
    if (template.ratingFilter && template.ratingFilter.length > 0) {
      if (!template.ratingFilter.includes(review.rating)) {
        return false;
      }
    }

    if (template.keywordFilter && template.keywordFilter.length > 0) {
      const reviewText = (review.text || '').toLowerCase();
      const hasKeyword = template.keywordFilter.some(keyword => 
        reviewText.includes(keyword.toLowerCase())
      );
      
      if (!hasKeyword) {
        return false;
      }
    }

    return true;
  }

  async notifyUser(review, template) {
    const config = await this.autoResponderManager.getConfig();
    
    if (config.showNotifications !== false) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
        title: 'Новый отзыв обнаружен',
        message: `Автоответ "${template.name}" будет отправлен через ${template.delayMinutes || 5} мин.`,
        priority: 1
      });
    }
  }

  async saveLastCheckedReviews() {
    const obj = Object.fromEntries(this.lastCheckedReviews);
    await chrome.storage.local.set({ lastCheckedReviews: obj });
  }

  async clearHistory() {
    this.lastCheckedReviews.clear();
    await chrome.storage.local.remove('lastCheckedReviews');
  }
}
