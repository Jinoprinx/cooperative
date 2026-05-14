'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaTrash, FaUserShield, FaUserEdit } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';
import { Member } from '@/app/types';
import Link from 'next/link';

export default function Members() {
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', accountNumber: '', joinDate: '', accountBalance: 0, phoneNumber: '', email: '' });
  const [loading, setLoading] = useState(true);
  const { isMainAdmin } = useAuth();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('token'); // Assuming token is stored here after login
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(response.data.members);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching members:', error);
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member =>
    (member.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.lastName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const memberToAdd = { ...newMember, accountBalance: Number(newMember.accountBalance) };
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/members`, memberToAdd, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMembers([...members, response.data.member]);
      setNewMember({ firstName: '', lastName: '', accountNumber: '', joinDate: '', accountBalance: 0, phoneNumber: '', email: '' });
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.message || 'Failed to enrol member. Please check your connection and try again.');
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setMemberToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/members/${memberToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(members.filter(member => member._id !== memberToDelete));
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const handleToggleAdmin = async (member: Member) => {
    if (!isMainAdmin) return;
    try {
      const token = localStorage.getItem('token');
      const newRole = member.role === 'admin' ? 'member' : 'admin';
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/admin/members/${member._id}`,
        { isAdmin: newRole === 'admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMembers(members.map(m => m._id === member._id ? { ...m, role: newRole } : m));
      alert(response.data.message);
    } catch (error: any) {
      console.error('Error toggling admin role:', error);
      alert(error.response?.data?.message || 'Failed to update role');
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="text-secondary-text">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Directorship Control</span>
          <h1 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
            Member <span className="text-tertiary-text">Directory</span>
          </h1>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn-primary flex items-center gap-3 px-8 py-4 rounded-2xl group transition-all duration-500 hover:scale-[1.02]"
        >
          <FaUserPlus className="h-5 w-5 group-hover:animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-black">Enroll Member</span>
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative flex-1 group">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/20 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by first or last name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-3xl py-5 pl-16 pr-8 text-primary-text text-sm focus:border-primary/50 outline-none transition-all placeholder:text-tertiary-text font-bold"
          />
        </div>
      </div>

      <div className="card-premium p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Full Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Account ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Entry Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Balance</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Access Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredMembers.map((member) => (
                <tr key={member._id} className="group hover:bg-surface-lighter transition-colors">
                  <td className="px-8 py-6">
                    <Link href={`/admin/members/${member._id}/payment-ledger`} className="flex items-center gap-4 group/name">
                       <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center font-black text-tertiary-text group-hover/name:text-primary group-hover/name:border-primary/40 transition-all duration-300">
                         {member.firstName[0]}{member.lastName[0]}
                       </div>
                       <div className="flex flex-col">
                         <span className="text-primary-text group-hover/name:text-primary transition-colors font-bold">{member.firstName} {member.lastName}</span>
                         <span className="text-[10px] text-tertiary-text font-black uppercase tracking-tighter">View Financials</span>
                       </div>
                    </Link>
                  </td>
                  <td className="px-8 py-6 text-sm text-secondary-text font-mono tracking-wider">{member.accountNumber}</td>
                  <td className="px-8 py-6 text-xs text-tertiary-text">{formatDate(member.joinDate)}</td>
                  <td className="px-8 py-6">
                     <span className="text-lg font-black text-primary-text tracking-tighter shadow-glow-sm">{formatCurrency(member.accountBalance)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      member.role === 'admin' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-surface border-border text-tertiary-text'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${member.role === 'admin' ? 'bg-purple-400 animate-pulse' : 'bg-white/20'}`} />
                      {member.role || 'member'}
                    </span>
                    {member.isManual && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-amber-500/10 border-amber-500/20 text-amber-500 ml-2">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2 transition-opacity duration-300">
                      {isMainAdmin && (
                        <>
                          <button
                            onClick={() => handleToggleAdmin(member)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                              member.role === 'admin' 
                                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white' 
                                : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white'
                            }`}
                            title={member.role === 'admin' ? "Restrict Access" : "Grant Access"}
                          >
                            <FaUserShield className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(member._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMembers.length === 0 && (
          <div className="p-32 text-center bg-surface">
            <p className="text-tertiary-text text-sm font-black uppercase tracking-[0.4em]">No members found in directory</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setShowAddModal(false)} />
          <div className="relative glass-card p-12 rounded-[3.5rem] border border-border w-full max-w-xl shadow-2xl">
            <div className="mb-10 text-center">
               <h3 className="text-3xl font-black text-primary-text tracking-tighter mb-2">Enroll Manual Member</h3>
               <p className="text-tertiary-text text-xs font-bold uppercase tracking-widest">For members who cannot manage their accounts digitally. Default password: <span className="text-primary">password123</span></p>
            </div>
            
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  className="w-full bg-surface border border-border rounded-2xl p-5 text-primary-text outline-none focus:border-primary transition-all font-bold"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  className="w-full bg-surface border border-border rounded-2xl p-5 text-primary-text outline-none focus:border-primary transition-all font-bold"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Unique Mobile Number"
                value={newMember.phoneNumber}
                onChange={(e) => setNewMember({ ...newMember, phoneNumber: e.target.value })}
                className="w-full bg-surface border border-border rounded-2xl p-5 text-primary-text outline-none focus:border-primary transition-all font-bold"
                required
              />
              <input
                type="email"
                placeholder="Email Address (Security)"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="w-full bg-surface border border-border rounded-2xl p-5 text-primary-text outline-none focus:border-primary transition-all font-bold"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                   <div className="absolute top-2 left-5 text-[8px] font-black text-tertiary-text uppercase tracking-widest">Join Date</div>
                   <input
                    type="date"
                    value={newMember.joinDate}
                    onChange={(e) => setNewMember({ ...newMember, joinDate: e.target.value })}
                    className="w-full bg-surface border border-border rounded-2xl p-5 pt-7 text-primary-text outline-none focus:border-primary transition-all font-bold uppercase text-xs"
                    required
                  />
                </div>
                <div className="relative">
                   <div className="absolute top-2 left-5 text-[8px] font-black text-tertiary-text uppercase tracking-widest">Opening Balance</div>
                   <input
                    type="number"
                    placeholder="0.00"
                    value={newMember.accountBalance || ''}
                    onChange={(e) => setNewMember({ ...newMember, accountBalance: Number(e.target.value) })}
                    className="w-full bg-surface border border-border rounded-2xl p-5 pt-7 text-primary-text outline-none focus:border-primary transition-all font-bold"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-12">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary py-4 rounded-2xl">Discard</button>
                <button type="submit" className="flex-[2] btn-primary py-4 rounded-2xl shadow-none">Enrol Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowDeleteModal(false)} />
          <div className="relative glass-card p-10 rounded-[3rem] border border-red-500/20 w-full max-w-sm text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
               <FaTrash className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-primary-text tracking-tighter mb-4">Purge Member?</h3>
            <p className="text-tertiary-text text-sm font-medium mb-8">This will irreversibly remove the member and all associated financial records from the platform.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 btn-secondary text-xs uppercase tracking-widest py-3 rounded-2xl">Cancel</button>
              <button onClick={handleConfirmDelete} className="flex-1 btn-primary bg-red-600 hover:bg-red-500 text-xs uppercase tracking-widest py-3 rounded-2xl shadow-none border-none">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}