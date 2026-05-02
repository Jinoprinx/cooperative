'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaGlobe, 
  FaUsers, 
  FaExchangeAlt, 
  FaArrowUp, 
  FaExternalLinkAlt,
  FaShieldAlt,
  FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching global stats:', error);
        toast.error('Failed to load platform statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Synchronizing Global Data...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Cooperatives', value: stats?.totalTenants || 0, icon: FaGlobe, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Global Members', value: stats?.totalUsers || 0, icon: FaUsers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Total Transactions', value: stats?.totalTransactions || 0, icon: FaExchangeAlt, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Platform Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
             <div className={`absolute top-0 right-0 w-32 h-32 ${card.bg} rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`} />
             
             <div className="flex items-center gap-6 relative">
                <div className={`w-16 h-16 ${card.bg} rounded-2xl flex items-center justify-center border border-white/5 transition-transform duration-500 group-hover:scale-110`}>
                   <card.icon className={`text-2xl ${card.color}`} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{card.name}</p>
                   <h3 className="text-4xl font-black tracking-tighter">{card.value.toLocaleString()}</h3>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Global Action Feed & Recent Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Recent Tenants */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Recent <span className="text-amber-500">Tenants</span></h2>
              <p className="text-xs text-white/30 font-medium">Newest cooperatives joining the platform</p>
            </div>
            <button className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {stats?.recentTenants?.map((tenant: any) => (
              <div key={tenant._id} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-all group">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 font-black">
                      {tenant.name[0]}
                   </div>
                   <div>
                      <p className="font-bold text-sm">{tenant.name}</p>
                      <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">{tenant.subdomain}.cooperatives.io</p>
                   </div>
                </div>
                <div className="text-right">
                   <span className="inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Logs / Platform Management */}
        <div className="space-y-8">
           <div className="bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/20 rounded-[3rem] p-10 relative overflow-hidden">
              <FaShieldAlt className="absolute -right-8 -bottom-8 text-[12rem] text-amber-500/5 rotate-12" />
              <h3 className="text-xl font-black mb-4 relative">Account Recovery <span className="text-amber-500">Protocol</span></h3>
              <p className="text-sm text-white/50 mb-8 leading-relaxed relative">
                Securely locate any member across all cooperatives to perform mandatory password resets or email updates.
              </p>
              <button 
                onClick={() => window.location.href = '/super-admin/recovery'}
                className="bg-amber-500 text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] relative hover:scale-105 transition-transform"
              >
                Access Recovery Tools
              </button>
           </div>

           <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10">
              <h3 className="text-xl font-black mb-6">Security Check</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 text-emerald-500 text-xs font-bold bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                    <FaCheckCircle /> All nodes operational
                 </div>
                 <div className="flex items-center gap-4 text-amber-500 text-xs font-bold bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                    <FaShieldAlt /> SSL Certificate Active
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
