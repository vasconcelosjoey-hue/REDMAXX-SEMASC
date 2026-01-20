
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
// Logo branca para fundos escuros (sidebar)
const LOGO_URL_WHITE = "https://firebasestorage.googleapis.com/v0/b/redmaxx-semasc.firebasestorage.app/o/CANVA%20RAPIDO.png?alt=media&token=d572d2d1-e949-4156-a4bf-5c9c5cab9d12";
// Logo colorida para rodapé e documentos
const LOGO_URL_COLORED = "https://firebasestorage.googleapis.com/v0/b/redmaxx-semasc.firebasestorage.app/o/RELAT%C3%93RIO%20SEMASC.png?alt=media&token=5d3040e8-2104-4f8d-9c32-6de168cf5dff";
const AUTH_PASSWORD = "semascmanaus123";

const MiniStatusCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode; onEdit?: () => void }> = ({ label, value, color, icon, onEdit }) => (
  <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300 relative group/card">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white shadow-sm shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-black text-black uppercase tracking-wider mb-0.5 truncate">{label}</p>
      <p className="text-xl font-black text-black leading-none">{value.toLocaleString('pt-BR')}</p>
    </div>
    <button 
      onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
      className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 transition-all opacity-0 group-hover/card:opacity-100"
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

  // Estados de Segurança
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ fn: () => void; label: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'history') {
      setExpandedYears([]);
    }
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
    <div className="flex flex-col h-full py-6">
      <div className="mb-10 flex justify-center px-4">
        <motion.img 
          animate={{ y: [0, -2, 0] }} 
          transition={{ duration: 4, repeat: Infinity }} 
          src={LOGO_URL_WHITE} 
          alt="Logo" 
          className="h-16 w-auto object-contain" 
        />
      </div>
      <nav className="space-y-2 flex-1 pt-4">
        {[ { id: 'dashboard', label: 'Monitoramento', icon: LayoutDashboard }, { id: 'history', label: 'Ciclos Ativos', icon: Calendar }, { id: 'new', label: 'Lançamento', icon: Plus }, { id: 'reports', label: 'Relatórios', icon: FileText } ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all ${activeTab === item.id ? 'bg-white text-red-900 shadow-md font-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-[14px] tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-white/10">
        <button onClick={() => requestAuthorization(`Fechar Ciclo: ${currentMonth.monthName}`, closeCycleAndAdvance)} className="w-full py-4 rounded-xl bg-white text-red-900 font-black text-[12px] shadow-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50">
          <Zap size={14} fill="currentColor" /> Fechar Ciclo Mensal
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] text-[14px]">
      <style>{`
        @media print { body * { visibility: hidden; } #printable-report, #printable-report * { visibility: visible; } #printable-report { position: absolute; left: 0; top: 0; width: 100%; height: auto; padding: 40px; } @page { margin: 1cm; } }
        body { zoom: 1.0; }
      `}</style>
      
      <AnimatePresence>{isInitializing && <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center p-8 overflow-hidden"><motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-10"><img src={LOGO_URL_WHITE} alt="Logo" className="h-40 w-auto relative z-10" /></motion.div><div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full overflow-hidden relative"><motion.div initial={{ width: 0 }} animate={{ width: `${initProgress}%` }} className="absolute inset-y-0 left-0 premium-red-gradient" /></div><p className="mt-6 text-slate-500 font-black text-[11px] uppercase tracking-[0.4em] flex items-center gap-2"><Zap size={14} className="text-red-600" /> Sincronizando Sistemas</p></motion.div>}</AnimatePresence>

      <aside className="hidden md:flex w-64 premium-red-gradient flex-col p-5 sticky top-0 h-screen z-30 shadow-xl shrink-0">{sidebarContent}</aside>

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header (Heading): Sem a logo duplicada aqui, apenas o título */}
        <header className="premium-red-gradient px-8 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-5">
            <h2 className="text-2xl font-black text-white tracking-tight leading-none uppercase">
              {activeTab === 'dashboard' ? currentMonth.monthName : activeTab === 'history' ? 'Consolidado' : activeTab === 'reports' ? 'Relatórios' : 'Lançamento'}
            </h2>
          </div>
          <div className="flex items-center gap-5">
             <div className="text-right">
               <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Base Atual</p>
               <p className="text-2xl font-black text-white leading-none">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</p>
             </div>
             <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-white"><Calendar size={22} /></div>
          </div>
        </header>

        <div className="p-6 sm:p-8 lg:p-10 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm xl:col-span-1 flex flex-col">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-black mb-8">Estatísticas da Competência</h3>
                    <div className="grid grid-cols-1 gap-4 mb-8">
                      <MiniStatusCard label="Recebidas" value={currentMonth.enviado} color="bg-red-700" icon={<MessageSquare/>} />
                      <MiniStatusCard label="Inválidos" value={currentMonth.naoWhatsapp} color="bg-slate-800" icon={<PhoneOff/>} />
                      <MiniStatusCard label="Sem Número" value={currentMonth.semNumero} color="bg-slate-500" icon={<UserMinus/>} />
                      <MiniStatusCard label="Pendente" value={currentMonth.paraEnviar} color="bg-slate-300" icon={<SendHorizontal/>} />
                    </div>
                    <div className="h-[220px] relative">
                      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">{pieData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} stroke="none" />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-[11px] font-black text-black uppercase tracking-widest">Taxa</span><span className="text-3xl font-black text-black">{currentMonth.taxaSucesso}%</span></div>
                    </div>
                  </div>
                  <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm xl:col-span-3 flex flex-col h-[550px]">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-black mb-10">Desempenho Histórico de Envios</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%"><AreaChart data={[...history].concat([currentMonth])}><defs><linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#991B1B" stopOpacity={0.1}/><stop offset="95%" stopColor="#991B1B" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 12, fontWeight: 900}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 12, fontWeight: 900}} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 6px 16px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: 'bold' }} /><Area type="monotone" dataKey="enviado" stroke="#991B1B" strokeWidth={5} fill="url(#colorArea)" dot={{ r: 5, fill: '#991B1B', stroke: '#fff', strokeWidth: 2.5 }} /></AreaChart></ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <StatCard label="TAXA GLOBAL" value={`${taxaTotalProcessamento}%`} icon={<ShieldCheck />} gradient="from-slate-800 to-slate-900" glowColor="rgba(0,0,0,0.02)" subtitle="Eficiência Acumulada" />
                  <StatCard label="BASE ATIVA" value={TOTAL_BASE_IDENTIFICADA.toLocaleString('pt-BR')} icon={<Users />} gradient="from-red-800 to-red-950" glowColor="rgba(153,27,27,0.02)" subtitle="Total Identificado" />
                </div>
                <div className="space-y-6">
                  {Object.entries(groupedCalendarView).sort((a,b) => parseInt(b[0])-parseInt(a[0])).map(([year, months]) => (
                    <div key={year} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <button 
                        onClick={() => setExpandedYears(prev => prev.includes(parseInt(year)) ? prev.filter(y => y !== parseInt(year)) : [...prev, parseInt(year)])}
                        className="w-full px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <h3 className="text-base font-black text-black uppercase tracking-widest">CICLO {year}</h3>
                        <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedYears.includes(parseInt(year)) ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {expandedYears.includes(parseInt(year)) && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100">
                            <div className="overflow-x-auto"><table className="w-full text-left text-[14px]">
                              <thead><tr className="bg-slate-50/30 text-[11px] font-black text-black uppercase tracking-widest"><th className="px-10 py-4.5">Mês de Referência</th><th className="px-10 py-4.5 text-center">Processados</th><th className="px-10 py-4.5 text-center">Eficiência</th><th className="px-10 py-4.5 text-center">Status</th></tr></thead>
                              <tbody className="divide-y divide-slate-50">{(months as any[]).map((item) => (<tr key={item.monthName} className={`hover:bg-slate-50/30 ${item.status==='Aguardando'?'opacity-30':''}`}><td className="px-10 py-4.5 font-black text-black">{item.monthName}</td><td className="px-10 py-4.5 text-center font-bold text-black">{item.enviado || 0}</td><td className="px-10 py-4.5 text-center font-bold text-black">{item.taxaSucesso}%</td><td className="px-10 py-4.5 text-center"><div className="flex items-center justify-center gap-4"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.status==='Consolidado'?'bg-slate-100 text-slate-800 border-slate-200':'bg-red-50 text-red-800 border-red-100'}`}>{item.status}</span>{item.status==='Consolidado' && <button onClick={()=>requestAuthorization(`Excluir ${item.monthName}`, ()=>deleteHistoryItem(item.id))} className="p-1 text-slate-400 hover:text-red-700"><Trash2 size={20}/></button>}</div></td></tr>))}</tbody>
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
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black mb-1 flex items-center gap-4 uppercase tracking-tight">Lançamento Operacional</h3>
                      <p className="text-slate-400 text-[12px] font-bold uppercase tracking-widest">Atualização manual de registros da competência ativa</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl"><Wand2 size={32} className="text-red-500" /></div>
                  </div>
                  <div className="p-10 space-y-10">
                    <form onSubmit={(e)=>{e.preventDefault();setActiveTab('dashboard');}} className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        {[{id:'enviado',label:'Recebidas'},{id:'naoWhatsapp',label:'Inválidos'},{id:'semNumero',label:'Sem Número'},{id:'paraEnviar',label:'Pendente'}].map((f)=>(
                          <div key={f.id} className="space-y-2">
                            <label className="text-[11px] font-black text-black uppercase tracking-widest">{f.label}</label>
                            <input 
                              type="number" 
                              value={(currentMonth as any)[f.id]} 
                              onChange={e=>updateCurrentData({[f.id]:e.target.value})} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xl font-black text-black outline-none focus:border-red-600 focus:bg-white transition-all shadow-inner" 
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-3 pt-2">
                        <label className="text-[11px] font-black text-black uppercase tracking-widest flex items-center gap-3"><AlignLeft size={18}/> Conclusão Técnica do Relatório</label>
                        <textarea 
                          value={currentMonth.customText || ''} 
                          onChange={(e)=>updateCurrentData({customText: e.target.value})}
                          placeholder="Digite aqui as observações que serão impressas na conclusão do relatório PDF..."
                          className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-[15px] font-bold text-black outline-none focus:border-red-600 focus:bg-white transition-all resize-none shadow-inner"
                        />
                      </div>

                      <div className="pt-8 flex items-center justify-between gap-8 border-t border-slate-100">
                        <div>
                          <p className="text-[11px] font-black text-black uppercase tracking-widest">Base Consolidada Mensal</p>
                          <span className="text-4xl font-black text-black leading-none">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</span>
                        </div>
                        <button type="submit" className="premium-red-gradient text-white px-10 py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center gap-3 shadow-lg hover:brightness-110">
                          Atualizar Registro <ChevronRight size={22}/>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
                <h3 className="text-base font-black text-black mb-10 flex items-center gap-4 uppercase tracking-tight"><FileText size={24} className="text-red-700"/> Central de Relatórios Consolidados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {history.map((item)=>(
                    <div key={item.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-red-200 transition-all group flex flex-col shadow-sm relative">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="p-3 bg-white rounded-xl text-red-700 shadow-sm shrink-0"><FileText size={22}/></div>
                        <div className="min-w-0 flex-1">
                          {/* Removido truncate para exibir nome completo */}
                          <h4 className="text-[16px] font-black text-black leading-tight break-words">{item.monthName}</h4>
                          <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">{item.enviado} envios com sucesso</p>
                        </div>
                        <button 
                          onClick={()=>requestAuthorization(`Excluir Relatório: ${item.monthName}`, ()=>deleteHistoryItem(item.id))}
                          className="p-1.5 text-slate-400 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                      <button 
                        onClick={()=>setReportToPreview(item)} 
                        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 hover:text-white transition-all mt-auto"
                      >
                        Gerar Documento PDF
                      </button>
                    </div>
                  ))}
                  {/* Card especial para o mês atual (em andamento) */}
                  <div className="p-6 bg-red-50/30 rounded-2xl border border-red-100 transition-all group flex flex-col shadow-sm">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="p-3 bg-white rounded-xl text-red-700 shadow-sm shrink-0"><FileText size={22}/></div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[16px] font-black text-black leading-tight break-words">{currentMonth.monthName}</h4>
                          <p className="text-[11px] font-bold text-red-600 uppercase mt-1">Ciclo em aberto</p>
                        </div>
                      </div>
                      <button 
                        onClick={()=>setReportToPreview(currentMonth)} 
                        className="w-full py-3 bg-white border border-red-200 rounded-xl text-[11px] font-black text-red-800 uppercase tracking-widest hover:bg-red-700 hover:text-white transition-all mt-auto"
                      >
                        Prévia do Documento
                      </button>
                    </div>
                  {history.length===0 && !currentMonth && <div className="col-span-full py-24 text-center text-[13px] text-slate-400 font-black uppercase tracking-widest">Nenhum relatório disponível</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="pb-6 pt-6 border-t border-slate-200 flex items-center justify-center gap-4 opacity-70">
           <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Powered by</span>
           <img src={LOGO_URL_COLORED} alt="Logo Colorida" className="h-8 w-auto object-contain" />
        </footer>
      </main>

      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-50">
        <nav className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-full px-3 py-3 flex items-center justify-around shadow-2xl">
          {[{id:'dashboard',i:LayoutDashboard},{id:'history',i:Calendar},{id:'new',i:Plus},{id:'reports',i:FileText}].map((item)=>(
            <button key={item.id} onClick={()=>setActiveTab(item.id as any)} className={`p-3.5 rounded-full transition-all ${activeTab===item.id?'bg-red-900 text-white shadow-md': 'text-slate-400'}`}>
              <item.i size={24} strokeWidth={activeTab===item.id?3:2}/>
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence>
        {isAuthOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm w-full border-t-8 border-red-700 flex flex-col items-center">
              <ShieldAlert size={48} className="text-red-700 mb-6"/>
              <h3 className="text-2xl font-black text-black mb-2 tracking-tight uppercase">Segurança Operacional</h3>
              <p className="text-black text-[11px] font-black uppercase tracking-widest mb-10">CONFIRMAR: {pendingAction?.label}</p>
              <div className="w-full space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 flex items-center transition-all focus-within:border-red-600/30">
                  <KeyRound size={22} className="text-slate-400 mr-4"/><input type="password" placeholder="••••••••" autoFocus value={authInput} onChange={(e)=>setAuthInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&confirmAuthorization()} className="w-full bg-transparent py-5 text-xl font-black text-black outline-none tracking-widest" />
                </div>
                {authError && <p className="text-red-600 text-[11px] font-black uppercase tracking-widest">Código de Acesso Incorreto</p>}
                <div className="flex gap-4">
                  <button onClick={()=>setIsAuthOpen(false)} className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-800 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                  <button onClick={confirmAuthorization} className="flex-[2] py-4 rounded-xl premium-red-gradient text-white font-black text-[11px] uppercase tracking-widest shadow-lg hover:brightness-110 transition-all">Autorizar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-xs w-full">
              <Loader2 className="w-16 h-16 text-red-700 animate-spin mx-auto mb-6"/>
              <h3 className="text-xl font-black text-black mb-2 uppercase tracking-tight">Processando</h3>
              <p className="text-black text-[11px] font-black uppercase tracking-widest">Sincronizando Banco de Dados...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {reportToPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[150] overflow-y-auto p-4 sm:p-12 flex justify-center">
             <div className="max-w-[850px] w-full bg-white shadow-2xl rounded-sm p-0 flex flex-col relative self-start">
                <div className="sticky top-0 z-50 bg-slate-100 p-5 border-b border-slate-200 flex items-center justify-between print:hidden">
                   <div className="flex items-center gap-4">
                      <button onClick={() => window.print()} className="bg-red-700 text-white px-6 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest flex items-center gap-3 shadow hover:bg-red-800 transition-all"><Printer size={16} /> Imprimir / Baixar PDF</button>
                   </div>
                   <button onClick={() => setReportToPreview(null)} className="p-2 text-slate-400 hover:text-red-700 transition-all"><X size={28} /></button>
                </div>
                {/* PDF CONTENT com logo colorida */}
                <div id="printable-report" className="bg-white p-16 sm:p-24 text-slate-900 font-sans relative overflow-hidden min-h-[1150px]">
                   <div className="flex justify-start mb-16"><img src={LOGO_URL_COLORED} alt="Logo Documento" className="h-32 w-auto object-contain" /></div>
                   <div className="space-y-10 text-base">
                      <h1 className="font-extrabold text-3xl text-black border-b-2 border-slate-900 pb-3 mb-10 uppercase tracking-tight">Relatório Consolidado de Impacto ({reportToPreview.monthName})</h1>
                      
                      <div className="grid grid-cols-1 gap-5 text-lg">
                        <p className="leading-tight"><strong>Operação:</strong> Notificação de Beneficiários Bolsa Família via API RedMaxx</p>
                        <p><strong>Órgão Demandante:</strong> Secretaria Municipal de Assistência Social (SEMASC)</p>
                        <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                      </div>

                      <div className="pt-10 border-t border-slate-100 space-y-5">
                        <h2 className="font-extrabold text-black uppercase tracking-tight text-xl">Contexto e Justificativa</h2>
                        <p className="text-justify leading-relaxed text-slate-700">A Secretaria Municipal de Assistência Social (SEMASC) executa o compromisso de garantir a fluidez da informação aos beneficiários do programa Bolsa Família. Este relatório documenta a eficácia do canal automatizado RedMaxx na entrega de avisos oficiais, assegurando que o público-alvo seja notificado com agilidade, transparência e segurança institucional.</p>
                      </div>

                      <div className="pt-10 border-t border-slate-100 space-y-6">
                        <h2 className="font-extrabold text-black uppercase tracking-tight text-xl">Métricas de Operação Consolidada</h2>
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                           <ul className="space-y-4">
                              <li className="flex justify-between border-b border-slate-200 pb-4"><span>Público Identificado na Base:</span> <strong className="text-black text-xl">{reportToPreview.totalProcessado}</strong></li>
                              <li className="flex justify-between border-b border-slate-200 pb-4 text-red-900 font-bold"><span>Entregas Concluídas com Sucesso:</span> <strong className="font-black text-xl">{reportToPreview.enviado}</strong></li>
                              <li className="flex justify-between pt-2"><span>Índice de Efetividade da Campanha:</span> <strong className="text-black text-xl font-black">{reportToPreview.taxaSucesso}%</strong></li>
                           </ul>
                        </div>
                      </div>

                      <div className="pt-10 border-t border-slate-200 space-y-6">
                        <h2 className="font-extrabold text-black uppercase tracking-tight text-xl">Parecer Técnico e Conclusão</h2>
                        <div className="text-justify leading-relaxed text-slate-900 font-medium space-y-6">
                           <p className="font-semibold text-xl leading-snug text-black">A utilização da infraestrutura tecnológica da plataforma RedMaxx assegurou a integridade e a rastreabilidade total do processo de comunicação. Foram atingidos {reportToPreview.enviado} beneficiários diretos durante este ciclo operacional.</p>
                           {reportToPreview.customText && (
                             <div className="p-8 bg-red-50 border-l-8 border-red-700 rounded-r-2xl text-slate-800 font-bold italic leading-relaxed shadow-sm text-lg">
                                "{reportToPreview.customText}"
                             </div>
                           )}
                           <p className="pt-6 text-sm text-slate-500 italic uppercase tracking-widest font-bold">Relatório autenticado automaticamente para fins de auditoria e prestação de contas governamentais.</p>
                        </div>
                      </div>
                   </div>
                   <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t pt-10 border-slate-200 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                      <div className="space-y-1"><p className="text-slate-800 text-xs">Manaus/AM - Sede Administrativa</p><p>R. Rio Purús, 458 | Vieiralves</p></div>
                      <div className="space-y-1 text-right"><p className="text-slate-800 text-xs">São Paulo/SP - Escritório Regional</p><p>Av. Berrini, 1140 | Monções</p></div>
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
