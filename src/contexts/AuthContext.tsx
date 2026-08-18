import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { emailService } from '../services/emailService';

// Strict regex enforcing standard email format ending explicitly with .com
export const COM_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.com$/i;

export const validateComEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email address is required.' };
  }
  const trimmed = email.trim();
  if (!COM_EMAIL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid email. Email address must end with ".com" (e.g., name@domain.com).',
    };
  }
  return { valid: true };
};

export interface RegisteredAccount extends Profile {
  password_hash: string;
}

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
  validateEmail: (email: string) => { valid: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'flowiq_auth_user';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'flowiq_registered_accounts_v5';

// Pre-seeded standard accounts with requested default passwords
const INITIAL_REGISTERED_ACCOUNTS: RegisteredAccount[] = [
  {
    id: 'patient-paras-001',
    full_name: 'Paras Masurkar',
    email: 'parasmasurkar10@gmail.com',
    role: 'patient',
    password_hash: 'Paras@123',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: '+1 (555) 234-5678',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'staff-shifa-001',
    full_name: 'St. Shifa Khan',
    email: 'staff@flowiq-hospital.com',
    role: 'staff',
    password_hash: 'Shifa@123',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'staff-shifa-002',
    full_name: 'St. Shifa',
    email: 'shifa@flowiq-hospital.com',
    role: 'staff',
    password_hash: 'Shifa@123',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'admin-insha-001',
    full_name: 'Dr. Insha Malik',
    email: 'admin@flowiq-hospital.com',
    role: 'admin',
    password_hash: 'Insha@123',
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'admin-insha-002',
    full_name: 'Dr. Insha',
    email: 'insha@flowiq-hospital.com',
    role: 'admin',
    password_hash: 'Insha@123',
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    created_at: new Date('2026-01-01').toISOString(),
  },
];

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
  // Initialize registered accounts in local storage
  const getRegisteredAccounts = (): RegisteredAccount[] => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      if (saved) {
        const parsed: RegisteredAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge initial standard accounts to ensure preset passwords (Paras@123, Shifa@123, Insha@123) are always up to date
          const merged = [...parsed];
          INITIAL_REGISTERED_ACCOUNTS.forEach((initAcc) => {
            const idx = merged.findIndex((a) => a.email.toLowerCase() === initAcc.email.toLowerCase());
            if (idx === -1) {
              merged.push(initAcc);
            } else {
              // Update preset accounts to match requested passwords
              merged[idx] = {
                ...merged[idx],
                password_hash: initAcc.password_hash,
                full_name: initAcc.full_name,
                role: initAcc.role,
              };
            }
          });
          return merged;
        }
      }
    } catch (e) {}
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(INITIAL_REGISTERED_ACCOUNTS));
    return INITIAL_REGISTERED_ACCOUNTS;
  };

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

  // Ensure accounts storage is initialized
  useEffect(() => {
    getRegisteredAccounts();
  }, []);

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

  const signInWithEmail = async (email: string, pass: string, role?: UserRole) => {
    setLoading(true);
    // 1. Email format constraint validation (.com regex)
    const emailCheck = validateComEmail(email);
    if (!emailCheck.valid) {
      setLoading(false);
      return { error: emailCheck.error };
    }

    if (!pass || pass.trim().length === 0) {
      setLoading(false);
      return { error: 'Please enter your password.' };
    }

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: pass,
        });
        if (error) {
          setLoading(false);
          return { error: error.message };
        }
        if (data.user) {
          await fetchSupabaseProfile(data.user.id, data.user.email || email);
        }
      } else {
        // Database verification from registered accounts
        const accounts = getRegisteredAccounts();
        const matched = accounts.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );

        if (!matched) {
          setLoading(false);
          return {
            error: `No registered account found for "${email}". Please switch to Sign Up to create an account with your password.`,
          };
        }

        // Strict Password Constraint Check: Password must match the one entered at sign up / registration
        if (matched.password_hash !== pass) {
          setLoading(false);
          return {
            error: 'Incorrect password. The password must match the one entered at the time of registration.',
          };
        }

        const targetRole: UserRole = role || matched.role;
        const formattedFullName = formatNameForRole(matched.full_name, targetRole);
        const loggedUser: Profile = {
          id: matched.id,
          full_name: formattedFullName,
          email: matched.email,
          role: targetRole,
          avatar_url: matched.avatar_url,
          phone: matched.phone,
          created_at: matched.created_at || new Date().toISOString(),
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

  const signUpWithEmail = async (
    email: string,
    pass: string,
    fullName: string,
    role: UserRole = 'patient'
  ) => {
    setLoading(true);
    // 1. Email format constraint validation (.com regex)
    const emailCheck = validateComEmail(email);
    if (!emailCheck.valid) {
      setLoading(false);
      return { error: emailCheck.error };
    }

    if (!pass || pass.length < 6) {
      setLoading(false);
      return { error: 'Password must be at least 6 characters long.' };
    }

    if (!fullName || !fullName.trim()) {
      setLoading(false);
      return { error: 'Full name is required for medical registration.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const formattedName = formatNameForRole(fullName, role);

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
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
            email: cleanEmail,
            role: role,
            created_at: new Date().toISOString(),
          };
          await supabase.from('profiles').upsert(profile);
          setUser(profile);

          emailService.sendWelcomeEmail({
            to_email: cleanEmail,
            patient_name: formattedName,
            email: cleanEmail,
            role: role,
          });
        }
      } else {
        const accounts = getRegisteredAccounts();
        const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (existing) {
          setLoading(false);
          return {
            error: `An account with email "${cleanEmail}" already exists. Please switch to Sign In and enter your password.`,
          };
        }

        const newAccount: RegisteredAccount = {
          id: 'user-' + Date.now(),
          full_name: formattedName,
          email: cleanEmail,
          role: role,
          password_hash: pass,
          avatar_url:
            role === 'staff'
              ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'
              : role === 'admin'
              ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          created_at: new Date().toISOString(),
        };

        accounts.push(newAccount);
        localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));

        const newProfile: Profile = {
          id: newAccount.id,
          full_name: newAccount.full_name,
          email: newAccount.email,
          role: newAccount.role,
          avatar_url: newAccount.avatar_url,
          created_at: newAccount.created_at,
        };

        setUser(newProfile);

        emailService.sendWelcomeEmail({
          to_email: cleanEmail,
          patient_name: formattedName,
          email: cleanEmail,
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
    const targetEmail = options?.email?.trim().toLowerCase() || 'parasmasurkar10@gmail.com';

    // Validate email format (.com)
    const emailCheck = validateComEmail(targetEmail);
    if (!emailCheck.valid) {
      setLoading(false);
      return { error: emailCheck.error };
    }

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
        const targetRole: UserRole = options?.role || 'patient';
        const targetName = formatNameForRole(options?.name || 'Paras Masurkar', targetRole);

        // Ensure user is also saved in registered accounts if not present
        const accounts = getRegisteredAccounts();
        let existing = accounts.find((a) => a.email.toLowerCase() === targetEmail);
        if (!existing) {
          existing = {
            id: 'google-user-' + Date.now(),
            full_name: targetName,
            email: targetEmail,
            role: targetRole,
            password_hash: 'google_oauth_verified',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            created_at: new Date().toISOString(),
          };
          accounts.push(existing);
          localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
        }

        const googleProfile: Profile = {
          id: existing.id,
          full_name: formatNameForRole(existing.full_name, targetRole),
          email: existing.email,
          role: targetRole,
          avatar_url: existing.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          created_at: existing.created_at,
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
    const emailCheck = validateComEmail(email);
    if (!emailCheck.valid) {
      return { success: false, message: emailCheck.error || 'Invalid email' };
    }

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (error) return { success: false, message: error.message };
      } else {
        const accounts = getRegisteredAccounts();
        const matched = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (!matched) {
          return {
            success: false,
            message: `No registered account found with email "${email}".`,
          };
        }
      }
      return {
        success: true,
        message: `Password reset instructions dispatched to ${email.trim()}. Please check your inbox.`,
      };
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
        validateEmail: validateComEmail,
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

