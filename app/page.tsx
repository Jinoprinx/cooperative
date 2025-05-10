import Link from 'next/link';
import { FaUsers, FaMoneyBillWave, FaChartLine, FaHandshake } from 'react-icons/fa';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero section */}
      <section className="relative flex w-full flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-dark py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-6xl">
            Cooperative Society Management System
          </h1>
          <p className="mb-8 text-xl md:text-2xl">
            Streamline your cooperative operations with our comprehensive management solution
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
            <Link href="/auth/login" 
              className="btn btn-secondary rounded-full px-8 py-3 font-bold">
              Log In
            </Link>
            <Link href="/auth/register"
              className="btn bg-white text-primary hover:bg-gray-100 rounded-full px-8 py-3 font-bold">
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="w-full py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-primary md:text-4xl">
            Features & Benefits
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="card border border-gray-200 p-6 text-center shadow-md transition-all hover:shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                <FaUsers className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-primary">Member Management</h3>
              <p className="mt-2 text-gray-600">
                Efficiently manage member accounts, profiles, and enrollment processes
              </p>
            </div>

            <div className="card border border-gray-200 p-6 text-center shadow-md transition-all hover:shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                <FaMoneyBillWave className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-primary">Financial Tracking</h3>
              <p className="mt-2 text-gray-600">
                Track account balances, deposits, withdrawals, and transaction history
              </p>
            </div>

            <div className="card border border-gray-200 p-6 text-center shadow-md transition-all hover:shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                <FaHandshake className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-primary">Loan Management</h3>
              <p className="mt-2 text-gray-600">
                Streamline loan applications, approvals, disbursements, and repayments
              </p>
            </div>

            <div className="card border border-gray-200 p-6 text-center shadow-md transition-all hover:shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                <FaChartLine className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-primary">Reporting & Analytics</h3>
              <p className="mt-2 text-gray-600">
                Generate comprehensive reports for monthly and annual general meetings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="w-full bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-primary md:text-4xl">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card bg-white p-6 shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold text-primary">Register an Account</h3>
              <p className="text-gray-600">
                Sign up for a new account with your basic details to become a member of the cooperative society.
              </p>
            </div>

            <div className="card bg-white p-6 shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold text-primary">Fund Your Account</h3>
              <p className="text-gray-600">
                Connect your bank account for automatic monthly savings or make deposits directly.
              </p>
            </div>

            <div className="card bg-white p-6 shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold text-primary">Access Services</h3>
              <p className="text-gray-600">
                Apply for loans, view your transaction history, and manage your cooperative membership.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-primary py-8 text-white">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Cooperative Society Management System. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}