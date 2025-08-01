'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FaHome, 
  FaHistory, 
  FaMoneyBillWave, 
  FaChartLine, 
  FaSignOutAlt, 
  FaUserCircle, 
  FaBars 
} from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout, isAuthenticated } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FaHome },
    { name: 'Transactions', href: '/dashboard/transactions', icon: FaHistory },
    { name: 'Loans', href: '/dashboard/loans', icon: FaMoneyBillWave },
    { name: 'Account', href: '/dashboard/account', icon: FaUserCircle },
  ];

  const handleSignOut = () => {
    logout();
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" 
          style={{ display: sidebarOpen ? 'block' : 'none' }}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" 
             onClick={toggleSidebar} aria-hidden="true"></div>
        
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-primary pt-5 pb-4">
          <div className="px-4">
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-white">Cooperative Society</div>
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={toggleSidebar}
              >
                <span className="sr-only">Close sidebar</span>
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-5 h-0 flex-1 overflow-y-auto">
            <nav className="space-y-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-base font-medium ${
                    pathname === item.href
                      ? 'bg-primary-dark text-white'
                      : 'text-white hover:bg-primary-light'
                  }`}
                >
                  <item.icon
                    className={`mr-4 h-6 w-6 flex-shrink-0 ${
                      pathname === item.href ? 'text-white' : 'text-white'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="group flex items-center rounded-md px-2 py-2 text-base font-medium text-white hover:bg-primary-light w-full text-left"
              >
                <FaSignOutAlt
                  className="mr-4 h-6 w-6 flex-shrink-0 text-white"
                  aria-hidden="true"
                />
                Sign out
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-primary">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex items-center justify-center px-4">
              <div className="text-xl font-bold text-white">Cooperative Society</div>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-primary-dark text-white'
                      : 'text-white hover:bg-primary-light'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 flex-shrink-0 ${
                      pathname === item.href ? 'text-white' : 'text-white'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-white hover:bg-primary-light w-full text-left"
              >
                <FaSignOutAlt
                  className="mr-3 h-6 w-6 flex-shrink-0 text-white"
                  aria-hidden="true"
                />
                Sign out
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <FaBars className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-primary">Member Dashboard</h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">Welcome {user?.firstName || 'User'}</span>
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <FaUserCircle className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
