// offline-sync.js - Handles Offline Queueing & Text-to-Speech Praise

// 1. Voice Praise System (Text-to-Speech)
function playQuizPraise(textToRead) {
  if (!('speechSynthesis' in window)) return;
  
  // Stop any active speech before starting a new one
  window.speechSynthesis.cancel();

  // If no specific text is passed, fallback to default
  const message = textToRead || "Well done!";

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.95;  // Speaking rate
  utterance.pitch = 1.05; // Pitch

  // Use natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en'));
  if (englishVoice) utterance.voice = englishVoice;

  window.speechSynthesis.speak(utterance);
}


// 2. Offline Buffer & Auto-Sync
const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxp8krlvEmXQGeNp96G2ybXV9KjecxpCu61LuT34lMil2z4fklRAB9ge_K23FcOh1qFbg/exec';

function submitQuizData(payload, praiseText) {
  // Read the exact praise text from your HTML/Quiz UI
  playQuizPraise(praiseText);

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
