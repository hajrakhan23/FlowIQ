import React from 'react';
import { Department, Counter, Token } from '../../types';
import { ShieldCheck, Activity, Users, AlertTriangle, Sparkles, Thermometer } from 'lucide-react';

interface SpatialNodesOrbitProps {
  departments: Department[];
  counters: Counter[];
  tokens: Token[];
  selectedDepartmentId: string;
  onSelectDepartment: (deptId: string) => void;
}

export const SpatialNodesOrbit: React.FC<SpatialNodesOrbitProps> = ({
  departments,
  counters,
  tokens,
  selectedDepartmentId,
  onSelectDepartment,
}) => {
  return (
    <div className="space-y-4">
      {/* SECTION TITLE */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
          <h3 className="text-xs sm:text-sm font-black font-mono tracking-widest text-[#00F0FF] uppercase">
            DEPLOYMENT QUEUE HEALTH PIPELINE
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
          SELECT NODE TO ORBIT
        </span>
      </div>

      {/* 4 ORBIT NODE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.slice(0, 4).map((dept, index) => {
          const deptTokens = tokens.filter(
            (t) => t.department_id === dept.id && (t.status === 'waiting' || t.status === 'serving')
          );
          const deptCounters = counters.filter((c) => c.department_id === dept.id);
          const isSelected = selectedDepartmentId === dept.id;

          // Compute score & status
          let score = 90;
          let statusText = 'OPTIMAL';
          let badgeColor = 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]';
          let orbitGlow = 'from-[#00F0FF] to-[#0088FF]';

          if (index === 1 || deptTokens.length > 5) {
            score = 63;
            statusText = 'DEGRADED';
            badgeColor = 'bg-[#E2D36B]/20 border-[#E2D36B] text-[#E2D36B]';
            orbitGlow = 'from-[#E2D36B] to-[#BAC94A]';
          } else if (index === 2) {
            score = 68;
            statusText = 'HEALTHY';
            badgeColor = 'bg-[#00FF88]/20 border-[#00FF88] text-[#00FF88]';
            orbitGlow = 'from-[#00FF88] to-[#00AA55]';
          } else if (index === 3) {
            score = 75;
            statusText = 'BALANCED';
            badgeColor = 'bg-[#6C8CBF]/20 border-[#6C8CBF] text-[#6C8CBF]';
            orbitGlow = 'from-[#6C8CBF] to-[#5AA7A7]';
          }

          const waitEstimate = deptTokens.length * 4;

          return (
            <div
              key={dept.id}
              onClick={() => onSelectDepartment(dept.id)}
              className={`relative rounded-3xl p-5 transition-all cursor-pointer flex flex-col items-center justify-between text-center group border ${
                isSelected
                  ? 'bg-[#101F2C] border-[#00F0FF] shadow-2xl shadow-[#00F0FF]/20 ring-1 ring-[#00F0FF]'
                  : 'bg-[#0A1118] border-slate-800 hover:border-[#00F0FF]/50 hover:bg-[#0E1721]'
              }`}
            >
              {/* Corner status dot */}
              <span
                className={`absolute top-3.5 right-3.5 w-2 h-2 rounded-full ${
                  statusText === 'OPTIMAL'
                    ? 'bg-[#00F0FF]'
                    : statusText === 'HEALTHY'
                    ? 'bg-[#00FF88]'
                    : 'bg-[#E2D36B]'
                }`}
              />

              {/* 3D Orbit Floating Node */}
              <div className="relative my-3 flex items-center justify-center">
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-tr ${orbitGlow} p-0.5 shadow-xl shadow-black/60 flex items-center justify-center transform group-hover:scale-105 group-hover:rotate-6 transition-all duration-300`}
                >
                  <div className="w-full h-full rounded-full bg-[#0A1118]/90 flex flex-col items-center justify-center p-1">
                    <span className="text-2xl font-black font-mono text-white tracking-tight leading-none">
                      {score}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#00F0FF] mt-0.5">
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* Orbiting Ring Element */}
                <div className="absolute inset-0 rounded-full border border-dashed border-[#00F0FF]/30 animate-spin -m-1.5 duration-10000 pointer-events-none" />
              </div>

              {/* Department Name & Metrics */}
              <div className="space-y-1 mt-2">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white line-clamp-1">
                  {dept.name}
                </h4>
                <p className="text-[11px] font-mono font-bold text-slate-400">
                  <strong className="text-white">{deptTokens.length}</strong> IN LINE •{' '}
                  <span className="text-[#00FF88]">~{waitEstimate}M WAIT</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SpatialDiagnosticsAndHeatmap: React.FC<{
  tokens: Token[];
  counters: Counter[];
}> = ({ tokens, counters }) => {
  const activeTokens = tokens.filter((t) => t.status === 'waiting' || t.status === 'serving');
  const emergencyTokens = tokens.filter((t) => t.priority === 'emergency');

  return (
    <div className="space-y-6">
      {/* 1. RESOURCE LOAD & HEALTH - COMPOSITE DIAGNOSTICS */}
      <div className="rounded-3xl bg-[#0A1118] border border-[#00F0FF]/30 p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-[#00F0FF]/20 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]">
              RESOURCE LOAD & HEALTH
            </span>
            <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              COMPOSITE DIAGNOSTICS
            </h4>
          </div>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              90<span className="text-xs text-slate-500 font-normal">/100</span>
            </span>
          </div>
        </div>

        {/* Progress Metrics Bars */}
        <div className="space-y-3 font-mono text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Wait vs Benchmark (30%)</span>
              <span className="font-bold text-[#00F0FF]">100%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#00F0FF] rounded-full w-full" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Abandonment Rate (25%)</span>
              <span className="font-bold text-[#00FF88]">88%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#00FF88] rounded-full w-[88%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Service Variance (25%)</span>
              <span className="font-bold text-[#E2D36B]">72%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#E2D36B] rounded-full w-[72%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Staff Utilization (20%)</span>
              <span className="font-bold text-[#00F0FF]">100%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#00F0FF] rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Diagnostic Command Line Layer */}
        <div className="p-3 rounded-2xl bg-[#070D13] border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="text-[#00FF88] font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>&gt; DIAGNOSTIC_LAYER: ACTIVE</span>
          </div>
          <p className="text-[#00F0FF]">
            &gt; Queue is running with optimal flow and balanced pacing
          </p>
          {emergencyTokens.length > 0 && (
            <p className="text-[#FF3366] font-bold animate-pulse">
              &gt; ALERT: {emergencyTokens.length} Code Red Emergency Token(s) in Active Pipeline!
            </p>
          )}
        </div>
      </div>

      {/* 2. VIRTUAL CROWD HEATMAP */}
      <div className="rounded-3xl bg-[#0A1118] border border-[#00F0FF]/30 p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between border-b border-[#00F0FF]/20 pb-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                VIRTUAL CROWD HEATMAP
              </h4>
              <p className="text-[10px] text-slate-400 font-mono">
                Probabilistic dwell spatial model • Zero camera overhead
              </p>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xl font-black text-white">{activeTokens.length + 10}</span>
            <span className="text-[10px] text-slate-500 uppercase block">IN FACILITY</span>
          </div>
        </div>

        {/* 4 Spatial Zones Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Zone A: Staging (High Density Alert) */}
          <div className="p-3.5 rounded-2xl bg-[#1A0B10] border border-[#FF3366]/60 shadow-md space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span className="truncate">Zone A • Counter Staging...</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF3366] shrink-0" />
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-sm font-black text-white">
                20 <span className="text-xs text-slate-500">/ 20</span>
              </span>
              <span className="text-[10px] text-[#FF3366] font-bold">99% DENSITY</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#FF3366] rounded-full w-[99%]" />
            </div>
          </div>

          {/* Zone B: Central Atrium */}
          <div className="p-3.5 rounded-2xl bg-[#0A1715] border border-[#00FF88]/40 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span className="truncate">Zone B • Central Atrium...</span>
              <span className="w-2 h-2 rounded-full bg-[#00FF88]" />
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-sm font-black text-white">
                10 <span className="text-xs text-slate-500">/ 35</span>
              </span>
              <span className="text-[10px] text-[#00FF88] font-bold">27% DENSITY</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#00FF88] rounded-full w-[27%]" />
            </div>
          </div>

          {/* Zone C: Express Café */}
          <div className="p-3.5 rounded-2xl bg-[#0C141C] border border-[#00F0FF]/30 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span className="truncate">Zone C • Express Café &...</span>
              <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-sm font-black text-white">
                2 <span className="text-xs text-slate-500">/ 40</span>
              </span>
              <span className="text-[10px] text-[#00F0FF] font-bold">5% DENSITY</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#00F0FF] rounded-full w-[5%]" />
            </div>
          </div>

          {/* Zone D: Entry Concourse */}
          <div className="p-3.5 rounded-2xl bg-[#0C141C] border border-[#00F0FF]/30 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span className="truncate">Zone D • Entry Concourse...</span>
              <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-sm font-black text-white">
                2 <span className="text-xs text-slate-500">/ 30</span>
              </span>
              <span className="text-[10px] text-[#00F0FF] font-bold">7% DENSITY</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#00F0FF] rounded-full w-[7%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
