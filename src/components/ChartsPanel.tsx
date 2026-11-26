import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2, Layers, Database } from 'lucide-react';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';
import type { MunicipalityRankingItem, MetricDisplayMode } from '../types/crime';

interface ChartsPanelProps {
    filters: any;
}

export default function ChartsPanel({ filters }: ChartsPanelProps) {
    const indicatorId: string = filters.indicatorId || 'homicidio-doloso';
    const metricMode: MetricDisplayMode = filters.metricMode || 'rate';
    const stateUf: string = filters.state || 'all';
    const municipalityCode: string = filters.municipalityCode || 'all';

    const [munRanking, setMunRanking] = useState<MunicipalityRankingItem[]>([]);
    const [loadingMun, setLoadingMun] = useState(false);

    const catalog = useMemo(() => crimeService.getOfficialIndicatorsCatalog(), []);
    const currentIndicator = useMemo(
        () => catalog.find((c) => c.id === indicatorId) ?? catalog[0],
        [catalog, indicatorId]
    );

    const isMunicipalIndicator =
        currentIndicator?.granularity === 'state_and_municipality';

    useEffect(() => {
        let active = true;
        if (stateUf !== 'all' && isMunicipalIndicator) {
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
    }, [stateUf, isMunicipalIndicator, indicatorId, metricMode]);

    const { geoRankingTitle, geoRankingSubtitle, geoRankingData } = useMemo(() => {
        const effectiveMode: MetricDisplayMode =
            currentIndicator?.comparisonMethod === 'population_per_100k'
                ? metricMode
                : 'absolute';

        const metricSuffix =
            effectiveMode === 'rate'
                ? 'por 100 mil hab.'
                : currentIndicator?.unitLabel || 'total';

        if (stateUf !== 'all' && isMunicipalIndicator) {
            const stateMeta = BRAZIL_STATES.find((s) => s.uf === stateUf);
            const topMun = munRanking.slice(0, 8).map((item) => ({
                name: item.municipalityName,
                value: item.metricValue,
                isHighlighted: municipalityCode !== 'all' && item.ibgeCode === municipalityCode,
            }));

            if (municipalityCode !== 'all' && !topMun.some((m) => m.isHighlighted)) {
                const selectedItem = munRanking.find((m) => m.ibgeCode === municipalityCode);
                if (selectedItem) {
                    topMun.push({
                        name: selectedItem.municipalityName,
                        value: selectedItem.metricValue,
                        isHighlighted: true,
                    });
                }
            }

            return {
                geoRankingTitle: `Municípios de ${stateMeta?.name || stateUf} — ${currentIndicator.label}`,
                geoRankingSubtitle: `Métrica: ${metricSuffix} (2025)`,
                geoRankingData: topMun,
            };
        }

        const stateRanking = crimeService.getOfficialStateRanking(indicatorId, metricMode);
        const topStates = stateRanking.slice(0, 8).map((st) => ({
            name: `${st.stateName} (${st.uf})`,
            value: st.metricValue,
            isHighlighted: stateUf !== 'all' && st.uf === stateUf,
        }));

        if (stateUf !== 'all' && !topStates.some((s) => s.isHighlighted)) {
            const selectedSt = stateRanking.find((s) => s.uf === stateUf);
            if (selectedSt) {
                topStates.push({
                    name: `${selectedSt.stateName} (${selectedSt.uf})`,
                    value: selectedSt.metricValue,
                    isHighlighted: true,
                });
            }
        }

        return {
            geoRankingTitle:
                stateUf !== 'all' && !isMunicipalIndicator
                    ? 'Comparativo Nacional (Indicador exclusivamente por UF)'
                    : `Estados (UFs) — ${currentIndicator?.label || 'Indicador'}`,
            geoRankingSubtitle: `Métrica: ${metricSuffix} (2025)`,
            geoRankingData: topStates,
        };
    }, [
        stateUf,
        municipalityCode,
        isMunicipalIndicator,
        munRanking,
        currentIndicator,
        indicatorId,
        metricMode,
    ]);

    const compatibleIndicatorsData = useMemo(() => {
        if (!currentIndicator) return [];
        const sameUnitIndicators = catalog.filter(
            (c) => c.unit === currentIndicator.unit
        );

        const sorted = sameUnitIndicators
            .map((ind) => {
                const summary = crimeService.getOfficialIndicatorSummary(
                    ind.id,
                    stateUf
                );
                return {
                    id: ind.id,
                    name: ind.label,
                    value: summary.totalValue ?? 0,
                    isAvailable: summary.totalValue !== null,
                    isSelected: ind.id === currentIndicator.id,
                };
            })
            .filter((r) => r.isAvailable && r.value > 0)
            .sort((a, b) => b.value - a.value);

        const top6 = sorted.slice(0, 6);
        if (!top6.some((item) => item.isSelected)) {
            const selectedItem = sorted.find((item) => item.isSelected);
            if (selectedItem) {
                top6.push(selectedItem);
            }
        }
        return top6;
    }, [catalog, currentIndicator, stateUf]);

    const summaryInfo = useMemo(
        () =>
            crimeService.getOfficialIndicatorSummary(
                indicatorId,
                stateUf
            ),
        [stateUf, indicatorId]
    );
    return (
        <div className="charts-column">
            <div className="chart-card">
                <div className="chart-header">
                    <BarChart2 size={18} color="#e12c2c" />
                    <div>
                        <h3>{geoRankingTitle}</h3>
                        <span style={{ fontSize: '11px', color: '#8b92a5' }}>
                            {geoRankingSubtitle}
                        </span>
                    </div>
                </div>
                <div className="chart-body" style={{ minHeight: '220px' }}>
                    {loadingMun ? (
                        <div style={{ padding: '24px', color: '#8b92a5', fontSize: '13px' }}>
                            Carregando base municipal oficial do Sinesp VDE...
                        </div>
                    ) : geoRankingData.length === 0 ? (
                        <div style={{ padding: '24px', color: '#8b92a5', fontSize: '13px' }}>
                            Dados indisponíveis (null) na fonte oficial para este recorte.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={geoRankingData}
                                layout="vertical"
                                margin={{ top: 4, right: 24, left: 10, bottom: 4 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={130}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8b92a5', fontSize: 11 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: '#1a1c23',
                                        border: '1px solid #2a2d37',
                                        color: '#fff',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: any) => [
                                        Number(value).toLocaleString('pt-BR', {
                                            maximumFractionDigits: 2,
                                        }),
                                        currentIndicator?.comparisonMethod === 'population_per_100k' &&
                                            metricMode === 'rate'
                                            ? 'Taxa / 100 mil hab.'
                                            : currentIndicator?.unitLabel || 'Total',
                                    ]}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={13}>
                                    {geoRankingData.map((entry, idx) => (
                                        <Cell
                                            key={`geo-${idx}`}
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
                    <Layers size={18} color="#e12c2c" />
                    <div>
                        <h3>
                            Indicadores na mesma unidade ({currentIndicator?.unitLabel})
                        </h3>
                        <span style={{ fontSize: '11px', color: '#8b92a5' }}>
                            {stateUf === 'all'
                                ? 'Consolidado Nacional (2025)'
                                : `Recorte Estadual: ${stateUf} (2025)`}
                        </span>
                    </div>
                </div>
                <div className="chart-body" style={{ minHeight: '190px' }}>
                    {compatibleIndicatorsData.length === 0 ? (
                        <div style={{ padding: '24px', color: '#8b92a5', fontSize: '13px' }}>
                            Sem valores disponíveis nesta unidade para a UF selecionada.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={190}>
                            <BarChart
                                data={compatibleIndicatorsData}
                                layout="vertical"
                                margin={{ top: 4, right: 24, left: 10, bottom: 4 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={145}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8b92a5', fontSize: 11 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: '#1a1c23',
                                        border: '1px solid #2a2d37',
                                        color: '#fff',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: any) => [
                                        `${Number(value).toLocaleString('pt-BR')} ${currentIndicator?.unitLabel || ''}`,
                                        'Total oficial',
                                    ]}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                    {compatibleIndicatorsData.map((entry, idx) => (
                                        <Cell
                                            key={`comp-${idx}`}
                                            fill={entry.isSelected ? '#e12c2c' : '#525866'}
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
                    <Database size={18} color="#e12c2c" />
                    <h3>Cobertura e Metodologia Oficial (2025)</h3>
                </div>
                <div
                    style={{
                        padding: '12px 16px',
                        fontSize: '12.5px',
                        lineHeight: 1.55,
                        color: '#a0a7b8',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                    }}
                >
                    <div>
                        <strong style={{ color: '#e2e8f0' }}>Fonte criminal:</strong>{' '}
                        MJSP / Sinesp VDE (<code>BancoVDE 2025.xlsx</code>, abrangência Estadual).
                    </div>
                    <div>
                        <strong style={{ color: '#e2e8f0' }}>Fonte demográfica:</strong>{' '}
                        IBGE — Estimativas Populacionais 2025 (Tabela 6579, Variável 9324).
                    </div>
                    <div>
                        <strong style={{ color: '#e2e8f0' }}>Granularidade deste indicador:</strong>{' '}
                        {isMunicipalIndicator
                            ? 'Estadual (27 UFs) e Municipal (5.571 municípios IBGE).'
                            : 'Exclusivamente Estadual (27 UFs) na base oficial.'}
                    </div>
                    {summaryInfo.unavailableStatesCount > 0 && (
                        <div style={{ color: '#f59e0b' }}>
                            Nota: {summaryInfo.unavailableStatesCount} UF(s) possuem dado indisponível (<code>null</code>) na fonte oficial e não são contabilizadas como zero.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}