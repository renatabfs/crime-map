import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  BarChart2,
  HelpCircle,
  Database,
  MapPin,
  Calendar,
  Shield,
  Fingerprint,
  SlidersHorizontal,
  Scale,
  X,
} from 'lucide-react';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';

interface SidebarProps {
  filters: any;
  setFilters: (filters: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ filters, setFilters, activeTab, setActiveTab, isOpenMobile = false,
  onCloseMobile, }: SidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const indicatorsCatalog = useMemo(
    () => crimeService.getOfficialIndicatorsCatalog(),
    []
  );

  const selectedIndicatorMeta = useMemo(
    () =>
      indicatorsCatalog.find(
        (ind) => ind.id === (localFilters.indicatorId || 'homicidio-doloso')
      ) ?? indicatorsCatalog[0],
    [indicatorsCatalog, localFilters.indicatorId]
  );

  const supportsPopulationRate =
    selectedIndicatorMeta?.comparisonMethod === 'population_per_100k';

  const supportsMunicipalities =
    selectedIndicatorMeta?.granularity === 'state_and_municipality';

  const hasSelectedState = Boolean(localFilters.state && localFilters.state !== 'all');

  const availableMunicipalities = useMemo(() => {
    if (!hasSelectedState) return [];
    return crimeService.getOfficialMunicipalitiesByState(localFilters.state);
  }, [hasSelectedState, localFilters.state]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setLocalFilters({
        ...localFilters,
        state: value,
        city: 'all',
        neighborhood: 'all',
      });
    } else if (name === 'municipalityCode') {
      if (value === 'all') {
        setLocalFilters({
          ...localFilters,
          municipalityCode: 'all',
          city: 'all',
          neighborhood: 'all',
        });
      } else {
        const selectedMun = availableMunicipalities.find((m) => m.ibgeCode === value);
        setLocalFilters({
          ...localFilters,
          municipalityCode: selectedMun ? selectedMun.ibgeCode : 'all',
          city: selectedMun ? selectedMun.name : 'all',
          neighborhood: 'all',
        });
      }
    } else if (name === 'indicatorId') {
      const nextMeta = indicatorsCatalog.find((ind) => ind.id === value);
      const nextMode =
        nextMeta?.comparisonMethod === 'population_per_100k'
          ? localFilters.metricMode || 'rate'
          : 'absolute';
      const nextSupportsMun = nextMeta?.granularity === 'state_and_municipality';

      if (!nextSupportsMun || !hasSelectedState) {
        setLocalFilters({
          ...localFilters,
          indicatorId: value,
          metricMode: nextMode,
          municipalityCode: 'all',
          city: 'all',
        });
      } else {
        const currentMun = availableMunicipalities.find(
          (m) => m.ibgeCode === localFilters.municipalityCode
        );
        setLocalFilters({
          ...localFilters,
          indicatorId: value,
          metricMode: nextMode,
          municipalityCode: currentMun ? currentMun.ibgeCode : 'all',
          city: currentMun ? currentMun.name : 'all',
        });
      }
    } else if (name === 'year') {
      setLocalFilters({
        ...localFilters,
        year: Number(value),
        period: value,
      });
    } else {
      setLocalFilters({ ...localFilters, [name]: value });
    }
  };

  const handleApply = () => {
    setFilters(localFilters);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
      {onCloseMobile && (
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={onCloseMobile}
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      )}
      <div className="brand" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', marginBottom: '6px' }}>
        <Fingerprint size={64} color="#e12c2c" strokeWidth={1.5} />
        <div>
          <h1 style={{ fontSize: '28px', margin: 0, letterSpacing: '-0.5px' }}>CrimeMap</h1>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Visualize. Analise. Entenda.</p>
        </div>
      </div>

      <nav className="nav-menu">
        <a
          href="#"
          className={activeTab === 'home' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('home');
          }}
        >
          <Home size={20} /> Início
        </a>
        <a
          href="#"
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('analytics');
          }}
        >
          <BarChart2 size={20} /> Análises
        </a>
        <a
          href="#"
          className={activeTab === 'about' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('about');
          }}
        >
          <HelpCircle size={20} /> Sobre o projeto
        </a>
        <a
          href="#"
          className={activeTab === 'sources' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('sources');
          }}
        >
          <Database size={20} /> Fontes de dados
        </a>
      </nav>

      {activeTab !== 'about' && activeTab !== 'sources' && (
        <div className="filters-section">
          <div className="filter-group">
            <label>
              <MapPin size={16} /> Estado (UF)
            </label>
            <select
              name="state"
              value={localFilters.state || 'all'}
              onChange={handleChange}
            >
              <option value="all">Todo o Brasil</option>
              {BRAZIL_STATES.map((st) => (
                <option key={st.uf} value={st.uf}>
                  {st.name} ({st.uf})
                </option>
              ))}
            </select>
          </div>
          {hasSelectedState && (
            <div className="filter-group">
              <label>
                <MapPin size={16} /> Município (IBGE / Sinesp)
              </label>
              <select
                name="municipalityCode"
                value={
                  supportsMunicipalities
                    ? localFilters.municipalityCode || 'all'
                    : 'all'
                }
                onChange={handleChange}
                disabled={!supportsMunicipalities}
                style={{
                  opacity: !supportsMunicipalities ? 0.65 : 1,
                  cursor: !supportsMunicipalities ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="all">
                  {!supportsMunicipalities
                    ? 'Disponível apenas por UF neste indicador'
                    : `Todos os municípios (${availableMunicipalities.length})`}
                </option>
                {supportsMunicipalities &&
                  availableMunicipalities.map((mun) => (
                    <option key={mun.ibgeCode} value={mun.ibgeCode}>
                      {mun.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className="filter-group">
            <label>
              <Shield size={16} /> Indicador (Sinesp VDE)
            </label>
            <select
              name="indicatorId"
              value={localFilters.indicatorId || 'homicidio-doloso'}
              onChange={handleChange}
            >
              {indicatorsCatalog.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.label} ({ind.unitLabel})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Scale size={16} /> Métrica de comparação
            </label>
            <select
              name="metricMode"
              value={supportsPopulationRate ? localFilters.metricMode || 'rate' : 'absolute'}
              onChange={handleChange}
              disabled={!supportsPopulationRate}
              style={{
                opacity: !supportsPopulationRate ? 0.65 : 1,
                cursor: !supportsPopulationRate ? 'not-allowed' : 'pointer',
              }}
            >
              {supportsPopulationRate && (
                <option value="rate">Taxa por 100 mil hab. (IBGE)</option>
              )}
              <option value="absolute">
                Quantidade absoluta ({selectedIndicatorMeta?.unitLabel || 'total'})
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Calendar size={16} /> Ano-base (Sinesp VDE)
            </label>
            <select
              name="year"
              value={String(localFilters.year || 2025)}
              onChange={handleChange}
            >
              <option value="2025">2025 (Base oficial fechada)</option>
            </select>
          </div>

          <button className="apply-btn" onClick={handleApply}>
            <SlidersHorizontal size={18} /> Aplicar Filtros
          </button>
        </div>
      )}

      <div className="sidebar-quote">
        <p>
          “Dados oficiais que revelam
          <br />
          o panorama da segurança no Brasil.”
        </p>
      </div>

      <div className="sidebar-bottom-bg" />
    </aside>
  );
}
