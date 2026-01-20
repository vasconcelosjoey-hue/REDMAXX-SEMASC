
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
  ShieldAlert, KeyRound, Pencil, Image as ImageIcon, CheckCircle2, FileText, Download, Printer, X, AlignLeft
} from 'lucide-react';
import { MonthlyStats } from './types.ts';
import StatCard from './components/StatCard.tsx';
import './firebase.ts';

const CHART_PALETTE = ['#991B1B', '#1E293B', '#64748B', '#94A3B8'];
const LOGO_URL_WHITE = "https://firebasestorage.googleapis.com/v0/b/redmaxx-semasc.firebasestorage.app/o/CANVA%20RAPIDO.png?alt=media&token=d572d2d1-e949-4156-a4bf-5c9c5cab9d12";
const LOGO_URL_COLORED = "https://firebasestorage.googleapis.com/v0/b/redmaxx-semasc.firebasestorage.app/o/RELAT%C3%93RIO%20SEMASC.png?alt=media&token=5d3040e8-2104-4f8d-9c32-6de168cf5dff";
const AUTH_PASSWORD = "semascmanaus123";

const MiniStatusCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode; onEdit?: () => void }> = ({ label, value, color, icon, onEdit }) => (
  <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300 relative group/card flex-1 min-w-[240px] md:min-w-[260px]">
    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${color} flex items-center justify-center text-white shadow-sm shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-black uppercase tracking-wider mb-0.5 leading-tight break-words">{label}</p>
      <p className="text-xl md:text-2xl font-black text-black leading-none">{value.toLocaleString('pt-BR')}</p>
    </div>
    <button 
      onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
      className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 transition-all opacity-0 group-hover/card:opacity-100 shrink-0"
    >
      <Pencil size={14} />
    </button>
  </div>
);

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [history, setHistory] = useState<MonthlyStats[]>([]);
  const [expandedYears, setExpandedYears] = useState<number[]>([]);
  
  const [currentMonth, setCurrentMonth] = useState<MonthlyStats>({
    id: 'current',
    monthName: 'Janeiro/2026',
    enviado: 330,
    naoWhatsapp: 195,
    semNumero: 11,
    paraEnviar: 65,
    totalProcessado: 601,
    taxaSucesso: 54.91,
    isClosed: false,
    customText: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'new' | 'reports'>('dashboard');
  const [reportToPreview, setReportToPreview] = useState<MonthlyStats | null>(null);

  const TOTAL_BASE_IDENTIFICADA = 7439;

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ fn: () => void; label: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'history') setExpandedYears([]);
  }, [activeTab]);

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
      setHistory([
        { id: 'sep25', monthName: 'Setembro/2025', enviado: 840, naoWhatsapp: 350, semNumero: 100, paraEnviar: 37, totalProcessado: 1327, taxaSucesso: 63.31, isClosed: true, customText: 'Campanha realizada com sucesso.' },
        { id: 'oct25', monthName: 'Outubro/2025', enviado: 652, naoWhatsapp: 200, semNumero: 50, paraEnviar: 23, totalProcessado: 925, taxaSucesso: 70.48, isClosed: true, customText: '' },
        { id: 'nov25', monthName: 'Novembro/2025', enviado: 450, naoWhatsapp: 180, semNumero: 80, paraEnviar: 21, totalProcessado: 731, taxaSucesso: 61.57, isClosed: true, customText: '' },
        { id: 'dec25', monthName: 'Dezembro/2025', enviado: 1064, naoWhatsapp: 3500, semNumero: 4103, paraEnviar: 1040, totalProcessado: 5707, taxaSucesso: 18.64, isClosed: true, customText: '' },
      ]);
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
      if (pendingAction) pendingAction.fn();
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

  const closeCycleAndAdvance = () => {
    const closedMonth = { ...currentMonth, id: Date.now().toString(), isClosed: true };
    setHistory(prev => [...prev, closedMonth]);
    const monthsArr = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const [month, year] = currentMonth.monthName.split('/');
    let nextIdx = monthsArr.indexOf(month) + 1;
    let nextYear = parseInt(year);
    if (nextIdx > 11) { nextIdx = 0; nextYear++; }
    setCurrentMonth({ 
      id: 'current', 
      monthName: `${monthsArr[nextIdx]}/${nextYear}`, 
      enviado: 0, 
      naoWhatsapp: 0, 
      semNumero: 0, 
      paraEnviar: 0, 
      totalProcessado: 0, 
      taxaSucesso: 0, 
      isClosed: false,
      customText: ''
    });
    setActiveTab('dashboard');
  };

  const groupedCalendarView = useMemo(() => {
    const monthsArr = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const [curMonthName, curYearStr] = currentMonth.monthName.split('/');
    const curYear = parseInt(curYearStr);
    const curMonthIdx = monthsArr.indexOf(curMonthName);
    const res: Record<number, any[]> = {};
    [2025, 2026, 2027].forEach(year => {
      const ym = monthsArr.map((m, idx) => {
        const name = `${m}/${year}`;
        const hm = history.find(h => h.monthName === name);
        if (year === 2025 && idx < 8) return null;
        if (hm) return { ...hm, status: 'Consolidado' };
        if (name === currentMonth.monthName) return { ...currentMonth, status: 'Em andamento' };
        if (year > curYear || (year === curYear && idx > curMonthIdx)) return { monthName: name, status: 'Aguardando', enviado: 0, totalProcessado: 0, taxaSucesso: 0 };
        return null;
      }).filter(x => x !== null);
      if (ym.length > 0) res[year] = ym;
    });
    return res;
  }, [history, currentMonth]);

  const totalBaseProcessada = history.reduce((acc, curr) => acc + curr.enviado, 0) + currentMonth.enviado;
  const taxaTotalProcessamento = Number(((totalBaseProcessada / TOTAL_BASE_IDENTIFICADA) * 100).toFixed(2));
  const pieData = [ { name: 'Recebidas', value: currentMonth.enviado }, { name: 'Não WhatsApp', value: currentMonth.naoWhatsapp }, { name: 'Sem Número', value: currentMonth.semNumero }, { name: 'Para Enviar', value: currentMonth.paraEnviar } ];

  const sidebarContent = (
    <div className="flex flex-col h-full py-8">
      <div className="mb-10 flex justify-center px-4">
        <motion.img 
          animate={{ y: [0, -3, 0] }} 
          transition={{ duration: 4, repeat: Infinity }} 
          src={LOGO_URL_WHITE} 
          alt="Logo" 
          className="h-32 md:h-40 w-auto object-contain" 
        />
      </div>
      <nav className="space-y-2 flex-1 pt-4 px-4">
        {[ { id: 'dashboard', label: 'Monitoramento', icon: LayoutDashboard }, { id: 'history', label: 'Ciclos Ativos', icon: Calendar }, { id: 'new', label: 'Lançamento', icon: Plus }, { id: 'reports', label: 'Relatórios', icon: FileText } ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-white text-red-900 shadow-xl font-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <item.icon size={18} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-[13px] tracking-tight font-extrabold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-white/10 px-4">
        <button onClick={() => requestAuthorization(`Fechar Ciclo: ${currentMonth.monthName}`, closeCycleAndAdvance)} className="w-full py-4 rounded-xl bg-white text-red-900 font-black text-[11px] shadow-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 transition-all">
          <Zap size={14} fill="currentColor" /> Fechar Ciclo Mensal
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] text-[13px] md:text-[14px]">
      <style>{`
        @media print { body * { visibility: hidden; } #printable-report, #printable-report * { visibility: visible; } #printable-report { position: absolute; left: 0; top: 0; width: 100%; height: auto; padding: 40px; } @page { margin: 1cm; } }
        body { zoom: 1.0; }
        .no-wrap { white-space: nowrap; }
      `}</style>
      
      <AnimatePresence>{isInitializing && <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center p-8 overflow-hidden"><motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-10"><img src={LOGO_URL_WHITE} alt="Logo" className="h-40 w-auto relative z-10" /></motion.div><div className="w-full max-w-sm h-1.5 bg-white/5 rounded-full overflow-hidden relative"><motion.div initial={{ width: 0 }} animate={{ width: `${initProgress}%` }} className="absolute inset-y-0 left-0 premium-red-gradient" /></div><p className="mt-6 text-slate-500 font-black text-[11px] uppercase tracking-[0.4em] flex items-center gap-2"><Zap size={14} className="text-red-600" /> Sincronizando RedMaxx</p></motion.div>}</AnimatePresence>

      <aside className="hidden md:flex w-64 premium-red-gradient flex-col sticky top-0 h-screen z-30 shadow-2xl shrink-0">{sidebarContent}</aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="premium-red-gradient px-6 md:px-10 py-4 md:py-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter leading-none uppercase break-words max-w-[200px] md:max-w-none">
              {activeTab === 'dashboard' ? currentMonth.monthName : activeTab === 'history' ? 'Consolidado' : activeTab === 'reports' ? 'Relatórios' : 'Lançamento'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
               <p className="text-[9px] md:text-[10px] font-black text-white/50 uppercase tracking-[0.15em] leading-none mb-1">Base Atual</p>
               <p className="text-xl md:text-2xl font-black text-white leading-none tracking-tighter no-wrap">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</p>
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 lg:p-10 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-[11px] md:text-[12px] font-black uppercase tracking-widest text-black mb-6 md:mb-8 border-l-4 border-red-700 pl-3 md:pl-4">Métricas da Competência em Tempo Real</h3>
                  <div className="flex flex-wrap gap-4 md:gap-6 mb-8 md:mb-10">
                    <MiniStatusCard label="Mensagens Recebidas" value={currentMonth.enviado} color="bg-red-700" icon={<MessageSquare/>} />
                    <MiniStatusCard label="Contatos Inválidos" value={currentMonth.naoWhatsapp} color="bg-slate-800" icon={<PhoneOff/>} />
                    <MiniStatusCard label="Cadastros Sem Número" value={currentMonth.semNumero} color="bg-slate-500" icon={<UserMinus/>} />
                    <MiniStatusCard label="Mensagens Pendentes" value={currentMonth.paraEnviar} color="bg-slate-300" icon={<SendHorizontal/>} />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-slate-50 p-6 md:p-8 rounded-xl md:rounded-2xl flex flex-col items-center justify-center h-[300px] md:h-[350px]">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 md:mb-6">Distribuição Operacional</h4>
                      <div className="w-full h-full relative">
                        <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={60} outerRadius={100} paddingAngle={6} dataKey="value">{pieData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} stroke="none" />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">Efetividade</span><span className="text-2xl md:text-3xl font-black text-black">{currentMonth.taxaSucesso}%</span></div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 md:p-8 rounded-xl md:rounded-2xl flex flex-col h-[300px] md:h-[350px]">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 md:mb-6">Curva de Competência</h4>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%"><AreaChart data={[...history].concat([currentMonth])}><defs><linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#991B1B" stopOpacity={0.15}/><stop offset="95%" stopColor="#991B1B" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: 800}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: 800}} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} /><Area type="monotone" dataKey="enviado" stroke="#991B1B" strokeWidth={4} fill="url(#colorArea)" dot={{ r: 5, fill: '#991B1B', stroke: '#fff', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <StatCard label="TAXA GLOBAL" value={`${taxaTotalProcessamento}%`} icon={<ShieldCheck />} gradient="from-slate-800 to-slate-900" glowColor="rgba(0,0,0,0.02)" subtitle="Eficiência Consolidada" />
                  <StatCard label="BASE IDENTIFICADA" value={TOTAL_BASE_IDENTIFICADA.toLocaleString('pt-BR')} icon={<Users />} gradient="from-red-800 to-red-950" glowColor="rgba(153,27,27,0.02)" subtitle="Total Cadastrado" />
                </div>
                <div className="space-y-6 md:space-y-8">
                  {Object.entries(groupedCalendarView).sort((a,b) => parseInt(b[0])-parseInt(a[0])).map(([year, months]) => (
                    <div key={year} className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <button 
                        onClick={() => setExpandedYears(prev => prev.includes(parseInt(year)) ? prev.filter(y => y !== parseInt(year)) : [...prev, parseInt(year)])}
                        className="w-full px-6 md:px-10 py-5 md:py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <h3 className="text-sm md:text-base font-black text-black uppercase tracking-[0.15em]">CICLO OPERACIONAL {year}</h3>
                        <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedYears.includes(parseInt(year)) ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {expandedYears.includes(parseInt(year)) && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100">
                            <div className="overflow-x-auto"><table className="w-full text-left text-[13px] md:text-[14px]">
                              <thead><tr className="bg-slate-50/30 text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest"><th className="px-6 md:px-10 py-4 md:py-5">Referência</th><th className="px-6 md:px-10 py-4 md:py-5 text-center">Volume</th><th className="px-6 md:px-10 py-4 md:py-5 text-center">Êxito</th><th className="px-6 md:px-10 py-4 md:py-5 text-center">Status</th></tr></thead>
                              <tbody className="divide-y divide-slate-100">{(months as any[]).map((item) => (<tr key={item.monthName} className={`hover:bg-slate-50/30 ${item.status==='Aguardando'?'opacity-30':''}`}><td className="px-6 md:px-10 py-4 md:py-5 font-black text-black no-wrap">{item.monthName}</td><td className="px-6 md:px-10 py-4 md:py-5 text-center font-bold text-slate-700 no-wrap">{item.enviado || 0}</td><td className="px-6 md:px-10 py-4 md:py-5 text-center font-bold text-slate-700 no-wrap">{item.taxaSucesso}%</td><td className="px-6 md:px-10 py-4 md:py-5 text-center"><div className="flex items-center justify-center gap-4"><span className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${item.status==='Consolidado'?'bg-slate-100 text-slate-800 border-slate-200':'bg-red-50 text-red-800 border-red-100'} no-wrap`}>{item.status}</span>{item.status==='Consolidado' && <button onClick={()=>requestAuthorization(`Excluir: ${item.monthName}`, ()=>deleteHistoryItem(item.id))} className="p-1.5 text-slate-300 hover:text-red-700 transition-all"><Trash2 size={18}/></button>}</div></td></tr>))}</tbody>
                            </table></div>
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
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 p-6 md:p-8 text-white flex items-center justify-between">
                    <div>
                      <h3 className="text-lg md:text-xl font-black mb-1 flex items-center gap-3 md:gap-4 uppercase tracking-tighter">Lançamento de Registro</h3>
                      <p className="text-slate-400 text-[11px] md:text-[12px] font-bold uppercase tracking-widest">Atualização manual de métricas</p>
                    </div>
                    <div className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl"><Wand2 size={32} className="text-red-500" /></div>
                  </div>
                  <div className="p-6 md:p-10 space-y-8 md:space-y-10">
                    <form onSubmit={(e)=>{e.preventDefault();setActiveTab('dashboard');}} className="space-y-6 md:space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {[{id:'enviado',label:'Recebidas'},{id:'naoWhatsapp',label:'Inválidos'},{id:'semNumero',label:'Sem Número'},{id:'paraEnviar',label:'Fila Pendente'}].map((f)=>(
                          <div key={f.id} className="space-y-1.5 md:space-y-2">
                            <label className="text-[10px] md:text-[11px] font-black text-black uppercase tracking-widest pl-1">{f.label}</label>
                            <input 
                              type="number" 
                              value={(currentMonth as any)[f.id]} 
                              onChange={e=>updateCurrentData({[f.id]:e.target.value})} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-xl md:text-2xl font-black text-black outline-none focus:border-red-600 focus:bg-white transition-all shadow-inner" 
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2 md:space-y-3 pt-2">
                        <label className="text-[10px] md:text-[11px] font-black text-black uppercase tracking-widest flex items-center gap-2.5 pl-1"><AlignLeft size={16}/> Observações do Relatório</label>
                        <textarea 
                          value={currentMonth.customText || ''} 
                          onChange={(e)=>updateCurrentData({customText: e.target.value})}
                          placeholder="Conclusão técnica customizada para o PDF..."
                          className="w-full h-32 md:h-40 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl p-5 md:p-6 text-[14px] md:text-[15px] font-bold text-black outline-none focus:border-red-600 focus:bg-white transition-all resize-none shadow-inner"
                        />
                      </div>

                      <div className="pt-6 md:pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Consolidado</p>
                          <span className="text-3xl md:text-4xl font-black text-black leading-none tracking-tighter no-wrap">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</span>
                        </div>
                        <button type="submit" className="w-full md:w-auto premium-red-gradient text-white px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[11px] md:text-[12px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:brightness-110 transition-all hover:scale-[1.02]">
                          Salvar Registro <ChevronRight size={20}/>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[40px] border border-slate-200 shadow-sm min-h-[500px]">
                <h3 className="text-lg md:text-xl font-black text-black mb-8 md:mb-10 flex items-center gap-3 md:gap-4 uppercase tracking-tighter"><FileText size={24} className="text-red-700"/> Central de Relatórios</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {history.map((item)=>(
                    <div key={item.id} className="p-6 md:p-7 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 hover:border-red-200 transition-all group flex flex-col shadow-sm relative">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="p-3 bg-white rounded-xl text-red-700 shadow-sm shrink-0"><FileText size={22}/></div>
                        <div className="min-w-0 flex-1 pr-8">
                          <h4 className="text-[16px] md:text-[18px] font-black text-black leading-tight no-wrap">{item.monthName}</h4>
                          <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase mt-1 break-words leading-tight">{item.enviado} êxitos</p>
                        </div>
                        <button 
                          onClick={()=>requestAuthorization(`Excluir Relatório: ${item.monthName}`, ()=>deleteHistoryItem(item.id))}
                          className="p-1.5 text-slate-300 hover:text-red-700 transition-all absolute top-6 md:top-7 right-6 md:right-7 z-10"
                        >
                          <Trash2 size={20}/>
                        </button>
                      </div>
                      <button 
                        onClick={()=>setReportToPreview(item)} 
                        className="w-full py-3 md:py-3.5 bg-white border border-slate-200 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-red-700 hover:text-white transition-all mt-auto shadow-sm"
                      >
                        Gerar PDF
                      </button>
                    </div>
                  ))}
                  <div className="p-6 md:p-7 bg-red-50/20 rounded-2xl md:rounded-3xl border border-red-100 transition-all group flex flex-col shadow-sm relative">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="p-3 bg-white rounded-xl text-red-700 shadow-sm shrink-0"><FileText size={22}/></div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[16px] md:text-[18px] font-black text-black leading-tight no-wrap">{currentMonth.monthName}</h4>
                          <p className="text-[10px] md:text-[11px] font-bold text-red-600 uppercase mt-1 break-words leading-tight">Ciclo Aberto</p>
                        </div>
                      </div>
                      <button 
                        onClick={()=>setReportToPreview(currentMonth)} 
                        className="w-full py-3 md:py-3.5 bg-white border border-red-200 rounded-xl text-[10px] md:text-[11px] font-black text-red-800 uppercase tracking-widest hover:bg-red-700 hover:text-white transition-all mt-auto shadow-sm"
                      >
                        Visualizar Prévia
                      </button>
                    </div>
                </div>
                {history.length===0 && !currentMonth && (
                  <div className="py-24 md:py-32 text-center text-[13px] text-slate-400 font-black uppercase tracking-widest">Nenhum registro encontrado</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="pb-8 pt-6 md:pt-10 border-t border-slate-200 flex items-center justify-center gap-4 md:gap-6">
           <span className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] no-wrap">Powered by</span>
           <img src={LOGO_URL_COLORED} alt="RedMaxx" className="h-8 md:h-10 w-auto object-contain hover:scale-105 transition-transform" />
        </footer>
      </main>

      {/* Menu Mobile - Ajustado para telas menores */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-50">
        <nav className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl px-3 py-3 flex items-center justify-around shadow-2xl">
          {[{id:'dashboard',i:LayoutDashboard},{id:'history',i:Calendar},{id:'new',i:Plus},{id:'reports',i:FileText}].map((item)=>(
            <button key={item.id} onClick={()=>setActiveTab(item.id as any)} className={`p-3 rounded-2xl transition-all ${activeTab===item.id?'bg-red-900 text-white shadow-xl scale-110': 'text-slate-400'}`}>
              <item.i size={22} strokeWidth={activeTab===item.id?3:2}/>
            </button>
          ))}
        </nav>
      </div>

      {/* Modais com fontes ajustadas */}
      <AnimatePresence>
        {isAuthOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl p-8 md:p-10 text-center shadow-2xl max-w-sm w-full border-t-[8px] border-red-700 flex flex-col items-center">
              <ShieldAlert size={50} className="text-red-700 mb-6"/>
              <h3 className="text-xl md:text-2xl font-black text-black mb-2 tracking-tighter uppercase">Segurança</h3>
              <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-8">AUTORIZAR: {pendingAction?.label}</p>
              <div className="w-full space-y-6">
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 flex items-center transition-all focus-within:border-red-600 focus-within:bg-white">
                  <KeyRound size={22} className="text-slate-400 mr-4"/><input type="password" placeholder="••••" autoFocus value={authInput} onChange={(e)=>setAuthInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&confirmAuthorization()} className="w-full bg-transparent py-4 text-xl font-black text-black outline-none tracking-[0.4em]" />
                </div>
                {authError && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse">Código Inválido</p>}
                <div className="flex gap-4">
                  <button onClick={()=>setIsAuthOpen(false)} className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-800 font-black text-[11px] uppercase tracking-widest">Sair</button>
                  <button onClick={confirmAuthorization} className="flex-[2] py-4 rounded-xl premium-red-gradient text-white font-black text-[11px] uppercase tracking-widest shadow-xl">Desbloquear</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visualizador de Relatório com responsividade no conteúdo */}
      <AnimatePresence>
        {reportToPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[150] overflow-y-auto p-4 md:p-10 flex justify-center">
             <div className="max-w-[850px] w-full bg-white shadow-2xl rounded-sm p-0 flex flex-col relative self-start">
                <div className="sticky top-0 z-50 bg-slate-100 p-4 md:p-5 border-b border-slate-200 flex items-center justify-between print:hidden">
                   <div className="flex items-center gap-4">
                      <button onClick={() => window.print()} className="bg-red-700 text-white px-6 md:px-7 py-2.5 rounded-xl font-black text-[11px] md:text-[12px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-red-800 transition-all"><Printer size={18} /> Exportar PDF</button>
                   </div>
                   <button onClick={() => setReportToPreview(null)} className="p-2 text-slate-400 hover:text-red-700 transition-all"><X size={28} /></button>
                </div>
                <div id="printable-report" className="bg-white p-12 md:p-20 text-slate-900 font-sans relative overflow-hidden min-h-[1100px]">
                   <div className="flex justify-start mb-14"><img src={LOGO_URL_COLORED} alt="Logo Documento" className="h-28 md:h-36 w-auto object-contain" /></div>
                   <div className="space-y-10 text-base">
                      <h1 className="font-extrabold text-3xl text-black border-b-2 border-slate-900 pb-4 mb-10 uppercase tracking-tighter">Relatório de Impacto Operacional ({reportToPreview.monthName})</h1>
                      
                      <div className="grid grid-cols-1 gap-5 text-lg">
                        <p className="leading-tight"><strong>Operação:</strong> Notificação Bolsa Família via API RedMaxx</p>
                        <p><strong>Órgão Demandante:</strong> Secretaria Municipal de Assistência Social (SEMASC)</p>
                        <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                      </div>

                      <div className="pt-8 border-t border-slate-100 space-y-5">
                        <h2 className="font-extrabold text-black uppercase tracking-tight text-xl">Contexto e Objetivos</h2>
                        <p className="text-justify leading-relaxed text-slate-700">A Secretaria Municipal de Assistência Social (SEMASC) reafirma seu compromisso com a transparência na comunicação. Este documento formaliza a entrega de notificações vitais via infraestrutura RedMaxx, garantindo segurança e agilidade no fluxo oficial de informações aos cidadãos.</p>
                      </div>

                      <div className="pt-8 border-t border-slate-100 space-y-6">
                        <h2 className="font-extrabold text-black uppercase tracking-tight text-xl">Indicadores Consolidados</h2>
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                           <ul className="space-y-4">
                              <li className="flex justify-between border-b border-slate-200 pb-4"><span>Total Identificado na Base:</span> <strong className="text-black text-xl">{reportToPreview.totalProcessado}</strong></li>
                              <li className="flex justify-between border-b border-slate-200 pb-4 text-red-900 font-bold"><span>Entregas com Sucesso (API):</span> <strong className="font-black text-xl">{reportToPreview.enviado}</strong></li>
                              <li className="flex justify-between pt-2"><span>Índice de Efetividade Global:</span> <strong className="text-black text-2xl font-black">{reportToPreview.taxaSucesso}%</strong></li>
                           </ul>
                        </div>
                      </div>

                      <div className="pt-8 border-t-2 border-slate-200 space-y-6">
                        <h2 className="font-extrabold text-black uppercase tracking-tight text-xl">Parecer e Conclusão</h2>
                        <div className="text-justify leading-relaxed text-slate-900 font-medium space-y-6">
                           <p className="font-semibold text-xl leading-tight text-black">A operação assegurou integridade total no fluxo. Ao final deste ciclo, foram atingidos de forma direta {reportToPreview.enviado} beneficiários cadastrados.</p>
                           {reportToPreview.customText && (
                             <div className="p-8 bg-red-50 border-l-[8px] border-red-700 rounded-r-2xl text-slate-800 font-bold italic leading-relaxed shadow-lg text-lg">
                                "{reportToPreview.customText}"
                             </div>
                           )}
                           <p className="pt-6 text-sm text-slate-400 italic uppercase tracking-[0.15em] font-black">Documento autenticado digitalmente para prestação de contas governamental.</p>
                        </div>
                      </div>
                   </div>
                   <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t-2 pt-10 border-slate-200 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                      <div className="space-y-1"><p className="text-slate-800 text-xs no-wrap">Manaus/AM - Hub Tecnológico</p><p className="no-wrap">R. Rio Purús, 458 | Vieiralves</p></div>
                      <div className="space-y-1 text-right"><p className="text-slate-800 text-xs no-wrap">São Paulo/SP - Regional</p><p className="no-wrap">Av. Berrini, 1140 | Monções</p></div>
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
