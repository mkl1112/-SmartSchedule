
import { ScheduleEvent } from "../types";
import { MOCK_EVENTS } from "../constants";

const STORAGE_KEY = 'smart_schedule_data';

export const storageService = {
  getEvents: (): ScheduleEvent[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_EVENTS));
      return MOCK_EVENTS;
    }
    return JSON.parse(data);
  },

  saveEvent: (event: ScheduleEvent) => {
    const events = storageService.getEvents();
    const index = events.findIndex(e => e.id === event.id);
    if (index > -1) {
      events[index] = event;
    } else {
      events.push({ ...event, id: Date.now().toString() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return events;
  },

  deleteEvent: (id: string) => {
    const events = storageService.getEvents();
    const filtered = events.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  }
};
