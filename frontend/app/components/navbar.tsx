// frontend/app/components/navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  if (loading) return <div className="bg-gray-800 text-white p-4">Loading...</div>;

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Events', href: '/events' }, // 👈 new link
    ...(!user
      ? [
          { name: 'Login', href: '/login' },
          { name: 'Register', href: '/register' },
        ]
      : [{ name: 'Dashboard', href: '/dashboard' }]),
  ];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          EventHub
        </Link>
        <div className="space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`hover:text-gray-300 ${
                pathname === item.href ? 'underline' : ''
              }`}
            >
              {item.name}
            </Link>
          ))}
          {user && (
            <button onClick={logout} className="hover:text-gray-300">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}