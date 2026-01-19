
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Plus, Trash2, Search, Users, LayoutDashboard,
  Loader2, ChevronRight, ClipboardPaste,
  ShieldCheck, Zap, Lock, Play, Calendar, ChevronDown, Wand2, MessageSquare, PhoneOff, UserMinus, SendHorizontal,
  ShieldAlert, KeyRound
} from 'lucide-react';
import { MonthlyStats } from './types.ts';
import { extractDataFromImage } from './services/geminiService.ts';
import StatCard from './components/StatCard.tsx';
import './firebase.ts';

const CHART_PALETTE = ['#991B1B', '#1E293B', '#64748B', '#94A3B8'];
const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/redmaxx-semasc.firebasestorage.app/o/RELAT%C3%93RIO%20SEMASC.png?alt=media&token=335f2853-0e57-48a2-81e9-2b4b077cde0a";
const AUTH_PASSWORD = "semascmanaus123";

const MiniStatusCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white shadow-md shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{label}</p>
      <p className="text-xl font-bold text-slate-900 leading-none">{value.toLocaleString('pt-BR')}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
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

  // Estados de Segurança
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ fn: () => void; label: string } | null>(null);

  const TOTAL_BASE_IDENTIFICADA = 7439;

  useEffect(() => {
    // Simulação de inicialização com progresso
    const interval = setInterval(() => {
      setInitProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsInitializing(false), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    const savedHistory = localStorage.getItem('redmaxx_v11_history');
    const savedCurrent = localStorage.getItem('redmaxx_v11_current');
    
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

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('redmaxx_v11_history', JSON.stringify(history));
    localStorage.setItem('redmaxx_v11_current', JSON.stringify(currentMonth));
  }, [history, currentMonth]);

  const requestAuthorization = (actionLabel: string, actionFn: () => void) => {
    setPendingAction({ fn: actionFn, label: actionLabel });
    setIsAuthOpen(true);
    setAuthInput('');
    setAuthError(false);
  };

  const confirmAuthorization = () => {
    if (authInput === AUTH_PASSWORD) {
      if (pendingAction) {
        pendingAction.fn();
      }
      setIsAuthOpen(false);
      setPendingAction(null);
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

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
    const enviado = parseNumber(/(?:enviado|sucesso|enviados|recebidas)[:\s-]*([\d.,]+)/i);
    const naoWhatsapp = parseNumber(/(?:não.*whatsapp|inválidos|invalido)[:\s-]*([\d.,]+)/i);
    const semNumero = parseNumber(/(?:sem.*número|cadastros.*sem|omisso)[:\s-]*([\d.,]+)/i);
    const paraEnviar = parseNumber(/(?:para.*enviar|pendente|fila)[:\s-]*([\d.,]+)/i);
    const updates: Partial<MonthlyStats> = {};
    if (enviado !== null) updates.enviado = enviado;
    if (naoWhatsapp !== null) updates.naoWhatsapp = naoWhatsapp;
    if (semNumero !== null) updates.semNumero = semNumero;
    if (paraEnviar !== null) updates.paraEnviar = paraEnviar;
    if (Object.keys(updates).length > 0) updateCurrentData(updates);
  };

  const processImageFile = async (file: File) => {
    setIsProcessing(true);
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
      } catch (error) { console.error(error); } finally { setIsProcessing(false); }
    };
    reader.readAsDataURL(file);
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
        if (year === 2025 && idx < 8) return null;
        if (histMatch) return { ...histMatch, status: 'Consolidado' };
        if (name === currentMonth.monthName) return { ...currentMonth, status: 'Em andamento' };
        if (year > curYear || (year === curYear && idx > curMonthIdx)) {
          return { monthName: name, status: 'Aguardando', enviado: 0, totalProcessado: 0, taxaSucesso: 0 };
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
    { name: 'Recebidas', value: currentMonth.enviado },
    { name: 'Não WhatsApp', value: currentMonth.naoWhatsapp },
    { name: 'Sem Número', value: currentMonth.semNumero },
    { name: 'Para Enviar', value: currentMonth.paraEnviar },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full py-2">
      <div className="relative mb-16 p-2">
        <div className="absolute inset-0 bg-white/98 rounded-[2rem] transform -rotate-3 skew-x-1 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white" />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-[2rem] border-2 border-white/50 shadow-inner overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '12px 12px' }} />
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-600/30 rounded-tl-lg" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-600/30 rounded-br-lg" />
        </div>
        <div className="relative z-10 flex justify-center py-10 px-4">
          <motion.img 
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            src={LOGO_URL} 
            alt="RedMaxx Logo" 
            className="h-32 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] filter brightness-110" 
          />
        </div>
      </div>

      <nav className="space-y-1.5 flex-1">
        {[
          { id: 'dashboard', label: 'Monitoramento', icon: LayoutDashboard },
          { id: 'history', label: 'Consolidado', icon: Calendar },
          { id: 'new', label: 'Lançamento', icon: Plus }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${activeTab === item.id ? 'bg-white text-red-900 shadow-xl font-bold translate-x-1' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-6 border-t border-white/10">
        <button 
          onClick={() => requestAuthorization("Fechar Ciclo", () => alert("Ciclo encerrado com sucesso!"))}
          className="w-full py-3.5 rounded-xl bg-white/5 border border-white/5 text-white/50 font-bold text-[10px] hover:bg-white/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Lock size={12} /> Fechar Ciclo
        </button>
        <button 
          onClick={() => requestAuthorization("Mudar de Mês", () => alert("Novo mês iniciado!"))}
          className="w-full py-4 rounded-xl bg-white text-red-900 font-bold text-[10px] shadow-lg hover:bg-red-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Play size={12} fill="currentColor" /> Próximo Mês
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      
      {/* SPLASH SCREEN */}
      <AnimatePresence>
        {isInitializing && (
          <motion.div 
            initial={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center p-8 overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative mb-12"
            >
              <div className="absolute inset-0 bg-red-600/20 blur-[100px] rounded-full" />
              <img src={LOGO_URL} alt="RedMaxx Logo" className="h-48 w-auto relative z-10 drop-shadow-2xl" />
            </motion.div>
            
            <div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${initProgress}%` }}
                className="absolute inset-y-0 left-0 premium-red-gradient"
              />
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] flex items-center gap-3"
            >
              <Zap size={14} className="text-red-600" /> Sincronizando Sistemas
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-64 premium-red-gradient flex-col p-6 sticky top-0 h-screen z-30 shadow-2xl shrink-0">
        {sidebarContent}
      </aside>

      <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10 mb-10 md:mb-0">
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em] mb-2">PLATAFORMA SEMASC V9.0</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'dashboard' ? currentMonth.monthName : activeTab === 'history' ? 'Consolidado' : 'Lançamento'}
            </h2>
          </div>
          
          <div className="flex items-center gap-5 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm pr-8 shrink-0">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                {activeTab === 'history' ? <Users size={20} /> : <Calendar size={20} />}
             </div>
             <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                  {activeTab === 'history' ? 'Base Total Ativa' : `Base de ${currentMonth.monthName.split('/')[0]}`}
               </p>
               <p className="text-2xl font-bold text-slate-900 leading-none">
                  {activeTab === 'history' ? TOTAL_BASE_IDENTIFICADA.toLocaleString('pt-BR') : currentMonth.totalProcessado.toLocaleString('pt-BR')}
               </p>
             </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-12">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm xl:col-span-1 flex flex-col">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-10">Distribuição Mensal</h3>
                  <div className="grid grid-cols-1 gap-4 mb-12">
                    <MiniStatusCard label="Mensagens Recebidas" value={currentMonth.enviado} color="bg-red-700" icon={<MessageSquare/>} />
                    <MiniStatusCard label="Contatos Não São WhatsApp" value={currentMonth.naoWhatsapp} color="bg-slate-800" icon={<PhoneOff/>} />
                    <MiniStatusCard label="Contatos Sem Número" value={currentMonth.semNumero} color="bg-slate-500" icon={<UserMinus/>} />
                    <MiniStatusCard label="Para Enviar" value={currentMonth.paraEnviar} color="bg-slate-300" icon={<SendHorizontal/>} />
                  </div>
                  <div className="h-[260px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={85} outerRadius={110} paddingAngle={8} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} stroke="none" />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Taxa</span>
                       <span className="text-3xl font-bold text-slate-900">{currentMonth.taxaSucesso}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm xl:col-span-2 flex flex-col">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-10">Evolução Histórica</h3>
                  <div className="flex-1 min-h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...history].concat([currentMonth])}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#991B1B" stopOpacity={0.15}/>
                             <stop offset="95%" stopColor="#991B1B" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="enviado" stroke="#991B1B" strokeWidth={5} fill="url(#colorArea)" dot={{ r: 6, fill: '#991B1B', stroke: '#fff', strokeWidth: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-14">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <StatCard label="TAXA GLOBAL" value={`${taxaTotalProcessamento}%`} icon={<ShieldCheck />} gradient="from-slate-800 to-slate-900" glowColor="rgba(0, 0, 0, 0.05)" subtitle="Eficiência Acumulada" />
                <StatCard label="TOTAL PROCESSADO" value={totalBaseProcessada.toLocaleString('pt-BR')} icon={<Users />} gradient="from-red-800 to-red-950" glowColor="rgba(153, 27, 27, 0.05)" subtitle="Volume Consolidado" />
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 px-8 max-w-xl">
                 <Search className="text-slate-300" size={20} />
                 <input type="text" placeholder="Buscar competência..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-slate-700 font-semibold text-lg placeholder:text-slate-300" />
              </div>
              <div className="space-y-10">
                {Object.entries(groupedCalendarView).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([year, months]) => (
                  <div key={year} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <button onClick={() => setExpandedYears(prev => prev.includes(parseInt(year)) ? prev.filter(y => y !== parseInt(year)) : [...prev, parseInt(year)])} className="w-full flex items-center justify-between px-10 py-8 hover:bg-slate-50 transition-colors">
                      <h3 className="text-2xl font-bold text-slate-800 tracking-tight uppercase tracking-widest">CICLO {year}</h3>
                      <ChevronDown size={28} className={`text-slate-300 transition-transform ${expandedYears.includes(parseInt(year)) ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {expandedYears.includes(parseInt(year)) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-50">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-slate-50/50">
                                  <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Competência</th>
                                  <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Processados</th>
                                  <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Eficiência</th>
                                  <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(months as any[]).map((item: any) => (
                                  <tr key={item.monthName} className={`transition-colors ${item.status === 'Aguardando' ? 'opacity-25' : 'hover:bg-slate-50/50'}`}>
                                    <td className="px-10 py-6 font-bold text-slate-700 text-base">{item.monthName}</td>
                                    <td className="px-10 py-6 text-center font-bold text-slate-900 text-lg">{item.enviado || 0}</td>
                                    <td className="px-10 py-6 text-center font-bold text-slate-500 text-base">{item.taxaSucesso}%</td>
                                    <td className="px-10 py-6 text-center">
                                       <div className="flex items-center justify-center gap-4">
                                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border ${item.status === 'Consolidado' ? 'bg-slate-50 text-slate-500 border-slate-100' : item.status === 'Em andamento' ? 'bg-red-50 text-red-700 border-red-100' : 'text-slate-300 border-transparent'}`}>
                                            {item.status}
                                          </span>
                                          {item.status === 'Consolidado' && (
                                            <button 
                                              onClick={() => requestAuthorization(`Excluir ${item.monthName}`, () => deleteHistoryItem(item.id))}
                                              className="p-2.5 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all"
                                            >
                                              <Trash2 size={18} />
                                            </button>
                                          )}
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
            <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
              <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-12 sm:p-16 text-white relative">
                  <h3 className="text-4xl font-bold mb-5 flex items-center gap-5">Lançamento Inteligente <Wand2 className="text-red-500" /></h3>
                  <p className="text-slate-400 text-base font-medium leading-relaxed max-w-xl">Sincronize os dados colando o relatório ou processando uma captura de tela com IA.</p>
                </div>
                <div className="p-12 sm:p-16 space-y-14">
                  <div className="space-y-5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-4"><ClipboardPaste size={18} /> Relatório de Texto</label>
                    <textarea placeholder="Cole o relatório extraído do sistema..." value={smartPasteText} onChange={(e) => handleSmartPasteChange(e.target.value)} className="w-full h-44 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-base font-medium text-slate-700 outline-none focus:border-red-200 focus:bg-white transition-all resize-none placeholder:text-slate-300" />
                  </div>
                  <form 
                    onSubmit={(e) => { 
                      e.preventDefault(); 
                      requestAuthorization("Atualizar Monitoramento", () => setActiveTab('dashboard')); 
                    }} 
                    className="space-y-14"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      {[{ id: 'enviado', label: 'Mensagens Recebidas', color: 'focus:border-red-500' }, { id: 'naoWhatsapp', label: 'Contatos Não São WhatsApp', color: 'focus:border-slate-800' }, { id: 'semNumero', label: 'Contatos Sem Número', color: 'focus:border-slate-400' }, { id: 'paraEnviar', label: 'Para Enviar', color: 'focus:border-blue-400' }].map((field) => (
                        <div key={field.id} className="space-y-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                          <input type="number" value={(currentMonth as any)[field.id]} onChange={e => updateCurrentData({ [field.id]: e.target.value })} className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 text-3xl font-bold text-slate-800 outline-none transition-all ${field.color}`} />
                        </div>
                      ))}
                    </div>
                    <div className="pt-12 flex flex-col sm:flex-row items-center justify-between gap-12 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Detectado</p>
                        <span className="text-5xl font-bold text-slate-900 leading-none">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</span>
                      </div>
                      <button type="submit" className="w-full sm:w-auto premium-red-gradient text-white px-12 py-6 rounded-3xl font-bold text-[12px] uppercase tracking-widest flex items-center justify-center gap-5 transition-transform hover:scale-105 active:scale-95 shadow-2xl shadow-red-900/20">
                        Confirmar e Atualizar <ChevronRight size={22} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-20 pb-8 pt-8 border-t border-slate-100 flex items-center justify-center gap-4">
           <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Powered by</span>
           <motion.img 
            src={LOGO_URL} 
            alt="RedMaxx Logo" 
            className="h-6 w-auto object-contain opacity-40 filter grayscale hover:grayscale-0 hover:opacity-100 transition-all" 
          />
        </footer>
      </main>

      {/* MENU MOBILE COMPACTO */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] z-50">
        <nav className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[2rem] px-2 py-1.5 flex items-center justify-around shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
          {[
            { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
            { id: 'history', label: 'Ciclos', icon: Calendar },
            { id: 'new', label: 'Add', icon: Plus }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex items-center gap-2 px-4 py-2.5 rounded-[1.5rem] transition-all duration-400 ${activeTab === item.id ? 'bg-red-900 text-white shadow-lg' : 'text-slate-400'}`}>
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {activeTab === item.id && <span className="text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* MODAL DE AUTENTICAÇÃO */}
      <AnimatePresence>
        {isAuthOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-12 sm:p-16 text-center shadow-[0_40px_100px_rgba(0,0,0,0.5)] max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 premium-red-gradient" />
              
              <div className="mb-10 inline-flex p-6 rounded-3xl bg-slate-50 border border-slate-100 text-red-700 shadow-inner">
                 <ShieldAlert size={48} strokeWidth={1.5} />
              </div>

              <h3 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Autorização Necessária</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-12">
                COMANDO: <span className="text-slate-900">{pendingAction?.label}</span>
              </p>

              <div className="space-y-8">
                <div className="relative group">
                  <div className={`absolute inset-0 bg-red-600/10 rounded-2xl blur-xl opacity-0 transition-opacity duration-500 group-focus-within:opacity-100`} />
                  <div className="relative bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center px-6 transition-all focus-within:border-red-600/30 group">
                    <KeyRound size={20} className="text-slate-300 mr-4" />
                    <input 
                      type="password" 
                      placeholder="••••••••••••"
                      autoFocus
                      value={authInput}
                      onChange={(e) => setAuthInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmAuthorization()}
                      className="w-full bg-transparent py-5 text-xl font-bold text-slate-900 outline-none placeholder:text-slate-200 tracking-[0.2em]"
                    />
                  </div>
                  {authError && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-[9px] font-bold uppercase tracking-widest mt-4">
                      ACESSO NEGADO: CÓDIGO INVÁLIDO
                    </motion.p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => { setIsAuthOpen(false); setPendingAction(null); }}
                    className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Abortar
                  </button>
                  <button 
                    onClick={confirmAuthorization}
                    className="flex-[2] py-5 rounded-2xl premium-red-gradient text-white font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:scale-[1.02] transition-all"
                  >
                    Validar Comando
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-8">
            <div className="bg-white rounded-[3rem] p-14 text-center shadow-[0_30px_100px_rgba(0,0,0,0.3)] max-w-sm w-full">
              <div className="relative mb-10">
                <Loader2 className="w-16 h-16 text-red-700 animate-spin mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-100 rounded-full" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Extraindo Dados</h3>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Analisando imagem com inteligência artificial de alto desempenho</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
