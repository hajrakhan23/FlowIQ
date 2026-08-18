import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQueue } from '../../contexts/QueueContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CrowdGauge } from '../../components/ui/CrowdGauge';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  UserX,
  Volume2,
  Activity,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  UserCheck,
  X,
  Leaf,
  HeartPulse,
  History,
  FileText,
  Pill,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    counters,
    departments,
    tokens,
    callNextToken,
    assignTokenPriority,
    markNoShow,
    toggleCounterStatus,
    getDepartmentById,
  } = useQueue();

  // Selected counter for this staff session
  const [selectedCounterId, setSelectedCounterId] = useState<string>(() => {
    return counters[0]?.id || 'ctr-opd-1';
  });

  const [isCalling, setIsCalling] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);
  const [selectedTokenForPriority, setSelectedTokenForPriority] = useState<string | null>(null);

  // Pause / Resume Modal State
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('Doctor Consultation in Progress');

  // Counter & Department info
  const currentCounter = counters.find((c) => c.id === selectedCounterId) || counters[0];
  const currentDept = currentCounter ? getDepartmentById(currentCounter.department_id) : undefined;

  // Active serving or called token at this counter
  const servingToken = tokens.find(
    (t) => t.counter_id === currentCounter?.id && (t.status === 'called' || t.status === 'serving')
  );

  // Previous visit history for the currently served patient
  const patientPastTokens = servingToken
    ? tokens.filter(
        (t) =>
          (t.user_id === servingToken.user_id || t.patient_email === servingToken.patient_email) &&
          t.id !== servingToken.id &&
          t.status === 'served'
      )
    : [];

  // Waiting tokens in this counter's queue - Sorted with emergency priority FIRST!
  const waitingTokens = tokens
    .filter(
      (t) =>
        (t.counter_id === currentCounter?.id ||
          (currentDept && t.department_id === currentDept.id)) &&
        t.status === 'waiting'
    )
    .sort((a, b) => {
      if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
      if (b.priority === 'emergency' && a.priority !== 'emergency') return 1;
      if (a.priority === 'high' && b.priority === 'normal') return -1;
      if (b.priority === 'high' && a.priority === 'normal') return 1;
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });

  // Emergency tokens requiring staff attention
  const emergencyTokens = waitingTokens.filter(
    (t) => t.priority === 'emergency' || t.is_emergency
  );

  // Count served tokens today for this counter/department
  const servedCount = tokens.filter(
    (t) =>
      (t.counter_id === currentCounter?.id || t.department_id === currentCounter?.department_id) &&
      t.status === 'served'
  ).length;

  // Format Staff Display Name with St. prefix
  const rawStaffName = user?.full_name || 'Sarah Watson';
  const staffDisplayName = rawStaffName.startsWith('St. ')
    ? rawStaffName
    : `St. ${rawStaffName.replace(/^(Nurse|Dr\.)\s*/, '')}`;

  const assignedDoctorName = currentCounter?.doctor_name || 'Dr. Robert Sterling';
  const counterStaffName = currentCounter?.staff_name || staffDisplayName;

  const handleCallNext = async () => {
    if (!currentCounter) return;
    setIsCalling(true);
    const res = await callNextToken(currentCounter.id);
    setIsCalling(false);
    if (res.message) {
      setActionAlert(res.message);
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  const handleNoShow = async () => {
    if (!servingToken || !currentCounter) return;
    await markNoShow(currentCounter.id, servingToken.id);
    setActionAlert(`Marked #${servingToken.token_number} as No-Show. Calling next.`);
    setTimeout(() => setActionAlert(null), 4000);
  };

  const handleConfirmPause = async () => {
    if (!currentCounter) return;
    await toggleCounterStatus(currentCounter.id, 'busy');
    setShowPauseModal(false);
    setActionAlert(`${currentCounter.name} is now PAUSED (${pauseReason}).`);
    setTimeout(() => setActionAlert(null), 4000);
  };

  const handleConfirmResume = async () => {
    if (!currentCounter) return;
    await toggleCounterStatus(currentCounter.id, 'open');
    setShowResumeModal(false);
    setActionAlert(`${currentCounter.name} has RESUMED operations.`);
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Helper to format minutes elapsed since join
  const getElapsedMinutes = (joinedAt: string) => {
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(joinedAt).getTime()) / 60000));
    return `${elapsed}m ago`;
  };

  return (
    <div className="min-h-screen bg-[#F7FBF9] text-[#1E3A3A] p-4 sm:p-6 lg:p-8 font-sans">
      {/* Alert toast */}
      {actionAlert && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#5AA7A7] border border-[#96D7C6] shadow-2xl text-white text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-[#FFF5C0]" />
          <span>{actionAlert}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar with Prominent Staff Name */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6C8CBF] to-[#5AA7A7] border border-white/40 flex items-center justify-center font-black text-xl text-white shadow-md">
              {staffDisplayName.replace('St. ', '').charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#5AA7A7] uppercase tracking-wider">
                  Station Operator:
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-[#1E3A3A]">
                  {staffDisplayName}
                </h1>
                <span className="flex items-center gap-1 text-[11px] text-[#445508] font-bold bg-[#BAC94A]/20 px-2.5 py-0.5 rounded-full border border-[#BAC94A]/40">
                  <span className="w-2 h-2 rounded-full bg-[#BAC94A] animate-pulse" />
                  Staff Station Online
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#5A7A7A] mt-1 flex-wrap">
                <span>
                  Dept: <strong className="text-[#1E3A3A]">{currentDept?.name || 'OPD (General)'}</strong>
                </span>
                <span>•</span>
                <span>
                  Doctor on Duty: <strong className="text-[#5AA7A7]">{assignedDoctorName}</strong>
                </span>
                <span>•</span>
                <span>
                  Station Nurse: <strong className="text-[#445508]">{counterStaffName}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Counter Selector & Pause/Resume Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#5A7A7A] font-bold">Counter Station:</label>
              <select
                value={selectedCounterId}
                onChange={(e) => setSelectedCounterId(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/60 text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
              >
                {counters.map((ctr) => (
                  <option key={ctr.id} value={ctr.id} className="bg-white text-[#1E3A3A]">
                    {ctr.name} ({ctr.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Pause / Resume Button with Modal Triggers */}
            {currentCounter?.status === 'open' ? (
              <button
                onClick={() => setShowPauseModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border bg-[#E2D36B]/25 text-[#736307] border-[#E2D36B]/60 hover:bg-[#E2D36B]/40"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Counter</span>
              </button>
            ) : (
              <button
                onClick={() => setShowResumeModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border bg-[#BAC94A]/25 text-[#445508] border-[#BAC94A]/60 hover:bg-[#BAC94A]/40 animate-pulse"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume Counter</span>
              </button>
            )}
          </div>
        </div>

        {/* Emergency Code Red Notification Banner for Staff */}
        {emergencyTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-white/40 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-black text-xl shrink-0">
                🚨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest bg-black/30 px-2.5 py-0.5 rounded-full">
                    EMERGENCY INBOUND ({emergencyTokens.length})
                  </span>
                  <span className="text-xs text-rose-100 font-bold">First Priority Protocol</span>
                </div>
                <p className="text-sm font-black mt-0.5">
                  {emergencyTokens[0].patient_name} (Token #{emergencyTokens[0].token_number}) • Triage: {emergencyTokens[0].triage_reason || 'Severe Acute Distress'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCallNext}
              className="px-5 py-2.5 rounded-2xl bg-white text-rose-700 font-black text-xs hover:bg-rose-50 shadow-lg shrink-0 cursor-pointer transition-all uppercase tracking-wider flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-rose-600" />
              <span>Call Emergency Token Now →</span>
            </button>
          </motion.div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-[#5A7A7A] font-bold uppercase tracking-wider">
                Waiting In Line
              </span>
              <p className="text-2xl font-black font-mono text-[#1E3A3A]">
                {waitingTokens.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#5AA7A7]/15 flex items-center justify-center text-[#5AA7A7]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-[#5A7A7A] font-bold uppercase tracking-wider">
                Served Today
              </span>
              <p className="text-2xl font-black font-mono text-[#1E3A3A]">
                {servedCount + 18}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#BAC94A]/25 flex items-center justify-center text-[#445508]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-[#5A7A7A] font-bold uppercase tracking-wider">
                Avg Service Time
              </span>
              <p className="text-2xl font-black font-mono text-[#1E3A3A]">
                {currentCounter?.avg_service_minutes || 5} <span className="text-xs font-normal text-[#5A7A7A]">min</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#6C8CBF]/20 flex items-center justify-center text-[#6C8CBF]">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-[#5A7A7A] font-bold uppercase tracking-wider">
                Crowd Density
              </span>
              <p className="text-xs font-bold text-[#1E3A3A]">
                {waitingTokens.length <= 10 ? 'Safe Flow' : 'High Volume'}
              </p>
            </div>
            <CrowdGauge count={waitingTokens.length} size="sm" showLabel={false} />
          </div>
        </div>

        {/* Main 2-Column Working Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): NOW SERVING & ACTION PANEL */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#5AA7A7] shadow-xl text-center space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-black tracking-widest uppercase text-[#5AA7A7]">
                  NOW SERVING AT DESK
                </span>
                <Badge variant={servingToken ? 'olive' : 'default'}>
                  {servingToken ? 'Active Consultation' : 'Desk Idle'}
                </Badge>
              </div>

              {servingToken ? (
                <div className="space-y-5">
                  <div className="py-2">
                    {/* Active Token Number */}
                    <div className="inline-block px-6 py-2 rounded-2xl bg-[#5AA7A7]/15 border border-[#5AA7A7]/30 mb-2">
                      <h2 className="text-6xl sm:text-7xl font-black font-mono text-[#1E3A3A]">
                        #{servingToken.token_number}
                      </h2>
                    </div>

                    {/* Patient Name (Regular format) */}
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] text-[#5A7A7A] uppercase font-bold tracking-wider">
                        Patient Name
                      </span>
                      <p className="text-xl font-black text-[#1E3A3A]">
                        {servingToken.patient_name || 'Arthur Pendelton'}
                      </p>
                    </div>

                    {/* Assigned Doctor & Staff Display */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/60 text-left space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#5A7A7A] font-bold flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-[#5AA7A7]" />
                          Assigned Doctor:
                        </span>
                        <strong className="text-[#1E3A3A] font-black">
                          {servingToken.doctor_name || assignedDoctorName}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#5A7A7A] font-bold flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#BAC94A]" />
                          Station Staff:
                        </span>
                        <strong className="text-[#445508] font-bold">
                          {servingToken.staff_name || counterStaffName}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#5A7A7A] pt-1 border-t border-slate-200">
                        <span>Joined Queue:</span>
                        <span className="font-mono">{getElapsedMinutes(servingToken.joined_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mark No Show Button */}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleNoShow}
                    className="w-full text-xs font-bold gap-1.5"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Mark No-Show & Advance</span>
                  </Button>
                </div>
              ) : (
                <div className="py-12 space-y-3">
                  <p className="text-4xl font-mono text-slate-300 font-bold">---</p>
                  <p className="text-xs text-[#5A7A7A]">No token currently active at this counter.</p>
                  <div className="p-3 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/40 text-xs text-[#5A7A7A]">
                    Assigned Doctor: <strong className="text-[#1E3A3A]">{assignedDoctorName}</strong>
                  </div>
                </div>
              )}

              {/* Huge CALL NEXT TOKEN Button */}
              <div className="pt-4 border-t border-slate-100">
                <Button
                  variant="yellow"
                  size="lg"
                  loading={isCalling}
                  onClick={handleCallNext}
                  className="w-full py-4 text-base sm:text-lg font-black tracking-wide gap-2 shadow-lg cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>CALL NEXT TOKEN →</span>
                </Button>
                <p className="text-[11px] text-[#5A7A7A] mt-2">
                  Calls next patient, assigns consultation doctor, and sends live notifications.
                </p>
              </div>
            </div>

            {/* ══════════════════════════════════════════════
                CURRENT PATIENT CLINICAL HISTORY (Staff View)
            ══════════════════════════════════════════════ */}
            {servingToken && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 rounded-3xl bg-white border-2 border-[#5AA7A7]/40 shadow-lg space-y-4 text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-[#5AA7A7]" />
                    <h3 className="text-sm font-black text-[#1E3A3A] uppercase tracking-wider">
                      Patient Clinical History
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#5AA7A7]/10 text-[#5AA7A7] font-bold">
                    MRN-90218-{servingToken.token_number}
                  </span>
                </div>

                {/* Patient Vitals Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/40">
                    <span className="text-[10px] text-[#5A7A7A] block font-semibold">Blood Pressure</span>
                    <strong className="text-xs font-mono text-[#1E3A3A]">120/80 mmHg</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/40">
                    <span className="text-[10px] text-[#5A7A7A] block font-semibold">Heart Rate</span>
                    <strong className="text-xs font-mono text-[#1E3A3A]">72 bpm</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/40">
                    <span className="text-[10px] text-[#5A7A7A] block font-semibold">SpO2 Level</span>
                    <strong className="text-xs font-mono text-[#1E3A3A]">99% Normal</strong>
                  </div>
                </div>

                {/* Triage / Reason for Visit */}
                <div className="p-3 rounded-2xl bg-[#EBF5F2] border border-[#96D7C6]/60 text-xs space-y-1">
                  <span className="font-bold text-[#1E3A3A] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#5AA7A7]" />
                    Chief Complaint / Triage Note:
                  </span>
                  <p className="text-[#5A7A7A] text-[11px] leading-relaxed">
                    {servingToken.triage_reason || (servingToken.priority === 'emergency' ? 'Acute respiratory distress / Code Red emergency evaluation' : 'Routine consultation and symptomatic evaluation for current department.')}
                  </p>
                </div>

                {/* Past Consultations Archive */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1E3A3A]">
                    <span className="flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-[#BAC94A]" />
                      Previous Hospital Visits ({patientPastTokens.length})
                    </span>
                    <span className="text-[10px] text-[#5AA7A7]">All Records</span>
                  </div>

                  {patientPastTokens.length > 0 ? (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {patientPastTokens.map((pt) => {
                        const dept = getDepartmentById(pt.department_id);
                        return (
                          <div
                            key={pt.id}
                            className="p-2.5 rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/50 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-[#1E3A3A]">{pt.custom_department || dept?.name || 'Department'}</span>
                              <span className="text-[10px] font-mono text-[#5AA7A7]">Token #{pt.token_number}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#5A7A7A]">
                              <span>Dr: {pt.doctor_name || 'Dr. Robert Sterling'}</span>
                              <span>{pt.actual_wait_minutes ? `${pt.actual_wait_minutes}m service` : 'Completed'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#F7FBF9] text-center border border-dashed border-[#96D7C6]/60 text-[11px] text-[#5A7A7A]">
                      No previous clinical visits logged for this patient ID.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column (7 cols): WAITING QUEUE LIST */}
          <div className="lg:col-span-7">
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#5AA7A7]" />
                  <h3 className="text-base font-black text-[#1E3A3A]">
                    Waiting Patients ({waitingTokens.length})
                  </h3>
                </div>
                <span className="text-xs text-[#5AA7A7] font-bold">Real-time synchronized</span>
              </div>

              {waitingTokens.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-[#96D7C6] mx-auto" />
                  <p className="text-sm font-bold text-[#1E3A3A]">Queue is clear!</p>
                  <p className="text-xs text-[#5A7A7A]">No patients currently waiting in line.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {waitingTokens.map((tok, index) => {
                    const isEmergency = tok.priority === 'emergency' || tok.is_emergency;
                    const isHigh = tok.priority === 'high';

                    return (
                      <motion.div
                        key={tok.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all border ${
                          isEmergency
                            ? 'bg-rose-50/80 border-2 border-rose-500 shadow-md shadow-rose-500/10'
                            : isHigh
                            ? 'bg-amber-50/80 border-2 border-amber-400'
                            : 'bg-[#F7FBF9] border-[#96D7C6]/40 hover:border-[#5AA7A7]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Position Badge */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs text-white shrink-0 shadow-xs ${
                              isEmergency
                                ? 'bg-rose-600 animate-pulse'
                                : isHigh
                                ? 'bg-amber-500'
                                : 'bg-[#5AA7A7]'
                            }`}
                          >
                            #{index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black font-mono text-[#1E3A3A]">
                                Token #{tok.token_number}
                              </span>
                              <span className="text-xs font-bold text-[#1E3A3A]">
                                {tok.patient_name || 'Patient'}
                              </span>

                              {isEmergency && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-600 text-white animate-pulse">
                                  🚨 CODE RED EMERGENCY
                                </span>
                              )}
                              {isHigh && !isEmergency && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-500 text-white">
                                  ⚡ HIGH PRIORITY
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-[#5A7A7A] mt-0.5 flex-wrap">
                              <span>
                                Assigned Dr: <strong className="text-[#5AA7A7]">{tok.doctor_name || assignedDoctorName}</strong>
                              </span>
                              {tok.triage_reason && (
                                <span className="text-rose-600 font-semibold">
                                  • {tok.triage_reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                          <div className="text-left sm:text-right space-y-0.5 shrink-0">
                            <span className="text-xs font-mono font-bold text-[#1E3A3A] block">
                              Waiting: {getElapsedMinutes(tok.joined_at)}
                            </span>
                            <span className="text-[10px] text-[#445508] font-bold block">
                              Est: ~{tok.estimated_wait_minutes}m
                            </span>
                          </div>

                          {/* Quick Staff Priority Assignment Selector */}
                          <div className="relative shrink-0">
                            <select
                              value={tok.priority || 'normal'}
                              onChange={(e) => {
                                const newP = e.target.value as 'normal' | 'high' | 'emergency';
                                assignTokenPriority(
                                  tok.id,
                                  newP,
                                  newP === 'emergency' ? 'Staff Emergency Triage' : undefined
                                );
                                setActionAlert(
                                  `Priority for Token #${tok.token_number} updated to ${newP.toUpperCase()}`
                                );
                                setTimeout(() => setActionAlert(null), 3000);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer focus:outline-none ${
                                isEmergency
                                  ? 'bg-rose-600 text-white border-rose-700'
                                  : isHigh
                                  ? 'bg-amber-400 text-amber-950 border-amber-500'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-[#5AA7A7]'
                              }`}
                            >
                              <option value="normal">Standard Priority</option>
                              <option value="high">High Priority</option>
                              <option value="emergency">🚨 Emergency Priority</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          POPUP MODAL: PAUSE COUNTER CONFIRMATION
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPauseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-[#E2D36B] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E2D36B]/25 flex items-center justify-center text-[#736307]">
                    <Pause className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1E3A3A]">Pause Counter Station</h3>
                    <p className="text-xs text-[#5A7A7A]">{currentCounter?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPauseModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#5A7A7A] uppercase tracking-wider block">
                  Select Pause Reason:
                </label>
                <div className="space-y-2">
                  {[
                    'Doctor Consultation in Progress',
                    'Lunch / Meal Break',
                    'Clinical Sanitization & Restock',
                    'Emergency Support Assistance',
                    'Shift Handover',
                  ].map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                        pauseReason === reason
                          ? 'bg-[#E2D36B]/20 border-[#E2D36B] text-[#736307]'
                          : 'bg-[#F7FBF9] border-[#96D7C6]/40 text-[#1E3A3A] hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pauseReason"
                        checked={pauseReason === reason}
                        onChange={() => setPauseReason(reason)}
                        className="text-[#5AA7A7] focus:ring-[#5AA7A7]"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-[#5A7A7A] leading-relaxed">
                Pausing this counter will temporarily hold queue calls and display the busy status on public hospital screens.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPauseModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="yellow"
                  size="sm"
                  onClick={handleConfirmPause}
                  className="flex-1 font-black"
                >
                  Confirm Pause
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          POPUP MODAL: RESUME COUNTER CONFIRMATION
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showResumeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-[#BAC94A] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#BAC94A]/25 flex items-center justify-center text-[#445508]">
                    <Play className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1E3A3A]">Resume Counter Station</h3>
                    <p className="text-xs text-[#5A7A7A]">{currentCounter?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResumeModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/60 text-xs text-[#1E3A3A] space-y-2">
                <p className="font-bold">Reopening Desk for Waiting Patients</p>
                <p className="text-[#5A7A7A] text-[11px] leading-relaxed">
                  Doctor on duty <strong>{assignedDoctorName}</strong> and Staff <strong>{counterStaffName}</strong> will immediately be marked active and ready to call next tokens.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResumeModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="olive"
                  size="sm"
                  onClick={handleConfirmResume}
                  className="flex-1 font-black"
                >
                  Confirm & Resume Desk
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
