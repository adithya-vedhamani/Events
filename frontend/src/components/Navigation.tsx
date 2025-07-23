'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, User, LogOut, Home, Calendar, Settings, Building, Users, Sparkles } from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'consumer' | 'brand_owner' | 'staff';
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const updateUser = () => {
      const userData = localStorage.getItem('user');
      setUser(userData ? JSON.parse(userData) : null);
    };
    window.addEventListener('userChanged', updateUser);
    window.addEventListener('storage', updateUser);
    updateUser();
    return () => {
      window.removeEventListener('userChanged', updateUser);
      window.removeEventListener('storage', updateUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userChanged'));
    setUser(null);
    router.push('/login');
  };

  const getNavLinks = () => {
    if (!user) return [
      { href: '/', label: 'Browse Events', icon: Home },
    ];
    switch (user.role) {
      case 'consumer':
        return [
          { href: '/dashboard/consumer', label: 'My Bookings', icon: Calendar },
          { href: '/', label: 'Browse Events', icon: Home },
        ];
      case 'brand_owner':
        return [
          { href: '/dashboard/brand-owner', label: 'My Events', icon: Building },
          { href: '/dashboard/brand-owner/reservations', label: 'Reservations', icon: Calendar },
          { href: '/dashboard/brand-owner/analytics', label: 'Analytics', icon: Settings },
        ];
      case 'staff':
        return [
          { href: '/dashboard/staff', label: 'Daily Reservations', icon: Users },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <Sparkles className="h-8 w-8 text-purple-400 mr-3" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Events
              </h3>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-base transition-colors duration-200 font-blinker
                    ${isActive
                      ? 'bg-[#ede9fe] text-[#8b55ff] font-bold'
                      : 'bg-transparent text-[#8b55ff] hover:text-[#7c3aed] font-normal'}
                  `}
                  style={{ boxShadow: 'none' }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {/* Login Button (rightmost) */}
            {!user && (
              <Link
                href="/login"
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-normal text-[#8b55ff] hover:text-[#7c3aed] bg-transparent transition-colors duration-200 font-blinker ${pathname === '/login' ? 'bg-[#ede9fe] font-bold' : ''}`}
                style={{ boxShadow: 'none' }}
              >
                <User className="h-5 w-5" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <div className="text-sm text-gray-700">
                    Welcome, {user.firstName}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:block">Logout</span>
                </button>
              </div>
            ) : null}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-gray-900"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden flex flex-col items-center gap-2 pb-4 bg-slate-50">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-base transition-colors duration-200 font-blinker
                  ${isActive
                    ? 'bg-[#ede9fe] text-[#8b55ff] font-bold'
                    : 'bg-transparent text-[#8b55ff] hover:text-[#7c3aed] font-normal'}
                `}
                style={{ boxShadow: 'none' }}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          {!user && (
            <Link
              href="/login"
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-normal text-[#8b55ff] hover:text-[#7c3aed] bg-transparent transition-colors duration-200 font-blinker ${pathname === '/login' ? 'bg-[#ede9fe] font-bold' : ''}`}
              style={{ boxShadow: 'none' }}
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-5 w-5" />
              <span>Login</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
} 