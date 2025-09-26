let timer;
let isRunning = false;
let seconds = 1500; // 25 minutes
let currentMode = 'pomodoro';
let pomodorosCompleted = 0;

const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modeButtons = document.querySelectorAll('.mode-btn');

function updateDisplay() {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startBtn.textContent = 'Pause';
        
        timer = setInterval(() => {
            seconds--;
            updateDisplay();
            
            if (seconds <= 0) {
                clearInterval(timer);
                isRunning = false;
                startBtn.textContent = 'Start';
                
                // Handle completion based on mode
                if (currentMode === 'pomodoro') {
                    pomodorosCompleted++;
                    if (pomodorosCompleted % 4 === 0) {
                        switchMode('longBreak');
                    } else {
                        switchMode('shortBreak');
                    }
                    alert('Pomodoro completed! Time for a break.');
                } else {
                    switchMode('pomodoro');
                    alert('Break over! Time to focus.');
                }
            }
        }, 1000);
    } else {
        pauseTimer();
    }
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    startBtn.textContent = 'Start';
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    startBtn.textContent = 'Start';
    
    switch (currentMode) {
        case 'pomodoro':
            seconds = 1500; // 25 minutes
            break;
        case 'shortBreak':
            seconds = 300; // 5 minutes
            break;
        case 'longBreak':
            seconds = 900; // 15 minutes
            break;
    }
    
    updateDisplay();
}

function switchMode(mode) {
    currentMode = mode;
    
    // Update active button styling
    modeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    // Reset timer with new mode duration
    resetTimer();
}

// Event listeners
startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);

modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        switchMode(button.dataset.mode);
    });
});

// Initialize
updateDisplay();
