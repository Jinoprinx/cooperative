'use client';

import { useState, useEffect } from 'react';
import { FaHandHoldingUsd } from 'react-icons/fa';
import { mockActiveLoan} from "@/app/types";
import { mockRepaymentHistory} from "@/app/types";


export default function Loans() {
  const [activeLoan, setActiveLoan] = useState(mockActiveLoan);
  const [repaymentHistory, setRepaymentHistory] = useState(mockRepaymentHistory);
  const [loanAmount, setLoanAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetching
    const fetchLoanData = async () => {
      try {
        // In a real app: fetch('/api/loans') and fetch('/api/repayments')
        setLoading(false);
      } catch (error) {
        console.error('Error fetching loan data:', error);
        setLoading(false);
      }
    };
    fetchLoanData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleApplyLoan = () => {
    // In a real app, send POST request to '/api/loans/apply'
    console.log('Loan Application:', { amount: loanAmount, purpose });
    setLoanAmount('');
    setPurpose('');
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
        <h1 className="text-2xl font-bold text-gray-800">Loans</h1>
        {/* Apply for Loan */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-medium text-gray-800">Apply for Loan</h2>
          <div className="mt-4 space-y-4">
            <input
              type="number"
              placeholder="Loan Amount (NGN)"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="input input-bordered w-full"
            />
            <textarea
              placeholder="Purpose of Loan"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="textarea textarea-bordered w-full"
            />
            <button onClick={handleApplyLoan} className="btn btn-primary">
              <FaHandHoldingUsd className="mr-2" /> Apply
            </button>
          </div>
        </div>
        {/* Active Loan */}
        {activeLoan && (
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="text-lg font-medium text-gray-800">Active Loan</h2>
            <p className="mt-4 text-3xl font-bold text-secondary">{formatCurrency(activeLoan.remainingAmount)}</p>
            <p className="mt-2 text-sm text-gray-500">Outstanding Balance</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Start Date:</span>
                <span className="text-sm">{formatDate(activeLoan.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">End Date:</span>
                <span className="text-sm">{formatDate(activeLoan.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Next Payment:</span>
                <span className="text-sm">{formatDate(activeLoan.nextPaymentDate)} - {formatCurrency(activeLoan.monthlyPayment)}</span>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-secondary"
                style={{ width: `${(activeLoan.amountPaid / (activeLoan.amountPaid + activeLoan.remainingAmount)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        {/* Repayment History */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-medium text-gray-800">Repayment History</h2>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount Paid</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {repaymentHistory.map((repayment) => (
                  <tr key={repayment.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(repayment.date)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(repayment.amount)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(repayment.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}