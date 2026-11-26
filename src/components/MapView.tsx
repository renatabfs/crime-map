import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers, Flame } from 'lucide-react';
import HeatmapLayer from './HeatmapLayer';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';
import type { MunicipalityRankingItem, MetricDisplayMode } from '../types/crime';

interface MapViewProps {
  filters: any;
  searchQuery?: string;
  onSelectOccurrence?: (occurrence: any) => void;
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

export default function MapView({ filters }: MapViewProps) {
  const [mapMode, setMapMode] = useState<'map' | 'satellite' | 'heatmap'>('map');
  const [topMunicipalitiesCache, setTopMunicipalitiesCache] = useState<
    Record<string, MunicipalityRankingItem[]>
  >({});
  const [loadingPopupKey, setLoadingPopupKey] = useState<string | null>(null);

  const indicatorId: string = filters.indicatorId || 'homicidio-doloso';
  const metricMode: MetricDisplayMode = filters.metricMode || 'rate';
  const stateUf: string = filters.state || 'all';

  const catalog = useMemo(() => crimeService.getOfficialIndicatorsCatalog(), []);
  const currentIndicator = useMemo(
    () => catalog.find((c) => c.id === indicatorId) ?? catalog[0],
    [catalog, indicatorId]
  );

  const isMunicipalIndicator =
    currentIndicator?.granularity === 'state_and_municipality';

  const loadTopMunicipalitiesForUf = (uf: string) => {
    if (!isMunicipalIndicator) return;
    const cacheKey = `${uf}::${indicatorId}::${metricMode}`;
    if (topMunicipalitiesCache[cacheKey] || loadingPopupKey === cacheKey) return;

    setLoadingPopupKey(cacheKey);
    crimeService
      .getOfficialMunicipalityRanking(uf, indicatorId, metricMode)
      .then((ranking) => {
        setTopMunicipalitiesCache((prev) => ({
          ...prev,
          [cacheKey]: ranking.slice(0, 3),
        }));
      })
      .finally(() => {
        setLoadingPopupKey((prev) => (prev === cacheKey ? null : prev));
      });
  };

  useEffect(() => {
    if (stateUf !== 'all' && isMunicipalIndicator) {
      loadTopMunicipalitiesForUf(stateUf);
    }
  }, [stateUf, isMunicipalIndicator, indicatorId, metricMode]);

  const stateNodes = useMemo(() => {
    const ranking = crimeService.getOfficialStateRanking(indicatorId, metricMode);
    const rankByUf = new Map(
      ranking.map((item, index) => [item.uf, { ...item, rank: index + 1 }])
    );
    const maxMetric = ranking.reduce((acc, item) => Math.max(acc, item.metricValue), 0);

    return BRAZIL_STATES.map((st) => {
      const rankedData = rankByUf.get(st.uf) ?? null;
      const summary = crimeService.getOfficialIndicatorSummary(indicatorId, st.uf);
      const ratio =
        rankedData && maxMetric > 0 ? rankedData.metricValue / maxMetric : 0;
      const radius = rankedData ? Math.max(9, Math.round(9 + ratio * 17)) : 7;
      const isSelected = stateUf !== 'all' && st.uf === stateUf;

      return {
        uf: st.uf,
        name: st.name,
        coords: st.coords,
        rankedData,
        population: rankedData?.population ?? summary.population,
        totalRankedCount: ranking.length,
        radius,
        isSelected,
      };
    });
  }, [indicatorId, metricMode, stateUf]);

  const { cameraCenter, cameraZoom } = useMemo(() => {
    const selectedStateMeta = BRAZIL_STATES.find(
      (s) => s.uf.toLowerCase() === stateUf.toLowerCase()
    );

    if (selectedStateMeta) {
      return {
        cameraCenter: selectedStateMeta.coords,
        cameraZoom: selectedStateMeta.zoom,
      };
    }

    return {
      cameraCenter: [-14.235, -51.9253] as [number, number],
      cameraZoom: 4,
    };
  }, [stateUf]);

  const heatPoints: [number, number, number][] = useMemo(() => {
    const validNodes = stateNodes.filter(
      (node) => node.rankedData !== null && node.rankedData.metricValue > 0
    );
    const maxMetric = validNodes.reduce(
      (acc, node) => Math.max(acc, node.rankedData!.metricValue),
      0
    );

    if (maxMetric <= 0) return [];

    return validNodes.map((node) => {
      const normalizedIntensity = Math.max(
        0.2,
        node.rankedData!.metricValue / maxMetric
      );
      return [node.coords[0], node.coords[1], normalizedIntensity];
    });
  }, [stateNodes]);

  return (
    <div className="map-card">
      <div
        className="map-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div
          className="map-title"
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <MapPin size={20} color="#e12c2c" />
          <h3 style={{ margin: 0 }}>
            Distribuição Estadual — {currentIndicator?.label}
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
            }}
            title="Dados oficiais consolidados do MJSP/Sinesp VDE 2025 cruzados com estimativas populacionais do IBGE 2025."
          >
            MJSP / Sinesp VDE 2025 + IBGE
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
          {mapMode === 'heatmap' && (
            <HeatmapLayer
              key={`${indicatorId}-${metricMode}-${stateUf}-heatmap`}
              points={heatPoints}
            />
          )}
          {mapMode !== 'heatmap' &&
            stateNodes.map((node) => {
              const hasData = node.rankedData !== null;
              const cacheKey = `${node.uf}::${indicatorId}::${metricMode}`;
              const topMun = topMunicipalitiesCache[cacheKey];
              const isLoadingMun = loadingPopupKey === cacheKey;

              return (
                <CircleMarker
                  key={node.uf}
                  center={node.coords}
                  radius={node.radius}
                  eventHandlers={{
                    popupopen: () => loadTopMunicipalitiesForUf(node.uf),
                  }}
                  pathOptions={{
                    color: !hasData
                      ? '#64748b'
                      : node.isSelected
                        ? '#ffffff'
                        : '#ff6b6b',
                    fillColor: !hasData
                      ? '#475569'
                      : node.isSelected
                        ? '#f59e0b'
                        : '#e12c2c',
                    fillOpacity: hasData ? 0.82 : 0.45,
                    weight: node.isSelected ? 3 : 1.5,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '215px', lineHeight: 1.5 }}>
                      <strong>
                        {node.name} ({node.uf})
                      </strong>
                      <br />
                      {hasData && node.rankedData ? (
                        <>
                          <span>
                            Total oficial (2025):{' '}
                            <strong>
                              {node.rankedData.value.toLocaleString('pt-BR', {
                                maximumFractionDigits:
                                  currentIndicator?.unit === 'kg' ? 2 : 0,
                              })}{' '}
                              {currentIndicator?.unitLabel}
                            </strong>
                          </span>
                          {node.rankedData.ratePer100k !== null && (
                            <>
                              <br />
                              <span>
                                Taxa:{' '}
                                <strong>
                                  {node.rankedData.ratePer100k.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{' '}
                                  / 100 mil hab.
                                </strong>
                              </span>
                            </>
                          )}
                          <br />
                          <span>
                            População IBGE 2025:{' '}
                            <strong>
                              {node.population !== null
                                ? `${node.population.toLocaleString('pt-BR')} hab.`
                                : 'Indisponível (null)'}
                            </strong>
                          </span>
                          <br />
                          <span>
                            Posição nacional:{' '}
                            <strong>
                              {node.rankedData.rank}º de {node.totalRankedCount} UFs
                            </strong>
                          </span>
                          {isMunicipalIndicator && (
                            <div
                              style={{
                                marginTop: '6px',
                                paddingTop: '6px',
                                borderTop: '1px solid #cbd5e1',
                                fontSize: '11.5px',
                              }}
                            >
                              <strong>Municípios mais incidentes ({node.uf}):</strong>
                              {isLoadingMun ? (
                                <div>Carregando ranking municipal...</div>
                              ) : topMun && topMun.length > 0 ? (
                                <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                  {topMun.map((m) => (
                                    <li key={m.ibgeCode}>
                                      {m.municipalityName}:{' '}
                                      <strong>
                                        {m.metricValue.toLocaleString('pt-BR', {
                                          maximumFractionDigits: 2,
                                        })}
                                      </strong>{' '}
                                      ({m.unitLabel})
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                <div>Sem registros municipais disponíveis.</div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <span>
                            População IBGE 2025:{' '}
                            <strong>
                              {node.population !== null
                                ? `${node.population.toLocaleString('pt-BR')} hab.`
                                : 'Indisponível (null)'}
                            </strong>
                          </span>
                          <br />
                          <span style={{ color: '#64748b' }}>
                            Dado indisponível (null) na fonte oficial Sinesp VDE 2025.
                          </span>
                        </>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>
    </div>
  );
}
