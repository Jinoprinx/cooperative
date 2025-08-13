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
        const [loansResponse, membersResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/loans'),
          axios.get('http://localhost:5000/api/members'),
        ]);
        setLoans(loansResponse.data);
        setMembers(membersResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching loans or members:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLoans = loans.filter(loan => {
    const member = members.find(m => m._id === loan.memberId);
    const matchesSearch =
      (member?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
       member?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
       loan.purpose.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter ? loan.status === statusFilter : true;
    const loanDate = new Date(loan.startDate || loan.nextPaymentDate || '');
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const matchesDate = (!start || loanDate >= start) && (!end || loanDate <= end);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalRepayments = filteredLoans.reduce((sum, loan) =>
    sum + loan.repaymentHistory.reduce((acc, payment) => {
      const paymentDate = new Date(payment.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      return (!start || paymentDate >= start) && (!end || paymentDate <= end) ? acc + payment.amount : acc;
    }, 0), 0);

  const handleApproveLoan = async (id: string) => {
    try {
      const loan = loans.find(l => l._id === id);
      if (!loan) return;
      const updatedLoan: Partial<Loan> = {
        status: 'approved',
        startDate: new Date().toISOString().split('T')[0],
        monthlyPayment: loan.amount / 6,
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      };
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/${id}`, updatedLoan);
      setLoans(loans.map(l => l._id === id ? { ...l, ...updatedLoan } : l));
    } catch (error) {
      console.error('Error approving loan:', error);
    }
  };

  const handleRejectLoan = async (id: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/${id}`, { status: 'rejected' } as Partial<Loan>);
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
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p>Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by member or purpose"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full max-w-xs pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select select-bordered w-full max-w-xs"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="repaid">Repaid</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input input-bordered w-full max-w-xs"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input input-bordered w-full max-w-xs"
        />
      </div>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-lg font-medium text-gray-800">Total Repayments: {formatCurrency(totalRepayments)}</h2>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sureties</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Remaining Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredLoans.map((loan) => {
                const member = members.find(m => m._id === loan.memberId);
                const approvedSureties = loan.sureties?.filter(s => s.status === 'approved').length || 0;
                return (
                  <tr key={loan._id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{member ? `${member.firstName} ${member.lastName}` : 'Unknown'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatCurrency(loan.amount)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                          loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          loan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{loan.purpose}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="tooltip" data-tip={loan.sureties?.map(s => `${s.user.toString()}: ${s.status}`).join('\n')}>
                        {approvedSureties} / {loan.sureties?.length || 0} approved
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatCurrency(loan.remainingAmount)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button onClick={() => setSelectedLoan(loan)} className="btn btn-info btn-sm mr-2">
                        <FaEye />
                      </button>
                      {loan.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveLoan(loan._id)} className="btn btn-success btn-sm mr-2" disabled={approvedSureties < 2}>
                            <FaCheck />
                          </button>
                          <button onClick={() => handleRejectLoan(loan._id)} className="btn btn-error btn-sm">
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedLoan && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Repayment History for {members.find(m => m._id === selectedLoan.memberId)?.firstName} {members.find(m => m._id === selectedLoan.memberId)?.lastName}</h3>
            <div className="mt-4">
              {selectedLoan.repaymentHistory.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLoan.repaymentHistory.map((payment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(payment.date)}</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No repayments yet.</p>
              )}
            </div>
            <div className="modal-action">
              <button onClick={() => setSelectedLoan(null)} className="btn">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}