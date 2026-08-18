import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Department,
  Counter,
  Token,
  Feedback,
  AnalyticsRecord,
  NotificationItem,
  QueueSummary,
} from '../types';
import { INITIAL_DEPARTMENTS } from '../data/defaultPatterns';
import { INITIAL_COUNTERS, INITIAL_TOKENS } from '../data/mockHospitalData';
import { aiEngine } from '../services/aiEngine';
import { emailService } from '../services/emailService';
import { notificationService } from '../services/notificationService';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import confetti from 'canvas-confetti';

interface QueueContextType {
  departments: Department[];
  counters: Counter[];
  tokens: Token[];
  feedbackList: Feedback[];
  analyticsRecords: AnalyticsRecord[];
  notifications: NotificationItem[];
  queueSummaries: QueueSummary[];
  loading: boolean;
  joinQueue: (
    departmentId: string,
    customDept?: string,
    user?: { id: string; email: string; full_name: string }
  ) => Promise<{ success: boolean; token?: Token; message?: string }>;
  callNextToken: (counterId: string) => Promise<{ success: boolean; nextToken?: Token; message?: string }>;
  assignTokenPriority: (
    tokenId: string,
    priority: 'emergency' | 'high' | 'normal',
    reason?: string
  ) => Promise<void>;
  markNoShow: (counterId: string, tokenId: string) => Promise<void>;
  leaveQueue: (tokenId: string) => Promise<void>;
  submitFeedback: (tokenId: string, rating: number, comment?: string, userId?: string) => Promise<void>;
  toggleCounterStatus: (counterId: string, status: 'open' | 'closed' | 'busy') => Promise<void>;
  addDepartment: (dept: Omit<Department, 'id' | 'created_at'>) => Promise<Department>;
  toggleDepartmentActive: (deptId: string, isActive: boolean) => Promise<void>;
  addCounter: (departmentId: string, name: string, staffName?: string, doctorName?: string) => Promise<Counter>;
  sendBroadcastNotification: (departmentId: string, message: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getCounterById: (id: string) => Counter | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getActiveTokenForUser: (userId: string) => Token | undefined;
  getTokensForCounter: (counterId: string) => Token[];
  refreshData: () => Promise<void>;
  resetToDefaultMockData: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Local Storage Cache Keys
const LS_DEPTS = 'flowiq_departments';
const LS_COUNTERS = 'flowiq_counters';
const LS_TOKENS = 'flowiq_tokens_v2';
const LS_FEEDBACK = 'flowiq_feedback';
const LS_ANALYTICS = 'flowiq_analytics';
const LS_NOTIFICATIONS = 'flowiq_notifications';

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem(LS_DEPTS);
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [counters, setCounters] = useState<Counter[]>(() => {
    const saved = localStorage.getItem(LS_COUNTERS);
    if (saved) {
      try {
        const parsed: Counter[] = JSON.parse(saved);
        // Ensure all counters have doctor_name and staff_name
        return parsed.map((c) => {
          const match = INITIAL_COUNTERS.find((ic) => ic.id === c.id || ic.department_id === c.department_id);
          return {
            ...c,
            doctor_name: c.doctor_name || match?.doctor_name || 'Dr. Robert Sterling',
            staff_name: c.staff_name || match?.staff_name || 'St. Sarah Watson',
          };
        });
      } catch (e) {
        return INITIAL_COUNTERS;
      }
    }
    return INITIAL_COUNTERS;
  });

  const [tokens, setTokens] = useState<Token[]>(() => {
    const saved = localStorage.getItem(LS_TOKENS);
    if (saved) {
      try {
        const parsed: Token[] = JSON.parse(saved);
        if (parsed.length > 0) {
          return parsed.map((t) => {
            const matchedCounter = INITIAL_COUNTERS.find((c) => c.id === t.counter_id || c.department_id === t.department_id);
            return {
              ...t,
              doctor_name: t.doctor_name || matchedCounter?.doctor_name || 'Dr. Robert Sterling',
              staff_name: t.staff_name || matchedCounter?.staff_name || 'St. Sarah Watson',
              patient_name: t.patient_name ? t.patient_name.replace(/^(Dr\.|St\.)\s*/, '') : 'Arthur Pendelton',
            };
          });
        }
      } catch (e) {
        return INITIAL_TOKENS;
      }
    }
    return INITIAL_TOKENS;
  });

  const [feedbackList, setFeedbackList] = useState<Feedback[]>(() => {
    const saved = localStorage.getItem(LS_FEEDBACK);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'fb-1',
        token_id: 'tok-100',
        user_id: 'patient-paras-001',
        rating: 5,
        comment: 'Dr. Robert Sterling and St. Sarah Watson were exceptionally attentive and swift. AI wait time was exact!',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'fb-2',
        token_id: 'tok-99',
        user_id: 'user-2',
        rating: 5,
        comment: 'Dr. Allison Brooks at pharmacy and St. Rachel Adams made prescription pickup fast and effortless.',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'fb-3',
        token_id: 'tok-98',
        user_id: 'user-3',
        rating: 5,
        comment: 'Dr. Elena Rostova explained the cardiology report thoroughly. Very clean queue display!',
        created_at: new Date(Date.now() - 14400000).toISOString(),
      },
    ];
  });

  const [analyticsRecords, setAnalyticsRecords] = useState<AnalyticsRecord[]>(() => {
    const saved = localStorage.getItem(LS_ANALYTICS);
    if (saved) return JSON.parse(saved);

    // Initial Analytics History
    const sampleRecords: AnalyticsRecord[] = [];
    const today = new Date().toISOString().split('T')[0];
    for (let h = 8; h <= 18; h++) {
      sampleRecords.push({
        id: `ana-init-${h}`,
        department_id: 'dept-opd',
        date: today,
        hour_of_day: h,
        total_tokens: Math.floor(Math.random() * 15) + 5,
        avg_wait_minutes: Math.floor(Math.random() * 10) + 4,
        peak_crowd_level: h >= 10 && h <= 14 ? 'HIGH' : 'SAFE',
        created_at: new Date().toISOString(),
      });
    }
    return sampleRecords;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(LS_NOTIFICATIONS);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'notif-1',
        user_id: 'patient-paras-001',
        message: 'Token #102: You are #1 in line at OPD Counter 1 with Dr. Robert Sterling.',
        type: 'queue_update',
        is_read: false,
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      },
    ];
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LS_DEPTS, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(LS_COUNTERS, JSON.stringify(counters));
  }, [counters]);

  useEffect(() => {
    localStorage.setItem(LS_TOKENS, JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem(LS_FEEDBACK, JSON.stringify(feedbackList));
  }, [feedbackList]);

  useEffect(() => {
    localStorage.setItem(LS_ANALYTICS, JSON.stringify(analyticsRecords));
  }, [analyticsRecords]);

  useEffect(() => {
    localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Supabase real-time integration or simulated poll
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('flowiq-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, () => {
        refreshData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counters' }, () => {
        refreshData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const [tokRes, ctrRes, notifRes, fbRes] = await Promise.all([
        supabase.from('tokens').select('*').order('joined_at', { ascending: true }),
        supabase.from('counters').select('*'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('feedback').select('*').order('created_at', { ascending: false }),
      ]);

      if (tokRes.data) setTokens(tokRes.data as Token[]);
      if (ctrRes.data) setCounters(ctrRes.data as Counter[]);
      if (notifRes.data) setNotifications(notifRes.data as NotificationItem[]);
      if (fbRes.data) setFeedbackList(fbRes.data as Feedback[]);
    } catch (err) {
      console.warn('Supabase refresh error:', err);
    }
  }, []);

  const resetToDefaultMockData = () => {
    setDepartments(INITIAL_DEPARTMENTS);
    setCounters(INITIAL_COUNTERS);
    setTokens(INITIAL_TOKENS);
    localStorage.setItem(LS_DEPTS, JSON.stringify(INITIAL_DEPARTMENTS));
    localStorage.setItem(LS_COUNTERS, JSON.stringify(INITIAL_COUNTERS));
    localStorage.setItem(LS_TOKENS, JSON.stringify(INITIAL_TOKENS));
  };

  // Compute Queue Summaries per department for real-time overview
  const queueSummaries: QueueSummary[] = useMemo(() => {
    return departments.map((dept) => {
      const deptTokens = tokens.filter(
        (t) => t.department_id === dept.id && (t.status === 'waiting' || t.status === 'serving')
      );
      const servingToken = tokens.find(
        (t) => t.department_id === dept.id && t.status === 'serving'
      );
      const activeCount = deptTokens.length;
      const crowdResult = aiEngine.calculateCrowdLevel(activeCount);
      const openCounters = counters.filter(
        (c) => c.department_id === dept.id && c.status === 'open'
      );
      const avgWait = activeCount > 0 ? Math.round(activeCount * 4.5) : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        icon: dept.icon,
        activeTokensCount: activeCount,
        servingTokenNumber: servingToken ? servingToken.token_number : 0,
        avgWaitMinutes: avgWait,
        crowdLevel: crowdResult.level,
        crowdColor: crowdResult.color,
        openCountersCount: openCounters.length,
      };
    });
  }, [departments, tokens, counters]);

  // Join Queue Method
  const joinQueue = async (
    departmentId: string,
    customDept?: string,
    user?: { id: string; email: string; full_name: string }
  ) => {
    const dept = departments.find((d) => d.id === departmentId);
    const deptName = customDept ? `Other (${customDept})` : (dept?.name || 'Department');

    // Check if counters are available and not paused
    const deptCounters = counters.filter((c) => c.department_id === departmentId);
    const openCounters = deptCounters.filter((c) => c.status === 'open');

    if (openCounters.length === 0) {
      return {
        success: false,
        message: `All counters in ${deptName} are currently paused or on break. Tokens cannot be generated for paused counters. Please wait until a counter resumes service.`,
      };
    }

    // Auto-assign open counter with shortest line
    const { bestCounter } = aiEngine.suggestBestCounter(departmentId, openCounters, tokens);
    const targetCounter = bestCounter || openCounters[0];

    // Compute next token number
    const highestTokenNum = tokens.reduce((max, t) => Math.max(max, t.token_number || 0), 100);
    const nextTokenNum = highestTokenNum + 1;

    // Clean patient name (no prefix for patients)
    const cleanPatientName = user?.full_name
      ? user.full_name.replace(/^(Dr\.|St\.)\s*/, '')
      : 'Paras Masurkar';

    // Count people ahead at this counter
    const waitingAhead = tokens.filter(
      (t) => t.counter_id === targetCounter.id && t.status === 'waiting'
    ).length;

    const waitResult = aiEngine.calculateWaitTime(
      waitingAhead + 1,
      targetCounter.avg_service_minutes || 5
    );

    const assignedDoctor = targetCounter.doctor_name || 'Dr. Robert Sterling';
    const assignedStaff = targetCounter.staff_name || 'St. Sarah Watson';

    const newToken: Token = {
      id: 'tok-' + Date.now(),
      counter_id: targetCounter.id,
      department_id: departmentId,
      user_id: user?.id || 'patient-paras-001',
      patient_name: cleanPatientName,
      patient_email: user?.email || 'parasmasurkar10@gmail.com',
      doctor_name: assignedDoctor,
      staff_name: assignedStaff,
      token_number: nextTokenNum,
      status: 'waiting',
      position_in_queue: waitingAhead + 1,
      estimated_wait_minutes: waitResult.estimatedWaitMinutes,
      priority: 'normal',
      joined_at: new Date().toISOString(),
      custom_department: customDept,
    };

    // Update tokens state
    setTokens((prev) => [...prev, newToken]);

    // Send confirmation email via EmailJS (Registered email)
    if (user?.email) {
      emailService.sendTokenConfirmation({
        to_email: user.email,
        patient_name: cleanPatientName,
        token_number: nextTokenNum,
        department: deptName,
        counter_name: `${targetCounter.name} (${assignedDoctor})`,
        wait_time: waitResult.estimatedWaitMinutes,
        joined_at: new Date().toLocaleString(),
      });
    }

    // Add In-App notification
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      user_id: newToken.user_id,
      token_id: newToken.id,
      message: `Token #${nextTokenNum} issued for ${deptName}. Assigned to ${targetCounter.name} with ${assignedDoctor}. Estimated wait: ${waitResult.estimatedWaitMinutes} mins.`,
      type: 'queue_update',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);

    notificationService.playChime('next');

    // Supabase write
    if (isSupabaseConfigured) {
      try {
        await supabase.from('tokens').insert(newToken);
        await supabase.from('notifications').insert(newNotif);
      } catch (err) {
        console.warn('Error persisting token to Supabase:', err);
      }
    }

    return {
      success: true,
      token: newToken,
      message: `Token #${nextTokenNum} generated successfully for ${deptName}! Assigned to ${assignedDoctor}.`,
    };
  };

  // Assign Priority (Staff Triage Action for Emergency / Urgent Cases)
  const assignTokenPriority = async (
    tokenId: string,
    priority: 'emergency' | 'high' | 'normal',
    reason?: string
  ) => {
    const updated = tokens.map((t) =>
      t.id === tokenId
        ? {
            ...t,
            priority,
            is_emergency: priority === 'emergency',
            triage_reason: reason || (priority === 'emergency' ? 'Code Red Emergency Triage' : undefined),
          }
        : t
    );
    setTokens(updated);

    const targetToken = tokens.find((t) => t.id === tokenId);
    if (targetToken) {
      const priorityNotif: NotificationItem = {
        id: 'notif-prio-' + Date.now(),
        user_id: targetToken.user_id,
        token_id: targetToken.id,
        message:
          priority === 'emergency'
            ? `🚨 CRITICAL ALERT: Token #${targetToken.token_number} (${targetToken.patient_name}) elevated to FIRST PRIORITY EMERGENCY.`
            : `Priority status updated for Token #${targetToken.token_number} to ${priority.toUpperCase()}.`,
        type: 'alert',
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [priorityNotif, ...prev]);
      if (priority === 'emergency') {
        notificationService.playChime('alert');
      }
    }
  };

  // Call Next Token (Staff Action) - Prioritizes Emergency & High Priority First
  const callNextToken = async (counterId: string) => {
    const counter = counters.find((c) => c.id === counterId);
    if (!counter) return { success: false, message: 'Counter not found' };

    // Current token being served
    const currentServing = tokens.find(
      (t) => t.counter_id === counterId && t.status === 'serving'
    );

    // Priority sorting weight: emergency = 0, high = 1, normal = 2
    const getPriorityWeight = (p?: string) => {
      if (p === 'emergency') return 0;
      if (p === 'high') return 1;
      return 2;
    };

    // Next token waiting for this counter (or same department) sorted by Priority, then by joined time
    const waitingTokens = tokens
      .filter((t) => (t.counter_id === counterId || t.department_id === counter.department_id) && t.status === 'waiting')
      .sort((a, b) => {
        const pDiff = getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
        if (pDiff !== 0) return pDiff;
        return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      });

    const nextToken = waitingTokens[0];

    const nowIso = new Date().toISOString();
    const currentHour = new Date().getHours();

    let updatedTokens = [...tokens];
    let newAvgMinutes = counter.avg_service_minutes;

    // 1. Finalize current serving token
    if (currentServing) {
      const waitStart = new Date(currentServing.joined_at).getTime();
      const waitEnd = Date.now();
      const actualMinutes = Math.max(1, Math.round((waitEnd - waitStart) / 60000));

      newAvgMinutes = aiEngine.calculateRollingAvg(
        counter.avg_service_minutes || 5,
        actualMinutes,
        5
      );

      updatedTokens = updatedTokens.map((t) =>
        t.id === currentServing.id
          ? {
              ...t,
              status: 'served' as const,
              served_at: nowIso,
              actual_wait_minutes: actualMinutes,
            }
          : t
      );

      // Record in Analytics Table
      const analyticsEntry: AnalyticsRecord = {
        id: 'ana-' + Date.now(),
        department_id: counter.department_id,
        date: nowIso.split('T')[0],
        hour_of_day: currentHour,
        total_tokens: 1,
        avg_wait_minutes: actualMinutes,
        peak_crowd_level: aiEngine.calculateCrowdLevel(waitingTokens.length).level,
        created_at: nowIso,
      };

      setAnalyticsRecords((prev) => [analyticsEntry, ...prev]);
      if (isSupabaseConfigured) {
        supabase.from('analytics').insert(analyticsEntry);
      }
    }

    // 2. Advance next token to 'called'
    if (nextToken) {
      updatedTokens = updatedTokens.map((t) =>
        t.id === nextToken.id
          ? {
              ...t,
              counter_id: counterId,
              status: 'called' as const,
              position_in_queue: 0,
              estimated_wait_minutes: 0,
              doctor_name: counter.doctor_name || t.doctor_name || 'Dr. Robert Sterling',
              staff_name: counter.staff_name || t.staff_name || 'St. Sarah Watson',
            }
          : t
      );

      // Update remaining waiting tokens' queue positions & estimated waits
      const remainingForCounter = updatedTokens
        .filter((t) => t.counter_id === counterId && t.status === 'waiting')
        .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());

      remainingForCounter.forEach((rem, idx) => {
        const newPos = idx + 1;
        const newWait = newPos * newAvgMinutes;
        updatedTokens = updatedTokens.map((t) =>
          t.id === rem.id
            ? { ...t, position_in_queue: newPos, estimated_wait_minutes: newWait }
            : t
        );

        // Alert patient when position = 3 or position = 1
        if (newPos === 3) {
          const alertNotif: NotificationItem = {
            id: 'notif-' + Date.now() + '-' + rem.id,
            user_id: rem.user_id,
            token_id: rem.id,
            message: `⚠️ Almost your turn! 2 patients ahead for Token #${rem.token_number} at ${counter.name} (${counter.doctor_name || 'Doctor'}).`,
            type: 'alert',
            is_read: false,
            created_at: new Date().toISOString(),
          };
          setNotifications((p) => [alertNotif, ...p]);
        }
      });

      // Update counter current serving
      setCounters((prev) =>
        prev.map((c) =>
          c.id === counterId
            ? {
                ...c,
                current_serving: nextToken.token_number,
                avg_service_minutes: newAvgMinutes,
              }
            : c
        )
      );

      // Trigger Turn Next Alert & Sound
      notificationService.playChime('turn');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#5AA7A7', '#96D7C6', '#BAC94A'],
        });
      } catch (e) {}

      // Add Notification for the patient whose turn is now
      const turnNotif: NotificationItem = {
        id: 'notif-turn-' + Date.now(),
        user_id: nextToken.user_id,
        token_id: nextToken.id,
        message: `🎉 YOUR TURN! Token #${nextToken.token_number} (${nextToken.patient_name}), please proceed to ${counter.name} with ${counter.doctor_name || 'Dr. Robert Sterling'} immediately.`,
        type: 'queue_update',
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((p) => [turnNotif, ...p]);

      if (isSupabaseConfigured) {
        supabase.from('counters').update({ current_serving: nextToken.token_number }).eq('id', counterId);
        supabase.from('tokens').update({ status: 'serving', position_in_queue: 0 }).eq('id', nextToken.id);
      }
    } else {
      // No one waiting
      setCounters((prev) =>
        prev.map((c) =>
          c.id === counterId ? { ...c, current_serving: 0, avg_service_minutes: newAvgMinutes } : c
        )
      );
    }

    setTokens(updatedTokens);

    return {
      success: true,
      nextToken: nextToken,
      message: nextToken
        ? `Called Token #${nextToken.token_number} (${nextToken.patient_name}) for ${counter.doctor_name || 'Doctor'}`
        : 'Queue is clear. No waiting patients.',
    };
  };

  // Mark No-Show
  const markNoShow = async (counterId: string, tokenId: string) => {
    setTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, status: 'no_show' as const } : t))
    );
    if (isSupabaseConfigured) {
      await supabase.from('tokens').update({ status: 'no_show' }).eq('id', tokenId);
    }
    // Automatically advance next
    await callNextToken(counterId);
  };

  // Leave Queue
  const leaveQueue = async (tokenId: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== tokenId));
    if (isSupabaseConfigured) {
      await supabase.from('tokens').delete().eq('id', tokenId);
    }
  };

  // Submit Feedback
  const submitFeedback = async (
    tokenId: string,
    rating: number,
    comment?: string,
    userId?: string
  ) => {
    const newFeedback: Feedback = {
      id: 'fb-' + Date.now(),
      token_id: tokenId,
      user_id: userId || 'user',
      rating,
      comment: comment || '',
      created_at: new Date().toISOString(),
    };
    setFeedbackList((prev) => [newFeedback, ...prev]);

    if (isSupabaseConfigured) {
      await supabase.from('feedback').insert(newFeedback);
    }
  };

  // Toggle Counter Open/Closed/Busy
  const toggleCounterStatus = async (counterId: string, status: 'open' | 'closed' | 'busy') => {
    setCounters((prev) =>
      prev.map((c) => (c.id === counterId ? { ...c, status } : c))
    );
    if (isSupabaseConfigured) {
      await supabase.from('counters').update({ status }).eq('id', counterId);
    }
  };

  // Add Custom Department
  const addDepartment = async (dept: Omit<Department, 'id' | 'created_at'>) => {
    const newDept: Department = {
      ...dept,
      id: 'dept-' + dept.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      created_at: new Date().toISOString(),
    };
    setDepartments((prev) => [...prev, newDept]);

    // Create a default counter for this new department
    const newCounter: Counter = {
      id: 'ctr-' + newDept.id,
      department_id: newDept.id,
      name: `${newDept.name} Desk 1`,
      staff_name: 'St. Sarah Watson',
      doctor_name: 'Dr. Robert Sterling',
      status: 'open',
      current_serving: 0,
      avg_service_minutes: 5,
      created_at: new Date().toISOString(),
    };
    setCounters((prev) => [...prev, newCounter]);

    if (isSupabaseConfigured) {
      await supabase.from('departments').insert(newDept);
      await supabase.from('counters').insert(newCounter);
    }

    return newDept;
  };

  const toggleDepartmentActive = async (deptId: string, isActive: boolean) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, is_active: isActive } : d))
    );
    if (isSupabaseConfigured) {
      await supabase.from('departments').update({ is_active: isActive }).eq('id', deptId);
    }
  };

  const addCounter = async (departmentId: string, name: string, staffName?: string, doctorName?: string) => {
    const formattedStaff = staffName
      ? staffName.startsWith('St. ')
        ? staffName
        : `St. ${staffName}`
      : 'St. Sarah Watson';
    const formattedDoctor = doctorName
      ? doctorName.startsWith('Dr. ')
        ? doctorName
        : `Dr. ${doctorName}`
      : 'Dr. Robert Sterling';

    const newCounter: Counter = {
      id: 'ctr-' + Date.now(),
      department_id: departmentId,
      name,
      staff_name: formattedStaff,
      doctor_name: formattedDoctor,
      status: 'open',
      current_serving: 0,
      avg_service_minutes: 5,
      created_at: new Date().toISOString(),
    };
    setCounters((prev) => [...prev, newCounter]);
    if (isSupabaseConfigured) {
      await supabase.from('counters').insert(newCounter);
    }
    return newCounter;
  };

  const sendBroadcastNotification = async (departmentId: string, message: string) => {
    // Determine target users
    const targetTokens =
      departmentId === 'all'
        ? tokens.filter((t) => t.status === 'waiting' || t.status === 'serving')
        : tokens.filter(
            (t) =>
              t.department_id === departmentId &&
              (t.status === 'waiting' || t.status === 'serving')
          );

    const newNotifs: NotificationItem[] = targetTokens.map((t) => ({
      id: 'notif-broad-' + Date.now() + '-' + t.id,
      user_id: t.user_id,
      token_id: t.id,
      message: `📢 [BROADCAST]: ${message}`,
      type: 'alert',
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
      notificationService.playChime('alert');
      if (isSupabaseConfigured) {
        await supabase.from('notifications').insert(newNotifs);
      }
    }
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    if (isSupabaseConfigured) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    if (isSupabaseConfigured) {
      await supabase.from('notifications').delete().neq('id', 'none');
    }
  };

  const getCounterById = (id: string) => counters.find((c) => c.id === id);
  const getDepartmentById = (id: string) => departments.find((d) => d.id === id);
  const getActiveTokenForUser = (userId: string) =>
    tokens.find(
      (t) =>
        t.user_id === userId &&
        (t.status === 'waiting' || t.status === 'called' || t.status === 'serving' || t.status === 'served')
    );
  const getTokensForCounter = (counterId: string) =>
    tokens.filter((t) => t.counter_id === counterId);

  return (
    <QueueContext.Provider
      value={{
        departments,
        counters,
        tokens,
        feedbackList,
        analyticsRecords,
        notifications,
        queueSummaries,
        loading,
        joinQueue,
        callNextToken,
        assignTokenPriority,
        markNoShow,
        leaveQueue,
        submitFeedback,
        toggleCounterStatus,
        addDepartment,
        toggleDepartmentActive,
        addCounter,
        sendBroadcastNotification,
        markNotificationRead,
        clearAllNotifications,
        getCounterById,
        getDepartmentById,
        getActiveTokenForUser,
        getTokensForCounter,
        refreshData,
        resetToDefaultMockData,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
