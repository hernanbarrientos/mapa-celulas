import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, Edit, Plus, LogOut, Save, X, Search, MapPin, Loader2, Check, AlertTriangle, Moon, Sun, Users, UserCheck, LayoutGrid, Phone, UserCog, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LABELS = {
  figueira: "Figueira",
  teens: "Teens",
  valentes: "Valentes de Davi"
};

const CATEGORIES = {
  teens: { label: "Teens", color: "bg-orange-500", border: "border-orange-500", text: "text-orange-500" },
  figueira: { label: "Figueira", color: "bg-purple-800", border: "border-purple-800", text: "text-purple-800" },
  valentes: { label: "Valentes de Davi", color: "bg-blue-900", border: "border-blue-900", text: "text-blue-900" }
};

export default function AdminDashboard() {
  // --- ESTADOS GERAIS ---
  const [activeTab, setActiveTab] = useState('celulas'); 
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  // --- DADOS ---
  const [celulas, setCelulas] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [coordenadores, setCoordenadores] = useState([]);
  
  // --- ESTADOS DE UI ---
  const [editingId, setEditingId] = useState(null); 
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, type: 'success', message: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, type: null }); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); 

  // --- FORMS ---
  const [formCelula, setFormCelula] = useState({
    nome: '', 
    lider1_nome: '', lider1_whatsapp: '', 
    lider2_nome: '', lider2_whatsapp: '',
    supervisor_id: '', coordenador_id: '',
    categoria: 'figueira', dia: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '',
    lat: '', lon: ''
  });

  const [formSupervisor, setFormSupervisor] = useState({
    nome_1: '', whatsapp_1: '',
    nome_2: '', whatsapp_2: ''
  });

  const [formCoordenador, setFormCoordenador] = useState({
    nome: '', whatsapp: ''
  });

  // --- EFEITOS ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    // Busca Células
    const { data: cells } = await supabase
        .from('celulas')
        .select('*, supervisores (id, nome_1, nome_2), coordenadores (id, nome)')
        .order('id');
    setCelulas(cells || []);

    // Busca Supervisores
    const { data: sups } = await supabase.from('supervisores').select('*').order('nome_1');
    setSupervisores(sups || []);

    // Busca Coordenadores
    const { data: coords } = await supabase.from('coordenadores').select('*').order('nome');
    setCoordenadores(coords || []);
  };

  const toggleTheme = () => setDarkMode(!darkMode);
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  // --- AÇÕES DE SALVAR ---

  const handleSaveSupervisor = async (e) => {
      e.preventDefault();
      setStatusModal({ open: true, type: 'loading', message: 'Salvando Supervisor...' });
      
      let error = null;
      if (editingId === 'new') {
          const { error: err } = await supabase.from('supervisores').insert([formSupervisor]);
          error = err;
      } else {
          const { error: err } = await supabase.from('supervisores').update(formSupervisor).eq('id', editingId);
          error = err;
      }

      if (error) {
          setStatusModal({ open: true, type: 'error', message: 'Erro ao salvar.' });
      } else {
          await fetchData();
          setEditingId(null);
          setStatusModal({ open: true, type: 'success', message: 'Supervisor salvo!' });
      }
  };

  const handleSaveCoordenador = async (e) => {
      e.preventDefault();
      setStatusModal({ open: true, type: 'loading', message: 'Salvando Coordenador...' });
      
      let error = null;
      if (editingId === 'new') {
          const { error: err } = await supabase.from('coordenadores').insert([formCoordenador]);
          error = err;
      } else {
          const { error: err } = await supabase.from('coordenadores').update(formCoordenador).eq('id', editingId);
          error = err;
      }

      if (error) {
          setStatusModal({ open: true, type: 'error', message: 'Erro ao salvar.' });
      } else {
          await fetchData();
          setEditingId(null);
          setStatusModal({ open: true, type: 'success', message: 'Coordenador salvo!' });
      }
  };

  const handleSaveCelula = async (e) => {
    e.preventDefault();
    setStatusModal({ open: true, type: 'loading', message: 'Salvando Célula...' });

    // Monta string legada de líderes para compatibilidade
    const liderDisplay = formCelula.lider2_nome 
        ? `${formCelula.lider1_nome} e ${formCelula.lider2_nome}` 
        : formCelula.lider1_nome;

    const dadosParaSalvar = {
        nome: formCelula.nome,
        // Líderes Detalhados
        lider1_nome: formCelula.lider1_nome, lider1_whatsapp: formCelula.lider1_whatsapp,
        lider2_nome: formCelula.lider2_nome, lider2_whatsapp: formCelula.lider2_whatsapp,
        lider: liderDisplay, // Campo legado
        
        // Relacionamentos (envia null se estiver vazio)
        supervisor_id: formCelula.supervisor_id || null, 
        coordenador_id: formCelula.coordenador_id || null,
        
        categoria: formCelula.categoria, dia: formCelula.dia,
        
        // Endereço Detalhado
        cep: formCelula.cep, 
        logradouro: formCelula.logradouro, 
        numero: formCelula.numero, 
        complemento: formCelula.complemento, 
        bairro: formCelula.bairro,
        endereco: `${formCelula.logradouro}, ${formCelula.numero}`, // Campo legado
        
        lat: parseFloat(formCelula.lat), 
        lon: parseFloat(formCelula.lon)
    };

    let error = null;
    if (editingId === 'new') {
      const { error: err } = await supabase.from('celulas').insert([dadosParaSalvar]);
      error = err;
    } else {
      const { error: err } = await supabase.from('celulas').update(dadosParaSalvar).eq('id', editingId);
      error = err;
    }

    if (error) {
        console.error(error);
        setStatusModal({ open: true, type: 'error', message: 'Erro ao salvar célula. Verifique os dados.' });
    } else {
        await fetchData();
        setEditingId(null);
        setStatusModal({ open: true, type: 'success', message: 'Célula salva com sucesso!' });
    }
  };

  // --- AÇÕES DE EXCLUIR ---
  const solicitarExclusao = (id, type) => {
    setDeleteModal({ open: true, id, type });
  };

  const confirmarExclusao = async () => {
    if (!deleteModal.id) return;
    setDeleteModal({ ...deleteModal, open: false });
    setStatusModal({ open: true, type: 'loading', message: 'Excluindo...' });
    
    let table = 'celulas';
    if (deleteModal.type === 'supervisor') table = 'supervisores';
    if (deleteModal.type === 'coordenador') table = 'coordenadores';

    const { error } = await supabase.from(table).delete().eq('id', deleteModal.id);
    
    if (error) {
      setStatusModal({ open: true, type: 'error', message: 'Erro ao excluir. Verifique se há vínculos.' });
    } else {
      await fetchData();
      setStatusModal({ open: true, type: 'success', message: 'Removido com sucesso!' });
    }
  };

  // --- ABRIR FORMULÁRIOS ---
  const openFormSupervisor = (sup = null) => {
      if (sup) { setEditingId(sup.id); setFormSupervisor({ nome_1: sup.nome_1, whatsapp_1: sup.whatsapp_1, nome_2: sup.nome_2 || '', whatsapp_2: sup.whatsapp_2 || '' }); } 
      else { setEditingId('new'); setFormSupervisor({ nome_1: '', whatsapp_1: '', nome_2: '', whatsapp_2: '' }); }
  };

  const openFormCoordenador = (coord = null) => {
      if (coord) { setEditingId(coord.id); setFormCoordenador({ nome: coord.nome, whatsapp: coord.whatsapp }); } 
      else { setEditingId('new'); setFormCoordenador({ nome: '', whatsapp: '' }); }
  };

  const openFormCelula = (celula = null) => {
    if (celula) {
        setEditingId(celula.id);
        // Fallback para campos antigos caso os novos estejam vazios
        const ruaAntiga = celula.endereco ? celula.endereco.split(',')[0] : '';
        
        setFormCelula({
            nome: celula.nome || '', 
            lider1_nome: celula.lider1_nome || celula.lider || '', 
            lider1_whatsapp: celula.lider1_whatsapp || celula.whatsapp1 || '',
            lider2_nome: celula.lider2_nome || '',
            lider2_whatsapp: celula.lider2_whatsapp || '',
            supervisor_id: celula.supervisor_id || '', 
            coordenador_id: celula.coordenador_id || '',
            categoria: celula.categoria || 'figueira', dia: celula.dia || '',
            cep: celula.cep || '', 
            logradouro: celula.logradouro || ruaAntiga,
            numero: celula.numero || '', 
            complemento: celula.complemento || '', 
            bairro: celula.bairro || '',
            lat: celula.lat || '', lon: celula.lon || ''
        });
    } else {
        setEditingId('new');
        setFormCelula({
            nome: '', lider1_nome: '', lider1_whatsapp: '', lider2_nome: '', lider2_whatsapp: '',
            supervisor_id: '', coordenador_id: '', categoria: 'figueira', dia: '',
            cep: '', logradouro: '', numero: '', complemento: '', bairro: '', lat: '', lon: ''
        });
    }
  };

  // --- UTILITÁRIOS ---
  const handleBuscarCep = async () => {
    if (formCelula.cep.length < 8) return alert('CEP inválido');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${formCelula.cep.replace(/\D/g, '')}/json/`);
      const data = await res.json();
      if (data.erro) { alert('CEP não encontrado!'); return; }
      setFormCelula(prev => ({ ...prev, logradouro: data.logradouro, bairro: data.bairro }));
    } catch (error) { alert('Erro ao buscar CEP'); }
  };

  const handleBuscarCoordenadas = async () => {
    if (!formCelula.logradouro || !formCelula.numero) return alert('Preencha Rua e Número');
    setLoadingGeo(true);
    try {
      const query = `${formCelula.logradouro}, ${formCelula.numero}, ${formCelula.bairro}, São Paulo, Brazil`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setFormCelula(prev => ({ ...prev, lat: data[0].lat, lon: data[0].lon }));
      } else { alert('Endereço não encontrado.'); }
    } catch (error) { alert('Erro de conexão.'); }
    setLoadingGeo(false);
  };

  const filteredCelulas = celulas.filter((celula) => {
    const termo = searchTerm.toLowerCase();
    const searchFields = (celula.nome || '') + (celula.lider || '') + (celula.bairro || '');
    return searchFields.toLowerCase().includes(termo) && (filterCategory === 'all' || celula.categoria === filterCategory);
  });

  const getCategoryInfo = (cat) => CATEGORIES[cat?.toLowerCase().trim()] || CATEGORIES.figueira;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-4 md:p-8 relative">
      
      {/* MODAL STATUS */}
      {statusModal.open && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
                {statusModal.type === 'loading' && <div className="flex flex-col items-center py-4"><Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4"/><h3 className="text-xl font-bold text-gray-800 dark:text-white">Aguarde...</h3><p className="text-gray-500 dark:text-gray-300 mt-2">{statusModal.message}</p></div>}
                
                {statusModal.type === 'success' && <div className="flex flex-col items-center"><div className="h-20 w-20 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-6 ring-8 ring-green-50/50 dark:ring-green-900/20"><Check className="h-10 w-10 text-green-500" strokeWidth={3} /></div><h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Sucesso!</h3><p className="text-gray-500 dark:text-gray-400 mb-8">{statusModal.message}</p><button onClick={() => setStatusModal({ ...statusModal, open: false })} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-lg transition-colors shadow-md">Pronto</button></div>}
                
                {statusModal.type === 'error' && <div className="flex flex-col items-center"><div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6"><X className="h-10 w-10 text-red-600 dark:text-red-400" /></div><h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Ops!</h3><p className="text-gray-500 dark:text-gray-400 mb-6">{statusModal.message}</p><button onClick={() => setStatusModal({ ...statusModal, open: false })} className="w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 text-white font-bold py-3 rounded-lg">Fechar</button></div>}
            </div>
         </div>
      )}

      {/* MODAL DELETE */}
      {deleteModal.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
                  <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Excluir?</h3>
                  <div className="flex gap-3 mt-6"><button onClick={() => setDeleteModal({ open: false, id: null })} className="flex-1 py-3 bg-gray-200 rounded-lg text-gray-800 font-bold">Cancelar</button><button onClick={confirmarExclusao} className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold">Excluir</button></div>
              </div>
          </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Administração</h1>
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={toggleTheme} className="p-2.5 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-yellow-400 border border-gray-200 dark:border-gray-700">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-bold"><LogOut size={20} /> Sair</button>
          </div>
        </div>

        {/* ABAS */}
        <div className="flex gap-4 mb-6 border-b dark:border-gray-700 pb-1 overflow-x-auto">
            <button onClick={() => setActiveTab('celulas')} className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'celulas' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'}`}><LayoutGrid size={18}/> Células</button>
            <button onClick={() => setActiveTab('supervisores')} className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'supervisores' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'}`}><UserCheck size={18}/> Supervisores ({supervisores.length})</button>
            <button onClick={() => setActiveTab('coordenadores')} className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'coordenadores' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'}`}><UserCog size={18}/> Coordenadores ({coordenadores.length})</button>
        </div>

        {/* ======================= ABA CÉLULAS ======================= */}
        {activeTab === 'celulas' && (
            <>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex-1 max-w-md relative"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-none rounded-lg text-gray-800 dark:text-white shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    <button onClick={() => openFormCelula()} className="ml-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm hover:bg-green-700"><Plus size={20} /> <span className="hidden md:inline">Nova</span></button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-4">{['all', 'figueira', 'teens', 'valentes'].map(cat => (<button key={cat} onClick={() => setFilterCategory(cat)} className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${filterCategory === cat ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}`}>{cat === 'all' ? 'Todas' : LABELS[cat]}</button>))}</div>

                {/* Lista Desktop */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Célula / Líderes</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Supervisão</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Local</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredCelulas.map((c) => {
                            const catInfo = getCategoryInfo(c.categoria);
                            const supNome = c.supervisores ? (c.supervisores.nome_2 ? `${c.supervisores.nome_1} e ${c.supervisores.nome_2}` : c.supervisores.nome_1) : '-';
                            return (
                            <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-900 dark:text-white text-base">{c.nome || 'Sem Nome'}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><User size={14}/> {c.lider}</div>
                                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-lg text-xs font-bold text-white ${catInfo.color}`}>{catInfo.label}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2"><UserCheck size={16} className="text-blue-500"/> {supNome}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                <div className="font-medium">{c.bairro}</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[150px]">{c.endereco}</div>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                <button onClick={() => openFormCelula(c)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit size={18} /></button>
                                <button onClick={() => solicitarExclusao(c.id, 'celula')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={18} /></button>
                            </td>
                            </tr>
                        )})}
                        </tbody>
                    </table>
                </div>

                {/* Lista Mobile */}
                <div className="md:hidden space-y-4 pb-24">
                    {filteredCelulas.map((c) => {
                        const catInfo = getCategoryInfo(c.categoria);
                        const supNome = c.supervisores ? (c.supervisores.nome_2 ? `${c.supervisores.nome_1} e ${c.supervisores.nome_2}` : c.supervisores.nome_1) : '-';
                        return (
                        <div key={c.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="mb-4">
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white">{c.nome || 'Sem Nome'}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex gap-1 items-center"><User size={14}/> {c.lider}</p>
                                <span className={`inline-block mt-1.5 px-3.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm ${catInfo.color}`}>{catInfo.label}</span>
                            </div>
                            <div className="space-y-3 mb-5 pl-2 border-l-2 border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 font-bold">
                                    <UserCheck size={18} className="shrink-0" />
                                    <p>Sup: {supNome}</p>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{c.bairro}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.endereco}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => openFormCelula(c)} className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 py-3 rounded-xl font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"><Edit size={18} /> Editar</button>
                                <button onClick={() => solicitarExclusao(c.id, 'celula')} className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 py-3 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition"><Trash2 size={18} /> Excluir</button>
                            </div>
                        </div>
                    )})}
                </div>
            </>
        )}

        {/* ======================= ABA SUPERVISORES ======================= */}
        {activeTab === 'supervisores' && (
            <div className="animate-in fade-in duration-300">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl mb-6 border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2"><UserCheck/> Supervisores</h2>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Cadastre os casais ou supervisores individuais.</p>
                    </div>
                    <button onClick={() => openFormSupervisor()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md">Adicionar</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supervisores.map(sup => (
                        <div key={sup.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="mb-3">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{sup.nome_1} {sup.nome_2 && `e ${sup.nome_2}`}</h3>
                            </div>
                            <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                <p className="flex items-center gap-2"><Phone size={14} className="text-green-600"/> {sup.nome_1}: {sup.whatsapp_1}</p>
                                {sup.nome_2 && <p className="flex items-center gap-2"><Phone size={14} className="text-blue-600"/> {sup.nome_2}: {sup.whatsapp_2}</p>}
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t dark:border-gray-700 justify-end">
                                <button onClick={() => openFormSupervisor(sup)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50"><Edit size={18}/></button>
                                <button onClick={() => solicitarExclusao(sup.id, 'supervisor')} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ======================= ABA COORDENADORES ======================= */}
        {activeTab === 'coordenadores' && (
            <div className="animate-in fade-in duration-300">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl mb-6 border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2"><UserCog/> Coordenadores</h2>
                    </div>
                    <button onClick={() => openFormCoordenador()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md">Adicionar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coordenadores.map(coord => (
                        <div key={coord.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{coord.nome}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1"><Phone size={14}/> {coord.whatsapp}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openFormCoordenador(coord)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400"><Edit size={18}/></button>
                                <button onClick={() => solicitarExclusao(coord.id, 'coordenador')} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-red-600 dark:text-red-400"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ======================= MODAL FORM CÉLULA ======================= */}
        {editingId && activeTab === 'celulas' && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dados da Célula</h2>
                        <button onClick={() => setEditingId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="text-gray-500 dark:text-gray-400"/></button>
                    </div>
                    <form onSubmit={handleSaveCelula} className="p-6 space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome da Célula</label>
                            <input className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCelula.nome} onChange={e => setFormCelula({...formCelula, nome: e.target.value})} placeholder="Ex: Moriah" />
                        </div>

                        {/* LÍDERES */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2"><User size={14}/> Dados dos Líderes</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nome Líder 1</label><input className="w-full border p-2.5 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCelula.lider1_nome} onChange={e => setFormCelula({...formCelula, lider1_nome: e.target.value})} placeholder="Ex: Gabriel" required /></div>
                                <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold text-gray-700 dark:text-gray-300">WhatsApp Líder 1</label><input className="w-full border p-2.5 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCelula.lider1_whatsapp} onChange={e => setFormCelula({...formCelula, lider1_whatsapp: e.target.value})} placeholder="+55119..." required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nome Líder 2 (Opcional)</label><input className="w-full border p-2.5 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCelula.lider2_nome} onChange={e => setFormCelula({...formCelula, lider2_nome: e.target.value})} placeholder="Ex: Julia" /></div>
                                <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold text-gray-700 dark:text-gray-300">WhatsApp Líder 2</label><input className="w-full border p-2.5 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCelula.lider2_whatsapp} onChange={e => setFormCelula({...formCelula, lider2_whatsapp: e.target.value})} placeholder="+55119..." /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Supervisor</label>
                                <select className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCelula.supervisor_id} onChange={e => setFormCelula({...formCelula, supervisor_id: e.target.value})}>
                                    <option value="">-- Selecione --</option>
                                    {supervisores.map(s => (<option key={s.id} value={s.id}>{s.nome_1} {s.nome_2 && `e ${s.nome_2}`}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Coordenador</label>
                                <select className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCelula.coordenador_id} onChange={e => setFormCelula({...formCelula, coordenador_id: e.target.value})}>
                                    <option value="">-- Selecione --</option>
                                    {coordenadores.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Categoria</label>
                                <select className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCelula.categoria} onChange={e => setFormCelula({...formCelula, categoria: e.target.value})}>
                                    <option value="teens">Teens</option>
                                    <option value="figueira">Figueira</option>
                                    <option value="valentes">Valentes de Davi</option>
                                </select>
                            </div>
                            <div><label className="text-sm font-bold text-gray-700 dark:text-gray-300">Dia/Horário</label><input className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCelula.dia} onChange={e => setFormCelula({...formCelula, dia: e.target.value})} required/></div>
                        </div>

                        {/* Endereço */}
                        <div className="space-y-3 pt-2">
                            <h3 className="font-bold text-gray-500 text-sm uppercase">Endereço</h3>
                            <div className="flex gap-2"><input className="w-1/3 border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="CEP" value={formCelula.cep} onChange={e => setFormCelula({...formCelula, cep: e.target.value})}/><button type="button" onClick={handleBuscarCep} className="bg-gray-100 dark:bg-gray-600 p-3 rounded-lg"><Search size={20}/></button></div>
                            <input className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Rua" value={formCelula.logradouro} onChange={e => setFormCelula({...formCelula, logradouro: e.target.value})} required/>
                            <div className="flex gap-2">
                                <input className="w-1/3 border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Número" value={formCelula.numero} onChange={e => setFormCelula({...formCelula, numero: e.target.value})} required/>
                                <input className="w-2/3 border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Complemento" value={formCelula.complemento} onChange={e => setFormCelula({...formCelula, complemento: e.target.value})}/>
                            </div>
                            <input className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Bairro" value={formCelula.bairro} onChange={e => setFormCelula({...formCelula, bairro: e.target.value})} required/>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex flex-col gap-3">
                                <div className="flex justify-between items-center"><span className="text-xs font-bold text-blue-800 dark:text-blue-300">Geolocalização</span><button type="button" onClick={handleBuscarCoordenadas} disabled={loadingGeo} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">{loadingGeo ? '...' : 'Buscar'}</button></div>
                                <div className="flex gap-2"><input className="w-1/2 p-2 rounded border text-xs" placeholder="Lat" value={formCelula.lat} onChange={e => setFormCelula({...formCelula, lat: e.target.value})}/><input className="w-1/2 p-2 rounded border text-xs" placeholder="Lon" value={formCelula.lon} onChange={e => setFormCelula({...formCelula, lon: e.target.value})}/></div>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg mt-2 shadow-lg transition-transform active:scale-95">Salvar Alterações</button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL FORM SUPERVISOR (DUPLA) */}
        {editingId && activeTab === 'supervisores' && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{editingId === 'new' ? 'Novo' : 'Editar'} Supervisor</h2>
                        <button onClick={() => setEditingId(null)}><X className="text-gray-500"/></button>
                    </div>
                    <form onSubmit={handleSaveSupervisor} className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Supervisor 1 (Principal)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nome</label><input className="w-full border p-2.5 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formSupervisor.nome_1} onChange={e => setFormSupervisor({...formSupervisor, nome_1: e.target.value})} required placeholder="Ex: William" /></div>
                                <div className="col-span-2"><label className="text-xs font-bold text-gray-700 dark:text-gray-300">WhatsApp</label><input className="w-full border p-2.5 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formSupervisor.whatsapp_1} onChange={e => setFormSupervisor({...formSupervisor, whatsapp_1: e.target.value})} required placeholder="5511..." /></div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Supervisor 2 (Cônjuge/Dupla)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nome (Opcional)</label><input className="w-full border p-2.5 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formSupervisor.nome_2} onChange={e => setFormSupervisor({...formSupervisor, nome_2: e.target.value})} placeholder="Ex: Ane" /></div>
                                <div className="col-span-2"><label className="text-xs font-bold text-gray-700 dark:text-gray-300">WhatsApp (Opcional)</label><input className="w-full border p-2.5 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formSupervisor.whatsapp_2} onChange={e => setFormSupervisor({...formSupervisor, whatsapp_2: e.target.value})} placeholder="5511..." /></div>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold mt-2">Salvar Supervisor</button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL FORM COORDENADOR */}
        {editingId && activeTab === 'coordenadores' && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{editingId === 'new' ? 'Novo' : 'Editar'} Coordenador</h2>
                        <button onClick={() => setEditingId(null)}><X className="text-gray-500"/></button>
                    </div>
                    <form onSubmit={handleSaveCoordenador} className="space-y-4">
                        <div><label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome</label><input className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCoordenador.nome} onChange={e => setFormCoordenador({...formCoordenador, nome: e.target.value})} required /></div>
                        <div><label className="text-sm font-bold text-gray-700 dark:text-gray-300">WhatsApp</label><input className="w-full border p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formCoordenador.whatsapp} onChange={e => setFormCoordenador({...formCoordenador, whatsapp: e.target.value})} required /></div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold mt-4">Salvar Coordenador</button>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}