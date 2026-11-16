import { useState, useMemo } from 'react';
import {
    ShieldAlert,
    TrendingUp,
    MapPin,
    BarChart2,
    Clock,
    Award,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
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
import { crimeData } from '../data/mockData';

interface AnalyticsPageProps {
    filters: {
        city: string;
        neighborhood?: string;
        period: string;
        crimeType: string;
    };
}

export default function AnalyticsPage({ filters }: AnalyticsPageProps) {
    const [evolutionRange, setEvolutionRange] = useState<'6m' | '12m' | '24m' | '5y'>('12m');
    const [showAllNeighborhoods, setShowAllNeighborhoods] = useState(false);

    const referenceDate = useMemo(() => {
        if (crimeData.length === 0) return new Date();
        return new Date(Math.max(...crimeData.map((r) => new Date(r.date).getTime())));
    }, []);

    const classifyRecordPeriod = (recDate: Date, periodKey: string): 'current' | 'previous' | 'outside' => {
        if (isNaN(recDate.getTime())) return 'outside';

        if (/^\d{4}$/.test(periodKey)) {
            const targetYear = Number(periodKey);
            const recYear = recDate.getFullYear();
            if (recYear === targetYear) return 'current';
            if (recYear === targetYear - 1) return 'previous';
            return 'outside';
        }

        const periodDaysMap: Record<string, number> = {
            '30-days': 30,
            '6-months': 183,
            '1-year': 365,
            '5-years': 1826,
        };

        const windowDays = periodDaysMap[periodKey] ?? 1826;
        const diffDays = (referenceDate.getTime() - recDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays >= 0 && diffDays <= windowDays) return 'current';
        if (diffDays > windowDays && diffDays <= windowDays * 2) return 'previous';
        return 'outside';
    };

    const scopeRecords = useMemo(() => {
        return crimeData.filter((record) => {
            if (
                filters.city &&
                filters.city !== 'all' &&
                record.city.toLowerCase() !== filters.city.toLowerCase()
            ) {
                return false;
            }

            if (
                filters.neighborhood &&
                filters.neighborhood !== 'all' &&
                record.neighborhood.toLowerCase() !== filters.neighborhood.toLowerCase()
            ) {
                return false;
            }

            if (
                filters.crimeType &&
                filters.crimeType !== 'all' &&
                record.type.toLowerCase() !== filters.crimeType.toLowerCase()
            ) {
                return false;
            }

            return true;
        });
    }, [filters.city, filters.neighborhood, filters.crimeType]);

    const { currentRecords, previousRecords } = useMemo(() => {
        const current: typeof crimeData = [];
        const previous: typeof crimeData = [];

        scopeRecords.forEach((rec) => {
            const bucket = classifyRecordPeriod(new Date(rec.date), filters.period);
            if (bucket === 'current') current.push(rec);
            else if (bucket === 'previous') previous.push(rec);
        });

        return { currentRecords: current, previousRecords: previous };
    }, [scopeRecords, filters.period, referenceDate]);

    const kpiStats = useMemo(() => {
        const totalCurrent = currentRecords.length;
        const totalPrevious = previousRecords.length;

        let variationPct: number | null = null;
        if (totalPrevious > 0) {
            variationPct = Number((((totalCurrent - totalPrevious) / totalPrevious) * 100).toFixed(1));
        }

        const uniqueNeighborhoods = new Set(currentRecords.map((r) => r.neighborhood)).size;

        const periodLabelMap: Record<string, string> = {
            '30-days': 'Últimos 30 dias',
            '6-months': 'Últimos 6 meses',
            '1-year': 'Último ano',
            '5-years': 'Últimos 5 anos',
            '2026': 'Ano de 2026',
            '2025': 'Ano de 2025',
            '2024': 'Ano de 2024',
        };

        return {
            totalCurrent,
            totalPrevious,
            variationPct,
            uniqueNeighborhoods,
            periodLabel: periodLabelMap[filters.period] || filters.period,
        };
    }, [currentRecords, previousRecords, filters.period]);

    const evolutionSeries = useMemo(() => {
        const monthsLimitMap: Record<'6m' | '12m' | '24m' | '5y', number> = {
            '6m': 6,
            '12m': 12,
            '24m': 24,
            '5y': 60,
        };
        const maxMonths = monthsLimitMap[evolutionRange];
        const cutoffDate = new Date(referenceDate);
        cutoffDate.setMonth(cutoffDate.getMonth() - maxMonths);

        const monthNames = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
        ];

        const grouped: Record<string, { label: string; sortKey: string; count: number }> = {};

        scopeRecords.forEach((r) => {
            const d = new Date(r.date);
            if (isNaN(d.getTime()) || d < cutoffDate) return;

            if (/^\d{4}$/.test(filters.period) && d.getFullYear().toString() !== filters.period) {
                return;
            }

            const year = d.getFullYear();
            const month = d.getMonth();
            const key =
                evolutionRange === '5y'
                    ? `${year}`
                    : `${year}-${String(month + 1).padStart(2, '0')}`;
            const label =
                evolutionRange === '5y'
                    ? `${year}`
                    : `${monthNames[month]}/${String(year).slice(-2)}`;

            if (!grouped[key]) grouped[key] = { label, sortKey: key, count: 0 };
            grouped[key].count += 1;
        });

        return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [scopeRecords, evolutionRange, referenceDate, filters.period]);

    const categoryDistribution = useMemo(() => {
        const total = currentRecords.length;
        if (total === 0) return [];

        const counts: Record<string, number> = {};
        currentRecords.forEach((r) => {
            counts[r.type] = (counts[r.type] || 0) + 1;
        });

        const palette = ['#e12c2c', '#ff5c5c', '#ff8a8a', '#9ca3af', '#4b5563'];

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count], idx) => ({
                name,
                count,
                percentage: Number(((count / total) * 100).toFixed(1)),
                color: palette[idx % palette.length],
            }));
    }, [currentRecords]);

    const neighborhoodStats = useMemo(() => {
        const currMap: Record<string, number> = {};
        const prevMap: Record<string, number> = {};

        currentRecords.forEach((r) => {
            currMap[r.neighborhood] = (currMap[r.neighborhood] || 0) + 1;
        });
        previousRecords.forEach((r) => {
            prevMap[r.neighborhood] = (prevMap[r.neighborhood] || 0) + 1;
        });

        const allNames = Array.from(new Set([...Object.keys(currMap), ...Object.keys(prevMap)]));

        return allNames
            .map((name) => {
                const currentCount = currMap[name] || 0;
                const previousCount = prevMap[name] || 0;
                let changePct: number | null = null;
                if (previousCount > 0) {
                    changePct = Number((((currentCount - previousCount) / previousCount) * 100).toFixed(1));
                }
                return {
                    name,
                    atual: currentCount,
                    anterior: previousCount,
                    changePct,
                };
            })
            .filter((item) => item.atual > 0 || item.anterior > 0)
            .sort((a, b) => b.atual - a.atual);
    }, [currentRecords, previousRecords]);

    const displayedRanking = showAllNeighborhoods
        ? neighborhoodStats
        : neighborhoodStats.slice(0, 5);

    const comparativeBarsData = useMemo(
        () => neighborhoodStats.slice(0, 6),
        [neighborhoodStats]
    );

    const hourlyDistribution = useMemo(() => {
        const buckets = Array.from({ length: 12 }, (_, idx) => {
            const startHour = idx * 2;
            const endHour = startHour + 2;
            return {
                slot: `${String(startHour).padStart(2, '0')}h`,
                rangeLabel: `${String(startHour).padStart(2, '0')}:00 – ${String(endHour).padStart(2, '0')}:00`,
                count: 0,
            };
        });

        let validTimeRecords = 0;

        currentRecords.forEach((r) => {
            if (!r.date || !r.date.includes('T')) return;
            const d = new Date(r.date);
            if (isNaN(d.getTime())) return;
            const hour = d.getHours();
            const bucketIdx = Math.floor(hour / 2);
            if (buckets[bucketIdx]) {
                buckets[bucketIdx].count += 1;
                validTimeRecords += 1;
            }
        });

        const maxCount = Math.max(...buckets.map((b) => b.count), 0);

        return {
            buckets,
            hasEnoughData: validTimeRecords > 0,
            maxCount,
        };
    }, [currentRecords]);

    return (
        <div className="analytics-page">
            <section className="about-banner">
                <div className="about-banner-overlay" />
                <div className="about-banner-arc" />
                <div className="about-banner-content">
                    <div className="about-red-bar" />
                    <h1>
                        Análises <span>Criminais</span>
                    </h1>
                    <p className="about-slogan">
                        Explore os dados, descubra padrões e tome decisões com base em informações reais.
                    </p>
                </div>
            </section>

            <section className="analytics-three-kpis">
                <div className="analytics-kpi-card">
                    <div className="kpi-icon-wrap">
                        <ShieldAlert size={22} color="#e12c2c" />
                    </div>
                    <div className="kpi-content-col">
                        <span className="kpi-title">Total de ocorrências</span>
                        <div className="kpi-number">{kpiStats.totalCurrent}</div>
                        <span className="kpi-footnote">
                            {kpiStats.variationPct !== null
                                ? `${kpiStats.variationPct > 0 ? '+' : ''}${kpiStats.variationPct}% vs. período anterior`
                                : 'Sem base anterior para variação'}
                        </span>
                    </div>
                </div>

                <div className="analytics-kpi-card">
                    <div className="kpi-icon-wrap">
                        <TrendingUp size={22} color="#e12c2c" />
                    </div>
                    <div className="kpi-content-col">
                        <span className="kpi-title">Variação no período</span>
                        <div
                            className="kpi-number"
                            style={{
                                color:
                                    kpiStats.variationPct === null
                                        ? 'var(--text-main)'
                                        : kpiStats.variationPct > 0
                                            ? 'var(--accent-red)'
                                            : '#4ade80',
                            }}
                        >
                            {kpiStats.variationPct !== null
                                ? `${kpiStats.variationPct > 0 ? '+' : ''}${kpiStats.variationPct}%`
                                : 'Indisponível'}
                        </div>
                        <span className="kpi-footnote">{kpiStats.periodLabel}</span>
                    </div>
                </div>

                <div className="analytics-kpi-card">
                    <div className="kpi-icon-wrap">
                        <MapPin size={22} color="#e12c2c" />
                    </div>
                    <div className="kpi-content-col">
                        <span className="kpi-title">Bairros analisados</span>
                        <div className="kpi-number">{kpiStats.uniqueNeighborhoods}</div>
                        <span className="kpi-footnote">
                            {filters.city === 'all' ? 'Todas as cidades' : filters.city}
                        </span>
                    </div>
                </div>
            </section>

            <section className="analytics-second-row">
                <div className="chart-card">
                    <div className="chart-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TrendingUp size={18} color="#e12c2c" />
                            <h3>Evolução das Ocorrências</h3>
                        </div>

                        <div className="granularity-switch">
                            {[
                                { id: '6m', label: '6 meses' },
                                { id: '12m', label: '12 meses' },
                                { id: '24m', label: '24 meses' },
                                { id: '5y', label: '5 anos' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={evolutionRange === opt.id ? 'active' : ''}
                                    onClick={() => setEvolutionRange(opt.id as '6m' | '12m' | '24m' | '5y')}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="chart-body" style={{ height: 250 }}>
                        {evolutionSeries.length === 0 ? (
                            <div className="analytics-empty-slot">
                                Não há registros suficientes no intervalo selecionado para exibir a evolução.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={evolutionSeries}>
                                    <defs>
                                        <linearGradient id="analyticsRedFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e12c2c" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#e12c2c" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="label" stroke="#8b92a5" fontSize={12} />
                                    <YAxis allowDecimals={false} stroke="#8b92a5" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1a1c23',
                                            border: '1px solid #2b2f3a',
                                            color: '#fff',
                                        }}
                                        formatter={(value: any) => [`${value} ocorrências`, 'Registros']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#e12c2c"
                                        strokeWidth={2.5}
                                        fill="url(#analyticsRedFill)"
                                        dot={{ r: 4, fill: '#e12c2c', strokeWidth: 2, stroke: '#121318' }}
                                        activeDot={{ r: 6, fill: '#ff4d4d' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <BarChart2 size={18} color="#e12c2c" />
                        <h3>Distribuição por Tipo de Ocorrência</h3>
                    </div>

                    <div className="chart-body" style={{ height: 250 }}>
                        {categoryDistribution.length === 0 ? (
                            <div className="analytics-empty-slot">
                                Sem ocorrências registradas para os filtros atuais.
                            </div>
                        ) : (
                            <div className="analytics-donut-layout">
                                <div style={{ width: '50%', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryDistribution}
                                                dataKey="count"
                                                nameKey="name"
                                                innerRadius={52}
                                                outerRadius={82}
                                                paddingAngle={3}
                                            >
                                                {categoryDistribution.map((entry, idx) => (
                                                    <Cell key={idx} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1a1c23',
                                                    border: '1px solid #2b2f3a',
                                                    color: '#fff',
                                                }}
                                                formatter={(value: any, name: any, props: any) => [
                                                    `${value} (${props.payload.percentage}%)`,
                                                    name,
                                                ]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="analytics-legend-col">
                                    {categoryDistribution.map((item) => (
                                        <div key={item.name} className="analytics-legend-row">
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
                <div className="chart-card">
                    <div className="chart-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Award size={18} color="#e12c2c" />
                            <h3>Ranking dos Bairros</h3>
                        </div>

                        {neighborhoodStats.length > 5 && (
                            <button
                                type="button"
                                className="ranking-toggle-btn"
                                onClick={() => setShowAllNeighborhoods((prev) => !prev)}
                            >
                                {showAllNeighborhoods ? (
                                    <>
                                        Ver menos <ChevronUp size={14} />
                                    </>
                                ) : (
                                    <>
                                        Ver todos ({neighborhoodStats.length}) <ChevronDown size={14} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="ranking-table-list">
                        {displayedRanking.length === 0 ? (
                            <div className="analytics-empty-slot">
                                Nenhum bairro encontrado para os filtros aplicados.
                            </div>
                        ) : (
                            displayedRanking.map((item, idx) => (
                                <div key={item.name} className="ranking-row-item">
                                    <div className="ranking-row-left">
                                        <span className={`ranking-pos ${idx === 0 ? 'top' : ''}`}>
                                            {idx + 1}º
                                        </span>
                                        <span className="ranking-neigh-name">{item.name}</span>
                                    </div>

                                    <div className="ranking-row-right">
                                        <strong className="ranking-occ-count">{item.atual}</strong>
                                        <span
                                            className={`ranking-delta ${item.changePct === null
                                                ? 'neutral'
                                                : item.changePct > 0
                                                    ? 'up'
                                                    : 'down'
                                                }`}
                                        >
                                            {item.changePct !== null
                                                ? `${item.changePct > 0 ? '+' : ''}${item.changePct}%`
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <BarChart2 size={18} color="#e12c2c" />
                            <h3>Comparativo entre Bairros</h3>
                        </div>

                        <div className="comp-legend-inline">
                            <span>
                                <i style={{ backgroundColor: '#6b7280' }} /> Anterior
                            </span>
                            <span>
                                <i style={{ backgroundColor: '#e12c2c' }} /> Atual
                            </span>
                        </div>
                    </div>

                    <div className="chart-body" style={{ height: 230 }}>
                        {comparativeBarsData.length === 0 ? (
                            <div className="analytics-empty-slot">
                                Sem dados suficientes para comparar bairros.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparativeBarsData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" stroke="#8b92a5" fontSize={11} />
                                    <YAxis allowDecimals={false} stroke="#8b92a5" fontSize={11} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1a1c23',
                                            border: '1px solid #2b2f3a',
                                            color: '#fff',
                                        }}
                                    />
                                    <Bar
                                        dataKey="anterior"
                                        name="Período anterior"
                                        fill="#6b7280"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="atual"
                                        name="Período atual"
                                        fill="#e12c2c"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <Clock size={18} color="#e12c2c" />
                        <h3>Distribuição por Horário</h3>
                    </div>

                    <div className="chart-body" style={{ height: 230 }}>
                        {!hourlyDistribution.hasEnoughData ? (
                            <div className="analytics-empty-slot">
                                Informações de horário insuficientes para os filtros selecionados.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyDistribution.buckets}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="slot" stroke="#8b92a5" fontSize={11} />
                                    <YAxis allowDecimals={false} stroke="#8b92a5" fontSize={11} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1a1c23',
                                            border: '1px solid #2b2f3a',
                                            color: '#fff',
                                        }}
                                        labelFormatter={(_, payload) =>
                                            payload?.[0]?.payload?.rangeLabel || ''
                                        }
                                        formatter={(value: any) => [`${value} ocorrências`, 'Registros']}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {hourlyDistribution.buckets.map((entry, idx) => (
                                            <Cell
                                                key={idx}
                                                fill={
                                                    entry.count > 0 && entry.count === hourlyDistribution.maxCount
                                                        ? '#ff4d4d'
                                                        : '#991b1b'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}