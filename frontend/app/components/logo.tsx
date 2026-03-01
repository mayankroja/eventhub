import Link from 'next/link';
import { CalendarIcon } from '@heroicons/react/24/solid';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
        <CalendarIcon className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-bold text-gray-900 tracking-tight">
        EventHub
      </span>
    </Link>
  );
}