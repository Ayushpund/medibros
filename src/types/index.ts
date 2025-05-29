
export interface User {
  id: string;
  name: string;
  email?: string; // Email is optional
  registeredAt: string; // ISO string
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export interface VitalSigns {
  heartRate?: string; 
  bloodPressureSystolic?: string;
  bloodPressureDiastolic?: string;
  temperature?: string;
  bloodSugar?: string;
  oxygenSaturation?: string;
}

export interface Habits {
  sleep: string;
  exercise: string;
  diet: string;
  mood: string;
}

export interface HealthLogEntry {
  id: string;
  dateTime: string; // ISO string
  vitalSigns: VitalSigns;
  symptoms: string;
  medications: Medication[];
  habits: Habits;
  notes?: string;
}
