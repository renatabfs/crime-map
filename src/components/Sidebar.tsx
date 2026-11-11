import React from 'react';
import {
  Home,
  HelpCircle,
  Database,
  MapPin,
  Calendar,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';

interface SidebarProps {
  filters: any;
  setFilters: (filters: any) => void;
}

export default function Sidebar({ filters, setFilters }: SidebarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <Shield size={32} color="#e12c2c" />
        <div>
          <h1>CrimeMap</h1>
          <p>Visualize. Analise. Entenda.</p>
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
          <select name="city" value={filters.city} onChange={handleChange}>
            <option value="Vitória da Conquista">Vitória da Conquista</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <Calendar size={16} /> Período
          </label>
          <select name="period" value={filters.period} onChange={handleChange}>
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
            value={filters.crimeType}
            onChange={handleChange}
          >
            <option value="all">Todos os tipos</option>
            <option value="Roubo">Roubo</option>
            <option value="Furto">Furto</option>
            <option value="Lesão Corporal">Lesão Corporal</option>
            <option value="Homicídio">Homicídio</option>
          </select>
        </div>

        <button className="apply-btn">
          <SlidersHorizontal size={18} /> Aplicar Filtros
        </button>
      </div>
    </aside>
  );
}
