import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Database, Play, Pause, Save, Plus, Wifi, WifiOff } from 'lucide-react';
import DateSelector from './components/DateSelector';
import MainTimer from './components/MainTimer';
import DatabaseView from './components/DatabaseView';
import { 
  saveTimerSession, 
  getTimerSession, 
  getAllTimerSessions, 
  updateTimerSession 
} from './services/timerService';

export type WorkType = 'deep' | 'shallow';

export interface TimerSession {
  date: string;
  deepWork: number; // in seconds
  shallowWork: number; // in seconds
  totalTime: number; // in seconds
}

export interface TimerData {
  [date: string]: TimerSession;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'date-select' | 'main' | 'database'>('date-select');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timerData, setTimerData] = useState<TimerData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string>('');

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load all timer data on mount
  useEffect(() => {
    loadAllTimerData();
  }, []);

  const loadAllTimerData = async () => {
    if (!isOnline) {
      setError('You are offline. Data will sync when connection is restored.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const data = await getAllTimerSessions();
      setTimerData(data);
    } catch (err) {
      setError('Failed to load timer data. Please try again.');
      console.error('Error loading timer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setCurrentPage('main');
  };

  const handleSaveData = async (deepWork: number, shallowWork: number) => {
    if (!isOnline) {
      setError('Cannot save data while offline. Please check your connection.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await updateTimerSession(selectedDate, deepWork, shallowWork);
      
      // Update local state
      const totalTime = deepWork + shallowWork;
      setTimerData(prev => ({
        ...prev,
        [selectedDate]: {
          date: selectedDate,
          deepWork,
          shallowWork,
          totalTime
        }
      }));
      
      setError('Data saved successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError('Failed to save data. Please try again.');
      console.error('Error saving timer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentSession = (): TimerSession => {
    return timerData[selectedDate] || {
      date: selectedDate,
      deepWork: 0,
      shallowWork: 0,
      totalTime: 0
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Connection Status & Error Messages */}
      {(!isOnline || error) && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          {!isOnline && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 mb-2">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">You are offline</span>
            </div>
          )}
          {error && (
            <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm ${
              error.includes('successfully') 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {error.includes('successfully') ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Syncing data...</span>
          </div>
        </div>
      )}

      {currentPage === 'date-select' && (
        <DateSelector onDateSelect={handleDateSelect} />
      )}
      
      {currentPage === 'main' && (
        <MainTimer
          selectedDate={selectedDate}
          currentSession={getCurrentSession()}
          onSave={handleSaveData}
          onViewDatabase={() => setCurrentPage('database')}
          onBackToDateSelect={() => setCurrentPage('date-select')}
          isLoading={isLoading}
          isOnline={isOnline}
        />
      )}
      
      {currentPage === 'database' && (
        <DatabaseView
          timerData={timerData}
          onBack={() => setCurrentPage('main')}
          onRefresh={loadAllTimerData}
          isLoading={isLoading}
          isOnline={isOnline}
        />
      )}
    </div>
  );
}

export default App;