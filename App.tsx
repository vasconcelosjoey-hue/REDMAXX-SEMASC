
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
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300 relative group/card">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shadow-md shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { size: 14 })}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] font-black text-black uppercase tracking-wider mb-0.5 truncate">{label}</p>
      <p className="text-lg font-black text-black leading-none">{value.toLocaleString('pt-BR')}</p>
    </div>
    <button 
      onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
      className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-all opacity-0 group-hover/card:opacity-100"
    >
      <Pencil size={12} />
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

  const TOTAL_BASE_IDENTIFICADA = 7439;
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);

  // Estados de Segurança
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ fn: () => void; label: string } | null>(null);

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
        { id: 'sep25', monthName: 'Setembro/2025', enviado: 840, naoWhatsapp: 350, semNumero: 100, paraEnviar: 37, totalProcessado: 1327, taxaSucesso: 63.31, isClosed: true },
        { id: 'oct25', monthName: 'Outubro/2025', enviado: 652, naoWhatsapp: 200, semNumero: 50, paraEnviar: 23, totalProcessado: 925, taxaSucesso: 70.48, isClosed: true },
        { id: 'nov25', monthName: 'Novembro/2025', enviado: 450, naoWhatsapp: 180, semNumero: 80, paraEnviar: 21, totalProcessado: 731, taxaSucesso: 61.57, isClosed: true },
        { id: 'dec25', monthName: 'Dezembro/2025', enviado: 1064, naoWhatsapp: 3500, semNumero: 4103, paraEnviar: 1040, totalProcessado: 5707, taxaSucesso: 18.64, isClosed: true },
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
    setCurrentMonth({ id: 'current', monthName: `${monthsArr[nextIdx]}/${nextYear}`, enviado: 0, naoWhatsapp: 0, semNumero: 0, paraEnviar: 0, totalProcessado: 0, taxaSucesso: 0, isClosed: false });
    setSmartPasteText(""); setActiveTab('dashboard');
  };

  const handleSmartPasteChange = (text: string) => {
    setSmartPasteText(text);
    const parseNumber = (p: RegExp) => { const m = text.match(p); return m ? parseInt(m[1].replace(/\D/g, '')) : null; };
    const e = parseNumber(/(?:enviado|sucesso|enviados|recebidas|mensagens recebidas)[:\s-]*([\d.,]+)/i);
    const nw = parseNumber(/(?:não.*whatsapp|inválidos|invalido|contatos não são whatsapp)[:\s-]*([\d.,]+)/i);
    const sn = parseNumber(/(?:sem.*número|cadastros.*sem|omisso|contatos sem número)[:\s-]*([\d.,]+)/i);
    const pe = parseNumber(/(?:para.*enviar|pendente|fila|para enviar)[:\s-]*([\d.,]+)/i);
    if (e !== null || nw !== null || sn !== null || pe !== null) {
      setLastProcessedType('text');
      updateCurrentData({ enviado: e ?? 0, naoWhatsapp: nw ?? 0, semNumero: sn ?? 0, paraEnviar: pe ?? 0 });
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
        updateCurrentData({ enviado: extracted.enviado || 0, naoWhatsapp: extracted.naoWhatsapp || 0, semNumero: extracted.semNumero || 0, paraEnviar: extracted.paraEnviar || 0 });
        setActiveTab('new');
        setSmartPasteText("");
      } catch (err) { console.error(err); } finally { setIsProcessing(false); }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const hp = (e: ClipboardEvent) => {
      const its = e.clipboardData?.items;
      if (!its) return;
      for (let i = 0; i < its.length; i++) {
        if (its[i].type.indexOf('image') !== -1) {
          const f = its[i].getAsFile();
          if (f) processImageFile(f);
        }
      }
    };
    window.addEventListener('paste', hp);
    return () => window.removeEventListener('paste', hp);
  }, [currentMonth]);

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
    <div className="flex flex-col h-full py-2">
      <div className="relative mb-8 p-1">
        <div className="absolute inset-0 bg-white/98 rounded-3xl transform -rotate-1 shadow-xl border border-white" />
        <div className="relative z-10 flex justify-center py-6 px-2">
          <motion.img animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity }} src={LOGO_URL} alt="Logo" className="h-16 w-auto object-contain filter brightness-110" />
        </div>
      </div>
      <nav className="space-y-1 flex-1">
        {[ { id: 'dashboard', label: 'Monitoramento', icon: LayoutDashboard }, { id: 'history', label: 'Ciclos Ativos', icon: Calendar }, { id: 'new', label: 'Lançamento', icon: Plus }, { id: 'reports', label: 'Relatórios', icon: FileText } ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-white text-red-900 shadow-lg font-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <item.icon size={16} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-xs tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-white/10">
        <button onClick={() => requestAuthorization(`Fechar Ciclo: ${currentMonth.monthName}`, closeCycleAndAdvance)} className="w-full py-3.5 rounded-lg bg-white text-red-900 font-black text-[9px] shadow-lg uppercase tracking-widest flex items-center justify-center gap-2">
          <Zap size={10} fill="currentColor" /> Encerrar e Avançar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      <style>{`@media print { body * { visibility: hidden; } #printable-report, #printable-report * { visibility: visible; } #printable-report { position: absolute; left: 0; top: 0; width: 100%; height: auto; padding: 40px; } @page { margin: 1cm; } }`}</style>
      
      <AnimatePresence>{isInitializing && <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center p-8 overflow-hidden"><motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-12"><div className="absolute inset-0 bg-red-600/20 blur-[100px] rounded-full" /><img src={LOGO_URL} alt="Logo" className="h-40 w-auto relative z-10" /></motion.div><div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden relative"><motion.div initial={{ width: 0 }} animate={{ width: `${initProgress}%` }} className="absolute inset-y-0 left-0 premium-red-gradient" /></div><p className="mt-6 text-slate-500 font-black text-[9px] uppercase tracking-[0.4em] flex items-center gap-3"><Zap size={12} className="text-red-600" /> Sincronizando</p></motion.div>}</AnimatePresence>

      <aside className="hidden md:flex w-52 premium-red-gradient flex-col p-4 sticky top-0 h-screen z-30 shadow-2xl shrink-0">{sidebarContent}</aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 mb-10 md:mb-0">
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[9px] text-black font-black uppercase tracking-[0.2em] mb-1">PLATAFORMA SEMASC V9.0</p>
            <h2 className="text-3xl font-black text-black tracking-tight leading-none">{activeTab === 'dashboard' ? currentMonth.monthName : activeTab === 'history' ? 'Consolidado' : activeTab === 'reports' ? 'Relatórios' : 'Lançamento'}</h2>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm pr-6 shrink-0 relative group h-16">
             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg"><Calendar size={18} /></div>
             <div><p className="text-[8px] font-black text-black uppercase tracking-widest leading-none mb-1">Base de {currentMonth.monthName.split('/')[0]}</p><p className="text-xl font-black text-black leading-none">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</p></div>
             <button onClick={() => setActiveTab('new')} className="absolute -right-1 -top-1 p-1.5 bg-white rounded-full shadow-md border border-slate-200 text-slate-400 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all"><Pencil size={10} /></button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm xl:col-span-1 flex flex-col">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-black mb-6">Distribuição</h3>
                  <div className="grid grid-cols-1 gap-2.5 mb-6">
                    <MiniStatusCard label="Recebidas" value={currentMonth.enviado} color="bg-red-700" icon={<MessageSquare/>} />
                    <MiniStatusCard label="Inválidos" value={currentMonth.naoWhatsapp} color="bg-slate-800" icon={<PhoneOff/>} />
                    <MiniStatusCard label="Sem Número" value={currentMonth.semNumero} color="bg-slate-500" icon={<UserMinus/>} />
                    <MiniStatusCard label="Pendente" value={currentMonth.paraEnviar} color="bg-slate-300" icon={<SendHorizontal/>} />
                  </div>
                  <div className="h-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">{pieData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} stroke="none" />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-[8px] font-black text-black uppercase tracking-widest">Taxa</span><span className="text-xl font-black text-black">{currentMonth.taxaSucesso}%</span></div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm xl:col-span-3 flex flex-col h-[480px]">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-black mb-8">Evolução de Envios</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%"><AreaChart data={[...history].concat([currentMonth])}><defs><linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#991B1B" stopOpacity={0.1}/><stop offset="95%" stopColor="#991B1B" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 10, fontWeight: 900}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 10, fontWeight: 900}} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} /><Area type="monotone" dataKey="enviado" stroke="#991B1B" strokeWidth={4} fill="url(#colorArea)" dot={{ r: 4, fill: '#991B1B', stroke: '#fff', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard label="TAXA GLOBAL" value={`${taxaTotalProcessamento}%`} icon={<ShieldCheck />} gradient="from-slate-800 to-slate-900" glowColor="rgba(0,0,0,0.05)" subtitle="Consolidado" />
                <StatCard label="BASE ATIVA" value={TOTAL_BASE_IDENTIFICADA.toLocaleString('pt-BR')} icon={<Users />} gradient="from-red-800 to-red-950" glowColor="rgba(153,27,27,0.05)" subtitle="Volume Total" />
              </div>
              <div className="space-y-6">
                {Object.entries(groupedCalendarView).sort((a,b) => parseInt(b[0])-parseInt(a[0])).map(([year, months]) => (
                  <div key={year} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between"><h3 className="text-sm font-black text-black uppercase tracking-widest">CICLO {year}</h3><ChevronDown size={18} className="text-slate-400" /></div>
                    <div className="overflow-x-auto"><table className="w-full text-left text-xs">
                      <thead><tr className="bg-slate-50/30 text-[9px] font-black text-black uppercase tracking-widest"><th className="px-6 py-3">Competência</th><th className="px-6 py-3 text-center">Processados</th><th className="px-6 py-3 text-center">Eficiência</th><th className="px-6 py-3 text-center">Ações</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">{(months as any[]).map((item) => (<tr key={item.monthName} className={`hover:bg-slate-50/30 ${item.status==='Aguardando'?'opacity-30':''}`}><td className="px-6 py-3 font-black text-black">{item.monthName}</td><td className="px-6 py-3 text-center font-bold text-black">{item.enviado || 0}</td><td className="px-6 py-3 text-center font-bold text-black">{item.taxaSucesso}%</td><td className="px-6 py-3 text-center"><div className="flex items-center justify-center gap-2"><span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${item.status==='Consolidado'?'bg-slate-100 text-slate-800 border-slate-200':'bg-red-50 text-red-800 border-red-100'}`}>{item.status}</span>{item.status==='Consolidado' && <button onClick={()=>requestAuthorization(`Excluir ${item.monthName}`, ()=>deleteHistoryItem(item.id))} className="p-1 text-slate-400 hover:text-red-700"><Trash2 size={14}/></button>}</div></td></tr>))}</tbody>
                    </table></div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'new' && (
            <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-6 text-white"><h3 className="text-lg font-black mb-1 flex items-center gap-2">Lançamento <Wand2 className="text-red-500" size={16} /></h3><p className="text-slate-400 text-[10px] font-bold">Cole relatórios ou imagens. Valores substituídos automaticamente.</p></div>
                <div className="p-6 space-y-6">
                  <div className="space-y-2 relative"><div className="flex items-center justify-between"><label className="text-[9px] font-black text-black uppercase tracking-widest">Área de Colagem</label>{lastProcessedType && <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{lastProcessedType} OK</span>}</div><textarea ref={pasteAreaRef} placeholder="Ctrl+V aqui..." value={smartPasteText} onChange={(e)=>handleSmartPasteChange(e.target.value)} className="w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-3 text-xs font-black text-black outline-none focus:border-red-400 transition-all resize-none" /></div>
                  <form onSubmit={(e)=>{e.preventDefault();setActiveTab('dashboard');}} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">{[{id:'enviado',label:'Recebidas'},{id:'naoWhatsapp',label:'Inválidos'},{id:'semNumero',label:'Sem Número'},{id:'paraEnviar',label:'Pendente'}].map((f)=>(<div key={f.id} className="space-y-1"><label className="text-[8px] font-black text-black uppercase tracking-widest">{f.label}</label><input type="number" value={(currentMonth as any)[f.id]} onChange={e=>updateCurrentData({[f.id]:e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-lg font-black text-black outline-none focus:border-red-600 transition-all" /></div>))}</div>
                    <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-100"><div><p className="text-[8px] font-black text-black uppercase tracking-widest">Total</p><span className="text-2xl font-black text-black">{currentMonth.totalProcessado.toLocaleString('pt-BR')}</span></div><button type="submit" className="premium-red-gradient text-white px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-lg">Salvar <ChevronRight size={14}/></button></div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><h3 className="text-lg font-black text-black mb-6 flex items-center gap-2"><FileText size={18} className="text-red-700"/> Arquivo de Relatórios</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{history.map((item)=>(<div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-red-200 transition-all group"><div className="flex items-center gap-3 mb-3"><div className="p-2 bg-white rounded-lg text-red-700 shadow-sm"><FileText size={16}/></div><div className="min-w-0"><h4 className="text-sm font-black text-black truncate">{item.monthName}</h4><p className="text-[8px] font-bold text-slate-500 uppercase">{item.enviado} contatos</p></div></div><button onClick={()=>setReportToPreview(item)} className="w-full py-2 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-700 hover:text-white transition-all">Baixar PDF</button></div>))}{history.length===0 && <div className="col-span-full py-10 text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">Vazio</div>}</div></motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-8 pb-4 pt-4 border-t border-slate-200 flex items-center justify-center gap-3"><span className="text-black text-[9px] font-black uppercase tracking-widest opacity-30">Powered by</span><img src={LOGO_URL} alt="Logo" className="h-5 w-auto object-contain filter grayscale opacity-20" /></footer>
      </main>

      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[300px] z-50"><nav className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-full px-2 py-1 flex items-center justify-around shadow-2xl">{[{id:'dashboard',i:LayoutDashboard},{id:'history',i:Calendar},{id:'new',i:Plus},{id:'reports',i:FileText}].map((item)=>(<button key={item.id} onClick={()=>setActiveTab(item.id as any)} className={`p-2.5 rounded-full transition-all ${activeTab===item.id?'bg-red-900 text-white shadow-lg scale-110': 'text-slate-400'}`}><item.i size={18} strokeWidth={activeTab===item.id?3:2}/></button>))}</nav></div>

      <AnimatePresence>{isAuthOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-8"><motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2rem] p-8 text-center shadow-2xl max-w-sm w-full border-t-4 border-red-700 flex flex-col items-center"><ShieldAlert size={40} className="text-red-700 mb-6"/><h3 className="text-xl font-black text-black mb-2 tracking-tight">Autorização</h3><p className="text-black text-[8px] font-black uppercase tracking-widest mb-8">COMANDO: {pendingAction?.label}</p><div className="w-full space-y-6"><div className="bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center group focus-within:border-red-600/30 transition-all"><KeyRound size={16} className="text-slate-400 mr-3"/><input type="password" placeholder="••••••••" autoFocus value={authInput} onChange={(e)=>setAuthInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&confirmAuthorization()} className="w-full bg-transparent py-4 text-lg font-black text-black outline-none tracking-widest" /></div>{authError && <p className="text-red-600 text-[8px] font-black uppercase tracking-widest">Código Inválido</p>}<div className="flex gap-3"><button onClick={()=>setIsAuthOpen(false)} className="flex-1 py-3 rounded-lg bg-slate-100 text-slate-800 font-black text-[9px] uppercase tracking-widest hover:bg-slate-200">Abortar</button><button onClick={confirmAuthorization} className="flex-[2] py-3 rounded-lg premium-red-gradient text-white font-black text-[9px] uppercase tracking-widest shadow-lg">Confirmar</button></div></div></motion.div></motion.div>}</AnimatePresence>

      <AnimatePresence>{isProcessing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-8"><div className="bg-white rounded-[2rem] p-10 text-center shadow-2xl max-w-xs w-full"><Loader2 className="w-12 h-12 text-red-700 animate-spin mx-auto mb-6"/><h3 className="text-lg font-black text-black mb-2">Processando</h3><p className="text-black text-[9px] font-black uppercase tracking-widest leading-relaxed">Extraindo Dados via IA</p></div></motion.div>}</AnimatePresence>
      
      <AnimatePresence>
        {reportToPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[150] overflow-y-auto p-4 sm:p-10 flex justify-center">
             <div className="max-w-[800px] w-full bg-white shadow-2xl rounded-sm p-0 flex flex-col relative self-start">
                <div className="sticky top-0 z-50 bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between print:hidden">
                   <div className="flex items-center gap-4">
                      <button onClick={() => window.print()} className="bg-red-700 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-red-800 transition-all"><Printer size={14} /> Imprimir / PDF</button>
                      <p className="text-[10px] font-bold text-slate-500 uppercase hidden sm:block">Relatório Bolsa Família ({reportToPreview.monthName})</p>
                   </div>
                   <button onClick={() => setReportToPreview(null)} className="p-2 text-slate-400 hover:text-red-700"><X size={24} /></button>
                </div>
                <div id="printable-report" className="bg-white p-12 sm:p-20 text-slate-800 font-sans leading-relaxed relative overflow-hidden min-h-[1100px]">
                   <div className="flex justify-start mb-16"><img src={LOGO_URL} alt="Logo" className="h-24 w-auto object-contain" /></div>
                   <div className="space-y-8">
                      <p className="font-bold text-lg">RedMaxx® Projeto de Comunicação Bolsa Família ({reportToPreview.monthName})</p>
                      <p className="font-bold">Título do Projeto: <span className="font-normal">API de Comunicação RedMaxx aplicada à notificação de contemplados – {reportToPreview.monthName}</span></p>
                      <p className="font-bold">Solicitante: <span className="font-normal">SEMASC</span></p>
                      <p className="font-bold">Data: <span className="font-normal">Manaus, em {new Date().toLocaleDateString('pt-BR')}</span></p>
                      <div className="space-y-4 pt-4 border-t border-slate-200"><p className="font-bold">Execução via API RedMaxx</p><ul className="list-disc ml-8"><li>Processados: <strong>{reportToPreview.totalProcessado} contatos</strong></li></ul></div>
                      <div className="space-y-4 pt-4 border-t border-slate-200"><p className="font-bold">Consolidado Geral</p><p>• Total previsto : <strong>{reportToPreview.totalProcessado}</strong></p><p>• Total processados: <strong>{reportToPreview.enviado} atingidos</strong></p><p>• Taxa de entrega: <strong>{reportToPreview.taxaSucesso}%</strong></p></div>
                      <div className="space-y-4 pt-6 border-t border-slate-200"><p className="font-bold">Conclusão</p><p className="text-sm text-justify">A utilização da API de Comunicação RedMaxx garantiu confiabilidade em todo o processo. Foram atingidos {reportToPreview.enviado} beneficiários ({reportToPreview.taxaSucesso}%).</p></div>
                   </div>
                   <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t pt-8 border-slate-100 text-[9px] text-slate-400">
                      <div className="space-y-1 uppercase font-bold tracking-wider"><p className="text-slate-600">Manaus – AM - Matriz</p><p>R. Rio Purús, 458 | CEP 69053-050</p></div>
                      <div className="space-y-1 uppercase font-bold tracking-wider text-right"><p className="text-slate-600">São Paulo - SP - Filial</p><p>Av. Berrini, 1140 | CEP 04571-000</p></div>
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
