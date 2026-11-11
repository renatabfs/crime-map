import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

interface MapViewProps {
  filters: any;
}

export default function MapView({ filters }: MapViewProps) {
  const position: [number, number] = [-14.8661, -40.8394];
  console.log('Filtros ativos:', filters);

  return (
    <div className="map-card">
      <div className="map-header">
        <div className="map-title">
          <MapPin size={20} color="#e12c2c" />
          <h3>Mapa de Criminalidade</h3>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          {/* TileLayer com tema escuro (Dark Matter) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </MapContainer>
      </div>
    </div>
  );
}
