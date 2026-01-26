import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import { Search, MapPin, Calendar, User, Users, MessageCircle, Loader2, Map as MapIcon, List, Navigation, X, Moon, Sun } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../supabaseClient';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -40]
});
L.Marker.prototype.options.icon = DefaultIcon;

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

const categories = [
  { id: 'teens', label: 'Teens', display: 'Célula Teens', color: 'bg-orange-500' },
  { id: 'figueira', label: 'Figueira', display: 'Célula Figueira', color: 'bg-purple-800' },
  { id: 'valentes', label: 'Valentes de Davi', display: 'Célula Valentes de Davi', color: 'bg-blue-900' },
];

export default function MapaBase({ modoLider = false }) {
  const [celulas, setCelulas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // TEMA
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // Estados da Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef({});

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  useEffect(() => {
    fetchCelulas();
  }, []);

  useEffect(() => {
    if (mobileView === 'map' && userLocation && mapRef.current) {
        setTimeout(() => {
            mapRef.current.invalidateSize(); 
            mapRef.current.flyTo(userLocation, 14, { duration: 1.5 });
        }, 300); 
    }
  }, [mobileView, userLocation]);

    async function fetchCelulas() {
        setLoading(true);
        // MUDANÇA AQUI: Trazemos os dados da tabela relacionada 'supervisores'
        const { data, error } = await supabase
            .from('celulas')
            .select('*, supervisores (nome, whatsapp)'); 
        
        if (error) { console.error("Erro:", error); setLoading(false); return; }

        const dadosTratados = data.map((row) => {
            if (!row.lat || !row.lon) return null;
            const catId = row.categoria ? row.categoria.toLowerCase().trim() : "figueira";
            const catConfig = categories.find(c => c.id === catId) || categories[1];
            
            return { 
                ...row, 
                titulo: catConfig.display, 
                categoriaId: catId, 
                cor: catConfig.color, 
                lider: row.lider || "-", 
                coords: [row.lat, row.lon] 
            };
        }).filter(item => item !== null);
        
        setCelulas(dadosTratados);
        setLoading(false);
    }

  const formatEndereco = (endereco) => {
    if (modoLider) return endereco; 
    if (!endereco) return "Endereço não informado";
    if (endereco.includes(',')) return endereco.split(',')[0].trim();
    const match = endereco.match(/^([^\d]+)/); 
    if (match) return match[1].trim();
    return endereco; 
  };

  const safeFlyTo = (lat, lon) => {
    if (!mapRef.current) return;
    const isMapVisible = window.innerWidth >= 768 || mobileView === 'map';
    if (isMapVisible) {
        mapRef.current.flyTo([lat, lon], 14, { duration: 1.5 });
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) return alert("GPS não suportado");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLocation([lat, lon]);
        setLocationLoading(false);
        safeFlyTo(lat, lon); 
      },
      () => { alert("Ative o GPS"); setLocationLoading(false); }
    );
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }

    searchTimeoutRef.current = setTimeout(async () => {
        try {
            const query = `${value}, Estado de São Paulo, Brazil`;
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) { console.error("Erro autocomplete:", error); }
    }, 500);
  };

  const handleSelectAddress = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setUserLocation([lat, lon]);
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    safeFlyTo(lat, lon); 
  };

  const handleSearchAddress = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    setSearchingAddress(true);
    try {
        const query = `${searchTerm}, Estado de São Paulo, Brazil`; 
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setUserLocation([lat, lon]);
            setSearchTerm(''); 
            safeFlyTo(lat, lon); 
        } else { alert('Endereço não encontrado.'); }
    } catch (error) { console.error(error); alert('Erro ao buscar endereço.'); }
    setSearchingAddress(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearchAddress(); };

  const filteredCelulas = celulas
    .map(celula => ({ ...celula, distancia: userLocation ? getDistanceFromLatLonInKm(userLocation[0], userLocation[1], celula.coords[0], celula.coords[1]) : null }))
    .filter((celula) => {
      if (searchTerm && !userLocation) {
          const termo = searchTerm.toLowerCase();
          const searchFields = modoLider ? (celula.bairro + celula.endereco + celula.lider).toLowerCase() : (celula.bairro + celula.endereco).toLowerCase();
          return searchFields.includes(termo);
      }
      return true;
    })
    .filter((celula) => selectedCategory ? celula.categoriaId === selectedCategory : true)
    .sort((a, b) => (a.distancia !== null && b.distancia !== null) ? a.distancia - b.distancia : 0);

  const handleCellClick = (celula) => {
    setMobileView('map');
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        mapRef.current.flyTo(celula.coords, 16, { duration: 1.5 });
      }
      if (markerRefs.current[celula.id]) markerRefs.current[celula.id].openPopup();
    }, 100);
  };

  const toggleView = () => {
    const newView = mobileView === 'list' ? 'map' : 'list';
    setMobileView(newView);
    if (newView === 'map') setTimeout(() => mapRef.current?.invalidateSize(), 100);
  };

  // --- NOVO DESIGN: POPUP (MAPA) ---
  // Forçamos bg-white e text-gray-700 para garantir leitura em cima do mapa, mesmo com Dark Mode ativo.
    const renderPopupContent = (celula) => (
        <div className="min-w-[220px] text-left bg-white">
        {/* Banner Colorido */}
        <div className={`${celula.cor} p-4 flex items-center justify-between`}>
            <span className="font-bold text-white text-sm uppercase tracking-wide">{celula.titulo}</span>
        </div>
        
        {/* Conteúdo */}
        <div className="p-4 text-gray-700 space-y-2 text-sm leading-relaxed">
            <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400 shrink-0" />
                <span><strong className="text-gray-900">Líder:</strong> {celula.lider}</span>
            </div>
            
            {/* Lógica Relacional para Supervisor */}
            {modoLider && celula.supervisores && (
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400 shrink-0" />
                    <span><strong className="text-gray-900">Supervisor:</strong> {celula.supervisores.nome}</span>
                </div>
            )}

            <div className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                    <span className="block text-gray-700 leading-tight">{formatEndereco(celula.endereco)} - {celula.bairro}</span>
                    {!modoLider && <span className="block text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-bold">Localização Aproximada</span>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400 shrink-0" />
                <span className="text-blue-600 font-bold">{celula.dia}</span>
            </div>

            {/* Botões */}
            <div className="grid gap-2 mt-4">
            {modoLider ? (
                <div className="flex gap-2">
                    {/* Botão Líder */}
                    {celula.whatsapp1 && (
                        <a href={`https://wa.me/${celula.whatsapp1}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-colors no-underline">
                            <MessageCircle size={14} /> Líder
                        </a>
                    )}
                    {/* Botão Supervisor (Lendo do Objeto Relacional) */}
                    {celula.supervisores && (
                        <a href={`https://wa.me/${celula.supervisores.whatsapp}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors no-underline">
                            <Users size={14} /> Sup.
                        </a>
                    )}
                </div>
            ) : (
                <a href={`https://wa.me/${celula.whatsapp_coordenador}`} target="_blank" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-bold bg-green-600 !text-white hover:bg-green-700 transition-colors shadow-sm no-underline"><MessageCircle size={16} /> Fale conosco</a>
            )}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${celula.coords[0]},${celula.coords[1]}`} target="_blank" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-bold bg-blue-600 !text-white hover:bg-blue-700 transition-colors shadow-sm no-underline">Traçar Rota</a>
            </div>
        </div>
        </div>
    );

  // --- NOVO DESIGN: CARD (SIDEBAR) ---
  const renderSidebarCard = (celula) => (
    <div className={`${celula.cor} p-5 rounded-lg shadow-md transition-all hover:shadow-lg relative overflow-hidden cursor-pointer group`}>
        {/* Ícone de fundo (Efeito visual) */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 text-white/10 pointer-events-none group-hover:scale-110 transition-transform">
            <Users size={100} strokeWidth={1} />
        </div>

        {/* Cabeçalho do Card */}
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <h3 className="font-bold text-xl text-white">{celula.lider}</h3>
                {/* Badge/Pílula com rounded-lg */}
                <span className="inline-block mt-1.5 px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
                    {celula.titulo}
                </span>
            </div>
            
            {/* Distância */}
            {celula.distancia !== null && (
                <div className="bg-white/20 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                    <Navigation size={12} className="fill-current"/>{celula.distancia < 1 ? Math.round(celula.distancia*1000) + 'm' : celula.distancia.toFixed(1) + 'km'}
                </div>
            )}
        </div>

        {/* Informações */}
        <div className="space-y-2 relative z-10 pl-2 text-white/90 text-sm">
            {/* Se for modo líder e tiver supervisor, mostra aqui também */}
            {modoLider && celula.supervisores && (
                <div className="flex items-center gap-2 font-medium">
                    <Users size={18} className="text-white/80 shrink-0" />
                    <span>Sup: {celula.supervisores.nome}</span>
                </div>
            )}

            <div className="flex items-start gap-2">
                <MapPin size={18} className="text-white/70 mt-0.5 shrink-0" />
                <div>
                    <p className="font-medium text-white line-clamp-1">{celula.bairro}</p>
                    <p className="text-xs text-white/70 line-clamp-2">{formatEndereco(celula.endereco)}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <Calendar size={18} className="text-white/70 shrink-0" />
                <span className="font-bold">{celula.dia}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 md:flex-row overflow-hidden relative">
      
      {/* SIDEBAR */}
      <div className={`w-full md:w-[450px] md:shrink-0 flex-col h-full bg-white dark:bg-gray-900 shadow-2xl z-20 transition-all ${mobileView === 'map' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 relative"> 
          <div className="flex justify-between items-start mb-1">
             <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{modoLider ? 'Visão de Liderança' : 'Localize sua Célula'}</h1>
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-yellow-400 transition-colors">
                {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{modoLider ? 'Acesso completo aos dados.' : 'Encontre o grupo mais próximo.'}</p>
          
          <div className="flex gap-2 mb-4 relative z-50"> 
            <div className="relative group flex-1">
              <div className="absolute left-3 top-2.5 text-gray-400"><Search size={20} /></div>
              <input type="text" value={searchTerm} autoComplete="off" placeholder="Digite seu endereço..." className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 dark:text-white" onChange={handleInputChange} />
              {searchTerm && <button onClick={() => { setSearchTerm(''); setSuggestions([]); }} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"><X size={16} /></button>}
              
              {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[1000]">
                      {suggestions.map((item, index) => (
                          <button key={index} onClick={() => handleSelectAddress(item)} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors flex items-start gap-2">
                              <MapPin size={16} className="text-gray-400 mt-1 shrink-0" />
                              <div>
                                  <p className="text-sm font-bold text-gray-800 dark:text-white line-clamp-1">{item.address?.road || item.display_name.split(',')[0]}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.display_name}</p>
                              </div>
                          </button>
                      ))}
                  </div>
              )}
            </div>
            <button onClick={handleLocateUser} className={`p-2.5 rounded-xl border ${userLocation ? 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {locationLoading ? <Loader2 className="animate-spin" size={20} /> : <Navigation size={20} className={userLocation ? "fill-current" : ""} />}
            </button>
          </div>

          {userLocation && !searchTerm && (
             <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs px-3 py-2 rounded-lg mb-4 flex items-center justify-between">
                <span>📍 Mostrando células mais próximas.</span>
                <button onClick={() => { setUserLocation(null); setSearchTerm(''); }} className="font-bold hover:underline">Limpar</button>
             </div>
          )}

          <div className="grid grid-cols-2 gap-2 md:flex md:overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`w-full md:w-auto justify-center px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedCategory === null ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Todas</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)} className={`w-full md:w-auto justify-center px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedCategory === cat.id ? `${cat.color} text-white border-transparent` : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900 pb-24 scrollbar-thin dark:scrollbar-thumb-gray-700">
          {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div> : 
           filteredCelulas.length === 0 ? <div className="text-center text-gray-400 mt-10">Nenhuma célula encontrada. <br/>Tente buscar apenas o nome do bairro.</div> : 
           filteredCelulas.map((celula) => (
            <div key={celula.id} onClick={() => handleCellClick(celula)}>
                {renderSidebarCard(celula)}
            </div>
          ))}
        </div>
      </div>

      {/* MAPA */}
      <div className={`flex-1 h-full relative bg-gray-200 dark:bg-gray-800 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        <MapContainer ref={mapRef} center={[-23.691, -46.564]} zoom={13} className="h-full w-full z-10 outline-none">
          <TileLayer 
            attribution='© CartoDB' 
            url={darkMode 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            } 
          />
          {userLocation && <CircleMarker center={userLocation} radius={8} pathOptions={{ color: 'white', fillColor: '#2563eb', fillOpacity: 1 }}><Tooltip permanent direction="top" offset={[0, -10]} className="font-bold text-xs">Você</Tooltip></CircleMarker>}
          
          {filteredCelulas.map((celula) => (
            <Marker key={celula.id} position={celula.coords} ref={(el) => (markerRefs.current[celula.id] = el)}>
              <Popup className="custom-popup">
                 {/* RENDERIZA O POPUP COM FUNDO BRANCO E BANNER COLORIDO */}
                 {renderPopupContent(celula)}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] md:hidden">
        <button onClick={toggleView} className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform">
          {mobileView === 'list' ? <><MapIcon size={18} /> Ver Mapa</> : <><List size={18} /> Ver Lista</>}
        </button>
      </div>
    </div>
  );
}