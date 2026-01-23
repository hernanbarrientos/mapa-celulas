import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Search, MapPin, Calendar, User, MessageCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { celulas, categories } from './data/celulas';

// Correção técnica para os ícones do Leaflet aparecerem corretamente
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

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Lógica de filtragem dos dados
  const filteredCelulas = celulas.filter((celula) => {
    const matchesSearch = 
      celula.bairro.toLowerCase().includes(searchTerm.toLowerCase()) ||
      celula.endereco.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? celula.categoria === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row">
      
      {/* --- PAINEL LATERAL (Esquerda no PC, Topo no Mobile) --- */}
      <div className="w-full md:w-1/3 flex flex-col h-[55vh] md:h-full bg-white shadow-2xl z-20">
        
        {/* Cabeçalho e Filtros */}
        <div className="p-6 border-b border-gray-100 bg-white">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Encontre sua Célula</h1>
          <p className="text-sm text-gray-500 mb-4">Localize o grupo mais próximo de você.</p>
          
          {/* Campo de Busca */}
          <div className="relative mb-4 group">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="Digite seu bairro..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Botões de Filtro (Pills) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                selectedCategory === null 
                  ? 'bg-gray-800 text-white border-gray-800 shadow-lg shadow-gray-200' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id 
                    ? `${cat.color} text-white border-transparent shadow-md` 
                    : `bg-white text-gray-600 border-gray-200 hover:bg-gray-50`
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Células */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {filteredCelulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
              <Search size={32} className="mb-2 opacity-20" />
              Nenhuma célula encontrada.
            </div>
          ) : (
            filteredCelulas.map((celula) => (
              <div key={celula.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">{celula.nome}</h3>
                  <span className={`text-[10px] px-2 py-1 rounded-full text-white uppercase font-bold tracking-wider ${
                    categories.find(c => c.id === celula.categoria)?.color
                  }`}>
                    {categories.find(c => c.id === celula.categoria)?.label}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <span className="leading-snug">{celula.endereco} - <strong>{celula.bairro}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span>Líder: {celula.lider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{celula.dia}</span>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/${celula.whatsapp}`} 
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95 transform duration-100"
                >
                  <MessageCircle size={18} />
                  Chamar no WhatsApp
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- MAPA INTERATIVO --- */}
      <div className="w-full md:w-2/3 h-[45vh] md:h-full relative bg-gray-200">
        <MapContainer center={[-23.55052, -46.63330]} zoom={12} className="h-full w-full z-10">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {filteredCelulas.map((celula) => (
            <Marker key={celula.id} position={celula.coords}>
              <Popup className="custom-popup">
                <div className="min-w-[150px]">
                  <strong className="block text-base font-bold text-gray-800 mb-1">{celula.nome}</strong>
                  <span className="text-xs text-gray-500 uppercase font-bold mb-2 block">{categories.find(c => c.id === celula.categoria)?.label}</span>
                  <p className="text-sm text-gray-600 mb-2">{celula.bairro}</p>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${celula.coords[0]},${celula.coords[1]}`} 
                    target="_blank" 
                    className="block text-center bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700 transition-colors"
                  >
                     Ver rota no Maps
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