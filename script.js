// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, Timestamp, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGMkaoA_gyRsPvPye0k-z0WRrAS7Xk-gM",
  authDomain: "productive-time-13ce8.firebaseapp.com",
  projectId: "productive-time-13ce8",
  storageBucket: "productive-time-13ce8.firebasestorage.app",
  messagingSenderId: "470397183987",
  appId: "1:470397183987:web:b075dce594086b186ad486",
  measurementId: "G-JSSV558SF9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global variables
let currentPage = 'dateSelection';
let selectedDate = '';
let deepWorkTime = 0;
let shallowWorkTime = 0;
let currentTimer = 0;
let timerInterval = null;
let isTimerRunning = false;
let isPaused = false;
let currentWorkType = 'deep';

// Live timer variables
let timerStartTime = null;
let timerDuration = 0;
let timerEndTime = null;
let backgroundCheckInterval = null;

// Ethiopian months
const ethiopianMonths = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

// Utility functions
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function showPage(pageName) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageName + 'Page').classList.add('active');
  currentPage = pageName;
}

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notificationText');
  const icon = notification.querySelector('i');
  
  notificationText.textContent = message;
  
  if (type === 'error') {
    icon.className = 'fas fa-exclamation-circle';
    notification.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
  } else {
    icon.className = 'fas fa-check-circle';
    notification.style.background = 'linear-gradient(135deg, #51cf66, #40c057)';
  }
  
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

function updateConnectionStatus() {
  const status = document.getElementById('connectionStatus');
  const icon = status.querySelector('i');
  const text = status.querySelector('span');
  
  if (navigator.onLine) {
    status.classList.remove('offline');
    status.classList.add('online');
    icon.className = 'fas fa-wifi';
    text.textContent = 'Online';
  } else {
    status.classList.remove('online');
    status.classList.add('offline');
    icon.className = 'fas fa-wifi-slash';
    text.textContent = 'Offline';
  }
}

// Live Timer Functions
function saveTimerState(startTime, duration, endTime, workType, date) {
  const timerState = {
    startTime: startTime,
    duration: duration,
    endTime: endTime,
    workType: workType,
    date: date,
    isActive: true
  };
  localStorage.setItem('activeTimer', JSON.stringify(timerState));
}

function clearTimerState() {
  localStorage.removeItem('activeTimer');
}

function getTimerState() {
  const saved = localStorage.getItem('activeTimer');
  return saved ? JSON.parse(saved) : null;
}

async function saveCompletedTimer(workType, duration, date) {
  try {
    const dateData = await loadDateData(date);
    
    if (workType === 'deep') {
      deepWorkTime = (dateData.deepWork || 0) + duration;
      shallowWorkTime = dateData.shallowWork || 0;
    } else {
      deepWorkTime = dateData.deepWork || 0;
      shallowWorkTime = (dateData.shallowWork || 0) + duration;
    }
    
    await saveTimerData(date, deepWorkTime, shallowWorkTime);
    updateWorkTimers();
    showNotification(`${workType === 'deep' ? 'Deep' : 'Shallow'} work session completed and saved!`);
  } catch (error) {
    console.error('Error saving completed timer:', error);
    showNotification('Timer completed but failed to save', 'error');
  }
}

function checkBackgroundTimer() {
  const timerState = getTimerState();
  if (!timerState || !timerState.isActive) return;
  
  const now = Date.now();
  const timeElapsed = now - timerState.startTime;
  
  if (timeElapsed >= timerState.duration) {
    // Timer completed in background
    clearTimerState();
    saveCompletedTimer(timerState.workType, timerState.duration / 1000, timerState.date);
    resetTimer();
    showNotification('Background timer completed!');
  } else {
    // Timer still running
    const remainingTime = Math.ceil((timerState.duration - timeElapsed) / 1000);
    currentTimer = remainingTime;
    timerStartTime = timerState.startTime;
    timerDuration = timerState.duration;
    timerEndTime = timerState.endTime;
    currentWorkType = timerState.workType;
    isTimerRunning = true;
    isPaused = false;
    
    // Update UI
    document.getElementById('timerInput').value = Math.ceil(timerState.duration / 60000);
    document.getElementById('workTypeSelect').value = timerState.workType;
    updateTimerDisplay();
    updateTimerButtons();
    
    // Start live updates
    startLiveTimer();
  }
}

function startLiveTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    const now = Date.now();
    const timeElapsed = now - timerStartTime;
    const remainingTime = Math.max(0, Math.ceil((timerDuration - timeElapsed) / 1000));
    
    currentTimer = remainingTime;
    updateTimerDisplay();
    updateProgress();
    
    if (remainingTime <= 0) {
      completeTimer();
    }
  }, 1000);
}

