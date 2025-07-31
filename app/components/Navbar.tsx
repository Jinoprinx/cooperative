'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const Navbar = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let prevScrollPos = window.pageYOffset;

    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      prevScrollPos = currentScrollPos;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 z-30 w-full transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/"
          className="text-2xl font-bold text-white transition-transform hover:scale-105">Logo
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/auth/login"
            className="rounded-full px-6 py-2 font-semibold text-white no-underline transition-transform hover:scale-105"
          >
            Welcome
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
