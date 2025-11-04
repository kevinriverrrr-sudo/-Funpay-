class DOMHelpers {
  static createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'class') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    }
    
    for (const child of children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    }
    
    return element;
  }

  static createStyleElement(id, css) {
    const existing = document.getElementById(id);
    if (existing) {
      existing.textContent = css;
      return existing;
    }
    
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    return style;
  }

  static removeStyleElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
      return true;
    }
    return false;
  }

  static createLinkElement(id, href) {
    const existing = document.getElementById(id);
    if (existing) {
      existing.href = href;
      return existing;
    }
    
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    return link;
  }

  static removeLinkElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
      return true;
    }
    return false;
  }

  static waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  static onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  static injectCSS(css, id = null) {
    const style = document.createElement('style');
    if (id) style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    return style;
  }

  static removeElement(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.remove());
    return elements.length > 0;
  }

  static addClass(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.add(className));
    return elements.length > 0;
  }

  static removeClass(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.remove(className));
    return elements.length > 0;
  }

  static toggleClass(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.toggle(className));
    return elements.length > 0;
  }

  static show(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.style.display = '');
    return elements.length > 0;
  }

  static hide(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.style.display = 'none');
    return elements.length > 0;
  }

  static on(selector, event, handler, options = {}) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.addEventListener(event, handler, options));
    return elements.length > 0;
  }

  static off(selector, event, handler, options = {}) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.removeEventListener(event, handler, options));
    return elements.length > 0;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMHelpers;
}
