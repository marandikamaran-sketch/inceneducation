/**
 * EduVision AR Pro - Main Application Orchestrator
 */

import { loadProgress, saveProgress, recordResult, resetProgress } from './storage.js';
import { audioEngine } from './audio-engine.js';
import { pythonBridge } from './python-bridge.js';
import { CameraHandsController } from './camera-hands.js';
import { SpatialCanvasEngine } from './canvas-engine.js';

const state = {
  grade: '1-2',
  subject: 'campuran',
  mode: 'single',
  world: 'space',
  score: 0,
  p1Score: 0,
  p2Score: 0,
  streak: 0,
  currentQuestion: null,
  questionStartedAt: Date.now(),
  progress: loadProgress()
};

// DOM References
const el = {
  video: document.getElementById('webcam'),
  canvas: document.getElementById('ar-canvas'),
  selectGrade: document.getElementById('select-grade'),
  selectSubject: document.getElementById('select-subject'),
  selectMode: document.getElementById('select-mode'),
  selectWorld: document.getElementById('select-world'),
  metaSubject: document.getElementById('meta-subject'),
  metaLevel: document.getElementById('meta-level'),
  metaInstruction: document.getElementById('meta-instruction'),
  questionText: document.getElementById('question-text'),
  feedbackBanner: document.getElementById('feedback-banner'),
  feedbackText: document.getElementById('feedback-text'),
  scoreSingle: document.getElementById('score-single'),
  scoreSplit: document.getElementById('score-split'),
  valScore: document.getElementById('val-score'),
  valP1: document.getElementById('val-p1'),
  valP2: document.getElementById('val-p2'),
  valStreak: document.getElementById('val-streak'),
  camLabel: document.getElementById('cam-label'),
  pySpinner: document.getElementById('py-spinner'),
  pyLabel: document.getElementById('py-label'),
  startOverlay: document.getElementById('start-overlay'),
  btnStartAR: document.getElementById('btn-start-ar'),
  btnStartVirtual: document.getElementById('btn-start-virtual'),
  btnSpeak: document.getElementById('btn-speak'),
  btnHint: document.getElementById('btn-hint'),
  btnNext: document.getElementById('btn-next'),
  btnCloseFeedback: document.getElementById('btn-close-feedback'),
  btnSettings: document.getElementById('btn-settings'),
  btnReport: document.getElementById('btn-report'),
  btnPython: document.getElementById('btn-python'),
  btnResetReport: document.getElementById('btn-reset-report'),
  toggleMagnet: document.getElementById('toggle-magnet'),
  sliderPinch: document.getElementById('slider-pinch'),
  valPinch: document.getElementById('val-pinch'),
  toggleSkeleton: document.getElementById('toggle-skeleton'),
  toggleTTS: document.getElementById('toggle-tts'),
  reportContent: document.getElementById('report-content'),
  pyModalStatus: document.getElementById('py-modal-status'),
  pyLogViewer: document.getElementById('py-log-viewer'),
  pyCodeViewer: document.getElementById('py-code-viewer')
};

const handsCtrl = new CameraHandsController(el.video, el.canvas, {
  pinchThreshold: state.progress.settings.pinchThreshold,
  onStatusChange: (active, label) => {
    el.camLabel.textContent = label;
    if (!active && state.world === 'ar') {
      state.world = 'space';
      el.selectWorld.value = 'space';
      canvasEngine.setWorld('space');
    }
  }
});

const canvasEngine = new SpatialCanvasEngine(el.canvas, {
  onPinchGrab: () => audioEngine.playPinch(),
  onDropInPortal: (bubble, portal) => handlePortalDrop(bubble, portal)
});

function showFeedback(text, type = 'success') {
  el.feedbackText.textContent = text;
  el.feedbackBanner.className = `feedback-banner vision-glass show ${type}`;
}

function hideFeedback() {
  el.feedbackBanner.classList.remove('show');
}

function updateScoreUI() {
  el.valScore.textContent = String(state.score);
  el.valP1.textContent = String(state.p1Score);
  el.valP2.textContent = String(state.p2Score);
  el.valStreak.textContent = String(state.streak);
  el.scoreSingle.style.display = state.mode === 'split' ? 'none' : 'inline-flex';
  el.scoreSplit.style.display = state.mode === 'split' ? 'inline-flex' : 'none';
}

async function loadNextQuestion() {
  hideFeedback();
  const q = await pythonBridge.generateQuestion(state.grade, state.subject, state.mode);
  state.currentQuestion = q;
  state.questionStartedAt = Date.now();

  el.metaSubject.textContent = q.subject || 'Belajar';
  el.metaLevel.textContent = `Level ${q.difficulty || 1}`;
  el.metaInstruction.textContent =
    state.mode === 'classify'
      ? '🗂️ Pilah objek ke Portal Kiri atau Kanan'
      : state.mode === 'split'
      ? '⚡ P1 (Kiri) vs P2 (Kanan): Cepat masukkan jawaban!'
      : '🤏 Cubit / Seret objek ke Portal Jawaban';
  el.questionText.textContent = q.question;

  canvasEngine.setMode(state.mode, q.mode === 'classify' ? { left: q.leftCategory, right: q.rightCategory } : null);
  canvasEngine.spawnQuestionObjects(q);

  if (state.progress.settings.autoTTS) {
    audioEngine.speak(q.question);
  }
}

