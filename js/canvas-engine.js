/**
 * EduVision AR Pro - 2D Spatial Canvas Visualization Engine
 * Merender 3 Dunia Virtual (Luar Angkasa, Bawah Laut, Hutan Ajaib),
 * gelembung jawaban interaktif dengan fisika melayang, portal tujuan,
 * efek partikel & riak energi VisionOS, serta kerangka tangan holografik.
 */

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

export class SpatialCanvasEngine {
  constructor(canvasEl, callbacks = {}) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.onDropInPortal = callbacks.onDropInPortal || (() => {});
    this.onPinchGrab = callbacks.onPinchGrab || (() => {});

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.world = 'space'; // 'ar' | 'space' | 'ocean' | 'forest'
    this.gameMode = 'single'; // 'single' | 'split' | 'classify'
    this.magnetAssist = true;
    this.showSkeleton = true;

    this.bubbles = [];
    this.portals = [];
    this.particles = [];
    this.ripples = [];
    this.ambientEntities = [];
    this.grabbedByCursor = new Map();
    this.prevPinchState = new Map();
    this.time = 0;

    this.resize();
    this._initAmbient();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._rebuildPortals();
  }

  setWorld(world) {
    this.world = world;
    this._initAmbient();
  }

  setMode(mode, classifyLabels = null) {
    this.gameMode = mode;
    this.classifyLabels = classifyLabels;
    this._rebuildPortals();
  }

  _initAmbient() {
    this.ambientEntities = Array.from({ length: 42 }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      r: Math.random() * 3.5 + 1.2,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      phase: Math.random() * Math.PI * 2
    }));
  }

  _rebuildPortals() {
    const w = this.width;
    const h = this.height;
    const portalY = h - 148;
    const radius = Math.max(54, Math.min(76, w * 0.085));

    if (this.gameMode === 'single') {
      this.portals = [
        {
          id: 'center',
          label: 'PORTAL JAWABAN',
          x: w / 2,
          y: portalY,
          r: radius,
          color: '#38bdf8'
        }
      ];
    } else if (this.gameMode === 'split') {
      this.portals = [
        {
          id: 'p1',
          label: 'PORTAL P1',
          x: w * 0.25,
          y: portalY,
          r: radius,
          color: '#38bdf8'
        },
        {
          id: 'p2',
          label: 'PORTAL P2',
          x: w * 0.75,
          y: portalY,
          r: radius,
          color: '#f472b6'
        }
      ];
    } else {
      const leftLbl = this.classifyLabels?.left || 'KIRI';
      const rightLbl = this.classifyLabels?.right || 'KANAN';
      this.portals = [
        {
          id: 'left',
          label: leftLbl,
          x: w * 0.22,
          y: portalY,
          r: radius + 6,
          color: '#34d399'
        },
        {
          id: 'right',
          label: rightLbl,
          x: w * 0.78,
          y: portalY,
          r: radius + 6,
          color: '#fbbf24'
        }
      ];
    }
  }

  spawnQuestionObjects(questionData) {
    this.grabbedByCursor.clear();
    const w = this.width;
    const h = this.height;
    const topSafe = Math.max(210, h * 0.3);
    const bottomSafe = h - 255;

    if (questionData.mode === 'classify') {
      this.setMode('classify', {
        left: questionData.leftCategory,
        right: questionData.rightCategory
      });
      const items = questionData.items || [];
      this.bubbles = items.map((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        return {
          id: `item-${idx}-${Date.now()}`,
          label: item.label,
          emoji: item.emoji || '✨',
          target: item.target,
          correct: true,
          x: w * (0.36 + col * 0.28) + (Math.random() - 0.5) * 35,
          y: topSafe + row * 105 + 25,
          vx: (Math.random() - 0.5) * 0.55,
          vy: (Math.random() - 0.5) * 0.45,
          r: Math.max(44, Math.min(58, w * 0.068)),
          phase: Math.random() * Math.PI * 2,
          grabbedBy: null,
          color: idx % 2 === 0 ? '#818cf8' : '#38bdf8'
        };
      });
      return;
    }

    const opts = questionData.options || [];
    const count = opts.length || 4;
    const usableW = Math.min(w - 110, 860);
    const startX = (w - usableW) / 2;

    this.bubbles = opts.map((opt, idx) => {
      const slotX = startX + (usableW / Math.max(1, count - 1)) * idx;
      const slotY = topSafe + ((idx % 2 === 0) ? 25 : 92);
      return {
        id: `opt-${idx}-${Date.now()}`,
        label: opt.label,
        emoji: opt.emoji || '🌟',
        correct: Boolean(opt.correct),
        x: Math.max(70, Math.min(w - 70, slotX)),
        y: Math.min(bottomSafe, slotY),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.max(46, Math.min(60, w * 0.072)),
        phase: idx * 1.3,
        grabbedBy: null,
        color: ['#38bdf8', '#818cf8', '#f472b6', '#34d399'][idx % 4]
      };
    });
  }

  burstParticles(x, y, color = '#38bdf8', count = 26) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 2.2 + Math.random() * 5.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 4.5 + 2,
        life: 1,
        color
      });
    }
  }

  addRipple(x, y, color = '#38bdf8') {
    this.ripples.push({ x, y, r: 10, maxR: 72, alpha: 0.9, color });
  }

  update(cursors) {
    this.time += 0.025;
    const w = this.width;
    const h = this.height;

    // 1. Handle Pinch-to-Grab & Release for each cursor
    const activeIds = new Set(cursors.map((c) => c.id));
    for (const [cid, bubble] of this.grabbedByCursor.entries()) {
      if (!activeIds.has(cid)) {
        bubble.grabbedBy = null;
        this.grabbedByCursor.delete(cid);
      }
    }

    for (const cursor of cursors) {
      const wasPinching = this.prevPinchState.get(cursor.id) || false;
      const isPinching = cursor.pinching;

      if (isPinching && !wasPinching) {
        this.addRipple(cursor.x, cursor.y, cursor.color || '#38bdf8');
        // Find nearest bubble within grab radius (boosted by Magnet Assist)
        const magnetBonus = this.magnetAssist ? 46 : 8;
        let best = null;
        let bestDist = Infinity;
        for (const b of this.bubbles) {
          if (b.grabbedBy) continue;
          const d = Math.hypot(cursor.x - b.x, cursor.y - b.y);
          if (d <= b.r + magnetBonus && d < bestDist) {
            best = b;
            bestDist = d;
          }
        }
        if (best) {
          best.grabbedBy = cursor.id;
          this.grabbedByCursor.set(cursor.id, best);
          this.onPinchGrab(best);
        }
      } else if (isPinching && this.grabbedByCursor.has(cursor.id)) {
        const b = this.grabbedByCursor.get(cursor.id);
        b.x += (cursor.x - b.x) * 0.38;
        b.y += (cursor.y - b.y) * 0.38;
      } else if (!isPinching && wasPinching && this.grabbedByCursor.has(cursor.id)) {
        const b = this.grabbedByCursor.get(cursor.id);
        b.grabbedBy = null;
        this.grabbedByCursor.delete(cursor.id);
        this._checkPortalDrop(b);
      }

      // Also check live portal entry while holding (extra friendly for young kids)
      if (isPinching && this.grabbedByCursor.has(cursor.id)) {
        const b = this.grabbedByCursor.get(cursor.id);
        if (this._checkPortalDrop(b)) {
          b.grabbedBy = null;
          this.grabbedByCursor.delete(cursor.id);
        }
      }

      this.prevPinchState.set(cursor.id, isPinching);
    }

    // 2. Float physics for ungrabbed bubbles
    const topBound = 200;
    const bottomBound = h - 220;
    for (const b of this.bubbles) {
      if (b.grabbedBy) continue;
      b.x += b.vx;
      b.y += b.vy + Math.sin(this.time + b.phase) * 0.32;
      if (b.x < b.r + 18 || b.x > w - b.r - 18) b.vx *= -1;
      if (b.y < topBound || b.y > bottomBound) b.vy *= -1;
      b.x = Math.max(b.r + 16, Math.min(w - b.r - 16, b.x));
      b.y = Math.max(topBound, Math.min(bottomBound, b.y));
    }

    // 3. Particles & Ripples
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= 0.025;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rp = this.ripples[i];
      rp.r += 3.2;
      rp.alpha -= 0.04;
      if (rp.alpha <= 0) this.ripples.splice(i, 1);
    }
  }

  _checkPortalDrop(bubble) {
    for (const portal of this.portals) {
      const d = Math.hypot(bubble.x - portal.x, bubble.y - portal.y);
      if (d <= portal.r + bubble.r * 0.45) {
        this.onDropInPortal(bubble, portal);
        return true;
      }
    }
    return false;
  }

  removeBubble(bubbleId) {
    this.bubbles = this.bubbles.filter((b) => b.id !== bubbleId);
  }

  render(cursors, cameraActive) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Background World (if virtual mode OR camera inactive)
    if (this.world !== 'ar' || !cameraActive) {
      this._drawVirtualWorld(ctx, w, h);
    } else {
      // Subtle spatial vignette over AR webcam
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(6, 12, 30, 0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Split-Screen Divider
    if (this.gameMode === 'split') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Portals
    for (const p of this.portals) {
      this._drawPortal(ctx, p);
    }

    // 4. Draw Answer Bubbles
    for (const b of this.bubbles) {
      this._drawBubble(ctx, b);
    }

    // 5. Draw Ripples & Particles
    for (const rp of this.ripples) {
      ctx.save();
      ctx.strokeStyle = rp.color;
      ctx.globalAlpha = Math.max(0, rp.alpha);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Draw Holographic Hands & Cursors
    for (const c of cursors) {
      if (this.showSkeleton && c.landmarks) {
        this._drawHandSkeleton(ctx, c.landmarks, c.color);
      }
      this._drawCursorOrb(ctx, c);
    }
  }

  _drawVirtualWorld(ctx, w, h) {
    const mode = this.world === 'ar' ? 'space' : this.world;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (mode === 'space') {
      grad.addColorStop(0, '#070b1e');
      grad.addColorStop(0.55, '#131d47');
      grad.addColorStop(1, '#1e1b4b');
    } else if (mode === 'ocean') {
      grad.addColorStop(0, '#042f4b');
      grad.addColorStop(0.55, '#075985');
      grad.addColorStop(1, '#082f49');
    } else {
      grad.addColorStop(0, '#052e16');
      grad.addColorStop(0.55, '#14532d');
      grad.addColorStop(1, '#064e3b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Ambient floating stars / ocean bubbles / fireflies
    for (const e of this.ambientEntities) {
      e.x += e.vx;
      e.y += mode === 'ocean' ? -Math.abs(e.vy) - 0.35 : e.vy;
      if (e.x < 0) e.x = w;
      if (e.x > w) e.x = 0;
      if (e.y < 0) e.y = h;
      if (e.y > h) e.y = 0;

      const glow = 0.45 + 0.45 * Math.sin(this.time * 1.8 + e.phase);
      ctx.save();
      ctx.globalAlpha = glow;
      if (mode === 'space') {
        ctx.fillStyle = '#e0f2fe';
      } else if (mode === 'ocean') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 1.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      } else {
        ctx.fillStyle = '#fde047';
      }
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawPortal(ctx, p) {
    const pulse = Math.sin(this.time * 2.4) * 5;
    ctx.save();

    // Outer Halo
    const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.2, p.x, p.y, p.r + 22 + pulse);
    grad.addColorStop(0, `${p.color}55`);
    grad.addColorStop(0.7, `${p.color}22`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 22 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Ring
    ctx.translate(p.x, p.y);
    ctx.rotate(this.time * 0.7);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Label
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.label, p.x, p.y);
    ctx.restore();
  }

  _drawBubble(ctx, b) {
    ctx.save();
    const scale = b.grabbedBy ? 1.12 : 1;
    ctx.translate(b.x, b.y);
    ctx.scale(scale, scale);

    // Glass Sphere
    const grad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, 6, 0, 0, b.r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    grad.addColorStop(0.65, `${b.color}66`);
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.75)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = b.grabbedBy ? '#ffffff' : 'rgba(255, 255, 255, 0.48)';
    ctx.lineWidth = b.grabbedBy ? 3.2 : 1.8;
    ctx.stroke();

    // Emoji
    ctx.font = `${Math.round(b.r * 0.44)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.emoji, 0, -b.r * 0.24);

    // Answer Label
    ctx.fillStyle = '#ffffff';
    const fontSize = b.label.length > 9 ? 12 : (b.label.length > 6 ? 14 : 18);
    ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(b.label, 0, b.r * 0.28);

    ctx.restore();
  }

  _drawHandSkeleton(ctx, landmarks, color) {
    ctx.save();
    ctx.strokeStyle = `${color}88`;
    ctx.lineWidth = 2;
    for (const [a, b] of HAND_CONNECTIONS) {
      const p1 = landmarks[a];
      const p2 = landmarks[b];
      if (!p1 || !p2) continue;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    for (const p of landmarks) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawCursorOrb(ctx, c) {
    ctx.save();
    const r = c.pinching ? 13 : 18;
    ctx.strokeStyle = c.pinching ? '#34d399' : (c.color || '#38bdf8');
    ctx.fillStyle = c.pinching ? 'rgba(52, 211, 153, 0.35)' : 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
