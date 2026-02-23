'use client';

import { useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import api from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';

type EventForm = {
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
};

export default function EditEventPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [serverError, setServerError] = useState('');

  const { data: event, error, isLoading } = useSWR(
    id ? `/events/${id}` : null,
    (url) => api.get(url).then((res) => res.data)
  );

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EventForm>();

  // Pre-fill form when event data is loaded
  useEffect(() => {
    if (event) {
      setValue('title', event.title);
      setValue('description', event.description);
      // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
      const date = new Date(event.date);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setValue('date', localDate);
      setValue('location', event.location);
      setValue('capacity', event.capacity);
    }
  }, [event, setValue]);

  // Redirect if not organizer or not the owner
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ORGANIZER' || (event && user.userId !== event.organizerId))) {
      router.push(`/events/${id}`);
    }
  }, [user, loading, event, id, router]);

  const onSubmit = async (data: EventForm) => {
    try {
      await api.patch(`/events/${id}`, data);
      router.push(`/events/${id}`);
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Failed to update event');
    }
  };

  if (isLoading || loading) return <div>Loading...</div>;
  if (error) return <div>Failed to load event</div>;
  if (!user || user.role !== 'ORGANIZER' || user.userId !== event?.organizerId) return null; // will redirect

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">Edit Event</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1">Title</label>
          <input
            type="text"
            {...register('title', { required: 'Title is required', maxLength: 100 })}
            className="w-full border rounded-lg px-4 py-2"
          />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <textarea
            {...register('description', { required: 'Description is required', maxLength: 500 })}
            rows={4}
            className="w-full border rounded-lg px-4 py-2"
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block mb-1">Date & Time</label>
          <input
            type="datetime-local"
            {...register('date', { required: 'Date is required' })}
            className="w-full border rounded-lg px-4 py-2"
          />
          {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
        </div>

        <div>
          <label className="block mb-1">Location</label>
          <input
            type="text"
            {...register('location', { required: 'Location is required', maxLength: 200 })}
            className="w-full border rounded-lg px-4 py-2"
          />
          {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
        </div>

        <div>
          <label className="block mb-1">Capacity</label>
          <input
            type="number"
            {...register('capacity', { required: 'Capacity is required', min: 1 })}
            className="w-full border rounded-lg px-4 py-2"
          />
          {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity.message}</p>}
        </div>

        {serverError && <p className="text-red-500">{serverError}</p>}

        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Update Event
          </button>
          <button
            type="button"
            onClick={() => router.push(`/events/${id}`)}
            className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
