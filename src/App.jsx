import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Search, MapPin, Calendar, User, Users, MessageCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// CORES E CATEGORIAS (Ajuste o Roxo aqui se quiser)
const categories = [
  { id: 'teens', label: 'Teens', display: 'Célula Teens', color: 'bg-orange-500' },
  { id: 'figueira', label: 'Figueira', display: 'Célula Figueira', color: 'bg-purple-800' },
  { id: 'valentes', label: 'Valentes de Davi', display: 'Célula Valentes de Davi', color: 'bg-blue-900' },
];

export default function App() {
  const [celulas, setCelulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- REFERÊNCIAS PARA INTERAÇÃO ---
  const mapRef = useRef(null); // Para controlar o zoom/pan do mapa
  const markerRefs = useRef({}); // Para abrir os popups individualmente

  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8VQzlnvETI_hTUdJmWcVJgOk2jFETEwlcTNyqAlcPUSOYAAeU4wAUPcxzWQi46Fm4fx3OxAT2mbBV/pub?gid=0&single=true&output=csv'

  useEffect(() => {
    setLoading(true);
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const dadosTratados = results.data.map((row, index) => {
          const lat = row.lat ? parseFloat(row.lat.replace(',', '.')) : 0;
          const lon = row.lon ? parseFloat(row.lon.replace(',', '.')) : 0;
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
        }).filter(item => item.coords[0] !== 0);

        setCelulas(dadosTratados);
        setLoading(false);
      },
      error: (err) => {
        console.error("Erro CSV:", err);
        setLoading(false);
      }
    });
  }, []);

  const filteredCelulas = celulas.filter((celula) => {
    const matchesSearch = 
      (celula.bairro && celula.bairro.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (celula.endereco && celula.endereco.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory ? celula.categoriaId === selectedCategory : true;

    return matchesSearch && matchesCategory;
  });

  // --- NOVA FUNÇÃO: CLIQUE NO CARD LATERAL ---
  const handleCellClick = (celula) => {
    // 1. Voar para o local no mapa
    if (mapRef.current) {
      mapRef.current.flyTo(celula.coords, 16, {
        duration: 1.5 // Velocidade da animação (segundos)
      });
    }

    // 2. Abrir o Popup do marcador específico
    const marker = markerRefs.current[celula.id];
    if (marker) {
      marker.openPopup();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row">
      
      {/* SIDEBAR LATERAL */}
      <div className="w-full md:w-[450px] md:shrink-0 flex flex-col h-[55vh] md:h-full bg-white shadow-2xl z-20">
        
        {/* Header e Filtros */}
        <div className="p-6 border-b border-gray-100 bg-white">
          <h1 className="text-2xl font-bold text-gray-800">Localize sua Célula</h1>
          <p className="text-sm text-gray-500 mb-4">Encontre o grupo mais próximo da sua casa.</p>
          
          <div className="relative mb-4 group">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Busque por bairro ou rua..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === null ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  selectedCategory === cat.id 
                    ? `${cat.color} text-white border-transparent` 
                    : `bg-white text-gray-600 border-gray-200`
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600"/></div>
          ) : filteredCelulas.map((celula) => (
            // AQUI ADICIONAMOS O EVENTO DE CLICK NO CARD
            <div 
              key={celula.id} 
              onClick={() => handleCellClick(celula)}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            >
              
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-1.5 h-8 rounded-full ${celula.cor}`}></span>
                <h3 className="font-bold text-gray-800 text-lg uppercase">{celula.titulo}</h3>
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
                    key={idx}
                    href={`https://wa.me/${contato.numero}`} 
                    target="_blank"
                    // stopPropagation impede que o clique no botão ative o zoom no mapa também
                    onClick={(e) => e.stopPropagation()} 
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors
                      ${idx === 0 
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
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
      <div className="flex-1 h-[45vh] md:h-full relative bg-gray-200">
        <MapContainer 
          ref={mapRef} // Conecta a referência do mapa
          center={[-23.691, -46.564]} 
          zoom={13} 
          className="h-full w-full z-10 outline-none"
        >
          <TileLayer
            attribution='© CartoDB'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {filteredCelulas.map((celula) => (
            <Marker 
              key={celula.id} 
              position={celula.coords}
              // Salva a referência deste marcador específico usando o ID da célula
              ref={(el) => (markerRefs.current[celula.id] = el)}
            >
              <Popup className="custom-popup">
                <div className="min-w-[200px] p-1">
                  
                  {/* --- LABEL DO POPUP (DESIGN CORRIGIDO) --- */}
                  {/* Agora usa bg-cor, text-white e rounded-full, igual ao sidebar */}
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide shadow-sm ${celula.cor}`}>
                      {celula.titulo}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700 space-y-1.5 mb-4 px-1">
                    <p>
                      <span className="font-semibold text-gray-900">Líder:</span> {celula.lider}
                    </p>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-medium">
                      {celula.bairro}
                    </p>
                    
                    <p className="text-blue-600 font-bold text-base flex items-center gap-1 mt-1">
                      <Calendar size={14} strokeWidth={2.5} />
                      {celula.dia}
                    </p>
                  </div>
                  
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${celula.coords[0]},${celula.coords[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-600 !text-white text-sm font-bold py-2.5 rounded-lg transition-colors hover:bg-blue-700 active:bg-blue-800 shadow-sm no-underline"
                  >
                     Traçar Rota
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}