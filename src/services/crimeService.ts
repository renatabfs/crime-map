import { crimeData, citiesMetadata } from '../data/mockData';
import type { CrimeRecord as BaseCrimeRecord, CityMetadata } from '../data/mockData';
import rawStateIndicators from '../data/stateIndicators.json';
import rawStatePopulation from '../data/statePopulation.json';
import type {
  StateCrimeIndicatorEntry,
  StatePopulationEntry,
  IndicatorCatalogMetadata,
  OfficialIndicatorFilters,
  OfficialSummaryStats,
  MetricDisplayMode,
} from '../types/crime';

export interface CrimeRecord extends BaseCrimeRecord {
  isSimulated?: boolean;
}

export type {
  CityMetadata, StateCrimeIndicatorEntry,
  StatePopulationEntry,
  IndicatorCatalogMetadata,
  OfficialIndicatorFilters,
  OfficialSummaryStats,
  MetricDisplayMode,
};

const OFFICIAL_STATE_INDICATORS = rawStateIndicators as StateCrimeIndicatorEntry[];
const OFFICIAL_STATE_POPULATIONS = rawStatePopulation as StatePopulationEntry[];

export interface CrimeFilters {
  state?: string;
  city?: string;
  neighborhood?: string;
  period?: string;
  crimeType?: string;
  searchQuery?: string;
}

export interface StateMetadata {
  uf: string;
  name: string;
  coords: [number, number];
  zoom: number;
}

export interface DataSourceMetadata {
  totalRecords: number;
  totalCities: number;
  totalStates: number;
  uniqueNeighborhoods: number;
  periodLabel: string;
  lastUpdateLabel: string;
  coverageScope: string;
}

export const BRAZIL_STATES: StateMetadata[] = [
  { uf: 'AC', name: 'Acre', coords: [-9.0238, -70.812], zoom: 7 },
  { uf: 'AL', name: 'Alagoas', coords: [-9.5713, -36.782], zoom: 8 },
  { uf: 'AP', name: 'Amapá', coords: [1.4102, -51.77], zoom: 7 },
  { uf: 'AM', name: 'Amazonas', coords: [-3.4168, -65.8561], zoom: 6 },
  { uf: 'BA', name: 'Bahia', coords: [-12.5797, -41.7007], zoom: 7 },
  { uf: 'CE', name: 'Ceará', coords: [-5.4984, -39.3206], zoom: 7 },
  { uf: 'DF', name: 'Distrito Federal', coords: [-15.7998, -47.8645], zoom: 10 },
  { uf: 'ES', name: 'Espírito Santo', coords: [-19.1834, -40.3089], zoom: 8 },
  { uf: 'GO', name: 'Goiás', coords: [-15.827, -49.8362], zoom: 7 },
  { uf: 'MA', name: 'Maranhão', coords: [-4.9609, -45.2744], zoom: 7 },
  { uf: 'MT', name: 'Mato Grosso', coords: [-12.6819, -56.9211], zoom: 6 },
  { uf: 'MS', name: 'Mato Grosso do Sul', coords: [-20.7722, -54.7852], zoom: 7 },
  { uf: 'MG', name: 'Minas Gerais', coords: [-18.5122, -44.555], zoom: 7 },
  { uf: 'PA', name: 'Pará', coords: [-3.4168, -52.2166], zoom: 6 },
  { uf: 'PB', name: 'Paraíba', coords: [-7.24, -36.782], zoom: 8 },
  { uf: 'PR', name: 'Paraná', coords: [-24.8932, -51.55], zoom: 7 },
  { uf: 'PE', name: 'Pernambuco', coords: [-8.8137, -36.9541], zoom: 8 },
  { uf: 'PI', name: 'Piauí', coords: [-7.7183, -42.7289], zoom: 7 },
  { uf: 'RJ', name: 'Rio de Janeiro', coords: [-22.25, -42.66], zoom: 8 },
  { uf: 'RN', name: 'Rio Grande do Norte', coords: [-5.4026, -36.9541], zoom: 8 },
  { uf: 'RS', name: 'Rio Grande do Sul', coords: [-30.0346, -53.2177], zoom: 7 },
  { uf: 'RO', name: 'Rondônia', coords: [-10.83, -63.34], zoom: 7 },
  { uf: 'RR', name: 'Roraima', coords: [2.7376, -62.0751], zoom: 7 },
  { uf: 'SC', name: 'Santa Catarina', coords: [-27.2423, -50.2189], zoom: 8 },
  { uf: 'SP', name: 'São Paulo', coords: [-22.1965, -48.7972], zoom: 7 },
  { uf: 'SE', name: 'Sergipe', coords: [-10.5741, -37.3857], zoom: 9 },
  { uf: 'TO', name: 'Tocantins', coords: [-10.1753, -48.2982], zoom: 7 },
];

