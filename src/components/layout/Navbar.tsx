import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQueue } from '../../contexts/QueueContext';
import { getSupabaseStatus } from '../../lib/supabase/client';
import { DatabaseInspectorModal } from '../database/DatabaseInspectorModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Activity,
  User,
  Users,
  ShieldCheck,
  Tv,
  Bell,
  LogOut,
  Menu,
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  Trash2,
  Leaf,
  Sparkles,
  Database,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { notifications, unreadNotificationsCount, markNotificationAsRead, clearNotifications } = useQueue();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const isCurrent = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/auth');
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  if (location.pathname === '/display') return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#5AA7A7] via-[#529C9C] to-[#488E8E] border-b border-[#96D7C6]/40 shadow-sm text-white transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E2D36B] to-[#BAC94A] p-0.5 border border-white/40 flex items-center justify-center shadow-md shadow-[#BAC94A]/30 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-[#1E3A1E]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black font-mono tracking-tight text-[#FFFDF2]">
                Flow<span className="text-[#FFF5C0]">IQ</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-[#FFFDF2] border border-white/30">
                Nature Triage
              </span>
            </div>
            <span className="text-[10px] text-[#D6F0E9] font-medium tracking-tight -mt-1 hidden sm:block">
              Hospital Queue Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links - Strictly Role-Isolated */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isCurrent('/')
                ? 'bg-white/25 text-[#FFFDF2] border border-white/40 shadow-xs'
                : 'text-[#E3F5F0] hover:text-white hover:bg-white/10'
            }`}
          >
            Home
          </Link>

          {/* Patient-Only Link */}
          {user?.role === 'patient' && (
            <Link
              to="/patient"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isCurrent('/patient')
                  ? 'bg-[#BAC94A] text-[#1E3A1E] border border-[#BAC94A]/60 shadow-xs'
                  : 'text-[#E3F5F0] hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient Portal</span>
            </Link>
          )}

          {/* Staff-Only Link */}
          {user?.role === 'staff' && (
            <Link
              to="/staff"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isCurrent('/staff')
                  ? 'bg-[#6C8CBF] text-white border border-[#6C8CBF]/60 shadow-xs'
                  : 'text-[#E3F5F0] hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Station</span>
            </Link>
          )}

          {/* Admin Links */}
          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isCurrent('/admin')
                    ? 'bg-[#E2D36B] text-[#1E3A1E] border border-[#E2D36B]/60 shadow-xs'
                    : 'text-[#E3F5F0] hover:text-white hover:bg-white/10'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin AI</span>
              </Link>
              <Link
                to="/staff"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent('/staff')
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-[#E3F5F0] hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Staff View</span>
              </Link>
            </>
          )}

          {/* If Logged Out */}
          {!user && (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#FFFDF2] hover:bg-white/15 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Get Token</span>
            </Link>
          )}

          <Link
            to="/display"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#FFFDF2] bg-white/20 border border-white/30 hover:bg-white/30 transition-all ml-1"
          >
            <Tv className="w-3.5 h-3.5 text-[#FFF5C0]" />
            <span>TV Board</span>
          </Link>
        </nav>

        {/* Right Section: User & Notifications */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-[#E3F5F0] hover:text-white hover:bg-white/15 transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#BAC94A] text-[#1E3A1E] text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#5AA7A7] animate-bounce">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Popup */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white text-[#1E3A3A] border border-[#96D7C6]/60 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#5AA7A7]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#1E3A3A]">
                      Queue Notifications
                    </h4>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 py-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <p className="text-xs font-semibold">No notifications</p>
                      <p className="text-[11px]">You're all caught up with your tokens!</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                          notif.is_read
                            ? 'bg-slate-50 border-slate-100 text-slate-500 opacity-70'
                            : 'bg-[#F7FBF9] border-[#96D7C6]/50 text-[#1E3A3A] shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-black text-[#1E3A3A] text-xs">{notif.title}</h5>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Database Inspector Quick Toggle */}
          <button
            onClick={() => setShowDbModal(true)}
            title="Inspect Supabase Cloud Database & Tables"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#FFF5C0]" />
            <span className="text-[11px] font-mono">DB</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          {/* Sound Notification Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Audio Chimes Enabled' : 'Audio Chimes Muted'}
            className="hidden sm:flex p-2 rounded-xl text-[#E3F5F0] hover:text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-300" />}
          </button>

          {/* User Profile / Auth Toggle */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1 pl-2 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white transition-all cursor-pointer"
              >
                <div className="flex flex-col text-right hidden sm:block">
                  <span className="text-xs font-extrabold text-[#FFFDF2] max-w-[120px] truncate leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-[#FFF5C0] font-black uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#BAC94A] to-[#E2D36B] p-0.5 border border-white/40 flex items-center justify-center font-bold text-xs text-[#1E3A1E]">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 rounded-3xl bg-white text-[#1E3A3A] border border-[#96D7C6]/60 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 space-y-3">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-xs font-black text-[#1E3A3A]">{user.full_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#BAC94A]/25 text-[#4A5910] border border-[#BAC94A]/40">
                      Active: {user.role}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#F7FBF9] hover:text-[#5AA7A7] transition-all"
                    >
                      <User className="w-4 h-4 text-[#5AA7A7]" />
                      Profile & Settings
                    </Link>

                    {user.role === 'patient' && (
                      <Link
                        to="/patient"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#F7FBF9] hover:text-[#5AA7A7] transition-all"
                      >
                        <User className="w-4 h-4 text-[#BAC94A]" />
                        My Queue Tokens
                      </Link>
                    )}

                    {user.role === 'staff' && (
                      <Link
                        to="/staff"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#F7FBF9] hover:text-[#5AA7A7] transition-all"
                      >
                        <Users className="w-4 h-4 text-[#6C8CBF]" />
                        Staff Station Console
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#F7FBF9] hover:text-[#5AA7A7] transition-all"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#E2D36B]" />
                        Admin AI Intelligence
                      </Link>
                    )}
                  </div>

                  {/* Supabase Status Indicator (Clickable to inspect) */}
                  <div
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowDbModal(true);
                    }}
                    className="p-2.5 rounded-2xl bg-[#EBF5F2] hover:bg-[#d8ece7] border border-[#96D7C6]/60 text-[11px] space-y-1 cursor-pointer transition-colors group"
                    title="Click to inspect all Supabase tables & connections"
                  >
                    <div className="flex items-center justify-between text-[#1E3A3A] font-bold">
                      <span className="flex items-center gap-1.5 text-[#2D6A6A] group-hover:text-[#1E3A3A]">
                        <Database className="w-3.5 h-3.5 text-[#5AA7A7]" />
                        Supabase Cloud DB
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-black">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Inspect ↗
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-[#5A7A7A] truncate">
                      {getSupabaseStatus().url.replace('https://', '')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="yellow" size="sm" className="font-extrabold shadow-sm">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-xl text-[#E3F5F0] hover:text-white hover:bg-white/15"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {showMobileMenu && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-[#488E8E] border-b border-[#96D7C6]/30 space-y-3">
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/15 text-white"
            >
              Home
            </Link>

            {user?.role === 'patient' && (
              <Link
                to="/patient"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#BAC94A] text-[#1E3A1E]"
              >
                <User className="w-4 h-4" />
                Patient Portal
              </Link>
            )}

            {user?.role === 'staff' && (
              <Link
                to="/staff"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#6C8CBF] text-white"
              >
                <Users className="w-4 h-4" />
                Staff Station
              </Link>
            )}

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#E2D36B] text-[#1E3A1E]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin AI Dashboard
                </Link>
                <Link
                  to="/staff"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/15 text-white"
                >
                  <Users className="w-4 h-4" />
                  Staff View
                </Link>
              </>
            )}

            {!user && (
              <Link
                to="/auth"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#BAC94A] text-[#1E3A1E]"
              >
                <User className="w-4 h-4" />
                Sign In / Get Token
              </Link>
            )}

            <Link
              to="/display"
              target="_blank"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/20 text-white"
            >
              <Tv className="w-4 h-4 text-[#FFF5C0]" />
              Live Display TV Screen
            </Link>
          </div>
        </div>
      )}

      {/* Supabase Database & Table Inspector Modal */}
      <DatabaseInspectorModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
      />
    </header>
  );
};
