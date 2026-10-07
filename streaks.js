/**
 * Studyspace - Streaks & Gamification Module (streaks.js)
 * L. Hithadhoo School
 */

(function (window) {
  'use strict';

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
   */
  async function initStreakModule(config) {
    userConfig = config;
    
    // Load local cached streak data first for instant UI response
    loadLocalStreakCache();

    // Sync state with Google Apps Script backend
    await fetchStreakStatusFromBackend();

    // Render UI components
    renderInlineStreak();
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
   * Renders the streak inline to the LEFT of the student name: [Number][Icon]
   */
  function renderInlineStreak() {
    const inlineContainer = document.getElementById("inlineStreakTarget");
    if (!inlineContainer) return;

    const count = streakState.streak || 0;
    const status = streakState.streakStatus;

    let icon = "🔥";
    if (status === "LOST" || streakState.missedDays > 0) {
      icon = "💔";
    } else if (streakState.qotdCompletedToday) {
      icon = "✅";
    }

    inlineContainer.innerHTML = `<span class="mr-1.5 font-bold">${count}${icon}</span>`;
  }

  /**
   * Syncs streak values to main script DOM elements
   */
  function syncUIWithMainScript() {
    if (typeof window.updateMiniQuizBanner === "function") {
      window.updateMiniQuizBanner(streakState);
    }
  }

  /**
   * Records completed daily quiz activity and advances streak
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
    renderInlineStreak();
    syncUIWithMainScript();

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

  function getStreakState() {
    return { ...streakState };
  }

  window.initStreakModule = initStreakModule;
  window.recordStreakActivity = recordStreakActivity;
  window.getStreakState = getStreakState;

})(window);
