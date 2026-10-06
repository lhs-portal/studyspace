/**
 * Studyspace - Streaks & Gamification Module (streaks.js)
 * L. Hithadhoo School
 */

(function (window) {
  'use me strict';

  // Private module state
  let userConfig = null;
  let streakState = {
    streak: 0,
    streakStatus: "ACTIVE", // "ACTIVE", "LOST", "RECOVERED", "FREEZE"
    missedDays: 0,
    qotdCompletedToday: false,
    lastActiveDate: null,
    highestStreak: 0
  };

  const API_URL = "https://script.google.com/macros/s/AKfycbxp8krlvEmXQGeNp96G2ybXV9KjecxpCu61LuT34lMil2z4fklRAB9ge_K23FcOh1qFbg/exec";

  /**
   * Initializes the streak module for the active student session
   * @param {Object} config User credentials and metadata
   */
  async function initStreakModule(config) {
    userConfig = config;
    
    // Load local cached streak data first for instant UI response
    loadLocalStreakCache();

    // Sync state with Google Apps Script backend
    await fetchStreakStatusFromBackend();

    // Render UI components
    renderStreakBadgeContainer();
    syncUIWithMainScript();
  }

  /**
   * Reads cached streak state from localStorage
   */
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

  /**
   * Saves current streak state to localStorage
   */
  function saveLocalStreakCache() {
    if (!userConfig || !userConfig.email) return;
    const cacheKey = `lhs_streak_${userConfig.email}`;
    localStorage.setItem(cacheKey, JSON.stringify(streakState));
  }

  /**
   * Fetches real-time streak details from the backend
   */
  async function fetchStreakStatusFromBackend() {
    if (!userConfig || !userConfig.email) return;

    try {
      const response = await fetch(`${API_URL}?action=getStreakData&email=${encodeURIComponent(userConfig.email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          streakState = {
            streak: data.streak ?? streakState.streak,
            streakStatus: data.streakStatus || streakState.streakStatus,
            missedDays: data.missedDays ?? streakState.missedDays,
            qotdCompletedToday: data.qotdCompletedToday ?? streakState.qotdCompletedToday,
            lastActiveDate: data.lastActiveDate || streakState.lastActiveDate,
            highestStreak: data.highestStreak || Math.max(data.streak || 0, streakState.highestStreak)
          };
          saveLocalStreakCache();
        }
      }
    } catch (err) {
      console.warn("Could not sync streaks with server, operating in offline/cached mode.", err);
    }
  }

  /**
   * Renders dynamic streak badges in `#streakBadgeContainer`
   */
  function renderStreakBadgeContainer() {
    const container = document.getElementById("streakBadgeContainer");
    if (!container) return;

    const count = streakState.streak || 0;
    const status = streakState.streakStatus;
    const isCompleted = streakState.qotdCompletedToday;

    let badgeColorClass = "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400";
    let icon = "🔥";
    let tooltip = `${count} Day Streak!`;

    if (status === "LOST" || streakState.missedDays > 0) {
      badgeColorClass = "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400";
      icon = "💔";
      tooltip = "Streak broken! Take today's quiz to recover!";
    } else if (isCompleted) {
      badgeColorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400";
      icon = "✅";
      tooltip = "Today's streak activity completed!";
    }

    container.innerHTML = `
      <div title="${tooltip}" class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-extrabold transition-all ${badgeColorClass}">
        <span class="text-sm">${icon}</span>
        <span>${count} ${count === 1 ? 'Day' : 'Days'}</span>
      </div>
    `;
  }

  /**
   * Syncs streak values to main script DOM elements (`#streakDayCount`, etc.)
   */
  function syncUIWithMainScript() {
    const streakDayCountEl = document.getElementById("streakDayCount");
    if (streakDayCountEl) {
      streakDayCountEl.innerText = streakState.streak || 0;
    }

    // Call update functions in main window if declared
    if (typeof window.updateMiniQuizBanner === "function") {
      window.updateMiniQuizBanner(streakState);
    }
  }

  /**
   * Records completed daily quiz activity and advances streak
   * @param {Object} payload Quiz attempt details
   */
  async function recordStreakActivity(payload = {}) {
    streakState.qotdCompletedToday = true;

    if (streakState.streakStatus === "LOST") {
      streakState.streakStatus = "ACTIVE";
      streakState.missedDays = 0;
    } else {
      streakState.streak += 1;
    }

    if (streakState.streak > streakState.highestStreak) {
      streakState.highestStreak = streakState.streak;
    }

    saveLocalStreakCache();
    renderStreakBadgeContainer();
    syncUIWithMainScript();

    // Post update to backend
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "recordStreakActivity",
          email: userConfig.email,
          quizId: payload.quizId || "MINI_QUIZ",
          score: payload.score || 100,
          date: new Date().toISOString().split('T')[0]
        })
      });
    } catch (e) {
      console.warn("Failed to push streak update to server.", e);
    }
  }

  /**
   * Getter for current streak state
   */
  function getStreakState() {
    return { ...streakState };
  }

  // Expose module methods globally
  window.initStreakModule = initStreakModule;
  window.recordStreakActivity = recordStreakActivity;
  window.getStreakState = getStreakState;

})(window);
