import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle, actions }) => {
  const { admin, isSuperAdmin } = useAuth();

  return (
    <header className="h-16 px-8 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shadow-soft">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* System indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>PostgreSQL Active</span>
        </div>

        {/* Current admin badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-800">
          <ShieldCheck className={`w-3.5 h-3.5 ${isSuperAdmin ? 'text-brand-600' : 'text-indigo-600'}`} />
          <span>{admin?.email}</span>
        </div>

        {/* Action buttons if passed */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};
