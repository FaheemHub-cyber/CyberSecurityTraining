/**
 * SecureHub Interactive Quiz Engine & Training Portal JS
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

      const text = document.createElement('div');
      text.className = 'question-text';
      text.innerHTML = `<strong>Q${idx + 1}.</strong> ${q.text}`;
      qDiv.appendChild(text);

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

      if (userAns === null) {
        unansweredCount++;
        if (expBox) {
          expBox.className = 'explanation-box explanation-incorrect';
          expBox.style.display = 'block';
          expBox.innerHTML = `<strong>Unanswered.</strong> Correct Answer: <em>${q.options[q.correct]}</em>.<br>${q.explanation || ''}`;
        }
      } else if (userAns === q.correct) {
        correctCount++;
        const label = document.getElementById(`opt-label-${idx}-${userAns}`);
        if (label) label.style.borderColor = 'var(--success)';

        if (expBox) {
          expBox.className = 'explanation-box explanation-correct';
          expBox.style.display = 'block';
          expBox.innerHTML = `<strong>Correct!</strong> <br>${q.explanation || ''}`;
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
          expBox.innerHTML = `<strong>Incorrect.</strong> Correct Answer: <em>${q.options[q.correct]}</em>.<br>${q.explanation || ''}`;
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
      if (this.resultsSection && record.score !== undefined) {
        // Option to display previous result info
      }
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
          body { font-family: 'Georgia', serif; text-align: center; padding: 50px; background: #f8fafc; }
          .cert-border { border: 10px double #0f172a; padding: 40px; background: #fff; max-width: 800px; margin: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          h1 { font-size: 36px; color: #1e293b; margin-bottom: 10px; }
          h2 { font-size: 24px; color: #2563eb; margin-bottom: 30px; }
          p { font-size: 18px; color: #475569; line-height: 1.6; }
          .highlight { font-weight: bold; color: #0f172a; }
          .score { font-size: 28px; font-weight: bold; color: #16a34a; margin: 20px 0; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 50px; }
          .sig-line { border-top: 1px solid #94a3b8; width: 200px; font-size: 14px; color: #64748b; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <h1>🛡️ SecureHub Training Portal</h1>
          <h2>Certificate of Security Training Completion</h2>
          <p>This is to certify that an employee in the department</p>
          <p class="highlight" style="font-size: 26px;">${this.departmentId.toUpperCase()} TEAM</p>
          <p>has successfully completed the Security & Policy Training module with a score of:</p>
          <div class="score">${deptRecord.score}% SCORE</div>
          <p>Issued on: <span class="highlight">${dateStr}</span></p>
          <div class="footer">
            <div class="sig-line">Chief Information Security Officer</div>
            <div class="sig-line">SecureHub Compliance</div>
          </div>
        </div>
      </body>
      </html>
    `);
    certWindow.document.close();
  }
}

// Global utility for scenario solution toggling
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

// Update global header progress on page load
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
