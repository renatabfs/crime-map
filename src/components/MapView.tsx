import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import HeatmapLayer from './HeatmapLayer';
import { crimeData } from '../data/mockData';

interface MapViewProps {
  filters: any;
}

const position: [number, number] = [-14.8661, -40.8394];
const heatPoints: [number, number, number][] = [
  [-14.8661, -40.8394, 1.0],
  [-14.8650, -40.8380, 0.8],
  [-14.8670, -40.8400, 0.9],
  [-14.8780, -40.8500, 0.7],
  [-14.8790, -40.8480, 0.6],
  [-14.8850, -40.8300, 0.5],
  [-14.8840, -40.8320, 0.4]
];

export default function MapView({ filters }: MapViewProps) {
  const intensity =
    filters.period === '1-year' ? 0.7 : filters.period === '6-months' ? 0.45 : 1.0;

  const filteredCrimes = crimeData.filter(
    (item) => filters.crimeType === 'all' || item.type === filters.crimeType
  );

  const heatPoints: [number, number, number][] = filteredCrimes.map((item) => [
    item.coords[0],
    item.coords[1],
    intensity,
  ]);

  return (
    <div className="map-card">
      <div className="map-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="map-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={20} color="#e12c2c" />
          <h3 style={{ margin: 0 }}>Mapa de Criminalidade</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ backgroundColor: '#e12c2c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}><MapPin size={14} /> Mapa</button>
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
          <HeatmapLayer key={`${filters.period}-${filters.crimeType}`} points={heatPoints} />
        </MapContainer>
      </div>
    </div>
  );
}
