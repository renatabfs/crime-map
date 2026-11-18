import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Search, X, Sun, Moon, BarChart2, Building2,
    MapPin,
    ShieldAlert,
    Menu,
} from 'lucide-react';
import { citiesMetadata, crimeData } from '../data/mockData';

export interface SearchSelection {
    label: string;
    city?: string;
    neighborhood?: string;
    crimeType?: string;
}

interface SuggestionItem extends SearchSelection {
    id: string;
    category: 'Cidade' | 'Bairro' | 'Ocorrência';
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

    const allSuggestions = useMemo<SuggestionItem[]>(() => {
        const items: SuggestionItem[] = [];

        citiesMetadata.forEach((c) => {
            items.push({
                id: `city-${c.name}`,
                label: `${c.name} - ${c.state}`,
                category: 'Cidade',
                subtitle: 'Município monitorado',
                city: c.name,
            });
        });

        const uniqueNeighborhoods = Array.from(
            new Set(crimeData.map((r) => `${r.neighborhood}|${r.city}|${r.state}`))
        );
        uniqueNeighborhoods.forEach((entry) => {
            const [neighborhood, city, state] = entry.split('|');
            items.push({
                id: `neigh-${neighborhood}-${city}`,
                label: `${neighborhood}, ${city}`,
                category: 'Bairro',
                subtitle: `${city} - ${state}`,
                city,
                neighborhood,
            });
        });

        const uniqueTypes = Array.from(new Set(crimeData.map((r) => r.type)));
        uniqueTypes.forEach((type) => {
            items.push({
                id: `type-${type}`,
                label: type,
                category: 'Ocorrência',
                subtitle: 'Tipo de ocorrência',
                crimeType: type,
            });
        });

        const uniqueCombos = Array.from(
            new Set(crimeData.map((r) => `${r.type}|${r.neighborhood}|${r.city}`))
        );
        uniqueCombos.forEach((entry) => {
            const [type, neighborhood, city] = entry.split('|');
            items.push({
                id: `combo-${type}-${neighborhood}-${city}`,
                label: `${type} em ${neighborhood}`,
                category: 'Ocorrência',
                subtitle: `${neighborhood}, ${city}`,
                city,
                neighborhood,
                crimeType: type,
            });
        });

        return items;
    }, []);

    const filteredSuggestions = useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase();
        if (!q) return [];
        return allSuggestions
            .filter(
                (item) =>
                    item.label.toLowerCase().includes(q) ||
                    (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
                    item.category.toLowerCase().includes(q)
            )
            .slice(0, 7);
    }, [debouncedQuery, allSuggestions]);

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
        if (category === 'Cidade') return <Building2 size={16} className="suggestion-icon" />;
        if (category === 'Bairro') return <MapPin size={16} className="suggestion-icon" />;
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
                            placeholder="Buscar por cidade, bairro ou tipo de ocorrência..."
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