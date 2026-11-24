import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Activity,
  Users,
  Award,
} from 'lucide-react';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';
import type {
  OfficialSummaryStats,
  OfficialMunicipalitySummaryStats,
  MetricDisplayMode,
} from '../types/crime';

interface HeaderStatsProps {
  filters: any;
}

export default function HeaderStats({ filters }: HeaderStatsProps) {
  const indicatorId: string = filters.indicatorId || 'homicidio-doloso';
  const metricMode: MetricDisplayMode = filters.metricMode || 'rate';
  const stateUf: string = filters.state || 'all';
  const municipalityCode: string = filters.municipalityCode || 'all';

  const [stateSummary, setStateSummary] = useState<OfficialSummaryStats | null>(null);
  const [munSummary, setMunSummary] = useState<OfficialMunicipalitySummaryStats | null>(
    null
  );

  useEffect(() => {
    const summary = crimeService.getOfficialIndicatorSummary(
      indicatorId,
      stateUf
    );
    setStateSummary(summary);
  }, [stateUf, indicatorId]);

  useEffect(() => {
    let active = true;
    if (stateUf !== 'all' && municipalityCode !== 'all') {
      crimeService
        .getOfficialMunicipalitySummary(municipalityCode, indicatorId, metricMode)
        .then((res) => {
          if (active) setMunSummary(res);
        });
    } else {
      setMunSummary(null);
    }
    return () => {
      active = false;
    };
  }, [stateUf, municipalityCode, indicatorId, metricMode]);

  const nationalRankInfo = useMemo(() => {
    if (stateUf === 'all') return null;
    const ranking = crimeService.getOfficialStateRanking(indicatorId, metricMode);
    const idx = ranking.findIndex((item) => item.uf === stateUf);
    return {
      position: idx >= 0 ? idx + 1 : null,
      total: ranking.length,
    };
  }, [stateUf, indicatorId, metricMode]);

  const formatNumber = (val: number | null | undefined, decimals = 0): string => {
    if (val === null || val === undefined || Number.isNaN(val)) {
      return 'Indisponível';
    }
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const stats = useMemo(() => {
    if (stateUf !== 'all' && municipalityCode !== 'all' && munSummary?.municipality) {
      const mun = munSummary.municipality;
      const ind = munSummary.indicator;
      const isPopRate = munSummary.comparisonMethod === 'population_per_100k';

      return [
        {
          id: 1,
          title: `${ind?.label || 'Indicador'} — ${mun.name} (${mun.uf})`,
          value:
            munSummary.value !== null
              ? `${formatNumber(munSummary.value)} ${munSummary.unitLabel}`
              : 'Indisponível',
          icon: <AlertTriangle size={28} className="icon-red" />,
          highlight: true,
        },
        {
          id: 2,
          title: isPopRate ? 'Taxa municipal / 100 mil hab.' : 'Critério metodológico',
          value: isPopRate
            ? munSummary.ratePer100k !== null
              ? `${formatNumber(munSummary.ratePer100k, 2)}`
              : 'Indisponível'
            : 'Volume absoluto',
          icon: <Activity size={28} className="icon-gray" />,
        },
        {
          id: 3,
          title: 'População municipal (IBGE 2025)',
          value: formatNumber(mun.population),
          icon: <Users size={28} className="icon-gray" />,
        },
        {
          id: 4,
          title: `Posição em ${mun.uf} (${isPopRate && metricMode === 'rate' ? 'taxa' : 'volume'})`,
          value:
            munSummary.stateRankPosition !== null
              ? `${munSummary.stateRankPosition}º de ${munSummary.stateRankedTotalCount}`
              : 'Sem posição',
          icon: <Award size={28} className="icon-green" />,
        },
      ];
    }

    const ind = stateSummary?.indicator;
    const isPopRate = stateSummary?.comparisonMethod === 'population_per_100k';
    const stateMeta =
      stateUf !== 'all'
        ? BRAZIL_STATES.find((s) => s.uf === stateUf)
        : null;
    const scopeLabel = stateMeta ? `${stateMeta.name} (${stateMeta.uf})` : 'Brasil (2025)';
    const decimals = ind?.unit === 'kg' ? 2 : 0;

    return [
      {
        id: 1,
        title: `${ind?.label || 'Indicador'} — ${scopeLabel}`,
        value:
          stateSummary?.totalValue !== null && stateSummary?.totalValue !== undefined
            ? `${formatNumber(stateSummary.totalValue, decimals)} ${stateSummary.unitLabel}`
            : 'Indisponível',
        icon: <AlertTriangle size={28} className="icon-red" />,
        highlight: true,
      },
      {
        id: 2,
        title: isPopRate
          ? stateUf === 'all'
            ? 'Taxa nacional / 100 mil hab.'
            : 'Taxa estadual / 100 mil hab.'
          : 'Unidade oficial (Sinesp VDE)',
        value: isPopRate
          ? stateSummary?.ratePer100k !== null && stateSummary?.ratePer100k !== undefined
            ? formatNumber(stateSummary.ratePer100k, 2)
            : 'Indisponível'
          : ind?.unitLabel || 'Total oficial',
        icon: <Activity size={28} className="icon-gray" />,
      },
      {
        id: 3,
        title:
          stateUf === 'all'
            ? 'População Brasil (IBGE 2025)'
            : `População ${stateUf} (IBGE 2025)`,
        value: formatNumber(stateSummary?.population),
        icon: <Users size={28} className="icon-gray" />,
      },
      {
        id: 4,
        title:
          stateUf === 'all'
            ? 'Cobertura estadual oficial'
            : `Posição nacional (${isPopRate && metricMode === 'rate' ? 'taxa' : 'volume'})`,
        value:
          stateUf === 'all'
            ? `${stateSummary?.availableStatesCount ?? 0} de 27 UFs`
            : nationalRankInfo?.position
              ? `${nationalRankInfo.position}º de ${nationalRankInfo.total} UFs`
              : 'Indisponível',
        icon: <Award size={28} className="icon-green" />,
      },
    ];
  }, [stateUf, municipalityCode, munSummary, stateSummary, nationalRankInfo, metricMode]);

  return (
    <div className="header-stats">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={`stat-card ${stat.highlight ? 'highlighted' : ''}`}
        >
          <div className="stat-icon-wrapper">{stat.icon}</div>
          <div className="stat-info">
            <div className="stat-header">
              <h2>{stat.value}</h2>
            </div>
            <p>{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
