/**
 * SecureHub Interactive Quiz Engine & Training Portal JS
 * Updated to support:
 * 1. 80% score threshold for certificate download.
 * 2. Hints toggleable per question.
 * 3. Detailed post-submit feedback (Why correct answer is right & Why wrong options are incorrect).
 */

class QuizEngine {
  constructor(departmentId, questionsData) {
    this.departmentId = departmentId;
    this.questions = questionsData;
    this.userAnswers = new Array(this.questions.length).fill(null);
    this.submitted = false;
    this.score = 0;

    this.initDOM();
    this.loadSavedProgress();
  }

  initDOM() {
    this.container = document.getElementById('questionsContainer');
    this.submitBtn = document.getElementById('submitBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.answeredCountEl = document.getElementById('answeredCount');
    this.quizProgressFill = document.getElementById('quizProgressFill');
    this.resultsSection = document.getElementById('results');
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.correctCountEl = document.getElementById('correctCount');
    this.wrongCountEl = document.getElementById('wrongCount');
    this.unansweredCountEl = document.getElementById('unansweredCount');
    this.certBtn = document.getElementById('downloadCertBtn');
    this.certLockMsg = document.getElementById('certLockMsg');

    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', () => this.submit());
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.reset());
    }
    if (this.certBtn) {
      this.certBtn.addEventListener('click', () => this.generateCertificate());
    }

    this.renderQuestions();
    this.updateProgress();
  }

  renderQuestions() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.questions.forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question-item';
      qDiv.id = `q-item-${idx}`;

      // Question header with text and Hint button
      const qHeader = document.createElement('div');
      qHeader.style.display = 'flex';
      qHeader.style.justifySpaceBetween = 'space-between';
      qHeader.style.alignItems = 'flex-start';
      qHeader.style.gap = '1rem';
      qHeader.style.marginBottom = '0.75rem';

      const text = document.createElement('div');
      text.className = 'question-text';
      text.style.marginBottom = '0';
      text.innerHTML = `<strong>Q${idx + 1}.</strong> ${q.text}`;
      qHeader.appendChild(text);

      if (q.hint) {
        const hintBtn = document.createElement('button');
        hintBtn.className = 'btn-solution';
        hintBtn.style.marginTop = '0';
        hintBtn.style.whiteSpace = 'nowrap';
        hintBtn.style.fontSize = '0.8rem';
        hintBtn.style.padding = '0.25rem 0.6rem';
        hintBtn.innerHTML = `<i class="fas fa-lightbulb"></i> Hint`;
        hintBtn.onclick = () => {
          const hintBox = document.getElementById(`hint-box-${idx}`);
          if (hintBox) {
            hintBox.style.display = hintBox.style.display === 'block' ? 'none' : 'block';
          }
        };
        qHeader.appendChild(hintBtn);
      }

      qDiv.appendChild(qHeader);

      // Hint box element
      if (q.hint) {
        const hintBox = document.createElement('div');
        hintBox.id = `hint-box-${idx}`;
        hintBox.style.display = 'none';
        hintBox.style.background = '#fff8e6';
        hintBox.style.border = '1px solid #ffe58f';
        hintBox.style.borderRadius = '8px';
        hintBox.style.padding = '0.6rem 1rem';
        hintBox.style.fontSize = '0.88rem';
        hintBox.style.color = '#873800';
        hintBox.style.marginBottom = '0.85rem';
        hintBox.innerHTML = `<strong>💡 Hint:</strong> ${q.hint}`;
        qDiv.appendChild(hintBox);
      }

      // Options
      const optionsList = document.createElement('div');
      optionsList.className = 'options-list';

      q.options.forEach((opt, optIdx) => {
        const label = document.createElement('label');
        label.className = 'option-label';
        label.id = `opt-label-${idx}-${optIdx}`;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `question_${idx}`;
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

      // Format why-correct and why-wrong explanations
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

  loadSavedProgress() {
    const data = JSON.parse(localStorage.getItem('securehub_progress') || '{}');
    if (data[this.departmentId]) {
      const record = data[this.departmentId];
      // Optional pre-fill
    }
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
