// frontend/app/components/EventCard.tsx
import Link from 'next/link';

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

  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-md transition">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-1">
        📅 {new Date(date).toLocaleDateString()} at{' '}
        {new Date(date).toLocaleTimeString()}
      </p>
      <p className="text-gray-600 mb-1">📍 {location}</p>
      <p className="text-gray-600 mb-3">
        🎟️ {available} / {capacity} seats available
      </p>
      <Link
        href={`/events/${id}`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        View Details
      </Link>
    </div>
  );
}