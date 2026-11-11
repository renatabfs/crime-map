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
      <div className="map-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="map-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={20} color="#e12c2c" />
          <h3 style={{ margin: 0 }}>Mapa de Criminalidade</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ backgroundColor: '#e12c2c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}><MapPin size={14}/> Mapa</button>
          <button style={{ backgroundColor: 'transparent', color: '#8b92a5', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Satélite</button>
          <button style={{ backgroundColor: 'transparent', color: '#8b92a5', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Calor</button>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </MapContainer>
      </div>
    </div>
  );
}