async function handlePortalDrop(bubble, portal) {
  const q = state.currentQuestion;
  if (!q) return;

  const elapsed = Date.now() - state.questionStartedAt;

  // Mode Klasifikasi
  if (q.mode === 'classify') {
    const isCorrect = bubble.target === portal.id;
    if (isCorrect) {
      audioEngine.playSuccess();
      canvasEngine.burstParticles(portal.x, portal.y, '#34d399', 24);
      canvasEngine.removeBubble(bubble.id);
      state.score += 10;
      state.streak += 1;
      recordResult(state.progress, { subject: 'Klasifikasi', correct: true, points: 10, currentStreak: state.streak });
      updateScoreUI();

      if (canvasEngine.bubbles.length === 0) {
        await pythonBridge.evaluateAnswer(true, 'Klasifikasi', elapsed);
        showFeedback(`🎉 ${q.explanation}`, 'success');
        setTimeout(() => loadNextQuestion(), 1800);
      } else {
        showFeedback(`✅ Benar! "${bubble.label}" masuk ke ${portal.label}. Lanjutkan sisa objek!`, 'success');
      }
    } else {
      audioEngine.playError();
      canvasEngine.burstParticles(portal.x, portal.y, '#fb7185', 14);
      state.streak = 0;
      recordResult(state.progress, { subject: 'Klasifikasi', correct: false, currentStreak: 0 });
      updateScoreUI();
      showFeedback(`❌ Belum tepat! Coba cek lagi apakah "${bubble.label}" cocok di ${portal.label}. Petunjuk: ${q.hint}`, 'error');
      bubble.y = Math.max(230, bubble.y - 140);
    }
    return;
  }

  // Mode Single & Split-Screen Quiz
  const isCorrect = Boolean(bubble.correct);
  if (isCorrect) {
    audioEngine.playSuccess();
    canvasEngine.burstParticles(portal.x, portal.y, '#34d399', 32);
    canvasEngine.removeBubble(bubble.id);

    const pts = 10 + (q.difficulty || 1) * 5;
    state.score += pts;
    state.streak += 1;
    if (state.mode === 'split') {
      if (portal.id === 'p1') state.p1Score += pts;
      else state.p2Score += pts;
    }

    const evalRes = await pythonBridge.evaluateAnswer(true, q.subject, elapsed);
    recordResult(state.progress, { subject: q.subject, correct: true, points: pts, currentStreak: state.streak });
    updateScoreUI();

    const levelNotice = evalRes.direction === 'up' ? ' 🚀 Level naik!' : '';
    showFeedback(`🎉 ${q.explanation}${levelNotice}`, 'success');
    setTimeout(() => loadNextQuestion(), 1900);
  } else {
    audioEngine.playError();
    canvasEngine.burstParticles(portal.x, portal.y, '#fb7185', 16);
    state.streak = 0;
    await pythonBridge.evaluateAnswer(false, q.subject, elapsed);
    recordResult(state.progress, { subject: q.subject, correct: false, currentStreak: 0 });
    updateScoreUI();
    showFeedback(`💡 Hampir benar! Petunjuk: ${q.hint}`, 'error');
    bubble.y = Math.max(230, bubble.y - 130);
  }
}

function renderReportModal() {
  const p = state.progress;
  const acc = p.totalAnswered ? Math.round((p.totalCorrect / p.totalAnswered) * 100) : 0;
  let subjectRows = '';
  for (const [sub, st] of Object.entries(p.subjects)) {
    const sAcc = st.answered ? Math.round((st.correct / st.answered) * 100) : 0;
    subjectRows += `
      <div class="setting-row">
        <div><strong>${sub}</strong><div class="setting-desc">${st.correct} benar dari ${st.answered} soal</div></div>
        <span class="meta-chip">${sAcc}%</span>
      </div>`;
  }

  el.reportContent.innerHTML = `
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-value">${p.totalScore}</div><div class="stat-label">Total Skor</div></div>
      <div class="stat-box"><div class="stat-value">${acc}%</div><div class="stat-label">Akurasi</div></div>
      <div class="stat-box"><div class="stat-value">${p.bestStreak}</div><div class="stat-label">Streak Terbaik</div></div>
      <div class="stat-box"><div class="stat-value">${p.totalAnswered}</div><div class="stat-label">Soal Dijawab</div></div>
    </div>
    ${subjectRows}
  `;
}

