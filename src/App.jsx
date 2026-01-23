import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import { Search, MapPin, Calendar, User, Users, MessageCircle, Loader2, Map as MapIcon, List, Navigation } from 'lucide-react';
import Papa from 'papaparse';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Configuração do ícone padrão (Azul)
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Função Matemática para calcular distância (Fórmula de Haversine)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

const categories = [
  { id: 'teens', label: 'Teens', display: 'Célula Teens', color: 'bg-orange-500' },
  { id: 'figueira', label: 'Figueira', display: 'Célula Figueira', color: 'bg-purple-800' },
  { id: 'valentes', label: 'Valentes', display: 'Célula Valentes de Davi', color: 'bg-blue-900' },
];

export default function App() {
  const [celulas, setCelulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  
  // NOVO: Estado para guardar a localização do usuário
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const mapRef = useRef(null);
  const markerRefs = useRef({});

  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8VQzlnvETI_hTUdJmWcVJgOk2jFETEwlcTNyqAlcPUSOYAAeU4wAUPcxzWQi46Fm4fx3OxAT2mbBV/pub?gid=0&single=true&output=csv'
  
  useEffect(() => {
    setLoading(true);
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const dadosTratados = results.data
          .map((row, index) => {
            if (!row.lat || !row.lon) return null;
            const latString = row.lat.replace(',', '.');
            const lonString = row.lon.replace(',', '.');
            const lat = parseFloat(latString);
            const lon = parseFloat(lonString);

            if (isNaN(lat) || isNaN(lon)) return null;

            const catId = row.categoria ? row.categoria.toLowerCase().trim() : "figueira";
            const catConfig = categories.find(c => c.id === catId) || categories[1];

            return {
              id: row.id || index,
              titulo: catConfig.display, 
              categoriaId: catId,
              cor: catConfig.color,
              lider: row.lider || "-",
              supervisores: row.supervisores || "", 
              bairro: row.bairro || "",
              endereco: row.endereco || "",
              dia: row.dia || "",
              contatos: [
                { numero: row.whatsapp1, label: "Líder" },
                { numero: row.whatsapp2, label: "Vice/Supervisor" }
              ].filter(c => c.numero && c.numero.length > 5), 
              coords: [lat, lon]
            };
          })
          .filter(item => item !== null);

        setCelulas(dadosTratados);
        setLoading(false);
      },
      error: (err) => {
        console.error("Erro CSV:", err);
        setLoading(false);
      }
    });
  }, []);

  // --- FUNÇÃO PARA PEGAR GPS ---
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLocationLoading(false);
        
        // Voa para a posição do usuário
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 14, { duration: 1.5 });
        }
        
        // No mobile, se estiver na lista, avisa que ordenou
        if (mobileView === 'list') {
            // Opcional: Feedback visual
        }
      },
      (error) => {
        console.error(error);
        alert("Não conseguimos pegar sua localização. Verifique se o GPS está ativo.");
        setLocationLoading(false);
      }
    );
  };

  // Filtra e ORDENA por distância
  const filteredCelulas = celulas
    .map(celula => {
      // Se tiver localização do usuário, calcula a distância
      if (userLocation) {
        const dist = getDistanceFromLatLonInKm(
            userLocation[0], userLocation[1], 
            celula.coords[0], celula.coords[1]
        );
        return { ...celula, distancia: dist };
      }
      return { ...celula, distancia: null };
    })
    .filter((celula) => {
      const matchesSearch = 
        (celula.bairro && celula.bairro.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (celula.endereco && celula.endereco.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory ? celula.categoriaId === selectedCategory : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Lógica de Ordenação: Se tiver distância calculada, a menor vem primeiro
      if (a.distancia !== null && b.distancia !== null) {
        return a.distancia - b.distancia;
      }
      return 0; // Se não tiver GPS, mantém a ordem da planilha
    });

  const handleCellClick = (celula) => {
    setMobileView('map');
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        mapRef.current.flyTo(celula.coords, 16, { duration: 1.5 });
      }
      const marker = markerRefs.current[celula.id];
      if (marker) marker.openPopup();
    }, 100);
  };

  const toggleView = () => {
    const newView = mobileView === 'list' ? 'map' : 'list';
    setMobileView(newView);
    if (newView === 'map') {
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row overflow-hidden relative">
      
      {/* SIDEBAR */}
      <div className={`w-full md:w-[450px] md:shrink-0 flex-col h-full bg-white shadow-2xl z-20 transition-all ${mobileView === 'map' ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="p-6 border-b border-gray-100 bg-white shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Localize sua Célula</h1>
          <p className="text-sm text-gray-500 mb-4">Encontre o grupo mais próximo.</p>
          
          <div className="flex gap-2 mb-4">
            {/* INPUT DE BUSCA TEXTUAL */}
            <div className="relative group flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Bairro ou rua..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* BOTÃO DE GPS (NOVO) */}
            <button 
              onClick={handleLocateUser}
              title="Usar minha localização"
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-center
                ${userLocation 
                    ? 'bg-blue-100 border-blue-300 text-blue-600' // Ativo
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300' // Inativo
                }`}
            >
              {locationLoading ? <Loader2 className="animate-spin" size={20} /> : <Navigation size={20} className={userLocation ? "fill-current" : ""} />}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${selectedCategory === null ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border-gray-200'}`}>Todas</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${selectedCategory === cat.id ? `${cat.color} text-white border-transparent` : `bg-white text-gray-600 border-gray-200`}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 pb-24">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>
          ) : filteredCelulas.length === 0 ? (
             <div className="text-center text-gray-400 mt-10">Nenhuma célula encontrada.</div>
          ) : filteredCelulas.map((celula) => (
            <div 
              key={celula.id} 
              onClick={() => handleCellClick(celula)}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
            >
              
              {/* Badge de Distância (Só aparece se tiver GPS ativo) */}
              {celula.distancia !== null && (
                <div className="absolute top-4 right-4 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-100 flex items-center gap-1">
                   <Navigation size={10} className="fill-current"/>
                   {celula.distancia < 1 
                      ? `${Math.round(celula.distancia * 1000)}m` 
                      : `${celula.distancia.toFixed(1)}km`}
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <span className={`w-1.5 h-8 rounded-full ${celula.cor}`}></span>
                <h3 className="font-bold text-gray-800 text-lg uppercase pr-16">{celula.titulo}</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4 pl-3 border-l-2 border-gray-50 ml-0.5">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span><strong>Líder:</strong> {celula.lider}</span>
                </div>
                {celula.supervisores && (
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span><strong>Supervisores:</strong> {celula.supervisores}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <span>{celula.endereco} - {celula.bairro}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-blue-600 font-medium">{celula.dia}</span>
                </div>
              </div>
              <div className="grid gap-2">
                {celula.contatos.map((contato, idx) => (
                  <a 
                    key={idx} href={`https://wa.me/${contato.numero}`} target="_blank"
                    onClick={(e) => e.stopPropagation()} 
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${idx === 0 ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}
                  >
                    <MessageCircle size={18} />
                    Chamar {celula.contatos.length > 1 ? `(${contato.label})` : 'no WhatsApp'}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAPA */}
      <div className={`flex-1 h-full relative bg-gray-200 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        <MapContainer ref={mapRef} center={[-23.691, -46.564]} zoom={13} className="h-full w-full z-10 outline-none">
          <TileLayer attribution='© CartoDB' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          {/* MARCADOR DA POSIÇÃO DO USUÁRIO (BOLINHA AZUL PULSANTE) */}
          {userLocation && (
             <CircleMarker 
                center={userLocation} 
                radius={8} 
                pathOptions={{ color: 'white', fillColor: '#2563eb', fillOpacity: 1, weight: 2 }}
             >
                <Tooltip permanent direction="top" offset={[0, -10]} className="font-bold text-xs">
                   Você está aqui
                </Tooltip>
             </CircleMarker>
          )}

          {filteredCelulas.map((celula) => (
            <Marker key={celula.id} position={celula.coords} ref={(el) => (markerRefs.current[celula.id] = el)}>
              <Popup className="custom-popup">
                <div className="min-w-[200px] p-1">
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide shadow-sm ${celula.cor}`}>
                      {celula.titulo}
                    </span>
                    {/* Distância no Popup também */}
                    {celula.distancia !== null && (
                        <span className="ml-2 text-xs font-bold text-gray-500">
                             {celula.distancia < 1 ? Math.round(celula.distancia*1000) + 'm' : celula.distancia.toFixed(1) + 'km'}
                        </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 space-y-1.5 mb-4 px-1">
                    <p><span className="font-semibold text-gray-900">Líder:</span> {celula.lider}</p>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-medium">{celula.bairro}</p>
                    <p className="text-blue-600 font-bold text-base flex items-center gap-1 mt-1"><Calendar size={14} strokeWidth={2.5} />{celula.dia}</p>
                  </div>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${celula.coords[0]},${celula.coords[1]}`} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-blue-600 !text-white text-sm font-bold py-2.5 rounded-lg hover:bg-blue-700 no-underline">
                     Traçar Rota
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] md:hidden">
        <button
          onClick={toggleView}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
        >
          {mobileView === 'list' ? <><MapIcon size={18} /> Ver Mapa</> : <><List size={18} /> Ver Lista</>}
        </button>
      </div>
    </div>
  );
}