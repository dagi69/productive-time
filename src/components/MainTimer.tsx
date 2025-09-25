import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Save, Database, ArrowLeft, Plus } from 'lucide-react';
import { WorkType, TimerSession } from '../App';
import { formatTime } from '../utils/timeUtils';

interface MainTimerProps {
  selectedDate: string;
  currentSession: TimerSession;
  onSave: (deepWork: number, shallowWork: number) => void;
  onViewDatabase: () => void;
  onBackToDateSelect: () => void;
  isLoading: boolean;
  isOnline: boolean;
}

const MainTimer: React.FC<MainTimerProps> = ({
  selectedDate,
  currentSession,
  onSave,
  onViewDatabase,
  onBackToDateSelect,
  isLoading,
  isOnline
}) => {
  const [deepWorkTime, setDeepWorkTime] = useState(currentSession.deepWork);
  const [shallowWorkTime, setShallowWorkTime] = useState(currentSession.shallowWork);
  const [currentTimer, setCurrentTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [workType, setWorkType] = useState<WorkType>('deep');
  const [timerMinutes, setTimerMinutes] = useState<number>(25);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setDeepWorkTime(currentSession.deepWork);
    setShallowWorkTime(currentSession.shallowWork);
  }, [currentSession]);

  useEffect(() => {
    if (isRunning && currentTimer > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentTimer(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Update the appropriate work type timer
            if (workType === 'deep') {
              setDeepWorkTime(prev => prev + (timerMinutes * 60 + timerSeconds));
            } else {
              setShallowWorkTime(prev => prev + (timerMinutes * 60 + timerSeconds));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, currentTimer, workType, timerMinutes, timerSeconds]);

  const handleStart = () => {
    if (currentTimer === 0) {
      const totalSeconds = timerMinutes * 60 + timerSeconds;
      setCurrentTimer(totalSeconds);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleSave = () => {
    onSave(deepWorkTime, shallowWorkTime);
  };

  const getProgressPercentage = () => {
    const totalTime = timerMinutes * 60 + timerSeconds;
    if (totalTime === 0) return 0;
    return ((totalTime - currentTimer) / totalTime) * 100;
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBackToDateSelect}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Date Selection
          </button>
          
          <button
            onClick={onViewDatabase}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Database className="w-5 h-5" />
            View Database
          </button>
        </div>

        {/* Selected Date */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Productive Timer</h1>
          <p className="text-xl text-gray-600">{selectedDate}</p>
        </div>

        {/* Work Type Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Deep Work Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Deep Work
              </h3>
            </div>
            <div className="text-3xl font-mono font-bold text-blue-600">
              {formatTime(deepWorkTime)}
            </div>
          </div>

          {/* Shallow Work Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Shallow Work
              </h3>
            </div>
            <div className="text-3xl font-mono font-bold text-green-600">
              {formatTime(shallowWorkTime)}
            </div>
          </div>
        </div>

        {/* Current Timer Display */}
        {currentTimer > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 mb-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 capitalize">
                {workType} Work Session
              </h3>
              <div className="text-6xl font-mono font-bold text-gray-800 mb-6">
                {formatTime(currentTimer)}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                <div
                  className={`h-4 rounded-full transition-all duration-1000 ${
                    workType === 'deep' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Add Timer Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-6 h-6 text-gray-700" />
            <h3 className="text-2xl font-semibold text-gray-800">Add Timer</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Timer Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Timer Duration</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Minutes"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Minutes</span>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Seconds"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Seconds</span>
                </div>
              </div>
            </div>

            {/* Work Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as WorkType)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="deep">Deep Work</option>
                <option value="shallow">Shallow Work</option>
              </select>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleStart}
              disabled={isRunning || (timerMinutes === 0 && timerSeconds === 0)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Play className="w-5 h-5" />
              Start
            </button>

            <button
              onClick={handlePause}
              disabled={!isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Pause className="w-5 h-5" />
              Pause
            </button>

            <button
              onClick={handleSave}
              disabled={isLoading || !isOnline}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainTimer;