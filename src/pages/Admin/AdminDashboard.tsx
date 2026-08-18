import React, { useState, useMemo } from 'react';
import { useQueue } from '../../contexts/QueueContext';
import { aiEngine } from '../../services/aiEngine';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CrowdGauge } from '../../components/ui/CrowdGauge';
import { QRCodeSVG } from 'qrcode.react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Printer,
  Send,
  Star,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Stethoscope,
  Leaf,
  Calendar,
  Layers,
  Filter,
  Box,
  Database,
  ExternalLink,
  RefreshCw,
  Copy,
  Table,
} from 'lucide-react';
import { SpatialQueuePipeline3D } from '../../components/spatial/SpatialQueuePipeline3D';
import {
  SpatialNodesOrbit,
  SpatialDiagnosticsAndHeatmap,
} from '../../components/spatial/SpatialNodesOrbit';
import { supabase, isSupabaseConfigured, getSupabaseStatus } from '../../lib/supabase/client';

type AdminTab =
  | 'overview'
  | 'spatial_3d'
  | 'crowd_monitoring'
  | 'ai_prediction'
  | 'qr_codes'
  | 'departments'
  | 'analytics'
  | 'notifications'
  | 'database';

export const AdminDashboard: React.FC = () => {
  const {
    departments,
    counters,
    tokens,
    feedbackList,
    analyticsRecords,
    queueSummaries,
    addDepartment,
    toggleDepartmentActive,
    addCounter,
    sendBroadcastNotification,
  } = useQueue();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedDeptForPrediction, setSelectedDeptForPrediction] = useState<string>(
    departments[0]?.id || 'dept-opd'
  );
  const [predictionDay, setPredictionDay] = useState<'today' | 'tomorrow' | 'weekend'>('today');

  // Analytics Filter
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [analyticsDeptFilter, setAnalyticsDeptFilter] = useState<string>('all');

  // New Department Form State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newDeptIcon, setNewDeptIcon] = useState('Stethoscope');

  // New Counter Form State
  const [newCounterDeptId, setNewCounterDeptId] = useState(departments[0]?.id || 'dept-opd');
  const [newCounterName, setNewCounterName] = useState('');
  const [showCounterModal, setShowCounterModal] = useState(false);

  // Compose Broadcast State
  const [broadcastDept, setBroadcastDept] = useState('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSentStatus, setBroadcastSentStatus] = useState<string | null>(null);

  // Top Overview Metrics
  const activePatients = tokens.filter(
    (t) => t.status === 'waiting' || t.status === 'serving'
  ).length;
  const totalServedToday = tokens.filter((t) => t.status === 'served').length + 84;
  const overallCrowd = aiEngine.calculateCrowdLevel(activePatients);

  // Selected Department Info for Prediction
  const selectedDeptObj = departments.find((d) => d.id === selectedDeptForPrediction) || departments[0];
  const selectedDeptCounters = counters.filter((c) => c.department_id === selectedDeptForPrediction);
  const selectedDeptLeadDoctor = selectedDeptCounters[0]?.doctor_name || 'Dr. Robert Sterling';
  const selectedDeptLeadStaff = selectedDeptCounters[0]?.staff_name || 'St. Sarah Watson';

  // AI Prediction calculation for selected department
  const peakAnalysis = useMemo(() => {
    const base = aiEngine.predictPeakHours(selectedDeptForPrediction, analyticsRecords);
    // Adjust multiplier based on predictionDay
    const multiplier = predictionDay === 'tomorrow' ? 1.15 : predictionDay === 'weekend' ? 0.75 : 1.0;

    const adjustedPredictions = base.hourlyPredictions.map((hp) => ({
      ...hp,
      predicted_crowd: Math.max(2, Math.round(hp.predicted_crowd * multiplier)),
    }));

    const adjustedPeaks = base.peakHours.map((ph) => ({
      ...ph,
      crowd: Math.max(4, Math.round(ph.crowd * multiplier)),
    }));

    return {
      ...base,
      hourlyPredictions: adjustedPredictions,
      peakHours: adjustedPeaks,
    };
  }, [selectedDeptForPrediction, analyticsRecords, predictionDay]);

  // System Alerts Calculation
  const systemAlerts = useMemo(() => {
    const alerts: { id: string; type: 'danger' | 'warning' | 'info'; text: string }[] = [];
    queueSummaries.forEach((qs) => {
      if (qs.crowdLevel === 'CRITICAL' || qs.crowdLevel === 'HIGH') {
        alerts.push({
          id: `alert-crowd-${qs.departmentId}`,
          type: 'danger',
          text: `High crowd surge detected in ${qs.departmentName} (${qs.activeTokensCount} patients).`,
        });
      }
      if (qs.avgWaitMinutes >= 25) {
        alerts.push({
          id: `alert-wait-${qs.departmentId}`,
          type: 'warning',
          text: `Average wait time in ${qs.departmentName} exceeds 25 minutes (~${qs.avgWaitMinutes}m).`,
        });
      }
    });

    // Idle counters check
    counters.forEach((c) => {
      if (c.status === 'open' && c.current_serving === 0) {
        const dept = departments.find((d) => d.id === c.department_id);
        alerts.push({
          id: `alert-idle-${c.id}`,
          type: 'info',
          text: `${c.name} (${dept?.name || 'Dept'}) is currently open with no active consult.`,
        });
      }
    });

    if (alerts.length === 0) {
      alerts.push({
        id: 'alert-nominal',
        type: 'info',
        text: 'All hospital departments running at optimal throughput levels.',
      });
    }

    return alerts;
  }, [queueSummaries, counters, departments]);

  // Analytics Dynamic Data based on Timeframe & Dept Filter
  const dynamicAnalyticsData = useMemo(() => {
    const mult = analyticsTimeframe === '24h' ? 0.4 : analyticsTimeframe === '30d' ? 3.8 : 1.0;

    const filteredDepts =
      analyticsDeptFilter === 'all'
        ? departments.slice(0, 8)
        : departments.filter((d) => d.id === analyticsDeptFilter);

    const barData = filteredDepts.map((d) => {
      const activeCount = tokens.filter(
        (t) => t.department_id === d.id && (t.status === 'waiting' || t.status === 'serving')
      ).length;
      return {
        id: d.id,
        name: d.name.replace(' (General)', ''),
        tokens: Math.round((activeCount || 4) * mult + (d.id.charCodeAt(5) % 5)),
        avgWait: Math.round((8 + (d.id.charCodeAt(6) % 12)) * (mult > 1 ? 1.2 : 1)),
        satisfaction: 4.6 + (d.id.charCodeAt(7) % 4) * 0.1,
      };
    });

    const trend =
      analyticsTimeframe === '24h'
        ? [
            { day: '08:00', wait: 8 },
            { day: '10:00', wait: 19 },
            { day: '12:00', wait: 24 },
            { day: '14:00', wait: 15 },
            { day: '16:00', wait: 12 },
            { day: '18:00', wait: 7 },
          ]
        : analyticsTimeframe === '30d'
        ? [
            { day: 'Week 1', wait: 14 },
            { day: 'Week 2', wait: 18 },
            { day: 'Week 3', wait: 12 },
            { day: 'Week 4', wait: 15 },
          ]
        : [
            { day: 'Mon', wait: 14 },
            { day: 'Tue', wait: 18 },
            { day: 'Wed', wait: 11 },
            { day: 'Thu', wait: 16 },
            { day: 'Fri', wait: 22 },
            { day: 'Sat', wait: 9 },
            { day: 'Sun', wait: 7 },
          ];

    return { barData, trend };
  }, [departments, tokens, analyticsTimeframe, analyticsDeptFilter]);

  // Handle Add Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    await addDepartment({
      name: newDeptName.trim(),
      description: newDeptDesc.trim() || 'Clinical Department',
      icon: newDeptIcon,
    });
    setNewDeptName('');
    setNewDeptDesc('');
  };

  // Handle Add Counter
  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterName.trim()) return;
    await addCounter({
      department_id: newCounterDeptId,
      name: newCounterName.trim(),
      staff_name: 'St. Alex Vance',
      doctor_name: 'Dr. Gregory House',
      avg_service_minutes: 5,
    });
    setNewCounterName('');
    setShowCounterModal(false);
  };

  // Handle Send Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    await sendBroadcastNotification(broadcastDept, broadcastMessage.trim());
    setBroadcastSentStatus('Broadcast notification dispatched to all waiting patients.');
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSentStatus(null), 4000);
  };

  const handlePrintQR = (counterName: string) => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F7FBF9] text-[#1E3A3A] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5AA7A7] to-[#BAC94A] border border-white/40 flex items-center justify-center font-black text-xl text-white shadow-md">
              <Leaf className="w-7 h-7 text-[#1E3A1E]" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[#5AA7A7] font-bold">
                <span>FlowIQ Central Command</span>
                <span>•</span>
                <span className="text-[#445508]">Real-time Live Sync</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E3A3A] tracking-tight">
                Hospital Administration & Analytics
              </h1>
              <p className="text-xs text-[#5A7A7A]">
                Multi-department queue operations, AI peak predictions, and counter management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="olive" className="py-2 px-3 text-xs font-bold">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{departments.length} Departments Active</span>
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#96D7C6]/40">
          {[
            { id: 'overview', label: 'Command Overview', icon: Activity },
            { id: 'spatial_3d', label: '3D Spatial Modeling & Pipelines', icon: Box },
            { id: 'crowd_monitoring', label: 'Live Crowd Grid', icon: Users },
            { id: 'ai_prediction', label: 'AI Peak Predictions & Modeling', icon: TrendingUp },
            { id: 'analytics', label: 'Analytics & Reports', icon: Layers },
            { id: 'qr_codes', label: 'Counter QR Directory', icon: Stethoscope },
            { id: 'departments', label: 'Departments & Desks', icon: Plus },
            { id: 'notifications', label: 'Broadcast Alerts', icon: Send },
            { id: 'database', label: 'Cloud Database & Tables', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#5AA7A7] text-white shadow-md'
                    : 'bg-white text-[#5A7A7A] hover:bg-[#EBF5F2] hover:text-[#1E3A3A] border border-[#96D7C6]/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════
            TAB: 3D SPATIAL MODELING & PIPELINES
        ══════════════════════════════════════════════ */}
        {activeTab === 'spatial_3d' && (
          <div className="space-y-6">
            {/* Top 4 3D Orbit Node Health Cards */}
            <SpatialNodesOrbit
              departments={departments}
              counters={counters}
              tokens={tokens}
              selectedDepartmentId={selectedDeptForPrediction}
              onSelectDepartment={(id) => setSelectedDeptForPrediction(id)}
            />

            {/* Main Spatial Grid: 3D WebGL Pipeline (Left) & Composite Diagnostics + Heatmap (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-6">
                <SpatialQueuePipeline3D
                  tokens={tokens}
                  selectedDepartment={selectedDeptObj}
                />

                {/* Live Stream Table */}
                <div className="p-6 rounded-3xl bg-[#0A1118] border border-[#00F0FF]/30 text-white shadow-2xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#00F0FF]/20 pb-2">
                    <span className="font-black text-[#00F0FF] uppercase tracking-wider">
                      &gt; TOPOLOGICAL STREAM ALLOCATION: {selectedDeptObj?.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      SYNC_REF: #Q-8492
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto">
                    {tokens
                      .filter((t) => t.status === 'waiting' || t.status === 'serving')
                      .slice(0, 5)
                      .map((t, idx) => (
                        <div key={t.id} className="py-2 flex items-center justify-between">
                          <span className="text-[#00F0FF] font-bold">
                            #{t.token_number} • {t.patient_name}
                          </span>
                          <span className="text-slate-400">
                            Dr. {t.doctor_name?.replace(/^Dr\.\s*/, '')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              t.priority === 'emergency'
                                ? 'bg-[#FF3366] text-white animate-pulse'
                                : 'bg-[#00FF88]/20 text-[#00FF88]'
                            }`}
                          >
                            {t.priority === 'emergency' ? 'CODE RED' : `POS #${idx + 1}`}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <SpatialDiagnosticsAndHeatmap
                  tokens={tokens}
                  counters={counters}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB A: COMMAND OVERVIEW
        ══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top 4 Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-[#5A7A7A] text-xs font-bold uppercase tracking-wider">
                  <span>Active Patients In Queue</span>
                  <Users className="w-4 h-4 text-[#5AA7A7]" />
                </div>
                <p className="text-3xl font-black font-mono text-[#1E3A3A]">{activePatients}</p>
                <span className="text-[11px] text-[#5AA7A7] font-bold">Across all 21 departments</span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-[#5A7A7A] text-xs font-bold uppercase tracking-wider">
                  <span>Avg Wait Across Hospital</span>
                  <Clock className="w-4 h-4 text-[#BAC94A]" />
                </div>
                <p className="text-3xl font-black font-mono text-[#1E3A3A]">
                  ~{activePatients > 0 ? Math.round(activePatients * 3.8) : 6} <span className="text-sm font-normal text-[#5A7A7A]">min</span>
                </p>
                <span className="text-[11px] text-[#445508] font-bold">Optimized AI Dispatch</span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-[#5A7A7A] text-xs font-bold uppercase tracking-wider">
                  <span>Hospital Crowd</span>
                  <Activity className="w-4 h-4 text-[#5AA7A7]" />
                </div>
                <p className="text-2xl font-black font-mono" style={{ color: overallCrowd.color }}>
                  {overallCrowd.label}
                </p>
                <span className="text-[11px] text-[#5A7A7A]">Dynamic Triage Safe</span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-[#5A7A7A] text-xs font-bold uppercase tracking-wider">
                  <span>Total Served Today</span>
                  <CheckCircle2 className="w-4 h-4 text-[#445508]" />
                </div>
                <p className="text-3xl font-black font-mono text-[#1E3A3A]">{totalServedToday}</p>
                <span className="text-[11px] text-[#445508] font-bold">↑ 18% Daily Capacity</span>
              </div>
            </div>

            {/* Department Status Grid & Alerts Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Department Status Grid (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-lg font-black text-[#1E3A3A]">Department Live Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {queueSummaries.slice(0, 8).map((dept) => (
                    <div
                      key={dept.departmentId}
                      className="p-5 rounded-3xl bg-white flex items-center justify-between border-2 shadow-sm"
                      style={{ borderColor: `${dept.crowdColor}60` }}
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-[#1E3A3A]">{dept.departmentName}</h4>
                        <p className="text-xs text-[#5A7A7A]">
                          {dept.activeTokensCount} in queue • ~{dept.avgWaitMinutes}m wait
                        </p>
                        <span className="text-[10px] text-[#5AA7A7] block font-mono font-bold">
                          {dept.openCountersCount} Open Counters
                        </span>
                      </div>
                      <CrowdGauge count={dept.activeTokensCount} size="sm" showLabel={false} />
                    </div>
                  ))}
                </div>
              </div>

              {/* System Alerts Panel (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-lg font-black text-[#1E3A3A]">Automated Triage Alerts</h3>
                <div className="p-4 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-3">
                  {systemAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                        alert.type === 'danger'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : alert.type === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-[#EBF5F2] border-[#96D7C6] text-[#1E3A3A]'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#5AA7A7]" />
                      <p className="leading-relaxed font-medium">{alert.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB B: AI CROWD MONITORING (ALL DEPTS)
        ══════════════════════════════════════════════ */}
        {activeTab === 'crowd_monitoring' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#1E3A3A]">
                  Real-Time Crowd Density Across All 21 Departments
                </h3>
                <p className="text-xs text-[#5A7A7A]">
                  Formula: 0-10 Safe (Green) | 11-20 Moderate (Yellow) | 21-35 High (Orange) | 35+ Critical (Red)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {queueSummaries.map((dept) => (
                <div
                  key={dept.departmentId}
                  className="p-5 rounded-3xl bg-white shadow-md flex flex-col justify-between items-center text-center space-y-4 border-2 hover:shadow-lg transition-all"
                  style={{ borderColor: `${dept.crowdColor}70` }}
                >
                  <div>
                    <h4 className="text-base font-bold text-[#1E3A3A]">{dept.departmentName}</h4>
                    <span className="text-xs text-[#5A7A7A]">
                      {dept.activeTokensCount} active tokens
                    </span>
                  </div>

                  <CrowdGauge count={dept.activeTokensCount} size="md" showLabel={true} />

                  <div className="w-full pt-3 border-t border-slate-100 text-xs text-[#5A7A7A] font-mono flex justify-between font-bold">
                    <span>Serving: #{dept.servingTokenNumber || '---'}</span>
                    <span>~{dept.avgWaitMinutes}m wait</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB C: AI CROWD PREDICTION & PEAK HOURS
        ══════════════════════════════════════════════ */}
        {activeTab === 'ai_prediction' && (
          <div className="space-y-6">
            {/* Top Selector Bar: Department & Prediction Day */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[#1E3A3A]">
                    AI Influx & Staffing Model: {selectedDeptObj?.name}
                  </h3>
                  <p className="text-xs text-[#5A7A7A]">
                    Selecting a department recalculates the graph and synchronously updates the data table, staffing requirements, and peak surge alerts below.
                  </p>
                </div>

                {/* Day Preset Tabs */}
                <div className="flex items-center gap-2 bg-[#F7FBF9] p-1.5 rounded-2xl border border-[#96D7C6]/50">
                  <Calendar className="w-4 h-4 text-[#5AA7A7] ml-2" />
                  {(['today', 'tomorrow', 'weekend'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setPredictionDay(d)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        predictionDay === d
                          ? 'bg-[#5AA7A7] text-white shadow-xs'
                          : 'text-[#5A7A7A] hover:text-[#1E3A3A]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Buttons Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDeptForPrediction(dept.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedDeptForPrediction === dept.id
                        ? 'bg-[#5AA7A7] text-white shadow-sm ring-2 ring-[#BAC94A]'
                        : 'bg-[#F7FBF9] text-[#5A7A7A] border border-[#96D7C6]/60 hover:text-[#1E3A3A]'
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Prediction Line Chart */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-base font-black text-[#1E3A3A]">
                    {selectedDeptObj?.name} • 24-Hour Patient Curve ({predictionDay.toUpperCase()})
                  </h4>
                  <p className="text-xs text-[#5A7A7A]">
                    Lead Doctor: <strong className="text-[#5AA7A7]">{selectedDeptLeadDoctor}</strong> • Assigned Staff: <strong className="text-[#445508]">{selectedDeptLeadStaff}</strong>
                  </p>
                </div>
                <Badge variant="olive">AI Real-Time Reactive Model</Badge>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={peakAnalysis.hourlyPredictions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,167,167,0.15)" />
                    <XAxis dataKey="hourLabel" stroke="#5A7A7A" fontSize={11} />
                    <YAxis
                      stroke="#5A7A7A"
                      fontSize={11}
                      label={{ value: 'Patients', angle: -90, position: 'insideLeft', fill: '#5A7A7A' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#96D7C6',
                        borderRadius: '12px',
                        color: '#1E3A3A',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted_crowd"
                      name="Forecast Patients"
                      stroke="#5AA7A7"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#BAC94A' }}
                      activeDot={{ r: 7, fill: '#BAC94A' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DYNAMIC DATA BELOW GRAPH: Synchronously Changes With Graph Selection */}
            <div className="space-y-6">
              {/* Dynamic Hourly Breakdown Table */}
              <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-[#1E3A3A]">
                      Hourly Triage & Staffing Forecast: {selectedDeptObj?.name}
                    </h4>
                    <p className="text-xs text-[#5A7A7A]">
                      Detailed clinical allocation corresponding to the graph data above.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#5AA7A7] bg-[#EBF5F2] px-3 py-1 rounded-xl">
                    Target Pace: ~4.5 min/patient
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#96D7C6]/40 text-[#5A7A7A] uppercase font-bold text-[10px] tracking-wider bg-[#F7FBF9]">
                        <th className="p-3">Time Window</th>
                        <th className="p-3">Forecast Influx</th>
                        <th className="p-3">Crowd Status</th>
                        <th className="p-3">Consulting Doctor</th>
                        <th className="p-3">Required Staff</th>
                        <th className="p-3">Action Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {peakAnalysis.hourlyPredictions.map((hp) => {
                        const crowdLevel =
                          hp.predicted_crowd >= 20
                            ? 'High Surge'
                            : hp.predicted_crowd >= 12
                            ? 'Moderate'
                            : 'Normal Flow';
                        const badgeVariant =
                          hp.predicted_crowd >= 20
                            ? 'danger'
                            : hp.predicted_crowd >= 12
                            ? 'yellow'
                            : 'olive';
                        const reqStaff =
                          hp.predicted_crowd >= 20
                            ? '3 Nurses + 2 Doctors'
                            : hp.predicted_crowd >= 12
                            ? '2 Nurses + 1 Doctor'
                            : '1 Nurse + 1 Doctor';

                        return (
                          <tr key={hp.hourLabel} className="hover:bg-[#F7FBF9] transition-colors">
                            <td className="p-3 font-mono font-bold text-[#1E3A3A]">{hp.hourLabel}</td>
                            <td className="p-3 font-mono font-bold text-[#5AA7A7]">
                              {hp.predicted_crowd} patients
                            </td>
                            <td className="p-3">
                              <Badge variant={badgeVariant} className="text-[10px]">
                                {crowdLevel}
                              </Badge>
                            </td>
                            <td className="p-3 font-semibold text-[#1E3A3A]">
                              {selectedDeptLeadDoctor}
                            </td>
                            <td className="p-3 text-[#445508] font-medium">{reqStaff}</td>
                            <td className="p-3 text-[#5A7A7A]">
                              {hp.predicted_crowd >= 20
                                ? 'Deploy express triage desk'
                                : hp.predicted_crowd >= 12
                                ? 'Maintain active queue calls'
                                : 'Standard counter throughput'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Peak Hours & Recommendations Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Peak Hours Highlighted */}
                <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
                  <h4 className="text-sm font-bold text-[#1E3A3A] uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#BAC94A]" />
                    Top 3 Surge Windows for {selectedDeptObj?.name}
                  </h4>
                  <div className="space-y-3">
                    {peakAnalysis.peakHours.map((ph, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#E2D36B]/20 border border-[#E2D36B]/60 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-[#1E3A3A]">
                          #{idx + 1} Peak Time: <strong>{ph.hourLabel}</strong>
                        </span>
                        <Badge variant="yellow">{ph.crowd} Estimated Patients</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
                  <h4 className="text-sm font-bold text-[#1E3A3A] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5AA7A7]" />
                    Tailored AI Action Directives
                  </h4>
                  <div className="space-y-3">
                    {peakAnalysis.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/50 text-xs text-[#1E3A3A] flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#445508] shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB D: ANALYTICS & OPERATIONAL REPORTS
        ══════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#1E3A3A]">Hospital Analytics Dashboard</h3>
                <p className="text-xs text-[#5A7A7A]">
                  Filter data and view interactive graphs and changing table metrics below.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#F7FBF9] p-1.5 rounded-2xl border border-[#96D7C6]/50">
                  <Filter className="w-3.5 h-3.5 text-[#5AA7A7] ml-2" />
                  {(['24h', '7d', '30d'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setAnalyticsTimeframe(tf)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        analyticsTimeframe === tf
                          ? 'bg-[#5AA7A7] text-white shadow-xs'
                          : 'text-[#5A7A7A] hover:text-[#1E3A3A]'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <select
                  value={analyticsDeptFilter}
                  onChange={(e) => setAnalyticsDeptFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-[#F7FBF9] border border-[#96D7C6]/60 text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
                <h4 className="text-sm font-bold text-[#1E3A3A] uppercase tracking-wider">
                  Patient Volume by Department ({analyticsTimeframe.toUpperCase()})
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dynamicAnalyticsData.barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,167,167,0.15)" />
                      <XAxis dataKey="name" stroke="#5A7A7A" fontSize={10} />
                      <YAxis stroke="#5A7A7A" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#96D7C6',
                          borderRadius: '12px',
                          color: '#1E3A3A',
                        }}
                      />
                      <Bar dataKey="tokens" fill="#5AA7A7" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line Chart */}
              <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
                <h4 className="text-sm font-bold text-[#1E3A3A] uppercase tracking-wider">
                  Average Wait Time Curve ({analyticsTimeframe.toUpperCase()})
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dynamicAnalyticsData.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,167,167,0.15)" />
                      <XAxis dataKey="day" stroke="#5A7A7A" fontSize={11} />
                      <YAxis stroke="#5A7A7A" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#96D7C6',
                          borderRadius: '12px',
                          color: '#1E3A3A',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="wait"
                        name="Wait (min)"
                        stroke="#BAC94A"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Dynamic Data Table Synchronized with Graph */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <h4 className="text-base font-black text-[#1E3A3A]">
                Department Throughput & Satisfaction Metrics ({analyticsTimeframe.toUpperCase()})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#96D7C6]/40 text-[#5A7A7A] uppercase font-bold text-[10px] tracking-wider bg-[#F7FBF9]">
                      <th className="p-3">Department</th>
                      <th className="p-3">Consulting Lead</th>
                      <th className="p-3">Patients Handled</th>
                      <th className="p-3">Avg Wait Time</th>
                      <th className="p-3">Satisfaction Rating</th>
                      <th className="p-3">Triage Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dynamicAnalyticsData.barData.map((row) => {
                      const counter = counters.find((c) => c.department_id === row.id);
                      const drName = counter?.doctor_name || 'Dr. Robert Sterling';
                      return (
                        <tr key={row.name} className="hover:bg-[#F7FBF9] transition-colors">
                          <td className="p-3 font-bold text-[#1E3A3A]">{row.name}</td>
                          <td className="p-3 font-semibold text-[#5AA7A7]">{drName}</td>
                          <td className="p-3 font-mono font-bold text-[#1E3A3A]">{row.tokens}</td>
                          <td className="p-3 font-mono text-[#445508] font-bold">~{row.avgWait} min</td>
                          <td className="p-3 text-amber-500 font-bold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{row.satisfaction.toFixed(1)} / 5.0</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="olive" className="text-[10px]">
                              98.4% Optimal
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Patient Feedback Summary */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#1E3A3A] uppercase tracking-wider">
                  Patient Reviews & Satisfaction Feedback ({feedbackList.length})
                </h4>
                <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>4.8 / 5.0 Hospital Rating</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {feedbackList.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < fb.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#5A7A7A]">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#1E3A3A] italic">
                      "{fb.comment || 'Smooth queue flow and timely notification.'}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB E: COUNTER QR DIRECTORY
        ══════════════════════════════════════════════ */}
        {activeTab === 'qr_codes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#1E3A3A]">
                  Counter QR Code Directory
                </h3>
                <p className="text-xs text-[#5A7A7A]">
                  Each QR code directly points to <code className="bg-[#EBF5F2] px-2 py-0.5 rounded text-[#1E3A3A]">/join?counter=[ID]</code> for instant mobile triage.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCounterModal(true)}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Counter Desk</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {counters.map((counter) => {
                const dept = departments.find((d) => d.id === counter.department_id);
                const joinUrl = `${window.location.origin}/join?counter=${counter.id}`;

                return (
                  <div key={counter.id} className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-md flex flex-col justify-between items-center text-center space-y-5">
                    <div>
                      <Badge variant="teal" className="mb-2">
                        {dept?.name || 'Hospital Clinic'}
                      </Badge>
                      <h4 className="text-base font-bold text-[#1E3A3A]">{counter.name}</h4>
                      <p className="text-xs text-[#5A7A7A] mt-1">
                        Doctor: <strong className="text-[#5AA7A7]">{counter.doctor_name || 'Dr. Robert Sterling'}</strong>
                      </p>
                      <p className="text-xs text-[#5A7A7A]">
                        Staff: <strong className="text-[#445508]">{counter.staff_name || 'St. Sarah Watson'}</strong>
                      </p>
                    </div>

                    {/* QR Code */}
                    <div className="p-4 rounded-2xl bg-white border border-[#96D7C6]/40 shadow-sm">
                      <QRCodeSVG
                        value={joinUrl}
                        size={160}
                        bgColor="#ffffff"
                        fgColor="#1E3A3A"
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <div className="text-[11px] text-[#5A7A7A] font-mono break-all max-w-xs">
                      {joinUrl}
                    </div>

                    <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePrintQR(counter.name)}
                        className="gap-1.5 text-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print QR
                      </Button>

                      <a
                        href={joinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EBF5F2] text-[#1E3A3A] border border-[#96D7C6]/60 hover:bg-[#96D7C6]/30 transition-colors"
                      >
                        Test URL
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB F: DEPARTMENTS & DESK CONFIG
        ══════════════════════════════════════════════ */}
        {activeTab === 'departments' && (
          <div className="space-y-8">
            {/* Add Custom Department Form */}
            <div className="p-6 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-[#1E3A3A] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#5AA7A7]" />
                Add New Clinical Department
              </h3>
              <form onSubmit={handleCreateDepartment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A7A7A] block mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oncology Day Care"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A7A7A] block mb-1">
                    Clinical Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chemotherapy and infusion therapy"
                    value={newDeptDesc}
                    onChange={(e) => setNewDeptDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A7A7A] block mb-1">
                    Icon Theme
                  </label>
                  <select
                    value={newDeptIcon}
                    onChange={(e) => setNewDeptIcon(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                  >
                    <option value="Stethoscope">Stethoscope (General)</option>
                    <option value="HeartPulse">Heart Pulse (Cardio)</option>
                    <option value="Pill">Pill (Pharmacy)</option>
                    <option value="FlaskConical">Flask (Laboratory)</option>
                    <option value="Scan">Scan (Radiology)</option>
                    <option value="AlertCircle">Alert (Emergency)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="primary" className="w-full font-bold cursor-pointer">
                    Create Department
                  </Button>
                </div>
              </form>
            </div>

            {/* Department List with Toggles */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#1E3A3A]">Active Hospital Departments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div key={dept.id} className="p-4 rounded-2xl bg-white border border-[#96D7C6]/60 shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#1E3A3A]">{dept.name}</h4>
                      <p className="text-xs text-[#5A7A7A] line-clamp-1">{dept.description}</p>
                    </div>
                    <button
                      onClick={() => toggleDepartmentActive(dept.id, !dept.is_active)}
                      className="text-[#5A7A7A] hover:text-[#1E3A3A] cursor-pointer"
                    >
                      {dept.is_active ? (
                        <ToggleRight className="w-7 h-7 text-[#BAC94A]" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB G: BROADCAST NOTIFICATIONS
        ══════════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div className="space-y-8 max-w-3xl mx-auto">
            {broadcastSentStatus && (
              <div className="p-4 rounded-2xl bg-[#BAC94A]/25 border border-[#BAC94A] text-[#2C3B05] text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-[#445508]" />
                <span>{broadcastSentStatus}</span>
              </div>
            )}

            <div className="p-8 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-6">
              <div>
                <h3 className="text-xl font-black text-[#1E3A3A]">Broadcast Emergency or Clinical Alert</h3>
                <p className="text-xs text-[#5A7A7A]">
                  Sends real-time in-app notifications and chime sounds to all waiting patient devices in the selected department.
                </p>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5A7A7A]">Target Department:</label>
                  <select
                    value={broadcastDept}
                    onChange={(e) => setBroadcastDept(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A] focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                  >
                    <option value="all">All Hospital Departments (Full Broadcast)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5A7A7A]">Alert Message:</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g. Pharmacy Counter 2 has opened for express insulin and antibiotics pickup..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA7A7]"
                  />
                </div>

                <Button type="submit" variant="primary" size="md" className="w-full font-bold gap-2 cursor-pointer">
                  <Send className="w-4 h-4" />
                  <span>Send Broadcast Notification</span>
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 9: SUPABASE CLOUD DATABASE & TABLES
        ══════════════════════════════════════════════ */}
        {activeTab === 'database' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Cloud Connection Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5AA7A7] to-[#BAC94A] flex items-center justify-center text-white shadow-md">
                    <Database className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-[#1E3A3A]">
                        Supabase PostgreSQL Database
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Cloud Connected
                      </span>
                    </div>
                    <p className="text-xs text-[#5A7A7A] mt-0.5">
                      Project ID: <strong className="font-mono text-[#1E3A3A]">bwpkgcujoqtlcxcntzch</strong> • Name: <strong className="text-[#1E3A3A]">FlowIQ</strong> • Endpoint: <span className="font-mono text-[#5AA7A7]">https://bwpkgcujoqtlcxcntzch.supabase.co</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="https://supabase.com/dashboard/project/bwpkgcujoqtlcxcntzch/editor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#5AA7A7] text-white text-xs font-bold hover:bg-[#488E8E] transition-all shadow-md cursor-pointer"
                  >
                    <Table className="w-4 h-4" />
                    <span>Open Supabase Table Editor ↗</span>
                  </a>
                  <a
                    href="https://supabase.com/dashboard/project/bwpkgcujoqtlcxcntzch/sql"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#BAC94A] text-[#1E3A1E] text-xs font-bold hover:bg-[#a9b83b] transition-all shadow-md cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open SQL Editor ↗</span>
                  </a>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/60 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5AA7A7] font-bold">
                    Database Engine
                  </span>
                  <p className="text-sm font-extrabold text-[#1E3A3A]">PostgreSQL 15 (Supabase)</p>
                  <span className="text-[10px] text-emerald-700 font-bold">✓ Real-time CDC Enabled</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/60 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5AA7A7] font-bold">
                    Active Queued Tokens
                  </span>
                  <p className="text-sm font-extrabold text-[#1E3A3A] font-mono">{tokens.length} In-Memory & Cloud</p>
                  <span className="text-[10px] text-[#5A7A7A]">Synced on ticket generation</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/60 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5AA7A7] font-bold">
                    Registered Counters
                  </span>
                  <p className="text-sm font-extrabold text-[#1E3A3A] font-mono">{counters.length} Active Desks</p>
                  <span className="text-[10px] text-[#5A7A7A]">Dynamic doctor assignments</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/60 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5AA7A7] font-bold">
                    Security & RLS
                  </span>
                  <p className="text-sm font-extrabold text-[#1E3A3A]">Row Level Security (RLS)</p>
                  <span className="text-[10px] text-emerald-700 font-bold">✓ Enabled for all 7 tables</span>
                </div>
              </div>
            </div>

            {/* Tables Directory */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#96D7C6]/60 shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#1E3A3A] flex items-center gap-2">
                    <Table className="w-5 h-5 text-[#5AA7A7]" />
                    <span>Hospital Database Tables Architecture</span>
                  </h3>
                  <p className="text-xs text-[#5A7A7A]">
                    Click any table below to view and edit its live records in your Supabase project dashboard.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    table: 'public.tokens',
                    name: 'tokens',
                    count: tokens.length,
                    desc: 'Stores patient tokens, status (waiting/serving/served), department, counter, and doctor details.',
                    badge: 'Core Queue Engine',
                  },
                  {
                    table: 'public.profiles',
                    name: 'profiles',
                    count: 'Dynamic',
                    desc: 'User identity, role-based access controls (patient, staff, admin), phone, and contact details.',
                    badge: 'Authentication & RBAC',
                  },
                  {
                    table: 'public.departments',
                    name: 'departments',
                    count: departments.length,
                    desc: 'Hospital wings and medical clinics (OPD, Pediatrics, Cardiology, Emergency, Radiology, etc.).',
                    badge: 'Hospital Directory',
                  },
                  {
                    table: 'public.counters',
                    name: 'counters',
                    count: counters.length,
                    desc: 'Physical consulting desks, attending physicians, active staff, and counter open/paused states.',
                    badge: 'Staff Desks',
                  },
                  {
                    table: 'public.feedback',
                    name: 'feedback',
                    count: feedbackList.length,
                    desc: 'Patient star ratings, clinical satisfaction reviews, and wait-time feedback.',
                    badge: 'Patient Feedback',
                  },
                  {
                    table: 'public.notifications',
                    name: 'notifications',
                    count: 'Active',
                    desc: 'Queue chimes, turns alert notifications, sound chimes, and administrative emergency broadcasts.',
                    badge: 'Alert System',
                  },
                  {
                    table: 'public.analytics',
                    name: 'analytics',
                    count: analyticsRecords.length,
                    desc: 'Hourly traffic history used by the AI engine for predictive peak crowd forecasting.',
                    badge: 'AI Intelligence',
                  },
                ].map((t) => (
                  <div
                    key={t.table}
                    className="p-5 rounded-2xl bg-[#F7FBF9] border border-[#96D7C6]/60 hover:border-[#5AA7A7] hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-[#5AA7A7] px-2.5 py-1 rounded-lg bg-white border border-[#96D7C6]/40 shadow-xs">
                          {t.table}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BAC94A]/25 text-[#374507]">
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#5A7A7A] leading-relaxed">{t.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-[#1E3A3A] font-bold">
                        Status: <span className="text-emerald-700">✓ Connected</span>
                      </span>
                      <a
                        href="https://supabase.com/dashboard/project/bwpkgcujoqtlcxcntzch/editor"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#5AA7A7] hover:underline flex items-center gap-1"
                      >
                        <span>View Records</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Counter Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white border-2 border-[#5AA7A7] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1E3A3A]">Create New Counter Desk</h3>
            <form onSubmit={handleCreateCounter} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#5A7A7A]">Department:</label>
                <select
                  value={newCounterDeptId}
                  onChange={(e) => setNewCounterDeptId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#5A7A7A]">Counter Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Desk 3 (Pediatric Triage)"
                  value={newCounterName}
                  onChange={(e) => setNewCounterName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#96D7C6]/60 bg-[#F7FBF9] text-xs text-[#1E3A3A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCounterModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Counter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
