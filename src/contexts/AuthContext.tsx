import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { emailService } from '../services/emailService';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string, role?: UserRole) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, pass: string, fullName: string, role?: UserRole) => Promise<{ error?: string }>;
  signInWithGoogle: (options?: { email?: string; name?: string; role?: UserRole }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  switchDemoRole: (role: UserRole, name?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'flowiq_auth_user';

// Helper to ensure strict name prefixing according to user role
export const formatNameForRole = (rawName: string, role: UserRole): string => {
  // Strip any existing titles
  const clean = rawName
    .replace(/^(Dr\.|St\.|Nurse|Mr\.|Mrs\.|Ms\.)\s*/gi, '')
    .trim() || 'Paras Masurkar';

  if (role === 'staff') {
    return `St. ${clean}`;
  }
  if (role === 'admin') {
    return `Dr. ${clean}`;
  }
  // Patients have clean normal name
  return clean;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        const parsed: Profile = JSON.parse(saved);
        return {
          ...parsed,
          full_name: formatNameForRole(parsed.full_name || 'Paras Masurkar', parsed.role),
        };
      } catch (e) {
        return null;
      }
    }
    // Default initial patient user with clean patient name
    return {
      id: 'patient-paras-001',
      full_name: 'Paras Masurkar',
      email: 'parasmasurkar10@gmail.com',
      role: 'patient',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '+1 (555) 234-5678',
      created_at: new Date().toISOString(),
    };
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Sync to local storage for persistence across reloads
  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  }, [user]);

  // If Supabase is configured, listen to auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchSupabaseProfile(session.user.id, session.user.email || '');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchSupabaseProfile(session.user.id, session.user.email || '');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSupabaseProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setUser(data as Profile);
      } else {
        // Profile not yet created in table
        const newProfile: Profile = {
          id: userId,
          full_name: email.split('@')[0] || 'User',
          email: email,
          role: 'patient',
          created_at: new Date().toISOString(),
        };
        setUser(newProfile);
      }
    } catch (e) {
      console.warn('Error loading profile from Supabase:', e);
    }
  };

  const signInWithEmail = async (email: string, _pass: string, role?: UserRole) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: _pass,
        });
        if (error) {
          setLoading(false);
          return { error: error.message };
        }
        if (data.user) {
          await fetchSupabaseProfile(data.user.id, data.user.email || email);
        }
      } else {
        // Fallback local auth simulation
        const existingUsers = JSON.parse(localStorage.getItem('flowiq_all_users') || '[]');
        const matched = existingUsers.find((u: Profile) => u.email.toLowerCase() === email.toLowerCase());

        const targetRole: UserRole = role || (matched ? matched.role : 'patient');
        const rawDerivedName = email.split('@')[0].replace(/[0-9._]/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase()) || 'Paras Masurkar';
        const formattedFullName = formatNameForRole(matched ? matched.full_name : rawDerivedName, targetRole);
        const loggedUser: Profile = matched
          ? { ...matched, full_name: formattedFullName, role: targetRole }
          : {
              id: 'user-' + Date.now(),
              full_name: formattedFullName,
              email: email,
              role: targetRole,
              created_at: new Date().toISOString(),
            };
        setUser(loggedUser);
      }
      setLoading(false);
      return {};
    } catch (err: any) {
      setLoading(false);
      return { error: err?.message || 'Failed to sign in' };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string, role: UserRole = 'patient') => {
    setLoading(true);
    const formattedName = formatNameForRole(fullName, role);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              full_name: formattedName,
              role: role,
            },
          },
        });
        if (error) {
          setLoading(false);
          return { error: error.message };
        }
        if (data.user) {
          const profile: Profile = {
            id: data.user.id,
            full_name: formattedName,
            email: email,
            role: role,
            created_at: new Date().toISOString(),
          };
          await supabase.from('profiles').upsert(profile);
          setUser(profile);

          emailService.sendWelcomeEmail({
            to_email: email,
            patient_name: formattedName,
            email: email,
            role: role,
          });
        }
      } else {
        const newProfile: Profile = {
          id: 'user-' + Date.now(),
          full_name: formattedName,
          email: email,
          role: role,
          created_at: new Date().toISOString(),
        };
        const existingUsers = JSON.parse(localStorage.getItem('flowiq_all_users') || '[]');
        existingUsers.push(newProfile);
        localStorage.setItem('flowiq_all_users', JSON.stringify(existingUsers));

        setUser(newProfile);

        emailService.sendWelcomeEmail({
          to_email: email,
          patient_name: formattedName,
          email: email,
          role: role,
        });
      }
      setLoading(false);
      return {};
    } catch (err: any) {
      setLoading(false);
      return { error: err?.message || 'Failed to sign up' };
    }
  };

  const signInWithGoogle = async (options?: { email?: string; name?: string; role?: UserRole }) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          setLoading(false);
          return { error: error.message };
        }
      } else {
        const targetEmail = options?.email || 'parasmasurkar10@gmail.com';
        const targetRole: UserRole = options?.role || 'patient';
        const targetName = formatNameForRole(options?.name || 'Paras Masurkar', targetRole);

        const googleProfile: Profile = {
          id: 'google-user-' + Date.now(),
          full_name: targetName,
          email: targetEmail,
          role: targetRole,
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          created_at: new Date().toISOString(),
        };
        setUser(googleProfile);
        emailService.sendWelcomeEmail({
          to_email: googleProfile.email,
          patient_name: googleProfile.full_name,
          email: googleProfile.email,
          role: googleProfile.role,
        });
      }
      setLoading(false);
      return {};
    } catch (err: any) {
      setLoading(false);
      return { error: err?.message || 'Google login failed' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  const updateRole = async (role: UserRole) => {
    if (!user) return;
    const formattedName = formatNameForRole(user.full_name, role);
    const updated = { ...user, full_name: formattedName, role };
    setUser(updated);

    if (isSupabaseConfigured) {
      await supabase.from('profiles').upsert(updated);
    }

    emailService.sendWelcomeEmail({
      to_email: user.email,
      patient_name: updated.full_name,
      email: user.email,
      role: role,
    });
  };

  const updateProfileName = async (name: string) => {
    if (!user) return;
    const formattedName = formatNameForRole(name, user.role);
    const updated = { ...user, full_name: formattedName };
    setUser(updated);
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ full_name: formattedName }).eq('id', user.id);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (error) return { success: false, message: error.message };
      }
      return { success: true, message: `Password reset instructions dispatched to ${email}` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Password reset failed' };
    }
  };

  const switchDemoRole = (role: UserRole, name?: string) => {
    const avatars = {
      patient: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      staff: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
      admin: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    };

    let formattedName = name;
    if (!formattedName) {
      if (role === 'staff') formattedName = 'St. Sarah Watson';
      else if (role === 'admin') formattedName = 'Dr. Marcus Vance (Chief Admin)';
      else formattedName = 'Paras Masurkar';
    } else {
      if (role === 'staff' && !formattedName.startsWith('St. ')) {
        formattedName = `St. ${formattedName.replace(/^(Dr\.|Nurse)\s*/, '')}`;
      } else if (role === 'patient') {
        formattedName = formattedName.replace(/^(Dr\.|St\.|Nurse)\s*/, '');
      }
    }

    const updated: Profile = {
      id: `profile-${role}-${Date.now()}`,
      full_name: formattedName,
      email: role === 'patient' ? 'parasmasurkar10@gmail.com' : `${role}@flowiq-hospital.com`,
      role: role,
      avatar_url: avatars[role],
      created_at: new Date().toISOString(),
    };
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        updateRole,
        updateProfileName,
        resetPassword,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
