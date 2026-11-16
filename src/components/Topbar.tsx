import { Search, Sun, Moon, BarChart2 } from 'lucide-react';

interface TopbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onOpenAnalytics: () => void;
}

export default function Topbar({
  searchQuery,
  setSearchQuery,
  theme,
  toggleTheme,
  onOpenAnalytics,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por bairro, região ou tipo de crime..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
        >
          <Sun size={15} className={theme === 'light' ? 'active-theme-icon' : ''} />
          <span className={`toggle-track ${theme === 'light' ? 'light' : ''}`}>
            <span className="toggle-thumb" />
          </span>
          <Moon size={15} className={theme === 'dark' ? 'active-theme-icon' : ''} />
        </button>

        <div className="topbar-divider" />

        <button
          type="button"
          className="analytics-shortcut"
          onClick={onOpenAnalytics}
          title="Análises"
        >
          <BarChart2 size={20} />
        </button>
      </div>
    </header>
  );
}