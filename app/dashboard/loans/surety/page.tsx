'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loan } from '@/app/types';
import { FaUserShield, FaCheck, FaTimes, FaHistory, FaUserCircle } from 'react-icons/fa';

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
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
          <p className="text-tertiary-text">Synchronizing Surety Requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 text-primary-text max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Security Protocol</span>
          <h1 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
            Surety <span className="text-tertiary-text">Verification</span>
          </h1>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
             <FaUserShield className="text-primary h-5 w-5" />
             <h2 className="text-xl font-black tracking-tighter uppercase">Inbound Requests</h2>
          </div>
          
          {requests.length === 0 ? (
            <div className="card-premium p-12 text-center bg-surface border-dashed border-border flex flex-col items-center">
              <p className="text-tertiary-text text-[10px] font-black uppercase tracking-[0.4em] italic mb-2">No pending verification cycles</p>
              <p className="text-sm font-medium text-secondary-text">You have no active requests requiring your authentication.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {requests.map(request => (
                <div key={request._id} className="card-premium bg-surface border-border p-6 flex flex-col justify-between group hover:border-primary/30 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <FaUserCircle className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="font-black text-lg text-primary-text tracking-tighter leading-none mb-1">
                          {request.user ? `${request.user.firstName} ${request.user.lastName}` : 'Unknown Applicant'}
                        </p>
                        <p className="text-[10px] font-black text-tertiary-text uppercase tracking-widest">Protocol Identification</p>
                     </div>
                  </div>
                  
                  <div className="bg-surface-lighter rounded-2xl p-4 border border-border mb-6">
                     <p className="text-[10px] font-black text-tertiary-text uppercase tracking-widest mb-1 leading-none text-center">Value Endorsement</p>
                     <p className="text-2xl font-black text-primary-text text-center tracking-tighter">₦{request.amount?.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleResponse(request._id, 'approved')} 
                      className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      <FaCheck className="h-3 w-3" /> Authenticate
                    </button>
                    <button 
                      onClick={() => handleResponse(request._id, 'rejected')} 
                      className="flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      <FaTimes className="h-3 w-3" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pt-10">
          <div className="flex items-center gap-3 mb-6">
             <FaHistory className="text-primary h-5 w-5" />
             <h2 className="text-xl font-black tracking-tighter uppercase">Historical Archive</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="card-premium p-12 text-center bg-surface border-border">
              <p className="text-tertiary-text text-[10px] font-black uppercase tracking-widest">No past endorsements in registry</p>
            </div>
          ) : (
            <div className="card-premium p-0 overflow-hidden bg-surface border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-lighter">
                    <th className="px-8 py-5 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Applicant</th>
                    <th className="px-8 py-5 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Endorsed Value</th>
                    <th className="px-8 py-5 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Identity Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((item) => {
                    const status = getMySuretyStatus(item);
                    return (
                      <tr key={item._id} className="group hover:bg-surface-lighter transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-bold text-primary-text group-hover:text-primary transition-colors">
                            {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System Subject'}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-primary-text">₦{item.amount?.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                          }`}>
                            <div className={`w-1 h-1 rounded-full ${status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-tertiary-text text-xs">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
