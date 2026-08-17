"use client";

import React from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { FaCreditCard } from "react-icons/fa";

interface PayNowButtonProps {
  className?: string;
  buttonClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PayNowButton: React.FC<PayNowButtonProps> = ({ className = 'w-full', buttonClassName = '', size = 'md' }) => {
  const router = useRouter();

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('transaction-success'));
  };

  const sizeClasses = {
    sm: 'py-2.5 px-5 text-[10px]',
    md: 'py-4 px-8 text-xs',
    lg: 'py-5 px-10 text-sm',
  }[size];

  return (
    <Link href="/payment/upload-receipt" className={`block ${className}`}>
      <button
        onClick={handleClick}
        className={`w-full bg-primary hover:bg-primary-dark text-white font-black rounded-2xl flex items-center justify-center gap-2.5 uppercase tracking-[0.2em] transition-all duration-300 shadow-glow-sm border-none active:scale-95 cursor-pointer ${sizeClasses} ${buttonClassName}`}
      >
        <FaCreditCard className="h-4 w-4" />
        Pay Now
      </button>
    </Link>
  );
};

export default PayNowButton;