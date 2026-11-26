import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Calendar,
  TrendingUp,
  List,
  Map as MapIcon,
  BarChart2,
  MapPin,
  Building2,
  Database,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import 'leaflet/dist/leaflet.css';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';
import type { MunicipalityPopulationEntry, MetricDisplayMode } from '../types/crime';
import type { SearchSelection } from './Topbar';

interface SearchResultsProps {
  confirmedSearch: SearchSelection;
  filters: any;
  onBackHome: () => void;
}

function MapViewportController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface OfficialSearchMatch {
  id: string;
  category: 'Estado (UF)' | 'Município (IBGE)' | 'Indicador (Sinesp VDE)';
  title: string;
  subtitle: string;
  uf?: string;
  ibgeCode?: string;
  indicatorId?: string;
  population?: number | null;
  value: number | null;
  ratePer100k: number | null;
  unitLabel: string;
  coords?: [number, number];
}

export default function SearchResults({
  confirmedSearch,
  filters,
  onBackHome,
}: SearchResultsProps) {
  const [viewTab, setViewTab] = useState<'occurrences' | 'map' | 'charts'>('occurrences');
  const [sortOrder, setSortOrder] = useState<'metric_desc' | 'name_asc'>('metric_desc');
  const [visibleCount, setVisibleCount] = useState(12);
  const [municipalValuesMap, setMunicipalValuesMap] = useState<
    Record<string, { value: number; ratePer100k: number | null }>
  >({});
  const [loadingMunValues, setLoadingMunValues] = useState(false);

  const indicatorId: string = confirmedSearch.indicatorId || filters.indicatorId || 'homicidio-doloso';
  const metricMode: MetricDisplayMode = filters.metricMode || 'rate';
  const selectedYear: number = filters.year || 2025;

  const catalog = useMemo(() => crimeService.getOfficialIndicatorsCatalog(), []);
  const currentIndicator = useMemo(
    () => catalog.find((c) => c.id === indicatorId) ?? catalog[0],
    [catalog, indicatorId]
  );

  const isMunicipalIndicator =
    currentIndicator?.granularity === 'state_and_municipality';

  const matchedMunicipalities = useMemo<MunicipalityPopulationEntry[]>(() => {
    const rawTerm = confirmedSearch.label.trim().toLowerCase();
    if (!rawTerm || rawTerm.length < 2) return [];

    const found: MunicipalityPopulationEntry[] = [];
    for (const st of BRAZIL_STATES) {
      const muns = crimeService.getOfficialMunicipalitiesByState(st.uf);
      for (const m of muns) {
        if (
          m.name.toLowerCase().includes(rawTerm) ||
          m.ibgeCode.startsWith(rawTerm) ||
          `${m.name.toLowerCase()} (${m.uf.toLowerCase()})`.includes(rawTerm)
        ) {
          found.push(m);
        }
      }
    }
    return found.slice(0, 60);
  }, [confirmedSearch.label]);

  useEffect(() => {
    let active = true;
    const distinctUfs = Array.from(new Set(matchedMunicipalities.map((m) => m.uf)));

    if (distinctUfs.length === 0 || !isMunicipalIndicator) {
      setMunicipalValuesMap({});
      setLoadingMunValues(false);
      return;
    }

    setLoadingMunValues(true);
    Promise.all(
      distinctUfs.map((uf) =>
        crimeService.getOfficialMunicipalityRanking(uf, indicatorId, metricMode)
      )
    )
      .then((rankings) => {
        if (!active) return;
        const map: Record<string, { value: number; ratePer100k: number | null }> = {};
        rankings.flat().forEach((item) => {
          map[item.ibgeCode] = {
            value: item.value,
            ratePer100k: item.ratePer100k,
          };
        });
        setMunicipalValuesMap(map);
      })
      .finally(() => {
        if (active) setLoadingMunValues(false);
      });

    return () => {
      active = false;
    };
  }, [matchedMunicipalities, isMunicipalIndicator, indicatorId, metricMode]);

  const matchingRecords = useMemo<OfficialSearchMatch[]>(() => {
    const rawTerm = confirmedSearch.label.trim().toLowerCase();
    if (!rawTerm) return [];

    const results: OfficialSearchMatch[] = [];

    BRAZIL_STATES.forEach((st) => {
      if (
        st.name.toLowerCase().includes(rawTerm) ||
        st.uf.toLowerCase() === rawTerm
      ) {
        const summary = crimeService.getOfficialIndicatorSummary(
          indicatorId,
          st.uf,
          selectedYear
        );
        results.push({
          id: `uf-${st.uf}`,
          category: 'Estado (UF)',
          title: `${st.name} (${st.uf})`,
          subtitle: `Indicador ativo: ${currentIndicator?.label}`,
          uf: st.uf,
          population: summary.population,
          value: summary.totalValue,
          ratePer100k: summary.ratePer100k,
          unitLabel: currentIndicator?.unitLabel || '',
          coords: st.coords,
        });
      }
    });

    catalog.forEach((ind) => {
      if (ind.label.toLowerCase().includes(rawTerm)) {
        const summary = crimeService.getOfficialIndicatorSummary(
          ind.id,
          filters.state || 'all',
          selectedYear
        );
        results.push({
          id: `ind-${ind.id}`,
          category: 'Indicador (Sinesp VDE)',
          title: ind.label,
          subtitle:
            ind.granularity === 'state_and_municipality'
              ? 'Abrangência: Estadual (27 UFs) e Municipal (5.571 municípios)'
              : 'Abrangência: Exclusivamente Estadual (27 UFs)',
          indicatorId: ind.id,
          population: summary.population,
          value: summary.totalValue,
          ratePer100k: summary.ratePer100k,
          unitLabel: ind.unitLabel,
        });
      }
    });

    matchedMunicipalities.forEach((mun) => {
      const stateMeta = BRAZIL_STATES.find((s) => s.uf === mun.uf);
      const munMetric = isMunicipalIndicator
        ? municipalValuesMap[mun.ibgeCode] ?? null
        : null;

      results.push({
        id: `mun-${mun.ibgeCode}`,
        category: 'Município (IBGE)',
        title: `${mun.name} (${mun.uf})`,
        subtitle: `Código IBGE: ${mun.ibgeCode} • População: ${mun.population.toLocaleString('pt-BR')} hab.`,
        uf: mun.uf,
        ibgeCode: mun.ibgeCode,
        population: mun.population,
        value: munMetric ? munMetric.value : null,
        ratePer100k: munMetric ? munMetric.ratePer100k : null,
        unitLabel: currentIndicator?.unitLabel || '',
        coords: stateMeta?.coords,
      });
    });

    return results;
  }, [
    confirmedSearch.label,
    indicatorId,
    selectedYear,
    currentIndicator,
    catalog,
    filters.state,
    matchedMunicipalities,
    isMunicipalIndicator,
    municipalValuesMap,
  ]);

  const sortedRecords = useMemo(() => {
    return [...matchingRecords].sort((a, b) => {
      if (sortOrder === 'name_asc') {
        return a.title.localeCompare(b.title, 'pt-BR');
      }
      const valA =
        metricMode === 'rate' && a.ratePer100k !== null ? a.ratePer100k : a.value;
      const valB =
        metricMode === 'rate' && b.ratePer100k !== null ? b.ratePer100k : b.value;
      if (valA === null && valB === null) return 0;
      if (valA === null) return 1;
      if (valB === null) return -1;
      return valB - valA;
    });
  }, [matchingRecords, sortOrder, metricMode]);

  const paginatedRecords = sortedRecords.slice(0, visibleCount);

  const mapMarkers = useMemo(() => {
    const byUf = new Map<
      string,
      { uf: string; title: string; coords: [number, number]; value: number | null; rate: number | null }
    >();

    matchingRecords.forEach((item) => {
      if (item.uf && item.coords && !byUf.has(item.uf)) {
        const stSummary = crimeService.getOfficialIndicatorSummary(
          indicatorId,
          item.uf,
          selectedYear
        );
        byUf.set(item.uf, {
          uf: item.uf,
          title: item.title,
          coords: item.coords,
          value: stSummary.totalValue,
          rate: stSummary.ratePer100k,
        });
      }
    });

    return Array.from(byUf.values());
  }, [matchingRecords, indicatorId, selectedYear]);

  const mapViewport = useMemo<{ center: [number, number]; zoom: number }>(() => {
    if (mapMarkers.length === 1) {
      return { center: mapMarkers[0].coords, zoom: 6 };
    }
    return { center: [-14.235, -51.9253], zoom: 4 };
  }, [mapMarkers]);

  const categoryDistribution = useMemo(() => {
    const total = matchingRecords.length;
    if (total === 0) return [];

    const counts: Record<string, number> = {};
    matchingRecords.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });

    const palette = ['#e12c2c', '#ff5c5c', '#9ca3af'];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: Number(((count / total) * 100).toFixed(1)),
        color: palette[idx % palette.length],
      }));
  }, [matchingRecords]);

  const comparativeBars = useMemo(() => {
    return sortedRecords
      .filter((r) => r.value !== null)
      .slice(0, 8)
      .map((r) => ({
        name: r.title,
        value:
          metricMode === 'rate' && r.ratePer100k !== null
            ? r.ratePer100k
            : (r.value as number),
      }));
  }, [sortedRecords, metricMode]);

  const renderCategoryIcon = (category: OfficialSearchMatch['category']) => {
    if (category === 'Estado (UF)') return <MapPin size={26} color="#e12c2c" strokeWidth={1.6} />;
    if (category === 'Município (IBGE)') return <Building2 size={26} color="#e12c2c" strokeWidth={1.6} />;
    return <ShieldAlert size={26} color="#e12c2c" strokeWidth={1.6} />;
  };

  return (
    <div className="search-results-page">
      <div className="results-hero-grid">
        <div className="results-hero-left">
          <div className="results-breadcrumb">
            <button type="button" onClick={onBackHome} className="breadcrumb-back">
              <ArrowLeft size={14} /> Início
            </button>
            <span>&gt;</span>
            <span className="breadcrumb-current">Resultados na base oficial</span>
          </div>

          <h1 className="results-title">
            Resultados para <span>“{confirmedSearch.label}”</span>
          </h1>
          <p className="results-subtitle">
            {matchingRecords.length === 1
              ? `Foi encontrada 1 correspondência oficial na base MJSP / Sinesp VDE + IBGE (${selectedYear}).`
              : `Foram encontradas ${matchingRecords.length} correspondências oficiais na base MJSP / Sinesp VDE + IBGE (${selectedYear}).`}
          </p>

          <div className="results-kpi-row">
            <div className="results-kpi-card">
              <ShieldAlert size={22} color="#e12c2c" />
              <div className="results-kpi-value">{matchingRecords.length}</div>
              <div className="results-kpi-label">Correspondências</div>
            </div>

            <div className="results-kpi-card">
              <Calendar size={22} color="#e12c2c" />
              <div className="results-kpi-value">{selectedYear}</div>
              <div className="results-kpi-label">Ano-base oficial</div>
            </div>

            <div className="results-kpi-card highlighted">
              <Database size={22} color="#e12c2c" />
              <div className="results-kpi-value" style={{ fontSize: '14px', lineHeight: 1.3 }}>
                {currentIndicator?.label}
              </div>
              <div className="results-kpi-label">Indicador de referência</div>
            </div>
          </div>
        </div>

        <div className="results-hero-map">
          <MapContainer
            center={mapViewport.center}
            zoom={mapViewport.zoom}
            style={{ height: '100%', width: '100%' }}
          >
            <MapViewportController center={mapViewport.center} zoom={mapViewport.zoom} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {mapMarkers.map((item) => (
              <CircleMarker
                key={item.uf}
                center={item.coords}
                radius={9}
                pathOptions={{
                  color: item.value !== null ? '#ff6b6b' : '#64748b',
                  fillColor: item.value !== null ? '#e12c2c' : '#475569',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{item.title}</strong>
                  <br />
                  {item.value !== null
                    ? `${item.value.toLocaleString('pt-BR')} ${currentIndicator?.unitLabel}`
                    : 'Dado indisponível (null)'}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="results-tabs-bar">
        <div className="results-tabs">
          <button
            type="button"
            className={`results-tab-btn ${viewTab === 'occurrences' ? 'active' : ''}`}
            onClick={() => setViewTab('occurrences')}
          >
            <List size={16} />
            Registros Oficiais
            <span className="tab-count-badge">{matchingRecords.length}</span>
          </button>

          <button
            type="button"
            className={`results-tab-btn ${viewTab === 'map' ? 'active' : ''}`}
            onClick={() => setViewTab('map')}
          >
            <MapIcon size={16} />
            Mapa
          </button>

          <button
            type="button"
            className={`results-tab-btn ${viewTab === 'charts' ? 'active' : ''}`}
            onClick={() => setViewTab('charts')}
          >
            <BarChart2 size={16} />
            Gráficos
          </button>
        </div>

        {viewTab === 'occurrences' && (
          <div className="results-sort">
            <span>Ordenar por:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'metric_desc' | 'name_asc')}
            >
              <option value="metric_desc">Maior indicador</option>
              <option value="name_asc">Ordem alfabética</option>
            </select>
          </div>
        )}
      </div>

      {viewTab === 'occurrences' && (
        <div className="results-content-split">
          <div className="occurrences-list-col">
            {loadingMunValues ? (
              <div className="empty-results-card">
                <Database size={28} color="#e12c2c" />
                <h3>Consultando base municipal oficial...</h3>
              </div>
            ) : paginatedRecords.length === 0 ? (
              <div className="empty-results-card">
                <ShieldAlert size={32} color="#e12c2c" />
                <h3>Nenhuma correspondência oficial encontrada</h3>
                <p>
                  Não foram encontrados estados, municípios IBGE ou indicadores Sinesp VDE para "{confirmedSearch.label}".
                </p>
              </div>
            ) : (
              <>
                {paginatedRecords.map((item) => (
                  <div key={item.id} className="occurrence-horizontal-card">
                    <div className="occ-avatar-box">
                      {renderCategoryIcon(item.category)}
                    </div>

                    <div className="occ-main-info">
                      <div className="occ-meta-row">
                        <span>
                          <Database size={13} color="#e12c2c" /> {item.category}
                        </span>
                        <span>
                          <Calendar size={13} color="#e12c2c" /> Ano-base {selectedYear}
                        </span>
                      </div>
                      <h4 className="occ-type-title">{item.title}</h4>
                      <p className="occ-desc-text">{item.subtitle}</p>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                      <strong style={{ display: 'block', fontSize: '15px' }}>
                        {item.value !== null
                          ? `${item.value.toLocaleString('pt-BR')} ${item.unitLabel}`
                          : item.category === 'Município (IBGE)' && !isMunicipalIndicator
                            ? 'Disponível apenas por UF'
                            : 'Indisponível (null)'}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#8b92a5' }}>
                        {item.ratePer100k !== null
                          ? `${item.ratePer100k.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} / 100 mil hab.`
                          : 'MJSP / IBGE'}
                      </span>
                    </div>
                  </div>
                ))}

                {visibleCount < sortedRecords.length && (
                  <button
                    type="button"
                    className="load-more-btn"
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                  >
                    Carregar mais resultados ({sortedRecords.length - visibleCount} restantes)
                  </button>
                )}
              </>
            )}
          </div>

          <aside className="results-side-panel">
            <div className="side-panel-header">
              <BarChart2 size={18} color="#e12c2c" />
              <h3>Sobre os resultados</h3>
            </div>

            <p className="side-panel-summary">
              A busca consulta simultaneamente as <strong>27 UFs</strong>, os{' '}
              <strong>5.571 municípios do IBGE</strong> e os{' '}
              <strong>{catalog.length} indicadores oficiais do Sinesp VDE</strong>. Registros
              sem divulgação oficial permanecem identificados como{' '}
              <code>Indisponível (null)</code>.
            </p>

            <div className="side-panel-types">
              <h4>Distribuição por categoria</h4>
              {categoryDistribution.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Sem registros para exibir distribuição.
                </p>
              ) : (
                <div className="side-donut-row">
                  <div style={{ width: 95, height: 95, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          dataKey="count"
                          innerRadius={28}
                          outerRadius={42}
                          paddingAngle={2}
                        >
                          {categoryDistribution.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="side-legend-list">
                    {categoryDistribution.map((t) => (
                      <div key={t.name} className="side-legend-item">
                        <span className="legend-left">
                          <span
                            className="legend-dot"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.name}
                        </span>
                        <strong>{t.percentage}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {viewTab === 'map' && (
        <div className="results-expanded-map">
          <MapContainer
            center={mapViewport.center}
            zoom={mapViewport.zoom}
            style={{ height: '520px', width: '100%' }}
          >
            <MapViewportController center={mapViewport.center} zoom={mapViewport.zoom} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {mapMarkers.map((item) => (
              <CircleMarker
                key={item.uf}
                center={item.coords}
                radius={10}
                pathOptions={{
                  color: item.value !== null ? '#ff6b6b' : '#64748b',
                  fillColor: item.value !== null ? '#e12c2c' : '#475569',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{item.title}</strong>
                  <br />
                  {item.value !== null
                    ? `${item.value.toLocaleString('pt-BR')} ${currentIndicator?.unitLabel}`
                    : 'Dado indisponível (null)'}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {viewTab === 'charts' && (
        <div className="results-charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <TrendingUp size={18} color="#e12c2c" />
              <h3>Comparativo dos Resultados Válidos</h3>
            </div>
            <div className="chart-body" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparativeBars}>
                  <XAxis dataKey="name" stroke="#8b92a5" fontSize={11} />
                  <YAxis stroke="#8b92a5" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1c23', border: 'none', color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#e12c2c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <BarChart2 size={18} color="#e12c2c" />
              <h3>Distribuição por Categoria</h3>
            </div>
            <div className="chart-body" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {categoryDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1c23', border: 'none', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}