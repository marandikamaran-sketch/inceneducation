/**
 * EduVision AR Pro - Pyodide WebAssembly Bridge + Instant Fallback
 * Memuat python/adaptive_engine.py secara asinkron agar aplikasi langsung
 * dapat dimainkan sembari runtime Python disiapkan di latar belakang.
 */

class PythonBridge {
  constructor() {
    this.pyodide = null;
    this.ready = false;
    this.sourceCode = '';
    this.logs = ['[BRIDGE] Menyiapkan Pyodide WebAssembly...'];
    this.fallbackDifficulty = 1;
    this.fallbackStreak = 0;
  }

  async init(onStatus) {
    try {
      onStatus?.('loading', 'Memuat Python...');
      const resp = await fetch('./python/adaptive_engine.py');
      if (resp.ok) {
        this.sourceCode = await resp.text();
      } else {
        throw new Error('Gagal mengambil python/adaptive_engine.py');
      }

      if (typeof window.loadPyodide !== 'function') {
        throw new Error('CDN Pyodide belum siap');
      }

      this.pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
      });

      await this.pyodide.runPythonAsync(this.sourceCode);
      this.ready = true;
      this.logs.push('[PYODIDE] Python 3 WebAssembly aktif & adaptive_engine.py terpasang.');
      onStatus?.('ready', 'Python Aktif');
    } catch (err) {
      this.ready = false;
      this.logs.push(`[FALLBACK] Mode cadangan JS aktif (${err.message})`);
      onStatus?.('fallback', 'Mode Cepat (JS)');
    }
  }

  async generateQuestion(gradeGroup, subject, gameMode) {
    if (this.ready && this.pyodide) {
      try {
        const fn = this.pyodide.globals.get('generate_question');
        const jsonStr = fn(gradeGroup, subject, gameMode);
        fn.destroy?.();
        return JSON.parse(jsonStr);
      } catch (err) {
        this.logs.push(`[PY ERROR] ${err.message}`);
      }
    }
    return this._fallbackGenerate(gradeGroup, subject, gameMode);
  }

  async evaluateAnswer(isCorrect, subject, responseTimeMs = 3000) {
    if (this.ready && this.pyodide) {
      try {
        const fn = this.pyodide.globals.get('evaluate_answer');
        const jsonStr = fn(isCorrect, subject, responseTimeMs);
        fn.destroy?.();
        return JSON.parse(jsonStr);
      } catch (err) {
        this.logs.push(`[PY ERROR] ${err.message}`);
      }
    }
    if (isCorrect) {
      this.fallbackStreak += 1;
      if (this.fallbackStreak >= 2 && this.fallbackDifficulty < 5) {
        this.fallbackDifficulty += 1;
        this.fallbackStreak = 0;
      }
    } else {
      this.fallbackStreak = 0;
      if (this.fallbackDifficulty > 1) this.fallbackDifficulty -= 1;
    }
    return {
      difficulty: this.fallbackDifficulty,
      streak: this.fallbackStreak,
      level_changed: false
    };
  }

  async getStats() {
    if (this.ready && this.pyodide) {
      try {
        const fn = this.pyodide.globals.get('get_engine_stats');
        const parsed = JSON.parse(fn());
        fn.destroy?.();
        return parsed;
      } catch {
        // fall through
      }
    }
    return {
      difficulty: this.fallbackDifficulty,
      streak: this.fallbackStreak,
      logs: this.logs
    };
  }

  _fallbackGenerate(gradeGroup, subject, gameMode) {
    if (gameMode === 'classify') {
      return {
        mode: 'classify',
        subject: 'Klasifikasi',
        grade: gradeGroup,
        difficulty: this.fallbackDifficulty,
        question: 'Pilah Bilangan Genap (Kiri) vs Bilangan Ganjil (Kanan)!',
        leftCategory: 'Bilangan Genap',
        rightCategory: 'Bilangan Ganjil',
        hint: 'Bilangan genap habis dibagi 2 (2, 4, 6, 8).',
        explanation: 'Hebat! Kamu berhasil memilah bilangan genap dan ganjil.',
        items: [
          { label: '2', emoji: '🔢', target: 'left' },
          { label: '6', emoji: '🔢', target: 'left' },
          { label: '3', emoji: '✨', target: 'right' },
          { label: '9', emoji: '✨', target: 'right' }
        ].sort(() => Math.random() - 0.5)
      };
    }

    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 7) + 1;
    const ans = gradeGroup === '1-2' ? a + b : a * b;
    const op = gradeGroup === '1-2' ? '+' : '×';
    const options = [
      { label: String(ans), emoji: '🔢', correct: true },
      { label: String(ans + 2), emoji: '✨', correct: false },
      { label: String(Math.max(1, ans - 1)), emoji: '⭐', correct: false },
      { label: String(ans + 4), emoji: '🌟', correct: false }
    ].sort(() => Math.random() - 0.5);

    return {
      mode: 'quiz',
      subject: 'Matematika',
      grade: gradeGroup,
      difficulty: this.fallbackDifficulty,
      question: `Berapakah hasil dari ${a} ${op} ${b} ?`,
      hint: op === '+' ? `Tambahkan ${a} dengan ${b}.` : `Kalikan ${a} sebanyak ${b} kali.`,
      explanation: `Benar! ${a} ${op} ${b} = ${ans}.`,
      options
    };
  }
}

export const pythonBridge = new PythonBridge();