// Firebase functions
async function saveTimerData(date, deepWork, shallowWork) {
  if (!navigator.onLine) {
    showNotification('Cannot save data while offline', 'error');
    return false;
  }
  
  try {
    showLoading(true);
    const docId = date.replace(/\//g, '_');
    const totalTime = deepWork + shallowWork;
    
    await setDoc(doc(db, 'timer_sessions', docId), {
      date: date,
      deepWork: deepWork,
      shallowWork: shallowWork,
      totalTime: totalTime,
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    showNotification('Data saved successfully!');
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    showNotification('Failed to save data', 'error');
    return false;
  } finally {
    showLoading(false);
  }
}

async function loadAllTimerData() {
  if (!navigator.onLine) {
    showNotification('Cannot load data while offline', 'error');
    return {};
  }
  
  try {
    showLoading(true);
    const q = query(collection(db, 'timer_sessions'), orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const data = {};
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      data[docData.date] = docData;
    });
    
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Failed to load data', 'error');
    return {};
  } finally {
    showLoading(false);
  }
}

async function loadDateData(date) {
  if (!navigator.onLine) {
    return { deepWork: 0, shallowWork: 0, totalTime: 0 };
  }
  
  try {
    const docId = date.replace(/\//g, '_');
    const docRef = doc(db, 'timer_sessions', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return { deepWork: 0, shallowWork: 0, totalTime: 0 };
    }
  } catch (error) {
    console.error('Error loading date data:', error);
    return { deepWork: 0, shallowWork: 0, totalTime: 0 };
  }
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.classList.add('show');
  } else {
    overlay.classList.remove('show');
  }
}

// Timer functions
function startTimer() {
  const timerInput = document.getElementById('timerInput');
  const minutes = parseInt(timerInput.value) || 0;
  
  if (minutes <= 0) {
    showNotification('Please enter a valid timer duration', 'error');
    return;
  }
  
  const now = Date.now();
  const durationMs = minutes * 60 * 1000;
  
  timerStartTime = now;
  timerDuration = durationMs;
  timerEndTime = now + durationMs;
  currentTimer = minutes * 60;
  currentWorkType = document.getElementById('workTypeSelect').value;
  isTimerRunning = true;
  isPaused = false;
  
  // Save timer state for background operation
  saveTimerState(timerStartTime, timerDuration, timerEndTime, currentWorkType, selectedDate);
  
  updateTimerDisplay();
  updateTimerButtons();
  startLiveTimer();
  
  showNotification(`${currentWorkType === 'deep' ? 'Deep' : 'Shallow'} work timer started!`);
}

function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isTimerRunning = false;
  isPaused = true;
  
  // Update saved state to paused
  const timerState = getTimerState();
  if (timerState) {
    timerState.isActive = false;
    timerState.pausedAt = Date.now();
    timerState.remainingTime = currentTimer;
    localStorage.setItem('activeTimer', JSON.stringify(timerState));
  }
  
  updateTimerButtons();
  showNotification('Timer paused');
}

function resumeTimer() {
  if (currentTimer > 0) {
    const now = Date.now();
    timerStartTime = now;
    timerDuration = currentTimer * 1000;
    timerEndTime = now + timerDuration;
    
    isTimerRunning = true;
    isPaused = false;
    
    // Update saved state
    saveTimerState(timerStartTime, timerDuration, timerEndTime, currentWorkType, selectedDate);
    
    updateTimerButtons();
    startLiveTimer();
    showNotification('Timer resumed');
  }
}

async function completeTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Prefer timerDuration (ms) converted to seconds
  let completedSeconds;
  if (timerDuration && typeof timerDuration === 'number' && timerDuration > 0) {
    completedSeconds = Math.round(timerDuration / 1000);
  } else {
    const timerInput = document.getElementById('timerInput');
    completedSeconds = (parseInt(timerInput.value, 10) || 0) * 60;
  }

  if (currentWorkType === 'deep') {
    deepWorkTime += completedSeconds;
  } else {
    shallowWorkTime += completedSeconds;
  }

  // Clear saved timer state
  clearTimerState();

  // Auto-save completed session
  await saveTimerData(selectedDate, deepWorkTime, shallowWorkTime);

  updateWorkTimers();
  resetTimer();
  showNotification(`${currentWorkType === 'deep' ? 'Deep' : 'Shallow'} work session completed and saved!`);
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  clearTimerState();
  currentTimer = 0;
  isTimerRunning = false;
  isPaused = false;
  timerStartTime = null;
  timerDuration = 0;
  timerEndTime = null;
  
  updateTimerDisplay();
  updateTimerButtons();
  updateProgress();
}

function updateTimerDisplay() {
  document.getElementById('currentTimer').textContent = formatTime(currentTimer);
}

function updateTimerButtons() {
  const startBtn = document.getElementById('startTimerBtn');
  const pauseBtn = document.getElementById('pauseTimerBtn');
  const resumeBtn = document.getElementById('resumeTimerBtn');
  
  if (isTimerRunning) {
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-flex';
    resumeBtn.style.display = 'none';
  } else if (isPaused && currentTimer > 0) {
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'inline-flex';
  } else {
    startBtn.style.display = 'inline-flex';
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'none';
  }
}

