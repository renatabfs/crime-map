export type MetricUnit = 'victims' | 'occurrences' | 'kg';

export type ComparisonMethod =
  | 'population_per_100k'
  | 'alternative_denominator_recommended'
  | 'absolute_only';

export type GeographicGranularity = 'state_and_municipality' | 'state_only';

export type IndicatorCategory =
  | 'letal-violento'
  | 'dignidade-sexual'
  | 'patrimonio'
  | 'drogas-armas-produtividade'
  | 'desaparecidos-localizados'
  | 'transito-outros';

export type MetricDisplayMode = 'rate' | 'absolute';

export interface StatePopulationEntry {
  year: number;
  ibgeCode: string;
  uf: string;
  stateName: string;
  population: number;
  referenceDate: string;
  source: string;
  apiUrl: string;
}

export interface SexBreakdown {
  feminino: number | null;
  masculino: number | null;
  naoInformado: number | null;
}

export interface StateCrimeIndicatorEntry {
  year: number;
  uf: string;
  stateName: string;
  indicatorId: string;
  rawEventName: string;
  label: string;
  category: IndicatorCategory;
  scope: 'Estadual';
  granularity: GeographicGranularity;
  unit: MetricUnit;
  unitLabel: string;
  comparisonMethod: ComparisonMethod;
  value: number | null;
  sexBreakdown: SexBreakdown | null;
  population: number;
  ratePer100k: number | null;
  source: string;
}

export interface IndicatorCatalogMetadata {
  id: string;
  rawEventName: string;
  label: string;
  category: IndicatorCategory;
  unit: MetricUnit;
  unitLabel: string;
  scope: 'Estadual';
  granularity: GeographicGranularity;
  comparisonMethod: ComparisonMethod;
}

export interface OfficialIndicatorFilters {
  year?: number;
  state?: string;
  indicatorId?: string;
  category?: IndicatorCategory | 'all';
}

export interface OfficialSummaryStats {
  indicator: IndicatorCatalogMetadata | null;
  year: number;
  selectedUf: string;
  totalValue: number | null;
  population: number | null;
  ratePer100k: number | null;
  unit: MetricUnit | null;
  unitLabel: string;
  comparisonMethod: ComparisonMethod | null;
  availableStatesCount: number;
  unavailableStatesCount: number;
}

export interface MunicipalityPopulationEntry {
  ibgeCode: string;
  uf: string;
  name: string;
  population: number;
}

export interface MunicipalityCrimeIndicatorEntry {
  ibgeCode: string;
  uf: string;
  indicatorId: string;
  value: number | null;
  ratePer100k: number | null;
}

export interface EnrichedMunicipalityIndicator extends MunicipalityCrimeIndicatorEntry {
  municipalityName: string;
  population: number;
  unit: MetricUnit;
  unitLabel: string;
  comparisonMethod: ComparisonMethod;
}

export interface MunicipalityRankingItem {
  ibgeCode: string;
  uf: string;
  municipalityName: string;
  value: number;
  ratePer100k: number | null;
  population: number;
  metricValue: number;
  unitLabel: string;
  effectiveMode: MetricDisplayMode;
}

export interface OfficialMunicipalitySummaryStats {
  indicator: IndicatorCatalogMetadata | null;
  municipality: MunicipalityPopulationEntry | null;
  value: number | null;
  ratePer100k: number | null;
  unit: MetricUnit | null;
  unitLabel: string;
  comparisonMethod: ComparisonMethod | null;
  stateRankPosition: number | null;
  stateRankedTotalCount: number;
}