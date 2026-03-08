
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PaymentRecord } from '@/app/types';
import { useAuth } from '@/app/context/AuthContext';

export default function PaymentLedger() {
  const { user, loading: authLoading } = useAuth();
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPaymentRecords = async (params = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payment-ledger`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setPaymentRecords(response.data.paymentRecords);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment records:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPaymentRecords();
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleFilter = () => {
    fetchPaymentRecords({ startDate, endDate });
  };

  const handleQuickFilter = (limit: number) => {
    fetchPaymentRecords({ limit });
  };

  const handleViewReceipt = (transactionId: string) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/receipt?token=${token}`, '_blank');
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p>Loading payment records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Payment Ledger</h1>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-x-4 md:space-y-0">
          <div className="form-control flex-1">
            <label className="label"><span className="label-text">Start Date</span></label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input input-bordered w-full" />
          </div>
          <div className="form-control flex-1">
            <label className="label"><span className="label-text">End Date</span></label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input input-bordered w-full" />
          </div>
          <button onClick={handleFilter} className="btn btn-primary">Search</button>
          <div className="flex items-center space-x-2 pb-2">
            <span className="text-sm font-medium text-gray-500">Quick Filters:</span>
            <button onClick={() => handleQuickFilter(5)} className="btn btn-outline btn-xs btn-primary">Last 5</button>
            <button onClick={() => handleQuickFilter(10)} className="btn btn-outline btn-xs btn-primary">Last 10</button>
            <button onClick={() => { setStartDate(''); setEndDate(''); fetchPaymentRecords(); }} className="btn btn-outline btn-xs text-gray-400">Clear</button>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Payment Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paymentRecords.map((record) => (
                <tr key={record._id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(record.date)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatCurrency(record.amount)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{record.paymentMethod}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 capitalize">{record.status}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    {(record as any).receiptUrl && (
                      <button
                        onClick={() => handleViewReceipt(record._id)}
                        className="text-primary hover:underline font-medium"
                      >
                        View Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
