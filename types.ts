
export interface ScheduleEvent {
  id: string;
  title: string;
  start_time: string; // Đổi từ startTime
  end_time: string;   // Đổi từ endTime
  location: string;
  participants: string[];
  description?: string;
  date: string; // YYYY-MM-DD
  category: 'Họp' | 'Công tác' | 'Tiếp dân' | 'Khác';
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
}
