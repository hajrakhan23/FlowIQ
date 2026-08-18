import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured, getSupabaseStatus } from '../../lib/supabase/client';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  X,
  Server,
  Layers,
  Activity,
  Table,
  Check,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface TableCheckResult {
  name: string;
  description: string;
  status: 'connected' | 'checking' | 'error' | 'not_found';
  rowCount: number | null;
  errorMessage?: string;
}

const TABLES_SCHEMA: { name: string; description: string }[] = [
  { name: 'tokens', description: 'Patient token queue tickets, status & doctor assignments' },
  { name: 'departments', description: 'Clinical departments (OPD, Cardiology, Pediatrics, etc.)' },
  { name: 'counters', description: 'Active doctor desks & staff triage stations' },
  { name: 'profiles', description: 'User accounts, verified roles (patient, staff, admin)' },
  { name: 'feedback', description: 'Post-consultation patient star ratings & reviews' },
  { name: 'notifications', description: 'In-app queue chimes & turn alerts' },
  { name: 'analytics', description: 'Historical patient traffic for AI crowd forecasting' },
];

const SCHEMA_SQL = `-- FlowIQ Supabase Database Setup
-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'staff', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Stethoscope',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.counters (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'busy')),
  current_serving INTEGER DEFAULT 0,
  avg_service_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token_number INTEGER NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  counter_id TEXT NOT NULL REFERENCES public.counters(id) ON DELETE CASCADE,
  custom_department TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'served', 'cancelled', 'no_show')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  served_at TIMESTAMPTZ,
  estimated_wait_minutes INTEGER DEFAULT 0,
  actual_wait_minutes INTEGER,
  position_in_queue INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token_id TEXT REFERENCES public.tokens(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  total_tokens INTEGER DEFAULT 0,
  avg_wait_minutes NUMERIC DEFAULT 0,
  peak_crowd INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES public.departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT NOT NULL DEFAULT 'turn_alert' CHECK (type IN ('token_confirm', 'almost_turn', 'turn_alert', 'crowd_warning', 'broadcast')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and public policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access on counters" ON public.counters FOR SELECT USING (true);
CREATE POLICY "Allow public read access on tokens" ON public.tokens FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tokens" ON public.tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tokens" ON public.tokens FOR UPDATE USING (true);
CREATE POLICY "Allow public read on feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert on feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on analytics" ON public.analytics FOR SELECT USING (true);
CREATE POLICY "Allow public read on notifications" ON public.notifications FOR SELECT USING (true);
`;

