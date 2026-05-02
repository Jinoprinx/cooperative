'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaGlobe, 
  FaPause, 
  FaPlay, 
  FaEye, 
  FaSearch,
  FaCalendarAlt,
  FaUsers
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function TenantManagement() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenants(response.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load cooperatives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const toggleStatus = async (tenantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} this cooperative?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${tenantId}/status`, {
        status: nextStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Cooperative successfully ${nextStatus}`);
      fetchTenants();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Operation failed');
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Polling Distributed Nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex justify-between items-end gap-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black tracking-tight mb-4">Cooperative <span className="text-amber-500">Fleet</span></h2>
          <p className="text-white/40 text-sm font-medium leading-relaxed">
            Manage the global fleet of cooperative tenants. Monitor their subscription health, system usage, 
            and exercise administrative control over their access status.
          </p>
        </div>

        <div className="flex-1 max-w-md relative group">
           <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors" />
           <input 
             type="text" 
             placeholder="Search fleet by name or domain..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-white font-bold outline-none focus:border-amber-500/50 transition-all text-xs"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredTenants.map((tenant) => (
          <div 
            key={tenant._id} 
            className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 hover:border-amber-500/30 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
               <div className="flex items-center gap-8">
                  <div className="w-20 h-20 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                     <FaGlobe className="text-amber-500 text-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black tracking-tight mb-1">{tenant.name}</h3>
                     <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em]">{tenant.subdomain}.cooperatives.io</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 border-l border-white/5 pl-8">
                  <div>
                     <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">Fleet Status</span>
                     <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                       tenant.status === 'suspended' 
                         ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                         : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                     }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'suspended' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                        {tenant.status || 'Active'}
                     </div>
                  </div>
                  <div>
                     <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">Deployed On</span>
                     <div className="flex items-center gap-2 text-white/60 text-[10px] font-black tracking-widest">
                        <FaCalendarAlt className="text-amber-500/40" />
                        {new Date(tenant.createdAt).toLocaleDateString('en-GB')}
                     </div>
                  </div>
                  <div className="hidden sm:block">
                     <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">Member Volume</span>
                     <div className="flex items-center gap-2 text-white font-black text-sm tracking-tighter">
                        <FaUsers className="text-blue-500/40" />
                        N/A
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <button className="bg-white/5 border border-white/10 p-4 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
                     <FaEye />
                  </button>
                  <button 
                    onClick={() => toggleStatus(tenant._id, tenant.status || 'active')}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                      tenant.status === 'suspended'
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    {tenant.status === 'suspended' ? <FaPlay /> : <FaPause />}
                    {tenant.status === 'suspended' ? 'Activate Fleet' : 'Suspend Fleet'}
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