const IBGE_API_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const ibgeCitiesCache = new Map<string, CityMetadata[]>();
const simulatedCityCache = new Map<string, CrimeRecord[]>();

const DEMO_NEIGHBORHOODS = [
  'Centro',
  'Jardim América',
  'Bela Vista',
  'Vila Nova',
  'São José',
  'Boa Vista',
  'Santa Cruz',
];

const DEMO_TEMPLATES = [
  { type: 'Furto', desc: '[Simulação] Registro demonstrativo de furto em via comercial.' },
  { type: 'Roubo', desc: '[Simulação] Registro demonstrativo de subtração de aparelho celular.' },
  { type: 'Lesão Corporal', desc: '[Simulação] Registro demonstrativo de ocorrência em área urbana.' },
  { type: 'Furto', desc: '[Simulação] Registro demonstrativo de furto de veículo estacionado.' },
  { type: 'Roubo', desc: '[Simulação] Registro demonstrativo de abordagem a transeunte.' },
  { type: 'Homicídio', desc: '[Simulação] Registro estatístico demonstrativo para visualização.' },
];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function generateSimulatedCityRecords(
  cityName: string,
  stateUf: string,
  baseCoords: [number, number]
): CrimeRecord[] {
  const cacheKey = `${cityName.toLowerCase()}-${stateUf.toUpperCase()}`;
  const cached = simulatedCityCache.get(cacheKey);
  if (cached) return cached;

  const seed = hashString(cacheKey);
  const years = [2021, 2022, 2023, 2024, 2025, 2026];
  const records: CrimeRecord[] = [];

  for (let i = 0; i < 14; i++) {
    const s = hashString(`${cacheKey}-${i}`);
    const template = DEMO_TEMPLATES[(seed + i) % DEMO_TEMPLATES.length];
    const neighborhood = DEMO_NEIGHBORHOODS[(s + i) % DEMO_NEIGHBORHOODS.length];
    const year = years[(s + i) % years.length];
    const month = String((s % 10) + 1).padStart(2, '0');
    const day = String((s % 25) + 1).padStart(2, '0');
    const hour = String(s % 23).padStart(2, '0');
    const minute = String(s % 59).padStart(2, '0');

    const latOffset = (((s % 200) - 100) / 100) * 0.022;
    const lngOffset = ((((s >> 3) % 200) - 100) / 100) * 0.022;

    records.push({
      id: (seed % 900000) * 100 + i + 1,
      type: template.type,
      date: `${year}-${month}-${day}T${hour}:${minute}:00`,
      city: cityName,
      state: stateUf.toUpperCase(),
      neighborhood,
      location: `Área demonstrativa — ${neighborhood}, ${cityName} - ${stateUf.toUpperCase()}`,
      description: template.desc,
      source: 'Base Simulada de Demonstração (Município via API IBGE)',
      coords: [
        Number((baseCoords[0] + latOffset).toFixed(5)),
        Number((baseCoords[1] + lngOffset).toFixed(5)),
      ],
      isSimulated: true,
    });
  }

  simulatedCityCache.set(cacheKey, records);
  return records;
}

function getBaseRecordsWithFlags(): CrimeRecord[] {
  return crimeData.map((r) => ({ ...r, isSimulated: true }));
}

