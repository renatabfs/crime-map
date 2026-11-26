import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar, { type SearchSelection } from './components/Topbar';
import HeaderStats from './components/HeaderStats';
import SearchResults from './components/SearchResults';
import AboutProject from './components/AboutProject';
import DataSources from './components/DataSources';
import AnalyticsPage from './components/AnalyticsPage';
import './App.css';
// @ts-ignore
import MapView from './components/MapView';
import ChartsPanel from './components/ChartsPanel';
import RecentOccurrences from './components/RecentOccurrences';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmedSearch, setConfirmedSearch] = useState<SearchSelection | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('crimemap-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const defaultFilters = {
    state: 'all',
    municipalityCode: 'all',
    indicatorId: 'homicidio-doloso',
    metricMode: 'rate' as 'rate' | 'absolute',
    year: 2025,
    city: 'all',
    neighborhood: 'all',
    period: '2025',
    crimeType: 'all',
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('crimemap-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleConfirmSearch = (selection: SearchSelection) => {
    if (selection.stateUf || selection.municipalityCode || selection.indicatorId) {
      setFilters((prev) => ({
        ...prev,
        state: selection.stateUf ?? prev.state,
        municipalityCode:
          selection.municipalityCode ??
          (selection.stateUf && selection.stateUf !== prev.state
            ? 'all'
            : prev.municipalityCode),
        indicatorId: selection.indicatorId ?? prev.indicatorId,
        city: selection.city ?? 'all',
      }));
      setConfirmedSearch(null);
      setActiveTab('home');
      return;
    }

    setConfirmedSearch(selection);
    setActiveTab('search');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setConfirmedSearch(null);
    setFilters(defaultFilters);
    if (activeTab === 'search') {
      setActiveTab('home');
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      handleClearSearch();
    }
  };

  return (
    <div className="dashboard-layout">
      {isMobileMenuOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        activeTab={activeTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'search') {
            setConfirmedSearch(null);
            setSearchQuery('');
            setFilters(defaultFilters);
          }
        }}
      />
      <main className="main-content">
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={handleSearchInput}
          onConfirmSearch={handleConfirmSearch}
          onClearSearch={handleClearSearch}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenAnalytics={() => setActiveTab('analytics')}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />
        {activeTab === 'home' && (
          <>
            <HeaderStats filters={filters} />
            <div className="content-grid">
              <MapView filters={filters} searchQuery={searchQuery} />
              <ChartsPanel filters={filters} />
            </div>
            <RecentOccurrences
              filters={filters}
              searchQuery={searchQuery}
              onViewAll={() => setActiveTab('analytics')}
            />
          </>
        )}

        {activeTab === 'search' && confirmedSearch && (
          <SearchResults
            confirmedSearch={confirmedSearch}
            filters={filters}
            onBackHome={() => {
              setConfirmedSearch(null);
              setSearchQuery('');
              setFilters(defaultFilters);
              setActiveTab('home');
            }}
          />
        )}

        {activeTab === 'about' && (
          <AboutProject
            onNavigateTab={(tab) => setActiveTab(tab)}
            onFocusSearch={() => {
              const input = document.querySelector<HTMLInputElement>('.topbar-search input');
              input?.focus();
            }}
          />
        )}

        {activeTab === 'sources' && <DataSources />}
        {activeTab === 'analytics' && <AnalyticsPage filters={filters} />}
      </main>
    </div>
  );
}

export default App;
