// frontend/app/profile/page.tsx
'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import api from '../api';
import RegistrationCard from '../components/registration-card';
import OrganizerEventCard from '../components/organizer-event-card';
import toast from 'react-hot-toast';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Fetch user's registrations
  const {
    data: registrations,
    error: regError,
    isLoading: regLoading,
    mutate: mutateRegistrations,
  } = useSWR(user ? '/registrations/me' : null, (url) =>
    api.get(url).then((res) => res.data)
  );

  // Fetch organizer's events if user is organizer
  const {
    data: myEvents,
    error: eventsError,
    isLoading: eventsLoading,
    mutate: mutateEvents,
  } = useSWR(
    user?.role === 'ORGANIZER' ? '/events/organizer/me' : null,
    (url) => api.get(url).then((res) => res.data)
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleCancel = async (registrationId: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    setCancellingId(registrationId);
    try {
      await api.delete(`/registrations/${registrationId}`);
      toast.success('Registration cancelled successfully');
      mutateRegistrations();
      mutateEvents(); // in case it affects event counts
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    setDeletingEventId(eventId);
    try {
      await api.delete(`/events/${eventId}`);
      toast.success('Event deleted successfully');
      mutateEvents(); // refresh events list
      mutateRegistrations(); // in case any registrations were removed
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingEventId(null);
    }
  };

  if (loading || regLoading || (user?.role === 'ORGANIZER' && eventsLoading)) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const upcoming = registrations?.filter(
    (reg: any) => new Date(reg.event.date) > new Date() && reg.status === 'CONFIRMED'
  ) || [];
  const past = registrations?.filter(
    (reg: any) => new Date(reg.event.date) <= new Date()
  ) || [];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-12 h-12 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
  {user.name || user.email.split('@')[0]}
</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center mt-1 space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                user.role === 'ORGANIZER' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {user.role}
              </span>
              <span className="text-sm text-gray-500">
                Member since {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Organizer's Events Section */}
      {user.role === 'ORGANIZER' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Events</h2>
            <Link
              href="/events/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              + Create New Event
            </Link>
          </div>
          {myEvents && myEvents.length === 0 ? (
            <p className="text-gray-500">You haven't created any events yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myEvents?.map((event: any) => (
                <OrganizerEventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  date={event.date}
                  location={event.location}
                  capacity={event.capacity}
                  registeredCount={event._count?.registrations || 0}
                  onDelete={handleDeleteEvent}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4">Upcoming Registrations</h2>
      {upcoming.length === 0 ? (
        <p className="text-gray-500 mb-8">You have no upcoming registrations.</p>
      ) : (
        <div className="space-y-4 mb-8">
          {upcoming.map((reg: any) => (
            <RegistrationCard
              key={reg.id}
              registration={reg}
              onCancel={handleCancel}
              isCancelling={cancellingId === reg.id}
            />
          ))}
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4">Past Registrations</h2>
      {past.length === 0 ? (
        <p className="text-gray-500">No past registrations.</p>
      ) : (
        <div className="space-y-4">
          {past.map((reg: any) => (
            <RegistrationCard
              key={reg.id}
              registration={reg}
              past
            />
          ))}
        </div>
      )}
    </div>
  );
}