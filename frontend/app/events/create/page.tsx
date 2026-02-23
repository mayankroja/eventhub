// frontend/app/events/create/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

type EventForm = {
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
};

export default function CreateEventPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<EventForm>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [serverError, setServerError] = useState('');

  // Redirect if not organizer
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ORGANIZER')) {
      router.push('/events');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: EventForm) => {
    try {
      const res = await api.post('/events', data);
      router.push(`/events/${res.data.id}`);
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Failed to create event');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'ORGANIZER') return null; // will redirect

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">Create New Event</h1>
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

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Create Event
        </button>
      </form>
    </div>
  );
}