import {
  Target,
  BarChart2,
  Check,
  Database,
  Calendar,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  Code2,
  Search,
  MapPin,
} from 'lucide-react';

interface AboutProjectProps {
  onNavigateTab: (tab: string) => void;
  onFocusSearch: () => void;
}

export default function AboutProject({
  onNavigateTab,
  onFocusSearch,
}: AboutProjectProps) {
  const techStack = [
    { name: 'React', color: '#61dafb', url: 'https://react.dev/' },
    { name: 'TypeScript', color: '#3178c6', url: 'https://www.typescriptlang.org/docs/' },
    { name: 'Leaflet', color: '#77b829', url: 'https://leafletjs.com/reference.html' },
    { name: 'Recharts', color: '#ff5c8d', url: 'https://recharts.org/en-US/api' },
    { name: 'CSS', color: '#2965f1', url: 'https://developer.mozilla.org/pt-BR/docs/Web/CSS' },
  ];

  return (
    <div className="about-page">
      <section className="about-banner">
        <div className="about-banner-overlay" />
        <div className="about-banner-arc" />
        <div className="about-banner-content">
          <div className="about-red-bar" />
          <h1>
            Sobre o <span>CrimeMap</span>
          </h1>
          <p className="about-slogan">Indicadores oficiais de segurança pública e demografia do Brasil.</p>
          <p className="about-lead">
            O CrimeMap é uma plataforma de visualização e análise de indicadores
            oficiais de segurança pública e estatísticas populacionais. Projetado com
            arquitetura histórica incremental, o sistema integra os dados consolidados
            do MJSP / Sinesp VDE cruzados com as estimativas oficiais do IBGE,
            iniciando pelo ano-base de 2025 e expandindo progressivamente para toda a
            série temporal.
          </p>
        </div>
      </section>
      <section className="about-two-cols">
        <div className="about-card about-card-watermark">
          <Search size={115} className="card-bg-watermark" strokeWidth={1.2} />
          <div className="about-card-header">
            <div className="about-icon-circle">
              <Target size={22} color="#e12c2c" />
            </div>
            <div>
              <h2>Nosso objetivo</h2>
              <p className="about-card-subtitle">
                Tornar estatísticas oficiais mais claras e comparáveis.
              </p>
            </div>
          </div>
          <p className="about-card-text">
            O objetivo do CrimeMap é apresentar os 24 indicadores estaduais e os 10
            indicadores municipalizados do Sinesp VDE com rigor metodológico,
            permitindo comparar volumes absolutos e taxas proporcionais por 100 mil
            habitantes entre Estados (27 UFs) e Municípios (5.571 municípios IBGE).
          </p>
        </div>

        <div className="about-card about-card-watermark">
          <MapPin size={115} className="card-bg-watermark" strokeWidth={1.2} />
          <div className="about-card-header">
            <div className="about-icon-circle">
              <BarChart2 size={22} color="#e12c2c" />
            </div>
            <div>
              <h2>Como funciona?</h2>
              <p className="about-card-subtitle">
              Explore, compare e interprete com critério demográfico.
              </p>
            </div>
          </div>

          <div className="how-it-works-list">
            <button
              type="button"
              className="how-item-link"
              onClick={() => onNavigateTab('home')}
            >
              <Check size={16} color="#e12c2c" strokeWidth={2.5} />
              <span>Explore o mapa interativo e o mapa de calor das 27 UFs</span>
            </button>

            <button
              type="button"
              className="how-item-link"
              onClick={() => onNavigateTab('home')}
            >
              <Check size={16} color="#e12c2c" strokeWidth={2.5} />
              <span>Compare indicadores compatíveis na mesma unidade de medida</span>
            </button>

            <button
              type="button"
              className="how-item-link"
              onClick={onFocusSearch}
            >
              <Check size={16} color="#e12c2c" strokeWidth={2.5} />
              <span>Pesquise estados e municípios oficiais do cadastro IBGE</span>
            </button>

            <button
              type="button"
              className="how-item-link"
              onClick={() => onNavigateTab('home')}
            >
              <Check size={16} color="#e12c2c" strokeWidth={2.5} />
              <span>Alterne entre taxa por 100 mil habitantes e volume absoluto</span>
            </button>
          </div>
        </div>
      </section>
      <section className="about-sources-card">
        <div className="about-sources-left">
          <div className="about-card-header">
            <Database size={22} color="#e12c2c" />
            <h2>Fontes de dados</h2>
          </div>
          <p className="about-card-text">
            Os dados apresentados pelo CrimeMap são provenientes de fontes
            públicas e/ou bases oficiais disponibilizadas para consulta. Cada
            conjunto de dados possui suas próprias características, período de
            cobertura e limitações.
          </p>
          <button
            type="button"
            className="about-sources-link-btn"
            onClick={() => onNavigateTab('sources')}
          >
            Conhecer todas as fontes <ArrowRight size={15} />
          </button>
        </div>

        <div className="about-sources-divider" />

        <div className="about-sources-right">
          <div className="source-meta-line">
            <Database size={16} className="meta-line-icon" />
            <span>
              Origem: <strong>MJSP / Sinesp VDE + IBGE (Tabela 6579)</strong>
            </span>
          </div>
          <div className="source-meta-line">
            <Calendar size={16} className="meta-line-icon" />
            <span>
              Série histórica: <strong>2025 integrado (expansão incremental)</strong>
            </span>
          </div>
          <div className="source-meta-line">
            <RefreshCw size={16} className="meta-line-icon" />
            <span>
              Cobertura: <strong>27 UFs e 5.571 municípios IBGE</strong>
            </span>
          </div>
          <div className="source-meta-line">
            <ExternalLink size={16} className="meta-line-icon" />
            <span>
              Fontes: <strong>BancoVDE (MJSP) e SIDRA / IBGE</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="about-warning-box">
        <div className="warning-stripes" />
        <AlertTriangle size={28} color="#e12c2c" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h3>Sobre os dados e valores indisponíveis (null)</h3>
          <p>
            Os indicadores refletem exclusivamente os dados oficiais divulgados pelo
            MJSP / Sinesp VDE e as estimativas populacionais do IBGE. Quando uma UF ou
            município não possui dado reportado na planilha oficial para determinado
            evento, o sistema preserva explicitamente o status{' '}
            <strong>Indisponível (null)</strong> e nunca o converte em zero.
          </p>
        </div>
      </section>

      <footer className="about-footer">
        <div className="about-footer-info">
          <div className="footer-dev">
            <Code2 size={16} color="#e12c2c" />
            <span>
              Desenvolvido por <strong>Renata Beatriz</strong>
            </span>
          </div>
          <span className="footer-sep">|</span>
          <p>
            Projeto acadêmico para estudo e demonstração de tecnologias web.
          </p>
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