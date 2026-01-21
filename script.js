// Game State
let currentQuestion = '';
let answers = [];
let foundAnswers = [];
let score = 0;
let correctCount = 0;
let remainingCount = 0;
let isSubmitting = false;

// DOM Elements
const questionText = document.getElementById('question-text');
const questionBox = document.getElementById('question-box');
const loading = document.getElementById('loading');
const answerInput = document.getElementById('answer-input');
const clearBtn = document.getElementById('clear-btn');
const charCount = document.getElementById('char-count');
const submitBtn = document.getElementById('submit-btn');
const newBtn = document.getElementById('new-btn');
const resultBox = document.getElementById('result-box');
const resultIcon = document.getElementById('result-icon');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const answerList = document.getElementById('answer-list');
const correctCountEl = document.getElementById('correct-count');
const remainingCountEl = document.getElementById('remaining-count');
const answersGrid = document.getElementById('answers-grid');
const scoreEl = document.getElementById('score');
const apiStatus = document.getElementById('api-status');
const notification = document.getElementById('notification');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    getNewQuestion();
});

// Setup event listeners
function setupEventListeners() {
    // Input validation
    answerInput.addEventListener('input', function() {
        const hasValue = this.value.trim().length > 0;
        submitBtn.disabled = !hasValue || isSubmitting;
        updateCharCount();
    });

    // Enter key to submit
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !submitBtn.disabled) {
            submitAnswer();
        }
    });

    // Clear button
    clearBtn.addEventListener('click', function() {
        answerInput.value = '';
        answerInput.focus();
        submitBtn.disabled = true;
        updateCharCount();
    });

    // Click on grid items
    answersGrid.addEventListener('click', function(e) {
        if (e.target.classList.contains('grid-item') && 
            e.target.classList.contains('available')) {
            const answer = e.target.dataset.answer;
            if (answer) {
                answerInput.value = answer;
                submitBtn.disabled = false;
                answerInput.focus();
            }
        }
    });
}

// Update character count
function updateCharCount() {
    const count = answerInput.value.length;
    charCount.textContent = `${count}/50`;
    charCount.style.color = count >= 50 ? '#ff0000' : '#666';
}

