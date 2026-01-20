
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
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.2 }}
      className="relative bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 flex flex-col justify-between overflow-hidden group h-full shadow-sm hover:shadow-md transition-all"
    >
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-10 bg-gradient-to-br ${gradient}`} />
      
      <div className="flex items-start justify-between relative z-10 mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
          {React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: 2 })}
        </div>
        {trend && (
          <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-black uppercase tracking-wider">{trend}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-none mb-2">
          {value}
        </h3>
        <div className="mt-1">
          <p className="text-[11px] font-black text-black uppercase tracking-[0.15em] leading-tight mb-1">{label}</p>
          {subtitle && <p className="text-[10px] text-black font-bold tracking-tight opacity-70">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
