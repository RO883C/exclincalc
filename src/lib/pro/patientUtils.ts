// Patient utility functions for pro version

export interface PatientRecord {
  id: string;
  doctor_id: string;
  full_name: string;
  date_of_birth: string | null;
  sex: "M" | "F" | "Other" | null;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function formatPatientDisplay(patient: PatientRecord): string {
  const age = calculateAge(patient.date_of_birth);
  const sex = patient.sex === "M" ? "男" : patient.sex === "F" ? "女" : "";
  const parts = [patient.full_name];
  if (age !== null) parts.push(`${age}歲`);
  if (sex) parts.push(sex);
  return parts.join(" · ");
}

export function maskIdNumber(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 4) return "****";
  return id.slice(0, 3) + "*".repeat(id.length - 6) + id.slice(-3);
}

export function getAgeGroup(age: number | null): string {
  if (age === null) return "未知";
  if (age < 18) return "未成年";
  if (age < 40) return "青壯年";
  if (age < 60) return "中年";
  if (age < 75) return "老年前期";
  return "老年";
}

export function formatBloodType(bt: string | null): string {
  return bt || "未知";
}
