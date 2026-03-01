// frontend/components/organizer-event-card.tsx
'use client';

import Link from 'next/link';
import { CalendarIcon, MapPinIcon, UserGroupIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface OrganizerEventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  capacity: number;
  registeredCount: number;
  onDelete?: (id: string) => void;
}

export default function OrganizerEventCard({
  id,
  title,
  date,
  location,
  capacity,
  registeredCount,
  onDelete,
}: OrganizerEventCardProps) {
  const available = capacity - registeredCount;
  const eventDate = new Date(date);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
      <div className="p-5">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 line-clamp-1">{title}</h3>

        <div className="space-y-2 text-gray-600 text-sm mb-4">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-indigo-500" />
            <span>{eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2 text-indigo-500" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-2 text-indigo-500" />
            <span>{registeredCount} / {capacity} registered</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link
            href={`/events/${id}`}
            className="flex-1 text-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
          >
            View
          </Link>
          <Link
            href={`/events/${id}/edit`}
            className="flex-1 text-center bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition font-medium text-sm flex items-center justify-center"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm flex items-center justify-center"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
 );
}