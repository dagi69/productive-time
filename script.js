import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    query, 
    orderBy,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Ethiopian calendar months
const ethiopianMonths = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
    'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

// Global state
let currentPage = 'dateSelect';
let selectedDate = '';
let timerData = {};
let currentTimer = null;
let timerInterval = null;
let isTimerRunning = false;
let currentWorkType = 'deep';
let timerDuration = 0;
let remainingTime = 0;

// Utility functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getCurrentEthiopianYear() {
    return new Date().getFullYear() - 7; // Approximate Ethiopian year
}

function getDaysInMonth(monthIndex) {
    return monthIndex === 12 ? 6 : 30; // Pagume has 5-6 days, others have 30
}

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notificationMessage');
    
    messageElement.textContent = message;
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function showLoading(show = true) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const isOnline = navigator.onLine;
    
    statusElement.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
    statusElement.innerHTML = `
        <i class="fas fa-${isOnline ? 'wifi' : 'wifi-slash'}"></i>
        <span>${isOnline ? 'Online' : 'Offline'}</span>
    `;
}

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId + 'Page').classList.add('active');
    currentPage = pageId;
}

// Firebase functions
async function saveTimerSession(date, deepWork, shallowWork) {
    try {
        const totalTime = deepWork + shallowWork;
        const docRef = doc(db, 'timer_sessions', date);
        
        await setDoc(docRef, {
            date: date,
            deepWork: deepWork,
            shallowWork: shallowWork,
            totalTime: totalTime,
            updatedAt: serverTimestamp()
        });
        
        // Update local data
        timerData[date] = {
            date: date,
            deepWork: deepWork,
            shallowWork: shallowWork,
            totalTime: totalTime
        };
        
        return true;
    } catch (error) {
        console.error('Error saving timer session:', error);
        throw error;
    }
}

async function loadAllTimerData() {
    try {
        showLoading(true);
        const q = query(collection(db, 'timer_sessions'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        
        timerData = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            timerData[data.date] = {
                date: data.date,
                deepWork: data.deepWork || 0,
                shallowWork: data.shallowWork || 0,
                totalTime: data.totalTime || 0
            };
        });
        
        return timerData;
    } catch (error) {
        console.error('Error loading timer data:', error);
        showNotification('Failed to load data. Please check your connection.', true);
        throw error;
    } finally {
        showLoading(false);
    }
}

// Date selector functions
function populateYearSelect() {
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = getCurrentEthiopianYear();
    
    yearSelect.innerHTML = '';
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
}

function populateMonthSelect() {
    const monthSelect = document.getElementById('monthSelect');
    
    monthSelect.innerHTML = '';
    ethiopianMonths.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
}

function populateDaySelect() {
    const daySelect = document.getElementById('daySelect');
    const monthSelect = document.getElementById('monthSelect');
    const selectedMonth = parseInt(monthSelect.value);
    const daysInMonth = getDaysInMonth(selectedMonth);
    
    daySelect.innerHTML = '';
    for (let i = 1; i <= daysInMonth; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }
}

function updateSelectedDateDisplay() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const daySelect = document.getElementById('daySelect');
    
    const selectedYear = yearSelect.value;
    const selectedMonth = parseInt(monthSelect.value);
    const selectedDay = daySelect.value;
    
    const dateString = `${selectedDay}/${ethiopianMonths[selectedMonth]}/${selectedYear}`;
    document.getElementById('selectedDateDisplay').textContent = dateString;
    
    return dateString;
}

// Timer functions
function updateTimerDisplay() {
    const currentSession = timerData[selectedDate] || { deepWork: 0, shallowWork: 0, totalTime: 0 };
    
    document.getElementById('deepWorkTime').textContent = formatTime(currentSession.deepWork);
    document.getElementById('shallowWorkTime').textContent = formatTime(currentSession.shallowWork);
    document.getElementById('currentDateDisplay').textContent = selectedDate;
}

