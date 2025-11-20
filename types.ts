
export enum RecordType {
  TRAVEL = 'TRAVEL',
  FUEL = 'FUEL',
  MAINTENANCE = 'MAINTENANCE',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  password: string; // In a real app, never store plain text
  photo?: string | null; // Profile picture (base64)
}

export interface Car {
  id: string;
  name: string; // Display name e.g. "กข 1234 (รถตู้)"
  photo?: string | null; // Car picture (base64)
}

export interface BaseRecord {
  id: string;
  type: RecordType;
  date: string; // Date of recording
  time: string; // Time of recording
  carId: string; // License plate or Car ID
  driverName: string;
  userId: string; // Who recorded it (ID)
  timestamp: number;
  
  // Audit Trail
  lastModifiedBy: string; // Name of the person who last touched this
  lastModifiedRole: 'ADMIN' | 'USER';
  lastModifiedAt: string; // ISO Date string
}

export interface TravelRecord extends BaseRecord {
  type: RecordType.TRAVEL;
  locationFrom: string;
  locationTo: string;
  
  // Replaced Odometer with Trip Dates
  tripDateStart: string;
  tripTimeStart: string;
  tripDateEnd: string;
  tripTimeEnd: string;
  
  photos: {
    before: string | null;
    arrival: string | null;
    return: string | null;
  };
  purpose: string;
}

export interface FuelRecord extends BaseRecord {
  type: RecordType.FUEL;
  amount: number;
  cost: number;
  station: string;
  photo: string | null; // Receipt or dashboard
}

export interface MaintenanceRecord extends BaseRecord {
  type: RecordType.MAINTENANCE;
  description: string;
  cost: number;
  garage: string;
  photo: string | null; // Invoice or repair photo
}

export type AppRecord = TravelRecord | FuelRecord | MaintenanceRecord;

export const ADMIN_PIN = "237280";