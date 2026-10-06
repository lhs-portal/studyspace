/**
 * Studyspace - Streaks, QOTD & Recovery UI Module
 * GitHub Static PWA Frontend Integration
 */

// Replace this with your published Google Apps Script Web App Executable URL
const STUDYSPACE_API_URL = "YOUR_GAS_WEB_APP_URL_HERE";

/**
 * Injects Streak Module CSS dynamically
 */
function injectStreakStyles() {
  if (document.getElementById("streakModuleStyles")) return;
  const style = document.createElement("style");
  style.id = "streakModuleStyles";
  style.innerHTML = `
    .streak-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      user-select: none;
    }
    .streak-badge:hover { transform: scale(1.05); }
    .streak-active { background: #FFF3E0; color: #E65100; border: 1px solid #FFE0B2; }
    .streak-pending { background: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; animation: pulse 2s infinite; }
    .streak-lost { background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(46, 125, 50, 0); }
      100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
    }

    .studyspace-modal-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }
    .studyspace-modal-card {
      background: #ffffff;
      padding: 24px;
      border-radius: 16px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      color: #1a1a1a;
    }
    .qotd-opt-btn {
      display: block; width: 100%; margin: 8px 0; padding: 12px;
      text-align: left; border: 1px solid #e2e8f0; border-radius: 8px;
      background: #f8fafc; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .qotd-opt-btn:hover { background: #e2e8f0; }
  `;
  document.head.appendChild(style);
}

/**
 * Call this function upon student login or dashboard load
 */
function initStreakModule(userAuth) {
  injectStreakStyles();

  if (!userAuth || !userAuth.email) return;

  localStorage.setItem("userEmail", userAuth.email);
  localStorage.setItem("gradeStream", userAuth.gradeStream || "9B");
  localStorage.setItem("allowedSubjects", JSON.stringify(userAuth.allowedSubjects || []));

  renderStreakBadge(userAuth.streak || 0, userAuth.streakStatus, userAuth.missedDays || 0);

  // Automatically launch recovery quest if streak was missed
  if (userAuth.streakStatus === "STREAK_LOST") {
    openRecoveryModal(userAuth.missedDays || 1);
  }
}

/**
 * Renders the 🔥 Badge in the header container
 */
function renderStreakBadge(streak, status, missedDays) {
  const container = document.getElementById("streakBadgeContainer");
  if (!container) return;

  let badgeHTML = "";
  if (status === "STREAK_LOST") {
    badgeHTML = `
      <div class="streak-badge streak-lost" onclick="openRecoveryModal(${missedDays})">
        💔 ${streak} Day Streak Locked! (Click to Recover)
      </div>`;
  } else if (status === "COMPLETED_TODAY") {
    badgeHTML = `
      <div class="streak-badge streak-active">
        🔥 ${streak} Days
      </div>`;
  } else {
    badgeHTML = `
      <div class="streak-badge streak-pending" onclick="openQOTDModal()">
        ⚡ ${streak} Days (Complete QOTD)
      </div>`;
  }

  container.innerHTML = badgeHTML;
}

/**
 * Fetches Question of the Day via REST API
 */
async function openQOTDModal() {
  const gradeStream = localStorage.getItem("gradeStream") || "9B";
  const subject = localStorage.getItem("activeSubject") || "business";

  try {
    const response = await fetch(`${STUDYSPACE_API_URL}?action=getQOTD&grade=${gradeStream}&subject=${subject}`);
    const questionData = await response.json();

    if (!questionData || questionData.error) {
      alert("No question available for today!");
      return;
    }

    renderQOTDModal(questionData);
  } catch (err) {
    console.error("Error fetching QOTD:", err);
    alert("Could not load today's question. Please check your internet connection.");
  }
}

function renderQOTDModal(q) {
  let modal = document.getElementById("qotdModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "qotdModal";
    modal.className = "studyspace-modal-overlay";
    document.body.appendChild(modal);
  }

  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="studyspace-modal-card">
      <h3 style="margin-top:0;">🔥 Question of the Day</h3>
      <p style="font-size: 16px; line-height: 1.5;">${q.question || q.prompt}</p>
      <div style="margin-top: 16px;">
        ${(q.options || []).map(opt => `
          <button class="qotd-opt-btn" onclick="submitQOTD('${opt.id}', '${q.correctOption}')">
            <strong>${opt.id.toUpperCase()})</strong>${opt.text}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

async function submitQOTD(selectedOption, correctOption) {
  const email = localStorage.getItem("userEmail");
  const modal = document.getElementById("qotdModal");

  if (selectedOption === correctOption) {
    try {
      await fetch(STUDYSPACE_API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "submitResult",
          isQOTD: true,
          email: email
        })
      });

      alert("🎉 Correct! Streak maintained for today.");
      if (modal) modal.style.display = "none";
      location.reload();
    } catch (err) {
      alert("🎉 Correct answer!");
      if (modal) modal.style.display = "none";
    }
  } else {
    alert("❌ Not quite right. Review the topic and try again to extend your streak!");
  }
}

/**
 * Non-Punitive Recovery Quest Modal
 */
function openRecoveryModal(missedDays) {
  let modal = document.getElementById("recoveryModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "recoveryModal";
    modal.className = "studyspace-modal-overlay";
    document.body.appendChild(modal);
  }

  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="studyspace-modal-card" style="text-align: center;">
      <h2 style="margin-top:0;">🛡️ Streak Recovery Quest</h2>
      <p>You missed <strong>${missedDays} day(s)</strong>, but your streak isn't lost!</p>
      <p style="color: #4b5563;">Score <strong>50% or higher</strong> on this quick review quiz to buy back your streak.</p>
      <button onclick="startRecoveryQuiz(${missedDays})" 
              style="background:#2E7D32; color:white; padding:12px 24px; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:12px; width: 100%;">
        Start Recovery Quest
      </button>
    </div>
  `;
}

async function startRecoveryQuiz(missedDays) {
  const subject = localStorage.getItem("activeSubject") || "business";
  try {
    const res = await fetch(`${STUDYSPACE_API_URL}?action=getRecoveryQuiz&missedDays=${missedDays}&subject=${subject}`);
    const questions = await res.json();
    
    // Wire questions directly to your existing PWA quiz engine
    alert(`Loaded ${questions.length} recovery questions! Complete the quiz to restore your streak.`);
  } catch (err) {
    console.error("Failed to load recovery quiz:", err);
  }
}

async function completeRecoveryQuest(scorePercentage) {
  const email = localStorage.getItem("userEmail");

  try {
    const res = await fetch(STUDYSPACE_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "submitRecoveryResult",
        email: email,
        scorePercentage: scorePercentage
      })
    });

    const result = await res.json();
    if (result.restored) {
      alert(`🎉 ${result.message}`);
      location.reload();
    } else {
      alert("Score was under 50%. Review the material and try again!");
    }
  } catch (err) {
    console.error("Error submitting recovery:", err);
  }
}
