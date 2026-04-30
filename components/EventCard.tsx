'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import type { FrontendEvent } from '@/types';

interface EventCardProps {
  event: FrontendEvent;
  onRegister?: () => void;
  registerLabel?: string;
  isRegistered?: boolean;
  showVolunteerButton?: boolean;
  onVolunteer?: () => void;
  isVolunteered?: boolean;
  compact?: boolean;
}

export default function EventCard({
  event,
  onRegister,
  registerLabel = 'Register',
  isRegistered = false,
  showVolunteerButton = false,
  onVolunteer,
  isVolunteered = false,
  compact = false,
}: EventCardProps) {
  const fillPercent = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className={`glass-card rounded-2xl overflow-hidden ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className={`font-semibold text-white leading-tight ${compact ? 'text-sm' : 'text-base'}`}>
          {event.title}
        </h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-blue-500/15 text-blue-400 border-blue-500/30 uppercase shrink-0">
          {event.type}
        </span>
      </div>

      {!compact && <p className="text-xs text-white/50 mb-4 line-clamp-2">{event.description}</p>}

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Calendar className="w-3.5 h-3.5 text-primary/70" />
          <span>{formatDate(event.date)}</span>
          <Clock className="w-3.5 h-3.5 text-primary/70 ml-1" />
          <span>{formatTime(event.time)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <MapPin className="w-3.5 h-3.5 text-accent/70" />
          <span className="truncate">{event.venue}</span>
        </div>
        {!compact && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Users className="w-3.5 h-3.5 text-primary/70" />
            <span>{event.registeredCount} / {event.capacity} registered</span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-white/30 mb-1">
            <span>Capacity</span>
            <span>{fillPercent}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {onRegister && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onRegister}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isRegistered
                ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                : 'btn-primary'
            }`}
          >
            {isRegistered ? 'Registered' : registerLabel}
          </motion.button>
        )}
        {showVolunteerButton && onVolunteer && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onVolunteer}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              isVolunteered
                ? 'bg-accent/20 text-accent border-accent/30'
                : 'bg-white/5 text-white/70 border-white/10 hover:bg-accent/10 hover:text-accent hover:border-accent/30'
            }`}
          >
            {isVolunteered ? 'Volunteered' : 'Volunteer'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
