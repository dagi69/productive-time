import { TimerSession, TimerData } from '../App';

const STORAGE_KEY = 'productive_timer_data';

export const saveToLocalStorage = (session: TimerSession): void => {
  try {
    const existingData = getFromLocalStorage();
    const updatedData = {
      ...existingData,
      [session.date]: session
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw new Error('Failed to save data locally');
  }
};

export const getFromLocalStorage = (): TimerData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return {};
  }
};

export const getAllFromLocalStorage = (): TimerData => {
  return getFromLocalStorage();
};

export const updateLocalStorage = (date: string, deepWork: number, shallowWork: number): void => {
  const totalTime = deepWork + shallowWork;
  const session: TimerSession = {
    date,
    deepWork,
    shallowWork,
    totalTime
  };
  saveToLocalStorage(session);
};