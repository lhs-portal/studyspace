/**
 * Studyspace - Streaks & Gamification Module (streaks.js)
 * L. Hithadhoo School
 */

(function (window) {
  'use strict';

  let userConfig = null;
  let streakState = {
    streak: 0,
    streakStatus: "PENDING_TODAY", // "COMPLETED_TODAY", "PENDING_TODAY", "STREAK_LOST", "NEVER_PLAYED"
    missedDays: 0,
    qotdCompletedToday: false,
    lastActiveDate: null,
    highestStreak: 0
  };

  const API_URL = "https://script.google.com/macros/s/AKfycbxp8krlvEmXQGeNp96G2ybXV9KjecxpCu61LuT34lMil2z4fklRAB9ge_K23FcOh1qFbg/exec";

  /**
   * Initializes the streak module for the active session
   */
  async function initStreakModule(config) {
    userConfig = config;

    // Reset local state to ensure fresh sync from Google atomic server clock
    streakState.qotdCompletedToday = false;

    // Fetch real-time status directly from backend
    await fetchStreakStatusFromBackend();

    // Render UI components
    renderInlineStreak();
    updateMiniQuizBanner(streakState);
  }

  /**
   * Fetches real-time streak details directly from the Apps Script atomic clock backend
   */
  async function fetchStreakStatusFromBackend() {
    if (!userConfig || !userConfig.email) return;

    try {
      const response = await fetch(`${API_URL}?action=getStreakStatus&email=${encodeURIComponent(userConfig.email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          const isCompleted = (data.status === "COMPLETED_TODAY");
          const isLost = (data.status === "STREAK_LOST");

          streakState = {
            streak: Number(data.streak) || 0,
            streakStatus: data.status || "PENDING_TODAY",
            missedDays: Number(data.missedDays) || 0,
            qotdCompletedToday: isCompleted,
            lastActiveDate: data.lastActiveDate || null,
            highestStreak: Math.max(Number(data.streak) || 0, streakState.highestStreak)
          };

          // Save fresh state to cache
          saveLocalStreakCache();
        }
      }
    } catch (err) {
      console.warn("Could not sync streaks with server, using fallback mode.", err);
      loadLocalStreakCache();
    }
  }

  function loadLocalStreakCache() {
    if (!userConfig || !userConfig.email) return;
    const cacheKey = `lhs_streak_${userConfig.email}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        streakState = { ...streakState, ...parsed };
      } catch (e) {
        console.warn("Error parsing cached streak data", e);
      }
    }
  }

  function saveLocalStreakCache() {
    if (!userConfig || !userConfig.email) return;
    const cacheKey = `lhs_streak_${userConfig.email}`;
    localStorage.setItem(cacheKey, JSON.stringify(streakState));
  }

  /**
   * Renders the streak inline to the LEFT of the user name: [Number][Icon]
   */
  function renderInlineStreak() {
    const inlineContainer = document.getElementById("inlineStreakTarget");
    if (!inlineContainer) return;

    const count = streakState.streak || 0;
    const isLost = streakState.streakStatus === "STREAK_LOST" || streakState.missedDays > 0;
    const icon = isLost ? "💔" : "🔥";

    inlineContainer.innerHTML = `<span class="mr-1.5 font-bold">${count}${icon}</span>`;
  }

  /**
   * Updates the UI Banner for Today's Mini Quiz based on real backend state
   */
  function updateMiniQuizBanner(stateData) {
    const banner = document.getElementById("miniQuizBanner");
    if (!banner) return;

    banner.style.display = "flex";

    const currentData = stateData || streakState;
    const titleEl = document.getElementById("miniQuizTitle");
    const descEl = document.getElementById("miniQuizDesc");
    const quizBtn = document.getElementById("btnTakeMiniQuiz");
    const iconEl = document.getElementById("miniQuizIcon");

    if (!titleEl || !descEl || !quizBtn || !iconEl) return;

    const isLost = currentData.streakStatus === 'STREAK_LOST' || currentData.missedDays > 0;
    const isCompletedToday = currentData.qotdCompletedToday === true || currentData.streakStatus === "COMPLETED_TODAY";

    if (isLost) {
      banner.className = "p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 bg-rose-500/10 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40";
      titleEl.innerText = "Get your streak back!";
      titleEl.className = "text-sm font-bold text-rose-700 dark:text-rose-400";
      descEl.innerText = "Complete today's quick review quiz to restore your flame!";
      iconEl.innerText = "💔";
      iconEl.className = "w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400";

      quizBtn.innerText = "Take Quiz →";
      quizBtn.disabled = false;
      quizBtn.className = "w-full sm:w-auto px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer";
      quizBtn.onclick = () => startBusinessMiniQuiz(true);
    } else if (isCompletedToday) {
      banner.className = "p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30";
      titleEl.innerText = "Today's Mini Quiz Completed!";
      titleEl.className = "text-sm font-bold text-emerald-700 dark:text-emerald-400";
      descEl.innerText = "Great job! Your streak is secured for today.";
      iconEl.innerText = "✅";
      iconEl.className = "w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400";

      quizBtn.innerText = "Completed ✅";
      quizBtn.disabled = true;
      quizBtn.className = "w-full sm:w-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium text-xs rounded-xl cursor-not-allowed";
    } else {
      banner.className = "p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700";
      titleEl.innerText = "Today's Mini Quiz";
      titleEl.className = "text-sm font-bold text-slate-900 dark:text-white";
      descEl.innerText = "Daily Challenge — keep your streak alive!";
      iconEl.innerText = "🔥";
      iconEl.className = "w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400";

      quizBtn.innerText = "Take Quiz →";
      quizBtn.disabled = false;
      quizBtn.className = "w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer";
      quizBtn.onclick = () => startBusinessMiniQuiz(false);
    }
  }

  async function startBusinessMiniQuiz(isRecovery = false) {
    const btn = document.getElementById("btnTakeMiniQuiz");
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Loading Quiz...";
    }

    try {
      const email = userConfig ? userConfig.email : "";
      const res = await fetch(`${API_URL}?action=getDailyMiniQuiz&email=${encodeURIComponent(email)}&isRecovery=${isRecovery}`);
      const data = await res.json();

      if (data && data.questions && data.questions.length > 0) {
        if (typeof window.launchMiniQuizModal === "function") {
          window.launchMiniQuizModal(data);
        } else {
          alert("Quiz modal launcher is missing.");
        }
      } else {
        alert(data.error || "Mini quiz is currently unavailable.");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching daily mini quiz.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Take Quiz →";
      }
    }
  }

  /**
   * Called when a quiz is submitted to trigger backend streak update and re-sync
   */
  async function recordStreakActivity(payload = {}) {
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "submitResult",
          email: userConfig ? userConfig.email : "",
          quizId: payload.quizId || "BUS_MINI_QOTD",
          score: payload.score || 100,
          isQOTD: true,
          type: "qotd"
        })
      });

      // Refresh status directly from server to get true server-calculated streak
      await fetchStreakStatusFromBackend();
      renderInlineStreak();
      updateMiniQuizBanner(streakState);

    } catch (e) {
      console.warn("Failed to push streak update to server.", e);
    }
  }

  function getStreakState() {
    return { ...streakState };
  }

  window.initStreakModule = initStreakModule;
  window.updateMiniQuizBanner = updateMiniQuizBanner;
  window.startBusinessMiniQuiz = startBusinessMiniQuiz;
  window.recordStreakActivity = recordStreakActivity;
  window.getStreakState = getStreakState;

})(window);
