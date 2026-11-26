/**
 * EduVision AR Pro - LocalStorage Persistence & Mini Report Card
 */

const STORAGE_KEY = 'eduvision_ar_pro_v2';

const DEFAULT_DATA = {
  totalScore: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  bestStreak: 0,
  subjects: {
    Matematika: { answered: 0, correct: 0 },
    IPA: { answered: 0, correct: 0 },
    'Bahasa Inggris': { answered: 0, correct: 0 },
    Klasifikasi: { answered: 0, correct: 0 }
  },
  settings: {
    magnetAssist: true,
    pinchThreshold: 0.065,
    showSkeleton: true,
    autoTTS: true
  }
};

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_DATA),
      ...parsed,
      subjects: { ...structuredClone(DEFAULT_DATA.subjects), ...(parsed.subjects || {}) },
      settings: { ...structuredClone(DEFAULT_DATA.settings), ...(parsed.settings || {}) }
    };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

export function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function recordResult(data, { subject, correct, points = 0, currentStreak = 0 }) {
  data.totalAnswered += 1;
  if (correct) {
    data.totalCorrect += 1;
    data.totalScore += points;
  }
  if (currentStreak > data.bestStreak) {
    data.bestStreak = currentStreak;
  }
  if (!data.subjects[subject]) {
    data.subjects[subject] = { answered: 0, correct: 0 };
  }
  data.subjects[subject].answered += 1;
  if (correct) data.subjects[subject].correct += 1;
  saveProgress(data);
  return data;
}

export function resetProgress() {
  const fresh = structuredClone(DEFAULT_DATA);
  saveProgress(fresh);
  return fresh;
}
