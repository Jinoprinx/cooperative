'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { 
  FaSearch, 
  FaUserShield, 
  FaKey, 
  FaEnvelope, 
  FaCheckCircle,
  FaArrowLeft,
  FaUndo
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function AccountRecovery() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/users/search`, {
        params: { query },
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data);
      if (response.data.length === 0) toast.error('No members found matching that criteria');
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Global search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setResetting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/users/${selectedUser._id}/reset-password`, {
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Member password successfully updated');
      setSelectedUser(null);
      setNewPassword('');
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset member password');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-4xl">
        <h2 className="text-3xl font-black tracking-tight mb-4">Account <span className="text-amber-500">Recovery Center</span></h2>
        <p className="text-white/40 text-sm font-medium leading-relaxed mb-10">
          Search across all cooperatives to identify members who have lost access to their accounts. 
          You can update their security credentials and verify their identity here.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative group mb-12">
           <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
              <FaSearch className="text-amber-500/50 group-focus-within:text-amber-500 transition-colors" />
           </div>
           <input 
             type="text" 
             placeholder="Search by name, email, or phone number..."
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             className="w-full bg-[#0a0a0a] border border-white/5 rounded-3xl py-6 pl-20 pr-40 text-white font-bold outline-none focus:border-amber-500/50 transition-all text-sm"
           />
           <button 
             type="submit" 
             disabled={loading}
             className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-500 text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
           >
             {loading ? 'Searching...' : 'Initiate Scan'}
           </button>
        </form>

        {selectedUser ? (
          /* User Control Panel */
          <div className="bg-[#0a0a0a] border border-amber-500/30 rounded-[3rem] p-12 relative overflow-hidden animate-float">
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px]" />
             
             <button 
               onClick={() => setSelectedUser(null)}
               className="flex items-center gap-2 text-white/40 hover:text-amber-500 transition-colors mb-8 text-[10px] font-black uppercase tracking-widest"
             >
                <FaArrowLeft /> Cancel Action
             </button>

             <div className="flex items-center gap-8 mb-12 relative">
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/20">
                   <FaUserShield className="text-amber-500 text-3xl" />
                </div>
                <div>
                   <h3 className="text-3xl font-black tracking-tight">{selectedUser.firstName} {selectedUser.lastName}</h3>
                   <div className="flex gap-4 mt-2">
                      <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                         {selectedUser.tenantId?.name || 'No Tenant'}
                      </span>
                      <span className="text-white/30 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                         {selectedUser.role}
                      </span>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                <div className="space-y-6">
                   <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2 ml-1">Current Credentials</label>
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                         <FaEnvelope className="text-amber-500/40" />
                         <span className="text-sm font-medium">{selectedUser.email}</span>
                      </div>
                   </div>
                   <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                      <FaUserShield className="text-amber-500/40" />
                      <span className="text-sm font-medium">{selectedUser.phoneNumber}</span>
                   </div>
                </div>

                <div className="space-y-6">
                   <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] block mb-2 ml-1">Override Security</label>
                   <div className="relative">
                      <FaKey className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-500/40" />
                      <input 
                        type="text" 
                        placeholder="Enter temporary password..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-2xl p-6 pl-16 text-sm font-bold text-white outline-none focus:border-amber-500/50 transition-all"
                      />
                   </div>
                   <button 
                     onClick={handleResetPassword}
                     disabled={resetting}
                     className="w-full bg-amber-500 text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all disabled:opacity-50"
                   >
                     {resetting ? 'Overwriting...' : 'Authorize New Password'}
                   </button>
                </div>
             </div>
          </div>
        ) : (
          /* Search Results */
          <div className="grid grid-cols-1 gap-4">
            {results.map((user) => (
              <div 
                key={user._id} 
                onClick={() => setSelectedUser(user)}
                className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:border-amber-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-all duration-500">
                      <FaUserShield className="text-xl" />
                   </div>
                   <div>
                      <p className="font-bold text-lg group-hover:text-amber-500 transition-colors">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                        {user.tenantId?.name || 'GLOBAL'} • {user.email}
                      </p>
                   </div>
                </div>
                <div className="text-amber-500/0 group-hover:text-amber-500 transition-all flex items-center gap-2">
                   <span className="text-[8px] font-black uppercase tracking-widest">Access Control</span>
                   <FaUndo className="text-xs" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
