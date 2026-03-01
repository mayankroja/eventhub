'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ORGANIZER')) {
      router.push('/events');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: EventForm) => {
    try {
      const res = await api.post('/events', data);
      toast.success('Event created successfully!');
      router.push(`/events/${res.data.id}`);
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Failed to create event');
      toast.error('Failed to create event');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!user || user.role !== 'ORGANIZER') return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Event</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              {...register('title', { required: 'Title is required', maxLength: 100 })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Tech Conference 2025"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description', { required: 'Description is required', maxLength: 500 })}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe your event..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              {...register('date', { required: 'Date is required' })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              {...register('location', { required: 'Location is required', maxLength: 200 })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Connaught Place, Delhi"
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              {...register('capacity', { required: 'Capacity is required', min: { value: 1, message: 'Minimum capacity is 1' } })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., 100"
            />
            {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity.message}</p>}
          </div>

          {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}