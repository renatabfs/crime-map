import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers, Flame } from 'lucide-react';
import HeatmapLayer from './HeatmapLayer';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';
import type { MunicipalityRankingItem, MetricDisplayMode } from '../types/crime';

let cachedBrazilStatesGeoJson: any = null;
const BRAZIL_STATES_GEOJSON_URL =
  'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';

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

  const [statesGeoJson, setStatesGeoJson] = useState<any>(cachedBrazilStatesGeoJson);
  const [selectedPopupNode, setSelectedPopupNode] = useState<any>(null);
  const popupLayerRef = useRef<L.Popup | null>(null);

  useEffect(() => {
    if (cachedBrazilStatesGeoJson) return;
    let active = true;
    fetch(BRAZIL_STATES_GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        cachedBrazilStatesGeoJson = data;
        if (active) setStatesGeoJson(data);
      })
      .catch((err) => console.error('Erro ao carregar malha dos estados:', err));
    return () => {
      active = false;
    };
  }, []);

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

  const { stateNodes, nodeByUf, maxMetric } = useMemo(() => {
    const ranking = crimeService.getOfficialStateRanking(indicatorId, metricMode);
    const rankByUf = new Map(
      ranking.map((item, index) => [item.uf, { ...item, rank: index + 1 }])
    );
    const computedMax = ranking.reduce((acc, item) => Math.max(acc, item.metricValue), 0);

    const nodes = BRAZIL_STATES.map((st) => {
      const rankedData = rankByUf.get(st.uf) ?? null;
      const summary = crimeService.getOfficialIndicatorSummary(indicatorId, st.uf);
      const isSelected = stateUf !== 'all' && st.uf === stateUf;

      return {
        uf: st.uf,
        name: st.name,
        coords: st.coords,
        rankedData,
        population: rankedData?.population ?? summary.population,
        totalRankedCount: ranking.length,
        isSelected,
      };
    });

    const mapByUf = new Map(nodes.map((n) => [n.uf.toUpperCase(), n]));

    return {
      stateNodes: nodes,
      nodeByUf: mapByUf,
      maxMetric: computedMax,
    };
  }, [indicatorId, metricMode, stateUf]);

  const getChoroplethFillColor = (metricValue: number | null | undefined): string => {
    if (metricValue == null || metricValue <= 0 || maxMetric <= 0) {
      return '#262934';
    }
    const ratio = metricValue / maxMetric;
    if (ratio > 0.8) return '#5c0a14';
    if (ratio > 0.6) return '#85121e';
    if (ratio > 0.4) return '#ad1d29';
    if (ratio > 0.2) return '#cf3644';
    return '#e25563';
  };

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
          {mapMode !== 'heatmap' && statesGeoJson && (
            <GeoJSON
              key={`${indicatorId}-${metricMode}-${stateUf}-${mapMode}`}
              data={statesGeoJson}
              style={(feature) => {
                const uf = String(feature?.properties?.sigla || '').toUpperCase();
                const node = nodeByUf.get(uf);
                const metricVal = node?.rankedData?.metricValue ?? null;
                const isSelected = Boolean(node?.isSelected);

                return {
                  fillColor: getChoroplethFillColor(metricVal),
                  fillOpacity:
                    metricVal === null
                      ? 0.35
                      : mapMode === 'satellite'
                        ? 0.58
                        : 0.82,
                  color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.24)',
                  weight: isSelected ? 2.4 : 1,
                };
              }}
              onEachFeature={(feature, layer) => {
                const uf = String(feature?.properties?.sigla || '').toUpperCase();
                const node = nodeByUf.get(uf);
                const stateName = node?.name || feature?.properties?.name || uf;
                const ranked = node?.rankedData;

                const formattedMetric = ranked
                  ? metricMode === 'rate' && ranked.ratePer100k !== null
                    ? `${ranked.ratePer100k.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} / 100 mil hab.`
                    : `${ranked.value.toLocaleString('pt-BR', {
                      maximumFractionDigits: currentIndicator?.unit === 'kg' ? 2 : 0,
                    })} ${currentIndicator?.unitLabel || ''}`
                  : 'Dado indisponível (null)';

                layer.bindTooltip(
                  `<div>
                    <strong>${stateName} (${uf})</strong><br/>
                    <span style="opacity:0.85">${currentIndicator?.label}:</span> <strong>${formattedMetric}</strong>
                  </div>`,
                  {
                    sticky: true,
                    direction: 'top',
                    className: 'choropleth-tooltip',
                  }
                );

                layer.on({
                  mouseover: (e) => {
                    const target = e.target as L.Path;
                    target.setStyle({
                      weight: 2.2,
                      color: '#fca5a5',
                      fillOpacity: mapMode === 'satellite' ? 0.72 : 0.92,
                    });
                    target.bringToFront();
                  },
                  mouseout: (e) => {
                    const target = e.target as L.Path;
                    const isSelected = Boolean(node?.isSelected);
                    target.setStyle({
                      weight: isSelected ? 2.4 : 1,
                      color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.24)',
                      fillOpacity:
                        ranked == null
                          ? 0.35
                          : mapMode === 'satellite'
                            ? 0.58
                            : 0.82,
                    });
                  },
                  click: () => {
                    if (!node) return;
                    loadTopMunicipalitiesForUf(node.uf);
                    setSelectedPopupNode(node);
                  },
                });
              }}
            />
          )}

          {mapMode !== 'heatmap' && selectedPopupNode && (
            <Popup
              ref={popupLayerRef}
              position={selectedPopupNode.coords}
              eventHandlers={{
                remove: () => setSelectedPopupNode(null),
              }}
            >
              <div style={{ minWidth: '215px', lineHeight: 1.5 }}>
                <strong>
                  {selectedPopupNode.name} ({selectedPopupNode.uf})
                </strong>
                <br />
                {selectedPopupNode.rankedData !== null && selectedPopupNode.rankedData ? (
                  <>
                    <span>
                      Total oficial (2025):{' '}
                      <strong>
                        {selectedPopupNode.rankedData.value.toLocaleString('pt-BR', {
                          maximumFractionDigits:
                            currentIndicator?.unit === 'kg' ? 2 : 0,
                        })}{' '}
                        {currentIndicator?.unitLabel}
                      </strong>
                    </span>
                    {selectedPopupNode.rankedData.ratePer100k !== null && (
                      <>
                        <br />
                        <span>
                          Taxa:{' '}
                          <strong>
                            {selectedPopupNode.rankedData.ratePer100k.toLocaleString('pt-BR', {
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
                        {selectedPopupNode.population !== null
                          ? `${selectedPopupNode.population.toLocaleString('pt-BR')} hab.`
                          : 'Indisponível (null)'}
                      </strong>
                    </span>
                    <br />
                    <span>
                      Posição nacional:{' '}
                      <strong>
                        {selectedPopupNode.rankedData.rank}º de {selectedPopupNode.totalRankedCount} UFs
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
                        <strong>Municípios mais incidentes ({selectedPopupNode.uf}):</strong>
                        {loadingPopupKey === `${selectedPopupNode.uf}::${indicatorId}::${metricMode}` ? (
                          <div>Carregando ranking municipal...</div>
                        ) : topMunicipalitiesCache[`${selectedPopupNode.uf}::${indicatorId}::${metricMode}`]?.length > 0 ? (
                          <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
                            {topMunicipalitiesCache[`${selectedPopupNode.uf}::${indicatorId}::${metricMode}`].map((m) => (
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
                        {selectedPopupNode.population !== null
                          ? `${selectedPopupNode.population.toLocaleString('pt-BR')} hab.`
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
          )}
        </MapContainer>

        {mapMode !== 'heatmap' && maxMetric > 0 && (
          <div
            className="choropleth-legend"
            title={`Escala de ${metricMode === 'rate' ? 'taxa por 100 mil hab.' : currentIndicator?.unitLabel}: 0 até ${maxMetric.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
          >
            <span>Menor índice</span>
            <div className="choropleth-legend-bar" />
            <span>Maior índice</span>
          </div>
        )}
      </div>
    </div>
  );
}