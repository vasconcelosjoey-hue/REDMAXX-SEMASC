
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
      className="relative bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between overflow-hidden group h-full shadow-sm hover:shadow-md transition-all"
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-10 bg-gradient-to-br ${gradient}`} />
      
      <div className="flex items-start justify-between relative z-10 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
          {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2 })}
        </div>
        {trend && (
          <div className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[8px] font-black text-black uppercase tracking-wider">{trend}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-3xl font-black text-black tracking-tight leading-none mb-1.5">
          {value}
        </h3>
        <div className="mt-1">
          <p className="text-[10px] font-black text-black uppercase tracking-[0.1em] leading-tight mb-0.5">{label}</p>
          {subtitle && <p className="text-[9px] text-black font-bold tracking-tight opacity-50">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
