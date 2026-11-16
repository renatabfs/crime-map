import { useState } from 'react';
import Sidebar from './components/Sidebar';
import HeaderStats from './components/HeaderStats';
import './App.css';
// @ts-ignore
import MapView from './components/MapView';
import ChartsPanel from './components/ChartsPanel';
import RecentOccurrences from './components/RecentOccurrences';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [filters, setFilters] = useState({
    city: 'Vitória da Conquista',
    period: '5-years',
    crimeType: 'all',
  });

  return (
    <div className="dashboard-layout">
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main className="main-content">
        {activeTab === 'home' && (
          <>
            <HeaderStats filters={filters} />
            <div className="content-grid">
              <MapView filters={filters} />
              <ChartsPanel filters={filters} />
            </div>
            <RecentOccurrences filters={filters} />
          </>
        )}

        {activeTab === 'about' && (
          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '32px' }}>
            <h2 style={{ fontSize: '24px' }}>Sobre o <span style={{ color: 'var(--accent-red)' }}>CrimeMap</span></h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              O <strong>CrimeMap</strong> é uma plataforma de visualização e análise de dados sobre ocorrências criminais. Aqui, você encontra informações organizadas, mapas interativos e gráficos para entender melhor a realidade da sua cidade.
            </p>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '32px' }}>
            <h2 style={{ fontSize: '24px' }}>Fontes de Dados</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              As informações exibidas nesta versão demonstrativa seguem a estrutura de boletins e estatísticas consolidadas pelos órgãos de segurança pública:
            </p>
            <ul style={{ color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>Secretaria da Segurança Pública da Bahia (SSP-BA) — Estatísticas Criminais</li>
              <li>Instituto Brasileiro de Geografia e Estatística (IBGE) — Malha Territorial e Bairros</li>
              <li>OpenStreetMap & Esri World Imagery — Bases Cartográficas e Satélite</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
