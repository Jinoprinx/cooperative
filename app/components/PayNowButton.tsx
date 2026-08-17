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
    sm: 'py-2 sm:py-2.5 px-3 sm:px-5 text-[9px] sm:text-[10px] tracking-wider',
    md: 'py-2.5 sm:py-3.5 md:py-4 px-3.5 sm:px-6 md:px-8 text-[10px] sm:text-xs tracking-normal sm:tracking-[0.15em]',
    lg: 'py-3 sm:py-4 md:py-5 px-4 sm:px-8 md:px-10 text-xs sm:text-sm tracking-normal sm:tracking-[0.2em]',
  }[size];

  return (
    <Link href="/payment/upload-receipt" className={`block ${className} max-w-full`}>
      <button
        onClick={handleClick}
        className={`w-full bg-primary hover:bg-primary-dark text-white font-black rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-2.5 uppercase transition-all duration-300 shadow-glow-sm border-none active:scale-95 cursor-pointer max-w-full ${sizeClasses} ${buttonClassName}`}
      >
        <FaCreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        <span className="truncate">Pay Now</span>
      </button>
    </Link>
  );
};

export default PayNowButton;