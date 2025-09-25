import React from 'react';
import { ArrowLeft, Clock, TrendingUp, Calendar, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { TimerData } from '../App';
import { formatTime } from '../utils/timeUtils';

interface DatabaseViewProps {
  timerData: TimerData;
  onBack: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isOnline: boolean;
}

const DatabaseView: React.FC<DatabaseViewProps> = ({ 
  timerData, 
  onBack, 
  onRefresh, 
  isLoading, 
  isOnline 
}) => {
  const sessions = Object.values(timerData).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalDeepWork = sessions.reduce((sum, session) => sum + session.deepWork, 0);
  const totalShallowWork = sessions.reduce((sum, session) => sum + session.shallowWork, 0);
  const totalTime = totalDeepWork + totalShallowWork;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Timer
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Productive Database</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            
            <button
              onClick={onRefresh}
              disabled={isLoading || !isOnline}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Total Deep Work</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatTime(totalDeepWork)}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Total Shallow Work</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatTime(totalShallowWork)}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Total Time</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatTime(totalTime)}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">Sessions</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{sessions.length}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Session History
            </h2>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tracking data available yet.</p>
              <p className="text-sm text-gray-400 mt-2">Start your first timer session to see data here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deep Work
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shallow Work
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map((session, index) => (
                    <tr key={session.date} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{session.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-mono text-blue-600">
                            {formatTime(session.deepWork)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-mono text-green-600">
                            {formatTime(session.shallowWork)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-gray-800">
                          {formatTime(session.totalTime)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {sessions.length > 0 && (
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Productivity Insights</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Deep Work Ratio</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalTime > 0 ? (totalDeepWork / totalTime) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {totalTime > 0 ? Math.round((totalDeepWork / totalTime) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Shallow Work Ratio</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalTime > 0 ? (totalShallowWork / totalTime) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {totalTime > 0 ? Math.round((totalShallowWork / totalTime) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseView;