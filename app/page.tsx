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
    <div className="relative min-h-screen bg-background overflow-hidden selection:bg-primary">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
          <div className="absolute inset-0 z-0 hero-gradient opacity-40"></div>

          <div className="container relative z-10 mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest text-primary uppercase bg-primary rounded-full border border-primary">
                  Transcend Banking Traditionalism
                </span>
                <h1 className="mb-8 text-6xl font-extrabold md:text-8xl text-white tracking-tighter leading-[1.1]">
                  The Future of <span className="text-gradient">Collective Finance</span>
                </h1>
                <p className="mb-12 text-xl md:text-2xl text-white/60 font-medium leading-relaxed max-w-2xl mx-auto">
                  Join a modern cooperative ecosystem designed for growth, transparency, and shared prosperity.
                </p>
                <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-6 sm:space-y-0">
                  <Link
                    href="/auth/register"
                    className="btn-primary flex items-center justify-center group"
                  >
                    Start your journey
                    <FaArrowRight className="ml-2 text-sm transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="btn-secondary flex items-center justify-center"
                  >
                    Member Login
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Visual fluff */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl pointer-events-none z-0">
            <div className="absolute top-1/4 -left-12 w-64 h-64 bg-primary rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 -right-12 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Designed for Growth</h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="card-premium group"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${feature.color}`}>
                    <feature.icon className="text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-surface/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">How We Move <span className="text-gradient">Together</span></h2>
                <p className="text-white/60 text-lg mb-12 max-w-lg">
                  Our process is built on simplicity and transparency. Empowerment is just a few steps away.
                </p>

                <div className="space-y-12">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-6 items-start">
                      <div className="text-2xl font-display font-black text-primary mt-1">{step.id}</div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-white/50 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-1/2 relative">
                <div className="relative z-10 rounded-3xl overflow-hidden glass-card p-2 border border-white/10 shadow-2xl">
                  <div className="aspect-square bg-surface-lighter rounded-2xl flex flex-col p-6 overflow-hidden">
                    {/* Infographic Header */}
                    <div className="flex justify-between items-center mb-8">
                      <div className="space-y-1">
                        <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                        <div className="text-sm font-bold text-white/80">Active Balance</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border border-primary">
                        <FaChartLine className="text-primary text-xs" />
                      </div>
                    </div>

                    {/* Animated Balance */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      className="mb-8"
                    >
                      <div className="text-4xl md:text-5xl font-display font-black text-white mb-2">
                        $124,592<span className="text-emerald-400">.00</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          +12.5%
                        </span>
                        <span className="text-xs text-white/30 uppercase tracking-widest font-bold">This Month</span>
                      </div>
                    </motion.div>

                    {/* Loan Status Card */}
                    <div className="space-y-4 mb-8 text-left">
                      <div className="glass-card bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-white/50 uppercase">Business-Loan Status</span>
                          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Approved</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "75%" }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-primary to-blue-400"
                          ></motion.div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-[10px] text-white/30 font-bold">$7,500 disbursed</span>
                          <span className="text-[10px] text-white/30 font-bold">$10,000 total</span>
                        </div>
                      </div>
                    </div>

                    {/* Community Stats */}
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] text-white/30 uppercase font-black mb-1">Impact Radius</div>
                        <div className="text-lg font-bold text-white">420km</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] text-white/30 uppercase font-black mb-1">Members</div>
                        <div className="text-lg font-bold text-white">12.4k+</div>
                      </div>
                    </div>

                    {/* Bottom Decoration */}
                    <div className="mt-auto flex justify-center">
                      <div className="w-1/2 h-1 bg-white/5 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Background Glows */}
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary rounded-full blur-[100px] z-0 animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] z-0 animate-pulse" style={{ animationDelay: '3s' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5">
          <div className="container mx-auto px-4 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs italic">C</span>
              </div>
              <span className="text-lg font-display font-bold text-white tracking-tight">
                Coop
              </span>
            </div>
            <p className="text-white/40 text-sm italic">&copy; {new Date().getFullYear()} Modern Cooperative. Built for legacy.</p>
            <div className="flex space-x-8">
              <Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">Privacy</Link>
              <Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">Terms</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}