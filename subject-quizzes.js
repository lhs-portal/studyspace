/**
 * Studyspace - Unified Subject Quizzes & AI Feedback Registry
 * Cambridge IGCSE Subjects (Business Studies 0450, Economics 0455, Accounting 0452, etc.)
 */

const SubjectQuizRegistry = {
  // Utility: Shuffle helper function
  shuffleArray: function (array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // =========================================================================
  // 1. BUSINESS STUDIES MODULE (CIE 0450)
  // =========================================================================
  business: {
    code: "0450",
    name: "Business Studies",
    defaultTimerSec: 60,
    hasP2: true,

    /**
     * Builds and samples Business Studies question sets.
     */
    processQuestions: function (fetchedQuestions) {
      const isWritten = fetchedQuestions.some(q => !q.options || q.options.length === 0 || !q.options[0].text);

      if (isWritten) {
        // Check if this is a Paper 2 set (contains 12-mark recommendation or 8-mark case questions)
        const isPaper2Set = fetchedQuestions.some(q => Number(q.maxMarks) === 12 || (q.questionType && (q.questionType === "b_12mark" || q.questionType.startsWith("a_"))));

        if (isPaper2Set) {
          // ===================================================================
          // BUSINESS: PAPER 2 LOGIC (CASE STUDY WRITTEN SET)
          // Standard Set: 1 x 8-Mark Question (Type a) + 1 x 12-Mark Question (Type b)
          // ===================================================================
          const pool8m = fetchedQuestions.filter(q => Number(q.maxMarks) === 8 || (q.questionType && q.questionType.startsWith("a_")));
          const pool12m = fetchedQuestions.filter(q => Number(q.maxMarks) === 12 || (q.questionType && q.questionType === "b_12mark"));

          const p2Set = [];
          if (pool8m.length > 0) p2Set.push(SubjectQuizRegistry.shuffleArray(pool8m)[0]);
          if (pool12m.length > 0) p2Set.push(SubjectQuizRegistry.shuffleArray(pool12m)[0]);

          return p2Set.length > 0 ? p2Set : SubjectQuizRegistry.shuffleArray(fetchedQuestions).slice(0, 2);
        } else {
          // ===================================================================
          // BUSINESS: PAPER 1 LOGIC (STRUCTURED WRITTEN SET)
          // Standard Set: 1x2m + 1x4m + 1x6m + 1x8m
          // ===================================================================
          const getQuestionsByMarks = (marks) => {
            const filtered = fetchedQuestions.filter(q => Number(q.maxMarks) === marks);
            return SubjectQuizRegistry.shuffleArray(filtered);
          };

          const q2 = getQuestionsByMarks(2);
          const q4 = getQuestionsByMarks(4);
          const q6 = getQuestionsByMarks(6);
          const q8 = getQuestionsByMarks(8);

          const p1Set = [q2[0], q4[0], q6[0], q8[0]].filter(Boolean);

          return p1Set.length > 0 ? p1Set : SubjectQuizRegistry.shuffleArray(fetchedQuestions).slice(0, 4);
        }
      } else {
        // Fallback for Business MCQ sets if present
        const shuffled = SubjectQuizRegistry.shuffleArray(fetchedQuestions).map(q => {
          if (q.options && Array.isArray(q.options)) {
            q.options = SubjectQuizRegistry.shuffleArray(q.options);
          }
          return q;
        });
        return shuffled.slice(0, 15);
      }
    },

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
  // 2. ECONOMICS MODULE (CIE 0455)
  // =========================================================================
  economics: {
    code: "0455",
    name: "Economics",
    defaultTimerSec: 60,
    hasP2: true,

    processQuestions: function (fetchedQuestions) {
      const isWritten = fetchedQuestions.some(q => !q.options || q.options.length === 0 || !q.options[0].text);

      if (!isWritten) {
        // =====================================================================
        // ECONOMICS: PAPER 1 MCQ LOGIC (CAPPED AT 15 MCQs)
        // =====================================================================
        const shuffled = SubjectQuizRegistry.shuffleArray(fetchedQuestions).map(q => {
          if (q.options && Array.isArray(q.options)) {
            q.options = SubjectQuizRegistry.shuffleArray(q.options);
          }
          return q;
        });
        return shuffled.slice(0, 15);

      } else {
        // =====================================================================
        // ECONOMICS: PAPER 2 LOGIC (20-MARK PROGRESSIVE SET SAMPLING)
        // Target: 1x2m (Define) + 1x4m (Explain) + 1x6m (Analyze) + 1x8m (Discuss)
        // =====================================================================
        var pool2m = fetchedQuestions.filter(q => Number(q.maxMarks) === 2);
        var pool4m = fetchedQuestions.filter(q => Number(q.maxMarks) === 4);
        var poolAnalyse = fetchedQuestions.filter(q => Number(q.maxMarks) >= 5 && Number(q.maxMarks) <= 6);
        var poolDiscuss = fetchedQuestions.filter(q => Number(q.maxMarks) >= 7 && Number(q.maxMarks) <= 8);

        var selectedSet = [];
        var selectedQuestionsMap = {};

        function addQuestion(q) {
          if (q && !selectedQuestionsMap[q.question]) {
            selectedSet.push(q);
            selectedQuestionsMap[q.question] = true;
            return Number(q.maxMarks) || 0;
          }
          return 0;
        }

        // 1. Core Progressive Selection
        if (pool2m.length > 0) addQuestion(SubjectQuizRegistry.shuffleArray(pool2m)[0]);
        if (pool4m.length > 0) addQuestion(SubjectQuizRegistry.shuffleArray(pool4m)[0]);
        if (poolAnalyse.length > 0) addQuestion(SubjectQuizRegistry.shuffleArray(poolAnalyse)[0]);
        if (poolDiscuss.length > 0) addQuestion(SubjectQuizRegistry.shuffleArray(poolDiscuss)[0]);

        // 2. Calculate Current Mark Total
        var currentTotal = selectedSet.reduce((sum, q) => sum + (Number(q.maxMarks) || 0), 0);

        // 3. Top-Up Logic if pool lacks standard breakdown (Target: 20 Marks Max)
        if (currentTotal < 20) {
          var remaining = fetchedQuestions.filter(q => !selectedQuestionsMap[q.question]);
          var shuffledRemaining = SubjectQuizRegistry.shuffleArray(remaining);

          for (var i = 0; i < shuffledRemaining.length && currentTotal < 20; i++) {
            var q = shuffledRemaining[i];
            var m = Number(q.maxMarks) || 0;
            if (currentTotal + m <= 20) {
              currentTotal += addQuestion(q);
            }
          }
        }

        return selectedSet.length > 0 ? selectedSet : SubjectQuizRegistry.shuffleArray(fetchedQuestions).slice(0, 4);
      }
    },

    renderEvaluationHTML: function (evalRes, q) {
      const maxM = evalRes.maxMarks || q.maxMarks || 4;
      const marksAwarded = evalRes.marksAwarded !== undefined ? evalRes.marksAwarded : 0;
      const marksLost = evalRes.marksLost !== undefined ? evalRes.marksLost : (maxM - marksAwarded);

      let capsBannerHtml = "";
      if (evalRes.capsApplied && Array.isArray(evalRes.capsApplied) && evalRes.capsApplied.length > 0) {
        capsBannerHtml = evalRes.capsApplied.map(cap => `
          <div class="p-2.5 bg-amber-950/60 border border-amber-500/50 rounded-lg text-amber-200 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> <span><strong>Examiner Cap Applied:</strong> ${cap}</span>
          </div>
        `).join("");
      }

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
  // 3. ACCOUNTING MODULE (CIE 0452)
  // =========================================================================
  accounting: {
    code: "0452",
    name: "Accounting",
    defaultTimerSec: 90,
    hasP2: true,

    /**
     * ACCOUNTING: PAPER 1 MCQ LOGIC (CAPPED AT 15 MCQs)
     */
    processQuestions: function (fetchedQuestions) {
      const shuffled = SubjectQuizRegistry.shuffleArray(fetchedQuestions).map(q => {
        if (q.options && Array.isArray(q.options)) {
          q.options = SubjectQuizRegistry.shuffleArray(q.options);
        }
        return q;
      });
      return shuffled.slice(0, 15);
    },

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
  // GLOBAL ROUTER METHODS
  // =========================================================================

  processQuizQuestions: function (subjectName, fetchedQuestions) {
    const cleanSubj = String(subjectName || "").toLowerCase();

    if (cleanSubj.includes("business") || cleanSubj.includes("0450")) {
      return this.business.processQuestions(fetchedQuestions);
    }
    if (cleanSubj.includes("eco") || cleanSubj.includes("0455")) {
      return this.economics.processQuestions(fetchedQuestions);
    }
    if (cleanSubj.includes("account") || cleanSubj.includes("0452")) {
      return this.accounting.processQuestions(fetchedQuestions);
    }

    // Default Fallback
    const shuffled = this.shuffleArray(fetchedQuestions).map(q => {
      if (q.options && Array.isArray(q.options)) {
        q.options = this.shuffleArray(q.options);
      }
      return q;
    });
    return shuffled.slice(0, 15);
  },

  getEvaluationHTML: function (subjectName, evalRes, questionObj) {
    const cleanSubj = String(subjectName || "").toLowerCase();

    if (cleanSubj.includes("business") || cleanSubj.includes("0450")) {
      return this.business.renderEvaluationHTML(evalRes, questionObj);
    }
    if (cleanSubj.includes("eco") || cleanSubj.includes("0455")) {
      return this.economics.renderEvaluationHTML(evalRes, questionObj);
    }
    if (cleanSubj.includes("account") || cleanSubj.includes("0452")) {
      return this.accounting.renderEvaluationHTML(evalRes, questionObj);
    }

    // Default Fallback
    return this.business.renderEvaluationHTML(evalRes, questionObj);
  }
};
