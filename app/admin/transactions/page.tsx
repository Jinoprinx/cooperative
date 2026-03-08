'use client';

import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { Transaction, Member } from '@/app/types';

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const [transactionsResponse, membersResponse, loansResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, { params }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/members`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans`),
      ]);

      const combinedTransactions = [
        ...transactionsResponse.data,
        ...loansResponse.data.map((loan: any) => ({ ...loan, type: 'loan' }))
      ];

      setTransactions(combinedTransactions);
      setMembers(membersResponse.data.members || membersResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const memberId = transaction.memberId || (typeof transaction.user === 'object' ? transaction.user?._id : transaction.user);
    const member = members.find(m => m._id === memberId);
    const searchString = searchQuery.toLowerCase();

    // Use member name or transaction/user fields if member not found in list
    const firstName = member?.firstName || (typeof transaction.user === 'object' ? transaction.user?.firstName : '');
    const lastName = member?.lastName || (typeof transaction.user === 'object' ? transaction.user?.lastName : '');

    if (transaction.type === 'loan') {
      return (
        firstName.toLowerCase().includes(searchString) ||
        lastName.toLowerCase().includes(searchString) ||
        (transaction.purpose?.toLowerCase() || '').includes(searchString)
      );
    } else {
      return (
        firstName.toLowerCase().includes(searchString) ||
        lastName.toLowerCase().includes(searchString) ||
        (transaction.description?.toLowerCase() || '').includes(searchString)
      );
    }
  });

  const handleApproveTransaction = async (id: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`, { status: 'approved' } as Partial<Transaction>);
      setTransactions(transactions.map(t => t._id === id ? { ...t, status: 'approved' } : t));
    } catch (error) {
      console.error('Error approving transaction:', error);
    }
  };

  const handleRejectTransaction = async () => {
    if (!selectedTransactionId || !rejectionReason.trim()) return;
    setRejecting(true);
    try {
      const endpoint = transactions.find(t => t._id === selectedTransactionId)?.type === 'loan'
        ? `${process.env.NEXT_PUBLIC_API_URL}/loans/${selectedTransactionId}/status`
        : `${process.env.NEXT_PUBLIC_API_URL}/transactions/reject/${selectedTransactionId}`;

      const payload = transactions.find(t => t._id === selectedTransactionId)?.type === 'loan'
        ? { status: 'rejected', rejectionReason }
        : { rejectionReason };

      await axios.post(endpoint, payload);

      setTransactions(transactions.map(t => t._id === selectedTransactionId ? { ...t, status: 'rejected', rejectionReason } : t));
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedTransactionId(null);
    } catch (error) {
      console.error('Error rejecting transaction:', error);
    } finally {
      setRejecting(false);
    }
  };

  const openRejectModal = (id: string) => {
    setSelectedTransactionId(id);
    setShowRejectModal(true);
  };

  const handleSearch = () => {
    fetchData({ startDate, endDate });
  };

  const handleViewReceipt = (transactionId: string) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/receipt?token=${token}`, '_blank');
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
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
        <div className="relative flex-1 max-w-xs">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by member or description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input input-bordered input-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input input-bordered input-sm"
          />
          <button onClick={handleSearch} className="btn btn-primary btn-sm">
            Filter by Date
          </button>
          <button onClick={() => { setStartDate(''); setEndDate(''); fetchData(); }} className="btn btn-ghost btn-sm">
            Clear
          </button>
        </div>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Remaining Loan Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredTransactions.map((transaction) => {
                const memberId = transaction.memberId || (typeof transaction.user === 'object' ? transaction.user?._id : transaction.user);
                const member = members.find(m => m._id === memberId);
                return (
                  <tr key={transaction._id} className={transaction.status === 'rejected' ? 'bg-gray-50 opacity-75' : ''}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(transaction.date || transaction.createdAt || '')}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {member ? `${member.firstName} ${member.lastName}` : (typeof transaction.user === 'object' ? `${transaction.user?.firstName} ${transaction.user?.lastName}` : 'Unknown')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${transaction.type === 'deposit'
                          ? 'bg-green-100 text-green-800'
                          : transaction.type === 'withdrawal'
                            ? 'bg-red-100 text-red-800'
                            : transaction.type === 'loan'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-6 py-4 text-sm text-gray-500 ${transaction.status === 'rejected' ? 'line-through decoration-red-500 decoration-2' : ''}`}>{formatCurrency(transaction.amount)}</td>
                    <td className={`whitespace-nowrap px-6 py-4 text-sm text-gray-500 ${transaction.status === 'rejected' ? 'line-through decoration-red-500 decoration-1' : ''}`}>
                      {transaction.description || transaction.purpose}
                      {transaction.status === 'rejected' && transaction.rejectionReason && (
                        <p className="text-[10px] text-red-500 mt-0.5 italic no-underline">Reason: {transaction.rejectionReason}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${transaction.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {transaction.type === 'loan' || transaction.type === 'loan_repayment' || transaction.type === 'loan_disbursement'
                        ? formatCurrency(transaction.remainingAmount || 0)
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {transaction.receiptUrl && (
                          <button
                            onClick={() => handleViewReceipt(transaction._id)}
                            className="text-primary hover:underline font-medium mr-2"
                          >
                            View Receipt
                          </button>
                        )}
                        {transaction.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveTransaction(transaction._id)} className="btn btn-success btn-sm">
                              Approve
                            </button>
                            <button onClick={() => openRejectModal(transaction._id)} className="btn btn-error btn-sm">
                              Reject
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
      </div>
      {/* Modal for Rejection Reason */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reason for Rejection</h3>
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-semibold">Please provide a reason:</p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
              rows={4}
              placeholder="e.g., Receipt amount mismatch, blurry receipt, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 font-semibold bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectTransaction}
                disabled={!rejectionReason.trim() || rejecting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}