async function renderPythonModal() {
  const stats = await pythonBridge.getStats();
  el.pyModalStatus.textContent = pythonBridge.ready
    ? 'Pyodide Python 3 WebAssembly (Aktif)'
    : 'Mode Cepat JS (Pyodide sedang memuat / offline)';
  el.pyLogViewer.textContent = (stats.logs || []).join('\n') || 'Belum ada log.';
  el.pyCodeViewer.textContent = pythonBridge.sourceCode || 'Kode sumber python/adaptive_engine.py belum dimuat.';
}

function bindUI() {
  // Apply saved settings
  el.toggleMagnet.checked = state.progress.settings.magnetAssist;
  el.sliderPinch.value = state.progress.settings.pinchThreshold;
  el.valPinch.textContent = String(state.progress.settings.pinchThreshold);
  el.toggleSkeleton.checked = state.progress.settings.showSkeleton;
  el.toggleTTS.checked = state.progress.settings.autoTTS;
  canvasEngine.magnetAssist = state.progress.settings.magnetAssist;
  canvasEngine.showSkeleton = state.progress.settings.showSkeleton;

  el.btnStartAR.addEventListener('click', async () => {
    el.startOverlay.classList.add('hidden');
    const ok = await handsCtrl.startCamera();
    state.world = ok ? 'ar' : 'space';
    el.selectWorld.value = state.world;
    canvasEngine.setWorld(state.world);
    loadNextQuestion();
  });

  el.btnStartVirtual.addEventListener('click', () => {
    el.startOverlay.classList.add('hidden');
    state.world = 'space';
    el.selectWorld.value = 'space';
    canvasEngine.setWorld('space');
    loadNextQuestion();
  });

  el.selectGrade.addEventListener('change', (e) => {
    state.grade = e.target.value;
    loadNextQuestion();
  });

  el.selectSubject.addEventListener('change', (e) => {
    state.subject = e.target.value;
    loadNextQuestion();
  });

  el.selectMode.addEventListener('change', (e) => {
    state.mode = e.target.value;
    updateScoreUI();
    loadNextQuestion();
  });

  el.selectWorld.addEventListener('change', async (e) => {
    state.world = e.target.value;
    if (state.world === 'ar') {
      const ok = await handsCtrl.startCamera();
      if (!ok) {
        state.world = 'space';
        el.selectWorld.value = 'space';
      }
    } else {
      handsCtrl.stopCamera();
    }
    canvasEngine.setWorld(state.world);
  });

  el.btnSpeak.addEventListener('click', () => {
    if (state.currentQuestion) audioEngine.speak(state.currentQuestion.question);
  });

  el.btnHint.addEventListener('click', () => {
    if (state.currentQuestion) {
      showFeedback(`💡 Petunjuk: ${state.currentQuestion.hint}`, 'hint');
      audioEngine.speak(state.currentQuestion.hint);
    }
  });

  el.btnNext.addEventListener('click', () => loadNextQuestion());
  el.btnCloseFeedback.addEventListener('click', hideFeedback);

  // Modals
  const openModal = (id) => document.getElementById(id)?.classList.add('open');
  const closeModal = (id) => document.getElementById(id)?.classList.remove('open');

  el.btnSettings.addEventListener('click', () => openModal('modal-settings'));
  el.btnReport.addEventListener('click', () => {
    renderReportModal();
    openModal('modal-report');
  });
  el.btnPython.addEventListener('click', async () => {
    await renderPythonModal();
    openModal('modal-python');
  });

  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  el.toggleMagnet.addEventListener('change', (e) => {
    canvasEngine.magnetAssist = e.target.checked;
    state.progress.settings.magnetAssist = e.target.checked;
    saveProgress(state.progress);
  });

  el.sliderPinch.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    el.valPinch.textContent = String(val);
    handsCtrl.setPinchThreshold(val);
    state.progress.settings.pinchThreshold = val;
    saveProgress(state.progress);
  });

  el.toggleSkeleton.addEventListener('change', (e) => {
    canvasEngine.showSkeleton = e.target.checked;
    state.progress.settings.showSkeleton = e.target.checked;
    saveProgress(state.progress);
  });

  el.toggleTTS.addEventListener('change', (e) => {
    state.progress.settings.autoTTS = e.target.checked;
    saveProgress(state.progress);
  });

  el.btnResetReport.addEventListener('click', () => {
    state.progress = resetProgress();
    state.score = 0;
    state.p1Score = 0;
    state.p2Score = 0;
    state.streak = 0;
    updateScoreUI();
    renderReportModal();
  });
}

function animate() {
  const cursors = handsCtrl.getActiveCursors();
  canvasEngine.update(cursors);
  canvasEngine.render(cursors, handsCtrl.cameraActive);
  requestAnimationFrame(animate);
}

// Bootstrap
bindUI();
updateScoreUI();
animate();

pythonBridge.init((status, text) => {
  el.pyLabel.textContent = text;
  if (status === 'ready' || status === 'fallback') {
    el.pySpinner.style.display = 'none';
  }
});
