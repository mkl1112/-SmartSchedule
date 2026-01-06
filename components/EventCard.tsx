
import React from 'react';
import { ScheduleEvent } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { MapPin, Users, Info } from 'lucide-react';

interface EventCardProps {
  event: ScheduleEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="flex flex-col md:flex-row items-start py-5 border-b border-slate-200 last:border-0 hover:bg-blue-50/30 transition-colors px-4 md:px-6">
      <div className="w-full md:w-32 flex-shrink-0 mb-2 md:mb-0">
        <div className="flex items-baseline gap-2 md:flex-col md:gap-0">
          <span className="text-blue-800 font-extrabold text-base">
            {event.start_time}
          </span>
          {event.end_time && (
            <span className="text-slate-400 text-xs font-medium">
              — {event.end_time}
            </span>
          )}
        </div>
        <div className="mt-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${CATEGORY_COLORS[event.category]}`}>
            {event.category}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <h4 className="text-slate-900 font-bold text-base leading-snug">
          {event.title}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
          <div className="flex items-start gap-2 text-slate-600">
            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="leading-tight">
              <span className="font-bold text-slate-700 mr-1">Địa điểm:</span>
              {event.location || 'Đang cập nhật'}
            </div>
          </div>

          {event.participants && event.participants.length > 0 && (
            <div className="flex items-start gap-2 text-slate-600 sm:col-span-2 lg:col-span-1">
              <Users className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="leading-tight">
                <span className="font-bold text-slate-700 mr-1">Thành phần:</span>
                {event.participants.join(', ')}
              </div>
            </div>
          )}

          {event.description && (
            <div className="flex items-start gap-2 text-slate-500 italic sm:col-span-2">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="leading-tight">
                {event.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
