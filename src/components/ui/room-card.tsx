'use client';

import { MapPin, Users, Clock, Wifi, Monitor, Mic } from 'lucide-react';
import type { Room } from '@/types';

interface RoomCardProps {
  room: Room;
  onSelect: (room: Room) => void;
}

const gradients = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-amber-500',
  'from-indigo-500 to-purple-500',
  'from-teal-500 to-green-500',
];

function getGradient(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export function RoomCard({ room, onSelect }: RoomCardProps) {
  const gradient = getGradient(room.id);

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-transparent">
      {/* Gradient Header */}
      <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {room.name}
            </h3>
            <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {room.roomType.name}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md opacity-80 group-hover:opacity-100 transition-opacity`}>
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{room.location.name}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>Capacity: <strong className="text-gray-900">{room.capacity}</strong> people</span>
          </div>
          {room.timeSlots.length > 0 && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{room.timeSlots[0].startTime} - {room.timeSlots[0].endTime}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {room.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {room.description}
          </p>
        )}

        {/* Action Button */}
        <button
          onClick={() => onSelect(room)}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-white bg-gradient-to-r ${gradient} hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform group-hover:scale-[1.02]`}
        >
          Request Booking
        </button>
      </div>
    </div>
  );
}

export function RoomCardCompact({ room, onSelect }: RoomCardProps) {
  const gradient = getGradient(room.id);

  return (
    <div
      onClick={() => onSelect(room)}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 border border-gray-100 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {room.name}
          </h4>
          <p className="text-sm text-gray-500 truncate">
            {room.location.name} • {room.capacity} people
          </p>
        </div>
        <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          →
        </div>
      </div>
    </div>
  );
}
