import React, { useState } from 'react';
import {
  Home,
  HelpCircle,
  Database,
  MapPin,
  Calendar,
  Shield,
  Fingerprint,
  SlidersHorizontal,
} from 'lucide-react';

interface SidebarProps {
  filters: any;
  setFilters: (filters: any) => void;
}

export default function Sidebar({ filters, setFilters }: SidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters({ ...localFilters, [name]: value });
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
        <a href="#" className="active">
          <Home size={20} /> Início
        </a>
        <a href="#">
          <HelpCircle size={20} /> Sobre o projeto
        </a>
        <a href="#">
          <Database size={20} /> Fontes de dados
        </a>
      </nav>

      <div className="filters-section">
        <div className="filter-group">
          <label>
            <MapPin size={16} /> Cidade
          </label>
          <select name="city" value={localFilters.city} onChange={handleChange}>
            <option value="Vitória da Conquista">Vitória da Conquista</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <Calendar size={16} /> Período
          </label>
          <select name="period" value={localFilters.period} onChange={handleChange}>
            <option value="5-years">Últimos 5 anos</option>
            <option value="1-year">Último ano</option>
            <option value="6-months">Últimos 6 meses</option>
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

      <div style={{ marginTop: 'auto', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.4' }}>"Dados que revelam<br />uma cidade mais segura."</p>
        <div style={{ height: '120px', backgroundImage: 'url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=300&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', marginTop: '16px', opacity: 0.6 }}></div>
      </div>
    </aside>
  );
}
