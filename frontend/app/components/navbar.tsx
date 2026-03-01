'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Logo from './logo';


export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Events', href: '/events' },
  ];

  const userNavItems = user
    ? [
        { name: 'Profile', href: '/profile' },
        { name: 'Logout', onClick: logout },
      ]
    : [
        { name: 'Login', href: '/login' },
        { name: 'Register', href: '/register' },
      ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-gray-700 hover:text-indigo-600 transition ${
                  pathname === item.href ? 'text-indigo-600 font-medium' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/profile"
                  className={`text-gray-700 hover:text-indigo-600 transition ${
                    pathname === '/profile' ? 'text-indigo-600 font-medium' : ''
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-gray-700 hover:text-indigo-600 transition ${
                    pathname === '/login' ? 'text-indigo-600 font-medium' : ''
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`text-gray-700 hover:text-indigo-600 transition ${
                    pathname === '/register' ? 'text-indigo-600 font-medium' : ''
                  }`}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-gray-700 focus:outline-none"
          >
            {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={toggleMenu}
                className={`block py-2 px-3 rounded text-gray-700 hover:bg-indigo-50 ${
                  pathname === item.href ? 'bg-indigo-50 text-indigo-600 font-medium' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={toggleMenu}
                  className={`block py-2 px-3 rounded text-gray-700 hover:bg-indigo-50 ${
                    pathname === '/profile' ? 'bg-indigo-50 text-indigo-600 font-medium' : ''
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    toggleMenu();
                  }}
                  className="block w-full text-left py-2 px-3 rounded text-gray-700 hover:bg-indigo-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={toggleMenu}
                  className={`block py-2 px-3 rounded text-gray-700 hover:bg-indigo-50 ${
                    pathname === '/login' ? 'bg-indigo-50 text-indigo-600 font-medium' : ''
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={toggleMenu}
                  className={`block py-2 px-3 rounded text-gray-700 hover:bg-indigo-50 ${
                    pathname === '/register' ? 'bg-indigo-50 text-indigo-600 font-medium' : ''
                  }`}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}