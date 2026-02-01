import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
// Adicione 'Car' na lista de importações
import { Search, MapPin, Calendar, User, Users, MessageCircle, Loader2, Map as MapIcon, List, Navigation, X, Moon, Sun, UserCheck, Car } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../supabaseClient';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const GoogleMapsIcon = () => (
  <svg viewBox="0 0 232597 333333" className="w-6 h-6 shrink-0" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd">
    <path d="M151444 5419C140355 1916 128560 0 116311 0 80573 0 48591 16155 27269 41534l54942 46222 69232-82338z" fill="#1a73e8"/>
    <path d="M27244 41534C10257 61747 0 87832 0 116286c0 21876 4360 39594 11517 55472l70669-84002-54942-46222z" fill="#ea4335"/>
    <path d="M116311 71828c24573 0 44483 19910 44483 44483 0 10938-3957 20969-10509 28706 0 0 35133-41786 69232-82313-14089-27093-38510-47936-68048-57286L82186 87756c8166-9753 20415-15928 34125-15928z" fill="#4285f4"/>
    <path d="M116311 160769c-24573 0-44483-19910-44483-44483 0-10863 3906-20818 10358-28555l-70669 84027c12072 26791 32159 48289 52851 75381l85891-102122c-8141 9628-20339 15752-33948 15752z" fill="#fbbc04"/>
    <path d="M148571 275014c38787-60663 84026-88210 84026-158728 0-19331-4738-37552-13080-53581L64393 247140c6578 8620 13206 17793 19683 27900 23590 36444 17037 58294 32260 58294 15172 0 8644-21876 32235-58320z" fill="#34a853"/>
  </svg>
);

// Mantenha o Waze e Uber como estavam, pois você gostou
const WazeIcon = () => (
  <svg viewBox="0 0 123 123" className="w-6 h-6 shrink-0" fill="white">
     <path d="M55.1 104.2c4.2 0 8.4.2 12.7-.1 3.8-.2 7.9-.6 11.6-1.5 29.8-7.3 45.8-40.2 32.7-68.1C104.3 17.8 90.8 8.2 72.3 6.2 58.1 4.7 45.5 8.9 34.8 18.5 24.3 28 18.9 39.8 18.5 53.9c-.1 3.3 0 6.7 0 9.9-.1 7.2-4.1 12.7-11 14.9-.1 0-.3.2-.4.2 2.6 6.9 13.3 17.2 20 19.7 8.3 2.5 25.2 6.6 28 19.6zm19.8-24.5c-11.1-.6-18.4-5-23.1-13.8-1.1-2.2-.1-4.3 2.1-4.8 1.3-.3 2.5.7 3.5 2.2 1.2 1.9 2.4 3.8 4 5.3 8.8 8.3 23.3 5.7 28.8-5.1.7-1.3 1.5-2.3 3.1-2.3 2.3.1 3.7 2.4 2.6 4.6-2.9 5.9-7.5 10.2-13.7 12.3-2.7.9-5.5 1.3-7.3 1.6zM55.3 49c-3.4 0-6.1-2.7-6.1-6.1s2.7-6.1 6.1-6.1 6.1 2.7 6.1 6.1c0 3.3-2.7 6.1-6.1 6.1zm43 0c-3.4 0-6.1-2.7-6.1-6.1s2.7-6.1 6.1-6.1 6.1 2.7 6.1 6.1c-1.3 3.3-4 6.1-6.1 6.1z"/>
  </svg>
);

const UberIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);


let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -40]
});
L.Marker.prototype.options.icon = DefaultIcon;

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

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

const DAYS = [
  { id: 'terça', label: 'Terça' },
  { id: 'quarta', label: 'Quarta' },
  { id: 'sexta', label: 'Sexta' },
  { id: 'sábado', label: 'Sábado' },

];

