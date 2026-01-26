import MapaBase from '../components/MapaBase';

export default function MapaPublico() {
  // Simplesmente renderiza o componente base no modo padrão (Público)
  return <MapaBase modoLider={false} />;
}