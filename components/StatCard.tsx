
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
      className="relative bg-white rounded-2xl p-6 md:p-8 border border-slate-200 flex flex-col justify-between overflow-hidden group h-full shadow-sm hover:shadow-md transition-all"
    >
      <div className={`absolute -right-6 -top-6 w-36 h-36 rounded-full opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-10 bg-gradient-to-br ${gradient}`} />
      
      <div className="flex items-start justify-between relative z-10 mb-5 md:mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
          {React.cloneElement(icon as React.ReactElement, { size: 22, strokeWidth: 2.5 })}
        </div>
        {trend && (
          <div className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-black uppercase tracking-wider">{trend}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-2xl md:text-3xl font-black text-black tracking-tight leading-none mb-2 md:mb-3">
          {value}
        </h3>
        <div className="mt-1.5 md:mt-2">
          <p className="text-[10px] md:text-[11px] font-black text-black uppercase tracking-[0.1em] leading-tight mb-1">{label}</p>
          {subtitle && <p className="text-[9px] md:text-[10px] text-black font-bold tracking-tight opacity-40 uppercase">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
