import Link from 'next/link';
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  capacity: number;
  registeredCount: number;
}

export default function EventCard({
  id,
  title,
  date,
  location,
  capacity,
  registeredCount,
}: EventCardProps) {
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
            <span>{available} / {capacity} seats available</span>
          </div>
        </div>

        <Link
          href={`/events/${id}`}
          className="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}