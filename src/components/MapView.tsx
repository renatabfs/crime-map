import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers, Flame } from 'lucide-react';
import HeatmapLayer from './HeatmapLayer';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';
import type { CrimeRecord, CityMetadata } from '../services/crimeService';

interface MapViewProps {
  filters: any;
  searchQuery?: string;
  onSelectOccurrence?: (occurrence: CrimeRecord) => void;
}

function MapCameraController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.9 });
  }, [center, zoom, map]);

  return null;
}

export default function MapView({ filters, searchQuery = '', onSelectOccurrence, }: MapViewProps) {
  const [mapMode, setMapMode] = useState<'map' | 'satellite' | 'heatmap'>('map');
  const [filteredCrimes, setFilteredCrimes] = useState<CrimeRecord[]>([]);
  const [cities, setCities] = useState<CityMetadata[]>([]);

  useEffect(() => {
    let active = true;
    crimeService.getCitiesMetadata().then((list) => {
      if (active) setCities(list);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    crimeService
      .getFilteredRecords({
        state: filters.state,
        city: filters.city,
        neighborhood: filters.neighborhood,
        period: filters.period,
        crimeType: filters.crimeType,
        searchQuery,
      })
      .then((records) => {
        if (active) setFilteredCrimes(records);
      });
    return () => {
      active = false;
    };
  }, [filters, searchQuery]);

  const { cameraCenter, cameraZoom } = useMemo(() => {
    if (
      filters.neighborhood &&
      filters.neighborhood !== 'all' &&
      filteredCrimes.length > 0
    ) {
      return {
        cameraCenter: filteredCrimes[0].coords as [number, number],
        cameraZoom: 15,
      };
    }

    const selectedCityMeta = cities.find(
      (c) => c.name.toLowerCase() === (filters.city || '').toLowerCase()
    );

    if (selectedCityMeta) {
      return {
        cameraCenter: selectedCityMeta.coords,
        cameraZoom: selectedCityMeta.zoom,
      };
    }

    const selectedStateMeta = BRAZIL_STATES.find(
      (s) => s.uf.toLowerCase() === (filters.state || '').toLowerCase()
    );

    if (selectedStateMeta) {
      return {
        cameraCenter: selectedStateMeta.coords,
        cameraZoom: selectedStateMeta.zoom,
      };
    }

    if (filters.city === 'all' && (!filters.state || filters.state === 'all')) {
      return {
        cameraCenter: [-14.235, -51.9253] as [number, number],
        cameraZoom: 4,
      };
    }

    return {
      cameraCenter: [-14.8661, -40.8394] as [number, number],
      cameraZoom: 13,
    };
  }, [filters.state, filters.city, filters.neighborhood, cities, filteredCrimes]);

  const intensity =
    filters.period === '1-year' ? 0.7 : filters.period === '6-months' ? 0.45 : 1.0;

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
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fbbf24',
            }}
            title="Municípios carregados via API oficial do IBGE; ocorrências geradas para demonstração."
          >
            Base Demonstrativa
          </span>
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
          center={cameraCenter}
          zoom={cameraZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <MapCameraController center={cameraCenter} zoom={cameraZoom} />
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

          <HeatmapLayer key={`${filters.city}-${filters.neighborhood}-${filters.period}-${filters.crimeType}-${mapMode}`}
            points={heatPoints} />

          {mapMode === 'map' &&
            filteredCrimes.map((crime) => (
              <CircleMarker
                key={crime.id}
                center={crime.coords}
                radius={7}
                eventHandlers={{
                  click: () => {
                    if (onSelectOccurrence) {
                      onSelectOccurrence(crime);
                    }
                  },
                }}
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
