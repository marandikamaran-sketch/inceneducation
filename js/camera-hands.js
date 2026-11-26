/**
 * EduVision AR Pro - Webcam AR, MediaPipe Hands & Pointer Events Controller
 * Mendukung hingga 2 tangan secara bersamaan (Split-Screen Duel)
 * serta kontrol mouse & layar sentuh (Pointer Events) sebagai fallback mulus.
 */

export class CameraHandsController {
  constructor(videoEl, canvasEl, options = {}) {
    this.videoEl = videoEl;
    this.canvasEl = canvasEl;
    this.pinchThreshold = options.pinchThreshold ?? 0.065;
    this.onStatusChange = options.onStatusChange || (() => {});
    this.cameraActive = false;
    this.stream = null;
    this.handsModel = null;
    this.processingFrame = false;

    // Normalized cursors (hands + pointer)
    // Each hand: { id, x, y, pinching, landmarks, color }
    this.handCursors = [];
    this.pointerCursor = {
      id: 'pointer',
      active: false,
      x: 0,
      y: 0,
      pinching: false,
      color: '#38bdf8'
    };

    this._bindPointerEvents();
  }

  setPinchThreshold(val) {
    this.pinchThreshold = Number(val) || 0.065;
  }

  _bindPointerEvents() {
    const getPos = (e) => {
      const rect = this.canvasEl.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvasEl.addEventListener('pointerdown', (e) => {
      this.canvasEl.setPointerCapture?.(e.pointerId);
      const pos = getPos(e);
      this.pointerCursor.active = true;
      this.pointerCursor.pinching = true;
      this.pointerCursor.x = pos.x;
      this.pointerCursor.y = pos.y;
    });

    this.canvasEl.addEventListener('pointermove', (e) => {
      const pos = getPos(e);
      this.pointerCursor.active = true;
      this.pointerCursor.x = pos.x;
      this.pointerCursor.y = pos.y;
    });

    const release = () => {
      this.pointerCursor.pinching = false;
    };
    this.canvasEl.addEventListener('pointerup', release);
    this.canvasEl.addEventListener('pointercancel', release);
    this.canvasEl.addEventListener('pointerleave', release);
  }

  async startCamera() {
    if (this.cameraActive) return true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung di browser ini.');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      this.videoEl.srcObject = this.stream;
      await this.videoEl.play();
      this.videoEl.classList.add('active');
      this.cameraActive = true;
      this.onStatusChange(true, 'Kamera AR Aktif');
      this._initMediaPipe();
      return true;
    } catch (err) {
      this.cameraActive = false;
      this.videoEl.classList.remove('active');
      this.onStatusChange(false, 'Mode Virtual (Sentuh/Mouse)');
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.videoEl.srcObject = null;
    this.videoEl.classList.remove('active');
    this.cameraActive = false;
    this.handCursors = [];
    this.onStatusChange(false, 'Mode Virtual');
  }

  _initMediaPipe() {
    if (typeof window.Hands !== 'function') {
      return;
    }
    if (!this.handsModel) {
      this.handsModel = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      this.handsModel.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.55
      });
      this.handsModel.onResults((results) => this._onHandResults(results));
    }
    this._pumpCameraLoop();
  }

  async _pumpCameraLoop() {
    if (!this.cameraActive || !this.handsModel) return;
    if (this.videoEl.readyState >= 2 && !this.processingFrame) {
      this.processingFrame = true;
      try {
        await this.handsModel.send({ image: this.videoEl });
      } catch {
        // Ignore transient frame drop
      } finally {
        this.processingFrame = false;
      }
    }
    requestAnimationFrame(() => this._pumpCameraLoop());
  }

  _onHandResults(results) {
    const w = this.canvasEl.clientWidth || window.innerWidth;
    const h = this.canvasEl.clientHeight || window.innerHeight;
    const list = results.multiHandLandmarks || [];
    const palette = ['#38bdf8', '#f472b6'];

    this.handCursors = list.map((lm, idx) => {
      const thumb = lm[4];
      const index = lm[8];
      // Mirrored X coordinate so movement feels like a natural mirror
      const mx = (1 - (thumb.x + index.x) / 2) * w;
      const my = ((thumb.y + index.y) / 2) * h;
      const dist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
      const pinching = dist < this.pinchThreshold;

      const screenLandmarks = lm.map((p) => ({
        x: (1 - p.x) * w,
        y: p.y * h
      }));

      return {
        id: `hand-${idx}`,
        x: mx,
        y: my,
        pinching,
        landmarks: screenLandmarks,
        color: mx < w / 2 ? palette[0] : palette[1]
      };
    });
  }

  getActiveCursors() {
    const cursors = [...this.handCursors];
    if (this.pointerCursor.active) {
      cursors.push(this.pointerCursor);
    }
    return cursors;
  }
}
