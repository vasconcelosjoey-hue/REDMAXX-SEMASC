
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
  isBlackTitle?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient, glowColor, subtitle, trend, isBlackTitle = false }) => {
  return (
    <motion.div 
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      style={{ boxShadow: `0 10px 25px -10px ${glowColor}` }}
      className="relative bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 flex flex-col justify-between overflow-hidden group h-full"
    >
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-10 bg-gradient-to-br ${gradient}`} />
      
      <div className="flex items-start justify-between relative z-10 mb-6">
        <div className={`w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
          {React.cloneElement(icon as React.ReactElement, { size: 22, strokeWidth: 2.5 })}
        </div>
        {trend && (
          <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{trend}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-2">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </h3>
        <div className="mt-1">
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] leading-tight mb-1">{label}</p>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium tracking-tight">{subtitle}</p>}
        </div>
      </div>
      
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
    </motion.div>
  );
};

export default StatCard;
