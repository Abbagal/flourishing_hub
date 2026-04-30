'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { CalendarEventItem } from '@/types';

interface MiniCalendarProps {
  eventDates?: string[];
  registeredEventDates?: string[];
  unregisteredEventDates?: string[];
  eventItems?: CalendarEventItem[];
  onDateSelect?: (date: Date) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function MiniCalendar({
  eventDates = [],
  registeredEventDates = [],
  unregisteredEventDates = [],
  eventItems = [],
  onDateSelect,
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const effectiveRegisteredDates = useMemo(
    () => registeredEventDates.length > 0 ? registeredEventDates : eventDates,
    [eventDates, registeredEventDates],
  );
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventItems.filter((item) => {
      try {
        return isSameDay(parseISO(item.date), selectedDate);
      } catch {
        return false;
      }
    });
  }, [eventItems, selectedDate]);

  const tomorrow = addDays(new Date(), 1);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const matchesDate = (values: string[], day: Date) => values.some((value) => {
    try {
      return isSameDay(parseISO(value), day);
    } catch {
      return false;
    }
  });

  const hasRegistered = (day: Date) => matchesDate(effectiveRegisteredDates, day);
  const hasUnregistered = (day: Date) => matchesDate(unregisteredEventDates, day);
  const hasTomorrowEvent = (day: Date) => isSameDay(day, tomorrow) && (hasRegistered(day) || hasUnregistered(day));

  const handleSelect = (day: Date) => {
    setSelectedDate(day);
    onDateSelect?.(day);
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <button onClick={() => setCurrentMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1))} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary/20 text-white/50 hover:text-white transition-all">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setCurrentMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1))} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary/20 text-white/50 hover:text-white transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-white/30 py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const todayFlag = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const registered = inMonth && hasRegistered(day);
          const unregistered = inMonth && hasUnregistered(day);
          const tomorrowGlow = inMonth && hasTomorrowEvent(day);

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: inMonth ? 1.1 : 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => inMonth && handleSelect(day)}
              className={`
                relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                ${!inMonth ? 'text-white/15 cursor-default' : 'cursor-pointer'}
                ${inMonth && !todayFlag && !selected ? 'text-white/70 hover:bg-white/8 hover:text-white' : ''}
                ${todayFlag && !selected ? 'text-primary font-bold' : ''}
                ${selected ? 'bg-primary text-white font-bold' : ''}
              `}
            >
              {todayFlag && !selected && <div className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/30" />}
              {tomorrowGlow && !selected && <div className="absolute inset-0 rounded-lg bg-yellow-400/10 border border-yellow-400/50 shadow-[0_0_8px_rgba(250,204,21,0.4)]" />}
              <span className="relative z-10">{format(day, 'd')}</span>
              {inMonth && (registered || unregistered) && (
                <div className="flex gap-0.5 mt-0.5 relative z-10">
                  {registered && <div className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : 'bg-primary'}`} />}
                  {unregistered && <div className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : 'bg-accent'}`} />}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {(effectiveRegisteredDates.length > 0 || unregisteredEventDates.length > 0) && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
          {effectiveRegisteredDates.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] text-white/40">{effectiveRegisteredDates.length} registered event{effectiveRegisteredDates.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {unregisteredEventDates.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-[10px] text-white/40">{unregisteredEventDates.length} upcoming event{unregisteredEventDates.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {selectedDate && (
        <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Selected Date</p>
              <p className="mt-1 text-sm font-semibold text-white">{format(selectedDate, 'dd MMM yyyy')}</p>
            </div>
            <div className="text-[11px] text-white/40">
              {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
            </div>
          </div>

          {selectedEvents.length > 0 ? (
            <div className="mt-3 space-y-2">
              {selectedEvents.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/5 bg-black/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      {item.description && <p className="mt-1 text-xs text-white/45 line-clamp-2">{item.description}</p>}
                    </div>
                    {item.status && (
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                        item.status === 'registered'
                          ? 'bg-primary/15 text-primary'
                          : item.status === 'scheduled'
                            ? 'bg-yellow-500/15 text-yellow-300'
                            : 'bg-accent/15 text-accent'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/45">
                    {item.time && <span>{item.time}</span>}
                    {item.venue && <span>{item.venue}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/45">No event details available for this date.</p>
          )}
        </div>
      )}
    </div>
  );
}
