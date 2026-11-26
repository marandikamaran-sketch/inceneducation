/**
 * EduVision AR Pro - Web Audio API Synthesizer & Indonesian SpeechSynthesis
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
  }

  _ensureCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playTone(freq, duration = 0.14, type = 'sine', volume = 0.12, delay = 0) {
    this._ensureCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playPinch() {
    this.playTone(540, 0.08, 'triangle', 0.1);
    this.playTone(760, 0.09, 'sine', 0.08, 0.04);
  }

  playSuccess() {
    this.playTone(523.25, 0.14, 'triangle', 0.14, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.14, 0.09);
    this.playTone(783.99, 0.2, 'sine', 0.16, 0.18);
    this.playTone(1046.5, 0.28, 'sine', 0.14, 0.28);
  }

  playError() {
    this.playTone(230, 0.18, 'sawtooth', 0.09, 0);
    this.playTone(175, 0.24, 'sawtooth', 0.09, 0.12);
  }

  speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'id-ID';
      utter.rate = 0.98;
      utter.pitch = 1.08;
      window.speechSynthesis.speak(utter);
    } catch {
      // Graceful no-op if speech synthesis unavailable
    }
  }
}

export const audioEngine = new AudioEngine();
