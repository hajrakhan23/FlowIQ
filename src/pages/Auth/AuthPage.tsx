import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, COM_EMAIL_REGEX } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { UserRole } from '../../types';
import {
  Activity,
  ShieldCheck,
  Zap,
  Cpu,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Shield,
  X,
  Sparkles,
  Leaf,
  KeyRound,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthPage: React.FC = () => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('Paras Masurkar');
  const [googleEmail, setGoogleEmail] = useState('parasmasurkar10@gmail.com');
  const [googleRole, setGoogleRole] = useState<UserRole>('patient');
  const [googleError, setGoogleError] = useState('');

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const isEmailComValid = (em: string) => {
    return COM_EMAIL_REGEX.test(em.trim());
  };

  const handleRedirect = (role?: string) => {
    const returnUrl = localStorage.getItem('flowiq_return_url');
    if (returnUrl) {
      localStorage.removeItem('flowiq_return_url');
      navigate(returnUrl);
      return;
    }

    if (role === 'staff') {
      navigate('/staff');
    } else if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/patient');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    // Constraint: Email must match .com regex pattern
    if (!isEmailComValid(email)) {
      setErrorMsg('Invalid email format. Email must end with ".com" (e.g. name@domain.com).');
      return;
    }

    setLoading(true);
    const res = await signInWithEmail(email, password, selectedRole);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      handleRedirect(selectedRole);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password || !fullName.trim()) {
      setErrorMsg('Please complete all registration fields.');
      return;
    }

    // Constraint: Email must match .com regex pattern
    if (!isEmailComValid(email)) {
      setErrorMsg('Invalid email address. Registration requires a valid email ending with ".com" (e.g. paras@gmail.com).');
      return;
    }

    // Constraint: Password must match confirmation password
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password accurately.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    setLoading(true);
    const res = await signUpWithEmail(email, password, fullName, selectedRole);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      handleRedirect(selectedRole);
    }
  };

  const handleGoogleSubmit = async () => {
    setGoogleError('');
    setErrorMsg('');

    if (!isEmailComValid(googleEmail)) {
      setGoogleError('Google Email must be a valid address ending with ".com" (e.g. parasmasurkar10@gmail.com).');
      return;
    }

    setLoading(true);
    const res = await signInWithGoogle({
      name: googleName.trim() || 'Paras Masurkar',
      email: googleEmail.trim() || 'parasmasurkar10@gmail.com',
      role: googleRole,
    });
    setLoading(false);

    if (res.error) {
      setGoogleError(res.error);
    } else {
      setShowGoogleModal(false);
      handleRedirect(googleRole);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email above to receive password reset instructions.');
      return;
    }
    if (!isEmailComValid(email)) {
      setErrorMsg('Please enter a valid email ending in ".com".');
      return;
    }
    const res = await resetPassword(email);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const setQuickFill = (demoEmail: string, demoRole: UserRole, demoName: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setConfirmPassword(demoPass);
    setSelectedRole(demoRole);
    setFullName(demoName);
    setErrorMsg('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F7FBF9]">
      {/* Google Account Sign-In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white text-[#1E3A3A] w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#96D7C6]/60 space-y-6 relative">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-black text-[#1E3A3A]">Google Sign-In</h3>
                <p className="text-xs text-slate-500">Authenticate with your Google profile</p>
              </div>
            </div>

            {googleError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{googleError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Account Name</label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#96D7C6]/60 text-xs font-medium focus:ring-2 focus:ring-[#5AA7A7] focus:outline-none"
                  placeholder="Your Name"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Google Email</label>
                  <span className="text-[10px] text-[#5AA7A7] font-semibold">Must end in .com</span>
                </div>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#96D7C6]/60 text-xs font-medium focus:ring-2 focus:ring-[#5AA7A7] focus:outline-none"
                  placeholder="name@gmail.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Access Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoogleRole('patient')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      googleRole === 'patient'
                        ? 'bg-[#BAC94A] text-[#1E3A1E] border-[#BAC94A]/80 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-[#F7FBF9]'
                    }`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('staff')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      googleRole === 'staff'
                        ? 'bg-[#6C8CBF] text-white border-[#6C8CBF] shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-[#F7FBF9]'
                    }`}
                  >
                    Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      googleRole === 'admin'
                        ? 'bg-[#5AA7A7] text-white border-[#5AA7A7] shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-[#F7FBF9]'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                loading={loading}
                onClick={handleGoogleSubmit}
                className="w-full py-3 mt-2 font-bold"
              >
                Sign In as {googleRole.toUpperCase()}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-[#96D7C6]/50 grid grid-cols-1 lg:grid-cols-12 bg-white">
        {/* Left Panel: Nature Theme Gradient #5AA7A7 -> #96D7C6 */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#5AA7A7] via-[#66B3A3] to-[#96D7C6] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden text-white border-b lg:border-b-0 lg:border-r border-[#96D7C6]/30">
          {/* Nature Leaf Vector Motifs */}
          <div className="absolute -top-12 -right-12 w-64 h-64 pointer-events-none opacity-40">
            <svg
              className="w-full h-full text-[#BAC94A]"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M50 0 C70 30 100 50 100 100 C50 100 30 70 0 50 C30 50 50 30 50 0 Z" />
            </svg>
          </div>

          {/* Top Brand */}
          <div className="relative z-20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E2D36B] to-[#BAC94A] p-0.5 border border-white/40 flex items-center justify-center shadow-lg shadow-[#BAC94A]/30">
                <Activity className="w-5 h-5 text-[#1E3A1E]" />
              </div>
              <span className="text-2xl font-black font-mono text-[#FFFDF2]">
                Flow<span className="text-[#FFF5C0]">IQ</span>
              </span>
            </div>
            <h3 className="text-xl font-black text-[#FFFDF2] leading-tight">
              Calm, Crowd-Free Healthcare
            </h3>
            <p className="text-xs sm:text-sm text-[#0F3944] font-medium leading-relaxed">
              AI-Powered Hospital Queue & Patient Flow Architecture.
            </p>
          </div>

          {/* 3 Nature Trust Badges */}
          <div className="relative z-20 space-y-3 my-8">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md text-[#FFFDF2]">
              <ShieldCheck className="w-5 h-5 text-[#E2D36B] shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-[#FFFDF2]">Role-Isolated Portals</h5>
                <p className="text-[11px] text-[#0F3944] font-medium">Dedicated Patient, Staff & Admin consoles</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md text-[#FFFDF2]">
              <KeyRound className="w-5 h-5 text-[#BAC94A] shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-[#FFFDF2]">Strict Credential Verification</h5>
                <p className="text-[11px] text-[#0F3944] font-medium">Email .com validation & exact password matching</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md text-[#FFFDF2]">
              <Cpu className="w-5 h-5 text-[#FFF5C0] shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-[#FFFDF2]">AI-Powered Wait Estimation</h5>
                <p className="text-[11px] text-[#0F3944] font-medium">Dynamic triage & counter rebalancing</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-20 text-[11px] text-[#0F3944] font-bold flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#BAC94A]" />
            <span>Hospital Network Operational</span>
          </div>
        </div>

        {/* Right Panel: Light Modern Forms */}
        <div className="lg:col-span-7 bg-[#F7FBF9] p-8 sm:p-12 flex flex-col justify-center text-[#1E3A3A]">
          <div className="max-w-md mx-auto w-full space-y-6">
            {/* Header & Tabs */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#1E3A3A] tracking-tight">
                  {tab === 'signin' ? 'Sign In to FlowIQ' : 'Create Hospital Account'}
                </h2>
                <p className="text-xs sm:text-sm text-[#4E6B6B]">
                  {tab === 'signin'
                    ? 'Access your personal tokens or counter station'
                    : 'Join modern hospital queue management with AI'}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#EBF5F2] border border-[#96D7C6]/60">
                <button
                  type="button"
                  onClick={() => {
                    setTab('signin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tab === 'signin'
                      ? 'bg-[#5AA7A7] text-white shadow-sm'
                      : 'text-[#4E6B6B] hover:text-[#1E3A3A]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tab === 'signup'
                      ? 'bg-[#5AA7A7] text-white shadow-sm'
                      : 'text-[#4E6B6B] hover:text-[#1E3A3A]'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Role Selection Strip */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700">Account Type / Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('patient')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'patient'
                        ? 'bg-[#BAC94A] text-[#1E3A1E] border-[#BAC94A]/80 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('staff')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'staff'
                        ? 'bg-[#6C8CBF] text-white border-[#6C8CBF] shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'bg-[#5AA7A7] text-white border-[#5AA7A7] shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick-Fill Presets for Demo / Testing */}
            <div className="p-3 rounded-2xl bg-[#EBF5F2] border border-[#96D7C6]/60 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1E3A3A] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#BAC94A]" />
                  Quick Fill Portal Credentials
                </span>
                <span className="text-[10px] text-[#5AA7A7] font-bold">Default Portal Passwords</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickFill('parasmasurkar10@gmail.com', 'patient', 'Paras Masurkar', 'Paras@123')}
                  className="p-2 rounded-xl bg-white border border-[#96D7C6]/60 text-left hover:bg-[#BAC94A]/20 transition-all cursor-pointer space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#1E3A3A]">Patient</span>
                    <span className="text-[9px] font-mono font-bold text-[#445508] bg-[#BAC94A]/30 px-1 rounded">Paras@123</span>
                  </div>
                  <p className="text-[9px] text-[#5A7A7A] truncate">parasmasurkar10@gmail.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFill('staff@flowiq-hospital.com', 'staff', 'St. Shifa Khan', 'Shifa@123')}
                  className="p-2 rounded-xl bg-white border border-[#96D7C6]/60 text-left hover:bg-[#6C8CBF]/20 transition-all cursor-pointer space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#1E3A3A]">Staff</span>
                    <span className="text-[9px] font-mono font-bold text-[#1E3A3A] bg-[#6C8CBF]/30 px-1 rounded">Shifa@123</span>
                  </div>
                  <p className="text-[9px] text-[#5A7A7A] truncate">staff@flowiq-hospital.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFill('admin@flowiq-hospital.com', 'admin', 'Dr. Insha Malik', 'Insha@123')}
                  className="p-2 rounded-xl bg-white border border-[#96D7C6]/60 text-left hover:bg-[#5AA7A7]/20 transition-all cursor-pointer space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#1E3A3A]">Admin</span>
                    <span className="text-[9px] font-mono font-bold text-[#1E3A3A] bg-[#5AA7A7]/30 px-1 rounded">Insha@123</span>
                  </div>
                  <p className="text-[9px] text-[#5A7A7A] truncate">admin@flowiq-hospital.com</p>
                </button>
              </div>
            </div>

            {/* Error / Success Banners */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#96D7C6] bg-white text-xs font-bold text-[#1E3A3A] shadow-sm hover:bg-[#EBF5F2] hover:border-[#5AA7A7] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google (Instant Auth)</span>
            </button>

            {/* OR Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#96D7C6]/60 w-full" />
              <span className="bg-[#F7FBF9] px-3 text-[11px] uppercase tracking-wider text-[#4E6B6B] font-semibold">
                Or with Email & Password
              </span>
              <div className="border-t border-[#96D7C6]/60 w-full" />
            </div>

            {/* Email Form */}
            <AnimatePresence mode="wait">
              {tab === 'signin' ? (
                <motion.form
                  key="signin-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleSignIn}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E3A3A] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#5AA7A7]" />
                        Email Address
                      </label>
                      <span className="text-[10px] text-[#5AA7A7] font-semibold">Validation: regex .com</span>
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#1E3A3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA7A7] ${
                        email.length > 3 && !isEmailComValid(email)
                          ? 'border-amber-400'
                          : email.length > 3 && isEmailComValid(email)
                          ? 'border-emerald-400'
                          : 'border-[#96D7C6]/60'
                      }`}
                    />
                    {email.length > 3 && !isEmailComValid(email) && (
                      <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        Email must end with &quot;.com&quot; (e.g. {email.includes('@') ? `${email.split('@')[0]}@hospital.com` : 'user@domain.com'})
                      </p>
                    )}
                    {email.length > 3 && isEmailComValid(email) && (
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        Valid .com email format verified
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E3A3A] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#5AA7A7]" />
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[11px] font-semibold text-[#5AA7A7] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#96D7C6]/60 bg-white text-xs text-[#1E3A3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={loading}
                    className="w-full mt-2 font-bold py-2.5 cursor-pointer"
                  >
                    Sign In as {selectedRole.toUpperCase()}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleSignUp}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1E3A3A] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#5AA7A7]" />
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Paras Masurkar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#96D7C6]/60 bg-white text-xs text-[#1E3A3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1E3A3A] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#5AA7A7]" />
                        Email Address (.com constraint)
                      </label>
                      <span className="text-[10px] text-[#5AA7A7] font-semibold">Ends in .com</span>
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="paras@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#1E3A3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA7A7] ${
                        email.length > 3 && !isEmailComValid(email)
                          ? 'border-amber-400'
                          : email.length > 3 && isEmailComValid(email)
                          ? 'border-emerald-400'
                          : 'border-[#96D7C6]/60'
                      }`}
                    />
                    {email.length > 3 && !isEmailComValid(email) && (
                      <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        Email must end with &quot;.com&quot; (e.g. user@hospital.com)
                      </p>
                    )}
                    {email.length > 3 && isEmailComValid(email) && (
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        Valid .com email format verified
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E3A3A] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#5AA7A7]" />
                        Password (min 6)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#96D7C6]/60 bg-white text-xs text-[#1E3A3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1E3A3A] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#5AA7A7]" />
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#96D7C6]/60 bg-white text-xs text-[#1E3A3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                      />
                    </div>
                  </div>

                  {confirmPassword.length > 0 && (
                    <div className="text-[11px] font-semibold mt-1">
                      {password === confirmPassword ? (
                        <p className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passwords match perfectly
                        </p>
                      ) : (
                        <p className="text-rose-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Passwords do not match
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={loading}
                    className="w-full mt-2 font-bold py-2.5 cursor-pointer"
                  >
                    Register as {selectedRole.toUpperCase()}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

