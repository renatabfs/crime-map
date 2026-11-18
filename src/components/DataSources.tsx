import { useState, useEffect } from 'react';
import {
  Database,
  Shield,
  BarChart2,
  MapPin,
  Calendar,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  SlidersHorizontal,
  FileSpreadsheet,
  Globe,
  Code2,
} from 'lucide-react';
import { crimeService } from '../services/crimeService';
import type { DataSourceMetadata } from '../services/crimeService';

interface SourceItem {
  id: string;
  name: string;
  description: string;
  badge: 'Oficial' | 'Pública' | 'Livre';
  period: string;
  updateFrequency: string;
  url: string;
  icon: 'shield' | 'chart' | 'pin';
}

export default function DataSources() {
  const sourcesList: SourceItem[] = [
    {
      id: 'ssp-ba',
      name: 'Secretaria da Segurança Pública da Bahia (SSP-BA)',
      description: 'Base demonstrativa de registros e estatísticas criminais consolidados.',
      badge: 'Oficial',
      period: '2020 – 2026',
      updateFrequency: 'Mensal',
      url: 'https://www.ba.gov.br/seguranca/',
      icon: 'shield',
    },
    {
      id: 'dados-abertos',
      name: 'Portal Brasileiro de Dados Abertos (SINESP)',
      description: 'Indicadores complementares de segurança pública em âmbito nacional.',
      badge: 'Pública',
      period: '2018 – 2026',
      updateFrequency: 'Trimestral',
      url: 'https://dados.gov.br/',
      icon: 'chart',
    },
    {
      id: 'ibge',
      name: 'IBGE – Cidades e Estados',
      description: 'Malha territorial, divisões municipais e referência geográfica.',
      badge: 'Livre',
      period: '2010 – 2026',
      updateFrequency: 'Anual',
      url: 'https://cidades.ibge.gov.br/',
      icon: 'pin',
    },
  ];
  const [dynamicMetadata, setDynamicMetadata] = useState<DataSourceMetadata>({
    totalRecords: 0,
    totalCities: 0,
    totalStates: 0,
    uniqueNeighborhoods: 0,
    periodLabel: 'Carregando...',
    lastUpdateLabel: 'Carregando...',
    coverageScope: 'Carregando...',
  });

  useEffect(() => {
    let active = true;
    crimeService.getDataSourcesSummary().then((summary) => {
      if (active) setDynamicMetadata(summary);
    });
    return () => {
      active = false;
    };
  }, []);

  const techStack = [
    { name: 'React', color: '#61dafb', url: 'https://react.dev/' },
    { name: 'TypeScript', color: '#3178c6', url: 'https://www.typescriptlang.org/docs/' },
    { name: 'Leaflet', color: '#77b829', url: 'https://leafletjs.com/reference.html' },
    { name: 'Recharts', color: '#ff5c8d', url: 'https://recharts.org/en-US/api' },
    { name: 'CSS', color: '#2965f1', url: 'https://developer.mozilla.org/pt-BR/docs/Web/CSS' },
  ];

  const renderSourceIcon = (type: SourceItem['icon']) => {
    if (type === 'shield') return <Shield size={24} color="#e12c2c" />;
    if (type === 'chart') return <BarChart2 size={24} color="#e12c2c" />;
    return <MapPin size={24} color="#e12c2c" />;
  };

  return (
    <div className="sources-page">
      <section className="about-banner">
        <div className="about-banner-overlay" />
        <div className="about-banner-arc" />
        <div className="about-banner-content">
          <div className="about-red-bar" />
          <div className="sources-banner-title-row">
            <div className="sources-banner-icon">
              <Database size={28} color="#e12c2c" />
            </div>
            <h1>
              Fontes de <span>Dados</span>
            </h1>
          </div>
          <p className="about-slogan">
            Transparência e confiabilidade para uma análise mais precisa.
          </p>
          <p className="about-lead">
            O CrimeMap utiliza dados públicos e bases oficiais para construir suas
            visualizações e análises. Aqui você encontra detalhes sobre a origem das
            informações, cobertura geográfica, atualização e limitações metodológicas.
          </p>
        </div>
      </section>
      <section className="sources-main-grid">
        <div className="sources-panel-card">
          <div className="sources-panel-header">
            <Database size={20} color="#e12c2c" />
            <h2>Principais Fontes</h2>
          </div>

          <div className="sources-items-list">
            {sourcesList.map((src) => (
              <div key={src.id} className="source-row-card">
                <div className="source-row-icon">{renderSourceIcon(src.icon)}</div>

                <div className="source-row-body">
                  <div className="source-row-title-line">
                    <h3>{src.name}</h3>
                    <span className={`source-nature-badge ${src.badge.toLowerCase()}`}>
                      {src.badge}
                    </span>
                  </div>
                  <p className="source-row-desc">{src.description}</p>
                  <div className="source-row-tags">
                    <span className="source-pill-tag">
                      <Calendar size={12} /> Período: <strong>{src.period}</strong>
                    </span>
                    <span className="source-pill-tag">
                      <RefreshCw size={12} /> Atualização: <strong>{src.updateFrequency}</strong>
                    </span>
                  </div>
                </div>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-external-btn"
                  title={`Acessar ${src.name}`}
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="sources-right-column">
          <div className="sources-panel-card">
            <div className="sources-panel-header">
              <BarChart2 size={20} color="#e12c2c" />
              <h2>Informações dos Dados</h2>
            </div>

            <div className="sources-info-list">
              <div className="info-metric-row">
                <span className="info-metric-label">
                  <Calendar size={15} color="#e12c2c" /> Período coberto na base
                </span>
                <strong>{dynamicMetadata.periodLabel}</strong>
              </div>

              <div className="info-metric-row">
                <span className="info-metric-label">
                  <RefreshCw size={15} color="#e12c2c" /> Último registro na base
                </span>
                <strong>{dynamicMetadata.lastUpdateLabel}</strong>
              </div>

              <div className="info-metric-row">
                <span className="info-metric-label">
                  <FileSpreadsheet size={15} color="#e12c2c" /> Formato estruturado
                </span>
                <strong>JSON / GeoJSON (API)</strong>
              </div>

              <div className="info-metric-row">
                <span className="info-metric-label">
                  <Globe size={15} color="#e12c2c" /> Cobertura geográfica
                </span>
                <strong>
                  {dynamicMetadata.totalCities} cidades ({dynamicMetadata.uniqueNeighborhoods} bairros)
                </strong>
              </div>

              <div className="info-metric-row">
                <span className="info-metric-label">
                  <Database size={15} color="#e12c2c" /> Registros carregados
                </span>
                <strong>{dynamicMetadata.totalRecords} ocorrências</strong>
              </div>
            </div>
          </div>

          <div className="sources-panel-card">
            <div className="sources-panel-header">
              <SlidersHorizontal size={20} color="#e12c2c" />
              <h2>Como os dados são utilizados?</h2>
            </div>
            <p className="about-card-text">
              Os registros coletados são organizados, filtrados e agregados pelo
              CrimeMap para gerar mapas interativos, gráficos comparativos e
              indicadores estatísticos. O sistema funciona exclusivamente como uma
              ferramenta de visualização e análise exploratória, não atuando como
              fonte primária de boletins ou registros policiais.
            </p>
          </div>
        </div>
      </section>
      <section className="about-warning-box">
        <div className="warning-stripes" />
        <AlertTriangle size={28} color="#e12c2c" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h3>Limitações</h3>
          <p>
            Os dados apresentados representam exclusivamente registros existentes nas
            bases utilizadas e não necessariamente correspondem à totalidade dos
            crimes ocorridos. Podem existir diferenças de classificação entre órgãos,
            atrasos de consolidação, lacunas ou inconsistências. A ausência de
            registros em determinada região não significa ausência de criminalidade.
          </p>
        </div>
      </section>
      <footer className="about-footer">
        <div className="about-footer-info">
          <div className="footer-dev">
            <strong style={{ color: 'var(--accent-red)' }}>CrimeMap</strong>
            <span>• Dados que revelam uma cidade mais segura.</span>
          </div>
          <span className="footer-sep">|</span>
          <div className="footer-dev">
            <Code2 size={16} color="#e12c2c" />
            <span>
              Desenvolvido por <strong>Renata Beatriz</strong>
            </span>
          </div>
        </div>

        <div className="about-tech-links">
          {techStack.map((tech) => (
            <a
              key={tech.name}
              href={tech.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tech-pill"
            >
              <span
                className="tech-color-dot"
                style={{ backgroundColor: tech.color }}
              />
              {tech.name}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
