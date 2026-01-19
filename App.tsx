
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
import { MonthlyStats } from './types.ts';
import { extractDataFromImage } from './services/geminiService.ts';
import StatCard from './components/StatCard.tsx';
import './firebase.ts'; // Initialize firebase

const CHART_PALETTE = ['#F43F5E', '#0F172A', '#64748B', '#CBD5E1'];

const MiniStatusCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 truncate">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-none">{value.toLocaleString('pt-BR')}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [history, setHistory] = useState<MonthlyStats[]>([]);
  const [expandedYears, setExpandedYears] = useState<number[]>([2026, 2025]);
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
    const savedHistory = localStorage.getItem('redmaxx_v10_history');
    const savedCurrent = localStorage.getItem('redmaxx_v10_current');
    
    if (savedHistory && savedCurrent) {
      setHistory(JSON.parse(savedHistory));
      setCurrentMonth(JSON.parse(savedCurrent));
    } else {
      const initialHistory: MonthlyStats[] = [
        { id: 'sep25', monthName: 'Setembro/2025', enviado: 840, naoWhatsapp: 350, semNumero: 100, paraEnviar: 37, totalProcessado: 1327, taxaSucesso: 63.31, isClosed: true },
        { id: 'oct25', monthName: 'Outubro/2025', enviado: 652, naoWhatsapp: 200, semNumero: 50, paraEnviar: 23, totalProcessado: 925, taxaSucesso: 70.48, isClosed: true },
        { id: 'nov25', monthName: 'Novembro/2025', enviado: 450, naoWhatsapp: 180, semNumero: 80, paraEnviar: 21, totalProcessado: 731, taxaSucesso: 61.57, isClosed: true },
        { id: 'dec25', monthName: 'Dezembro/2025', enviado: 1064, naoWhatsapp: 3500, semNumero: 4103, paraEnviar: 1040, totalProcessado: 5707, taxaSucesso: 18.64, isClosed: true },
      ];
      setHistory(initialHistory);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('redmaxx_v10_history', JSON.stringify(history));
    localStorage.setItem('redmaxx_v10_current', JSON.stringify(currentMonth));
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
          console.error(error);
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
      setHistory([...history, { ...currentMonth, id: Date.now().toString(), isClosed: true }]);
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
    const monthsArr = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const years = [2025, 2026, 2027];
    const [curMonthName, curYearStr] = currentMonth.monthName.split('/');
    const curYear = parseInt(curYearStr);
    const curMonthIdx = monthsArr.indexOf(curMonthName);
    const result: Record<number, any[]> = {};

    years.forEach(year => {
      const yearMonths = monthsArr.map((m, idx) => {
        const name = `${m}/${year}`;
        const histMatch = history.find(h => h.monthName === name);
        
        // 2025 starts at September (index 8)
        if (year === 2025 && idx < 8) return null;

        if (histMatch) return { ...histMatch, status: 'Consolidado' };
        if (name === currentMonth.monthName) return { ...currentMonth, status: 'Em andamento' };
        
        if (year > curYear || (year === curYear && idx > curMonthIdx)) {
          return { monthName: name, status: 'Aguardando período', enviado: 0, totalProcessado: 0, taxaSucesso: 0 };
        }
        return null;
      }).filter(x => x !== null);
      
      if (yearMonths.length > 0) result[year] = yearMonths;
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
        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
          <Zap className="text-white w-7 h-7 fill-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-white leading-none">RedMaxx</h1>
          <span className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">Executive Intelligence</span>
        </div>
      </div>

      <nav className="space-y-3 mt-6">
        {[
          { id: 'dashboard', label: 'Monitoramento', icon: LayoutDashboard },
          { id: 'history', label: 'Consolidado', icon: Calendar },
          { id: 'new', label: 'Lançamento', icon: Plus }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-white text-red-900 shadow-2xl font-black scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <item.icon size={20} />
            <span className="text-sm tracking-wide font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <button onClick={handleCloseMonth} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-bold text-[11px] hover:bg-white/20 transition-all uppercase tracking-widest">
           <Lock size={16} /> Fechar Ciclo
        </button>
        <button onClick={handleStartNextMonth} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white text-red-900 font-black text-[11px] shadow-xl hover:bg-red-50 transition-all uppercase tracking-widest">
           <Play size={16} /> Próximo Mês
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fcfcfd] pb-24 md:pb-0">
      <aside className="hidden md:flex w-80 premium-red-gradient flex-col p-8 sticky top-0 h-screen z-30 shadow-2xl shrink-0">
        {sidebarContent}
      </aside>

      <main className="flex-1 min-w-0 p-6 sm:p-10 lg:p-14">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-12 sm:mb-16">
          <div className="text-center sm:text-left">
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] mb-2">Plataforma SEMASC v9.0</p>
            <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter">
              {activeTab === 'dashboard' ? currentMonth.monthName : activeTab === 'history' ? 'Consolidado' : 'Monitor Inteligente'}
            </h2>
          </div>
          
          <div className="flex items-center gap-5 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm pr-10">
             <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200"><Users size={24} /></div>
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Total Ativa</p>
               <p className="text-2xl font-black text-slate-800">{TOTAL_BASE_IDENTIFICADA.toLocaleString('pt-BR')}</p>
             </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-12">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="bg-white p-10 sm:p-14 rounded-[3.5rem] border border-slate-100 shadow-sm xl:col-span-1 flex flex-col">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400 mb-12">Breakdown Competência</h3>
                  
                  <div className="grid grid-cols-1 gap-5 mb-14">
                    <MiniStatusCard label="Sucesso" value={currentMonth.enviado} color="bg-rose-500" icon={<Send size={20}/>} />
                    <MiniStatusCard label="Invalidados" value={currentMonth.naoWhatsapp} color="bg-slate-950" icon={<Smartphone size={20}/>} />
                    <MiniStatusCard label="Omissos" value={currentMonth.semNumero} color="bg-slate-500" icon={<AlertCircle size={20}/>} />
                    <MiniStatusCard label="Fila Pendente" value={currentMonth.paraEnviar} color="bg-slate-300" icon={<Clock size={20}/>} />
                  </div>

                  <div className="h-[280px] opacity-90 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={90} outerRadius={125} paddingAngle={10} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} stroke="none" />)}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '25px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sucesso</span>
                       <span className="text-3xl font-black text-slate-900">{currentMonth.taxaSucesso}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-10 sm:p-14 rounded-[3.5rem] border border-slate-100 shadow-sm xl:col-span-2 flex flex-col">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400 mb-12">Evolução de Entrega</h3>
                  <div className="flex-1 min-h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...history].concat([currentMonth])}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25}/>
                             <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="enviado" stroke="#F43F5E" strokeWidth={6} fill="url(#colorArea)" dot={{ r: 8, fill: '#F43F5E', stroke: '#fff', strokeWidth: 5 }} activeDot={{ r: 11, fill: '#F43F5E', stroke: '#fff', strokeWidth: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
              
              {/* Seção Hero Consolidado solicitada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <StatCard 
                  label="TAXA PROJETO" 
                  value={`${taxaTotalProcessamento}%`} 
                  icon={<ShieldCheck />} 
                  gradient="from-slate-800 to-slate-950" 
                  glowColor="rgba(0, 0, 0, 0.15)"
                  subtitle="Eficiência Global" 
                />
                <StatCard 
                  label="HISTÓRICO" 
                  value={totalBaseProcessada} 
                  icon={<Users />} 
                  gradient="from-slate-700 to-slate-900" 
                  glowColor="rgba(0, 0, 0, 0.1)"
                  subtitle="Acumulado" 
                />
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 px-10 max-w-2xl">
                 <Search className="text-slate-400" size={28} />
                 <input 
                   type="text" 
                   placeholder="Filtrar competência histórica..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="flex-1 bg-transparent border-none outline-none text-slate-900 font-bold text-xl placeholder:text-slate-300"
                 />
              </div>
              
              <div className="space-y-10">
                {(Object.entries(groupedCalendarView) as [string, any[]][]).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([year, months]) => (
                  <div key={year} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <button 
                      onClick={() => toggleYear(parseInt(year))}
                      className="w-full flex items-center justify-between px-12 py-10 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-6">
                         <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg shadow-red-200" />
                         <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Ciclo Anual {year}</h3>
                      </div>
                      <ChevronDown size={36} className={`text-slate-300 transition-transform duration-500 ${expandedYears.includes(parseInt(year)) ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {expandedYears.includes(parseInt(year)) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead className="bg-slate-50/50">
                                <tr>
                                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Competência</th>
                                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Processados</th>
                                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Eficiência</th>
                                  <th className="px-12 py-8"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {months.map((item: any) => (
                                  <tr key={item.monthName} className={`group transition-colors ${item.status === 'Aguardando período' ? 'opacity-30' : 'hover:bg-slate-50'}`}>
                                    <td className="px-12 py-8 font-black text-slate-900 text-xl">{item.monthName}</td>
                                    <td className="px-12 py-8 text-center font-black text-slate-900 text-3xl">{item.enviado || 0}</td>
                                    <td className="px-12 py-8 text-center">
                                       <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                                         item.status === 'Consolidado' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                         item.status === 'Em andamento' ? 'bg-red-50 text-red-600 border-red-100' :
                                         'bg-transparent text-slate-400 border-slate-200'
                                       }`}>
                                         {item.status}
                                       </span>
                                    </td>
                                    <td className="px-12 py-8 text-center font-black text-slate-500 text-xl">{item.taxaSucesso}%</td>
                                    <td className="px-12 py-8 text-right">
                                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {item.status === 'Consolidado' && <button className="p-3.5 text-slate-300 hover:text-red-600 transition-colors"><Download size={24}/></button>}
                                          {item.id && item.id !== 'current' && <button onClick={() => setHistory(history.filter(h => h.id !== item.id))} className="p-3.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>}
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
            <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto w-full">
              <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-950 p-14 sm:p-20 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[120px] rounded-full" />
                  <h3 className="text-5xl sm:text-6xl font-black mb-8 flex items-center gap-6">Sincronizar Dados <Wand2 className="text-red-600" /></h3>
                  <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl">
                    Utilize a extração inteligente colando o relatório textual ou arrastando uma imagem de status. A plataforma processará os números instantaneamente.
                  </p>
                </div>
                
                <div className="p-14 sm:p-20 space-y-16">
                  <div className="space-y-8">
                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><ClipboardPaste size={20} /></div>
                       Caixa Inteligente de Dados Brutos
                    </label>
                    <textarea 
                      placeholder="Cole aqui o texto do relatório diário..."
                      value={smartPasteText}
                      onChange={(e) => handleSmartPasteChange(e.target.value)}
                      className="w-full h-52 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 text-xl font-semibold text-slate-700 outline-none focus:border-red-600/30 focus:bg-white transition-all resize-none shadow-inner placeholder:text-slate-300"
                    />
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); setActiveTab('dashboard'); }} className="space-y-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                      {[
                        { id: 'enviado', label: 'SUCESSO: ENVIADOS', color: 'focus:ring-rose-500' },
                        { id: 'naoWhatsapp', label: 'INVÁLIDOS: NÃO WHATSAPP', color: 'focus:ring-slate-950' },
                        { id: 'semNumero', label: 'OMISSÃO: SEM NÚMERO', color: 'focus:ring-slate-400' },
                        { id: 'paraEnviar', label: 'LOGÍSTICA: PENDENTE', color: 'focus:ring-blue-600' }
                      ].map((field) => (
                        <div key={field.id} className="space-y-5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">{field.label}</label>
                          <input 
                            type="number" 
                            value={(currentMonth as any)[field.id]}
                            onChange={e => updateCurrentData({ [field.id]: e.target.value })}
                            className={`w-full bg-slate-50 border border-slate-200 rounded-3xl px-10 py-8 text-5xl font-black text-slate-900 outline-none focus:bg-white focus:ring-12 ${field.color}/5 transition-all shadow-sm`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-16 flex flex-col lg:flex-row items-center justify-between gap-16 border-t border-slate-100">
                      <div className="text-center lg:text-left">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Consolidado da Competência</p>
                        <span className="text-8xl font-black text-slate-950 leading-none tracking-tighter">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</span>
                      </div>
                      <button type="submit" className="w-full lg:w-auto premium-red-gradient text-white px-20 py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-6 transition-all hover:-translate-y-2 hover:shadow-2xl">
                        FINALIZAR MONITORAMENTO <ChevronRight size={28} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-24 pb-20 pt-12 border-t border-slate-100 text-slate-400 text-[12px] font-bold uppercase tracking-[0.4em] flex flex-col sm:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-5">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-lg" />
              <span>RedMaxx SEMASC Architecture • 2026</span>
           </div>
           <div className="flex items-center gap-12">
              <span className="flex items-center gap-3"><ShieldCheck size={18}/> Protocolo de Dados Ativo</span>
              <span className="flex items-center gap-3"><Zap size={18}/> Gemini AI Core v9.1</span>
           </div>
        </footer>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-10 py-6 flex items-center justify-between z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.04)] rounded-t-[3rem]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'history', label: 'Histórico', icon: Calendar },
          { id: 'new', label: 'Monitor', icon: Plus }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-3 transition-all duration-300 ${activeTab === item.id ? 'text-red-700' : 'text-slate-400'}`}
          >
            <div className={`p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === item.id ? 'bg-red-50 shadow-inner scale-110' : ''}`}>
               <item.icon size={26} strokeWidth={activeTab === item.id ? 3 : 2} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/60 backdrop-blur-3xl z-[100] flex items-center justify-center p-10">
            <div className="bg-white rounded-[5rem] p-20 text-center shadow-2xl max-w-md w-full">
              <div className="relative w-28 h-28 mx-auto mb-10">
                <Loader2 className="w-full h-full text-red-600 animate-spin" />
                <Zap className="absolute inset-0 m-auto w-8 h-8 text-slate-950 fill-slate-950" />
              </div>
              <h3 className="text-3xl font-black tracking-tighter text-slate-950 mb-4">Sincronizando Base</h3>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em]">IA Processando Status</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
