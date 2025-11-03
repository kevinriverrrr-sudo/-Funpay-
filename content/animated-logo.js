class AnimatedLogoEffect {
  constructor() {
    this.container = null;
    this.animationPaused = false;
    this.enabled = false;
    this.originalLogo = null;
  }

  init() {
    if (this.container) return;

    this.findAndReplaceOriginalLogo();
  }

  findAndReplaceOriginalLogo() {
    const logoSelectors = [
      '.logo',
      '.header-logo',
      'a[href="/"]',
      '.navbar-brand',
      'header a:first-child'
    ];

    let logoElement = null;
    for (const selector of logoSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        logoElement = el;
        break;
      }
    }

    if (!logoElement) {
      const header = document.querySelector('header');
      if (header) {
        logoElement = header.querySelector('a');
      }
    }

    if (logoElement) {
      this.originalLogo = logoElement.cloneNode(true);
      this.createAnimatedLogo(logoElement);
    }
  }

  createAnimatedLogo(targetElement) {
    this.container = document.createElement('div');
    this.container.id = 'funpay-animated-logo';
    this.container.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-decoration: none;
    `;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.style.cssText = `
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    `;

    const animatedCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    animatedCircle.setAttribute('cx', '50');
    animatedCircle.setAttribute('cy', '50');
    animatedCircle.setAttribute('r', '35');
    animatedCircle.setAttribute('fill', 'none');
    animatedCircle.setAttribute('stroke', '#667eea');
    animatedCircle.setAttribute('stroke-width', '4');
    animatedCircle.setAttribute('stroke-dasharray', '220');
    animatedCircle.setAttribute('stroke-dashoffset', '0');
    
    const rotateAnim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    rotateAnim.setAttribute('attributeName', 'transform');
    rotateAnim.setAttribute('type', 'rotate');
    rotateAnim.setAttribute('from', '0 50 50');
    rotateAnim.setAttribute('to', '360 50 50');
    rotateAnim.setAttribute('dur', '3s');
    rotateAnim.setAttribute('repeatCount', 'indefinite');
    
    animatedCircle.appendChild(rotateAnim);

    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', '50');
    centerCircle.setAttribute('cy', '50');
    centerCircle.setAttribute('r', '20');
    centerCircle.setAttribute('fill', '#764ba2');
    
    const pulseAnim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    pulseAnim.setAttribute('attributeName', 'r');
    pulseAnim.setAttribute('values', '20;25;20');
    pulseAnim.setAttribute('dur', '2s');
    pulseAnim.setAttribute('repeatCount', 'indefinite');
    
    centerCircle.appendChild(pulseAnim);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50');
    text.setAttribute('y', '55');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('font-size', '20');
    text.setAttribute('font-weight', 'bold');
    text.textContent = 'FP';

    svg.appendChild(animatedCircle);
    svg.appendChild(centerCircle);
    svg.appendChild(text);

    this.container.appendChild(svg);

    const textSpan = document.createElement('span');
    textSpan.textContent = 'FunPay';
    textSpan.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: inherit;
      text-decoration: none;
    `;
    this.container.appendChild(textSpan);

    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
      display: inline-flex;
      gap: 5px;
      margin-left: 10px;
    `;

    const pauseBtn = document.createElement('button');
    pauseBtn.innerHTML = '⏸';
    pauseBtn.title = 'Пауза/Возобновить анимацию';
    pauseBtn.style.cssText = `
      background: rgba(102, 126, 234, 0.2);
      border: 1px solid rgba(102, 126, 234, 0.5);
      border-radius: 4px;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 12px;
      transition: all 0.3s ease;
    `;
    
    pauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.togglePause();
      pauseBtn.innerHTML = this.animationPaused ? '▶' : '⏸';
    });

    pauseBtn.addEventListener('mouseenter', () => {
      pauseBtn.style.background = 'rgba(102, 126, 234, 0.4)';
    });

    pauseBtn.addEventListener('mouseleave', () => {
      pauseBtn.style.background = 'rgba(102, 126, 234, 0.2)';
    });

    controlsContainer.appendChild(pauseBtn);
    this.container.appendChild(controlsContainer);

    if (targetElement.href) {
      this.container.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          window.location.href = targetElement.href;
        }
      });
    }

    targetElement.replaceWith(this.container);
  }

  togglePause() {
    this.animationPaused = !this.animationPaused;
    
    const svg = this.container?.querySelector('svg');
    if (!svg) return;

    const animations = svg.querySelectorAll('animate, animateTransform');
    animations.forEach(anim => {
      if (this.animationPaused) {
        anim.beginElement();
        setTimeout(() => {
          const currentTime = anim.getCurrentTime();
          anim.pauseAnimations ? anim.pauseAnimations() : svg.pauseAnimations();
        }, 0);
      } else {
        svg.unpauseAnimations ? svg.unpauseAnimations() : anim.beginElement();
      }
    });
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.init();
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;

    if (this.container && this.originalLogo) {
      this.container.replaceWith(this.originalLogo.cloneNode(true));
      this.container = null;
    }
  }

  destroy() {
    this.disable();
    this.originalLogo = null;
  }
}
