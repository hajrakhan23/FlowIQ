import { CrowdLevel, CrowdPrediction, Counter, Token, AnalyticsRecord } from '../types';
import { DEFAULT_CROWD_PATTERN } from '../data/defaultPatterns';

export interface WaitTimeResult {
  estimatedWaitMinutes: number;
  confidence: 'HIGH' | 'MODERATE' | 'ESTIMATED';
  explanation: string;
}

export interface CrowdLevelResult {
  level: CrowdLevel;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
  label: string;
}

export interface PeakHoursAnalysis {
  hourlyPredictions: CrowdPrediction[];
  peakHours: { hour: number; hourLabel: string; crowd: number }[];
  lowHours: { hour: number; hourLabel: string; crowd: number }[];
  recommendations: string[];
}

export const aiEngine = {
  /**
   * 1. calculateWaitTime(counterId):
   * - Count waiting tokens for counter
   * - Get avg_service_minutes from counter
   * - Return waiting_count * avg_service_minutes
   * - Confidence: HIGH if >20 records, MODERATE if 5-20, ESTIMATED if <5
   */
  calculateWaitTime(
    waitingCount: number,
    avgServiceMinutes: number = 5,
    historicalRecordsCount: number = 10
  ): WaitTimeResult {
    const validAvg = Math.max(1, avgServiceMinutes || 5);
    const estimatedWaitMinutes = Math.max(1, waitingCount * validAvg);

    let confidence: 'HIGH' | 'MODERATE' | 'ESTIMATED' = 'ESTIMATED';
    if (historicalRecordsCount > 20) {
      confidence = 'HIGH';
    } else if (historicalRecordsCount >= 5) {
      confidence = 'MODERATE';
    }

    return {
      estimatedWaitMinutes,
      confidence,
      explanation: `Calculated from ${waitingCount} ahead × ~${validAvg} mins avg per consult`,
    };
  },

  /**
   * 2. calculateCrowdLevel(activeTokenCount):
   * - 0-10: SAFE + green (#22c55e)
   * - 11-20: MODERATE + yellow (#eab308)
   * - 21-35: HIGH + orange (#f97316)
   * - 35+: CRITICAL + red (#ef4444)
   */
  calculateCrowdLevel(activeTokenCount: number): CrowdLevelResult {
    const count = Math.max(0, activeTokenCount);

    if (count <= 10) {
      return {
        level: 'SAFE',
        label: 'Low / Safe',
        color: '#22c55e',
        badgeBg: 'rgba(34, 197, 94, 0.15)',
        badgeBorder: 'rgba(34, 197, 94, 0.35)',
        description: 'Smooth patient flow with minimal delay.',
      };
    } else if (count <= 20) {
      return {
        level: 'MODERATE',
        label: 'Moderate',
        color: '#eab308',
        badgeBg: 'rgba(234, 179, 8, 0.15)',
        badgeBorder: 'rgba(234, 179, 8, 0.35)',
        description: 'Moderate waiting time. Steady counter movement.',
      };
    } else if (count <= 35) {
      return {
        level: 'HIGH',
        label: 'High Density',
        color: '#f97316',
        badgeBg: 'rgba(249, 115, 22, 0.15)',
        badgeBorder: 'rgba(249, 115, 22, 0.35)',
        description: 'High volume. Consider extra counter staffing.',
      };
    } else {
      return {
        level: 'CRITICAL',
        label: 'Critical Surge',
        color: '#ef4444',
        badgeBg: 'rgba(239, 68, 68, 0.18)',
        badgeBorder: 'rgba(239, 68, 68, 0.45)',
        description: 'Urgent crowd surge detected. Immediate triage needed.',
      };
    }
  },

  /**
   * 3. predictPeakHours(departmentId):
   * - Query analytics / group by hour (6AM-8PM)
   * - If no data use default pattern array
   * - Identify top 3 peak and bottom 3 low hours
   */
  predictPeakHours(
    departmentId: string,
    analyticsRecords: AnalyticsRecord[] = []
  ): PeakHoursAnalysis {
    const deptRecords = analyticsRecords.filter((r) => r.department_id === departmentId);

    const hourlyMap = new Map<number, { sum: number; count: number }>();
    deptRecords.forEach((r) => {
      const existing = hourlyMap.get(r.hour_of_day) || { sum: 0, count: 0 };
      existing.sum += r.total_tokens;
      existing.count += 1;
      hourlyMap.set(r.hour_of_day, existing);
    });

    const hourlyPredictions: CrowdPrediction[] = [];

    // Working clinic hours: 6 AM (6) to 8 PM (20)
    for (let h = 6; h <= 20; h++) {
      const defaultMultiplier = DEFAULT_CROWD_PATTERN[h] || 1;
      let predictedTokens: number;

      if (hourlyMap.has(h) && (hourlyMap.get(h)?.count || 0) > 0) {
        const item = hourlyMap.get(h)!;
        predictedTokens = Math.round(item.sum / item.count);
      } else {
        // Synthesize with base department load × pattern multiplier
        predictedTokens = Math.round(defaultMultiplier * 2.8);
      }

      const level = this.calculateCrowdLevel(predictedTokens).level;
      const formattedHour = h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;

      hourlyPredictions.push({
        hour: h,
        hourLabel: formattedHour,
        predicted_crowd: predictedTokens,
        multiplier: defaultMultiplier,
        level,
      });
    }

    // Sort to find top 3 peak and bottom 3 low
    const sorted = [...hourlyPredictions].sort((a, b) => b.predicted_crowd - a.predicted_crowd);
    const peakHours = sorted.slice(0, 3).map((p) => ({
      hour: p.hour,
      hourLabel: p.hourLabel,
      crowd: p.predicted_crowd,
    }));

    const sortedAsc = [...hourlyPredictions].sort((a, b) => a.predicted_crowd - b.predicted_crowd);
    const lowHours = sortedAsc.slice(0, 3).map((p) => ({
      hour: p.hour,
      hourLabel: p.hourLabel,
      crowd: p.predicted_crowd,
    }));

    const recommendations: string[] = [];
    if (peakHours.length > 0) {
      recommendations.push(`Open extra counter at ${peakHours[0].hourLabel} to prevent triage bottleneck`);
      recommendations.push(`Secondary peak anticipated around ${peakHours[1]?.hourLabel || '11 AM'}`);
    }
    if (lowHours.length > 0) {
      recommendations.push(`Low crowd expected after ${lowHours[0].hourLabel} - ideal for staff rotations`);
      recommendations.push(`Fast-track consultations recommended between ${lowHours[1]?.hourLabel || '3 PM'} - ${lowHours[0]?.hourLabel || '5 PM'}`);
    }

    return {
      hourlyPredictions,
      peakHours,
      lowHours,
      recommendations,
    };
  },

  /**
   * 4. suggestBestCounter(departmentId):
   * - Get all open counters for department
   * - Count waiting tokens each counter
   * - Return counter with minimum waiting
   */
  suggestBestCounter(
    departmentId: string,
    counters: Counter[],
    tokens: Token[]
  ): { bestCounter: Counter | null; message: string } {
    const deptCounters = counters.filter(
      (c) => c.department_id === departmentId && c.status === 'open'
    );

    if (deptCounters.length === 0) {
      // Look for any counter in that department
      const anyCounter = counters.find((c) => c.department_id === departmentId);
      return {
        bestCounter: anyCounter || null,
        message: anyCounter
          ? `${anyCounter.name} is currently preparing`
          : 'No counter online for this department',
      };
    }

    // Count waiting tokens per counter
    let minWait = Infinity;
    let selected: Counter = deptCounters[0];

    deptCounters.forEach((counter) => {
      const waiting = tokens.filter(
        (t) => t.counter_id === counter.id && t.status === 'waiting'
      ).length;
      if (waiting < minWait) {
        minWait = waiting;
        selected = counter;
      }
    });

    return {
      bestCounter: selected,
      message: `${selected.name} recommended - shortest wait available (${minWait} in line)`,
    };
  },

  /**
   * 5. Recalculate rolling average service minutes for a counter
   */
  calculateRollingAvg(
    previousAvg: number,
    newDurationMinutes: number,
    totalServed: number = 1
  ): number {
    if (totalServed <= 1) return Math.max(2, Math.round(newDurationMinutes));
    const weight = 0.3; // 30% new duration, 70% historical
    const calculated = previousAvg * (1 - weight) + newDurationMinutes * weight;
    return Math.max(1, Math.round(calculated * 10) / 10);
  },
};
