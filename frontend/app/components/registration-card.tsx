'use client';

import Link from 'next/link';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface RegistrationCardProps {
  registration: {
    id: string;
    status: string;
    event: {
      id: string;
      title: string;
      date: string;
      location: string;
    };
  };
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
  past?: boolean;
}

export default function RegistrationCard({
  registration,
  onCancel,
  isCancelling,
  past = false,
}: RegistrationCardProps) {
  const { event } = registration;
  const eventDate = new Date(event.date);

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow transition bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href={`/events/${event.id}`} className="text-xl font-semibold text-indigo-600 hover:underline">
            {event.title}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString()}
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {event.location}
            </div>
          </div>
        </div>
        {!past && onCancel && (
          <button
            onClick={() => onCancel(registration.id)}
            disabled={isCancelling}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
        {past && (
          <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
            Past
          </span>
        )}
      </div>
    </div>
  );
}