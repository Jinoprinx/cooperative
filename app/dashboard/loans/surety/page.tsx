'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loan } from '@/app/types';

export default function SuretyPage() {
  const [requests, setRequests] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSuretyRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/surety-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRequests(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching surety requests:', error);
        setError('Failed to load surety requests. Please try again.');
        setLoading(false);
      }
    };
    fetchSuretyRequests();
  }, [router]);

  const handleResponse = async (loanId: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}/surety-response`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Request ${status} successfully!`);
      setRequests(requests.filter(req => req._id !== loanId));
    } catch (error) {
      console.error('Error responding to surety request:', error);
      alert('Failed to respond to the request. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Surety Requests</h1>
      {requests.length === 0 ? (
        <p>You have no pending surety requests.</p>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <ul className="divide-y divide-gray-200">
            {requests.map(request => (
              <li key={request._id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium">
                    {request.user ? `${request.user.firstName} ${request.user.lastName}` : 'Unknown User'}
                  </p>
                  <p className="text-gray-500">Wants you to be a surety for a loan of {request.amount}</p>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleResponse(request._id, 'approved')} className="btn btn-success">Approve</button>
                  <button onClick={() => handleResponse(request._id, 'rejected')} className="btn btn-danger">Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
