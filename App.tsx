
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Plus, Upload, Trash2, Search, Download,
  Send, Smartphone, Users, Clock, History, LayoutDashboard,
  Loader2, AlertCircle, CheckCircle2, ChevronRight, ClipboardPaste,
  ShieldCheck, ArrowUpRight, Maximize2, FileText, Sparkles, Zap,
  Menu, X, Lock, Play, Calendar, ChevronDown, Wand2
} from 'lucide-react';
import { MonthlyStats } from './types';
import { extractDataFromImage } from './services/geminiService';
import StatCard from './components/StatCard';

const CHART_PALETTE = ['#F43F5E', '#0F172A', '#64748B', '#CBD5E1'];

const MiniStatusCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-50 shadow-sm transition-all hover:shadow-md">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white shadow-lg shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
      <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{value.toLocaleString('pt-BR')}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [history, setHistory] = useState<MonthlyStats[]>([]);
  const [expandedYears, setExpandedYears] = useState<number[]>([2026]);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [currentMonth, setCurrentMonth] = useState<MonthlyStats>({
    id: 'current',
    monthName: 'Janeiro/2026',
    enviado: 330,
    naoWhatsapp: 195,
    semNumero: 11,
    paraEnviar: 65,
    totalProcessado: 601,
    taxaSucesso: 54.91,
    isClosed: false
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'new'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleYear = (year: number) => {
    setExpandedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  const TOTAL_BASE_IDENTIFICADA = 7439;

  useEffect(() => {
    const savedHistory = localStorage.getItem('redmaxx_history_v7');
    const savedCurrent = localStorage.getItem('redmaxx_current_v7');
    
    if (savedHistory && savedCurrent) {
      setHistory(JSON.parse(savedHistory));
      setCurrentMonth(JSON.parse(savedCurrent));
    } else {
      const initialHistory: MonthlyStats[] = [
        { id: 'dec25', monthName: 'Dezembro/2025', enviado: 1064, naoWhatsapp: 3500, semNumero: 4103, paraEnviar: 1040, totalProcessado: 5707, taxaSucesso: 18.64, isClosed: true },
        { id: 'nov25', monthName: 'Novembro/2025', enviado: 450, naoWhatsapp: 180, semNumero: 80, paraEnviar: 21, totalProcessado: 731, taxaSucesso: 61.57, isClosed: true },
        { id: 'oct25', monthName: 'Outubro/2025', enviado: 652, naoWhatsapp: 200, semNumero: 50, paraEnviar: 23, totalProcessado: 925, taxaSucesso: 70.48, isClosed: true },
        { id: 'sep25', monthName: 'Setembro/2025', enviado: 840, naoWhatsapp: 350, semNumero: 100, paraEnviar: 37, totalProcessado: 1327, taxaSucesso: 63.31, isClosed: true },
      ];
      setHistory(initialHistory);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('redmaxx_history_v7', JSON.stringify(history));
    localStorage.setItem('redmaxx_current_v7', JSON.stringify(currentMonth));
  }, [history, currentMonth]);

  const updateCurrentData = (data: Partial<MonthlyStats>) => {
    const updated = { ...currentMonth, ...data };
    const enviado = Number(updated.enviado) || 0;
    const naoWhatsapp = Number(updated.naoWhatsapp) || 0;
    const semNumero = Number(updated.semNumero) || 0;
    const paraEnviar = Number(updated.paraEnviar) || 0;
    const total = enviado + naoWhatsapp + semNumero + paraEnviar;
    const taxa = total > 0 ? Number(((enviado / total) * 100).toFixed(2)) : 0;
    setCurrentMonth({ ...updated, enviado, naoWhatsapp, semNumero, paraEnviar, totalProcessado: total, taxaSucesso: taxa });
  };

  const handleSmartPasteChange = (text: string) => {
    setSmartPasteText(text);
    const parseNumber = (pattern: RegExp) => {
      const match = text.match(pattern);
      return match ? parseInt(match[1].replace(/\D/g, '')) : null;
    };

    const enviado = parseNumber(/(?:enviado|sucesso|enviados)[:\s-]*([\d.,]+)/i);
    const naoWhatsapp = parseNumber(/(?:não.*whatsapp|inválidos|invalido)[:\s-]*([\d.,]+)/i);
    const semNumero = parseNumber(/(?:sem.*número|cadastros.*sem|omisso)[:\s-]*([\d.,]+)/i);
    const paraEnviar = parseNumber(/(?:para.*enviar|pendente|fila)[:\s-]*([\d.,]+)/i);

    const updates: Partial<MonthlyStats> = {};
    if (enviado !== null) updates.enviado = enviado;
    if (naoWhatsapp !== null) updates.naoWhatsapp = naoWhatsapp;
    if (semNumero !== null) updates.semNumero = semNumero;
    if (paraEnviar !== null) updates.paraEnviar = paraEnviar;

    if (Object.keys(updates).length > 0) {
      updateCurrentData(updates);
    }
  };

  const processImageFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const extracted = await extractDataFromImage(base64);
          updateCurrentData({
            enviado: extracted.enviado || 0,
            naoWhatsapp: extracted.naoWhatsapp || 0,
            semNumero: extracted.semNumero || 0,
            paraEnviar: extracted.paraEnviar || 0
          });
          setActiveTab('new');
        } catch (error) {
          alert("Erro na leitura inteligente.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) processImageFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [currentMonth]);

  const handleCloseMonth = () => {
    if (confirm(`Fechar competência ${currentMonth.monthName}?`)) {
      setHistory([{ ...currentMonth, id: Date.now().toString(), isClosed: true }, ...history]);
      handleStartNextMonth();
    }
  };

  const handleStartNextMonth = () => {
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const [name, yearStr] = currentMonth.monthName.split('/');
    let year = parseInt(yearStr);
    let monthIdx = months.indexOf(name);
    monthIdx++;
    if (monthIdx > 11) { monthIdx = 0; year++; }
    const nextMonthName = `${months[monthIdx]}/${year}`;
    setCurrentMonth({ id: 'current', monthName: nextMonthName, enviado: 0, naoWhatsapp: 0, semNumero: 0, paraEnviar: 0, totalProcessado: 0, taxaSucesso: 0, isClosed: false });
    setActiveTab('new');
    setSmartPasteText('');
  };

  const groupedCalendarView = useMemo(() => {
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const years = [2027, 2026, 2025];
    const [curMonthName, curYearStr] = currentMonth.monthName.split('/');
    const curYear = parseInt(curYearStr);
    const curMonthIdx = months.indexOf(curMonthName);
    const result: Record<number, any[]> = {};

    years.forEach(year => {
      result[year] = months.map((m, idx) => {
        const name = `${m}/${year}`;
        const histMatch = history.find(h => h.monthName === name);
        if (histMatch) return { ...histMatch, status: 'Consolidado' };
        if (name === currentMonth.monthName) return { ...currentMonth, status: 'Em andamento' };
        
        // Starts from September in 2025
        if (year === 2025 && idx < 8) return null;

        if (year > curYear || (year === curYear && idx > curMonthIdx)) {
          return { monthName: name, status: 'Aguardando período', enviado: 0, totalProcessado: 0, taxaSucesso: 0 };
        }
        return null;
      }).filter(x => x !== null);
    });
    return result;
  }, [history, currentMonth]);

  const totalBaseProcessada = history.reduce((acc, curr) => acc + curr.enviado, 0) + currentMonth.enviado;
  const taxaTotalProcessamento = Number(((totalBaseProcessada / TOTAL_BASE_IDENTIFICADA) * 100).toFixed(2));

  const pieData = [
    { name: 'Sucesso', value: currentMonth.enviado },
    { name: 'Inválidos', value: currentMonth.naoWhatsapp },
    { name: 'S/ Número', value: currentMonth.semNumero },
    { name: 'Pendente', value: currentMonth.paraEnviar },
  ];

  const sidebarContent = (
    <>
      <div className="flex items-center gap-4 mb-10 px-2">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
          <Zap className="text-white w-6 h-6 fill-white" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase text-white leading-none">RedMaxx</h1>
          <span className="text-[8px] text-white/50 font-black uppercase tracking-[0.2em]">SEMASC Executive</span>
        </div>
      </div>

      <nav className="space-y-2 mt-4">
        {[
          { id: 'dashboard', label: 'Monitoramento', icon: LayoutDashboard },
          { id: 'history', label: 'Consolidado', icon: Calendar },
          { id: 'new', label: 'Lançamento', icon: Plus }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-white text-red-900 shadow-xl font-black scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <item.icon size={18} />
            <span className="text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <button onClick={handleCloseMonth} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-[10px] hover:bg-white/20 transition-all uppercase tracking-widest">
           <Lock size={14} /> Fechar Ciclo
        </button>
        <button onClick={handleStartNextMonth} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-red-900 font-black text-[10px] shadow-lg hover:bg-red-50 transition-all uppercase tracking-widest">
           <Play size={14} /> Próximo Mês
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fcfcfd] pb-24 md:pb-0">
      <aside className="hidden md:flex w-72 premium-red-gradient flex-col p-6 sticky top-0 h-screen z-30 shadow-2xl overflow-hidden shrink-0">
        {sidebarContent}
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-12">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 sm:mb-16">
          <div className="text-center sm:text-left">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mb-1">Painel Executive Intelligence</p>
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter">
              {activeTab === 'dashboard' ? currentMonth.monthName : activeTab === 'history' ? 'Consolidado' : 'Monitor Inteligente'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm pr-8">
             <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md shadow-slate-200"><Users size={20} /></div>
             <div>
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Base Ativa</p>
               <p className="text-lg font-black text-slate-700">{TOTAL_BASE_IDENTIFICADA.toLocaleString('pt-BR')}</p>
             </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-12 sm:space-y-16">
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 sm:gap-12">
                <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-slate-100 shadow-sm xl:col-span-1 flex flex-col">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Status Detalhado Atual</h3>
                  
                  <div className="grid grid-cols-1 gap-4 mb-10">
                    <MiniStatusCard label="Enviados" value={currentMonth.enviado} color="bg-rose-500" icon={<Send size={18}/>} />
                    <MiniStatusCard label="Inválidos" value={currentMonth.naoWhatsapp} color="bg-slate-900" icon={<Smartphone size={18}/>} />
                    <MiniStatusCard label="Sem Número" value={currentMonth.semNumero} color="bg-slate-500" icon={<AlertCircle size={18}/>} />
                    <MiniStatusCard label="Fila Pendente" value={currentMonth.paraEnviar} color="bg-slate-300" icon={<Clock size={18}/>} />
                  </div>

                  <div className="h-[220px] sm:h-[260px] opacity-90">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} stroke="none" />)}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.08)'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-slate-100 shadow-sm xl:col-span-2">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-12">Performance por Competência</h3>
                  <div className="h-[400px] sm:h-[550px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...history].reverse().concat([currentMonth])}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                        <Area type="monotone" dataKey="enviado" stroke="#F43F5E" strokeWidth={5} fill="url(#colorArea)" dot={{ r: 7, fill: '#F43F5E', stroke: '#fff', strokeWidth: 4 }} activeDot={{ r: 9, fill: '#F43F5E', stroke: '#fff', strokeWidth: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Redundant summary removed from Dashboard bottom as requested */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-10">
                <StatCard 
                  label="Sucesso Mensal" 
                  value={currentMonth.enviado} 
                  icon={<Send />} 
                  gradient="from-red-500 to-rose-600" 
                  glowColor="rgba(244, 63, 94, 0.1)"
                  trend={`${currentMonth.taxaSucesso}% Sucesso`} 
                />
                <StatCard 
                  label="Aguardando Envio" 
                  value={currentMonth.paraEnviar} 
                  icon={<Clock />} 
                  gradient="from-blue-500 to-indigo-600" 
                  glowColor="rgba(59, 130, 246, 0.1)"
                />
              </div>

            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              
              {/* Hero Section for Consolidado as requested */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <StatCard 
                  label="Taxa Projeto" 
                  value={`${taxaTotalProcessamento}%`} 
                  icon={<ShieldCheck />} 
                  gradient="from-slate-700 to-slate-900" 
                  glowColor="rgba(15, 23, 42, 0.2)"
                  subtitle="Eficiência Global" 
                  isBlackTitle={true}
                />
                <StatCard 
                  label="Histórico" 
                  value={totalBaseProcessada} 
                  icon={<Users />} 
                  gradient="from-slate-600 to-slate-800" 
                  glowColor="rgba(0, 0, 0, 0.1)"
                  subtitle="Acumulado" 
                  isBlackTitle={true}
                />
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 px-8 max-w-2xl">
                 <Search className="text-slate-400" size={24} />
                 <input 
                   type="text" 
                   placeholder="Localizar competência consolidada..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="flex-1 bg-transparent border-none outline-none text-slate-800 font-bold text-lg"
                 />
              </div>
              
              <div className="space-y-6">
                {(Object.entries(groupedCalendarView) as [string, any[]][]).map(([year, months]) => (
                  <div key={year} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <button 
                      onClick={() => toggleYear(parseInt(year))}
                      className="w-full flex items-center justify-between px-10 py-8 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-5">
                         <div className="w-2 h-2 rounded-full bg-red-600 shadow-sm" />
                         <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ano {year}</h3>
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Consolidação Ativa</span>
                      </div>
                      <ChevronDown size={32} className={`text-slate-300 transition-transform duration-300 ${expandedYears.includes(parseInt(year)) ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {expandedYears.includes(parseInt(year)) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead className="bg-slate-50/50">
                                <tr>
                                  <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mês</th>
                                  <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Processados</th>
                                  <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                  <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Eficiência</th>
                                  <th className="px-10 py-6"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {/* Chronological ascending within year: January at TOP */}
                                {months.map((item: any) => (
                                  <tr key={item.monthName} className={`group transition-colors ${item.status === 'Aguardando período' ? 'opacity-30' : 'hover:bg-slate-50'}`}>
                                    <td className="px-10 py-6 font-black text-slate-900 text-lg">{item.monthName}</td>
                                    <td className="px-10 py-6 text-center font-black text-slate-900 text-2xl">{item.enviado || 0}</td>
                                    <td className="px-10 py-6 text-center">
                                       <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                         item.status === 'Consolidado' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                         item.status === 'Em andamento' ? 'bg-red-50 text-red-600 border-red-100' :
                                         'bg-transparent text-slate-400 border-slate-200'
                                       }`}>
                                         {item.status}
                                       </span>
                                    </td>
                                    <td className="px-10 py-6 text-center font-black text-slate-500 text-lg">{item.taxaSucesso}%</td>
                                    <td className="px-10 py-6 text-right">
                                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {item.status === 'Consolidado' && <button className="p-3 text-slate-300 hover:text-red-600"><Download size={20}/></button>}
                                          {item.id && item.id !== 'current' && <button onClick={() => setHistory(history.filter(h => h.id !== item.id))} className="p-3 text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>}
                                       </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'new' && (
            <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto w-full">
              <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-12 sm:p-16 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full" />
                  <h3 className="text-4xl sm:text-5xl font-black mb-6 flex items-center gap-5">Extração Ativa <Wand2 className="text-red-500" /></h3>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                    Input rápido de dados via texto ou imagem. Cole o relatório bruto na caixa inteligente para processamento automático.
                  </p>
                </div>
                
                <div className="p-12 sm:p-16 space-y-16">
                  <div className="space-y-6">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600"><ClipboardPaste size={16} /></div>
                       Caixa Inteligente de Dados
                    </label>
                    <textarea 
                      placeholder="Cole aqui o texto do status de envio..."
                      value={smartPasteText}
                      onChange={(e) => handleSmartPasteChange(e.target.value)}
                      className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-lg font-semibold text-slate-700 outline-none focus:border-red-500/20 focus:bg-white transition-all resize-none shadow-inner"
                    />
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); setActiveTab('dashboard'); }} className="space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      {[
                        { id: 'enviado', label: 'Sucesso: Enviados', color: 'focus:ring-rose-500' },
                        { id: 'naoWhatsapp', label: 'Invalidação: Não WhatsApp', color: 'focus:ring-slate-900' },
                        { id: 'semNumero', label: 'Omissão: Sem Número', color: 'focus:ring-slate-400' },
                        { id: 'paraEnviar', label: 'Fila: Pendente Envio', color: 'focus:ring-blue-500' }
                      ].map((field) => (
                        <div key={field.id} className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                          <input 
                            type="number" 
                            value={(currentMonth as any)[field.id]}
                            onChange={e => updateCurrentData({ [field.id]: e.target.value })}
                            className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-6 text-4xl font-black text-slate-900 outline-none focus:bg-white focus:ring-8 ${field.color}/5 transition-all shadow-sm`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-12 flex flex-col lg:flex-row items-center justify-between gap-12 border-t border-slate-100">
                      <div className="text-center lg:text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Processamento Total</p>
                        <span className="text-7xl font-black text-slate-900 leading-none tracking-tight">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</span>
                      </div>
                      <button type="submit" className="w-full lg:w-auto premium-red-gradient text-white px-16 py-7 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-5 transition-transform hover:-translate-y-2">
                        CONFIRMAR CICLO <ChevronRight size={24} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-20 pb-16 pt-10 border-t border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-sm" />
              <span>Painel SEMASC RedMaxx • 2026</span>
           </div>
           <div className="flex items-center gap-10">
              <span className="flex items-center gap-2"><ShieldCheck size={16}/> Secure Pipeline</span>
              <span className="flex items-center gap-2"><Zap size={16}/> AI Core v7.0</span>
           </div>
        </footer>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-100 px-8 py-5 flex items-center justify-between z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-t-[2.5rem]">
        {[
          { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
          { id: 'history', label: 'Consol', icon: Calendar },
          { id: 'new', label: 'Input', icon: Plus }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeTab === item.id ? 'text-red-600' : 'text-slate-400'}`}
          >
            <div className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-red-50 shadow-inner scale-110' : ''}`}>
               <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xl z-[100] flex items-center justify-center p-8">
            <div className="bg-white rounded-[4rem] p-16 text-center shadow-2xl max-w-sm w-full">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <Loader2 className="w-full h-full text-red-600 animate-spin" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Sincronizando...</h3>
              <p className="text-slate-400 text-xs font-bold uppercase mt-3 tracking-widest">Identificação automática em curso</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
