'use client';

import { useState, useEffect } from 'react';
import { FaHandHoldingUsd, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPlus, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loan, Transaction, User } from '@/app/types';
import { useDashboardData } from '@/app/hooks/useDashboardData';
import { useAuth } from '@/app/context/AuthContext';

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loanAmount, setLoanAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [sureties, setSureties] = useState<{ phone: string; name: string; found: boolean; error?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { refetch: refetchDashboardData } = useDashboardData();

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const loansHistoryResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLoans(loansHistoryResponse.data.history);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching loan data:', error);
        setError('Failed to load loan data. Please try again.');
        setLoading(false);
      }
    };
    fetchLoanData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleApplyLoan = async () => {
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      alert('Please enter a valid loan amount.');
      return;
    }
    if (!durationMonths || parseInt(durationMonths) <= 0) {
      alert('Please enter a valid loan duration in months.');
      return;
    }
    if (!purpose.trim()) {
      alert('Please enter the purpose of the loan.');
      return;
    }
    if (sureties.length < 1) {
      alert('You need at least one surety to apply for a loan.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const suretyIds = sureties.map(s => s.phone);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/loans/apply`,
        { amount: parseFloat(loanAmount), purpose, durationMonths: parseInt(durationMonths), sureties: suretyIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Loan application submitted successfully! Your surety requests have been sent.');
      setLoanAmount('');
      setPurpose('');
      setDurationMonths('');
      setSureties([]);
      // Refresh loan data
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoans(response.data.history);
      refetchDashboardData();
    } catch (error: any) {
      console.error('Error applying for loan:', error);
      const errorMessage = error.response?.data?.message || 'Failed to apply for loan. Please try again.';
      alert(errorMessage);
    }
  };

  const handleSuretyChange = async (index: number, phone: string) => {
    const newSureties = [...sureties];
    newSureties[index].phone = phone;
    newSureties[index].name = '';
    newSureties[index].found = false;
    newSureties[index].error = undefined;

    if (phone.length === 11) {
      // Check if user entered their own phone number
      if (currentUser?.phoneNumber === phone) {
        newSureties[index].error = 'You or any admin cannot be a surety for this loan.';
        setSureties(newSureties);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/search?phone=${phone}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data) {
          const foundRole: string = response.data.role;
          if (foundRole === 'admin' || foundRole === 'super-admin') {
            newSureties[index].error = 'You or any admin cannot be a surety for this loan.';
            newSureties[index].name = '';
            newSureties[index].found = false;
          } else {
            newSureties[index].name = response.data.name;
            newSureties[index].found = true;
          }
        }
      } catch (error) {
        console.error('Error searching for member:', error);
        newSureties[index].name = 'Member not found';
      }
    }
    setSureties(newSureties);
  };

  const addSurety = () => {
    if (sureties.length < 5) { // Limit to 5 sureties
      setSureties([...sureties, { phone: '', name: '', found: false }]);
    }
  };

  const removeSurety = (index: number) => {
    const newSureties = sureties.filter((_, i) => i !== index);
    setSureties(newSureties);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
          <p className="text-tertiary-text">Loading loans history...</p>
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
          <span className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-1 sm:mb-1.5 block">Loan Management</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary-text tracking-tighter truncate">
            Personal <span className="text-tertiary-text">Loan Portfolio</span>
          </h1>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:gap-8 lg:gap-10 lg:grid-cols-5 items-start w-full min-w-0 max-w-full">
        {/* Application Form */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full min-w-0 max-w-full">
          <div className="card-premium relative overflow-hidden group bg-surface border border-border w-full min-w-0 max-w-full">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tighter mb-4 sm:mb-6 md:mb-8 flex items-center gap-2.5 sm:gap-3">
               <FaHandHoldingUsd className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
               Loan Request
            </h2>
            <div className="space-y-3 sm:space-y-4 w-full min-w-0">
              <div className="relative group/field min-w-0">
                 <span className="absolute top-2 left-3 sm:left-4 md:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Principal Amount (NGN)</span>
                 <input
                  type="number"
                  placeholder="0.00"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 pt-6 sm:pt-7 md:pt-8 text-primary-text outline-none focus:border-primary transition-all font-black text-sm sm:text-base md:text-lg"
                />
              </div>
              <div className="relative group/field min-w-0">
                 <span className="absolute top-2 left-3 sm:left-4 md:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Repayment Tenure (Months)</span>
                 <input
                  type="number"
                  placeholder="Duration"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 pt-6 sm:pt-7 md:pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold text-xs sm:text-sm md:text-base"
                />
              </div>
              <div className="relative group/field min-w-0">
                 <span className="absolute top-2 left-3 sm:left-4 md:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Loan Purpose</span>
                 <textarea
                  placeholder="Why do you need this loan..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 pt-6 sm:pt-7 md:pt-8 text-primary-text outline-none focus:border-primary transition-all font-medium text-xs sm:text-sm h-24 sm:h-28 md:h-32 resize-none"
                />
              </div>

              {/* Sureties Management */}
              <div className="pt-3 sm:pt-4 md:pt-6 space-y-2.5 sm:space-y-3 md:space-y-4 w-full min-w-0">
                <div className="flex justify-between items-center px-1 sm:px-2">
                  <label className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider text-tertiary-text">Guarantors (Min. 2)</label>
                  {sureties.length < 5 && (
                    <button onClick={addSurety} className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] md:text-[10px] font-black text-primary uppercase tracking-wider hover:text-primary-text transition-colors">
                      <FaPlus className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> Add Surety
                    </button>
                  )}
                </div>
                
                <div className="space-y-2.5 sm:space-y-3 w-full min-w-0">
                  {sureties.map((surety, index) => (
                    <div key={index} className="relative group/surety w-full min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="tel"
                            placeholder="Mobile Number"
                            value={surety.phone}
                            onChange={(e) => handleSuretyChange(index, e.target.value)}
                            className={`w-full bg-surface-lighter border ${surety.error ? 'border-red-500/50' : 'border-border'} rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs text-primary-text outline-none focus:border-primary transition-all font-bold pr-16 sm:pr-20`}
                          />
                          {surety.found && (
                             <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/20">
                               <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                               <span className="text-[7px] sm:text-[8px] font-black text-emerald-500 uppercase tracking-tight">Verified</span>
                             </div>
                          )}
                        </div>
                        <button onClick={() => removeSurety(index)} className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                          <FaTrash className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                      </div>
                      
                      {surety.name && (
                         <p className={`mt-1 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider px-1 sm:px-2 truncate ${surety.found ? 'text-emerald-500' : 'text-red-500'}`}>{surety.name}</p>
                      )}
                      {surety.error && (
                         <p className="mt-1 text-[8px] sm:text-[9px] text-red-500 px-1 sm:px-2 font-bold italic truncate">! {surety.error}</p>
                      )}
                    </div>
                  ))}
                  {sureties.length === 0 && (
                    <p className="text-center py-4 sm:py-6 md:py-8 text-tertiary-text text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider border border-dashed border-border rounded-lg sm:rounded-xl">Requirement: 2 Sureties</p>
                  )}
                </div>
              </div>

              <button 
                onClick={handleApplyLoan} 
                className="w-full btn-primary py-3.5 sm:py-4 md:py-5 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all duration-500 shadow-none border-none group"
              >
                Send Loan Request
              </button>
            </div>
          </div>
        </div>

        {/* Loan History / Records */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6 w-full min-w-0 max-w-full">
          <div className="card-premium p-0 overflow-hidden bg-surface border border-border w-full min-w-0 max-w-full">
            <div className="p-3.5 sm:p-5 md:p-8 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-primary-text tracking-tighter">Loan Ledger</h2>
                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider mt-0.5 sm:mt-1">Repayment History</p>
              </div>
            </div>
            <div className="overflow-x-auto min-h-[300px] w-full max-w-full">
              <table className="w-full text-left border-collapse min-w-[480px] sm:min-w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-lighter/50">
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Event Date</th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Classification</th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider text-right">Value (NGN)</th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(loans || []).map((item) => (
                    <tr key={item._id} className="group hover:bg-surface-lighter transition-colors">
                      <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[11px] sm:text-xs font-bold text-secondary-text">{formatDate(item.startDate || item.createdAt)}</span>
                          {item.renewedFrom && (
                            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black text-primary uppercase tracking-tight mt-0.5">↩ Renewed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5">
                        <p className="text-xs font-medium text-secondary-text max-w-[120px] sm:max-w-[160px] truncate">{item.purpose}</p>
                      </td>
                      <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider border ${
                          ['approved', 'active', 'completed'].includes(item.status) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                          item.status === 'renewed' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                          item.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                          'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                           <div className={`w-1 h-1 rounded-full ${
                             ['approved', 'active', 'completed'].includes(item.status) ? 'bg-emerald-500' :
                             item.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-current'
                           }`} />
                           {item.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 text-right font-black text-xs sm:text-sm md:text-base text-primary-text shadow-glow-sm whitespace-nowrap">
                         {formatCurrency(item.amount)}
                      </td>
                      <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 text-right whitespace-nowrap">
                         <span className={`text-[11px] sm:text-xs md:text-sm font-black ${item.remainingAmount > 0 ? 'text-red-500' : 'text-emerald-500 opacity-30'}`}>
                           {item.status !== 'pending' ? formatCurrency(item.remainingAmount || 0) : '—'}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {(loans || []).length === 0 && (
                     <tr>
                       <td colSpan={5} className="py-16 text-center bg-surface">
                          <p className="text-tertiary-text text-[9px] sm:text-[10px] font-black uppercase tracking-widest italic">No active or historical credit records</p>
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}