
import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  subtitle?: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient, glowColor, subtitle, trend }) => {
  return (
    <motion.div 
      whileHover={{ y: -3, scale: 1.01 }}
      className="relative bg-white rounded-2xl p-8 border border-slate-200 flex flex-col justify-between overflow-hidden group h-full shadow-sm hover:shadow-md transition-all"
    >
      <div className={`absolute -right-6 -top-6 w-36 h-36 rounded-full opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-10 bg-gradient-to-br ${gradient}`} />
      
      <div className="flex items-start justify-between relative z-10 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
          {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: 2.5 })}
        </div>
        {trend && (
          <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-black text-black uppercase tracking-wider">{trend}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-4xl font-black text-black tracking-tight leading-none mb-3">
          {value}
        </h3>
        <div className="mt-2">
          <p className="text-[12px] font-black text-black uppercase tracking-[0.1em] leading-tight mb-1.5">{label}</p>
          {subtitle && <p className="text-[11px] text-black font-bold tracking-tight opacity-40">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
