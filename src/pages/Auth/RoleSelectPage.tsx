import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { UserRole } from '../../types';
import { User, Stethoscope, ArrowRight, Activity, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const RoleSelectPage: React.FC = () => {
  const { user, updateRole } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = async (role: UserRole) => {
    await updateRole(role);
    if (role === 'staff') {
      navigate('/staff');
    } else if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/patient');
    }
  };

  const displayName = user?.full_name || 'Healthcare Seeker';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#001B4B]">
      <div className="max-w-3xl w-full space-y-8 text-center">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#018ABE]/20 border border-[#97CADB]/30 text-[#D6EBEE] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Profile Personalization</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome, {displayName}!
          </h1>
          <p className="text-sm sm:text-base text-[#97CADB] max-w-xl mx-auto">
            How will you be using FlowIQ today? Select your role to access your tailored dashboard.
          </p>
        </div>

        {/* 2 Large Cards: Patient vs Staff */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Patient Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole('patient')}
            className="cursor-pointer"
          >
            <GlassCard
              hover
              className="h-full p-8 flex flex-col justify-between border-2 border-[#97CADB]/30 hover:border-[#018ABE] hover:bg-[#018ABE]/20 transition-all group"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#02457A] to-[#018ABE] border border-[#97CADB]/40 flex items-center justify-center shadow-lg shadow-[#018ABE]/30 group-hover:scale-110 transition-transform">
                  <User className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#D6EBEE]">
                  I am a Patient / Visitor
                </h3>
                <p className="text-xs sm:text-sm text-[#97CADB] leading-relaxed">
                  Join department queues, generate digital tokens, check live wait predictions, and receive audio chime alerts when your turn arrives.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#97CADB]/20 flex items-center justify-between text-xs font-bold text-white group-hover:text-[#97CADB]">
                <span>Launch Patient Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>
          </motion.div>

          {/* Staff Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole('staff')}
            className="cursor-pointer"
          >
            <GlassCard
              hover
              className="h-full p-8 flex flex-col justify-between border-2 border-[#97CADB]/30 hover:border-[#018ABE] hover:bg-[#018ABE]/20 transition-all group"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#001B4B] to-[#02457A] border border-[#97CADB]/40 flex items-center justify-center shadow-lg shadow-[#02457A]/40 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-7 h-7 text-[#97CADB]" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#D6EBEE]">
                  I am Hospital Staff / Nurse
                </h3>
                <p className="text-xs sm:text-sm text-[#97CADB] leading-relaxed">
                  Operate consultation counters, call the next patient token, manage waiting queues, mark no-shows, and maintain department throughput.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#97CADB]/20 flex items-center justify-between text-xs font-bold text-white group-hover:text-[#97CADB]">
                <span>Launch Staff Station</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <p className="text-[11px] text-[#97CADB]/60">
          Admin access can be unlocked directly via the top navigation or assigned through Supabase.
        </p>
      </div>
    </div>
  );
};
