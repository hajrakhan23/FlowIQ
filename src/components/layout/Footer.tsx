import React from 'react';
import { Activity, Shield, Cpu, Clock, HeartHandshake, Leaf } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const location = useLocation();
  if (location.pathname === '/display') return null;

  return (
    <footer className="w-full bg-[#152E2E] border-t border-[#96D7C6]/20 pt-12 pb-8 text-white mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E2D36B] to-[#BAC94A] p-0.5 border border-white/30 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#1E3A1E]" />
              </div>
              <span className="text-xl font-black font-mono">
                Flow<span className="text-[#96D7C6]">IQ</span>
              </span>
            </div>
            <p className="text-xs text-[#96D7C6]/80 leading-relaxed">
              Nature-inspired Intelligent Hospital Queue & Crowd Management. Streamlining patient journey and eliminating waiting room bottlenecks.
            </p>
          </div>

          {/* Quick Pillars */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Capabilities</h4>
            <ul className="space-y-2 text-xs text-[#96D7C6]/80">
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#BAC94A]" />
                Predictive AI Wait Modeling
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#E2D36B]" />
                Real-Time Digital Tokens & QR
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#5AA7A7]" />
                Crowd Surge Detection & Triage
              </li>
              <li className="flex items-center gap-2">
                <HeartHandshake className="w-3.5 h-3.5 text-[#6C8CBF]" />
                Automated Notifications & Alerts
              </li>
            </ul>
          </div>

          {/* Hospital Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Compliance</h4>
            <div className="space-y-2 text-xs text-[#96D7C6]/80">
              <p>• HIPAA & FHIR Standards Ready</p>
              <p>• Zero Waiting Room Congestion Protocol</p>
              <p>• Multi-Role Isolated Portal Architecture</p>
              <p>• Real-time Audio Broadcast Engine</p>
            </div>
          </div>

          {/* Contact / Hospital System */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Hospital System</h4>
            <p className="text-xs text-[#96D7C6]/80">
              Connected across Regional Medical Centers, Outpatient Clinics, and Diagnostic Facilities.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#BAC94A]/20 text-[#D6EB9C] border border-[#BAC94A]/40">
                <span className="w-2 h-2 rounded-full bg-[#BAC94A] animate-pulse" />
                All Clinical Units Active
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#96D7C6]/15 flex flex-col sm:flex-row items-center justify-between text-xs text-[#96D7C6]/60 gap-4">
          <p>© {new Date().getFullYear()} FlowIQ. Intelligent Healthcare Crowd Orchestration.</p>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Leaf className="w-3.5 h-3.5 text-[#BAC94A]" />
            <span>Theme: Nature Spectrum (Teal, Mint, Olive, Gold, Slate)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
