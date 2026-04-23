'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaBuilding, FaSearch, FaArrowRight, FaHome } from 'react-icons/fa';
import { useTenant } from '@/app/context/TenantContext';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

interface FoundTenant {
    id: string;
    _id?: string;
    name: string;
    subdomain: string;
}

export default function TenantSelectPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { searchTenants } = useTenant();
     const router = useRouter();
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (results.length > 0 && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [results]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const found = await searchTenants(query);
            setResults(found);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (tenant: FoundTenant) => {
        // Construct the new URL (handles localhost and production)
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol;

        let newHostname = '';
        const parts = hostname.split('.');

        if (hostname === 'localhost' || (parts.length > 1 && parts[parts.length - 1] === 'localhost')) {
            // e.g. coopa.localhost:3000
            newHostname = `${tenant.subdomain}.localhost`;
        } else {
            // e.g. coopa.cooperatives.io
            // If we are at cooperatives.io or www.cooperatives.io
            if (parts.length <= 2 || parts[0] === 'www') {
                newHostname = `${tenant.subdomain}.${hostname.replace('www.', '')}`;
            } else {
                // Already on a subdomain, replace it
                parts[0] = tenant.subdomain;
                newHostname = parts.join('.');
            }
        }

        window.location.href = `${protocol}//${newHostname}${port}/auth/login`;
    };

    return (
        <div className="min-h-screen bg-[#030711] relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#3b82f615,transparent)]" />
                <div className="noise-overlay opacity-[0.03]" />
            </div>

            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[140px] z-0"></div>
            <div className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-indigo-500/5 rounded-full blur-[160px] z-0"></div>

            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20 max-w-2xl relative z-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-primary transition-all mb-8 group"
                >
                    <FaBuilding className="text-[10px] transition-transform group-hover:-translate-y-0.5" />
                    Return Home
                </Link>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-10 border border-primary/20 shadow-glow-sm">
                        <FaBuilding className="text-2xl text-primary" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-none">
                        Locate your <span className="text-primary italic">Society.</span>
                    </h1>
                    <p className="text-sm text-white/30 font-black uppercase tracking-[0.2em] mb-12 max-w-md">
                        Enter your cooperative name to establish connection.
                    </p>

                    <div className="relative group/search mb-12">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none z-10">
                                    <FaSearch className="text-white/20 group-focus-within/search:text-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name or subdomain"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-3xl py-7 pl-16 pr-36 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-all shadow-2xl placeholder:text-white/10"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="absolute right-3 top-3 bottom-3 px-8 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:tracking-[0.2em] transition-all disabled:opacity-50 shadow-glow-sm"
                                >
                                    {loading ? 'Scanning...' : 'Search'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex items-center justify-center gap-6 my-12 opacity-30">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/50">Connectivity Options</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            const hostname = window.location.hostname;
                            const port = window.location.port ? `:${window.location.port}` : '';
                            const protocol = window.location.protocol;

                            let mainDomain = hostname;
                            const parts = hostname.split('.');

                            if (hostname.endsWith('localhost')) {
                                mainDomain = 'localhost';
                            } else if (hostname.endsWith('.vercel.app')) {
                                mainDomain = parts.slice(-3).join('.');
                            } else if (parts.length > 2 && parts[0] !== 'www') {
                                mainDomain = parts.slice(1).join('.');
                            }

                            window.location.href = `${protocol}//${mainDomain}${port}/auth/register`;
                        }}
                        className="group relative w-full py-6 mb-12 bg-white/[0.01] border border-white/5 text-white/30 text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-white/[0.03] hover:text-white hover:border-primary/20 transition-all duration-500 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        Initialize a New Cooperative Portal
                    </button>

                    <div ref={resultsRef} className="space-y-4 pt-4">
                        {results.length > 0 ? (
                            results.map((t, idx) => (
                                <motion.button
                                    key={t.subdomain}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => handleSelect(t)}
                                    className="w-full p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:bg-white/[0.04] hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden relative"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                                        <FaBuilding className="text-7xl text-white" />
                                    </div>

                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                            <span className="text-primary font-black text-2xl tracking-tighter">
                                                {t.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tighter">
                                                {t.name}
                                            </h3>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">
                                                {t.subdomain}<span className="text-primary/30">.coop.io</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-all duration-500 relative z-10">
                                        <FaArrowRight className="text-white/20 group-hover:text-white transition-all text-sm group-hover:translate-x-1" />
                                    </div>
                                </motion.button>
                            ))
                        ) : query && !loading ? (
                            <div className="text-center py-16 animate-fade-in">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">No matching societies found in registry</p>
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