function filterRecordsLocally(records: CrimeRecord[], filters?: CrimeFilters): CrimeRecord[] {
  if (!filters) return records;

  const referenceDate =
    records.length > 0
      ? new Date(Math.max(...records.map((r) => new Date(r.date).getTime())))
      : new Date();

  return records.filter((record) => {
    if (
      filters.state &&
      filters.state !== 'all' &&
      record.state.toLowerCase() !== filters.state.toLowerCase()
    ) {
      return false;
    }
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

    if (filters.period && filters.period !== 'all') {
      const recDate = new Date(record.date);
      if (/^\d{4}$/.test(filters.period)) {
        if (recDate.getFullYear().toString() !== filters.period) return false;
      } else {
        const diffDays =
          (referenceDate.getTime() - recDate.getTime()) / (1000 * 60 * 60 * 24);
        if (filters.period === '30-days' && diffDays > 30) return false;
        if (filters.period === '6-months' && diffDays > 183) return false;
        if (filters.period === '1-year' && diffDays > 365) return false;
        if (filters.period === '5-years' && diffDays > 1826) return false;
      }
    }

    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const matches =
        record.city.toLowerCase().includes(q) ||
        record.neighborhood.toLowerCase().includes(q) ||
        record.type.toLowerCase().includes(q) ||
        (record.description || '').toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });
}