export default function MapaBase({ modoLider = false }) {
  const [celulas, setCelulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); 
  const [mobileView, setMobileView] = useState('list');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  
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

  useEffect(() => { fetchCelulas(); }, []);

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
    const { data, error } = await supabase
        .from('celulas')
        .select('*, supervisores (nome_1, nome_2, whatsapp_1, whatsapp_2), coordenadores (nome, whatsapp)');
        
    if (error) { console.error("Erro:", error); setLoading(false); return; }

    const dadosTratados = data.map((row) => {
        if (!row.lat || !row.lon) return null;
        const catId = row.categoria ? row.categoria.toLowerCase().trim() : "figueira";
        const catConfig = categories.find(c => c.id === catId) || categories[1];
        
        const lideresDisplay = row.lider1_nome 
            ? (row.lider2_nome ? `${row.lider1_nome} e ${row.lider2_nome}` : row.lider1_nome) 
            : (row.lider || "-");

        return { 
            ...row, 
            titulo: row.nome || catConfig.display, 
            categoriaLabel: catConfig.label, 
            categoriaId: catId, 
            cor: catConfig.color, 
            liderExibicao: lideresDisplay,
            coords: [row.lat, row.lon] 
        };
      }).filter(item => item !== null);
      
    setCelulas(dadosTratados);
    setLoading(false);
  }

  const formatEnderecoCompleto = (celula) => {
      let end = `${celula.logradouro || ''}, ${celula.numero || ''}`;
      if (!celula.logradouro) end = celula.endereco || '';
      if (celula.complemento) end += ` - ${celula.complemento}`;
      return end;
  };

  const safeFlyTo = (lat, lon) => {
    if (!mapRef.current) return;
    const isMapVisible = window.innerWidth >= 768 || mobileView === 'map';
    if (isMapVisible) mapRef.current.flyTo([lat, lon], 14, { duration: 1.5 });
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

  // --- LÓGICA DE FILTRO E DISTÂNCIA (COM PROTEÇÃO) ---
// --- LÓGICA DE FILTRO E DISTÂNCIA ---
  const filteredCelulas = celulas
    .map(celula => ({ 
        ...celula, 
        distancia: userLocation ? getDistanceFromLatLonInKm(userLocation[0], userLocation[1], celula.coords[0], celula.coords[1]) : null 
    }))
    .filter((celula) => {
      // Filtro de Texto (Busca)
      if (searchTerm && !userLocation) {
          const termo = searchTerm.toLowerCase();
          const searchFields = modoLider ? (celula.nome + celula.bairro + celula.liderExibicao).toLowerCase() : (celula.bairro + celula.endereco).toLowerCase();
          return searchFields.includes(termo);
      }
      return true;
    })
    .filter((celula) => selectedCategory ? celula.categoriaId === selectedCategory : true)
    
    // --- NOVO FILTRO DE DIA ---
    .filter((celula) => {
        if (!selectedDay) return true;
        // Verifica se o texto do dia (ex: "Quarta-feira 20h") contém o filtro (ex: "quarta")
        return celula.dia && celula.dia.toLowerCase().includes(selectedDay);
    })
  
    .sort((a, b) => (a.distancia !== null && b.distancia !== null) ? a.distancia - b.distancia : 0);

const renderPopupContent = (celula) => (
    <div className="min-w-[260px] text-left bg-white font-sans">
       {/* TOPO COLORIDO */}
       <div className={`${celula.cor} p-3 flex items-center justify-between`}>
          <span className="font-bold text-white text-sm uppercase tracking-wide pr-2">{celula.titulo}</span>
          <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-sm whitespace-nowrap">
            {celula.categoriaLabel}
          </span>
       </div>

       <div className="p-4 text-gray-700 space-y-4 text-sm">
          
          {/* ENDEREÇO (Sempre no topo) */}
          <div className="flex items-start gap-2.5 pb-3 border-b border-gray-100">
             <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
             <div>
                <span className="block text-gray-800 font-medium leading-snug">
                   {modoLider ? `${formatEnderecoCompleto(celula)}` : celula.bairro}
                </span>
                {modoLider && <span className="text-xs text-gray-500">{celula.bairro}</span>}
                
                {!modoLider && <span className="block text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-bold">Localização Aproximada</span>}
                
                <div className="flex items-center gap-1.5 mt-1.5 text-blue-600 font-bold text-xs">
                    <Calendar size={14}/> {celula.dia}
                </div>
             </div>
          </div>

         {/* --- ÁREA DE CONTATOS --- */}
         {modoLider ? (
            <div className="space-y-4">
                
                {/* BLOCO 1: LÍDERES */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-bold text-sm">Líderes: <span className="font-normal text-gray-600">{celula.liderExibicao}</span></span>
                    </div>
                    {/* Botões dos Líderes */}
                    <div className="grid grid-cols-2 gap-2">
                        {celula.lider1_whatsapp ? (
                            <a href={`https://wa.me/${celula.lider1_whatsapp}`} target="_blank" className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors no-underline shadow-sm">
                                <WhatsAppIcon className="w-4 h-4" /> {celula.lider1_nome?.split(' ')[0] || 'Líder 1'}
                            </a>
                        ) : <span className="text-xs text-gray-400 italic text-center py-2">Sem Contato</span>}
                        
                        {celula.lider2_whatsapp && (
                            <a href={`https://wa.me/${celula.lider2_whatsapp}`} target="_blank" className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors no-underline shadow-sm">
                                <WhatsAppIcon className="w-4 h-4" /> {celula.lider2_nome?.split(' ')[0] || 'Líder 2'}
                            </a>
                        )}
                    </div>
                </div>

                {/* BLOCO 2: SUPERVISORES */}
                {celula.supervisores && (
                    <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <UserCheck size={16} className="text-blue-500" />
                            <span className="text-gray-900 font-bold text-sm">Supervisores: <span className="font-normal text-gray-600">{celula.supervisores.nome_1} {celula.supervisores.nome_2 && `e ${celula.supervisores.nome_2}`}</span></span>
                        </div>
                        {/* Botões dos Supervisores */}
                        <div className="grid grid-cols-2 gap-2">
                            <a href={`https://wa.me/${celula.supervisores.whatsapp_1}`} target="_blank" className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors no-underline w-full shadow-sm">
                                <WhatsAppIcon className="w-4 h-4" />{celula.supervisores.nome_1.split(' ')[0]}
                            </a>
                            {celula.supervisores.whatsapp_2 && (
                                <a href={`https://wa.me/${celula.supervisores.whatsapp_2}`} target="_blank" className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors no-underline w-full shadow-sm">
                                    <WhatsAppIcon className="w-4 h-4" /> {celula.supervisores.nome_2.split(' ')[0]}
                                </a>
                            )}
                        </div>
                    </div>
                )}

            </div>
         ) : (
            // VISÃO PÚBLICA (MANTÉM COMO ESTAVA)
            (() => {
                let mensagem = `Graça e paz, vi pelo localizador que tem uma célula ${celula.categoriaLabel} próxima de casa,\ngostaria de mais informações sobre a ${celula.titulo}`;
                if (userLocation) {
                    const linkMaps = `http://googleusercontent.com/maps.google.com/?q=${userLocation[0]},${userLocation[1]}`;
                    mensagem += `\n\nEstou localizado aqui: ${linkMaps}`;
                }
                const linkWhatsapp = celula.coordenadores 
                    ? `https://wa.me/${celula.coordenadores.whatsapp}?text=${encodeURIComponent(mensagem)}` 
                    : '#';

                return (
                    <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-bold bg-[#25D366] !text-white hover:bg-[#20bd5a] transition-colors shadow-md no-underline">
                        <WhatsAppIcon className="w-5 h-5 text-white" /> Fale Conosco
                    </a>
                );
            })()
         )}

        {/* BARRA DE NAVEGAÇÃO VERTICAL CORRIGIDA */}
         <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2.5">
             <span className="text-[10px] font-bold text-gray-400 uppercase text-center tracking-wider mb-1">Navegar com:</span>

             {/* 1. GOOGLE MAPS (Link Corrigido) */}
             <a 
                href={`https://www.google.com/maps/search/?api=1&query=${celula.coords[0]},${celula.coords[1]}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-[#4285F4] !text-white hover:bg-blue-600 transition-transform hover:scale-[1.02] shadow-sm no-underline group"
             >
                 {/* Círculo branco para destacar o Pin colorido */}
                 <div className="bg-white rounded-full p-0.5 flex items-center justify-center w-7 h-7 shadow-sm"><GoogleMapsIcon /></div>
                 <span className="font-bold text-sm">Google Maps</span>
             </a>

             {/* 2. WAZE (Link Corrigido) */}
             <a 
                href={`https://www.waze.com/ul?ll=${celula.coords[0]},${celula.coords[1]}&navigate=yes`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-[#33CCFF] !text-white hover:bg-cyan-400 transition-transform hover:scale-[1.02] shadow-sm no-underline group"
             >
                 <div className="flex items-center justify-center w-7 h-7"><WazeIcon /></div>
                 <span className="font-bold text-sm">Waze</span>
             </a>

             {/* 3. UBER (Já estava correto, mas atualizei o text-white) */}
             <a 
                href={`https://m.uber.com/ul/?action=setPickup&client_id=YOUR_CLIENT_ID&pickup=my_location&dropoff[latitude]=${celula.coords[0]}&dropoff[longitude]=${celula.coords[1]}&dropoff[nickname]=${encodeURIComponent(celula.titulo)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-black !text-white hover:bg-gray-800 transition-transform hover:scale-[1.02] shadow-sm no-underline group"
             >
                 <div className="flex items-center justify-center w-7 h-7"><UberIcon /></div>
                 <span className="font-bold text-sm">Uber</span>
             </a>

         </div>

         </div>



       
    </div>
  );

const renderSidebarCard = (celula) => (
    <div className={`${celula.cor} p-5 rounded-lg shadow-md transition-all hover:shadow-lg relative overflow-hidden cursor-pointer group`}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 text-white/10 pointer-events-none group-hover:scale-110 transition-transform">
            <Users size={100} strokeWidth={1} />
        </div>
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start mb-3 relative z-10">
            <div>
                <h3 className="font-bold text-xl text-white leading-tight mb-1">{celula.titulo}</h3>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    {celula.categoriaLabel}
                </span>
            </div>
            {typeof celula.distancia === 'number' && (
                <div className="bg-white/20 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 backdrop-blur-sm shrink-0">
                    <Navigation size={12} className="fill-current"/>{celula.distancia < 1 ? Math.round(celula.distancia*1000) + 'm' : celula.distancia.toFixed(1) + 'km'}
                </div>
            )}
        </div>

        {/* CORPO */}
        <div className="space-y-2 relative z-10 text-white/90 text-sm">
            
            {/* Bloco Líderes (NA MESMA LINHA) */}
            <div className="flex items-start gap-2">
                <User size={16} className="mt-0.5 text-white/70 shrink-0" />
                <p className="leading-tight">
                    {/* Removi o 'block' e adicionei 'mr-1' */}
                    <span className="font-bold opacity-70 text-xs uppercase mr-1">Líderes:</span>
                    {celula.liderExibicao}
                </p>
            </div>

            {/* Bloco Supervisores (NA MESMA LINHA) */}
            {modoLider && celula.supervisores && (
                <div className="flex items-start gap-2">
                    <UserCheck size={16} className="mt-0.5 text-white/70 shrink-0" />
                    <p className="leading-tight">
                        <span className="font-bold opacity-70 text-xs uppercase mr-1">Supervisores:</span>
                        {celula.supervisores.nome_1} {celula.supervisores.nome_2 && `e ${celula.supervisores.nome_2}`}
                    </p>
                </div>
            )}

            {/* Endereço */}
            <div className="flex items-start gap-2 pt-1 border-t border-white/10 mt-2">
                <MapPin size={16} className="mt-0.5 text-white/70 shrink-0" />
                <div>
                    <p className="font-medium text-white line-clamp-1">{celula.bairro}</p>
                    <p className="text-xs text-white/70 line-clamp-1">
                        {modoLider ? formatEnderecoCompleto(celula) : "Localização aproximada"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Calendar size={16} className="text-white/70 shrink-0" />
                <span className="font-bold text-xs">{celula.dia}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 md:flex-row overflow-hidden relative">
      <div className={`w-full md:w-[450px] md:shrink-0 flex-col h-full bg-white dark:bg-gray-900 shadow-2xl z-20 transition-all ${mobileView === 'map' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 relative"> 
          <div className="flex justify-between items-start mb-1">
             {/* TÍTULO ATUALIZADO */}
             <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{modoLider ? 'Localizador de Células (Liderança)' : 'Localizador de Células Renovo'}</h1>
             <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-yellow-400 transition-colors">
                {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{modoLider ? 'Acesso completo aos dados.' : 'Encontre o grupo mais próximo.'}</p>
          
          <div className="flex gap-2 mb-4 relative z-50"> 
            <div className="relative group flex-1">
              <div className="absolute left-3 top-2.5 text-gray-400"><Search size={20} /></div>
              <input type="text" value={searchTerm} autoComplete="off" placeholder="Digite seu endereço..." className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 dark:text-white placeholder-gray-400" onChange={handleInputChange} />
              {searchTerm && <button onClick={() => { setSearchTerm(''); setSuggestions([]); }} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"><X size={18} /></button>}
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

          <div className="grid grid-cols-2 gap-2 md:flex md:overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`w-full md:w-auto justify-center px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedCategory === null ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Todas</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)} className={`w-full md:w-auto justify-center px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedCategory === cat.id ? `${cat.color} text-white border-transparent` : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* --- NOVO: BOTÕES DE DIAS DA SEMANA --- */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-1">
             <button onClick={() => setSelectedDay(null)} className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${selectedDay === null ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                Todos os dias
             </button>
             {DAYS.map((d) => (
               <button 
                 key={d.id} 
                 onClick={() => setSelectedDay(selectedDay === d.id ? null : d.id)} 
                 className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${selectedDay === d.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
               >
                 {d.label}
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

      <div className={`flex-1 h-full relative bg-gray-200 dark:bg-gray-800 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        <MapContainer ref={mapRef} center={[-23.691, -46.564]} zoom={13} className="h-full w-full z-10 outline-none">
          <TileLayer attribution='© CartoDB' url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"} />
          {userLocation && <CircleMarker center={userLocation} radius={8} pathOptions={{ color: 'white', fillColor: '#2563eb', fillOpacity: 1 }}><Tooltip permanent direction="top" offset={[0, -10]} className="font-bold text-xs">Você</Tooltip></CircleMarker>}
          {filteredCelulas.map((celula) => (
            <Marker key={celula.id} position={celula.coords} ref={(el) => (markerRefs.current[celula.id] = el)}>
              <Popup className="custom-popup">{renderPopupContent(celula)}</Popup>
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