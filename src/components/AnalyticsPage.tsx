import { useState, useMemo, useEffect } from 'react';
import {
    ShieldAlert,
    TrendingUp,
    MapPin,
    BarChart2,
    Database,
    Award,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';
import type { MunicipalityRankingItem, MetricDisplayMode } from '../types/crime';

interface AnalyticsPageProps {
    filters: any
}

export default function AnalyticsPage({ filters }: AnalyticsPageProps) {
    const [showAllLocations, setShowAllLocations] = useState(false);
    const [munRanking, setMunRanking] = useState<MunicipalityRankingItem[]>([]);
    const [loadingMun, setLoadingMun] = useState(false);

    const indicatorId: string = filters.indicatorId || 'homicidio-doloso';
    const metricMode: MetricDisplayMode = filters.metricMode || 'rate';
    const stateUf: string = filters.state || 'all';
    const municipalityCode: string = filters.municipalityCode || 'all';
    const selectedYear: number = filters.year || 2025;

    const catalog = useMemo(() => crimeService.getOfficialIndicatorsCatalog(), []);
    const currentIndicator = useMemo(
        () => catalog.find((c) => c.id === indicatorId) ?? catalog[0],
        [catalog, indicatorId]
    );

    const isStateAll = !stateUf || stateUf === 'all';
    const isMunicipalIndicator =
        currentIndicator?.granularity === 'state_and_municipality';
    const isMunicipalScope = !isStateAll && isMunicipalIndicator;

    useEffect(() => {
        let active = true;
        if (isMunicipalScope) {
            setLoadingMun(true);
            crimeService
                .getOfficialMunicipalityRanking(stateUf, indicatorId, metricMode)
                .then((list) => {
                    if (active) {
                        setMunRanking(list);
                        setLoadingMun(false);
                    }
                });
        } else {
            setMunRanking([]);
            setLoadingMun(false);
        }
        return () => {
            active = false;
        };
    }, [isMunicipalScope, stateUf, indicatorId, metricMode]);

    const stateSummary = useMemo(
        () => crimeService.getOfficialIndicatorSummary(indicatorId, stateUf, selectedYear),
        [indicatorId, stateUf, selectedYear]
    );

    const selectedStateMeta = useMemo(
        () => (!isStateAll ? BRAZIL_STATES.find((s) => s.uf === stateUf) ?? null : null),
        [isStateAll, stateUf]
    );

    const selectedMunMeta = useMemo(
        () =>
            !isStateAll && municipalityCode !== 'all'
                ? crimeService.getOfficialMunicipalityByCode(municipalityCode)
                : null,
        [isStateAll, municipalityCode]
    );

    const sameUnitBreakdown = useMemo(() => {
        if (!currentIndicator) return [];
        const compatible = catalog.filter((c) => c.unit === currentIndicator.unit);
        const rows = compatible
            .map((ind) => {
                const s = crimeService.getOfficialIndicatorSummary(ind.id, stateUf, selectedYear);
                return {
                    id: ind.id,
                    name: ind.label,
                    value: s.totalValue ?? 0,
                    isAvailable: s.totalValue !== null,
                    isSelected: ind.id === currentIndicator.id,
                };
            })
            .filter((r) => r.isAvailable && r.value > 0)
            .sort((a, b) => b.value - a.value);

        const totalSum = rows.reduce((acc, item) => acc + item.value, 0);
        const palette = ['#e12c2c', '#ff5c5c', '#ff8a8a', '#9ca3af', '#6b7280', '#4b5563'];

        return rows.slice(0, 6).map((item, idx) => ({
            ...item,
            percentage: totalSum > 0 ? Number(((item.value / totalSum) * 100).toFixed(1)) : 0,
            color: item.isSelected ? '#e12c2c' : palette[(idx + 1) % palette.length],
        }));
    }, [catalog, currentIndicator, stateUf, selectedYear]);

    const locationRanking = useMemo(() => {
        if (isMunicipalScope) {
            return munRanking.map((item, idx) => ({
                key: item.ibgeCode,
                rankLabel: `${idx + 1}º`,
                name: item.municipalityName,
                metricValue: item.metricValue,
                rawValue: item.value,
                ratePer100k: item.ratePer100k,
                population: item.population,
                isHighlighted:
                    municipalityCode !== 'all' && item.ibgeCode === municipalityCode,
                isUnavailable: false,
            }));
        }

        const validStates = crimeService.getOfficialStateRanking(indicatorId, metricMode);
        const validMap = new Map(
            validStates.map((item, idx) => [item.uf, { ...item, rank: idx + 1 }])
        );

        const validRows = validStates.map((item, idx) => ({
            key: item.uf,
            rankLabel: `${idx + 1}º`,
            name: `${item.stateName} (${item.uf})`,
            metricValue: item.metricValue,
            rawValue: item.value,
            ratePer100k: item.ratePer100k,
            population: item.population,
            isHighlighted: !isStateAll && item.uf === stateUf,
            isUnavailable: false,
        }));

        const nullRows = BRAZIL_STATES.filter((st) => !validMap.has(st.uf)).map((st) => {
            const s = crimeService.getOfficialIndicatorSummary(indicatorId, st.uf, selectedYear);
            return {
                key: st.uf,
                rankLabel: '—',
                name: `${st.name} (${st.uf})`,
                metricValue: 0,
                rawValue: null as number | null,
                ratePer100k: null as number | null,
                population: s.population ?? 0,
                isHighlighted: !isStateAll && st.uf === stateUf,
                isUnavailable: true,
            };
        });

        return [...validRows, ...nullRows];
    }, [isMunicipalScope, munRanking, municipalityCode, indicatorId, metricMode, isStateAll, stateUf, selectedYear]);

    const displayedRanking = showAllLocations
        ? locationRanking
        : locationRanking.slice(0, 8);

    const comparativeBarsData = useMemo(
        () => locationRanking.filter((item) => !item.isUnavailable).slice(0, 8),
        [locationRanking]
    );

    const decimals = currentIndicator?.unit === 'kg' ? 2 : 0;
    const isPopRate = currentIndicator?.comparisonMethod === 'population_per_100k';
    const scopeTitle = selectedMunMeta
        ? `${selectedMunMeta.name} (${selectedMunMeta.uf})`
        : selectedStateMeta
            ? `${selectedStateMeta.name} (${selectedStateMeta.uf})`
            : 'Brasil (27 UFs)';

    return (
        <div className="analytics-page">
            <section className="about-banner">
                <div className="about-banner-overlay" />
                <div className="about-banner-arc" />
                <div className="about-banner-content">
                    <div className="about-red-bar" />
                    <h1>
                        Análises <span>Oficiais ({selectedYear})</span>
                    </h1>
                    <p className="about-slogan">
                        Comparativos estaduais e municipais do MJSP / Sinesp VDE cruzados com o IBGE.
                    </p>
                </div>
            </section>

            <section className="analytics-three-kpis">
                <div className="analytics-kpi-card">
                    <div className="kpi-icon-wrap">
                        <ShieldAlert size={22} color="#e12c2c" />
                    </div>
                    <div className="kpi-content-col">
                        <span className="kpi-title">{currentIndicator?.label}</span>
                        <div className="kpi-number">
                            {stateSummary.totalValue !== null
                                ? stateSummary.totalValue.toLocaleString('pt-BR', {
                                    maximumFractionDigits: decimals,
                                })
                                : 'Indisponível (null)'}
                        </div>
                        <span className="kpi-footnote">
                            {currentIndicator?.unitLabel} — {scopeTitle}
                        </span>
                    </div>
                </div>

                <div className="analytics-kpi-card">
                    <div className="kpi-icon-wrap">
                        <TrendingUp size={22} color="#e12c2c" />
                    </div>
                    <div className="kpi-content-col">
                        <span className="kpi-title">
                            {isPopRate ? 'Taxa / 100 mil hab.' : 'Critério de comparação'}
                        </span>
                        <div className="kpi-number">
                            {isPopRate
                                ? stateSummary.ratePer100k !== null
                                    ? stateSummary.ratePer100k.toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })
                                    : 'Indisponível (null)'
                                : 'Volume absoluto'}
                        </div>
                        <span className="kpi-footnote">
                            População IBGE ({selectedYear}):{' '}
                            {stateSummary.population !== null
                                ? `${stateSummary.population.toLocaleString('pt-BR')} hab.`
                                : 'Indisponível'}
                        </span>
                    </div>
                </div>

                <div className="analytics-kpi-card">
                    <div className="kpi-icon-wrap">
                        <MapPin size={22} color="#e12c2c" />
                    </div>
                    <div className="kpi-content-col">
                        <span className="kpi-title">
                            {isMunicipalScope ? 'Municípios na UF' : 'Cobertura Estadual'}
                        </span>
                        <div className="kpi-number">
                            {isMunicipalScope
                                ? munRanking.length.toLocaleString('pt-BR')
                                : `${stateSummary.availableStatesCount} de 27 UFs`}
                        </div>
                        <span className="kpi-footnote">
                            {isMunicipalScope
                                ? `Granularidade municipal ativa (${stateUf})`
                                : isMunicipalIndicator
                                    ? 'Indicador com detalhe municipal por UF'
                                    : 'Indicador exclusivamente por UF'}
                        </span>
                    </div>
                </div>
            </section>

            <section className="analytics-second-row">
                <div className="chart-card">
                    <div className="chart-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TrendingUp size={18} color="#e12c2c" />
                            <h3>
                                {isMunicipalScope
                                    ? `Top Municípios de ${selectedStateMeta?.name || stateUf}`
                                    : 'Top Estados (UFs) — Métrica Selecionada'}
                            </h3>
                        </div>
                        <span style={{ fontSize: '12px', color: '#8b92a5' }}>
                            {isPopRate && metricMode === 'rate'
                                ? 'Taxa / 100 mil hab.'
                                : currentIndicator?.unitLabel}
                        </span>
                    </div>

                    <div className="chart-body" style={{ height: 250 }}>
                        {loadingMun ? (
                            <div className="analytics-empty-slot">
                                Carregando base municipal oficial do Sinesp VDE ({selectedYear})...
                            </div>
                        ) : comparativeBarsData.length === 0 ? (
                            <div className="analytics-empty-slot">
                                Dados indisponíveis (null) na fonte oficial para este recorte.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparativeBarsData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" stroke="#8b92a5" fontSize={11} />
                                    <YAxis stroke="#8b92a5" fontSize={11} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1a1c23',
                                            border: '1px solid #2b2f3a',
                                            color: '#fff',
                                        }}
                                        formatter={(value: any) => [
                                            Number(value).toLocaleString('pt-BR', {
                                                maximumFractionDigits: 2,
                                            }),
                                            isPopRate && metricMode === 'rate'
                                                ? 'Taxa / 100 mil hab.'
                                                : currentIndicator?.unitLabel || 'Total',
                                        ]}
                                    />
                                    <Bar dataKey="metricValue" radius={[4, 4, 0, 0]}>
                                        {comparativeBarsData.map((entry) => (
                                            <Cell
                                                key={entry.key}
                                                fill={entry.isHighlighted ? '#ff6b6b' : '#e12c2c'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <BarChart2 size={18} color="#e12c2c" />
                        <h3>
                            Participação entre Indicadores ({currentIndicator?.unitLabel})
                        </h3>
                    </div>

                    <div className="chart-body" style={{ height: 250 }}>
                        {sameUnitBreakdown.length === 0 ? (
                            <div className="analytics-empty-slot">
                                Sem valores disponíveis nesta unidade para o recorte atual.
                            </div>
                        ) : (
                            <div className="analytics-donut-layout">
                                <div style={{ width: '48%', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={sameUnitBreakdown}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={52}
                                                outerRadius={82}
                                                paddingAngle={3}
                                            >
                                                {sameUnitBreakdown.map((entry) => (
                                                    <Cell key={entry.id} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1a1c23',
                                                    border: '1px solid #2b2f3a',
                                                    color: '#fff',
                                                }}
                                                formatter={(value: any, name: any, props: any) => [
                                                    `${Number(value).toLocaleString('pt-BR')} (${props.payload.percentage}%)`,
                                                    name,
                                                ]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="analytics-legend-col">
                                    {sameUnitBreakdown.map((item) => (
                                        <div key={item.id} className="analytics-legend-row">
                                            <span className="legend-left">
                                                <span
                                                    className="legend-dot"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                {item.name}
                                            </span>
                                            <strong>{item.percentage}%</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="analytics-third-row">
                <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                    <div className="chart-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Award size={18} color="#e12c2c" />
                            <h3>
                                {isMunicipalScope
                                    ? `Ranking Municipal Oficial (${stateUf}) — ${currentIndicator?.label}`
                                    : `Ranking Estadual Completo (27 UFs) — ${currentIndicator?.label}`}
                            </h3>
                        </div>

                        {locationRanking.length > 8 && (
                            <button
                                type="button"
                                className="ranking-toggle-btn"
                                onClick={() => setShowAllLocations((prev) => !prev)}
                            >
                                {showAllLocations ? (
                                    <>
                                        Ver menos <ChevronUp size={14} />
                                    </>
                                ) : (
                                    <>
                                        Ver todos ({locationRanking.length}) <ChevronDown size={14} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="ranking-table-list">
                        {displayedRanking.map((item) => (
                            <div
                                key={item.key}
                                className="ranking-row-item"
                                style={{
                                    backgroundColor: item.isHighlighted
                                        ? 'rgba(225, 44, 44, 0.14)'
                                        : undefined,
                                    opacity: item.isUnavailable ? 0.68 : 1,
                                }}
                            >
                                <div className="ranking-row-left">
                                    <span
                                        className={`ranking-pos ${item.rankLabel === '1º' ? 'top' : ''}`}
                                    >
                                        {item.rankLabel}
                                    </span>
                                    <span className="ranking-neigh-name">{item.name}</span>
                                </div>

                                <div className="ranking-row-right">
                                    <strong className="ranking-occ-count">
                                        {item.isUnavailable
                                            ? 'Indisponível (null)'
                                            : `${item.metricValue.toLocaleString('pt-BR', {
                                                maximumFractionDigits: 2,
                                            })}`}
                                    </strong>
                                    <span className="ranking-delta neutral">
                                        {item.isUnavailable
                                            ? 'sem registro oficial'
                                            : isPopRate && metricMode === 'rate'
                                                ? '/ 100 mil hab.'
                                                : currentIndicator?.unitLabel}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <Database size={18} color="#e12c2c" />
                        <h3>Nota Metodológica (Sinesp VDE)</h3>
                    </div>

                    <div
                        style={{
                            padding: '12px 16px',
                            fontSize: '12.5px',
                            lineHeight: 1.6,
                            color: '#a0a7b8',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }}
                    >
                        <p style={{ margin: 0 }}>
                            Os gráficos desta página comparam exclusivamente indicadores da{' '}
                            <strong style={{ color: '#e2e8f0' }}>mesma unidade oficial</strong>{' '}
                            ({currentIndicator?.unitLabel}) no ano-base selecionado ({selectedYear}).
                        </p>
                        <p style={{ margin: 0 }}>
                            Registros indisponíveis (<code>null</code>) na fonte do MJSP são
                            preservados separadamente ao final dos rankings e nunca são
                            convertidos em zero.
                        </p>
                        {stateSummary.unavailableStatesCount > 0 && (
                            <p style={{ margin: 0, color: '#f59e0b' }}>
                                Atenção: neste indicador,{' '}
                                <strong>{stateSummary.unavailableStatesCount} UF(s)</strong>{' '}
                                possuem valor <code>null</code> na base oficial.
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
