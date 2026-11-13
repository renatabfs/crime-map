import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers, Flame } from 'lucide-react';
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
  const [mapMode, setMapMode] = useState<'map' | 'satellite' | 'heatmap'>('map');
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
          <button
            onClick={() => setMapMode('map')}
            style={{
              backgroundColor: mapMode === 'map' ? '#e12c2c' : 'transparent',
              color: mapMode === 'map' ? 'white' : '#8b92a5',
              border: mapMode === 'map' ? 'none' : '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <MapPin size={14} /> Mapa
          </button>
          <button
            onClick={() => setMapMode('satellite')}
            style={{
              backgroundColor: mapMode === 'satellite' ? '#e12c2c' : 'transparent',
              color: mapMode === 'satellite' ? 'white' : '#8b92a5',
              border: mapMode === 'satellite' ? 'none' : '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Layers size={14} /> Satélite
          </button>
          <button
            onClick={() => setMapMode('heatmap')}
            style={{
              backgroundColor: mapMode === 'heatmap' ? '#e12c2c' : 'transparent',
              color: mapMode === 'heatmap' ? 'white' : '#8b92a5',
              border: mapMode === 'heatmap' ? 'none' : '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Flame size={14} /> Calor
          </button>
        </div>
      </div>

      <div className={`map-wrapper ${mapMode === 'satellite' ? 'satellite-mode' : ''}`}>
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          {mapMode === 'satellite' ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri"
            />
          ) : (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          )}

          <HeatmapLayer key={`${filters.period}-${filters.crimeType}-${mapMode}`} points={heatPoints} />

          {mapMode === 'map' &&
            filteredCrimes.map((crime) => (
              <CircleMarker
                key={crime.id}
                center={crime.coords}
                radius={7}
                pathOptions={{
                  color: '#ff6b6b',
                  fillColor: '#e12c2c',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{crime.type}</strong> — {crime.neighborhood}
                  <br />
                  {crime.description}
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
