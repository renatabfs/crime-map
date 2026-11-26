import { useState, useEffect, useMemo } from 'react';
import { Table, ArrowRight } from 'lucide-react';
import { crimeService, BRAZIL_STATES } from '../services/crimeService';
import type { MunicipalityRankingItem, MetricDisplayMode } from '../types/crime';

interface RecentOccurrencesProps {
  filters: any;
  searchQuery?: string;
  onSelectOccurrence?: (occurrence: any) => void;
  onViewAll?: () => void;
}

interface ComparativeTableRow {
  key: string;
  rank: string;
  location: string;
  totalLabel: string;
  rateLabel: string;
  populationLabel: string;
  isHighlighted: boolean;
  isUnavailable: boolean;
}

export default function RecentOccurrences({ filters, searchQuery = '',
  onViewAll, }: RecentOccurrencesProps) {
  const indicatorId: string = filters.indicatorId || 'homicidio-doloso';
  const metricMode: MetricDisplayMode = filters.metricMode || 'rate';
  const stateUf: string = filters.state || 'all';
  const municipalityCode: string = filters.municipalityCode || 'all';

  const [munRows, setMunRows] = useState<MunicipalityRankingItem[]>([]);
  const [loadingMun, setLoadingMun] = useState(false);

  const catalog = useMemo(() => crimeService.getOfficialIndicatorsCatalog(), []);
  const currentIndicator = useMemo(
    () => catalog.find((c) => c.id === indicatorId) ?? catalog[0],
    [catalog, indicatorId]
  );

  const isStateAll = !stateUf || stateUf === 'all';
  const isMunicipalScope =
    !isStateAll && currentIndicator?.granularity === 'state_and_municipality';

  useEffect(() => {
    let active = true;
    if (isMunicipalScope) {
      setLoadingMun(true);
      crimeService
        .getOfficialMunicipalityRanking(stateUf, indicatorId, metricMode)
        .then((list) => {
          if (active) {
            setMunRows(list);
            setLoadingMun(false);
          }
        });
    } else {
      setMunRows([]);
      setLoadingMun(false);
    }
    return () => {
      active = false;
    };
  }, [isMunicipalScope, stateUf, indicatorId, metricMode]);

  const { sectionTitle, locationHeader, tableRows } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const decimals = currentIndicator?.unit === 'kg' ? 2 : 0;

    // CENÁRIO B: state !== 'all' + granularity === 'state_and_municipality'
    if (isMunicipalScope) {
      const stateMeta = BRAZIL_STATES.find((s) => s.uf === stateUf);
      const rankedMun = munRows.map((item, idx) => ({
        ...item,
        officialRank: idx + 1,
      }));

      const filteredMun = !query
        ? rankedMun
        : rankedMun.filter(
          (item) =>
            item.municipalityName.toLowerCase().includes(query) ||
            item.ibgeCode.includes(query)
        );

      const rows: ComparativeTableRow[] = filteredMun.map((item) => ({
        key: item.ibgeCode,
        rank: `${item.officialRank}º`,
        location: `${item.municipalityName} (${item.uf}) — IBGE ${item.ibgeCode}`,
        totalLabel: `${item.value.toLocaleString('pt-BR')} ${currentIndicator?.unitLabel || ''}`,
        rateLabel:
          item.ratePer100k !== null
            ? `${item.ratePer100k.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} / 100 mil`
            : 'Volume absoluto',
        populationLabel: `${item.population.toLocaleString('pt-BR')} hab.`,
        isHighlighted:
          municipalityCode !== 'all' && item.ibgeCode === municipalityCode,
        isUnavailable: false,
      }));

      return {
        sectionTitle: `Ranking Municipal Oficial (${stateMeta?.name || stateUf}) — ${currentIndicator?.label}`,
        locationHeader: 'Município (IBGE)',
        tableRows: rows,
      };
    }

    // Constrói as 27 UFs separando registros válidos (ordenados) de registros null (ao final)
    const validRankedStates = crimeService.getOfficialStateRanking(
      indicatorId,
      metricMode
    );
    const validByUf = new Map(
      validRankedStates.map((item, idx) => [item.uf, { ...item, officialRank: idx + 1 }])
    );

    const validRows: ComparativeTableRow[] = validRankedStates.map((item, idx) => ({
      key: item.uf,
      rank: `${idx + 1}º`,
      location: `${item.stateName} (${item.uf})`,
      totalLabel: `${item.value.toLocaleString('pt-BR', {
        maximumFractionDigits: decimals,
      })} ${currentIndicator?.unitLabel || ''}`,
      rateLabel:
        item.ratePer100k !== null
          ? `${item.ratePer100k.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} / 100 mil`
          : 'Volume absoluto',
      populationLabel: `${item.population.toLocaleString('pt-BR')} hab.`,
      isHighlighted: !isStateAll && item.uf === stateUf,
      isUnavailable: false,
    }));

    const nullRows: ComparativeTableRow[] = BRAZIL_STATES.filter(
      (st) => !validByUf.has(st.uf)
    ).map((st) => {
      const summary = crimeService.getOfficialIndicatorSummary(indicatorId, st.uf);
      return {
        key: st.uf,
        rank: '—',
        location: `${st.name} (${st.uf})`,
        totalLabel: 'Indisponível (null)',
        rateLabel: 'Indisponível (null)',
        populationLabel: summary.population !== null
          ? `${summary.population.toLocaleString('pt-BR')} hab.`
          : 'Indisponível (null)',
        isHighlighted: !isStateAll && st.uf === stateUf,
        isUnavailable: true,
      };
    });

    const all27Rows = [...validRows, ...nullRows];

    // CENÁRIO C: state !== 'all' + granularity === 'state_only' (mostra somente a UF selecionada)
    if (!isStateAll) {
      const selectedUfMeta = BRAZIL_STATES.find((s) => s.uf === stateUf);
      const singleRow = all27Rows.filter((r) => r.key === stateUf);

      return {
        sectionTitle: `Detalhamento Estadual Oficial (${selectedUfMeta?.name || stateUf}) — ${currentIndicator?.label}`,
        locationHeader: 'Unidade Federativa',
        tableRows: singleRow,
      };
    }

    const filtered27 = !query
      ? all27Rows
      : all27Rows.filter((r) => r.location.toLowerCase().includes(query));

    return {
      sectionTitle: `Ranking Estadual Oficial (27 UFs — 2025) — ${currentIndicator?.label}`,
      locationHeader: 'Unidade Federativa',
      tableRows: filtered27,
    };
  }, [
    isMunicipalScope,
    isStateAll,
    stateUf,
    municipalityCode,
    munRows,
    searchQuery,
    indicatorId,
    metricMode,
    currentIndicator,
  ]);

  return (
    <div className="recent-card">
      <div className="recent-header">
        <div className="recent-title">
          <Table size={20} color="#e12c2c" />
          <h3>{sectionTitle}</h3>
        </div>
        {onViewAll && (
          <button
            type="button"
            className="view-all"
            onClick={onViewAll}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Explorar base <ArrowRight size={16} />
          </button>
        )}
      </div>

      <div className="table-container">
        {loadingMun ? (
          <div style={{ padding: '16px', color: '#8b92a5', fontSize: '13px' }}>
            Carregando registros municipais oficiais (Sinesp VDE 2025)...
          </div>
        ) : tableRows.length === 0 ? (
          <div style={{ padding: '16px', color: '#8b92a5', fontSize: '13px' }}>
            Nenhum registro encontrado para o filtro aplicado.
          </div>
        ) : (
          <table className="recent-table">
            <thead>
              <tr style={{ color: '#8b92a5', fontSize: '12px', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Posição</th>
                <th style={{ padding: '8px 12px' }}>{locationHeader}</th>
                <th style={{ padding: '8px 12px' }}>Total Oficial (2025)</th>
                <th style={{ padding: '8px 12px' }}>Taxa / 100 mil hab.</th>
                <th style={{ padding: '8px 12px' }}>População IBGE 2025</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr
                  key={row.key}
                  style={{
                    backgroundColor: row.isHighlighted
                      ? 'rgba(225, 44, 44, 0.14)'
                      : undefined,
                    opacity: row.isUnavailable ? 0.72 : 1,
                  }}
                >
                  <td>
                    <span
                      className="status-dot"
                      style={{
                        backgroundColor: row.isUnavailable ? '#64748b' : undefined,
                      }}
                    ></span>
                    {row.rank}
                  </td>
                  <td style={{ fontWeight: row.isHighlighted ? 700 : 500 }}>
                    {row.location}
                  </td>
                  <td style={{ color: row.isUnavailable ? '#94a3b8' : undefined }}>
                    {row.totalLabel}
                  </td>
                  <td style={{ color: row.isUnavailable ? '#94a3b8' : undefined }}>
                    {row.rateLabel}
                  </td>
                  <td>{row.populationLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}