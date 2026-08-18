import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQueue } from '../../contexts/QueueContext';
import { aiEngine } from '../../services/aiEngine';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CrowdGauge } from '../../components/ui/CrowdGauge';
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Leaf,
  History,
  Stethoscope,
  CalendarCheck,
  FileText,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';

export const JoinPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const counterId = searchParams.get('counter');
  const deptId = searchParams.get('dept');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { counters, departments, tokens, joinQueue, getDepartmentById, getCounterById } = useQueue();

  const [loading, setLoading] = useState(false);

  // If not logged in, save return URL and offer instant sign-in or guest triage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('flowiq_return_url', window.location.pathname + window.location.search);
    }
  }, [user]);

  const targetDept =
    departments.find((d) => d.id === deptId) ||
    departments.find((d) => d.id === counters.find((c) => c.id === counterId)?.department_id) ||
    departments[0];

  const targetCounter =
    counters.find((c) => c.id === counterId) ||
    counters.find((c) => c.department_id === targetDept?.id) ||
    counters[0];

  // Active tokens in this department/counter queue
  const stationActiveTokens = tokens.filter(
    (t) =>
      (t.counter_id === targetCounter?.id || t.department_id === targetDept?.id) &&
      (t.status === 'waiting' || t.status === 'called' || t.status === 'serving')
  );

  const waitingTokens = stationActiveTokens.filter((t) => t.status === 'waiting');
  const servingToken = stationActiveTokens.find((t) => t.status === 'called' || t.status === 'serving');

  const waitResult = aiEngine.calculateWaitTime(
    waitingTokens.length + 1,
    targetCounter?.avg_service_minutes || 5
  );

  const crowdResult = aiEngine.calculateCrowdLevel(waitingTokens.length);

  // Past Tokens History for this patient
  const userPastTokens = tokens.filter((t) => {
    const matchUser =
      (user?.id && t.user_id === user.id) ||
      (user?.email && t.patient_email && t.patient_email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
      (user?.full_name && t.patient_name && t.patient_name.toLowerCase().trim() === user.full_name.toLowerCase().trim());
    return matchUser && (t.status === 'served' || t.status === 'no_show');
  });

  const handleJoinThisQueue = async () => {
    if (!user) {
      localStorage.setItem('flowiq_return_url', window.location.pathname + window.location.search);
      navigate('/auth');
      return;
    }

    setLoading(true);
    await joinQueue(targetDept.id, undefined, {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    });
    setLoading(false);
    navigate('/patient');
  };

  return (
    <div className="min-h-screen bg-[#F7FBF9] text-[#1E3A3A] p-4 sm:p-6 lg:p-8 flex flex-col justify-start items-center font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl space-y-8 my-auto"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5AA7A7]/15 border border-[#5AA7A7]/30 text-[#2D6A6A] text-xs font-bold">
            <Leaf className="w-4 h-4 text-[#BAC94A]" />
            <span>FlowIQ Real-Time Queue Admission</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#1E3A3A] tracking-tight">
            Hospital Station Check-In
          </h1>
          <p className="text-xs sm:text-sm text-[#5A7A7A] max-w-md mx-auto">
            Review active participants in line, live AI estimated wait time, and your past clinical records.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Join Action Card (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#96D7C6] shadow-xl space-y-6">
              {/* Department & Station Header */}
              <div className="space-y-3 pb-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <Badge variant="olive">
                    {targetDept?.name || 'Clinical Department'}
                  </Badge>
                  <span className="text-xs text-[#5AA7A7] font-bold font-mono">
                    Station #{targetCounter?.name || 'Reception Desk'}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-[#1E3A3A]">
                  {targetCounter?.name || 'Reception Desk'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-[#5A7A7A]">
                  <Stethoscope className="w-4 h-4 text-[#5AA7A7]" />
                  <span>Lead Doctor: <strong className="text-[#1E3A3A]">{targetCounter?.doctor_name || 'Dr. Robert Sterling'}</strong></span>
                </div>
              </div>

              {/* Department Quick Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5A7A7A]">Select Clinical Unit:</label>
                <select
                  value={targetDept?.id}
                  onChange={(e) => setSearchParams({ dept: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs font-bold text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/50 text-center space-y-1">
                  <span className="text-[10px] text-[#5A7A7A] font-bold uppercase tracking-wider block">
                    Active Participants
                  </span>
                  <p className="text-2xl font-black font-mono text-[#1E3A3A]">{waitingTokens.length}</p>
                  <span className="text-[10px] text-[#445508] font-bold">Waiting in queue</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/50 text-center space-y-1">
                  <span className="text-[10px] text-[#5A7A7A] font-bold uppercase tracking-wider block">
                    Estimated Wait
                  </span>
                  <p className="text-2xl font-black font-mono text-[#1E3A3A]">
                    ~{waitResult.estimatedWaitMinutes}{' '}
                    <span className="text-xs font-normal text-[#5A7A7A]">min</span>
                  </p>
                  <span className="text-[10px] text-[#5AA7A7] font-semibold">AI Confidence: High</span>
                </div>
              </div>

              {/* Crowd Gauge */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#EBF5F2] border border-[#96D7C6]/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#1E3A3A] uppercase tracking-wider">
                    Current Crowd Level
                  </span>
                  <p className="text-xs text-[#5A7A7A]">
                    {crowdResult.description}
                  </p>
                </div>
                <CrowdGauge count={waitingTokens.length} size="sm" showLabel={true} />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  variant="yellow"
                  size="lg"
                  loading={loading}
                  onClick={handleJoinThisQueue}
                  className="w-full py-4 text-sm sm:text-base font-black tracking-wide gap-2 shadow-lg min-h-[50px] cursor-pointer"
                >
                  <span>{user ? 'Join This Queue Now' : 'Sign In & Get Digital Token'}</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#5A7A7A]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#445508]" />
                <span>Digital token will be registered to {user?.email || 'your account'}.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Active Participants & Past History (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Active Participants in Queue List */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#5AA7A7]" />
                  <h3 className="text-sm font-black text-[#1E3A3A] uppercase tracking-wider">
                    Active Queue List ({stationActiveTokens.length})
                  </h3>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              {servingToken && (
                <div className="p-3 rounded-2xl bg-[#5AA7A7]/15 border border-[#5AA7A7]/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#1E3A3A] bg-[#FFFDF2] px-2 py-0.5 rounded-md">
                      NOW AT DESK
                    </span>
                    <span className="text-xs font-mono font-black text-[#5AA7A7]">
                      #{servingToken.token_number}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#1E3A3A]">{servingToken.patient_name}</p>
                </div>
              )}

              {waitingTokens.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {waitingTokens.map((tok, idx) => (
                    <div
                      key={tok.id}
                      className="p-2.5 rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#EBF5F2] text-[#5AA7A7] font-bold text-[10px] flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-[#1E3A3A]">{tok.patient_name}</p>
                          <p className="text-[10px] text-[#5A7A7A] font-mono">
                            Token #{tok.token_number} • ~{tok.estimated_wait_minutes || (idx + 1) * 5}m wait
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={tok.priority === 'emergency' ? 'danger' : 'teal'}
                        className="text-[9px]"
                      >
                        {tok.priority === 'emergency' ? '🚨 Triage' : 'Waiting'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F7FBF9] text-center border border-dashed border-[#96D7C6]/60 text-xs text-[#5A7A7A]">
                  No waiting patients ahead. You will be first in line!
                </div>
              )}
            </div>

            {/* Patient Past Token History */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#BAC94A]" />
                  <h3 className="text-sm font-black text-[#1E3A3A] uppercase tracking-wider">
                    My Past Tokens ({userPastTokens.length})
                  </h3>
                </div>
                <span className="text-[11px] text-[#5AA7A7] font-bold font-mono">
                  {user?.email ? 'Account Sync' : 'Guest'}
                </span>
              </div>

              {userPastTokens.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {userPastTokens.map((pt) => {
                    const dept = getDepartmentById(pt.department_id);
                    return (
                      <div
                        key={pt.id}
                        className="p-2.5 rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-[#1E3A3A]">
                            {pt.custom_department || dept?.name || 'Clinic'}
                          </span>
                          <span className="text-[10px] font-mono text-[#5AA7A7]">
                            Token #{pt.token_number}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#5A7A7A]">
                          <span>{pt.doctor_name || 'Dr. Robert Sterling'}</span>
                          <span className="font-semibold text-emerald-700">✓ Completed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F7FBF9] text-center border border-dashed border-[#96D7C6]/60 text-xs text-[#5A7A7A] space-y-1">
                  <FileText className="w-5 h-5 text-[#96D7C6] mx-auto" />
                  <p className="font-bold text-[#1E3A3A]">No past visits logged</p>
                  <p className="text-[10px]">Your visit receipts will be stored here automatically.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

