class AutoResponderManager {
  constructor() {
    this.rateLimits = new Map();
    this.pendingMessages = new Map();
  }

  async initialize() {
    const config = await this.getConfig();
    if (config.enabled) {
      this.setupAlarms();
    }
  }

  async getConfig() {
    const defaults = {
      enabled: false,
      templates: [],
      reviewTemplates: [],
      rateLimitPerContact: 3,
      rateLimitPeriodMinutes: 60,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      manualOverrideEnabled: true,
      delayMinutes: 5,
      escalationEnabled: false,
      escalationDelayHours: 24
    };

    const stored = await chrome.storage.sync.get('automation');
    return { ...defaults, ...(stored.automation || {}) };
  }

  async setConfig(config) {
    await chrome.storage.sync.set({ automation: config });
    if (config.enabled) {
      this.setupAlarms();
    } else {
      this.clearAlarms();
    }
  }

  setupAlarms() {
    chrome.alarms.create('checkPendingMessages', {
      delayInMinutes: 1,
      periodInMinutes: 1
    });

    chrome.alarms.create('checkReviews', {
      delayInMinutes: 5,
      periodInMinutes: 5
    });
  }

  clearAlarms() {
    chrome.alarms.clear('checkPendingMessages');
    chrome.alarms.clear('checkReviews');
  }

  async scheduleFollowUp(contactId, templateId, delayMinutes) {
    const config = await this.getConfig();
    
    if (!config.enabled) {
      return { success: false, reason: 'Automation disabled' };
    }

    if (!this.checkRateLimit(contactId)) {
      return { success: false, reason: 'Rate limit exceeded' };
    }

    const messageId = `${contactId}_${Date.now()}`;
    const scheduledTime = Date.now() + (delayMinutes * 60 * 1000);

    const message = {
      id: messageId,
      contactId,
      templateId,
      scheduledTime,
      status: 'pending',
      createdAt: Date.now()
    };

    this.pendingMessages.set(messageId, message);
    await this.savePendingMessages();

    return { success: true, messageId };
  }

  async scheduleDelayedResponse(contactId, templateId, delayMinutes) {
    return this.scheduleFollowUp(contactId, templateId, delayMinutes);
  }

  async scheduleEscalation(contactId, templateId, delayHours) {
    const config = await this.getConfig();
    
    if (!config.escalationEnabled) {
      return { success: false, reason: 'Escalation disabled' };
    }

    return this.scheduleFollowUp(contactId, templateId, delayHours * 60);
  }

  checkRateLimit(contactId) {
    const now = Date.now();
    const config = this.getConfigSync();
    const periodMs = config.rateLimitPeriodMinutes * 60 * 1000;

    if (!this.rateLimits.has(contactId)) {
      this.rateLimits.set(contactId, [now]);
      return true;
    }

    const timestamps = this.rateLimits.get(contactId);
    const recentTimestamps = timestamps.filter(t => now - t < periodMs);

    if (recentTimestamps.length >= config.rateLimitPerContact) {
      return false;
    }

    recentTimestamps.push(now);
    this.rateLimits.set(contactId, recentTimestamps);
    return true;
  }

  isQuietHours() {
    const config = this.getConfigSync();
    
    if (!config.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = config.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = config.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  getConfigSync() {
    return this.cachedConfig || {
      rateLimitPerContact: 3,
      rateLimitPeriodMinutes: 60,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    };
  }

  async processPendingMessages() {
    if (this.isQuietHours()) {
      return;
    }

    const now = Date.now();
    const processed = [];

    for (const [messageId, message] of this.pendingMessages.entries()) {
      if (message.status === 'pending' && message.scheduledTime <= now) {
        const result = await this.sendMessage(message);
        
        if (result.success) {
          message.status = 'sent';
          message.sentAt = now;
          processed.push(message);
        } else {
          message.status = 'failed';
          message.error = result.error;
        }

        this.pendingMessages.set(messageId, message);
      }
    }

    if (processed.length > 0) {
      await this.savePendingMessages();
      await this.updateStats(processed);
    }
  }

  async sendMessage(message) {
    try {
      const config = await this.getConfig();
      const template = config.templates.find(t => t.id === message.templateId);
      
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      const tabs = await chrome.tabs.query({ 
        url: ['https://funpay.com/*', 'https://*.funpay.com/*'] 
      });

      if (tabs.length === 0) {
        return { success: false, error: 'No FunPay tabs open' };
      }

      await chrome.tabs.sendMessage(tabs[0].id, {
        action: 'sendAutoMessage',
        contactId: message.contactId,
        content: template.content
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async savePendingMessages() {
    const messages = Array.from(this.pendingMessages.values());
    await chrome.storage.local.set({ pendingMessages: messages });
  }

  async loadPendingMessages() {
    const data = await chrome.storage.local.get('pendingMessages');
    if (data.pendingMessages) {
      data.pendingMessages.forEach(msg => {
        this.pendingMessages.set(msg.id, msg);
      });
    }
  }

  async updateStats(messages) {
    const stats = await chrome.storage.local.get('automationStats');
    const current = stats.automationStats || {
      totalSent: 0,
      totalFailed: 0,
      lastSent: null,
      sentToday: 0,
      lastResetDate: new Date().toDateString()
    };

    const today = new Date().toDateString();
    if (current.lastResetDate !== today) {
      current.sentToday = 0;
      current.lastResetDate = today;
    }

    messages.forEach(msg => {
      if (msg.status === 'sent') {
        current.totalSent++;
        current.sentToday++;
        current.lastSent = msg.sentAt;
      } else if (msg.status === 'failed') {
        current.totalFailed++;
      }
    });

    await chrome.storage.local.set({ automationStats: current });
  }

  async getStats() {
    const data = await chrome.storage.local.get('automationStats');
    return data.automationStats || {
      totalSent: 0,
      totalFailed: 0,
      lastSent: null,
      sentToday: 0,
      lastResetDate: new Date().toDateString()
    };
  }

  async cancelMessage(messageId) {
    if (this.pendingMessages.has(messageId)) {
      this.pendingMessages.delete(messageId);
      await this.savePendingMessages();
      return { success: true };
    }
    return { success: false, reason: 'Message not found' };
  }

  async getPendingMessages() {
    return Array.from(this.pendingMessages.values())
      .filter(msg => msg.status === 'pending')
      .sort((a, b) => a.scheduledTime - b.scheduledTime);
  }
}
