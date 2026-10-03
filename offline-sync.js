// offline-sync.js - Handles Offline Queueing & Voice Praise

// 1. Voice Praise Setup
const MY_VOICE_CLIPS = [
  './audio/praise1.mp3',
  './audio/praise2.mp3',
  './audio/praise3.mp3'
];

function playQuizPraise(studentName, isCorrect) {
  if (isCorrect && MY_VOICE_CLIPS.length > 0) {
    const randomClip = MY_VOICE_CLIPS[Math.floor(Math.random() * MY_VOICE_CLIPS.length)];
    const audio = new Audio(randomClip);
    
    audio.play().catch(() => {
      speakTextFallback(studentName, isCorrect);
    });
    return;
  }
  speakTextFallback(studentName, isCorrect);
}

function speakTextFallback(studentName, isCorrect) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const name = studentName || 'there';
  let message = isCorrect 
    ? `Great job, ${name}! That's completely correct.`
    : `Good try, ${name}. Take a moment to review the feedback.`;

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;

  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en'));
  if (englishVoice) utterance.voice = englishVoice;

  window.speechSynthesis.speak(utterance);
}


// 2. Offline Buffer & Auto-Sync
const GAS_ENDPOINT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

function submitQuizData(payload) {
  playQuizPraise(payload.studentName, payload.score >= 50);

  if (navigator.onLine) {
    sendToBackend(payload);
  } else {
    saveToOfflineQueue(payload);
    showNotification("You are offline! Your answers are saved and will sync automatically when connected.");
  }
}

function saveToOfflineQueue(payload) {
  let queue = JSON.parse(localStorage.getItem('pendingQuizSubmissions') || '[]');
  queue.push({
    data: payload,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('pendingQuizSubmissions', JSON.stringify(queue));
}

function sendToBackend(payload) {
  return fetch(GAS_ENDPOINT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(err => {
    saveToOfflineQueue(payload);
  });
}

function syncOfflineQueue() {
  const queue = JSON.parse(localStorage.getItem('pendingQuizSubmissions') || '[]');
  if (queue.length === 0) return;

  showNotification(`Back online! Syncing ${queue.length} saved quiz submission(s)...`);

  const syncPromises = queue.map(item => sendToBackend(item.data));

  Promise.all(syncPromises)
    .then(() => {
      localStorage.removeItem('pendingQuizSubmissions');
      showNotification("All offline progress synced successfully!");
    })
    .catch(err => console.error("Sync error:", err));
}

window.addEventListener('online', syncOfflineQueue);

function showNotification(msg) {
  console.log('[App Sync]', msg);
}
