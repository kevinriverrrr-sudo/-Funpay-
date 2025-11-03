const UIComponents = {
  createTabs(config) {
    const container = document.createElement('div');
    container.className = 'tabs-component';
    container.setAttribute('role', 'tablist');

    const tabsNav = document.createElement('div');
    tabsNav.className = 'tabs-nav';

    const tabsContent = document.createElement('div');
    tabsContent.className = 'tabs-content-container';

    config.tabs.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'tab-button';
      tabButton.setAttribute('role', 'tab');
      tabButton.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tabButton.setAttribute('aria-controls', `tab-panel-${tab.id}`);
      tabButton.setAttribute('id', `tab-${tab.id}`);
      tabButton.setAttribute('tabindex', index === 0 ? '0' : '-1');
      tabButton.dataset.tabId = tab.id;
      
      if (tab.icon) {
        const icon = document.createElement('span');
        icon.className = 'tab-icon';
        icon.textContent = tab.icon;
        tabButton.appendChild(icon);
      }
      
      const label = document.createElement('span');
      label.className = 'tab-label';
      label.textContent = tab.label;
      tabButton.appendChild(label);

      if (index === 0) {
        tabButton.classList.add('active');
      }

      tabButton.addEventListener('click', () => {
        this.switchTab(tabButton, config.tabs);
      });

      tabButton.addEventListener('keydown', (e) => {
        this.handleTabKeyboard(e, tabsNav, config.tabs);
      });

      tabsNav.appendChild(tabButton);

      const tabPanel = document.createElement('div');
      tabPanel.className = 'tab-panel';
      tabPanel.setAttribute('role', 'tabpanel');
      tabPanel.setAttribute('aria-labelledby', `tab-${tab.id}`);
      tabPanel.setAttribute('id', `tab-panel-${tab.id}`);
      tabPanel.dataset.tabId = tab.id;

      if (index !== 0) {
        tabPanel.classList.add('hidden');
      }

      if (tab.content) {
        if (typeof tab.content === 'string') {
          tabPanel.innerHTML = tab.content;
        } else {
          tabPanel.appendChild(tab.content);
        }
      }

      tabsContent.appendChild(tabPanel);
    });

    container.appendChild(tabsNav);
    container.appendChild(tabsContent);

    return container;
  },

  switchTab(button, tabs) {
    const tabsNav = button.parentElement;
    const tabsContent = tabsNav.nextElementSibling;
    const targetId = button.dataset.tabId;

    tabsNav.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1');
    });

    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
    button.setAttribute('tabindex', '0');

    tabsContent.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    const targetPanel = tabsContent.querySelector(`[data-tab-id="${targetId}"]`);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
    }
  },

  handleTabKeyboard(e, tabsNav, tabs) {
    const buttons = Array.from(tabsNav.querySelectorAll('.tab-button'));
    const currentIndex = buttons.indexOf(e.target);

    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = buttons.length - 1;
    }

    if (nextIndex !== currentIndex) {
      buttons[nextIndex].focus();
      buttons[nextIndex].click();
    }
  },

  createAccordion(config) {
    const container = document.createElement('div');
    container.className = 'accordion-component';

    config.items.forEach((item, index) => {
      const accordionItem = document.createElement('div');
      accordionItem.className = 'accordion-item';

      const header = document.createElement('button');
      header.className = 'accordion-header';
      header.setAttribute('aria-expanded', item.expanded ? 'true' : 'false');
      header.setAttribute('aria-controls', `accordion-content-${index}`);
      header.setAttribute('id', `accordion-header-${index}`);

      const headerText = document.createElement('span');
      headerText.className = 'accordion-title';
      headerText.textContent = item.title;

      const icon = document.createElement('span');
      icon.className = 'accordion-icon';
      icon.textContent = '▼';

      header.appendChild(headerText);
      header.appendChild(icon);

      const content = document.createElement('div');
      content.className = 'accordion-content';
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', `accordion-header-${index}`);
      content.setAttribute('id', `accordion-content-${index}`);

      if (!item.expanded) {
        content.classList.add('collapsed');
      }

      if (typeof item.content === 'string') {
        content.innerHTML = item.content;
      } else {
        content.appendChild(item.content);
      }

      header.addEventListener('click', () => {
        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', !isExpanded);
        content.classList.toggle('collapsed');
        icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
      });

      accordionItem.appendChild(header);
      accordionItem.appendChild(content);
      container.appendChild(accordionItem);
    });

    return container;
  },

  createToggle(config) {
    const container = document.createElement('div');
    container.className = 'toggle-component';

    const label = document.createElement('label');
    label.className = 'toggle-label';
    label.setAttribute('for', config.id);

    const textContainer = document.createElement('div');
    textContainer.className = 'toggle-text';

    const title = document.createElement('span');
    title.className = 'toggle-title';
    title.textContent = config.label;
    textContainer.appendChild(title);

    if (config.description) {
      const description = document.createElement('span');
      description.className = 'toggle-description';
      description.textContent = config.description;
      textContainer.appendChild(description);
    }

    const switchContainer = document.createElement('div');
    switchContainer.className = 'toggle-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = config.id;
    input.className = 'toggle-input';
    input.checked = config.checked || false;

    if (config.onChange) {
      input.addEventListener('change', config.onChange);
    }

    const slider = document.createElement('span');
    slider.className = 'toggle-slider';

    switchContainer.appendChild(input);
    switchContainer.appendChild(slider);

    label.appendChild(textContainer);
    label.appendChild(switchContainer);
    container.appendChild(label);

    return container;
  },

  createFormField(config) {
    const container = document.createElement('div');
    container.className = 'form-field';

    const label = document.createElement('label');
    label.className = 'field-label';
    label.setAttribute('for', config.id);
    label.textContent = config.label;

    if (config.required) {
      const required = document.createElement('span');
      required.className = 'field-required';
      required.textContent = '*';
      label.appendChild(required);
    }

    container.appendChild(label);

    let input;
    switch (config.type) {
      case 'textarea':
        input = document.createElement('textarea');
        input.rows = config.rows || 4;
        break;
      case 'select':
        input = document.createElement('select');
        if (config.options) {
          config.options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            if (option.value === config.value) {
              opt.selected = true;
            }
            input.appendChild(opt);
          });
        }
        break;
      case 'range':
        input = document.createElement('input');
        input.type = 'range';
        input.min = config.min || 0;
        input.max = config.max || 100;
        input.step = config.step || 1;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'range-value';
        valueDisplay.textContent = config.value || config.min || 0;
        
        input.addEventListener('input', (e) => {
          valueDisplay.textContent = e.target.value;
          if (config.onChange) {
            config.onChange(e);
          }
        });
        
        break;
      default:
        input = document.createElement('input');
        input.type = config.type || 'text';
    }

    input.id = config.id;
    input.className = 'field-input';
    
    if (config.value !== undefined) {
      input.value = config.value;
    }

    if (config.placeholder) {
      input.placeholder = config.placeholder;
    }

    if (config.onChange && config.type !== 'range') {
      input.addEventListener('change', config.onChange);
    }

    container.appendChild(input);

    if (config.type === 'range' && valueDisplay) {
      container.appendChild(valueDisplay);
    }

    if (config.description) {
      const description = document.createElement('span');
      description.className = 'field-description';
      description.textContent = config.description;
      container.appendChild(description);
    }

    return container;
  },

  createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    const spinnerInner = document.createElement('div');
    spinnerInner.className = 'spinner-inner';
    
    spinner.appendChild(spinnerInner);
    return spinner;
  },

  showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    const text = document.createElement('span');
    text.className = 'notification-text';
    text.textContent = message;
    
    notification.appendChild(icon);
    notification.appendChild(text);
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  createErrorState(message) {
    const container = document.createElement('div');
    container.className = 'error-state';
    
    const icon = document.createElement('div');
    icon.className = 'error-icon';
    icon.textContent = '⚠️';
    
    const text = document.createElement('p');
    text.className = 'error-text';
    text.textContent = message;
    
    container.appendChild(icon);
    container.appendChild(text);
    
    return container;
  },

  createEmptyState(message, icon = '📭') {
    const container = document.createElement('div');
    container.className = 'empty-state';
    
    const iconEl = document.createElement('div');
    iconEl.className = 'empty-icon';
    iconEl.textContent = icon;
    
    const text = document.createElement('p');
    text.className = 'empty-text';
    text.textContent = message;
    
    container.appendChild(iconEl);
    container.appendChild(text);
    
    return container;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIComponents;
}
