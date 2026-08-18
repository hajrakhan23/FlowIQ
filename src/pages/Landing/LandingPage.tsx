import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueue } from '../../contexts/QueueContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Activity,
  QrCode,
  Ticket,
  Bell,
  Cpu,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  Building2,
  Stethoscope,
  AlertCircle,
  Pill,
  FlaskConical,
  Scan,
  HeartPulse,
  Tv,
  CheckCircle2,
  Shield,
  Layers,
  Leaf,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const { queueSummaries, tokens, departments } = useQueue();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dynamic metrics from queue state
  const totalServedToday = tokens.filter((t) => t.status === 'served').length + 184;
  const activePatients = tokens.filter((t) => t.status === 'waiting' || t.status === 'serving').length;
  const activeDeptCount = departments.filter((d) => d.is_active).length;
  const avgWaitTimeMinutes = activePatients > 0 ? Math.round(activePatients * 3.5) : 8;

  // Icon mapping helper
  const getDeptIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertCircle':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'Pill':
        return <Pill className="w-5 h-5 text-amber-500" />;
      case 'FlaskConical':
        return <FlaskConical className="w-5 h-5 text-emerald-600" />;
      case 'Scan':
        return <Scan className="w-5 h-5 text-sky-600" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-pink-500" />;
      default:
        return <Stethoscope className="w-5 h-5 text-[#5AA7A7]" />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F7FBF9] text-[#1E3A3A] overflow-hidden font-sans">
      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION (Nature Theme Gradient #5AA7A7 -> #96D7C6)
          Cascading Leaf Motifs in #BAC94A & #E2D36B
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full bg-gradient-to-br from-[#5AA7A7] via-[#75BEB1] to-[#96D7C6] overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-12 shadow-md">
        {/* Decorative Nature Leaf Vector Motifs cascading from top-right */}
        <div className="absolute -top-16 -right-16 w-96 h-96 pointer-events-none opacity-40 md:opacity-60">
          {/* Leaf 1 in Olive Green #BAC94A */}
          <svg
            className="absolute top-4 right-12 w-64 h-64 text-[#BAC94A] transform rotate-45 animate-pulse"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50 0 C70 30 100 50 100 100 C50 100 30 70 0 50 C30 50 50 30 50 0 Z" />
          </svg>
          {/* Leaf 2 in Soft Yellow #E2D36B */}
          <svg
            className="absolute top-20 right-36 w-48 h-48 text-[#E2D36B] transform -rotate-12"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50 0 C70 30 100 50 100 100 C50 100 30 70 0 50 C30 50 50 30 50 0 Z" />
          </svg>
          {/* Leaf 3 in Dusty Blue #6C8CBF overlay */}
          <svg
            className="absolute top-44 right-8 w-40 h-40 text-[#6C8CBF]/40 transform rotate-90"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50 0 C70 30 100 50 100 100 C50 100 30 70 0 50 C30 50 50 30 50 0 Z" />
          </svg>
        </div>

        {/* Ambient Subtle organic rings */}
        <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Bold Cream Heading & Nature CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[#FFF9E6] text-xs font-bold shadow-sm">
              <Leaf className="w-3.5 h-3.5 text-[#E2D36B]" />
              <span>Smart Nature-Inspired Hospital Flow Engine</span>
            </div>

            {/* Bold Cream Heading (2 lines) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#FFFDF2] drop-shadow-sm leading-[1.12]">
              Smarter Healthcare Queues.<br />
              <span className="text-[#FFF5C0]">Calm, Crowd-Free Care.</span>
            </h1>

            {/* Paragraph in refined contrast */}
            <p className="text-base sm:text-lg text-[#0F3944] font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              FlowIQ balances hospital congestion through intelligent automated triage, live token tracking, and role-isolated workflows for patients, clinical staff, and administrators.
            </p>

            {/* Role-tailored Navigation CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              {user ? (
                <>
                  {user.role === 'patient' && (
                    <Link to="/patient">
                      <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#E2D36B] to-[#BAC94A] text-[#1E3A1E] font-extrabold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer border border-[#FFF9B0]/50">
                        <User className="w-4 h-4" />
                        <span>Enter Patient Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                  {user.role === 'staff' && (
                    <Link to="/staff">
                      <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#6C8CBF] hover:bg-[#5874A6] text-white font-extrabold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer border border-white/30">
                        <Users className="w-4 h-4" />
                        <span>Enter Staff Station ({user.full_name})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin">
                      <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#101B24] hover:bg-[#1A2834] text-[#00F0FF] font-extrabold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer border border-[#00F0FF]/40">
                        <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />
                        <span>Enter Admin Spatial Ops</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/patient">
                    <button className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-[#E2D36B] to-[#BAC94A] text-[#1E3A1E] font-extrabold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-[#FFF9B0]/50">
                      <User className="w-4 h-4" />
                      <span>Patient Portal</span>
                    </button>
                  </Link>

                  <Link to="/staff">
                    <button className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-md text-[#FFFDF2] font-bold text-sm border border-white/40 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
                      <Users className="w-4 h-4" />
                      <span>Staff Station</span>
                    </button>
                  </Link>

                  <Link to="/admin">
                    <button className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#101B24]/80 hover:bg-[#101B24] text-[#00F0FF] font-bold text-sm border border-[#00F0FF]/40 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
                      <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />
                      <span>Admin AI</span>
                    </button>
                  </Link>
                </>
              )}

              <Link to="/display" target="_blank">
                <button className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-[#6C8CBF]/40 hover:bg-[#6C8CBF]/60 backdrop-blur-md text-[#FFFDF2] font-bold text-sm border border-white/30 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
                  <Tv className="w-4 h-4 text-[#FFF5C0]" />
                  <span>Live TV</span>
                </button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-3 text-xs text-[#0F3944] font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BAC94A]" />
                Zero Waiting Room Crowding
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2D36B]" />
                Strict Profile Separation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6C8CBF]" />
                Instant Google Auth
              </span>
            </div>
          </motion.div>

          {/* Right Column: Hero Visual Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden border-2 border-white/40 shadow-2xl shadow-[#5AA7A7]/40 bg-white/10 backdrop-blur-md p-2">
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&auto=format&fit=crop&q=80"
                alt="Modern Clean Hospital"
                className="w-full h-[360px] object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />

              {/* Overlay Token Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-emerald-100 shadow-xl flex items-center justify-between text-[#1E3A3A]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5AA7A7] text-white flex items-center justify-center font-black">
                    #A01
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E3A3A]">Next Patient Ready</h4>
                    <p className="text-[11px] text-[#5AA7A7] font-semibold">OPD Consultation • Counter 2</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#BAC94A]/20 text-[#4D6310] border border-[#BAC94A]/40">
                  Est: 4 min
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES STRIP (Wide Rounded Card in #5AA7A7)
      ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full rounded-3xl bg-[#5AA7A7] text-white p-6 sm:p-8 shadow-xl border border-white/20 grid grid-cols-2 lg:grid-cols-4 gap-6 items-center"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-[#FFF5C0] shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{avgWaitTimeMinutes}m</p>
              <p className="text-xs text-[#D6EBEE] font-medium">Avg AI Wait Time</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-[#FFF5C0] shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{activePatients}</p>
              <p className="text-xs text-[#D6EBEE] font-medium">Active Queue In-Flow</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-[#FFF5C0] shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{totalServedToday}</p>
              <p className="text-xs text-[#D6EBEE] font-medium">Patients Served Today</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-[#FFF5C0] shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{activeDeptCount}</p>
              <p className="text-xs text-[#D6EBEE] font-medium">Connected Clinical Units</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CARD GRID: 2x3 Nature-Themed Feature Cards
          Teal #5AA7A7, Mint #96D7C6, Olive #BAC94A, Yellow #E2D36B, Dusty Blue #6C8CBF
      ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#5AA7A7] bg-[#5AA7A7]/10 px-3.5 py-1 rounded-full border border-[#5AA7A7]/20">
            Intelligent Infrastructure
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A3A]">
            Engineered for Calm, Precision Healthcare
          </h2>
          <p className="text-sm sm:text-base text-[#5A7A7A]">
            FlowIQ coordinates patients, counter nurses, and medical directors through dedicated, strictly isolated portals.
          </p>
        </div>

        {/* 2x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: AI Queue & Auto-Routing (Teal Theme #5AA7A7) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-7 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#5AA7A7]/15 text-[#5AA7A7] flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1E3A3A]">AI Dynamic Triage</h3>
              <p className="text-xs sm:text-sm text-[#4E6B6B] leading-relaxed">
                Tokens automatically route to the fastest available clinical counters based on historical service velocities and current queue load.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#5AA7A7]">
              <span>Real-Time Load Balancing</span>
              <Sparkles className="w-4 h-4 text-[#BAC94A]" />
            </div>
          </motion.div>

          {/* Card 2: Mobile Queue & QR Token (Mint Theme #96D7C6) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-7 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#96D7C6]/25 text-[#2A7565] flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1E3A3A]">Mobile Token Tracking</h3>
              <p className="text-xs sm:text-sm text-[#4E6B6B] leading-relaxed">
                Patients can scan QR codes at hospital entrances or join queues digitally from their phones, receiving instant countdowns and position alerts.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#2A7565]">
              <span>SMS & Email Alerts</span>
              <QrCode className="w-4 h-4 text-[#5AA7A7]" />
            </div>
          </motion.div>

          {/* Card 3: Live Hospital TV Board (Dusty Blue #6C8CBF) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-7 rounded-3xl bg-white border border-[#6C8CBF]/30 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6C8CBF]/20 text-[#6C8CBF] flex items-center justify-center">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1E3A3A]">Live Waiting TV Board</h3>
              <p className="text-xs sm:text-sm text-[#4E6B6B] leading-relaxed">
                Full-screen display board with audio chime announcements for waiting lounges, broadcasting real-time token calls and department statuses.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#6C8CBF]">
              <span>Audio Chime System</span>
              <Bell className="w-4 h-4 text-[#6C8CBF]" />
            </div>
          </motion.div>

          {/* Card 4: Strict Role Separation (Olive Green #BAC94A) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-7 rounded-3xl bg-white border border-[#BAC94A]/40 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#BAC94A]/20 text-[#667512] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1E3A3A]">Role-Isolated Access</h3>
              <p className="text-xs sm:text-sm text-[#4E6B6B] leading-relaxed">
                Strict separation guarantees patients only view their personal tokens, clinical staff manage counters, and admins access telemetry.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#667512]">
              <span>RBAC Security Enforced</span>
              <Shield className="w-4 h-4 text-[#BAC94A]" />
            </div>
          </motion.div>

          {/* Card 5: Crowd Density Gauges (Soft Yellow #E2D36B) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-7 rounded-3xl bg-white border border-[#E2D36B]/50 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E2D36B]/25 text-[#7A6B10] flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1E3A3A]">Crowd Density Gauges</h3>
              <p className="text-xs sm:text-sm text-[#4E6B6B] leading-relaxed">
                Color-coded crowd velocity meters identify bottleneck departments in advance, alerting medical directors before halls become congested.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#7A6B10]">
              <span>Predictive Analytics</span>
              <Activity className="w-4 h-4 text-[#E2D36B]" />
            </div>
          </motion.div>

          {/* Card 6: Doctor Routing & Feedback (Teal + Mint) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="p-7 rounded-3xl bg-white border border-[#5AA7A7]/40 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#5AA7A7]/15 text-[#5AA7A7] flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1E3A3A]">Physician Routing & Reviews</h3>
              <p className="text-xs sm:text-sm text-[#4E6B6B] leading-relaxed">
                Automated assignment maps patients directly to specialized physicians with post-consultation 5-star feedback rating workflows.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#5AA7A7]">
              <span>Post-Visit Rating</span>
              <HeartPulse className="w-4 h-4 text-pink-500" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ROLE ACCESS PORTAL STRIP (Dedicated Entry Points)
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#F0F7F5] to-[#E5F1EE] py-16 px-4 sm:px-6 lg:px-8 border-t border-[#96D7C6]/30">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1E3A3A]">
              Choose Your Dedicated Portal
            </h3>
            <p className="text-xs sm:text-sm text-[#4E6B6B]">
              Each console provides a tailored interface for specific hospital responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Patient Portal Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6] shadow-md hover:shadow-xl transition-all text-center space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold">
                  P
                </div>
                <h4 className="text-lg font-black text-[#1E3A3A]">Patient Portal</h4>
                <p className="text-xs text-[#5A7A7A]">
                  Generate queue tokens, check estimated wait times, and view live counter call status.
                </p>
              </div>
              <Link to="/patient">
                <button className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all cursor-pointer">
                  Enter Patient Console
                </button>
              </Link>
            </div>

            {/* Staff Station Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#6C8CBF]/40 shadow-md hover:shadow-xl transition-all text-center space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 mx-auto flex items-center justify-center font-bold">
                  S
                </div>
                <h4 className="text-lg font-black text-[#1E3A3A]">Staff Station</h4>
                <p className="text-xs text-[#5A7A7A]">
                  Call next patient, handle no-shows, manage counter speed, and trigger audio announcements.
                </p>
              </div>
              <Link to="/staff">
                <button className="w-full py-2.5 rounded-xl bg-[#6C8CBF] hover:bg-[#5874A6] text-white text-xs font-bold shadow transition-all cursor-pointer">
                  Enter Staff Station
                </button>
              </Link>
            </div>

            {/* Admin Intelligence Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#BAC94A]/60 shadow-md hover:shadow-xl transition-all text-center space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center font-bold">
                  A
                </div>
                <h4 className="text-lg font-black text-[#1E3A3A]">Admin AI Dashboard</h4>
                <p className="text-xs text-[#5A7A7A]">
                  Executive crowd charts, clinic throughput analytics, and system-wide queue rebalancing.
                </p>
              </div>
              <Link to="/admin">
                <button className="w-full py-2.5 rounded-xl bg-[#5AA7A7] hover:bg-[#478B8B] text-white text-xs font-bold shadow transition-all cursor-pointer">
                  Enter Admin Console
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
