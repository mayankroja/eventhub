'use client';

import useSWR from 'swr';
import api from '../api';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import EventCard from '../components/event-card';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function EventsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const { data: events, error, isLoading } = useSWR('/events', (url) =>
    api.get(url).then((res) => res.data)
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) return <div className="text-center py-10 text-red-500">Failed to load events.</div>;

  // Filter upcoming events (date >= now) and sort by date ascending
  const now = new Date();
  const upcomingEvents = (events || [])
    .filter((event: any) => new Date(event.date) >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Apply search filter
  const filteredEvents = upcomingEvents.filter((event: any) =>
    event.title.toLowerCase().includes(search.toLowerCase()) ||
    event.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Upcoming Events</h1>
        {user?.role === 'ORGANIZER' && (
          <Link
            href="/events/create"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
          >
            + Create Event
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search events by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {filteredEvents.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No upcoming events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event: any) => (
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