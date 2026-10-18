/**
 * Studyspace - Unified Subject Quizzes & AI Feedback Registry
 * Cambridge IGCSE Subjects (Business Studies 0450, Economics 0455, Accounting 0452, etc.)
 */

const SubjectQuizRegistry = {
  // =========================================================================
  // 1. ECONOMICS MODULE (CIE 0455)
  // =========================================================================
  economics: {
    code: "0455",
    name: "Economics",
    defaultTimerSec: 60,
    hasP2: true,

    /**
     * Custom Gemini AI Feedback UI for Economics Paper 2.
     * Maps AO1 Knowledge, AO2 Analysis, AO3 Evaluation + Examiner Level Caps.
     */
    renderEvaluationHTML: function (evalRes, q) {
      const maxM = evalRes.maxMarks || q.maxMarks || 4;
      const marksAwarded = evalRes.marksAwarded !== undefined ? evalRes.marksAwarded : 0;
      const marksLost = evalRes.marksLost !== undefined ? evalRes.marksLost : (maxM - marksAwarded);

      // Render Cambridge Caps Warning Banner (e.g., One-sided essay capped at Level 2)
      let capsBannerHtml = "";
      if (evalRes.capsApplied && Array.isArray(evalRes.capsApplied) && evalRes.capsApplied.length > 0) {
        capsBannerHtml = evalRes.capsApplied.map(cap => `
          <div class="p-2.5 bg-amber-950/60 border border-amber-500/50 rounded-lg text-amber-200 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> <span><strong>Examiner Cap Applied:</strong> ${cap}</span>
          </div>
        `).join("");
      }

      // Breakdown Grid: AO1 Knowledge, AO2 Analysis, AO3 Evaluation
      let breakdownHtml = "";
      if (evalRes.breakdown) {
        breakdownHtml = `
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
            <div class="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <strong class="text-purple-400 block mb-0.5">Band / Level:</strong>
              <span class="text-slate-300">${evalRes.breakdown.level || 'N/A'}</span>
            </div>
            <div class="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <strong class="text-amber-400 block mb-0.5">AO1 Knowledge:</strong>
              <span class="text-slate-300">${evalRes.breakdown.knowledge || 'N/A'}</span>
            </div>
            <div class="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <strong class="text-sky-400 block mb-0.5">AO2 Analysis:</strong>
              <span class="text-slate-300">${evalRes.breakdown.analysis || 'N/A'}</span>
            </div>
            <div class="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <strong class="text-emerald-400 block mb-0.5">AO3 Evaluation:</strong>
              <span class="text-slate-300">${evalRes.breakdown.evaluation || 'N/A'}</span>
            </div>
          </div>
        `;
      }

      return `
        <div class="p-4 bg-slate-900 dark:bg-slate-950 border border-emerald-500/40 rounded-xl text-xs space-y-3 mt-3 animate-float-in text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="font-bold text-emerald-400 text-sm">Cambridge AI Examiner Result (0455 Economics)</span>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold rounded-lg border border-emerald-500/30">
                Earned: ${marksAwarded} / ${maxM}
              </span>
              ${marksLost > 0 ? `
                <span class="px-2.5 py-1 bg-rose-500/20 text-rose-300 font-extrabold rounded-lg border border-rose-500/30">
                  Lost: ${marksLost}
                </span>
              ` : `
                <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold rounded-lg border border-emerald-500/30">
                  Full Marks! 🎉
                </span>
              `}
            </div>
          </div>

          ${capsBannerHtml}
          ${breakdownHtml}

          ${evalRes.lostMarksReason ? `
            <div class="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg">
              <strong class="text-rose-400 block mb-1">❌ Explanation for Lost Marks:</strong>
              <p class="text-slate-300 leading-relaxed">${evalRes.lostMarksReason}</p>
            </div>
          ` : ''}

          ${evalRes.howToImprove || evalRes.constructiveFeedback ? `
            <div class="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
              <strong class="text-emerald-400 block mb-1">💡 How to Write the Full-Mark Answer:</strong>
              <p class="text-slate-300 leading-relaxed">${evalRes.howToImprove || evalRes.constructiveFeedback}</p>
            </div>
          ` : ''}

          ${evalRes.modelAnswer ? `
            <div class="p-3 bg-slate-800/80 border border-slate-700 rounded-lg">
              <strong class="text-amber-300 block mb-1">📝 Cambridge Model Answer:</strong>
              <p class="text-slate-300 italic leading-relaxed">${evalRes.modelAnswer}</p>
            </div>
          ` : ''}
        </div>
      `;
    }
  },

  // =========================================================================
  // 2. BUSINESS STUDIES MODULE (CIE 0450)
  // =========================================================================
  business: {
    code: "0450",
    name: "Business Studies",
    defaultTimerSec: 60,
    hasP2: true,

    /**
     * Custom Gemini AI Feedback UI for Business Studies Paper 1 & Paper 2.
     * Maps AO1 Knowledge, AO2 Application (Context), AO3 Analysis.
     */
    renderEvaluationHTML: function (evalRes, q) {
      const maxM = evalRes.maxMarks || q.maxMarks || 4;
      const marksAwarded = evalRes.marksAwarded !== undefined ? evalRes.marksAwarded : 0;
      const marksLost = evalRes.marksLost !== undefined ? evalRes.marksLost : (maxM - marksAwarded);

      let breakdownHtml = "";
      if (evalRes.breakdown) {
        breakdownHtml = `
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
            <div class="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <strong class="text-purple-400 block mb-0.5">Band / Level:</strong>
              <span class="text-slate-300">${evalRes.breakdown.level || 'N/A'}</span>
            </div>
            <div class="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <strong class="text-amber-400 block mb-0.5">AO1 Knowledge:</strong>
              <span class="text-slate-300">${evalRes.breakdown.knowledge || 'N/A'}</span>
            </div>
            <div class="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <strong class="text-emerald-400 block mb-0.5">AO2 Application:</strong>
              <span class="text-slate-300">${evalRes.breakdown.application || 'N/A'}</span>
            </div>
            <div class="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <strong class="text-sky-400 block mb-0.5">AO3 Analysis:</strong>
              <span class="text-slate-300">${evalRes.breakdown.analysis || 'N/A'}</span>
            </div>
          </div>
        `;
      }

      return `
        <div class="p-4 bg-slate-900 dark:bg-slate-950 border border-emerald-500/40 rounded-xl text-xs space-y-3 mt-3 animate-float-in text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="font-bold text-emerald-400 text-sm">Cambridge AI Examiner Result (0450 Business)</span>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold rounded-lg border border-emerald-500/30">
                Earned: ${marksAwarded} / ${maxM}
              </span>
              ${marksLost > 0 ? `
                <span class="px-2.5 py-1 bg-rose-500/20 text-rose-300 font-extrabold rounded-lg border border-rose-500/30">
                  Lost: ${marksLost}
                </span>
              ` : `
                <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold rounded-lg border border-emerald-500/30">
                  Full Marks! 🎉
                </span>
              `}
            </div>
          </div>

          ${breakdownHtml}

          ${evalRes.lostMarksReason ? `
            <div class="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg">
              <strong class="text-rose-400 block mb-1">❌ Explanation for Lost Marks:</strong>
              <p class="text-slate-300 leading-relaxed">${evalRes.lostMarksReason}</p>
            </div>
          ` : ''}

          ${evalRes.howToImprove ? `
            <div class="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
              <strong class="text-emerald-400 block mb-1">💡 How to Write the Full-Mark Answer:</strong>
              <p class="text-slate-300 leading-relaxed">${evalRes.howToImprove}</p>
            </div>
          ` : ''}

          ${evalRes.modelAnswer ? `
            <div class="p-3 bg-slate-800/80 border border-slate-700 rounded-lg">
              <strong class="text-amber-300 block mb-1">📝 Model Cambridge Answer:</strong>
              <p class="text-slate-300 italic leading-relaxed">${evalRes.modelAnswer}</p>
            </div>
          ` : ''}
        </div>
      `;
    }
  },

  // =========================================================================
  // 3. ACCOUNTING MODULE (CIE 0452)
  // =========================================================================
  accounting: {
    code: "0452",
    name: "Accounting",
    defaultTimerSec: 90,
    hasP2: true,

    /**
     * Custom Gemini AI Feedback UI for Accounting structured/calc questions.
     */
    renderEvaluationHTML: function (evalRes, q) {
      const maxM = evalRes.maxMarks || q.maxMarks || 4;
      const marksAwarded = evalRes.marksAwarded !== undefined ? evalRes.marksAwarded : 0;
      const marksLost = evalRes.marksLost !== undefined ? evalRes.marksLost : (maxM - marksAwarded);

      return `
        <div class="p-4 bg-slate-900 dark:bg-slate-950 border border-sky-500/40 rounded-xl text-xs space-y-3 mt-3 animate-float-in text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="font-bold text-sky-400 text-sm">Cambridge AI Examiner Result (0452 Accounting)</span>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 bg-sky-500/20 text-sky-300 font-extrabold rounded-lg border border-sky-500/30">
                Earned: ${marksAwarded} / ${maxM}
              </span>
              ${marksLost > 0 ? `
                <span class="px-2.5 py-1 bg-rose-500/20 text-rose-300 font-extrabold rounded-lg border border-rose-500/30">
                  Lost: ${marksLost}
                </span>
              ` : `
                <span class="px-2.5 py-1 bg-sky-500/20 text-sky-300 font-extrabold rounded-lg border border-sky-500/30">
                  Full Marks! 🎉
                </span>
              `}
            </div>
          </div>

          ${evalRes.lostMarksReason ? `
            <div class="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg">
              <strong class="text-rose-400 block mb-1">❌ Accounting/Working Errors:</strong>
              <p class="text-slate-300 leading-relaxed">${evalRes.lostMarksReason}</p>
            </div>
          ` : ''}

          ${evalRes.howToImprove ? `
            <div class="p-3 bg-sky-950/40 border border-sky-800/50 rounded-lg">
              <strong class="text-sky-400 block mb-1">💡 Step-by-Step Ledger/Calculation Guide:</strong>
              <p class="text-slate-300 leading-relaxed">${evalRes.howToImprove}</p>
            </div>
          ` : ''}

          ${evalRes.modelAnswer ? `
            <div class="p-3 bg-slate-800/80 border border-slate-700 rounded-lg">
              <strong class="text-amber-300 block mb-1">📝 Correct Entry / Model Solution:</strong>
              <p class="text-slate-300 italic font-mono leading-relaxed">${evalRes.modelAnswer}</p>
            </div>
          ` : ''}
        </div>
      `;
    }
  },

  // =========================================================================
  // GLOBAL ROUTER METHOD
  // =========================================================================
  /**
   * Helper function to detect subject and return the appropriate HTML evaluation box
   */
  getEvaluationHTML: function (subjectName, evalRes, questionObj) {
    const cleanSubj = String(subjectName || "").toLowerCase();

    if (cleanSubj.includes("eco") || cleanSubj.includes("0455")) {
      return this.economics.renderEvaluationHTML(evalRes, questionObj);
    }
    if (cleanSubj.includes("business") || cleanSubj.includes("0450")) {
      return this.business.renderEvaluationHTML(evalRes, questionObj);
    }
    if (cleanSubj.includes("account") || cleanSubj.includes("0452")) {
      return this.accounting.renderEvaluationHTML(evalRes, questionObj);
    }

    // Default Fallback
    return this.business.renderEvaluationHTML(evalRes, questionObj);
  }
};
