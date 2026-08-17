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
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-20 text-primary-text w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 md:gap-6 w-full min-w-0">
        <div className="min-w-0">
          <span className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-1 sm:mb-1.5 block">Security Protocol</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary-text tracking-tighter truncate">
            Surety <span className="text-tertiary-text">Verification</span>
          </h1>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full min-w-0 max-w-full">
        <section className="w-full min-w-0 max-w-full">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4 md:mb-6">
             <FaUserShield className="text-primary h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
             <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tighter uppercase">Inbound Requests</h2>
          </div>
          
          {requests.length === 0 ? (
            <div className="card-premium p-6 sm:p-8 md:p-12 text-center bg-surface border-dashed border-border flex flex-col items-center w-full min-w-0 max-w-full">
              <p className="text-tertiary-text text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider italic mb-1.5 sm:mb-2">No pending verification cycles</p>
              <p className="text-xs sm:text-sm font-medium text-secondary-text">You have no active requests requiring your authentication.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 w-full min-w-0 max-w-full">
              {requests.map(request => (
                <div key={request._id} className="card-premium bg-surface border-border p-3.5 sm:p-5 md:p-6 flex flex-col justify-between group hover:border-primary/30 transition-all duration-500 w-full min-w-0 max-w-full">
                  <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6 min-w-0">
                     <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        <FaUserCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="font-black text-sm sm:text-base md:text-lg text-primary-text tracking-tighter leading-none mb-1 truncate">
                          {request.user ? `${request.user.firstName} ${request.user.lastName}` : 'Unknown Applicant'}
                        </p>
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Protocol Identification</p>
                     </div>
                  </div>
                  
                  <div className="bg-surface-lighter rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border border-border mb-3 sm:mb-4 md:mb-6 w-full min-w-0">
                     <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider mb-0.5 sm:mb-1 leading-none text-center">Value Endorsement</p>
                     <p className="text-lg sm:text-xl md:text-2xl font-black text-primary-text text-center tracking-tighter">₦{request.amount?.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 w-full min-w-0">
                    <button 
                      onClick={() => handleResponse(request._id, 'approved')} 
                      className="flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 md:py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      <FaCheck className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> Authenticate
                    </button>
                    <button 
                      onClick={() => handleResponse(request._id, 'rejected')} 
                      className="flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 md:py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                    >
                      <FaTimes className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pt-3 sm:pt-6 md:pt-8 w-full min-w-0 max-w-full">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4 md:mb-6">
             <FaHistory className="text-primary h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
             <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tighter uppercase">Historical Archive</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="card-premium p-6 sm:p-8 md:p-12 text-center bg-surface border-border w-full min-w-0 max-w-full">
              <p className="text-tertiary-text text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider">No past endorsements in registry</p>
            </div>
          ) : (
            <div className="card-premium p-0 overflow-hidden bg-surface border-border w-full min-w-0 max-w-full">
              <div className="overflow-x-auto min-h-[300px] w-full max-w-full">
                <table className="w-full text-left border-collapse min-w-[480px] sm:min-w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-lighter/50">
                      <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Role</th>
                      <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Associated Party</th>
                      <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Endorsed Value</th>
                      <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Verification Status</th>
                      <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map((item) => {
                      let myUserId = '';
                      try {
                        const token = localStorage.getItem('token');
                        if (token) {
                          myUserId = JSON.parse(atob(token.split('.')[1] || '{}')).id;
                        }
                      } catch (e) {}

                      const isApplicant = item.user?._id === myUserId || item.user === myUserId;
                      const status = getMySuretyStatus(item);

                      const approvedCount = item.sureties?.filter((s: any) => s.status === 'approved').length || 0;
                      const totalCount = item.sureties?.length || 0;
                      const hasRejected = item.sureties?.some((s: any) => s.status === 'rejected');

                      return (
                        <tr key={item._id} className="group hover:bg-surface-lighter transition-colors">
                          <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider ${
                              isApplicant ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {isApplicant ? 'Applicant' : 'Surety'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5">
                            {isApplicant ? (
                              <div className="flex flex-col gap-0.5 max-w-[140px] sm:max-w-xs min-w-0">
                                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider leading-none">Your Sureties:</span>
                                <p className="font-bold text-primary-text text-xs truncate">
                                  {item.sureties && item.sureties.length > 0
                                    ? item.sureties.map((s: any) => {
                                        const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown member';
                                        return `${name} (${s.status})`;
                                      }).join(', ')
                                    : 'No sureties assigned'}
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider leading-none">Applicant:</span>
                                <p className="font-bold text-primary-text group-hover:text-primary transition-colors text-xs sm:text-sm truncate">
                                  {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System Subject'}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 whitespace-nowrap">
                            <p className="font-black text-primary-text text-xs sm:text-sm">₦{item.amount?.toLocaleString()}</p>
                          </td>
                          <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 whitespace-nowrap">
                            {isApplicant ? (
                              <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider border ${
                                approvedCount === totalCount ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                hasRejected ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              }`}>
                                <div className={`w-1 h-1 rounded-full ${
                                  approvedCount === totalCount ? 'bg-emerald-500' :
                                  hasRejected ? 'bg-red-500' : 'bg-amber-500'
                                }`} />
                                {approvedCount}/{totalCount} Approved
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider border ${
                                status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                              }`}>
                                <div className={`w-1 h-1 rounded-full ${status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {status}
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 text-right font-black text-tertiary-text text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
