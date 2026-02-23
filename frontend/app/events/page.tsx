// frontend/app/events/page.tsx
'use client';

import useSWR from 'swr';
import api from '../api';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import EventCard from '../components/event-card';

export default function EventsPage() {
  const { user } = useAuth();
  const { data: events, error, isLoading } = useSWR('/events', (url) =>
    api.get(url).then((res) => res.data)
  );

  if (isLoading) return <div className="text-center py-10">Loading events...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Failed to load events.</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        {user?.role === 'ORGANIZER' && (
          <Link
            href="/events/create"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + Create Event
          </Link>
        )}
      </div>

      {events?.length === 0 ? (
        <p className="text-center text-gray-500">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event: any) => (
            <EventCard
              key={event.id}
              id={event.id}
              title={event.title}
              date={event.date}
              location={event.location}
              capacity={event.capacity}
              registeredCount={event._count?.registrations || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}