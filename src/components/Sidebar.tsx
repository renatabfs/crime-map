import React, { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { citiesMetadata, crimeData } from '../data/mockData';

interface SidebarProps {
  filters: any;
  setFilters: (filters: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ filters, setFilters, activeTab, setActiveTab }: SidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const availableNeighborhoods = useMemo(() => {
    const filteredByCity =
      localFilters.city === 'all'
        ? crimeData
        : crimeData.filter((item) => item.city === localFilters.city);

    return Array.from(new Set(filteredByCity.map((item) => item.neighborhood))).sort();
  }, [localFilters.city]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'city') {
      setLocalFilters({ ...localFilters, city: value, neighborhood: 'all' });
    } else {
      setLocalFilters({ ...localFilters, [name]: value });
    }
  };

  const handleApply = () => {
    setFilters(localFilters);
  };

  return (
    <aside className="sidebar">
      <div className="brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px', marginBottom: '10px' }}>
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
              <MapPin size={16} /> Cidade
            </label>
            <select name="city" value={localFilters.city} onChange={handleChange}>
              <option value="all">Todas as cidades</option>
              {citiesMetadata.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <MapPin size={16} /> Bairro
            </label>
            <select
              name="neighborhood"
              value={localFilters.neighborhood || 'all'}
              onChange={handleChange}
            >
              <option value="all">Todos os bairros</option>
              {availableNeighborhoods.map((neigh) => (
                <option key={neigh} value={neigh}>
                  {neigh}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Calendar size={16} /> Período
            </label>
            <select name="period" value={localFilters.period} onChange={handleChange}>
              <option value="30-days">Últimos 30 dias</option>
              <option value="6-months">Últimos 6 meses</option>
              <option value="1-year">Último ano</option>
              <option value="5-years">Últimos 5 anos</option>
              <option value="2026">Ano de 2026</option>
              <option value="2025">Ano de 2025</option>
              <option value="2024">Ano de 2024</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Shield size={16} /> Tipo de ocorrência
            </label>
            <select
              name="crimeType"
              value={localFilters.crimeType}
              onChange={handleChange}
            >
              <option value="all">Todos os tipos</option>
              <option value="Roubo">Roubo</option>
              <option value="Furto">Furto</option>
              <option value="Lesão Corporal">Lesão Corporal</option>
              <option value="Homicídio">Homicídio</option>
            </select>
          </div>

          <button className="apply-btn" onClick={handleApply}>
            <SlidersHorizontal size={18} /> Aplicar Filtros
          </button>
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.4' }}>"Dados que revelam<br />uma cidade mais segura."</p>
        <div style={{ height: '120px', backgroundImage: 'url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=300&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', marginTop: '16px', opacity: 0.6 }}></div>
      </div>
    </aside>
  );
}
