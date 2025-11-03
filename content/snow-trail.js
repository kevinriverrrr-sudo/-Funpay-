class SnowTrailEffect {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.lastTime = 0;
    this.throttleDelay = 16;
    this.maxParticles = 50;
    this.enabled = false;
  }

  init() {
    if (this.canvas) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'funpay-snow-trail-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.8;
    `;
    
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  handleMouseMove(e) {
    if (!this.enabled) return;
    
    const currentTime = Date.now();
    if (currentTime - this.lastTime < this.throttleDelay) return;
    
    this.lastTime = currentTime;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    
    this.createParticle(e.clientX, e.clientY);
  }

  createParticle(x, y) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }

    const particle = {
      x: x,
      y: y,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 2,
      speedY: Math.random() * 2 + 1,
      opacity: 1,
      life: 1
    };

    this.particles.push(particle);
  }

  animate() {
    if (!this.enabled || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.speedX;
      p.y += p.speedY;
      p.life -= 0.02;
      p.opacity = p.life;

      if (p.life <= 0 || p.y > this.canvas.height) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    
    if (!this.canvas) {
      this.init();
    } else {
      this.canvas.style.display = 'block';
    }
    
    this.animate();
  }

  disable() {
    this.enabled = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.canvas) {
      this.canvas.style.display = 'none';
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
    
    this.particles = [];
  }

  destroy() {
    this.disable();
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    this.canvas = null;
    this.ctx = null;
  }
}
