// assets/js/quiz-engine.js

class QuizEngine {
  constructor(departmentId, questions) {
    this.departmentId = departmentId;
    this.questions = questions;
    this.userAnswers = new Array(questions.length).fill(null);
    this.submitted = false;
    this.score = 0;

    // Theory locking state
    this.readTheoryTopics = new Set();
    this.requiredTheoryCount = 5;

    // DOM Elements
    this.container = document.getElementById('questionsContainer');
    this.answeredCountEl = document.getElementById('answeredCount');
    this.quizProgressFill = document.getElementById('quizProgressFill');
    this.resultsSection = document.getElementById('results');
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.correctCountEl = document.getElementById('correctCount');
    this.wrongCountEl = document.getElementById('wrongCount');
    this.unansweredCountEl = document.getElementById('unansweredCount');
    this.certBtn = document.getElementById('downloadCertBtn');
    this.certLockMsg = document.getElementById('certLockMsg');
    this.quizOverlay = document.getElementById('quizOverlay');

    this.init();
  }

  init() {
    this.renderQuestions();
    this.updateProgress();
    this.checkTheoryLock();

    // Attach button listeners
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (submitBtn) submitBtn.addEventListener('click', () => this.submit());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    if (this.certBtn) this.certBtn.addEventListener('click', () => this.generateCertificate());
  }

  checkTheoryLock() {
    if (!this.quizOverlay) return;
    if (this.readTheoryTopics.size >= this.requiredTheoryCount) {
      this.quizOverlay.style.display = 'none';
    } else {
      this.quizOverlay.style.display = 'flex';
      this.quizOverlay.innerHTML = `
        <div style="text-align: center; background: rgba(255,255,255,0.95); padding: 2rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); max-width: 450px;">
          <i class="fas fa-lock" style="font-size: 3rem; color: var(--accent); margin-bottom: 1rem;"></i>
          <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">Theory Topics Locked</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">Please read and mark all <strong>5 Theory Topics</strong> as completed above before taking the test.</p>
          <div style="font-weight: 700; color: var(--accent); font-size: 1.1rem;">
            Completed: <span id="theoryReadCount">${this.readTheoryTopics.size}</span> / 5 Topics
          </div>
        </div>
      `;
    }
  }

  markTopicRead(topicIdx) {
    this.readTheoryTopics.add(topicIdx);
    const countSpan = document.getElementById('theoryReadCount');
    if (countSpan) countSpan.textContent = this.readTheoryTopics.size;
    this.checkTheoryLock();
  }

  renderQuestions() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.questions.forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question-card';
      qDiv.id = `q-card-${idx}`;

      const qText = document.createElement('div');
      qText.className = 'question-text';
      qText.innerHTML = `<span style="color: var(--accent); font-weight: 800;">Q${idx + 1}.</span> ${q.text}`;
      qDiv.appendChild(qText);

      // Add Hint Toggle if available
      if (q.hint) {
        const hintBtn = document.createElement('button');
        hintBtn.className = 'btn-hint';
        hintBtn.style.cssText = 'background: transparent; border: 1px dashed var(--accent); color: var(--accent); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; margin-bottom: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem;';
        hintBtn.innerHTML = `<i class="far fa-lightbulb"></i> Need a Hint?`;

        const hintBox = document.createElement('div');
        hintBox.style.cssText = 'display: none; background: #fff8e6; border: 1px solid #ff9500; color: #8a5300; padding: 0.6rem 0.8rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 0.8rem; font-weight: 500;';
        hintBox.innerHTML = `<strong>💡 Hint:</strong> ${q.hint}`;

        hintBtn.onclick = () => {
          if (hintBox.style.display === 'none') {
            hintBox.style.display = 'block';
            hintBtn.innerHTML = `<i class="fas fa-lightbulb"></i> Hide Hint`;
          } else {
            hintBox.style.display = 'none';
            hintBtn.innerHTML = `<i class="far fa-lightbulb"></i> Need a Hint?`;
          }
        };

        qDiv.appendChild(hintBtn);
        qDiv.appendChild(hintBox);
      }

      const optionsList = document.createElement('div');
      optionsList.className = 'options-list';

