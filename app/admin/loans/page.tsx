'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { Loan, Member } from '@/app/types';

export default function Loans() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [loansResponse, membersResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans`, config),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/members`, config),
        ]);
        setLoans(loansResponse.data);
        setMembers(membersResponse.data.members || membersResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching loans or members:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLoans = loans.filter(loan => {
    const memberName = loan.user ? `${loan.user.firstName || ''} ${loan.user.lastName || ''}`.toLowerCase() : '';
    const matchesSearch =
      (memberName.includes(searchQuery.toLowerCase()) ||
        (loan.purpose || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter ? loan.status === statusFilter : true;
    const loanDate = new Date(loan.startDate || loan.nextPaymentDate || loan.createdAt || '');
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const matchesDate = (!start || loanDate >= start) && (!end || loanDate <= end);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalRepayments = filteredLoans.reduce((sum, loan) =>
    sum + (loan.repaymentHistory?.reduce((acc, payment) => {
      const paymentDate = new Date(payment.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      return (!start || paymentDate >= start) && (!end || paymentDate <= end) ? acc + payment.amount : acc;
    }, 0) || 0), 0);

  const handleApproveLoan = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const loan = loans.find(l => l._id === id);
      if (!loan) return;
      const updatedLoan: Partial<Loan> = {
        status: 'approved',
        startDate: new Date().toISOString().split('T')[0],
        monthlyPayment: loan.amount / 6,
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      };
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${id}`, updatedLoan, config);
      setLoans(loans.map(l => l._id === id ? { ...l, ...updatedLoan } : l));
    } catch (error) {
      console.error('Error approving loan:', error);
    }
  };

  const handleRejectLoan = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${id}`, { status: 'rejected' } as Partial<Loan>, config);
      setLoans(loans.map(l => l._id === id ? { ...l, status: 'rejected' } : l));
    } catch (error) {
      console.error('Error rejecting loan:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
          <p className="text-tertiary-text">Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10 pb-20 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1.5 sm:mb-2 block">Loan Management</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-text tracking-tighter">
            Credit <span className="text-tertiary-text">Portfolio</span>
          </h1>
        </div>
        <div className="card-premium py-2 px-4 sm:px-6 bg-surface border border-border flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl">
          <span className="text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Total Repayments</span>
          <span className="text-base sm:text-xl font-black text-emerald-500 shadow-glow-sm">{formatCurrency(totalRepayments)}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary-text h-4 w-4" />
          <input
            type="text"
            placeholder="Search member or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-11 pr-4 sm:pr-6 text-primary-text text-xs sm:text-sm focus:border-primary outline-none transition-all placeholder:text-tertiary-text font-bold"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface border border-border rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-primary-text text-xs sm:text-sm focus:border-primary outline-none transition-all font-black uppercase tracking-wider sm:tracking-widest min-w-[150px] appearance-none"
        >
          <option value="" className="bg-background">All Statuses</option>
          <option value="pending" className="bg-background">Pending</option>
          <option value="approved" className="bg-background">Approved</option>
          <option value="active" className="bg-background">Active</option>
          <option value="repaid" className="bg-background">Repaid</option>
          <option value="rejected" className="bg-background">Rejected</option>
        </select>
        <div className="flex items-center gap-2 bg-surface rounded-xl sm:rounded-2xl border border-border p-1.5 sm:p-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-primary-text text-[9px] sm:text-[10px] font-black uppercase outline-none px-2 py-1 min-w-0 flex-1"
          />
          <span className="text-tertiary-text font-bold">/</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-primary-text text-[9px] sm:text-[10px] font-black uppercase outline-none px-2 py-1 min-w-0 flex-1"
          />
        </div>
      </div>

      {/* Tables Section */}
      <div className="card-premium p-0 overflow-hidden bg-surface border border-border">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-surface-lighter/50">
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Borrower</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Principal</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Status</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Purpose</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest text-center">Sureties</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Balance</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLoans.map((loan) => {
                const approvedSureties = loan.sureties?.filter(s => s.status === 'approved').length || 0;
                const totalSureties = loan.sureties?.length || 0;
                
                return (
                  <tr key={loan._id} className="group hover:bg-surface-lighter transition-colors">
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-xs shrink-0">
                          {loan.user ? loan.user.firstName[0] + loan.user.lastName[0] : '?'}
                        </div>
                        <span className="font-bold text-primary-text text-xs sm:text-sm">{loan.user ? `${loan.user.firstName} ${loan.user.lastName}` : 'Unknown Member'}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 font-black text-primary-text text-xs sm:text-sm tracking-tight whitespace-nowrap">{formatCurrency(loan.amount)}</td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider border ${
                        loan.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        loan.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        loan.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-500'
                      }`}>
                         <div className={`w-1 h-1 rounded-full ${
                           loan.status === 'approved' ? 'bg-emerald-500' :
                           loan.status === 'pending' ? 'bg-amber-500' :
                           'bg-current'
                         }`} />
                         {loan.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-tertiary-text text-xs font-medium truncate max-w-[150px]">{loan.purpose}</td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                       <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                         <div className="flex -space-x-1.5">
                            {[...Array(totalSureties)].map((_, i) => (
                              <div key={i} className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-background ${i < approvedSureties ? 'bg-emerald-500' : 'bg-surface'}`} />
                            ))}
                         </div>
                         <span className="text-[9px] sm:text-[10px] font-black text-tertiary-text">{approvedSureties}/{totalSureties}</span>
                       </div>
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 font-bold text-red-500 text-xs sm:text-sm whitespace-nowrap">{formatCurrency(loan.remainingAmount || 0)}</td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5 sm:gap-2">
                        <button onClick={() => setSelectedLoan(loan)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-tertiary-text hover:text-primary hover:border-primary/30 transition-all">
                          <FaEye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        {loan.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveLoan(loan._id)} 
                              disabled={approvedSureties < 2}
                              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white disabled:opacity-30 disabled:hover:bg-emerald-500/10 transition-all"
                            >
                              <FaCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button onClick={() => handleRejectLoan(loan._id)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                              <FaTimes className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredLoans.length === 0 && (
          <div className="p-16 sm:p-20 text-center bg-surface">
            <p className="text-tertiary-text text-xs sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">No loans matching criteria</p>
          </div>
        )}
      </div>

      {/* Modal Section */}
      {selectedLoan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setSelectedLoan(null)} />
          <div className="relative glass-card p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[3rem] border border-border shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all animate-float overflow-hidden bg-surface">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
            
            <div className="relative flex justify-between items-start mb-6 sm:mb-8 flex-shrink-0">
               <div>
                  <span className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1.5 sm:mb-2 block">Ledger Insight</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-primary-text tracking-tighter">Repayment <span className="text-tertiary-text">History</span></h3>
               </div>
               <button onClick={() => setSelectedLoan(null)} className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-surface border border-border text-tertiary-text hover:text-primary-text transition-colors">
                  <FaTimes className="h-4 w-4 sm:h-6 sm:w-6" />
               </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar space-y-4 sm:space-y-6 mb-4 sm:mb-6">
              <div className="card-premium bg-surface-lighter border border-border p-4 sm:p-8 flex justify-between items-center group rounded-xl sm:rounded-2xl">
                 <div className="min-w-0">
                    <p className="text-tertiary-text text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-0.5 sm:mb-1">Account Holder</p>
                    <p className="text-base sm:text-xl font-bold text-primary-text group-hover:text-primary transition-colors truncate">{selectedLoan.user ? `${selectedLoan.user.firstName} ${selectedLoan.user.lastName}` : 'System User'}</p>
                 </div>
                 <div className="text-right shrink-0">
                    <p className="text-tertiary-text text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-0.5 sm:mb-1">Remaining Balance</p>
                    <p className="text-lg sm:text-2xl font-black text-red-500 tracking-tighter">{formatCurrency(selectedLoan.remainingAmount || 0)}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Loan Details Card */}
                <div className="bg-surface-lighter rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
                  <h4 className="text-xs font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest mb-3 sm:mb-4">Loan Details</h4>
                  <div className="space-y-2.5 sm:space-y-3 font-bold text-xs">
                    <div className="flex justify-between">
                      <span className="text-tertiary-text font-medium">Principal Amount:</span>
                      <span className="text-primary-text">{formatCurrency(selectedLoan.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-text font-medium">Interest Rate:</span>
                      <span className="text-primary-text">{selectedLoan.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-text font-medium">Total Repayment:</span>
                      <span className="text-primary-text">{formatCurrency(selectedLoan.totalRepayment || selectedLoan.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-text font-medium">Paid To Date:</span>
                      <span className="text-emerald-500">{formatCurrency(selectedLoan.amountPaid || 0)}</span>
                    </div>
                    <hr className="border-border my-2" />
                    <div className="flex justify-between">
                      <span className="text-tertiary-text font-medium">Approval Date:</span>
                      <span className="text-primary-text">{selectedLoan.approvalDate ? formatDate(selectedLoan.approvalDate) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-text font-medium">Start Date:</span>
                      <span className="text-primary-text">{selectedLoan.startDate ? formatDate(selectedLoan.startDate) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tertiary-text font-medium">End Date:</span>
                      <span className="text-primary-text">{selectedLoan.endDate ? formatDate(selectedLoan.endDate) : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Sureties Card */}
                <div className="bg-surface-lighter rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
                  <h4 className="text-xs font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest mb-3 sm:mb-4">Guarantors / Sureties</h4>
                  <div className="space-y-2.5 sm:space-y-3 overflow-y-auto max-h-[180px] custom-scrollbar pr-1">
                    {selectedLoan.sureties && selectedLoan.sureties.length > 0 ? (
                      selectedLoan.sureties.map((surety: any, idx: number) => (
                        <div key={idx} className="flex flex-col border-b border-border/50 pb-2 last:border-none last:pb-0 text-xs font-bold">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-primary-text truncate">
                              {surety.user ? `${surety.user.firstName} ${surety.user.lastName}` : 'Unknown member'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-black border shrink-0 ${
                              surety.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                              surety.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                              'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            }`}>
                              {surety.status}
                            </span>
                          </div>
                          <span className="text-[9px] text-tertiary-text">Phone: {surety.user?.phoneNumber || 'N/A'}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-tertiary-text italic">No guarantors assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Repayments Log */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-tertiary-text uppercase tracking-widest ml-1">Repayments Log</h4>
                {selectedLoan.repaymentHistory && selectedLoan.repaymentHistory.length > 0 ? (
                  <div className="divide-y divide-border border border-border rounded-3xl overflow-hidden font-bold">
                    <div className="grid grid-cols-2 bg-surface px-8 py-4">
                       <span className="text-[10px] font-black text-tertiary-text uppercase tracking-widest">Transaction Date</span>
                       <span className="text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Amount Applied</span>
                    </div>
                    {selectedLoan.repaymentHistory.map((payment, index) => (
                      <div key={index} className="grid grid-cols-2 px-8 py-4 hover:bg-surface transition-colors">
                         <span className="text-sm font-bold text-secondary-text">{formatDate(payment.date)}</span>
                         <span className="text-sm font-black text-emerald-500 text-right">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-surface rounded-3xl border border-dashed border-border">
                     <p className="text-tertiary-text text-xs font-black uppercase tracking-widest italic">No repayments recorded for this cycle</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-border">
               <button onClick={() => setSelectedLoan(null)} className="w-full btn-primary py-4 text-xs font-black tracking-widest uppercase rounded-2xl shadow-none border-none">Dismiss Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}