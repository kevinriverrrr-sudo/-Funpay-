class CustomCursorEffect {
  constructor() {
    this.styleElement = null;
    this.enabled = false;
    this.currentCursor = 'default';
    this.customCursorData = null;
    
    this.presetCursors = {
      default: 'default',
      pointer: 'pointer',
      crosshair: 'crosshair',
      help: 'help',
      wait: 'wait',
      cell: 'cell',
      neonPointer: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'10\' fill=\'%23667eea\' opacity=\'0.5\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'5\' fill=\'%23764ba2\'/%3E%3C/svg%3E") 16 16, auto',
      arrow: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\'%3E%3Cpath d=\'M2 2 L2 20 L8 14 L12 22 L14 21 L10 13 L18 13 Z\' fill=\'%23ffffff\' stroke=\'%23000000\' stroke-width=\'1\'/%3E%3C/svg%3E") 2 2, auto',
      target: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'12\' fill=\'none\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'6\' fill=\'none\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'16\' y1=\'4\' x2=\'16\' y2=\'10\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'16\' y1=\'22\' x2=\'16\' y2=\'28\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'4\' y1=\'16\' x2=\'10\' y2=\'16\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'22\' y1=\'16\' x2=\'28\' y2=\'16\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3C/svg%3E") 16 16, auto',
      gaming: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'14\' fill=\'%2300ff00\' opacity=\'0.3\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'8\' fill=\'%2300ff00\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'2\' fill=\'%23000000\'/%3E%3C/svg%3E") 16 16, auto'
    };
  }

  init() {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'funpay-custom-cursor';
      document.head.appendChild(this.styleElement);
    }
  }

  setCursor(cursorType, customData = null) {
    this.currentCursor = cursorType;
    this.customCursorData = customData;
    
    if (this.enabled) {
      this.applyCursor();
    }
  }

  applyCursor() {
    if (!this.styleElement) {
      this.init();
    }

    let cursorValue = 'default';

    if (this.currentCursor === 'custom' && this.customCursorData) {
      cursorValue = `url("${this.customCursorData}") 16 16, auto`;
    } else if (this.presetCursors[this.currentCursor]) {
      cursorValue = this.presetCursors[this.currentCursor];
    }

    this.styleElement.textContent = `
      * {
        cursor: ${cursorValue} !important;
      }
      
      a, button, input[type="button"], input[type="submit"], 
      select, [role="button"], [onclick] {
        cursor: ${cursorValue} !important;
      }
      
      input[type="text"], input[type="password"], input[type="email"],
      input[type="number"], textarea {
        cursor: text !important;
      }
    `;
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.applyCursor();
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    
    if (this.styleElement) {
      this.styleElement.textContent = '';
    }
  }

  destroy() {
    this.disable();
    
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    
    this.styleElement = null;
  }

  isSupported(cursorType) {
    if (cursorType === 'custom') {
      return true;
    }
    
    const testElement = document.createElement('div');
    testElement.style.cursor = cursorType;
    return testElement.style.cursor !== '';
  }

  getAvailableCursors() {
    const available = [];
    
    for (const [name, value] of Object.entries(this.presetCursors)) {
      if (this.isSupported(value)) {
        available.push(name);
      }
    }
    
    return available;
  }
}
