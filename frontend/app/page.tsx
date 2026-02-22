import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-5xl font-bold mb-4">Welcome to EventHub</h1>
      <p className="text-xl text-gray-600 mb-8">
        Discover and register for amazing events near you.
      </p>
      <div className="space-x-4">
        <Link
          href="/register"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300"
        >
          Login
        </Link>
      </div>
    </div>
  );
}