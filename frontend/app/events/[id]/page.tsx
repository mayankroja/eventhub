'use client';

import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSocket } from '@/app/socket';
import toast from 'react-hot-toast';
import { CalendarIcon, MapPinIcon, UserGroupIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSWRConfig } from 'swr';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { mutate } = useSWRConfig(); // to mutate other keys
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const { availableSeats: liveSeats } = useSocket(id as string);

  // Fetch event details
  const {
    data: event,
    error,
    isLoading,
    mutate: mutateEvent,
  } = useSWR(id ? `/events/${id}` : null, (url) => api.get(url).then((res) => res.data));

  // Fetch user's registrations to check if registered for this event
  const { data: userRegistrations, mutate: mutateRegistrations } = useSWR(
    user ? '/registrations/me' : null,
    (url) => api.get(url).then((res) => res.data)
  );

  useEffect(() => {
  if (userRegistrations && event) {
    const reg = userRegistrations.find(
      (r: any) => r.event.id === event.id && r.status === 'CONFIRMED'
    );
    if (reg) {
      setIsRegistered(true);
      setRegistrationId(reg.id);
    } else {
      setIsRegistered(false);
      setRegistrationId(null);
    }
  }
}, [userRegistrations, event]);

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      setRegistering(true);
      await api.post('/registrations', { eventId: id });
      toast.success('Successfully registered!');
      mutateEvent(); // refresh event
      mutateRegistrations(); // refresh user registrations
      mutate('/events'); // refresh events list (for seat counts on cards)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!registrationId) return;
    if (!confirm('Are you sure you want to cancel your registration?')) return;
    try {
      setCancelling(true);
      await api.delete(`/registrations/${registrationId}`);
      toast.success('Registration cancelled');
      mutateEvent();
      mutateRegistrations();
      mutate('/events'); // refresh events list
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
    return;
  }
  try {
    await api.delete(`/events/${id}`);
    toast.success('Event deleted successfully');
    mutate('/events'); // refresh events list
    router.push('/events');
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to delete event');
  }
};

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) return <div className="text-center py-10 text-red-500">Event not found.</div>;

  const initialAvailableSeats = event.capacity - (event._count?.registrations || 0);
  const availableSeats = liveSeats !== null ? liveSeats : initialAvailableSeats;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Link href="/events" className="text-indigo-600 hover:underline mb-4 inline-block">
        ← Back to Events
      </Link>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Optional hero image placeholder */}
        <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        
        <div className="p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start space-x-3">
              <CalendarIcon className="h-6 w-6 text-indigo-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Date & Time</p>
                <p className="text-gray-600">
                  {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  <br />
                  {new Date(event.date).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPinIcon className="h-6 w-6 text-indigo-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Location</p>
                <p className="text-gray-600">{event.location}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <UserGroupIcon className="h-6 w-6 text-indigo-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Capacity</p>
                <p className="text-gray-600">{event.capacity} attendees</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-6 w-6 flex-shrink-0" /> {/* spacing */}
              <div>
                <p className="font-medium text-gray-700">Available Seats</p>
                <p className={`text-xl font-bold ${availableSeats === 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {availableSeats} left
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">About this event</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>

          <div className="mt-6 flex items-center text-sm text-gray-500">
            <span>Organized by {event.organizer?.name || event.organizer?.email}</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {/* Organizer actions */}
            {user?.role === 'ORGANIZER' && user.userId === event.organizerId && (
              <>
                <button
                  onClick={() => router.push(`/events/${id}/edit`)}
                  className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Event
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Delete Event
                </button>
              </>
            )}

            {/* Registration / Cancel button */}
            {user ? (
              isRegistered ? (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Registration'}
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering || availableSeats === 0}
                  className={`inline-flex items-center px-8 py-3 rounded-lg font-medium transition ${
                    availableSeats === 0
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {registering
                    ? 'Registering...'
                    : availableSeats === 0
                    ? 'Sold Out'
                    : 'Register Now'}
                </button>
              )
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="inline-flex items-center px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Log in to Register
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}