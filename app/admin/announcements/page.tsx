'use client';

import { useState, useEffect } from 'react';
import { FaBullhorn, FaPlus, FaTrash, FaEdit, FaCheckCircle, FaExclamationCircle, FaTimes, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Modal / Form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);

  const { token } = useAuth();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/announcements/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to fetch announcements'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnnouncements();
    }
  }, [token]);

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setFormData({ title: '', content: '' });
    setMessage({ type: '', text: '' });
    setShowFormModal(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({ title: announcement.title, content: announcement.content });
    setMessage({ type: '', text: '' });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      if (editingAnnouncement) {
        // Update existing announcement
        const res = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/announcements/${editingAnnouncement._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({ type: 'success', text: 'Announcement updated successfully' });
        setAnnouncements(announcements.map(a => a._id === editingAnnouncement._id ? res.data.announcement : a));
      } else {
        // Create new announcement
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/announcements`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({ type: 'success', text: 'Announcement created successfully' });
        setAnnouncements([res.data.announcement, ...announcements]);
      }
      setTimeout(() => setShowFormModal(false), 800);
    } catch (err: any) {
      console.error('Error saving announcement:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save announcement'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/announcements/${announcement._id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnnouncements(announcements.map(a => a._id === announcement._id ? res.data.announcement : a));
    } catch (err: any) {
      console.error('Error toggling announcement active status:', err);
      alert(err.response?.data?.message || 'Failed to update announcement status');
    }
  };

  const handleDeleteClick = (id: string) => {
    setAnnouncementToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/announcements/${announcementToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(announcements.filter(a => a._id !== announcementToDelete));
      setShowDeleteModal(false);
      setAnnouncementToDelete(null);
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      alert(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="text-secondary-text">Loading notices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Broadcasting Board</span>
          <h1 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
            Cooperative <span className="text-tertiary-text">Announcements</span>
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-primary flex items-center gap-3 px-8 py-4 rounded-2xl group transition-all duration-500 hover:scale-[1.02]"
        >
          <FaPlus className="h-5 w-5 group-hover:animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-black">Draft Notice</span>
        </button>
      </div>

      {/* Announcements Table Card */}
      <div className="card-premium p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Notice Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Author / Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Visibility</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {announcements.map((announcement) => (
                <tr key={announcement._id} className="group hover:bg-surface-lighter transition-colors">
                  <td className="px-8 py-6 max-w-md">
                    <div className="flex flex-col gap-1">
                      <span className="text-primary-text font-bold text-base leading-snug">{announcement.title}</span>
                      <span className="text-xs text-tertiary-text line-clamp-2 leading-relaxed">{announcement.content}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm text-primary-text font-bold">
                        {announcement.createdBy ? `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}` : 'System Admin'}
                      </span>
                      <span className="text-[10px] text-tertiary-text font-bold uppercase tracking-wider">{formatDate(announcement.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button
                      onClick={() => handleToggleActive(announcement)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        announcement.isActive 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-surface border-border text-tertiary-text'
                      }`}
                      title={announcement.isActive ? "Deactivate Notice" : "Activate Notice"}
                    >
                      <div className={`w-1 h-1 rounded-full ${announcement.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                      {announcement.isActive ? 'Active' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(announcement)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                        title="Edit announcement"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(announcement._id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        title="Delete announcement"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {announcements.length === 0 && (
          <div className="p-32 text-center bg-surface">
            <FaBullhorn className="h-12 w-12 text-tertiary-text/30 mx-auto mb-4" />
            <p className="text-tertiary-text text-sm font-black uppercase tracking-[0.4em]">No announcements found</p>
            <p className="text-xs text-tertiary-text/60 uppercase tracking-widest mt-1">Add your first dashboard notice above.</p>
          </div>
        )}
      </div>

      {/* Creation / Editing Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl glass-card border border-border rounded-[2.5rem] bg-surface p-8 shadow-2xl animate-scaleUp">
            
            {/* Close Button */}
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-tertiary-text hover:text-primary-text transition-all"
            >
              <FaTimes className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="mb-8 flex items-center gap-3">
              <FaBullhorn className="text-primary h-6 w-6" />
              <h2 className="text-2xl font-black tracking-tighter text-primary-text">
                {editingAnnouncement ? 'Modify' : 'Draft'} <span className="text-tertiary-text">Notice</span>
              </h2>
            </div>

            {/* Status Alert Messages */}
            {message.text && (
              <div className={`p-4 rounded-xl flex items-center border mb-6 ${
                message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                {message.type === 'success' ? <FaCheckCircle className="mr-3 h-5 w-5" /> : <FaExclamationCircle className="mr-3 h-5 w-5" />}
                <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="relative group/field">
                <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Notice Title</span>
                <input
                  type="text"
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. End of Year AGM Update"
                  className="w-full bg-surface border border-border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold"
                  required
                />
              </div>

              <div className="relative group/field">
                <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Notice Body (Plain Text only)</span>
                <textarea
                  maxLength={2000}
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Type details here..."
                  className="w-full bg-surface border border-border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-medium resize-none"
                  required
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-8 py-4 rounded-2xl border border-border text-xs uppercase tracking-widest font-black text-primary-text hover:bg-surface-lighter transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary px-8 py-4 rounded-2xl text-xs uppercase tracking-widest font-black text-white hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingAnnouncement ? 'Update Notice' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md glass-card border border-border rounded-[2.5rem] bg-surface p-8 shadow-2xl animate-scaleUp">
            <h3 className="text-xl font-black tracking-tighter text-primary-text mb-4">Confirm Deletion</h3>
            <p className="text-secondary-text text-sm mb-8">Are you sure you want to delete this notice? Members will no longer see it on their dashboard. This action is irreversible.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 rounded-xl border border-border text-xs uppercase tracking-widest font-black text-primary-text hover:bg-surface-lighter transition-all"
              >
                No, Keep
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs uppercase tracking-widest font-black text-white hover:scale-[1.02] transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
