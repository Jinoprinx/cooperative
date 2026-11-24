'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaTrash, FaUserShield, FaUserEdit, FaHistory, FaTimes, FaExchangeAlt, FaKey, FaCopy, FaCheck, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';
import { Member } from '@/app/types';
import Link from 'next/link';

export default function Members() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', accountNumber: '', joinDate: '', accountBalance: 0, phoneNumber: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const { isMainAdmin } = useAuth();

  const [showSuretyModal, setShowSuretyModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [suretyHistory, setSuretyHistory] = useState<any[]>([]);
  const [loadingSurety, setLoadingSurety] = useState(false);

  const [showAccessRoleModal, setShowAccessRoleModal] = useState(false);
  const [memberForAccessChange, setMemberForAccessChange] = useState<Member | null>(null);
  const [updatingAccessRole, setUpdatingAccessRole] = useState(false);
  const [accessRoleError, setAccessRoleError] = useState<string | null>(null);
  const [issuedCredentials, setIssuedCredentials] = useState<{
    memberName: string;
    memberIdentifier?: string;
    newAccessRole: 'Manual Member' | 'Regular Member';
    isManual: boolean;
    loginIdentifier: string;
    email: string | null;
    phoneNumber: string | null;
    temporaryPassword: string;
    emailSent: boolean;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<'password' | 'all' | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/members`, {
          params: { page, limit: 10, search: debouncedSearchQuery },
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(response.data.members || []);
        setTotalPages(response.data.totalPages || 1);
        setLoading(false);
        setInitialLoading(false);
      } catch (error) {
        console.error('Error fetching members:', error);
        setLoading(false);
        setInitialLoading(false);
      }
    };
    fetchMembers();
  }, [page, debouncedSearchQuery]);

  const filteredMembers = members;

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

  const handleAccessRoleClick = (member: Member) => {
    if (!isMainAdmin) return;
    if (member.role === 'admin' || member.role === 'super-admin') return;
    setMemberForAccessChange(member);
    setAccessRoleError(null);
    setShowAccessRoleModal(true);
  };

  const handleDiscardAccessRoleChange = () => {
    if (updatingAccessRole) return;
    setShowAccessRoleModal(false);
    setMemberForAccessChange(null);
    setAccessRoleError(null);
  };

  const handleConfirmAccessRoleChange = async () => {
    if (!memberForAccessChange || !isMainAdmin) return;
    const targetIsManual = !memberForAccessChange.isManual;
    setUpdatingAccessRole(true);
    setAccessRoleError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/members/${memberForAccessChange._id}/access-type`,
        { isManual: targetIsManual },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedIsManual = Boolean(response.data?.member?.isManual ?? targetIsManual);
      setMembers((prev) =>
        prev.map((m) =>
          m._id === memberForAccessChange._id
            ? { ...m, isManual: updatedIsManual, mustChangePassword: true }
            : m
        )
      );

      const creds = response.data?.defaultCredentials;
      setShowAccessRoleModal(false);
      setMemberForAccessChange(null);

      if (creds?.temporaryPassword) {
        setIssuedCredentials({
          memberName: `${memberForAccessChange.firstName} ${memberForAccessChange.lastName}`,
          memberIdentifier: memberForAccessChange.memberIdentifier,
          newAccessRole: updatedIsManual ? 'Manual Member' : 'Regular Member',
          isManual: updatedIsManual,
          loginIdentifier: creds.loginIdentifier || memberForAccessChange.phoneNumber || memberForAccessChange.email,
          email: creds.email || null,
          phoneNumber: creds.phoneNumber || null,
          temporaryPassword: creds.temporaryPassword,
          emailSent: Boolean(creds.emailSent),
        });
      }
    } catch (error: any) {
      console.error('Error updating member access role:', error);
      setAccessRoleError(error.response?.data?.message || 'Failed to update member access role. Please try again.');
    } finally {
      setUpdatingAccessRole(false);
    }
  };

  const handleCopyCredential = async (text: string, field: 'password' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      alert('Unable to copy automatically. Please highlight and copy the temporary password manually.');
    }
  };

  const handleCloseCredentialsModal = () => {
    setIssuedCredentials(null);
    setCopiedField(null);
  };

  const handleViewSuretyHistory = async (member: Member) => {
    setSelectedMember(member);
    setShowSuretyModal(true);
    setLoadingSurety(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/members/${member._id}/surety-history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuretyHistory(response.data);
    } catch (error) {
      console.error('Error fetching member surety history:', error);
      alert('Failed to load surety record.');
    } finally {
      setLoadingSurety(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (initialLoading) {
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
          {loading ? (
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          ) : (
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" />
          )}
          <input
            type="text"
            placeholder="Search by first or last name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-surface border border-border rounded-3xl py-5 pl-16 pr-8 text-primary-text text-sm focus:border-primary/50 outline-none transition-all placeholder:text-tertiary-text font-bold"
          />
        </div>
      </div>

      <div className={`card-premium p-0 overflow-hidden transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Full Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Member ID / Account No.</th>
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
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm text-primary-text font-bold tracking-wider">{member.memberIdentifier || 'N/A'}</span>
                      <span className="text-[10px] text-tertiary-text font-mono font-bold tracking-widest">{member.accountNumber}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs text-tertiary-text">{formatDate(member.joinDate)}</td>
                  <td className="px-8 py-6">
                     <span className="text-lg font-black text-primary-text tracking-tighter shadow-glow-sm">{formatCurrency(member.accountBalance)}</span>
                  </td>
                  <td className="px-8 py-6">
                    {member.role === 'admin' || member.role === 'super-admin' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-purple-500/10 border-purple-500/20 text-purple-400">
                        <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                        {member.role}
                      </span>
                    ) : isMainAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleAccessRoleClick(member)}
                        title={member.isManual ? 'Click to switch back to Regular Member' : 'Click to switch to Manual Member'}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-200 cursor-pointer group/role ${
                          member.isManual
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 hover:border-amber-500'
                            : 'bg-surface border-border text-tertiary-text hover:border-primary/60 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${member.isManual ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500/70 group-hover/role:bg-primary'}`} />
                        <span>{member.isManual ? 'Manual' : 'Member'}</span>
                        <FaExchangeAlt className="h-2.5 w-2.5 opacity-60 group-hover/role:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span
                        title="Only the Main Admin can change member access role"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          member.isManual
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            : 'bg-surface border-border text-tertiary-text'
                        }`}
                      >
                        <div className={`w-1 h-1 rounded-full ${member.isManual ? 'bg-amber-500' : 'bg-white/20'}`} />
                        {member.isManual ? 'Manual' : 'Member'}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2 transition-opacity duration-300">
                      <button
                        onClick={() => handleViewSuretyHistory(member)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                        title="View Surety History"
                      >
                        <FaHistory className="h-4 w-4" />
                      </button>
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
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-8 py-5 border-t border-border bg-surface/50">
            <div className="text-[10px] text-tertiary-text font-black uppercase tracking-widest">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-4">
              {page > 1 && (
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="px-6 py-2.5 rounded-xl border border-border text-[10px] uppercase tracking-widest font-black text-primary-text hover:bg-surface-lighter transition-all"
                >
                  Back
                </button>
              )}
              {page < totalPages && (
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  className="btn-primary px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black"
                >
                  Next
                </button>
              )}
            </div>
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
                    className="w-full bg-surface border border-border rounded-2xl p-5 pt-7 text-primary-text outline-none focus:border-primary transition-all font-bold text-xs"
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

      {showAccessRoleModal && memberForAccessChange && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" onClick={handleDiscardAccessRoleChange} />
          <div className="relative glass-card p-8 sm:p-10 rounded-[2.5rem] border border-amber-500/25 w-full max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <FaExchangeAlt className="h-7 w-7" />
            </div>

            <div className="text-center mb-6">
              <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.35em] block mb-2">
                Confirm Access Role Change
              </span>
              <h3 className="text-2xl font-black text-primary-text tracking-tighter mb-2">
                Switch Member Access Type?
              </h3>
              <p className="text-secondary-text text-sm font-bold">
                {memberForAccessChange.firstName} {memberForAccessChange.lastName}
                {memberForAccessChange.memberIdentifier ? ` (#${memberForAccessChange.memberIdentifier})` : ''}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-surface border border-border mb-5">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                memberForAccessChange.isManual
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-surface-lighter border-border text-tertiary-text'
              }`}>
                {memberForAccessChange.isManual ? 'Manual' : 'Member'}
              </span>
              <span className="text-tertiary-text font-black text-xs">→</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                !memberForAccessChange.isManual
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              }`}>
                {!memberForAccessChange.isManual ? 'Manual Member' : 'Regular Member'}
              </span>
            </div>

            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 mb-6 space-y-2 text-left">
              <div className="flex items-start gap-2.5">
                <FaExclamationTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-secondary-text leading-relaxed font-medium">
                  Confirming this change will immediately <strong className="text-primary-text">revoke active sessions</strong>, generate a <strong className="text-primary-text">one-time temporary login credential</strong>, and require the member to set a new password on their next login.
                </p>
              </div>
            </div>

            {accessRoleError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 text-center">
                {accessRoleError}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleDiscardAccessRoleChange}
                disabled={updatingAccessRole}
                className="flex-1 btn-secondary text-xs uppercase tracking-widest font-black py-3.5 rounded-2xl disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleConfirmAccessRoleChange}
                disabled={updatingAccessRole}
                className="flex-1 btn-primary text-xs uppercase tracking-widest font-black py-3.5 rounded-2xl shadow-none border-none disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingAccessRole ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {issuedCredentials && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />
          <div className="relative glass-card p-8 sm:p-10 rounded-[2.5rem] border border-emerald-500/25 w-full max-w-lg shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-5 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <FaKey className="h-7 w-7" />
            </div>

            <div className="text-center mb-6">
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.35em] block mb-2">
                Default Login Credential Issued
              </span>
              <h3 className="text-2xl font-black text-primary-text tracking-tighter mb-1">
                Access Role Updated
              </h3>
              <p className="text-tertiary-text text-xs font-bold uppercase tracking-wider">
                {issuedCredentials.memberName} is now a{' '}
                <span className={issuedCredentials.isManual ? 'text-amber-500' : 'text-emerald-500'}>
                  {issuedCredentials.newAccessRole}
                </span>
              </p>
            </div>

            <div className="space-y-3 bg-surface border border-border rounded-2xl p-5 mb-5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-tertiary-text block mb-1">
                  Login Identifier (Phone / Email)
                </span>
                <p className="text-sm font-bold text-primary-text break-all">
                  {issuedCredentials.loginIdentifier}
                  {issuedCredentials.email && issuedCredentials.email !== issuedCredentials.loginIdentifier && (
                    <span className="block text-xs text-tertiary-text font-medium mt-0.5">{issuedCredentials.email}</span>
                  )}
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <span className="text-[9px] font-black uppercase tracking-widest text-tertiary-text block mb-1.5">
                  One-Time Temporary Password
                </span>
                <div className="flex items-center justify-between gap-3 bg-surface-lighter border border-amber-500/30 rounded-xl px-4 py-3">
                  <code className="text-base font-mono font-black tracking-wider text-amber-500 select-all">
                    {issuedCredentials.temporaryPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyCredential(issuedCredentials.temporaryPassword, 'password')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black text-[10px] font-black uppercase tracking-wider transition-all shrink-0"
                  >
                    {copiedField === 'password' ? <FaCheck className="h-3 w-3" /> : <FaCopy className="h-3 w-3" />}
                    {copiedField === 'password' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className={`flex items-start gap-2.5 p-3.5 rounded-2xl border mb-4 text-xs font-medium ${
              issuedCredentials.emailSent
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <FaEnvelope className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {issuedCredentials.emailSent
                  ? `A security alert with the temporary password was emailed to ${issuedCredentials.email}.`
                  : 'No valid email was sent (placeholder email or mail delivery unavailable). Please share these credentials securely with the member.'}
              </span>
            </div>

            <p className="text-[11px] text-tertiary-text font-medium text-center mb-6 leading-relaxed">
              This temporary password is displayed <strong className="text-primary-text">only once</strong> and cannot be retrieved after closing. The member will be required to choose a new password immediately on next login.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  handleCopyCredential(
                    `Member: ${issuedCredentials.memberName}\nAccess Role: ${issuedCredentials.newAccessRole}\nLogin: ${issuedCredentials.loginIdentifier}\nTemporary Password: ${issuedCredentials.temporaryPassword}\n(You will be prompted to change this password on your next login.)`,
                    'all'
                  )
                }
                className="flex-1 btn-secondary py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {copiedField === 'all' ? <FaCheck className="h-3.5 w-3.5 text-emerald-500" /> : <FaCopy className="h-3.5 w-3.5" />}
                {copiedField === 'all' ? 'Copied All' : 'Copy Details'}
              </button>
              <button
                type="button"
                onClick={handleCloseCredentialsModal}
                className="flex-1 btn-primary py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-none border-none"
              >
                Done
              </button>
            </div>
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

      {showSuretyModal && selectedMember && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl" onClick={() => setShowSuretyModal(false)} />
          <div className="relative glass-card p-10 rounded-[3rem] border border-border w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
            
            <div className="relative flex justify-between items-start mb-8 flex-shrink-0">
               <div>
                  <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Security Protocol</span>
                  <h3 className="text-3xl font-black text-primary-text tracking-tighter">
                    Surety History: <span className="text-tertiary-text">{selectedMember.firstName} {selectedMember.lastName}</span>
                  </h3>
               </div>
               <button onClick={() => setShowSuretyModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-border text-tertiary-text hover:text-primary-text transition-colors">
                  <FaTimes className="h-6 w-6" />
               </button>
            </div>

            {loadingSurety ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="loader h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
              </div>
            ) : suretyHistory.length === 0 ? (
              <div className="flex-1 py-20 text-center bg-surface-lighter rounded-3xl border border-dashed border-border mb-6">
                 <p className="text-tertiary-text text-xs font-black uppercase tracking-widest italic">No surety records found for this member</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-6">
                <div className="card-premium p-0 overflow-hidden bg-surface border-border">
                  <table className="w-full text-left border-collapse font-bold">
                    <thead>
                      <tr className="border-b border-border bg-surface-lighter">
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Associated Party</th>
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Endorsed Value</th>
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Verification Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {suretyHistory.map((item) => {
                        const isApplicant = item.user?._id === selectedMember._id || item.user === selectedMember._id;

                        const mySuretyObj = item.sureties?.find((s: any) => s.user?._id === selectedMember._id || s.user === selectedMember._id);
                        const suretyStatus = mySuretyObj?.status || 'unknown';

                        const approvedCount = item.sureties?.filter((s: any) => s.status === 'approved').length || 0;
                        const totalCount = item.sureties?.length || 0;
                        const hasRejected = item.sureties?.some((s: any) => s.status === 'rejected');

                        return (
                          <tr key={item._id} className="hover:bg-surface-lighter transition-colors">
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                isApplicant ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}>
                                {isApplicant ? 'Applicant' : 'Surety'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-primary-text">
                              {isApplicant ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest">Sureties:</span>
                                  <span className="font-bold">
                                    {item.sureties && item.sureties.length > 0
                                      ? item.sureties.map((s: any) => {
                                          const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown member';
                                          return `${name} (${s.status})`;
                                        }).join(', ')
                                      : 'No sureties'}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest">Applicant:</span>
                                  <span className="font-bold">
                                    {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown Applicant'}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-primary-text">
                              ₦{item.amount?.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              {isApplicant ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                  approvedCount === totalCount ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                  hasRejected ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                }`}>
                                  {approvedCount}/{totalCount} Approved
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                  suretyStatus === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                }`}>
                                  {suretyStatus}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-tertiary-text">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex-shrink-0">
               <button onClick={() => setShowSuretyModal(false)} className="w-full btn-primary py-4 text-xs font-black tracking-widest uppercase rounded-2xl shadow-none border-none">Dismiss Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}