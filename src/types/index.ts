export type UserRole = 'patient' | 'staff' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export type CounterStatus = 'open' | 'closed' | 'busy';

export interface Counter {
  id: string;
  department_id: string;
  name: string;
  staff_id?: string;
  staff_name?: string; // Prefix with "St." e.g. "St. Sarah Watson"
  doctor_name?: string; // Prefix with "Dr." e.g. "Dr. Robert Sterling"
  status: CounterStatus;
  current_serving: number;
  avg_service_minutes: number;
  created_at: string;
}

export type TokenStatus = 'waiting' | 'called' | 'serving' | 'served' | 'no_show';

export type TokenPriority = 'emergency' | 'high' | 'normal';

export interface Token {
  id: string;
  counter_id: string;
  department_id: string;
  user_id: string;
  token_number: number;
  status: TokenStatus;
  position_in_queue: number;
  estimated_wait_minutes: number;
  joined_at: string;
  served_at?: string;
  actual_wait_minutes?: number;
  custom_department?: string;
  patient_name?: string; // Regular name without St./Dr. e.g. "Arthur Pendelton"
  patient_email?: string;
  doctor_name?: string; // Assigned doctor e.g. "Dr. Robert Sterling"
  staff_name?: string; // Assigned staff e.g. "St. Sarah Watson"
  priority?: TokenPriority; // 'emergency' prioritized at front of line
  triage_reason?: string; // e.g. "Acute Chest Pain", "Severe Trauma"
  is_emergency?: boolean;
}

export interface Feedback {
  id: string;
  token_id: string;
  user_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
}

export type CrowdLevel = 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface AnalyticsRecord {
  id: string;
  department_id: string;
  date: string;
  hour_of_day: number; // 0-23
  total_tokens: number;
  avg_wait_minutes: number;
  peak_crowd_level: CrowdLevel;
  created_at: string;
}

export type NotificationType = 'queue_update' | 'alert' | 'system';

export interface NotificationItem {
  id: string;
  user_id: string;
  token_id?: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface CrowdPrediction {
  hour: number;
  hourLabel: string;
  predicted_crowd: number;
  multiplier: number;
  level: CrowdLevel;
}

export interface QueueSummary {
  departmentId: string;
  departmentName: string;
  icon: string;
  activeTokensCount: number;
  servingTokenNumber: number;
  avgWaitMinutes: number;
  crowdLevel: CrowdLevel;
  crowdColor: string;
  openCountersCount: number;
}