function startTimer() {
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
    const workType = document.getElementById('workTypeSelect').value;
    
    if (minutes === 0 && seconds === 0) {
        showNotification('Please set a timer duration', true);
        return;
    }
    
    timerDuration = minutes * 60 + seconds;
    remainingTime = timerDuration;
    currentWorkType = workType;
    isTimerRunning = true;
    
    // Show current timer display
    const currentTimerDisplay = document.getElementById('currentTimerDisplay');
    const currentWorkTypeElement = document.getElementById('currentWorkType');
    const currentTimerTime = document.getElementById('currentTimerTime');
    const timerProgress = document.getElementById('timerProgress');
    
    currentWorkTypeElement.textContent = `${workType === 'deep' ? 'Deep' : 'Shallow'} Work Session`;
    currentTimerDisplay.style.display = 'block';
    
    // Update progress bar class
    timerProgress.className = `progress-fill ${workType}`;
    
    // Update button states
    document.getElementById('startTimerBtn').disabled = true;
    document.getElementById('pauseTimerBtn').disabled = false;
    
    // Start countdown
    timerInterval = setInterval(() => {
        remainingTime--;
        
        // Update display
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        currentTimerTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar
        const progress = ((timerDuration - remainingTime) / timerDuration) * 100;
        timerProgress.style.width = `${progress}%`;
        
        // Timer finished
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            timerFinished();
        }
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    isTimerRunning = false;
    document.getElementById('startTimerBtn').disabled = false;
    document.getElementById('pauseTimerBtn').disabled = true;
}

function timerFinished() {
    isTimerRunning = false;
    
    // Update the appropriate work type
    const currentSession = timerData[selectedDate] || { deepWork: 0, shallowWork: 0, totalTime: 0 };
    
    if (currentWorkType === 'deep') {
        currentSession.deepWork += timerDuration;
    } else {
        currentSession.shallowWork += timerDuration;
    }
    
    currentSession.totalTime = currentSession.deepWork + currentSession.shallowWork;
    currentSession.date = selectedDate;
    
    // Update local data
    timerData[selectedDate] = currentSession;
    
    // Update display
    updateTimerDisplay();
    
    // Hide current timer display
    document.getElementById('currentTimerDisplay').style.display = 'none';
    
    // Reset button states
    document.getElementById('startTimerBtn').disabled = false;
    document.getElementById('pauseTimerBtn').disabled = true;
    
    // Show notification
    showNotification(`${currentWorkType === 'deep' ? 'Deep' : 'Shallow'} work session completed!`);
    
    // Reset timer inputs
    document.getElementById('timerMinutes').value = 25;
    document.getElementById('timerSeconds').value = 0;
}

async function saveProgress() {
    if (!navigator.onLine) {
        showNotification('Cannot save data while offline', true);
        return;
    }
    
    const currentSession = timerData[selectedDate] || { deepWork: 0, shallowWork: 0, totalTime: 0 };
    
    try {
        await saveTimerSession(selectedDate, currentSession.deepWork, currentSession.shallowWork);
        showNotification('Data saved successfully!');
    } catch (error) {
        showNotification('Failed to save data. Please try again.', true);
    }
}

// Database view functions
function updateDatabaseView() {
    const sessions = Object.values(timerData).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Update statistics
    const totalDeepWork = sessions.reduce((sum, session) => sum + session.deepWork, 0);
    const totalShallowWork = sessions.reduce((sum, session) => sum + session.shallowWork, 0);
    const totalTime = totalDeepWork + totalShallowWork;
    
    document.getElementById('totalDeepWork').textContent = formatTime(totalDeepWork);
    document.getElementById('totalShallowWork').textContent = formatTime(totalShallowWork);
    document.getElementById('totalTime').textContent = formatTime(totalTime);
    document.getElementById('totalSessions').textContent = sessions.length;
    
    // Update table
    const tableBody = document.getElementById('dataTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    const insightsSection = document.getElementById('insightsSection');
    
    if (sessions.length === 0) {
        tableBody.innerHTML = '';
        noDataMessage.style.display = 'block';
        insightsSection.style.display = 'none';
    } else {
        noDataMessage.style.display = 'none';
        insightsSection.style.display = 'block';
        
        tableBody.innerHTML = sessions.map(session => `
            <tr>
                <td>
                    <i class="fas fa-calendar" style="color: #6b7280; margin-right: 8px;"></i>
                    ${session.date}
                </td>
                <td style="color: #3b82f6;">${formatTime(session.deepWork)}</td>
                <td style="color: #10b981;">${formatTime(session.shallowWork)}</td>
                <td style="font-weight: 600;">${formatTime(session.totalTime)}</td>
            </tr>
        `).join('');
        
        // Update insights
        if (totalTime > 0) {
            const deepWorkPercentage = Math.round((totalDeepWork / totalTime) * 100);
            const shallowWorkPercentage = Math.round((totalShallowWork / totalTime) * 100);
            
            document.getElementById('deepWorkRatio').style.width = `${deepWorkPercentage}%`;
            document.getElementById('shallowWorkRatio').style.width = `${shallowWorkPercentage}%`;
            document.getElementById('deepWorkPercentage').textContent = `${deepWorkPercentage}%`;
            document.getElementById('shallowWorkPercentage').textContent = `${shallowWorkPercentage}%`;
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date selectors
    populateYearSelect();
    populateMonthSelect();
    populateDaySelect();
    updateSelectedDateDisplay();
    
    // Update connection status
    updateConnectionStatus();
    
    // Load initial data
    loadAllTimerData().catch(() => {
        // Handle error silently, already shown in loadAllTimerData
    });
    
    // Date selector events
    document.getElementById('yearSelect').addEventListener('change', updateSelectedDateDisplay);
    document.getElementById('monthSelect').addEventListener('change', function() {
        populateDaySelect();
        updateSelectedDateDisplay();
    });
    document.getElementById('daySelect').addEventListener('change', updateSelectedDateDisplay);
    
    // Start tracking button
    document.getElementById('startTrackingBtn').addEventListener('click', function() {
        selectedDate = updateSelectedDateDisplay();
        updateTimerDisplay();
        showPage('mainTimer');
    });
    
    // Navigation buttons
    document.getElementById('backToDateBtn').addEventListener('click', () => showPage('dateSelect'));
    document.getElementById('viewDatabaseBtn').addEventListener('click', function() {
        updateDatabaseView();
        showPage('database');
    });
    document.getElementById('backToTimerBtn').addEventListener('click', () => showPage('mainTimer'));
    
    // Timer controls
    document.getElementById('startTimerBtn').addEventListener('click', startTimer);
    document.getElementById('pauseTimerBtn').addEventListener('click', pauseTimer);
    document.getElementById('saveProgressBtn').addEventListener('click', saveProgress);
    
    // Database refresh
    document.getElementById('refreshDataBtn').addEventListener('click', async function() {
        try {
            await loadAllTimerData();
            updateDatabaseView();
            showNotification('Data refreshed successfully!');
        } catch (error) {
            // Error already handled in loadAllTimerData
        }
    });
    
    // Online/offline events
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Prevent form submission on enter
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
});