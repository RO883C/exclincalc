// localStorage-based health data store
// Structure mirrors future Supabase schema for easy migration

export interface HealthRecord {
  id: string;
  date: string; // ISO string
  source: "manual" | "scan";
  symptoms?: string;
  aiAnalysis?: string;
  data: Partial<Record<string, number | string>>;
  // key = ReferenceItem.key, value = user-entered value
}

export interface UserProfile {
  age?: number;
  gender?: "M" | "F";
  name?: string;
}

const RECORDS_KEY = "cc-health-records";
const PROFILE_KEY = "cc-user-profile";

export function getRecords(): HealthRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecord(record: Omit<HealthRecord, "id">): HealthRecord {
  const records = getRecords();
  const newRecord: HealthRecord = {
    ...record,
    id: Date.now().toString(),
  };
  records.unshift(newRecord);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records.slice(0, 100))); // keep last 100
  return newRecord;
}

export function deleteRecord(id: string): void {
  const records = getRecords().filter((r) => r.id !== id);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
