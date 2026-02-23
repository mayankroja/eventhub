// frontend/app/events/[id]/page.tsx
'use client';

import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import Link from 'next/link';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [registering, setRegistering] = useState(false);

  const { data: event, error, isLoading, mutate } = useSWR(
    id ? `/events/${id}` : null,
    (url) => api.get(url).then((res) => res.data)
  );

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      setRegistering(true);
      await api.post('/registrations', { eventId: id });
      // Refetch event to update seat count
      mutate();
      alert('Successfully registered!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/events/${id}`);
      router.push('/events');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  if (isLoading) return <div className="text-center py-10">Loading event...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Event not found.</div>;

  const availableSeats = event.capacity - (event._count?.registrations || 0);

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/events"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Events
      </Link>

      <div className="border rounded-lg p-6 shadow">
        <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

        <div className="space-y-3 text-gray-700">
          <p>
            <span className="font-semibold">📅 Date:</span>{' '}
            {new Date(event.date).toLocaleDateString()} at{' '}
            {new Date(event.date).toLocaleTimeString()}
          </p>
          <p>
            <span className="font-semibold">📍 Location:</span> {event.location}
          </p>
          <p>
            <span className="font-semibold">👥 Capacity:</span> {event.capacity}
          </p>
          <p>
            <span className="font-semibold">🎟️ Available Seats:</span> {availableSeats}
          </p>
          <p>
            <span className="font-semibold">📝 Description:</span>
          </p>
          <p className="whitespace-pre-wrap">{event.description}</p>
          <p className="text-sm text-gray-500">
            Organized by: {event.organizer?.name || event.organizer?.email}
          </p>
        </div>

        {user && (
          <div className="mt-6">
            {user.role === 'ORGANIZER' && user.userId === event.organizerId && (
              <>
                <button
                  onClick={() => router.push(`/events/${id}/edit`)}
                  className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 mr-3"
                >
                  Edit Event
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                >
                  Delete Event
                </button>
              </>
            )}
            <button
              onClick={handleRegister}
              disabled={registering || availableSeats === 0}
              className={`px-6 py-2 rounded ${availableSeats === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {registering
                ? 'Registering...'
                : availableSeats === 0
                  ? 'Sold Out'
                  : 'Register'}
            </button>

          </div>
        )}
      </div>
    </div>
  );
}