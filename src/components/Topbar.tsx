import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Search, X, Sun, Moon, BarChart2, Building2,
    MapPin,
    ShieldAlert,
    Menu,
} from 'lucide-react';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';

export interface SearchSelection {
    label: string;
    stateUf?: string;
    municipalityCode?: string;
    indicatorId?: string;
    city?: string;
    neighborhood?: string;
    crimeType?: string;
}

interface SuggestionItem extends SearchSelection {
    id: string;
    category: 'Estado (UF)' | 'Município' | 'Indicador';
    subtitle?: string;
}

interface TopbarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onConfirmSearch: (selection: SearchSelection) => void;
    onClearSearch: () => void;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    onOpenAnalytics: () => void;
    onToggleMobileMenu?: () => void;
}

export default function Topbar({
    searchQuery,
    setSearchQuery,
    onConfirmSearch,
    onClearSearch,
    theme,
    toggleTheme,
    onOpenAnalytics,
    onToggleMobileMenu,
}: TopbarProps) {
    const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 200);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const staticSuggestions = useMemo<SuggestionItem[]>(() => {
        const items: SuggestionItem[] = [];

        BRAZIL_STATES.forEach((st) => {
            items.push({
                id: `uf-${st.uf}`,
                label: `${st.name} (${st.uf})`,
                category: 'Estado (UF)',
                subtitle: 'Unidade da Federação — Sinesp VDE / IBGE',
                stateUf: st.uf,
            });
        });

        crimeService.getOfficialIndicatorsCatalog().forEach((ind) => {
            items.push({
                id: `ind-${ind.id}`,
                label: ind.label,
                category: 'Indicador',
                subtitle:
                    ind.granularity === 'state_and_municipality'
                        ? `Indicador Sinesp VDE (${ind.unitLabel}) — Estadual e Municipal`
                        : `Indicador Sinesp VDE (${ind.unitLabel}) — Estadual`,
                indicatorId: ind.id,
            });
        });

        return items;
    }, []);

    const filteredSuggestions = useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase();
        if (!q) return [];

        const matchedStatic = staticSuggestions.filter(
            (item) =>
                item.label.toLowerCase().includes(q) ||
                (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
                item.category.toLowerCase().includes(q)
        );

        const matchedMunicipalities: SuggestionItem[] = [];
        if (q.length >= 2) {
            for (const st of BRAZIL_STATES) {
                const muns = crimeService.getOfficialMunicipalitiesByState(st.uf);
                for (const m of muns) {
                    if (
                        m.name.toLowerCase().includes(q) ||
                        m.ibgeCode.startsWith(q)
                    ) {
                        matchedMunicipalities.push({
                            id: `mun-${m.ibgeCode}`,
                            label: `${m.name} (${m.uf})`,
                            category: 'Município',
                            subtitle: `IBGE ${m.ibgeCode} • Pop. ${m.population.toLocaleString('pt-BR')} hab.`,
                            stateUf: m.uf,
                            municipalityCode: m.ibgeCode,
                            city: m.name,
                        });
                    }
                    if (matchedMunicipalities.length >= 5) break;
                }
                if (matchedMunicipalities.length >= 5) break;
            }
        }

        return [...matchedStatic, ...matchedMunicipalities].slice(0, 8);
    }, [debouncedQuery, staticSuggestions]);

    const handleSelect = (item: SearchSelection) => {
        setSearchQuery(item.label);
        setIsOpen(false);
        setHighlightedIndex(-1);
        onConfirmSearch(item);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((prev) =>
                filteredSuggestions.length > 0 ? (prev + 1) % filteredSuggestions.length : -1
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                filteredSuggestions.length > 0
                    ? (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length
                    : -1
            );
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
                handleSelect(filteredSuggestions[highlightedIndex]);
            } else if (searchQuery.trim()) {
                const exactMatch = filteredSuggestions[0];
                if (exactMatch) {
                    handleSelect(exactMatch);
                } else {
                    handleSelect({ label: searchQuery.trim() });
                }
            }
        }
    };

    const renderCategoryIcon = (category: SuggestionItem['category']) => {
        if (category === 'Estado (UF)') return <MapPin size={16} className="suggestion-icon" />;
        if (category === 'Município') return <Building2 size={16} className="suggestion-icon" />;
        return <ShieldAlert size={16} className="suggestion-icon" />;
    };
    return (
        <header className="topbar">
            <div className="topbar-left-group">
                {onToggleMobileMenu && (
                    <button
                        type="button"
                        className="mobile-menu-btn"
                        onClick={onToggleMobileMenu}
                        aria-label="Abrir menu e filtros"
                        title="Menu e Filtros"
                    >
                        <Menu size={20} />
                    </button>
                )}
                <div className="topbar-search-wrapper" ref={wrapperRef}>
                    <div className="topbar-search">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por estado (UF), município (IBGE) ou indicador..."
                            value={searchQuery}
                            onFocus={() => setIsOpen(true)}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsOpen(true);
                                setHighlightedIndex(-1);
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="clear-search-btn"
                                onClick={() => {
                                    setSearchQuery('');
                                    setIsOpen(false);
                                    setHighlightedIndex(-1);
                                    onClearSearch();
                                }}
                                title="Limpar pesquisa"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {isOpen && searchQuery.trim().length > 0 && (
                        <div className="search-dropdown">
                            {filteredSuggestions.length > 0 ? (
                                filteredSuggestions.map((item, idx) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`search-suggestion-item ${idx === highlightedIndex ? 'highlighted' : ''
                                            }`}
                                        onMouseEnter={() => setHighlightedIndex(idx)}
                                        onClick={() => handleSelect(item)}
                                    >
                                        <div className="suggestion-left">
                                            {renderCategoryIcon(item.category)}
                                            <div>
                                                <div className="suggestion-label">{item.label}</div>
                                                {item.subtitle && (
                                                    <div className="suggestion-sub">{item.subtitle}</div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="suggestion-badge">{item.category}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="search-dropdown-empty">
                                    Pressione <strong>Enter</strong> para buscar por "{searchQuery.trim()}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="topbar-actions">
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
                >
                    <Moon size={15} className={theme === 'dark' ? 'active-theme-icon' : ''} />
                    <span className={`toggle-track ${theme === 'light' ? 'light' : ''}`}>
                        <span className="toggle-thumb" />
                    </span>
                    <Sun size={15} className={theme === 'light' ? 'active-theme-icon' : ''} />
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