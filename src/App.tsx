import { useState } from 'react';
import Sidebar from './components/Sidebar';
import HeaderStats from './components/HeaderStats';
import './App.css';
// @ts-ignore
import MapView from './components/MapView';
import ChartsPanel from './components/ChartsPanel';
import RecentOccurrences from './components/RecentOccurrences';

function App() {
  const [filters, setFilters] = useState({
    city: 'Vitória da Conquista',
    period: '5-years',
    crimeType: 'all',
  });

  return (
    <div className="dashboard-layout">
      <Sidebar filters={filters} setFilters={setFilters} />
      <main className="main-content">
        <HeaderStats filters={filters} />
        <div className="content-grid">
          <MapView filters={filters} />
          <ChartsPanel filters={filters} />
        </div>
        <RecentOccurrences />
      </main>
    </div>
  );
}

export default App;
