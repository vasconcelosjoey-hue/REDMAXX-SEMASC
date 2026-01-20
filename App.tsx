
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Plus, Trash2, Search, Users, LayoutDashboard,
  Loader2, ChevronRight, ClipboardPaste,
  ShieldCheck, Zap, Lock, Play, Calendar, ChevronDown, Wand2, MessageSquare, PhoneOff, UserMinus, SendHorizontal,
  ShieldAlert, KeyRound, Pencil, Image as ImageIcon, CheckCircle2, FileText, Download, Printer, X
} from 'lucide-react';
import { MonthlyStats } from './types.ts';
import { extractDataFromImage } from './services/geminiService.ts';
import StatCard from './components/StatCard.tsx';
import './firebase.ts';

const CHART_PALETTE = ['#991B1B', '#1E293B', '#64748B', '#94A3B8'];
const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/redmaxx-semasc.firebasestorage.app/o/RELAT%C3%93RIO%20SEMASC.png?alt=media&token=335f2853-0e57-48a2-81e9-2b4b077cde0a";
const AUTH_PASSWORD = "semascmanaus123";

const MiniStatusCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode; onEdit?: () => void }> = ({ label, value, color, icon, onEdit }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300 relative group/card">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white shadow-md shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black text-black uppercase tracking-wider mb-0.5 truncate">{label}</p>
      <p className="text-xl font-black text-black leading-none">{value.toLocaleString('pt-BR')}</p>
    </div>
    <button 
      onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
      className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-all opacity-0 group-hover/card:opacity-100"
    >
      <Pencil size={14} />
    </button>
  </div>
);

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [history, setHistory] = useState<MonthlyStats[]>([]);
  const [expandedYears, setExpandedYears] = useState<number[]>([2026, 2025]);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [lastProcessedType, setLastProcessedType] = useState<'text' | 'image' | null>(null);
  
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'new' | 'reports'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportToPreview, setReportToPreview] = useState<MonthlyStats | null>(null);

  // Estados de Segurança
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ fn: () => void; label: string } | null>(null);

  const TOTAL_BASE_IDENTIFICADA = 7439;
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
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
    
    setCurrentMonth({ 
      ...updated, 
      enviado, 
      naoWhatsapp, 
      semNumero, 
      paraEnviar, 
      totalProcessado: total, 
      taxaSucesso: taxa 
    });
  };

  const closeCycleAndAdvance = () => {
    const closedMonth = { ...currentMonth, id: Date.now().toString(), isClosed: true };
    setHistory(prev => [...prev, closedMonth]);

    const monthsArr = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const [month, year] = currentMonth.monthName.split('/');
    let nextIdx = monthsArr.indexOf(month) + 1;
    let nextYear = parseInt(year);
    if (nextIdx > 11) {
      nextIdx = 0;
      nextYear++;
    }
    const nextMonthName = `${monthsArr[nextIdx]}/${nextYear}`;

    setCurrentMonth({
      id: 'current',
      monthName: nextMonthName,
      enviado: 0,
      naoWhatsapp: 0,
      semNumero: 0,
      paraEnviar: 0,
      totalProcessado: 0,
      taxaSucesso: 0,
      isClosed: false
    });
    setSmartPasteText("");
    setLastProcessedType(null);
    setActiveTab('dashboard');
  };

  const handleSmartPasteChange = (text: string) => {
    setSmartPasteText(text);
    const parseNumber = (pattern: RegExp) => {
      const match = text.match(pattern);
      return match ? parseInt(match[1].replace(/\D/g, '')) : null;
    };
    
    const enviado = parseNumber(/(?:enviado|sucesso|enviados|recebidas|mensagens recebidas)[:\s-]*([\d.,]+)/i);
    const naoWhatsapp = parseNumber(/(?:não.*whatsapp|inválidos|invalido|contatos não são whatsapp)[:\s-]*([\d.,]+)/i);
    const semNumero = parseNumber(/(?:sem.*número|cadastros.*sem|omisso|contatos sem número)[:\s-]*([\d.,]+)/i);
    const paraEnviar = parseNumber(/(?:para.*enviar|pendente|fila|para enviar)[:\s-]*([\d.,]+)/i);
    
    if (enviado !== null || naoWhatsapp !== null || semNumero !== null || paraEnviar !== null) {
      setLastProcessedType('text');
      updateCurrentData({
        enviado: enviado !== null ? enviado : 0,
        naoWhatsapp: naoWhatsapp !== null ? naoWhatsapp : 0,
        semNumero: semNumero !== null ? semNumero : 0,
        paraEnviar: paraEnviar !== null ? paraEnviar : 0
      });
    }
  };

  const processImageFile = async (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const extracted = await extractDataFromImage(base64);
        setLastProcessedType('image');
        updateCurrentData({
          enviado: extracted.enviado || 0,
          naoWhatsapp: extracted.naoWhatsapp || 0,
          semNumero: extracted.semNumero || 0,
          paraEnviar: extracted.paraEnviar || 0
        });
        setActiveTab('new');
        setSmartPasteText("");
      } catch (error) { 
        console.error("Erro no processamento de imagem:", error); 
      } finally { 
        setIsProcessing(false); 
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePasteGlobal = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
          }
        }
      }
    };
    window.addEventListener('paste', handlePasteGlobal);
    return () => window.removeEventListener('paste', handlePasteGlobal);
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
          { id: 'history', label: 'Ciclos Ativos', icon: Calendar },
          { id: 'new', label: 'Lançamento', icon: Plus },
          { id: 'reports', label: 'Relatórios', icon: FileText }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${activeTab === item.id ? 'bg-white text-red-900 shadow-xl font-black translate-x-1' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <item.icon size={18} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-6 border-t border-white/10">
        <button 
          onClick={() => requestAuthorization(`Fechar Ciclo: ${currentMonth.monthName}`, closeCycleAndAdvance)}
          className="w-full py-5 rounded-xl bg-white text-red-900 font-black text-[10px] shadow-lg hover:bg-red-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Zap size={12} fill="currentColor" /> Encerrar e Avançar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; height: auto; padding: 40px; }
          @page { margin: 1cm; }
        }
      `}</style>
      
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
              className="mt-6 text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3"
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
            <p className="text-[10px] text-black font-black uppercase tracking-[0.25em] mb-2">PLATAFORMA SEMASC V9.0</p>
            <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-none">
              {activeTab === 'dashboard' ? currentMonth.monthName : 
               activeTab === 'history' ? 'Consolidado' : 
               activeTab === 'reports' ? 'Centro de Relatórios' : 'Lançamento'}
            </h2>
          </div>
          
          <div className="flex items-center gap-5 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm pr-8 shrink-0 relative group h-20">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                {activeTab === 'history' ? <Users size={20} /> : activeTab === 'reports' ? <FileText size={20} /> : <Calendar size={20} />}
             </div>
             <div>
               <p className="text-[9px] font-black text-black uppercase tracking-widest leading-none mb-1.5">
                  {activeTab === 'history' ? 'Base Total Ativa' : `Base de ${currentMonth.monthName.split('/')[0]}`}
               </p>
               <p className="text-2xl font-black text-black leading-none">
                  {activeTab === 'history' ? TOTAL_BASE_IDENTIFICADA.toLocaleString('pt-BR') : currentMonth.totalProcessado.toLocaleString('pt-BR')}
               </p>
             </div>
             {(activeTab === 'dashboard' || activeTab === 'new') && (
               <button 
                onClick={() => requestAuthorization("Editar Base Mensal", () => setActiveTab('new'))}
                className="absolute -right-2 -top-2 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-400 hover:text-red-700 transition-all opacity-0 group-hover:opacity-100"
               >
                 <Pencil size={12} />
               </button>
             )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-12">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm xl:col-span-1 flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-black mb-10">Distribuição Mensal</h3>
                  <div className="grid grid-cols-1 gap-4 mb-12">
                    <MiniStatusCard label="Mensagens Recebidas" value={currentMonth.enviado} color="bg-red-700" icon={<MessageSquare/>} onEdit={() => requestAuthorization("Editar Mensagens Recebidas", () => setActiveTab('new'))} />
                    <MiniStatusCard label="Contatos Não São WhatsApp" value={currentMonth.naoWhatsapp} color="bg-slate-800" icon={<PhoneOff/>} onEdit={() => requestAuthorization("Editar Contatos Inválidos", () => setActiveTab('new'))} />
                    <MiniStatusCard label="Contatos Sem Número" value={currentMonth.semNumero} color="bg-slate-500" icon={<UserMinus/>} onEdit={() => requestAuthorization("Editar Contatos Sem Número", () => setActiveTab('new'))} />
                    <MiniStatusCard label="Para Enviar" value={currentMonth.paraEnviar} color="bg-slate-300" icon={<SendHorizontal/>} onEdit={() => requestAuthorization("Editar Fila de Envio", () => setActiveTab('new'))} />
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
                       <span className="text-[9px] font-black text-black uppercase tracking-widest mb-1">Taxa</span>
                       <span className="text-3xl font-black text-black">{currentMonth.taxaSucesso}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm xl:col-span-2 flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-black mb-10">Evolução Histórica</h3>
                  <div className="flex-1 min-h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...history].concat([currentMonth])}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#991B1B" stopOpacity={0.15}/>
                             <stop offset="95%" stopColor="#991B1B" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 11, fontWeight: 900}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 11, fontWeight: 900}} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#000' }} />
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
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 px-8 max-w-xl">
                 <Search className="text-slate-400" size={20} />
                 <input type="text" placeholder="Buscar competência..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-black font-black text-lg placeholder:text-slate-300" />
              </div>
              <div className="space-y-10">
                {Object.entries(groupedCalendarView).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([year, months]) => (
                  <div key={year} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                    <button onClick={() => setExpandedYears(prev => prev.includes(parseInt(year)) ? prev.filter(y => y !== parseInt(year)) : [...prev, parseInt(year)])} className="w-full flex items-center justify-between px-10 py-8 hover:bg-slate-50 transition-colors">
                      <h3 className="text-2xl font-black text-black tracking-tight uppercase tracking-widest">CICLO {year}</h3>
                      <ChevronDown size={28} className={`text-slate-400 transition-transform ${expandedYears.includes(parseInt(year)) ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {expandedYears.includes(parseInt(year)) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-slate-50/50">
                                  <th className="px-10 py-6 text-[10px] font-black text-black uppercase tracking-widest">Competência</th>
                                  <th className="px-10 py-6 text-[10px] font-black text-black uppercase tracking-widest text-center">Processados</th>
                                  <th className="px-10 py-6 text-[10px] font-black text-black uppercase tracking-widest text-center">Eficiência</th>
                                  <th className="px-10 py-6 text-[10px] font-black text-black uppercase tracking-widest text-center">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(months as any[]).map((item: any) => (
                                  <tr key={item.monthName} className={`transition-colors ${item.status === 'Aguardando' ? 'opacity-25' : 'hover:bg-slate-50/50'}`}>
                                    <td className="px-10 py-6 font-black text-black text-base">{item.monthName}</td>
                                    <td className="px-10 py-6 text-center font-black text-black text-lg">{item.enviado || 0}</td>
                                    <td className="px-10 py-6 text-center font-black text-black text-base">{item.taxaSucesso}%</td>
                                    <td className="px-10 py-6 text-center">
                                       <div className="flex items-center justify-center gap-4">
                                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${item.status === 'Consolidado' ? 'bg-slate-100 text-slate-900 border-slate-200' : item.status === 'Em andamento' ? 'bg-red-50 text-red-900 border-red-100' : 'text-slate-300 border-transparent'}`}>
                                            {item.status}
                                          </span>
                                          {item.status === 'Consolidado' && (
                                            <button 
                                              onClick={() => requestAuthorization(`Excluir ${item.monthName}`, () => deleteHistoryItem(item.id))}
                                              className="p-2.5 rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 transition-all"
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
            <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-6 sm:p-8 text-white relative">
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-3">Lançamento Inteligente <Wand2 className="text-red-500" size={20} /></h3>
                  <p className="text-slate-300 text-[11px] font-bold leading-relaxed max-w-xl">
                    Sincronize os dados colando relatórios ou capturas de tela. Valores serão substituídos automaticamente.
                  </p>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-3 relative">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-3">
                          <ClipboardPaste size={16} /> Zona de Colagem (Ctrl+V)
                       </label>
                       {lastProcessedType && (
                         <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> {lastProcessedType === 'image' ? 'Imagem' : 'Texto'} OK
                         </motion.span>
                       )}
                    </div>
                    
                    <div className="relative group">
                      <textarea 
                        ref={pasteAreaRef}
                        placeholder="Cole o relatório de texto aqui ou apenas Ctrl+V se tiver copiado uma imagem de status..." 
                        value={smartPasteText} 
                        onChange={(e) => handleSmartPasteChange(e.target.value)} 
                        className="w-full h-28 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-xs font-black text-black outline-none focus:border-red-400 focus:bg-white transition-all resize-none placeholder:text-slate-400" 
                      />
                    </div>
                  </div>

                  <form 
                    onSubmit={(e) => { 
                      e.preventDefault(); 
                      requestAuthorization("Confirmar Atualização", () => setActiveTab('dashboard')); 
                    }} 
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: 'enviado', label: 'Recebidas', color: 'focus:border-red-600' }, 
                        { id: 'naoWhatsapp', label: 'Não WhatsApp', color: 'focus:border-slate-900' }, 
                        { id: 'semNumero', label: 'Sem Número', color: 'focus:border-slate-600' }, 
                        { id: 'paraEnviar', label: 'Para Enviar', color: 'focus:border-blue-600' }
                      ].map((field) => (
                        <div key={field.id} className="space-y-1.5">
                          <label className="text-[9px] font-black text-black uppercase tracking-widest ml-1">{field.label}</label>
                          <input 
                            type="number" 
                            value={(currentMonth as any)[field.id]} 
                            onChange={e => updateCurrentData({ [field.id]: e.target.value })} 
                            className={`w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xl font-black text-black outline-none transition-all ${field.color}`} 
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100">
                      <div className="text-center sm:text-left">
                        <p className="text-[9px] font-black text-black uppercase tracking-widest mb-1">Total Consolidado</p>
                        <span className="text-3xl font-black text-black leading-none">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</span>
                      </div>
                      <button type="submit" className="w-full sm:w-auto premium-red-gradient text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-red-900/10">
                        Confirmar e Atualizar <ChevronRight size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                 <h3 className="text-xl font-black text-black mb-8 flex items-center gap-3"><FileText className="text-red-700"/> Relatórios Disponíveis</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((item) => (
                      <div key={item.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-red-200 transition-all group">
                         <div className="flex items-center justify-between mb-6">
                            <div className="p-3 bg-white rounded-xl text-red-700 shadow-sm">
                               <FileText size={24} />
                            </div>
                            <span className="text-[10px] font-black text-black uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Finalizado</span>
                         </div>
                         <h4 className="text-xl font-black text-black mb-1">{item.monthName}</h4>
                         <p className="text-[10px] font-bold text-slate-500 uppercase mb-8">Processado: {item.enviado} contatos</p>
                         <button 
                          onClick={() => setReportToPreview(item)}
                          className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 hover:text-white hover:border-red-700 transition-all flex items-center justify-center gap-2"
                         >
                           <Download size={14} /> Baixar Relatório
                         </button>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[11px]">
                         Nenhum relatório consolidado encontrado.
                      </div>
                    )}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-12 pb-8 pt-8 border-t border-slate-200 flex items-center justify-center gap-4">
           <span className="text-black text-[10px] font-black uppercase tracking-[0.2em]">Powered by</span>
           <motion.img 
            src={LOGO_URL} 
            alt="RedMaxx Logo" 
            className="h-6 w-auto object-contain filter hover:brightness-110 transition-all" 
          />
        </footer>
      </main>

      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] z-50">
        <nav className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[2rem] px-2 py-1.5 flex items-center justify-around shadow-[0_15px_35px_rgba(0,0,0,0.15)]">
          {[
            { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
            { id: 'history', label: 'Ciclos', icon: Calendar },
            { id: 'new', label: 'Add', icon: Plus }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex items-center gap-2 px-4 py-2.5 rounded-[1.5rem] transition-all duration-400 ${activeTab === item.id ? 'bg-red-900 text-white shadow-lg' : 'text-slate-500'}`}>
              <item.icon size={18} strokeWidth={activeTab === item.id ? 3 : 2} />
              {activeTab === item.id && <span className="text-[10px] font-black uppercase tracking-tight whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence>
        {isAuthOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-8">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-12 sm:p-16 text-center shadow-[0_40px_100px_rgba(0,0,0,0.5)] max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 premium-red-gradient" />
              <div className="mb-10 inline-flex p-6 rounded-3xl bg-slate-50 border border-slate-200 text-red-700 shadow-inner">
                 <ShieldAlert size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-black text-black mb-2 tracking-tight">Autorização Necessária</h3>
              <p className="text-black text-[10px] font-black uppercase tracking-[0.2em] mb-12">
                COMANDO: <span className="text-red-800">{pendingAction?.label}</span>
              </p>
              <div className="space-y-8">
                <div className="relative group">
                  <div className={`absolute inset-0 bg-red-600/10 rounded-2xl blur-xl opacity-0 transition-opacity duration-500 group-focus-within:opacity-100`} />
                  <div className="relative bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center px-6 transition-all focus-within:border-red-600/30 group">
                    <KeyRound size={20} className="text-slate-400 mr-4" />
                    <input 
                      type="password" 
                      placeholder="••••••••••••"
                      autoFocus
                      value={authInput}
                      onChange={(e) => setAuthInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmAuthorization()}
                      className="w-full bg-transparent py-5 text-xl font-black text-black outline-none placeholder:text-slate-300 tracking-[0.2em]"
                    />
                  </div>
                  {authError && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-[10px] font-black uppercase tracking-widest mt-4">
                      ACESSO NEGADO: CÓDIGO INVÁLIDO
                    </motion.p>
                  )}
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => { setIsAuthOpen(false); setPendingAction(null); }}
                    className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Abortar
                  </button>
                  <button 
                    onClick={confirmAuthorization}
                    className="flex-[2] py-5 rounded-2xl premium-red-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:scale-[1.02] transition-all"
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
              <h3 className="text-2xl font-black text-black mb-3 tracking-tight">Extraindo Dados</h3>
              <p className="text-black text-[11px] font-black uppercase tracking-widest leading-relaxed">Analisando imagem com inteligência artificial de alto desempenho</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {reportToPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[150] overflow-y-auto p-4 sm:p-10 flex justify-center">
             <div className="max-w-[800px] w-full bg-white shadow-2xl rounded-sm p-0 flex flex-col relative self-start">
                <div className="sticky top-0 z-50 bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between print:hidden">
                   <div className="flex items-center gap-4">
                      <button onClick={() => window.print()} className="bg-red-700 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-red-800 transition-all">
                        <Printer size={14} /> Imprimir / Salvar PDF
                      </button>
                      <p className="text-[10px] font-bold text-slate-500 uppercase hidden sm:block">Padrão: Projeto de Comunicação Bolsa Família ({reportToPreview.monthName})</p>
                   </div>
                   <button onClick={() => setReportToPreview(null)} className="p-2 text-slate-400 hover:text-red-700 transition-all">
                      <X size={24} />
                   </button>
                </div>

                <div id="printable-report" className="bg-white p-12 sm:p-20 text-slate-800 font-sans leading-relaxed relative overflow-hidden min-h-[1100px]">
                   <div className="flex justify-start mb-16">
                      <img src={LOGO_URL} alt="Logo" className="h-24 w-auto object-contain" />
                   </div>
                   <div className="space-y-8">
                      <p className="font-bold text-lg">RedMaxx® Projeto de Comunicação Bolsa Família ({reportToPreview.monthName})</p>
                      <div className="space-y-1">
                        <p className="font-bold">Título do Projeto: <span className="font-normal">API de Comunicação RedMaxx aplicada à notificação de contemplados do Bolsa Família – {reportToPreview.monthName}</span></p>
                      </div>
                      <p className="font-bold">Solicitante: <span className="font-normal">SEMASC</span></p>
                      <p className="font-bold">Data: <span className="font-normal">Manaus, em {new Date().toLocaleDateString('pt-BR')}</span></p>
                      <div className="space-y-4">
                        <p className="font-bold">Contexto e Desafio:</p>
                        <p className="text-sm text-justify">
                          A Secretaria Municipal de Assistência Social (SEMASC) tem como missão ampliar o alcance das informações referentes ao programa Bolsa Família, garantindo que o maior número de contemplados seja notificado de forma clara e tempestiva. O desafio central deste projeto é assegurar a máxima cobertura do público-alvo, fortalecendo a comunicação institucional e garantindo que os beneficiários recebam, de forma ágil e confiável, os avisos relacionados ao benefício.
                        </p>
                      </div>
                      <div className="space-y-4 pt-4">
                        <p className="font-bold">Execução via API RedMaxx de Comunicação</p>
                        <p className="font-bold">Operação de Envio</p>
                        <ul className="list-disc ml-8">
                           <li>Processados: <strong>{reportToPreview.totalProcessado} contatos</strong></li>
                        </ul>
                      </div>
                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <p className="font-bold">Consolidado Geral</p>
                        <p>• Total previsto : <strong>{reportToPreview.totalProcessado} contatos</strong></p>
                        <p>• Total processados com API RedMaxx: <strong>{reportToPreview.enviado} contatos atingidos</strong></p>
                        <p>• Taxa de entrega geral: <strong>{reportToPreview.taxaSucesso}% concluído</strong></p>
                      </div>
                      <div className="space-y-4 pt-6 border-t border-slate-200">
                        <p className="font-bold">Conclusão</p>
                        <p className="text-sm text-justify">
                          A utilização da <strong>API de Comunicação RedMaxx</strong> garantiu confiabilidade e consistência em todo o processo, com tempos médios estáveis e finalização bem-sucedida de todas as operações. Foram atingidos {reportToPreview.enviado} beneficiários, correspondendo a {reportToPreview.taxaSucesso}% da base prevista.
                        </p>
                        <p className="text-sm text-justify">
                          Essa iniciativa reforça o papel estratégico da RedMaxx como fornecedora de soluções de comunicação inteligente para o setor público, assegurando eficiência, rastreabilidade e escalabilidade para futuras campanhas sociais.
                        </p>
                      </div>
                   </div>
                   <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t pt-8 border-slate-100 text-[9px] text-slate-400">
                      <div className="space-y-1 uppercase font-bold tracking-wider">
                         <p className="text-slate-600">Manaus – AM - Matriz</p>
                         <p>R. Rio Purús, 458, Cj.Vieiralves | N. Sra. das Graças</p>
                         <p>CEP 69053-050 • Manaus/AM • (92) 98415-5929</p>
                         <p>marcio.lins@redmaxx.com.br</p>
                         <p>CNPJ: 31.291.580/0001-47</p>
                      </div>
                      <div className="space-y-1 uppercase font-bold tracking-wider text-right">
                         <p className="text-slate-600">São Paulo - SP - Filial</p>
                         <p>Av. Engenheiro Luiz Carlos Berrini, 1140</p>
                         <p>7° Andar - Sala 201/202 | Cidade Monções</p>
                         <p>CEP 04571-000 • São Paulo/SP</p>
                         <p>Telefone: (11) 2391-0597</p>
                      </div>
                   </div>
                   <div className="absolute bottom-[-100px] right-[-100px] opacity-[0.03] pointer-events-none rotate-12">
                      <img src={LOGO_URL} alt="" className="w-[600px] grayscale" />
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
