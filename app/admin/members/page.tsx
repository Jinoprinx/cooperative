'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { Member } from '@/app/types';
import Link from 'next/link';

export default function Members() {
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', accountNumber: '', joinDate: '', accountBalance: 0, phoneNumber: '' });
  const [loading, setLoading] = useState(true);

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
    member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.lastName.toLowerCase().includes(searchQuery.toLowerCase())
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
      setNewMember({ firstName: '', lastName: '', accountNumber: '', joinDate: '', accountBalance: 0, phoneNumber: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding member:', error);
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
      setMembers(members.filter(member => member.id !== memberToDelete));
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Error deleting member:', error);
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
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Members</h1>
      <div className="flex items-center justify-between">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full max-w-xs pl-10"
          />
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <FaUserPlus className="mr-2" /> Add Member
        </button>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Account Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <Link href={`/admin/members/${member.id}/payment-ledger`} className="text-primary hover:underline">
                      {`${member.firstName} ${member.lastName}`}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{member.accountNumber}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(member.joinDate)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatCurrency(member.accountBalance)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button onClick={() => handleDeleteClick(member.id)} className="btn btn-error btn-sm">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Add New Member</h3>
            <form onSubmit={handleAddMember}>
              <input
                type="text"
                placeholder="First Name"
                value={newMember.firstName}
                onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                className="input input-bordered w-full mt-2"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newMember.lastName}
                onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                className="input input-bordered w-full mt-2"
                required
              />
              <input
                type="text"
                placeholder="Account Number"
                value={newMember.accountNumber}
                onChange={(e) => setNewMember({ ...newMember, accountNumber: e.target.value })}
                className="input input-bordered w-full mt-2"
                required
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={newMember.phoneNumber}
                onChange={(e) => setNewMember({ ...newMember, phoneNumber: e.target.value })}
                className="input input-bordered w-full mt-2"
                required
              />
              <input
                type="date"
                value={newMember.joinDate}
                onChange={(e) => setNewMember({ ...newMember, joinDate: e.target.value })}
                className="input input-bordered w-full mt-2"
                required
              />
              <input
                type="number"
                placeholder="Initial Balance"
                value={newMember.accountBalance || ''}
                onChange={(e) => setNewMember({ ...newMember, accountBalance: Number(e.target.value) })}
                className="input input-bordered w-full mt-2"
                required
              />
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">Add</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn">Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Confirm Deletion</h3>
            <p>Are you sure you want to delete this member? This action cannot be undone.</p>
            <div className="modal-action">
              <button onClick={handleConfirmDelete} className="btn btn-error">Delete</button>
              <button onClick={() => setShowDeleteModal(false)} className="btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}