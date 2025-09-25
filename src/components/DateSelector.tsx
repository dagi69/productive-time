import React, { useState } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

interface DateSelectorProps {
  onDateSelect: (date: string) => void;
}

// Ethiopian calendar months
const ethiopianMonths = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

// Ethiopian calendar years (approximate mapping)
const getCurrentEthiopianYear = () => {
  const gregorianYear = new Date().getFullYear();
  return gregorianYear - 7; // Approximate Ethiopian year
};

const DateSelector: React.FC<DateSelectorProps> = ({ onDateSelect }) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentEthiopianYear());

  const handleStartClick = () => {
    const ethiopianDate = `${selectedDay}/${ethiopianMonths[selectedMonth]}/${selectedYear}`;
    onDateSelect(ethiopianDate);
  };

  const getDaysInMonth = (monthIndex: number) => {
    // Most Ethiopian months have 30 days, Pagume has 5 or 6 days
    return monthIndex === 12 ? 6 : 30;
  };

  const daysInSelectedMonth = getDaysInMonth(selectedMonth);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Productive Timer</h1>
          <p className="text-gray-600">Select a date to start tracking your productivity</p>
        </div>

        <div className="space-y-6">
          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              {Array.from({ length: 10 }, (_, i) => getCurrentEthiopianYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                // Reset day if current selection is invalid for new month
                const newDaysInMonth = getDaysInMonth(Number(e.target.value));
                if (selectedDay > newDaysInMonth) {
                  setSelectedDay(1);
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              {ethiopianMonths.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {/* Selected Date Preview */}
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Selected Date</p>
            <p className="text-lg font-semibold text-blue-800">
              {selectedDay}/{ethiopianMonths[selectedMonth]}/{selectedYear}
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartClick}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Tracking
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelector;