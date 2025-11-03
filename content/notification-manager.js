class NotificationManager {
  constructor() {
    this.container = null;
    this.createContainer();
  }

  createContainer() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'funpay-customizer-notifications';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    
    if (document.body) {
      document.body.appendChild(this.container);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.container);
      });
    }
  }

  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'funpay-customizer-notification';
    notification.style.cssText = `
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      cursor: pointer;
      animation: slideInRight 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;

    const backgrounds = {
      success: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
      warning: 'linear-gradient(135deg, #f9ca24 0%, #f0932b 100%)',
      info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    };

    notification.style.background = backgrounds[type] || backgrounds.info;
    notification.textContent = message;

    this.container.appendChild(notification);

    notification.addEventListener('click', () => {
      this.remove(notification);
    });

    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }

    return notification;
  }

  remove(notification) {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  confirm(message, callback) {
    const confirmBox = document.createElement('div');
    confirmBox.className = 'funpay-customizer-confirm';
    confirmBox.style.cssText = `
      padding: 16px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      animation: slideInRight 0.3s ease;
      max-width: 300px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    `;

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.marginBottom = '12px';

    const buttons = document.createElement('div');
    buttons.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Да';
    confirmBtn.style.cssText = `
      padding: 6px 16px;
      border: none;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.9);
      color: #667eea;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    `;
    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.background = 'white';
    });
    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.background = 'rgba(255, 255, 255, 0.9)';
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Отмена';
    cancelBtn.style.cssText = `
      padding: 6px 16px;
      border: 2px solid white;
      border-radius: 4px;
      background: transparent;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    `;
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = 'transparent';
    });

    confirmBtn.addEventListener('click', () => {
      this.remove(confirmBox);
      if (callback) callback(true);
    });

    cancelBtn.addEventListener('click', () => {
      this.remove(confirmBox);
      if (callback) callback(false);
    });

    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    confirmBox.appendChild(messageEl);
    confirmBox.appendChild(buttons);

    this.container.appendChild(confirmBox);
  }

  injectStyles() {
    if (document.getElementById('funpay-customizer-notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'funpay-customizer-notification-styles';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

if (typeof window !== 'undefined') {
  window.FunPayNotificationManager = new NotificationManager();
  window.FunPayNotificationManager.injectStyles();
}
