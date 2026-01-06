
import { ScheduleEvent } from './types';

export const MOCK_EVENTS: ScheduleEvent[] = [
  {
    id: 'e1',
    title: 'Họp giao ban Thường trực UBND Thành phố',
    // Fixed property names to match ScheduleEvent interface
    start_time: '08:00',
    end_time: '11:00',
    location: 'Phòng họp số 1',
    participants: ['Lãnh đạo các Sở', 'Văn phòng UBND'],
    date: '2024-05-20',
    category: 'Họp'
  },
  {
    id: 'e2',
    title: 'Tiếp đoàn kiểm tra Bộ Kế hoạch và Đầu tư',
    // Fixed property names to match ScheduleEvent interface
    start_time: '14:00',
    end_time: '16:30',
    location: 'Phòng khách số 2',
    participants: ['Sở Kế hoạch và Đầu tư', 'Sở Tài chính'],
    date: '2024-05-20',
    category: 'Công tác'
  },
  {
    id: 'e3',
    title: 'Kiểm tra thực địa dự án đường vành đai 3',
    // Fixed property names to match ScheduleEvent interface
    start_time: '07:30',
    end_time: '11:30',
    location: 'Huyện Thới Lai',
    participants: ['Sở Giao thông Vận tải', 'Ban QLDA'],
    date: '2024-05-21',
    category: 'Công tác'
  },
  {
    id: 'e4',
    title: 'Đối thoại trực tiếp với công dân quý II',
    // Fixed property names to match ScheduleEvent interface
    start_time: '08:30',
    end_time: '11:00',
    location: 'Hội trường Ban Tiếp dân',
    participants: ['Thanh tra Thành phố', 'Sở Tư pháp'],
    date: '2024-05-22',
    category: 'Tiếp dân'
  }
];

export const CATEGORY_COLORS = {
  'Họp': 'bg-blue-100 text-blue-800 border-blue-200',
  'Công tác': 'bg-green-100 text-green-800 border-green-200',
  'Tiếp dân': 'bg-orange-100 text-orange-800 border-orange-200',
  'Khác': 'bg-gray-100 text-gray-800 border-gray-200',
};
