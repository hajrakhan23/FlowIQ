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
} from 'lucide-react';
import { motion } from 'motion/react';

export const JoinPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const counterId = searchParams.get('counter');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { counters, departments, tokens, joinQueue } = useQueue();

  const [loading, setLoading] = useState(false);

  // If not logged in, save return URL and offer instant sign-in or guest triage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('flowiq_return_url', window.location.pathname + window.location.search);
    }
  }, [user]);

  const targetCounter = counters.find((c) => c.id === counterId) || counters[0];
  const targetDept = departments.find((d) => d.id === targetCounter?.department_id) || departments[0];

  const waitingCount = tokens.filter(
    (t) =>
      (t.counter_id === targetCounter?.id || t.department_id === targetDept?.id) &&
      t.status === 'waiting'
  ).length;

  const waitResult = aiEngine.calculateWaitTime(
    waitingCount + 1,
    targetCounter?.avg_service_minutes || 5
  );

  const crowdResult = aiEngine.calculateCrowdLevel(waitingCount);

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
    <div className="min-h-screen bg-[#F7FBF9] text-[#1E3A3A] p-4 sm:p-6 flex flex-col justify-center items-center font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Mobile QR Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5AA7A7]/15 border border-[#5AA7A7]/30 text-[#2D6A6A] text-xs font-bold">
            <Leaf className="w-3.5 h-3.5 text-[#BAC94A]" />
            <span>Direct Counter QR Check-In</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E3A3A] tracking-tight">
            Check In to Hospital Station
          </h1>
        </div>

        {/* Counter Info Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#96D7C6] shadow-xl space-y-6">
          <div className="text-center space-y-2 pb-6 border-b border-slate-100">
            <Badge variant="olive" className="mb-1">
              {targetDept?.name || 'Clinical Department'}
            </Badge>
            <h2 className="text-2xl font-black text-[#1E3A3A]">
              {targetCounter?.name || 'Reception Desk'}
            </h2>
            <p className="text-xs text-[#5A7A7A]">
              {targetDept?.description || 'Fast-track medical queue'}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/50 text-center space-y-1">
              <span className="text-[10px] text-[#5A7A7A] font-bold uppercase tracking-wider block">
                People In Line
              </span>
              <p className="text-2xl font-black font-mono text-[#1E3A3A]">{waitingCount}</p>
              <span className="text-[10px] text-[#445508] font-bold">Ahead of you</span>
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
            <CrowdGauge count={waitingCount} size="sm" showLabel={true} />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              variant="yellow"
              size="lg"
              loading={loading}
              onClick={handleJoinThisQueue}
              className="w-full py-4 text-sm font-black tracking-wide gap-2 shadow-lg min-h-[48px]"
            >
              <span>{user ? 'Join This Queue Now' : 'Sign In & Get Digital Token'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-[#5A7A7A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#445508]" />
            <span>Digital token will be registered to {user?.email || 'your account'}.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
