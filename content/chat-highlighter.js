class ChatHighlighter {
  constructor(customizer) {
    this.customizer = customizer;
    this.highlightedMessages = new Set();
    this.notifiedKeywords = new Map();
  }

  init() {
    const observeChats = () => {
      const chatContainers = document.querySelectorAll('.chat-msg, [class*="chat"], [class*="message"]');
      
      if (chatContainers.length > 0) {
        this.highlightExistingMessages();
        this.setupChatObserver();
      } else {
        setTimeout(observeChats, 1000);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeChats);
    } else {
      observeChats();
    }
  }

  setupChatObserver() {
    const targetNode = document.body;
    
    const config = {
      childList: true,
      subtree: true
    };

    this.chatObserver = new MutationObserver((mutations) => {
      const chatTools = this.customizer.chatTools;
      if (!chatTools || !chatTools.highlightEnabled) return;

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processMessageElement(node);
              
              const messages = node.querySelectorAll('.chat-msg, [class*="message"]');
              messages.forEach(msg => this.processMessageElement(msg));
            }
          });
        }
      }
    });

    this.chatObserver.observe(targetNode, config);
  }

  highlightExistingMessages() {
    const chatTools = this.customizer.chatTools;
    if (!chatTools || !chatTools.highlightEnabled) return;

    const messages = document.querySelectorAll('.chat-msg, [class*="chat-message"], [class*="message"]');
    messages.forEach(msg => this.processMessageElement(msg));
  }

  refresh() {
    this.highlightedMessages.clear();
    this.notifiedKeywords.clear();
    
    const highlighted = document.querySelectorAll('.funpay-keyword-highlight');
    highlighted.forEach(el => {
      const parent = el.parentNode;
      const text = el.textContent;
      parent.replaceChild(document.createTextNode(text), el);
      parent.normalize();
    });

    const chatTools = this.customizer.chatTools;
    if (chatTools && chatTools.highlightEnabled) {
      this.highlightExistingMessages();
    }
  }

  processMessageElement(element) {
    const chatTools = this.customizer.chatTools;
    if (!chatTools || !chatTools.highlightEnabled) return;
    if (!chatTools.keywords || chatTools.keywords.length === 0) return;

    const messageId = this.getMessageId(element);
    if (this.highlightedMessages.has(messageId)) return;

    const textNodes = this.getTextNodes(element);
    
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      let hasMatch = false;
      const matches = [];

      chatTools.keywords.forEach(keyword => {
        try {
          const pattern = keyword.isRegex 
            ? new RegExp(keyword.text, 'gi')
            : new RegExp(this.escapeRegex(keyword.text), 'gi');

          let match;
          while ((match = pattern.exec(text)) !== null) {
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              keyword: keyword,
              text: match[0]
            });
            hasMatch = true;
          }
        } catch (e) {
          console.error('Error processing keyword:', keyword.text, e);
        }
      });

      if (hasMatch) {
        matches.sort((a, b) => a.start - b.start);
        
        const mergedMatches = this.mergeOverlappingMatches(matches);
        
        this.replaceTextWithHighlights(textNode, mergedMatches);
        
        mergedMatches.forEach(match => {
          if (match.keyword.priority === 'high') {
            this.showNotificationForKeyword(match.keyword, match.text);
          }
        });
      }
    });

    this.highlightedMessages.add(messageId);
  }

  getMessageId(element) {
    return element.getAttribute('data-message-id') || 
           element.id || 
           element.textContent.substring(0, 50) + '-' + Date.now();
  }

  getTextNodes(element) {
    const textNodes = [];
    const walk = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.parentElement.classList.contains('funpay-keyword-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.parentElement.tagName === 'SCRIPT' || 
              node.parentElement.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while (node = walk.nextNode()) {
      textNodes.push(node);
    }

    return textNodes;
  }

  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  mergeOverlappingMatches(matches) {
    if (matches.length === 0) return [];

    const merged = [matches[0]];

    for (let i = 1; i < matches.length; i++) {
      const current = matches[i];
      const last = merged[merged.length - 1];

      if (current.start < last.end) {
        if (current.end > last.end) {
          last.end = current.end;
        }
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  replaceTextWithHighlights(textNode, matches) {
    const text = textNode.textContent;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach(match => {
      if (match.start > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.start)));
      }

      const highlight = document.createElement('span');
      highlight.className = 'funpay-keyword-highlight';
      highlight.style.backgroundColor = match.keyword.color;
      highlight.style.color = this.getContrastColor(match.keyword.color);
      highlight.style.padding = '2px 4px';
      highlight.style.borderRadius = '3px';
      highlight.style.fontWeight = 'bold';
      highlight.textContent = text.substring(match.start, match.end);

      fragment.appendChild(highlight);
      lastIndex = match.end;
    });

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  }

  getContrastColor(hexColor) {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  showNotificationForKeyword(keyword, matchedText) {
    const chatTools = this.customizer.chatTools;
    if (!chatTools.notificationsEnabled) return;

    if (this.notifiedKeywords.has(keyword.text)) {
      const lastNotifTime = this.notifiedKeywords.get(keyword.text);
      if (Date.now() - lastNotifTime < 60000) {
        return;
      }
    }

    this.notifiedKeywords.set(keyword.text, Date.now());

    chrome.runtime.sendMessage({
      action: 'showNotification',
      title: 'Найдено ключевое слово',
      message: `"${matchedText}" обнаружено в чате`,
      keyword: keyword
    });

    if (chatTools.soundEnabled) {
      this.playNotificationSound();
    }
  }

  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.error('Error playing notification sound:', e);
    }
  }

  disconnect() {
    if (this.chatObserver) {
      this.chatObserver.disconnect();
    }
  }
}
