import { useMemo } from 'react';
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
import { crimeService, BRAZIL_STATES } from '../services/crimeService';

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
  const catalog = useMemo(() => crimeService.getOfficialIndicatorsCatalog(), []);
  const municipalIndicatorsCount = useMemo(
    () => catalog.filter((c) => c.granularity === 'state_and_municipality').length,
    [catalog]
  );
  const nationalSummary = useMemo(
    () => crimeService.getOfficialIndicatorSummary('homicidio-doloso', 'all', 2025),
    []
  );

  const sourcesList: SourceItem[] = [
    {
      id: 'inesp-vde',
      name: 'MJSP / Sinesp VDE — Dados Nacionais de Segurança Pública',
      description: 'Base oficial consolidada (BancoVDE 2025.xlsx) com 24 indicadores estaduais e 10 indicadores com detalhamento municipal.',
      badge: 'Oficial',
      period: '2025 (Série histórica incremental)',
      updateFrequency: 'Anual / Consolidado',
      url: 'https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica/dados-nacionais-de-seguranca-publica-estatisticas-sinesp-1',
      icon: 'shield',
    },
    {
      id: 'ibge-pop',
      name: 'IBGE — Estimativas da População (Tabela 6579 / Variável 9324)',
      description: 'População residente estimada por Unidade da Federação e Município utilizada no cálculo oficial de taxas por 100 mil habitantes.',
      badge: 'Oficial',
      period: '2025 (Série histórica incremental)',
      updateFrequency: 'Anual',
      url: 'https://sidra.ibge.gov.br/tabela/6579',
      icon: 'chart',
    },
    {
      id: 'ibge-territorio',
      name: 'IBGE — Divisão Territorial e Códigos Municipais (DTB)',
      description: 'Cadastro oficial de 27 Unidades da Federação e 5.571 municípios brasileiros (incluindo Boa Esperança do Norte - MT).',
      badge: 'Livre',
      period: 'Vigente (2025)',
      updateFrequency: 'Anual',
      url: 'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial.html',
      icon: 'pin',
    },
  ];
  
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
                  <Calendar size={15} color="#e12c2c" /> Anos integrados atualmente
                </span>
                <strong>2025 (Expansão histórica contínua)</strong>
              </div>

              <div className="info-metric-row">
                <span className="info-metric-label">
                  <RefreshCw size={15} color="#e12c2c" /> Catálogo de indicadores
                </span>
                <strong>{catalog.length} estaduais / {municipalIndicatorsCount} municipais</strong>
              </div>

              <div className="info-metric-row">
                <span className="info-metric-label">
                  <FileSpreadsheet size={15} color="#e12c2c" /> Pipeline de ingestão
                </span>
                <strong>ETL Oficial (XLSX / IBGE JSON)</strong>
              </div>

              <div className="info-metric-row">
                <span className="info-metric-label">
                  <Globe size={15} color="#e12c2c" /> Cobertura territorial
                </span>
                <strong>
                  {BRAZIL_STATES.length} UFs • 5.571 municípios
                </strong>
              </div>

              <div className="info-metric-row">
                <span className="info-metric-label">
                  <Database size={15} color="#e12c2c" /> População nacional (IBGE 2025)
                </span>
                <strong>{nationalSummary.population !== null
                  ? `${nationalSummary.population.toLocaleString('pt-BR')} hab.`
                  : '213.421.037 hab.'}</strong>
              </div>
            </div>
          </div>

          <div className="sources-panel-card">
            <div className="sources-panel-header">
              <SlidersHorizontal size={20} color="#e12c2c" />
              <h2>Como os dados são utilizados?</h2>
            </div>
            <p className="about-card-text">
              Os dados oficiais do MJSP / Sinesp VDE e do IBGE são validados,
              pareados por código territorial de 7 dígitos e cruzados para gerar
              volumes absolutos e taxas proporcionais por 100 mil habitantes. O
              CrimeMap possui arquitetura preparada para série histórica multi-ano,
              incorporando novos anos consolidados progressivamente.
            </p>
          </div>
        </div>
      </section>
      <section className="about-warning-box">
        <div className="warning-stripes" />
        <AlertTriangle size={28} color="#e12c2c" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h3>Limitações e tratamento de valores indisponíveis (null)</h3>
          <p>
            Os indicadores refletem exclusivamente os números consolidados divulgados
            pelos órgãos oficiais. Quando determinada UF ou município não possui dado
            reportado para um indicador específico (como ocorre em séries estaduais
            parciais), o sistema preserva explicitamente o status{' '}
            <strong>Indisponível (null)</strong> e nunca o converte em zero.
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