// Show notification
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = '';
    notification.classList.add(type);
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Get new question from API
async function getNewQuestion() {
    // Reset state
    resetGameState();
    
    // Show loading
    loading.style.display = 'flex';
    questionText.style.display = 'none';
    
    // Update API status
    updateApiStatus('loading', 'Mengambil soal...');
    
    try {
        const response = await fetch('https://api.siputzx.my.id/api/games/family100', {
            cache: 'no-store',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Parse data berdasarkan struktur API
        let questionData;
        if (data.data) {
            questionData = data.data;
        } else if (data.result) {
            questionData = data.result;
        } else {
            questionData = data;
        }

        currentQuestion = questionData.soal || questionData.question || '';
        answers = (questionData.jawaban || questionData.answers || []).map(a => 
            a.toLowerCase().trim()
        );

        if (!currentQuestion || answers.length === 0) {
            throw new Error('Data tidak valid dari API');
        }

        // Update UI
        updateQuestionDisplay();
        updateAnswersGrid();
        updateStats();
        
        // Hide loading
        loading.style.display = 'none';
        questionText.style.display = 'block';
        
        // Focus input
        answerInput.focus();
        
        // Enable controls
        newBtn.disabled = false;
        submitBtn.disabled = true;
        
        // Update API status
        updateApiStatus('success', 'Family 100 API');
        showNotification('Soal baru siap!', 'success');
        
    } catch (error) {
        console.error('Error fetching question:', error);
        
        // Show error
        questionText.textContent = 'Gagal memuat soal. Coba lagi nanti.';
        questionText.style.display = 'block';
        loading.style.display = 'none';
        
        // Disable controls
        answerInput.disabled = true;
        submitBtn.disabled = true;
        
        // Update API status
        updateApiStatus('error', 'Gagal mengambil');
        showNotification('Gagal memuat soal', 'error');
    }
}

// Update question display
function updateQuestionDisplay() {
    questionText.textContent = currentQuestion;
}

// Update answers grid
function updateAnswersGrid() {
    answersGrid.innerHTML = '';
    
    answers.forEach((answer, index) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item available';
        gridItem.textContent = answer.toUpperCase();
        gridItem.dataset.answer = answer;
        gridItem.dataset.index = index;
        
        if (foundAnswers.includes(answer)) {
            gridItem.classList.remove('available');
            gridItem.classList.add('found');
        }
        
        answersGrid.appendChild(gridItem);
    });
}

// Update stats display
function updateStats() {
    remainingCount = answers.length - foundAnswers.length;
    
    scoreEl.textContent = score;
    correctCountEl.textContent = foundAnswers.length;
    remainingCountEl.textContent = remainingCount;
}

// Update API status display
function updateApiStatus(status, message) {
    apiStatus.textContent = `API: ${message}`;
    
    switch(status) {
        case 'loading':
            apiStatus.style.color = '#666';
            break;
        case 'success':
            apiStatus.style.color = '#000';
            break;
        case 'error':
            apiStatus.style.color = '#ff0000';
            break;
    }
}

// Submit answer
function submitAnswer() {
    if (!answerInput.value.trim() || isSubmitting) {
        return;
    }

    isSubmitting = true;
    const userAnswer = answerInput.value.trim().toLowerCase();
    
    // Check if answer is valid
    const isCorrect = answers.includes(userAnswer);
    const alreadyFound = foundAnswers.includes(userAnswer);
    
    if (isCorrect && !alreadyFound) {
        // Correct answer
        handleCorrectAnswer(userAnswer);
    } else if (alreadyFound) {
        // Already found
        showNotification('Jawaban ini sudah ditemukan!', 'warning');
        answerInput.value = '';
        answerInput.focus();
        submitBtn.disabled = true;
        isSubmitting = false;
    } else {
        // Incorrect answer
        handleIncorrectAnswer();
    }
}

// Handle correct answer
function handleCorrectAnswer(answer) {
    foundAnswers.push(answer);
    score += 10;
    correctCount++;
    
    // Update UI
    updateAnswerList();
    updateAnswersGrid();
    updateStats();
    
    // Show success
    resultIcon.textContent = '✓';
    resultIcon.style.backgroundColor = '#000';
    resultIcon.style.color = '#fff';
    resultTitle.textContent = 'BENAR!';
    resultTitle.style.color = '#000';
    resultMessage.textContent = `Kamu menemukan: "${answer.toUpperCase()}"`;
    resultMessage.style.color = '#000';
    
    // Animation
    resultBox.style.animation = 'correct 0.5s ease';
    setTimeout(() => {
        resultBox.style.animation = '';
    }, 500);
    
    // Check if all answers found
    if (foundAnswers.length === answers.length) {
        showNotification('🎉 SELAMAT! Semua jawaban ditemukan!', 'success');
        resultMessage.textContent = 'SELAMAT! Semua jawaban telah ditemukan!';
        submitBtn.disabled = true;
    } else {
        showNotification(`✅ +10 Poin! Ditemukan: ${answer.toUpperCase()}`, 'success');
    }
    
    // Reset input
    answerInput.value = '';
    answerInput.focus();
    submitBtn.disabled = true;
    updateCharCount();
    isSubmitting = false;
}

// Handle incorrect answer
function handleIncorrectAnswer() {
    // Show error
    resultIcon.textContent = '✕';
    resultIcon.style.backgroundColor = '#000';
    resultIcon.style.color = '#fff';
    resultTitle.textContent = 'SALAH';
    resultTitle.style.color = '#000';
    resultMessage.textContent = 'Jawaban tidak ditemukan. Coba lagi!';
    resultMessage.style.color = '#000';
    
    // Animation
    resultBox.style.animation = 'incorrect 0.5s ease';
    setTimeout(() => {
        resultBox.style.animation = '';
    }, 500);
    
    showNotification('Jawaban salah, coba lagi!', 'error');
    
    // Reset input but keep value
    answerInput.select();
    isSubmitting = false;
}

// Update answer list
function updateAnswerList() {
    answerList.innerHTML = '';
    
    foundAnswers.forEach(answer => {
        const answerItem = document.createElement('div');
        answerItem.className = 'answer-item';
        answerItem.textContent = answer.toUpperCase();
        answerList.appendChild(answerItem);
    });
}

// Reset game state
function resetGameState() {
    currentQuestion = '';
    answers = [];
    foundAnswers = [];
    
    answerInput.value = '';
    answerInput.disabled = false;
    submitBtn.disabled = true;
    newBtn.disabled = true;
    
    questionText.textContent = '';
    answerList.innerHTML = '';
    answersGrid.innerHTML = '';
    
    resultIcon.textContent = '⚫';
    resultIcon.style.backgroundColor = '#000';
    resultIcon.style.color = '#fff';
    resultTitle.textContent = 'Tunggu jawaban';
    resultTitle.style.color = '#000';
    resultMessage.textContent = 'Submit jawaban untuk cek hasil';
    resultMessage.style.color = '#000';
    
    updateCharCount();
    updateStats();
    
    isSubmitting = false;
}

// Initialize styles for notification
document.head.insertAdjacentHTML('beforeend', `
    <style>
        #notification.success {
            background: #000;
            color: #fff;
            border-color: #000;
        }
        
        #notification.error {
            background: #000;
            color: #ff0000;
            border-color: #ff0000;
        }
        
        #notification.warning {
            background: #000;
            color: #ffcc00;
            border-color: #ffcc00;
        }
        
        #notification.info {
            background: #000;
            color: #fff;
            border-color: #000;
        }
    </style>
`);

// Add some sample answers for testing if needed
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development mode - add some test data
    console.log('Development mode: Sample data available');
}
