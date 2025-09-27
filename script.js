// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
    const allData = await loadAllTimerData();
    return allData[date] || { deepWork: 0, shallowWork: 0, totalTime: 0 };
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
  
  currentTimer = minutes * 60;
  currentWorkType = document.getElementById('workTypeSelect').value;
  isTimerRunning = true;
  isPaused = false;
  
  updateTimerDisplay();
  updateTimerButtons();
  
  timerInterval = setInterval(() => {
    currentTimer--;
    updateTimerDisplay();
    updateProgress();
    
    if (currentTimer <= 0) {
      completeTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isTimerRunning = false;
  isPaused = true;
  updateTimerButtons();
}

function resumeTimer() {
  if (currentTimer > 0) {
    isTimerRunning = true;
    isPaused = false;
    updateTimerButtons();
    
    timerInterval = setInterval(() => {
      currentTimer--;
      updateTimerDisplay();
      updateProgress();
      
      if (currentTimer <= 0) {
        completeTimer();
      }
    }, 1000);
  }
}

function completeTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  const timerInput = document.getElementById('timerInput');
  const completedSeconds = parseInt(timerInput.value) * 60;
  
  if (currentWorkType === 'deep') {
    deepWorkTime += completedSeconds;
  } else {
    shallowWorkTime += completedSeconds;
  }
  
  updateWorkTimers();
  resetTimer();
  showNotification(`${currentWorkType === 'deep' ? 'Deep' : 'Shallow'} work session completed!`);
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  currentTimer = 0;
  isTimerRunning = false;
  isPaused = false;
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
document.addEventListener('DOMContentLoaded', function() {
  // Initialize
  initializeDateSelectors();
  updateConnectionStatus();
  updateTimerButtons();
  
  // Connection status
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  
  // Date selection page
  document.getElementById('startBtn').addEventListener('click', async function() {
    const day = document.getElementById('daySelect').value;
    const month = document.getElementById('monthSelect').value;
    const year = document.getElementById('yearSelect').value;
    
    selectedDate = `${day}/${month}/${year}`;
    document.getElementById('selectedDateDisplay').textContent = selectedDate;
    
    // Load existing data for this date
    const dateData = await loadDateData(selectedDate);
    deepWorkTime = dateData.deepWork || 0;
    shallowWorkTime = dateData.shallowWork || 0;
    
    updateWorkTimers();
    showPage('mainTimer');
  });
  
  // Main timer page
  document.getElementById('startTimerBtn').addEventListener('click', startTimer);
  document.getElementById('pauseTimerBtn').addEventListener('click', pauseTimer);
  document.getElementById('resumeTimerBtn').addEventListener('click', resumeTimer);
  
  document.getElementById('saveDataBtn').addEventListener('click', async function() {
    await saveTimerData(selectedDate, deepWorkTime, shallowWorkTime);
  });
  
  document.getElementById('viewDatabaseBtn').addEventListener('click', function() {
    updateDatabaseView();
    showPage('database');
  });
  
  document.getElementById('backToDateBtn').addEventListener('click', function() {
    resetTimer();
    showPage('dateSelection');
  });
  
  // Database page
  document.getElementById('backToTimerBtn').addEventListener('click', function() {
    showPage('mainTimer');
  });
  
  document.getElementById('refreshDataBtn').addEventListener('click', function() {
    updateDatabaseView();
  });
});