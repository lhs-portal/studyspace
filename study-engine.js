// study-engine.js - LHS StudySpace Engine
let globalNotesIndex = [];
let currentSubject = "";

// 1. Fetch index map from GitHub
async function initStudyEngine() {
  try {
    const res = await fetch('notes/notes-index.json');
    globalNotesIndex = await res.json();
    console.log(`Study Engine loaded: ${globalNotesIndex.length} subtopics mapped.`);
  } catch (err) {
    console.error('Failed to load notes index:', err);
  }
}

// 2. Initialize Study Hub UI View
function loadStudyHub(containerId = 'studyHubContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!globalNotesIndex.length) {
    container.innerHTML = `<p>No study notes available yet. Run the Apps Script sync!</p>`;
    return;
  }

  // Get list of unique subjects dynamically
  const subjects = [...new Set(globalNotesIndex.map(n => n.subject))];

  let html = `
    <div class="study-hub-layout">
      <!-- Subject Tabs -->
      <div class="subject-tabs">
        ${subjects.map((sub, idx) => `
          <button class="tab-btn ${idx === 0 ? 'active' : ''}" onclick="selectSubject('${sub}')">${sub}</button>
        `).join('')}
      </div>

      <!-- Subject-Level Search Bar -->
      <div class="subject-search-bar">
        <input type="text" id="subjectSearchInput" placeholder="Search keywords in this subject..." oninput="handleSubjectSearch()">
      </div>

      <div class="hub-content-split">
        <!-- Syllabus Sidebar -->
        <div id="syllabusView" class="syllabus-sidebar"></div>
        
        <!-- Live Note Reading Panel -->
        <div id="noteReaderArea" class="note-reader-panel">
          <div class="placeholder-msg">Select a subtopic on the left to read notes.</div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  if (subjects.length > 0) selectSubject(subjects[0]);
}

// 3. Select Subject & Display its Syllabus Tree
function selectSubject(subjectName) {
  currentSubject = subjectName;
  
  // Highlight active tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText === subjectName);
  });

  const searchInput = document.getElementById('subjectSearchInput');
  if (searchInput) searchInput.value = "";

  renderSyllabusTree(globalNotesIndex.filter(n => n.subject === subjectName));
}

// 4. Render Syllabus Tree (Grouped by Unit)
function renderSyllabusTree(notesList) {
  const view = document.getElementById('syllabusView');
  if (!view) return;

  if (!notesList.length) {
    view.innerHTML = `<p class="no-results">No matching subtopics found.</p>`;
    return;
  }

  // Group subtopics under unit headers
  const units = {};
  notesList.forEach(item => {
    if (!units[item.unit]) units[item.unit] = [];
    units[item.unit].push(item);
  });

  let html = `<div class="syllabus-tree">`;
  for (const [unitName, subtopics] of Object.entries(units)) {
    html += `
      <div class="unit-group">
        <h4 class="unit-title">${unitName}</h4>
        <div class="subtopic-list">
          ${subtopics.map(st => `
            <button class="subtopic-card" onclick="loadNoteContent('${st.filePath}')">
              ${st.title}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
  html += `</div>`;
  view.innerHTML = html;
}

// 5. Subject Keyword Search Engine
function handleSubjectSearch() {
  const query = document.getElementById('subjectSearchInput').value.toLowerCase().trim();
  
  if (!query) {
    renderSyllabusTree(globalNotesIndex.filter(n => n.subject === currentSubject));
    return;
  }

  // Filter topics in active subject by title or keywords
  const filtered = globalNotesIndex.filter(n => {
    if (n.subject !== currentSubject) return false;
    const matchTitle = n.title.toLowerCase().includes(query);
    const matchKeyword = n.keywords && n.keywords.some(k => k.toLowerCase().includes(query));
    return matchTitle || matchKeyword;
  });

  renderSyllabusTree(filtered);
}

// 6. Live Fetch Subtopic HTML File into Reading Panel
async function loadNoteContent(filePath) {
  const reader = document.getElementById('noteReaderArea');
  if (!reader) return;

  reader.innerHTML = `<div class="loading-spinner">Loading note content...</div>`;
  try {
    const res = await fetch(filePath);
    const html = await res.text();
    reader.innerHTML = html;
  } catch (err) {
    reader.innerHTML = `<p class="error">Error loading note snippet.</p>`;
  }
}

// 7. Contextual Quiz "Study" Drawer (Call when floating study button is clicked)
async function openQuizStudyDrawer(subtopicId) {
  const drawer = document.getElementById('quizStudyDrawer');
  const drawerContent = document.getElementById('quizStudyDrawerContent');
  if (!drawer || !drawerContent) return;

  drawerContent.innerHTML = `<div class="loading-spinner">Fetching notes for this question...</div>`;
  drawer.classList.add('active');

  const item = globalNotesIndex.find(n => n.id.toLowerCase() === subtopicId.toLowerCase());
  if (!item) {
    drawerContent.innerHTML = `<p>No notes linked to topic standard ID: <code>${subtopicId}</code>.</p>`;
    return;
  }

  try {
    const res = await fetch(item.filePath);
    const html = await res.text();
    drawerContent.innerHTML = html;
  } catch (err) {
    drawerContent.innerHTML = `<p class="error">Failed to fetch note fragment.</p>`;
  }
}

function closeQuizStudyDrawer() {
  const drawer = document.getElementById('quizStudyDrawer');
  if (drawer) drawer.classList.remove('active');
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initStudyEngine);
