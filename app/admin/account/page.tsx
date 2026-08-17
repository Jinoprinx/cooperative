'use client';

import { useState, useEffect } from 'react';
import { FaUserCircle, FaSave, FaShieldAlt } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import ProfileImageUpload from '@/app/components/auth/ProfileImageUpload';
import { useAuth } from '@/app/context/AuthContext';

export default function AdminAccount() {
  const { user, loading, updateUser } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleUpdateSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
        { profileImage: profileImage || user.profileImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      updateUser({ ...user, profileImage: profileImage || user.profileImage });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
          <p className="text-tertiary-text">Synchronizing Identity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10 pb-20 text-primary-text max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1.5 sm:mb-2 block">Administrative Identity</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-primary-text">
            Account <span className="text-tertiary-text">Profile</span>
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:gap-10 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card-premium p-5 sm:p-8 text-center bg-surface border-border flex flex-col items-center rounded-2xl sm:rounded-[2.5rem]">
             <div className="mb-4 sm:mb-6">
               <ProfileImageUpload setProfileImage={setProfileImage} />
             </div>
             <h2 className="text-lg sm:text-xl font-black tracking-tighter text-primary-text uppercase truncate max-w-full">{user?.firstName} {user?.lastName}</h2>
             <p className="text-[10px] sm:text-xs font-bold text-tertiary-text uppercase tracking-wider mt-0.5">Directorship Account</p>
             
             <div className="mt-6 sm:mt-8 w-full pt-4 sm:pt-8 border-t border-border flex flex-col gap-2">
                <div className="flex justify-between items-center px-1 sm:px-2">
                   <span className="text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Access Role</span>
                   <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-primary/20">{user?.role}</span>
                </div>
                <div className="flex justify-between items-center px-1 sm:px-2">
                   <span className="text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Status</span>
                   <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-emerald-500/20">Active</span>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="card-premium p-5 sm:p-8 bg-surface border-border relative overflow-hidden group rounded-2xl sm:rounded-[2.5rem]">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
            
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-8">
               <FaShieldAlt className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
               <h2 className="text-base sm:text-lg font-black tracking-tighter uppercase">Protocol Details</h2>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="relative group/field">
                  <span className="absolute top-2 left-4 sm:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em]">Forename</span>
                  <input
                    type="text"
                    value={user?.firstName || ''}
                    disabled
                    className="w-full bg-surface-lighter border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 pt-7 sm:pt-8 text-primary-text/50 outline-none font-bold text-xs sm:text-sm opacity-60 cursor-not-allowed"
                  />
                </div>
                <div className="relative group/field">
                  <span className="absolute top-2 left-4 sm:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em]">Surname</span>
                  <input
                    type="text"
                    value={user?.lastName || ''}
                    disabled
                    className="w-full bg-surface-lighter border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 pt-7 sm:pt-8 text-primary-text/50 outline-none font-bold text-xs sm:text-sm opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="relative group/field">
                <span className="absolute top-2 left-4 sm:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em]">Email</span>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-surface-lighter border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 pt-7 sm:pt-8 text-primary-text/50 outline-none font-bold text-xs sm:text-sm opacity-60 cursor-not-allowed"
                />
              </div>
              
              <button 
                onClick={handleUpdateSettings} 
                className="w-full btn-primary py-4 sm:py-5 rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] flex items-center justify-center gap-3 border-none shadow-none disabled:opacity-50"
                disabled={saving}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : <FaSave className="h-4 w-4" />}
                Commit Identity Changes
              </button>
            </div>
          </div>
          
          <div className="card-premium p-4 sm:p-6 bg-amber-500/5 border border-amber-500/10 flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl">
             <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <FaShieldAlt className="h-4 w-4 sm:h-5 sm:w-5" />
             </div>
             <div>
                <p className="text-[9px] sm:text-[10px] font-black text-amber-500 uppercase tracking-wider">Security Advisory</p>
                <p className="text-[11px] sm:text-xs font-medium text-tertiary-text mt-0.5">Sensitive data like names and emails are locked. Contact system architects for protocol modifications.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
