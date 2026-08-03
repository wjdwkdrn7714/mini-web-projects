const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
resize();
window.addEventListener('resize', resize);

const el = {
  gravity: document.getElementById('gravity'),
  gravityVal: document.getElementById('gravityVal'),
  wind: document.getElementById('wind'),
  windVal: document.getElementById('windVal'),
  rate: document.getElementById('rate'),
  rateVal: document.getElementById('rateVal'),
  life: document.getElementById('life'),
  lifeVal: document.getElementById('lifeVal'),
  modeBtns: document.querySelectorAll('.mode-btn'),
  clearBtn: document.getElementById('clearBtn'),
  toggleBtn: document.getElementById('toggleBtn'),
  showPanelBtn: document.getElementById('showPanelBtn'),
  panel: document.querySelector('.panel'),
  particleCount: document.getElementById('particleCount'),
};

let settings = {
  gravity: parseFloat(el.gravity.value),
  wind: parseFloat(el.wind.value),
  rate: parseInt(el.rate.value),
  life: parseInt(el.life.value),
  mode: 'rainbow',
};

function bindSlider(input, label, key, decimals = 2) {
  input.addEventListener('input', () => {
    settings[key] = parseFloat(input.value);
    label.textContent = decimals === 0 ? input.value : parseFloat(input.value).toFixed(decimals);
  });
}
bindSlider(el.gravity, el.gravityVal, 'gravity', 2);
bindSlider(el.wind, el.windVal, 'wind', 2);
bindSlider(el.rate, el.rateVal, 'rate', 0);
bindSlider(el.life, el.lifeVal, 'life', 0);

el.modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    el.modeBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    settings.mode = btn.dataset.mode;
  });
});

el.clearBtn.addEventListener('click', () => { particles.length = 0; });

el.toggleBtn.addEventListener('click', () => {
  el.panel.classList.add('hidden');
  el.showPanelBtn.hidden = false;
});
el.showPanelBtn.addEventListener('click', () => {
  el.panel.classList.remove('hidden');
  el.showPanelBtn.hidden = true;
});

let hue = 0;

const modeStyles = {
  rainbow: () => {
    hue = (hue + 2) % 360;
    return { color: `hsl(${hue}, 90%, 65%)`, gravityMul: 1, drag: 0.99, swirl: 0 };
  },
  fire: () => {
    const h = 15 + Math.random() * 30;
    return { color: `hsl(${h}, 100%, ${55 + Math.random() * 20}%)`, gravityMul: -0.6, drag: 0.97, swirl: 0 };
  },
  ice: () => {
    const h = 190 + Math.random() * 30;
    return { color: `hsl(${h}, 90%, ${70 + Math.random() * 20}%)`, gravityMul: 0.4, drag: 0.995, swirl: 0 };
  },
  galaxy: () => {
    const h = 250 + Math.random() * 80;
    return { color: `hsl(${h}, 90%, ${60 + Math.random() * 25}%)`, gravityMul: 0.15, drag: 0.995, swirl: 1 };
  },
};

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = Math.random() * 3 + 1.5;
    this.life = settings.life;
    this.maxLife = settings.life;
    const style = modeStyles[settings.mode]();
    this.color = style.color;
    this.gravityMul = style.gravityMul;
    this.drag = style.drag;
    this.swirl = style.swirl;
    this.angle = angle;
  }

  update() {
    if (this.swirl) {
      this.angle += 0.05;
      this.vx += Math.cos(this.angle) * 0.05;
      this.vy += Math.sin(this.angle) * 0.05;
    }
    this.vy += settings.gravity * this.gravityMul;
    this.vx += settings.wind;
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
  }

  draw() {
    const alpha = Math.max(this.life / this.maxLife, 0);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

const particles = [];
let spraying = false;
let pointerPos = { x: 0, y: 0 };

function spawnBurst(x, y, count) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y));
  }
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  return { x: point.clientX - rect.left, y: point.clientY - rect.top };
}

canvas.addEventListener('pointerdown', (e) => {
  spraying = true;
  pointerPos = getPos(e);
  spawnBurst(pointerPos.x, pointerPos.y, settings.rate * 2);
});
canvas.addEventListener('pointermove', (e) => {
  pointerPos = getPos(e);
  if (spraying) spawnBurst(pointerPos.x, pointerPos.y, Math.ceil(settings.rate / 2));
});
window.addEventListener('pointerup', () => { spraying = false; });

function animate() {
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(5, 6, 10, 0.18)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.life <= 0) particles.splice(i, 1);
  }
  ctx.globalAlpha = 1;

  el.particleCount.textContent = particles.length;
  requestAnimationFrame(animate);
}

animate();
