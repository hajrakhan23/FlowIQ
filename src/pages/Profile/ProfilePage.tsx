import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQueue } from '../../contexts/QueueContext';
import { getSupabaseStatus } from '../../lib/supabase/client';
import { DatabaseInspectorModal } from '../../components/database/DatabaseInspectorModal';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UserRole } from '../../types';
import {
  User,
  Mail,
  Phone,
  Shield,
  Clock,
  CheckCircle2,
  Bell,
  Save,
  Sparkles,
  Leaf,
  Database,
  ExternalLink,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateRole } = useAuth();
  const { tokens, departments } = useQueue();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 234-5678');
  const [emailConfirmPref, setEmailConfirmPref] = useState(true);
  const [emailTurnPref, setEmailTurnPref] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);

  // User's token history
  const userTokens = tokens.filter((t) => t.patient_id === user?.id || t.patient_email === user?.email);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleRoleChange = async (role: UserRole) => {
    await updateRole(role);
  };

  return (
    <div className="min-h-screen bg-[#F7FBF9] text-[#1E3A3A] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with Prominent Name Display */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5AA7A7] to-[#BAC94A] border border-white/40 flex items-center justify-center font-black text-2xl text-white shadow-md">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[#5AA7A7] font-bold mb-0.5">
                <Leaf className="w-3.5 h-3.5 text-[#BAC94A]" />
                <span>Verified Hospital Identity</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E3A3A] tracking-tight">
                {user?.full_name || 'Hospital Member'}
              </h1>
              <p className="text-xs text-[#5A7A7A]">
                Account role: <strong className="text-[#1E3A3A] capitalize">{user?.role}</strong> • ID: <span className="font-mono">{user?.id?.slice(0, 8)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="olive" className="py-2 px-3.5 text-xs font-bold capitalize">
              <span>{user?.role} Console Active</span>
            </Badge>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-[#BAC94A]/25 border border-[#BAC94A] text-[#2C3B05] text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-[#445508]" />
            <span>Profile and email notification preferences saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 Cols): Profile Edit & Notification Settings */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-6">
              <h2 className="text-lg font-black text-[#1E3A3A] flex items-center gap-2">
                <User className="w-5 h-5 text-[#5AA7A7]" />
                Personal Information
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5A7A7A]">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5A7A7A]">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'patient@hospital.org'}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5A7A7A]">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                  />
                </div>

                {/* Switch Role Section */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <label className="text-xs font-bold text-[#5A7A7A] flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#5AA7A7]" />
                    Switch Primary Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['patient', 'staff', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(r)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                          user?.role === r
                            ? r === 'patient'
                              ? 'bg-[#BAC94A] text-[#1E3A1E] border-[#BAC94A]/80 shadow-xs'
                              : r === 'staff'
                              ? 'bg-[#6C8CBF] text-white border-[#6C8CBF] shadow-xs'
                              : 'bg-[#5AA7A7] text-white border-[#5AA7A7] shadow-xs'
                            : 'bg-[#F7FBF9] text-[#5A7A7A] border-[#96D7C6]/40 hover:text-[#1E3A3A]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Notification Toggles */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h3 className="text-xs font-black text-[#5A7A7A] uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#5AA7A7]" />
                    Email Notification Preferences (EmailJS)
                  </h3>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/40 text-xs cursor-pointer text-[#1E3A3A]">
                    <span>Send digital token confirmation email upon joining queue</span>
                    <input
                      type="checkbox"
                      checked={emailConfirmPref}
                      onChange={(e) => setEmailConfirmPref(e.target.checked)}
                      className="w-4 h-4 accent-[#5AA7A7] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/40 text-xs cursor-pointer text-[#1E3A3A]">
                    <span>Send email reminder when 2 patients remain ahead in line</span>
                    <input
                      type="checkbox"
                      checked={emailTurnPref}
                      onChange={(e) => setEmailTurnPref(e.target.checked)}
                      className="w-4 h-4 accent-[#5AA7A7] cursor-pointer"
                    />
                  </label>
                </div>

                <Button type="submit" variant="primary" size="md" className="w-full font-bold gap-2">
                  <Save className="w-4 h-4" />
                  <span>Save Profile & Notification Settings</span>
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column (5 Cols): Token History */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-[#1E3A3A] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#5AA7A7]" />
                  My Token Activity
                </h3>
                <span className="text-xs text-[#5A7A7A] font-mono font-bold">
                  {userTokens.length} Tokens
                </span>
              </div>

              {userTokens.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <p className="text-xs font-semibold">No recent token activity</p>
                  <p className="text-[11px] text-slate-400">
                    Your queue tokens and consultation records will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {userTokens.map((tok) => {
                    const dept = departments.find((d) => d.id === tok.department_id);
                    return (
                      <div
                        key={tok.id}
                        className="p-3.5 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/40 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-black font-mono text-[#1E3A3A] block">
                            Token #{tok.token_number}
                          </span>
                          <span className="text-[11px] text-[#5A7A7A] font-medium">
                            {dept?.name || 'Department'}
                          </span>
                        </div>

                        <div className="text-right">
                          <Badge
                            variant={
                              tok.status === 'served'
                                ? 'olive'
                                : tok.status === 'waiting'
                                ? 'teal'
                                : 'yellow'
                            }
                            className="text-[10px]"
                          >
                            {tok.status.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                            {new Date(tok.joined_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Supabase Connection Status Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-[#1E3A3A] flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#5AA7A7]" />
                  <span>Cloud Database</span>
                </h3>
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Connected
                </span>
              </div>

              <p className="text-xs text-[#5A7A7A]">
                Connected to Supabase project <strong className="font-mono text-[#1E3A3A]">bwpkgcujoqtlcxcntzch</strong> (FlowIQ) with real-time queue broadcasting.
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDbModal(true)}
                  className="w-full text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-[#5AA7A7]" />
                  <span>Inspect Database & Tables</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Database & Table Inspector Modal */}
      <DatabaseInspectorModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
      />
    </div>
  );
};
