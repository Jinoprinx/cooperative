"use client"

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaUsers, FaMoneyBillWave, FaChartLine, FaHandshake, FaArrowRight } from 'react-icons/fa';
import Navbar from '@/app/components/Navbar'

const features = [
  {
    icon: FaUsers,
    title: "Member Management",
    description: "Connect and empower your community with streamlined member profiles and enrollment.",
    color: "bg-blue-500/20 text-blue-400"
  },
  {
    icon: FaMoneyBillWave,
    title: "Financial Tracking",
    description: "Real-time visibility into your deposits, withdrawals, and wealth growth.",
    color: "bg-emerald-500/20 text-emerald-400"
  },
  {
    icon: FaHandshake,
    title: "Smart Loans",
    description: "Access capital when it matters most with our automated loan processing system.",
    color: "bg-amber-500/20 text-amber-400"
  },
  {
    icon: FaChartLine,
    title: "Wealth Analytics",
    description: "Make data-driven decisions with comprehensive financial reporting and insights.",
    color: "bg-indigo-500/20 text-indigo-400"
  }
];

const steps = [
  {
    id: "01",
    title: "Digital Onboarding",
    description: "Join our legacy in minutes with a secure, paperless registration process."
  },
  {
    id: "02",
    title: "Flexible Funding",
    description: "Automate your savings or make one-time contributions with ease."
  },
  {
    id: "03",
    title: "Prosper Together",
    description: "Access loans, track benefits, and grow your collective impact."
  }
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050505] overflow-x-hidden selection:bg-primary">
      <div className="noise-overlay" />
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-24 md:pt-60 md:pb-40">
          <div className="absolute inset-0 z-0 hero-gradient opacity-60"></div>

          <div className="container relative z-10 mx-auto px-4 max-w-7xl">
            <div className="max-w-5xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="inline-flex items-center gap-2 px-5 py-2 mb-8 text-xs font-black tracking-[0.2em] text-primary uppercase bg-white/[0.03] rounded-full border border-white/[0.08] backdrop-blur-md"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Transcend Legacy Banking
                </motion.div>

                <h1 className="mb-8 text-7xl font-black md:text-[9rem] text-white tracking-tighter leading-[0.85] perspective-1000">
                  <motion.span
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="block"
                  >
                    Future of
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-gradient inline-block"
                  >
                    Collective Banking
                  </motion.span>
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="mb-14 text-xl md:text-2xl text-white/50 font-medium leading-relaxed max-w-2xl mx-auto px-4"
                >
                  Experience a modern cooperative ecosystem engineered for exponential growth, radical transparency, and shared prosperity.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-8 sm:space-y-0"
                >
                  <Link
                    href="/auth/register"
                    className="btn-primary group"
                  >
                    Register your Society
                    <FaArrowRight className="text-sm transition-transform duration-500 group-hover:translate-x-2" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="btn-secondary"
                  >
                    Member Login
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Visual depth elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.4, 0.3]
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px]"
            ></motion.div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 15, repeat: Infinity, delay: 2 }}
              className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[160px]"
            ></motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 relative">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-2xl">
                <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-4 block">Utility & Scale</span>
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                  Designed for <span className="text-white/30">Hypergrowth.</span>
                </h2>
              </div>
              <p className="text-white/40 font-medium max-w-xs text-lg border-l border-white/10 pl-6">
                Modular architecture built to empower communities across any distance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="card-premium group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-700">
                    <feature.icon className="text-8xl" />
                  </div>

                  <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-10 transition-all duration-700 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] ${feature.color}`}>
                    <feature.icon className="text-3xl" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-white/40 font-medium leading-relaxed group-hover:text-white/60 transition-colors">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Infographic Section */}
        <section id="process" className="py-32 bg-white/[0.01] border-y border-white/[0.05]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center gap-24">
              <div className="lg:w-1/2">
                <span className="text-secondary font-black tracking-[0.3em] uppercase text-xs mb-4 block">Protocol</span>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter leading-[0.9]">
                  How We Move <span className="text-gradient">Together</span>
                </h2>

                <div className="space-y-10">
                  {steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      className="flex gap-8 group"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.2 }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-black text-white/10 group-hover:text-primary transition-colors duration-500 leading-none">{step.id}</div>
                        {idx !== steps.length - 1 && <div className="w-px h-full bg-white/5 my-4"></div>}
                      </div>
                      <div className="pt-1">
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{step.title}</h3>
                        <p className="text-white/40 leading-relaxed font-medium group-hover:text-white/60 transition-colors">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="lg:w-1/2 relative perspective-1000">
                <motion.div
                  initial={{ rotateY: 20, rotateX: 5, y: 50, opacity: 0 }}
                  whileInView={{ rotateY: 12, rotateX: 0, y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 glass-card rounded-[3rem] p-4 border-white/[0.1] shadow-2xl"
                >
                  <div className="bg-[#0a0a0a] rounded-[2.5rem] flex flex-col p-10 overflow-hidden min-h-[500px]">
                    <div className="flex justify-between items-center mb-12">
                      <div className="space-y-2">
                        <div className="h-1.5 w-20 bg-primary/30 rounded-full"></div>
                        <div className="text-xs font-black text-white/40 uppercase tracking-widest">Global Vault</div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.08]">
                        <FaChartLine className="text-primary text-xl" />
                      </div>
                    </div>

                    <div className="mb-12">
                      <div className="text-6xl font-black text-white mb-4 tracking-tighter">
                        $124,592<span className="text-white/20">.00</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                          +12.50%
                        </span>
                        <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Monthly Delta</span>
                      </div>
                    </div>

                    <div className="space-y-6 mb-12">
                      <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Smart Loan Allocation</span>
                          <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/10">Authorized</span>
                        </div>
                        <div className="h-3 w-full bg-white/[0.03] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "78%" }}
                            transition={{ duration: 2, ease: "circOut" }}
                            className="h-full bg-gradient-to-r from-primary to-blue-400"
                          ></motion.div>
                        </div>
                        <div className="flex justify-between mt-3">
                          <span className="text-[10px] text-white/40 font-bold">$7,800 Released</span>
                          <span className="text-[10px] text-white/40 font-bold">$10k Ceiling</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/[0.05]">
                        <div className="text-[9px] text-white/30 uppercase font-black mb-1 tracking-widest">Network Node</div>
                        <div className="text-xl font-bold text-white">420.2 km</div>
                      </div>
                      <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/[0.05]">
                        <div className="text-[9px] text-white/30 uppercase font-black mb-1 tracking-widest">Active Units</div>
                        <div className="text-xl font-bold text-white">12.8k</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Decorative glows */}
                <div className="absolute -top-10 -right-10 w-80 h-80 bg-primary/20 rounded-full blur-[100px] z-0"></div>
                <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] z-0"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-white/[0.05]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
              <div className="space-y-6">
                <Link href="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <span className="text-white font-black italic text-2xl tracking-tighter">C</span>
                  </div>
                  <span className="text-3xl font-display font-black text-white tracking-tight">
                    Coop
                  </span>
                </Link>
                <p className="text-white/30 max-w-xs font-medium">The definitive operating system for modern cooperatives.</p>
              </div>

              <div className="flex flex-col items-end gap-6 text-right">
                <div className="flex space-x-12">
                  <Link href="#" className="text-white/30 hover:text-primary transition-colors font-bold text-sm tracking-widest uppercase">Privacy Protocol</Link>
                  <Link href="#" className="text-white/30 hover:text-primary transition-colors font-bold text-sm tracking-widest uppercase">Terms of Use</Link>
                </div>
                <p className="text-white/20 text-xs font-black tracking-widest uppercase italic">
                  &copy; {new Date().getFullYear()} Cooperative System Intelligence. Built for legacy.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}