export const crimeService = {
  getStatesMetadata(): StateMetadata[] {
    return [...BRAZIL_STATES];
  },

  getOfficialPopulations(year = 2025): StatePopulationEntry[] {
    return OFFICIAL_STATE_POPULATIONS.filter((item) => item.year === year);
  },

  getOfficialPopulationByUf(uf: string, year = 2025): StatePopulationEntry | null {
    const normalizedUf = uf.trim().toUpperCase();
    return (
      OFFICIAL_STATE_POPULATIONS.find(
        (item) => item.year === year && item.uf === normalizedUf
      ) ?? null
    );
  },

  getOfficialIndicatorsCatalog(): IndicatorCatalogMetadata[] {
    const seen = new Map<string, IndicatorCatalogMetadata>();
    for (const item of OFFICIAL_STATE_INDICATORS) {
      if (!seen.has(item.indicatorId)) {
        seen.set(item.indicatorId, {
          id: item.indicatorId,
          rawEventName: item.rawEventName,
          label: item.label,
          category: item.category,
          unit: item.unit,
          unitLabel: item.unitLabel,
          scope: item.scope,
          granularity: item.granularity,
          comparisonMethod: item.comparisonMethod,
        });
      }
    }
    return Array.from(seen.values());
  },

  getOfficialStateIndicators(
    filters?: OfficialIndicatorFilters
  ): StateCrimeIndicatorEntry[] {
    const targetYear = filters?.year ?? 2025;
    return OFFICIAL_STATE_INDICATORS.filter((entry) => {
      if (entry.year !== targetYear) return false;
      if (
        filters?.state &&
        filters.state !== 'all' &&
        entry.uf !== filters.state.trim().toUpperCase()
      ) {
        return false;
      }
      if (
        filters?.indicatorId &&
        filters.indicatorId !== 'all' &&
        entry.indicatorId !== filters.indicatorId
      ) {
        return false;
      }
      if (
        filters?.category &&
        filters.category !== 'all' &&
        entry.category !== filters.category
      ) {
        return false;
      }
      return true;
    });
  },

  getOfficialIndicatorSummary(
    indicatorId: string,
    stateUf = 'all',
    year = 2025
  ): OfficialSummaryStats {
    const catalog = this.getOfficialIndicatorsCatalog();
    const meta = catalog.find((c) => c.id === indicatorId) ?? null;

    if (!meta) {
      return {
        indicator: null,
        year,
        selectedUf: stateUf,
        totalValue: null,
        population: null,
        ratePer100k: null,
        unit: null,
        unitLabel: '',
        comparisonMethod: null,
        availableStatesCount: 0,
        unavailableStatesCount: 0,
      };
    }

    const rows = this.getOfficialStateIndicators({
      year,
      indicatorId,
      state: stateUf,
    });

    const validRows = rows.filter((r) => r.value !== null);
    const unavailableStatesCount = rows.length - validRows.length;

    const totalValue =
      validRows.length > 0
        ? Number(
            validRows
              .reduce((acc, r) => acc + (r.value as number), 0)
              .toFixed(meta.unit === 'kg' ? 3 : 0)
          )
        : null;

    const validPopulation =
      validRows.length > 0
        ? validRows.reduce((acc, r) => acc + r.population, 0)
        : null;

    let ratePer100k: number | null = null;
    if (
      meta.comparisonMethod === 'population_per_100k' &&
      totalValue !== null &&
      validPopulation !== null &&
      validPopulation > 0
    ) {
      ratePer100k = Number(((totalValue / validPopulation) * 100_000).toFixed(2));
    }

    return {
      indicator: meta,
      year,
      selectedUf: stateUf === 'all' ? 'all' : stateUf.trim().toUpperCase(),
      totalValue,
      population: validPopulation,
      ratePer100k,
      unit: meta.unit,
      unitLabel: meta.unitLabel,
      comparisonMethod: meta.comparisonMethod,
      availableStatesCount: validRows.length,
      unavailableStatesCount,
    };
  },

  getOfficialStateRanking(
    indicatorId: string,
    mode: MetricDisplayMode = 'rate',
    year = 2025
  ): Array<{
    uf: string;
    stateName: string;
    value: number;
    ratePer100k: number | null;
    population: number;
    metricValue: number;
    unitLabel: string;
    effectiveMode: MetricDisplayMode;
  }> {
    const rows = this.getOfficialStateIndicators({ year, indicatorId });
    const first = rows[0];
    if (!first) return [];

    const effectiveMode: MetricDisplayMode =
      first.comparisonMethod === 'population_per_100k' ? mode : 'absolute';

    return rows
      .filter((r) => {
        if (r.value === null) return false;
        if (effectiveMode === 'rate' && r.ratePer100k === null) return false;
        return true;
      })
      .map((r) => ({
        uf: r.uf,
        stateName: r.stateName,
        value: r.value as number,
        ratePer100k: r.ratePer100k,
        population: r.population,
        metricValue:
          effectiveMode === 'rate'
            ? (r.ratePer100k as number)
            : (r.value as number),
        unitLabel:
          effectiveMode === 'rate' ? 'por 100 mil hab.' : r.unitLabel,
        effectiveMode,
      }))
      .sort((a, b) => b.metricValue - a.metricValue);
  },

  async getAllRecords(): Promise<CrimeRecord[]> {
    const base = getBaseRecordsWithFlags();
    const featuredStates: Array<{ uf: string; sampleCount: number }> = [
      { uf: 'SP', sampleCount: 11 },
      { uf: 'RJ', sampleCount: 9 },
      { uf: 'MG', sampleCount: 8 },
      { uf: 'CE', sampleCount: 7 },
      { uf: 'PE', sampleCount: 6 },
      { uf: 'PR', sampleCount: 5 },
      { uf: 'RS', sampleCount: 4 },
      { uf: 'GO', sampleCount: 3 },
      { uf: 'PA', sampleCount: 3 },
      { uf: 'AM', sampleCount: 2 },
    ];
    const nationalSamples = featuredStates.flatMap(({ uf, sampleCount }) => {
      const st = BRAZIL_STATES.find((s) => s.uf === uf);
      if (!st) return [];
      return generateSimulatedCityRecords(`Polo Regional (${st.uf})`, st.uf, st.coords).slice(
        0,
        sampleCount
      );
    });

    return [...base, ...nationalSamples];
  },

  async getFilteredRecords(filters?: CrimeFilters): Promise<CrimeRecord[]> {
    const base = getBaseRecordsWithFlags();

    if (filters?.city && filters.city !== 'all') {
      const existingInBase = base.filter(
        (r) => r.city.toLowerCase() === filters.city!.toLowerCase()
      );
      if (existingInBase.length > 0) {
        return filterRecordsLocally(existingInBase, filters);
      }

      const uf = filters.state && filters.state !== 'all' ? filters.state : 'BR';
      const stateMeta = BRAZIL_STATES.find(
        (s) => s.uf.toLowerCase() === uf.toLowerCase()
      );
      const center = stateMeta ? stateMeta.coords : ([-14.235, -51.9253] as [number, number]);
      const generated = generateSimulatedCityRecords(filters.city, uf, center);
      return filterRecordsLocally(generated, filters);
    }

    if (filters?.state && filters.state !== 'all') {
      const uf = filters.state.toUpperCase();
      const existingInState = base.filter(
        (r) => r.state.toLowerCase() === uf.toLowerCase()
      );
      if (existingInState.length > 0) {
        return filterRecordsLocally(existingInState, filters);
      }

      const stateMeta = BRAZIL_STATES.find((s) => s.uf === uf);
      const stateCities = await this.getCitiesMetadata(uf);

      const topCities = stateCities
        .filter((c) => !existingInState.some((r) => r.city.toLowerCase() === c.name.toLowerCase()))
        .slice(0, 6);

      const generatedAcrossCities = topCities.flatMap((cityItem, idx) => {
        const baseLat = stateMeta ? stateMeta.coords[0] : cityItem.coords[0];
        const baseLng = stateMeta ? stateMeta.coords[1] : cityItem.coords[1];
        const spreadCoords: [number, number] = [
          baseLat + ((idx % 3) - 1) * 0.45,
          baseLng + (Math.floor(idx / 3) - 0.5) * 0.55,
        ];
        const countForCity = Math.max(3, 11 - idx * 2);
        return generateSimulatedCityRecords(cityItem.name, uf, spreadCoords).slice(
          0,
          countForCity
        );
      });

      return filterRecordsLocally([...existingInState, ...generatedAcrossCities], filters);
    }

    const all = await this.getAllRecords();
    return filterRecordsLocally(all, filters);
  },

  async getCitiesMetadata(stateUf?: string): Promise<CityMetadata[]> {
    if (!stateUf || stateUf === 'all') {
      return [...citiesMetadata];
    }

    const uf = stateUf.toUpperCase();
    const cached = ibgeCitiesCache.get(uf);
    if (cached) return cached;

    try {
      const response = await fetch(`${IBGE_API_BASE}/estados/${uf}/municipios?orderBy=nome`);
      if (!response.ok) throw new Error(`IBGE HTTP ${response.status}`);
      const municipios: Array<{ nome: string }> = await response.json();
      const stateMeta = BRAZIL_STATES.find((s) => s.uf === uf);
      const baseCoords: [number, number] = stateMeta ? stateMeta.coords : [-14.235, -51.9253];

      const mapped: CityMetadata[] = municipios.map((m) => {
        const known = citiesMetadata.find(
          (c) => c.name.toLowerCase() === m.nome.toLowerCase() && c.state === uf
        );
        if (known) return known;
        return { name: m.nome, state: uf, coords: baseCoords, zoom: 12 };
      });

      ibgeCitiesCache.set(uf, mapped);
      return mapped;
    } catch {
      return citiesMetadata.filter((c) => c.state === uf);
    }
  },

  async getNeighborhoodsByCity(city: string, stateUf?: string): Promise<string[]> {
    const records = await this.getFilteredRecords({ city, state: stateUf });
    return Array.from(new Set(records.map((r) => r.neighborhood))).sort();
  },

  async getDataSourcesSummary(): Promise<DataSourceMetadata> {
    const [records, cities] = await Promise.all([
      this.getAllRecords(),
      this.getCitiesMetadata(),
    ]);

    const uniqueNeighborhoods = new Set(records.map((r) => r.neighborhood)).size;
    const uniqueStates = new Set(records.map((r) => r.state)).size;
    const sortedDates = records
      .map((r) => new Date(r.date))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    let periodLabel = 'Indisponível na base atual';
    let lastUpdateLabel = 'Indisponível na base atual';

    if (sortedDates.length > 0) {
      const firstYear = sortedDates[0].getFullYear();
      const lastDate = sortedDates[sortedDates.length - 1];
      const lastYear = lastDate.getFullYear();
      periodLabel = firstYear === lastYear ? `${firstYear}` : `${firstYear} – ${lastYear}`;
      lastUpdateLabel = lastDate.toLocaleDateString('pt-BR');
    }

    return {
      totalRecords: records.length,
      totalCities: cities.length,
      totalStates: uniqueStates,
      uniqueNeighborhoods,
      periodLabel,
      lastUpdateLabel,
      coverageScope: 'Nacional (Municípios reais via API IBGE + ocorrências simuladas)',
    };
  },
};
