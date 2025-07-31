import Link from 'next/link';
import { FaUsers, FaMoneyBillWave, FaChartLine, FaHandshake } from 'react-icons/fa';
import Navbar from '@/app/components/Navbar'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black">
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero section */}
        <section className="relative h-screen w-full">
          <video
            autoPlay
            muted
            loop
            className="absolute top-0 left-0 z-0 h-full w-full object-cover"
          >
            <source src="/video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute top-0 left-0 z-10 h-full w-full bg-black opacity-60"></div>
          <div className="relative z-20 flex h-full flex-col items-center justify-center text-white">
            <div className="container mx-auto px-4 text-center">
              <h1 className="mb-4 text-5xl font-extrabold md:text-7xl">
                Financial Freedom Starts Here
              </h1>
              <p className="mb-8 text-xl md:text-2xl">
                Join our cooperative and unlock a world of financial opportunities.
              </p>
              <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
                <Link
                  href="/auth/login"
                  className="btn btn-primary rounded-full px-8 py-3 text-lg font-bold shadow-lg transition-transform hover:scale-105"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="btn btn-secondary rounded-full px-8 py-3 text-lg font-bold shadow-lg transition-transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="w-full bg-gray-900 py-20 text-white">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-4xl font-extrabold md:text-5xl">
              Features & Benefits
            </h2>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
              <div className="card transform rounded-lg bg-gray-800 p-8 text-center shadow-lg transition-transform hover:scale-105">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white">
                  <FaUsers className="h-10 w-10" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">Member Management</h3>
                <p className="mt-4 text-gray-300">
                  Efficiently manage member accounts, profiles, and enrollment processes.
                </p>
              </div>

              <div className="card transform rounded-lg bg-gray-800 p-8 text-center shadow-lg transition-transform hover:scale-105">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white">
                  <FaMoneyBillWave className="h-10 w-10" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">Financial Tracking</h3>
                <p className="mt-4 text-gray-300">
                  Track account balances, deposits, withdrawals, and transaction history.
                </p>
              </div>

              <div className="card transform rounded-lg bg-gray-800 p-8 text-center shadow-lg transition-transform hover:scale-105">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white">
                  <FaHandshake className="h-10 w-10" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">Loan Management</h3>
                <p className="mt-4 text-gray-300">
                  Streamline loan applications, approvals, disbursements, and repayments.
                </p>
              </div>

              <div className="card transform rounded-lg bg-gray-800 p-8 text-center shadow-lg transition-transform hover:scale-105">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white">
                  <FaChartLine className="h-10 w-10" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">Reporting & Analytics</h3>
                <p className="mt-4 text-gray-300">
                  Generate comprehensive reports for monthly and annual general meetings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="w-full bg-gray-800 py-16 text-white">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">
              How It Works
            </h2>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="card transform rounded-lg bg-gray-700 p-6 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">Register an Account</h3>
                <p className="text-gray-300">
                  Sign up for a new account with your basic details to become a member of the cooperative society.
                </p>
              </div>

              <div className="card transform rounded-lg bg-gray-700 p-6 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">Fund Your Account</h3>
                <p className="text-gray-300">
                  Connect your bank account for automatic monthly savings or make deposits directly.
                </p>
              </div>

              <div className="card transform rounded-lg bg-gray-700 p-6 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">Access Services</h3>
                <p className="text-gray-300">
                  Apply for loans, view your transaction history, and manage your cooperative membership.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-gray-900 py-8 text-white">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} Cooperative Society Management System. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}