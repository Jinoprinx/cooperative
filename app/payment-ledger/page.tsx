
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PaymentRecord } from '@/app/types';
import { useAuth } from '@/app/context/AuthContext';

export default function PaymentLedger() {
  const { user, loading: authLoading } = useAuth();
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchPaymentRecords = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payment-ledger`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPaymentRecords(response.data.paymentRecords);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching payment records:', error);
          setLoading(false);
        }
      };
      fetchPaymentRecords();
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paymentRecords.map((record) => (
                <tr key={record._id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(record.date)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatCurrency(record.amount)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{record.paymentMethod}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 capitalize">{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
