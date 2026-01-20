
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
      whileHover={{ y: -1, scale: 1.002 }}
      className="relative bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between overflow-hidden group h-full shadow-sm hover:shadow-md transition-all"
    >
      <div className={`absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-0 blur-xl transition-all duration-500 group-hover:opacity-5 bg-gradient-to-br ${gradient}`} />
      
      <div className="flex items-start justify-between relative z-10 mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow transition-transform duration-300 group-hover:scale-105">
          {React.cloneElement(icon as React.ReactElement, { size: 14, strokeWidth: 2 })}
        </div>
        {trend && (
          <div className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <span className="text-[7px] font-black text-black uppercase tracking-wider">{trend}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-2xl font-black text-black tracking-tight leading-none mb-1">
          {value}
        </h3>
        <div className="mt-0.5">
          <p className="text-[9px] font-black text-black uppercase tracking-[0.05em] leading-tight mb-0.5">{label}</p>
          {subtitle && <p className="text-[8px] text-black font-bold tracking-tight opacity-40">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
