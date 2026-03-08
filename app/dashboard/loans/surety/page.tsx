'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loan } from '@/app/types';

export default function SuretyPage() {
  const [requests, setRequests] = useState<Loan[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSuretyData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const [requestsRes, historyRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/surety-requests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/surety-history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setRequests(requestsRes.data);
        setHistory(historyRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching surety data:', error);
        setError('Failed to load surety requests. Please try again.');
        setLoading(false);
      }
    };
    fetchSuretyData();
  }, [router]);

  const handleResponse = async (loanId: string, status: 'approved' | 'rejected') => {
    try {
      let rejectionReason = '';

      if (status === 'rejected') {
        rejectionReason = prompt('Please provide a reason for rejecting this surety request:') || '';
        if (!rejectionReason.trim()) {
          alert('Rejection reason is required');
          return;
        }
      }

      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}/surety-response`,
        { status, rejectionReason: rejectionReason || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Request ${status} successfully!`);

      // Move from requests to history
      const respondedRequest = requests.find(req => req._id === loanId);
      setRequests(requests.filter(req => req._id !== loanId));
      if (respondedRequest) {
        setHistory([{ ...respondedRequest, myStatus: status }, ...history]);
      }
    } catch (error: any) {
      console.error('Error responding to surety request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to respond to the request. Please try again.';
      alert(errorMessage);
    }
  };

  const getMySuretyStatus = (loan: any) => {
    if (loan.myStatus) return loan.myStatus; // Fast local update
    try {
      const myId = JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '{}')).id;
      const mySuretyObj = loan.sureties?.find((s: any) => s.user === myId || (s.user && s.user._id === myId));
      return mySuretyObj?.status || 'unknown';
    } catch (e) {
      return 'unknown';
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
      <h1 className="text-2xl font-bold text-white">Surety Requests</h1>
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

      <h2 className="text-xl font-bold text-white mt-10">Surety History</h2>
      {history.length === 0 ? (
        <p>You have no past surety history.</p>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Loan Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Your Response</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {history.map((item) => {
                const status = getMySuretyStatus(item);
                return (
                  <tr key={item._id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown User'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      ₦{item.amount?.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
