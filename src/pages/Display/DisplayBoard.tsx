import React, { useState, useEffect } from 'react';
import { useQueue } from '../../contexts/QueueContext';
import { Activity, Clock, Users, Volume2, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DisplayBoard: React.FC = () => {
  const { tokens, counters, departments, queueSummaries } = useQueue();

  // Real-time updating clock
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString('en-US', { hour12: false })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Find latest token being served
  const servingTokens = tokens.filter((t) => t.status === 'serving');
  const primaryServing = servingTokens[0] || {
    token_number: 101,
    department_id: 'dept-opd',
    counter_id: 'ctr-opd-1',
    patient_name: 'Arthur Pendelton',
  };

  const currentCounter = counters.find((c) => c.id === primaryServing.counter_id);
  const currentDept = departments.find((d) => d.id === primaryServing.department_id);

  // Next up tokens (waiting)
  const nextTokens = tokens
    .filter((t) => t.status === 'waiting')
    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
    .slice(0, 3);

  return (
    <div className="fixed inset-0 bg-[#0F2828] text-white flex flex-col justify-between p-6 sm:p-8 select-none z-50 overflow-hidden font-sans">
      {/* Background glow ambiance in Nature Teal & Olive */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-[#5AA7A7]/20 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-[#BAC94A]/15 blur-[160px] pointer-events-none" />

      {/* TOP BAR */}
      <header className="relative z-10 flex items-center justify-between pb-6 border-b border-[#96D7C6]/25">
        {/* FlowIQ Brand */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E2D36B] to-[#BAC94A] border-2 border-white/40 flex items-center justify-center shadow-xl shadow-[#BAC94A]/30">
            <Activity className="w-8 h-8 text-[#1E3A1E] animate-pulse" />
          </div>
          <div>
            <span className="text-3xl font-black font-mono tracking-tight text-[#FFFDF2]">
              Flow<span className="text-[#96D7C6]">IQ</span>
            </span>
            <span className="block text-xs uppercase tracking-widest text-[#96D7C6] font-bold">
              Hospital Clinical Triage
            </span>
          </div>
        </div>

        {/* Center Title */}
        <div className="hidden md:flex flex-col items-center">
          <h1 className="text-2xl font-black uppercase tracking-widest text-[#FFFDF2]">
            Hospital Queue Live Display
          </h1>
          <span className="text-xs text-[#BAC94A] font-bold flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#BAC94A] animate-ping" />
            Live Audio Chimes Active
          </span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-3 bg-[#1E3A3A]/90 px-6 py-3 rounded-2xl border border-[#96D7C6]/30 shadow-lg">
          <Clock className="w-6 h-6 text-[#96D7C6]" />
          <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[#FFFDF2] tracking-widest">
            {currentTime}
          </span>
        </div>
      </header>

      {/* MAIN SCREEN (60% NOW SERVING | 30% NEXT UP) */}
      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-stretch">
        {/* LEFT / CENTER (NOW SERVING - 8 COLS / ~65%) */}
        <div className="lg:col-span-8 flex flex-col justify-center items-center text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#5AA7A7]/25 via-[#1E3A3A]/90 to-[#1E3A3A] border-2 border-[#96D7C6]/40 shadow-2xl shadow-[#5AA7A7]/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#BAC94A] via-[#E2D36B] to-[#96D7C6]" />

          <span className="text-lg sm:text-xl font-black tracking-widest text-[#1E3A1E] uppercase mb-4 px-6 py-1.5 rounded-full bg-gradient-to-r from-[#E2D36B] to-[#BAC94A] border border-[#FFF9B0]/50 shadow-md">
            NOW SERVING
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={primaryServing.token_number}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 my-2"
            >
              {/* Massive Glowing Token */}
              <h2 className="text-8xl sm:text-9xl md:text-[11rem] font-black font-mono text-[#FFFDF2] tracking-tighter leading-none drop-shadow-2xl">
                #{primaryServing.token_number}
              </h2>

              <div className="pt-4 space-y-1.5">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#FFFDF2]">
                  {currentDept?.name || 'OPD (General)'}
                </h3>
                <p className="text-lg sm:text-xl font-bold text-[#96D7C6] font-mono">
                  → Proceed to: {currentCounter?.name || 'Counter Desk 1'}
                </p>
                <div className="flex items-center justify-center gap-3 text-xs sm:text-sm text-[#BAC94A] font-semibold pt-1">
                  <span>Patient: <strong className="text-white font-black">{primaryServing.patient_name || 'Arthur Pendelton'}</strong></span>
                  <span>•</span>
                  <span>Doctor: <strong className="text-white font-black">{currentCounter?.doctor_name || 'Dr. Robert Sterling'}</strong></span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT PANEL (NEXT UP - 4 COLS / ~35%) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-[#1E3A3A]/90 border border-[#96D7C6]/30 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#96D7C6]/20">
            <span className="text-sm font-black uppercase tracking-wider text-[#96D7C6] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#BAC94A]" />
              NEXT UP IN LINE
            </span>
            <span className="text-xs text-[#BAC94A] font-bold font-mono">Stand By</span>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {nextTokens.length === 0 ? (
              <div className="text-center py-10 text-[#96D7C6]">
                <p className="text-sm font-semibold">No more patients in line</p>
              </div>
            ) : (
              nextTokens.map((tok, idx) => {
                const dept = departments.find((d) => d.id === tok.department_id);
                return (
                  <motion.div
                    key={tok.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-2xl bg-[#0F2828] border border-[#96D7C6]/30 flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#5AA7A7] flex items-center justify-center font-mono font-black text-sm text-white">
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-black font-mono text-[#FFFDF2]">
                          Token #{tok.token_number}
                        </h4>
                        <p className="text-xs text-[#96D7C6]">{dept?.name || 'Department'}</p>
                      </div>
                    </div>

                    <span className="text-xs text-[#BAC94A] font-bold font-mono">
                      ~{tok.estimated_wait_minutes}m
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="p-3 rounded-xl bg-[#5AA7A7]/20 border border-[#96D7C6]/30 text-center text-xs text-[#D6EBEE]">
            Please proceed to your assigned station when your token is called.
          </div>
        </div>
      </main>

      {/* BOTTOM BAR (DEPARTMENT CROWD DOTS & TICKER) */}
      <footer className="relative z-10 pt-4 border-t border-[#96D7C6]/25 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Department Crowd Indicator Dots */}
        <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-1">
          <span className="text-[#96D7C6] font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
            Clinics:
          </span>
          {queueSummaries.slice(0, 6).map((qs) => (
            <div
              key={qs.departmentId}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1E3A3A] border border-[#96D7C6]/30 whitespace-nowrap"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: qs.crowdColor }}
              />
              <span className="text-white font-medium text-[11px]">{qs.departmentName}:</span>
              <span className="text-[#BAC94A] font-mono font-bold text-[11px]">
                {qs.avgWaitMinutes}m
              </span>
            </div>
          ))}
        </div>

        <div className="text-[#96D7C6] font-mono text-[11px] whitespace-nowrap flex items-center gap-1.5">
          <Leaf className="w-3 h-3 text-[#BAC94A]" />
          <span>FlowIQ Hospital Intelligence • Updated Live</span>
        </div>
      </footer>
    </div>
  );
};
