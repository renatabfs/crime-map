import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Calendar,
  TrendingUp,
  List,
  Map as MapIcon,
  BarChart2,
  Clock,
  MapPin,
  Eye,
  X,
  UserX,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import { citiesMetadata, crimeData, type CrimeRecord } from '../data/mockData';
import type { SearchSelection } from './Topbar';

interface SearchResultsProps {
  confirmedSearch: SearchSelection;
  filters: {
    city: string;
    neighborhood?: string;
    period: string;
    crimeType: string;
  };
  onBackHome: () => void;
}

function MapViewportController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function SearchResults({
  confirmedSearch,
  filters,
  onBackHome,
}: SearchResultsProps) {
  const [viewTab, setViewTab] = useState<'occurrences' | 'map' | 'charts'>('occurrences');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedRecord, setSelectedRecord] = useState<CrimeRecord | null>(null);

  const periodLabels: Record<string, { title: string; subtitle: string }> = {
    '30-days': { title: 'Últimos 30 dias', subtitle: 'nos últimos 30 dias' },
    '6-months': { title: 'Últimos 6 meses', subtitle: 'nos últimos 6 meses' },
    '1-year': { title: 'Último ano', subtitle: 'no último ano' },
    '5-years': { title: '2019 – 2026', subtitle: 'nos últimos 5 anos' },
  };

  const activePeriod = periodLabels[filters.period] || periodLabels['5-years'];

  const matchingRecords = useMemo(() => {
    const rawTerm = confirmedSearch.label.trim().toLowerCase();

    return crimeData.filter((record) => {
      if (
        filters.city &&
        filters.city !== 'all' &&
        record.city.toLowerCase() !== filters.city.toLowerCase()
      ) {
        return false;
      }
      if (
        filters.neighborhood &&
        filters.neighborhood !== 'all' &&
        record.neighborhood.toLowerCase() !== filters.neighborhood.toLowerCase()
      ) {
        return false;
      }

      if (
        filters.crimeType &&
        filters.crimeType !== 'all' &&
        record.type.toLowerCase() !== filters.crimeType.toLowerCase()
      ) {
        return false;
      }

      if (confirmedSearch.city && record.city.toLowerCase() !== confirmedSearch.city.toLowerCase()) {
        return false;
      }
      if (
        confirmedSearch.neighborhood &&
        record.neighborhood.toLowerCase() !== confirmedSearch.neighborhood.toLowerCase()
      ) {
        return false;
      }
      if (
        confirmedSearch.crimeType &&
        record.type.toLowerCase() !== confirmedSearch.crimeType.toLowerCase()
      ) {
        return false;
      }

      if (
        !confirmedSearch.city &&
        !confirmedSearch.neighborhood &&
        !confirmedSearch.crimeType &&
        rawTerm
      ) {
        const matchesAny =
          record.city.toLowerCase().includes(rawTerm) ||
          record.neighborhood.toLowerCase().includes(rawTerm) ||
          record.type.toLowerCase().includes(rawTerm) ||
          (record.description && record.description.toLowerCase().includes(rawTerm));
        if (!matchesAny) return false;
      }

      return true;
    });
  }, [confirmedSearch, filters]);

  const sortedRecords = useMemo(() => {
    return [...matchingRecords].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [matchingRecords, sortOrder]);

  const paginatedRecords = sortedRecords.slice(0, visibleCount);

  const mapViewport = useMemo<{ center: [number, number]; zoom: number }>(() => {
    if (confirmedSearch.neighborhood && matchingRecords.length > 0) {
      return { center: matchingRecords[0].coords, zoom: 15 };
    }

    const targetCityName =
      confirmedSearch.city || (filters.city !== 'all' ? filters.city : '');

    if (targetCityName) {
      const cityMeta = citiesMetadata.find(
        (c) => c.name.toLowerCase() === targetCityName.toLowerCase()
      );
      if (cityMeta) {
        return { center: cityMeta.coords, zoom: cityMeta.zoom };
      }
    }

    if (matchingRecords.length > 0) {
      return { center: matchingRecords[0].coords, zoom: 14 };
    }

    return { center: citiesMetadata[0].coords, zoom: 13 };
  }, [confirmedSearch, filters.city, matchingRecords]);

  const typeDistribution = useMemo(() => {
    const total = matchingRecords.length;
    if (total === 0) return [];

    const counts: Record<string, number> = {};
    matchingRecords.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });

    const palette = ['#e12c2c', '#ff5c5c', '#ff8a8a', '#6b7280', '#374151'];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: Number(((count / total) * 100).toFixed(1)),
        color: palette[idx % palette.length],
      }));
  }, [matchingRecords]);

  const timelineData = useMemo(() => {
    const grouped: Record<string, number> = {};
    [...matchingRecords]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((r) => {
        const [datePart] = r.date.split('T');
        const [, month, day] = datePart.split('-');
        const label = `${day}/${month}`;
        grouped[label] = (grouped[label] || 0) + 1;
      });

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }, [matchingRecords]);

  const locationContextText = useMemo(() => {
    if (confirmedSearch.city) {
      const meta = citiesMetadata.find(
        (c) => c.name.toLowerCase() === confirmedSearch.city!.toLowerCase()
      );
      return meta ? `${meta.name} - ${meta.state}` : confirmedSearch.city;
    }
    if (filters.city && filters.city !== 'all') {
      const meta = citiesMetadata.find(
        (c) => c.name.toLowerCase() === filters.city.toLowerCase()
      );
      return meta ? `${meta.name} - ${meta.state}` : filters.city;
    }
    return 'todas as cidades monitoradas';
  }, [confirmedSearch.city, filters.city]);

  const formatDateTime = (isoDate: string) => {
    const [datePart, timePart] = isoDate.split('T');
    const [year, month, day] = datePart.split('-');
    return {
      date: `${day}/${month}/${year}`,
      time: timePart ? timePart.slice(0, 5) : 'Horário indisponível',
    };
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
            <span className="breadcrumb-current">Resultados da busca</span>
          </div>

          <h1 className="results-title">
            Resultados para <span>“{confirmedSearch.label}”</span>
          </h1>
          <p className="results-subtitle">
            {matchingRecords.length === 1
              ? `Foi encontrado 1 registro ${activePeriod.subtitle} em ${locationContextText}.`
              : `Foram encontrados ${matchingRecords.length} registros ${activePeriod.subtitle} em ${locationContextText}.`}
          </p>

          <div className="results-kpi-row">
            <div className="results-kpi-card">
              <ShieldAlert size={22} color="#e12c2c" />
              <div className="results-kpi-value">{matchingRecords.length}</div>
              <div className="results-kpi-label">Ocorrências</div>
            </div>

            <div className="results-kpi-card">
              <Calendar size={22} color="#e12c2c" />
              <div className="results-kpi-value">{activePeriod.title}</div>
              <div className="results-kpi-label">Período</div>
            </div>

            <div className="results-kpi-card highlighted">
              <TrendingUp size={22} color="#e12c2c" />
              <div className="results-kpi-value" style={{ fontSize: '15px', lineHeight: 1.3 }}>
                Sem dados comparativos
              </div>
              <div className="results-kpi-label">Histórico anterior indisponível</div>
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
            {matchingRecords.map((item) => (
              <CircleMarker
                key={item.id}
                center={item.coords}
                radius={8}
                pathOptions={{
                  color: '#ff6b6b',
                  fillColor: '#e12c2c',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{item.type}</strong> — {item.neighborhood}, {item.city}
                  <br />
                  {item.description || 'Descrição indisponível'}
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
            Ocorrências
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
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
            </select>
          </div>
        )}
      </div>

      {viewTab === 'occurrences' && (
        <div className="results-content-split">
          <div className="occurrences-list-col">
            {paginatedRecords.length === 0 ? (
              <div className="empty-results-card">
                <ShieldAlert size={32} color="#e12c2c" />
                <h3>Nenhum registro encontrado</h3>
                <p>
                  Não há ocorrências registradas para "{confirmedSearch.label}" com os filtros selecionados.
                </p>
              </div>
            ) : (
              <>
                {paginatedRecords.map((occ) => {
                  const { date, time } = formatDateTime(occ.date);
                  return (
                    <div key={occ.id} className="occurrence-horizontal-card">
                      <div className="occ-avatar-box">
                        <UserX size={28} color="#e12c2c" strokeWidth={1.6} />
                      </div>

                      <div className="occ-main-info">
                        <div className="occ-meta-row">
                          <span>
                            <Calendar size={13} color="#e12c2c" /> {date}
                          </span>
                          <span>
                            <Clock size={13} color="#e12c2c" /> {time}
                          </span>
                          <span>
                            <MapPin size={13} color="#e12c2c" /> {occ.neighborhood}, {occ.city} - {occ.state}
                          </span>
                        </div>
                        <h4 className="occ-type-title">{occ.type}</h4>
                        <p className="occ-desc-text">
                          {occ.description || 'Descrição não disponibilizada pela fonte.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="occ-details-btn"
                        onClick={() => setSelectedRecord(occ)}
                      >
                        <Eye size={15} /> Ver detalhes &rarr;
                      </button>
                    </div>
                  );
                })}

                {visibleCount < sortedRecords.length && (
                  <button
                    type="button"
                    className="load-more-btn"
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                  >
                    Carregar mais ocorrências ({sortedRecords.length - visibleCount} restantes)
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
              Para a pesquisa <strong>{confirmedSearch.label}</strong>, foram contabilizadas{' '}
              <strong>{matchingRecords.length}</strong>{' '}
              {matchingRecords.length === 1 ? 'ocorrência registrada' : 'ocorrências registradas'}{' '}
              {activePeriod.subtitle}. Não há dados de período anterior na base para cálculo de variação percentual.
            </p>

            {timelineData.length > 0 && (
              <div style={{ width: '100%', height: 90, marginTop: 12 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="resultsRedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e12c2c" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#e12c2c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1c23',
                        border: 'none',
                        color: '#fff',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#e12c2c"
                      strokeWidth={2}
                      fill="url(#resultsRedGrad)"
                      dot={{ r: 3, fill: '#e12c2c' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="side-panel-types">
              <h4>Tipos mais comuns</h4>
              {typeDistribution.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Sem registros para exibir distribuição.
                </p>
              ) : (
                <div className="side-donut-row">
                  <div style={{ width: 95, height: 95, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeDistribution}
                          dataKey="count"
                          innerRadius={28}
                          outerRadius={42}
                          paddingAngle={2}
                        >
                          {typeDistribution.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="side-legend-list">
                    {typeDistribution.map((t) => (
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
            {matchingRecords.map((item) => (
              <CircleMarker
                key={item.id}
                center={item.coords}
                radius={9}
                pathOptions={{
                  color: '#ff6b6b',
                  fillColor: '#e12c2c',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{item.type}</strong> — {item.neighborhood}, {item.city}
                  <br />
                  {item.description || 'Descrição indisponível'}
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
              <h3>Registros por Data</h3>
            </div>
            <div className="chart-body" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <XAxis dataKey="date" stroke="#8b92a5" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#8b92a5" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1c23', border: 'none', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#e12c2c" radius={[4, 4, 0, 0]} />
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
                    data={typeDistribution}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {typeDistribution.map((entry, idx) => (
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

      {/* Modal de Detalhes da Ocorrência */}
      {selectedRecord && (
        <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes da Ocorrência</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedRecord(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-grid">
              <div>
                <span className="modal-field-label">Tipo da ocorrência</span>
                <p className="modal-field-value">{selectedRecord.type}</p>
              </div>
              <div>
                <span className="modal-field-label">Data e horário</span>
                <p className="modal-field-value">
                  {formatDateTime(selectedRecord.date).date} às{' '}
                  {formatDateTime(selectedRecord.date).time}
                </p>
              </div>
              <div>
                <span className="modal-field-label">Cidade / Estado</span>
                <p className="modal-field-value">
                  {selectedRecord.city} - {selectedRecord.state}
                </p>
              </div>
              <div>
                <span className="modal-field-label">Bairro</span>
                <p className="modal-field-value">{selectedRecord.neighborhood}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span className="modal-field-label">Localização</span>
                <p className="modal-field-value">
                  {selectedRecord.location || 'Localização detalhada indisponível na fonte'}
                </p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span className="modal-field-label">Descrição</span>
                <p className="modal-field-value">
                  {selectedRecord.description || 'Descrição não disponibilizada pela fonte'}
                </p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span className="modal-field-label">Fonte de origem do registro</span>
                <p className="modal-field-value">
                  {selectedRecord.source || 'Fonte não informada'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}