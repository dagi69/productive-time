import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { TimerSession, TimerData } from '../App';
import { 
  saveToLocalStorage, 
  getFromLocalStorage, 
  getAllFromLocalStorage, 
  updateLocalStorage 
} from './localStorageService';

const COLLECTION_NAME = 'timer_sessions';

let useFirebase = true;
export const saveTimerSession = async (session: TimerSession): Promise<void> => {
  try {
    if (!useFirebase) {
      saveToLocalStorage(session);
      return;
    }
    
    const docRef = doc(db, COLLECTION_NAME, session.date);
    await setDoc(docRef, {
      ...session,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving timer session:', error);
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      console.warn('Firebase not configured, falling back to localStorage');
      useFirebase = false;
      saveToLocalStorage(session);
      return;
    }
    throw new Error('Failed to save timer session. Please check your internet connection.');
  }
};

export const getTimerSession = async (date: string): Promise<TimerSession | null> => {
  if (!useFirebase) {
    const localData = getFromLocalStorage();
    return localData[date] || null;
  }
  
  try {
    const docRef = doc(db, COLLECTION_NAME, date);
    const docSnap = await getDocs(query(collection(db, COLLECTION_NAME), where('date', '==', date)));
    
    if (!docSnap.empty) {
      const data = docSnap.docs[0].data();
      return {
        date: data.date,
        deepWork: data.deepWork || 0,
        shallowWork: data.shallowWork || 0,
        totalTime: data.totalTime || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting timer session:', error);
    console.warn('Firebase error, falling back to localStorage');
    useFirebase = false;
    const localData = getFromLocalStorage();
    return localData[date] || null;
  }
};

export const getAllTimerSessions = async (): Promise<TimerData> => {
  if (!useFirebase) {
    return getAllFromLocalStorage();
  }
  
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const timerData: TimerData = {};
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
    console.error('Error getting all timer sessions:', error);
    console.warn('Firebase error, falling back to localStorage');
    useFirebase = false;
    return getAllFromLocalStorage();
  }
};

export const updateTimerSession = async (
  date: string, 
  deepWork: number, 
  shallowWork: number
): Promise<void> => {
  try {
    if (!useFirebase) {
      updateLocalStorage(date, deepWork, shallowWork);
      return;
    }
    
    const totalTime = deepWork + shallowWork;
    const session: TimerSession = {
      date,
      deepWork,
      shallowWork,
      totalTime
    };
    
    await saveTimerSession(session);
  } catch (error) {
    console.error('Error updating timer session:', error);
    if (error instanceof Error && error.message.includes('Firebase')) {
      console.warn('Firebase error, falling back to localStorage');
      useFirebase = false;
      updateLocalStorage(date, deepWork, shallowWork);
      return;
    }
    throw new Error('Failed to update timer session');
  }
};