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
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="text-black">Loading loans history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaHourglassHalf className="text-yellow-500" />;
      case 'approved':
      case 'active':
        return <FaCheckCircle className="text-green-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 pb-20 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Capital Management</span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">
            Personal <span className="text-white/40">Portfolio</span>
          </h1>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-5 items-start">
        {/* Application Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700" />
            <h2 className="text-xl font-black tracking-tighter mb-8 flex items-center gap-3">
               <FaHandHoldingUsd className="text-primary" />
               Request Capital
            </h2>
            <div className="space-y-4">
              <div className="relative group/field">
                 <span className="absolute top-2 left-6 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Principle Amount (NGN)</span>
                 <input
                  type="number"
                  placeholder="0.00"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pt-8 text-white outline-none focus:border-primary transition-all font-black text-lg"
                />
              </div>
              <div className="relative group/field">
                 <span className="absolute top-2 left-6 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Repayment Tenure (Months)</span>
                 <input
                  type="number"
                  placeholder="Duration"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pt-8 text-white outline-none focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="relative group/field">
                 <span className="absolute top-2 left-6 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Allocation Purpose</span>
                 <textarea
                  placeholder="Describe your requirement..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pt-8 text-white outline-none focus:border-primary transition-all font-medium h-32 resize-none"
                />
              </div>

              {/* Sureties Management */}
              <div className="pt-6 space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Guarantors (Min. 2)</label>
                  {sureties.length < 5 && (
                    <button onClick={addSurety} className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors">
                      <FaPlus className="h-3 w-3" /> Add Surety
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {sureties.map((surety, index) => (
                    <div key={index} className="relative group/surety">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            placeholder="Mobile Number"
                            value={surety.phone}
                            onChange={(e) => handleSuretyChange(index, e.target.value)}
                            className={`w-full bg-white/3 border ${surety.error ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-primary transition-all font-bold group-hover/surety:bg-white/5`}
                          />
                          {surety.found && (
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/20">
                               <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Verified</span>
                             </div>
                          )}
                        </div>
                        <button onClick={() => removeSurety(index)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {surety.name && (
                         <p className={`mt-2 text-[10px] font-black uppercase tracking-widest px-2 ${surety.found ? 'text-emerald-400' : 'text-red-400'}`}>{surety.name}</p>
                      )}
                      {surety.error && (
                         <p className="mt-2 text-[10px] text-red-500 px-2 font-bold italic">! {surety.error}</p>
                      )}
                    </div>
                  ))}
                  {sureties.length === 0 && (
                    <p className="text-center py-10 text-white/10 text-[10px] font-black uppercase tracking-[0.3em] border border-dashed border-white/10 rounded-2xl">Requirement: 2 Sureties</p>
                  )}
                </div>
              </div>

              <button 
                onClick={handleApplyLoan} 
                className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-4 text-xs font-black tracking-[0.4em] uppercase transition-all duration-500 hover:tracking-[0.6em] shadow-[0_0_30px_rgba(59,130,246,0.1)] group"
              >
                Assemble Credit Request
              </button>
            </div>
          </div>
        </div>

        {/* Loan History / Records */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card-premium p-0 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tighter">Ledger Archive</h2>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">Repayment Progression</p>
              </div>
            </div>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Protocol Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Classification</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Integrity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Value (NGN)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(loans || []).map((item) => (
                    <tr key={item._id} className="group hover:bg-white/3 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white/80">{formatDate(item.startDate || item.createdAt)}</span>
                          {item.renewedFrom && (
                            <span className="text-[9px] font-black text-primary uppercase tracking-tighter mt-1">↩ Renewed Cycle</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-medium text-white/70 max-w-[150px] truncate">{item.purpose}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          ['approved', 'active', 'completed'].includes(item.status) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
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
                      <td className="px-8 py-6 text-right font-black text-white shadow-glow-sm">
                         {formatCurrency(item.amount)}
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className={`text-sm font-black ${item.remainingAmount > 0 ? 'text-red-400' : 'text-emerald-400 opacity-20'}`}>
                           {item.status !== 'pending' ? formatCurrency(item.remainingAmount || 0) : '—'}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {(loans || []).length === 0 && (
                     <tr>
                       <td colSpan={5} className="py-20 text-center bg-white/2">
                          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] italic">No active or historical credit records</p>
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