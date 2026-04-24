"use client";

import React from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { FaCreditCard } from "react-icons/fa";

const PayNowButton = () => {
  const router = useRouter();

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('transaction-success'));
  };

  return (
    <Link href="/payment/upload-receipt" className="block w-full">
      <button
        onClick={handleClick}
        className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-glow-sm border-none active:scale-95"
      >
        <FaCreditCard className="h-4 w-4" />
        Pay Now
      </button>
    </Link>
  );
};

export default PayNowButton;