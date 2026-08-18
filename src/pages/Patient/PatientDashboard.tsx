import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQueue } from '../../contexts/QueueContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CrowdGauge } from '../../components/ui/CrowdGauge';
import {
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Star,
  Activity,
  LogOut,
  Sparkles,
  Stethoscope,
  AlertCircle,
  Pill,
  FlaskConical,
  Scan,
  HeartPulse,
  Bone,
  Brain,
  Baby,
  Flower2,
  Smile,
  Eye,
  Footprints,
  Droplets,
  ShieldAlert,
  Heart,
  Syringe,
  HelpCircle,
  User,
  UserCheck,
  Leaf,
  Volume2,
  History,
  CalendarCheck,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    departments,
    counters,
    tokens,
    queueSummaries,
    joinQueue,
    leaveQueue,
    submitFeedback,
    getActiveTokenForUser,
    getCounterById,
    getDepartmentById,
  } = useQueue();

  const [customDeptInput, setCustomDeptInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [starRating, setStarRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const cleanPatientName = user?.full_name
    ? user.full_name.replace(/^(Dr\.|St\.|Nurse)\s*/, '')
    : 'Paras Masurkar';

  const activeToken = user ? getActiveTokenForUser(user.id) : undefined;
  const currentCounter = activeToken ? getCounterById(activeToken.counter_id) : undefined;
  const currentDept = activeToken ? getDepartmentById(activeToken.department_id) : undefined;

  const assignedDoctor =
    activeToken?.doctor_name || currentCounter?.doctor_name || 'Dr. Robert Sterling';
  const assignedStaff =
    activeToken?.staff_name || currentCounter?.staff_name || 'St. Sarah Watson';

  // Department Icon Mapper with nature colors
  const renderDeptIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertCircle':
        return <AlertCircle className="w-6 h-6 text-rose-500" />;
      case 'Pill':
        return <Pill className="w-6 h-6 text-[#E2D36B]" />;
      case 'FlaskConical':
        return <FlaskConical className="w-6 h-6 text-[#BAC94A]" />;
      case 'Scan':
        return <Scan className="w-6 h-6 text-[#6C8CBF]" />;
      case 'HeartPulse':
        return <HeartPulse className="w-6 h-6 text-rose-400" />;
      case 'Bone':
        return <Bone className="w-6 h-6 text-[#5AA7A7]" />;
      case 'Brain':
        return <Brain className="w-6 h-6 text-[#6C8CBF]" />;
      case 'Baby':
        return <Baby className="w-6 h-6 text-[#96D7C6]" />;
      case 'Flower2':
        return <Flower2 className="w-6 h-6 text-[#BAC94A]" />;
      case 'Smile':
        return <Smile className="w-6 h-6 text-[#5AA7A7]" />;
      case 'Eye':
        return <Eye className="w-6 h-6 text-[#6C8CBF]" />;
      case 'Footprints':
        return <Footprints className="w-6 h-6 text-[#BAC94A]" />;
      case 'Droplets':
        return <Droplets className="w-6 h-6 text-[#5AA7A7]" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-6 h-6 text-rose-500" />;
      case 'Heart':
        return <Heart className="w-6 h-6 text-rose-500" />;
      case 'Syringe':
        return <Syringe className="w-6 h-6 text-[#5AA7A7]" />;
      case 'HelpCircle':
        return <HelpCircle className="w-6 h-6 text-[#E2D36B]" />;
      default:
        return <Stethoscope className="w-6 h-6 text-[#5AA7A7]" />;
    }
  };

  const handleJoin = async (deptId: string, isCustom = false) => {
    if (!user) return;
    setIsJoining(true);
    const customText = isCustom ? customDeptInput.trim() || 'Specialized Clinic' : undefined;

    const res = await joinQueue(deptId, customText, {
      id: user.id,
      email: user.email,
      full_name: cleanPatientName,
    });

    setIsJoining(false);
    if (res.success) {
      setToastMessage(res.message || 'Joined queue successfully!');
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeToken) return;
    await submitFeedback(activeToken.id, starRating, feedbackComment, user?.id);
    setFeedbackSubmitted(true);
  };

  // Determine current State
  const isStateB = activeToken && (activeToken.status === 'waiting' || activeToken.status === 'called' || activeToken.status === 'serving');
  const isStateC = activeToken && activeToken.status === 'served';

  // Past Tokens History for this patient
  const pastTokens = tokens.filter(
    (t) =>
      (t.user_id === user?.id || t.patient_email === user?.email) &&
      (t.status === 'served' || t.status === 'no_show')
  );

  return (
    <div className="min-h-screen bg-[#F7FBF9] text-[#1E3A3A] p-4 sm:p-6 lg:p-8 font-sans">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#5AA7A7] text-white border border-[#96D7C6] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 font-bold">
          <CheckCircle2 className="w-5 h-5 text-[#BAC94A] shrink-0" />
          <span className="text-xs sm:text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Patient Greeting & Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#BAC94A] to-[#5AA7A7] border border-white/40 flex items-center justify-center font-black text-xl text-white shadow-md">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[#5AA7A7] font-bold mb-0.5">
                <Leaf className="w-3.5 h-3.5 text-[#BAC94A]" />
                <span>FlowIQ Patient Portal • Real-Time Health Track</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E3A3A] tracking-tight">
                {getGreeting()}, <span className="text-[#5AA7A7]">{cleanPatientName}</span>
              </h1>
              <p className="text-xs text-[#5A7A7A] mt-0.5">
                Patient Account: <strong className="text-[#1E3A3A]">{user?.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="teal" className="py-2 px-4 text-xs font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>{isStateB ? 'Active Token in Queue' : 'Ready for Clinic Visit'}</span>
            </Badge>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            STATE B: ACTIVE TOKEN DISPLAY
        ══════════════════════════════════════════════ */}
        {isStateB && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Status = CALLED Alert Banner (Pulsing High-Priority Notification) */}
            {activeToken.status === 'called' && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#BAC94A]/40 via-[#5AA7A7]/30 to-[#96D7C6]/40 border-3 border-[#5AA7A7] backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#5AA7A7] text-white flex items-center justify-center shadow-lg shrink-0">
                    <Volume2 className="w-7 h-7 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1E3A3A] text-[#FFFDF2] text-[10px] font-black uppercase tracking-wider">
                        NOW CALLED TO DESK
                      </span>
                      <span className="text-xs text-[#1E3A3A] font-bold">Please Proceed Immediately</span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-[#1E3A3A] mt-0.5">
                      🚨 TOKEN #{activeToken.token_number} IS CURRENTLY CALLED!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#1E3A3A] font-semibold mt-0.5">
                      Please head to <strong className="underline text-[#0F3944]">{currentCounter?.name || 'Assigned Counter'}</strong> for consultation with <strong className="underline text-[#0F3944]">{assignedDoctor}</strong> (Staff: {assignedStaff}).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-4 py-2 rounded-xl bg-[#5AA7A7] text-white font-black text-xs uppercase tracking-wider shadow-md">
                    Desk Ready
                  </div>
                </div>
              </motion.div>
            )}

            {/* Position = 1 Green Banner Alert */}
            {activeToken.status === 'waiting' && activeToken.position_in_queue === 1 && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#BAC94A]/25 border-2 border-[#BAC94A] backdrop-blur-xl flex items-center justify-between shadow-xl animate-pulse">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#BAC94A] flex items-center justify-center text-[#1E3A1E] shadow-lg">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#2C3B05]">
                      🎉 YOUR TURN IS NEXT!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#445508] font-semibold">
                      Please proceed immediately to{' '}
                      <strong className="text-[#1E3A1E] underline">
                        {currentCounter?.name || 'Assigned Counter'}
                      </strong>{' '}
                      for consultation with <strong className="text-[#1E3A1E] underline">{assignedDoctor}</strong>.
                    </p>
                  </div>
                </div>
                <Badge variant="olive" className="text-xs px-3 py-1 font-black">
                  Next Up
                </Badge>
              </div>
            )}

            {/* Position = 3 Yellow Banner Alert */}
            {activeToken.status === 'waiting' && activeToken.position_in_queue === 3 && (
              <div className="p-4 rounded-3xl bg-[#E2D36B]/25 border border-[#E2D36B] flex items-center gap-3 shadow-md">
                <AlertTriangle className="w-6 h-6 text-[#736307] shrink-0 animate-bounce" />
                <div>
                  <h4 className="text-sm font-black text-[#736307]">
                    Almost your turn! 2 patients ahead in line.
                  </h4>
                  <p className="text-xs text-[#5A7A7A] font-medium">
                    Please make your way towards {currentCounter?.name || 'the department waiting area'}.
                  </p>
                </div>
              </div>
            )}

            {/* Main Token Hub Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* PRIMARY TOKEN CARD (Most Prominent) */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="flex-1 p-8 text-center flex flex-col justify-between rounded-3xl border-2 border-[#5AA7A7] bg-gradient-to-b from-[#5AA7A7] to-[#96D7C6] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#E2D36B] via-[#BAC94A] to-[#FFFDF2]" />

                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-black text-[#1E3A1E] bg-[#FFFDF2] px-3 py-1 rounded-full border border-white/40 shadow-xs">
                      YOUR OFFICIAL TOKEN
                    </span>

                    {/* Massive Glowing Token Number */}
                    <div className="my-6">
                      <h2 className="text-7xl sm:text-8xl font-black font-mono text-[#FFFDF2] tracking-tighter drop-shadow-md">
                        #{activeToken.token_number}
                      </h2>
                      <p className="text-sm font-black text-[#1E3A1E] mt-2 flex items-center justify-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A1E] animate-ping" />
                        Status: {activeToken.status.toUpperCase()}
                      </p>
                    </div>

                    {/* Patient Name on Token */}
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 text-left space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/80 font-bold">Patient Name:</span>
                        <strong className="text-[#FFFDF2] font-black">{cleanPatientName}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/80 font-bold">Assigned Doctor:</span>
                        <strong className="text-[#FFFDF2] font-black">{assignedDoctor}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/80 font-bold">Assigned Staff:</span>
                        <strong className="text-[#FFFDF2] font-semibold">{assignedStaff}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/30 space-y-1">
                    <h3 className="text-base font-black text-[#FFFDF2]">
                      {activeToken.custom_department || currentDept?.name || 'Department'}
                    </h3>
                    <p className="text-xs text-[#0F3944] font-bold font-mono">
                      Counter: {currentCounter?.name || 'Assigned Station'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECONDARY METRICS: Position, Wait Time, Crowd Meter */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Queue Position Card */}
                <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-[#5A7A7A] text-xs font-bold uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#5AA7A7]" />
                        Queue Position
                      </span>
                      <Badge variant="teal">Live</Badge>
                    </div>
                    <p className="text-2xl font-black text-[#1E3A3A]">
                      {activeToken.position_in_queue === 0 ? (
                        <span className="text-[#445508]">Currently Serving You</span>
                      ) : (
                        `You are #${activeToken.position_in_queue} in queue`
                      )}
                    </p>
                  </div>

                  {/* Visual Queue People Ahead Dots */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-[#5A7A7A] uppercase font-bold">
                      People ahead of you:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {activeToken.position_in_queue <= 1 ? (
                        <span className="text-xs text-[#445508] font-bold">
                          You are next at the front of the line!
                        </span>
                      ) : (
                        Array.from({ length: Math.min(5, activeToken.position_in_queue - 1) }).map(
                          (_, idx) => (
                            <div
                              key={idx}
                              className="w-7 h-7 rounded-full bg-[#5AA7A7] border border-white flex items-center justify-center text-xs font-bold text-white shadow-xs"
                            >
                              {idx + 1}
                            </div>
                          )
                        )
                      )}
                      {activeToken.position_in_queue > 6 && (
                        <span className="text-xs text-[#5A7A7A] font-bold">
                          +{activeToken.position_in_queue - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estimated Wait Time Card */}
                <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-[#5A7A7A] text-xs font-bold uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#5AA7A7]" />
                        Wait Time
                      </span>
                      <Badge variant="olive">AI Predicted</Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black font-mono text-[#1E3A3A]">
                        ~{activeToken.estimated_wait_minutes}
                      </p>
                      <span className="text-sm font-bold text-[#5A7A7A]">minutes</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-[#5A7A7A] leading-relaxed">
                      Consultation with <strong className="text-[#1E3A3A]">{assignedDoctor}</strong> (~{currentCounter?.avg_service_minutes || 5} min/patient).
                    </p>
                  </div>
                </div>

                {/* Circular Crowd Gauge */}
                <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg flex items-center justify-between sm:col-span-2">
                  <div className="space-y-1 max-w-xs">
                    <h4 className="text-sm font-black text-[#1E3A3A] uppercase tracking-wider">
                      Department Crowd Density
                    </h4>
                    <p className="text-xs text-[#5A7A7A]">
                      {currentDept?.name || 'Department'} congestion level monitored by FlowIQ AI.
                    </p>
                  </div>
                  <CrowdGauge
                    count={
                      tokens.filter(
                        (t) =>
                          t.department_id === activeToken.department_id &&
                          (t.status === 'waiting' || t.status === 'serving')
                      ).length
                    }
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* Leave Queue Action */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => leaveQueue(activeToken.id)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cancel and leave this queue
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════
            STATE C: POST-CONSULTATION FEEDBACK
        ══════════════════════════════════════════════ */}
        {isStateC && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto"
          >
            <div className="p-8 rounded-3xl bg-white border-2 border-[#96D7C6] shadow-xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#BAC94A]/25 border border-[#BAC94A] mx-auto flex items-center justify-center text-[#445508]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-[#1E3A3A]">Consultation Completed</h2>
                <p className="text-xs sm:text-sm text-[#5A7A7A] mt-1">
                  Token #{activeToken.token_number} served by <strong>{assignedDoctor}</strong>. How was your experience today?
                </p>
              </div>

              {!feedbackSubmitted ? (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-left">
                  <div className="space-y-2 text-center">
                    <label className="text-xs font-bold text-[#5A7A7A]">Rate your visit:</label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setStarRating(star)}
                          className="p-1 hover:scale-125 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= starRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5A7A7A]">
                      Doctor Feedback & Visit Comments:
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Doctor was very thorough and wait time was accurate..."
                      className="w-full p-3 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full font-bold">
                    Submit Feedback
                  </Button>
                </form>
              ) : (
                <div className="p-4 rounded-2xl bg-[#BAC94A]/25 border border-[#BAC94A] text-[#2C3B05] text-xs font-bold">
                  Thank you for your feedback! Your review helps optimize future wait times.
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => leaveQueue(activeToken.id)}
                  className="w-full"
                >
                  Join Another Department Queue
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════
            STATE A: DEPARTMENT SELECTION GRID (No active token)
        ══════════════════════════════════════════════ */}
        {!isStateB && !isStateC && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E3A3A] tracking-tight">
                  Select a Clinic / Department
                </h2>
                <p className="text-xs sm:text-sm text-[#5A7A7A]">
                  Choose from our clinical units. FlowIQ AI assigns you to an available counter and doctor.
                </p>
              </div>
            </div>

            {/* 3-Column Department Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments
                .filter((d) => d.is_active)
                .map((dept) => {
                  const summary = queueSummaries.find((s) => s.departmentId === dept.id);
                  const isOther = dept.name.toLowerCase().includes('other');
                  const deptCounter = counters.find((c) => c.department_id === dept.id);
                  const deptDoctor = deptCounter?.doctor_name || 'Dr. Robert Sterling';

                  return (
                    <div
                      key={dept.id}
                      className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-md hover:shadow-xl hover:border-[#5AA7A7] transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-[#EBF5F2] border border-[#96D7C6]/60 flex items-center justify-center shadow-xs">
                            {renderDeptIcon(dept.icon)}
                          </div>
                          <Badge
                            variant={
                              summary?.crowdLevel === 'SAFE'
                                ? 'olive'
                                : summary?.crowdLevel === 'MODERATE'
                                ? 'yellow'
                                : 'danger'
                            }
                          >
                            {summary?.crowdLevel === 'SAFE'
                              ? '🟢 Low'
                              : summary?.crowdLevel === 'MODERATE'
                              ? '🟡 Moderate'
                              : '🔴 High'}
                          </Badge>
                        </div>

                        <div>
                          <h3 className="text-base font-black text-[#1E3A3A]">{dept.name}</h3>
                          <p className="text-xs text-[#5A7A7A] line-clamp-2 mt-1 font-medium">
                            {dept.description}
                          </p>
                        </div>

                        {/* Assigned Doctor for this Clinic */}
                        <div className="p-2.5 rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/40 flex items-center justify-between text-xs">
                          <span className="text-[#5A7A7A] font-medium flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-[#5AA7A7]" />
                            Lead Doctor:
                          </span>
                          <strong className="text-[#1E3A3A] font-bold">{deptDoctor}</strong>
                        </div>

                        {/* Special Custom Name Input if 'Other' department */}
                        {isOther && (
                          <div className="pt-2">
                            <label className="text-[11px] font-bold text-[#5A7A7A] block mb-1">
                              Specify Custom Department:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Audiology, Sports Medicine"
                              value={customDeptInput}
                              onChange={(e) => setCustomDeptInput(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#5A7A7A] font-semibold">
                          <span>
                            <strong className="text-[#1E3A3A]">{summary?.activeTokensCount || 0}</strong> in queue
                          </span>
                          <span className="font-mono text-[#5AA7A7] font-bold">
                            ~{summary?.avgWaitMinutes || 0} min wait
                          </span>
                        </div>

                        <Button
                          variant="primary"
                          size="md"
                          className="w-full font-bold cursor-pointer"
                          loading={isJoining}
                          onClick={() => handleJoin(dept.id, isOther)}
                        >
                          Join Queue
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PAST TOKENS & CLINICAL VISIT HISTORY
        ══════════════════════════════════════════════ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5AA7A7]/15 flex items-center justify-center text-[#5AA7A7]">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1E3A3A] flex items-center gap-2">
                  My Past Tokens & Consultation History
                  <span className="px-2 py-0.5 rounded-full bg-[#EBF5F2] text-[#5AA7A7] text-xs font-bold font-mono">
                    {pastTokens.length} Records
                  </span>
                </h3>
                <p className="text-xs text-[#5A7A7A]">
                  Archive of all previous hospital visits, assigned doctors, and service durations.
                </p>
              </div>
            </div>
          </div>

          {pastTokens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastTokens.map((pt) => {
                const dept = getDepartmentById(pt.department_id);
                const counter = getCounterById(pt.counter_id);
                const isServed = pt.status === 'served';
                const formattedDate = new Date(pt.joined_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const formattedTime = new Date(pt.joined_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={pt.id}
                    className="p-5 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/60 hover:border-[#5AA7A7] hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-[#5AA7A7] px-2.5 py-1 rounded-lg bg-white border border-[#96D7C6]/40 shadow-xs">
                          Token #{pt.token_number}
                        </span>
                        <Badge variant={isServed ? 'olive' : 'default'} className="text-[10px]">
                          {isServed ? '✓ Completed' : pt.status}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-[#1E3A3A]">
                          {pt.custom_department || dept?.name || 'Department'}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-[#5A7A7A] mt-1 font-medium">
                          <Stethoscope className="w-3.5 h-3.5 text-[#5AA7A7]" />
                          <span>{pt.doctor_name || counter?.doctor_name || 'Dr. Robert Sterling'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-[#5A7A7A]">
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="w-3.5 h-3.5 text-[#BAC94A]" />
                        {formattedDate} • {formattedTime}
                      </span>
                      <span className="font-mono font-semibold text-[#1E3A3A]">
                        {pt.actual_wait_minutes ? `${pt.actual_wait_minutes} min service` : 'Completed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-[#F7FBF9] border border-dashed border-[#96D7C6]/60 space-y-2">
              <FileText className="w-8 h-8 text-[#96D7C6] mx-auto" />
              <p className="text-xs font-bold text-[#1E3A3A]">No past tokens found on this device</p>
              <p className="text-[11px] text-[#5A7A7A]">
                When you complete consultations, your token receipts will be archived here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
