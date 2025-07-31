'use client';

import { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import ProfileImageUpload from '@/app/components/auth/ProfileImageUpload';
import { useAuth } from '@/app/context/AuthContext';

export default function AdminAccount() {
  const { user, loading, isAuthenticated } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const router = useRouter();

  const handleUpdateSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
        { firstName: user.firstName, lastName: user.lastName, profileImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="text-black">Loading account history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Account Settings</h1>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-lg font-medium text-gray-800">Profile Image</h2>
        <div className="mt-4">
          <ProfileImageUpload setProfileImage={setProfileImage} />
        </div>
        <div className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="First Name"
            value={user?.firstName || ''}
            disabled
            className="input input-bordered w-full bg-gray-100"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={user?.lastName || ''}
            disabled
            className="input input-bordered w-full bg-gray-100"
          />
          <input
            type="text"
            placeholder="Email"
            value={user?.email || ''}
            disabled
            className="input input-bordered w-full bg-gray-100"
          />
          <button onClick={handleUpdateSettings} className="btn btn-primary">
            <FaUserCircle className="mr-2" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