      q.options.forEach((opt, optIdx) => {
        const label = document.createElement('label');
        label.className = 'option-item';
        label.id = `opt-label-${idx}-${optIdx}`;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `question-${idx}`;
        radio.value = optIdx;

        if (this.userAnswers[idx] === optIdx) {
          radio.checked = true;
        }

        radio.addEventListener('change', () => {
          if (!this.submitted) {
            this.userAnswers[idx] = optIdx;
            this.updateProgress();
          }
        });

        label.appendChild(radio);
        const span = document.createElement('span');
        span.textContent = opt;
        label.appendChild(span);
        optionsList.appendChild(label);
      });

      qDiv.appendChild(optionsList);

      const expBox = document.createElement('div');
      expBox.className = 'explanation-box';
      expBox.id = `exp-box-${idx}`;
      qDiv.appendChild(expBox);

      this.container.appendChild(qDiv);
    });
  }

  updateProgress() {
    const answered = this.userAnswers.filter(a => a !== null).length;
    if (this.answeredCountEl) {
      this.answeredCountEl.textContent = answered;
    }
    if (this.quizProgressFill) {
      const pct = Math.round((answered / this.questions.length) * 100);
      this.quizProgressFill.style.width = `${pct}%`;
    }
  }

  submit() {
    if (this.submitted) return;
    this.submitted = true;

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    this.questions.forEach((q, idx) => {
      const userAns = this.userAnswers[idx];
      const expBox = document.getElementById(`exp-box-${idx}`);

      let explanationHTML = '';
      if (q.whyCorrect) {
        explanationHTML += `<div style="margin-top: 0.5rem;"><strong>✅ Why Correct:</strong> ${q.whyCorrect}</div>`;
      } else if (q.explanation) {
        explanationHTML += `<div style="margin-top: 0.5rem;"><strong>Explanation:</strong> ${q.explanation}</div>`;
      }

      if (q.whyWrong && Array.isArray(q.whyWrong)) {
        explanationHTML += `<div style="margin-top: 0.5rem;"><strong>❌ Why Other Answers Are Incorrect:</strong><ul style="padding-left: 1.2rem; margin-top: 0.2rem;">`;
        q.whyWrong.forEach(item => {
          explanationHTML += `<li>${item}</li>`;
        });
        explanationHTML += `</ul></div>`;
      }

      if (userAns === null) {
        unansweredCount++;
        if (expBox) {
          expBox.className = 'explanation-box explanation-incorrect';
          expBox.style.display = 'block';
          expBox.innerHTML = `<strong>⚠️ Unanswered.</strong> Correct Answer: <em>${q.options[q.correct]}</em>.<br>${explanationHTML}`;
        }
      } else if (userAns === q.correct) {
        correctCount++;
        const label = document.getElementById(`opt-label-${idx}-${userAns}`);
        if (label) label.style.borderColor = 'var(--success)';

        if (expBox) {
          expBox.className = 'explanation-box explanation-correct';
          expBox.style.display = 'block';
          expBox.innerHTML = `<strong>✅ Correct!</strong><br>${explanationHTML}`;
        }
      } else {
        wrongCount++;
        const userLabel = document.getElementById(`opt-label-${idx}-${userAns}`);
        if (userLabel) userLabel.style.borderColor = 'var(--danger)';

        const correctLabel = document.getElementById(`opt-label-${idx}-${q.correct}`);
        if (correctLabel) correctLabel.style.borderColor = 'var(--success)';

        if (expBox) {
          expBox.className = 'explanation-box explanation-incorrect';
          expBox.style.display = 'block';
          expBox.innerHTML = `<strong>❌ Incorrect.</strong> Correct Answer: <em>${q.options[q.correct]}</em>.<br>${explanationHTML}`;
        }
      }
    });

    this.score = Math.round((correctCount / this.questions.length) * 100);

    if (this.resultsSection) {
      this.resultsSection.style.display = 'block';
      if (this.scoreDisplay) this.scoreDisplay.textContent = `${this.score}%`;
      if (this.correctCountEl) this.correctCountEl.textContent = correctCount;
      if (this.wrongCountEl) this.wrongCountEl.textContent = wrongCount;
      if (this.unansweredCountEl) this.unansweredCountEl.textContent = unansweredCount;

      // Render Animated Mascot (Animated Goat vs Broken Boat)
      const mascotBox = document.getElementById('mascotDisplay');
      if (mascotBox) {
        if (this.score >= 80) {
          mascotBox.className = 'mascot-container success';
          mascotBox.innerHTML = `
            <svg class="mascot-svg" viewBox="0 0 100 100">
              <!-- Animated Goat Mascot SVG -->
              <circle cx="50" cy="50" r="45" fill="#eafbe8" stroke="#34c759" stroke-width="4"/>
              <path d="M 30 35 L 20 15 L 35 25 Z" fill="#8d6e63"/>
              <path d="M 70 35 L 80 15 L 65 25 Z" fill="#8d6e63"/>
              <circle cx="50" cy="50" r="25" fill="#d7ccc8"/>
              <circle cx="42" cy="45" r="4" fill="#1d1d1f"/>
              <circle cx="58" cy="45" r="4" fill="#1d1d1f"/>
              <ellipse cx="50" cy="56" rx="6" ry="4" fill="#5d4037"/>
              <path d="M 45 65 Q 50 72 55 65" fill="none" stroke="#1d1d1f" stroke-width="3" stroke-linecap="round"/>
              <polygon points="45,72 55,72 50,82" fill="#fff" stroke="#8d6e63" stroke-width="2"/>
            </svg>
            <div class="mascot-title">Great Job! 🐐</div>
            <div class="mascot-desc">You passed with ${this.score}%! You are a Security Champion!</div>
          `;
        } else {
          mascotBox.className = 'mascot-container failure';
          mascotBox.innerHTML = `
            <svg class="mascot-svg" viewBox="0 0 100 100">
              <!-- Broken Sinking Boat Mascot SVG -->
              <path d="M 15 60 L 45 60 L 48 78 L 22 78 Z" fill="#8d6e63" transform="rotate(15 30 70)"/>
              <path d="M 52 62 L 85 62 L 78 80 L 50 80 Z" fill="#5d4037" transform="rotate(-20 65 70)"/>
              <line x1="45" y1="60" x2="40" y2="25" stroke="#3e2723" stroke-width="3"/>
              <polygon points="40,25 20,40 40,42" fill="#ff3b30" opacity="0.8"/>
              <!-- Water Waves & Water Splashes -->
              <path d="M 5 70 Q 25 60 45 70 T 85 70 T 95 70" fill="none" stroke="#0071e3" stroke-width="4"/>
              <text x="32" y="48" font-size="16" fill="#ff3b30" font-weight="bold">💥</text>
            </svg>
            <div class="mascot-title">You Failed, Please Retry ⛵💥</div>
            <div class="mascot-desc">Score: ${this.score}% (Requires 80%+ to Pass). Review the explanations above and retry!</div>
          `;
        }
      }

      // Handle 80% Score Threshold for Certificate Download
      if (this.score >= 80) {
        if (this.certBtn) {
          this.certBtn.disabled = false;
          this.certBtn.style.opacity = '1';
          this.certBtn.style.cursor = 'pointer';
        }
        if (this.certLockMsg) {
          this.certLockMsg.style.display = 'none';
        }
      } else {
        if (this.certBtn) {
          this.certBtn.disabled = true;
          this.certBtn.style.opacity = '0.5';
          this.certBtn.style.cursor = 'not-allowed';
        }
        if (this.certLockMsg) {
          this.certLockMsg.style.display = 'block';
          this.certLockMsg.innerHTML = `<i class="fas fa-lock"></i> Certificate requires a passing score of <strong>80% or higher</strong>. Please review explanations and retake the test.`;
        }
      }

      this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    this.saveProgress(this.score);
    this.updateGlobalHeaderProgress();
  }

  reset() {
    this.submitted = false;
    this.userAnswers = new Array(this.questions.length).fill(null);
    this.score = 0;

    if (this.resultsSection) {
      this.resultsSection.style.display = 'none';
    }

    this.renderQuestions();
    this.updateProgress();
  }

  saveProgress(score) {
    const data = JSON.parse(localStorage.getItem('securehub_progress') || '{}');
    data[this.departmentId] = {
      score: score,
      completed: true,
      date: new Date().toISOString().split('T')[0]
    };
    localStorage.setItem('securehub_progress', JSON.stringify(data));
  }

  updateGlobalHeaderProgress() {
    const data = JSON.parse(localStorage.getItem('securehub_progress') || '{}');
    const deptIds = ['engineering', 'general', 'sales', 'marketing', 'design', 'product', 'support'];
    let completedCount = 0;

    deptIds.forEach(id => {
      if (data[id] && data[id].completed) {
        completedCount++;
      }
    });

    const totalPct = Math.round((completedCount / deptIds.length) * 100);
    const headerFill = document.getElementById('globalProgressFill');
    const headerText = document.getElementById('globalProgressText');

    if (headerFill) headerFill.style.width = `${totalPct}%`;
    if (headerText) headerText.textContent = `${totalPct}%`;
  }

  generateCertificate() {
    if (this.score < 80) {
      alert("Certificate requires a minimum score of 80% to download.");
      return;
    }

    const data = JSON.parse(localStorage.getItem('securehub_progress') || '{}');
    const deptRecord = data[this.departmentId] || { score: this.score };
    const dateStr = new Date().toLocaleDateString();

    const certWindow = window.open('', '_blank');
    certWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate of Completion - SecureHub</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; text-align: center; padding: 50px; background: #f5f5f7; }
          .cert-border { border: 8px solid #0071e3; padding: 50px; background: #fff; max-width: 800px; margin: auto; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.08); }
          h1 { font-size: 34px; color: #1d1d1f; margin-bottom: 10px; font-weight: 700; }
          h2 { font-size: 22px; color: #0071e3; margin-bottom: 30px; font-weight: 600; }
          p { font-size: 18px; color: #86868b; line-height: 1.6; }
          .highlight { font-weight: 700; color: #1d1d1f; }
          .score { font-size: 28px; font-weight: 800; color: #34c759; margin: 25px 0; letter-spacing: -0.02em; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; padding: 0 40px; }
          .sig-line { border-top: 2px solid #e5e5ea; width: 220px; font-size: 14px; color: #86868b; padding-top: 8px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <h1>🛡️ SecureHub Training Portal</h1>
          <h2>Certificate of Completion & Compliance</h2>
          <p>This certifies that an employee in the department</p>
          <p class="highlight" style="font-size: 26px; text-transform: uppercase; color: #0071e3;">${this.departmentId} TEAM</p>
          <p>has successfully passed the Security & Policy Training module meeting the 80% threshold with a score of:</p>
          <div class="score">${deptRecord.score}% PASSING SCORE</div>
          <p>Issued on: <span class="highlight">${dateStr}</span></p>
          <div class="footer">
            <div class="sig-line">Chief Information Security Officer</div>
            <div class="sig-line">SecureHub Compliance Board</div>
          </div>
        </div>
      </body>
      </html>
    `);
    certWindow.document.close();
  }
}

let activeQuizEngine = null;

function markTheoryRead(btn, idx) {
  btn.style.background = 'var(--success)';
  btn.style.color = '#ffffff';
  btn.style.borderColor = 'var(--success)';
  btn.innerHTML = '<i class="fas fa-check-circle"></i> Topic Completed!';
  btn.disabled = true;

  if (activeQuizEngine) {
    activeQuizEngine.markTopicRead(idx);
  }
}

function toggleSolution(btn) {
  const solutionBox = btn.nextElementSibling;
  if (solutionBox.style.display === 'block') {
    solutionBox.style.display = 'none';
    btn.textContent = 'Show Solution';
  } else {
    solutionBox.style.display = 'block';
    btn.textContent = 'Hide Solution';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(localStorage.getItem('securehub_progress') || '{}');
  const deptIds = ['engineering', 'general', 'sales', 'marketing', 'design', 'product', 'support'];
  let completedCount = 0;

  deptIds.forEach(id => {
    if (data[id] && data[id].completed) {
      completedCount++;
    }
  });

  const totalPct = Math.round((completedCount / deptIds.length) * 100);
  const headerFill = document.getElementById('globalProgressFill');
  const headerText = document.getElementById('globalProgressText');

  if (headerFill) headerFill.style.width = `${totalPct}%`;
  if (headerText) headerText.textContent = `${totalPct}%`;
});
