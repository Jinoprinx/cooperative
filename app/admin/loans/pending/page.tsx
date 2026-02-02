
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheck, FaTimes, FaExclamationCircle, FaClock } from 'react-icons/fa';

interface SuretyUser {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface Surety {
  user: SuretyUser;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  responseDate?: string;
}

interface User {
  firstName: string;
  lastName: string;
  accountNumber: string;
}

interface Loan {
  _id: string;
  user: User;
  amount: number;
  purpose: string;
  durationMonths: number;
  createdAt: string;
  sureties: Surety[];
}

export default function PendingLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const fetchPendingLoans = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/pending`, config);
      setLoans(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending loans:', error);
      setError('Failed to load pending loans. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLoans();
  }, []);

  const handleLoanAction = async (loanId: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}/status`, { status }, config);
      fetchPendingLoans();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${status} loan`;
      const errorDetails = error.response?.data?.details || '';
      alert(`${errorMessage}\n${errorDetails}`);
    }
  };

  const getSuretyStatus = (loan: Loan) => {
    if (!loan.sureties || loan.sureties.length === 0) {
      return { total: 0, approved: 0, rejected: 0, pending: 0 };
    }

    const total = loan.sureties.length;
    const approved = loan.sureties.filter(s => s.status === 'approved').length;
    const rejected = loan.sureties.filter(s => s.status === 'rejected').length;
    const pending = loan.sureties.filter(s => s.status === 'pending').length;

    return { total, approved, rejected, pending };
  };

  const canApprove = (loan: Loan) => {
    if (!loan.sureties || loan.sureties.length === 0) {
      return false; // Cannot approve if no sureties
    }
    const { total, approved, rejected } = getSuretyStatus(loan);
    return approved === total && rejected === 0;
  };

  const isRejectedBySureties = (loan: Loan) => {
    if (!loan.sureties || loan.sureties.length === 0) {
      return false;
    }
    const { rejected } = getSuretyStatus(loan);
    return rejected > 0;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Pending Loan Applications</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purpose
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Surety Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Applied
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loans.map((loan) => {
              const { total, approved, rejected, pending } = getSuretyStatus(loan);
              const approveEnabled = canApprove(loan);
              const rejectedBySureties = isRejectedBySureties(loan);

              return (
                <>
                  <tr key={loan._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{loan.user.firstName} {loan.user.lastName}</div>
                      <div className="text-sm text-gray-500">{loan.user.accountNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(loan.amount)}</div>
                      <div className="text-xs text-gray-500">{loan.durationMonths} months</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{loan.purpose}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {rejectedBySureties ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <FaExclamationCircle className="mr-1" />
                            Rejected by {rejected} surety(ies)
                          </span>
                        ) : approveEnabled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaCheck className="mr-1" />
                            All Approved ({approved}/{total})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FaClock className="mr-1" />
                            {approved}/{total} Approved
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedLoanId(expandedLoanId === loan._id ? null : loan._id)}
                          className="text-xs text-blue-600 hover:text-blue-900"
                        >
                          {expandedLoanId === loan._id ? 'Hide' : 'Details'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(loan.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleLoanAction(loan._id, 'approved')}
                          disabled={!approveEnabled}
                          className={`p-2 rounded ${approveEnabled
                            ? 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            : 'text-gray-300 cursor-not-allowed'
                            }`}
                          title={
                            rejectedBySureties
                              ? 'Cannot approve - rejected by sureties'
                              : !approveEnabled
                                ? `Waiting for all sureties to approve (${approved}/${total})`
                                : 'Approve loan'
                          }
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => handleLoanAction(loan._id, 'rejected')}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          title="Reject loan"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedLoanId === loan._id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="text-sm">
                          <h4 className="font-semibold mb-2">Surety Details:</h4>
                          <div className="space-y-2">
                            {loan.sureties.map((surety, idx) => (
                              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                                <div>
                                  <span className="font-medium">{surety.user.firstName} {surety.user.lastName}</span>
                                  <span className="text-gray-500 ml-2">({surety.user.phoneNumber})</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {surety.status === 'approved' && (
                                    <span className="text-green-600 flex items-center">
                                      <FaCheck className="mr-1" /> Approved
                                    </span>
                                  )}
                                  {surety.status === 'rejected' && (
                                    <span className="text-red-600 flex items-center">
                                      <FaTimes className="mr-1" /> Rejected
                                      {surety.rejectionReason && (
                                        <span className="ml-2 text-xs">({surety.rejectionReason})</span>
                                      )}
                                    </span>
                                  )}
                                  {surety.status === 'pending' && (
                                    <span className="text-yellow-600 flex items-center">
                                      <FaClock className="mr-1" /> Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
