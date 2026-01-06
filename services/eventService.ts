
import { supabase } from './supabaseClient';
import { ScheduleEvent } from '../types';

export const eventService = {
  getEvents: async (): Promise<ScheduleEvent[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true }); // Cập nhật tên cột
    
    if (error) {
      console.error('Lỗi khi lấy danh sách lịch:', error);
      return [];
    }

    const normalizedData = (data || []).map(event => ({
      ...event,
      date: event.date.split('T')[0]
    }));

    return normalizedData;
  },

  saveEvent: async (event: Partial<ScheduleEvent>) => {
    if (event.date && event.date.includes('T')) {
      event.date = event.date.split('T')[0];
    }

    const isNew = !event.id || event.id === '';
    const eventData = { ...event };
    if (isNew) {
      delete eventData.id;
    }

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('events')
          .insert([eventData])
          .select();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)
          .select();
        
        if (error) throw error;
        return data;
      }
    } catch (err: any) {
      console.error('EventService Save Error:', err);
      throw err;
    }
  },

  deleteEvent: async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