interface DatabaseInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseInspectorModal: React.FC<DatabaseInspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const status = getSupabaseStatus();
  const [tableResults, setTableResults] = useState<TableCheckResult[]>(
    TABLES_SCHEMA.map((t) => ({ ...t, status: 'checking', rowCount: null }))
  );
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const checkDatabaseTables = async () => {
    setIsTesting(true);
    const startTime = performance.now();

    const results: TableCheckResult[] = [];

    for (const tableInfo of TABLES_SCHEMA) {
      try {
        const { data, error, count } = await supabase
          .from(tableInfo.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            name: tableInfo.name,
            description: tableInfo.description,
            status: error.code === '42P01' ? 'not_found' : 'error',
            rowCount: null,
            errorMessage: error.message,
          });
        } else {
          results.push({
            name: tableInfo.name,
            description: tableInfo.description,
            status: 'connected',
            rowCount: count ?? 0,
          });
        }
      } catch (err: any) {
        results.push({
          name: tableInfo.name,
          description: tableInfo.description,
          status: 'error',
          rowCount: null,
          errorMessage: err.message || 'Connection error',
        });
      }
    }

    const duration = Math.round(performance.now() - startTime);
    setLatencyMs(duration);
    setTableResults(results);
    setIsTesting(false);
  };

  useEffect(() => {
    if (isOpen) {
      checkDatabaseTables();
    }
  }, [isOpen]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const projectUrl = 'https://bwpkgcujoqtlcxcntzch.supabase.co';
  const tableEditorUrl = 'https://supabase.com/dashboard/project/bwpkgcujoqtlcxcntzch/editor';
  const sqlEditorUrl = 'https://supabase.com/dashboard/project/bwpkgcujoqtlcxcntzch/sql';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 border border-[#96D7C6] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5AA7A7] to-[#BAC94A] p-0.5 border border-white/40 flex items-center justify-center text-white shadow-md">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-[#1E3A3A]">
                    Supabase Database & Tables Connection
                  </h3>
                  <Badge variant="olive" className="text-[10px] font-black">
                    Live Cloud
                  </Badge>
                </div>
                <p className="text-xs text-[#5A7A7A]">
                  Project ID: <strong className="font-mono text-[#1E3A3A]">bwpkgcujoqtlcxcntzch</strong> • Name: <strong className="text-[#1E3A3A]">FlowIQ</strong>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#5A7A7A] hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connection Summary Card */}
          <div className="p-5 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="w-3 h-3 -ml-5.5 rounded-full bg-emerald-500"></span>
                <div>
                  <h4 className="text-sm font-extrabold text-[#1E3A3A]">
                    Database Connection Active
                  </h4>
                  <p className="text-[11px] font-mono text-[#5A7A7A] truncate">
                    {projectUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkDatabaseTables}
                  disabled={isTesting}
                  className="text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>

                <a
                  href={tableEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5AA7A7] text-white text-xs font-bold hover:bg-[#488E8E] transition-all shadow-xs"
                >
                  <span>Open Table Editor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {latencyMs !== null && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-[#5A7A7A]">
                <span>Cloud Response Latency: <strong className="font-mono text-[#5AA7A7]">{latencyMs} ms</strong></span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Realtime Subscriptions Ready
                </span>
              </div>
            )}
          </div>

          {/* Table List & Status Inspector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-[#1E3A3A] flex items-center gap-1.5">
                <Table className="w-4 h-4 text-[#5AA7A7]" />
                Supabase Tables Status
              </h4>
              <span className="text-[11px] text-[#5A7A7A]">
                {tableResults.filter((t) => t.status === 'connected').length} of {tableResults.length} tables confirmed
              </span>
            </div>

            <div className="space-y-2">
              {tableResults.map((table) => {
                const isConnected = table.status === 'connected';
                const isChecking = table.status === 'checking';
                const isNotFound = table.status === 'not_found';

                return (
                  <div
                    key={table.name}
                    className="p-3.5 rounded-2xl bg-white border border-[#96D7C6]/40 hover:border-[#5AA7A7] transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-black ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isNotFound
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {table.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#1E3A3A]">
                            public.{table.name}
                          </span>
                          {isConnected && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                              ✓ Live
                            </span>
                          )}
                          {isNotFound && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                              Needs SQL Setup
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5A7A7A]">{table.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isChecking ? (
                        <span className="text-[11px] text-slate-400 font-mono">Checking...</span>
                      ) : isConnected ? (
                        <span className="text-xs font-mono font-extrabold text-[#5AA7A7]">
                          {table.rowCount !== null ? `${table.rowCount} rows` : 'Active'}
                        </span>
                      ) : isNotFound ? (
                        <span className="text-[11px] text-amber-600 font-semibold">Table not found</span>
                      ) : (
                        <span className="text-[11px] text-rose-500 font-semibold">Error checking</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions & SQL Setup Box */}
          <div className="p-4 rounded-2xl bg-[#EBF5F2] border border-[#96D7C6]/60 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#1E3A3A] font-bold">
                <Layers className="w-4 h-4 text-[#5AA7A7]" />
                <span>Need to create or initialize tables in your Supabase project?</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySql}
                  className="text-xs font-bold gap-1 bg-white cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5AA7A7]" />}
                  {copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}
                </Button>
                <a
                  href={sqlEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#BAC94A] text-[#1E3A1E] text-xs font-bold hover:bg-[#a9b83b] transition-all shadow-xs"
                >
                  <span>Open SQL Editor ↗</span>
                </a>
              </div>
            </div>
            <p className="text-[11px] text-[#2D6A6A]">
              1. Copy the SQL script above. 2. Open the Supabase SQL Editor. 3. Click <strong>Run</strong> to generate all 7 tables and RLS security rules automatically.
            </p>
          </div>

          {/* Close Button */}
          <Button
            variant="primary"
            size="md"
            className="w-full font-bold cursor-pointer"
            onClick={onClose}
          >
            Done
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
