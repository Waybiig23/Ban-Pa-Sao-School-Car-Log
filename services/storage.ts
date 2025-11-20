import { User, AppRecord, Car } from '../types';
import { MOCK_DELAY, SCHOOL_LOGO_URL as DEFAULT_LOGO_URL, GOOGLE_APPS_SCRIPT_URL } from '../constants';

// Keys for LocalStorage
const USERS_KEY = 'bps_users_v2'; 
const CARS_KEY = 'bps_cars_v2';
const CURRENT_USER_KEY = 'bps_current_user';
const LOGO_KEY = 'bps_school_logo';

// Helper to simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Robust ID generation
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try { return crypto.randomUUID(); } catch (e) {}
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
};

// --- API HELPER ---
const apiCall = async (action: string, payload: any = {}) => {
  if (!GOOGLE_APPS_SCRIPT_URL) throw new Error("Configuration Error: No Google Apps Script URL found.");

  // Use text/plain content type to avoid CORS preflight OPTIONS request issues common with GAS
  const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ action, ...payload })
  });

  const result = await response.json();
  if (result.status === 'error') throw new Error(result.message || 'API Error');
  return result;
};

export const authService = {
  register: async (user: Omit<User, 'id'>): Promise<User> => {
    await delay(MOCK_DELAY);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: User) => u.username === user.username)) {
      throw new Error('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว (Username already exists)');
    }
    const newUser: User = { ...user, id: generateId() };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
  },

  login: async (username: string, password: string): Promise<User> => {
    await delay(MOCK_DELAY);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.username === username && u.password === password);
    if (!user) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (Invalid credentials)');
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: async () => { localStorage.removeItem(CURRENT_USER_KEY); },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
};

export const dataService = {
  saveRecord: async (record: Omit<AppRecord, 'id' | 'timestamp'>): Promise<AppRecord> => {
    // If URL is present, use Cloud
    if (GOOGLE_APPS_SCRIPT_URL) {
        const newId = generateId();
        const timestamp = Date.now();
        const recordWithId = { ...record, id: newId, timestamp };
        
        const response = await apiCall('save', { data: recordWithId });
        return { ...recordWithId, id: response.id || newId } as AppRecord; // Use ID from server if provided
    }

    // Fallback Offline
    await delay(MOCK_DELAY);
    const records = JSON.parse(localStorage.getItem('bps_records_v2') || '[]');
    const newRecord = {
      ...record,
      id: generateId(),
      timestamp: Date.now(),
      lastModifiedBy: record.lastModifiedBy || record.driverName,
      lastModifiedRole: record.lastModifiedRole || 'USER',
      lastModifiedAt: new Date().toISOString()
    } as AppRecord;
    records.unshift(newRecord);
    localStorage.setItem('bps_records_v2', JSON.stringify(records));
    return newRecord;
  },

  getRecords: async (): Promise<AppRecord[]> => {
    if (GOOGLE_APPS_SCRIPT_URL) {
        try {
            const response = await apiCall('get');
            return response.data || [];
        } catch (e) {
            console.error("Fetch error:", e);
            // Don't throw blocking error, maybe return empty or cached
            return [];
        }
    }
    await delay(MOCK_DELAY);
    return JSON.parse(localStorage.getItem('bps_records_v2') || '[]');
  },

  updateRecord: async (updatedRecord: AppRecord): Promise<void> => {
    if (GOOGLE_APPS_SCRIPT_URL) {
        // GAS usually supports Append or Delete. To update: Delete Old + Save New
        // We preserve the original ID to keep consistency
        await apiCall('delete', { id: updatedRecord.id });
        await apiCall('save', { data: updatedRecord });
        return;
    }

    await delay(MOCK_DELAY);
    const records = JSON.parse(localStorage.getItem('bps_records_v2') || '[]');
    const index = records.findIndex((r: AppRecord) => r.id === updatedRecord.id);
    if (index !== -1) {
      records[index] = { ...updatedRecord, timestamp: records[index].timestamp || Date.now() };
      localStorage.setItem('bps_records_v2', JSON.stringify(records));
    } else {
        throw new Error("Record not found");
    }
  },

  deleteRecord: async (id: string): Promise<void> => {
    if (GOOGLE_APPS_SCRIPT_URL) {
        await apiCall('delete', { id });
        return;
    }

    await delay(MOCK_DELAY);
    let records = JSON.parse(localStorage.getItem('bps_records_v2') || '[]');
    records = records.filter((r: AppRecord) => r.id !== id);
    localStorage.setItem('bps_records_v2', JSON.stringify(records));
  }
};

export const carService = {
  getCars: async (): Promise<Car[]> => {
    await delay(MOCK_DELAY / 2);
    const stored = localStorage.getItem(CARS_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  addCar: async (carData: Omit<Car, 'id'>): Promise<Car> => {
    await delay(MOCK_DELAY);
    const cars = JSON.parse(localStorage.getItem(CARS_KEY) || '[]');
    const newCar = { ...carData, id: generateId() };
    cars.push(newCar);
    localStorage.setItem(CARS_KEY, JSON.stringify(cars));
    return newCar;
  },
  updateCar: async (updatedCar: Car): Promise<void> => {
    await delay(MOCK_DELAY);
    const cars = JSON.parse(localStorage.getItem(CARS_KEY) || '[]');
    const index = cars.findIndex((c: Car) => c.id === updatedCar.id);
    if (index !== -1) {
      cars[index] = updatedCar;
      localStorage.setItem(CARS_KEY, JSON.stringify(cars));
    }
  },
  deleteCar: async (id: string): Promise<void> => {
    await delay(MOCK_DELAY);
    let cars = JSON.parse(localStorage.getItem(CARS_KEY) || '[]');
    cars = cars.filter((c: Car) => c.id !== id);
    localStorage.setItem(CARS_KEY, JSON.stringify(cars));
  }
};

export const adminService = {
  getAllUsers: async (): Promise<User[]> => {
    await delay(MOCK_DELAY);
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },
  createUser: async (userData: Omit<User, 'id'>): Promise<User> => {
      await delay(MOCK_DELAY);
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      if (users.find((u: User) => u.username === userData.username)) {
        throw new Error('Username already exists');
      }
      const newUser = { ...userData, id: generateId() };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return newUser;
  },
  updateUser: async (updatedUser: User): Promise<void> => {
    await delay(MOCK_DELAY);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },
  deleteUser: async (userId: string): Promise<void> => {
    await delay(MOCK_DELAY);
    let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    users = users.filter((u: User) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  getSchoolLogo: (): string => { return localStorage.getItem(LOGO_KEY) || DEFAULT_LOGO_URL || ''; },
  setSchoolLogo: (base64Data: string) => { localStorage.setItem(LOGO_KEY, base64Data); }
};
