'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaBuilding, FaSearch, FaArrowRight, FaChevronLeft } from 'react-icons/fa';
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
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="noise-overlay" />
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20 max-w-2xl relative z-10">
                <Link 
                    href="/" 
                    className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-12 group"
                >
                    <FaChevronLeft className="text-xs transition-transform group-hover:-translate-x-1" />
                    Back to Main Site
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center mb-8">
                        <FaBuilding className="text-3xl text-primary" />
                    </div>
                    
                    <h1 className="text-5xl font-black text-foreground dark:text-white tracking-tighter mb-4">
                        Find your Cooperative
                    </h1>
                    <p className="text-lg text-muted-foreground dark:text-white/40 font-medium mb-10">
                        Enter the unique name or subdomain of your society to access your portal.
                    </p>

                    <form onSubmit={handleSearch}>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <FaSearch className="text-muted-foreground/50" />
                            </div>
                            <input
                                type="text"
                                placeholder="e.g. Ogba Citizens"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-surface dark:bg-white/[0.03] border border-border dark:border-white/[0.08] rounded-2xl py-5 pl-14 pr-32 text-foreground dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-xl"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    </form>
                    
                    <div className="flex items-center justify-center gap-4 my-8 opacity-60">
                        <div className="h-px bg-border flex-1"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">OR</span>
                        <div className="h-px bg-border flex-1"></div>
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
                        className="block w-full py-4 mb-8 bg-surface dark:bg-white/[0.03] border border-primary/20 text-primary font-bold rounded-xl hover:bg-primary/10 transition-colors text-center"
                    >
                        Register a New Cooperative
                    </button>

                    <div className="space-y-4">
                        {results.length > 0 ? (
                            results.map((t) => (
                                <motion.button
                                    key={t.subdomain}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => handleSelect(t)}
                                    className="w-full p-6 bg-surface dark:bg-white/[0.02] border border-border dark:border-white/[0.05] rounded-3xl flex items-center justify-between group hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 text-left"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                            <span className="text-primary font-black text-xl">
                                                {t.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground dark:text-white group-hover:text-primary transition-colors">
                                                {t.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {t.subdomain}.cooperatives.io
                                            </p>
                                        </div>
                                    </div>
                                    <FaArrowRight className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                                </motion.button>
                            ))
                        ) : query && !loading ? (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground font-medium">No cooperatives found matching "{query}"</p>
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
