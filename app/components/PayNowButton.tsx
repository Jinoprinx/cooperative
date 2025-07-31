"use client";

import React from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";


const PayNowButton = () => {
  const router = useRouter();

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('transaction-success'));
  };

  return (
    <Link href="/payment/upload-receipt">
      <button
        onClick={handleClick}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Pay Now
      </button>
    </Link>
  );
};

export default PayNowButton;