function updateProgress() {
  const timerInput = document.getElementById('timerInput');
  const totalSeconds = parseInt(timerInput.value) * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - currentTimer) / totalSeconds) * 100 : 0;
  document.getElementById('currentProgress').style.width = progress + '%';
}

function updateWorkTimers() {
  document.getElementById('deepWorkTimer').textContent = formatTime(deepWorkTime);
  document.getElementById('shallowWorkTimer').textContent = formatTime(shallowWorkTime);
  
  // Update progress bars for work types
  const totalTime = deepWorkTime + shallowWorkTime;
  if (totalTime > 0) {
    const deepProgress = (deepWorkTime / totalTime) * 100;
    const shallowProgress = (shallowWorkTime / totalTime) * 100;
    document.getElementById('deepWorkProgress').style.width = deepProgress + '%';
    document.getElementById('shallowWorkProgress').style.width = shallowProgress + '%';
  }
}

// Database view functions
async function updateDatabaseView() {
  const data = await loadAllTimerData();
  const sessions = Object.values(data);
  
  // Update statistics
  const totalSessions = sessions.length;
  const totalDeepWork = sessions.reduce((sum, session) => sum + (session.deepWork || 0), 0);
  const totalShallowWork = sessions.reduce((sum, session) => sum + (session.shallowWork || 0), 0);
  const totalTime = totalDeepWork + totalShallowWork;
  const productivityRatio = totalTime > 0 ? Math.round((totalDeepWork / totalTime) * 100) : 0;
  
  document.getElementById('totalSessions').textContent = totalSessions;
  document.getElementById('totalDeepWork').textContent = formatTime(totalDeepWork);
  document.getElementById('totalShallowWork').textContent = formatTime(totalShallowWork);
  document.getElementById('productivityRatio').textContent = productivityRatio + '%';
  
  // Update table
  const tbody = document.getElementById('databaseTableBody');
  tbody.innerHTML = '';
  
  if (sessions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">No data available</td></tr>';
    return;
  }
  
  sessions.forEach(session => {
    const row = document.createElement('tr');
    const sessionTotal = (session.deepWork || 0) + (session.shallowWork || 0);
    const sessionRatio = sessionTotal > 0 ? Math.round(((session.deepWork || 0) / sessionTotal) * 100) : 0;
    
    row.innerHTML = `
      <td>${session.date}</td>
      <td>${formatTime(session.deepWork || 0)}</td>
      <td>${formatTime(session.shallowWork || 0)}</td>
      <td>${formatTime(sessionTotal)}</td>
      <td>${sessionRatio}%</td>
    `;
    tbody.appendChild(row);
  });
}

// Initialize date selectors
function initializeDateSelectors() {
  const daySelect = document.getElementById('daySelect');
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');
  
  // Populate days (1-30, except Pagume which has 1-6)
  function updateDays() {
    const selectedMonth = monthSelect.value;
    const maxDays = selectedMonth === 'Pagume' ? 6 : 30;
    
    daySelect.innerHTML = '';
    for (let i = 1; i <= maxDays; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      daySelect.appendChild(option);
    }
  }
  
  // Populate years (current Ethiopian year ± 5)
  const currentEthiopianYear = new Date().getFullYear() - 7;
  for (let i = currentEthiopianYear - 5; i <= currentEthiopianYear + 5; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    if (i === currentEthiopianYear) option.selected = true;
    yearSelect.appendChild(option);
  }
  
  monthSelect.addEventListener('change', updateDays);
  updateDays();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize date selectors
  initializeDateSelectors();
  
  // Set up connection status
  updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  
  // Page navigation
  document.getElementById('goToTimerBtn').addEventListener('click', async () => {
    const day = document.getElementById('daySelect').value;
    const month = document.getElementById('monthSelect').value;
    const year = document.getElementById('yearSelect').value;
    selectedDate = `${day}/${month}/${year}`;
    
    const dateData = await loadDateData(selectedDate);
    deepWorkTime = dateData.deepWork || 0;
    shallowWorkTime = dateData.shallowWork || 0;
    
    updateWorkTimers();
    showPage('timer');
    
    // Check for active timer
    checkBackgroundTimer();
  });
  
  document.getElementById('goToDatabaseBtn').addEventListener('click', async () => {
    showPage('database');
    await updateDatabaseView();
  });
  
  document.getElementById('backToDateBtn').addEventListener('click', () => {
    showPage('dateSelection');
  });
  
  document.getElementById('backToTimerBtn').addEventListener('click', () => {
    showPage('timer');
  });
  
  // Timer buttons
  document.getElementById('startTimerBtn').addEventListener('click', startTimer);
  document.getElementById('pauseTimerBtn').addEventListener('click', pauseTimer);
  document.getElementById('resumeTimerBtn').addEventListener('click', resumeTimer);
  document.getElementById('completeTimerBtn').addEventListener('click', completeTimer);
  document.getElementById('resetTimerBtn').addEventListener('click', resetTimer);
  
  // Periodic background check (every 30s)
  backgroundCheckInterval = setInterval(checkBackgroundTimer, 30000);
});
