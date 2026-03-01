import Link from 'next/link';
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import EventCard from './components/event-card';
// import { getEvents } from './lib/api'; // We'll create a server action or fetch on client

// For simplicity, we'll fetch on client side using a client component.
// But to show preview, we can fetch a few events on the server.
export const dynamic = 'force-dynamic'; // no caching

async function getPreviewEvents() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${baseUrl}/events`, { next: { revalidate: 60 } });
    const events = await res.json();
    return events.slice(0, 3); // show only 3
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const events = await getPreviewEvents();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Discover & Join Amazing Events
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
            From tech conferences to local meetups – find your next experience on EventHub.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/events"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
            >
              Browse Events
            </Link>
            <Link
              href="/register"
              className="bg-indigo-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-900 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose EventHub?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <CalendarIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy Event Creation</h3>
              <p className="text-gray-600">Organizers can create and manage events in minutes.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <UserGroupIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real‑time Updates</h3>
              <p className="text-gray-600">Live seat availability – never miss a spot.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <MapPinIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Discover Local Events</h3>
              <p className="text-gray-600">Find events near you with location filters.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      {events.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event: any) => (
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
            <div className="text-center mt-10">
              <Link
                href="/events"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                View All Events
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}